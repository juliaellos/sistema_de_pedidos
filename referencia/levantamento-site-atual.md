# Levantamento técnico — breadkingsaopaulo.com.br

Levantado em 2026-10-13 a partir do HTML, CSS e bundles JS públicos do site.
Serve de base pro clone 1:1 descrito em `../escopo.md`.

## Stack atual

- **Construído no Lovable** (React + Vite + Tailwind + shadcn/ui). SPA: o HTML
  tem só `<div id="root">`; todo o conteúdo é montado por JavaScript.
- **Banco e imagens: Supabase** (`pvkoyxlcnhzkclbwlagu.supabase.co`).
  Tabelas lidas pelo front: `categories`, `products`, mais combos, cupons,
  lojas (`stores`) e configurações do site (`site_settings`).
- **Já existe um painel `/admin`** no site atual (tema `admin-theme` no CSS).
  Ou seja: o catálogo é editável hoje por um painel, não é hardcoded.
- Analytics do próprio Lovable (`/~flock.js`).

## Rotas (páginas)

| Rota | O que é |
|---|---|
| `/` | Home: hero, "Por que Bread King?", cardápio com filtros, lojas, rodapé |
| `/cardapio` | Cardápio completo (mesma listagem, com link "Voltar") |
| `/pedido` | Carrinho + formulário + envio pro WhatsApp |
| `/admin/*` | Painel administrativo (catálogo, cupons, lojas, textos) |
| `/copa`, `/bolaodacopa` | Páginas de campanha (Copa) |
| `/coquetel`, `/coquetel/mandaqui`, `/coquetel/tatuape` | Páginas de campanha por unidade |
| `/pesquisadesatisfacao` | Pesquisa de satisfação |
| `/cardapio-antigo` | Versão anterior do cardápio |
| `*` | 404 |

## Seções da home (ordem)

1. **Hero**: foto (`hero-leticia.png`) de pessoa segurando pão, logo, título
   "padaria completa dentro de casa", subtítulo "Mais de 200 produtos prontos em
   minutos", botões **Ver Cardápio**, **WhatsApp**, **Nossas Lojas**, e "Explorar".
2. **Por que Bread King?** (`#porque`): cards com ícone. Textos lidos do
   `site_settings` com fallback: "Ultracongelamento é tecnologia. Preserva
   textura, sabor e qualidade dos alimentos." / "Pronto quando você precisar.
   Assou, serviu, aproveitou." Imagem `pao-frances-6h.png`, mascote
   `mascote-terence.png`.
3. **Cardápio** (`#cardapio`): título "Cardápio Bread King", instrução
   "escolha, adicione ao carrinho e finalize pelo WhatsApp". Filtro por
   categoria (chips): Confeitaria, Padaria, Pizzas, Salgados, Sem Glúten e Sem
   Lactose, Sopas, Tortas Especiais. Contador de produtos. Card: foto, nome,
   peso/quantidade, descrição curta, preço, botão **Adicionar**, selo **Destaque**.
4. **Nossas Lojas** (`#lojas`): Mandaqui, Tatuapé e Moema, com foto de cada
   (`loja-mandaqui.jpeg`, `loja-tatuape.jpeg`, `loja-moema.jpeg`), cada uma
   com WhatsApp próprio.
5. **Rodapé**: logo, "A primeira padaria de supercongelados do Brasil. Tradição
   artesanal com a praticidade que você precisa.", links rápidos (Por que /
   Cardápio / Nossas Lojas), WhatsApp (11) 4862-0022, "Unidades: São Paulo, SP",
   "© 2026 Bread King São Paulo. Todos os direitos reservados.", "Feito com ♥ em
   São Paulo".

## Catálogo visível hoje

**Correção (captura com navegador em 13/10):** 126 produtos publicados em 7 categorias:
Confeitaria 36, Padaria 32, Pizzas 4, Salgados 37, Sem Glúten e Sem Lactose 9, Sopas 5,
Tortas Especiais 3. A leitura inicial sem navegador só via a Confeitaria. Amostra de preços:

- Bolos 800 g: R$ 59,90 (2 Amores, 4 Leites, Bombom, Brigadeiro, Prestígio, Marta Rocha, Torta Alemã…)
- Bolos de pote 180 g: R$ 14,99
- Docinhos c/12 un.: R$ 19,99 a R$ 24,99
- Donuts 2 × 70 g: R$ 14,90 · Muffins 80 g: R$ 8,99
- Mousses, pudins, pavê, petit gateau, pastel de nata, tortas: R$ 9,99 a R$ 39,99

O site diz "mais de 200 produtos"; 126 estão publicados. Catálogo e fotos capturados
com `scripts/capturar_site.py` e salvos em `site/dados/catalogo.js` e `site/imagens/`.

## Fluxo do pedido (`/pedido`), como funciona hoje

- Título "Seu pedido". Lista de itens com foto, nome, peso, **− quantidade +**,
  remover (lixeira), subtotal por item. Suporta **combos** além de produtos.
- Botões "Continuar comprando" e "Limpar".
- **Seletor de unidade** (obrigatório): "Selecione uma unidade para continuar."
- **Entrega ou Retirada** (toggle). Entrega exige endereço e mostra o texto
  `delivery_text` das configurações. Avisos fixos: "Por favor, confirme a taxa
  e o prazo de entrega." / "Por favor, confirme o horário para retirada."
- **Cupom**: campo em caixa alta, valida no servidor, aplica desconto percentual
  e mostra o valor abatido.
- **Dados do cliente**: Nome, Telefone, Endereço (endereço obrigatório só na
  entrega). Não há campo de e-mail hoje.
- Total. Botão verde **Enviar pelo WhatsApp** (ativo só com unidade + dados +
  itens). Abre `wa.me/<whatsapp da unidade>?text=<pedido formatado>`.
- Pagamento: não existe. É combinado no WhatsApp (Pix manual).
- Quantidade **não** é escolhida no card do cardápio; "Adicionar" põe 1 e a
  quantidade só muda dentro do carrinho.

## Identidade visual (pra reproduzir)

- Fontes: **Montserrat** (títulos, 400–900) e **Inter** (texto, 300–700), via Google Fonts.
- Tokens (HSL do CSS): primária `352 80% 41%` ≈ **#bc152b** (vermelho), glow
  `352 90% 50%`; secundária `40 70% 51%` ≈ **#da9f2b** (dourado), glow
  `45 80% 55%`; fundo `30 20% 97%` ≈ **#faf7ee** (creme); texto `0 0% 12%`;
  bordas `30 15% 88%`; raio padrão `0.75rem`; WhatsApp **#25D366**.
- Cores de apoio encontradas: #0a7d3d (verde), #002776 (azul, campanha Copa),
  #facc15 (amarelo), #2b1a10 (marrom escuro), tons de creme #f5ecd4 / #f0e2b8.
- Imagens estáticas: `logo-bread-king.png`, `hero-leticia.png`,
  `mascote-terence.png`, `pao-frances-6h.png`, fotos das 3 lojas. Fotos de
  produto vêm do Supabase Storage (URLs com redimensionamento por largura).
