// Página do pedido: itens, Entrega/Retirada, taxa por bairro, cupom, pagamento simulado e envio pro WhatsApp (só depois de pago).
(function () {
  const U = window.UNIDADE, B = window.BTN;
  const estado = { modalidade: "entrega", nome: "", email: "", telefone: "", endereco: "", bairro: "", cupom: null, pagamento: null, metodo: "pix", pixEmAndamento: false };
  const CHAVE_DADOS = "bk_cliente";
  try { Object.assign(estado, JSON.parse(localStorage.getItem(CHAVE_DADOS) || "{}")); } catch (e) {}
  estado.pagamento = null; // pagamento nunca persiste entre visitas
  const guardarDados = () => localStorage.setItem(CHAVE_DADOS, JSON.stringify({ nome: estado.nome, email: estado.email, telefone: estado.telefone, endereco: estado.endereco, bairro: estado.bairro, modalidade: estado.modalidade }));

  const taxaBairro = () => { const t = U.taxasEntrega.find((x) => x.bairro === estado.bairro); return t ? t.taxa : 0; };
  function totais() {
    const subtotal = Carrinho.subtotal();
    const desconto = estado.cupom ? Math.round(subtotal * estado.cupom.desconto) / 100 : 0;
    const taxa = estado.modalidade === "entrega" && estado.bairro ? taxaBairro() : 0;
    return { subtotal, desconto, taxa, total: Math.max(0, subtotal - desconto + taxa) };
  }
  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const telOk = (t) => t.replace(/\D/g, "").length >= 10;
  function dadosOk() {
    if (!estado.nome.trim() || !emailOk(estado.email) || !telOk(estado.telefone)) return false;
    if (estado.modalidade === "entrega" && (!estado.endereco.trim() || !estado.bairro)) return false;
    return true;
  }

  // ---------- mensagem do WhatsApp (modelo aprovado em 13/10/2026) ----------
  function mensagem() {
    const t = totais(); const L = [];
    L.push("Olá! Quero fazer um pedido na " + U.nomeCompleto + ".", "");
    L.push("Unidade: " + U.nome);
    L.push("Cliente: " + estado.nome.trim());
    L.push("Telefone: " + estado.telefone.trim());
    L.push("E-mail: " + estado.email.trim());
    if (estado.modalidade === "entrega") {
      L.push("Endereço para entrega: " + estado.endereco.trim());
      L.push("Bairro: " + estado.bairro + " – Taxa de entrega: " + moeda(t.taxa).replace(" ", " "));
      L.push("Modalidade: Entrega");
    } else L.push("Modalidade: Retirada na loja");
    L.push("", "Pedido:");
    Carrinho.itens().forEach((i) => L.push("•  " + i.produto.nome.trim() + "  – Qtd " + i.quantidade + " – " + moeda(i.produto.preco * i.quantidade).replace(" ", " ")));
    L.push("");
    if (estado.cupom) L.push("Cupom: " + estado.cupom.codigo + " (-" + estado.cupom.desconto + "%) – " + moeda(t.desconto).replace(" ", " "));
    if (estado.pagamento) L.push("Pagamento: PAGO (simulado) – " + estado.pagamento.metodo + " – #" + estado.pagamento.codigo);
    L.push("Total estimado: " + moeda(t.total).replace(" ", " "), "");
    L.push(estado.modalidade === "entrega" ? "Por favor, confirme a taxa e o prazo de entrega." : "Por favor, confirme o horário para retirada.");
    return L.join("\n");
  }

  // ---------- itens ----------
  function renderItens() {
    const itens = Carrinho.itens(); const el = document.getElementById("itens");
    document.getElementById("itens-titulo").textContent = "Itens (" + Carrinho.totalItens() + ")";
    if (!itens.length) {
      el.innerHTML = '<div class="rounded-md border border-dashed border-border bg-card p-10 text-center"><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">' + icone("shopping-bag", "h-7 w-7") + '</div><p class="font-bold">Seu pedido está vazio</p><p class="mt-1 text-sm text-muted-foreground">Escolha seus favoritos no cardápio.</p><a class="' + B.primary + ' mt-5 h-10 px-4 py-2" href="cardapio.html">Ver cardápio</a></div>';
      return;
    }
    el.innerHTML = itens.map((i) => '<article class="flex gap-3 rounded-md border border-border bg-card p-3 sm:gap-4 sm:p-4" data-item="' + i.produto.id + '">' +
      '<div class="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-24"><img alt="' + esc(i.produto.nome) + '" class="h-full w-full object-cover" src="' + i.produto.imagem + '" onerror="imgFallback(this)"/></div>' +
      '<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><div><h3 class="font-bold leading-tight">' + esc(i.produto.nome) + '</h3><p class="mt-1 text-xs text-muted-foreground">' + esc(i.produto.peso) + "</p></div>" +
      '<button aria-label="Remover ' + esc(i.produto.nome) + '" data-remover class="' + B.ghost + ' h-8 w-8 shrink-0 text-destructive">' + icone("x") + "</button></div>" +
      '<div class="mt-3 flex items-center justify-between gap-3"><div class="flex items-center gap-2"><button aria-label="Diminuir quantidade" data-q="-1" class="' + B.outline + ' h-8 w-8">' + icone("minus") + '</button><span class="w-6 text-center font-bold">' + i.quantidade + '</span><button aria-label="Aumentar quantidade" data-q="1" class="' + B.outline + ' h-8 w-8">' + icone("plus") + "</button></div>" +
      "<strong>" + moeda(i.produto.preco * i.quantidade) + "</strong></div></div></article>").join("");
  }

  // ---------- resumo / formulário ----------
  function renderResumo() {
    const t = totais(); const el = document.getElementById("resumo"); const entrega = estado.modalidade === "entrega";
    const inp = (nome, ph, ic, tipo, extra) => '<div class="relative">' + icone(ic, "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") + '<input data-campo="' + nome + '" type="' + (tipo || "text") + '" ' + (extra || "") + ' class="flex w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm h-12 bg-background pl-11" placeholder="' + ph + '" value="' + esc(estado[nome]) + '"/></div>';
    const pago = !!estado.pagamento;
    el.innerHTML = '<h2 class="text-xl font-extrabold">Finalizar pedido</h2>' +
      '<div class="mt-5 grid grid-cols-2 gap-2">' +
      '<button type="button" data-modalidade="retirada" class="' + (entrega ? B.outline : B.primary) + ' px-4 py-2 h-12">' + icone("store") + "Retirada</button>" +
      '<button type="button" data-modalidade="entrega" class="' + (entrega ? B.primary : B.outline) + ' px-4 py-2 h-12">' + icone("truck") + "Entrega</button></div>" +
      '<div class="mt-5 space-y-1.5"><label class="text-sm font-semibold">Unidade Bread King</label><div class="flex h-12 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">' + icone("map-pin", "h-4 w-4 text-primary") + esc(U.nome) + " · " + esc(U.endereco) + "</div></div>" +
      '<div class="mt-5 space-y-3"><p class="text-sm font-semibold">' + (entrega ? "Dados para entrega" : "Seus dados") + "</p>" +
      inp("nome", "Seu nome", "user", "text", 'autocomplete="name"') + inp("email", "Seu e-mail", "mail", "email", 'autocomplete="email"') + inp("telefone", "Seu telefone", "phone", "tel", 'autocomplete="tel" inputmode="tel"') +
      (entrega ? '<div class="relative">' + icone("map-pin", "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") + '<select data-campo="bairro" class="flex h-12 w-full appearance-none rounded-md border border-input bg-background pl-11 pr-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2' + (estado.bairro ? "" : " text-muted-foreground") + '"><option value="">Seu bairro (calcula a taxa)</option>' + U.taxasEntrega.map((x) => '<option value="' + esc(x.bairro) + '"' + (x.bairro === estado.bairro ? " selected" : "") + ">" + esc(x.bairro) + " — " + moeda(x.taxa) + "</option>").join("") + "</select>" + icone("chevron-down", "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50") + "</div>" +
        inp("endereco", "Endereço completo (rua, número, complemento)", "map-pin", "text", 'autocomplete="street-address"') +
        '<p class="text-xs text-muted-foreground">' + esc(U.textoEntrega) + "</p>"
        : '<p class="text-xs text-muted-foreground">' + esc(U.textoRetirada) + " " + esc(U.horario) + ".</p>") + "</div>" +
      '<div class="mt-5 space-y-2"><label class="text-sm font-semibold">Cupom de desconto</label>' +
      (estado.cupom ? '<div class="flex items-center justify-between rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm"><span class="flex items-center gap-2 font-semibold text-green-700">' + icone("tag") + esc(estado.cupom.codigo) + " · -" + estado.cupom.desconto + '%</span><button type="button" data-tirar-cupom class="text-xs text-muted-foreground underline">remover</button></div>'
        : '<div class="flex gap-2"><div class="relative flex-1">' + icone("tag", "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") + '<input data-cupom type="text" class="flex w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm h-12 bg-background pl-11 uppercase" placeholder="Digite o cupom"/></div><button type="button" data-aplicar-cupom class="' + B.outline + ' px-4 py-2 h-12">Aplicar</button></div><p data-cupom-erro class="hidden text-xs text-destructive"></p>') + "</div>" +
      '<div class="my-5 space-y-2 border-y border-border py-4">' +
      '<div class="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>' + moeda(t.subtotal) + "</span></div>" +
      (estado.cupom ? '<div class="flex justify-between text-sm text-green-700"><span>Desconto (' + esc(estado.cupom.codigo) + ")</span><span>- " + moeda(t.desconto) + "</span></div>" : "") +
      (entrega ? '<div class="flex justify-between text-sm text-muted-foreground"><span>Taxa de entrega' + (estado.bairro ? " · " + esc(estado.bairro) : "") + "</span><span>" + (estado.bairro ? moeda(t.taxa) : "escolha o bairro") + "</span></div>" : "") +
      '<div class="flex justify-between text-xl font-extrabold"><span>Total</span><span>' + moeda(t.total) + "</span></div></div>" +
      '<div id="pagamento"></div>' +
      '<p class="mb-3 mt-5 text-center text-xs text-muted-foreground" data-aviso></p>' +
      '<button type="button" data-enviar class="' + B.base + ' px-4 py-2 h-14 w-full bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"' + (pago ? "" : " disabled") + ">" + icone("message-circle", "h-5 w-5") + "Enviar pelo WhatsApp</button>" +
      '<p class="mt-3 text-center text-xs text-muted-foreground">Seu pedido continuará salvo após abrir o WhatsApp.</p>';
    renderPagamento();
    atualizarAviso();
  }

  function atualizarAviso() {
    const a = document.querySelector("[data-aviso]"); if (!a) return;
    const itens = Carrinho.totalItens() > 0;
    if (!itens) a.textContent = "Adicione itens ao pedido para continuar.";
    else if (!dadosOk()) a.textContent = estado.modalidade === "entrega" ? "Preencha os dados da entrega para liberar o pagamento." : "Preencha seus dados para liberar o pagamento.";
    else if (!estado.pagamento) a.textContent = "Conclua o pagamento para enviar o pedido.";
    else a.textContent = "Pagamento confirmado. Agora é só enviar o pedido.";
    const btn = document.querySelector("[data-enviar]"); if (btn) btn.disabled = !(itens && dadosOk() && estado.pagamento);
    const pg = document.getElementById("pagamento"); if (pg) pg.classList.toggle("opacity-50", !(itens && dadosOk()));
    pg && pg.querySelectorAll("button,input").forEach((b) => { if (!b.hasAttribute("data-livre")) b.disabled = !(itens && dadosOk()) || !!estado.pagamento; });
  }

  // ---------- pagamento simulado (melhoria 4.2) ----------
  function renderPagamento() {
    const el = document.getElementById("pagamento"); if (!el) return;
    const t = totais();
    if (!Carrinho.totalItens()) { el.innerHTML = ""; return; }
    if (estado.pagamento) {
      el.innerHTML = '<div class="rounded-md border border-green-300 bg-green-50 p-4 text-center"><span class="selo-pago">' + icone("check") + "PAGO · " + esc(estado.pagamento.metodo) + '</span><p class="mt-2 text-xs text-muted-foreground">Transação #' + estado.pagamento.codigo + " · " + moeda(estado.pagamento.valor) + ' <span class="selo-demo">simulação</span></p></div>';
      return;
    }
    const aba = (m, rot, ic) => '<button type="button" data-metodo="' + m + '" class="' + (estado.metodo === m ? B.primary : B.outline) + ' h-11">' + icone(ic) + rot + "</button>";
    let corpo = "";
    if (estado.metodo === "pix") {
      corpo = estado.pixEmAndamento
        ? '<div class="text-center py-4"><div class="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary girando"></div><p class="text-sm font-semibold">Aguardando confirmação do Pix…</p><p class="text-xs text-muted-foreground">A confirmação chega sozinha, não precisa atualizar a página.</p></div>'
        : '<div class="space-y-3 text-center"><canvas class="pix-qr" data-qr width="164" height="164"></canvas><p class="text-xs text-muted-foreground">Abra o app do seu banco e escaneie o QR Code, ou copie o código abaixo.</p>' +
          '<div class="pix-codigo" data-pix-codigo>' + codigoPix(t.total) + '</div><div class="flex gap-2"><button type="button" data-copiar class="' + B.outline + ' h-10 flex-1">Copiar código</button><button type="button" data-pix-pagar class="' + B.primary + ' h-10 flex-1">Já paguei</button></div></div>';
    } else {
      corpo = '<div class="space-y-2"><input data-c="numero" inputmode="numeric" placeholder="Número do cartão" class="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm" maxlength="19"/>' +
        '<input data-c="nome" placeholder="Nome impresso no cartão" class="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm uppercase"/>' +
        '<div class="grid grid-cols-2 gap-2"><input data-c="validade" placeholder="MM/AA" inputmode="numeric" maxlength="5" class="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"/><input data-c="cvv" placeholder="CVV" inputmode="numeric" maxlength="4" class="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"/></div>' +
        '<p data-cartao-erro class="hidden text-xs text-destructive"></p>' +
        '<button type="button" data-cartao-pagar class="' + B.primary + ' h-11 w-full">Pagar ' + moeda(t.total) + "</button>" +
        '<p class="text-[11px] text-muted-foreground text-center">Simulação: qualquer cartão é aprovado, exceto 4000 0000 0000 0002 (recusa).</p></div>';
    }
    el.innerHTML = '<div class="mb-2 flex items-center justify-between"><p class="text-sm font-semibold">Pagamento</p><span class="selo-demo">simulação provisória</span></div><div class="pag-abas mb-4">' + aba("pix", "Pix", "smartphone") + aba("cartao", "Cartão", "tag") + "</div>" + corpo;
    const cv = el.querySelector("[data-qr]"); if (cv) desenharQr(cv, codigoPix(t.total));
  }
  function codigoPix(valor) {
    const v = valor.toFixed(2);
    return "00020126580014BR.GOV.BCB.PIX0136" + "demo-" + U.nome.toLowerCase() + "-breadking-simulacao" + "52040000530398654" + String(v.length).padStart(2, "0") + v + "5802BR5913BREAD KING " + U.nome.toUpperCase().slice(0, 4) + "6008PALHOCA62070503***6304DEMO";
  }
  function desenharQr(cv, semente) {
    // QR Code DE DEMONSTRAÇÃO (padrão pseudoaleatório com os três cantos). Não é lido por app de banco.
    const ctx = cv.getContext("2d"), n = 29, c = cv.width / n; let h = 2166136261;
    for (let i = 0; i < semente.length; i++) { h ^= semente.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967295; };
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#111";
    const olho = (x, y) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const borda = i === 0 || j === 0 || i === 6 || j === 6, miolo = i >= 2 && i <= 4 && j >= 2 && j <= 4; if (borda || miolo) ctx.fillRect((x + i) * c, (y + j) * c, c, c); } };
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
      const emOlho = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!emOlho && rnd() < 0.45) ctx.fillRect(x * c, y * c, c, c);
    }
    olho(0, 0); olho(n - 7, 0); olho(0, n - 7);
  }
  function confirmarPagamento(metodo) {
    const t = totais();
    estado.pagamento = { metodo, codigo: "BK-" + Date.now().toString(36).toUpperCase().slice(-6), valor: t.total, quando: new Date().toISOString() };
    toast("Pagamento aprovado ✅", metodo + " de " + moeda(t.total) + " confirmado (simulação).");
    renderResumo();
  }

  // ---------- registro local do pedido (semente do CRM) ----------
  function registrarPedido() {
    const chave = "bk_pedidos_" + U.nome.toLowerCase();
    let lista = []; try { lista = JSON.parse(localStorage.getItem(chave) || "[]"); } catch (e) {}
    lista.push({ numero: estado.pagamento.codigo, quando: new Date().toISOString(), cliente: { nome: estado.nome, email: estado.email, telefone: estado.telefone }, modalidade: estado.modalidade, endereco: estado.endereco, bairro: estado.bairro, itens: Carrinho.itens().map((i) => ({ id: i.produto.id, nome: i.produto.nome, qtd: i.quantidade, preco: i.produto.preco })), cupom: estado.cupom, totais: totais(), pagamento: estado.pagamento, status: "pago" });
    localStorage.setItem(chave, JSON.stringify(lista));
  }

  // ---------- eventos ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderItens(); renderResumo();
    document.getElementById("itens").addEventListener("click", (e) => {
      const art = e.target.closest("[data-item]"); if (!art) return; const id = art.dataset.item;
      if (e.target.closest("[data-remover]")) Carrinho.remover(id);
      else { const q = e.target.closest("[data-q]"); if (q) Carrinho.definir(id, Carrinho.quantidade(id) + Number(q.dataset.q)); }
    });
    document.getElementById("limpar").addEventListener("click", () => { if (Carrinho.totalItens() && confirm("Limpar todos os itens do pedido?")) Carrinho.limpar(); });
    document.addEventListener("carrinho:mudou", () => { estado.pagamento = null; renderItens(); renderResumo(); });

    const res = document.getElementById("resumo");
    res.addEventListener("input", (e) => {
      const c = e.target.dataset.campo; if (!c) return;
      estado[c] = e.target.value; guardarDados();
      if (estado.pagamento) { estado.pagamento = null; renderPagamento(); }
      if (c === "bairro") renderResumo(); else atualizarAviso();
    });
    res.addEventListener("change", (e) => { if (e.target.dataset.campo === "bairro") { estado.bairro = e.target.value; guardarDados(); estado.pagamento = null; renderResumo(); } });
    res.addEventListener("click", (e) => {
      const m = e.target.closest("[data-modalidade]"); if (m) { estado.modalidade = m.dataset.modalidade; estado.pagamento = null; guardarDados(); renderResumo(); return; }
      if (e.target.closest("[data-aplicar-cupom]")) {
        const inp = res.querySelector("[data-cupom]"), cod = (inp.value || "").trim().toUpperCase(), erro = res.querySelector("[data-cupom-erro]");
        const c = U.cupons.find((x) => x.codigo === cod);
        if (!cod) return;
        if (!c) { erro.textContent = "Cupom inválido ou expirado."; erro.classList.remove("hidden"); return; }
        estado.cupom = c; estado.pagamento = null; toast("Cupom aplicado 🎉", "-" + c.desconto + "% com " + c.codigo); renderResumo(); return;
      }
      if (e.target.closest("[data-tirar-cupom]")) { estado.cupom = null; estado.pagamento = null; renderResumo(); return; }
      const met = e.target.closest("[data-metodo]"); if (met) { estado.metodo = met.dataset.metodo; estado.pixEmAndamento = false; renderPagamento(); atualizarAviso(); return; }
      if (e.target.closest("[data-copiar]")) { const txt = res.querySelector("[data-pix-codigo]").textContent; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Código Pix copiado"), () => toast("Não deu pra copiar automaticamente", "Selecione o código e copie manualmente.", true)); return; }
      if (e.target.closest("[data-pix-pagar]")) { estado.pixEmAndamento = true; renderPagamento(); atualizarAviso(); setTimeout(() => { estado.pixEmAndamento = false; confirmarPagamento("Pix"); }, (U.pagamento.segundosPix || 4) * 1000); return; }
      if (e.target.closest("[data-cartao-pagar]")) {
        const g = (k) => (res.querySelector('[data-c="' + k + '"]').value || "").trim(); const erro = res.querySelector("[data-cartao-erro]");
        const num = g("numero").replace(/\D/g, "");
        let msg = "";
        if (num.length < 13) msg = "Número do cartão incompleto.";
        else if (!g("nome")) msg = "Informe o nome impresso no cartão.";
        else if (!/^\d{2}\/\d{2}$/.test(g("validade"))) msg = "Validade no formato MM/AA.";
        else if (g("cvv").length < 3) msg = "CVV inválido.";
        else if (num === U.pagamento.cartaoRecusado) msg = "Pagamento recusado pela operadora (simulação). Tente outro cartão ou pague com Pix.";
        if (msg) { erro.textContent = msg; erro.classList.remove("hidden"); return; }
        const b = e.target.closest("[data-cartao-pagar]"); b.disabled = true; b.innerHTML = '<span class="h-4 w-4 rounded-full border-2 border-white/40 border-t-white girando"></span> Processando…';
        setTimeout(() => confirmarPagamento("Cartão final " + num.slice(-4)), 1800); return;
      }
      if (e.target.closest("[data-enviar]")) {
        if (!(Carrinho.totalItens() && dadosOk() && estado.pagamento)) return;
        registrarPedido();
        window.open(linkWhats(mensagem()), "_blank");
        toast("Pedido enviado pro WhatsApp", "Se a janela não abriu, libere pop-ups e clique de novo.");
      }
    });
    res.addEventListener("input", (e) => {
      if (e.target.dataset.c === "numero") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
      if (e.target.dataset.c === "validade") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/");
    });
  });
})();
