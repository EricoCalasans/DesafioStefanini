# Guia de code review multi-stack

**Desafio COE Leader · v1.0 · 22/10/2026**

## Objetivo

Code review protege comportamento, dados e capacidade de evolução. O revisor confere o diff contra a tarefa, a spec e o contrato; verifica os riscos do domínio; pede evidência executável. O review não substitui testes, CI ou responsabilidade de quem implementa.

## Bloqueadores antes de aprovar

- **Requisito e fronteira:** a mudança atende uma tarefa nomeada e respeita a separação entre Pedidos, Catálogo e contratos? Cada projeto mantém configuração, dependências e testes próprios?
- **Regra de negócio:** preço vem do Catálogo na criação; valores usam centavos inteiros; descontos respeitam limiar, taxa, arredondamento e limites; pedidos existentes continuam com seus snapshots?
- **Dados e transações:** entradas são validadas como não confiáveis; SQL usa parâmetros; cabeçalho e itens confirmam ou revertem juntos; a chamada HTTP ao Catálogo acontece antes da transação?
- **Falhas e segurança:** há códigos/status consistentes, timeout e limites de corpo; logs omitem dados pessoais, payloads e credenciais; runtime não recebe permissões de migração?
- **Operação e testes:** liveness/readiness têm responsabilidades corretas; cancelamento, paginação e ordem são previsíveis; testes provam sucesso e falha; documentação e contratos acompanham a mudança?

### Classifique o comentário

| Nível | Ação esperada |
|---|---|
| **Bloqueador (P0/P1)** | Corrigir antes do merge: quebra de requisito, risco de segurança/dados, cálculo incorreto, perda de atomicidade ou serviço indisponível. |
| **Importante (P2)** | Corrigir neste incremento ou registrar responsável e tarefa acordada antes de aprovar. |
| **Sugestão (P3)** | Opcional e não bloqueia; explique o benefício sem disfarçar preferência pessoal como defeito. |

Escreva comentários acionáveis: **cenário → impacto → mudança esperada**. Aponte o menor trecho possível. Faça pergunta quando faltar contexto; não presuma intenção. Reconheça explicitamente quando um comentário foi resolvido, aceito para depois ou rejeitado com justificativa.

## Checklist por projeto

### Pedidos · TypeScript / NestJS / PostgreSQL

- DTO fechado e parse estrito; sem conversão implícita de tipos ou preço fornecido pelo cliente.
- `bigint` durante cálculos; conversão para JSON somente após validar o intervalo seguro.
- Cliente do Catálogo valida conjunto completo, tipos, status, timeout até o fim da resposta e tamanho máximo.
- Buscar preços antes de abrir a transação. Usar SQL parametrizado; gravar cabeçalho e itens em uma transação, em lote; liberar a conexão em `finally`.
- GET histórico usa o snapshot SQL e não chama Catálogo nem recalcula a política atual.
- `Problem Details`, correlação, logs sanitizados, health checks e migrations revisáveis.

### Catálogo · C# / ASP.NET Core / MongoDB

- Controller fino; regras do domínio não dependem de HTTP nem do driver.
- Propagar `CancellationToken`; limitar consultas e retornar falhas sem detalhes internos.
- Consulta em lote usa uma busca `$in`, inclui inativos para classificação do consumidor e não executa uma busca por produto.
- Filtro, projeção, ordem e limites coerentes com índices; evidenciar contagem de comandos/`explain` antes de afirmar desempenho.
- Validar documentos lidos do Mongo como dados externos; runtime só precisa de leitura.

### Java · padrão para outros serviços

- Usar `PreparedStatement`, parâmetros de framework e `try-with-resources`; definir limites de transação e timeout. Esta referência orienta squads e não indica uma terceira aplicação neste desafio.

## Evidência mínima e decisão

Antes do merge, identificar tarefa/requisitos; executar format, build, análise estática e testes do projeto; adicionar teste para cada regra/limite alterado; rodar integração real quando houver mudança em banco ou fronteira; rodar smoke em Compose para mudança integrada. Conferir migrations, contrato OpenAPI, README e configuração. A CI deve passar no mesmo commit que será integrado.

Revisor registra **Aprovar**, **Solicitar alterações** ou **Comentar sem bloqueio**, com motivo e pendências. Sem acesso a ambiente externo, declare a verificação local e a limitação; não transforme spec, mock ou pipeline configurada em evidência de execução real.

Mentoria acontece em comentários que explicam o risco e em pareamento nas primeiras mudanças de domínio. Acompanhe tendências de tempo de revisão, retrabalho por classe de defeito e falhas escapadas no nível da squad; não ranqueie pessoas.
