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
- Orders.http: exemplos executáveis dos endpoints desta API.

## Executar e verificar

Execute os comandos neste diretório:

    npm ci
    npm run start:dev
    npm run build
    npm run typecheck
    npm run lint
    npm test
    npm run test:coverage

`test:coverage` também executa o build e aplica limites mínimos de 95% para linhas/instruções, 85% para branches e 90% para funções. A medição exclui os entrypoints `src/main.ts` e `src/migrations/run.ts`: o primeiro é verificado por um teste HTTP em subprocesso, e o segundo é a interface CLI; a lógica reutilizável das migrations está coberta em `src/migrations/runner.ts`.

Os testes de integração usam exclusivamente um banco PostgreSQL local chamado `orders_test`; o runner recusa nomes de banco diferentes. Na raiz do repositório, execute `infra/test-orders.ps1` para carregar os URLs locais fora do Git, aplicar migrations e rodar os testes reais de transação. O Compose e a geração de credenciais ficam em [infra](../infra/README.md).

## Contratos

A API consome os produtos conforme o [OpenAPI do Catálogo](../contracts/catalogo.openapi.yaml) e publica pedidos conforme o [OpenAPI de Pedidos](../contracts/pedidos.openapi.yaml). Não compartilha entidades internas nem o banco do Catálogo.
