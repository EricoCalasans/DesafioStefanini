# Revisão das especificações

**Data:** 21/10/2026, atualizada em 22/10/2026. **Revisor:** assistente Codex, na mesma atividade de elaboração. **Status:** revisão documental concluída após correções; o candidato delegou ao Codex as decisões técnicas em 22/10. Não houve revisor externo nem aceite da banca. Foram executados builds e testes de liveness, mas ainda não há validação funcional completa dos serviços.

## 1. Escopo da revisão

Confrontar o material escrito com as sete páginas físicas do PDF; verificar cobertura de requisitos, diferença entre obrigação/diferencial/decisão, coerência entre PRD/specs/OpenAPI/exemplos, critérios de teste, esforço e honestidade das evidências.

Artefatos revisados: análise, PRD, arquitetura, mapa de capacidades, nove specs, três documentos OpenAPI, cinco exemplos JSON, quatro ADRs, plano/backlog, checklist pré-desenvolvimento, registro real de IA e matriz R01-R53.

## 2. Achados e resolução

| Ponto verificado | Resultado / correção aplicada |
|---|---|
| IA e link poderiam ser tratados como extra | Reforçados como obrigatórios no PRD, specs e checklist |
| Parte de diferenciais chamada opcional, mas guia/proposta pedidos no objetivo/entrega | Ambiguidade registrada; ambos incluídos na linha-base |
| Sumário não coincide com algumas páginas finais | Referências usam página física do PDF |
| Multi-stack e front-end confundidos com obrigação | Duas stacks são decisão justificada; UI de negócio fora do núcleo |
| Prazo real confundido com três semanas | Três semanas limitadas ao cenário comercial hipotético |
| Desconto sobre total sem fórmula definida | Base definida como subtotal dos itens; limiar inclusivo, pontos-base e HALF_UP |
| Multiplicação da taxa pode perder precisão | Cálculo bigint e conversão JSON depois dos limites, sem parser numérico global inseguro |
| Preço/configuração poderiam alterar histórico | Snapshot de produto e regra; GETs sem Catálogo nem recálculo |
| Lote com ausência parcial poderia ser ambiguamente 404 | Catálogo retorna conjuntos com 200; Pedidos classifica negócio em 422 |
| Consulta paralela por produto poderia parecer eficiente | Uma busca lógica `$in`, índice e contagem, não Promise.all por item |
| Transação SQL aberta durante chamada HTTP | Chamada antes de BEGIN; lote de inserção; rollback real especificado |
| Resultado ambíguo de commit/timeout | Sem garantia de exatamente uma vez; ausência de idempotência e retry explícita |
| Nome com NUL aceito pelo contrato poderia falhar no PostgreSQL | Controles recusados na entrada e nos snapshots; padrão refletido no OpenAPI |
| Resposta externa poderia ser ilimitada | JSON/status 200 e teto de 256 KiB; falha 502 e cenário Q32 |
| Correlação descrita apenas em texto | Header incluído nas respostas OpenAPI de sucesso, erro e saúde |
| Formato date-time não obriga UTC | Limite do schema documentado; UTC também em teste semântico |
| Guia extenso poderia violar 1-2 páginas | Spec separada do guia final; futura geração e revisão de PDF explicitadas |
| Estimativa poderia esconder testes/revisão ou terceira pessoa | 204 h base +36 h reserva, 120 h por pessoa; papéis e custo explícitos |
| Precificação poderia ser confundida com cotação real | Valores hipotéticos, cálculo aberto e sem dupla reserva |
| Apenas YAML poderia ser apresentado como CI/deploy executado | Evidência de execução exigida; cloud real permanece condicional |
| Registros futuros de IA poderiam ser inventados | Registro atual factual; modelos de prompt identificados como não executados |
| Estrutura de projetos e comandos | Atualizados para diretórios independentes por projeto; comandos executados são separados das funcionalidades ainda pendentes |

## 3. Validação executada nesta etapa

A evidência estruturada está em [revisao-documental.json](evidencias/revisao-documental.json). O [validador documental](validation/validar-especificacoes.py) foi executado em ambiente Python isolado, com dependências de validação registradas no relatório.

Verificações:

- Estrutura OpenAPI 3.1 dos três arquivos, com resolução de referências locais.
- Links locais dos documentos, com destino existente.
- IDs R01-R53, Q01-Q50 e T01-T45, sem lacunas/duplicações, e presença das nove specs.
- Cinco exemplos JSON contra seus schemas, com formatos checados.
- Seis exemplos negativos do pedido recusados pelo schema: campo total, quantidade zero, quantidade string, preço externo, itens vazios e objeto no lugar de ID.
- Conjuntos/valores do exemplo canônico: subtotal 50.000, desconto 5.000 e total 45.000.
- Soma dos oito pacotes de esforço, reserva, teto por pessoa e exemplo de precificação.

Essas verificações documentais não executam regras de negócio, migrations, consultas reais ou pipeline. Os contêineres locais foram iniciados e o bootstrap do Mongo foi repetido; esses passos não comprovam a cobertura dos endpoints, integração de pedidos, latência ou acessibilidade de links externos. Os itens funcionais continuam no plano Q01-Q50.

## 4. Cobertura e conclusão documental

Cada ponto R01-R53 possui destino e futura evidência na [matriz](matriz-de-rastreabilidade.md). Não foi identificado requisito explícito do PDF sem tratamento no planejamento. Essa conclusão é de cobertura documental e não equivale a aprovação da candidatura ou implementação completa.

As funcionalidades do núcleo estão especificadas com objetivo, stack, estrutura, comandos futuros, convenções, testes, limites e critérios de sucesso. Os artefatos de liderança têm público, formato, conteúdo, controle de tamanho/capacidade e aceite. O pacote de entrega tem bloqueadores objetivos.

## 4.1 Revisão cruzada após autorização e durante o bootstrap

Foi feita uma nova leitura do PRD, mapa, arquitetura, critérios e backlog após a autorização explícita para codificar. A validação documental foi repetida: OpenAPI 3.1 e referências locais válidos; 153 links locais resolvidos; R01-R53, Q01-Q50 e T01-T45 sem lacunas; cinco exemplos compatíveis e seis payloads inválidos rejeitados; exemplo canônico e aritmética da proposta coerentes. Não surgiu requisito funcional do PRD sem destino nas specs nem divergência que exigisse mudar contrato ou regra de negócio.

Os pontos operacionais foram alinhados antes da implementação de negócio: os projetos independentes ficam diretamente na raiz em `pedidos-typescript/` e `catalogo-dotnet/`; cada um mantém manifesto/solução, versões, dependências, builds e testes próprios. A raiz não tem package.json nem node_modules. Contratos e infraestrutura compartilhados têm pastas próprias, e documentos, specs, tarefas e validação foram organizados em docs/ e specs/. O PDF recebido, credenciais e caches de preparação estão preservados na pasta irmã `../desafio-local/`, fora do pacote versionado. Essa organização usa um único repositório Git e não altera requisitos do produto.

Pontos de atenção preservados para implementação e revisão: PostgreSQL e MongoDB precisam ser reais nos testes de integração; a consulta de lote deve usar uma busca Mongo `$in`; o preço é consultado antes de abrir a transação SQL; pedido e itens são confirmados juntos; leituras históricas não chamam Catálogo; desconto usa centavos inteiros e `HALF_UP`; respostas externas são validadas como entrada não confiável; nenhuma evidência documental substitui build/teste/smoke executado. O prazo até 23/10 às 18:00 BRT segue sendo a principal restrição e será refletido honestamente no status de cada tarefa.

Durante a resolução de dependências foi detectada incompatibilidade entre TypeScript 6 e `typescript-eslint` 8.48.1 (`peer typescript <6.0.0`). A versão de linguagem não foi rebaixada nem a checagem de pares foi ignorada: lint/formatação usam Biome 2.6.2 e `tsc` permanece responsável pelo typecheck. Essa decisão foi registrada no ADR-004 e nos comandos da spec de Pedidos.

## 5. Pendências reais

| Pendência | Efeito | Momento de resolver |
|---|---|---|
| Stack, banco local e regras centrais | Aceitos pelo candidato em 22/10/2026; ADR 001/002 atualizados | Decisão fechada; candidato ainda deve conseguir defender as escolhas |
| Prazo real da candidatura | 23/10/2026 às 18:00 (horário de Brasília), informado pelo candidato em 22/10 | Priorizar imediatamente; 240 h/3 semanas continuam sendo cenário hipotético, não calendário desta entrega |
| Revisão do contrato e primeira fatia vertical | Revisadas pelo Codex; o candidato delegou as decisões técnicas em 22/10 | Sem bloqueio técnico; candidato deve estudar os trade-offs antes da apresentação |
| Toolchain e dependências | Node `24.22.1`, SDK `10.0.402`/runtime `10.0.13`, Engine `29.9.2`, Compose `v5.6.0`; imagens fixas e lockfiles npm/NuGet gerados | Builds e testes de health check passaram; integração funcional segue pendente |
| Repositório GitHub e acessos | Entrega acessível | Preparação/fechamento |
| Link compartilhável e revisão do conteúdo da conversa | Obrigação da submissão | Resolver antes do fechamento |
| Acesso a SAI APP 3.0 | Somente diferencial específico | Se disponível |
| Conta/orçamento/rede de cloud | Apenas extensão de deploy real | Antes de provisionar |
| Testes e artefatos finais | Comprovação da implementação | Durante construção e release |

As decisões 001-004 estão registradas nos ADRs: o candidato aceitou 001/002 e delegou as demais decisões técnicas ao Codex em 22/10; o Codex revisou e aceitou 003/004. O bootstrap dos dois projetos e bancos está em andamento. Permanecem pendentes o núcleo funcional, testes e evidências; acesso ao GitHub para publicação, SAI APP 3.0 e cloud são condicionais. A revisão do contrato e da primeira fatia não bloqueia a branch de feature.

## 6. Como reproduzir a validação documental

Os pacotes de validação não são dependências das APIs. Na raiz, com Python disponível, crie um ambiente isolado na pasta irmã e execute:

    $repositoryRoot = (Resolve-Path '.').Path
    $localName = "$(Split-Path -Leaf $repositoryRoot)-local"
    $localDirectory = Join-Path (Split-Path -Parent $repositoryRoot) $localName
    $python = Join-Path $localDirectory 'preflight\spec-validation\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $python)) {
        python -m venv (Join-Path $localDirectory 'preflight\spec-validation')
    }
    & $python -m pip install -r docs\validation\requirements-documentacao.txt
    & $python docs\validation\validar-especificacoes.py

O ambiente e os caches ficam fora do repositório; o relatório revalidado é escrito em docs/evidencias/revisao-documental.json. A validação não executa serviços. Quando o mapa, a matriz ou o backlog mudar, conferir as contagens esperadas no validador; nunca reduzi-las para esconder artefatos faltantes.
