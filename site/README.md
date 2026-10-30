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
| `admin/index-v2.html` | Painel com o **mesmo visual do site** (branco, Figtree, vermelho só como acento). Mesmas funções do painel v1. |
| `franqueadora/index.html` | **Painel da franqueadora.** Senha `franqueadora`. Performance geral da rede, CRM (dashboard e clientes com segmentação), cupons e modelos de mensagem da rede. Filtros com todas, uma ou várias unidades. |
| `admin/index.html` | **Painel da unidade.** Sem link no site. Senha padrão `breadking` (troque em Configurações). |

## Conta do cliente e pedido sem login

- Pra pagar no site é preciso **entrar ou criar conta** (nome, telefone, e-mail, **CPF e senha**). A conta guarda o carrinho, o acompanhamento e o histórico mesmo trocando de aba.
- **SITE10**: 10% OFF na primeira compra pelo site, aplicado sozinho pra quem tem conta (o cliente pode trocar por outro cupom).
- **Fazer pedido sem login**: botão no fim do carrinho. Abre um formulário rápido (nome, telefone, entrega ou retirada, bairro e endereço) e manda pro WhatsApp da loja a mensagem no modelo aprovado, com os itens, a taxa do bairro e o total. Pagamento e prazo são combinados na conversa.
- **CADASTRO5**: ao completar o cadastro (nascimento, gênero, endereço, bairro, como conheceu, preferências) o cliente ganha um voucher de 5%, uma vez.
- Simulação: contas e senhas ficam no `localStorage` do navegador, sem criptografia. Em produção isso vira backend com senha protegida e LGPD.

## Painel (`admin/`)

- **Pedidos:** busca e filtros no topo; pedidos novos (pagos, aguardando aceite) em destaque com bipe e contador na aba; o franqueado abre o pedido e clica em **Aceitar** ou **Recusar** (com motivo). Quadro: Em preparo | Pronto, Em rota e Finalizados | pedido aberto. Fluxo: Novo → Em preparo → Pronto → Em rota (só entrega) → Finalizados; os cards podem ser arrastados entre as colunas. Abaixo, a tabela de todos os pedidos e exportar CSV. Mensagens automáticas ao aceitar, recusar, sair pra entrega e pronto pra retirada (simulação: ficam registradas no pedido). Na página "Meus pedidos", um pedido de entrega em "Pronto" aparece pro cliente como "Em preparo".
- **Desempenho:** faturamento, ticket médio e nº de pedidos por mês (últimos 3/6/12 meses ou período livre), com tooltip e versão em tabela.
- **Curva ABC:** produtos ou clientes por receita, classes A/B/C, filtro de período, CSV.
- **Cupons:** aba própria. Código, desconto, descrição, vale de/até, limite total de usos, uma vez por cliente, pedido mínimo, ativo. O site valida tudo na hora e mostra o motivo da recusa.
- **Modelos:** modelos de mensagem com nome, categoria e origem (unidade ou franqueadora). Pensado pra que, quando houver painel da franqueadora, o marketing interno publique modelos pra todas as unidades. "Usar em campanha" já abre a campanha com o texto.
- **Campanhas:** começa de um modelo ou do zero; público (prontos, salvos, "Todos" ou o montado em Segmentações), cupom opcional, mensagem com {nome} e {cupom}, prévia, rascunho ou disparo. Histórico com quem recebeu; a mensagem aparece no perfil do cliente. Na simulação o disparo é registrado; em produção sai pela API.
- **Avaliações:** o cliente só vê o convite (1 a 5 estrelas + comentário) depois que o pedido é marcado como Concluído. Nota média, taxa de resposta e distribuição no painel; a média aparece no hero do site.
- **Clientes:** busca por nome, e-mail ou telefone; cadastro automático pelos pedidos: nº de pedidos, total, ticket, último pedido, bairro, preferência, produtos mais comprados. Exportar CSV.
- **Produtos:** adicionar, editar (nome, categoria, peso, descrição, preço, foto, destaque). Categoria **Combos**: o cadastro pede a composição (produtos e quantidades) e mostra a soma dos itens avulsos como referência; no site o card mostra "Leva: …". Três combos de exemplo já vêm no catálogo, ocultar/ativar, excluir, restaurar o catálogo clonado. As mudanças aparecem no site na hora.
- **Segmentações:** 20 filtros combináveis (inclui gênero, faixa etária, situação do cadastro) (inclui aniversário no mês e aniversário em até N dias, a partir do campo opcional de nascimento no pedido) (último pedido entre datas, inativos há X dias, nº de pedidos, comprou o produto X, comprou/nunca comprou a categoria, ticket, total gasto, top % em gasto, bairro, só entrega/retirada, cupom) + 7 públicos prontos + públicos salvos. Mensagem com `{nome}`, exportar CSV e botão "Enviar" por cliente (abre o WhatsApp).
- **Configurações:** dados da unidade só pra consulta (definidos pelo Franchising, aba Unidades); taxa de entrega por bairro em linhas (bairro + valor, adicionar/remover); texto da entrega; senha do painel. Botões de simulação. As mensagens automáticas de status saíram daqui e são definidas pelo Franchising.
- **Produtos:** a unidade não cria produtos (o catálogo vem do Franchising); só oculta/ativa.
- **Segmentações:** além dos públicos prontos, lista os públicos salvos com Editar (nome e filtros) e Excluir.

## Painel da franqueadora (`franqueadora/`)

- **Unidades:** Palhoça, Maringá e Joinville. As três têm 12 meses de pedidos **fictícios** (gerados em `franqueadora/rede-dados.js`, sempre iguais e relativos à data de hoje); a Palhoça soma também os pedidos reais feitos no site neste navegador.
- **Performance geral:** faturamento, pedidos, ticket, clientes ativos (novos x recorrentes), taxa de recompra, avaliação e desconto em cupons, com variação vs. período anterior; faturamento no tempo, ranking de unidades, vendas por categoria, top 10 produtos, entrega x retirada, Pix x cartão, horários, dias da semana, cupons e cancelamentos.
- **Curva ABC:** produtos, categorias ou clientes por receita (classes A/B/C), com filtro de unidades e período, e exportar CSV.
- **Catálogo › Produtos:** o catálogo da rede (chave `bk_rede_produtos`, nasce do `catalogo.js` na 1ª abertura). O Franchising cria, edita (nome, foto, descrição, categoria, preço, destaque, combo), desativa, exclui e escolhe as unidades de cada produto, e vê vendas e faturamento por produto e unidade. No painel da unidade esses produtos aparecem com a etiqueta "Franchising" e travados: a unidade só oculta/ativa no site dela. Produtos criados pela própria unidade continuam editáveis por ela.
- **CRM › Dashboard:** ranking por categoria, gênero, faixa etária, período de venda (horário, dia da semana, semana do mês) e formas de pagamento.
- **Performance geral (fim da página):** gráficos de ticket médio e de número de pedidos ao longo do tempo, por unidade ou da rede.
- **CRM › Clientes:** lista por período e unidade, busca, ficha do cliente, exportar CSV.
- **CRM › Segmentação:** mesma tela da unidade, com a escolha de unidades (todas, uma ou várias) dentro dos filtros: públicos salvos (Editar/Excluir, chave `bk_rede_publicos`), públicos prontos, filtros, contagem, lista e CSV, com filtro de unidades e período.
- **Cupons:** todos os cupons, da rede e os criados pelas unidades; o Franchising edita, desativa e exclui qualquer um (Palhoça = cupons reais do navegador; Maringá/Joinville = exemplos em `bk_rede_cupons_unidades`). Filtro por origem e unidade.
- **Marketing › Campanhas:** performance dos disparos de WhatsApp das unidades. Conversão = cliente acionado que comprou na unidade em até 7 dias. Compara com quem não recebeu mensagem (clientes que já compraram na unidade e não tiveram disparo nos 7 dias antes/depois). Funil, dia da compra, ranking de unidades, por modelo, por público e lista de campanhas com quem comprou. Regra da rede: 1 disparo por cliente a cada 7 dias (o painel da unidade tira da campanha quem recebeu nos últimos 7 dias). Maringá/Joinville e a Palhoça têm campanhas de exemplo; a Palhoça soma as reais.
- **CRM › Avaliações:** só análise. Nota média, taxa de avaliação, % notas 4–5 e 1–2, alertas, ranking, distribuição das notas, evolução, entrega × retirada, horário, dia da semana, produtos com pior nota e comentários com busca e palavras frequentes.
- **Rede › Unidades:** cadastro de cada unidade (nome, razão social, CNPJ, WhatsApp, e-mail, Instagram, site, endereço, horários por dia, sobre). Chave `bk_rede_unidades`; o site e o painel da unidade passam a usar esses dados e a unidade não edita.
- **Rede › Mensagens automáticas:** textos e liga/desliga das mensagens de status (aceito, pronto pra retirada, saiu pra entrega, concluído, recusado) para todas as unidades. Chave `bk_rede_msgs_auto`; sem ela, vale o que a unidade tinha.
- **Cupons e Modelos:** criados aqui valem pra todas as unidades ou só as escolhidas (chaves `bk_rede_cupons` e `bk_rede_modelos`). No painel da unidade aparecem com a etiqueta "Franqueadora", somente leitura; os cupons valem no site na hora.

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
