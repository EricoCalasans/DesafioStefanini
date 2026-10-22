# Infraestrutura local compartilhada

Esta pasta contém somente os recursos usados pelos dois projetos durante desenvolvimento e demonstração:

- compose.yaml: PostgreSQL 17 e MongoDB 8, publicados apenas no loopback local.
- postgres/01-roles.sql: cria as contas de runtime e migração do PostgreSQL com permissões separadas.
- mongo/bootstrap.js: configura validator e índices, cria contas separadas e insere quatro produtos sintéticos de forma idempotente.
- setup-local.ps1: gera credenciais aleatórias fora do repositório.
- .env.example: nomes e formatos das configurações, sem segredos utilizáveis.

## Preparar e iniciar

Execute infra/setup-local.ps1 no PowerShell para gerar segredos na pasta irmã chamada desafio-local. O script interrompe se o arquivo de credenciais já existir, para preservar a senha correspondente aos volumes persistidos.

Da raiz do repositório, inicie as bases e aplique o bootstrap do Catálogo:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml up -d --wait
    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml run --rm --no-deps mongo-bootstrap

O PostgreSQL cria os papéis no primeiro início do volume. O Mongo bootstrap pode ser repetido: atualiza o validator, garante índices e usuários, e usa upsert para preservar produtos existentes. Testes de integração devem usar bancos e credenciais isolados.

Para parar os contêineres sem apagar os dados:

    docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml down

Os serviços de API ainda são executados e verificados individualmente em suas pastas de projeto. Nenhum arquivo de credencial ou material de referência deve ser copiado para o Git.
