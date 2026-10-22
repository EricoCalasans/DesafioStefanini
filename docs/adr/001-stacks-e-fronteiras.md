# ADR 001 - Stacks e fronteiras

**Status:** aceito pelo candidato em 22/10/2026. **Data de registro:** 21/10/2026; **aceite:** 22/10/2026.

**Contexto:** o desafio permite stacks livres, exige SQL/NoSQL e avalia liderança multi-stack. O núcleo contém apenas dois serviços e precisa caber numa demonstração simples.

**Decisão:** monorepo local com Docker Compose; Pedidos em TypeScript/NestJS/PostgreSQL e Catálogo em C#/ASP.NET Core/MongoDB. Cada serviço é implantável separadamente. O domínio não depende dos frameworks. A comunicação é exclusivamente por HTTP REST documentado. Nuvem permanece uma extensão condicional, sem banco online como pré-requisito.

**Alternativas:** TypeScript nos dois serviços reduz setup e troca de contexto; Java/Spring no Catálogo demonstra diversidade semelhante à de C#. Uma aplicação única com dois bancos enfraquece a fronteira solicitada entre os serviços.

**Consequências:** maior custo de toolchain e CI, compensado por contratos pequenos e ausência de uma terceira stack de aplicação. Nenhuma UI de negócio no núcleo. O candidato confirmou a stack mesmo com entrega em 23/10/2026 às 18:00 (horário de Brasília); o prazo torna o risco de escopo alto e exige priorização explícita, sem trocar de stack ou alegar conclusão sem novo aceite/evidência.

**Verificação:** builds independentes, domínio sem imports de infraestrutura, bancos com acesso separado e integração real por REST.
