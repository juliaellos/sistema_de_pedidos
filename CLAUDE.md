# Bread King — Sistema de delivery web pra franqueados

> Projeto criado em 2026-10-13. Projeto de cliente da Y OS, independente do hub `y-os/`.
> Instruções aqui valem só pra esta pasta.

## Sobre

Clone 1:1 do site breadkingsaopaulo.com.br como base de um sistema de delivery
web pros franqueados, com seletor de quantidade, pagamento integrado e, depois,
CRM básico por unidade. Ver `escopo.md`.

## Arquivos

- `escopo.md` — escopo do projeto (documento do cliente)
- `briefing.md` — pedido original
- `referencia/levantamento-site-atual.md` — o que o site atual é (stack, rotas, fluxo, paleta)
- `site/` — o clone (HTML/CSS/JS puro, abre com dois cliques em `index.html`; ver `site/README.md`)
- `scripts/` — `capturar_site.py` e `capturar_fluxo.py` (captura do site original com Playwright), `testar_clone.py` (teste ponta a ponta do clone, capturas em `tmp/`)

## Regras

- Tudo local, nada em Artifacts, Docs ou conectores da conta.
- Identidade visual é a do site de referência (Montserrat + Inter, #bc152b, #da9f2b, #faf7ee), não a da Y OS.
- Catálogo e imagens vêm do site público (clonados), nunca pedidos à Bread King.
- WhatsApp de teste: +55 48 98847-5389. Primeira unidade: Palhoça. Um site por franqueado.
- Dona integral do projeto: Júlia. Não envolver franqueadora, Lovable ou terceiros.
