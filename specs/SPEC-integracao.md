# Spec - `integracao`

**Versão:** 1.0. **Status:** especificado. **Origem:** R02, R15-R16, R33-R34, R43. **Depende de:** `catalogo` e `pedidos`.

## 1. Contratos e fronteiras

APIs HTTP/JSON em `/api/v1`, OpenAPI 3.1. Fonte de verdade em [catálogo](../contracts/catalogo.openapi.yaml) e [pedidos](../contracts/pedidos.openapi.yaml). Documentação gerada pela aplicação deverá coincidir com esses arquivos, não substituí-los silenciosamente. Swagger UI de cada aplicação em `/docs`; endpoints de operação em `/health/live` e `/health/ready`.

Campos de entrada não previstos serão recusados. Respostas são DTOs explícitos; não serializar diretamente documentos de banco. Datas no formato ISO 8601 UTC; moeda BRL; valores em centavos. IDs de produto são UUIDs em string canônica minúscula; UUID de pedido é gerado no servidor.

## 2. Fluxo e validação do fornecedor

1. Pedidos valida body e duplicados, captura relógio/política e extrai IDs.
2. Envia um POST de leitura ao lote de Catálogo com `Content-Type` e `X-Correlation-Id`.
3. Catálogo consulta MongoDB uma vez logicamente, separa encontrados/ausentes e responde.
4. Pedidos valida esquema e semântica da resposta: conjuntos sem duplicação/sobra, cobertura dos solicitados, preço/moeda/versão/timestamps e elegibilidade. Exigir status 200 e JSON; limitar a resposta descomprimida a 256 KiB. Mídia, tamanho ou payload inesperados geram 502, sem carregar resposta ilimitada em memória.
5. Aplica regra e grava SQL numa transação local; responde após commit.

IDs ausentes e produtos inativos são condições de negócio, não falhas de disponibilidade. Se todos forem válidos, o pedido utiliza o snapshot observado. Não há validação dupla antes/depois do SQL nem garantia de preço travado no fornecedor. Não usar o próprio DTO de resposta como entidade de domínio sem validação.

## 3. Orçamento de tempo

Valores iniciais de demonstração, configuráveis e sujeitos ao experimento de verificação:

| Controle | Valor proposto | Efeito |
|---|---|---|
| Timeout da chamada de Pedidos ao Catálogo | 2.000 ms | Abort da chamada; 504 |
| Timeout de operação MongoDB | 1.000 ms | Fornecedor retorna 503 se conseguir responder |
| Seleção de servidor MongoDB | 1.000 ms | Evitar espera longa por servidor inacessível |
| `statement_timeout` PostgreSQL | 2.000 ms | Interromper SQL demorado |
| `lock_timeout` PostgreSQL | 1.000 ms | Não esperar indefinidamente por lock |
| Budget do handler de criação | 5.000 ms | Cancelar trabalho ainda cancelável e registrar timeout |
| Deadline do cliente de teste | 7.000 ms | Observar resposta/erro do servidor |

Sem retry automático no núcleo. Reusar conexões HTTP e pools de banco; pool por processo com limite documentado. Se houver cancelamento após o commit, não prometer desfazer o pedido; manter registro consistente e indicar a limitação de ausência de idempotência. Um timeout de handler não deve encerrar a conexão e deixar tarefa de escrita solta sem observação.

## 4. Matriz de falhas da criação

| Situação | Resposta de Pedidos | Persistência |
|---|---|---|
| JSON/forma/campo desconhecido | 400 `VALIDATION_ERROR` ou `INVALID_JSON` | Nenhuma |
| Mesmo produto repetido | 422 `DUPLICATE_PRODUCT_IDS` | Nenhuma |
| Ausente/inativo no lote válido | 422 `PRODUCTS_NOT_ORDERABLE` | Nenhuma |
| Catálogo sem rede ou retorna 503/5xx | 503 `CATALOG_UNAVAILABLE` | Nenhuma |
| Chamada HTTP expira | 504 `CATALOG_TIMEOUT` | Nenhuma |
| 200 com payload inválido, moeda errada, ID faltando sem classificação | 502 `CATALOG_INVALID_RESPONSE` | Nenhuma |
| Resposta 4xx inesperada do fornecedor para lote validado | 502 `CATALOG_INVALID_RESPONSE` | Nenhuma |
| Subtotal acima do limite | 422 `ORDER_AMOUNT_LIMIT_EXCEEDED` | Nenhuma |
| SQL indisponível / timeout conhecido | 503 `PERSISTENCE_UNAVAILABLE` | Reverter se não houve commit |
| Exceção de inserção / programação não classificada | 500 `INTERNAL_ERROR` | Rollback |
| Queda da conexão durante confirmação | 503 `PERSISTENCE_UNAVAILABLE` e log de resultado ambíguo | Pode ter confirmado; nunca afirmar rollback sem prova |

Consultas de pedidos dependem apenas do SQL. Erro de banco não vira `ORDER_NOT_FOUND` ou página vazia.

## 5. Contrato comum de erro

Mídia `application/problem+json`, HTTP status igual ao `status` do body. Campos obrigatórios: `type` (`about:blank` no núcleo), `title`, `status`, `detail`, `instance` (caminho sem query sensível), `code`, `traceId`. `errors` opcional com `field`, `code`, `message` e `productId` opcional. Mensagens em português, códigos estáveis em inglês e sem dependência de texto de exceção.

```json
{
  "type":"about:blank",
  "title":"Não foi possível criar o pedido",
  "status":422,
  "detail":"Há produtos indisponíveis para este pedido.",
  "instance":"/api/v1/orders",
  "code":"PRODUCTS_NOT_ORDERABLE",
  "traceId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "errors":[{
    "field":"items[0].productId",
    "code":"PRODUCT_INACTIVE",
    "message":"O produto está inativo.",
    "productId":"11111111-1111-4111-8111-111111111111"
  }]
}
```

Erros estruturais específicos: `INVALID_JSON`, `VALIDATION_ERROR`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`. Não exigir correspondência literal do `title/detail` para clientes; testes verificam que são úteis e não vazam detalhes. Campos `errors` seguem a ordem da entrada para validação de itens. Não incluir preço incorreto recebido de fornecedor nem endereço interno no erro público.

## 6. Correlação e observabilidade

`X-Correlation-Id` aceita UUID válido; caso ausente/inválido, gerar novo UUID. Propagar entre os serviços e devolver no header, inclusive nos erros que chegaram à aplicação. `traceId` do Problem é esse valor. Não usar esse campo como autenticação nem aceitar texto arbitrário que permita quebra de log.

Evento de log por requisição e por chamada de fornecedor: serviço, commit/version, correlação, rota modelada, método, status, duração, número de IDs e código de resultado. Remover PII e segredos. Logs de diagnóstico podem conter stack no backend com cuidado de redaction; não retorná-la ao cliente.

## 7. Comandos e testes futuros

```powershell
npm run contracts:validate
npm run test:contracts
npm run test:system
npm run smoke
```

`contracts:validate` valida OpenAPI e exemplos. `test:contracts` verifica produtor e consumidor com casos válidos e inválidos; não se limita a verificar que o YAML parseia. `test:system` sobe/processa as duas aplicações com os bancos reais e encerra ambiente isolado. Para falhas de fornecedor, usar stub controlado apenas nos testes específicos, mantendo um cenário feliz com os serviços reais.

## 8. Critérios de sucesso

- INT01: fluxo canônico completa de ponta a ponta e leitura preserva o resultado.
- INT02: um POST em Pedidos causa uma chamada de lote; lote resolve por uma consulta lógica de produtos.
- INT03: todos os erros da matriz têm teste e nenhuma persistência indevida.
- INT04: mudar preço afeta novo pedido, não o antigo; parar Catálogo não impede GETs em Pedidos.
- INT05: contrato rejeita respostas incompletas/duplicadas e não permite preço do cliente.
- INT06: correlação atravessa os serviços e erro público não contém segredo, SQL ou stack.

Sempre manter compatibilidade v1 e atualizar contratos junto com código. Reespecificar antes de adicionar cache de preço, retry, idempotência, fila ou transação distribuída.
