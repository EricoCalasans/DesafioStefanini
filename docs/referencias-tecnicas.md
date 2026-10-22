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
| Docker Compose | v2, com `--wait` suportado | pré-requisito e versão registrados no README operacional |
| GitHub Actions | runners Linux; actions por SHA | selecionar SHAs oficiais e permissões mínimas na implementação |

Não existem lockfiles de aplicação nesta etapa. Especificar um patch sem instalá-lo e testar a combinação não equivaleria a comprovar compatibilidade. O bootstrap deverá registrar os patches escolhidos e atualizar este documento; não usar preview apenas por ser mais recente.

## Ambiente local observado

- Node `v24.13.0`: atende execução da linha escolhida, mas está abaixo do mínimo de scaffolding do Nest 12 consultado. Atualizar antes de gerar projeto por CLI.
- `dotnet.exe` existe; `dotnet --list-sdks` não listou SDKs. Não afirmar que o SDK 10 está instalado.
- Java 21 existe, mas não faz parte da proposta selecionada.
- Docker não foi encontrado no PATH consultado. Isso não prova ausência em toda a máquina; verificar/instalar e validar daemon no bootstrap.
- PDF lido com Python e Poppler fornecidos pelo runtime do Codex, sem dependências de aplicação instaladas.
