# Registro real de IA - etapa de especificação

**Data:** 21/10/2026. **Ferramenta:** assistente Codex neste chat. **Modelo/versão exata:** não verificados pela interface nesta atividade. **Status:** interação de análise realizada; implementação não iniciada.

## Solicitação efetiva

O candidato forneceu o PDF local e pediu análise ponto a ponto, documento com cada parte importante, specs completas para tudo que será desenvolvido, destaque de pontos de atenção, revisão do conjunto e resumo da solução/linguagens.

Trecho do pedido: “Analise esse documento ponto a ponto, crie um documento pontuando cada parte importante do documento.” O pedido completo está no histórico desta conversa, que ainda não foi compartilhado por link.

## Contexto e método utilizados

Pasta inicialmente contendo apenas o PDF. Leitura com `pypdf` mostrou ausência de texto extraível. As sete páginas foram renderizadas com Poppler e inspecionadas visualmente. A análise registra a posição física das páginas, requisitos obrigatórios, diferenciais e ambiguidades. Referências técnicas oficiais foram consultadas sem enviar o texto do desafio às buscas.

## Saídas e decisões propostas

- Dois serviços com bancos separados, contratos REST e arquitetura por portas.
- Pedidos em TypeScript/NestJS e Catálogo em C#/ASP.NET Core como proposta multi-stack.
- Moeda BRL, centavos, política de desconto por ambiente e snapshots para histórico.
- Busca em lote com índice em Catálogo e SQL parametrizado/transacional em Pedidos.
- Inclusão do guia e da proposta, apesar da redação opcional da seção de diferenciais.
- Separação entre IA obrigatória no desenvolvimento e IA opcional dentro de funcionalidades; não planejar IA no runtime.
- Cloud e apresentação final condicionais; nenhuma publicação ou link inventados.

## Validação e limites

A validação desta etapa é documental, feita pelo assistente: revisão visual do PDF, cruzamento com matriz, revisão de coerência e checagem dos contratos/referências. O relatório concreto fica em [revisão das specs](../revisao-das-especificacoes.md).

O candidato ainda deve revisar a proposta e sua capacidade de defender as stacks. Não houve teste de aplicação, execução de serviço ou validação humana formal nesta etapa. As evidências das fases de código, teste e depuração deverão ser produzidas quando essas fases acontecerem.

**Link compartilhável:** pendente de criação e verificação pelo candidato no fechamento da entrega. Este arquivo não substitui o requisito de link do PDF.
