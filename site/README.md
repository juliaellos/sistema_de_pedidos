# Bread King Palhoça — site de delivery + painel (modo simulação)

**Visual (v1.6):** minimalista no estilo iFood. Fonte Figtree (equivalente livre da SulSans do iFood), títulos de categoria em peso médio sem subtítulo, cards horizontais em duas colunas com foto à direita, descrição em cinza e preço em peso normal, vermelho da marca só como acento.

HTML + CSS + JavaScript puro. Abre no computador sem servidor. Tudo (produtos editados, pedidos,
clientes, configurações) fica no `localStorage` do navegador: é a simulação do backend das etapas 2 e 3.

## Páginas

| Arquivo | O que é |
|---|---|
| `index-v2.html` | Mesmo cardápio com **cards verticais em grade**: 4 por linha no computador, 2 no celular. Alternativa pra Júlia escolher. |
| `index.html` | **Página principal: o cardápio.** Hero estilo app de delivery (banner, logo, aberto/fechado, Ver mais com Sobre e Horário, pedido mínimo), busca, "Recomendados pra você" (só pra quem já pediu), "Mais pedidos" e as 7 categorias com "Ver todos". |
| `categoria.html?c=Padaria` | Grade completa de uma categoria (ou `c=mais-pedidos`, `c=recomendados`). |
| `pedido.html` | Carrinho, Entrega (bairro + taxa) ou Retirada, dados, cupom, pagamento simulado (Pix ou cartão). Ao aprovar, cria o pedido e vai pro acompanhamento. |
| `acompanhamento.html` | **Meus pedidos** (botão no topo): em andamento e anteriores. Com `?n=BK-1001`, a linha do tempo do pedido e as mensagens automáticas da loja. Atualiza sozinha. |
| `conta.html` | **Minha conta.** Dados do cliente, progresso do cadastro e voucher CADASTRO5 (5% OFF) liberado ao completar 100%. |
| `sobre.html` | A antiga home clonada, em standby. **Não é linkada em lugar nenhum**; abre só pelo arquivo. |
| `admin/index.html` | **Painel da unidade.** Sem link no site. Senha padrão `breadking` (troque em Configurações). |

## Conta do cliente e pedido sem login

- Pra pagar no site é preciso **entrar ou criar conta** (nome, telefone, e-mail, **CPF e senha**). A conta guarda o carrinho, o acompanhamento e o histórico mesmo trocando de aba.
- **SITE10**: 10% OFF na primeira compra pelo site, aplicado sozinho pra quem tem conta (o cliente pode trocar por outro cupom).
- **Fazer pedido sem login**: botão no fim do carrinho. Abre um formulário rápido (nome, telefone, entrega ou retirada, bairro e endereço) e manda pro WhatsApp da loja a mensagem no modelo aprovado, com os itens, a taxa do bairro e o total. Pagamento e prazo são combinados na conversa.
- **CADASTRO5**: ao completar o cadastro (nascimento, gênero, endereço, bairro, como conheceu, preferências) o cliente ganha um voucher de 5%, uma vez.
- Simulação: contas e senhas ficam no `localStorage` do navegador, sem criptografia. Em produção isso vira backend com senha protegida e LGPD.

## Painel (`admin/`)

- **Pedidos:** KPIs do dia, filtros, detalhe, avanço de status (Pago → Em preparo → Saiu pra entrega / Pronto pra retirada → Concluído), cancelar, exportar CSV. Ao marcar "Saiu pra entrega" ou "Pronto pra retirada" a mensagem automática é enviada sozinha: na simulação ela fica registrada no pedido e aparece pro cliente na página do pedido; em produção sai pela API de WhatsApp.
- **Desempenho:** faturamento, ticket médio e nº de pedidos por mês (últimos 3/6/12 meses ou período livre), com tooltip e versão em tabela.
- **Curva ABC:** produtos ou clientes por receita, classes A/B/C, filtro de período, CSV.
- **Cupons:** aba própria. Código, desconto, descrição, vale de/até, limite total de usos, uma vez por cliente, pedido mínimo, ativo. O site valida tudo na hora e mostra o motivo da recusa.
- **Modelos:** modelos de mensagem com nome, categoria e origem (unidade ou franqueadora). Pensado pra que, quando houver painel da franqueadora, o marketing interno publique modelos pra todas as unidades. "Usar em campanha" já abre a campanha com o texto.
- **Campanhas:** começa de um modelo ou do zero; público (prontos, salvos, "Todos" ou o montado em Segmentações), cupom opcional, mensagem com {nome} e {cupom}, prévia, rascunho ou disparo. Histórico com quem recebeu; a mensagem aparece no perfil do cliente. Na simulação o disparo é registrado; em produção sai pela API.
- **Avaliações:** o cliente só vê o convite (1 a 5 estrelas + comentário) depois que o pedido é marcado como Concluído. Nota média, taxa de resposta e distribuição no painel; a média aparece no hero do site.
- **Clientes:** busca por nome, e-mail ou telefone; cadastro automático pelos pedidos: nº de pedidos, total, ticket, último pedido, bairro, preferência, produtos mais comprados. Exportar CSV.
- **Produtos:** adicionar, editar (nome, categoria, peso, descrição, preço, foto, destaque). Categoria **Combos**: o cadastro pede a composição (produtos e quantidades) e mostra a soma dos itens avulsos como referência; no site o card mostra "Leva: …". Três combos de exemplo já vêm no catálogo, ocultar/ativar, excluir, restaurar o catálogo clonado. As mudanças aparecem no site na hora.
- **Segmentações:** 20 filtros combináveis (inclui gênero, faixa etária, situação do cadastro) (inclui aniversário no mês e aniversário em até N dias, a partir do campo opcional de nascimento no pedido) (último pedido entre datas, inativos há X dias, nº de pedidos, comprou o produto X, comprou/nunca comprou a categoria, ticket, total gasto, top % em gasto, bairro, só entrega/retirada, cupom) + 7 públicos prontos + públicos salvos. Mensagem com `{nome}`, exportar CSV e botão "Enviar" por cliente (abre o WhatsApp).
- **Configurações:** dados da loja, taxas por bairro, cupons, modelos das mensagens automáticas, senha. Botões de simulação: gerar 15 pedidos de exemplo, apagar pedidos, zerar tudo.

## Identidade

Rubik (títulos) + Inter (texto) servidas localmente em `fontes/`; vermelho #B8172E e dourado #D69A2D do manual sobre o fundo cinza-claro original. Logo sem fundo em `imagens/marca/logo-bread-king.png`. Banner do hero em `imagens/marca/banner-loja.jpg` (colagem provisória de fotos de produto; trocar pela foto da loja).
`estilos/referencia.css` é o CSS clonado do site original (não editar).

## Onde mudar

- Unidade, WhatsApp, horários por dia, CNPJ, pedido mínimo, taxas, cupons: `dados/unidade.js` (ou pelo painel, que grava por cima no navegador).
- Catálogo inicial: `dados/catalogo.js` (ou pelo painel).
- Fotos: `imagens/produtos/` (máx. 1200 px). O "Casadinho C-/12 Und" não tem foto no site original; aparece o logo.

## Limites da simulação (viram backend na Etapa 2)

Pagamento é fictício. Dados ficam só no navegador onde foram criados: o painel vê os pedidos feitos
no mesmo computador/navegador. Mensagens automáticas e campanhas abrem o WhatsApp Web em vez de
enviar sozinhas (precisa da API oficial da Meta ou de uma API não oficial, decisão pendente).
