# Campanha de QA — 22/10/2026

Estado: **concluída com limitações externas documentadas**. Os 47 casos têm tentativa e evidência ou justificativa; o resultado final é 45 `PASSOU`, 0 `FALHOU`, 1 `BLOQUEADO` e 1 `NÃO EXECUTADO`. Veja [resultados por caso](resultados.md), [histórico completo](execucao.json), [correções](correcoes.md) e [relatório final](relatorio-2026-10-22.md).

**Nota temporal:** esta campanha registra a fotografia do checkout e do ambiente de QA no momento em que foi executada em 22/10/2026, antes da publicação GitHub e dos ajustes de entrega desta revisão. O GAT06 e os arquivos individuais abaixo continuam sendo evidência histórica e não foram reescritos. Depois da campanha, o repositório foi publicado e o workflow GitHub Actions executou; confira o estado do commit atual em [GitHub Actions](https://github.com/EricoCalasans/DesafioStefanini/actions) e os limites atuais em [SPEC-plataforma](../../specs/SPEC-plataforma.md). Não há branch protection/required checks configurados nem deploy cloud.

A cobertura de código foi medida e ganhou gates locais em 23/10/2026. Consulte o [registro atual de cobertura](cobertura-2026-10-23.md); o GAT07 abaixo continua descrevendo corretamente a campanha histórica, anterior à implementação desses gates.

## Reconhecimento e escopo

- Base inicial: `90a6850`, branch `feature/t02-bootstrap`, Git limpo. Não há `AGENTS.md` aplicável encontrado na árvore ou ancestrais. Convenções: `docs/fluxo-git.md`, ADRs e comandos reais de cada projeto.
- Runtime confirmado: Node 24.22.1, TypeScript 6, NestJS 12, pg; .NET SDK 10.0.402, ASP.NET Core, MongoDB.Driver; PostgreSQL 17.11 e MongoDB 8.0.34. APIs HTTP `/api/v1`, Swagger e health checks. Sem frontend.
- Implementado: consulta de produtos ativos/detalhe/lote, criação/cálculo/persistência/listagem/detalhe de pedidos, snapshots, migrações, init/seed e health/logs.
- Fronteiras atuais: `security: []` nos contratos; sem login, usuários, papéis HTTP, propriedade ou tenants. Há papéis restritos nos bancos. Não há estoque, pagamento, cancelamento, edição/exclusão de pedido, exclusão lógica, agendamento nem vigência futura. Produto inativo sai da lista e aparece no detalhe/lote. Esses recursos ausentes não serão inventados como casos de produto.
- Responsividade, foco, carregamento visual e acessibilidade de produto não se aplicam: somente APIs e Swagger de desenvolvimento. Datas de contrato são UTC; não há regra comercial por dia/fuso ou horário de verão.
- `docs/evidencias/*` e os resultados individuais abaixo são registros datados. A execução usou os manifests então vigentes (`CATALOG_URL`, `ORDERS_*`, `CATALOG_MONGODB_*`, scripts de `infra/`); o spec atual de plataforma foi reconciliado depois com os nomes e comandos reais. Metas de cobertura/carga e deploy/CD que não existem continuam não sendo apresentados como realizados.

## Ambiente e ordem

QA local isolado: Compose `desafio-qa-20261022`, bancos e volumes próprios. Pedidos: `http://127.0.0.1:33000`; Catálogo: `http://127.0.0.1:38080`; PostgreSQL: 35432; Mongo: 37017. Credenciais aleatórias na pasta irmã `desafio-local/qa-20261022`, fora do Git. A composição preexistente nas portas 3000/8080/5432/27017 foi preservada. Nenhum destino remoto ou tráfego de produção.

Os validadores Python usam um venv em `desafio-local/qa-20261022/venv-documentacao`, instalado por `preparar.ps1` a partir das versões fixadas em `docs/validation/requirements-documentacao.txt`; o Python global não é alterado.

1. [Ambiente e configuração](planos/01-ambiente.md)
2. [Catálogo: consultas](planos/02-catalogo-consultas.md)
3. [Catálogo: lote](planos/03-catalogo-lote.md)
4. [Dinheiro e desconto](planos/04-valores-descontos.md)
5. [Criação de pedidos](planos/05-criacao-pedidos.md)
6. [Leituras e histórico](planos/06-leituras-historico.md)
7. [Falhas e recuperação](planos/07-falhas-integracao.md)
8. [Dados e infraestrutura](planos/08-dados-infra.md)
9. [Contratos e entrega](planos/09-contratos-entrega.md)

Cada caso contém variações relacionadas ao comportamento real. As variações são executadas na ordem do harness, com asserções específicas; uma reprovação interrompe imediatamente o arquivo e os seguintes. Concorrência dentro de um caso é deliberada. As áreas não são executadas em paralelo.

## Reproduzir e retomar

```powershell
node docs/qa/scripts/campanha.mjs --planejar
.\docs\qa\scripts\preparar.ps1
node docs/qa/scripts/campanha.mjs --area=1
# Repetir áreas 2 a 9, na ordem, somente depois de resolver as falhas.
node docs/qa/scripts/campanha.mjs --caso=CAT04
```

O executor mantém tentativas anteriores e ignora casos já aprovados ao retomar uma área. Para um reteste explícito, use `--caso=ID`. A preparação preserva credenciais já criadas. Nunca apontar os testes para os bancos preexistentes ou produção. Logs de comandos são sanitizados; requests/respostas usam somente dados sintéticos. Interrupções de banco e fixtures são restauradas em `finally`.

## Legenda e aceite

`PASSOU`: comportamento esperado observado com evidência. `FALHOU`: divergência reproduzível e campanha interrompida. `BLOQUEADO`: dependência concreta indisponível; motivo obrigatório, sem equivaler a aprovação. `NÃO EXECUTADO`: ainda não executado ou limitação justificada. Erro de validação esperado conta como PASSOU. Resultado final e histórico não se confundem: uma falha corrigida continua nas tentativas.

Aceite da campanha histórica: todos os casos tinham resultado/evidência ou limitação concreta; GAT07 não mediu carga de escrita nem cobertura, porque esses gates não existiam no projeto à época. GAT06 ficou bloqueado naquele checkout, que não tinha remoto; a publicação e a CI ocorreram posteriormente. A campanha não é reclassificada retroativamente como teste do SHA final e não representa aprovação externa.
