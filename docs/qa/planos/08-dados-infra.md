# Persistência, papéis, migrações e eficiência

Requisitos: CAT04, ORD05/ORD06, Q25/Q27/Q28/Q37-Q41/Q45.

## Objetivo e escopo

Persistência, papéis, migrações e eficiência. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

PostgreSQL e MongoDB de QA; usuário de administração restrito ao harness local.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=8`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## DAT01 — Integração PostgreSQL: rollback, snapshots, páginas e papéis

1. Executar suíte de integração com URLs de QA apontando exclusivamente orders_test.
2. Conferir: Testes reais aprovados; runtime sem UPDATE/DELETE/DDL/metadados; empate de data ordenado por ID.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Testes reais aprovados; runtime sem UPDATE/DELETE/DDL/metadados; empate de data ordenado por ID.

**Evidência exigida:** registro de DAT01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## DAT02 — Migração repetida e concorrente

1. Executar dois jobs orders-migrate simultâneos; comparar versão/checksum SQL.
2. Conferir: Ambos verificam migration sem reaplicar; uma versão, checksum inalterado.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Ambos verificam migration sem reaplicar; uma versão, checksum inalterado.

**Evidência exigida:** registro de DAT02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## DAT03 — Seed repetido preserva alteração existente

1. Alterar preço sintético em QA; executar bootstrap duas vezes; verificar quatro produtos e preço; restaurar.
2. Conferir: Sem duplicação/sobrescrita; índices e validator mantidos.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem duplicação/sobrescrita; índices e validator mantidos.

**Evidência exigida:** registro de DAT03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## DAT04 — Validator e índice único rejeitam dados inválidos

1. Tentar preço zero/double, moeda inválida, controle e SKU duplicado no Mongo de QA; limpar UUID sintético.
2. Conferir: Código 121 nos documentos inválidos e 11000 em SKU repetido; nada residual.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Código 121 nos documentos inválidos e 11000 em SKU repetido; nada residual.

**Evidência exigida:** registro de DAT04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## DAT05 — Permissão Mongo somente leitura

1. Autenticar como catalog_runtime e tentar inserir documento válido em QA.
2. Conferir: Acesso recusado código 13; leitura permitida.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Acesso recusado código 13; leitura permitida.

**Evidência exigida:** registro de DAT05 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## DAT06 — Uma consulta de lote e índices reais

1. Inspecionar explain do lote/página; contar find por requisição usando profiler restaurado no final.
2. Conferir: Lotes 1/10/100: um find; plano _id_ para lote e ix_products_active_id para página.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Lotes 1/10/100: um find; plano _id_ para lote e ix_products_active_id para página.

**Evidência exigida:** registro de DAT06 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
