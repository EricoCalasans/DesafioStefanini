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
| Node | 24 LTS; `24.22.1` instalado e >=24.15 para scaffolding Nest 12 | `pedidos-typescript/.node-version`; container de runtime será fixado no build |
| TypeScript / NestJS | 6.0.3 / 12.2.0, ESM | versões exatas em `pedidos-typescript/package-lock.json` |
| `pg` | 8.23.1 | `pedidos-typescript/package-lock.json`; integração real pendente |
| .NET / ASP.NET Core / C# | 10 / 10 / 14 | `catalogo-dotnet/global.json`, target `net10.0`, runtime/digest |
| MongoDB C# Driver | 3.13.0 | NuGet lockfiles; validar com integração real ao MongoDB 8.0 |
| PostgreSQL / MongoDB | `postgres:17.11` / `mongo:8.0.34-noble` | Tags/digests abaixo, sem `latest` |
| Testes | Vitest para TS; xUnit para C# | versões estáveis compatíveis, fixadas em lockfiles |
| OpenAPI | 3.1.0 | campo `openapi` dos contratos e validador compatível |
| Docker Compose | CLI plugin; local `v5.6.0`, `--wait` e `--wait-timeout` disponíveis | `docker compose version`; fixar versão compatível e registrar no README operacional |
| GitHub Actions | runners Linux; actions por SHA | selecionar SHAs oficiais e permissões mínimas na implementação |

Os lockfiles das aplicações foram gerados durante o bootstrap: npm mantém suas dependências em `pedidos-typescript/`, e NuGet mantém `packages.lock.json` nos projetos .NET. Builds e testes de saúde passaram após a reorganização. A compatibilidade funcional com bancos e fluxos completos ainda depende dos testes de integração que serão implementados.

## Ambiente local observado

- Node `v24.22.1` instalado/ativado por nvm e fixado em `pedidos-typescript/.node-version` em 21/10/2026; atende o mínimo consultado para scaffolding Nest 12.
- SDK .NET `10.0.402` instalado e confirmado com `dotnet --list-sdks` e `dotnet --version`; a versão está fixada em `catalogo-dotnet/global.json`.
- Runtime ASP.NET Core/.NET `10.0.13` instalado com o SDK .NET 10.
- Java 21 existe, mas não faz parte da proposta selecionada.
- Docker Desktop `4.96.1` instalado por usuário em `E:\Apps\DockerDesktop`, backend WSL 2; Engine `29.9.2` e Compose `v5.6.0` iniciados e confirmados em 22/10/2026; suporte a `--wait` validado em 21/10.
- Imagens locais `linux/amd64`: `postgres:17.11` (`sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe`) e `mongo:8.0.34-noble` (`sha256:c2d54fddfb3738fb27fe117f51692e3f44e640a3e7aeb8da3937ee9cd33a650b`). Contêineres PostgreSQL e MongoDB foram iniciados em 22/10/2026 e passaram nos healthchecks. Bootstrap do Mongo concluiu schema, índices, usuários e seed.
- Em 22/10, C: tinha `50,44 GB` livres e E: `210,23 GB`; aplicativo e disco WSL estão em E:. O caminho padrão de plugins `.docker\cli-plugins` é uma junção para `E:\DockerConfig\cli-plugins` para evitar cópia dos binários em C:.
- WSL `3.0.3.0`, kernel `6.18.54.1`; a distribuição `docker-desktop` está em execução na versão 2. Não foi instalada uma distribuição Linux de uso geral.
- PDF lido com Python e Poppler fornecidos pelo runtime do Codex, sem dependências de aplicação instaladas.
