# Plano de construção

**Status:** plano proposto após especificação, sem implementação iniciada. **Referências:** [mapa](../CAPABILITY-MAP.md), [PRD](../docs/PRD.md), [backlog](todo.md), [proposta hipotética](../specs/SPEC-proposta.md).

**Gate inicial:** fechar os itens essenciais de [checklist pré-desenvolvimento](../docs/checklist-pre-desenvolvimento.md) antes do primeiro incremento. Toolchain local, Docker, raiz Git e branches iniciais já foram preparados. Ainda é preciso confirmar stacks/regras, revisar a fatia e o contrato, e o candidato validar que entende as escolhas antes de criar a primeira branch de feature. A etapa 1 começa depois desse gate.

## 1. Sequência e marcos verificáveis

| Etapa | Trabalho | Marco para avançar |
|---|---|---|
| 0 - Especificação | Análise, PRD, contratos, matriz e revisão | Documentos coerentes; candidato revê escolhas antes de codificar |
| 1 - Fundação | Toolchain, estrutura, GitFlow, Compose, roles, build e CI mínimo | Ambas as aplicações sobem; bancos isolados e configuração validada |
| 2 - Catálogo | MongoDB, validador/índices, seed e endpoints | Lote real com uma busca, contratos e erros verificados |
| 3 - Primeiro fluxo de pedido | Domínio, desconto, porta de catálogo, SQL e POST | Pedido canônico real, valores corretos e rollback comprovado |
| 4 - Leitura e robustez | GETs/paginação, snapshots, falhas e logs | Leituras independentes do fornecedor; erros definidos |
| 5 - Qualidade e automação | Integração/sistema/contrato, cobertura, eficiência e gate | CI obrigatório completo no mesmo SHA; falha impede deploy |
| 6 - Liderança e IA | Guia curto, proposta, revisão por IA e registros | Conteúdo factual, 1-2 páginas e horas reconciliadas |
| 7 - Fechamento | README limpo, tag/evidências, conversa e roteiro | Checklist de entrega verificável |
| 8 - Extensões condicionais | Cloud real e/ou vídeo/slides | Núcleo aceito, recursos e tempo disponíveis |

Testes e documentação acontecem junto com cada incremento. A etapa 5 consolida o fluxo e o gate; não adia todo teste para o fim. IA/SDD e governança acompanham o trabalho, e não são uma narrativa criada apenas na etapa 6.

## 2. Dependências e possibilidade de trabalho simultâneo

Contrato do Catálogo antecede o adapter consumidor. A persistência de Pedidos pode começar com unitários e uma fixture de fornecedor após contrato estabilizado; o marco do POST exige integração real. GETs seguem modelo SQL e criação. O CI mínimo começa na fundação e ganha testes conforme os incrementos. Guia e proposta podem ser redigidos quando as escolhas estiverem estáveis.

Na hipótese de equipe, o pleno pode construir Catálogo/seed enquanto o sênior prepara domínio/SQL de Pedidos; ambos alinham o contrato antes e revisam os incrementos. Esta é uma possibilidade do dimensionamento, não registro de execução paralela por agentes.

## 3. Fatias verticais

Primeira fatia: consultar um produto real no MongoDB por HTTP. Segunda: criar um pedido de um produto real e verificar SQL. Terceira: vários produtos em lote, desconto e snapshots. Quarta: consultar histórico com fornecedor indisponível. Quinta: falhas, limites e automação completa.

Cada fatia fecha comportamento, persistência/adaptador pertinente, teste e documentação. Evitar construir todos os controllers de uma vez e deixar regras/integração para depois.

## 4. Principais riscos e decisões de corte

Resolver ambiente e compatibilidade cedo; não esperar o dia da demonstração para descobrir SDK ausente. Estabilizar contrato antes de interfaces de conveniência. Nenhum corte pode remover IA obrigatória/link, SQL/NoSQL, desconto configurável, segurança SQL, teste de criação ou consulta eficiente. Cloud, vídeo/slides e conveniências saem primeiro.

Se o candidato preferir outra stack, atualizar ADR001, referências, specs, comandos, estrutura e proposta antes de gerar código. O prazo real será informação externa; as três semanas do documento comercial não são data de vencimento da candidatura.

## 5. Evidência por incremento

Tarefa → requisito → arquivo alterado → teste/inspeção pertinente → resultado → commit/PR. Registrar contribuição de IA sem inventar sessão. Ao fechar uma fase, revisar pendências e atualizar a matriz de implementação futura; não marcar como entregue apenas porque existe spec.
