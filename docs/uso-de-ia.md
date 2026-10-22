# Uso de IA no desafio técnico

**Atualizado em:** 22/10/2026  
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
5. Executar checks locais, integração real e smoke; documentar claramente o que ainda depende de execução hospedada ou material final.

O repositório e as evidências ficam organizados em [docs](.), [specs](../specs/) e [docs/tasks/todo.md](tasks/todo.md). O histórico detalhado de interações relevantes está em [registro de IA](ia/registro-especificacao.md).

## Interações e decisões documentadas

- **Especificação:** pedido efetivo para analisar o PDF ponto a ponto, produzir documentos completos, apontar riscos, revisar o conjunto e resumir a solução. Resultado: análise, PRD, contratos, nove specs, matriz e decisões técnicas registradas.
- **Preparação:** pedido para verificar versões/configuração antes do código. Resultado: Node 24, .NET 10, Docker Compose, PostgreSQL 17 e MongoDB 8 fixados e conferidos.
- **Implementação:** pedido para comparar specs com o PRD, implementar o sistema completo, separar cada linguagem em projeto próprio, preservar um único Git, manter a raiz enxuta, completar `.gitignore`, criar commits claros e testar tudo. Resultado e verificações estão na revisão e backlog.
- **Correção orientada a testes:** incompatibilidade entre versões de TypeScript e `typescript-eslint` foi tratada usando Biome para lint/format e `tsc` para tipos. Problemas de parsing/validação do Catálogo foram reproduzidos e corrigidos, conforme o registro real.
- **Revisão final:** testes locais e revisão de persistência, limites, fronteiras e exemplos foram repetidos; as pendências de CI hospedada, N+1 medido e artefatos de candidatura permanecem explícitas.

As mensagens acima são descrições de interações que aconteceram nesta conversa, não prompts futuros apresentados como reais. A especificação e o registro de IA informam os resultados e limites com mais detalhe.

## Validação humana e técnica

O candidato delegou as decisões técnicas ao assistente com base no PRD; a decisão foi registrada nos ADRs. O assistente verificou os resultados localmente. Não houve revisor independente, aceite da banca, execução GitHub Actions ou deploy remoto.

Em 22/10/2026 passaram: 27 testes unitários/HTTP de Pedidos, 5 testes PostgreSQL reais, 23 testes .NET, `npm run typecheck`, `npm run lint`, `dotnet format --verify-no-changes`, validação documental/OpenAPI e smoke ponta a ponta em containers. Consulte o [relatório de revisão](revisao-das-especificacoes.md) e o [backlog com evidências](tasks/todo.md). Esses resultados não afirmam medição formal de carga ou de ausência de N+1.

## Link compartilhável obrigatório

**Status: pendente.** Nenhum link público ou externo da conversa foi criado ou verificado. Este documento local e o histórico do repositório não substituem o link pedido pelo desafio. Antes da submissão, o candidato precisa decidir se compartilha a conversa, revisar o conteúdo que ficará acessível e validar o link fora da sessão autenticada.
