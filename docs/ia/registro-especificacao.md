# Registro real de IA - etapa de especificação

**Data:** 21/10/2026, atualizado em 22/10/2026. **Ferramenta:** assistente Codex neste chat. **Modelo/versão exata:** não verificados pela interface nesta atividade. **Status:** análise e especificação concluídas; implementação iniciada; Catálogo implementado e Pedidos pendente.

## Solicitação efetiva

O candidato forneceu o PDF local e pediu análise ponto a ponto, documento com cada parte importante, specs completas para tudo que será desenvolvido, destaque de pontos de atenção, revisão do conjunto e resumo da solução/linguagens.

Trecho do pedido: “Analise esse documento ponto a ponto, crie um documento pontuando cada parte importante do documento.” O pedido completo está no histórico desta conversa, que ainda não foi compartilhado por link.

## Contexto e método utilizados

Pasta inicialmente contendo apenas o PDF. Leitura com `pypdf` mostrou ausência de texto extraível. As sete páginas foram renderizadas com Poppler e inspecionadas visualmente. A análise registra a posição física das páginas, requisitos obrigatórios, diferenciais e ambiguidades. Referências técnicas oficiais foram consultadas sem enviar o texto do desafio às buscas.

## Saídas e decisões propostas

- Dois serviços com bancos separados, contratos REST e arquitetura por portas.
- Pedidos em TypeScript/NestJS e Catálogo em C#/ASP.NET Core como proposta multi-stack.
- Moeda BRL, centavos, política de desconto por ambiente e snapshots para histórico.
- Busca em lote com índice em Catálogo e SQL parametrizado/transacional em Pedidos.
- Inclusão do guia e da proposta, apesar da redação opcional da seção de diferenciais.
- Separação entre IA obrigatória no desenvolvimento e IA opcional dentro de funcionalidades; não planejar IA no runtime.
- Cloud e apresentação final condicionais; nenhuma publicação ou link inventados.

## Validação e limites

A validação desta etapa é documental, feita pelo assistente: revisão visual do PDF, cruzamento com matriz, revisão de coerência e checagem dos contratos/referências. O relatório concreto fica em [revisão das specs](../revisao-das-especificacoes.md).

Em 22/10/2026, o candidato delegou explicitamente ao Codex as decisões técnicas com base no PRD. O Codex revisou o contrato e definiu a primeira fatia vertical; não houve validação humana formal dos detalhes. O candidato deverá estudar as escolhas e ser capaz de defendê-las antes da apresentação. Não houve teste de aplicação ou execução dos serviços; as evidências de código, testes e depuração deverão ser produzidas quando essas fases acontecerem.

**Link compartilhável:** pendente de criação e verificação pelo candidato no fechamento da entrega. Este arquivo não substitui o requisito de link do PDF.

## Atividade real de preparação local

**Solicitação efetiva:** o candidato pediu que fossem executados os itens do checklist que o assistente pudesse concluir sem decisões pessoais pendentes.

**Ações e evidências registradas:** Node `24.22.1` instalado/ativado com nvm e fixado em `.node-version`; SDK .NET `10.0.402` instalado com winget, confirmado por `dotnet --list-sdks` e `dotnet --version`, e fixado em `global.json`; Git inicializado na raiz com branches `main` e `develop`, commit documental inicial `e9a3660`; `.gitignore` conferido para manter o PDF original, `tmp/` e `.env` fora do histórico. O validador documental passou em OpenAPI, links locais, IDs, exemplos, semântica e aritmética da proposta. Docker Desktop `4.96.1` foi instalado em modo por usuário com backend WSL 2, Engine `29.9.2` e Compose `5.6.0`; Engine, Compose e `--wait` responderam pelo CLI em `E:\Apps\DockerDesktop\resources\bin\docker.exe`. O PATH salvo do usuário já inclui esse diretório, mas o processo Codex atual foi iniciado antes da atualização. Devido a `0,87 GB` livres em C:, o aplicativo e os dados WSL foram direcionados a E:, e o caminho padrão dos plugins CLI foi ligado a E: por uma junção. Havia `192,16 GB` livres em E: e as portas 3000, 8080, 5432 e 27017 continuavam sem listeners após o daemon iniciar.

**Limites e pendências:** o candidato aceitou Docker Compose local com PostgreSQL/MongoDB, as stacks NestJS/C# e as regras demonstrativas; em 22/10/2026 delegou ao Codex as demais decisões técnicas baseadas no PRD e informou entrega para 23/10/2026 às 18:00 (horário de Brasília). Não há revisão técnica pendente para iniciar; o candidato deverá estudar as escolhas para a apresentação. Imagens de banco foram baixadas, mas nenhum contêiner de banco ou serviço da aplicação foi iniciado/testado; a especificação não equivale a validar funcionamento.

## Decisões confirmadas pelo candidato

**Data:** 22/10/2026. **Solicitação efetiva:** confirmar as escolhas da seção 1 do checklist, exceto o prazo hipotético, e informar a data real de entrega.

**Decisões registradas:** ambiente local com Docker Compose, PostgreSQL para Pedidos e MongoDB para Catálogo; TypeScript/NestJS para Pedidos e C#/ASP.NET Core para Catálogo; BRL e centavos; desconto configurável, limiar inclusivo, preço oriundo do Catálogo; política demonstrativa `volume-v1` habilitada, limiar de 50.000 centavos e taxa de 1.000 pontos-base; cloud como extensão condicional.

**Prazo real:** 23/10/2026 às 18:00 (horário de Brasília, `America/Sao_Paulo`). As três semanas e 240 horas da proposta continuam sendo a hipótese técnico-comercial pedida no desafio, não a janela de execução desta candidatura. Nenhum item de implementação foi declarado pronto por este registro.

## Atualização de implementação e validação

**Data:** 22/10/2026. **Solicitação efetiva:** o candidato autorizou o desenvolvimento completo segundo as specs e reforçou que os projetos deveriam ficar separados e que dependências como node_modules pertencem ao projeto consumidor.

**Estrutura aplicada:** o único repositório Git contém os projetos independentes `pedidos-typescript/` e `catalogo-dotnet/` no primeiro nível. Documentação, specs, contratos e infraestrutura compartilhada têm diretórios próprios. O package.json, package-lock.json, `.node-version` e node_modules pertencem ao projeto TypeScript; `global.json`, solução e lockfiles NuGet pertencem ao projeto .NET. PDF, segredos e caches foram movidos para a pasta irmã desafio-local.

**Evidências verificadas:** antes da implementação de negócio, Pedidos passou em build, typecheck, lint e um teste unitário. Em 22/10, Catálogo passou em build, formatação verificada e 23 testes automatizados; API foi exercitada contra o MongoDB local com readiness, listagem paginada, lote com item ausente e inativos, JSON inválido, mídia incorreta e Swagger. PostgreSQL e MongoDB estão saudáveis no Compose. A conta runtime do PostgreSQL conecta sem ser superuser e não tem permissão de CREATE no schema; o migrator tem essa permissão. O bootstrap Mongo foi executado duas vezes, preservou quatro produtos e validou a leitura pela conta runtime. Os resultados e limitações estão em [revisão atualizada das specs](../revisao-das-especificacoes.md) e [backlog](../tasks/todo.md).

**Revisão assistida por IA:** os primeiros testes apontaram um caminho antigo no teste ASP.NET e um escape de regex incompatível com PCRE2. Ambos foram corrigidos. Durante a implementação do Catálogo, os testes levaram a separar a validação sintática do JSON do model binding, estabilizando os códigos `INVALID_JSON` e `VALIDATION_ERROR`. Build, formatação e 23 testes .NET passaram; a revisão também alinhou a mídia Problem Details do Swagger e removeu mensagens de exceção potencialmente sensíveis dos logs. O smoke real confirmou os endpoints no Mongo. Pedidos, integração HTTP de ponta a ponta, migrations e experimento reproduzível de explain/contagem ainda estão pendentes.
