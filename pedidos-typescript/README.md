# API de Pedidos

Projeto TypeScript independente, executado em Node.js 24 e NestJS 12. Seu package.json, package-lock.json, configuração, testes e node_modules ficam nesta pasta; a raiz do repositório não coordena dependências npm.

## Responsabilidade

Validar o pedido e os produtos consultando o contrato HTTP do Catálogo, calcular valores em centavos inteiros, registrar snapshots e persistir cabeçalho/itens em PostgreSQL. Os detalhes de comportamento e aceite estão na [spec de Pedidos](../specs/SPEC-pedidos.md) e na [spec de integração](../specs/SPEC-integracao.md).

## Estrutura

- src: API NestJS e módulos do serviço.
- test: testes do projeto; os cenários entre serviços também são orquestrados aqui.
- package.json e package-lock.json: scripts e dependências npm com versões fixas.
- .node-version: versão local do Node.
- node_modules: dependências instaladas para este projeto, ignoradas pelo Git.

## Executar e verificar

Execute os comandos neste diretório:

    npm ci
    npm run start:dev
    npm run build
    npm run typecheck
    npm run lint
    npm test

Os testes de integração precisam do PostgreSQL configurado em ambiente local isolado. O Compose e a geração de credenciais compartilhados ficam em [infra](../infra/README.md). Não use credenciais de produção ou dados pessoais.

## Contratos

A API consome os produtos conforme o [OpenAPI do Catálogo](../contracts/catalogo.openapi.yaml) e publica pedidos conforme o [OpenAPI de Pedidos](../contracts/pedidos.openapi.yaml). Não compartilha entidades internas nem o banco do Catálogo.
