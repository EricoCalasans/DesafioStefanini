# Resultados por caso

Fonte: [execucao.json](execucao.json). Datas UTC; ambiente `desafio-qa-20261022`. As falhas anteriores continuam no histórico após um reteste aprovado.

Planejados: 47; executados com tentativa: 47; PASSOU: 45; FALHOU: 0; BLOQUEADO: 1; NÃO EXECUTADO: 1.

## ENV01 — Toolchains e versões fixadas

**Estado final:** PASSOU. **Esperado:** Node 24.22.1 e SDK 10.0.402; Docker Engine e Compose acessíveis.

### Tentativa 1: PASSOU

2026-10-22T23:47:25.853Z a 2026-10-22T23:47:27.268Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `node --version`: exit 0, 47 ms. [Log](evidencias/ENV01-1.txt).
- `pwsh -NoProfile -Command npm --version`: exit 0, 782 ms. [Log](evidencias/ENV01-2.txt).
- `dotnet --version`: exit 0, 142 ms. [Log](evidencias/ENV01-3.txt).
- `docker version --format {{.Client.Version}} {{.Server.Version}}`: exit 0, 198 ms. [Log](evidencias/ENV01-4.txt).
- `docker compose version`: exit 0, 196 ms. [Log](evidencias/ENV01-5.txt).
- `python --version`: exit 0, 44 ms. [Log](evidencias/ENV01-6.txt).

## ENV02 — Builds e configuração estrita de startup

**Estado final:** PASSOU. **Esperado:** Builds aprovados; variáveis inválidas/ausentes recusadas sem valores sensíveis.

### Tentativa 1: PASSOU

2026-10-22T23:47:27.269Z a 2026-10-22T23:47:44.541Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npm run build`: exit 0, 2472 ms. [Log](evidencias/ENV02-1.txt).
- `dotnet restore Catalog.sln --locked-mode`: exit 0, 2294 ms. [Log](evidencias/ENV02-2.txt).
- `dotnet build Catalog.sln -c Release --no-restore`: exit 0, 7017 ms. [Log](evidencias/ENV02-3.txt).
- `pwsh -NoProfile -Command npx vitest run test/configuration.spec.ts`: exit 0, 2508 ms. [Log](evidencias/ENV02-4.txt).
- `dotnet test Catalog.sln -c Release --no-build --filter FullyQualifiedName~InfrastructureConfigurationTests`: exit 0, 2975 ms. [Log](evidencias/ENV02-5.txt).

## ENV03 — Publicação local de QA a partir de volumes vazios

**Estado final:** PASSOU. **Esperado:** Seed/migration terminam; APIs disponíveis em loopback; composição anterior preservada.

### Tentativa 1: PASSOU

2026-10-22T23:47:44.541Z a 2026-10-22T23:48:48.817Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml config --quiet`: exit 0, 408 ms. [Log](evidencias/ENV03-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml up -d --build --wait`: exit 0, 62989 ms. [Log](evidencias/ENV03-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml ps --all`: exit 0, 429 ms. [Log](evidencias/ENV03-3.txt).

## ENV04 — Liveness, readiness e correlação básica

**Estado final:** PASSOU. **Esperado:** 200 UP; UUID gerado, preservado ou substituído; checks postgres/mongo.

### Tentativa 1: PASSOU

2026-10-22T23:48:48.818Z a 2026-10-22T23:48:48.854Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | GET /health/live | 200/200 | 7 |
| orders | GET /health/ready | 200/200 | 5 |
| orders | GET /health/live | 200/200 | 2 |
| orders | GET /health/live | 200/200 | 1 |
| catalog | GET /health/live | 200/200 | 9 |
| catalog | GET /health/ready | 200/200 | 7 |
| catalog | GET /health/live | 200/200 | 2 |
| catalog | GET /health/live | 200/200 | 2 |


## CAT01 — Lista ativa, ordenação, páginas e vazio

**Estado final:** PASSOU. **Esperado:** Somente três ativos em ordem de ID; metadados corretos; página além do fim vazia.

### Tentativa 1: PASSOU

2026-10-22T23:49:03.986Z a 2026-10-22T23:49:04.152Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products | 200/200 | 141 |
| catalog | GET /api/v1/products?page=1&pageSize=1 | 200/200 | 14 |
| catalog | GET /api/v1/products?page=2&pageSize=1 | 200/200 | 5 |
| catalog | GET /api/v1/products?page=1000000&pageSize=100 | 200/200 | 4 |


## CAT02 — Paginação inválida e sem conversão silenciosa

**Estado final:** PASSOU. **Esperado:** Todas as variações retornam 400 VALIDATION_ERROR.

### Tentativa 1: PASSOU

2026-10-22T23:49:04.153Z a 2026-10-22T23:49:04.180Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products?page=0 | 400/400 | 11 |
| catalog | GET /api/v1/products?page=-1 | 400/400 | 2 |
| catalog | GET /api/v1/products?page=1.5 | 400/400 | 2 |
| catalog | GET /api/v1/products?page=abc | 400/400 | 2 |
| catalog | GET /api/v1/products?page=1000001 | 400/400 | 2 |
| catalog | GET /api/v1/products?pageSize=0 | 400/400 | 2 |
| catalog | GET /api/v1/products?pageSize=101 | 400/400 | 1 |
| catalog | GET /api/v1/products?other=true | 400/400 | 1 |
| catalog | GET /api/v1/products?page=1&page=2 | 400/400 | 2 |
| catalog | GET /api/v1/products?page[x]=1 | 400/400 | 1 |


## CAT03 — Detalhe ativo, inativo, ausente e ID inválido

**Estado final:** PASSOU. **Esperado:** 200 nos existentes, active=false no inativo; 404 PRODUCT_NOT_FOUND; 400 VALIDATION_ERROR.

### Tentativa 1: PASSOU

2026-10-22T23:49:04.181Z a 2026-10-22T23:49:04.252Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products/11111111-1111-4111-8111-111111111111 | 200/200 | 55 |
| catalog | GET /api/v1/products/44444444-4444-4444-8444-444444444444 | 200/200 | 5 |
| catalog | GET /api/v1/products/99999999-9999-4999-8999-999999999999 | 404/404 | 9 |
| catalog | GET /api/v1/products/not-a-uuid | 400/400 | 1 |


## CAT04 — UUID canônico sem sufixo de controle

**Estado final:** PASSOU. **Esperado:** 400 para todo ID não canônico; não consultar nem classificar como ausência.

### Tentativa 1: FALHOU

2026-10-22T23:49:04.252Z a 2026-10-22T23:49:04.258Z. Ambiente: desafio-qa-20261022.

**Observado:** catalog /api/v1/products/11111111-1111-4111-8111-111111111111%0A: esperado 400, recebido 404: {"type":"about:blank","title":"Produto n\u00E3o encontrado","status":404,"detail":"N\u00E3o existe produto com o identificador informado.","instance":"/api/v1/products/11111111-1111-4111-8111-111111111111\n","code":"PRODUCT_NOT_FOUND","traceId":"53b62cdd-659c-4d40-98ce-dd79e3eb3c3a"}  404 !== 400

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products/11111111-1111-4111-8111-111111111111%0A | 400/404 | 5 |


### Tentativa 2: PASSOU

2026-10-22T23:51:13.683Z a 2026-10-22T23:51:13.958Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products/11111111-1111-4111-8111-111111111111%0A | 400/400 | 240 |
| catalog | POST /api/v1/products/query | 400/400 | 28 |
| catalog | GET /api/v1/products/AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA | 400/400 | 4 |


## CAT05 — Estado vazio sem produtos ativos

**Estado final:** PASSOU. **Esperado:** Lista vazia com totalItems=0/totalPages=0; detalhe continua 200 active=false.

### Tentativa 1: PASSOU

2026-10-22T23:51:14.099Z a 2026-10-22T23:51:15.554Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /api/v1/products | 200/200 | 181 |
| catalog | GET /api/v1/products/11111111-1111-4111-8111-111111111111 | 200/200 | 52 |

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 610 ms. [Log](evidencias/CAT05-t1-1.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 608 ms. [Log](evidencias/CAT05-t1-4.txt).

## BAT01 — Lote misto, inatividade e ordem determinística

**Estado final:** PASSOU. **Esperado:** 200; produtos encontrados ordenados, inativo explícito, ausente separado, observedAt UTC.

### Tentativa 1: PASSOU

2026-10-22T23:51:15.667Z a 2026-10-22T23:51:15.712Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 200/200 | 43 |


## BAT02 — Lotes de 1 e 100 IDs; limite de 101

**Estado final:** PASSOU. **Esperado:** 200, cobertura exata dos 100 IDs; 400 com 101.

### Tentativa 1: PASSOU

2026-10-22T23:51:15.713Z a 2026-10-22T23:51:15.733Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 200/200 | 5 |
| catalog | POST /api/v1/products/query | 200/200 | 10 |
| catalog | POST /api/v1/products/query | 400/400 | 3 |


## BAT03 — Forma, obrigatórios, duplicados e tentativa NoSQL

**Estado final:** PASSOU. **Esperado:** 400 para estrutura inválida; 422 DUPLICATE_PRODUCT_IDS para duplicação.

### Tentativa 1: PASSOU

2026-10-22T23:51:15.733Z a 2026-10-22T23:51:15.765Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 400/400 | 13 |
| catalog | POST /api/v1/products/query | 400/400 | 4 |
| catalog | POST /api/v1/products/query | 400/400 | 2 |
| catalog | POST /api/v1/products/query | 400/400 | 3 |
| catalog | POST /api/v1/products/query | 400/400 | 2 |
| catalog | POST /api/v1/products/query | 400/400 | 3 |
| catalog | POST /api/v1/products/query | 400/400 | 2 |
| catalog | POST /api/v1/products/query | 422/422 | 2 |


## BAT04 — JSON, mídia e limite do corpo

**Estado final:** PASSOU. **Esperado:** 400 INVALID_JSON, 415 UNSUPPORTED_MEDIA_TYPE, 413 PAYLOAD_TOO_LARGE nas variantes roteáveis.

### Tentativa 1: FALHOU

2026-10-22T23:51:15.766Z a 2026-10-22T23:51:15.774Z. Ambiente: desafio-qa-20261022.

**Observado:** The "string" argument must be of type string. Received type object (null)

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 400/400 | 4 |
| catalog | POST /api/v1/products/query | 415/415 | 2 |
| catalog | POST /api/v1/products/query/ | 415/415 | 1 |


### Tentativa 2: PASSOU

2026-10-22T23:52:59.145Z a 2026-10-22T23:52:59.207Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 400/400 | 49 |
| catalog | POST /api/v1/products/query | 415/415 | 6 |
| catalog | POST /api/v1/products/query/ | 415/415 | 3 |
| catalog | POST /api/v1/products/query | 413/413 | 2 |


## MON01 — Limiar inclusivo e arredondamento único HALF_UP

**Estado final:** PASSOU. **Esperado:** 0/5000/5000, 5, 11 centavos; soma independe de ordem.

### Tentativa 1: PASSOU

2026-10-22T23:52:59.364Z a 2026-10-22T23:52:59.368Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.


Evidência: `{"oracle":"49999→0;50000→5000;50001→5000;101*5%=5;105*10%=11","result":"assertions passed"}`

## MON02 — Desativação, taxa zero/100%, limites e precisão

**Estado final:** PASSOU. **Esperado:** Sem total negativo nem perda de precisão; entradas fora do domínio recusadas.

### Tentativa 1: PASSOU

2026-10-22T23:52:59.370Z a 2026-10-22T23:53:01.596Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npx vitest run test/money.spec.ts`: exit 0, 2225 ms. [Log](evidencias/MON02-t1-1.txt).

Evidência: `{"maxSubtotal":"1000000000000","rate9999Discount":"999900000000","result":"assertions passed"}`

## MON03 — Orquestração: duplicados, inelegíveis e overflow sem salvar

**Estado final:** PASSOU. **Esperado:** Uma consulta antes de salvar; duplicados não consultam; ausentes/inativos/overflow não persistem.

### Tentativa 1: PASSOU

2026-10-22T23:53:01.597Z a 2026-10-22T23:53:03.756Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npx vitest run test/create-order.spec.ts`: exit 0, 2159 ms. [Log](evidencias/MON03-t1-1.txt).

## ORD01 — Criação canônica, Location e snapshot SQL

**Estado final:** PASSOU. **Esperado:** Subtotal 50000, desconto 5000, total 45000; 2 linhas; snapshot completo e UTC.

### Tentativa 1: FALHOU

2026-10-22T23:53:03.875Z a 2026-10-22T23:53:04.180Z. Ambiente: desafio-qa-20261022.

**Observado:** Expected values to be strictly deep-equal: + actual - expected ... Skipped lines    {     createdAt: '2026-10-22T23:53:04.060Z',     currency: 'BRL',     customer: {       email: 'qa@example.com', ...         productName: 'Teclado', +       productUpdatedAt: '2026-10-21T12:00:00.000Z', -       productUpdatedAt: '2026-10-21T12:00:00+00:00',         quantity: 2,         sku: 'TEC-001',         unitPriceCents: 20000       },       { ...         productName: 'Mouse', +       productUpdatedAt: '2026-10-21T12:00:00.000Z', -       productUpdatedAt: '2026-10-21T12:00:00+00:00',         quantity: 1,         sku: 'MOU-001',         unitPriceCents: 10000       }     ], +   pricingObservedAt: '2026-10-22T23:53:04.045Z', -   pricingObservedAt: '2026-10-22T23:53:04.0455035+00:00',     status: 'CREATED',     subtotalCents: 50000,     totalCents: 45000   }

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 296 |
| orders | GET /api/v1/orders/5279ac67-1c31-4a3f-afc1-3e2d976f598f | 200/200 | 6 |


### Tentativa 2: PASSOU

2026-10-22T23:53:25.812Z a 2026-10-22T23:53:25.924Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 87 |
| orders | GET /api/v1/orders/2d66cd87-2efb-4b9b-99a3-489219b427a2 | 200/200 | 6 |


## ORD02 — Correlação atravessa criação até Catálogo

**Estado final:** PASSOU. **Esperado:** O UUID devolvido por Pedidos é o mesmo registrado no Catálogo em todas as variantes.

### Tentativa 1: FALHOU

2026-10-22T23:53:26.078Z a 2026-10-22T23:53:26.345Z. Ambiente: desafio-qa-20261022.

**Observado:** Catálogo não registrou correlação devolvida 6b5549e9-1074-4eeb-ac0a-1a4a97a37601

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 77 |

- `docker logs --since 2m desafio-qa-20261022-catalog-1`: exit 0, 187 ms. [Log](evidencias/ORD02-t1-2.txt).

### Tentativa 2: PASSOU

2026-10-22T23:54:53.233Z a 2026-10-22T23:54:54.220Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 105 |
| orders | POST /api/v1/orders | 201/201 | 53 |
| orders | POST /api/v1/orders | 201/201 | 50 |
| orders | POST /api/v1/orders | 201/201 | 48 |

- `docker logs --since 2m desafio-qa-20261022-catalog-1`: exit 0, 174 ms. [Log](evidencias/ORD02-t2-2.txt).
- `docker logs --since 2m desafio-qa-20261022-catalog-1`: exit 0, 182 ms. [Log](evidencias/ORD02-t2-4.txt).
- `docker logs --since 2m desafio-qa-20261022-catalog-1`: exit 0, 174 ms. [Log](evidencias/ORD02-t2-6.txt).
- `docker logs --since 2m desafio-qa-20261022-catalog-1`: exit 0, 170 ms. [Log](evidencias/ORD02-t2-8.txt).

## ORD03 — Cliente obrigatório, trim, Unicode e e-mail ASCII

**Estado final:** PASSOU. **Esperado:** 400 e contagem SQL inalterada nas rejeições; texto válido normalizado e persistido.

### Tentativa 1: PASSOU

2026-10-22T23:54:54.338Z a 2026-10-22T23:54:54.474Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 400/400 | 32 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 201/201 | 47 |


Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

Evidência: `{"sql":"count(orders) antes/depois","before":7,"after":7}`

## ORD04 — Quantidades e cardinalidade sem coerção

**Estado final:** PASSOU. **Esperado:** 400 em estrutura inválida; limites válidos aceitos; nenhum registro nas rejeições.

### Tentativa 1: PASSOU

2026-10-22T23:54:54.476Z a 2026-10-22T23:54:54.606Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 201/201 | 43 |
| orders | POST /api/v1/orders | 201/201 | 39 |
| orders | POST /api/v1/orders | 422/422 | 13 |


Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":8,"after":8}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

## ORD05 — UUIDs, campos fechados, duplicação e inelegibilidade

**Estado final:** PASSOU. **Esperado:** 400 nos inválidos/extras; 422 duplicados/inelegíveis e erros de ambos os itens; zero inserts.

### Tentativa 1: PASSOU

2026-10-22T23:54:54.608Z a 2026-10-22T23:54:54.643Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 1 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 400/400 | 2 |
| orders | POST /api/v1/orders | 422/422 | 2 |
| orders | POST /api/v1/orders | 422/422 | 6 |


Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

## ORD06 — Parser HTTP, mídia e aliases de rota

**Estado final:** PASSOU. **Esperado:** 400 INVALID_JSON, 413 PAYLOAD_TOO_LARGE e 415 UNSUPPORTED_MEDIA_TYPE com Problem e correlação.

### Tentativa 1: FALHOU

2026-10-22T23:54:54.645Z a 2026-10-22T23:54:54.656Z. Ambiente: desafio-qa-20261022.

**Observado:** orders /api/v1/orders/: esperado 415, recebido 400: {"type":"about:blank","title":"Requisição inválida","status":400,"detail":"Um ou mais campos da requisição são inválidos.","instance":"/api/v1/orders/","code":"VALIDATION_ERROR","traceId":"1b137b9d-f750-434c-80cb-21088bb9466c","errors":[{"field":"customer","code":"INVALID_FIELD","message":"O valor informado é inválido."},{"field":"items","code":"INVALID_FIELD","message":"O valor informado é inválido."},{"field":"items","code":"INVALID_FIELD","message":"O valor informado é inválido."},{"field":"items","code":"INVALID_FIELD","message":"O valor informado é inválido."}]}  400 !== 415

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 400/400 | 3 |
| orders | POST /api/v1/orders | 413/413 | 2 |
| orders | POST /api/v1/orders | 415/415 | 1 |
| orders | POST /api/v1/orders/ | 415/400 | 1 |


Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

### Tentativa 2: PASSOU

2026-10-22T23:56:53.645Z a 2026-10-22T23:56:53.713Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 400/400 | 38 |
| orders | POST /api/v1/orders | 413/413 | 3 |
| orders | POST /api/v1/orders | 415/415 | 3 |
| orders | POST /api/v1/orders/ | 415/415 | 2 |
| orders | POST /API/v1/orders | 415/415 | 2 |


Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

Evidência: `{"sql":"count(orders) antes/depois","before":10,"after":10}`

## ORD07 — SQL-like como texto e repetição explícita de POST

**Estado final:** PASSOU. **Esperado:** Texto literal, tabelas intactas; POST não idempotente cria IDs distintos, conforme contrato.

### Tentativa 1: PASSOU

2026-10-22T23:56:53.855Z a 2026-10-22T23:56:54.000Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 93 |
| orders | POST /api/v1/orders | 201/201 | 43 |
| orders | GET /api/v1/orders/4d081666-33a5-4cfe-9efb-8f588dc23dde | 200/200 | 7 |


## GET01 — ID existente, ausente, malformado e controle final

**Estado final:** PASSOU. **Esperado:** Snapshot exato; 404 ORDER_NOT_FOUND; 400 para UUID inválido.

### Tentativa 1: PASSOU

2026-10-22T23:56:54.153Z a 2026-10-22T23:56:54.280Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 109 |
| orders | GET /api/v1/orders/4dae3ba8-e6f8-492a-9e18-fc9f221c0d98 | 200/200 | 5 |
| orders | GET /api/v1/orders/b6271514-f01f-43cf-aa49-acb5c054a7bb | 404/404 | 3 |
| orders | GET /api/v1/orders/not-uuid | 400/400 | 2 |
| orders | GET /api/v1/orders/4dae3ba8-e6f8-492a-9e18-fc9f221c0d98%0A | 400/400 | 5 |


## GET02 — Página padrão, limites, inválidos e página vazia

**Estado final:** PASSOU. **Esperado:** Metadados coerentes, itemCount=linhas; 400 em parâmetros inválidos.

### Tentativa 1: PASSOU

2026-10-22T23:56:54.284Z a 2026-10-22T23:56:54.310Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | GET /api/v1/orders | 200/200 | 10 |
| orders | GET /api/v1/orders?page=1000000&pageSize=100 | 200/200 | 4 |
| orders | GET /api/v1/orders?page=0 | 400/400 | 2 |
| orders | GET /api/v1/orders?page=-1 | 400/400 | 1 |
| orders | GET /api/v1/orders?page=1.5 | 400/400 | 2 |
| orders | GET /api/v1/orders?page=01 | 400/400 | 2 |
| orders | GET /api/v1/orders?page=1000001 | 400/400 | 1 |
| orders | GET /api/v1/orders?pageSize=101 | 400/400 | 1 |
| orders | GET /api/v1/orders?extra=1 | 400/400 | 1 |
| orders | GET /api/v1/orders?page=1&page=2 | 400/400 | 1 |
| orders | GET /api/v1/orders?page[x]=1 | 400/400 | 1 |


## GET03 — Alteração real de preço e snapshot histórico

**Estado final:** PASSOU. **Esperado:** Antigo mantém preço 20000/versão1; novo usa 30000/versão2; UTC e totais coerentes.

### Tentativa 1: FALHOU

2026-10-22T23:56:54.313Z a 2026-10-22T23:56:55.527Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin TypeError: assert.eq is not a function   1 !== 0

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 38 |

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 1, 583 ms. [Log](evidencias/GET03-t1-2.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 563 ms. [Log](evidencias/GET03-t1-3.txt).

### Tentativa 2: PASSOU

2026-10-22T23:57:21.191Z a 2026-10-22T23:57:22.506Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 87 |
| orders | POST /api/v1/orders | 201/201 | 39 |
| orders | GET /api/v1/orders/95cf222d-8fec-4936-a665-8e88048b8894 | 200/200 | 5 |

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 595 ms. [Log](evidencias/GET03-t2-2.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 586 ms. [Log](evidencias/GET03-t2-5.txt).

## GET04 — Concorrência e autorização atual

**Estado final:** PASSOU. **Esperado:** 5 IDs únicos, agregados completos; API pública conforme security:[]; não há papéis/tenants implementados.

### Tentativa 1: PASSOU

2026-10-22T23:57:22.618Z a 2026-10-22T23:57:22.753Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 76 |
| orders | POST /api/v1/orders | 201/201 | 79 |
| orders | POST /api/v1/orders | 201/201 | 80 |
| orders | POST /api/v1/orders | 201/201 | 81 |
| orders | POST /api/v1/orders | 201/201 | 82 |
| orders | GET /api/v1/orders/1f76badb-5d4f-4756-8409-c5f9efd4b3be | 200/200 | 3 |
| orders | GET /api/v1/orders/59f272c2-7be9-4213-8b29-6653f581d5e1 | 200/200 | 2 |
| orders | GET /api/v1/orders/835094ae-a577-4dd9-8553-e81856d61c23 | 200/200 | 3 |
| orders | GET /api/v1/orders/59d31f6d-2eb9-4b2a-8201-4a26bbbac9c9 | 200/200 | 3 |
| orders | GET /api/v1/orders/9803bcb9-f32f-433b-bbeb-3e2d87bfddc6 | 200/200 | 3 |
| orders | GET /api/v1/orders | 200/200 | 4 |


Evidência: `{"boundary":"security: []; sem identidade/tenant ou exclusão lógica no runtime; não alegar isolamento"}`

## ERR01 — Catálogo parado não impede histórico nem readiness SQL

**Estado final:** PASSOU. **Esperado:** Sem insert: recusa de conexão gera 503 CATALOG_UNAVAILABLE; rede que excede 2s gera 504 CATALOG_TIMEOUT. GET/lista/live/ready de Pedidos continuam 200; recuperação.

### Tentativa 1: FALHOU

2026-10-22T23:58:13.344Z a 2026-10-22T23:58:22.724Z. Ambiente: desafio-qa-20261022.

**Observado:** orders /api/v1/orders: esperado 503, recebido 504: {"type":"about:blank","title":"Tempo limite do Catálogo","status":504,"detail":"A consulta ao Catálogo excedeu o tempo permitido.","instance":"/api/v1/orders","code":"CATALOG_TIMEOUT","traceId":"d5203bf4-a59a-4f47-8869-7ecb4e73e855"}  504 !== 503

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 92 |
| orders | POST /api/v1/orders | 503/504 | 2005 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop catalog`: exit 0, 1999 ms. [Log](evidencias/ERR01-t1-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start catalog`: exit 0, 4950 ms. [Log](evidencias/ERR01-t1-4.txt).

### Tentativa 2: PASSOU

2026-10-23T00:00:08.952Z a 2026-10-23T00:00:18.485Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 198 |
| orders | POST /api/v1/orders | 503,504/504 | 2005 |
| orders | GET /api/v1/orders/9327f99f-d6a0-41a5-a312-eb4f5acdc82d | 200/200 | 3 |
| orders | GET /api/v1/orders | 200/200 | 6 |
| orders | GET /health/ready | 200/200 | 1 |
| orders | GET /health/live | 200/200 | 2 |
| orders | POST /api/v1/orders | 201/201 | 172 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop catalog`: exit 0, 1783 ms. [Log](evidencias/ERR01-t2-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start catalog`: exit 0, 5019 ms. [Log](evidencias/ERR01-t2-9.txt).

Evidência: `{"sql":"count(orders) antes/depois","before":23,"after":23}`

## ERR02 — Fornecedor inválido, 4xx, 5xx, corpo excessivo e timeout

**Estado final:** PASSOU. **Esperado:** 502/503/504 corretos, resposta sanitizada, apenas uma chamada, cancelamento observado.

### Tentativa 1: PASSOU

2026-10-23T00:00:21.458Z a 2026-10-23T00:00:25.958Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npx vitest run test/catalog-http-client.spec.ts test/create-order.spec.ts`: exit 0, 4498 ms. [Log](evidencias/ERR02-t1-1.txt).

## ERR03 — Mongo indisponível e recuperação

**Estado final:** PASSOU. **Esperado:** Live 200; ready/lista/lote 503 sanitizados; Pedidos 503 sem persistir; serviço recupera.

### Tentativa 1: FALHOU

2026-10-23T00:00:25.961Z a 2026-10-23T00:00:33.657Z. Ambiente: desafio-qa-20261022.

**Observado:** catalog /api/v1/products: esperado 503, recebido 500: {"type":"about:blank","title":"Erro interno","status":500,"detail":"N\u00E3o foi poss\u00EDvel concluir a requisi\u00E7\u00E3o.","instance":"/api/v1/products","code":"INTERNAL_ERROR","traceId":"a66dc534-477b-416c-80ca-b8ebaf26e326"}

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /health/live | 200/200 | 40 |
| catalog | GET /health/ready | 503/503 | 1020 |
| catalog | GET /api/v1/products | 503/500 | 1032 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop mongo`: exit 0, 2652 ms. [Log](evidencias/ERR03-t1-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start mongo`: exit 0, 1546 ms. [Log](evidencias/ERR03-t1-5.txt).

### Tentativa 2: PASSOU

2026-10-23T00:03:14.351Z a 2026-10-23T00:03:26.915Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | GET /health/live | 200/200 | 44 |
| catalog | GET /health/ready | 503/503 | 1017 |
| catalog | GET /api/v1/products | 503/503 | 1080 |
| catalog | POST /api/v1/products/query | 503/503 | 1057 |
| orders | POST /api/v1/orders | 503/503 | 1013 |
| orders | POST /api/v1/orders | 201/201 | 84 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop mongo`: exit 0, 3764 ms. [Log](evidencias/ERR03-t2-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start mongo`: exit 0, 1842 ms. [Log](evidencias/ERR03-t2-8.txt).

Evidência: `{"sql":"count(orders) antes/depois","before":24,"after":24}`

## ERR04 — PostgreSQL indisponível e recuperação do processo

**Estado final:** PASSOU. **Esperado:** Live 200; ready DOWN; GET/lista/POST 503 PERSISTENCE_UNAVAILABLE; sem queda do processo; recuperação.

### Tentativa 1: FALHOU

2026-10-23T00:03:27.052Z a 2026-10-23T00:03:35.219Z. Ambiente: desafio-qa-20261022.

**Observado:** fetch failed

- `docker inspect desafio-qa-20261022-orders-1 --format {{.RestartCount}}`: exit 0, 186 ms. [Log](evidencias/ERR04-t1-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop postgres`: exit 0, 5398 ms. [Log](evidencias/ERR04-t1-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start postgres`: exit 0, 1900 ms. [Log](evidencias/ERR04-t1-3.txt).

### Tentativa 2: FALHOU

2026-10-23T01:00:27.281Z a 2026-10-23T01:00:37.775Z. Ambiente: desafio-qa-20261022.

**Observado:** orders /api/v1/orders: esperado 503, recebido 504: {"type":"about:blank","title":"Tempo limite do Catálogo","status":504,"detail":"A consulta ao Catálogo excedeu o tempo permitido.","instance":"/api/v1/orders","code":"CATALOG_TIMEOUT","traceId":"a75f30bb-2426-479a-bae0-b1a1185cb570"}

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | GET /health/live | 200/200 | 51 |
| orders | GET /health/ready | 503/503 | 1013 |
| orders | GET /api/v1/orders | 503/503 | 1009 |
| orders | GET /api/v1/orders/0a9226d5-5e52-4aa5-ad21-95a37d166557 | 503/503 | 1007 |
| orders | POST /api/v1/orders | 503/504 | 2035 |

- `docker inspect desafio-qa-20261022-orders-1 --format {{.RestartCount}}`: exit 0, 179 ms. [Log](evidencias/ERR04-t2-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop postgres`: exit 0, 2218 ms. [Log](evidencias/ERR04-t2-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start postgres`: exit 0, 1517 ms. [Log](evidencias/ERR04-t2-3.txt).

### Tentativa 3: FALHOU

2026-10-23T01:02:52.242Z a 2026-10-23T01:03:06.094Z. Ambiente: desafio-qa-20261022.

**Observado:** orders /api/v1/orders: esperado 503, recebido 504: {"type":"about:blank","title":"Tempo limite do Catálogo","status":504,"detail":"A consulta ao Catálogo excedeu o tempo permitido.","instance":"/api/v1/orders","code":"CATALOG_TIMEOUT","traceId":"d7350d1d-5125-4f7e-9afc-2239b9018948"}

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 87 |
| orders | GET /health/live | 200/200 | 3 |
| orders | GET /health/ready | 503/503 | 1003 |
| orders | GET /api/v1/orders | 503/503 | 1005 |
| orders | GET /api/v1/orders/cc4124bf-334b-408e-a76d-f39311db1573 | 503/503 | 1005 |
| orders | POST /api/v1/orders | 503/504 | 2006 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml restart orders`: exit 0, 2487 ms. [Log](evidencias/ERR04-t3-1.txt).
- `docker inspect desafio-qa-20261022-orders-1 --format {{.RestartCount}}`: exit 0, 170 ms. [Log](evidencias/ERR04-t3-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop postgres`: exit 0, 2407 ms. [Log](evidencias/ERR04-t3-3.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start postgres`: exit 0, 1394 ms. [Log](evidencias/ERR04-t3-4.txt).

### Tentativa 4: PASSOU

2026-10-23T01:04:23.683Z a 2026-10-23T01:04:34.719Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 201/201 | 96 |
| orders | GET /health/live | 200/200 | 4 |
| orders | GET /api/v1/orders | 503/503 | 1005 |
| orders | GET /health/ready | 503/503 | 1005 |
| orders | GET /api/v1/orders/ee2c625b-56ff-4e5b-9cf4-507bd3813cb1 | 503/503 | 1006 |
| orders | POST /api/v1/orders | 201/201 | 48 |

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml restart orders`: exit 0, 2392 ms. [Log](evidencias/ERR04-t4-1.txt).
- `docker inspect desafio-qa-20261022-orders-1 --format {{.RestartCount}}`: exit 0, 191 ms. [Log](evidencias/ERR04-t4-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml stop postgres`: exit 0, 2408 ms. [Log](evidencias/ERR04-t4-3.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml start postgres`: exit 0, 1475 ms. [Log](evidencias/ERR04-t4-4.txt).
- `docker inspect desafio-qa-20261022-orders-1 --format {{.RestartCount}}`: exit 0, 173 ms. [Log](evidencias/ERR04-t4-5.txt).

## ERR05 — Classificação de erro SQL inesperado e rollback

**Estado final:** PASSOU. **Esperado:** 500 INTERNAL_ERROR para exceção inesperada; transação revertida e conexão reutilizável.

### Tentativa 1: FALHOU

2026-10-23T01:04:37.558Z a 2026-10-23T01:04:37.827Z. Ambiente: desafio-qa-20261022.

**Observado:** orders /api/v1/orders: esperado 500, recebido 503: {"type":"about:blank","title":"Banco indisponível","status":503,"detail":"Não foi possível acessar os pedidos neste momento.","instance":"/api/v1/orders","code":"PERSISTENCE_UNAVAILABLE","traceId":"1ab3b8a2-e1d2-4de8-bdc3-525514f4b652"}

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 500/503 | 45 |


### Tentativa 2: PASSOU

2026-10-23T01:06:55.927Z a 2026-10-23T01:06:56.227Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 500/500 | 67 |
| orders | POST /api/v1/orders | 201/201 | 27 |


Evidência: `{"sql":"count(orders) antes/depois","before":28,"after":28}`

## ERR06 — Lock timeout SQL e liberação de conexão

**Estado final:** PASSOU. **Esperado:** 503 PERSISTENCE_UNAVAILABLE em até 7s; nenhuma linha nova; reteste cria normalmente.

### Tentativa 1: PASSOU

2026-10-23T01:06:58.249Z a 2026-10-23T01:06:59.353Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | POST /api/v1/orders | 503/503 | 1049 |
| orders | POST /api/v1/orders | 201/201 | 34 |


## ERR07 — Queda durante COMMIT: limite e observabilidade

**Estado final:** PASSOU. **Esperado:** Uma chamada 503 PERSISTENCE_UNAVAILABLE; exatamente um pedido e duas linhas já confirmados no banco; processo vivo e log marca resultado ambíguo sem retry.

### Tentativa 1: BLOQUEADO

2026-10-23T01:06:59.357Z a 2026-10-23T01:06:59.357Z. Ambiente: desafio-qa-20261022.

**Observado:** Não existe proxy/failpoint determinístico para desconectar exatamente durante COMMIT. Integridade/rollback e timeout são verificados em ERR05/ERR06/DAT01; entrega exatamente uma vez não é prometida.


Evidência: `{"inspection":"create faz COMMIT sem retry; queda TCP não injetada nesta campanha","hasAmbiguityLog":false}`

### Tentativa 2: FALHOU

2026-10-23T01:10:20.786Z a 2026-10-23T01:10:22.614Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): node docs/qa/scripts/err07-ambiguous-commit.mjs node:internal/modules/run_main:107
     triggerUncaughtException(
     ^

 [TypeError: fetch failed] {
   [cause]: Error: read ECONNRESET
       at TCP.onStreamRead (node:internal/stream_base_commons:221:20) {
     errno: -4077,
     code: 'ECONNRESET',
     syscall: 'read'
   }
 }

 Node.js v24.22.1
   1 !== 0

- `node docs/qa/scripts/err07-ambiguous-commit.mjs`: exit 1, 1826 ms. [Log](evidencias/ERR07-t2-1.txt).

### Tentativa 3: FALHOU

2026-10-23T01:10:57.568Z a 2026-10-23T01:10:59.470Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): node docs/qa/scripts/err07-ambiguous-commit.mjs {"phase":"sending the synthetic order","errorName":"TypeError","commitQueries":1,"commitAcknowledgementsSuppressed":1,"appExited":false,"appEvents":["[Nest] 26100  - 22/10/2026, 22:10:59     LOG [HttpRequest] {\"service\":\"orders\",\"method\":\"GET\",\"path\":\"/health/ready\",\"status\":200,\"durationMs\":19.63,\"correlationId\":\"9f7c0e42-cde1-4ab0-949b-615509f66cbb\"}"]} node:internal/modules/run_main:107
     triggerUncaughtException(
     ^

 [TypeError: fetch failed] {
   [cause]: Error: read ECONNRESET
       at TCP.onStreamRead (node:internal/stream_base_commons:221:20) {
     errno: -4077,
     code: 'ECONNRESET',
     syscall: 'read'
   }
 }

 Node.js v24.22.1
   1 !== 0

- `node docs/qa/scripts/err07-ambiguous-commit.mjs`: exit 1, 1897 ms. [Log](evidencias/ERR07-t3-1.txt).

### Tentativa 4: FALHOU

2026-10-23T01:11:28.147Z a 2026-10-23T01:11:30.110Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): node docs/qa/scripts/err07-ambiguous-commit.mjs {"phase":"sending the synthetic order","errorName":"TypeError","commitQueries":1,"commitAcknowledgementsSuppressed":1,"appExited":true,"liveStatus":"unreachable","committedOrderCount":1,"appEvents":["[Nest] 23212  - 22/10/2026, 22:11:29     LOG [HttpRequest] {\"service\":\"orders\",\"method\":\"GET\",\"path\":\"/health/ready\",\"status\":200,\"durationMs\":25.01,\"correlationId\":\"f7fc108c-f51d-4fa6-8d61-02ddfa446e13\"}"]} node:internal/modules/run_main:107
     triggerUncaughtException(
     ^

 [TypeError: fetch failed] {
   [cause]: Error: read ECONNRESET
       at TCP.onStreamRead (node:internal/stream_base_commons:221:20) {
     errno: -4077,
     code: 'ECONNRESET',
     syscall: 'read'
   }
 }

 Node.js v24.22.1
   1 !== 0

- `node docs/qa/scripts/err07-ambiguous-commit.mjs`: exit 1, 1934 ms. [Log](evidencias/ERR07-t4-1.txt).

### Tentativa 5: FALHOU

2026-10-23T01:11:50.016Z a 2026-10-23T01:11:51.952Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): node docs/qa/scripts/err07-ambiguous-commit.mjs {"phase":"sending the synthetic order","errorName":"TypeError","commitQueries":1,"commitAcknowledgementsSuppressed":1,"appExited":true,"appExitCode":1,"appExitSignal":null,"liveStatus":"unreachable","committedOrderCount":1,"appEvents":["[Nest] 31524  - 22/10/2026, 22:11:51     LOG [HttpRequest] {\"service\":\"orders\",\"method\":\"GET\",\"path\":\"/health/ready\",\"status\":200,\"durationMs\":22.9,\"correlationId\":\"9298fd9a-f1c3-49f9-95f9-bedb13aa5885\"}","Error: Connection terminated unexpectedly"]} node:internal/modules/run_main:107
     triggerUncaughtException(
     ^

 [TypeError: fetch failed] {
   [cause]: Error: read ECONNRESET
       at TCP.onStreamRead (node:internal/stream_base_commons:221:20) {
     errno: -4077,
     code: 'ECONNRESET',
     syscall: 'read'
   }
 }

 Node.js v24.22.1
   1 !== 0

- `node docs/qa/scripts/err07-ambiguous-commit.mjs`: exit 1, 1933 ms. [Log](evidencias/ERR07-t5-1.txt).

### Tentativa 6: PASSOU

2026-10-23T01:13:34.288Z a 2026-10-23T01:13:40.039Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `node docs/qa/scripts/err07-ambiguous-commit.mjs`: exit 0, 5745 ms. [Log](evidencias/ERR07-t6-1.txt).

Evidência: `{"result":{"apiStatus":503,"apiCode":"PERSISTENCE_UNAVAILABLE","commitQueries":1,"commitAcknowledgementsSuppressed":1,"committedOrders":1,"committedItems":2,"processLiveStatus":200,"ambiguousLog":"[Nest] 3088  - 22/10/2026, 22:13:36   ERROR [PostgresOrderRepository] Order commit outcome ambiguous retry=false errorType=Error databaseCode=unknown traceId=bfb3abe1-a253-4deb-86be-a4190d2c4f2c","productionTraffic":false}}`

## DAT01 — Integração PostgreSQL: rollback, snapshots, páginas e papéis

**Estado final:** PASSOU. **Esperado:** Testes reais aprovados; runtime sem UPDATE/DELETE/DDL/metadados; empate de data ordenado por ID.

### Tentativa 1: FALHOU

2026-10-23T01:13:43.862Z a 2026-10-23T01:13:51.636Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): pwsh -NoProfile -Command npm run test:integration  > @coe/orders-service@1.0.0 pretest:integration > npm run build && node scripts/run-test-migrations.mjs   > @coe/orders-service@1.0.0 build > tsc -p tsconfig.build.json && node scripts/copy-migrations.mjs  Applied migrations: 1; verified: 0.  > @coe/orders-service@1.0.0 test:integration > vitest run test/integration    RUN  v5.0.5 E:/projeto/Stefanini/desafio/pedidos-typescript  [Nest] 35276  - 22/10/2026, 22:13:50   ERROR [PostgresOrderRepository] Order persistence failed errorType=error databaseCode=P0001 traceId=cccccccc-cccc-4ccc-8ccc-cccccccccccc [Nest] 35276  - 22/10/2026, 22:13:51   ERROR [PostgresOrderRepository] Order persistence failed errorType=error databaseCode=55P03 traceId=cccccccc-cccc-4ccc-8ccc-cccccccccccc  ❯ test/integration/postgres-order.repository.spec.ts (6 tests | 1 failed) 1450ms    ❯ PostgresOrderRepository against isolated PostgreSQL (6)      × rolls back the header when the batched item insert fails in PostgreSQL 69ms  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  test/integration/postgres-order.repository.spec.ts > PostgresOrderRepository against isolated PostgreSQL > rolls back the header when the batched item insert fails in PostgreSQL AssertionError: expected error: orders integration forced item fai… { …(15) } to match object { status: 500, code: 'INTERNAL_ERROR' } (17 matching properties omitted from actual)  - Expected + Received  - { -   "code": "INTERNAL_ERROR", -   "status": 500, + DatabaseError { +   "code": "P0001",   }   ❯ test/integration/postgres-order.repository.spec.ts:209:70     207|       FOR EACH ROW EXECUTE FUNCTION ${FUNCTION_NAME}()`);     208|     209|     await expect(createOrder('cccccccc-cccc-4ccc-8ccc-cccccccccccc')).…        |                                                                      ^     210|       status: 500,     211|       code: 'INTERNAL_ERROR',  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯    Test Files  1 failed (1)       Tests  1 failed | 5 passed (6)    Start at  22:13:49    Duration  2.26s (tests 71%, import 25%, transform 3%)    1 !== 0

- `pwsh -NoProfile -Command npm run test:integration`: exit 1, 7769 ms. [Log](evidencias/DAT01-t1-1.txt).

### Tentativa 2: PASSOU

2026-10-23T01:14:03.416Z a 2026-10-23T01:14:10.339Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npm run test:integration`: exit 0, 6919 ms. [Log](evidencias/DAT01-t2-1.txt).

## DAT02 — Migração repetida e concorrente

**Estado final:** PASSOU. **Esperado:** Ambos verificam migration sem reaplicar; uma versão, checksum inalterado.

### Tentativa 1: PASSOU

2026-10-23T01:14:12.579Z a 2026-10-23T01:14:20.245Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml run --rm --no-deps orders-migrate`: exit 0, 7486 ms. [Log](evidencias/DAT02-t1-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml run --rm --no-deps orders-migrate`: exit 0, 7617 ms. [Log](evidencias/DAT02-t1-2.txt).

## DAT03 — Seed repetido preserva alteração existente

**Estado final:** PASSOU. **Esperado:** Sem duplicação/sobrescrita; índices e validator mantidos.

### Tentativa 1: PASSOU

2026-10-23T01:14:20.249Z a 2026-10-23T01:14:34.836Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 749 ms. [Log](evidencias/DAT03-t1-1.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml run --rm --no-deps mongo-bootstrap`: exit 0, 6104 ms. [Log](evidencias/DAT03-t1-2.txt).
- `docker compose -p desafio-qa-20261022 --env-file E:\projeto\Stefanini\desafio-local\qa-20261022\.env -f E:\projeto\Stefanini\desafio\infra\compose.yaml -f E:\projeto\Stefanini\desafio-local\qa-20261022\compose.qa.yaml run --rm --no-deps mongo-bootstrap`: exit 0, 6045 ms. [Log](evidencias/DAT03-t1-3.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 878 ms. [Log](evidencias/DAT03-t1-4.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 803 ms. [Log](evidencias/DAT03-t1-5.txt).

## DAT04 — Validator e índice único rejeitam dados inválidos

**Estado final:** PASSOU. **Esperado:** Código 121 nos documentos inválidos e 11000 em SKU repetido; nada residual.

### Tentativa 1: PASSOU

2026-10-23T01:14:34.839Z a 2026-10-23T01:14:35.654Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 815 ms. [Log](evidencias/DAT04-t1-1.txt).

## DAT05 — Permissão Mongo somente leitura

**Estado final:** PASSOU. **Esperado:** Acesso recusado código 13; leitura permitida.

### Tentativa 1: PASSOU

2026-10-23T01:14:35.662Z a 2026-10-23T01:14:36.494Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 830 ms. [Log](evidencias/DAT05-t1-1.txt).

## DAT06 — Uma consulta de lote e índices reais

**Estado final:** PASSOU. **Esperado:** Lotes 1/10/100: um find; plano _id_ para lote e ix_products_active_id para página.

### Tentativa 1: PASSOU

2026-10-23T01:14:36.501Z a 2026-10-23T01:14:42.847Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| catalog | POST /api/v1/products/query | 200/200 | 50 |
| catalog | POST /api/v1/products/query | 200/200 | 14 |
| catalog | POST /api/v1/products/query | 200/200 | 20 |

- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 944 ms. [Log](evidencias/DAT06-t1-1.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 830 ms. [Log](evidencias/DAT06-t1-2.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 1066 ms. [Log](evidencias/DAT06-t1-3.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 757 ms. [Log](evidencias/DAT06-t1-4.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 921 ms. [Log](evidencias/DAT06-t1-5.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 916 ms. [Log](evidencias/DAT06-t1-6.txt).
- `docker exec -i desafio-qa-20261022-mongo-1 mongosh --quiet --nodb --file /dev/stdin`: exit 0, 820 ms. [Log](evidencias/DAT06-t1-7.txt).

## GAT01 — Contratos runtime e exemplos OpenAPI

**Estado final:** PASSOU. **Esperado:** Requests/respostas reais aderem aos schemas OpenAPI e códigos comuns.

### Tentativa 1: PASSOU

2026-10-23T01:14:47.096Z a 2026-10-23T01:14:48.870Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `python docs/validation/validar-contratos-runtime.py`: exit 0, 1771 ms. [Log](evidencias/GAT01-t1-1.txt).

### Tentativa 2: PASSOU

2026-10-23T01:16:38.145Z a 2026-10-23T01:16:38.825Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `E:\projeto\Stefanini\desafio-local\qa-20261022\venv-documentacao\Scripts\python.exe docs/validation/validar-contratos-runtime.py`: exit 0, 677 ms. [Log](evidencias/GAT01-t2-1.txt).

## GAT02 — Regressão TypeScript, lint, tipos e build

**Estado final:** PASSOU. **Esperado:** Todas as suítes, tipos, lint e build (pretest) aprovados.

### Tentativa 1: PASSOU

2026-10-23T01:14:48.873Z a 2026-10-23T01:14:59.112Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `pwsh -NoProfile -Command npm run test`: exit 0, 6436 ms. [Log](evidencias/GAT02-t1-1.txt).
- `pwsh -NoProfile -Command npm run typecheck`: exit 0, 2773 ms. [Log](evidencias/GAT02-t1-2.txt).
- `pwsh -NoProfile -Command npm run lint`: exit 0, 1025 ms. [Log](evidencias/GAT02-t1-3.txt).

## GAT03 — Regressão .NET, formatação e build

**Estado final:** PASSOU. **Esperado:** Sem alteração necessária de formato; build e testes aprovados.

### Tentativa 1: PASSOU

2026-10-23T01:14:59.117Z a 2026-10-23T01:15:21.020Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `dotnet format Catalog.sln --verify-no-changes --no-restore`: exit 0, 11669 ms. [Log](evidencias/GAT03-t1-1.txt).
- `dotnet build Catalog.sln -c Release --no-restore`: exit 0, 5238 ms. [Log](evidencias/GAT03-t1-2.txt).
- `dotnet test Catalog.sln -c Release --no-build --no-restore`: exit 0, 4994 ms. [Log](evidencias/GAT03-t1-3.txt).

## GAT04 — Smoke e documentação

**Estado final:** PASSOU. **Esperado:** Smoke e documentação aprovados; operações de API documentadas.

### Tentativa 1: FALHOU

2026-10-23T01:15:21.026Z a 2026-10-23T01:15:21.803Z. Ambiente: desafio-qa-20261022.

**Observado:** Comando falhou (exit 1): python docs/validation/validar-especificacoes.py Traceback (most recent call last):
   File "E:\projeto\Stefanini\desafio\docs\validation\validar-especificacoes.py", line 13, in <module>
     from openapi_spec_validator import validate
 ModuleNotFoundError: No module named 'openapi_spec_validator'
   1 !== 0

- `node infra/smoke-system.mjs`: exit 0, 238 ms. [Log](evidencias/GAT04-t1-1.txt).
- `python docs/validation/validar-especificacoes.py`: exit 1, 515 ms. [Log](evidencias/GAT04-t1-2.txt).

### Tentativa 2: PASSOU

2026-10-23T01:16:40.723Z a 2026-10-23T01:16:43.182Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | GET /docs-json | 200/200 | 35 |
| catalog | GET /swagger/v1/swagger.json | 200/200 | 116 |

- `node infra/smoke-system.mjs`: exit 0, 202 ms. [Log](evidencias/GAT04-t2-1.txt).
- `E:\projeto\Stefanini\desafio-local\qa-20261022\venv-documentacao\Scripts\python.exe docs/validation/validar-especificacoes.py`: exit 0, 2100 ms. [Log](evidencias/GAT04-t2-2.txt).

### Tentativa 3: PASSOU

2026-10-23T01:19:08.221Z a 2026-10-23T01:19:09.718Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

| API | Método e caminho | HTTP esperado/real | ms |
|---|---|---|---|
| orders | GET /docs-json | 200/200 | 36 |
| catalog | GET /swagger/v1/swagger.json | 200/200 | 15 |

- `node infra/smoke-system.mjs`: exit 0, 244 ms. [Log](evidencias/GAT04-t3-1.txt).
- `E:\projeto\Stefanini\desafio-local\qa-20261022\venv-documentacao\Scripts\python.exe docs/validation/validar-especificacoes.py`: exit 0, 1198 ms. [Log](evidencias/GAT04-t3-2.txt).

## GAT05 — Logs sem dados pessoais ou segredos

**Estado final:** PASSOU. **Esperado:** Sem nomes/e-mails de clientes, URLs de conexão, senhas, corpo ou SQL.

### Tentativa 1: PASSOU

2026-10-23T01:16:45.606Z a 2026-10-23T01:16:45.965Z. Ambiente: desafio-qa-20261022.

**Observado:** Asserções e resultados esperados conferidos.

- `docker logs desafio-qa-20261022-orders-1`: exit 0, 182 ms. [Log](evidencias/GAT05-t1-1.txt).
- `docker logs desafio-qa-20261022-catalog-1`: exit 0, 173 ms. [Log](evidencias/GAT05-t1-2.txt).

## GAT06 — CI hospedada, release e publicação externa

**Estado final:** BLOQUEADO. **Esperado:** Sem remoto/credencial/destino definido, registrar bloqueio concreto; nunca publicar produção.

### Tentativa 1: BLOQUEADO

2026-10-23T01:16:45.969Z a 2026-10-23T01:16:46.041Z. Ambiente: desafio-qa-20261022.

**Observado:** git remote não retorna remotos; não há CI hospedada, registry ou destino de QA cloud configurado. Publicação local de QA comprovada em ENV03; produção não recebeu tráfego.

- `git remote`: exit 0, 46 ms. [Log](evidencias/GAT06-t1-1.txt).

Evidência: `{"remoteConfigured":false,"releaseDeployJobs":false}`

## GAT07 — Metas de carga/cobertura e artefatos da candidatura

**Estado final:** NÃO EXECUTADO. **Esperado:** Limites externos e medições não executadas ficam explícitos; não inferir porcentagem ou SLO de testes passados.

### Tentativa 1: NÃO EXECUTADO

2026-10-23T01:16:46.045Z a 2026-10-23T01:16:46.046Z. Ambiente: desafio-qa-20261022.

**Observado:** Meta interna de carga de escrita e metas percentuais de cobertura não têm harness/gate implementado. Link compartilhável de IA, CI hospedada e pacote final da candidatura dependem da entrega externa já aberta em T08/T33/T41-T45; não fazem parte de uma aprovação de runtime local.


Evidência: `{"scope":"Runtime testado por esta campanha; benchmark anterior não reutilizado como nova evidência. Sem suíte de 1000 criações/10 itens ou thresholds de cobertura instalados."}`
