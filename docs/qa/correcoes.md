# Bloqueios e correções

## B01 — UUID com LF aceito no Catálogo (CAT04)

- Reprodução inicial: `GET /api/v1/products/11111111-1111-4111-8111-111111111111%0A` no QA isolado retornou 404 `PRODUCT_NOT_FOUND`, esperado 400. A campanha parou antes de CAT05.
- Causa: em .NET, a âncora `$` pode corresponder antes de um LF final. O domínio validava esse UUID como canônico e chegava ao repositório com um ID diferente.
- Prova antes da correção: o teste `Product_ids_with_trailing_control_characters_are_rejected_before_lookup` falhou em `Assert.False` para `\n`; `\r\n` já era recusado. Comando: `dotnet test Catalog.sln -c Release --filter FullyQualifiedName~Product_ids_with_trailing_control_characters` (1 falhou/1 passou).
- Correção: usar `\z` como fim absoluto no regex de `Product.IsCanonicalId`. Sem alteração de regra de negócio ou contrato.
- Regressão: duas variações .NET exigem rejeição antes da consulta; teste HTTP de Pedidos confirmou que UUID e paginação com LF/CRLF já são recusados nessa stack. Não se aplicou a ela uma correção desnecessária.
- Validação local após correção: 25 testes .NET passaram; verificação de formatação executada. Reteste no container de QA será registrado na segunda tentativa de CAT04.

Reteste CAT04: PASSOU no container `sha256:bbfecbfff5128c89d5a20e18e5991e2ca1437550b77242df9965ce92179a9e29`. Publicação e identificação em `evidencias/B01-publicacao.txt` e `evidencias/B01-revisao.txt`. Somente portas de QA/loopback, sem tráfego de produção.

## B02 — Problem Details ausente com barra final (BAT04)

- Reprodução: `POST /api/v1/products/query/`, `Content-Type: text/plain`, body `{}` devolveu 415 com corpo vazio e sem mídia, enquanto a rota canônica tinha o erro definido no contrato.
- Causa: o middleware comparava caminho exato, mas o roteador .NET também aceita barra final. A variante escapava da padronização e era encerrada pelo roteamento.
- Regressão antes: `dotnet test ... --filter FullyQualifiedName~Unsupported_media_type` registrou 1 falha/2 aprovações; [log](evidencias/B02-antes.txt). A variação de caixa já funcionava.
- Correção: normalizar a barra final somente para identificar a rota coberta pelo middleware, mantendo o caminho original no Problem Details.
- Aceite: três variantes retornam 415 `application/problem+json`; suíte .NET/formatação e reteste BAT04 na imagem de QA antes da retomada.

Reteste BAT04: PASSOU na revisão `sha256:eada5e94c9efcea3b06027561132d7200b5b5d422829b201d7d118cc3e671e14`; 27 testes .NET e formatação passaram. [Publicação](evidencias/B02-publicacao.txt), [readiness/revisão](evidencias/B02-revisao.txt).

## H01 — Comparação textual de datas equivalentes (ORD01, harness)

- A criação retornou `2026-10-21T12:00:00+00:00` e o GET retornou `2026-10-21T12:00:00.000Z`: mesmo instante e UTC em ambos, conforme o contrato date-time. Valores monetários e snapshots não divergiram.
- A comparação de JSON literal do harness era mais restritiva que o requisito. Corrigida para normalizar somente campos de data `*At` antes da igualdade do snapshot, preservando as respostas brutas no JSON de evidências.
- Não é defeito do produto. Reteste ORD01 exigido antes de prosseguir.

Reteste ORD01: PASSOU com o mesmo subtotal/desconto/total, duas linhas reais no SQL e igualdade semântica do snapshot.

## B03 — Correlação normalizada não propagada (ORD02)

- Evidência real: criação sem `X-Correlation-Id` devolveu UUID que não apareceu no evento correspondente de lote do Catálogo. A sequência parou em ORD02.
- Causa: middleware guardava `request.correlationId`, mas o controller obtinha `@Headers('x-correlation-id')`, recebendo o valor original ausente/inválido/maiúsculo.
- Prova antes: três testes HTTP falharam para header ausente, inválido e maiúsculo ([log](evidencias/B03-antes.txt)).
- Correção: controller usa o valor normalizado da requisição, já gerado pelo middleware; o mesmo valor vai ao fornecedor e ao repositório.
- Aceite: três regressões passam, suíte/lint/tipos/build TS aprovados, publicação local e reteste ORD02 comparando UUID público com log do Catálogo.

Reteste ORD02: PASSOU nas quatro variantes no container `sha256:ad8aa659ef003001708203a95850ff6d7ccfc3dade3d0c20308d27ed31c3ef70`. Passaram 37 testes TS, build, lint e tipos. [Publicação](evidencias/B03-publicacao.txt), [revisão](evidencias/B03-revisao.txt).

## B04 — Mídia incorreta aceita por alias de criação (ORD06)

- Reprodução: POST `text/plain` para `/api/v1/orders/` retornou 400 `VALIDATION_ERROR`, enquanto o contrato requer 415 `UNSUPPORTED_MEDIA_TYPE`. A rota com outra caixa também escapava do filtro exato.
- Causa: filtro de mídia em `main.ts` reconhecia somente o texto exato da rota, enquanto Express roteia barra final/caixa alternativa.
- Prova antes: teste inicia o processo real `dist/main.js` e envia HTTP, sem montar uma cópia do bootstrap; falhou com 400 em vez de 415 ([log](evidencias/B04-antes.txt)).
- Correção: filtro reconhece as mesmas variantes da rota de criação. Teste cobre caminho canônico, barra final e caixa alternativa.
- Aceite: suíte TS/build/lint/tipos e reteste ORD06 no container publicado de QA.

Reteste ORD06: PASSOU; 38 testes TS, tipos/lint/build aprovados. [Publicação B04](evidencias/B04-publicacao.txt) e [readiness/revisão](evidencias/B04-revisao.txt).

## H02 — Helper incompatível com mongosh (GET03, harness)

- O script usou `assert.eq`, helper do shell antigo indisponível neste mongosh. Comando devolveu `TypeError` e a campanha parou; a fixture foi restaurada pelo `finally`.
- Correção restrita ao harness: helper explícito `qaAssert` para igualdade/condições, sem depender de globals do shell.
- Não é defeito do produto. Reteste GET03 exigido; a alteração real de preço e restauração continuam no Mongo isolado.

Reteste GET03: PASSOU; pedido antigo preservou 20.000/versão1 e total 54.000; novo usou 30.000/versão2 e total 81.000. Fixture restaurada.

## H03 — Parada Docker produz timeout de rede, não recusa imediata (ERR01, roteiro/ambiente)

- Ao parar o container, a rede Docker não respondeu dentro do deadline: HTTP 504 `CATALOG_TIMEOUT` após cerca de 2.000 ms. A implementação classifica esse mecanismo conforme a spec de integração; parar um container não garante `ECONNREFUSED` imediato.
- Ajuste justificado do roteiro: com o container parado, aceitar somente o par correto 503/`CATALOG_UNAVAILABLE` para recusa ou 504/`CATALOG_TIMEOUT` para expiração, exigindo duração mínima de 1.900 ms no último e zero gravação em ambos.
- Não se relaxou o mapeamento do consumidor: ERR02 continua exigindo 503 para erro imediato de conexão/5xx e 504 para timeout controlado. GET/lista/health e recuperação seguem obrigatórios no cenário real.

Reteste ERR01: PASSOU com 504 após 2s, zero insert, histórico/lista/live/ready de Pedidos 200 e criação após recuperação. ERR02 passou com respostas inválidas, calendário/UTC, duplicações, UTF-8, rede/5xx e timeout de body; caso de uso não persistiu em 502/503/504.

## B05 — Timeout de seleção MongoDB vira 500 (ERR03)

- Com o Mongo de QA parado, live continuou 200 e readiness foi 503; a lista retornou 500 `INTERNAL_ERROR` após aproximadamente 1s. Log interno: `ExceptionType=TimeoutException`.
- Causa: `MongoProductRepository.ExecuteAsync` encapsulava somente `MongoException`; o driver usa `System.TimeoutException` na seleção de servidor.
- Prova antes: teste com driver real e endereço local indisponível retornou a exceção errada ([log](evidencias/B05-antes.txt)).
- Correção: tratar também `TimeoutException` na fronteira de persistência, preservando cancelamento explícito do cliente e sanitização do middleware.
- Aceite: teste do driver, suíte .NET/formatação, publicação local e reteste ERR03 com Mongo parado/recuperado.

Reteste ERR03: PASSOU na revisão [B05](evidencias/B05-revisao.txt). Live 200, readiness/lista/lote 503, criação de Pedidos recusada sem insert e recuperação dos dois serviços.

## B06 — Conexão ociosa derruba Pedidos quando PostgreSQL para (ERR04)

- Primeiro sinal: `fetch failed` ao testar o processo; `RestartCount` do container passou de 0 para 1. A parada foi somente no banco de QA; `finally` recuperou o banco.
- Causa confirmada no log sanitizado: `Unhandled 'error' event` / `terminating connection due to administrator command`. O `pg.Pool` não tinha listener para erro em conexão ociosa.
- Prova antes: emissão do evento de erro no pool real montado pelo AppModule lançou exceção ([teste](evidencias/B06-antes.txt)); [log do container](evidencias/B06-pool-antes.txt).
- Correção: listener no pool registra mensagem fixa e sanitizada, permitindo remover a conexão morta sem derrubar o processo. Sem retry de escrita nem mudança de transação.
- Aceite: regressão do pool, suíte TS/build/lint/tipos e reteste ERR04 exigindo também `RestartCount` inalterado.

Reteste ERR04: PASSOU na imagem B06 `sha256:e7db7c95d21128848ab5840c5f83196bfaab6c63d322e6ca75a6cd469a5aa78c`; `RestartCount` não aumentou, live permaneceu 200 e houve recuperação.

## H04 — Sequência de ERR04 mascarava a falha do PostgreSQL (harness)

- Após parar o banco, readiness e cada leitura aguardavam cerca de 1 s pelo timeout de conexão. O POST executado depois retornava 504 `CATALOG_TIMEOUT`, embora uma consulta direta ao Catálogo pela rede do container respondesse 200; esse resultado não isolava a indisponibilidade PostgreSQL pedida pelo caso.
- Correção restrita ao roteiro: executar o POST logo após liveness e antes das verificações de readiness/GET, aproveitando a janela da conexão HTTP já aquecida. O POST volta a testar primeiro a fronteira de criação e precisa produzir 503 `PERSISTENCE_UNAVAILABLE`; leituras, recuperação e contagem de reinícios continuam verificadas.
- Reteste ERR04: PASSOU. As tentativas anteriores continuam no histórico para mostrar a divergência do harness.

## B07 — Exceção SQL inesperada classificada como indisponibilidade (ERR05)

- Reprodução: trigger QA lança SQLSTATE `P0001` durante inclusão de itens. O repositório revertia a transação, mas mapeava qualquer erro para 503, apesar de ser uma falha interna inesperada.
- Correção: classificar apenas códigos de conexão, falta de recursos, intervenção/timeout e lock timeout como indisponibilidade sanitizada 503. Outros erros SQL são propagados ao filtro HTTP como 500 `INTERNAL_ERROR`; logs registram somente tipo, código e traceId. Não há exposição da mensagem SQL.
- Regressões: P0001 propagado após rollback; `55P03` e `ECONNREFUSED` continuam 503; a integração direta verifica SQLSTATE, enquanto ERR05 valida 500 no HTTP, zero linhas residuais e reutilização da conexão.
- Validação: 65 testes TS, build, typecheck e lint passaram. Reteste ERR05 PASSOU na revisão [B07](evidencias/B07-revisao.txt).

## B08 — Conexão ativa perdida no COMMIT encerrava o processo (ERR07)

- Um proxy TCP local encaminhou COMMIT ao PostgreSQL e suprimiu o ACK que confirma sua conclusão. O banco continha o pedido, mas o processo Orders encerrou com erro não tratado antes de responder. O listener de pool existente cobria somente conexões ociosas.
- Correção: cada conexão adquirida durante a escrita recebe um listener de erro limitado à operação. Se a conexão cai durante COMMIT, o resultado fica explicitamente ambíguo: não tenta rollback após o commit, não repete a escrita, registra `Order commit outcome ambiguous retry=false` com dados sanitizados e devolve 503.
- Regressão unitária confirma evento tratado, um único COMMIT e ausência de ROLLBACK enganoso. O teste TCP confirma 1 ACK suprimido, exatamente 1 pedido e 2 itens persistidos, uma resposta 503, log explícito e processo ainda vivo.
- Validação: 65 testes TS, build, typecheck e lint passaram. Reteste ERR07 PASSOU na revisão [B09](evidencias/B09-revisao.txt), publicada somente no QA isolado.

## H05 — Expectativa incompatível com a camada testada (DAT01, teste)

- A integração chama o caso de uso/repositório diretamente; não atravessa o filtro HTTP que transforma uma exceção SQL inesperada em 500 `INTERNAL_ERROR`.
- Correção: a integração verifica o SQLSTATE `P0001` propagado e rollback. O resultado HTTP 500 permanece coberto pelo caso real ERR05.
- Reteste DAT01 PASSOU: os seis testes contra `orders_test` foram aprovados.

## H06 — Validador documental sem dependência no Python global (GAT04, ambiente)

- GAT04 parou antes de validar documentação porque `openapi-spec-validator` não estava instalado no Python ativo. As três dependências estavam fixadas no arquivo versionado `docs/validation/requirements-documentacao.txt`.
- Correção: criar `venv-documentacao` fora do repositório dentro da pasta de QA local, instalar apenas as versões fixadas e usar esse executável no validador runtime/documental. `preparar.ps1` agora reproduz a instalação sem alterar Python global.
- Retestes GAT01 e GAT04 PASSARAM; o validador documentou OpenAPI, exemplos, links locais, rastreabilidade e aritmética.
