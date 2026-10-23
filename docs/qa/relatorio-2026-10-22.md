# Relatório final de QA — 22/10/2026

**Estado:** concluída com limitações externas documentadas. Foram planejados e tentados os 47 casos: 45 `PASSOU`, 0 `FALHOU` no estado final, 1 `BLOQUEADO` e 1 `NÃO EXECUTADO`. Falhas intermediárias foram mantidas no histórico de tentativas e aprovadas após correção/reteste.

Data humana: America/Sao_Paulo; horários das tentativas em UTC. Base: branch `feature/t02-bootstrap`, commit `90a6850714d3c7812366807349c2a3498ecef762`, checkout limpo no início. O HEAD permaneceu nesse commit; nenhuma alteração foi commitada, enviada ou mesclada.

## Escopo e ambiente

A campanha cobriu as funcionalidades implementadas nas duas APIs e bancos reais de QA: Catálogo .NET/MongoDB e Pedidos TypeScript/PostgreSQL. Foram verificados contratos, limites, dinheiro/descontos, snapshots, paginação, permissões dos bancos, migrações, falhas e recuperação. Recursos não implementados — como autenticação, tenants, estoque, pagamento, edição/exclusão de pedido e interface de usuário — não foram tratados como funcionalidades existentes.

Ambiente isolado `desafio-qa-20261022`, volumes próprios e dados sintéticos. Orders respondeu em `http://127.0.0.1:33000`; Catálogo em `http://127.0.0.1:38080`; PostgreSQL em 35432 e MongoDB em 37017. A composição preexistente nas portas 3000/8080/5432/27017 foi preservada. Todas as revisões ficaram em loopback; produção não recebeu tráfego. Readiness retornou 200 nas imagens aprovadas.

## Correções e retestes

Foram corrigidos: UUID com LF final aceito pelo Catálogo; Problem Details de mídia na rota com barra final; correlação normalizada não propagada; filtro de mídia inconsistente em aliases do Orders; timeout de seleção Mongo classificado como 500; processo encerrado por erro em conexão PostgreSQL ociosa; SQLSTATE inesperado mascarado como 503; e processo encerrado por perda de conexão ativa durante COMMIT. Os últimos casos também ganharam testes de classificação, rollback, ausência de retry e log explícito para resultado ambíguo.

Os ajustes de harness corrigiram comparação de instantes UTC, helper incompatível do mongosh, classificação de recusa versus timeout, sequência de ERR04 que concorria com o timeout do Catálogo, expectativa de camada no teste de integração e dependências do validador Python. Causas, provas antes/depois e limites estão em [correções](correcoes.md); cada tentativa e sua evidência estão em [resultados por caso](resultados.md) e [execucao.json](execucao.json).

## Verificações finais

- TypeScript: `npm test` — 65 testes aprovados; `npm run typecheck`; `npm run lint`; build executado pelo `pretest`.
- PostgreSQL real: `npm run test:integration` — 6 testes aprovados contra `orders_test`, incluindo rollback, snapshots, páginas, papéis e timeout.
- .NET: formatação sem diferenças, build Release e 28 testes aprovados.
- Smoke e documentação: smoke das APIs, OpenAPI 3.1, exemplos, semântica monetária, IDs de rastreabilidade e links locais aprovados. GAT04 encontrou 369 links Markdown locais válidos; o validador usou venv QA fora do repositório, com dependências fixadas.
- ERR07: o proxy suprimiu um ACK depois do COMMIT confirmado; verificou-se uma chamada, um pedido e dois itens persistidos, resposta 503, processo vivo e log `Order commit outcome ambiguous retry=false`. A API não promete execução exatamente uma vez e não repetiu a escrita.

Os logs de execução dos gates são vinculados em [resultados](resultados.md); a revisão documental gerada pelo GAT04 está em `docs/evidencias/revisao-documental.json`.

## Revisões QA publicadas

Imagens construídas e executadas somente no Compose local. Os endereços e a readiness são os descritos acima; em todas as evidências de publicação consta `ProductionTraffic=none`.

| Revisão | Serviço | Digest da imagem | Resultado |
|---|---|---|---|
| B01 | Catálogo | `sha256:bbfecbfff5128c89d5a20e18e5991e2ca1437550b77242df9965ce92179a9e29` | pronta; reteste CAT04 aprovado |
| B02 | Catálogo | `sha256:eada5e94c9efcea3b06027561132d7205b5d422829b201d7d118cc3e671e14` | pronta; reteste BAT04 aprovado |
| B03 | Pedidos | `sha256:ad8aa659ef003001708203a95850ff6d7ccfc3dade3d0c20308d27ed31c3ef70` | pronta; reteste ORD02 aprovado |
| B04 | Pedidos | `sha256:706c63d0e14d37f6742275b319ccfe68e7cc367d74af468251aa3114f7dad97c` | pronta; reteste ORD06 aprovado |
| B05 | Catálogo | `sha256:b19981f3ffe71fcbd745cb653e5ca03694a221f998e8667a2c9bfdc7af6453ed` | pronta; reteste ERR03 aprovado |
| B06 | Pedidos | `sha256:e7db7c95d21128848ab5840c5f83196bfaab6c63d322e6ca75a6cd469a5aa78c` | pronta; reteste ERR04 aprovado |
| B07 | Pedidos | `sha256:fb87a60e3882ae2f245779a296ff2e2812decb38738e97f06d01e888b5fa7362` | pronta; reteste ERR05 aprovado |
| B08 | Pedidos | `sha256:1e187cd740c2a87ed1c621c63b4116fd200294776b38b9605917ae176dcae7c1` | pronta; tentativa inicial ERR07 expôs erro em conexão ativa; substituída |
| B09 | Pedidos | `sha256:ddd5d7e43c6561c2a34910e580bdf3220d37e58968cd59d11648b33bbf373812` | pronta; reteste ERR07 aprovado; imagem QA final |

As evidências individuais de publicação e prontidão estão em `docs/qa/evidencias/B*-publicacao.txt` e `B*-revisao.txt`.

## Limitações restantes

GAT06 está `BLOQUEADO`: `git remote` está vazio e não existe CI hospedada, registry ou destino de QA cloud configurado para este SHA. A publicação local está comprovada; nenhuma publicação externa foi feita.

GAT07 está `NÃO EXECUTADO`: não há harness para 1.000 criações com 10 itens nem metas/thresholds de cobertura configurados. DAT06 mediu separadamente consultas Mongo em lote de 1, 10 e 100 IDs; esse resultado não substitui carga de escrita nem porcentagem de cobertura. Links compartilháveis e pacote de candidatura também dependem de entrega externa.

## Índice da campanha

- [Planos por área](planos/)
- [Resultados por caso e histórico](resultados.md)
- [Bloqueios e correções](correcoes.md)
- [Registro estruturado e evidências](execucao.json)
