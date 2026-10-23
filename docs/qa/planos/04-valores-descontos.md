# Dinheiro, desconto e agregado

Requisitos: ORD02, Q02-Q08.

## Objetivo e escopo

Dinheiro, desconto e agregado. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Build TypeScript pronto; oráculos literais em centavos.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=4`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## MON01 — Limiar inclusivo e arredondamento único HALF_UP

1. Calcular 49999/50000/50001 com taxa 1000; 101 a 500bps; 105 a 1000bps; reordenar linhas.
2. Conferir: 0/5000/5000, 5, 11 centavos; soma independe de ordem.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 0/5000/5000, 5, 11 centavos; soma independe de ordem.

**Evidência exigida:** registro de MON01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## MON02 — Desativação, taxa zero/100%, limites e precisão

1. Executar suíte money com extremos de quantidade/preço/subtotal e JSON seguro.
2. Conferir: Sem total negativo nem perda de precisão; entradas fora do domínio recusadas.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem total negativo nem perda de precisão; entradas fora do domínio recusadas.

**Evidência exigida:** registro de MON02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## MON03 — Orquestração: duplicados, inelegíveis e overflow sem salvar

1. Executar testes do caso de uso com spy de Catálogo e repositório.
2. Conferir: Uma consulta antes de salvar; duplicados não consultam; ausentes/inativos/overflow não persistem.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Uma consulta antes de salvar; duplicados não consultam; ausentes/inativos/overflow não persistem.

**Evidência exigida:** registro de MON03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
