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

## Executar e verificar

Execute os comandos neste diretório:

    dotnet restore Catalog.sln --locked-mode
    dotnet build Catalog.sln --configuration Release --no-restore
    dotnet test Catalog.sln --configuration Release
    dotnet format Catalog.sln --verify-no-changes --no-restore
    dotnet run --project Catalog.Api

Para executar a API localmente, configure CATALOG_MONGODB_URI e CATALOG_MONGODB_DATABASE com credenciais locais obtidas fora do repositório. O Compose e a geração de credenciais compartilhados ficam em [infra](../infra/README.md).

## Contratos

A API responde conforme o [OpenAPI do Catálogo](../contracts/catalogo.openapi.yaml). O consumidor de Pedidos usa HTTP; os bancos e modelos internos permanecem separados.
