# Spec - `pedidos`

**Versão:** 1.0. **Status:** implementado e validado localmente em 22/10/2026. **Origem:** R15-R16, R20-R30, R42-R44. **Contrato:** [OpenAPI](../contracts/pedidos.openapi.yaml).

**Evidência atual:** 27 testes unitários/HTTP passaram; cinco testes de integração passaram contra PostgreSQL real, incluindo papéis restritos, rollback e preservação de snapshots após mudança de preço/regra; o smoke ponta a ponta passou com Pedidos, Catálogo, PostgreSQL e MongoDB em containers. O cenário canônico retornou subtotal de 50.000, desconto de 5.000 e total de 45.000. A validação documental/OpenAPI também passou. Permanecem no backlog o contrato automatizado entre produtor/consumidor, o experimento de N+1/explain, a primeira execução da CI hospedada e os artefatos finais da candidatura; consulte o [backlog](../docs/tasks/todo.md) para o estado exato.

## 1. Objetivo, stack e dependências

Criar, listar e consultar pedidos consistentes e auditáveis. Proposta: TypeScript 6, Node.js 24 LTS, NestJS 12 em ESM, PostgreSQL 17 e `pg` 8.x. O domínio fica independente do framework. Catálogo fornece produtos por [contrato próprio](SPEC-catalogo.md); nenhuma consulta direta ao MongoDB.

Casos de uso: `CreateOrder`, `GetOrder`, `ListOrders`. Interfaces de aplicação isolam persistência transacional, fornecedor, relógio e gerador de UUID. Detalhes de adapter ficam em `src/adapters`; configuração em `src/bootstrap`.

## 2. Entrada de criação

`POST /api/v1/orders`, `Content-Type: application/json`:

```json
{
  "customer": {"name":"Cliente Exemplo","email":"cliente@example.com"},
  "items": [
    {"productId":"11111111-1111-4111-8111-111111111111","quantity":2},
    {"productId":"22222222-2222-4222-8222-222222222222","quantity":1}
  ]
}
```

Regras estruturais: objeto fechado; `customer` obrigatório; nome com trim e 1-120 caracteres, recusando controles U+0000-U+001F/U+007F; e-mail ASCII com trim, formato de e-mail e 3-254 caracteres, preservando caixa; 1-100 itens; ID UUID canônico minúsculo; quantidade inteira 1-10.000. Não converter strings numéricas, `null`, decimais ou booleanos. Validar comprimento após normalização e também limitar corpo a 64 KiB. Comprimentos de texto são contados em pontos de código Unicode, coerentes com JSON Schema. Não prometer validação de existência do endereço de e-mail.

Campo desconhecido em qualquer objeto, inclusive `unitPrice`, `discount`, `total`, `status` ou `customerId`, retorna 400 `VALIDATION_ERROR`. IDs repetidos na mesma criação retornam 422 `DUPLICATE_PRODUCT_IDS`, sem agrupar quantidades silenciosamente. JSON inválido → 400; corpo acima do limite → 413; mídia diferente → 415.

## 3. Produtos e autoridade de preço

Uma chamada em lote com todos os IDs distintos. Validar resposta como dado externo: conjunto completo, nenhum ID não solicitado/duplicado, tipos válidos, moeda BRL, inteiro positivo dentro do limite, versão positiva e timestamps válidos.

- Ausente ou inativo: 422 `PRODUCTS_NOT_ORDERABLE`, com erros por campo/ID; não persistir.
- Resposta inconsistente ou fora de domínio: 502 `CATALOG_INVALID_RESPONSE`.
- Catálogo indisponível: 503 `CATALOG_UNAVAILABLE`; timeout: 504 `CATALOG_TIMEOUT`.

Persistir fotografia de ID, SKU, nome, preço, versão e atualização do produto. Não aceitar substituição automática de produto nem valor desatualizado de cache. Não reservar estoque ou preço.

## 4. Dinheiro, limites e cálculo

Moeda única `BRL`. Inteiros em centavos no JSON; `bigint` no domínio para cálculo; `BIGINT` no PostgreSQL. Valores finais convertidos a `number` apenas após checagem de intervalo. Não alterar o parser global de `pg` para transformar todo `BIGINT` em `number` sem checar limites.

| Limite | Valor |
|---|---|
| Preço unitário | 1 a 100.000.000 centavos |
| Quantidade por produto | 1 a 10.000 |
| Produtos distintos por pedido | 1 a 100 |
| Subtotal máximo aceito | 1.000.000.000.000 centavos |
| Taxa de desconto | 0 a 10.000 pontos-base |

`lineSubtotalCents = unitPriceCents × quantity`. `subtotalCents = soma(lineSubtotalCents)`. Exceder o subtotal máximo retorna 422 `ORDER_AMOUNT_LIMIT_EXCEEDED`, sem gravar. Multiplicações intermediárias da taxa usam `bigint`, pois podem exceder a precisão segura de `number` mesmo com subtotal aceito.

Desconto habilitado e subtotal maior ou igual ao limiar: `discountCents = floor((subtotalCents × rateBps + 5000) / 10000)`. Caso contrário: zero. `totalCents = subtotalCents - discountCents`. Arredondar **uma única vez**, sobre o subtotal total, com meio para cima. A expressão do PDF sobre o valor total é concretizada como valor integral dos itens antes do desconto, evitando uma definição circular do total líquido. `discount.applied` é verdadeiro somente quando o valor arredondado é maior que zero, podendo ser derivado do valor persistido sem recalcular a regra. Total pode ser zero com taxa de 100%. Nunca negativo.

## 5. Configuração do desconto

| Variável | Exemplo de demonstração | Validação |
|---|---|---|
| `DISCOUNT_ENABLED` | `true` | Literal `true` ou `false` |
| `DISCOUNT_RULE_ID` | `volume-v1` | 1-64 caracteres alfanuméricos, `_` ou `-` |
| `DISCOUNT_MIN_SUBTOTAL_CENTS` | `50000` | Inteiro de 0 ao máximo de subtotal |
| `DISCOUNT_RATE_BPS` | `1000` | Inteiro de 0 a 10.000 |

Essas variáveis serão **obrigatórias**, documentadas no `.env.example`; os exemplos não são fallback oculto no código. Parse estrito de inteiros decimais e validação no startup. Configuração inválida impede servir tráfego. Mesmo com desconto desabilitado, validar todos os campos para evitar erro latente.

Carregar uma configuração imutável por processo. Capturar a política no início do caso de uso. Alterar ambiente/reiniciar não muda pedidos existentes. Persistir `ruleId`, `enabled`, `thresholdCents`, `rateBps` e `rounding: HALF_UP`, mesmo se o desconto for zero. O ID da regra não substitui o snapshot completo.

## 6. Modelo relacional e invariantes

Tabela `orders`:

| Campo SQL | Tipo / regra |
|---|---|
| `id` | UUID PK, gerado pela aplicação |
| `customer_name`, `customer_email` | VARCHAR(120), VARCHAR(254), não nulos |
| `currency` | CHAR(3), CHECK `BRL` |
| `status` | VARCHAR(16), CHECK `CREATED` |
| `subtotal_cents` | BIGINT, 1 até o máximo do pedido |
| `discount_amount_cents` | BIGINT, 0 até subtotal |
| `total_cents` | BIGINT, CHECK `subtotal_cents - discount_amount_cents` |
| `discount_enabled`, `discount_rule_id` | BOOLEAN e VARCHAR(64) |
| `discount_threshold_cents`, `discount_rate_bps` | BIGINT e INTEGER com limites da configuração |
| `discount_rounding` | VARCHAR(16), CHECK `HALF_UP` |
| `item_count` | INTEGER 1-100, número de linhas distintas |
| `pricing_observed_at`, `created_at` | TIMESTAMPTZ, UTC na API |

Tabela `order_items`:

| Campo SQL | Tipo / regra |
|---|---|
| `order_id` | UUID FK para `orders`, não nulo |
| `line_number` | INTEGER 1-100; PK composta `(order_id, line_number)` |
| `product_id` | UUID; UNIQUE `(order_id, product_id)` |
| `product_sku`, `product_name` | VARCHAR(40), VARCHAR(120), snapshot |
| `unit_price_cents` | BIGINT, 1-100.000.000 |
| `quantity` | INTEGER, 1-10.000 |
| `line_subtotal_cents` | BIGINT, CHECK `unit_price_cents * quantity` |
| `product_price_version` | INTEGER positivo |
| `product_updated_at` | TIMESTAMPTZ |

Sem FK para produtos/clientes externos. Índice de listagem em `orders(created_at DESC, id DESC)`. O índice da PK de itens atende busca por pedido. Índices redundantes exigem justificativa. Soma de linhas e `item_count` são invariantes do agregado, verificadas no domínio, no repositório e nos testes; não se presume que um CHECK simples entre tabelas as garanta.

Migrações SQL versionadas com executor que registra versão/checksum e impede aplicação concorrente. Papel de migração separado do runtime. Não usar sincronização destrutiva automática. Atualização aditiva e rollback de aplicação preferidos; rollback destrutivo de banco exige plano de recuperação.

## 7. Escrita atômica e SQL seguro

Validar/calcular antes da transação. Obter um client do pool; `BEGIN`; inserir cabeçalho; inserir todos os itens com uma instrução em lote; `COMMIT`; liberar client em `finally`. Qualquer falha interna executa `ROLLBACK` e não deixa cabeçalho sem itens. Não enviar 201 antes de confirmar commit.

SQL fixo com parâmetros separados, inclusive nomes/e-mails, IDs, paginação e arrays da inserção. Proposta para lote: `INSERT ... SELECT ... FROM UNNEST($1::uuid[], ...)`, com arrays construídos pela aplicação e de comprimentos conferidos. Nenhuma coluna/tabela/ordenação é escolhida diretamente pelo cliente.

Exemplo ilustrativo de leitura segura:

```ts
const result = await client.query(
  'SELECT id, total_cents FROM orders WHERE id = $1',
  [orderId],
);
```

Um nome contendo aspas ou texto parecido com SQL é dado normal, não algo que deve ser removido para esconder uma consulta insegura. Testar persistência literal e integridade das tabelas.

Se a conexão cair durante `COMMIT`, o resultado pode ser ambíguo. Responder erro sanitizado, registrar correlação e não fazer retry automático. A transação garante integridade, não entrega exatamente uma vez.

## 8. Saída e endpoints de leitura

### Criação

201, `Location: /api/v1/orders/{id}`. Corpo `Order` completo: `id`, `customer`, `items`, `currency`, `subtotalCents`, `discount` com valor e política, `totalCents`, `status: CREATED`, `pricingObservedAt`, `createdAt`. Itens na ordem da entrada, `lineNumber` iniciando em 1. Não devolver conexão, campos internos ou e-mail nos logs.

### `GET /api/v1/orders/{orderId}`

UUID inválido → 400; inexistente → 404 `ORDER_NOT_FOUND`; existente → 200 com o mesmo modelo de criação. Cabeçalho e itens por consulta SQL com join ou duas consultas fixas. Não fazer consulta por item, não chamar Catálogo, não recalcular valores pela política atual.

### `GET /api/v1/orders?page=1&pageSize=20`

`page` 1-1.000.000; `pageSize` 1-100; valores padrão 1/20; parâmetros extras inválidos → 400. Ordenar `created_at DESC, id DESC`. Retornar `data: OrderSummary[]` e `meta: {page,pageSize,totalItems,totalPages}`. Summary: id, customer, currency, subtotalCents, discountAmountCents, totalCents, status, itemCount e createdAt. `itemCount` é quantidade de linhas, não soma das quantidades.

Contagem e seleção da página em duas consultas parametrizadas dentro de uma transação curta `REPEATABLE READ READ ONLY`, para metadados coerentes na mesma requisição. A página seguinte pode mudar se houver novas inserções; cursor fica fora do núcleo. Nenhuma busca de itens por pedido na listagem. Página vazia retorna 200; totalPages é zero quando não há pedidos.

## 9. Erros e observabilidade

Erros de entrada 400; negócio 422; dependência 502/503/504; banco indisponível 503 `PERSISTENCE_UNAVAILABLE`; erro interno 500 `INTERNAL_ERROR`. Detalhes conforme [integração](SPEC-integracao.md). Uma falha SQL inesperada não deve ser disfarçada de erro do usuário.

Logar correlação, método, rota, status, duração, quantidade de linhas, resultado da dependência e ID do pedido quando criado. Não logar nome/e-mail/corpo inteiro. Métricas mínimas em logs: quantidade/duração de chamadas de lote e resultado de criação, sem cardinalidade por cliente.

## 10. Comandos

Todos os comandos Node são executados dentro do projeto independente de Pedidos; o package.json, o lockfile e as dependências pertencem somente a essa pasta:

    Push-Location pedidos-typescript
    npm ci
    npm run build
    npm run typecheck
    npm run lint
    npm test
    npm run test:integration
    npm run db:migrate
    npm run start:dev
    Pop-Location

`npm run typecheck` valida os tipos com TypeScript 6; `npm run lint` executa Biome, fixado no lockfile local. A troca de typescript-eslint por Biome foi registrada no [ADR-004](../docs/adr/004-qualidade-e-entrega.md) após incompatibilidade confirmada de peer dependency. Os testes de integração exigem bancos isolados e conexão via ambiente, provisionados pelo Compose. Não apontar ao banco da demonstração.

## 11. Critérios de sucesso

- ORD01: criação do exemplo retorna subtotal 50.000, desconto 5.000 e total 45.000, com snapshot completo e 201/Location.
- ORD02: limiar -1, igual e +1; desconto desabilitado; taxa 0/100%; arredondamento e limites são corretos.
- ORD03: novo pedido reflete alteração de configuração sem editar código; pedido antigo mantém os valores.
- ORD04: entrada inválida e produtos não elegíveis não geram linhas no SQL.
- ORD05: erro na inserção de itens reverte cabeçalho e itens num PostgreSQL real.
- ORD06: texto semelhante a SQL é persistido como dado; consultas e paginação são parametrizadas.
- ORD07: leituras corretas, paginação estável dentro da requisição, erro 404 e independência do Catálogo.
- ORD08: resposta inválida do fornecedor, timeout e indisponibilidade têm erros definidos e não gravam pedido.

## 12. Limites e mudanças

Sempre usar regra pura, transação e snapshots. Alterar moeda, limite, regra, status ou adicionar idempotência exige atualizar contrato, testes e spec antes da implementação. Nunca confiar no preço do consumidor nem apagar testes de falha para obter check verde.
