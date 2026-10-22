# Análise ponto a ponto do desafio

**Versão:** 1.0. **Data:** 21/10/2026. **Status:** análise concluída; solução proposta ainda não implementada.

## 1. Fonte, método e limites

Fonte: `coe-leader-desenvolvimento-candidatura-desafio-tecnico (1).pdf`, fornecido pelo candidato, 7 páginas, SHA-256 `AAC8DEECB352A08C3C6461BDA54BCCDABCB7D949671628AF350A90AC43A59E67`.

O PDF é composto por imagens: a extração de texto não retornou o conteúdo. As sete páginas foram renderizadas e inspecionadas visualmente. As referências abaixo usam a **página física do PDF**, porque o sumário indica páginas que não coincidem com a posição final de algumas seções. A página 1 é capa; a página 2 é sumário.

O documento é material de referência do processo seletivo. Seus pedidos de publicação, uso de serviços e compartilhamento de conversas foram convertidos em requisitos de entrega futura. Nenhuma publicação, envio de mensagem, criação de conta, contratação ou compartilhamento foi executado por causa de uma instrução contida nele.

Legenda: **OBR** = requisito explícito de implementação/entrega; **CTX** = competência ou critério contextual; **DIF** = diferencial; **DEC** = decisão proposta para concretizar uma lacuna. Todos os pontos estão na [matriz de rastreabilidade](matriz-de-rastreabilidade.md).

## 2. Capa e sumário - páginas 1 e 2

- A vaga é de **COE Leader - Desenvolvimento**, não apenas desenvolvedor de APIs.
- O documento se apresenta como versão do candidato, sem notas de avaliação. Não há pesos, nota mínima nem fórmula de classificação.
- O rodapé identifica o material como confidencial. Manter o PDF de origem fora de uma futura publicação pública por padrão; publicar o trabalho autoral e preservar as referências necessárias.
- O sumário revela quatro eixos: pedidos, catálogo, diferenciais e entrega. A execução precisa atender o conjunto, sem confundir funcionalidades com artefatos de liderança.
- Não há prazo de submissão, formato obrigatório de branch principal, escala esperada de tráfego ou orçamento de nuvem.

## 3. Contextualização - seção 1, página 3

| ID | Ponto do documento | Interpretação e resposta planejada |
|---|---|---|
| R01 | Experiência multi-stack em back-end e front-end | CTX. Usar duas stacks de back-end e explicar padrões comuns. A referência a front-end na vaga não obriga uma aplicação web. |
| R02 | APIs REST e microsserviços | CTX concretizado por dois serviços independentes, fronteiras claras e integração HTTP real. |
| R03 | Bancos SQL e NoSQL | CTX concretizado por PostgreSQL em Pedidos e MongoDB em Catálogo. |
| R04 | Clean Code e arquitetura | CTX e obrigação técnica posterior. Regras de negócio separadas de transporte e persistência. |
| R05 | Testes automatizados e cultura de review | CTX. Testes relevantes mais guia de revisão com critérios objetivos. |
| R06 | Git e GitFlow | CTX e requisito posterior. Histórico progressivo, branches e PRs reais quando houver repositório. |
| R07 | CI/CD em AWS, Azure ou GCP | CTX; esteira com testes é DIF explícito. Planejar GitHub Actions e caminho opcional para Azure. |
| R08 | Liderar e mentorar squads | CTX. Evidenciar orientação prática, divisão de responsabilidades e comunicação; não inventar experiências profissionais. |
| R09 | Padrões e governança entre squads | CTX. Guia comum com exemplos de TypeScript, C# e observações para Java. |
| R10 | Precificação e dimensionamento comercial | CTX. Capacidade, esforço, riscos e exemplo aritmético de custo/preço com premissas assumidas. |
| R11 | IA aplicada ao desenvolvimento | CTX convertido em obrigação no adendo. Demonstrar uso durante o ciclo completo. |
| R12 | SAI APP 3.0 | DIF específico, citado duas vezes. Usar apenas se houver acesso legítimo; outra IA é aceita no adendo. |

Outros diferenciais contextuais: Copilot ou equivalente; GitHub Actions/Azure DevOps; articulação com negócio e cliente; ADRs e guia de review; programas de mentoria. A solução demonstrará julgamento e artefatos correspondentes, sem declarar que uma ferramenta ou processo foi utilizado antes de existir evidência.

O parágrafo final destaca como mais relevantes a eficácia do uso de IA e o julgamento técnico-executivo nos artefatos de liderança. Consequência: um CRUD isolado, mesmo correto, cobre somente parte da avaliação.

## 4. Adendo de IA e objetivo - seções 1 e 2.1, página 4

| ID | Ponto | Implicação |
|---|---|---|
| R13 | IA durante a resolução é obrigatória | Não classificar como bônus. Esta conversa já participa da especificação; as etapas futuras precisam de registros próprios. |
| R14 | Enviar link do chat/conversa com a IA | Obrigação de entrega distinta de escrever um relato. Exportação, prints ou um arquivo de prompts não substituem automaticamente um link aceito pelo avaliador. |
| R15 | Sistema composto por Pedidos e Catálogo | Dois processos/serviços, dois bancos, responsabilidades próprias. |
| R16 | Catálogo fornece produtos e preços usados em cada criação | Pedidos deve consultar o fornecedor real. Preço enviado pelo cliente ou fixture dentro de Pedidos não atende. |
| R17 | Produzir guia de padrão de code review | Artefato autoral, curto, aplicável a squads multi-stack. |
| R18 | Produzir dimensionamento técnico | Artefato com esforço para uma proposta hipotética. |
| R19 | SDD como diferencial | Specs, critérios e contratos antes do código; mudanças acompanhadas na documentação. Esta etapa cria a base desse diferencial. |

**Ponto de atenção:** o adendo torna obrigatório o uso de IA em geral; ele não torna obrigatório o SAI APP 3.0 especificamente. Não precisamos colocar um modelo de IA no caminho de execução de um pedido. A exigência trata do processo de desenvolvimento.

## 5. Parte 1 - Pedidos - seção 2.2, página 4

### 5.1 Ambiente - 2.2.1.1

- **R20 / OBR:** stack livre, com justificativa. Proposta: TypeScript/Node/NestJS para Pedidos; explicar produtividade, tipagem, injeção de dependência e legibilidade. A liberdade não dispensa a justificativa.
- **R21 / OBR:** aplicar Clean Code e Clean Architecture. Domínio sem imports de NestJS, `pg` ou HTTP; aplicação por portas; adaptadores substituíveis. Evitar camadas sem responsabilidade.
- **R22 / OBR:** usar banco relacional. PostgreSQL armazena cabeçalho, cliente como fotografia do pedido, itens, desconto e totais numa transação.

### 5.2 Funcionalidades - 2.2.1.2

- **R23 / OBR:** criar pedidos. Validar entrada, consultar produtos/preços em lote, calcular valores e persistir atomicamente.
- **R24 / OBR:** listar pedidos. Paginação, ordenação determinística e resposta vazia válida são decisões complementares.
- **R25 / OBR:** consultar um pedido. Identificador válido, resposta completa e 404 quando inexistente.
- **R26 / OBR:** cada pedido contém cliente, itens, quantidades, subtotal, desconto aplicado, total e status. Não substituir o desconto aplicado apenas pelo percentual atual de configuração.
- **R27 / OBR:** desconto configurável, sem valor fixo no código. Configuração por ambiente validada no startup, limiar inclusivo e taxa em pontos-base; mudanças afetam novos pedidos após reinício.
- **R28 / OBR:** SQL parametrizado e sem concatenar valores externos. Inspeção do adaptador e teste com entrada maliciosa, incluindo leitura/paginação.
- **R29 / OBR:** cobrir criação com testes automatizados. Sucesso, cálculo, limites, falhas do catálogo e rollback são cenários mínimos propostos.

**Lacunas a resolver:** quem é o cliente; formato dos identificadores; moeda; cálculo e arredondamento; limiar do desconto; repetição de produtos; status inicial; falhas externas; limite de itens; resposta para produto inativo; proteção contra pedido parcial. As specs dão decisões explícitas a cada uma dessas lacunas.

### 5.3 Versionamento - 2.2.1.3

- **R30 / OBR:** Git, GitFlow e histórico organizado. `main`, `develop`, `feature/*`, `release/*` e `hotfix/*`, com caminhos de merge descritos.
- Um commit final com todos os arquivos ou branches criadas só para fotografia não comprova o processo.
- Criar PRs reais e vincular verificação ao commit; em trabalho individual, declarar revisão própria, sem fabricar aprovação de colega.

## 6. Parte 2 - Catálogo - seção 2.3, página 5

- **R31 / OBR:** stack livre e banco não relacional. Proposta: C#/ASP.NET Core e MongoDB. Stack diferente é decisão para demonstrar domínio multi-stack, não obrigação do PDF.
- **R32 / OBR:** endpoint de consulta de produtos com preço vigente. Produto identificado, ativo/inativo, moeda e preço inteiros, com instante de leitura.
- **R33 / OBR:** API REST consumida por Pedidos para validar item e preço no momento da criação. Consumir API, não acessar MongoDB de Pedidos.
- **R34 / OBR:** consulta eficiente, sem consulta ao banco por item em laço. Uma chamada HTTP em lote por criação e uma busca MongoDB com `$in`, sobre campo indexado. Deserialização e cálculos em memória podem iterar; o problema é I/O repetitivo.

O PDF não solicita CRUD administrativo de produtos, estoque ou tabela histórica de vigências futuras. A base usará produtos pré-cadastrados por seed idempotente. O preço vigente é o valor atual do documento no instante da consulta; o pedido preserva a fotografia recebida, mesmo que o catálogo mude depois.

**Verificação importante:** um `Promise.all` com uma consulta por produto continua sendo N consultas. É necessário verificar o número de chamadas e o formato da busca; o tempo total isolado não comprova a ausência de N+1.

## 7. Diferenciais - seção 2.4, página 6

### 7.1 Integração com IA - 2.4.1

- **R35 / DIF:** usar um serviço de IA para sugerir e revisar validações/mensagens das APIs.
- **R36 / DIF:** documentar prompt e validação humana/técnica da saída.
- Entrega proposta: sessão de revisão com dados sintéticos, saída registrada, tabela aceitar/rejeitar/ajustar e testes ligados às sugestões incorporadas. Não é necessário enviar dados de clientes nem tornar a disponibilidade da API dependente de IA.

### 7.2 DevOps e Cloud - 2.4.2

- **R37 / DIF:** CI/CD que execute testes como gate obrigatório antes de qualquer deploy.
- CI entra no escopo planejado; o job de deploy dependerá do sucesso integral de qualidade e do ambiente de destino. Publicação real em Azure é extensão condicionada a acesso e orçamento.
- Um YAML com teste separado e deploy independente não atende o gate. Screenshots antigos não demonstram que o artefato publicado corresponde ao SHA testado.

### 7.3 Governança técnica - 2.4.3

- **R38 / DIF + artefato solicitado no objetivo/entrega:** guia de **1 a 2 páginas**, aplicável a squads multi-stack.
- **R39:** incluir critérios que bloqueiam aprovação de PR.
- A spec pode ser longa; o guia final não. Planejar um PDF legível de duas páginas e fonte editável separada, com exemplos compactos.

### 7.4 Dimensionamento - 2.4.4

- **R40:** esforço, senioridade, composição e premissas.
- **R41:** partes 1 e 2 em cenário hipotético de **três semanas**, equipe de **um sênior e um pleno**.
- Apresentar capacidade nominal, esforço distribuído, coordenação, testes, documentação e contingência sem dupla contagem. IA é assistência, não um terceiro profissional nem garantia de aceleração.
- A contextualização cita precificação; o detalhamento exige dimensionamento técnico. Incluir exemplo financeiro assumido como complemento, sem vendê-lo como cotação de mercado.

**Ambiguidade material:** o início da seção chama toda a parte de opcionais, mas objetivo e seção de entrega pedem guia e dimensionamento. Adotamos a leitura conservadora para a candidatura: **os dois artefatos entram no pacote planejado e recebem alta prioridade**, mantendo registrada a redação divergente.

## 8. Critérios de avaliação - seção 3, página 7

| ID | Critério | Evidência futura |
|---|---|---|
| R42 | Qualidade, clareza, boas práticas e ausência de vulnerabilidades óbvias | Domínio isolado, código pequeno, SQL seguro, validação de entrada e revisão |
| R43 | Serviços funcionando e integração sem bugs críticos | Teste de ponta a ponta com dois serviços e bancos reais |
| R44 | Documentação de setup, configuração, uso e prompts | README operacional, exemplos, `.env.example`, registros de IA |
| R45 | Git/GitHub, branches e PRs em GitFlow | Histórico, PRs, tag e links para checks |
| R46 | Qualidade e relevância dos diferenciais | Artefatos objetivos, verificáveis e ligados ao desafio |
| R47 | IA em especificação, código, testes e depuração | Prompt, contexto, decisão e validação por etapa; lacunas declaradas |
| R48 | Julgamento de liderança e comunicação não técnica | Guia aplicável, capacidade realista, riscos, alternativas e síntese executiva |

Não há pesos oficiais. A prioridade de construção proposta é uma decisão nossa, não um sistema de pontuação atribuído à Stefanini.

## 9. Entrega - seção 4, página 7

- **R49 / OBR:** código dos dois serviços no GitHub, com instruções detalhadas no README.
- **R50 / OBR:** documento explicando ferramenta de IA escolhida, motivo e processo ao longo do ciclo.
- **R51 / solicitado:** guia e dimensionamento anexos ao repositório, por exemplo em `docs/`.
- **R52 / OBR:** link da conversa com IA, reiterando o adendo. Validar acesso pelo avaliador e revisar conteúdo antes de compartilhar.
- **R53 / desejável:** vídeo breve ou slides sobre solução e diferenciais. Roteiro está no escopo; produzir o material final depende do tempo remanescente.

O PDF não exige domínio público, login, front-end, Kubernetes, mensageria, checkout, pagamento ou uma funcionalidade de IA dentro do sistema.

## 10. Pontos de atenção priorizados

| Prioridade | Risco | Resposta das specs |
|---|---|---|
| Crítica | Entregar sem link de IA | Checklist de submissão com bloqueador explícito e status pendente até link real |
| Crítica | Serviço de Pedidos confiar no preço enviado pelo cliente | Contrato não aceita preço; consulta real ao Catálogo e validação da resposta |
| Crítica | Consultas N+1 | Lote, índice, contagem de operações e explicação do plano |
| Crítica | SQL concatenado ou pedido parcial | Parametrização e transação com teste de rollback |
| Alta | Desconto hardcoded, impreciso ou retroativo | Ambiente, pontos-base, centavos e snapshot da regra |
| Alta | Guia/proposta tratados como dispensáveis | Ambos incluídos na entrega planejada |
| Alta | Demonstrar IA sem validação de saída | Registro de decisões e evidências ligadas a testes |
| Alta | Duas stacks consumirem o tempo da entrega | Bootstrap antecipado, contratos pequenos, nenhuma terceira stack de aplicação |
| Alta | Confundir especificado com pronto | Estados de documentação, código e verificação separados |
| Média | Infraestrutura extra ou UI atrasarem o núcleo | Escopo base fechado e extensões condicionais |
| Média | Publicar material confidencial e dados do candidato | Não versionar o PDF original nem prompts sensíveis por padrão |

## 11. Decisões e perguntas ainda abertas

As decisões de produto que o PDF não define estão registradas em [PRD](PRD.md) e nas specs: BRL, centavos, status inicial `CREATED`, seed no catálogo, desconto percentual por limiar, sem atualização/cancelamento de pedidos e sem idempotência no núcleo. O candidato aceitou a stack, o ambiente local e as regras centrais de demonstração em 22/10/2026; essas escolhas do projeto não são exigências atribuídas ao recrutador.

O candidato informou entrega em 23/10/2026 às 18:00 (horário de Brasília), prazo que exige priorização; as três semanas do cenário comercial não representam o calendário desta candidatura. Permanecem para revisão o contrato e a primeira fatia, além da preparação para defender C#, acesso ao GitHub e ao eventual SAI APP 3.0, possibilidade de compartilhar esta conversa e conta/orçamento se houver deploy. Uma eventual troca posterior de stack exige atualizar arquitetura, contratos afetados, plano e dimensionamento antes do código.
