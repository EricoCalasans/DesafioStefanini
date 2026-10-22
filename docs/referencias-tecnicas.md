# Referências técnicas e compatibilidade

**Consulta:** 21/10/2026. Fontes primárias usadas para verificar escolhas temporais. As decisões de arquitetura são nossas; as fontes não prescrevem a solução do desafio. Não foram enviados trechos confidenciais do PDF às buscas.

| Tema | Referência oficial | Uso na proposta |
|---|---|---|
| Node.js | [Releases](https://nodejs.org/en/about/previous-releases) | Linha 24 está identificada como LTS; usar um patch mantido dessa linha |
| NestJS | [Migration guide](https://docs.nestjs.com/migration-guide) | Documentação atual de v12, ESM e TypeScript 6; geração na linha Node 24 requer 24.15+ |
| .NET | [Política de suporte](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) | .NET 10 é LTS; usar runtime e SDK da linha 10, com correções mantidas |
| C# | [Anúncio oficial do .NET 10](https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/) | Base para C# 14 na stack .NET 10 |
| PostgreSQL | [Versioning policy](https://www.postgresql.org/support/versioning/) | Selecionar major suportado e manter atualização corretiva; proposta usa 17 |
| SQL parametrizado | [node-postgres queries](https://node-postgres.com/features/queries) | Valores em parâmetros separados do texto SQL; identificadores dinâmicos não entram como valores |
| Busca em lote | [MongoDB `$in`](https://www.mongodb.com/docs/manual/reference/operator/query/in/) | Consulta por conjunto de IDs e necessidade de índice |
| Driver MongoDB | [Compatibility tables](https://www.mongodb.com/docs/drivers/compatibility/) | Conferir versão exata do driver C# com servidor antes de fixar packages |
| Docker Compose | [Releases oficiais](https://github.com/docker/compose/releases) | CLI plugin `docker compose`; esta máquina tem `v5.6.0` e `--wait` foi confirmado |

## Baseline e congelamento no bootstrap

| Componente | Baseline proposto | Como fixar |
|---|---|---|
| Node | 24 LTS; >=24.15 para scaffolding Nest 12 | `.node-version` e imagem com patch/digest |
| TypeScript / NestJS | 6.x / 12.x, ESM | versões exatas em `package-lock.json` e dependências alinhadas |
| `pg` | 8.x, confirmar compatibilidade no bootstrap | `package-lock.json`, integração real |
| .NET / ASP.NET Core / C# | 10 / 10 / 14 | `global.json`, target `net10.0`, runtime/digest |
| MongoDB C# Driver | 3.x, minor a selecionar por compatibilidade | NuGet lock e teste real com MongoDB 8.0 |
| PostgreSQL / MongoDB | 17 / 8.0 | tags corretivas e digests, sem `latest` |
| Testes | Vitest para TS; xUnit para C# | versões estáveis compatíveis, fixadas em lockfiles |
| OpenAPI | 3.1.0 | campo `openapi` dos contratos e validador compatível |
| Docker Compose | CLI plugin; local `v5.6.0`, `--wait` e `--wait-timeout` disponíveis | `docker compose version`; fixar versão compatível e registrar no README operacional |
| GitHub Actions | runners Linux; actions por SHA | selecionar SHAs oficiais e permissões mínimas na implementação |

Não existem lockfiles de aplicação nesta etapa. Especificar um patch sem instalá-lo e testar a combinação não equivaleria a comprovar compatibilidade. O bootstrap deverá registrar os patches escolhidos e atualizar este documento; não usar preview apenas por ser mais recente.

## Ambiente local observado

- Node `v24.22.1` instalado/ativado por nvm e fixado em `.node-version` em 21/10/2026; atende o mínimo consultado para scaffolding Nest 12.
- SDK .NET `10.0.402` instalado e confirmado com `dotnet --list-sdks` e `dotnet --version`; a versão está fixada em `global.json`.
- Java 21 existe, mas não faz parte da proposta selecionada.
- Docker Desktop `4.96.1` instalado por usuário em `E:\Apps\DockerDesktop`, backend WSL 2; Engine `29.9.2`, Compose `v5.6.0`; Engine e suporte a `--wait` passaram em 21/10/2026. O PATH salvo do usuário contém `E:\Apps\DockerDesktop\resources\bin`, mas o processo Codex atual foi iniciado antes da atualização e precisou executar o CLI pelo caminho absoluto.
- C: tinha `0,87 GB` livres e E: `192,16 GB` na conferência; aplicativo e disco WSL estão em E:. O caminho padrão de plugins `.docker\cli-plugins` é uma junção para `E:\DockerConfig\cli-plugins` para evitar cópia dos binários em C:.
- WSL `3.0.3.0`, kernel `6.18.54.1`; a distribuição `docker-desktop` está em execução na versão 2. Não foi instalada uma distribuição Linux de uso geral.
- PDF lido com Python e Poppler fornecidos pelo runtime do Codex, sem dependências de aplicação instaladas.
