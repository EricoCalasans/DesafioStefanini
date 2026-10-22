# Spec - `catalogo`

**Versão:** 1.0. **Status:** especificado, não implementado. **Origem:** R03, R15, R16, R31-R34, R42-R44. **Contrato do fornecedor:** [OpenAPI](../contracts/catalogo.openapi.yaml).

## 1. Objetivo e fronteira

Fornecer produtos e preços atuais por uma API REST persistida em MongoDB, consumida por Pedidos. Não conhecer pedidos, clientes ou descontos. Stack proposta: C# 14, ASP.NET Core/.NET 10 LTS, MongoDB 8.0 e driver oficial C# 3.x compatível, fixado no bootstrap.

O preço vigente é o valor atual armazenado e observado na leitura. O núcleo não tem múltiplas tabelas de vigência, agendamento de preços, estoque ou administração pública de produtos. Uma mudança controlada de seed/fixture pode atualizar o produto para demonstrar histórico dos pedidos.

## 2. Modelo do documento

Coleção `products`, banco `catalog`:

| Campo | Tipo lógico / Mongo | Regra |
|---|---|---|
| `_id` / `id` na API | UUID como string canônica minúscula | Identidade estável, índice único nativo `_id` |
| `sku` | string, 1-40 caracteres | Único, maiúsculo no seed; sem caracteres de controle; índice único `sku` |
| `name` | string, 1-120 caracteres | Não vazio após trim, sem controles U+0000-U+001F/U+007F |
| `currency` | string | Sempre `BRL` |
| `priceCents` | inteiro / BSON Int64 | 1 a 100.000.000, nunca ponto flutuante |
| `active` | boolean | Define se pode entrar em novo pedido |
| `priceVersion` | inteiro positivo | Incrementar quando preço mudar |
| `updatedAt` | data UTC / BSON Date | Momento da última alteração controlada |

Validador de coleção versionado deve impedir formato inválido nos dados persistidos. Comprimentos são contados em pontos de código Unicode. Mapear explicitamente o campo C# `Id` para `_id` no adapter, mantendo string UUID sem representação BSON ambígua. Alteração de preço via fixture exige atualização de `priceVersion` e `updatedAt`. A ausência de histórico de preço no catálogo é suprida pelo snapshot dentro de cada pedido.

## 3. Endpoints de consulta

### 3.1 `GET /api/v1/products`

Lista **produtos ativos**, ordenados por `id` ascendente, página iniciando em 1. Query `page` padrão 1, limite 1.000.000; `pageSize` padrão 20, intervalo 1-100. Inteiros decimais válidos; desconhecidos ou inválidos retornam 400, sem conversões silenciosas de valores fracionários. Resposta 200: `{ data: Product[], meta: { page, pageSize, totalItems, totalPages } }`. Fora da última página retorna `data: []`; base vazia tem `totalPages: 0`.

O par busca/contagem pode usar duas operações limitadas, nunca uma por produto. Não há garantia de snapshot entre as duas operações desta listagem se o catálogo for alterado simultaneamente; isso será documentado e não afeta a consulta em lote da criação.

### 3.2 `GET /api/v1/products/{productId}`

UUID canônico inválido → 400; inexistente → 404 `PRODUCT_NOT_FOUND`. Produto existente, inclusive inativo → 200 com `active` e preço atual. Não ocultar inatividade como ausência.

### 3.3 `POST /api/v1/products/query`

Consulta somente de leitura com body `{ "productIds": ["11111111-1111-4111-8111-111111111111"] }`. Usar POST para evitar listas extensas em URL; não cria recursos. De 1 a 100 UUIDs distintos. Forma, limite e UUID inválidos → 400. IDs repetidos → 422 `DUPLICATE_PRODUCT_IDS`.

Retorna 200 com `products`, `missingProductIds` e `observedAt` UTC, capturado ao concluir a leitura. Retornar todos os encontrados, incluindo inativos; IDs ausentes na lista separada. Ordenar `products` e `missingProductIds` por ID para determinismo. Cada ID solicitado deve aparecer exatamente uma vez entre encontrados e ausentes. Pedidos decide se o conjunto é elegível; o Catálogo não converte ausência parcial em erro HTTP. O timestamp documenta a observação do lote, sem prometer snapshot global ou bloqueio de alterações concorrentes no Catálogo.

**Eficiência obrigatória:** construir uma única busca lógica `Find` com `Filter.In(p => p.Id, ids)`; usar índice `_id`; aplicar projeção dos campos do contrato; limitar ao máximo de IDs. Não chamar `Find` dentro de `foreach` ou iniciar uma busca por ID com tarefas paralelas. `getMore`, se ocorrer por configuração de cursor, não é N+1; o teste principal conta uma consulta lógica e inspeciona o filtro.

Exemplo de resposta para os dois produtos da demonstração:

```json
{
  "products": [
    {"id":"11111111-1111-4111-8111-111111111111","sku":"TEC-001","name":"Teclado","currency":"BRL","priceCents":20000,"active":true,"priceVersion":1,"updatedAt":"2026-10-21T12:00:00Z"},
    {"id":"22222222-2222-4222-8222-222222222222","sku":"MOU-001","name":"Mouse","currency":"BRL","priceCents":10000,"active":true,"priceVersion":1,"updatedAt":"2026-10-21T12:00:00Z"}
  ],
  "missingProductIds": [],
  "observedAt": "2026-10-21T13:00:00Z"
}
```

## 4. Persistência, seed e índices

Índices: `_id` único já existente; `sku` único; `{active:1, _id:1}` para listagem. Não criar índices de preço sem consulta que os use. Evidência: plano de execução do lote usando índice, com dataset e versão registrados; evitar afirmar números universais.

Seed mínimo: teclado 20.000 centavos, mouse 10.000, cabo 101, produto inativo 5.000. IDs fixos, SKUs únicos, BRL e versão 1. Aplicar com `upsert` + `setOnInsert`, sem excluir coleção nem sobrescrever valores existentes. Uma fixture de teste separada pode alterar o preço e deve atuar apenas no banco isolado do cenário. Falha por SKU conflitante deve ser explícita; não ignorar exceção de índice.

Criar coleção/validador e índices antes do seed. Runtime usa credencial de leitura; init/seed usa credencial administrativa limitada ao banco. O driver não recebe conexão root na aplicação. Operações assíncronas com `CancellationToken` e timeout de consulta configurado.

## 5. Erros e limites operacionais

Usar o formato comum de [integração](SPEC-integracao.md): 400 para entrada, 404 individual, 413 acima de 64 KiB, 415 para mídia não suportada, 422 para IDs repetidos, 503 para MongoDB indisponível/timeout interno e 500 sanitizado para erro inesperado. No endpoint do fornecedor, timeout de banco é indisponibilidade de serviço (503); o timeout de HTTP observado por Pedidos é mapeado para 504 por Pedidos.

Não executar filtros recebidos diretamente do cliente. Validar somente strings/arrays previstos; objetos no lugar de UUIDs e campos extras são recusados. Logs não incluem connection string nem credenciais. Rotas de consulta não permitem escrita.

## 6. Estrutura e convenções

`Catalog.Domain` contém Produto e valores; `Catalog.Application` contém consultas e porta; `Catalog.Infrastructure` contém MongoDB; `Catalog.Api` contém endpoints, validação, config e Problem Details. Nomes e nullable seguem [arquitetura](../docs/arquitetura.md). Não fazer consultas ao MongoDB em handlers de transporte.

Exemplo de intenção do adaptador (não é código implementado):

```csharp
var filter = Builders<ProductDocument>.Filter.In(p => p.Id, productIds);
var products = await collection.Find(filter).ToListAsync(cancellationToken);
```

## 7. Comandos

Executados dentro do projeto independente de Catálogo:

    Push-Location catalogo-dotnet
    dotnet restore Catalog.sln --locked-mode
    dotnet build Catalog.sln --configuration Release --no-restore
    dotnet test Catalog.sln --configuration Release --no-build
    dotnet format Catalog.sln --verify-no-changes --no-restore
    dotnet run --project Catalog.Api
    Pop-Location

O serviço `mongo-bootstrap` em `infra/compose.yaml` é inicialização compartilhada, não endpoint público. O projeto guarda sua solução e configuração; o escopo funcional do Catálogo ainda precisa ser completado e validado antes da entrega.

## 8. Critérios de sucesso e testes

- CAT01: listagem ativa, paginação, ordenação, vazio e consulta individual com 404/400 corretos.
- CAT02: lote com 1, 2 e 100 IDs executa um `Find` lógico e classifica corretamente ausentes/inativos.
- CAT03: recusar forma inválida, duplicados, 101 IDs, operador NoSQL e produto com dados inválidos.
- CAT04: seed repetido não duplica nem sobrescreve alteração; índices/validador existem num MongoDB real.
- CAT05: cancelamento/timeout não deixa chamada pendurada; falha de banco tem erro sanitizado.
- CAT06: consumidor recebe campos/tipos exatos, moeda BRL, inteiro positivo e timestamps UTC.

Unitários testam classificação, validação e ordenação. Integração usa MongoDB real e inspeção de comando. Contrato valida respostas contra OpenAPI. A execução desses testes ocorrerá durante a implementação.

## 9. Limites de mudança

Sempre preservar compatibilidade e índices necessários. Reespecificar antes de introduzir múltiplas moedas, vigência futura, escrita pública ou estoque. Nunca usar catálogo em memória como evidência da persistência NoSQL final nem acessar PostgreSQL a partir deste serviço.
