# Checklist de preparação e início

**Status em 22/10/2026:** escolhas essenciais e ambiente local preparados; o candidato autorizou a implementação. O bootstrap das aplicações começou. Este documento registra o que foi conferido antes do código e os bloqueios que ainda precisam fechar antes da entrega.

## Decisões e organização

- [x] Usar um único repositório Git na raiz `desafio/`.
- [x] Separar os projetos como pastas independentes no primeiro nível: `pedidos-typescript/` e `catalogo-dotnet/`.
- [x] Manter package.json, lockfile, configuração, testes e dependências Node dentro de Pedidos; não deixar `node_modules/` na raiz.
- [x] Manter solução, seleção de SDK e dependências NuGet dentro de Catálogo.
- [x] Manter documentação e plano em `docs/`, specs em `specs/`, contratos compartilhados em `contracts/` e configuração de bancos em `infra/`.
- [x] Usar PostgreSQL e MongoDB locais em Docker Compose; credenciais, PDF e caches ficam fora do repositório na pasta irmã `desafio-local/`.
- [x] Prazo informado: 23/10/2026 às 18:00, horário de Brasília.

## Ferramentas e segurança do repositório

- [x] Node.js 24.22.1 instalado e registrado em `pedidos-typescript/.node-version`.
- [x] SDK .NET 10.0.402 instalado e registrado em `catalogo-dotnet/global.json`.
- [x] Docker Desktop, Engine e Compose instalados; as imagens PostgreSQL 17.11 e MongoDB 8.0.34 foram baixadas.
- [x] `.gitignore` cobre segredos, dependências, artefatos de build, testes e IDEs.
- [x] PDF original, credenciais locais e caches foram movidos para fora da pasta enviada.
- [x] Conferido que há somente um diretório `.git`, na raiz.
- [x] Gerado um lockfile npm dentro de Pedidos e lockfiles NuGet dentro da solução do Catálogo.

## PRD, specs e contratos

- [x] Revisar o PDF e registrar os pontos e riscos em `docs/analise-do-desafio.md`.
- [x] Mapear R01-R53, cenários Q01-Q50 e tarefas T01-T45 sem lacunas ou duplicações.
- [x] Criar nove specs independentes, PRD, arquitetura, ADRs, plano e backlog.
- [x] Validar os três contratos OpenAPI 3.1, os cinco exemplos válidos, seis exemplos inválidos e a aritmética do pedido.
- [x] Comparar novamente PRD, specs e contratos antes de iniciar o desenvolvimento; nenhuma mudança de requisito foi necessária.

## Evidências iniciais de execução

- [x] O candidato autorizou explicitamente iniciar o desenvolvimento segundo as specs em 22/10/2026.
- [x] Criar branch de trabalho no mesmo repositório: `feature/t02-bootstrap`.
- [x] Criar a fundação inicial das duas APIs e testes reais de liveness.
- [x] Confirmar build, typecheck, lint e teste unitário TypeScript dentro de `pedidos-typescript/`.
- [x] Confirmar restore, build e teste unitário .NET dentro de `catalogo-dotnet/`.
- [x] Subir PostgreSQL e MongoDB localmente; ambos passaram no healthcheck do Compose.
- [x] Executar o bootstrap do MongoDB: schema validator, índices, papéis de menor privilégio e seed idempotente.

## Antes de considerar a entrega pronta

- [ ] Implementar todo o comportamento funcional descrito nas specs, não apenas health checks.
- [ ] Comprovar papéis e permissões do PostgreSQL; validar MongoDB por meio das APIs.
- [ ] Cobrir testes de unidade, integração e fluxo completo com bancos reais.
- [ ] Completar CI, README operacional, documentação de governança, proposta e evidências exigidas pelo PDF.
- [ ] Revisar os cortes em relação ao prazo e declarar qualquer requisito ainda não concluído.
- [ ] Criar e testar o link compartilhável da conversa com IA exigido para a submissão.

Nenhuma instalação ou decisão do candidato bloqueia o início do código. As pendências restantes pertencem à construção e à comprovação do sistema; o plano e o backlog mostram o estado atualizado.
