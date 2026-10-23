# Ambiente, configuração e saúde

Requisitos: PLA01/PLA02/PLA06, Q10/Q44/Q48.

## Objetivo e escopo

Ambiente, configuração e saúde. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Docker e toolchains locais; portas 33000, 38080, 35432 e 37017 livres.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=1`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## ENV01 — Toolchains e versões fixadas

1. Executar node/npm/dotnet/docker/python; comparar Node e SDK com os arquivos de seleção.
2. Conferir: Node 24.22.1 e SDK 10.0.402; Docker Engine e Compose acessíveis.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Node 24.22.1 e SDK 10.0.402; Docker Engine e Compose acessíveis.

**Evidência exigida:** registro de ENV01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ENV02 — Builds e configuração estrita de startup

1. Compilar TS; restore bloqueado e build .NET; executar testes de configuração nas duas stacks.
2. Conferir: Builds aprovados; variáveis inválidas/ausentes recusadas sem valores sensíveis.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Builds aprovados; variáveis inválidas/ausentes recusadas sem valores sensíveis.

**Evidência exigida:** registro de ENV02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ENV03 — Publicação local de QA a partir de volumes vazios

1. Validar Compose; construir imagens exclusivas; up --wait no projeto desafio-qa-20261022; consultar estado.
2. Conferir: Seed/migration terminam; APIs disponíveis em loopback; composição anterior preservada.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Seed/migration terminam; APIs disponíveis em loopback; composição anterior preservada.

**Evidência exigida:** registro de ENV03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## ENV04 — Liveness, readiness e correlação básica

1. GET live e ready em ambas as APIs sem header, com UUID válido e com texto inválido.
2. Conferir: 200 UP; UUID gerado, preservado ou substituído; checks postgres/mongo.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 200 UP; UUID gerado, preservado ou substituído; checks postgres/mongo.

**Evidência exigida:** registro de ENV04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
