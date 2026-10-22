# Spec - `proposta`

**Versão:** 1.0. **Status:** dimensionamento-base proposto e documento executivo produzido em `docs/proposta/dimensionamento.md` em 22/10/2026; continua hipotético, não é proposta comercial real. **Origem:** R10, R18, R40-R41, R46, R48, R51.

## 1. Objetivo e restrição do cenário

Produzir `docs/proposta/dimensionamento.md` e resumo executivo para entregar Partes 1 e 2 em **três semanas úteis**, com **um desenvolvedor sênior e um pleno**. Cobrir esforço, senioridade, composição, premissas, riscos, cortes e aceite. O cenário é hipotético e não define o prazo da candidatura nem pressupõe que o candidato trabalhe com outra pessoa de fato.

O documento final deve explicar o que é capacidade, trabalho base e contingência; a diretoria deve entender impacto de escopo sem ler código. O dimensionamento abaixo é a base especificada, já reconciliada aritmeticamente, para ser refinada após bootstrap.

## 2. Premissas e capacidade

- 15 dias úteis, 8 horas por dia, 2 profissionais: `15 × 8 × 2 = 240 h` nominais.
- Sênior 120 h e pleno 120 h. Sem QA, DevOps ou gerente dedicados; essas atividades estão nas horas dos dois.
- Trabalho base: 204 h. Reserva: 36 h, equivalente a 15% da capacidade e aproximadamente 17,65% do trabalho base. Não somar as duas porcentagens.
- Coordenação, revisão, documentação, IA e testes já fazem parte das atividades. Não assumir 100% do tempo em código nem tratar IA como pessoa extra.
- Escopo estável das APIs, seeds e regras propostas. Sem migração de legado, dados reais, autenticação corporativa, frontend ou SLA produtivo.
- Acessos e toolchain disponíveis no início; atraso de acesso/ambiente será risco que consome reserva ou prazo.
- Cloud real e vídeo final ficam fora desta linha-base; roteiro e caminho de CI/CD entram.

## 3. Esforço por pacote e senioridade

| Pacote | Sênior (h) | Pleno (h) | Total (h) | Resultado |
|---|---:|---:|---:|---|
| Descoberta, specs, contratos e arquitetura | 14 | 6 | 20 | Regras e interfaces revisadas |
| Setup, contêineres e CI inicial | 8 | 8 | 16 | Ambiente e checks básicos |
| Catálogo, MongoDB, seed e consultas | 10 | 18 | 28 | API de produtos e lote |
| Domínio de Pedidos e desconto | 12 | 12 | 24 | Agregado e cálculos exatos |
| Pedidos HTTP/SQL e integração | 18 | 20 | 38 | Fluxo completo persistido |
| Testes, falhas, revisão e estabilização | 18 | 20 | 38 | Evidências de qualidade |
| README, IA, demonstração e empacotamento | 12 | 12 | 24 | Reprodução e entrega |
| Guia de governança e dimensionamento | 12 | 4 | 16 | Artefatos de liderança |
| **Trabalho base** | **104** | **100** | **204** | |
| **Reserva explícita** | **16** | **20** | **36** | Imprevistos; não é nova feature |
| **Capacidade total** | **120** | **120** | **240** | Sem exceder o teto |

Os primeiros sete pacotes somam 188 h e cobrem sistema, qualidade e preparação de entrega. Os 16 h finais tornam explícito o custo dos artefatos de liderança. A estimativa inclui o escopo proposto de duas stacks; caso seja reduzido para uma, reestimar e registrar a decisão.

## 4. Sequência de três semanas

| Semana | Resultado e dependências | Base sênior/pleno | Reserva sênior/pleno | Total |
|---|---|---|---|---:|
| 1 | Fechar contrato; bootstrap; Catálogo real; domínio de Pedidos; primeiros registros IA | 36 / 34 h | 4 / 6 h | 80 h |
| 2 | POST integrado; transação; GETs; testes de falha e gate completo | 36 / 34 h | 4 / 6 h | 80 h |
| 3 | Estabilização; evidências; guia/proposta; README, release e demonstração | 32 / 32 h | 8 / 8 h | 80 h |
| **Total** | | **104 / 100 h** | **16 / 20 h** | **240 h** |

O sênior conduz fronteiras, dinheiro, integração, revisão e negociação de escopo. O pleno assume grande parte de Catálogo, seed, leituras, exemplos e testes, com pareamento nos riscos. Ambos implementam e revisam. A simultaneidade da equipe hipotética não significa que agentes ou colaboradores já trabalharam neste repositório.

## 5. Riscos, gatilhos e respostas

| Risco / gatilho | Impacto | Resposta |
|---|---|---|
| Toolchain não disponível no primeiro dia | Bloqueia integração | Resolver no bootstrap; usar reserva, replanejar se persistir |
| Catálogo sem contrato estável até dia 3 | Bloqueia Pedidos | Congelar contrato mínimo, usar stub apenas temporário e depois teste real |
| Sem POST real integrado até fim da semana 2 | Alto risco de prazo | Cortar cloud/slides extras e tratar bloqueador técnico imediatamente |
| Duas stacks exigirem aprendizado não previsto | Capacidade reduzida | Reavaliar stack antes de expandir; registrar trade-off multi-stack |
| Defeito monetário, SQL inseguro ou rollback falho | Impede aceite | Prioridade absoluta; não trocar qualidade por funcionalidade extra |
| Link IA inacessível no fechamento | Impede submissão completa | Resolver mecanismo de compartilhamento/aceite com antecedência |
| Reserva consumida antes da semana 3 | Entrega pressionada | Expor desvio, cortar somente extensões e negociar escopo/prazo |

Não cortar testes da criação, regra configurável, integração real, SQL/NoSQL ou evidência obrigatória de IA. Guia/proposta já estão na linha-base devido à redação do objetivo/entrega. Novas funcionalidades exigem reestimativa.

## 6. Exemplo de precificação com hipóteses assumidas

Complemento por causa da competência comercial citada no contexto; **não são preços de mercado, recomendação financeira ou cotação da Stefanini**. Valores escolhidos apenas para demonstrar método.

- Custo-hora hipotético sênior: R$160; pleno: R$110.
- Custo de capacidade reservada: `120×160 + 120×110 = R$32.400`.
- Overhead hipotético de 10% do custo: R$3.240. Custo total ilustrativo: R$35.640.
- Se tributos hipotéticos forem 8% da receita e margem desejada 20% da receita: `preço = 35.640 / (1 - 0,08 - 0,20) = R$49.500`.
- Conferência: custo R$35.640 + tributos R$3.960 + margem R$9.900 = R$49.500.

A reserva de 36 h já foi remunerada nos 240 h; não acrescentar mais 15% de contingência ao custo sem justificar outro risco. Margem sobre receita difere de markup sobre custo. Cloud, licenças pagas, impostos reais, regime tributário e suporte posterior precisam de orçamento/validação separados.

## 7. Aceite e estrutura final

Documento final terá resumo executivo, escopo, premissas, composição, tabela de esforço, calendário, riscos, cortes, definição de pronto e custos assumidos se mantidos. Não apresentar precisão maior que o conhecimento atual; registrar intervalo/sensibilidade se o bootstrap revelar incerteza.

- PROP01: três semanas e exatamente um sênior/um pleno, sem recurso oculto.
- PROP02: horas por pessoa/pacote/semana fecham em 240 h, com reserva distinta.
- PROP03: testes, coordenação, documentação, IA e liderança têm espaço explícito.
- PROP04: premissas, dependências, critérios de aceite e risco de atraso são entendíveis por negócio.
- PROP05: fórmula financeira reproduzível, valores hipotéticos rotulados e sem dupla contingência.

O documento executivo produzido está em `docs/proposta/dimensionamento.md`; a validação documental conferiu 204 h de base, 36 h de reserva, 120 h por pessoa e a aritmética do exemplo de R$49.500. Revisão humana de premissas e preços reais continua necessária antes de qualquer uso comercial. Não há código de aplicação a testar neste módulo documental.
