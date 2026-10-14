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

  window.imgFallback = function (img) { img.onerror = null; img.src = "imagens/marca/logo-bread-king.png"; img.classList.add("object-contain", "p-6"); img.style.background = "#faf7ee"; };

  // ---------- formatação ----------
  window.moeda = (v) => "R$ " + (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");
  window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.linkWhats = (texto) => "https://wa.me/" + U.whatsapp + (texto ? "?text=" + encodeURIComponent(texto) : "");

  // ---------- carrinho (localStorage) ----------
  const CHAVE = "bk_carrinho_" + U.nome.toLowerCase();
  const porId = new Proxy({}, { get: (_, id) => BK.produto(id) });
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch (e) { return {}; } }
  function gravar(c) { localStorage.setItem(CHAVE, JSON.stringify(c)); document.dispatchEvent(new CustomEvent("carrinho:mudou")); }
  window.Carrinho = {
    itens() { const c = ler(); return Object.keys(c).filter((id) => porId[id] && porId[id].ativo !== false && c[id] > 0).map((id) => ({ produto: porId[id], quantidade: c[id] })); },
    quantidade(id) { return ler()[id] || 0; },
    definir(id, q) { const c = ler(); q = Math.max(0, Math.min(99, Math.floor(Number(q) || 0))); if (q === 0) delete c[id]; else c[id] = q; gravar(c); },
    adicionar(id, q) { this.definir(id, this.quantidade(id) + (q || 1)); },
    remover(id) { this.definir(id, 0); },
    limpar() { gravar({}); },
    limparSilencioso() { localStorage.setItem(CHAVE, "{}"); },
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
    let el = document.getElementById("barra-carrinho"); const n = Carrinho.totalItens();
    if (!n || document.body.dataset.semBarra) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "barra-carrinho"; document.body.appendChild(el); }
    el.innerHTML = '<div class="dentro"><div><div style="font-weight:500">' + n + (n === 1 ? " item" : " itens") + '</div><div style="font-size:.85rem;color:var(--cinza)">' + moeda(Carrinho.subtotal()) + '</div></div><a class="ver" href="pedido.html">Ver pedido</a></div>';
  }
  window.atualizarBarraCarrinho = barra;

  // ---------- botão flutuante do WhatsApp (logo oficial, discreto) ----------
  window.LOGO_WHATS = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.004 3C8.84 3 3.01 8.83 3.01 15.99c0 2.83.9 5.5 2.6 7.76L3.9 29l5.45-1.68a12.95 12.95 0 0 0 6.65 1.82c7.16 0 12.99-5.83 12.99-12.99S23.17 3 16.004 3zm0 23.72c-2.2 0-4.34-.63-6.2-1.83l-.44-.27-3.23 1 1.02-3.15-.29-.47a10.7 10.7 0 0 1-1.66-5.7c0-5.95 4.85-10.8 10.8-10.8s10.8 4.85 10.8 10.8-4.85 10.82-10.8 10.82zm5.93-8.09c-.33-.16-1.93-.95-2.22-1.06-.3-.11-.52-.16-.73.16-.22.33-.84 1.06-1.03 1.28-.19.22-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.86-1.62-1.93-1.81-2.26-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.71s1.17 3.15 1.33 3.37c.16.22 2.3 3.51 5.57 4.92.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.62-.38z"/></svg>';
  window.botaoWhatsFlutuante = function () {
    const a = document.createElement("a");
    a.href = linkWhats("Olá! Quero fazer um pedido ou tirar uma dúvida com a " + U.nomeCompleto + ".");
    a.target = "_blank"; a.rel = "noopener"; a.className = "whats-flutuante";
    a.setAttribute("aria-label", "Fale com a loja pelo WhatsApp");
    a.innerHTML = LOGO_WHATS + "<span>Fale com a loja</span>";
    document.body.appendChild(a);
  };

  // ---------- cabeçalho do site ----------
  window.renderTopo = function (el, opts) {
    opts = opts || {}; el.className = "topo-site";
    const pag = location.pathname.split("/").pop() || "index.html";
    el.innerHTML = '<div class="container mx-auto px-4 barra">' +
      '<a class="marca" href="index.html"><img src="imagens/marca/logo-bread-king.png" alt="Bread King"/><span>Bread King<small>' + esc(U.nome) + "</small></span></a>" +
      '<nav><a href="index.html" class="' + (pag === "index.html" ? "ativa" : "") + '">Cardápio</a><a href="acompanhamento.html" class="' + (pag === "acompanhamento.html" ? "ativa" : "") + '">Meus pedidos</a></nav>' +
      '<div class="direita"><span id="area-conta"></span>' +
      '<a class="link-carrinho" href="pedido.html" id="link-carrinho">' + icone("shopping-bag") + '<span><span class="v" data-cv>' + moeda(Carrinho.subtotal()) + '</span><span class="n" data-cn>' + Carrinho.totalItens() + (Carrinho.totalItens() === 1 ? " item" : " itens") + "</span></span></a></div></div>";
    if (window.Conta) Conta.renderArea();
  };
  function atualizarLinkCarrinho() { const v = document.querySelector("[data-cv]"), n = document.querySelector("[data-cn]"); if (v) v.textContent = moeda(Carrinho.subtotal()); if (n) n.textContent = Carrinho.totalItens() + (Carrinho.totalItens() === 1 ? " item" : " itens"); }

  // ---------- horário de funcionamento ----------
  const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  window.estaAberto = function () {
    const agora = new Date(); const h = (U.horarios || {})[agora.getDay()] || []; const m = agora.getHours() * 60 + agora.getMinutes();
    for (const f of h) { const [a, b] = f.split("-").map((t) => { const [hh, mm] = t.split(":").map(Number); return hh * 60 + mm; }); if (m >= a && m < b) return { aberto: true, fecha: f.split("-")[1] }; }
    const prox = h.map((f) => f.split("-")[0]).find((t) => { const [hh, mm] = t.split(":").map(Number); return hh * 60 + mm > m; });
    return { aberto: false, abre: prox || null };
  };
  const fmtFaixas = (l) => (l && l.length) ? l.map((f) => f.replace("-", " às ")).join(" - ") : "Fechado";

  // ---------- gaveta "Ver mais" (Sobre / Horário) ----------
  window.abrirVerMais = function (aba) {
    document.querySelectorAll(".gaveta-fundo").forEach((g) => g.remove());
    const f = document.createElement("div"); f.className = "gaveta-fundo";
    const hoje = new Date().getDay();
    const sobre = '<p>' + esc(U.razaoSocial || U.nomeCompleto) + '</p>' +
      '<div class="caixa-info"><b>' + esc(U.nomeCompleto) + '</b><p>' + esc(U.sobre || "") + '</p><ul style="margin:.6rem 0 0;padding:0">' +
      '<li>' + icone("check") + 'Pague no site e acompanhe o pedido em tempo real</li><li>' + icone("check") + 'Entrega em Palhoça com taxa por bairro</li><li>' + icone("check") + 'Retirada na loja sem taxa</li></ul></div>' +
      '<h4>Endereço</h4><p>' + esc(U.endereco) + '<br/>' + esc(U.bairro) + ' · ' + esc(U.cidade) + '</p><p><a class="text-primary font-semibold" href="' + U.mapa + '" target="_blank" rel="noopener">Ver no mapa</a></p>' +
      '<h4>Redes sociais</h4><p><a class="inline-flex items-center gap-2 text-primary font-semibold" href="' + esc(U.instagram) + '" target="_blank" rel="noopener">' + icone("instagram", "h-4 w-4") + esc(U.instagramUsuario || "Instagram") + '</a></p>' +
      '<h4>Contato</h4><p><a class="inline-flex items-center gap-2" href="' + linkWhats() + '" target="_blank" rel="noopener"><span class="h-4 w-4" style="color:#25D366">' + LOGO_WHATS + '</span>WhatsApp ' + esc(U.whatsappFormatado) + '</a></p>' +
      '<h4>Outras informações</h4><p>CNPJ: ' + esc(U.cnpj || "—") + '</p><p>Pedido mínimo: ' + moeda(U.pedidoMinimo || 0) + '</p>';
    const horario = '<table class="horarios">' + DIAS.map((d, i) => '<tr class="' + (i === hoje ? "hoje" : "") + '"><td>' + (i === hoje ? icone("clock", "inline h-3.5 w-3.5 mr-1 text-primary") : "") + d + "</td><td>" + fmtFaixas((U.horarios || {})[i]) + "</td></tr>").join("") + "</table>";
    f.innerHTML = '<div class="gaveta-loja" role="dialog" aria-modal="true"><button class="fechar" aria-label="Fechar" data-fechar>' + icone("x", "h-6 w-6") + '</button>' +
      '<div class="abas"><button data-aba="sobre" class="' + (aba !== "horario" ? "on" : "") + '">Sobre</button><button data-aba="horario" class="' + (aba === "horario" ? "on" : "") + '">Horário</button></div>' +
      '<div data-painel="sobre" class="' + (aba === "horario" ? "hidden" : "") + '">' + sobre + '</div><div data-painel="horario" class="' + (aba === "horario" ? "" : "hidden") + '">' + horario + "</div></div>";
    f.addEventListener("click", (e) => {
      if (e.target === f || e.target.closest("[data-fechar]")) { f.remove(); document.body.style.overflow = ""; return; }
      const b = e.target.closest("[data-aba]"); if (b) { f.querySelectorAll("[data-aba]").forEach((x) => x.classList.toggle("on", x === b)); f.querySelectorAll("[data-painel]").forEach((p) => p.classList.toggle("hidden", p.dataset.painel !== b.dataset.aba)); }
    });
    document.body.appendChild(f); document.body.style.overflow = "hidden";
  };
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-ver-mais]"); if (a) { e.preventDefault(); abrirVerMais(a.dataset.verMais || "sobre"); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".gaveta-fundo").forEach((g) => { g.remove(); document.body.style.overflow = ""; }); });

  // ---------- hero da loja ----------
  window.renderHeroLoja = function (el) {
    const st = estaAberto(); const m = BK.mediaAvaliacoes();
    el.innerHTML = '<div class="container mx-auto px-4 loja-hero"><img class="loja-banner" src="' + esc(U.banner || "imagens/marca/banner-loja.jpg") + '" alt=""/>' +
      '<div class="loja-cab"><div class="loja-logo"><img src="imagens/marca/logo-bread-king.png" alt="Bread King"/></div><div><h1 class="loja-nome">' + esc(U.nomeCompleto.replace("Bread King ", "Bread King - ")) + '<span class="selo" title="Loja oficial">' + icone("star", "fill-current") + "</span>" + (m ? '<span class="nota">★ ' + m.media.toFixed(1) + "</span>" : "") + "</h1>" +
      '<div class="loja-meta"><span class="' + (st.aberto ? "aberto" : "fechado") + '">' + (st.aberto ? "Aberto · fecha às " + st.fecha : "Fechado" + (st.abre ? " · abre às " + st.abre : "")) + "</span><span>·</span><span>Entrega e retirada</span></div></div>" +
      '<div class="loja-acoes"><button class="btn-vermais" data-ver-mais="sobre">Ver mais</button></div></div>' +
      '<div class="loja-busca">' + icone("search") + '<input id="busca" type="search" placeholder="Buscar no cardápio"/></div></div><div class="faixa-cinza"></div>';
  };

  // ---------- rodapé ----------
  window.renderRodape = function (el) {
    el.className = "rodape-site";
    el.innerHTML = '<div class="container mx-auto px-4"><div class="cols"><div><img src="imagens/marca/logo-bread-king.png" alt="Bread King"/><p>A primeira padaria de supercongelados do Brasil.</p></div>' +
      '<div><h5>Navegação</h5><a href="index.html">Cardápio</a><a href="acompanhamento.html">Meus pedidos</a><a href="#" data-ver-mais="horario">Horário e informações</a></div>' +
      '<div><h5>Contato</h5><a href="' + linkWhats() + '" target="_blank" rel="noopener">WhatsApp ' + esc(U.whatsappFormatado) + '</a><span style="display:block;padding:.2rem 0">' + esc(U.endereco) + "<br/>" + esc(U.bairro + ", " + U.cidade) + "</span></div></div>" +
      '<div class="base"><span>© ' + new Date().getFullYear() + " " + esc(U.nomeCompleto) + ". Todos os direitos reservados.</span><span>Pagamento no site · Entrega e retirada</span></div></div>";
  };

  // ---------- card da loja (seção Nossa Loja) ----------
  window.renderLoja = function (el) {
    el.innerHTML = '<div class="store-card max-w-md mx-auto"><div class="store-card-image">' +
      '<img alt="Unidade ' + esc(U.nome) + '" class="w-full h-full object-cover" src="' + U.fotoLoja + '" onerror="this.outerHTML=\'<div class=loja-fallback><img src=imagens/marca/logo-bread-king.png alt=\\\'Bread King\\\' class=\\\'h-24 object-contain drop-shadow-lg\\\'/></div>\'"/>' +
      '</div><div class="p-5"><h3 class="text-lg font-bold mb-3">Unidade ' + esc(U.nome) + '</h3><div class="space-y-2 mb-4">' +
      '<div class="flex items-start gap-2 text-muted-foreground">' + icone("map-pin", "h-4 w-4 text-primary mt-0.5 shrink-0") + '<div><p class="text-sm">' + esc(U.endereco) + '</p><p class="text-sm">' + esc(U.bairro + ", " + U.cidade) + "</p></div></div>" +
      '<div class="flex items-center gap-2 text-muted-foreground">' + icone("clock", "h-4 w-4 text-secondary shrink-0") + '<p class="text-sm">' + esc(U.horario) + "</p></div>" +
      '<div class="flex items-center gap-2 text-muted-foreground">' + icone("phone", "h-4 w-4 text-green-600 shrink-0") + '<p class="text-sm">' + esc(U.whatsappFormatado) + "</p></div></div>" +
      '<div class="flex gap-3"><a class="' + BTN + ' border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex-1" href="' + U.mapa + '" target="_blank" rel="noopener">' + icone("map-pin") + "Ver Mapa</a>" +
      '<a class="' + BTN + ' text-primary-foreground h-9 rounded-md px-3 flex-1 bg-green-600 hover:bg-green-700" href="' + linkWhats() + '" target="_blank" rel="noopener">' + icone("message-circle") + "WhatsApp</a></div></div></div>";
  };

  document.addEventListener("carrinho:mudou", () => { barra(); atualizarLinkCarrinho(); });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-unidade]").forEach((e) => { e.textContent = U[e.dataset.unidade] || ""; });
    document.querySelectorAll("[data-whats-href]").forEach((e) => { e.href = linkWhats(e.dataset.whatsHref || ""); });
    const t = document.getElementById("topo"); if (t) renderTopo(t, { voltar: t.dataset.voltar, voltarRotulo: t.dataset.voltarRotulo, titulo: t.dataset.titulo });
    const hl = document.getElementById("hero-loja"); if (hl) renderHeroLoja(hl);
    const f = document.querySelector("footer"); if (f && !f.dataset.manual) renderRodape(f);
    const l = document.getElementById("loja-card"); if (l) renderLoja(l);
    if (!document.body.dataset.semWhats) botaoWhatsFlutuante();
    barra();
  });
})();
