# Plano de construção

**Status:** núcleo das duas APIs implementado e validado localmente em 22/10/2026; revisão cruzada das specs concluída. Fechamento de evidências, artefatos de liderança e itens do backlog ainda em andamento. **Referências:** [mapa](../CAPABILITY-MAP.md), [PRD](../PRD.md), [backlog](todo.md), [proposta hipotética](../../specs/SPEC-proposta.md).

**Prazo de entrega informado pelo candidato:** 23/10/2026 às 18:00 (horário de Brasília). As 240 horas e três semanas da [proposta](../../specs/SPEC-proposta.md) são um cenário técnico-comercial hipotético, não uma previsão para esta candidatura. O escopo integral não cabe no prazo real; priorizar o núcleo demonstrável, preservar requisitos obrigatórios e reportar cortes e verificações pendentes com transparência.

**Gate inicial:** o candidato autorizou a implementação seguindo as specs. Node `24.22.1`, SDK .NET `10.0.402`, Docker/Compose, PostgreSQL `17.11`, MongoDB `8.0.34-noble`, contratos e critérios estão disponíveis ou registrados. Será usado um único repositório Git, com diretórios de projeto independentes na raiz: `pedidos-typescript/` (NestJS) e `catalogo-dotnet/` (ASP.NET Core). Cada um guarda suas dependências, configuração, builds e testes; a raiz não contém `package.json` nem `node_modules`. Contratos, documentação, specs e infraestrutura compartilhados ficam em pastas próprias. O PDF, segredos e caches locais ficam na pasta irmã `../desafio-local/`, fora do Git.

## 1. Sequência e marcos verificáveis

| Etapa | Trabalho | Marco para avançar |
|---|---|---|
| 0 - Especificação | Análise, PRD, contratos, matriz e revisão | **Concluída:** documentação validada; execução autorizada pelo candidato |
| 1 - Fundação | Toolchain, estrutura, GitFlow, Compose, roles, build e CI mínimo | Fundação local concluída; primeira execução da CI hospedada ainda pendente |
| 2 - Catálogo | MongoDB, validador/índices, seed e endpoints | API real, lote, paginação, erros e Swagger exercitados; falta medir comandos/explain |
| 3 - Primeiro fluxo de pedido | Domínio, desconto, porta de catálogo, SQL e POST | Pedido canônico real passou com valores corretos; rollback provado em PostgreSQL |
| 4 - Leitura e robustez | GETs/paginação, snapshots, falhas e logs | GETs e paginação passaram; matriz completa de falhas e mudança histórica seguem no backlog |
| 5 - Qualidade e automação | Integração/sistema/contrato, cobertura, eficiência e gate | Testes locais, contrato runtime contra OpenAPI e smoke real passaram; explain e execução da CI hospedada pendentes |
| 6 - Liderança e IA | Guia curto, proposta, revisão por IA e registros | Guia e proposta entregues localmente; registro real atualizado; revisão dedicada de mensagens ainda pendente |
| 7 - Fechamento | README limpo, tag/evidências, conversa e roteiro | README e instruções locais disponíveis; link de conversa e pacote final pendentes |
| 8 - Extensões condicionais | Cloud real e/ou vídeo/slides | Núcleo aceito, recursos e tempo disponíveis |

Testes e documentação acontecem junto com cada incremento. A etapa 5 consolida o fluxo e o gate; não adia todo teste para o fim. IA/SDD e governança acompanham o trabalho, e não são uma narrativa criada apenas na etapa 6.

Em 22/10, as duas APIs, a integração entre serviços e os bancos foram executados em Compose; Pedidos passou em 27 testes unitários/HTTP e quatro testes PostgreSQL, Catálogo em 23 testes .NET, e o smoke ponta a ponta passou. Não foi executada ainda uma pipeline GitHub Actions neste repositório nem foi feito deploy externo. O backlog separa essas pendências das verificações que já têm resultado local.

## 2. Dependências e possibilidade de trabalho simultâneo

Contrato do Catálogo antecede o adapter consumidor. A persistência de Pedidos pode começar com unitários e uma fixture de fornecedor após contrato estabilizado; o marco do POST exige integração real. GETs seguem modelo SQL e criação. O CI mínimo começa na fundação e ganha testes conforme os incrementos. Guia e proposta podem ser redigidos quando as escolhas estiverem estáveis.

Na hipótese de equipe, o pleno pode construir Catálogo/seed enquanto o sênior prepara domínio/SQL de Pedidos; ambos alinham o contrato antes e revisam os incrementos. Esta é uma possibilidade do dimensionamento, não registro de execução paralela por agentes.

## 3. Fatias verticais

Primeira fatia: consultar um produto real no MongoDB por HTTP. Segunda: criar um pedido de um produto real e verificar SQL. Terceira: vários produtos em lote, desconto e snapshots. Quarta: consultar histórico com fornecedor indisponível. Quinta: falhas, limites e automação completa.

Cada fatia fecha comportamento, persistência/adaptador pertinente, teste e documentação. Evitar construir todos os controllers de uma vez e deixar regras/integração para depois.

## 4. Principais riscos e decisões de corte

Resolver ambiente e compatibilidade cedo; não esperar o dia da demonstração para descobrir SDK ausente. Estabilizar contrato antes de interfaces de conveniência. Nenhum corte pode remover IA obrigatória/link, SQL/NoSQL, desconto configurável, segurança SQL, teste de criação ou consulta eficiente. Cloud, vídeo/slides e conveniências saem primeiro.

ADR001 e ADR002 foram aceitos em 22/10/2026; não trocar stack ou regras sem decisão explícita do candidato e atualização dos documentos. O prazo real é 23/10/2026 às 18:00; as três semanas do documento comercial permanecem apenas como cenário solicitado pelo desafio. Se não houver tempo para todos os itens, declarar o que ficou incompleto em vez de mascarar cobertura ou execução.

## 5. Evidência por incremento

Tarefa → requisito → arquivo alterado → teste/inspeção pertinente → resultado → commit/PR. Registrar contribuição de IA sem inventar sessão. Ao fechar uma fase, revisar pendências e atualizar a matriz de implementação futura; não marcar como entregue apenas porque existe spec.
