// Cardápio (home): seções "Mais pedidos" e "Recomendados pra você", categorias em carrossel com "Ver todos",
// busca, navegação fixa, seletor de quantidade no card e modal. Também renderiza a página de categoria (grade).
(function () {
  const B = window.BTN;
  let termo = "";
  const params = new URLSearchParams(location.search);
  let MODO_GRADE = false;

  function stepper(id, valor) {
    return '<div class="qtd-stepper" data-stepper="' + id + '"><button type="button" aria-label="Diminuir quantidade" data-acao="menos">' + icone("minus", "h-3.5 w-3.5") + '</button><input type="number" min="1" max="99" value="' + valor + '" aria-label="Quantidade" inputmode="numeric"/><button type="button" aria-label="Aumentar quantidade" data-acao="mais">' + icone("plus", "h-3.5 w-3.5") + "</button></div>";
  }
  function lerStepper(el) { const i = el.querySelector("input"); let v = Math.floor(Number(i.value) || 1); v = Math.max(1, Math.min(99, v)); i.value = v; return v; }

  const mini = (p) => p.imagem && p.imagem.startsWith("imagens/produtos/") && !p.imagem.startsWith("data:") ? p.imagem.replace("imagens/produtos/", "imagens/produtos/mini/").replace(/\.[a-z]+$/i, ".jpg") : p.imagem;
  const composicao = (p) => (p.combo && p.combo.length) ? p.combo.map((x) => { const q = BK.produto(x.id); return x.qtd + "× " + (q ? q.nome : x.id); }).join(" + ") : "";
  function card(p) {
    const noPedido = Carrinho.quantidade(p.id);
    return '<div class="w-[72vw] max-w-[260px] shrink-0 snap-start sm:w-[260px]" data-card="' + p.id + '">' +
      '<div class="product-card cursor-pointer group h-full overflow-hidden transition-all duration-300"><div class="flex h-full flex-col">' +
      '<div class="aspect-square bg-muted/30 relative overflow-hidden" data-abrir="' + p.id + '"><img alt="' + esc(p.nome) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" width="520" height="520" src="' + mini(p) + '" onerror="if(this.src.indexOf(\'/mini/\')>0){this.src=this.src.replace(\'/mini/\',\'/\');}else{imgFallback(this)}"/>' +
      (p.destaque ? '<div class="badge-featured">⭐ Destaque</div>' : "") +
      '<div class="no-pedido' + (noPedido ? "" : " hidden") + '" data-no-pedido="' + p.id + '">' + noPedido + " no pedido</div></div>" +
      '<div class="flex flex-1 flex-col p-3"><h3 class="min-h-10 font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight" data-abrir="' + p.id + '">' + esc(p.nome) + "</h3>" +
      '<p class="mt-1.5 text-xs font-medium text-muted-foreground">' + esc(p.peso || "") + "</p>" +
      (composicao(p) ? '<p class="mt-1.5 text-xs font-semibold text-primary line-clamp-2">Leva: ' + esc(composicao(p)) + "</p>" : "") +
      (p.descricao ? '<p class="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">' + esc(p.descricao) + "</p>" : "") +
      '<div class="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-3"><span class="price-gold text-lg md:text-xl font-bold">' + moeda(p.preco) + "</span>" + stepper(p.id, 1) + "</div>" +
      '<button type="button" data-add="' + p.id + '" class="' + B.base + ' mt-2 h-9 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg gap-1 px-3 py-1.5 text-xs font-bold">' + icone("plus") + "<span>Adicionar</span></button>" +
      "</div></div></div></div>";
  }

  function secao(id, titulo, produtos, opts) {
    opts = opts || {};
    const n = produtos.length;
    return '<div class="scroll-mt-40" data-category="' + esc(titulo) + '" id="' + id + '"><section class="py-8 md:py-10">' +
      '<div class="mb-5 flex items-end justify-between gap-4"><div>' + (opts.eyebrow ? '<p class="eyebrow mb-1">' + esc(opts.eyebrow) + "</p>" : "") +
      '<div class="flex flex-wrap items-center gap-3"><h2 class="text-2xl font-extrabold md:text-4xl">' + esc(titulo) + '</h2><span class="text-sm font-semibold text-muted-foreground">' + n + (n === 1 ? " produto" : " produtos") + "</span>" +
      (opts.verTodos && n > 0 ? '<a class="btn-ver-todos" href="categoria.html?c=' + encodeURIComponent(opts.verTodos) + '">Ver todos ' + icone("chevron-right", "h-3.5 w-3.5") + "</a>" : "") + "</div>" +
      (opts.sub ? '<p class="mt-1 text-sm text-muted-foreground">' + esc(opts.sub) + "</p>" : "") + "</div>" +
      (n > 5 ? '<div class="hidden gap-2 md:flex"><button aria-label="Voltar em ' + esc(titulo) + '" data-rolar="-1" class="' + B.outline + ' h-10 w-10 rounded-full">' + icone("chevron-left") + '</button><button aria-label="Avançar em ' + esc(titulo) + '" data-rolar="1" class="' + B.outline + ' h-10 w-10 rounded-full">' + icone("chevron-right") + "</button></div>" : "") + "</div>" +
      (n ? '<div class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 scrollbar-hide" data-trilho>' + produtos.map(card).join("") + "</div>"
        : '<p class="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Em breve nesta unidade.</p>') +
      "</section></div>";
  }

  function render() {
    const raiz = document.getElementById("categorias");
    const t = termo.trim().toLowerCase();
    const filtra = (p) => !t || (p.nome + " " + (p.descricao || "")).toLowerCase().includes(t);
    const ativos = BK.produtosAtivos();
    let html = "", total = 0;
    if (!t) {
      const tel = (JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}).telefone;
      const rec = tel ? BK.recomendados(tel, 10) : [];
      if (rec.length) html += secao("recomendados", "Recomendados pra você", rec, { eyebrow: "Com base no seu último pedido", sub: "O que você costuma pedir e novidades das categorias que você gosta.", verTodos: "recomendados" });
      const mais = BK.maisPedidos(10);
      if (mais.length) html += secao("mais-pedidos", "Mais pedidos", mais, { eyebrow: "Favoritos da " + UNIDADE.nome, verTodos: "mais-pedidos" });
    }
    BK.CATEGORIAS.forEach((cat) => {
      const ps = ativos.filter((p) => p.categoria === cat).filter(filtra);
      total += ps.length;
      if (t && !ps.length) return;
      html += secao("categoria-" + BK.slug(cat), cat, ps, { verTodos: cat });
    });
    if (t && !total) html = '<div class="py-16 text-center text-muted-foreground">Nenhum produto encontrado para "<strong>' + esc(termo) + '</strong>".</div>';
    raiz.innerHTML = html;
  }

  function renderGrade() {
    const c = params.get("c") || "";
    const ativos = BK.produtosAtivos();
    let titulo = c, lista = [], sub = "";
    if (c === "mais-pedidos") { titulo = "Mais pedidos"; lista = BK.maisPedidos(60); sub = "Os favoritos dos clientes da " + UNIDADE.nome + "."; }
    else if (c === "recomendados") { titulo = "Recomendados pra você"; const tel = (JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}).telefone; lista = tel ? BK.recomendados(tel, 60) : []; sub = "Com base no que você já pediu."; }
    else lista = ativos.filter((p) => p.categoria === c);
    const t = termo.trim().toLowerCase(); if (t) lista = lista.filter((p) => (p.nome + " " + (p.descricao || "")).toLowerCase().includes(t));
    document.title = titulo + " | " + UNIDADE.nomeCompleto;
    document.getElementById("titulo-categoria").textContent = titulo;
    document.getElementById("sub-categoria").textContent = sub || (lista.length + (lista.length === 1 ? " produto" : " produtos"));
    document.getElementById("categorias").innerHTML = lista.length ? '<div class="grade-produtos py-6" data-trilho>' + lista.map(card).join("") + "</div>" : '<p class="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground my-6">Nenhum produto aqui ainda.</p>';
  }

  function navCategorias() {
    const nav = document.getElementById("nav-categorias"); if (!nav) return;
    const itens = [];
    const tel = (JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}).telefone;
    if (tel && BK.recomendados(tel, 1).length) itens.push(["recomendados", "Pra você"]);
    itens.push(["mais-pedidos", "Mais pedidos"]);
    BK.CATEGORIAS.forEach((c) => itens.push(["categoria-" + BK.slug(c), c]));
    nav.innerHTML = itens.map(([id, rot], i) => '<button type="button" data-ir="' + id + '" class="' + B.base + " h-9 rounded-full px-4 shrink-0 whitespace-nowrap " + (i === 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground") + '">' + esc(rot) + "</button>").join("");
    nav.addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (!b) return; const alvo = document.getElementById(b.dataset.ir); if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
  function marcarAtiva(id) {
    document.querySelectorAll("#nav-categorias [data-ir]").forEach((b) => {
      const on = b.dataset.ir === id;
      ["bg-primary", "text-primary-foreground", "hover:bg-primary/90"].forEach((c) => b.classList.toggle(c, on));
      ["border", "border-input", "bg-background", "hover:bg-accent", "hover:text-accent-foreground"].forEach((c) => b.classList.toggle(c, !on));
      if (on) { const nav = b.parentElement; const alvo = b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2; if (Math.abs(nav.scrollLeft - alvo) > 20) nav.scrollTo({ left: alvo, behavior: "smooth" }); }
    });
  }
  function observar() {
    if (!document.getElementById("nav-categorias")) return;
    const obs = new IntersectionObserver((entries) => { entries.forEach((en) => { if (en.isIntersecting) marcarAtiva(en.target.id); }); }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    document.querySelectorAll("[data-category]").forEach((s) => obs.observe(s));
  }

  function abrirModal(p) {
    fecharModal();
    const m = document.createElement("div"); m.className = "modal-fundo"; m.id = "modal-produto";
    m.innerHTML = '<div class="modal-caixa" role="dialog" aria-modal="true">' +
      '<button type="button" data-fechar aria-label="Fechar" class="absolute right-4 top-4 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors">' + icone("x", "h-5 w-5") + "</button>" +
      '<div class="flex flex-col"><div class="aspect-video bg-muted/30 relative overflow-hidden"><img alt="' + esc(p.nome) + '" class="w-full h-full object-cover" src="' + p.imagem + '" onerror="imgFallback(this)"/><div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>' + (p.destaque ? '<div class="badge-featured">⭐ Destaque</div>' : "") + "</div>" +
      '<div class="p-6 space-y-6"><div class="flex flex-col text-center sm:text-left space-y-2"><h2 class="tracking-tight text-2xl md:text-3xl font-black leading-tight">' + esc(p.nome) + '</h2><p class="text-sm font-medium">Categoria: <span class="text-secondary">' + esc(p.categoria) + "</span></p></div>" +
      (composicao(p) ? '<div class="rounded-xl bg-muted px-4 py-3 text-sm"><b>O combo leva:</b><br/>' + esc(composicao(p)) + "</div>" : "") +
      (p.descricao ? '<p class="text-sm text-muted-foreground leading-relaxed">' + esc(p.descricao) + "</p>" : "") +
      (p.peso ? '<p class="text-sm text-muted-foreground"><span class="font-medium">Peso/Tamanho:</span> ' + esc(p.peso) + "</p>" : "") +
      '<div class="flex items-center justify-between py-4 border-y border-border/30"><span class="text-sm text-muted-foreground font-medium">Preço unitário</span><span class="price-gold text-3xl">' + moeda(p.preco) + "</span></div>" +
      '<div class="flex items-center justify-between"><span class="text-sm text-muted-foreground font-medium">Quantidade</span><div class="flex items-center gap-4">' +
      '<button type="button" data-m="-1" class="' + B.outline + ' h-12 w-12 rounded-full">' + icone("minus") + '</button><span class="w-12 text-center text-2xl font-bold" data-mq>1</span><button type="button" data-m="1" class="' + B.outline + ' h-12 w-12 rounded-full">' + icone("plus") + "</button></div></div>" +
      '<button type="button" data-madd class="' + B.base + ' h-14 w-full text-lg font-bold rounded-xl btn-primary-gradient text-primary-foreground">' + icone("shopping-cart", "h-5 w-5") + ' <span>Adicionar — ' + moeda(p.preco) + "</span></button></div></div></div>";
    document.body.appendChild(m); document.body.style.overflow = "hidden";
    let q = 1; const span = m.querySelector("[data-mq]"), btn = m.querySelector("[data-madd] span");
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
    toast("Adicionado ao pedido 🛒", p.nome + (q > 1 ? " (" + q + " un.)" : ""));
    document.querySelectorAll('[data-card="' + p.id + '"]').forEach((wrap) => {
      const b = wrap.querySelector("[data-add]"); const antes = b.innerHTML, cls = b.className;
      b.className = B.base + " mt-2 h-9 w-full rounded-lg gap-1 px-3 py-1.5 text-xs font-semibold bg-whatsapp text-whatsapp-foreground"; b.innerHTML = icone("check") + "<span>OK!</span>"; b.disabled = true;
      setTimeout(() => { b.className = cls; b.innerHTML = antes; b.disabled = false; }, 1200);
      wrap.querySelector("input").value = 1;
    });
  }
  function atualizarSelos() { document.querySelectorAll("[data-no-pedido]").forEach((s) => { const q = Carrinho.quantidade(s.dataset.noPedido); s.textContent = q + " no pedido"; s.classList.toggle("hidden", !q); }); }

  document.addEventListener("DOMContentLoaded", () => {
    MODO_GRADE = document.body.dataset.pagina === "categoria";
    if (MODO_GRADE) renderGrade(); else { navCategorias(); render(); observar(); }
    const raiz = document.getElementById("categorias");
    raiz.addEventListener("click", (e) => {
      const st = e.target.closest("[data-acao]");
      if (st) { const s = st.closest("[data-stepper]"); const v = lerStepper(s); s.querySelector("input").value = Math.max(1, Math.min(99, v + (st.dataset.acao === "mais" ? 1 : -1))); return; }
      const add = e.target.closest("[data-add]");
      if (add) { const p = BK.produto(add.dataset.add); const s = add.closest("[data-card]").querySelector("[data-stepper]"); adicionar(p, lerStepper(s)); return; }
      const rolar = e.target.closest("[data-rolar]");
      if (rolar) { const t = rolar.closest("section").querySelector("[data-trilho]"); if (t) t.scrollBy({ left: 276 * 2 * Number(rolar.dataset.rolar), behavior: "smooth" }); return; }
      const ab = e.target.closest("[data-abrir]");
      if (ab) { const p = BK.produto(ab.dataset.abrir); if (p) abrirModal(p); }
    });
    raiz.addEventListener("change", (e) => { if (e.target.matches("[data-stepper] input")) lerStepper(e.target.closest("[data-stepper]")); });
    const busca = document.getElementById("busca");
    if (busca) { let t; busca.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { termo = busca.value; if (MODO_GRADE) renderGrade(); else { render(); observar(); } }, 150); }); }
    document.addEventListener("carrinho:mudou", atualizarSelos);
  });
})();
