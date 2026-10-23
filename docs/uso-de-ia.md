# Uso de IA no desafio técnico

**Atualizado em:** 23/10/2026
**Ferramenta:** assistente Codex nesta conversa  
**Modelo exato:** não verificado pela interface; não inferido.

## Por que e onde a IA foi usada

O candidato usou o assistente para ler e estruturar os requisitos do desafio, produzir PRD/specs/contratos antes do código e, após autorização explícita, implementar e verificar as duas APIs. A IA ajudou a decompor as tarefas, selecionar ferramentas e bibliotecas compatíveis, implementar regras e adapters, escrever testes e revisar diferenças entre requisitos, documentação e comportamento executado.

Não foi adicionado recurso de IA ao runtime das APIs. A análise do PDF foi feita localmente e os segredos de desenvolvimento ficaram fora do Git. Não há evidência de acesso ou uso do SAI APP 3.0. O candidato deve estudar as decisões e conseguir explicar os trade-offs; a ferramenta não substitui sua responsabilidade sobre a entrega.

## Processo de trabalho

1. Extrair requisitos e classificar obrigação, contexto, diferencial e ambiguidade; registrar IDs Rxx.
2. Criar PRD, mapa, contratos, specs, ADRs e critérios verificáveis antes da implementação.
3. Implementar fatias separadas por projeto, testar a regra e a fronteira afetada e registrar o estado no backlog.
4. Revisar mensagens de erro, dados externos, transação, logs, dependências e configuração; corrigir achados com testes.
5. Executar checks locais, integração real, smoke e CI hospedada; documentar claramente o que continua condicionado ou sem comprovação externa.

O repositório e as evidências ficam organizados em [docs](.), [specs](../specs/) e [docs/tasks/todo.md](tasks/todo.md). O histórico detalhado de interações relevantes está em [registro de IA](ia/registro-especificacao.md).

## Interações e decisões documentadas

- **Especificação:** pedido efetivo para analisar o PDF ponto a ponto, produzir documentos completos, apontar riscos, revisar o conjunto e resumir a solução. Resultado: análise, PRD, contratos, nove specs, matriz e decisões técnicas registradas.
- **Preparação:** pedido para verificar versões/configuração antes do código. Resultado: Node 24, .NET 10, Docker Compose, PostgreSQL 17 e MongoDB 8 fixados e conferidos.
- **Implementação:** pedido para comparar specs com o PRD, implementar o sistema completo, separar cada linguagem em projeto próprio, preservar um único Git, manter a raiz enxuta, completar `.gitignore`, criar commits claros e testar tudo. Resultado e verificações estão na revisão e backlog.
- **Correção orientada a testes:** incompatibilidade entre versões de TypeScript e `typescript-eslint` foi tratada usando Biome para lint/format e `tsc` para tipos. Problemas de parsing/validação do Catálogo foram reproduzidos e corrigidos, conforme o registro real.
- **Revisão final:** testes locais e revisão de persistência, limites, fronteiras e exemplos foram repetidos; a contagem/explain de Mongo confirmou lote sem N+1; benchmark local, setup limpo e revisão focada de mensagens foram executados. CI hospedada foi executada; README, checklist e slides foram preparados para a entrega. O checklist de submissão registra o SHA publicado, PRs reais e os limites da plataforma.

As mensagens acima são descrições de interações que aconteceram nesta conversa, não prompts futuros apresentados como reais. A especificação e o registro de IA informam os resultados e limites com mais detalhe.

## Validação humana e técnica

O candidato delegou as decisões técnicas ao assistente com base no PRD; a decisão foi registrada nos ADRs. O assistente verificou os resultados localmente e GitHub Actions foi executado no repositório público. Não houve revisor independente, aceite da banca ou deploy remoto. A pipeline não tem branch protection/required checks associados.

Na última revalidação local de 23/10/2026 passaram: 65 testes unitários/HTTP de Pedidos, seis testes PostgreSQL reais, 28 testes .NET, `npm run build`, `npm run typecheck`, `npm run lint`, `dotnet format --verify-no-changes`, validador documental/OpenAPI (456 links locais), contratos runtime, smoke ponta a ponta e reprodução em Compose com volumes vazios. O experimento Mongo mediu um `find` por lote de 1/10/100 IDs e confirmou os índices esperados; o benchmark local de leitura está descrito com seus limites. O merge commit `31e3e66` passou na CI de `main`, `develop` e `master`; os runs estão no [registro hospedado](evidencias/ci-hospedada.md). Consulte também o [relatório de revisão](revisao-das-especificacoes.md), [evidência de eficiência](evidencias/catalogo-lote-explain.md), [revisão de mensagens](ia/revisao-validacoes-mensagens.md) e [backlog](tasks/todo.md).

## Link compartilhável obrigatório

**Link público da conversa:** [https://chatgpt.com/s/cx_6adace2a8af48191a86a6f1c7ebc73f6](https://chatgpt.com/s/cx_6adace2a8af48191a86a6f1c7ebc73f6). O recurso foi criado para atender ao requisito do desafio. A página abriu numa consulta sem sessão autenticada e exibiu a conversa; não há evidência de que o avaliador já a tenha acessado. Qualquer pessoa com o link pode consultar o conteúdo, então encaminhe-o apenas ao avaliador.
