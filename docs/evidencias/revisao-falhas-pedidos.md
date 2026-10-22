# Revisão das falhas e da persistência de Pedidos

**Data:** 22/10/2026. **Escopo:** cenários Q29-Q40 da [spec de qualidade](../../specs/SPEC-qualidade.md).

| Cenário | Evidência verificada | Resultado |
|---|---|---|
| Produto ausente/inativo (Q29) | `create-order.spec.ts`, teste `rejects missing and inactive products without saving` | Rejeita a criação antes de chamar o repositório. |
| Catálogo indisponível/5xx (Q30) | `catalog-http-client.spec.ts`, teste `maps supplier 5xx to a sanitized unavailable error`; `create-order.spec.ts`, teste parametrizado de falha do Catálogo | Erro 503 genérico; nenhuma persistência. |
| Deadline do Catálogo (Q31) | `catalog-http-client.spec.ts`, teste de timeout durante leitura do corpo; teste parametrizado de falha do Catálogo | Erro 504; nenhuma persistência. |
| Resposta externa inválida ou excessiva (Q32-Q33) | `catalog-http-client.spec.ts`, testes para JSON, mídia, estrutura, domínio, tamanho, conjunto de IDs e produto extra | Respostas inválidas convertem-se em 502 sanitizado; nenhuma persistência no caso de uso. |
| 4xx inesperado do fornecedor (Q34) | `catalog-http-client.spec.ts`, teste `maps unexpected supplier 4xx responses to a sanitized contract error` | Erro 502 genérico; detalhe do fornecedor não é exposto. |
| Snapshots e leituras independentes (Q35-Q36) | Integração PostgreSQL de preço/regra; `orders-http.spec.ts`, teste de criação/GET/lista com o cliente de Catálogo configurado para falhar após a criação | O snapshot antigo permanece; GET/lista não chamam Catálogo. |
| Falha no INSERT dos itens (Q37) | `postgres-order.repository.spec.ts`, teste `rolls back the header when the batched item insert fails in PostgreSQL` | Trigger real força a falha; nenhum cabeçalho residual. |
| Texto semelhante a SQL (Q38) | `postgres-order.repository.spec.ts`, teste de valor parametrizado contendo aspas e texto SQL | Valor lido sem executar SQL fornecido pelo cliente; tabela permanece. |
| Lock/statement timeout (Q39) | `postgres-order.repository.spec.ts`, teste `returns a sanitized error and stores no order when PostgreSQL lock timeout expires` | Bloqueio real de tabela no PostgreSQL termina em erro 503 genérico; nenhum pedido fica gravado. |
| Cliente perde conexão durante COMMIT (Q40) | [ADR 003](../adr/003-integracao-e-consistencia.md) | Estado final pode ser ambíguo. Não há retry cego; não se alega rollback garantido nessa falha. Não foi injetada uma queda TCP no COMMIT, pois isso exigiria proxy/fault injection e não é necessário para provar o contrato documentado. |

Os testes que usam fornecedores simulados validam o contrato HTTP e a ordem do caso de uso. As verificações de rollback, parâmetros, snapshots e timeout SQL usam PostgreSQL real e o banco isolado `orders_test`. O experimento de Q40 permanece uma limitação explícita; não se deve inferir que 503 implica que uma operação nunca foi confirmada se a conexão cair durante o commit.
