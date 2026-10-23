# Catálogo: consulta em lote e limites HTTP

Requisitos: CAT02/CAT03/CAT05, Q24-Q26.

## Objetivo e escopo

Catálogo: consulta em lote e limites HTTP. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Catálogo de QA saudável; IDs do seed e UUID ausente.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=3`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## BAT01 — Lote misto, inatividade e ordem determinística

1. POST IDs invertidos: ausente, inativo, mouse e teclado.
2. Conferir: 200; produtos encontrados ordenados, inativo explícito, ausente separado, observedAt UTC.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 200; produtos encontrados ordenados, inativo explícito, ausente separado, observedAt UTC.

**Evidência exigida:** registro de BAT01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## BAT02 — Lotes de 1 e 100 IDs; limite de 101

1. POST 1 ID; 100 UUIDs distintos (seed + ausentes); repetir com 101.
2. Conferir: 200, cobertura exata dos 100 IDs; 400 com 101.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 200, cobertura exata dos 100 IDs; 400 com 101.

**Evidência exigida:** registro de BAT02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## BAT03 — Forma, obrigatórios, duplicados e tentativa NoSQL

1. Enviar vazio, null, array raiz, objeto/operador no ID, campo desconhecido e IDs repetidos.
2. Conferir: 400 para estrutura inválida; 422 DUPLICATE_PRODUCT_IDS para duplicação.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 para estrutura inválida; 422 DUPLICATE_PRODUCT_IDS para duplicação.

**Evidência exigida:** registro de BAT03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## BAT04 — JSON, mídia e limite do corpo

1. Enviar JSON quebrado, text/plain, corpo de 65537 bytes; repetir a mídia com barra final na rota.
2. Conferir: 400 INVALID_JSON, 415 UNSUPPORTED_MEDIA_TYPE, 413 PAYLOAD_TOO_LARGE nas variantes roteáveis.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 INVALID_JSON, 415 UNSUPPORTED_MEDIA_TYPE, 413 PAYLOAD_TOO_LARGE nas variantes roteáveis.

**Evidência exigida:** registro de BAT04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
