# Checklist antes de começar o código

**Objetivo:** deixar as decisões e o ambiente prontos para construir o sistema com segurança e reproduzir os mesmos passos depois. **Status:** checklist preparado; as caixas abaixo descrevem trabalho a fazer. Os documentos de análise e especificação já estão prontos; isso não significa que as escolhas técnicas tenham sido confirmadas ou que o ambiente esteja instalado.

## 1. Confirmar escolhas que afetam o início

- [ ] Confirmar que o ambiente primário será **local, com Docker Compose**, usando PostgreSQL para Pedidos e MongoDB para Catálogo. É a recomendação atual para este desafio.
- [ ] Confirmar que a proposta multi-stack será mantida: **TypeScript/NestJS em Pedidos e C#/ASP.NET Core em Catálogo**. Trocar uma stack agora evita retrabalho em specs, comandos e testes.
- [ ] Confirmar que as regras propostas fazem sentido para a demonstração: BRL, valores em centavos, desconto inicial configurado em variáveis de ambiente, limiar inclusivo e preço recebido do Catálogo.
- [ ] Confirmar os valores da demonstração no `.env.example`: regra `volume-v1`, habilitada, limiar de 50.000 centavos e taxa de 1.000 pontos-base (10%). Estes são exemplos escolhidos para tornar o fluxo demonstrável, não valores prescritos pela vaga.
- [ ] Verificar o prazo real de entrega da candidatura. As três semanas nas specs são apenas o cenário hipotético do dimensionamento comercial.
- [ ] Manter deploy em nuvem como extensão; não é necessário criar contas gratuitas para começar os bancos localmente.

## 2. Preparar e conferir as ferramentas

- [ ] Atualizar o Node para a linha 24 LTS, em versão **24.15 ou superior**, antes de gerar o projeto NestJS 12. Na última verificação, a máquina tinha `v24.13.0`.
- [ ] Instalar/verificar o **SDK .NET 10** e confirmar com `dotnet --list-sdks`. Na última verificação o comando não listou nenhum SDK; ter `dotnet.exe` não basta para compilar.
- [ ] Instalar ou abrir **Docker Desktop** e confirmar que o daemon está iniciado. Na última verificação, `docker` não foi encontrado no PATH; ainda precisamos confirmar se o Desktop está instalado.
- [ ] Conferir que Compose v2 funciona com `docker compose version`; conferir também `docker version` e `docker info`.
- [ ] Conferir Git com `git --version`. Git já foi localizado nesta máquina; falta registrar a versão e preparar o repositório.
- [ ] Confirmar que o computador tem espaço em disco suficiente e que Docker Desktop/WSL2 iniciou sem erro. Não instalar Java para esta proposta.
- [ ] Verificar se as portas 3000, 8080, 5432 e 27017 estão livres, ou ajustar as portas documentadas antes do primeiro `compose up`.

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

`git status` pode informar que a pasta ainda não é um repositório. Isso será resolvido ao preparar GitFlow; não inicializar outro repositório dentro de `docs`, `specs` ou `apps`.

## 3. Preparar o repositório antes do primeiro incremento

- [ ] Confirmar a pasta raiz: `E:\projeto\Stefanini\desafio`.
- [ ] Conferir `.gitignore`: proteger o PDF original, `tmp/`, `.env`, dependências e saídas de build; manter `.env.example` permitido.
- [ ] Executar `git status` antes de qualquer `git init`, para não sobrescrever ou confundir um repositório existente.
- [ ] Iniciar/confirmar o repositório Git na raiz e criar o histórico inicial real da documentação.
- [ ] Preparar as branches `main` e `develop` e anotar no README como criar `feature/<id>-descricao`, `release/*` e `hotfix/*`.
- [ ] Criar a primeira branch de trabalho a partir de `develop` somente depois de fechar os itens obrigatórios deste checklist.
- [ ] Confirmar que o PDF confidencial não será adicionado ao GitHub; a cópia já está excluída por `.gitignore`.

## 4. Fechar as especificações que guiam o primeiro código

- [ ] Ler [PRD](PRD.md), [arquitetura](arquitetura.md), [ADRs](adr/README.md) e [mapa de capacidades](../CAPABILITY-MAP.md).
- [ ] Revisar os detalhes de [Pedidos](../specs/SPEC-pedidos.md) e [Catálogo](../specs/SPEC-catalogo.md), principalmente limites, cálculo e preço autoritativo.
- [ ] Confirmar os contratos REST em `contracts/`: campos, validações, códigos de erro e exemplos.
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

- [ ] Definir Node/SDK, versões de dependências e imagens por versão suportada; fixar lockfiles durante o bootstrap. Não usar tags `latest` na release.
- [ ] Preparar build/lint/format das duas stacks no CI inicial; ampliar os checks com os testes conforme cada fatia é entregue.
- [ ] Confirmar que primeiro teste integrado usará PostgreSQL e MongoDB reais em ambiente descartável.
- [ ] Confirmar como serão registrados prompts, decisões e validação da IA em `docs/ia/`, sem inventar interações futuras.
- [ ] Manter visível o item obrigatório de link da conversa com IA na checklist de entrega; o link deve ser criado e conferido ao fechar a submissão.

## Critério para iniciar o primeiro código

Começar quando **as decisões essenciais (seção 1), as ferramentas que compilam/executam (seção 2), a raiz Git segura (seção 3) e o primeiro contrato/fatia (seção 4)** estiverem confirmados. As demais seções podem fechar junto com o bootstrap, mas ninguém deve construir contra stack, contrato ou regra que esteja em dúvida. A primeira execução de Compose e da CI torna-se o marco de saída da etapa de fundação.

## Situação observada

| Item | Situação na última conferência | Próxima ação |
|---|---|---|
| Specs e contratos | Criados e revisados documentalmente | Candidato confirmar escolhas antes do código |
| Node | `v24.13.0` | Atualizar para o requisito do Nest CLI |
| .NET | Executável presente, nenhum SDK listado | Instalar/confirmar SDK 10 |
| Docker | Não encontrado no PATH consultado | Abrir/instalar Docker Desktop e testar daemon |
| Git | Executável encontrado | Conferir versão, raiz e estado antes de iniciar GitFlow |
| Bancos online | Não escolhidos, contas não necessárias à base | Manter local; revisar só se surgir necessidade de demo remota |
| Aplicações e testes de sistema | Ainda não iniciados | Começar após fechar o critério acima |

As situações desta tabela registram a verificação anterior; não inferem se um programa foi instalado desde então.
