# ADR 004 - Qualidade e entrega

**Status:** aceito em 22/10/2026 pelo Codex, sob delegação técnica explícita do candidato. **Data da decisão:** 22/10/2026. **Elaborado:** 21/10/2026.

**Contexto:** o PDF exige criação testada, GitFlow, documentação de IA e link da conversa; valoriza CI/CD, SDD e liderança.

**Decisão:** testes unitários de domínio, integração com PostgreSQL/MongoDB reais, contratos e testes do fluxo completo. GitHub Actions só libera artefato/deploy após checks do mesmo commit. Usar GitFlow explícito. Manter docs de IA reais por etapa e bloqueio de submissão enquanto faltar link acessível. Incluir guia e dimensionamento no pacote.

**Alternativas:** testes exclusivamente com mocks não provam SQL/Mongo; um relato genérico de IA não cobre evidências; deploy independente do CI viola o gate. Trunk-based poderia ser adequado a outros contextos, mas GitFlow é exigência deste.

**Consequências:** tempo de documentação, revisão e teste entra nas estimativas. Trabalho individual será identificado como tal. Cloud real é condicional, e sua ausência não será mascarada como deploy executado.

**Ajuste de ferramenta durante o bootstrap:** TypeScript 6.0.3 é requisito da stack aprovada; `typescript-eslint` 8.48.1 declara peer dependency `<6.0.0` e o npm recusou resolver a árvore. Para manter a versão da linguagem e instalações reproduzíveis, TypeScript terá `tsc --noEmit` para tipos e Biome 2.6.2 para lint/formatação. O `package-lock.json` fixa todo o grafo. Não usar `--force` nem ignorar peer dependencies.

**Verificação:** falha deliberada em check impede job de deploy; evidência da tag; README reproduzido; guia com 1-2 páginas; proposta com capacidade reconciliada; link de IA conferido.

**Aceite registrado:** o candidato delegou ao Codex as escolhas técnicas com base no PRD. GitFlow, testes com bancos reais, gate de CI, documentação factual de IA e link de conversa permanecem no escopo; cloud segue condicional.
