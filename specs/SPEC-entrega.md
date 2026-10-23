# Spec - `entrega`

**Versão:** 1.1. **Status:** os dois serviços, documentação, guia, proposta, slides, publicação GitHub e link compartilhável estão preparados. O PR #1 foi integrado; o merge commit publicado em `main`, `develop` e `master` passou na CI. O checklist registra o SHA e os limites de revisão/branch protection. **Origem:** R14, R17-R19, R44-R53.

## 1. Objetivo e inventário final

Disponibilizar um repositório GitHub que permita conferir cada requisito e reproduzir o sistema sem depender de conhecimento tácito. O pacote de referência está no [repositório](https://github.com/EricoCalasans/DesafioStefanini); os artefatos locais e estado de submissão estão no [checklist](../docs/entrega/checklist-submissao.md).

| Artefato | Conteúdo | Estado/evidência |
|---|---|---|
| Código dos serviços | Pedidos e Catálogo com bancos independentes | Código versionado, builds e testes |
| README operacional | Pré-requisitos, setup, variáveis, execução, seed, testes, uso e limites | Reprodução em ambiente limpo |
| Contratos e Swagger UI | OpenAPI coerente com endpoints | OpenAPI validado e respostas reais verificadas contra schemas canônicos; Swagger UI e smoke disponíveis |
| Compose/Dockerfiles | Ambiente e init/migrations | Health + smoke em execução limpa |
| CI | Testes e verificações no mesmo job antes de promover | GitHub Actions executa checks em push/PR; sem deploy e sem branch protection configurada |
| Specs/ADRs | Requisitos, justificativas e alterações | Histórico anterior aos incrementos |
| Guia de governança | Fonte editável e PDF de 1-2 páginas | Número de páginas e revisão visual |
| Dimensionamento | Três semanas, sênior + pleno, premissas e riscos | Conferência de esforço/calendário |
| Documento `docs/uso-de-ia.md` | Ferramenta, motivo, processo, prompts, decisões e validação | Registros reais por etapa |
| Link de conversa IA | Link público da conversa | URL registrada e aberta sem autenticação; encaminhar ao avaliador |
| Commit de entrega | SHA principal cujos checks foram verificados | Merge commit `31e3e66` passou nos checks de `main`/`develop`/`master`; sem imagem publicada |
| Apresentação desejável | Slides e roteiro de 6–7 minutos | PowerPoint editável revisado em `docs/apresentacao/`; vídeo não produzido |

## 2. README final

O [README da raiz](../README.md) é o guia operacional e índice de navegação desta versão. Ele contém:

1. Problema, diagrama, stack e razões.
2. Requisitos de sistema e versões fixadas, incluindo Docker/Node/.NET conforme o modo de execução.
3. Criar `.env` a partir do exemplo, definir senhas e explicar cada variável.
4. Subir ambiente, aguardar jobs de init e health; indicar URLs/portas.
5. Seed, migração, parada e persistência; reset separado e claramente destrutivo.
6. Executar requisições canônicas e mostrar respostas reais.
7. Rodar checks por nível, explicar isolamento e requisitos de Docker.
8. Navegar por arquitetura, specs, guia, proposta e evidências de IA.
9. Explicar limites: demo local, dados sintéticos, sem estoque/autenticação/idempotência, cloud se não executado.
10. Troubleshooting: porta ocupada, Docker parado, credenciais/volumes, falha no seed, migração e Catálogo inacessível.

Não deixar comandos que dependem de conhecimento tácito, segredos do desenvolvedor ou caminhos absolutos desta máquina para executar a aplicação. Links de navegação no repositório serão relativos; links mostrados ao candidato no chat podem usar o caminho absoluto local.

## 3. Exemplo reproduzível em PowerShell

Contrato de demonstração já executado contra os serviços reais no smoke de sistema. O exemplo PowerShell equivalente pode ser executado depois de subir o ambiente e seed:

```powershell
$products = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/products'
$payload = @{
  customer = @{ name = 'Cliente Exemplo'; email = 'cliente@example.com' }
  items = @(
    @{ productId = '11111111-1111-4111-8111-111111111111'; quantity = 2 }
    @{ productId = '22222222-2222-4222-8222-222222222222'; quantity = 1 }
  )
} | ConvertTo-Json -Depth 5
$order = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/v1/orders' -ContentType 'application/json' -Body $payload
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/orders/$($order.id)"
Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/orders?page=1&pageSize=20'
```

Com a configuração canônica: subtotal 50.000, desconto 5.000, total 45.000. Os exemplos `.http` estão dentro de cada projeto. O smoke de sistema executou o mesmo payload canônico e consultas reais; não afirma que cada chamada PowerShell acima foi executada literalmente.

## 4. Demonstração sugerida de 5-7 minutos

1. Em até 1 minuto: problema, fronteiras e justificativa das duas stacks.
2. Em 2 minutos: Catálogo, criação, totais/desconto e consulta do pedido.
3. Em 1 minuto: erro com produto inativo, nenhum pedido parcial e explicação do lote.
4. Em 1 minuto: teste de rollback/SQL parametrizado, CI e histórico estável.
5. Em 1-2 minutos: IA validada, SDD, guia e dimensionamento; limites e trade-offs.

Não é obrigação produzir três formatos. Um roteiro basta no planejamento; se houver material final, escolher vídeo **ou** slides de modo a preservar tempo do núcleo. Não usar capturas com dados/segredos ou fingir um deploy que não ocorreu.

## 5. Checklist de submissão

- [x] Repositório público e ambos os serviços presentes.
- [x] Merge commit `31e3e66` corresponde à versão publicada e tem CI aprovada em `main`, `develop` e `master`; runs no [registro hospedado](../docs/evidencias/ci-hospedada.md).
- [x] Setup e exemplos reproduzidos em composição temporária com volumes vazios; smoke, contratos runtime e integração PostgreSQL passaram. Consulte `docs/evidencias/setup-limpo.md`.
- [x] Testes obrigatórios, contratos, build e lint/format passaram localmente; a CI do merge commit também passou nas três branches.
- [x] Regra configurável demonstrada; pedidos antigos preservados em testes de integração.
- [x] Consulta em lote, índice, SQL parametrizado e rollback têm evidência.
- [x] Guia de 1–2 páginas e proposta de três semanas/sênior/pleno anexados.
- [x] Documento de ferramenta/uso de IA, prompts e decisões de validação documentados.
- [x] **Link real da conversa com IA presente e acessível sem autenticação.**
- [x] PDF de origem e credenciais permanecem fora do Git; `.env` está ignorado.
- [x] Limitações, diferenciais não implementados e ausência de cloud estão declarados.
- [x] Slides finais estão no mesmo repositório e na versão publicada.

O link público abriu sem autenticação; o checklist deve ser encaminhado com essa URL ao avaliador. O PR #1 foi integrado depois dos checks do head passarem. Não houve revisão independente por outra pessoa; também não declarar branch protection ou deploy sem evidência.

## 6. Comandos disponíveis de verificação

```powershell
Push-Location pedidos-typescript
npm ci
npm run build
npm run typecheck
npm run lint
npm test
Pop-Location
.\infra\test-orders.ps1
node infra/smoke-system.mjs
python docs/validation/validar-contratos-runtime.py
.\docs\validation\medir-lote-catalogo.ps1
Push-Location catalogo-dotnet
dotnet restore Catalog.sln --locked-mode
dotnet build Catalog.sln --configuration Release --no-restore
dotnet test Catalog.sln --configuration Release --no-build
dotnet format Catalog.sln --verify-no-changes --no-restore
Pop-Location
python docs/validation/validar-especificacoes.py
```

Repetir apenas o necessário após mudanças; usar o CI como evidência principal do commit. A conferência de acesso ao GitHub/link de IA e a revisão visual do guia não são substituídas por esses scripts.

## 7. Limites de ação e aceite

O repositório foi criado pelo candidato e está publicado. O link da conversa foi gerado e aberto sem autenticação; o candidato o encaminha ao avaliador. Não afirmar que o avaliador já o abriu.

- ENT01: pacote contém todos os itens obrigatórios rastreáveis.
- ENT02: candidato consegue executar e explicar o fluxo e os limites.
- ENT03: material descreve o estado verdadeiro e não confunde plano, teste e entrega.
- ENT04: IA, GitFlow, liderança e diferenciais têm evidências compatíveis com as alegações.
