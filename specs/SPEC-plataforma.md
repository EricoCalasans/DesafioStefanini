# Spec - `plataforma`

**Versão:** 1.1. **Status:** implementação local e CI hospedada concluídas; GitFlow está documentado e o repositório público contém as branches principais. Não há branch protection, publicação de imagens nem deploy cloud verificados. **Origem:** R06-R07, R20, R30, R37, R44-R45, R49.

## 1. Objetivo e estado de entrega

Esta especificação registra como executar, configurar, testar e entregar os projetos independentes de Pedidos e Catálogo em um único repositório. O ambiente local usa Docker Compose, PostgreSQL e MongoDB. O workflow do GitHub Actions executa os testes como CI em pushes e pull requests. Não existe job de deploy; por isso, o projeto não alega implantação em nuvem nem proteção obrigatória de branch configurada.

O repositório público é [EricoCalasans/DesafioStefanini](https://github.com/EricoCalasans/DesafioStefanini). `main` é a branch principal; `develop` é a branch de integração; `master` permanece como alias de compatibilidade. A existência de branches ou de um template não prova que houve PR ou revisão por outra pessoa. Os links de PR devem ser registrados somente quando PRs reais existirem.

## 2. Projetos, serviços e portas

| Serviço Compose | Responsabilidade | Dependências e exposição local |
|---|---|---|
| `postgres` | Persistência SQL de Pedidos | Volume `postgres-data`; `127.0.0.1:${POSTGRES_PORT:-5432}` |
| `mongo` | Persistência NoSQL do Catálogo | Volume `mongo-data`; `127.0.0.1:${MONGO_PORT:-27017}` |
| `mongo-bootstrap` | Inicializa validator, índices, usuários e seed | Job sem porta; executa após Mongo saudável |
| `catalog` | API C#/ASP.NET Core | Depende do bootstrap; `127.0.0.1:${CATALOG_PORT:-8080}` |
| `orders-migrate` | Aplica migrations SQL | Job sem porta; credencial `orders_migrator` |
| `orders` | API TypeScript/NestJS | Depende do PostgreSQL, migrations e Catálogo; `127.0.0.1:${ORDERS_PORT:-3000}` |

Os serviços compartilham somente a rede Docker Compose. Pedidos integra-se ao Catálogo por HTTP e não acessa o MongoDB. O Compose preserva os volumes em `down`; apagar os volumes remove todos os dados locais.

## 3. Configuração real

[`infra/.env.example`](../infra/.env.example) é o inventário completo sem credenciais utilizáveis. [`infra/setup-local.ps1`](../infra/setup-local.ps1) cria senhas aleatórias fora do repositório, em uma pasta irmã terminada em `-local`, e recusa substituir uma configuração existente. Use esse script em vez de preencher manualmente secrets.

Variáveis de fronteira e seus usos atuais:

| Grupo | Variáveis | Uso |
|---|---|---|
| Portas do host | `POSTGRES_PORT`, `MONGO_PORT`, `ORDERS_PORT`, `CATALOG_PORT` | Publicação em loopback no host |
| Contas administrativas/init | `POSTGRES_ADMIN_PASSWORD`, `MONGO_ROOT_PASSWORD`, `MONGO_ADMIN_URI` | Bootstrap dos bancos; não são credenciais de aplicação |
| Papéis de aplicação e migração | `ORDERS_RUNTIME_PASSWORD`, `ORDERS_MIGRATOR_PASSWORD`, `CATALOG_RUNTIME_PASSWORD`, `CATALOG_SEED_PASSWORD` | Privilégios separados para runtime, migration e seed |
| PostgreSQL | `ORDERS_DATABASE_URL`, `ORDERS_MIGRATION_DATABASE_URL`, `ORDERS_TEST_DATABASE_URL`, `ORDERS_TEST_MIGRATION_DATABASE_URL` | Banco `orders`, migration, e banco isolado `orders_test` |
| MongoDB | `CATALOG_MONGODB_URI`, `CATALOG_MONGODB_DATABASE` | Leitura pelo serviço Catálogo; padrão do banco `catalog` |
| Integração e regra | `CATALOG_URL`, `DISCOUNT_ENABLED`, `DISCOUNT_RULE_ID`, `DISCOUNT_MIN_SUBTOTAL_CENTS`, `DISCOUNT_RATE_BPS` | URL interna do Catálogo e regra de desconto aplicada em Pedidos |

As URLs da configuração gerada usam nomes DNS do Compose (`postgres`, `mongo`, `catalog`) e foram preparadas para os containers. Para execução direta no host, o usuário precisa substituir os hosts pelos endereços publicados em localhost e carregar as mesmas credenciais; o caminho de execução recomendado e verificado é o Compose descrito no README.

## 4. Inicialização, dados e persistência

Na primeira inicialização, `postgres` cria os bancos/roles definidos em [`infra/postgres/01-roles.sql`](../infra/postgres/01-roles.sql). O serviço `orders-migrate` aplica as migrations versionadas de [`pedidos-typescript/src/migrations/sql/`](../pedidos-typescript/src/migrations/sql/). O banco de pedidos começa vazio; pedidos são criados pela API e o smoke usa dados sintéticos.

`mongo-bootstrap` executa [`infra/mongo/initialize.sh`](../infra/mongo/initialize.sh) e [`infra/mongo/bootstrap.js`](../infra/mongo/bootstrap.js), cria o banco `catalog`, validator e índices e insere por upsert 24 produtos sintéticos (23 ativos e um inativo). A rotina é repetível e não apaga produtos existentes. O comando [`infra/seed-demo.ps1`](../infra/seed-demo.ps1) reaplica o bootstrap/seed. A credencial runtime do Catálogo tem leitura; a credencial de seed tem escrita.

O projeto de testes PostgreSQL (`orders_test`) é validado pelo script [`infra/test-orders.ps1`](../infra/test-orders.ps1) antes de executar integração. A pipeline cria credenciais efêmeras e remove apenas sua própria composição/volumes ao fim; os dados locais do usuário não são usados pela CI.

## 5. Comandos operacionais

O README da raiz contém o roteiro reproduzível de setup, Compose, Swagger, smoke, testes, logs e encerramento. A sequência principal é:

```powershell
.\infra\setup-local.ps1
$repoRoot = (Resolve-Path .).Path
$localDirectory = Join-Path (Split-Path -Parent $repoRoot) "$(Split-Path -Leaf $repoRoot)-local"
$envFile = Join-Path $localDirectory '.env'
$composeFile = Join-Path $repoRoot 'infra/compose.yaml'
docker compose --env-file $envFile -f $composeFile up -d --build --wait
node infra/smoke-system.mjs
```

Para iniciar somente uma parte, `docker compose ... up -d --build --wait catalog` inicia Mongo, bootstrap e Catálogo; `docker compose ... up -d --build --wait orders` também inicia as dependências de Pedidos, incluindo Catálogo. A forma completa e os argumentos comuns `--env-file`/`-f` estão em [`README.md`](../README.md).

Para parar mantendo dados: `docker compose ... down`. `down --volumes` é destrutivo e apaga pedidos e produtos locais. O usuário deve conferir o nome/projeto Compose antes de remover volumes; não se recomenda reset como passo de uso normal.

## 6. CI, checks e limites do gate

O workflow único [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) se chama `verify` e tem um job `tests`. Ele roda em push para `main`, `develop`, `master`, `feature/**`, `release/**`, `hotfix/**` e em pull requests. No mesmo job/SHA executa:

1. Actions oficiais compatíveis com Node 24 e SDK configurado pelo arquivo do projeto; `npm ci`, build, typecheck, lint e testes de Pedidos.
2. Restore locked, format check, build Release e testes .NET do Catálogo.
3. Validação de OpenAPI, links e referências documentais.
4. Compose efêmero com credenciais mascaradas, migrations, testes PostgreSQL, smoke integrado e comparação de respostas reais com OpenAPI.
5. Cleanup da composição efêmera mesmo após falha.

O workflow não publica imagens nem executa deploy. Os comandos de teste aplicam limites locais de cobertura: Pedidos exige 95% de linhas/instruções, 85% de branches e 90% de funções; Catálogo exige 95% no total combinado. Ainda não existe agregador `quality-gate` nem configuração verificada de branch protection/required status checks; portanto, não declarar que o GitHub impede merge ou push sem check verde. A política de trabalho documentada é aguardar CI aprovada antes de promover alterações. Como não há deploy, não existe publicação que possa ignorar o resultado da CI.

## 7. GitFlow

- `main`: branch principal e referência da entrega.
- `develop`: branch de integração.
- `feature/<id>-descricao`: trabalho isolado que, no fluxo normal, é proposto a `develop` por PR. A entrega registra o [PR #1](https://github.com/EricoCalasans/DesafioStefanini/pull/1).
- `release/<versao>` e `hotfix/<versao>`: caminhos descritos em [`docs/fluxo-git.md`](../docs/fluxo-git.md) para os casos aplicáveis.
- `master`: alias sincronizada com `main` para compatibilidade; não é linha de desenvolvimento adicional.

O template de PR pede problema, comportamento, requisitos, testes, riscos e evidências. Em uma candidatura individual, revisão própria não deve ser apresentada como aprovação independente. No estado de entrega, documentar commits/branches verdadeiros e não inventar PRs.

## 8. Cloud e publicação de artefatos

Deploy em cloud permanece condicional. O projeto não tem conta, orçamento, destino, credenciais, registry, imagem publicada ou infraestrutura cloud configurada. O cenário de Azure Container Apps, PostgreSQL gerenciado e MongoDB Atlas descrito como alternativa é uma proposta, não um recurso existente. Uma implantação futura exigiria gates de release, controle de acesso, HTTPS, segredos federados, teste pós-deploy, rollback e plano de remoção/custos.

## 9. Aceite e evidência

- **PLA01:** setup Compose com init/migration e volumes vazios foi reproduzido; smoke e testes de integração passaram localmente.
- **PLA02:** configuração estrita e separação de credenciais estão verificadas em testes e Compose.
- **PLA03:** política GitFlow, branches, template e [PR #1 integrado](https://github.com/EricoCalasans/DesafioStefanini/pull/1) existem; não houve revisão independente por outra pessoa.
- **PLA04:** CI executa o conjunto de checks em push e PR e passou no merge commit publicado nas três branches; falta enforcement por branch protection e não há deploy associado.
- **PLA05:** release/tag, imagens por digest e smoke cloud não foram implementados, pois deploy é condicional.
- **PLA06:** bancos são publicados em loopback; contas de runtime, migration, seed e administração são separadas.

As execuções e datas da pipeline ficam no [histórico de GitHub Actions](https://github.com/EricoCalasans/DesafioStefanini/actions). O estado de um commit específico deve ser conferido na página do SHA submetido; um run anterior não prova o status de uma alteração posterior.
