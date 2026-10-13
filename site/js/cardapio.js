// Cardápio: categorias em carrossel, busca, navegação fixa, seletor de quantidade no card (melhoria 4.1) e modal do produto.
(function () {
  const CATEGORIAS = ["Confeitaria", "Padaria", "Pizzas", "Salgados", "Sem Glúten e Sem Lactose", "Sopas", "Tortas Especiais"];
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ e sem lactose/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const B = window.BTN;
  let termo = "";

  function stepper(id, valor, cls) {
    return '<div class="qtd-stepper ' + (cls || "") + '" data-stepper="' + id + '">' +
      '<button type="button" aria-label="Diminuir quantidade" data-acao="menos">' + icone("minus", "h-3.5 w-3.5") + "</button>" +
      '<input type="number" min="1" max="99" value="' + valor + '" aria-label="Quantidade" inputmode="numeric"/>' +
      '<button type="button" aria-label="Aumentar quantidade" data-acao="mais">' + icone("plus", "h-3.5 w-3.5") + "</button></div>";
  }
  function lerStepper(el) { const i = el.querySelector("input"); let v = Math.floor(Number(i.value) || 1); v = Math.max(1, Math.min(99, v)); i.value = v; return v; }

  function card(p) {
    const noPedido = Carrinho.quantidade(p.id);
    return '<div class="w-[72vw] max-w-[260px] shrink-0 snap-start sm:w-[260px]" data-card="' + p.id + '">' +
      '<div class="product-card cursor-pointer group h-full overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"><div class="flex h-full flex-col">' +
      '<div class="aspect-square bg-muted/30 relative overflow-hidden" data-abrir="' + p.id + '"><img alt="' + esc(p.nome) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="' + p.imagem + '" onerror="imgFallback(this)"/>' +
      (p.destaque ? '<div class="badge-featured">⭐ Destaque</div>' : "") +
      '<div class="no-pedido' + (noPedido ? "" : " hidden") + '" data-no-pedido="' + p.id + '">' + noPedido + " no pedido</div></div>" +
      '<div class="flex flex-1 flex-col p-3"><h3 class="min-h-10 font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight" data-abrir="' + p.id + '">' + esc(p.nome) + "</h3>" +
      '<p class="mt-1.5 text-xs font-medium text-muted-foreground">' + esc(p.peso) + "</p>" +
      (p.descricao ? '<p class="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">' + esc(p.descricao) + "</p>" : "") +
      '<div class="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-3"><span class="price-gold text-lg md:text-xl font-bold">' + moeda(p.preco) + "</span>" + stepper(p.id, 1) + "</div>" +
      '<button type="button" data-add="' + p.id + '" class="' + B.base + ' mt-2 h-9 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg gap-1 px-3 py-1.5 text-xs font-bold shadow-md">' + icone("plus") + "<span>Adicionar</span></button>" +
      "</div></div></div></div>";
  }

  function secaoCategoria(cat, produtos) {
    const id = "categoria-" + slug(cat);
    return '<div class="scroll-mt-40" data-category="' + esc(cat) + '" id="' + id + '"><section class="py-8 md:py-12">' +
      '<div class="mb-5 flex items-end justify-between gap-4"><div><p class="mb-1 text-sm font-semibold text-primary" data-contagem>' + produtos.length + (produtos.length === 1 ? " produto" : " produtos") + '</p><h2 class="text-2xl font-extrabold md:text-4xl">' + esc(cat) + "</h2></div>" +
      '<div class="hidden gap-2 md:flex"><button aria-label="Voltar em ' + esc(cat) + '" title="Anterior" data-rolar="-1" class="' + B.outline + ' h-10 w-10">' + icone("chevron-left") + '</button><button aria-label="Avançar em ' + esc(cat) + '" title="Próximo" data-rolar="1" class="' + B.outline + ' h-10 w-10">' + icone("chevron-right") + "</button></div></div>" +
      (produtos.length ? '<div class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 scrollbar-hide" data-trilho>' + produtos.map(card).join("") + "</div>"
        : '<p class="rounded-md border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Em breve nesta unidade.</p>') +
      "</section></div>";
  }

  function render() {
    const raiz = document.getElementById("categorias");
    const t = termo.trim().toLowerCase();
    const filtra = (p) => !t || (p.nome + " " + (p.descricao || "")).toLowerCase().includes(t);
    let html = "", total = 0;
    CATEGORIAS.forEach((cat) => {
      const ps = CATALOGO.filter((p) => p.categoria === cat).filter(filtra);
      total += ps.length;
      if (t && !ps.length) return;
      html += secaoCategoria(cat, ps);
    });
    if (t && !total) html = '<div class="py-16 text-center text-muted-foreground">Nenhum produto encontrado para "<strong>' + esc(termo) + '</strong>".</div>';
    raiz.innerHTML = html;
  }

  function navCategorias() {
    const nav = document.getElementById("nav-categorias");
    nav.innerHTML = CATEGORIAS.map((c, i) => '<button type="button" data-ir="categoria-' + slug(c) + '" class="' + B.base + " h-9 rounded-md px-3 shrink-0 whitespace-nowrap " + (i === 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground") + '">' + esc(c) + "</button>").join("");
    nav.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ir]"); if (!b) return;
      const alvo = document.getElementById(b.dataset.ir); if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function marcarAtiva(id) {
    document.querySelectorAll("#nav-categorias [data-ir]").forEach((b) => {
      const on = b.dataset.ir === id;
      b.classList.toggle("bg-primary", on); b.classList.toggle("text-primary-foreground", on); b.classList.toggle("hover:bg-primary/90", on);
      b.classList.toggle("border", !on); b.classList.toggle("border-input", !on); b.classList.toggle("bg-background", !on); b.classList.toggle("hover:bg-accent", !on); b.classList.toggle("hover:text-accent-foreground", !on);
      if (on) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }
  function observar() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) marcarAtiva(en.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    document.querySelectorAll("[data-category]").forEach((s) => obs.observe(s));
  }

  // ---------- modal (clone do diálogo do produto) ----------
  function abrirModal(p) {
    fecharModal();
    const m = document.createElement("div"); m.className = "modal-fundo"; m.id = "modal-produto";
    m.innerHTML = '<div class="modal-caixa" role="dialog" aria-modal="true">' +
      '<button type="button" data-fechar aria-label="Fechar" class="absolute right-4 top-4 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors">' + icone("x", "h-5 w-5") + "</button>" +
      '<div class="flex flex-col"><div class="aspect-video bg-muted/30 relative overflow-hidden"><img alt="' + esc(p.nome) + '" class="w-full h-full object-cover" src="' + p.imagem + '" onerror="imgFallback(this)"/><div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>' + (p.destaque ? '<div class="badge-featured">⭐ Destaque</div>' : "") + "</div>" +
      '<div class="p-6 space-y-6"><div class="flex flex-col text-center sm:text-left space-y-2"><h2 class="tracking-tight text-2xl md:text-3xl font-black leading-tight">' + esc(p.nome) + '</h2><p class="text-sm font-medium">Categoria: <span class="text-secondary">' + esc(p.categoria) + "</span></p></div>" +
      (p.descricao ? '<p class="text-sm text-muted-foreground leading-relaxed">' + esc(p.descricao) + "</p>" : "") +
      '<p class="text-sm text-muted-foreground"><span class="font-medium">Peso/Tamanho:</span> ' + esc(p.peso) + "</p>" +
      '<div class="flex items-center justify-between py-4 border-y border-border/30"><span class="text-sm text-muted-foreground font-medium">Preço unitário</span><span class="price-gold text-3xl">' + moeda(p.preco) + "</span></div>" +
      '<div class="flex items-center justify-between"><span class="text-sm text-muted-foreground font-medium">Quantidade</span><div class="flex items-center gap-4">' +
      '<button type="button" data-m="-1" class="' + B.outline + ' h-12 w-12 rounded-md">' + icone("minus") + '</button><span class="w-12 text-center text-2xl font-bold" data-mq>1</span><button type="button" data-m="1" class="' + B.outline + ' h-12 w-12 rounded-md">' + icone("plus") + "</button></div></div>" +
      '<button type="button" data-madd class="' + B.base + ' h-14 w-full text-lg font-bold rounded-md btn-primary-gradient text-primary-foreground">' + icone("shopping-cart", "h-5 w-5") + ' <span>Adicionar — ' + moeda(p.preco) + "</span></button></div></div></div>";
    document.body.appendChild(m); document.body.style.overflow = "hidden";
    let q = 1;
    const span = m.querySelector("[data-mq]"), btn = m.querySelector("[data-madd] span");
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-fechar]")) return fecharModal();
      const d = e.target.closest("[data-m]"); if (d) { q = Math.max(1, Math.min(99, q + Number(d.dataset.m))); span.textContent = q; btn.textContent = "Adicionar — " + moeda(p.preco * q); return; }
      if (e.target.closest("[data-madd]")) { adicionar(p, q); fecharModal(); }
    });
  }
  function fecharModal() { const m = document.getElementById("modal-produto"); if (m) { m.remove(); document.body.style.overflow = ""; } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharModal(); });

  function adicionar(p, q) {
    Carrinho.adicionar(p.id, q);
    toast("Adicionado ao carrinho! 🛒", p.nome + (q > 1 ? " (" + q + " un.)" : "") + " foi adicionado ao seu pedido.");
    const wrap = document.querySelector('[data-card="' + p.id + '"]');
    if (wrap) {
      const b = wrap.querySelector("[data-add]"); const antes = b.innerHTML;
      b.className = B.base + " mt-2 h-9 w-full rounded-lg gap-1 px-3 py-1.5 text-xs font-semibold bg-whatsapp text-whatsapp-foreground";
      b.innerHTML = icone("check") + "<span>OK!</span>"; b.disabled = true;
      setTimeout(() => { b.className = B.base + " mt-2 h-9 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg gap-1 px-3 py-1.5 text-xs font-bold shadow-md"; b.innerHTML = antes; b.disabled = false; }, 1400);
      wrap.querySelector("input").value = 1;
    }
  }
  function atualizarSelos() {
    document.querySelectorAll("[data-no-pedido]").forEach((s) => { const q = Carrinho.quantidade(s.dataset.noPedido); s.textContent = q + " no pedido"; s.classList.toggle("hidden", !q); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    navCategorias(); render(); observar();
    const raiz = document.getElementById("categorias");
    raiz.addEventListener("click", (e) => {
      const st = e.target.closest("[data-acao]");
      if (st) { const s = st.closest("[data-stepper]"); const v = lerStepper(s); s.querySelector("input").value = Math.max(1, Math.min(99, v + (st.dataset.acao === "mais" ? 1 : -1))); return; }
      const add = e.target.closest("[data-add]");
      if (add) { const p = CATALOGO.find((x) => x.id === add.dataset.add); const s = add.closest("[data-card]").querySelector("[data-stepper]"); adicionar(p, lerStepper(s)); return; }
      const rolar = e.target.closest("[data-rolar]");
      if (rolar) { const t = rolar.closest("section").querySelector("[data-trilho]"); if (t) t.scrollBy({ left: 276 * 2 * Number(rolar.dataset.rolar), behavior: "smooth" }); return; }
      const ab = e.target.closest("[data-abrir]");
      if (ab) { const p = CATALOGO.find((x) => x.id === ab.dataset.abrir); if (p) abrirModal(p); }
    });
    raiz.addEventListener("change", (e) => { if (e.target.matches("[data-stepper] input")) lerStepper(e.target.closest("[data-stepper]")); });
    const busca = document.getElementById("busca");
    if (busca) { let t; busca.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { termo = busca.value; render(); observar(); }, 150); }); }
    document.addEventListener("carrinho:mudou", atualizarSelos);
    const ex = document.getElementById("explorar"); if (ex) ex.addEventListener("click", () => document.getElementById("cardapio").scrollIntoView({ behavior: "smooth" }));
    const vc = document.getElementById("ver-cardapio"); if (vc) vc.addEventListener("click", () => document.getElementById("cardapio").scrollIntoView({ behavior: "smooth" }));
    const nl = document.getElementById("nossa-loja"); if (nl) nl.addEventListener("click", () => document.getElementById("lojas").scrollIntoView({ behavior: "smooth" }));
  });
})();
