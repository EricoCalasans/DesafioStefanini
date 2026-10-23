# Spec - `qualidade`

**Versão:** 1.1. **Status:** estratégia implementada e cobertura auditada em 23/10/2026; veja o [registro de cobertura](../docs/qa/cobertura-2026-10-23.md). **Origem:** R04-R05, R21, R28-R29, R34, R37, R42-R48.

## 1. Objetivo e estratégia

Provar regras, persistência, integração e requisitos de avaliação por evidências reproduzíveis. Vitest para TypeScript/ESM; xUnit para C#; PostgreSQL e MongoDB reais em testes de adaptadores; scripts de sistema em TypeScript executando HTTP contra os dois processos. Testes de contrato validam OpenAPI e semântica além do esquema.

Unitários ficam em `pedidos-typescript/test/unit` e `catalogo-dotnet/Catalog.Tests.Unit`; integrações nos diretórios/projetos equivalentes; testes de sistema e desempenho ficam dentro de `pedidos-typescript/test/system` e `pedidos-typescript/test/performance`, pois o fluxo HTTP entre serviços é orquestrado pelo projeto TypeScript. Cada suíte recebe configuração e portas isoladas e nunca apaga a base do candidato.

Relógio e UUID controláveis nos testes de domínio. Adapters reais são verificados sem mock de banco. Stubs do Catálogo são reservados para falhas que seria difícil produzir com o fornecedor real. Pelo menos um fluxo completo usa as duas aplicações e os dois bancos.

## 2. Matriz de cenários - pedidos e dinheiro

| ID | Cenário | Resultado esperado | Nível |
|---|---|---|---|
| Q01 | Pedido canônico 2 teclados + mouse | 50.000 subtotal, 5.000 desconto, 45.000 total | Unitário + sistema |
| Q02 | Subtotal 49.999, 50.000, 50.001; limiar 50.000 | Desconto só a partir do limiar, inclusivo | Unitário |
| Q03 | Desabilitado, taxa zero e taxa 10.000 | Desconto zero, zero e subtotal completo | Unitário |
| Q04 | Subtotal 101, taxa 500 bps | 5 centavos de desconto | Unitário |
| Q05 | Subtotal 105, taxa 1.000 bps, limiar zero | 10,5 arredondado para 11 | Unitário |
| Q06 | Mesmo conjunto reordenado | Mesmo total, ordem de itens preservada | Unitário |
| Q07 | Subtotal no máximo e acima | Aceite do limite; 422 acima | Unitário + integração |
| Q08 | Produto de preço máximo e quantidade máxima | Multiplicação precisa e limite conferido | Unitário |
| Q09 | Política alterada e processo reiniciado | Novos pedidos mudam; antigos não | Sistema |
| Q10 | Política inválida, variável ausente, inteiro fracionário | Startup falha sem tráfego | Processo/config |

## 3. Matriz de cenários - entrada e consulta

| ID | Cenário | Resultado esperado | Nível |
|---|---|---|---|
| Q11 | Cliente/nome/e-mail ausentes, vazios, malformados ou nome com NUL/controles | 400 com campo indicado | HTTP |
| Q12 | Nome/e-mail com espaços externos | Trim; valores válidos preservados | HTTP |
| Q13 | Quantidade 0, -1, 1, 10.000, 10.001, 1,5 e string | Só inteiros 1-10.000 aceitos | HTTP |
| Q14 | Itens vazios, 1, 100 e 101 | Limites aceitos; 400 nos inválidos | HTTP |
| Q15 | IDs duplicados | 422, sem agrupamento nem persistência | HTTP + SQL |
| Q16 | UUID inválido, objeto no lugar de ID, `null` | 400, sem chamada ao fornecedor | HTTP |
| Q17 | Preço/desconto/status/campo desconhecido no body | 400 | HTTP |
| Q18 | JSON quebrado, mídia inválida e corpo >64 KiB | 400, 415 e 413 | HTTP |
| Q19 | Pedido existente/inexistente/ID inválido | 200, 404, 400 | Integração |
| Q20 | Listagem vazia e página além do fim | 200, array vazio e meta correta | Integração |
| Q21 | Paginação e empates em createdAt | Ordem por data/ID, limite e total corretos | Integração |
| Q22 | page/pageSize negativos, fracionários, extras | 400, sem SQL inseguro | HTTP |

## 4. Matriz de cenários - Catálogo e integração

| ID | Cenário | Resultado esperado | Nível |
|---|---|---|---|
| Q23 | Listar ativos e consultar inativo por ID | Ativos na lista, inativo disponível em detalhe | Mongo/HTTP |
| Q24 | Lote misto encontrado/inativo/ausente | Resposta 200 e conjuntos corretos | Mongo/HTTP |
| Q25 | Lotes de 1, 2 e 100 IDs | Um `Find` lógico por lote com `$in` | Adapter real + contagem |
| Q26 | Duplicados/101 IDs/filtro NoSQL no lote | 422/400/400 | HTTP |
| Q27 | Seed executado duas vezes | Sem duplicar; alteração preexistente preservada | Mongo real |
| Q28 | Validador/índice único do MongoDB | Documento inválido/conflito recusados | Mongo real |
| Q29 | Pedido com produto ausente ou inativo | 422, todos inválidos identificados, zero pedidos | Sistema |
| Q30 | Catálogo desligado, 5xx e falha de conexão | 503, sem gravar | Sistema + stub |
| Q31 | Catálogo excede deadline | 504, abort propagado, sem transação aberta | Stub instrumentado |
| Q32 | 200 com preço/moeda/tipo inválido, corpo não JSON ou >256 KiB | 502, sem gravar | Contrato consumidor |
| Q33 | Resposta com ID extra, faltante ou duplicado | 502, sem gravar | Contrato consumidor |
| Q34 | Resposta 4xx inesperada do fornecedor | 502; não culpar cliente externo | Contrato consumidor |
| Q35 | Preço muda depois da criação | Pedido antigo estável; novo recebe preço atual | Sistema |
| Q36 | Catálogo parado depois de criar | GET por ID e listagem continuam funcionando | Sistema |

## 5. Matriz de cenários - SQL, operação e entrega

| ID | Cenário | Resultado esperado | Nível |
|---|---|---|---|
| Q37 | Falha forçada na inserção dos itens | Nenhum cabeçalho/item residual | PostgreSQL real |
| Q38 | Nome com aspas e texto semelhante a SQL | Persistido como texto, tabelas intactas | PostgreSQL real |
| Q39 | SQL indisponível, lock/statement timeout | 503 sanitizado, conexão liberada | Integração |
| Q40 | Cliente cai durante commit | Resultado ambíguo declarado, sem retry cego | Falha controlada/documentação |
| Q41 | Leituras de 1 e 100 pedidos | Quantidade fixa de consultas, sem busca por item | Adapter/inspeção |
| Q42 | Cabeçalho de correlação ausente/válido/inválido | UUID gerado/preservado/substituído, propagado | Sistema |
| Q43 | Erros e logs com entrada sensível | Sem PII, credenciais, SQL ou stack públicos | Inspeção automatizada/manual |
| Q44 | Health com banco fora e Catálogo remoto fora | Live UP; readiness do banco DOWN; GETs não bloqueados pelo fornecedor | Sistema |
| Q45 | Migração repetida e concorrente | Sem reaplicar nem corromper; checksum verificado | PostgreSQL real |
| Q46 | Teste/lint/build de uma stack falha no CI | Nenhum job de release/deploy liberado | Pipeline |
| Q47 | Release do SHA testado | Digest e SHA correspondentes; smoke válido | Pipeline/entrega |
| Q48 | Setup em ambiente limpo | README suficiente, sem segredo implícito | Reprodução manual |
| Q49 | Guia final e proposta | 1-2 páginas; horas/premissas reconciliadas | Revisão documental |
| Q50 | Registro e link obrigatório de IA | Etapas evidenciadas; link real acessível | Checklist de submissão |

Para Q40, o teste não deve alegar que toda falha de rede implica rollback: verificar estados possíveis e observabilidade. Testes destrutivos usam somente ambiente descartável identificado.

## 6. Desempenho e eficiência

Meta interna inicial: com serviços aquecidos, 10 usuários concorrentes e 1.000 criações válidas de 10 itens, p95 de criação ≤1.000 ms e nenhuma falha inesperada. Isso é um alvo de laboratório, não SLA ou requisito da banca. Registrar CPU/RAM, versões, dataset, concorrência, duração, aquecimento e resultados brutos. Não publicar a meta como atingida sem medição.

Rodar experimento separado de lote com 1, 10 e 100 IDs. Quantidade de consultas de produto deve ficar constante; obter `explain` para demonstrar índice. Não exigir tempo idêntico para todos os lotes, nem confundir uma busca lógica com todas as mensagens do protocolo/cursor. Em Pedidos, inserção de itens em lote e leitura sem consultas por linha. Um roteiro local de leitura (`node infra/benchmark-system.mjs`) mede páginas de Pedidos/Catálogo e lotes do Catálogo com contagem, concorrência e aquecimento configuráveis; os resultados estão em [benchmark de laboratório](../docs/evidencias/benchmark-laboratorio.md). A amostra curta e o dataset pequeno não provam SLO/capacidade nem medem escrita.

Os testes de desempenho ficam fora do gate rápido se ambiente de CI for instável; os testes determinísticos de contagem/N+1 ficam no gate obrigatório. Uma falha funcional ou de limite nunca é aceita como simples variação de performance.

## 7. Cobertura e independência

Metas internas de referência: domínio/aplicação de Pedidos com ≥90% de linhas e ≥85% de branches; aplicação/domínio de Catálogo com ≥85% de linhas. Os gates locais atuais são mais estritos no agregado: Pedidos exige ≥95% de linhas/instruções, ≥85% de branches e ≥90% de funções; Catálogo exige ≥95% de cobertura total combinada. Excluir apenas código gerado e entrypoints documentados. Regras críticas e todos os cenários bloqueantes devem ter cobertura comportamental mesmo se a porcentagem geral passar.

Oráculos independentes: exemplos de centavos com cálculo manual, tabelas de borda e fixtures de contrato não geradas por funções de produção. Assertar estado real do banco após rollback, não apenas que `rollback()` foi chamado. Testes com mocks não substituem a evidência de consultas parametrizadas ou índice.

## 8. Comandos e evidências

    Push-Location pedidos-typescript
    npm run test:coverage
    npm run test:integration
    npm run test:contracts
    npm run test:system
    npm run test:performance
    Pop-Location
    Push-Location catalogo-dotnet
    dotnet test Catalog.sln --configuration Release -p:CollectCoverage=true -p:Threshold=95 -p:ThresholdStat=total -p:CoverletOutputFormat=cobertura
    Pop-Location
    python docs/validation/validar-especificacoes.py

Saída mínima: commit/tag, data, comando, ambiente, resumo e artefato/log; falhas e limitações preservadas. Destino `docs/evidencias/<commit>/` ou artefato do CI vinculado. Não versionar dumps com PII nem arquivos gigantes de cobertura sem necessidade. O [registro local de cobertura](../docs/qa/cobertura-2026-10-23.md) informa resultados e dependências não executadas. A [revisão atual das specs](../docs/revisao-das-especificacoes.md) é evidência documental, não execução desta matriz.

## 9. Critérios de conclusão e fronteiras

Sempre resolver cenários críticos Q01-Q03, Q07, Q09-Q10, Q15-Q18, Q25, Q29-Q39, Q46 e Q48-Q50 antes da entrega. Os demais também compõem o aceite planejado, mas podem usar inspeção ou teste no nível adequado. Nunca reduzir o limiar, apagar cenários ou substituir banco real por mock apenas para obter CI verde. Mudança de meta ou corte de escopo exige justificativa registrada.
