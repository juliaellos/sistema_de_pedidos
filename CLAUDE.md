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
- `site/` — o site (cardápio como home, pedido, acompanhamento, sobre), `site/admin/` (painel da unidade, senha `breadking`) e `site/franqueadora/` (painel da franqueadora, senha `franqueadora`, Maringá e Joinville fictícias); HTML/CSS/JS puro, abre com dois cliques em `index.html`; ver `site/README.md`
- `scripts/` — `capturar_site.py` e `capturar_fluxo.py` (captura do site original com Playwright), `testar_clone.py` (teste ponta a ponta do clone, capturas em `tmp/`)

## Regras

- Tudo local, nada em Artifacts, Docs ou conectores da conta.
- Identidade visual: manual Bread King (Rubik + Nunito Sans em `site/fontes/`, vermelho #B8172E, dourado #D69A2D, creme #FBF5EC, café #2A1612). Fonte das regras: skills `bread-king-presentation-design` e `identidade-visual-treinamentos` e `~/bk-acelera-marketing-hub/macro/diretrizes_globais_marca.md`. Não é a identidade da Y OS.
- Catálogo e imagens vêm do site público (clonados), nunca pedidos à Bread King.
- WhatsApp de teste: +55 48 98847-5389. Primeira unidade: Palhoça. Um site por franqueado.
- Dona integral do projeto: Júlia. Não envolver franqueadora, Lovable ou terceiros.
