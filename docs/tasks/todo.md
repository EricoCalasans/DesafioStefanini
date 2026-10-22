# Backlog de implementação

**Status em 22/10/2026:** T01, T02, T04 e T05 concluídas com evidências; serviços de negócio e demais entregáveis seguem pendentes. Marcar uma tarefa somente após executar sua verificação. Tamanhos são relativos: **P** até cerca de 2 h; **M** uma sessão de meio dia. Reestimar ao executar; dividir tarefa que exceder uma sessão ou aproximadamente cinco arquivos de responsabilidade.

Cada card inclui aceite e verificação. Referências Qxx apontam à [matriz de qualidade](../../specs/SPEC-qualidade.md). Caminhos abaixo são alvos futuros, não arquivos já existentes. Não são estimativas adicionais às 204 h da proposta: os cards decompõem os mesmos pacotes.

## Fundação

- [x] **T01 - Verificar toolchain e congelar versões** (plataforma, P, bloqueante; sem dependência). Concluído em 22/10/2026: Node `24.22.1`, SDK .NET `10.0.402`/runtime `10.0.13`, Docker Desktop `4.96.1`/Engine `29.9.2`/Compose `5.6.0` ativos; imagens `postgres:17.11` e `mongo:8.0.34-noble` baixadas. Versões de ferramentas e dependências foram fixadas em cada projeto e registradas em seus lockfiles. Alvos: `pedidos-typescript/.node-version`, `catalogo-dotnet/global.json` e referências técnicas.
- [x] **T02 - Criar projetos independentes e fundação executável** (plataforma, M, bloqueante; T01). Aceite: projeto TypeScript/ESM e solução C# compilam e têm health checks testados. Verificado em 22/10: build, typecheck, lint e teste TypeScript; restore, build e teste unitário .NET. Alvos: `pedidos-typescript/` e `catalogo-dotnet/`, cada qual com configuração e dependências próprias.
- [ ] **T03 - Preparar GitFlow e template de PR** (plataforma, P, alta; T02). Aceite: branches iniciais e política documentada, commits reais. Verificar: histórico/configuração. Alvos: `.gitignore`, `.github/PULL_REQUEST_TEMPLATE.md`, guia Git.
- [x] **T04 - Provisionar PostgreSQL e papéis locais** (plataforma, M, bloqueante; T02). Concluído: runtime conecta sem ser superuser nem criar objetos no schema; migrator pode criar no schema. Verificado por consulta real aos papéis no PostgreSQL em 22/10. Alvos: `infra/compose.yaml` e `infra/postgres/01-roles.sql`.
- [x] **T05 - Provisionar MongoDB e papéis locais** (plataforma, M, bloqueante; T02). Concluído: bootstrap define validator/índices, cria papéis de runtime/seed e faz upsert do seed usando a conta seed. Execuções repetidas mantiveram quatro produtos; leitura com usuário runtime confirmou os quatro em 22/10. Alvos: `infra/compose.yaml` e `infra/mongo/bootstrap.js`.
- [ ] **T06 - Validar configuração de Pedidos e política** (pedidos, M, alta; T02). Aceite: parse estrito e falha cedo nas variáveis obrigatórias. Verificar: Q10. Alvos: config, teste de config, `.env.example`.
- [ ] **T07 - Validar configuração de Catálogo** (catalogo, P, alta; T02). Aceite: conexão/timeouts válidos e segredo não exposto. Verificar: testes de config. Alvos: Options/validação, config de teste, exemplo ambiente.
- [ ] **T08 - Criar CI mínimo e checks documentais** (plataforma, M, alta; T02). Aceite: ambas as stacks fazem restore/build/format e contratos parseiam. Verificar: execução real. Alvos: workflow CI em `.github/workflows/` e validador em `docs/validation/`.

## Catálogo

- [ ] **T09 - Definir produto e limites de consulta** (catalogo, P, alta; T07). Aceite: valores válidos e duplicados classificados. Verificar: unitários CAT03. Alvos: domínio, aplicação e testes.
- [ ] **T10 - Criar validador, índices e seed repetível** (catalogo, M, alta; T05,T09). Aceite: quatro produtos, índice SKU e `setOnInsert`. Verificar: Q27-Q28. Alvos: init/seed e teste Mongo real.
- [ ] **T11 - Consultar produto individual real** (catalogo, M, alta; T10). Aceite: GET com 200/400/404 e inativo visível. Verificar: Q23. Alvos: endpoint, caso de uso, adapter e teste.
- [ ] **T12 - Implementar lote indexado** (catalogo, M, bloqueante; T11). Aceite: produtos/ausentes e uma busca lógica. Verificar: Q24-Q26, contagem e filtro. Alvos: caso de uso, adapter, endpoint e teste.
- [ ] **T13 - Implementar listagem paginada ativa** (catalogo, M, alta; T11). Aceite: ordem e limites do contrato. Verificar: CAT01 e página vazia. Alvos: caso de uso, adapter, endpoint e teste.
- [ ] **T14 - Fechar erros/cancelamento do Catálogo** (catalogo, M, alta; T12,T13). Aceite: 413/415/503 e cancelamento sanitizados. Verificar: CAT05 e contrato. Alvos: middleware, validação e testes.

## Pedido integrado

- [ ] **T15 - Implementar Money e desconto puros** (pedidos, M, bloqueante; T06). Aceite: fórmula/limites e arredondamento exatos. Verificar: Q01-Q08. Alvos: valores, política e unitários.
- [ ] **T16 - Definir agregado e snapshots** (pedidos, M, alta; T15). Aceite: invariantes e ordem dos itens preservadas. Verificar: ORD01/ORD04. Alvos: agregado, portas e unitários.
- [ ] **T17 - Criar migrations do agregado** (pedidos, M, alta; T04,T16). Aceite: constraints, índices e controle de versão/checksum. Verificar: Q45 e esquema real. Alvos: migrations, runner e teste.
- [ ] **T18 - Implementar escrita SQL atômica em lote** (pedidos, M, bloqueante; T17). Aceite: parâmetros, transação e liberação de conexão. Verificar: Q37-Q38 em PostgreSQL real. Alvos: adapter, mapper e integração.
- [ ] **T19 - Implementar cliente de lote validado** (pedidos, M, bloqueante; T12,T16). Aceite: resposta completa e timeout/correlação, sem banco externo. Verificar: Q30-Q34 com stub. Alvos: cliente, validador e testes.
- [ ] **T20 - Orquestrar criação real** (pedidos, M, bloqueante; T18,T19). Aceite: consulta/calcula/salva na ordem correta, sem transação aberta durante HTTP. Verificar: ORD01/INT01. Alvos: caso de uso e testes.
- [ ] **T21 - Expor POST com validação estrita** (pedidos, M, bloqueante; T20). Aceite: 201/Location e recusa de campos/preços externos. Verificar: Q11-Q18. Alvos: controller, DTO/validador e testes HTTP.
- [ ] **T22 - Padronizar Problem Details e correlação** (integracao, M, alta; T14,T21). Aceite: códigos/status/headers coerentes entre stacks. Verificar: Q42-Q43. Alvos: middleware/filtros e testes; dividir por stack se exceder cinco arquivos.

## Leituras e robustez

- [ ] **T23 - Consultar pedido completo** (pedidos, M, alta; T21). Aceite: snapshot original, 404 e zero chamadas ao Catálogo. Verificar: Q19/Q36. Alvos: caso de uso, repository, endpoint e teste.
- [ ] **T24 - Listar resumos paginados** (pedidos, M, alta; T23). Aceite: snapshot SQL por requisição e ordem estável. Verificar: Q20-Q22/Q41. Alvos: consulta, endpoint e teste.
- [ ] **T25 - Demonstrar mudanças de preço e desconto** (integracao, M, alta; T23,T24). Aceite: novos/antigos pedidos com valores esperados. Verificar: Q09/Q35. Alvos: fixtures de sistema, cenário e evidência.
- [ ] **T26 - Verificar falhas e rollback completo** (qualidade, M, bloqueante; T22,T24). Aceite: matriz de falhas implementada sem gravação indevida. Verificar: Q29-Q40. Alvos: testes de falhas por adapter/caso; dividir em cards por falha se necessário.
- [ ] **T27 - Criar health e logs sanitizados** (plataforma, M, alta; T22). Aceite: readiness local, correlação e shutdown. Verificar: Q42-Q44. Alvos: operação em ambas as stacks e testes; separar se exceder cinco arquivos.
- [ ] **T28 - Empacotar aplicações no Compose** (plataforma, M, alta; T10,T17,T27). Aceite: imagens sem root, init/migration esperados e persistência. Verificar: PLA01/PLA06. Alvos: Dockerfiles, Compose e smoke.

## Qualidade e gate

- [ ] **T29 - Validar contratos com produtor/consumidor** (qualidade, M, alta; T22,T24). Aceite: respostas/casos inválidos coerentes com OpenAPI. Verificar: `test:contracts`. Alvos: schemas e testes de contrato.
- [ ] **T30 - Executar fluxo com serviços e bancos reais** (qualidade, M, bloqueante; T28,T29). Aceite: exemplo canônico e consulta histórica reais. Verificar: Q01/INT01. Alvos: harness de sistema e cenários.
- [ ] **T31 - Demonstrar ausência de N+1 e índice** (qualidade, M, alta; T12,T24). Aceite: 1/10/100 IDs e consultas de pedidos limitadas. Verificar: Q25/Q41 e explain. Alvos: experimento, teste de contagem e evidência.
- [ ] **T32 - Medir desempenho de laboratório** (qualidade, P, média; T30). Aceite: execução com ambiente/resultados declarados. Verificar: experimento, sem alegação de SLA. Alvos: roteiro e relatório.
- [ ] **T33 - Completar CI e gate de release/deploy** (plataforma, M, alta; T08,T30,T31). Aceite: todos os checks vinculados ao SHA e dependências corretas. Verificar: Q46. Alvos: workflows e evidência de falha deliberada.

## IA e liderança

- [ ] **T34 - Registrar IA durante código e testes** (ia-e-sdd, P recorrente, alta; inicia T02). Aceite: prompts/decisões reais por incremento. Verificar: IA01/IA02. Alvos: registros `docs/ia/`.
- [ ] **T35 - Revisar validações/mensagens com IA** (ia-e-sdd, M, alta; T29). Aceite: prompt real, saída criticada e testes das sugestões aceitas. Verificar: IA03. Alvos: registro e tabela de revisão.
- [ ] **T36 - Documentar depuração real ou exercício rotulado** (ia-e-sdd, P, alta; durante T26/T30). Aceite: reprodução, hipótese e evidência, sem narrativa inventada. Verificar: IA02. Alvos: registro de depuração.
- [ ] **T37 - Redigir guia curto multi-stack** (governanca, M, alta; T22). Aceite: bloqueadores, exemplos e fluxo prático. Verificar: GOV02-GOV04. Alvos: fonte do guia.
- [ ] **T38 - Gerar e revisar PDF do guia** (governanca, P, alta; T37). Aceite: uma ou duas páginas legíveis. Verificar: renderização e contagem. Alvos: script de PDF, PDF e evidência visual.
- [ ] **T39 - Refinar dimensionamento e resumo executivo** (proposta, M, alta; T20). Aceite: 240 h, dois profissionais, riscos/cortes e premissas. Verificar: PROP01-PROP05. Alvos: documento final e resumo.

## Entrega e extensões

- [ ] **T40 - Completar README e exemplos reais** (entrega, M, bloqueante; T28,T30). Aceite: comandos reproduzíveis, troubleshooting e limites. Verificar: Q48 em ambiente limpo. Alvos: README, `.http` e docs operacionais.
- [ ] **T41 - Fechar documento de IA e resolver link** (entrega, P, bloqueante; T34-T36). Aceite: ferramenta/motivo/ciclo e link real acessível. Verificar: IA05/Q50. Alvos: `docs/uso-de-ia.md` e checklist.
- [ ] **T42 - Revisar pacote e preparar release GitFlow** (entrega, M, bloqueante; T33,T38-T41). Aceite: tag/commit, artefatos e matriz real; origem confidencial excluída. Verificar: checklist e Q47/Q49. Alvos: release notes, evidências e matriz.
- [ ] **T43 - Publicar pacote GitHub na fase autorizada de entrega** (entrega, P, bloqueante; T42). Aceite: repositório e links acessíveis ao avaliador. Verificar: acesso e correspondência da tag. Alvos: remoto/configuração/documentação de entrega.
- [ ] **T44 - Produzir roteiro e eventual vídeo/slides** (entrega, M, média; T42). Aceite: 5-7 minutos e mesma versão; execução final condicional. Verificar: apresentação reproduzida. Alvos: roteiro e material escolhido.
- [ ] **T45 - Implantar em cloud se condições permitirem** (plataforma, M por fatia, baixa/condicional; T33,T42). Aceite: conta/orçamento/acesso definidos, HTTPS, gate, smoke e plano de remoção. Verificar: PLA05 e recurso real. Dividir rede, dados e aplicações em cards próprios antes de executar; não cabe como tarefa única de meio dia.

T45 é um item de descoberta de extensão, sem estimativa fechada e sem consumo prometido da reserva. Os itens condicionais não bloqueiam núcleo, guia, proposta e link de IA.
