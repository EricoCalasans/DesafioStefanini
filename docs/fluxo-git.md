# Fluxo Git do repositório

O repositório usa um único histórico Git na raiz. `main` guarda o estado demonstrável; `develop` integra fatias concluídas; cada mudança trabalha em uma branch curta `feature/<tarefa>-<descricao>`. `release/<versao>` prepara um pacote validado e `hotfix/<descricao>` corrige um defeito urgente observado em `main`.

Commits descrevem uma unidade verificável e usam escopo explícito, por exemplo `feat(orders): persist order snapshots atomically` ou `test(orders): verify rollback against PostgreSQL`. Não juntar stacks em um commit genérico. O histórico preserva commits de implementação reais; branches e PRs não devem ser criados apenas para aparentar um processo que não ocorreu.

Para cada PR, indicar os requisitos e arquivos de spec atendidos, testes executados, evidência e risco residual. A CI verifica Node/Pedidos, .NET/Catálogo, contratos, documentação, build dos containers, migrations, integração com PostgreSQL e smoke das APIs. Em trabalho individual, a revisão é registrada como revisão própria e não como aprovação independente.

O merge de uma feature para `develop` só ocorre depois dos checks aplicáveis. A publicação de `main` exige que o mesmo commit esteja validado e que README, checklist, guia e artefatos correspondam a ele. A existência de branches locais não substitui PR, revisão ou evidência de CI.
