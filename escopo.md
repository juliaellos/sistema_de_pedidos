# Escopo — Sistema de delivery web Bread King (franqueados)

**Versão:** 1.2 (aprovada) · **Data:** 13/10/2026 · **Dona do projeto:** Júlia y Castro (Y OS)
**Referência visual e funcional:** breadkingsaopaulo.com.br (levantamento em `referencia/levantamento-site-atual.md`)
**Primeira unidade:** Palhoça (SC) · **WhatsApp de teste:** +55 48 98847-5389

Mudanças da v1.0 → v1.1: catálogo e imagens clonados direto do site (sem depender de export);
gateway vira simulação; site individual por franqueado; páginas de campanha fora; admin do
Lovable fora; mensagem automática de "saiu pra entrega" e segmentações do CRM definidas;
Júlia é dona integral do projeto.

---

## 1. Objetivo

Criar o sistema de delivery web da Bread King pra franqueados, partindo de uma cópia fiel
(1:1) do site de São Paulo e evoluindo em três etapas:

1. **Etapa 1 — Clone HTML interativo** da unidade Palhoça, validado no computador, com
   quantidade no cardápio e pagamento simulado.
2. **Etapa 2 — Publicação** do site da Palhoça e modelo pra replicar em outras unidades.
3. **Etapa 3 — CRM básico** por unidade: pedidos, clientes, mensagem automática e
   segmentação pra campanhas no WhatsApp.

---

## 2. O que o site atual é (resumo do levantamento)

- App React feito no Lovable com banco Supabase. Catálogo, combos, cupons, lojas e textos
  ficam no banco. Existe um painel `/admin`, que **não entra neste projeto**.
- Fluxo de pedido já tem carrinho com +/−, seletor de unidade, Entrega/Retirada, cupom,
  nome, telefone, endereço e envio formatado pro WhatsApp da unidade.
- 126 produtos publicados nas 7 categorias (a primeira leitura, sem navegador, só via 36).
- Não existe pagamento no site. Há páginas de campanha (Copa, Coquetel, pesquisa), que
  ficam fora do clone.

---

## 3. Etapa 1 — Clone completo (unidade Palhoça)

### 3.1 Entregável

Projeto web que abre no navegador (arquivo local ou link de prévia) e reproduz o site atual
por inteiro, navegável, com carrinho, pagamento simulado e envio pro WhatsApp de teste.
Código em repositório Git da Júlia.

### 3.2 Origem do catálogo e das imagens

Tudo é extraído do próprio site público, sem pedir nada à Bread King:

- **Produtos e categorias:** capturados da listagem pública (nome, categoria, peso ou
  quantidade, descrição, preço, selo Destaque, foto). Salvos num arquivo `catalogo.json`
  que o clone lê.
- **Imagens:** logo, hero, mascote, pão francês, fotos das lojas e todas as fotos de
  produto são baixadas na maior resolução que o site serve e guardadas em `site/imagens/`.
- **Textos:** hero, "Por que Bread King?", instruções do cardápio, avisos do pedido e rodapé,
  copiados literalmente.
- **Resultado da captura (13/10):** com o navegador automatizado o site entregou o
  catálogo completo publicado: **126 produtos** nas 7 categorias (Confeitaria 36, Padaria 32,
  Pizzas 4, Salgados 37, Sem Glúten e Sem Lactose 9, Sopas 5, Tortas Especiais 3), todos
  com foto, peso, descrição e preço. Tudo está no clone.

### 3.3 Páginas clonadas

| Página | Conteúdo | Clone |
|---|---|---|
| Home `/` | Hero (foto, logo, título, subtítulo, botões Ver Cardápio / WhatsApp / Nossas Lojas), Por que Bread King?, Cardápio com filtro por categoria, Nossa Loja (Palhoça), Rodapé | Idêntico |
| Cardápio `/cardapio` | Listagem em página própria, Voltar, 7 categorias, contador, cards (foto, nome, peso, descrição, preço, Destaque, Adicionar) | Idêntico + seletor de quantidade |
| Pedido `/pedido` | Carrinho (+/−, remover, subtotal), combos, Continuar comprando, Limpar, Entrega/Retirada, avisos de taxa e horário, cupom, dados do cliente, total, Enviar pelo WhatsApp | Idêntico + e-mail + pagamento simulado |
| 404 | Mensagem e link pra home | Idêntico |
| Campanhas, pesquisa, cardápio antigo, admin | — | **Fora** |

Como o site é de uma unidade só, o **seletor de unidade some** e a seção "Nossas Lojas"
vira "Nossa Loja", com foto, endereço, horário e WhatsApp da Palhoça. A estrutura fica
parametrizada num arquivo `unidade.json`, então criar o site de outra unidade é trocar esse
arquivo e, se quiser, o catálogo.

### 3.4 Identidade visual

Montserrat e Inter; vermelho #bc152b, dourado #da9f2b, creme #faf7ee, texto #1f1f1f, verde
WhatsApp #25D366, raio 12 px. Responsivo igual ao original.

### 3.5 Comportamento clonado

Filtro de categoria, contador, Destaque, carrinho persistente no navegador, combos, cupom
percentual (lista num arquivo), Entrega exige endereço, avisos de taxa e horário mantidos,
envio pro WhatsApp com pedido formatado (itens, quantidades, subtotais, cupom, modalidade,
endereço, nome, telefone, e-mail, total, situação do pagamento). Na Etapa 1 o destino é
sempre +55 48 98847-5389.

### 3.6 Formulário do cliente

Nome, E-mail (novo), Telefone, Endereço (obrigatório só na entrega). Validação simples.

---

## 4. Melhorias obrigatórias

### 4.1 Seletor de quantidade no cardápio

Controle **− 1 +** com campo numérico no card, antes de adicionar. Depois de adicionar, o
card mostra a quantidade no carrinho e permite ajustar ali. Indicador flutuante do carrinho
(itens e total) em todas as páginas. Mínimo 1, máximo 99 por padrão.

### 4.2 Pagamento simulado (provisório)

- Na página de pedido o cliente escolhe **Pix** ou **Cartão**. O pedido só vai pro WhatsApp depois de pago.
- **Pix:** tela com QR Code e código copia-e-cola fictícios e botão "Já paguei" que leva ao
  estado **pago** após alguns segundos (imita a confirmação automática).
- **Cartão:** formulário com número, nome, validade e CVV; qualquer cartão de teste é
  aprovado, um número específico é recusado pra demonstrar o erro. Nada é cobrado nem
  armazenado.
- O pedido vai pro WhatsApp com a marcação **PAGO (simulado)**.
- A tela e o fluxo são desenhados pra encaixar um gateway real depois (Mercado Pago,
  Pagar.me ou Asaas) sem mudar o que o cliente vê. Essa troca fica orçada à parte.

---

## 5. Etapa 2 — Publicação e replicação (direção)

- Hospedagem com domínio da unidade (ex.: `palhoca.breadking...` ou domínio próprio).
- Catálogo, cupons e textos saem do arquivo e vão pra um banco (Supabase na conta da Júlia),
  editável pelo CRM.
- Nova unidade = copiar o projeto, trocar `unidade.json`, catálogo e WhatsApp.

---

## 6. Etapa 3 — CRM básico por unidade (direção)

Painel web com login, um por unidade.

### 6.1 Pedidos

- Lista com status: **recebido → pago → em preparo → saiu pra entrega → concluído**, mais
  cancelado. Filtro por data e status, busca por cliente, detalhe do pedido, reenviar pro
  WhatsApp, imprimir.
- **Mensagem automática:** ao mover um pedido pra "saiu pra entrega", o sistema envia no
  WhatsApp do cliente uma mensagem pronta (ex.: "Oi, {nome}! Seu pedido #{número} saiu pra
  entrega e chega em breve. Bread King Palhoça"). Texto editável nas configurações. A mesma
  mecânica pode disparar em "pago" e "concluído" (opcional, ligado por configuração).
- **Pré-requisito técnico:** mensagem automática exige uma API de WhatsApp conectada à
  unidade. Ver seção 7.

### 6.2 Clientes

Cadastro automático a partir dos pedidos: nome, telefone, e-mail, endereços, data do
primeiro e do último pedido, quantidade de pedidos, total gasto, ticket médio, produtos
comprados com quantidade, cupons usados, modalidade preferida (entrega/retirada), bairro.

### 6.3 Segmentação pra campanhas no WhatsApp

Filtros combináveis (E/OU), salvos como "público" reutilizável, com contagem ao vivo e
exportação em CSV ou envio direto pela API:

**Por recência e frequência**
1. Último pedido entre datas (ex.: "comprou nos últimos 30 dias").
2. Inativos: sem pedido há X dias (reativação com cupom).
3. Primeira compra há menos de X dias (boas-vindas, segunda compra).
4. Clientes com N ou mais pedidos (fiéis) / com exatamente 1 pedido (converter em recorrente).

**Por produto e categoria**
5. Quem mais comprou o produto X (ranking por quantidade ou por valor).
6. Quem comprou a categoria X (ex.: bolos) e nunca comprou a categoria Y (ex.: pizzas).
7. Quem comprou um produto que ficou sem estoque ou saiu do cardápio (avisar que voltou).
8. Quem comprou produto sazonal no ano passado (Páscoa, festas, Copa).

**Por valor**
9. Ticket médio acima de R$ X (ofertas premium, combos grandes).
10. Total gasto no período (top 20% de clientes, programa VIP).
11. Quem usa cupom sempre vs. quem nunca usou (quem é sensível a desconto).

**Por entrega e lugar**
12. Bairro ou raio de endereço (promoção de frete, dia de rota).
13. Só retirada vs. só entrega (incentivar a outra modalidade).

**Por comportamento**
14. Dia da semana e horário em que costuma pedir (disparar antes do horário habitual).
15. Carrinho abandonado: preencheu dados e não enviou (precisa do site gravar o
    carrinho ao digitar o telefone).
16. Aniversário (campo opcional no cadastro) e data do primeiro pedido ("1 ano com a gente").

**Campanhas prontas sugeridas:** reativação 45 dias com cupom; "voltou ao cardápio";
lançamento de produto pra quem compra a categoria; frete grátis por bairro no dia da rota;
VIP mensal pros 20% que mais gastam; lembrete de sexta pra quem pede no fim de semana.

### 6.4 Catálogo e configurações

Ativar/desativar produto, preço, Destaque, combos, cupons; WhatsApp, horário, taxa e texto
de entrega, textos das mensagens automáticas.

---

## 7. Envio automático de WhatsApp: o que precisa ser decidido

Mensagem automática e disparo em massa não funcionam com link `wa.me`. Precisam de API:

| Opção | Prós | Contras |
|---|---|---|
| **WhatsApp Business API oficial (Meta Cloud API)** | Sem risco de bloqueio, escala, templates aprovados | Precisa de empresa verificada na Meta, número dedicado, templates aprovados pra iniciar conversa, custo por conversa (centavos) |
| **API não oficial (Evolution API, Z-API etc.)** | Barato, rápido de ligar, usa o número comum da loja | Risco real de banimento do número, principalmente em disparo em massa |

Recomendação: oficial pra disparo em massa (campanhas) e, se quiser começar rápido, não
oficial só pras mensagens 1 a 1 de status, sabendo do risco. Decidir até a Etapa 3.

---

## 8. Decisões já tomadas (13/10/2026)

- Catálogo e imagens: clonados do site público, sem pedir nada à Bread King.
- WhatsApp de teste: +55 48 98847-5389.
- Gateway: simulação provisória; gateway real orçado à parte.
- Páginas de campanha: fora.
- Modelo: um site por franqueado, começando por Palhoça.
- Admin do Lovable: fora do projeto.
- Propriedade: Júlia y Castro é dona integral do código, do design e do sistema. Ninguém
  mais participa do projeto.

## 9. Decisões complementares (13/10/2026, aprovadas)

- **Pedido só sai pago.** Não existe a opção "Combinar no WhatsApp". O botão de enviar
  só ativa depois do pagamento simulado aprovado.
- **Sem API de WhatsApp por enquanto.** Envio pelo link aberto `wa.me/5548988475389`
  com a mensagem no modelo abaixo.
- **Endereço da unidade:** Av. Atílio Pedro Pagani, 1275 - Pagani, Palhoça - SC.
- **Taxa de entrega por bairro:** simulador com valor fixo por bairro de Palhoça
  (tabela editável em `unidade.json`). O cliente escolhe o bairro, a taxa entra no total
  e na mensagem. Valores iniciais são provisórios até a franqueada confirmar.
- **Modelo da mensagem do WhatsApp:**

```
Olá! Quero fazer um pedido na Bread King Palhoça.

Unidade: Palhoça
Cliente: [nome do cliente]
Telefone: [numero do cliente]
Endereço para entrega: [endereço do cliente]
Modalidade: [Entrega ou retirada na loja]

Pedido:
•  Pão Francês Pré-assado Ultracongelado  – Qtd 2 – R$ 19,98

Total estimado: R$ 19,98

Por favor, confirme a taxa e o prazo de entrega.
```

Acréscimos sobre o modelo (mantendo o formato): linha "Bairro: [bairro] – Taxa de
entrega: R$ X" quando for entrega, linha de cupom quando houver, e "Pagamento: PAGO
(simulado) – [Pix/Cartão] – #[código]" antes do total.

## 10. Fora do escopo

Cálculo de frete por distância, integração com entregadores, app nativo, fidelidade,
avaliações, chat, gateway real, migração do admin do Lovable, SEO além do básico.

## 11. Critérios de aceite da Etapa 1

- Home, cardápio, pedido e 404 lado a lado com o original, sem diferença perceptível
  de layout, texto, cor e imagem (exceto o que é da Palhoça: loja e WhatsApp).
- Catálogo com os 126 produtos publicados e as 7 categorias, com as fotos locais.
- Quantidade no card, carrinho, cupom, Entrega/Retirada, formulário com e-mail e envio
  pro +55 48 98847-5389 com a mensagem formatada e correta.
- Pix e cartão simulados chegam ao estado "pago"; cartão de recusa mostra erro; sem pagamento o botão de WhatsApp fica bloqueado.
- Simulador de taxa por bairro de Palhoça altera o total e aparece na mensagem.
- Chrome, Safari e Edge atuais e tela de celular.
- Código versionado com README de instalação e de troca de unidade/catálogo.

## 12. Marcos

| Marco | Entrega | Prazo estimado |
|---|---|---|
| M0 | Aprovação deste escopo | — |
| M1 | Clone navegável (home, cardápio, pedido, 404) com catálogo e imagens clonados e WhatsApp de teste | 2 semanas |
| M2 | Seletor de quantidade, indicador de carrinho, e-mail no formulário | +1 semana |
| M3 | Pagamento simulado (Pix, cartão, a combinar) | +1 semana |
| Etapa 2 e 3 | Orçadas depois da validação da Etapa 1 | — |

## 13. Premissas

- Júlia y Castro (Y OS) é dona do código, do design e do sistema; o franqueado usa.
  Dados pessoais dos clientes finais ficam sob responsabilidade da unidade (LGPD), com a
  Júlia como operadora.
- O site atual de São Paulo não é tocado. Nada é pedido à franqueadora nem ao Lovable.
- Hospedagem, domínio e, no futuro, taxas de gateway e de API de WhatsApp são da unidade.
