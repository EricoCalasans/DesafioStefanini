# ADR 002 - Dinheiro e desconto

**Status:** aceito pelo candidato em 22/10/2026. **Data de registro:** 21/10/2026; **aceite:** 22/10/2026.

**Contexto:** o documento pede subtotal, desconto e total, com regra configurável, sem definir fórmula, precisão, moeda ou aplicação retroativa.

**Decisão:** BRL; inteiros em centavos no contrato; `bigint` no cálculo TS, `long` em C# e `BIGINT` no PostgreSQL. Desconto percentual em pontos-base, arredondado meio para cima uma vez sobre o subtotal. Política carregada/validada no startup e copiada integralmente no pedido.

**Valores de demonstração aceitos:** política `volume-v1` habilitada, limiar inclusivo de `50.000` centavos (R$ 500,00) e taxa de `1.000` pontos-base (10%). São parâmetros ilustrativos do desafio, não valores exigidos pelo documento de origem.

**Alternativas:** decimal com escala fixa é viável, mas traz conversões e serialização adicionais; `number`/`double` para dinheiro aumenta risco; percentuais fixos no código violam o desafio; um serviço administrativo de regras aumenta escopo sem obrigação.

**Consequências:** documentação deve mostrar centavos; intermediários exigem precisão mesmo se o JSON final estiver no intervalo seguro. Alterar ambiente requer reinício e só afeta novos pedidos. Limites e fotografia da configuração garantem explicabilidade.

**Verificação:** teste de fronteira do limiar, taxa zero/100%, meio centavo, grandes valores, mudança de política sem mudança de código e consulta estável de pedidos anteriores.
