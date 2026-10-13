# Bread King Palhoça — site de delivery (Etapa 1, clone)

Clone 1:1 de breadkingsaopaulo.com.br adaptado pra unidade Palhoça, em HTML + CSS + JavaScript
puro. Abre direto no computador, sem servidor nem instalação.

## Como abrir

Dê dois cliques em `index.html` (Chrome, Safari ou Edge). As páginas:

- `index.html` — home (hero, cardápio, nossa loja, por que Bread King, rodapé)
- `cardapio.html` — cardápio completo
- `pedido.html` — carrinho, dados, taxa por bairro, cupom, pagamento simulado, WhatsApp
- `404.html` — página não encontrada

As fontes (Montserrat e Inter) vêm do Google Fonts, então precisa de internet pra ficar
idêntico. Sem internet o site abre com a fonte do sistema.

## Onde mudar cada coisa

| O quê | Arquivo |
|---|---|
| WhatsApp, endereço, horário, taxas por bairro, cupons, tempo do Pix | `dados/unidade.js` |
| Produtos, preços, descrições, destaque, foto | `dados/catalogo.js` |
| Fotos dos produtos | `imagens/produtos/` |
| Logo, hero, mascote, foto da loja (`loja-palhoca.jpg`, opcional) | `imagens/marca/` |
| Textos das páginas | os próprios `.html` |
| Visual clonado do site original | `estilos/referencia.css` (não editar) |
| Ajustes novos (quantidade no card, pagamento, modal) | `estilos/extra.css` |

## Nova unidade

1. Copie a pasta `site/` inteira.
2. Troque `dados/unidade.js` (nome, WhatsApp, endereço, bairros e taxas).
3. Se o cardápio for diferente, edite `dados/catalogo.js`.
4. Troque o nome da unidade nos `<title>` e textos dos `.html` (busque por "Palhoça").

## Fluxo do pedido

1. Cliente escolhe quantidade no card (− / + ou digitando) e clica em Adicionar.
2. Em `pedido.html` escolhe Entrega (bairro + endereço, taxa entra no total) ou Retirada.
3. Preenche nome, e-mail, telefone. Cupom opcional.
4. Paga por Pix (QR de demonstração, confirma sozinho em alguns segundos) ou cartão
   (qualquer número aprova; `4000 0000 0000 0002` recusa). **Simulação: nada é cobrado.**
5. Só depois de pago o botão "Enviar pelo WhatsApp" libera. Abre `wa.me/5548988475389`
   com a mensagem no modelo aprovado.

O carrinho e os dados do cliente ficam salvos no navegador. Cada pedido enviado fica
registrado em `localStorage` (`bk_pedidos_palhoça`) como semente do CRM da Etapa 3.

## O que é simulação e vai mudar depois

- Pagamento (Etapa 2/3: gateway real, Mercado Pago ou similar).
- Cupons e catálogo em arquivo (Etapa 3: banco + CRM).
- Pedidos gravados só no navegador do cliente (Etapa 3: banco da unidade).
# Fotos reduzidas pra no máximo 1200px (originais no site têm até 16 MB). O "Casadinho C-/12 Und" está sem foto no site original: o clone mostra o logo no lugar.
