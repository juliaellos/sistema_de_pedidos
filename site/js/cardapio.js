// Cardápio: seções empilhadas (Favoritos, Recomendados, categorias) em grade de 2 colunas, cards horizontais, busca e modal com quantidade.
(function () {
  let termo = "";
  const params = new URLSearchParams(location.search);
  const mini = (p) => p.imagem && p.imagem.startsWith("imagens/produtos/") ? p.imagem.replace("imagens/produtos/", "imagens/produtos/mini/").replace(/\.[a-z]+$/i, ".jpg") : p.imagem;
  const composicao = (p) => (p.combo && p.combo.length) ? p.combo.map((x) => { const q = BK.produto(x.id); return x.qtd + "× " + (q ? q.nome : x.id); }).join(" + ") : "";
  const stepper = (id, v, cls) => '<div class="qtd-stepper ' + (cls || "") + '" data-stepper="' + id + '"><button type="button" aria-label="Diminuir" data-acao="menos" class="' + (v <= 1 ? "min" : "") + '">' + icone("minus", "h-4 w-4") + '</button><span class="q" data-q="' + v + '">' + v + '</span><button type="button" aria-label="Aumentar" data-acao="mais">' + icone("plus", "h-4 w-4") + "</button></div>";
  const lerStepper = (el) => Number(el.querySelector("[data-q]").dataset.q) || 1;
  const setStepper = (el, v) => { v = Math.max(1, Math.min(99, v)); const s = el.querySelector("[data-q]"); s.dataset.q = v; s.textContent = v; el.querySelector('[data-acao="menos"]').classList.toggle("min", v <= 1); return v; };
  let VERTICAL = false;

  function cardVertical(p) {
    const n = Carrinho.quantidade(p.id);
    return '<article class="item-v" data-card="' + p.id + '"><img class="foto" alt="" loading="lazy" decoding="async" src="' + mini(p) + '" data-abrir="' + p.id + '" onerror="if(this.src.indexOf(\'/mini/\')>0){this.src=this.src.replace(\'/mini/\',\'/\');}else{imgFallback(this)}"/>' +
      '<div class="texto"><h3 data-abrir="' + p.id + '">' + esc(p.nome) + "</h3>" + (p.descricao ? '<p class="desc" data-abrir="' + p.id + '">' + esc(p.descricao) + "</p>" : (p.peso ? '<p class="desc">' + esc(p.peso) + "</p>" : "")) + (composicao(p) ? '<p class="leva"><b>Leva:</b> ' + esc(composicao(p)) + "</p>" : "") +
      '<div class="rodape"><span class="preco">' + moeda(p.preco).replace("\u00a0", " ") + '</span><span class="no-pedido' + (n ? "" : " hidden") + '" data-no-pedido="' + p.id + '">' + n + " no pedido</span></div>" +
      '<div class="acoes"><button type="button" class="btn-add" data-abrir="' + p.id + '">Adicionar</button></div></div></article>';
  }
  function card(p) {
    if (VERTICAL) return cardVertical(p);
    const n = Carrinho.quantidade(p.id);
    return '<article class="item" data-card="' + p.id + '"><div class="texto"><h3 data-abrir="' + p.id + '">' + esc(p.nome) + "</h3>" +
      (p.descricao ? '<p class="desc" data-abrir="' + p.id + '">' + esc(p.descricao) + "</p>" : (p.peso ? '<p class="desc">' + esc(p.peso) + "</p>" : "")) +
      (composicao(p) ? '<p class="leva"><b>Leva:</b> ' + esc(composicao(p)) + "</p>" : "") +
      '<div class="rodape"><span class="preco">' + moeda(p.preco).replace(" ", " ") + '</span><span class="no-pedido' + (n ? "" : " hidden") + '" data-no-pedido="' + p.id + '">' + n + " no pedido</span>" +
      '<button type="button" class="btn-add" data-abrir="' + p.id + '">Adicionar</button></div></div>' +
      '<img class="foto" alt="" loading="lazy" decoding="async" src="' + mini(p) + '" data-abrir="' + p.id + '" onerror="if(this.src.indexOf(\'/mini/\')>0){this.src=this.src.replace(\'/mini/\',\'/\');}else{imgFallback(this)}"/></article>';
  }
  const secao = (id, titulo, lista) => '<section class="secao scroll-mt-32" id="' + id + '" data-category="' + esc(titulo) + '"><h2>' + esc(titulo) + '</h2>' + (lista.length ? '<div class="' + (VERTICAL ? "grade-v" : "grade") + '">' + lista.map(card).join("") + "</div>" : '<p class="text-sm" style="color:var(--cinza)">Em breve nesta unidade.</p>') + "</section>";

  function telefoneSessao() { const s = window.Conta ? Conta.atual() : null; if (s) return s.telefone; return ((JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}).telefone) || ""; }
  function render() {
    const raiz = document.getElementById("categorias"); const t = termo.trim().toLowerCase();
    const filtra = (p) => !t || (p.nome + " " + (p.descricao || "")).toLowerCase().includes(t);
    const ativos = BK.produtosAtivos(); let html = "", total = 0;
    if (!t) {
      const rec = BK.recomendados(telefoneSessao(), 6); if (rec.length) html += secao("recomendados", "Recomendados pra você", rec);
      const mais = BK.maisPedidos(6); if (mais.length) html += secao("mais-pedidos", "Favoritos dos clientes", mais);
    }
    BK.CATEGORIAS.forEach((cat) => { const ps = ativos.filter((p) => p.categoria === cat).filter(filtra); total += ps.length; if (!ps.length) return; html += secao("categoria-" + BK.slug(cat), cat, ps); });
    if (t && !total) html = '<div class="vazio-busca">Nenhum produto encontrado para “' + esc(termo) + '”.</div>';
    raiz.innerHTML = html; navCategorias(); observar();
  }
  function navCategorias() {
    const nav = document.getElementById("nav-categorias"); if (!nav) return;
    const secs = [...document.querySelectorAll("[data-category]")];
    nav.innerHTML = secs.map((s, i) => '<button type="button" data-ir="' + s.id + '" class="' + (i === 0 ? "ativa" : "") + '">' + esc(s.dataset.category) + "</button>").join("");
  }
  function marcarAtiva(id) {
    const nav = document.getElementById("nav-categorias"); if (!nav) return;
    nav.querySelectorAll("[data-ir]").forEach((b) => { const on = b.dataset.ir === id; b.classList.toggle("ativa", on); if (on) { const alvo = b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2; if (Math.abs(nav.scrollLeft - alvo) > 20) nav.scrollTo({ left: alvo, behavior: "smooth" }); } });
  }
  let obs;
  function observar() { if (obs) obs.disconnect(); obs = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) marcarAtiva(e.target.id); }), { rootMargin: "-30% 0px -60% 0px" }); document.querySelectorAll("[data-category]").forEach((s) => obs.observe(s)); }

  function abrirModal(p) {
    fecharModal(); const m = document.createElement("div"); m.className = "modal-fundo"; m.id = "modal-produto";
    m.innerHTML = '<div class="modal-caixa" role="dialog" aria-modal="true"><button type="button" class="modal-fechar" data-fechar aria-label="Fechar">' + icone("x", "h-5 w-5") + '</button><div class="modal-grid"><img class="foto" alt="' + esc(p.nome) + '" src="' + p.imagem + '" onerror="imgFallback(this)"/>' +
      '<div class="modal-info"><h2>' + esc(p.nome) + "</h2>" + (p.descricao ? '<p class="desc">' + esc(p.descricao) + "</p>" : "") + (p.peso ? '<p class="desc" style="margin-top:.5rem">' + esc(p.peso) + "</p>" : "") + (composicao(p) ? '<div class="leva"><b>O combo leva</b><br/>' + esc(composicao(p)) + "</div>" : "") +
      '<p class="preco">' + moeda(p.preco).replace(" ", " ") + '</p><div class="modal-acoes">' + stepper(p.id, 1, "m") + '<button type="button" class="btn-confirmar" data-madd><span>Adicionar</span><span data-mtotal>' + moeda(p.preco).replace(" ", " ") + "</span></button></div></div></div></div>";
    document.body.appendChild(m); document.body.style.overflow = "hidden";
    const st = m.querySelector("[data-stepper]"), tot = m.querySelector("[data-mtotal]");
    const atualiza = () => { tot.textContent = moeda(p.preco * lerStepper(st)).replace(" ", " "); };
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-fechar]")) return fecharModal();
      const a = e.target.closest("[data-acao]"); if (a) { setStepper(st, lerStepper(st) + (a.dataset.acao === "mais" ? 1 : -1)); atualiza(); return; }
      if (e.target.closest("[data-madd]")) { adicionar(p, lerStepper(st)); fecharModal(); }
    });
  }
  function fecharModal() { const m = document.getElementById("modal-produto"); if (m) { m.remove(); document.body.style.overflow = ""; } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharModal(); });
  function adicionar(p, q) {
    Carrinho.adicionar(p.id, q); toast("Adicionado ao pedido", p.nome + (q > 1 ? " (" + q + " un.)" : ""));
    document.querySelectorAll('[data-card="' + p.id + '"]').forEach((w) => { const b = w.querySelector(".btn-add"); if (!b) return; b.classList.add("ok"); b.textContent = "Adicionado"; setTimeout(() => { b.classList.remove("ok"); b.textContent = "Adicionar"; }, 1200); });
  }
  const atualizarSelos = () => document.querySelectorAll("[data-no-pedido]").forEach((s) => { const q = Carrinho.quantidade(s.dataset.noPedido); s.textContent = q + " no pedido"; s.classList.toggle("hidden", !q); });

  document.addEventListener("DOMContentLoaded", () => {
    VERTICAL = document.body.dataset.layout === "vertical";
    render();
    const raiz = document.getElementById("categorias");
    raiz.addEventListener("click", (e) => {
      const a = e.target.closest("[data-acao]"); if (a) { const s = a.closest("[data-stepper]"); setStepper(s, lerStepper(s) + (a.dataset.acao === "mais" ? 1 : -1)); return; }
      const add = e.target.closest("[data-add]"); if (add) { const p = BK.produto(add.dataset.add); adicionar(p, lerStepper(add.closest("[data-card]").querySelector("[data-stepper]"))); return; }
      if (e.target.closest("[data-stepper]")) return;
      const ab = e.target.closest("[data-abrir]") || e.target.closest(".item,.item-v"); if (ab) { const id = ab.dataset.abrir || ab.dataset.card; const p = BK.produto(id); if (p) abrirModal(p); }
    });
    const nav = document.getElementById("nav-categorias"); if (nav) nav.addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (!b) return; const alvo = document.getElementById(b.dataset.ir); if (alvo) { const y = alvo.getBoundingClientRect().top + window.scrollY - 130; window.scrollTo({ top: y, behavior: "smooth" }); } });
    const busca = document.getElementById("busca"); if (busca) { let t; busca.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { termo = busca.value; render(); }, 150); }); }
    document.addEventListener("carrinho:mudou", atualizarSelos);
    document.addEventListener("conta:mudou", render);
  });
})();
