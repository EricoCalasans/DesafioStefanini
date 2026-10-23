# Leituras, histórico e concorrência

Requisitos: ORD03/ORD07, INT04, Q09/Q19-Q22/Q35/Q36.

## Objetivo e escopo

Leituras, histórico e concorrência. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.

## Pré-condições e dados

Dados sintéticos próprios; alterações de produto restauradas em finally.
Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.

## Execução

Executar `node docs/qa/scripts/campanha.mjs --area=6`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.

## GET01 — ID existente, ausente, malformado e controle final

1. Criar fixture própria; GET existente/aleatório/texto/LF.
2. Conferir: Snapshot exato; 404 ORDER_NOT_FOUND; 400 para UUID inválido.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Snapshot exato; 404 ORDER_NOT_FOUND; 400 para UUID inválido.

**Evidência exigida:** registro de GET01 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GET02 — Página padrão, limites, inválidos e página vazia

1. GET lista padrão e página além do fim; testar limites/extra/repetido/objeto.
2. Conferir: Metadados coerentes, itemCount=linhas; 400 em parâmetros inválidos.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Metadados coerentes, itemCount=linhas; 400 em parâmetros inválidos.

**Evidência exigida:** registro de GET02 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GET03 — Alteração real de preço e snapshot histórico

1. Criar pedido; alterar preço/versão/data somente no Mongo de QA; criar outro; consultar ambos; restaurar produto.
2. Conferir: Antigo mantém preço 20000/versão1; novo usa 30000/versão2; UTC e totais coerentes.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** Antigo mantém preço 20000/versão1; novo usa 30000/versão2; UTC e totais coerentes.

**Evidência exigida:** registro de GET03 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.

## GET04 — Concorrência e autorização atual

1. Disparar 5 criações concorrentes com mesmo corpo; consultar/listar sem Authorization e com header arbitrário.
2. Conferir: 5 IDs únicos, agregados completos; API pública conforme security:[]; não há papéis/tenants implementados.
3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.

**Esperado:** 5 IDs únicos, agregados completos; API pública conforme security:[]; não há papéis/tenants implementados.

**Evidência exigida:** registro de GET04 em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.

**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.
