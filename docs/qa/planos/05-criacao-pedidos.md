# Criação e validação de pedidos

Requisitos: ORD01/ORD04/ORD06, Q01/Q11-Q18/Q29/Q42.

## Objetivo e escopo

Criação e validação de pedidos. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Duas APIs e bancos de QA; contagem SQL antes/depois de cada rejeição.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=5`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## ORD01 — Criação canônica, Location e snapshot SQL

1. POST 2 teclados + mouse; comparar 201 com GET e tabelas SQL.
2. Conferir: Subtotal 50000, desconto 5000, total 45000; 2 linhas; snapshot completo e UTC.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Subtotal 50000, desconto 5000, total 45000; 2 linhas; snapshot completo e UTC.

**Evidência exigida:** registro de ORD01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD02 — Correlação atravessa criação até Catálogo

1. Criar sem header, com texto inválido, UUID maiúsculo e UUID válido; localizar cada evento de lote no log do Catálogo.
2. Conferir: O UUID devolvido por Pedidos é o mesmo registrado no Catálogo em todas as variantes.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** O UUID devolvido por Pedidos é o mesmo registrado no Catálogo em todas as variantes.

**Evidência exigida:** registro de ORD02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD03 — Cliente obrigatório, trim, Unicode e e-mail ASCII

1. Enviar campos ausentes/null/vazios, nome com controle/121 pontos, e-mails inválidos; aceitar 120 emojis e caixa preservada.
2. Conferir: 400 e contagem SQL inalterada nas rejeições; texto válido normalizado e persistido.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 e contagem SQL inalterada nas rejeições; texto válido normalizado e persistido.

**Evidência exigida:** registro de ORD03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD04 — Quantidades e cardinalidade sem coerção

1. Enviar quantidade 0,-1,10001,1.5,string,null,bool; itens vazio/null/101. Aceitar 1 e 10000; 100 IDs válidos ausentes devem chegar à regra 422.
2. Conferir: 400 em estrutura inválida; limites válidos aceitos; nenhum registro nas rejeições.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 em estrutura inválida; limites válidos aceitos; nenhum registro nas rejeições.

**Evidência exigida:** registro de ORD04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD05 — UUIDs, campos fechados, duplicação e inelegibilidade

1. Enviar ID inválido/objeto/null/LF/maiúsculo; extras na raiz/cliente/item; repetidos; inativo e ausente juntos.
2. Conferir: 400 nos inválidos/extras; 422 duplicados/inelegíveis e erros de ambos os itens; zero inserts.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 nos inválidos/extras; 422 duplicados/inelegíveis e erros de ambos os itens; zero inserts.

**Evidência exigida:** registro de ORD05 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD06 — Parser HTTP, mídia e aliases de rota

1. Enviar JSON quebrado e >64KiB; text/plain na rota canônica, com barra final e caixa variante.
2. Conferir: 400 INVALID_JSON, 413 PAYLOAD_TOO_LARGE e 415 UNSUPPORTED_MEDIA_TYPE com Problem e correlação.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 400 INVALID_JSON, 413 PAYLOAD_TOO_LARGE e 415 UNSUPPORTED_MEDIA_TYPE com Problem e correlação.

**Evidência exigida:** registro de ORD06 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ORD07 — SQL-like como texto e repetição explícita de POST

1. Criar nome com aspas/SQL; consultar; reenviar o mesmo POST duas vezes.
2. Conferir: Texto literal, tabelas intactas; POST não idempotente cria IDs distintos, conforme contrato.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Texto literal, tabelas intactas; POST não idempotente cria IDs distintos, conforme contrato.

**Evidência exigida:** registro de ORD07 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
