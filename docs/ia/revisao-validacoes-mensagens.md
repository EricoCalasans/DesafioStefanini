# Revisão assistida por IA de validações e mensagens

**Data:** 22/10/2026. **Ferramenta:** Codex nesta conversa. **Modelo exato:** não exposto pela interface. Esta revisão foi executada sobre o código e os testes locais, não sobre dados de produção.

## Prompt aplicado

> Revise as validações e mensagens das APIs Pedidos e Catálogo contra os contratos e os cenários Q29-Q40. Para cada falha, confira status, código, detalhe público, mídia e correlação; verifique se texto de fornecedor ou exceção interna é exposto; confirme que falhas anteriores à gravação não persistem pedidos. Recomende apenas mudanças pequenas que possam ser provadas por testes. Separe casos simulados dos que exigem banco real e não prometa rollback quando o cliente perde conexão durante COMMIT.

## Saída da revisão e crítica

No Catálogo, a inspeção confirmou que entrada inválida, payload excessivo e falha Mongo retornam `application/problem+json` com códigos/detalhes estáveis; o middleware não copia a mensagem da exceção de infraestrutura. Os testes existentes verificam `INVALID_JSON`, `VALIDATION_ERROR`, `PAYLOAD_TOO_LARGE`, `PERSISTENCE_UNAVAILABLE` e a mídia. Nenhuma mudança foi necessária neste caminho.

1. **Detalhes do fornecedor não podem virar a mensagem pública.** O adapter já mapeava 5xx para um detalhe fixo, mas os testes não comprovavam a ausência do corpo privado e não cobriam 4xx inesperado. A sugestão foi aceita: adicionadas asserções para 503 sanitizado, mapeamento de 4xx inesperado para 502 e rejeição sanitizada de resposta sem JSON/JSON malformado.
2. **Falha antes da persistência precisava de um oráculo explícito.** O cliente testava timeout e indisponibilidade, e o caso de uso validava produtos inválidos, mas não havia um teste direto que garantisse zero chamadas ao repositório para erro 502/503/504 do Catálogo. A sugestão foi aceita: teste parametrizado verifica os três status e nenhuma chamada a `repository.create`.
3. **Timeout SQL precisava ser exercitado em PostgreSQL.** Havia rollback real de falha do INSERT dos itens, mas nenhum cenário real de espera por lock. A sugestão foi aceita: integração abre um lock de tabela em transação separada, força o `lock_timeout`, confere 503 genérico e consulta que prova ausência de linha residual.
4. **Histórico não deve depender do fornecedor.** A resposta existente já usava o repositório, mas o teste só verificava a contagem de chamadas antes da listagem. A sugestão foi aceita: após criar o pedido, o teste faz o cliente de Catálogo falhar; GET e listagem seguem respondendo e o contador continua em uma chamada, referente somente à criação.
5. **Queda de conexão em COMMIT tem resultado potencialmente ambíguo.** A sugestão de forçar uma falha de rede sem proxy dedicado foi rejeitada como evidência não determinística. Mantém-se a decisão do ADR: nenhuma repetição automática e nenhuma promessa de rollback após perda de conexão durante COMMIT.

## Verificação das sugestões aceitas

- Pedidos: 33 testes unitários/HTTP passaram; typecheck e Biome passaram.
- PostgreSQL real isolado `orders_test`: seis testes de integração passaram, incluindo falha de INSERT, timeout de lock e verificação de ausência de resíduo.
- O smoke ponta a ponta e o contrato runtime das duas APIs continuam cobrindo os contratos externos; a evidência do conjunto de falhas fica em [Q29-Q40](../evidencias/revisao-falhas-pedidos.md).

## Limites

A IA sugeriu casos com base na spec e no código; ela não é uma revisão independente nem um aceite da banca. A falha de rede durante COMMIT não foi injetada. A suíte e a revisão não autorizam alegar que o resultado transacional desse caso é conhecido.
