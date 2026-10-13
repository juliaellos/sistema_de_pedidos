# Bread King Palhoça — site de delivery + painel (modo simulação)

HTML + CSS + JavaScript puro. Abre no computador sem servidor. Tudo (produtos editados, pedidos,
clientes, configurações) fica no `localStorage` do navegador: é a simulação do backend das etapas 2 e 3.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | **Página principal: o cardápio.** Seções "Recomendados pra você" (só pra quem já pediu), "Mais pedidos" e as 7 categorias, cada uma com "Ver todos". Busca, quantidade no card, modal do produto. |
| `categoria.html?c=Padaria` | Grade completa de uma categoria (ou `c=mais-pedidos`, `c=recomendados`). |
| `pedido.html` | Carrinho, Entrega (bairro + taxa) ou Retirada, dados, cupom, pagamento simulado (Pix ou cartão). Ao aprovar, cria o pedido e vai pro acompanhamento. |
| `acompanhamento.html?n=BK-1001` | Linha do tempo do pedido. Atualiza sozinha quando a loja muda o status no painel. Sem parâmetro, lista os pedidos do cliente. |
| `sobre.html` | A antiga home clonada (hero, loja, por que Bread King). Linkada no rodapé como "Sobre nós". |
| `admin/index.html` | **Painel da unidade.** Sem link no site. Senha padrão `breadking` (troque em Configurações). |

## Painel (`admin/`)

- **Pedidos:** KPIs do dia, filtros, detalhe, avanço de status (Pago → Em preparo → Saiu pra entrega / Pronto pra retirada → Concluído), cancelar, exportar CSV. Ao marcar "Saiu pra entrega" ou "Pronto pra retirada" abre o WhatsApp do cliente com a mensagem automática já escrita e registra no histórico (sem API, é o máximo que dá; com API oficial o envio é silencioso).
- **Clientes:** cadastro automático pelos pedidos: nº de pedidos, total, ticket, último pedido, bairro, preferência, produtos mais comprados. Exportar CSV.
- **Produtos:** adicionar, editar (nome, categoria, peso, descrição, preço, foto, destaque), ocultar/ativar, excluir, restaurar o catálogo clonado. As mudanças aparecem no site na hora.
- **Segmentações:** 14 filtros combináveis (último pedido entre datas, inativos há X dias, nº de pedidos, comprou o produto X, comprou/nunca comprou a categoria, ticket, total gasto, top % em gasto, bairro, só entrega/retirada, cupom) + 7 públicos prontos + públicos salvos. Mensagem com `{nome}`, exportar CSV e botão "Enviar" por cliente (abre o WhatsApp).
- **Configurações:** dados da loja, taxas por bairro, cupons, modelos das mensagens automáticas, senha. Botões de simulação: gerar 15 pedidos de exemplo, apagar pedidos, zerar tudo.

## Identidade

Fontes oficiais Bread King (Rubik + Nunito Sans) servidas localmente em `fontes/`; paleta do manual
(vermelho #B8172E, dourado #D69A2D, creme #FBF5EC, café #2A1612) em `estilos/tema.css`.
`estilos/referencia.css` é o CSS clonado do site original (não editar).

## Onde mudar

- Unidade, WhatsApp, taxas, cupons: `dados/unidade.js` (ou pelo painel, que grava por cima no navegador).
- Catálogo inicial: `dados/catalogo.js` (ou pelo painel).
- Fotos: `imagens/produtos/` (máx. 1200 px). O "Casadinho C-/12 Und" não tem foto no site original; aparece o logo.

## Limites da simulação (viram backend na Etapa 2)

Pagamento é fictício. Dados ficam só no navegador onde foram criados: o painel vê os pedidos feitos
no mesmo computador/navegador. Mensagens automáticas e campanhas abrem o WhatsApp Web em vez de
enviar sozinhas (precisa da API oficial da Meta ou de uma API não oficial, decisão pendente).
