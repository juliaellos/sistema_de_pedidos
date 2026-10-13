// Código compartilhado: carrinho, formatação, toast, barra flutuante, botão de WhatsApp, rodapé e loja.
(function () {
  const U = window.UNIDADE;
  const BTN = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
  window.BTN = {
    base: BTN,
    primary: BTN + " bg-primary text-primary-foreground hover:bg-primary/90",
    outline: BTN + " border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: BTN + " hover:bg-accent hover:text-accent-foreground"
  };

  window.imgFallback = function (img) { img.onerror = null; img.src = "imagens/marca/logo-bread-king-CVrHv7_B.png"; img.classList.add("object-contain", "p-6"); img.style.background = "#faf7ee"; };

  // ---------- formatação ----------
  window.moeda = (v) => "R$ " + (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");
  window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.linkWhats = (texto) => "https://wa.me/" + U.whatsapp + (texto ? "?text=" + encodeURIComponent(texto) : "");

  // ---------- carrinho (localStorage) ----------
  const CHAVE = "bk_carrinho_" + U.nome.toLowerCase();
  const porId = {};
  (window.CATALOGO || []).forEach((p) => (porId[p.id] = p));
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch (e) { return {}; } }
  function gravar(c) { localStorage.setItem(CHAVE, JSON.stringify(c)); document.dispatchEvent(new CustomEvent("carrinho:mudou")); }
  window.Carrinho = {
    itens() { const c = ler(); return Object.keys(c).filter((id) => porId[id] && c[id] > 0).map((id) => ({ produto: porId[id], quantidade: c[id] })); },
    quantidade(id) { return ler()[id] || 0; },
    definir(id, q) { const c = ler(); q = Math.max(0, Math.min(99, Math.floor(Number(q) || 0))); if (q === 0) delete c[id]; else c[id] = q; gravar(c); },
    adicionar(id, q) { this.definir(id, this.quantidade(id) + (q || 1)); },
    remover(id) { this.definir(id, 0); },
    limpar() { gravar({}); },
    totalItens() { return this.itens().reduce((s, i) => s + i.quantidade, 0); },
    subtotal() { return this.itens().reduce((s, i) => s + i.quantidade * i.produto.preco, 0); }
  };

  // ---------- toast ----------
  window.toast = function (titulo, texto, erro) {
    let lista = document.querySelector(".toast-lista");
    if (!lista) { lista = document.createElement("ol"); lista.className = "toast-lista"; document.body.appendChild(lista); }
    const li = document.createElement("li");
    li.className = "toast-item" + (erro ? " erro" : "");
    li.innerHTML = '<div class="grid gap-1"><div class="text-sm font-semibold">' + esc(titulo) + '</div>' + (texto ? '<div class="text-sm opacity-90">' + esc(texto) + "</div>" : "") + "</div>";
    lista.appendChild(li);
    setTimeout(() => { li.style.opacity = "0"; li.style.transition = "opacity .3s"; setTimeout(() => li.remove(), 320); }, 2800);
  };

  // ---------- barra flutuante do carrinho ----------
  function barra() {
    let el = document.getElementById("barra-carrinho");
    const n = Carrinho.totalItens();
    if (!n || document.body.dataset.semBarra) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "barra-carrinho"; el.className = "fixed inset-x-0 bottom-0 z-50 px-3 pb-3 md:px-6 md:pb-6"; document.body.appendChild(el); }
    el.innerHTML = '<div class="mx-auto flex max-w-2xl items-center gap-3 rounded-md border border-border bg-card p-3 shadow-xl">' +
      '<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">' + icone("shopping-bag", "h-5 w-5") + "</div>" +
      '<div class="min-w-0 flex-1"><p class="text-sm font-bold">' + n + (n === 1 ? " item" : " itens") + '</p><p class="text-sm text-muted-foreground">' + moeda(Carrinho.subtotal()) + "</p></div>" +
      '<a class="' + BTN + ' bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shrink-0" href="pedido.html">Ver pedido</a></div>';
  }
  window.atualizarBarraCarrinho = barra;

  // ---------- botão flutuante do WhatsApp ----------
  window.botaoWhatsFlutuante = function () {
    const a = document.createElement("a");
    a.href = linkWhats("Olá! Vim pelo site da " + U.nomeCompleto + ".");
    a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", "Fale conosco pelo WhatsApp");
    a.className = "fixed bottom-6 left-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-2xl shadow-[#25D366]/40 transition-colors duration-300";
    a.innerHTML = '<span class="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40"></span><span class="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-30"></span>' + icone("message-circle", "h-7 w-7 relative");
    document.body.appendChild(a);
  };

  // ---------- rodapé ----------
  window.renderRodape = function (el) {
    el.innerHTML = '<div class="container mx-auto px-4 py-16"><div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12">' +
      '<div class="lg:col-span-2"><img alt="Bread King" class="h-16 mb-4" src="imagens/marca/logo-bread-king-CVrHv7_B.png"/>' +
      '<p class="text-white/70 max-w-md mb-6">A primeira padaria de supercongelados do Brasil. Tradição artesanal com a praticidade que você precisa.</p>' +
      '<div class="flex gap-4">' +
      '<a class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" href="' + U.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + icone("instagram", "h-5 w-5") + "</a>" +
      '<a class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" href="' + linkWhats() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icone("phone", "h-5 w-5") + "</a>" +
      '<a class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" href="mailto:' + U.email + '" aria-label="E-mail">' + icone("mail", "h-5 w-5") + "</a></div></div>" +
      '<div><h4 class="font-bold text-lg mb-4">Links Rápidos</h4><ul class="space-y-3">' +
      '<li><a class="text-white/70 hover:text-white transition-colors" href="index.html#porque">Por que Bread King?</a></li>' +
      '<li><a class="text-white/70 hover:text-white transition-colors" href="index.html#cardapio">Cardápio</a></li>' +
      '<li><a class="text-white/70 hover:text-white transition-colors" href="index.html#lojas">Nossa Loja</a></li></ul></div>' +
      '<div><h4 class="font-bold text-lg mb-4">Contato</h4><ul class="space-y-4">' +
      '<li class="flex items-start gap-3">' + icone("message-circle", "h-5 w-5 text-[#25D366] mt-0.5") + '<div><p class="font-medium">WhatsApp</p><a class="text-white/70 hover:text-white transition-colors" href="' + linkWhats() + '" target="_blank" rel="noopener">' + U.whatsappFormatado + "</a></div></li>" +
      '<li class="flex items-start gap-3">' + icone("map-pin", "h-5 w-5 text-primary mt-0.5") + '<div><p class="font-medium">Unidade</p><p class="text-white/70">' + esc(U.endereco) + "<br/>" + esc(U.bairro + ", " + U.cidade) + "</p></div></li></ul></div></div>" +
      '<div class="h-px bg-white/10 my-8"></div>' +
      '<div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50"><p>© ' + new Date().getFullYear() + " " + esc(U.nomeCompleto) + '. Todos os direitos reservados.</p><p class="flex items-center gap-1">Feito com ' + icone("heart", "h-4 w-4 text-primary fill-primary") + " em " + esc(U.nome) + "</p></div></div>";
  };

  // ---------- card da loja (seção Nossa Loja) ----------
  window.renderLoja = function (el) {
    el.innerHTML = '<div class="store-card max-w-md mx-auto"><div class="store-card-image">' +
      '<img alt="Unidade ' + esc(U.nome) + '" class="w-full h-full object-cover" src="' + U.fotoLoja + '" onerror="this.outerHTML=\'<div class=loja-fallback><img src=imagens/marca/logo-bread-king-CVrHv7_B.png alt=\\\'Bread King\\\' class=\\\'h-24 object-contain drop-shadow-lg\\\'/></div>\'"/>' +
      '</div><div class="p-5"><h3 class="text-lg font-bold mb-3">Unidade ' + esc(U.nome) + '</h3><div class="space-y-2 mb-4">' +
      '<div class="flex items-start gap-2 text-muted-foreground">' + icone("map-pin", "h-4 w-4 text-primary mt-0.5 shrink-0") + '<div><p class="text-sm">' + esc(U.endereco) + '</p><p class="text-sm">' + esc(U.bairro + ", " + U.cidade) + "</p></div></div>" +
      '<div class="flex items-center gap-2 text-muted-foreground">' + icone("clock", "h-4 w-4 text-secondary shrink-0") + '<p class="text-sm">' + esc(U.horario) + "</p></div>" +
      '<div class="flex items-center gap-2 text-muted-foreground">' + icone("phone", "h-4 w-4 text-green-600 shrink-0") + '<p class="text-sm">' + esc(U.whatsappFormatado) + "</p></div></div>" +
      '<div class="flex gap-3"><a class="' + BTN + ' border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex-1" href="' + U.mapa + '" target="_blank" rel="noopener">' + icone("map-pin") + "Ver Mapa</a>" +
      '<a class="' + BTN + ' text-primary-foreground h-9 rounded-md px-3 flex-1 bg-green-600 hover:bg-green-700" href="' + linkWhats() + '" target="_blank" rel="noopener">' + icone("message-circle") + "WhatsApp</a></div></div></div>";
  };

  document.addEventListener("carrinho:mudou", barra);
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-unidade]").forEach((e) => { e.textContent = U[e.dataset.unidade] || ""; });
    document.querySelectorAll("[data-whats-href]").forEach((e) => { e.href = linkWhats(e.dataset.whatsHref || ""); });
    const f = document.querySelector("footer.footer-gradient"); if (f) renderRodape(f);
    const l = document.getElementById("loja-card"); if (l) renderLoja(l);
    if (!document.body.dataset.semWhats) botaoWhatsFlutuante();
    barra();
  });
})();
