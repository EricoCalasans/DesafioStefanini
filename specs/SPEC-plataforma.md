# Spec - `plataforma`

**Versão:** 1.0. **Status:** especificado. **Origem:** R06-R07, R20, R30, R37, R44-R45, R49.

## 1. Objetivo e entregáveis

Permitir executar os serviços com configuração explícita, conferir sua saúde, desenvolver com GitFlow e impedir deploy sem testes. Entregáveis: Compose, Dockerfiles multi-stage, `.env.example`, migrações/init, scripts npm de orquestração, lockfiles, CI GitHub Actions, template de PR e caminho documentado de CD.

Nenhum contêiner ou recurso cloud foi criado nesta etapa. Docker, SDK .NET e atualização do Node são dependências do bootstrap; observar o ambiente não equivale a prepará-lo.

## 2. Serviços e rede locais

| Serviço Compose | Papel | Exposição |
|---|---|---|
| `postgres` | Pedidos | Só rede interna; perfil `dev-db` opcional em loopback |
| `mongo` | Catálogo | Só rede interna; perfil de debug opcional em loopback |
| `orders-migrate` | Job one-shot de migração | Sem porta; credencial de migration |
| `catalog-init` | Job one-shot de validador, índices e seed | Sem porta; credencial de init |
| `orders` | API NestJS | `127.0.0.1:3000` |
| `catalog` | API ASP.NET Core | `127.0.0.1:8080` |

Bancos com volume persistente; projeto de testes usa nomes/volumes próprios. APIs escutam na interface interna do contêiner, publicadas em loopback no host. Startup de API exige migração/init concluídos com sucesso e healthchecks de banco, além de tentativas de conexão limitadas; `depends_on` simples não substitui readiness.

Aplicações rodam sem root. Imagens finais não contêm SDK/toolchain desnecessários. Build de .NET com SDK 10; runtime ASP.NET 10. Node e imagens de banco fixados por patch/digest na implementação. `--no-cache` não é requisito de toda execução; builds reproduzíveis e lockfiles são.

## 3. Configuração

| Variável | Exemplo local / regra |
|---|---|
| `NODE_ENV` | `development`, `test` ou `production` |
| `ORDERS_PORT` | `3000`, inteiro 1-65535 |
| `ASPNETCORE_HTTP_PORTS` | `8080`, porta interna do Catálogo |
| `DATABASE_URL` | PostgreSQL do runtime Pedidos; segredo, sem fallback |
| `MIGRATION_DATABASE_URL` | Papel de DDL limitado; usado só por migration job |
| `MONGODB_CONNECTION_STRING` | Credencial de leitura do Catálogo; segredo |
| `MONGODB_INIT_CONNECTION_STRING` | Credencial de init, não disponível ao runtime |
| `MONGODB_DATABASE` | `catalog` ou nome isolado de teste |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Credencial de bootstrap local, sem reutilizar como runtime |
| `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` | Bootstrap local, não injetar na API |
| `ORDERS_DB_USER`, `ORDERS_DB_PASSWORD` | Identidade DML criada pelo bootstrap |
| `ORDERS_MIGRATION_USER`, `ORDERS_MIGRATION_PASSWORD` | Identidade DDL/DML do job |
| `CATALOG_DB_USER`, `CATALOG_DB_PASSWORD` | Identidade somente leitura |
| `CATALOG_INIT_USER`, `CATALOG_INIT_PASSWORD` | Identidade limitada para init/índices/seed |
| `CATALOG_BASE_URL` | `http://catalog:8080`, URL fixa validada, nunca vinda de request |
| `CATALOG_TIMEOUT_MS` | `2000`, inteiro positivo com teto 10.000 |
| `MONGO_QUERY_TIMEOUT_MS` | `1000`, inteiro positivo |
| `MONGO_SERVER_SELECTION_TIMEOUT_MS` | `1000`, inteiro positivo |
| `PG_STATEMENT_TIMEOUT_MS` | `2000`, inteiro positivo |
| `PG_LOCK_TIMEOUT_MS` | `1000`, inteiro positivo, menor/igual ao statement timeout |
| `PG_POOL_MAX` | `10`, inteiro de 1 a 50 no laboratório |
| `CREATE_ORDER_TIMEOUT_MS` | `5000`, maior que timeout do fornecedor |
| `DISCOUNT_ENABLED` | `true`, obrigatório e booleano estrito |
| `DISCOUNT_RULE_ID` | `volume-v1`, 1-64 caracteres permitidos |
| `DISCOUNT_MIN_SUBTOTAL_CENTS` | `50000`, inteiro dentro do domínio monetário |
| `DISCOUNT_RATE_BPS` | `1000`, inteiro entre 0 e 10.000 |
| `LOG_LEVEL` | `info`, enum permitido |
| `APP_VERSION` | SHA/tag da aplicação, derivado de build |

O `.env.example` conterá placeholders claros, sem segredo utilizável em ambiente público. O setup local ensinará criar `.env` e definir senhas. Não preencher `.env` do candidato automaticamente com credenciais reais nesta etapa. Aspas, caracteres reservados e URI encoding serão explicados para connection strings. O bootstrap deve evitar injeção de segredo em comandos/logs.

Cada processo recebe somente o necessário. Ausência de variável obrigatória, URL inválida ou intervalos inconsistentes falha no startup com nome da chave e sem imprimir valor sensível. Alterar senha de bootstrap após criação do volume não altera usuários existentes automaticamente; documentar rotação/recriação local com cautela.

## 4. Comandos futuros e ergonomia

Executar na raiz; npm será a interface comum dos scripts, inclusive para disparar ferramentas .NET. Usar scripts JS portáveis, sem depender de bash no Windows.

```powershell
Copy-Item .env.example .env
npm ci
docker compose config --quiet
docker compose up --build --wait
npm run smoke
npm run lint
npm run build
npm run test:unit
npm run test:integration
npm run test:system
docker compose down
```

`up` inclui serviços one-shot; confirmar compatibilidade de Compose/healthcheck com a versão escolhida. `down` preserva volumes por padrão. Reset destrutivo não será parte do caminho feliz; se existir script, deverá exigir identificação explícita do projeto descartável.

Scripts de desenvolvimento: `dev:orders`, `dev:catalog`, `db:migrate`, `catalog:seed`. Scripts de teste deverão provisionar dependências isoladas, falhar com mensagem útil se Docker não estiver ativo e efetuar cleanup somente dos recursos que criaram.

## 5. Health e logs

`/health/live`: 200 com processo UP, sem acesso a fornecedor. `/health/ready`: banco local saudável → 200; indisponível →503. Corpo `Health` do contrato. Não exibir strings de conexão. Um Catálogo fora do ar não deve remover de serviço os GETs de Pedidos que dependem só do SQL.

Logs JSON em stdout, correlação comum, duração e códigos. Encerramento gracioso: parar de aceitar novas requisições, finalizar/cancelar trabalho com limite de tempo, fechar pools. Liveness e readiness não devem gerar PII ou alto volume de stack traces em falhas esperadas.

## 6. GitFlow e histórico

- `main`: releases estáveis, protegida quando o plano GitHub permitir; sem push direto no fluxo normal.
- `develop`: integração; PR de `feature/<id>-descricao` após critérios de aceite e checks.
- `release/<versao>`: nasce de develop; somente correções/documentação de estabilização; merge em main com tag e retorno para develop.
- `hotfix/<versao>`: nasce de main; correção urgente, tag e merges de retorno para main/develop (e release ativa se necessário).
- Commits pequenos e verdadeiros, com motivo claro, por exemplo `feat(orders): preserve catalog price snapshot`. Preservar histórico útil; evitar squash indiscriminado nos merges de release/back-merge.

PR descreve problema, comportamento final, spec/requisitos, testes, riscos e evidências de IA quando relevantes. Trabalho de uma pessoa deve declarar revisão própria; não inventar segundo aprovador. Documentar caso branch protection/revisores não estejam disponíveis no plano/conta escolhidos.

## 7. CI obrigatório no plano

Triggers: PRs para develop/main/release, pushes nas branches de integração e tags de release. Caminhos de documentação podem ter check rápido, mas não pular testes se contratos ou configuração afetarem comportamento.

Jobs, todos ligados ao mesmo SHA:

1. Verificar contrato, lint/format e build TypeScript.
2. Restore bloqueado, format, build e testes unitários .NET.
3. Unitários TS com cobertura e regras mínimas.
4. Integração SQL/MongoDB e migração/init em dependências reais.
5. Testes de contrato e sistema com duas aplicações reais.
6. Agregador `quality-gate`, com dependências explícitas, avalia sucesso de todos os jobs obrigatórios, inclusive quando há falha/cancelamento.
7. Build/publicação de imagens de release somente após gate, com SHA/digest.
8. Job `deploy`, se habilitado, depende do gate e das imagens verificadas; ambiente protegido e execução só em release permitida.

Evitar `continue-on-error` em checks obrigatórios, `if: always()` liberando deploy indevido ou workflow separado que publique commit não testado. Teste de falha deliberada em branch descartável demonstra bloqueio. Permissões mínimas, actions oficiais por SHA, sem secrets em PRs de forks e sem checkout de código não confiável em contexto privilegiado.

## 8. CD e cloud condicionais

Sem credenciais, manter deploy desabilitado explicitamente e documentar a limitação; build de imagem não equivale a deploy. Caminho proposto: Azure Container Apps para as APIs, PostgreSQL gerenciado, MongoDB Atlas e registry com imagens por digest.

Antes de executar: definir conta/assinatura, região, orçamento/teto, ambiente, identidades, segredos, rede, HTTPS e política de acesso. Usar OIDC/identidade federada quando configurável. Catálogo e bancos internos; API de demonstração com acesso restrito e dados sintéticos. Documentar um comando/ação de remoção dos recursos criados e verificar custo residual.

Não há promessa de custo mensal ou disponibilidade produtiva sem ambiente e medição. Uma mudança para exposição pública irrestrita exige especificação de autenticação/autorização e revisão do escopo.

## 9. Aceite e limites

- PLA01: setup limpo, healthchecks, init/migration idempotentes e persistência após reinício.
- PLA02: configuração inválida falha cedo e não expõe segredo.
- PLA03: GitFlow observável por histórico/PRs reais.
- PLA04: qualquer falha obrigatória impede imagens de release/deploy.
- PLA05: release identifica SHA/digest; deploy real, se houver, tem smoke e rollback de aplicação para digest anterior.
- PLA06: bancos não ficam expostos por padrão; roles e segredos separados.

Sempre manter evidência do estado real. Não afirmar proteção de branch configurada ou deploy executado a partir apenas de um YAML.
