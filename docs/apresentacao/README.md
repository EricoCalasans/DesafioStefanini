# Apresentação do desafio técnico

O deck editável tem sete slides e cabe em uma fala de aproximadamente 6–7 minutos. As notas do apresentador incluem uma sugestão de fala e as fontes locais usadas para cada slide.

[Abrir os slides PowerPoint](desafio-tecnico-coe-leader-final.pptx)

| Slide | Tempo | Mensagem |
|---|---:|---|
| 1 | 0:30 | O pedido recebe preço do Catálogo e mantém rastreabilidade. |
| 2 | 1:00 | Duas stacks representam fronteiras distintas; a escolha demonstra experiência multi-stack e assume custo operacional adicional. |
| 3 | 1:20 | Uma chamada em lote valida os itens; valores são calculados em centavos; pedido e itens são gravados juntos. |
| 4 | 1:00 | Seis rotas de negócio permitem explorar catálogo, criação e histórico no Swagger. |
| 5 | 1:20 | Testes por stack, integração real, smoke, contrato OpenAPI e CI têm evidências próprias. |
| 6 | 1:00 | IA/SDD, guia de governança e dimensionamento mostram decisões e comunicação de liderança. |
| 7 | 0:40 | O README dá um caminho reproduzível; cloud real permanece condicionada a ambiente e acesso. |

Para uma demonstração ao vivo, comece pelo [README da raiz](../../README.md), suba o Compose, rode `node infra/smoke-system.mjs` e abra os dois Swagger UIs. O deck não usa o PDF confidencial como imagem e não apresenta implantação cloud ou uso do SAI APP 3.0 sem evidência.
