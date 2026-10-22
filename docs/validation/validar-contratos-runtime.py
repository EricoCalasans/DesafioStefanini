"""Validate real HTTP responses against the canonical OpenAPI 3.1 schemas."""

import json
import os
import sys
from functools import lru_cache
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote
from urllib.request import Request, urlopen

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "contracts"
ORDERS_URL = os.environ.get("ORDERS_API_URL", "http://127.0.0.1:3000").rstrip("/")
CATALOG_URL = os.environ.get("CATALOG_API_URL", "http://127.0.0.1:8080").rstrip("/")


@lru_cache(maxsize=None)
def load_document(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def resolve(value, source: Path):
    if isinstance(value, list):
        return [resolve(item, source) for item in value]
    if not isinstance(value, dict):
        return value
    if "$ref" not in value:
        return {key: resolve(item, source) for key, item in value.items()}

    reference = value["$ref"]
    file_part, _, fragment = reference.partition("#")
    target_path = (source.parent / unquote(file_part)).resolve() if file_part else source
    target = load_document(target_path)
    for part in fragment.lstrip("/").split("/") if fragment else []:
        target = target[part.replace("~1", "/").replace("~0", "~")]
    expanded = resolve(target, target_path)
    expanded.update(
        {key: resolve(item, source) for key, item in value.items() if key != "$ref"}
    )
    return expanded


def validate_schema(data, schema, source: Path, label: str) -> None:
    expanded = resolve(schema, source)
    Draft202012Validator(expanded, format_checker=FormatChecker()).validate(data)
    print(f"PASS {label}")


def operation_response(document: dict, source: Path, path: str, method: str, status: int):
    operation = document["paths"][path][method.lower()]
    responses = resolve(operation["responses"], source)
    response = responses[str(status)]
    content_type = "application/problem+json" if status >= 400 else "application/json"
    return response["content"][content_type]["schema"]


def operation_request(document: dict, path: str, method: str):
    return document["paths"][path][method.lower()]["requestBody"]["content"]["application/json"]["schema"]


def call(base_url: str, method: str, path: str, expected_status: int, body=None, headers=None):
    request_headers = {"Accept": "application/json, application/problem+json"}
    request_headers.update(headers or {})
    encoded = None
    if body is not None:
        encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    request = Request(
        f"{base_url}{path}",
        data=encoded,
        headers=request_headers,
        method=method.upper(),
    )
    try:
        with urlopen(request, timeout=5) as response:
            status = response.status
            raw = response.read()
            response_headers = response.headers
    except HTTPError as error:
        status = error.code
        raw = error.read()
        response_headers = error.headers
    except (TimeoutError, URLError) as error:
        raise AssertionError(f"{method} {path} could not reach its service: {type(error).__name__}") from error
    if status != expected_status:
        raise AssertionError(f"{method} {path} returned {status}, expected {expected_status}.")
    if response_headers.get_content_type() not in ("application/json", "application/problem+json"):
        raise AssertionError(f"{method} {path} returned an unexpected media type.")
    try:
        return json.loads(raw), response_headers
    except json.JSONDecodeError as error:
        raise AssertionError(f"{method} {path} did not return JSON.") from error


def main() -> int:
    orders_path = CONTRACTS / "pedidos.openapi.yaml"
    catalog_path = CONTRACTS / "catalogo.openapi.yaml"
    orders = load_document(orders_path)
    catalog = load_document(catalog_path)
    correlation_id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    headers = {"X-Correlation-Id": correlation_id}

    catalog_query = {
        "productIds": [
            "11111111-1111-4111-8111-111111111111",
            "22222222-2222-4222-8222-222222222222",
        ]
    }
    validate_schema(
        catalog_query,
        operation_request(catalog, "/api/v1/products/query", "post"),
        catalog_path,
        "Catalog query request",
    )
    catalog_batch, _ = call(CATALOG_URL, "POST", "/api/v1/products/query", 200, catalog_query, headers)
    validate_schema(
        catalog_batch,
        operation_response(catalog, catalog_path, "/api/v1/products/query", "post", 200),
        catalog_path,
        "Catalog batch response",
    )
    catalog_product, _ = call(
        CATALOG_URL,
        "GET",
        "/api/v1/products/11111111-1111-4111-8111-111111111111",
        200,
        headers=headers,
    )
    validate_schema(
        catalog_product,
        operation_response(catalog, catalog_path, "/api/v1/products/{productId}", "get", 200),
        catalog_path,
        "Catalog product response",
    )
    catalog_page, _ = call(CATALOG_URL, "GET", "/api/v1/products?page=1&pageSize=5", 200, headers=headers)
    validate_schema(
        catalog_page,
        operation_response(catalog, catalog_path, "/api/v1/products", "get", 200),
        catalog_path,
        "Catalog page response",
    )

    order_request = {
        "customer": {"name": "Contrato Runtime", "email": "runtime@example.com"},
        "items": [
            {"productId": "11111111-1111-4111-8111-111111111111", "quantity": 2},
            {"productId": "22222222-2222-4222-8222-222222222222", "quantity": 1},
        ],
    }
    validate_schema(
        order_request,
        operation_request(orders, "/api/v1/orders", "post"),
        orders_path,
        "Order create request",
    )
    order, order_headers = call(ORDERS_URL, "POST", "/api/v1/orders", 201, order_request, headers)
    validate_schema(
        order,
        operation_response(orders, orders_path, "/api/v1/orders", "post", 201),
        orders_path,
        "Order create response",
    )
    if order["subtotalCents"] != 50_000 or order["discount"]["amountCents"] != 5_000 or order["totalCents"] != 45_000:
        raise AssertionError("The canonical real order returned unexpected amounts.")
    if order_headers.get("Location") != f"/api/v1/orders/{order['id']}":
        raise AssertionError("The create response Location header is invalid.")

    found, _ = call(ORDERS_URL, "GET", f"/api/v1/orders/{order['id']}", 200, headers=headers)
    validate_schema(
        found,
        operation_response(orders, orders_path, "/api/v1/orders/{orderId}", "get", 200),
        orders_path,
        "Order lookup response",
    )
    page, _ = call(ORDERS_URL, "GET", "/api/v1/orders?page=1&pageSize=5", 200, headers=headers)
    validate_schema(
        page,
        operation_response(orders, orders_path, "/api/v1/orders", "get", 200),
        orders_path,
        "Order page response",
    )

    invalid_request = {**order_request, "items": [{**order_request["items"][0], "unitPrice": 1}]}
    problem, _ = call(ORDERS_URL, "POST", "/api/v1/orders", 400, invalid_request, headers)
    validate_schema(
        problem,
        operation_response(orders, orders_path, "/api/v1/orders", "post", 400),
        orders_path,
        "Validation problem response",
    )
    print("Runtime contract smoke passed for both APIs.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"FAIL Runtime contract smoke: {error}", file=sys.stderr)
        raise SystemExit(1) from error
