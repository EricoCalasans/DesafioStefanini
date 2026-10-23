# Evidência de CI hospedada

## Execução anterior à revisão de entrega

Em 23/10/2026, o GitHub Actions executou o workflow `verify` no SHA `90bd904` e todos os três pushes consultados terminaram com **Success**. Cada run concluiu o job `tests`, que contém os checks de TypeScript, .NET, documentação, PostgreSQL, smoke e contratos runtime.

| Branch | Run | Resultado |
|---|---|---|
| `feature/t02-bootstrap` | [39889927286](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39889927286) | Success |
| `main` | [39890238557](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39890238557) | Success |
| `develop` | [39890238647](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39890238647) | Success |

## Execução da branch de entrega

Após atualizar o workflow para actions com runtime Node 24, o commit `676a0b88dfca1090a6e6022ba93411f89a31cec4` passou no GitHub Actions, run [39893636611](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39893636611) (`feature/readme-delivery`, `verify`, conclusão `success`). O run validou Pedidos, Catálogo, OpenAPI/documentação, PostgreSQL, smoke e contratos runtime. O commit seguinte, `11a7841`, também passou no run [39893961500](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39893961500) e corresponde ao head aprovado do [PR #1](https://github.com/EricoCalasans/DesafioStefanini/pull/1), integrado a `develop`.

Essas execuções exibiram avisos de que `actions/checkout@v4`, `setup-node@v4`, `setup-dotnet@v4` e `setup-python@v5` usavam Node 20, além da transição do runner `ubuntu-latest`. O workflow foi atualizado para versões oficiais dos actions com runtime Node 24: checkout v7, setup-node v7, setup-dotnet v6 e setup-python v7. Os runs abaixo verificam o merge e as branches alinhadas.

## Estado do commit de entrega

O PR #1 foi integrado pelo merge commit `31e3e667c58f554b6ff433388a095d5c8584622c`. O mesmo SHA foi publicado em `main`, `develop` e `master`; cada branch executou o workflow `verify` com conclusão `success`.

| Branch | SHA | Run | Resultado |
|---|---|---|---|
| `main` | `31e3e66` | [39894269158](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39894269158) | Success |
| `develop` | `31e3e66` | [39894252053](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39894252053) | Success |
| `master` | `31e3e66` | [39894272281](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39894272281) | Success |

O SHA exato da submissão deve sempre ser comparado ao run correspondente no [histórico de Actions](https://github.com/EricoCalasans/DesafioStefanini/actions); um resultado anterior não cobre commits posteriores.

O workflow executa checks em push e pull request. Não há branch protection/required checks configurados, imagens publicadas, registry ou deploy; portanto, esta evidência comprova CI executada, mas não bloqueio técnico de merge nem deployment.
