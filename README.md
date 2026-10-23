# Desafio técnico COE Leader

Repositório único com duas aplicações independentes para o desafio: API de Pedidos em TypeScript/NestJS e API de Catálogo em C#/.NET. A raiz contém somente projetos, especificações, documentação, contratos e infraestrutura compartilhada. Dependências e builds ficam dentro do projeto que os utiliza.

## Navegação

- [Análise ponto a ponto do PDF](docs/analise-do-desafio.md)
- [PRD](docs/PRD.md), [mapa de capacidades](docs/CAPABILITY-MAP.md) e [matriz de rastreabilidade](docs/matriz-de-rastreabilidade.md)
- [Specs completas](specs/README.md) e [contratos OpenAPI](contracts/README.md)
- [Arquitetura e decisões (ADRs)](docs/arquitetura.md)
- [Guia de code review (Markdown)](docs/governanca/guia-de-code-review.md) e [PDF de duas páginas](docs/output/pdf/guia-de-code-review.pdf)
- [Dimensionamento executivo](docs/proposta/dimensionamento.md) e [uso de IA](docs/uso-de-ia.md)
- [Revisão das specs e validação documental](docs/revisao-das-especificacoes.md)
- [Checklist de preparação](docs/checklist-pre-desenvolvimento.md)
- [Plano e backlog](docs/tasks/plan.md) e [tarefas](docs/tasks/todo.md)
- [Fluxo Git](docs/fluxo-git.md)

## Estrutura

    desafio/
    ├── .git/                    único repositório Git
    ├── .github/                 CI e template de PR
    ├── pedidos-typescript/      projeto independente de Pedidos
    ├── catalogo-dotnet/         projeto independente de Catálogo
    ├── contracts/               contratos HTTP compartilhados
    ├── docs/                    análise, PRD, decisões, plano e evidências
    ├── infra/                   bancos locais e configuração compartilhada
    ├── specs/                   especificações detalhadas
    ├── .editorconfig
    ├── .gitignore
    └── README.md

O projeto TypeScript contém seu próprio package.json, package-lock.json, configuração do Node, testes e node_modules. O projeto .NET contém sua própria solução, projetos, arquivos packages.lock.json e seleção do SDK. Não existe package.json nem node_modules na raiz.

Segredos, caches de preparação e o PDF de referência ficam fora do repositório, na pasta irmã desafio-local. O script de preparação determina esse nome a partir do nome da pasta do repositório. Nenhum arquivo local desse diretório é necessário para o Git.

## Stack e responsabilidades

| Projeto | Linguagem e runtime | Responsabilidade | Banco |
|---|---|---|---|
| Pedidos | TypeScript, Node.js 24 LTS, NestJS 12 | Criar, listar e consultar pedidos, calcular descontos e preservar snapshots | PostgreSQL 17 |
| Catálogo | C# 14, .NET 10, ASP.NET Core | Consultar produtos, preços vigentes e consultas em lote | MongoDB 8 |
| Integração | REST e OpenAPI 3.1 | Validar produtos antes de persistir pedidos | Contratos em contracts/ |

As versões e dependências estão fixadas nos projetos. Node fica registrado em pedidos-typescript/.node-version; o SDK .NET em catalogo-dotnet/global.json. O lint TypeScript usa Biome com checagem de tipos pelo TypeScript, conforme [ADR-004](docs/adr/004-qualidade-e-entrega.md).

## Banco de dados local

Em uma instalação nova, execute `infra/setup-local.ps1` no PowerShell. Ele cria credenciais aleatórias na pasta irmã `desafio-local` e mostra o comando Compose correspondente. O script preserva volumes existentes ao recusar sobrescrever um arquivo de credenciais já criado.

Com o ambiente preparado, a raiz `desafio` inicia os bancos e serviços, aplica as migrations e espera a API de Pedidos ficar saudável:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml up -d --build --wait
    node infra/smoke-system.mjs
python docs/validation/validar-contratos-runtime.py

Para popular o Catálogo com produtos sintéticos de demonstração, execute `.\infra\seed-demo.ps1` na raiz. O script é idempotente: inclui os produtos ausentes e preserva os dados existentes.

Pedidos fica em `http://localhost:3000` e Catálogo em `http://localhost:8080`; a documentação Swagger fica em `/docs` nos dois serviços. PostgreSQL e MongoDB publicam portas apenas no loopback. O Compose aplica as migrations de Pedidos antes de iniciar sua API e prepara um banco `orders_test` separado para os testes de integração.

Os bancos publicam portas somente no loopback local. As APIs usam credenciais de execução de menor privilégio; migrações e seed usam credenciais separadas.

## Diagnóstico rápido

- Se `docker compose` informar que falta `.env`, execute `infra/setup-local.ps1`; ele grava credenciais aleatórias em `../desafio-local/.env` e recusa sobrescrever um arquivo existente.
- Se uma porta estiver ocupada, altere a porta correspondente na pasta local `.env` (`POSTGRES_PORT`, `MONGO_PORT`, `ORDERS_PORT`, `CATALOG_PORT`) e recrie os serviços. As URLs internas entre containers continuam usando as portas do Compose.
- Se algum serviço não ficar saudável, confira `docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml ps` e consulte `docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml logs --tail 100 orders catalog postgres mongo`.
- Se a migration falhar, verifique se o PostgreSQL está saudável e se o URL de migração usa `orders_migrator`; o log do job aparece no serviço `orders-migrate`.
- Se a criação retornar erro do Catálogo, confirme `/health/ready` em `http://localhost:8080`; consultas históricas usam o snapshot PostgreSQL e não dependem do Catálogo.
- `docker compose down` para os serviços e preserva volumes. Apagar volumes elimina os dados locais e não é um comando de rotina.

## Executar cada projeto

Cada conjunto de comandos é executado dentro da pasta indicada. Não há comandos npm na raiz.

Pedidos, no PowerShell:

    Push-Location pedidos-typescript
    npm ci
    npm run build
    npm run typecheck
    npm run lint
    npm test
    Pop-Location

Pedidos, testes de integração no PowerShell (ambiente `orders_test`):

    .\infra\test-orders.ps1

Para aplicar as migrations manualmente no banco de desenvolvimento, execute na pasta `pedidos-typescript`:

    npm run db:migrate

Catálogo, no PowerShell:

    Push-Location catalogo-dotnet
    dotnet restore Catalog.sln --locked-mode
    dotnet build Catalog.sln --configuration Release --no-restore
    dotnet test Catalog.sln --configuration Release --no-build
    Pop-Location

O estado atual de implementação e as evidências de cada fatia estão registrados em [docs/tasks/plan.md](docs/tasks/plan.md) e [docs/tasks/todo.md](docs/tasks/todo.md). Uma spec ou um arquivo existente não significa que o comportamento já passou nos testes.

O teste de contrato runtime usa `PyYAML` e `jsonschema`, conforme `docs/validation/requirements-documentacao.txt`, e verifica respostas das duas APIs contra os schemas OpenAPI. A CI instala essas ferramentas antes dos testes; localmente, use um ambiente Python isolado fora do repositório.

Para repetir a contagem de comandos e os planos do MongoDB em ambiente local, execute `.\docs\validation\medir-lote-catalogo.ps1`. O roteiro habilita temporariamente o profiler no banco `catalog` e o restaura ao nível anterior; requer acesso Docker e a URI administrativa gerada pelo setup.

Para repetir o benchmark local somente de leitura, mantenha as duas APIs e bancos saudáveis e execute `node infra/benchmark-system.mjs --requests=100 --concurrency=8 --warmups=2`. Os números observados, limites e ressalvas estão em [evidência do benchmark](docs/evidencias/benchmark-laboratorio.md); não representam SLA nem criação sob carga.

A reprodução em volumes vazios e o ajuste de retry autenticado no bootstrap Mongo estão em [evidência de setup limpo](docs/evidencias/setup-limpo.md). A revisão dos cenários Q29-Q40 está em [evidência de falhas](docs/evidencias/revisao-falhas-pedidos.md); a revisão assistida de mensagens está em [registro IA](docs/ia/revisao-validacoes-mensagens.md).

## Estado verificado localmente

Em 22/10/2026, Pedidos passou em 33 testes unitários/HTTP, typecheck, lint e seis testes de integração com PostgreSQL real; Catálogo passou em 23 testes .NET e verificação de formatação. Smoke e contratos runtime passaram em composição nova, com volumes vazios, e na composição local. O caso canônico retornou subtotal de 50.000, desconto de 5.000 e total de 45.000. Contagem/explain Mongo, benchmark de leitura limitado, falhas Q29-Q40 e validação documental têm evidências. O link da conversa, primeira execução da CI hospedada e pacote final da candidatura continuam pendentes; veja o [backlog](docs/tasks/todo.md).

## Entrega e limites

Prazo informado para a candidatura: 23/10/2026 às 18:00, horário de Brasília. O escopo completo é maior que o tempo restante; o plano prioriza um núcleo funcional e mantém pendências visíveis. Hospedagem em nuvem e vídeo são extensões condicionais. A documentação do desafio orienta o trabalho, mas não autoriza ações externas por si só.
