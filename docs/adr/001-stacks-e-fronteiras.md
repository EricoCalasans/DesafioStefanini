# ADR 001 - Stacks e fronteiras

**Status:** proposto. **Data:** 21/10/2026.

**Contexto:** o desafio permite stacks livres, exige SQL/NoSQL e avalia liderança multi-stack. O núcleo contém apenas dois serviços e precisa caber numa demonstração simples.

**Decisão:** monorepo, Pedidos em TypeScript/NestJS/PostgreSQL e Catálogo em C#/ASP.NET Core/MongoDB. Cada serviço é implantável separadamente. O domínio não depende dos frameworks. A comunicação é exclusivamente por HTTP REST documentado.

**Alternativas:** TypeScript nos dois serviços reduz setup e troca de contexto; Java/Spring no Catálogo demonstra diversidade semelhante à de C#. Uma aplicação única com dois bancos enfraquece a fronteira solicitada entre os serviços.

**Consequências:** maior custo de toolchain e CI, compensado por contratos pequenos e ausência de uma terceira stack de aplicação. Nenhuma UI de negócio no núcleo. Se a familiaridade do candidato ou o prazo real tornar C# arriscado, revisar a decisão antes do código; não sacrificar integração funcional para demonstrar diversidade.

**Verificação:** builds independentes, domínio sem imports de infraestrutura, bancos com acesso separado e integração real por REST.
