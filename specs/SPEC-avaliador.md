# Spec — Central local de avaliação

**Status:** autorizado para implementação pelo pedido do candidato em 23/10/2026, após revisão da proposta de tela única. **Escopo:** interface local para demonstrar as APIs existentes de Pedidos e Catálogo.

## Objetivo

Dar a avaliadores uma única página em português para consultar produtos, criar pedidos, revisar histórico e observar a saúde das duas APIs. O ambiente usa somente dados sintéticos locais.

## Requisitos e aceite

- **EVAL-01 — Intenção:** a primeira dobra apresenta título, propósito da página e aviso de dados sintéticos; informa que criar pedido persiste dados.
- **EVAL-02 — Estado:** a página mostra `/health/ready` de Pedidos (PostgreSQL) e Catálogo (MongoDB), permite atualizar e comunica carregando, disponível e indisponível com texto e cor.
- **EVAL-03 — Catálogo:** lista e pagina produtos ativos, consulta produto individual e consulta lote de 1–100 UUIDs distintos. Mostra encontrados, ausentes, preço BRL, atividade, versão e horário observado.
- **EVAL-04 — Pedido:** permite informar cliente, adicionar itens ativos ou inserir UUID manualmente, informar quantidade e enviar `POST /api/v1/orders`. Preço, desconto e status são decididos pelo serviço. Exibe resultado persistido, ID e snapshots.
- **EVAL-05 — Casos de avaliação:** permite preencher o exemplo feliz e enviar payloads manuais de criação para exercitar validações do contrato. IDs repetidos, ausentes e inativos podem ser enviados ao serviço e seus erros devem aparecer sem serem mascarados pela interface.
- **EVAL-06 — Histórico:** lista pedidos com paginação, permite consultar um pedido pelo ID e exibe os itens e valores históricos.
- **EVAL-07 — Diagnóstico:** para cada chamada, a UI apresenta operação, status HTTP, duração, `X-Correlation-Id`/`traceId` e detalhes do erro. JSON original fica disponível em disclosure técnico.
- **EVAL-08 — Cobertura REST:** ações da interface exercitam as rotas públicas de saúde, consulta do catálogo, criação e consulta de pedidos. A UI não substitui suítes automatizadas nem injeta falhas de infraestrutura.
- **EVAL-09 — Execução:** uma subida completa do Compose inicia a interface em `http://localhost:4173/`, publicada somente em loopback. Nenhuma dependência npm de frontend é introduzida.
- **EVAL-10 — Segurança/fronteira:** UI não lê bancos, não contém credenciais e não permite proxy para destinos arbitrários; APIs de negócio permanecem inalteradas.
- **EVAL-11 — Usabilidade:** layout responsivo, HTML semântico, rótulos e instruções em campos, foco visível, contraste AA para texto comum, controles confortáveis e estados vazio/carregando/erro/sucesso.

## Decisões de implementação

- Servir HTML/CSS/JavaScript sem framework em `avaliador-ui/public/`.
- Usar servidor Node 24 com APIs nativas, rota de saúde própria e proxy com lista fechada de rotas para os serviços Compose `catalog` e `orders`; isso mantém as requisições do navegador na mesma origem e dispensa CORS.
- Adicionar serviço `evaluator` ao `infra/compose.yaml`, sem modificar serviços, contratos ou bancos de negócio.
- O endpoint POST grava um pedido real. A interface explicita esse efeito e impede submissões concorrentes por clique repetido, sem alegar idempotência.

## Arquivos

- `avaliador-ui/server.mjs`: arquivos estáticos e proxy local restrito.
- `avaliador-ui/public/index.html`, `app.js`, `styles.css`: tela e interações.
- `avaliador-ui/Dockerfile`: container Node 24 sem dependências externas.
- `infra/compose.yaml`: serviço local e porta em loopback.
- `README.md`: URL da tela e acesso rápido.

## Execução e verificação

Na raiz do repositório, com as credenciais locais já preparadas:

```powershell
docker compose --env-file ..\desafio-local\.env -f infra\compose.yaml up -d --build --wait
```

Abrir `http://localhost:4173/`. Confirmar a resposta de saúde do container, a carga inicial dos dois serviços, tabela do catálogo, consulta em lote, criação de pedido, histórico e detalhe. A criação canônica deve refletir a configuração local de desconto. Os testes automatizados existentes não são alterados nem executados nesta entrega.

## Limites

- Sem escrita no Catálogo e sem SQL/MongoDB expostos à página.
- Sem endpoint público de fault injection; falhas de banco e de rede permanecem cobertas pelos recursos de teste existentes, não pela tela.
- Sem deploy, autenticação ou exposição fora do host local.
