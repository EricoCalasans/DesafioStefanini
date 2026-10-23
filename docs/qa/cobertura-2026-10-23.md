# Auditoria de cobertura — 23/10/2026

Esta auditoria amplia a suíte automatizada das duas APIs e instala limites de cobertura executáveis localmente. Os testes de domínio, HTTP, configuração, filtros de erro e adaptadores usam oráculos independentes; os doubles de persistência não substituem os testes com os bancos reais.

## Pedidos — TypeScript

Comandos aprovados:

```powershell
npm run lint
npm run typecheck
npm run test:coverage
```

Resultado: 14 arquivos de teste e 121 testes aprovados. `test:coverage` executa build, Vitest e cobertura V8; os limites são 95% para linhas e instruções, 85% para branches e 90% para funções.

| Métrica | Cobertura |
|---|---:|
| Linhas | 99,80% (507/508) |
| Instruções | 98,91% (546/552) |
| Branches | 92,96% (357/384) |
| Funções | 97,29% (108/111) |

O runner reutilizável de migrations (`src/migrations/runner.ts`) ficou com 100% em linhas, instruções, branches e funções. A única linha descoberta é a guarda contra desconto maior que o subtotal; ela é inalcançável para entradas válidas, pois as taxas aceitas vão de 0 a 10.000 pontos-base. Os entrypoints `src/main.ts` e `src/migrations/run.ts` ficam fora do denominador de V8: o bootstrap HTTP é verificado em subprocesso por `test/bootstrap-http.spec.ts`, e o runner de migrations delega sua lógica ao módulo coberto. Os cenários de migrations contra PostgreSQL real pertencem à suíte de integração.

## Catálogo — C#/.NET

Comandos aprovados:

```powershell
dotnet restore Catalog.sln --locked-mode
dotnet format Catalog.sln --verify-no-changes --no-restore
dotnet test Catalog.sln --configuration Release --no-restore -p:CollectCoverage=true -p:Threshold=95 -p:ThresholdStat=total -p:CoverletOutputFormat=cobertura
```

Resultado: 77 testes aprovados. O Coverlet valida o limite de 95% no total combinado da solução; a saída informa a cobertura por módulo.

| Módulo | Linhas | Branches | Métodos |
|---|---:|---:|---:|
| Catalog.Api | 100% | 93,33% | 100% |
| Catalog.Application | 100% | 100% | 100% |
| Catalog.Domain | 100% | 100% | 100% |
| Catalog.Infrastructure | 100% | 100% | 100% |
| **Total** | **100%** | **95,77%** | **100%** |

## Reteste integrado em 23/10/2026

Depois da auditoria de cobertura, a stack completa foi iniciada em um projeto Compose isolado (`push-verify-20261023`), com portas e volumes próprios. PostgreSQL, MongoDB, Pedidos e avaliador ficaram saudáveis; o Catálogo respondeu às chamadas runtime. Os seis testes de integração PostgreSQL passaram, assim como `infra/smoke-system.mjs` e a validação dos contratos OpenAPI em runtime para as duas APIs. A composição temporária e seus volumes foram removidos após a execução; os containers e bancos locais preexistentes foram preservados.

## Limites desta execução

- O reteste integrado cobriu os fluxos e contratos exercitados pelo smoke; não repetiu a campanha manual completa de 47 casos nem o experimento de contagem/explain no MongoDB. Para esses cenários, as evidências anteriores continuam sendo as referências.
- A cobertura percentual mede código executado nesta suíte e não declara, sozinha, que todos os cenários da matriz Q01-Q50 foram repetidos. Testes que exigem PostgreSQL/MongoDB continuam separados e documentados.

Os artefatos de cobertura são gerados localmente em `pedidos-typescript/coverage/` e `catalogo-dotnet/Catalog.Tests.Unit/coverage.cobertura.xml`; estão ignorados pelo Git para evitar a inclusão de relatórios volumosos.
