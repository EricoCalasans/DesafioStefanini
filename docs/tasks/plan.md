# Plano de construção

**Status em 23/10/2026:** núcleo das duas APIs, documentação de entrega, artefatos de liderança, link compartilhável e promoção GitFlow concluídos. O PR #1 foi integrado; o merge commit `31e3e66` passou na CI de `main`, `develop` e `master`. Revisão independente, branch protection e deploy cloud continuam ausentes ou condicionais e estão declarados no [checklist](../entrega/checklist-submissao.md). **Referências:** [mapa](../CAPABILITY-MAP.md), [PRD](../PRD.md), [backlog](todo.md), [proposta hipotética](../../specs/SPEC-proposta.md).

**Prazo de entrega informado pelo candidato:** 23/10/2026 às 18:00 (horário de Brasília). As 240 horas e três semanas da [proposta](../../specs/SPEC-proposta.md) são um cenário técnico-comercial hipotético, não uma previsão para esta candidatura. O escopo integral não cabe no prazo real; priorizar o núcleo demonstrável, preservar requisitos obrigatórios e reportar cortes e verificações pendentes com transparência.

**Gate inicial:** o candidato autorizou a implementação seguindo as specs. Node `24.22.1`, SDK .NET `10.0.402`, Docker/Compose, PostgreSQL `17.11`, MongoDB `8.0.34-noble`, contratos e critérios estão disponíveis ou registrados. Será usado um único repositório Git, com diretórios de projeto independentes na raiz: `pedidos-typescript/` (NestJS) e `catalogo-dotnet/` (ASP.NET Core). Cada um guarda suas dependências, configuração, builds e testes; a raiz não contém `package.json` nem `node_modules`. Contratos, documentação, specs e infraestrutura compartilhados ficam em pastas próprias. O PDF, segredos e caches locais ficam na pasta irmã `../desafio-local/`, fora do Git.

## 1. Sequência e marcos verificáveis

| Etapa | Trabalho | Marco para avançar |
|---|---|---|
| 0 - Especificação | Análise, PRD, contratos, matriz e revisão | **Concluída:** documentação validada; execução autorizada pelo candidato |
| 1 - Fundação | Toolchain, estrutura, GitFlow, Compose, roles, build e CI mínimo | Fundação concluída; checks locais e CI hospedada executados; enforcement de branch protection não configurado |
| 2 - Catálogo | MongoDB, validador/índices, seed e endpoints | API real, lote, paginação, erros, Swagger, contagem de comandos e explain exercitados |
| 3 - Primeiro fluxo de pedido | Domínio, desconto, porta de catálogo, SQL e POST | Pedido canônico real passou com valores corretos; rollback provado em PostgreSQL |
| 4 - Leitura e robustez | GETs/paginação, snapshots, falhas e logs | GETs, paginação, snapshots, falha de inserção e timeout SQL passaram; COMMIT desconectado segue documentado como resultado ambíguo |
| 5 - Qualidade e automação | Integração/sistema/contrato, cobertura, eficiência e gate | Testes locais e CI hospedada, contrato runtime, smoke, N+1 e benchmark local restrito passaram; gate obrigatório no GitHub/deploy continua parcial |
| 6 - Liderança e IA | Guia curto, proposta, revisão por IA e registros | Guia, proposta e revisão dedicada de validações/mensagens estão documentados e testados localmente |
| 7 - Fechamento | README limpo, tag/evidências, conversa e roteiro | README e reprodução em volumes vazios passaram; deck e checklist estão prontos; conferir compartilhamento, tag/commit de submissão e CI desse SHA |
| 8 - Extensões condicionais | Cloud real e/ou vídeo/slides | Núcleo aceito, recursos e tempo disponíveis |

Testes e documentação acontecem junto com cada incremento. A etapa 5 consolida o fluxo e o gate; não adia todo teste para o fim. IA/SDD e governança acompanham o trabalho, e não são uma narrativa criada apenas na etapa 6.

Em 22/10, as duas APIs, a integração entre serviços e os bancos foram executados em Compose normal e em composição isolada com volumes vazios; a última execução local passou 65 testes unitários/HTTP e seis testes PostgreSQL de Pedidos, 28 testes .NET do Catálogo, além de typecheck/lint/format e smoke/contratos runtime. Um benchmark local de leitura foi medido, sem afirmar SLA. GitHub Actions já executou no SHA `90bd904`; a pipeline não faz deploy externo. O backlog separa enforcement de branch, link compartilhável e commit final das verificações que já têm resultado.

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
