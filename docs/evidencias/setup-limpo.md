# Reprodução em ambiente limpo

**Executado em:** 22/10/2026. **Compose:** projeto temporário `coe-clean-acceptance-20261022`, quatro portas alternativas e volumes novos; credenciais fora do Git em `desafio-local/preflight/`.

## Execução

1. Validar `infra/compose.yaml` com um arquivo local de credenciais recém-gerado.
2. Executar `docker compose up -d --build --wait`; isso reconstrói as duas imagens, cria volumes vazios, inicializa MongoDB/seed e executa a migration PostgreSQL.
3. Rodar `infra/smoke-system.mjs` apontando para o Orders na porta alternativa. O smoke confirmou health, criação canônica, leitura do snapshot, paginação, validação, erros de dependência e OpenAPI.
4. Rodar `docs/validation/validar-contratos-runtime.py` com URLs das duas APIs na composição limpa. Todas as requests e respostas avaliadas passaram contra OpenAPI.
5. Rodar os seis testes de integração PostgreSQL usando `orders_test` dessa composição. Todos passaram, incluindo rollback, timeout de lock e ausência de linhas residuais.
6. Encerrar exclusivamente o projeto temporário com `docker compose down --volumes --remove-orphans`. Os containers e volumes temporários foram removidos; o arquivo de credenciais fora do repositório foi invalidado.

## Correção encontrada no primeiro bootstrap

Na primeira tentativa, o healthcheck não autenticado informou que o Mongo estava saudável durante a transição inicial, mas o container `mongo-bootstrap` recebeu `ECONNREFUSED` na conexão autenticada. O bootstrap agora faz até 20 tentativas de ping autenticado, com intervalo de um segundo, antes de aplicar schema, índices e seed. A segunda execução, novamente com volumes vazios, passou. URI e segredo não são impressos pelo script.

## Limites

O ambiente foi limpo em relação aos dados e volumes e a composição foi reconstruída a partir do repositório. As imagens base e pacotes já estavam baixados/cacheados; a rede foi usada para resolver metadados das imagens. Esta validação não representa uma máquina sem Docker nem uma execução hospedada no GitHub Actions.
