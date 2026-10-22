# Revisão das especificações

**Data:** 21/10/2026. **Revisor:** assistente Codex, na mesma atividade de elaboração. **Status:** revisão documental concluída após correções; validação humana do candidato pendente. Não houve revisor externo, execução da aplicação ou aceite da banca.

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
| Comandos de uma aplicação ainda inexistente | Todos os comandos de software identificados como contratos futuros |

## 3. Validação executada nesta etapa

A evidência estruturada está em [revisao-documental.json](evidencias/revisao-documental.json). O [validador documental](../scripts/validar-especificacoes.py) foi executado em ambiente Python isolado, com dependências de validação registradas no relatório.

Verificações:

- Estrutura OpenAPI 3.1 dos três arquivos, com resolução de referências locais.
- Links locais dos documentos, com destino existente.
- IDs R01-R53, Q01-Q50 e T01-T45, sem lacunas/duplicações, e presença das nove specs.
- Cinco exemplos JSON contra seus schemas, com formatos checados.
- Seis exemplos negativos do pedido recusados pelo schema: campo total, quantidade zero, quantidade string, preço externo, itens vazios e objeto no lugar de ID.
- Conjuntos/valores do exemplo canônico: subtotal 50.000, desconto 5.000 e total 45.000.
- Soma dos oito pacotes de esforço, reserva, teto por pessoa e exemplo de precificação.

Essas verificações não executam regras de uma aplicação, migrations, queries reais, contêineres ou pipeline. Não comprovam cobertura de código, latência, ausência de SQL injection na futura implementação ou acessibilidade de links externos. Esses itens permanecem no plano Q01-Q50.

## 4. Cobertura e conclusão documental

Cada ponto R01-R53 possui destino e futura evidência na [matriz](matriz-de-rastreabilidade.md). Não foi identificado requisito explícito do PDF sem tratamento no planejamento. Essa conclusão é de cobertura documental e não equivale a aprovação da candidatura ou implementação completa.

As funcionalidades do núcleo estão especificadas com objetivo, stack, estrutura, comandos futuros, convenções, testes, limites e critérios de sucesso. Os artefatos de liderança têm público, formato, conteúdo, controle de tamanho/capacidade e aceite. O pacote de entrega tem bloqueadores objetivos.

## 5. Pendências reais

| Pendência | Efeito | Momento de resolver |
|---|---|---|
| Stack, banco local e regras centrais | Aceitos pelo candidato em 22/10/2026; ADR 001/002 atualizados | Decisão fechada; candidato ainda deve conseguir defender as escolhas |
| Prazo real da candidatura | 23/10/2026 às 18:00 (horário de Brasília), informado pelo candidato em 22/10 | Priorizar imediatamente; 240 h/3 semanas continuam sendo cenário hipotético, não calendário desta entrega |
| Revisão do contrato e primeira fatia vertical | Ainda aguardando validação do candidato | Antes da primeira branch de feature |
| Toolchain local: Node, SDK .NET e Docker | Node `24.22.1`, SDK `10.0.402`/runtime `10.0.13`, Engine `29.9.2` e Compose `v5.6.0` confirmados em 22/10; imagens de banco baixadas | Escolher/lockar patches exatos das dependências de aplicação e imagens de runtime/build durante o bootstrap; revalidar portas |
| Patches/driver C# exatos e lockfiles | Compatibilidade real do conjunto | Bootstrap, com build/teste |
| Repositório GitHub e acessos | Entrega acessível | Preparação/fechamento |
| Link compartilhável e revisão do conteúdo da conversa | Obrigação da submissão | Resolver antes do fechamento |
| Acesso a SAI APP 3.0 | Somente diferencial específico | Se disponível |
| Conta/orçamento/rede de cloud | Apenas extensão de deploy real | Antes de provisionar |
| Testes e artefatos finais | Comprovação da implementação | Durante construção e release |

As decisões aceitas estão registradas nos ADRs 001 e 002; os itens ainda pendentes são revisões, acessos, implementação e evidências. A documentação orienta a próxima etapa, mas a revisão do contrato e da primeira fatia ainda deve ocorrer antes da branch de feature.

## 6. Como reproduzir a validação documental

Os pacotes não são dependências das futuras APIs. Na raiz, com Python disponível, criar ambiente isolado, instalar as versões fixadas e executar:

```powershell
python -m venv tmp/spec-validation
& .\tmp\spec-validation\Scripts\python.exe -m pip install -r scripts/requirements-documentacao.txt
& .\tmp\spec-validation\Scripts\python.exe scripts/validar-especificacoes.py
```

O script revalida documentos locais e atualiza o relatório. Não executa serviços. Para reaplicá-lo após ampliar o mapa, a matriz ou o backlog, atualizar conscientemente as contagens esperadas; não alterar contagens para ocultar um documento faltante.
