# Evidência de CI hospedada

## Execução anterior à revisão de entrega

Em 23/10/2026, o GitHub Actions executou o workflow `verify` no SHA `90bd904` e todos os três pushes consultados terminaram com **Success**. Cada run concluiu o job `tests`, que contém os checks de TypeScript, .NET, documentação, PostgreSQL, smoke e contratos runtime.

| Branch | Run | Resultado |
|---|---|---|
| `feature/t02-bootstrap` | [39889927286](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39889927286) | Success |
| `main` | [39890238557](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39890238557) | Success |
| `develop` | [39890238647](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39890238647) | Success |

## Execução da branch de entrega

Após atualizar o workflow para actions com runtime Node 24, o commit `676a0b88dfca1090a6e6022ba93411f89a31cec4` passou no GitHub Actions, run [39893636611](https://github.com/EricoCalasans/DesafioStefanini/actions/runs/39893636611) (`feature/readme-delivery`, `verify`, conclusão `success`). O run validou Pedidos, Catálogo, OpenAPI/documentação, PostgreSQL, smoke e contratos runtime. A branch foi proposta em [PR #1](https://github.com/EricoCalasans/DesafioStefanini/pull/1); o commit que inclui estes links e o merge ainda precisam de seus próprios checks.

Essas execuções exibiram avisos de que `actions/checkout@v4`, `setup-node@v4`, `setup-dotnet@v4` e `setup-python@v5` usavam Node 20, além da transição do runner `ubuntu-latest`. O workflow foi atualizado para versões oficiais dos actions com runtime Node 24: checkout v7, setup-node v7, setup-dotnet v6 e setup-python v7. A versão base do workflow atual e o estado do commit final ainda precisam de uma nova execução; os resultados acima não são atribuídos a esse SHA.

## Estado do commit de entrega

Preencher esta seção após publicar o commit de documentação e aguardar a execução correspondente em cada branch. Registrar o SHA, link do run e resultado de `main`/`develop`/`master`; não inferir sucesso de um run de SHA anterior.

O workflow executa checks em push e pull request. Não há branch protection/required checks configurados, imagens publicadas, registry ou deploy; portanto, esta evidência comprova CI executada, mas não bloqueio técnico de merge nem deployment.
