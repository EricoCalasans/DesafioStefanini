# Infraestrutura local compartilhada

Esta pasta contém somente os recursos usados pelos dois projetos durante desenvolvimento e demonstração:

- compose.yaml: PostgreSQL 17, MongoDB 8 e as APIs em containers separados; portas publicadas apenas no loopback local.
- postgres/01-roles.sql: cria `orders_test` e as contas de runtime e migração do PostgreSQL com permissões separadas.
- mongo/bootstrap.js: configura validator e índices, cria contas separadas e insere 24 produtos sintéticos de forma idempotente (23 ativos e um inativo).
- seed-demo.ps1: reaplica o seed do Catálogo sem apagar ou substituir produtos existentes.
- setup-local.ps1: gera credenciais aleatórias fora do repositório.
- test-orders.ps1 e test-orders.sh: executam testes PostgreSQL somente contra `orders_test`.
- smoke-system.mjs: valida endpoints das duas APIs pela interface HTTP.
- .env.example: nomes e formatos das configurações, sem segredos utilizáveis.

## Preparar e iniciar

Execute infra/setup-local.ps1 no PowerShell para gerar segredos na pasta irmã chamada desafio-local. O script interrompe se o arquivo de credenciais já existir, para preservar a senha correspondente aos volumes persistidos.

Da raiz do repositório, inicie os bancos e APIs; o Compose executa o bootstrap do Catálogo e as migrations de Pedidos:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml up -d --build --wait
    node infra/smoke-system.mjs

O PostgreSQL cria os papéis e o banco separado `orders_test` no primeiro início do volume. O Mongo bootstrap pode ser repetido: atualiza o validator, garante índices e usuários, e usa upsert para preservar produtos existentes. Os testes de integração usam exclusivamente `orders_test`.

Para popular ou repopular o Catálogo a qualquer momento, execute na raiz do repositório:

    .\infra\seed-demo.ps1

O script roda somente o serviço de bootstrap do Mongo pelo Compose. Ele adiciona os produtos sintéticos que ainda não existem e pode ser executado novamente sem duplicar nem sobrescrever registros existentes; não apaga dados nem cria pedidos.

Para parar os contêineres sem apagar os dados:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml down

Para executar os testes de integração no Windows, rode `infra/test-orders.ps1`; no Linux ou macOS, exporte os dois URLs `ORDERS_TEST_*` e rode `bash infra/test-orders.sh`. Nenhum arquivo de credencial ou material de referência deve ser copiado para o Git.
