# Mapa de capacidades

**Status:** proposta especificada para revisão do candidato. **Data:** 21/10/2026.

O usuário autorizou a análise e a elaboração completa das specs nesta etapa. O mapa organiza esses documentos; a construção do sistema será a etapa seguinte. A separação abaixo é lógica: somente `catalogo` e `pedidos` serão serviços executáveis.

| ID estável | Responsabilidade | Dependências de contrato / produto | Spec |
|---|---|---|---|
| `catalogo` | Produtos, preço vigente, leitura em lote, MongoDB | Nenhuma | [SPEC](specs/SPEC-catalogo.md) |
| `pedidos` | Pedido, totais, desconto configurável, persistência SQL | `catalogo`, exclusivamente por contrato REST | [SPEC](specs/SPEC-pedidos.md) |
| `integracao` | Validação do fluxo entre os dois serviços e cenários de indisponibilidade | `catalogo`, `pedidos` | [SPEC](specs/SPEC-integracao.md) |
| `qualidade` | Testes independentes, contratos, segurança básica e desempenho verificável | `integracao` | [SPEC](specs/SPEC-qualidade.md) |
| `plataforma` | Execução, configuração, logs, CI/CD e versionamento | `qualidade`, para definir o gate final | [SPEC](specs/SPEC-plataforma.md) |
| `ia-e-sdd` | Evidência de IA ao longo de especificação, código, testes e depuração | Nenhuma | [SPEC](specs/SPEC-ia-e-sdd.md) |
| `governanca` | Padrão de revisão, critérios bloqueantes e condução entre stacks | Nenhuma | [SPEC](specs/SPEC-governanca.md) |
| `proposta` | Capacidade, esforço, premissas, riscos e comunicação comercial | `integracao`, como escopo dimensionado | [SPEC](specs/SPEC-proposta.md) |
| `entrega` | Pacote GitHub, documentação, links e demonstração | Todos os anteriores | [SPEC](specs/SPEC-entrega.md) |

**Ordem dos contratos:** catálogo → pedidos → integração → qualidade → plataforma; IA/SDD e governança acompanham todas as etapas; proposta usa o escopo estabilizado; entrega fecha o conjunto.

**Ordem de execução:** [tasks/plan.md](tasks/plan.md). Bootstrap do ambiente e CI inicial acontecem antes do código de negócio; a dependência de `plataforma` na tabela se refere ao aceite do gate completo, e não impede o bootstrap. Testes acompanham cada incremento, sem uma fase final isolada de qualidade.

O contrato do fornecedor Catálogo vive em [SPEC-catalogo](specs/SPEC-catalogo.md) e [OpenAPI do Catálogo](contracts/catalogo.openapi.yaml). Pedidos implementa uma porta de aplicação para consumir esse contrato, sem compartilhar o banco ou o modelo interno do fornecedor. Os módulos de documentação não criam dependências em tempo de execução.
