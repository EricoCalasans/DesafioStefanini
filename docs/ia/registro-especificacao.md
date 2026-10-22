# Registro real de IA - etapa de especificação

**Data:** 21/10/2026. **Ferramenta:** assistente Codex neste chat. **Modelo/versão exata:** não verificados pela interface nesta atividade. **Status:** análise, especificação e preparação local realizadas; implementação da aplicação não iniciada.

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

O candidato ainda deve revisar o contrato e a primeira fatia vertical e ser capaz de defender as stacks escolhidas. Não houve teste de aplicação, execução de serviço ou validação humana formal nesta etapa. As evidências das fases de código, teste e depuração deverão ser produzidas quando essas fases acontecerem.

**Link compartilhável:** pendente de criação e verificação pelo candidato no fechamento da entrega. Este arquivo não substitui o requisito de link do PDF.

## Atividade real de preparação local

**Solicitação efetiva:** o candidato pediu que fossem executados os itens do checklist que o assistente pudesse concluir sem decisões pessoais pendentes.

**Ações e evidências registradas:** Node `24.22.1` instalado/ativado com nvm e fixado em `.node-version`; SDK .NET `10.0.402` instalado com winget, confirmado por `dotnet --list-sdks` e `dotnet --version`, e fixado em `global.json`; Git inicializado na raiz com branches `main` e `develop`, commit documental inicial `e9a3660`; `.gitignore` conferido para manter o PDF original, `tmp/` e `.env` fora do histórico. O validador documental passou em OpenAPI, links locais, IDs, exemplos, semântica e aritmética da proposta. Docker Desktop `4.96.1` foi instalado em modo por usuário com backend WSL 2, Engine `29.9.2` e Compose `5.6.0`; Engine, Compose e `--wait` responderam pelo CLI em `E:\Apps\DockerDesktop\resources\bin\docker.exe`. O PATH salvo do usuário já inclui esse diretório, mas o processo Codex atual foi iniciado antes da atualização. Devido a `0,87 GB` livres em C:, o aplicativo e os dados WSL foram direcionados a E:, e o caminho padrão dos plugins CLI foi ligado a E: por uma junção. Havia `192,16 GB` livres em E: e as portas 3000, 8080, 5432 e 27017 continuavam sem listeners após o daemon iniciar.

**Limites e pendências:** o candidato aceitou Docker Compose local com PostgreSQL/MongoDB, as stacks NestJS/C# e as regras demonstrativas em 22/10/2026; informou entrega para 23/10/2026 às 18:00 (horário de Brasília). A revisão do contrato/primeira fatia, a primeira branch de feature e a comprovação de conhecimento para defender as escolhas continuam pendentes. Nenhum serviço da aplicação ou contêiner de banco foi construído/testado; a aceitação da arquitetura não equivale a validar o funcionamento da implementação.

## Decisões confirmadas pelo candidato

**Data:** 22/10/2026. **Solicitação efetiva:** confirmar as escolhas da seção 1 do checklist, exceto o prazo hipotético, e informar a data real de entrega.

**Decisões registradas:** ambiente local com Docker Compose, PostgreSQL para Pedidos e MongoDB para Catálogo; TypeScript/NestJS para Pedidos e C#/ASP.NET Core para Catálogo; BRL e centavos; desconto configurável, limiar inclusivo, preço oriundo do Catálogo; política demonstrativa `volume-v1` habilitada, limiar de 50.000 centavos e taxa de 1.000 pontos-base; cloud como extensão condicional.

**Prazo real:** 23/10/2026 às 18:00 (horário de Brasília, `America/Sao_Paulo`). As três semanas e 240 horas da proposta continuam sendo a hipótese técnico-comercial pedida no desafio, não a janela de execução desta candidatura. Nenhum item de implementação foi declarado pronto por este registro.
