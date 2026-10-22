# PRD - Sistema de Pedidos e Catálogo

**Versão:** 1.0. **Data:** 21/10/2026. **Autor:** candidato com apoio de IA. **Status:** proposta completa para revisão; nenhuma funcionalidade implementada.

## 1. Visão e problema

Construir uma demonstração reproduzível de criação e consulta de pedidos cujo preço é validado em um catálogo independente. O projeto deve permitir ao avaliador verificar domínio técnico, uso responsável de IA e julgamento de liderança em um escopo que possa ser explicado e executado com clareza.

O valor para o usuário da API é receber um pedido íntegro e calculado a partir dos preços do fornecedor. O valor para a banca é encontrar evidências diretas de cada item do desafio, sem depender de afirmações sem prova.

## 2. Pessoas e jornadas

- **Consumidor da API:** lista produtos, envia cliente/itens/quantidades, recebe o pedido calculado e consulta seu histórico.
- **Avaliador técnico:** executa o ambiente, lê contratos e código, roda testes e verifica integração, SQL e NoSQL.
- **Liderança/negócio:** entende escopo, riscos, capacidade de duas pessoas e critérios de qualidade sem precisar navegar pelo código.
- **Candidato:** acompanha especificações e consegue defender escolhas, limites, falhas e contribuições de IA.

Histórias: como consumidor, quero preços validados ao criar para confiar no total; como avaliador, quero reproduzir a execução; como líder, quero padrões comuns e um dimensionamento com premissas verificáveis.

## 3. Objetivos e métricas

| Objetivo | Critério verificável | Momento |
|---|---|---|
| Cobrir o desafio | Cada um dos 53 pontos analisados tem destino e evidência definida | Specs e revisão |
| Entregar o núcleo | Criar, listar e consultar pedidos integrados ao catálogo | Aceite do sistema |
| Garantir integridade | Valores exatos, nenhuma gravação parcial e histórico estável | Testes reais |
| Evitar N+1 | Uma consulta lógica de produtos em lote por criação | Testes e inspeção |
| Demonstrar qualidade | Cenários críticos automatizados; CI bloqueia deploy em falha | Release |
| Evidenciar liderança | Guia de 1-2 páginas e proposta de 3 semanas com 2 profissionais | Entrega |
| Evidenciar IA | Registros por etapa e link da conversa acessível | Submissão |

As metas de cobertura e desempenho em [qualidade](../specs/SPEC-qualidade.md) são metas internas, não parâmetros fornecidos pela banca.

## 4. Escopo obrigatório de construção

| ID | Requisito de produto | Aceite |
|---|---|---|
| RF01 | Consultar produtos e preço atual | Consultas individual, listada e em lote retornam produto/moeda/preço |
| RF02 | Criar pedido integrado | Cliente e itens válidos geram pedido usando preços do Catálogo |
| RF03 | Calcular valores | Subtotal, desconto e total obedecem às fórmulas especificadas |
| RF04 | Configurar desconto | Operador altera ambiente e reinicia; novo pedido usa a nova regra sem mudar código |
| RF05 | Persistir pedido SQL | Cabeçalho e itens são gravados ou revertidos juntos |
| RF06 | Listar pedidos | Página ordenada e limitada, com metadados |
| RF07 | Consultar pedido | Resultado completo, inclusive snapshots e status |
| RF08 | Validar entradas e falhas | Erros estáveis e estruturados, sem vazamento técnico |
| RF09 | Preservar histórico | Consulta de pedido não chama Catálogo e não recalcula desconto |
| RF10 | Inicializar catálogo | Seed repetível prepara dados conhecidos sem sobrescrever alterações silenciosamente |
| RF11 | Documentar e executar | Ambiente local, testes, contratos e README reproduzíveis |
| RF12 | Registrar IA e SDD | Prompts, decisões, validação e evolução das specs ligados aos incrementos |

## 5. Diferenciais incluídos na proposta

- CI de ambas as stacks, integração e gate antes de qualquer job de deploy.
- Revisão de validações e mensagens das APIs com IA, com saída criticada e decisões justificadas.
- Guia de code review/clean code de duas páginas e critérios bloqueantes.
- Dimensionamento técnico-comercial hipotético para três semanas, um sênior e um pleno.
- ADRs sobre stack, fronteiras, dinheiro, desconto, integração, testes e entrega.
- Roteiro curto de demonstração e comunicação executiva.

## 6. Extensões condicionais e cortes

| Extensão | Condição para entrar | Efeito |
|---|---|---|
| Deploy real em Azure | Núcleo aceito, credenciais, ambiente protegido e orçamento disponível | Evidência adicional de cloud |
| Slides ou vídeo final | Núcleo e artefatos obrigatórios concluídos | Facilitar apresentação |
| SAI APP 3.0 | Acesso legítimo e modo de preservar evidências | Diferencial específico |

Frontend de negócio, autenticação de usuários, CRUD administrativo, estoque, pagamento, cancelamento, frete, impostos, multi-moeda, histórico de vigência futura, event bus, cache distribuído, Kubernetes e idempotência de criação ficam fora do núcleo. A API é uma demonstração local com dados sintéticos; exposição externa com dados reais requer nova especificação de identidade e autorização.

## 7. Regras de negócio adotadas para o projeto

1. Moeda única BRL; valores inteiros em centavos. Nenhum cálculo monetário por `float`.
2. Cliente é uma fotografia de nome e e-mail dentro do pedido; não haverá serviço de clientes.
3. Cada criação recebe de 1 a 100 produtos distintos e quantidade de 1 a 10.000 por produto. IDs duplicados serão rejeitados com 422.
4. Preço e disponibilidade vêm do Catálogo; campos de preço ou desconto no pedido serão rejeitados.
5. Catálogo retorna somente o preço atual, e Pedidos preserva o preço, nome e versão observados.
6. Desconto percentual único sobre o subtotal, se o limiar inclusivo for atingido; taxa em pontos-base; arredondamento meio para cima. Sem cumular cupons.
7. A configuração é imutável durante uma execução. Mudança operacional exige reinício/revisão da aplicação; pedidos anteriores mantêm valores e regra.
8. Status inicial e único no núcleo: `CREATED`. Não há promessa de pagamento ou reserva de estoque.
9. Produto inválido/inativo ou falha de dependência impede a gravação integral. Nenhum pedido parcial.
10. Repetir POST cria novo pedido; a documentação alertará sobre resultado ambíguo em timeout do cliente. Não há retry automático de criação.

## 8. Jornada e critérios de aceitação

**Fluxo feliz:** operador sobe o ambiente e executa seed; consumidor consulta produtos, envia pedido; Pedidos valida, obtém lote, calcula, grava e devolve 201 com `Location`; consumidor lista e consulta o pedido. A consulta posterior funciona mesmo com Catálogo parado.

**Exemplo canônico:** teclado de 20.000 centavos × 2 + mouse de 10.000 × 1 = subtotal 50.000. Com desconto habilitado, limiar 50.000 e taxa 1.000 pontos-base (10%), desconto de 5.000 e total 45.000 centavos.

**Falha funcional:** dado um produto inativo, quando criar um pedido com ele, retornar 422 com seu identificador e nenhum pedido persistido.

**Falha de dependência:** dado Catálogo indisponível, quando criar, retornar 503 sem expor a URL interna e sem persistir. Um timeout é 504. Um payload inválido recebido do fornecedor é 502.

**Histórico:** dado pedido existente, quando alterar preço no seed de teste ou configuração, a consulta do pedido retorna exatamente os valores originais.

## 9. Requisitos não funcionais

- Contratos REST versionados e erros em `application/problem+json`.
- Consultas parametrizadas, filtros NoSQL construídos por código e entradas limitadas.
- Dependências externas com timeout, cancelamento propagado e falhas observáveis.
- Duas aplicações executáveis independentemente, cada qual com banco e credencial própria.
- Testes determinísticos com relógio/IDs controláveis quando necessário; integração real sem substituir persistência por mocks.
- Logs estruturados com correlação e duração, sem nome/e-mail, corpos completos ou segredos.
- Imagens e dependências fixadas no bootstrap, sem `latest` em release.
- Configuração inválida falha no startup, antes de servir tráfego.

## 10. Dependências, riscos e premissas

| Item | Tipo | Mitigação |
|---|---|---|
| Candidato defender duas stacks | Premissa técnica; stack aceita em 22/10 | Exemplos pequenos e bootstrap; confirmar entendimento antes da demonstração |
| PATH do Docker no processo atual do Codex | Ambiente local observado | Docker instalado e testado por caminho absoluto; reiniciar Codex para herdar o PATH do usuário |
| Prazo real da candidatura: 23/10/2026 às 18:00, informado em 22/10 | Restrição concreta de execução | Priorizar núcleo demonstrável; não confundir com as três semanas hipotéticas nem declarar itens não executados como prontos |
| Link da conversa e acesso ao GitHub | Dependência de entrega | Registrar como bloqueadores reais até existirem |
| Mudança do preço entre consulta e commit | Limite de consistência | Snapshot do preço observado, sem reserva distribuída |
| Apenas duas pessoas na hipótese | Restrição de capacidade | Núcleo primeiro, reserva explícita e cortes condicionais |

## 11. Definição de pronto do produto

Todos os requisitos obrigatórios devem estar implementados; cenários críticos devem passar em ambiente limpo; evidências devem apontar ao commit/tag; README deve funcionar; guia e proposta devem estar anexados; link de IA deve estar acessível. A ausência de um extra condicional será declarada, sem bloquear o núcleo aceito.

## 12. Decisões aceitas e pontos pendentes

A stack, a opção por bancos locais e as regras centrais de demonstração foram aceitas pelo candidato em 22/10/2026 e registradas nos ADRs 001 e 002. O prazo real informado é 23/10/2026 às 18:00 (horário de Brasília); as três semanas continuam sendo apenas o cenário hipotético de dimensionamento exigido pelo desafio. Permanecem pendentes o candidato revisar o contrato/primeira fatia, os acessos ao GitHub e ao eventual SAI APP 3.0, o link compartilhável e qualquer condição de nuvem. Não há aprovação presumida do recrutador. Mudanças futuras exigem atualização do PRD, da spec do módulo, do contrato e da matriz aplicável.

Histórico: versão 1.0 em 21/10/2026, elaboração inicial e revisão cruzada com as sete páginas do PDF; versão 1.1 em 22/10/2026, registro das escolhas aceitas e do prazo real informado pelo candidato.
