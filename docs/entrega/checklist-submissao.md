# Checklist de entrega do desafio

Esta lista separa itens exigidos, diferenciais, itens desejáveis e extensões condicionais do PDF. O PDF é tratado como requisito de avaliação; ele não substitui as instruções do candidato nem autoriza ações externas por si só.

## Entrega solicitada

| Item | Estado | Evidência |
|---|---|---|
| Código das duas APIs em um repositório GitHub | Publicado; conferir os branches `main`, `develop` e `master` na página do [repositório](https://github.com/EricoCalasans/DesafioStefanini) | `pedidos-typescript/`, `catalogo-dotnet/`, commits e CI |
| README com setup e execução detalhados | Concluído | [README da raiz](../../README.md) |
| Ferramenta de IA, motivo e uso ao longo do ciclo | Concluído | [Uso de IA](../uso-de-ia.md), [registro](../ia/registro-especificacao.md) |
| Link compartilhável da conversa com IA | Gerado e aberto em consulta sem sessão autenticada; avaliador ainda não acessou | [Conversa pública compartilhada](https://chatgpt.com/s/cx_6adace2a8af48191a86a6f1c7ebc73f6); registrada também em `docs/uso-de-ia.md` |
| Guia de code review de 1–2 páginas | Concluído | [Fonte Markdown](../governanca/guia-de-code-review.md), [PDF de duas páginas](../output/pdf/guia-de-code-review.pdf) |
| Dimensionamento técnico da proposta | Concluído | [Cenário de três semanas, sênior e pleno](../proposta/dimensionamento.md) |
| Slides ou vídeo curto | Slides concluídos; vídeo não produzido | [Deck e roteiro de 6–7 minutos](../apresentacao/README.md) |

## Critérios de avaliação

| Critério | Verificação antes da submissão | Estado atual |
|---|---|---|
| Qualidade do código | Revisar código, SQL parametrizado, entradas, logs, dependências, builds e testes | Evidências locais e CI; revisão independente por outra pessoa não foi realizada |
| Funcionalidade | Subir ambos os serviços, executar o smoke e consultar/criar/listar pedido | Testado com APIs e bancos reais; ver [QA](../qa/README.md) e [setup limpo](../evidencias/setup-limpo.md) |
| Documentação | Seguir o README a partir de clone limpo e conferir configuração, seed e contratos | Instruções detalhadas; validar a reprodução no computador do avaliador continua útil |
| Git/GitHub e GitFlow | Conferir branches, commits, PRs e checks do SHA de entrega | [PR #1 para `develop`](https://github.com/EricoCalasans/DesafioStefanini/pull/1), branches e CI publicados; a revisão independente por outra pessoa não foi realizada |
| Diferenciais | Conferir revisão de mensagens com IA, CI como gate, guia e dimensionamento | Revisão documentada; workflow de testes executado; guia e proposta anexados |
| Uso de IA no ciclo | Conferir etapas, prompts, decisões, validação e link da conversa | Processo, revisão e URL estão registrados; a página pública foi aberta sem autenticação |
| Liderança técnica | Confirmar premissas, composição, riscos, cortes e comunicação para negócio | Guia, ADRs, resumo executivo e dimensionamento disponíveis |

## Itens condicionais e limites

- A fonte PDF está fora do repositório; não publicar o documento confidencial recebido, credenciais ou `.env`.
- A aplicação de negócio não tem frontend. O escopo pede APIs REST e as Swagger UIs permitem sua exploração.
- Deploy cloud real fica condicionado a destino, acesso, credenciais e orçamento; este pacote não alega produção em nuvem.
- SAI APP 3.0 não foi usado nem alegado. O uso efetivo registrado foi o assistente Codex nesta conversa.
- A branch `main` é a principal. `master` é mantida como alias por compatibilidade, não como outra linha de desenvolvimento.

Atualizar os estados quando a revisão humana e o CI no SHA final forem confirmados. Vincular a submissão ao commit da branch `main` cujos checks estiverem verdes.
