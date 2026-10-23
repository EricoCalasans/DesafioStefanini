# Evidência de lote e índices do Catálogo

**Executado em:** 22/10/2026

**Ambiente da medição:** MongoDB `8.0.34-noble` em Docker Compose; quatro produtos sintéticos na fixture usada no experimento; API Catálogo real no loopback. O seed atual do projeto contém 24 produtos (23 ativos e um inativo).

**Roteiro reproduzível:** `docs/validation/medir-lote-catalogo.ps1`.

## Contagem de comandos

O script ativou temporariamente o profiler do banco `catalog`, enviou lotes HTTP com IDs UUID distintos e contou comandos `find` observados no servidor. O estado inicial do profiler era nível 0 e foi restaurado ao fim.

| IDs solicitados | Comandos `find` em `products` | Produtos encontrados | IDs ausentes |
|---:|---:|---:|---:|
| 1 | 1 | 0 | 1 |
| 10 | 1 | 0 | 10 |
| 100 | 1 | 0 | 100 |

A quantidade de consultas de produto permaneceu constante. A saída de dados variou conforme o tamanho solicitado; isso não é medição de latência.

## Planos executados no MongoDB

- **Consulta em lote:** `find({_id: {$in: [id1, id2]}})`. O plano vencedor contém `IXSCAN` no índice automático `_id_`; retornou 2 documentos, examinou 2 documentos e 3 chaves.
- **Página de ativos:** `find({active: true}).sort({_id: 1}).limit(20)`. O plano vencedor contém `IXSCAN` em `ix_products_active_id`; retornou 3 documentos, examinou 3 documentos e 3 chaves.

Os comandos de detalhe ficam em [SPEC-catalogo.md](../../specs/SPEC-catalogo.md); o bootstrap cria os dois índices verificados.

## Limite da evidência

O dataset de quatro documentos é adequado para conferir comando lógico e escolha de índice, mas não para inferir capacidade, p95 ou SLA. O script mede comandos Mongo reais para 1/10/100 IDs. Em Pedidos, a inspeção do adapter e os testes PostgreSQL confirmam contagem fixa por operação: criação usa um INSERT do cabeçalho e um INSERT em lote dos itens, leitura completa usa um SELECT com JOIN e listagem usa dois SELECTs dentro do mesmo snapshot. Não foi executado profiler/medição de comandos PostgreSQL.
