# Spec - `ia-e-sdd`

**Versão:** 1.0. **Status:** uso real em especificação/código/testes e revisão dedicada de validações/mensagens documentados em `docs/uso-de-ia.md` e `docs/ia/`; o link compartilhável obrigatório permanece pendente. **Origem:** R11-R14, R19, R35-R36, R47, R50, R52.

## 1. Objetivo e separação de requisitos

Uso de IA no desenvolvimento e link da conversa são obrigatórios. SAI APP 3.0 e revisão de validações/mensagens por IA são diferenciais. SDD é diferencial expressamente citado. Nenhum desses itens exige chamar IA dentro do fluxo de criação do pedido.

A ferramenta efetivamente utilizada nesta etapa é o assistente Codex neste chat. Não foi verificado acesso ao SAI APP 3.0. Não afirmar uso de Copilot/Claude/SAI ou modelo específico sem evidência. Se a interface revelar o modelo na implementação, registrar o identificador observado; não deduzir apenas pelo nome do produto.

## 2. SDD e controle de mudança

Fluxo: requisito do PDF → análise/ID Rxx → PRD → contrato/spec → tarefa → código/teste → evidência → revisão/entrega. Manter IDs estáveis do [mapa](../docs/CAPABILITY-MAP.md).

Antes de cada incremento, carregar a spec e critérios relevantes. Se o comportamento necessário divergir, atualizar spec/ADR/contrato e registrar motivo no mesmo PR, antes de considerar o código concluído. Não reescrever a especificação retroativamente para fazer um bug parecer correto.

Revisão do candidato será registrada como tal quando acontecer. A revisão documental automatizada/assistida atual não equivale a validação humana nem aprovação de implementação. Não presumir aceite do recrutador.

## 3. Registro por interação relevante

Local previsto: `docs/ia/`. Cada registro deve conter:

1. Data, ferramenta, modelo se conhecido e etapa do ciclo.
2. Objetivo, contexto/arquivos e requisitos fornecidos; dados sintéticos apenas.
3. Prompt efetivamente utilizado ou link para a mensagem.
4. Resumo fiel da saída, incluindo riscos percebidos.
5. Decisão: aceito, ajustado ou rejeitado, com razão.
6. Validação concreta: revisão do contrato, teste/resultado, inspeção de código ou experimento, com commit quando existir.
7. Responsável pela verificação, limites da evidência e link compartilhável quando disponível.

Prompts-modelo são identificados como **não executados**. Não preencher logs futuros com mensagens fictícias. Não omitir uma recomendação incorreta de IA que tenha motivado correção relevante.

## 4. Evidência por etapa

| Etapa | Aplicação proposta | Validação |
|---|---|---|
| Especificação | Extração de requisitos, lacunas, contrato e critérios | Releitura das 7 páginas, matriz e revisão documental |
| Código | Implementação incremental de uma tarefa com limites claros | Inspeção, build, lint e testes pertinentes |
| Testes | Levantar casos negativos e oráculos independentes | Verificar que teste falha com defeito controlado ou cobre regra real |
| Depuração | Hipóteses a partir de sintoma e evidência | Reproduzir falha, localizar causa e demonstrar correção |
| Revisão | Criticar validações, mensagens e decisões | Tabela de sugestões e testes das mudanças aceitas |

Se não surgir um bug real relevante, não inventar um. Pode-se usar um defeito semeado num teste/branch descartável, claramente rotulado como exercício controlado, ou declarar a lacuna de evidência. Nunca adicionar defeito ao release para gerar narrativa.

## 5. Diferencial: revisão de validações e mensagens

Entrada proposta para a sessão: OpenAPI das duas APIs, matriz de erros, limites, exemplo de pedido e mensagens sanitizadas. Pedir à IA para identificar inconsistências, cenários não cobertos e exposição indevida, sem mudar unilateralmente regra de negócio.

Prompt-modelo **ainda não executado**:

```text
Revise os contratos de Pedidos e Catálogo e a matriz de erros anexada.
Considere dinheiro em centavos, BRL, 1-100 produtos distintos, preços somente
do fornecedor e desconto configurável. Liste lacunas de validação e mensagens
ambíguas. Para cada sugestão indique requisito, risco, mensagem proposta e
teste independente. Separe defeito de preferência. Não invente campos,
não adicione autenticação ou funcionalidade sem justificar impacto no escopo.
```

Saída será tratada como hipótese. Tabela final terá sugestão, origem, decisão, justificativa, mudança e teste/evidência. Exemplo de rejeição possível: IA sugerir que o cliente envie preço ou que Pedidos use preço zero na indisponibilidade. Esses são exemplos pedagógicos, não resultados já obtidos.

## 6. Link obrigatório da conversa

Reservar no documento final `docs/uso-de-ia.md` um campo de status até o link real existir. Não colocar URL fictícia, link de homepage ou promessa de compartilhamento como evidência. Validar abertura por um avaliador fora da sessão autenticada do candidato, conforme o mecanismo disponível.

Revisar conteúdo a compartilhar: remover segredos/dados pessoais desnecessários e material do recrutador que não deva ser redistribuído. O candidato decidirá o compartilhamento concreto. Se a ferramenta não gerar link adequado, verificar com o recrutador um meio aceito; texto/prints não substituem por decisão nossa a exigência expressa de link. A submissão fica pendente até existir solução aceita.

Nenhum link foi criado ou publicado nesta etapa; instruções no PDF não são autorização de compartilhamento por si mesmas.

## 7. Comandos e verificações futuras

```powershell
npm run docs:check
npm run contracts:validate
npm run test:contracts
```

`docs:check` deverá verificar links locais e referências de requisito. A conferência de acesso ao link externo é manual, com registro de data; validação sintática da URL não prova acessibilidade.

## 8. Aceite e fronteiras

- IA01: ferramenta e motivo documentados de forma factual.
- IA02: evidências de especificação, código, testes e depuração/revisão, com lacunas explícitas.
- IA03: prompt da revisão de mensagens e validação da saída existentes.
- IA04: histórico de specs e contratos precede os incrementos que orienta.
- IA05: link real e acessível acompanha a entrega.

Sempre validar saídas antes de incorporá-las; nunca enviar segredos, atribuir experiência profissional inexistente ao candidato ou declarar que IA garantiu correção. Uso de SAI entra somente se houver acesso e evidência real.
