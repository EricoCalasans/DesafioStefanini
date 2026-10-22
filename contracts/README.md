# Contratos das APIs

Contratos OpenAPI 3.1 propostos antes da implementação:

- [Pedidos](pedidos.openapi.yaml): criar, listar e consultar pedidos.
- [Catálogo](catalogo.openapi.yaml): listar, consultar e obter produtos em lote.
- [Componentes comuns](common.openapi.yaml): paginação, saúde, erros e correlação. Não é terceiro serviço.

Os contratos são complementados por invariantes nas specs: soma dos itens, desconto, correspondência de conjuntos e classificação de erro não são garantidos apenas por JSON Schema. As APIs futuras deverão validar essas regras e passar por testes de contrato.

Exemplos sintéticos para leitura e validação:

| Arquivo | Esquema |
|---|---|
| [Criar pedido](examples/criar-pedido.json) | `CreateOrder` |
| [Pedido canônico](examples/pedido.json) | `Order` |
| [Lote de IDs](examples/consulta-produtos.json) | `ProductQuery` |
| [Produtos do lote](examples/produtos.json) | `ProductQueryResult` |
| [Erro de inatividade](examples/problema-produto-inativo.json) | `Problem` |

Os exemplos representam respostas **esperadas**, não capturas de aplicação executada. Com política habilitada, limiar 50.000 e taxa 1.000 bps, o pedido canônico soma 50.000, aplica 5.000 e totaliza 45.000 centavos.

Datas de resposta devem ser UTC, terminadas em `Z`. `format: date-time` no esquema aceita outros offsets segundo JSON Schema; o requisito UTC é também uma verificação semântica do produtor. Da mesma forma, um esquema de objeto fechado não expressa proibição genérica de query params extras; o adapter deve verificar isso.
