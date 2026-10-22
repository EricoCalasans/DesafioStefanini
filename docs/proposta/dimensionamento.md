# Dimensionamento executivo - APIs de Pedidos e Catálogo

**Cenário hipotético do desafio · versão 1.0 · 22/10/2026**

## Resumo executivo

Propomos entregar as Partes 1 e 2 em três semanas úteis com uma equipe de duas pessoas: um desenvolvedor sênior e um desenvolvedor pleno. A capacidade nominal é de **240 horas** (120 h por pessoa). A estimativa de trabalho é **204 horas**, com **36 horas de reserva explícita** para risco e estabilização. Testes, revisão, documentação, coordenação e uso de IA estão incluídos nas horas; não há capacidade oculta de QA, DevOps ou gestão.

O resultado é composto por duas APIs independentes: Pedidos em TypeScript/NestJS com PostgreSQL e Catálogo em C#/ASP.NET Core com MongoDB. O serviço de Pedidos consulta preços atuais por HTTP, aplica a política de desconto e persiste snapshots; o serviço de Catálogo responde consultas individuais, paginadas e em lote. O aceite depende de integração real, transação atômica, testes, documentação e um gate de CI. Deploy em cloud e vídeo/slides não fazem parte da linha-base.

## Escopo e premissas

- Escopo estável conforme PRD e contratos; BRL em centavos, uma política configurável de desconto e status inicial `CREATED`.
- Sem migração de legado, autenticação corporativa, frontend, pagamento, estoque, SLA produtivo ou idempotência de criação.
- Acessos, licenças, toolchain, bancos e ambientes de teste disponíveis no início. Atraso de acesso consome reserva ou exige renegociar o prazo.
- Duas pessoas trabalham em fatias paralelas somente depois de estabilizar o contrato do Catálogo; revisão cruzada cobre decisões de fronteira e dinheiro.
- Cloud, custos de hospedagem e gravação de apresentação são extensões e precisam de aprovação, acesso e orçamento próprios.

## Esforço por pacote

| Pacote | Sênior | Pleno | Total | Resultado verificável |
|---|---:|---:|---:|---|
| Descoberta, specs, contratos e arquitetura | 14 h | 6 h | 20 h | Regras, limites, decisões e contratos revisados |
| Setup, contêineres e CI inicial | 8 h | 8 h | 16 h | Ambiente local e checks básicos reproduzíveis |
| Catálogo, MongoDB, seed e consultas | 10 h | 18 h | 28 h | API de produtos, índice e consulta em lote |
| Domínio de Pedidos e desconto | 12 h | 12 h | 24 h | Agregado e cálculos exatos em centavos |
| Pedidos HTTP/SQL e integração | 18 h | 20 h | 38 h | Fluxo completo persistido e snapshots |
| Testes, falhas, revisão e estabilização | 18 h | 20 h | 38 h | Evidência local, falhas cobertas e correções |
| README, IA, demonstração e empacotamento | 12 h | 12 h | 24 h | Setup reproduzível e pacote de entrega |
| Guia de governança e dimensionamento | 12 h | 4 h | 16 h | Guia curto de review e proposta executiva |
| **Trabalho base** | **104 h** | **100 h** | **204 h** | |
| **Reserva** | **16 h** | **20 h** | **36 h** | Risco e estabilização; não é nova feature |
| **Capacidade total** | **120 h** | **120 h** | **240 h** | 15 dias úteis × 8 h × 2 pessoas |

A reserva equivale a 15% da capacidade total e aproximadamente 17,65% do trabalho base. Essas bases não devem ser somadas como se fossem a mesma porcentagem. Os sete primeiros pacotes somam 188 h para sistema, qualidade e preparação; o pacote final reserva 16 h para governança e dimensionamento.

## Sequência de três semanas

| Semana | Sênior | Pleno | Marco de aceite |
|---|---|---|---|
| 1 | Contratos, fronteiras, dinheiro, revisão de arquitetura e riscos | Bootstrap, MongoDB, seed, endpoints e testes de Catálogo | Catálogo real consultável; regras e contrato estáveis |
| 2 | Integração, transação, review, falhas e gate | Persistência, GETs, paginação e cobertura de Pedidos | POST canônico real, snapshots e rollback provados |
| 3 | Estabilização, escopo, revisão e comunicação | Evidências, README, guia, dimensionamento e empacotamento | Mesmo commit validado, docs coerentes e roteiro pronto |

A divisão é de responsabilidade predominante, não de silos. Ambos implementam e revisam. O sênior conduz contratos, dinheiro, integração e trade-offs; o pleno conduz maior parte do Catálogo, seed, leituras, exemplos e testes, com pareamento nos riscos. As horas por semana reconciliam a tabela de pacotes: base de 36/34 h na semana 1, 36/34 h na semana 2 e 32/32 h na semana 3, com reserva de 4/6 h, 4/6 h e 8/8 h, respectivamente.

## Riscos, gatilhos e resposta

| Gatilho | Efeito | Resposta planejada |
|---|---|---|
| Toolchain ou acesso indisponível no primeiro dia | Bloqueia o bootstrap | Resolver imediatamente; consumir reserva e replanejar se persistir |
| Contrato do Catálogo sem estabilidade até o terceiro dia | Atrasa o consumidor | Congelar o contrato mínimo e testar o adapter contra fixture temporária; substituir por teste real antes do aceite |
| Sem POST integrado real até o fim da segunda semana | Alto risco de prazo | Interromper extensões e tratar integração como bloqueador |
| Defeito em dinheiro, SQL ou rollback | Impede aceite | Corrigir antes de ampliar escopo; não cortar os testes de segurança/integridade |
| Reserva consumida antes da estabilização | Pressiona a data | Tornar o desvio visível; retirar cloud e vídeo primeiro e negociar escopo |
| Link de IA ou artefato inacessível no fechamento | Submissão incompleta | Validar acesso e correspondência com o commit antes de enviar |

## Cortes e aceite

Não reduzir duas stacks, bancos SQL/NoSQL, regra de desconto configurável, consulta ao Catálogo na criação, snapshot histórico, atomicidade, SQL parametrizado ou teste real. Retirar primeiro cloud, vídeo/slides e conveniências de demonstração. O gate final exige build e formatação, testes das duas stacks, integração PostgreSQL, smoke das duas APIs, contratos/documentação válidos, README reproduzido e evidência vinculada ao commit. Configurar CI não equivale a ter sua execução hospedada aprovada.

## Exemplo de preço, apenas para demonstrar o método

Os valores abaixo são hipóteses matemáticas, não cotação da Stefanini nem preço de mercado. Com custo-hora sênior de R$ 160 e pleno de R$ 110, a capacidade total custa `120 × 160 + 120 × 110 = R$ 32.400`. Overhead hipotético de 10% soma R$ 3.240; custo ilustrativo: R$ 35.640. Com tributos hipotéticos de 8% da receita e margem desejada de 20% da receita:

`Preço = R$ 35.640 / (1 - 0,08 - 0,20) = R$ 49.500`.

Conferência: R$ 35.640 de custo + R$ 3.960 de tributos + R$ 9.900 de margem = R$ 49.500. A reserva de 36 h já está incluída nas 240 h; não adicionar outra contingência sem novo risco justificado. Tributos reais, regime, licença, cloud e suporte pós-entrega precisam de avaliação separada.
