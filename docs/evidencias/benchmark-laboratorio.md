# Benchmark local de laboratório

**Executado em:** 22/10/2026 às 20:28, horário de Brasília (`America/Sao_Paulo`).
**Roteiro:** `node infra/benchmark-system.mjs --requests=100 --concurrency=8 --warmups=2`.
**Ambiente:** Windows com Node.js `24.22.1`; Docker Engine `29.9.2`, Compose `v5.6.0`; Catálogo ASP.NET Core/.NET 10, MongoDB `8.0.34-noble`, Pedidos NestJS/Node 24 e PostgreSQL `17.11` em Docker Compose.

O roteiro enviou 100 requisições medidas por cenário, com concorrência máxima de oito e duas requisições de aquecimento por cenário. O total medido foi de 500 requisições. Todos os destinos responderam com sucesso; não houve escrita de pedidos. `p50`, `p95` e `p99` são percentis da duração HTTP observada pelo processo Node no host. A taxa é calculada com o tempo total de cada cenário.

| Cenário | Sucesso | Falhas | Req/s | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|
| Catálogo - página de produtos ativos | 100/100 | 0 | 871,61 | 4,69 | 34,41 | 40,28 |
| Pedidos - página de resumos | 100/100 | 0 | 832,97 | 8,18 | 22,53 | 26,77 |
| Catálogo - lote de 1 ID | 100/100 | 0 | 1.436,53 | 4,83 | 8,38 | 12,21 |
| Catálogo - lote de 10 IDs | 100/100 | 0 | 1.570,92 | 4,14 | 7,75 | 24,37 |
| Catálogo - lote de 100 IDs | 100/100 | 0 | 1.171,54 | 6,26 | 10,23 | 12,23 |

## Limites

Esta execução é um retrato pequeno do loopback em uma máquina de desenvolvimento: 100 amostras por cenário, poucos documentos de Catálogo e volume pequeno de pedidos. Latência inclui host, Docker, rede local e aplicação; outras cargas da máquina influenciam os números. Os dados não são uma estimativa de capacidade em produção, uma comparação de hardware nem um SLA. A amostra curta deixa os percentis de cauda instáveis. O roteiro mede páginas de leitura e o endpoint de lote do Catálogo; não mede criação de pedidos sob carga, saturação, concorrência de escrita ou comportamento prolongado. Nenhuma meta de desempenho foi inferida destes resultados.

Para repetir com os valores padrão, execute `node infra/benchmark-system.mjs` com os serviços locais saudáveis. Os parâmetros `--requests`, `--concurrency` e `--warmups` têm limites defensivos e o roteiro falha se qualquer requisição retornar erro. URLs alternativas podem ser informadas por `ORDERS_BENCHMARK_URL` e `CATALOG_BENCHMARK_URL`.
