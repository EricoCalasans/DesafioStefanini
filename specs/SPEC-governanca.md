# Spec - `governanca`

**Versão:** 1.0. **Status:** especificado; fonte e PDF final criados e revisados visualmente em 22/10/2026. **Origem:** R04-R05, R08-R09, R17, R38-R39, R46, R48, R51.

## 1. Objetivo e formato

Entregar um guia autoral curto de Clean Code e code review para squads multi-stack. Público: desenvolvedores TypeScript, C# e Java, tech leads e responsáveis pelo merge. Deve ser útil em trabalho cotidiano, compreensível fora desta aplicação e apoiado por exemplos do desafio.

Entregáveis: `docs/governanca/guia-de-code-review.md` editável e `docs/output/pdf/guia-de-code-review.pdf`, **1 a 2 páginas físicas**, duas páginas A4. Esta spec pode exceder esse tamanho; não será apresentada como o guia final.

## 2. Conteúdo das duas páginas

**Página 1:** propósito, responsabilidades, checklist bloqueante e padrões comuns de corretude, segurança e manutenção. **Página 2:** exemplos curtos de cada stack, fluxo de revisão, severidade, mentoria e métricas com interpretação. Fonte legível (alvo ≥10 pt); não reduzir fonte para esconder excesso de conteúdo.

## 3. Critérios que bloqueiam aprovação

| Bloqueador | Como reconhecer | Ação necessária |
|---|---|---|
| Regra/contrato incorreto | Total diverge da spec, campo obrigatório ausente, alteração incompatível | Corrigir regra/contrato e evidenciar teste |
| Entrada usada em SQL/filtro inseguro | Concatenação/interpolação de valores externos, JSON arbitrário como filtro | Parametrizar/construir filtro tipado e testar |
| Segredo ou dado pessoal exposto | Token em arquivo, log de cliente, stack pública | Remover exposição e avaliar credencial afetada |
| Integridade ou concorrência quebrada | Pedido parcial, escrita fora de transação, retry duplicando criação | Corrigir fronteira transacional e testar falha |
| Consulta N+1 / operação sem limite | Banco dentro de laço, listagem ilimitada, falta de timeout | Lote/limite/timeout e evidência |
| Falta de teste crítico ou check falho | Desconto/rollback sem teste, CI vermelho | Acrescentar teste útil e corrigir falha |
| Dependência invertida incorretamente | Domínio importa driver/framework ou acessa serviço externo | Isolar por porta/adaptador |
| Mudança sem configuração/documentação necessária | Variável nova ausente no exemplo, migration ausente, contrato desatualizado | Completar artefatos e reprodução |
| Evidência de IA não validada | Código/decisão aceitos sem revisão e teste pertinente | Validar saída e registrar decisão |

Preferências de estilo que o formatter já resolve não devem virar bloqueadores humanos. Divergência de naming que prejudique entendimento pode exigir ajuste com exemplo e razão. A gravidade se baseia no risco, não na senioridade de quem escreveu.

## 4. Práticas comuns entre stacks

- Função/caso de uso com responsabilidade clara e nome de domínio, sem abstração gratuita.
- Validação na borda e invariantes protegidos no domínio; tratamento de erro sem engolir exceção.
- Dependências explícitas e substituíveis; DTO, entidade e registro de banco com papéis distintos.
- Recursos e assincronismo controlados: `finally` no client SQL TS, `using`/`CancellationToken` em C#, `try-with-resources`/timeout quando aplicável em Java.
- Valores monetários com precisão explícita; nunca `double`/`float` sem uma estratégia apropriada.
- Teste com resultado independente, cobrindo comportamento e falhas, não detalhes triviais de implementação.

Exemplos compactos: TS com `client.query(sql, values)`; C# com `Filter.In` e cancelamento; Java com `PreparedStatement` ou parâmetro de framework. Exemplo Java é de governança multi-stack, não terceiro serviço implementado.

## 5. Processo de review e responsabilidade

Autor faz revisão própria, vincula spec e mostra teste. Revisor começa pelo contrato/regra e pelo risco, depois legibilidade. Comentários indicam gravidade, motivo e sugestão; separar bloqueador, melhoria e pergunta. Autor responde com mudança ou justificativa; divergência material vai ao responsável técnico com decisão registrada.

Sugerir PR de uma mudança coesa; tamanho é sinal de dificuldade, não limite arbitrário de linhas. Revisão objetiva não substitui CI. Check verde não substitui leitura crítica de lógica/segurança. Em candidatura individual, declarar a limitação de não haver revisão independente por colega; não simular aprovações.

## 6. Mentoria e governança leve

Oferecer exemplo de comentário que ensina a evitar consulta por item e outro que explica arredondamento. Propor pareamento em primeira mudança de domínio e uma sessão curta entre stacks para compartilhar padrões. Decisões recorrentes viram ADR/check automático. Não criar comitê para toda mudança.

Métricas sugeridas: tempo até primeira revisão, retrabalho por classe de defeito e defeitos escapados. Usar tendências por squad, sem ranking individual ou meta que incentive PRs artificiais. Para negócio, explicar o benefício: reduzir erro de preço, tempo de integração e risco de entrega.

## 7. Produção e validação

Fonte redigida, PDF gerado e as duas páginas renderizadas para inspeção visual. Foram conferidos número de páginas, legibilidade, exemplos TS/C#/Java e critérios bloqueantes. O guia descreve práticas e não promete processos já executados sem histórico.

Comandos propostos para padronizar o fluxo (não há scripts `docs:check` ou `docs:governance:pdf` configurados):

O PDF existente foi gerado com ReportLab no ambiente de documentos disponível e renderizado via Poppler. O fonte Markdown permanece como versão editável; o gerador específico não é dependência do projeto de API.

## 8. Aceite

- GOV01: guia tem 1-2 páginas físicas legíveis e fonte editável.
- GOV02: bloqueadores explícitos, objetivos e verificáveis, incluindo SQL, N+1, transação, testes e contrato.
- GOV03: exemplos multi-stack corretos e ausência de foco exclusivo em estilo.
- GOV04: processo, responsabilidades, mentoria e comunicação de risco são claros.

Sempre manter o guia curto e aplicável. Expandir exemplos em apêndice separado se necessário; nunca entregar uma spec longa como se fosse o guia de duas páginas.
