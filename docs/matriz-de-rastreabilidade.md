# Matriz de rastreabilidade do desafio

**Data:** 21/10/2026, atualizada em 23/10. **Status global:** núcleo funcional, documentação de entrega, artefatos de liderança, link compartilhável e CI hospedada concluídos. O checklist abaixo separa evidências produzidas de itens condicionais ou ainda pendentes, especialmente PRs reais, enforcement de branch protection e CI do SHA final.

53 pontos foram identificados a partir de todas as seções. O número inclui competências contextuais, critérios e repetições relevantes da entrega; **não significa 53 funcionalidades nem 53 obrigações de mesmo peso**. OBR = obrigação explícita; CTX = contexto/critério; DIF = diferencial; ART = artefato incluído por leitura conservadora do objetivo/entrega.

Página é a posição física no PDF. Cenários Qxx estão em [qualidade](../specs/SPEC-qualidade.md). Siglas de aceite, como ORD01 e GOV01, estão nas specs indicadas. A coluna de evidência aponta o aceite verificável e os artefatos atuais; a seção de estado abaixo distingue execução local, hospedada e itens condicionais.

| ID | Fonte / página | Natureza e ponto coberto | Spec / documento | Aceite ou evidência associada |
|---|---|---|---|---|
| R01 | §1, p3 | CTX multi-stack e front-end | [Arquitetura](arquitetura.md), [governança](../specs/SPEC-governanca.md) | Duas stacks e guia; ausência de obrigação de UI explicitada |
| R02 | §1, p3 | CTX REST/microsserviços | [Integração](../specs/SPEC-integracao.md) | INT01; dois processos e HTTP real |
| R03 | §1, p3 | CTX SQL/NoSQL | [Pedidos](../specs/SPEC-pedidos.md), [Catálogo](../specs/SPEC-catalogo.md) | PostgreSQL e MongoDB reais |
| R04 | §1, p3 | CTX Clean Code | [Arquitetura](arquitetura.md), [governança](../specs/SPEC-governanca.md) | Domínio isolado e review |
| R05 | §1, p3 | CTX testes e review | [Qualidade](../specs/SPEC-qualidade.md), [governança](../specs/SPEC-governanca.md) | Matriz Q01-Q50 e guia |
| R06 | §1, p3 | CTX Git/GitFlow | [Plataforma](../specs/SPEC-plataforma.md) | PLA03; histórico/PRs |
| R07 | §1, p3 | CTX CI/CD cloud | [Plataforma](../specs/SPEC-plataforma.md) | PLA04/05; cloud real condicional |
| R08 | §1, p3 | CTX liderança/mentoria | [Governança](../specs/SPEC-governanca.md), [proposta](../specs/SPEC-proposta.md) | GOV04; responsabilidades e mentoria |
| R09 | §1, p3 | CTX padrões entre squads | [Governança](../specs/SPEC-governanca.md) | GOV02-GOV04 |
| R10 | §1, p3 | CTX dimensionamento/precificação | [Proposta](../specs/SPEC-proposta.md) | PROP01-PROP05; números assumidos |
| R11 | §1, p3 | CTX IA no desenvolvimento | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | IA01/02; registros reais |
| R12 | §1, p3 | DIF SAI APP 3.0 | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | Somente se houver acesso; não declarado como usado |
| R13 | Adendo, p4 | OBR uso de IA | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | Registro de especificação, código, depuração, testes e revisão em `docs/uso-de-ia.md` e `docs/ia/` |
| R14 | Adendo, p4 | OBR link da conversa | [IA/SDD](../specs/SPEC-ia-e-sdd.md), [entrega](../specs/SPEC-entrega.md) | IA05/Q50; link público aberto sem autenticação; avaliador ainda não confirmou acesso |
| R15 | §2.1, p4 | OBR dois serviços | [Mapa](CAPABILITY-MAP.md), [integração](../specs/SPEC-integracao.md) | INT01; execução independente |
| R16 | §2.1, p4 | OBR preços do Catálogo em cada criação | [Pedidos](../specs/SPEC-pedidos.md), [integração](../specs/SPEC-integracao.md) | INT01/02; Q29-Q36 |
| R17 | §2.1, p4 | ART guia de code review | [Governança](../specs/SPEC-governanca.md) | GOV01-GOV04 |
| R18 | §2.1, p4 | ART dimensionamento | [Proposta](../specs/SPEC-proposta.md) | PROP01-PROP05 |
| R19 | §2.1, p4 | DIF Spec-Driven Development | [IA/SDD](../specs/SPEC-ia-e-sdd.md), [plano](tasks/plan.md) | IA04; histórico de specs anterior ao código |
| R20 | §2.2.1.1, p4 | OBR stack livre justificada | [Arquitetura](arquitetura.md), [ADR001](adr/001-stacks-e-fronteiras.md) | Razões/alternativas e build |
| R21 | §2.2.1.1, p4 | OBR Clean Code/Architecture | [Pedidos](../specs/SPEC-pedidos.md), [arquitetura](arquitetura.md) | Revisão de dependências e testes puros |
| R22 | §2.2.1.1, p4 | OBR banco relacional | [Pedidos](../specs/SPEC-pedidos.md) | ORD05/06; migrations e constraints |
| R23 | §2.2.1.2, p4 | OBR criar pedido | [Pedidos](../specs/SPEC-pedidos.md) | ORD01/04/08; Q01/Q11-Q18 |
| R24 | §2.2.1.2, p4 | OBR listar pedidos | [Pedidos](../specs/SPEC-pedidos.md) | ORD07; Q20-Q22/Q41 |
| R25 | §2.2.1.2, p4 | OBR consultar pedido | [Pedidos](../specs/SPEC-pedidos.md) | ORD07; Q19/Q36 |
| R26 | §2.2.1.2, p4 | OBR cliente/itens/quantidades/subtotal/desconto/total/status | [Pedidos](../specs/SPEC-pedidos.md), [OpenAPI](../contracts/pedidos.openapi.yaml) | ORD01; contrato e snapshot |
| R27 | §2.2.1.2, p4 | OBR desconto configurável | [Pedidos](../specs/SPEC-pedidos.md), [ADR002](adr/002-dinheiro-e-desconto.md) | ORD02/03; Q02-Q10 |
| R28 | §2.2.1.2, p4 | OBR SQL parametrizado | [Pedidos](../specs/SPEC-pedidos.md) | ORD06; Q38 e inspeção |
| R29 | §2.2.1.2, p4 | OBR testes da criação | [Qualidade](../specs/SPEC-qualidade.md) | Q01-Q18/Q29-Q40 |
| R30 | §2.2.1.3, p4 | OBR GitFlow e commits organizados | [Plataforma](../specs/SPEC-plataforma.md) | PLA03; branches, PRs, tag |
| R31 | §2.3.1.1, p5 | OBR stack livre e NoSQL | [Catálogo](../specs/SPEC-catalogo.md), [ADR001](adr/001-stacks-e-fronteiras.md) | CAT04; MongoDB real |
| R32 | §2.3.1.2, p5 | OBR produtos com preço vigente | [Catálogo](../specs/SPEC-catalogo.md) | CAT01/CAT06; Q23-Q24 |
| R33 | §2.3.1.2, p5 | OBR REST consumido por Pedidos | [Integração](../specs/SPEC-integracao.md), [OpenAPI](../contracts/catalogo.openapi.yaml) | INT01; chamada HTTP real |
| R34 | §2.3.1.2, p5 | OBR consulta eficiente, sem N+1 | [Catálogo](../specs/SPEC-catalogo.md), [qualidade](../specs/SPEC-qualidade.md) | CAT02/INT02; Q25/Q31 |
| R35 | §2.4.1, p6 | DIF IA revendo validações/mensagens | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | IA03; revisão real futura |
| R36 | §2.4.1, p6 | DIF prompt e saída validados | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | IA02/03; decisões aceitar/rejeitar/ajustar |
| R37 | §2.4.2, p6 | DIF testes como gate antes de deploy | [Plataforma](../specs/SPEC-plataforma.md), [qualidade](../specs/SPEC-qualidade.md) | Workflow executa em push/PR; branch protection não está configurada e não existe deploy |
| R38 | §2.4.3, p6 | DIF/ART guia 1-2 páginas multi-stack | [Governança](../specs/SPEC-governanca.md) | GOV01/03; PDF final e revisão visual |
| R39 | §2.4.3, p6 | DIF/ART bloqueadores de PR | [Governança](../specs/SPEC-governanca.md) | GOV02; checklist objetivo |
| R40 | §2.4.4, p6 | DIF/ART esforço, senioridade, composição, premissas | [Proposta](../specs/SPEC-proposta.md) | PROP02-PROP04 |
| R41 | §2.4.4, p6 | DIF/ART 3 semanas, sênior e pleno | [Proposta](../specs/SPEC-proposta.md) | PROP01/02; 240 h reconciliadas |
| R42 | §3, p7 | CTX qualidade/vulnerabilidades | [Arquitetura](arquitetura.md), [qualidade](../specs/SPEC-qualidade.md) | Q37-Q43 e review |
| R43 | §3, p7 | CTX serviços funcionais/integrados | [Integração](../specs/SPEC-integracao.md) | INT01/03/04; testes reais |
| R44 | §3, p7 | CTX docs setup/config/uso/prompts | [Entrega](../specs/SPEC-entrega.md), [IA/SDD](../specs/SPEC-ia-e-sdd.md) | Q48/Q50; README reproduzido |
| R45 | §3, p7 | CTX GitHub/PRs/GitFlow | [Plataforma](../specs/SPEC-plataforma.md) | Repositório, branches e commits publicados; PRs reais precisam de links próprios |
| R46 | §3, p7 | CTX qualidade dos diferenciais | [Governança](../specs/SPEC-governanca.md), [proposta](../specs/SPEC-proposta.md), [IA/SDD](../specs/SPEC-ia-e-sdd.md) | Q49/Q50 e revisão |
| R47 | §3, p7 | CTX IA em especificação/código/testes/depuração | [IA/SDD](../specs/SPEC-ia-e-sdd.md) | IA01-IA04; evidências por etapa |
| R48 | §3, p7 | CTX liderança e comunicação não técnica | [Governança](../specs/SPEC-governanca.md), [proposta](../specs/SPEC-proposta.md) | GOV04/PROP04; resumo executivo |
| R49 | §4, p7 | OBR código de ambos no GitHub e README | [Entrega](../specs/SPEC-entrega.md) | ENT01/02; repositório acessível |
| R50 | §4, p7 | OBR documento da ferramenta/motivo/processo IA | [IA/SDD](../specs/SPEC-ia-e-sdd.md), [entrega](../specs/SPEC-entrega.md) | IA01/02; `docs/uso-de-ia.md` e `docs/ia/` |
| R51 | §4, p7 | ART guia e dimensionamento anexos | [Entrega](../specs/SPEC-entrega.md) | GOV01/PROP01; docs no repositório |
| R52 | §4, p7 | OBR link da conversa reiterado | [IA/SDD](../specs/SPEC-ia-e-sdd.md), [entrega](../specs/SPEC-entrega.md) | IA05; URL pública registrada e aberta sem autenticação; avaliador ainda não confirmou acesso |
| R53 | §4, p7 | DIF desejável vídeo ou slides | [Entrega](../specs/SPEC-entrega.md) | Slides editáveis de sete páginas e roteiro de 6–7 minutos em `docs/apresentacao/` |

## Cobertura de decisões complementares

| Lacuna do PDF | Decisão proposta | Onde verificar |
|---|---|---|
| Cliente | Nome/e-mail como fotografia, sem cadastro | Pedidos e OpenAPI |
| Moeda e precisão | BRL, centavos, bigint e teto explícito | ADR002, Q01-Q08 |
| Fórmula do desconto | Limiar inclusivo, pontos-base, HALF_UP | Pedidos, Q02-Q05 |
| Alteração da regra | Ambiente + reinício; snapshot por pedido | Q09-Q10 |
| Status/ciclo | Apenas CREATED; sem pagamento/cancelamento | PRD e contrato |
| Preço vigente | Valor atual no instante da consulta; histórico no pedido | ADR003, Q35 |
| Falha entre serviços | 422/502/503/504, sem gravação indevida | Integração, Q29-Q34 |
| Quantidade/duplicados | 1-100 linhas distintas, 1-10.000 unidades | Q13-Q16 |
| Paginação | Página limitada e ordem determinística | Q20-Q22 |
| Garantia de uma única criação | Não há idempotência no núcleo; sem retry automático | ADR003, Q40 |
| Interface de negócio | Fora do núcleo; Swagger UI e exemplos | PRD e Entrega |

## Estado de implementação e entrega em 22/10/2026

| Faixa de requisitos | Estado verificável nesta versão |
|---|---|
| R15-R16, R20-R29 | Pedidos está implementado em NestJS/PostgreSQL. Criação canônica, cálculo, snapshots, validação, persistência atômica, leituras e paginação passaram em testes unitários/HTTP, integração PostgreSQL e smoke real. |
| R31-R34 | Catálogo está implementado em ASP.NET Core/MongoDB; busca individual, listagem e `$in` em lote foram exercitados. Profiler registrou um `find` para 1/10/100 IDs; `explain` confirmou `_id_` e `ix_products_active_id`. O dataset pequeno não é benchmark de capacidade. |
| GitFlow / commits | Repositório público com `main`, `develop` e `master`; política, template e commits existem. Links de PR não são alegados sem PR real; branch protection não foi configurada/verificada. |
| R37, R42-R44 | Build, lint, format, testes, validação documental, contrato runtime e smoke passaram localmente. GitHub Actions executa o mesmo conjunto em um job de CI; não há deploy nem enforcement de status checks por branch. |
| R11-R14, R35-R36, R47, R50, R52 | Uso de IA ao longo do ciclo e revisão dedicada de mensagens estão documentados; o link público abriu sem autenticação e está no README/checklist. O avaliador ainda não confirmou seu acesso. |
| R17, R38-R39, R40-R41, R48, R51 | Guia multi-stack em fonte e PDF de duas páginas, proposta de três semanas/sênior/pleno, resumo executivo e slides foram criados. A revisão independente por outra pessoa não foi realizada. |
| R07, R12, R45, R49, R53 | Código em GitHub e CI estão publicados; SAI APP 3.0 não foi usado; cloud e deploy ficam condicionais; slides foram produzidos e vídeo não. |

O [checklist de submissão](entrega/checklist-submissao.md) é a fonte operacional para o estado final. Um arquivo de contrato/spec ou uma configuração de pipeline não é apresentado como aprovação da banca, branch protection, publicação de imagem, deploy ou revisão independente.
