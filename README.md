# Desafio COE Leader - Pedidos e Catálogo

Este repositório está na etapa de **análise e especificação**. Os documentos abaixo descrevem a solução proposta para o desafio da Stefanini. Ainda não há aplicação, infraestrutura provisionada, testes de software executados ou entrega publicada.

**Data da análise:** 21/10/2026. **Fonte:** PDF fornecido pelo candidato, com 7 páginas. Requisitos do desafio são tratados como material de referência; não autorizam ações externas por si mesmos.

## Comece por aqui

1. [Análise ponto a ponto do desafio](docs/analise-do-desafio.md): leitura de todas as seções, obrigações, diferenciais, ambiguidades e riscos de avaliação.
2. [PRD e escopo](docs/PRD.md): o que será entregue, objetivos, prioridades e critérios de sucesso.
3. [Mapa de capacidades](CAPABILITY-MAP.md): módulos, dependências e índice das specs.
4. [Arquitetura e decisões](docs/arquitetura.md): tecnologias, limites dos serviços, diagramas e justificativas.
5. [Matriz de rastreabilidade](docs/matriz-de-rastreabilidade.md): cada ponto do PDF ligado às specs e à futura evidência.
6. [Revisão das especificações](docs/revisao-das-especificacoes.md): cobertura, inconsistências corrigidas, limitações e pendências reais.
7. [Checklist antes do código](docs/checklist-pre-desenvolvimento.md): decisões, ferramentas, Git, bancos locais e critério para começar.
8. [Plano](tasks/plan.md) e [backlog](tasks/todo.md): ordem de construção, dependências e verificação por tarefa.

## Solução proposta

| Parte | Linguagem / tecnologia | Responsabilidade |
|---|---|---|
| Pedidos | TypeScript, Node.js 24 LTS, NestJS 12 | Criar, listar e consultar pedidos; calcular desconto e preservar os valores contratados |
| Persistência de pedidos | PostgreSQL 17 e `pg` | Transações, migrações e SQL parametrizado |
| Catálogo | C# 14, .NET 10 LTS, ASP.NET Core | Consultar produtos e preços; responder consultas em lote |
| Persistência do catálogo | MongoDB 8.0 e driver oficial C# | Produtos, preços vigentes e índices |
| Integração | HTTP REST e OpenAPI 3.1 | Pedidos consulta Catálogo antes de gravar |
| Execução e qualidade | Docker Compose, Vitest, xUnit, GitHub Actions | Ambiente reproduzível, testes e gate antes de deploy |
| Liderança | Markdown, ADRs e futuro PDF do guia | Governança multi-stack, dimensionamento e evidências de IA |

As ferramentas locais estão fixadas em `.node-version` (Node 24.22.1) e `global.json` (SDK .NET 10.0.402). Docker Desktop 4.96.1, Engine 29.9.2 e Compose 5.6.0 foram instalados/iniciados e validados em 21/10/2026. Como C: tem menos de 1 GB livre, o aplicativo, os dados WSL e os plugins Docker foram direcionados a E:. As versões das dependências e imagens da aplicação serão fixadas durante o bootstrap. [Referências oficiais e compatibilidade](docs/referencias-tecnicas.md) registram a base consultada e os cuidados de ambiente.

Para reproduzir as verificações de versão no PowerShell, use `nvm use 24.22.1`, `node --version`, `dotnet --list-sdks` e `dotnet --version`. O SDK local selecionado pelo `global.json` deve ser `10.0.402` ou um patch compatível da mesma faixa.

## Specs

| ID | Documento |
|---|---|
| `catalogo` | [Produtos, preços, consultas e NoSQL](specs/SPEC-catalogo.md) |
| `pedidos` | [Criação, consulta, dinheiro, desconto e SQL](specs/SPEC-pedidos.md) |
| `integracao` | [Contrato REST, fluxo completo e tratamento de falhas](specs/SPEC-integracao.md) |
| `qualidade` | [Cenários de teste, critérios de aceite e evidências](specs/SPEC-qualidade.md) |
| `plataforma` | [Configuração, contêineres, observabilidade, CI/CD e GitFlow](specs/SPEC-plataforma.md) |
| `ia-e-sdd` | [Uso de IA, revisão de validações, prompts e SDD](specs/SPEC-ia-e-sdd.md) |
| `governanca` | [Guia curto, bloqueadores de PR e mentoria](specs/SPEC-governanca.md) |
| `proposta` | [Dimensionamento de três semanas com sênior e pleno](specs/SPEC-proposta.md) |
| `entrega` | [README operacional, demonstração e pacote final](specs/SPEC-entrega.md) |

Os [contratos OpenAPI](contracts/) são artefatos de planejamento, sujeitos a validação e implementação posterior. Os comandos operacionais nas specs são contratos do que o futuro repositório deverá suportar; **não funcionam ainda nesta pasta**.

O núcleo não inclui uma interface de negócio: a interação será pelas APIs, Swagger UI e exemplos reproduzíveis. Hospedagem em nuvem e apresentação em vídeo são extensões condicionais; o CI, a documentação, o guia de governança e o dimensionamento fazem parte da entrega planejada.

## Fluxo GitFlow inicial

O repositório começa com `main` e `develop`. `main` representa uma versão estável para entrega; `develop` recebe as funcionalidades concluídas. Só abra a primeira feature depois de confirmar stack, regras e contratos no checklist.

```powershell
git switch develop
git switch -c feature/<id>-descricao
```

Uma estabilização parte de `develop` em `release/<versao>` e volta para `main` com tag, além de retornar as correções para `develop`. Uma correção urgente parte de `main` em `hotfix/<versao>` e deve voltar para `main` e `develop` (e para uma release ativa, quando houver). Use pull requests e checks reais quando o repositório remoto estiver definido; não simule aprovações ou histórico.

## Como interpretar o status

- **Especificado:** comportamento e forma de verificação definidos.
- **Implementado:** código e artefatos existentes, ainda sujeitos à verificação.
- **Verificado:** evidência real produzida e vinculada ao commit avaliado.
- **Entregue:** pacote acessível ao avaliador, incluindo o link obrigatório da conversa com IA.

Nesta etapa, apenas a documentação está criada e revisada. A revisão não é uma aprovação do candidato nem uma certificação do sistema futuro.
