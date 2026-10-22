# Desafio técnico COE Leader

Repositório único com duas aplicações independentes para o desafio: API de Pedidos em TypeScript/NestJS e API de Catálogo em C#/.NET. A raiz contém somente projetos, especificações, documentação, contratos e infraestrutura compartilhada. Dependências e builds ficam dentro do projeto que os utiliza.

## Navegação

- [Análise ponto a ponto do PDF](docs/analise-do-desafio.md)
- [PRD](docs/PRD.md), [mapa de capacidades](docs/CAPABILITY-MAP.md) e [matriz de rastreabilidade](docs/matriz-de-rastreabilidade.md)
- [Specs completas](specs/README.md) e [contratos OpenAPI](contracts/README.md)
- [Arquitetura e decisões (ADRs)](docs/arquitetura.md)
- [Revisão das specs e validação documental](docs/revisao-das-especificacoes.md)
- [Checklist de preparação](docs/checklist-pre-desenvolvimento.md)
- [Plano e backlog](docs/tasks/plan.md) e [tarefas](docs/tasks/todo.md)

## Estrutura

    desafio/
    ├── .git/                    único repositório Git
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

Em uma instalação nova, execute infra/setup-local.ps1 no PowerShell. Ele cria credenciais aleatórias na pasta irmã desafio-local e mostra o comando Compose correspondente. O script preserva volumes existentes ao recusar sobrescrever um arquivo de credenciais já criado.

Com o ambiente preparado, os serviços podem ser iniciados da raiz:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml up -d --wait
    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml run --rm --no-deps mongo-bootstrap

Os bancos publicam portas somente no loopback local. As APIs usam credenciais de execução de menor privilégio; migrações e seed usam credenciais separadas.

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

Catálogo, no PowerShell:

    Push-Location catalogo-dotnet
    dotnet restore Catalog.sln --locked-mode
    dotnet build Catalog.sln --configuration Release --no-restore
    dotnet test Catalog.sln --configuration Release --no-build
    Pop-Location

O estado atual de implementação e as evidências de cada fatia estão registrados em [docs/tasks/plan.md](docs/tasks/plan.md) e [docs/tasks/todo.md](docs/tasks/todo.md). Uma spec ou um arquivo existente não significa que o comportamento já passou nos testes.

## Entrega e limites

Prazo informado para a candidatura: 23/10/2026 às 18:00, horário de Brasília. O escopo completo é maior que o tempo restante; o plano prioriza um núcleo funcional e mantém pendências visíveis. Hospedagem em nuvem e vídeo são extensões condicionais. A documentação do desafio orienta o trabalho, mas não autoriza ações externas por si só.
