#!/usr/bin/env bash
set -euo pipefail

: "${ORDERS_TEST_DATABASE_URL:?ORDERS_TEST_DATABASE_URL must point to an isolated orders_test database}"
: "${ORDERS_TEST_MIGRATION_DATABASE_URL:?ORDERS_TEST_MIGRATION_DATABASE_URL must point to orders_test}"

if [[ "$(node -e 'process.stdout.write(new URL(process.env.ORDERS_TEST_DATABASE_URL).pathname)')" != "/orders_test" ]]; then
  echo "Integration tests only run against the orders_test database." >&2
  exit 2
fi
if [[ "$(node -e 'process.stdout.write(new URL(process.env.ORDERS_TEST_MIGRATION_DATABASE_URL).pathname)')" != "/orders_test" ]]; then
  echo "Integration migrations only run against the orders_test database." >&2
  exit 2
fi

npm --prefix pedidos-typescript run test:integration
