# Contratos, regressão e gates de entrega

Requisitos: INT05, Q46-Q50.

## Objetivo e escopo

Contratos, regressão e gates de entrega. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Casos anteriores resolvidos; Python com PyYAML/jsonschema; acesso externo somente se configurado.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=9`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## GAT01 — Contratos runtime e exemplos OpenAPI

1. Executar validador Python canônico contra URLs de QA.
2. Conferir: Requests/respostas reais aderem aos schemas OpenAPI e códigos comuns.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Requests/respostas reais aderem aos schemas OpenAPI e códigos comuns.

**Evidência exigida:** registro de GAT01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT02 — Regressão TypeScript, lint, tipos e build

1. Executar npm test, typecheck e lint no projeto Pedidos.
2. Conferir: Todas as suítes, tipos, lint e build (pretest) aprovados.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Todas as suítes, tipos, lint e build (pretest) aprovados.

**Evidência exigida:** registro de GAT02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT03 — Regressão .NET, formatação e build

1. Executar dotnet format --verify-no-changes, build e testes Release.
2. Conferir: Sem alteração necessária de formato; build e testes aprovados.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem alteração necessária de formato; build e testes aprovados.

**Evidência exigida:** registro de GAT03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT04 — Smoke e documentação

1. Executar smoke contra QA e validador documental; consultar documentos Swagger.
2. Conferir: Smoke e documentação aprovados; operações de API documentadas.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Smoke e documentação aprovados; operações de API documentadas.

**Evidência exigida:** registro de GAT04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT05 — Logs sem dados pessoais ou segredos

1. Inspecionar logs das APIs após entradas sintéticas, falhas e recuperação.
2. Conferir: Sem nomes/e-mails de clientes, URLs de conexão, senhas, corpo ou SQL.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem nomes/e-mails de clientes, URLs de conexão, senhas, corpo ou SQL.

**Evidência exigida:** registro de GAT05 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT06 — CI hospedada, release e publicação externa

1. Inspecionar remoto e workflow; verificar execução ligada ao SHA se existir.
2. Conferir: Sem remoto/credencial/destino definido, registrar bloqueio concreto; nunca publicar produção.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Sem remoto/credencial/destino definido, registrar bloqueio concreto; nunca publicar produção.

**Evidência exigida:** registro de GAT06 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GAT07 — Metas de carga/cobertura e artefatos da candidatura

1. Confrontar metas Q46-Q50 e documentação com ferramentas/artefatos realmente presentes.
2. Conferir: Limites externos e medições não executadas ficam explícitos; não inferir porcentagem ou SLO de testes passados.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Limites externos e medições não executadas ficam explícitos; não inferir porcentagem ou SLO de testes passados.

**Evidência exigida:** registro de GAT07 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
