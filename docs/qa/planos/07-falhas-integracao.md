# Falhas do fornecedor, SQL e recuperação

Requisitos: ORD05/ORD08, INT03/INT06, Q30-Q40/Q43/Q44.

## Objetivo e escopo

Falhas do fornecedor, SQL e recuperação. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Somente containers/volumes do projeto de QA; stubs locais para respostas inválidas.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=7`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## ERR01 — Catálogo parado não impede histórico nem readiness SQL

1. Criar pedido; parar somente Catálogo de QA; testar criação/GET/lista/health; reiniciar em finally.
2. Conferir: Sem insert: recusa de conexão gera 503 CATALOG_UNAVAILABLE; rede que excede 2s gera 504 CATALOG_TIMEOUT. GET/lista/live/ready de Pedidos continuam 200; recuperação.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem insert: recusa de conexão gera 503 CATALOG_UNAVAILABLE; rede que excede 2s gera 504 CATALOG_TIMEOUT. GET/lista/live/ready de Pedidos continuam 200; recuperação.

**Evidência exigida:** registro de ERR01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR02 — Fornecedor inválido, 4xx, 5xx, corpo excessivo e timeout

1. Executar suíte do cliente HTTP com stubs, limite descomprimido 256KiB e timeout inclusive durante body.
2. Conferir: 502/503/504 corretos, resposta sanitizada, apenas uma chamada, cancelamento observado.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 502/503/504 corretos, resposta sanitizada, apenas uma chamada, cancelamento observado.

**Evidência exigida:** registro de ERR02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR03 — Mongo indisponível e recuperação

1. Parar Mongo de QA; ler live/ready/lista/lote; criar pedido; reiniciar e aguardar readiness.
2. Conferir: Live 200; ready/lista/lote 503 sanitizados; Pedidos 503 sem persistir; serviço recupera.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Live 200; ready/lista/lote 503 sanitizados; Pedidos 503 sem persistir; serviço recupera.

**Evidência exigida:** registro de ERR03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR04 — PostgreSQL indisponível e recuperação do processo

1. Reiniciar Orders para descartar conexões HTTP ociosas; aquecer Catálogo; fechar conexões do harness; parar postgres de QA; testar live/ready/GET/lista/POST; reiniciar.
2. Conferir: Live 200; ready DOWN; GET/lista/POST 503 PERSISTENCE_UNAVAILABLE; sem queda do processo; recuperação.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Live 200; ready DOWN; GET/lista/POST 503 PERSISTENCE_UNAVAILABLE; sem queda do processo; recuperação.

**Evidência exigida:** registro de ERR04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR05 — Classificação de erro SQL inesperado e rollback

1. Instalar trigger sintético que lança P0001 em order_items; POST; verificar zero resíduos; remover trigger em finally.
2. Conferir: 500 INTERNAL_ERROR para exceção inesperada; transação revertida e conexão reutilizável.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 500 INTERNAL_ERROR para exceção inesperada; transação revertida e conexão reutilizável.

**Evidência exigida:** registro de ERR05 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR06 — Lock timeout SQL e liberação de conexão

1. Manter LOCK ACCESS EXCLUSIVE via conexão admin; criar; rollback do lock; repetir criação.
2. Conferir: 503 PERSISTENCE_UNAVAILABLE em até 7s; nenhuma linha nova; reteste cria normalmente.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 503 PERSISTENCE_UNAVAILABLE em até 7s; nenhuma linha nova; reteste cria normalmente.

**Evidência exigida:** registro de ERR06 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ERR07 — Queda durante COMMIT: limite e observabilidade

1. Usar proxy TCP local para suprimir o ACK depois que PostgreSQL confirmar COMMIT; verificar resposta, linha persistida, ausência de retry e log sanitizado.
2. Conferir: Uma chamada 503 PERSISTENCE_UNAVAILABLE; exatamente um pedido e duas linhas já confirmados no banco; processo vivo e log marca resultado ambíguo sem retry.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Uma chamada 503 PERSISTENCE_UNAVAILABLE; exatamente um pedido e duas linhas já confirmados no banco; processo vivo e log marca resultado ambíguo sem retry.

**Evidência exigida:** registro de ERR07 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
