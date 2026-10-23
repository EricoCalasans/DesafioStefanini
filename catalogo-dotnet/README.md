# API de Catálogo

Projeto C# independente em .NET 10 e ASP.NET Core. A solução, seleção do SDK, referências NuGet e lockfiles ficam nesta pasta.

## Responsabilidade

Consultar produtos e preços vigentes no MongoDB, com consulta individual, listagem e leitura em lote. Os detalhes de comportamento e aceite estão na [spec de Catálogo](../specs/SPEC-catalogo.md) e na [spec de integração](../specs/SPEC-integracao.md).

## Estrutura

- Catalog.Domain: modelo e regras do Catálogo.
- Catalog.Application: casos de uso e portas.
- Catalog.Infrastructure: MongoDB, configuração e adaptadores.
- Catalog.Api: endpoints HTTP, composição e documentação.
- Catalog.Tests.Unit: testes automatizados da API e domínio.
- Catalog.sln e packages.lock.json: solução e dependências NuGet fixadas.
- global.json: SDK .NET escolhido para este projeto.
- Catalog.Api/Catalog.Api.http: exemplos executáveis dos endpoints do Catálogo.

## Executar e verificar

Execute os comandos neste diretório:

    dotnet restore Catalog.sln --locked-mode
    dotnet build Catalog.sln --configuration Release --no-restore
    dotnet test Catalog.sln --configuration Release
    dotnet test Catalog.sln --configuration Release -p:CollectCoverage=true -p:Threshold=95 -p:ThresholdStat=total -p:CoverletOutputFormat=cobertura
    dotnet format Catalog.sln --verify-no-changes --no-restore
    dotnet run --project Catalog.Api

O comando com cobertura falha abaixo de 95% no total combinado de linhas, branches ou métodos e grava `coverage.cobertura.xml` no projeto de testes.

Para executar a API localmente, configure CATALOG_MONGODB_URI e CATALOG_MONGODB_DATABASE com credenciais locais obtidas fora do repositório. O Compose e a geração de credenciais compartilhados ficam em [infra](../infra/README.md).

## Contratos

A API responde conforme o [OpenAPI do Catálogo](../contracts/catalogo.openapi.yaml). O consumidor de Pedidos usa HTTP; os bancos e modelos internos permanecem separados.

## Rotas implementadas

- `GET /api/v1/products`: lista somente produtos ativos, por ID e com paginação estrita.
- `GET /api/v1/products/{productId}`: consulta um produto existente, inclusive inativo.
- `POST /api/v1/products/query`: consulta de 1 a 100 IDs em lote; resposta separa encontrados e ausentes.
- `GET /health/live` e `GET /health/ready`: disponibilidade do processo e dependência MongoDB.
- `GET /docs`: Swagger UI em ambiente de desenvolvimento.

Os erros usam `application/problem+json`, com `X-Correlation-Id` propagado ou gerado. O corpo do lote tem limite de 64 KiB; campos JSON desconhecidos e parâmetros de consulta extras são recusados.
