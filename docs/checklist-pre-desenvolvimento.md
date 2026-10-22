# Checklist antes de começar o código

**Objetivo:** deixar as decisões e o ambiente prontos para construir o sistema com segurança e reproduzir os mesmos passos depois. **Status em 21/10/2026:** preparação local iniciada; as caixas refletem o que foi realmente concluído. As decisões marcadas para confirmação continuam pendentes do candidato.

## 1. Confirmar escolhas que afetam o início

- [ ] Confirmar que o ambiente primário será **local, com Docker Compose**, usando PostgreSQL para Pedidos e MongoDB para Catálogo. É a recomendação atual para este desafio.
- [ ] Confirmar que a proposta multi-stack será mantida: **TypeScript/NestJS em Pedidos e C#/ASP.NET Core em Catálogo**. Trocar uma stack agora evita retrabalho em specs, comandos e testes.
- [ ] Confirmar que as regras propostas fazem sentido para a demonstração: BRL, valores em centavos, desconto inicial configurado em variáveis de ambiente, limiar inclusivo e preço recebido do Catálogo.
- [ ] Confirmar os valores da demonstração no `.env.example`: regra `volume-v1`, habilitada, limiar de 50.000 centavos e taxa de 1.000 pontos-base (10%). Estes são exemplos escolhidos para tornar o fluxo demonstrável, não valores prescritos pela vaga.
- [ ] Verificar o prazo real de entrega da candidatura. As três semanas nas specs são apenas o cenário hipotético do dimensionamento comercial.
- [ ] Manter deploy em nuvem como extensão; não é necessário criar contas gratuitas para começar os bancos localmente.

## 2. Preparar e conferir as ferramentas

- [x] Atualizar o Node para a linha 24 LTS, em versão **24.15 ou superior**, antes de gerar o projeto NestJS 12. Instalado/ativado `v24.22.1`; conferir novamente em um terminal novo após abrir o projeto.
- [x] Instalar/verificar o **SDK .NET 10**: `dotnet --list-sdks` e `dotnet --version` confirmam `10.0.402`; versão fixada em `global.json`.
- [x] Instalar/abrir **Docker Desktop** e confirmar que o daemon está iniciado. Docker Desktop `4.96.1` está instalado por usuário com backend WSL 2; Engine `29.9.2` está ativo.
- [x] Conferir `docker compose version`, `docker version` e `docker info`: Compose `v5.6.0`; os três comandos responderam com sucesso. `docker compose up --help` também confirma suporte a `--wait` e `--wait-timeout`.
- [x] Conferir Git com `git --version`: Git 2.44.0 instalado; repositório inicializado e histórico documental criado.
- [x] Medir espaço em disco: C: tinha aproximadamente `0,87 GB` livres e E: `192,16 GB` na última conferência. Docker Desktop, dados WSL e plugins foram direcionados a E:; manter imagens/cache/dados ali e acompanhar o espaço baixo em C:.
- [x] Confirmar que Docker Desktop/WSL2 inicia sem erro: o WSL `3.0.3.0` iniciou a distribuição `docker-desktop` em versão 2 e `docker info` confirmou o Engine.
- [x] Verificar se as portas 3000, 8080, 5432 e 27017 estão livres: nenhuma estava em escuta na última conferência. Repetir antes do primeiro `compose up`.
- [x] Não instalar Java para esta proposta; Java não faz parte da stack escolhida.

Comandos de conferência no PowerShell:

```powershell
node --version
dotnet --list-sdks
dotnet --version
docker version
docker compose version
docker info
git --version
git status --short --branch
```

O repositório já foi inicializado na raiz. O PDF original e `tmp/` foram verificados como ignorados pelo Git; não inicializar outro repositório dentro de `docs`, `specs` ou `apps`.

## 3. Preparar o repositório antes do primeiro incremento

- [x] Confirmar a pasta raiz: `E:\projeto\Stefanini\desafio`.
- [x] Conferir `.gitignore`: PDF original, `tmp/`, `.env`, dependências e saídas de build protegidos; `.env.example` permitido.
- [x] Executar `git status` antes de qualquer `git init`; a pasta ainda não era um repositório.
- [x] Iniciar o repositório Git na raiz e criar o histórico inicial real da documentação (`e9a3660`).
- [x] Criar as branches `main` e `develop` e documentar no README como criar `feature/<id>-descricao`, `release/*` e `hotfix/*`.
- [ ] Criar a primeira branch de trabalho a partir de `develop` somente depois de fechar os itens obrigatórios deste checklist.
- [x] Verificar que o PDF confidencial está ignorado pelo Git e não consta no histórico local. Repetir essa checagem antes de publicar o repositório.

## 4. Fechar as especificações que guiam o primeiro código

- [ ] Ler [PRD](PRD.md), [arquitetura](arquitetura.md), [ADRs](adr/README.md) e [mapa de capacidades](../CAPABILITY-MAP.md).
- [ ] Revisar os detalhes de [Pedidos](../specs/SPEC-pedidos.md) e [Catálogo](../specs/SPEC-catalogo.md), principalmente limites, cálculo e preço autoritativo.
- [x] Validar estruturalmente os contratos REST em `contracts/`: o validador confirmou OpenAPI 3.1 e exemplos compatíveis com os schemas.
- [ ] Candidato revisar/confirmar campos, validações, códigos de erro e exemplos dos contratos REST.
- [ ] Entender o critério mais importante do Catálogo: buscar vários produtos com **uma consulta lógica em lote**, sem fazer uma chamada ao banco por item.
- [ ] Confirmar a primeira fatia vertical: semear produtos no MongoDB, consultar catálogo por HTTP e demonstrar um pedido usando os preços retornados.
- [ ] Resolver a revisão do candidato sobre a stack e as regras propostas antes de escrever código. Atualizar ADR/spec/contrato se alguma decisão mudar.

## 5. Definir o ambiente local de dados

- [ ] Confirmar que os dois bancos serão serviços locais no mesmo `docker compose up`.
- [ ] Definir nomes diferentes para desenvolvimento e testes; testes de integração/sistema não devem apagar nem reutilizar dados pessoais.
- [ ] Definir usuários de execução e inicialização distintos: runtime do Catálogo com leitura MongoDB; init/seed com permissão de criação; runtime de Pedidos com DML; migrações com DDL.
- [ ] Preparar `.env.example` sem senhas reais; a aplicação deve falhar cedo se uma variável obrigatória estiver ausente ou inválida.
- [ ] Ao começar a implementação, criar o `.env` local a partir do exemplo e confirmar que está ignorado pelo Git. Não colar seu conteúdo no chat ou em commits.
- [ ] Confirmar persistência local dos volumes e documentar como parar/reiniciar. Qualquer comando que apague volumes deve ser separado e claramente destrutivo.
- [ ] Incluir seed sintético repetível para catálogo e migration SQL versionada para Pedidos. Nenhuma conta de Neon, Supabase ou Atlas é pré-requisito do ambiente-base.

## 6. Fechar a preparação de qualidade

- [x] Fixar as ferramentas locais em `.node-version` (`24.22.1`) e `global.json` (`10.0.402`).
- [ ] Fixar versões exatas de dependências e imagens suportadas; criar lockfiles durante o bootstrap e não usar tags `latest` na release.
- [ ] Preparar build/lint/format das duas stacks no CI inicial; ampliar os checks com os testes conforme cada fatia é entregue.
- [ ] Confirmar que primeiro teste integrado usará PostgreSQL e MongoDB reais em ambiente descartável.
- [x] Definir o registro de prompts, decisões e validação da IA em `docs/ia/registro-especificacao.md`; registrar somente interações e evidências reais.
- [x] Manter na checklist de entrega o requisito obrigatório do link da conversa com IA.
- [ ] Criar e testar o link compartilhável da conversa ao fechar a submissão.

## Critério para iniciar o primeiro código

Começar quando **as decisões essenciais (seção 1), as ferramentas que compilam/executam (seção 2), a raiz Git segura (seção 3) e o primeiro contrato/fatia (seção 4)** estiverem confirmados. As demais seções podem fechar junto com o bootstrap, mas ninguém deve construir contra stack, contrato ou regra que esteja em dúvida. A primeira execução de Compose e da CI torna-se o marco de saída da etapa de fundação.

## Situação observada

| Item | Situação na última conferência | Próxima ação |
|---|---|---|
| Specs e contratos | Criados e revisados documentalmente | Candidato confirmar escolhas antes do código |
| Node | `v24.22.1`; arquivo `.node-version` criado | Validar em terminal novo ao iniciar o projeto |
| .NET | SDK `10.0.402`; `dotnet --list-sdks` e `dotnet --version` confirmados; `global.json` criado | Instalar runtime e pacotes da aplicação no bootstrap |
| Docker | Desktop `4.96.1` por usuário/WSL 2 em E:; Engine `29.9.2`; Compose `5.6.0`; daemon e `--wait` aprovados | O PATH do usuário contém `E:\Apps\DockerDesktop\resources\bin`; o processo atual do Codex ainda herdou o PATH antigo. Reabrir o terminal se `docker` não for reconhecido; `docker ps -a` confirmou que ainda não há contêineres |
| Git | 2.44.0; `main` e `develop`; commit documental `e9a3660` | Criar branch de feature após fechar decisões essenciais |
| Recursos locais | C: `0,87 GB` livres; E: `192,16 GB`; portas 3000, 8080, 5432 e 27017 livres após iniciar Docker | Manter dados/imagens em E:, acompanhar C: e revalidar portas antes de subir serviços |
| Bancos online | Não escolhidos; nenhuma conta necessária à base local | Confirmar ambiente Docker local ou solicitar alternativa remota |
| Aplicações e testes de sistema | Ainda não iniciados | Começar após fechar o critério acima |

O instalador colocou os plugins do Docker em `E:\DockerConfig\cli-plugins`; o caminho padrão de plugins em `.docker` é uma junção do Windows para esse diretório, porque C: não tem espaço para as cópias. Essa junção foi necessária para concluir o instalador e deixa `docker compose` disponível pelo caminho padrão.

As situações desta tabela registram verificações feitas em 21/10/2026; a disponibilidade das portas e o estado do daemon podem mudar.
