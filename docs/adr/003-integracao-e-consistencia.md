# ADR 003 - Integração e consistência

**Status:** proposto. **Data:** 21/10/2026.

**Contexto:** preço e item precisam ser validados na criação, evitando consulta por item; os bancos pertencem a serviços independentes.

**Decisão:** uma consulta HTTP em lote com IDs distintos, resolvida por uma busca MongoDB indexada. Pedidos valida o contrato recebido, calcula em memória e abre uma transação SQL só depois. Preserva nome, preço e versão de cada produto. Leitura posterior não consulta o Catálogo.

**Alternativas:** chamadas por item produzem N+1; copiar catálogo para SQL enfraquece validação do fornecedor; mensageria/eventual consistency muda o contrato de criação; transação distribuída ou reserva de preço exige regras e infraestrutura adicionais.

**Consequências:** criação depende da disponibilidade do Catálogo; erros são explicitados por 502/503/504. Não há garantia de que o preço atual permaneceu igual entre a leitura e o commit. Não há retry automático de criação nem garantia de idempotência; timeout após commit pode exigir consulta pelo ID se o cliente já o recebeu.

**Verificação:** contador de chamada HTTP, busca única com `$in`, cenários de falha e teste de histórico independente do fornecedor.
