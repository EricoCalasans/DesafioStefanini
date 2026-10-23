# Catálogo: listagem e detalhe

Requisitos: CAT01/CAT06, Q23.

## Objetivo e escopo

Catálogo: listagem e detalhe. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

MongoDB de QA com os quatro produtos do seed.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=2`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## CAT01 — Lista ativa, ordenação, páginas e vazio

1. GET lista padrão, pageSize=1 páginas 1/2 e página 1000000.
2. Conferir: Somente três ativos em ordem de ID; metadados corretos; página além do fim vazia.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Somente três ativos em ordem de ID; metadados corretos; página além do fim vazia.

**Evidência exigida:** registro de CAT01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## CAT02 — Paginação inválida e sem conversão silenciosa

1. Consultar page 0,-1,1.5,abc,1000001; pageSize 0/101; parâmetro extra, repetido e objeto.
2. Conferir: Todas as variações retornam 400 VALIDATION_ERROR.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Todas as variações retornam 400 VALIDATION_ERROR.

**Evidência exigida:** registro de CAT02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## CAT03 — Detalhe ativo, inativo, ausente e ID inválido

1. GET os IDs de teclado/inativo, UUID ausente e texto inválido.
2. Conferir: 200 nos existentes, active=false no inativo; 404 PRODUCT_NOT_FOUND; 400 VALIDATION_ERROR.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 200 nos existentes, active=false no inativo; 404 PRODUCT_NOT_FOUND; 400 VALIDATION_ERROR.

**Evidência exigida:** registro de CAT03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## CAT04 — UUID canônico sem sufixo de controle

1. GET e lote com UUID terminado em LF; consultar UUID maiúsculo alfabético.
2. Conferir: 400 para todo ID não canônico; não consultar nem classificar como ausência.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 para todo ID não canônico; não consultar nem classificar como ausência.

**Evidência exigida:** registro de CAT04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## CAT05 — Estado vazio sem produtos ativos

1. Desativar os três ativos somente em QA; consultar lista e detalhe; restaurar em finally.
2. Conferir: Lista vazia com totalItems=0/totalPages=0; detalhe continua 200 active=false.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Lista vazia com totalItems=0/totalPages=0; detalhe continua 200 active=false.

**Evidência exigida:** registro de CAT05 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
