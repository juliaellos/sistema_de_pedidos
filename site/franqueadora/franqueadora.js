// Painel da franqueadora (modo simulação): performance da rede, CRM (dashboard e clientes com segmentação), cupons e modelos de mensagem.
// Dados: REDE.dados() (rede-dados.js). Todos os filtros aceitam todas, uma ou várias unidades.
(function () {
  const R = window.REDE, D = R.dados();
  const SENHA = "franqueadora";
  // ---------- utilidades ----------
  const moeda = (v) => "R$ " + (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const curta = (v) => v >= 1e6 ? "R$ " + (v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi" : v >= 1000 ? "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : "R$ " + Math.round(v);
  const num = (v) => Math.round(v || 0).toLocaleString("pt-BR");
  const pct = (v, casas) => (isFinite(v) ? v : 0).toLocaleString("pt-BR", { minimumFractionDigits: casas ?? 1, maximumFractionDigits: casas ?? 1 }) + "%";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (iso) => iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  const fmtD = (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "";
  const fone = (t) => { const d = String(t || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); return d.length === 11 ? "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7) : d.length === 10 ? "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6) : t || ""; };
  const dataBR = (s) => s ? s.split("-").reverse().join("/") : "";
  const toast = (m) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
  const ic = (n) => window.icone ? icone(n) : "";
  function gaveta(html) { fecharGaveta(); const f = document.createElement("div"); f.className = "fundo"; f.innerHTML = '<div class="gaveta" style="position:relative"><button class="btn pequeno fechar" data-fechar>' + ic("x") + "</button>" + html + "</div>"; f.addEventListener("click", (e) => { if (e.target === f || e.target.closest("[data-fechar]")) fecharGaveta(); }); document.body.appendChild(f); return f; }
  function fecharGaveta() { document.querySelectorAll(".fundo").forEach((f) => f.remove()); }
  function baixarCsv(nome, linhas) { const csv = linhas.map((l) => l.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = nome; a.click(); }
  // cabeçalho da página: só eyebrow + título (sem texto de apoio); o 3º parâmetro fica por compatibilidade e é ignorado
  const topo = (eyebrow, titulo, _sub, acoes) => '<div class="topo"><div><p class="eyebrow">' + eyebrow + "</p><h1>" + titulo + '</h1></div><div class="linha">' + (acoes || "") + "</div></div>";
  const COR_UNID = { palhoca: "#B8172E", maringa: "#D69A2D", joinville: "#6B4A3A" };
  const cor = (id) => COR_UNID[id] || "#999";
  const catDe = (i) => i.categoria || ((window.BK && BK.produto(i.id)) || {}).categoria || "Outros";
  const chave = (p) => p.unidade + "|" + String(p.cliente.telefone || "").replace(/\D/g, "");
  const contas = {}; D.contas.forEach((c) => (contas[c.unidade + "|" + c.telefone] = c));
  const primeiraCompra = {}; D.pedidos.forEach((p) => { if (p.status === "cancelado") return; const k = chave(p); if (!primeiraCompra[k] || p.quando < primeiraCompra[k]) primeiraCompra[k] = p.quando; });
  const idadeDe = (nasc) => { if (!nasc) return null; const d = new Date(nasc + "T12:00:00"), h = new Date(); let a = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };

  // ---------- estado dos filtros ----------
  const est = {
    unidades: [], // vazio = todas
    per: { dashboard: { preset: "30d", de: "", ate: "" }, crm: { preset: "30d", de: "", ate: "" }, clientes: { preset: "12m", de: "", ate: "" }, produtos: { preset: "30d", de: "", ate: "" }, abc: { preset: "90d", de: "", ate: "" }, segmentos: { preset: "12m", de: "", ate: "" }, campanhas: { preset: "90d", de: "", ate: "" }, avaliacoes: { preset: "90d", de: "", ate: "" } },
    aberto: false, serie: "unidade", topModo: "valor", aba: "horario", abaModo: "melhores", limiteCli: 50, buscaCli: "", limiteAbc: 100, limiteSeg: 50, avNota: "", avBusca: "", limiteAv: 30
  };
  const unidOk = (id) => !est.unidades.length || est.unidades.includes(id);
  const unidadesSel = () => R.UNIDADES.filter((u) => unidOk(u.id));
  const PRESETS = [["hoje", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"], ["mes", "Mês atual"], ["90d", "90 dias"], ["12m", "12 meses"], ["tudo", "Tudo"]];
  function intervalo(p) {
    const fim = new Date(); fim.setHours(23, 59, 59, 999);
    const ini = (dias) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (dias - 1)); return d; };
    let de;
    if (p.preset === "custom") return { de: p.de ? new Date(p.de + "T00:00:00") : new Date(2000, 0, 1), ate: p.ate ? new Date(p.ate + "T23:59:59.999") : fim, tudo: !p.de };
    if (p.preset === "hoje") de = ini(1); else if (p.preset === "7d") de = ini(7); else if (p.preset === "30d") de = ini(30); else if (p.preset === "90d") de = ini(90); else if (p.preset === "12m") de = ini(365);
    else if (p.preset === "mes") { de = new Date(); de.setHours(0, 0, 0, 0); de.setDate(1); } else return { de: new Date(2000, 0, 1), ate: fim, tudo: true };
    return { de, ate: fim };
  }
  const anterior = (iv) => { if (iv.tudo) return null; const len = iv.ate - iv.de; return { de: new Date(iv.de.getTime() - len - 1), ate: new Date(iv.de.getTime() - 1) }; };
  const descPeriodo = (iv) => iv.tudo ? "todo o histórico" : fmtD(iv.de.toISOString()) + " a " + fmtD(iv.ate.toISOString());
  function pedidosEm(iv, comCancelados) { const a = iv.de.toISOString(), b = iv.ate.toISOString(); return D.pedidos.filter((p) => unidOk(p.unidade) && p.quando >= a && p.quando <= b && (comCancelados || p.status !== "cancelado")); }

  function barraFiltros(tela, semUnidades) {
    const p = est.per[tela]; const sel = est.unidades;
    const rot = !sel.length ? "Todas" : sel.length === 1 ? R.nomeUnidade(sel[0]) : sel.length === 2 ? sel.map(R.nomeUnidade).join(" e ") : sel.length + " unidades";
    if (semUnidades) return '<div class="cartao filtros"><span class="mini" style="align-self:center">Período das compras</span><div class="chips">' + PRESETS.map(([id, r]) => '<button type="button" class="chip' + (p.preset === id ? " on" : "") + '" data-preset="' + id + '">' + r + "</button>").join("") + "</div>" +
      '<div class="datas"><label class="campo">De<input type="date" data-per="de" value="' + (p.preset === "custom" ? p.de : "") + '"/></label><label class="campo">Até<input type="date" data-per="ate" value="' + (p.preset === "custom" ? p.ate : "") + '"/></label></div></div>';
    return '<div class="cartao filtros"><div class="multi"><button class="btn" type="button" data-multi>' + ic("store") + "Unidades: <b>" + esc(rot) + "</b>" + ic("chevron-down") + '</button><div class="multi-pop' + (est.aberto ? "" : " hidden") + '"><label class="todas"><input type="checkbox" data-unid="*"' + (!sel.length ? " checked" : "") + "/> Todas as unidades</label>" +
      R.UNIDADES.map((u) => '<label><input type="checkbox" data-unid="' + u.id + '"' + (sel.includes(u.id) ? " checked" : "") + "/> " + esc(u.nome) + '<span class="mini">' + esc(u.cidade) + "</span></label>").join("") + "</div></div>" +
      '<span class="sep"></span><div class="chips">' + PRESETS.map(([id, r]) => '<button type="button" class="chip' + (p.preset === id ? " on" : "") + '" data-preset="' + id + '">' + r + "</button>").join("") + "</div>" +
      '<div class="datas"><label class="campo">De<input type="date" data-per="de" value="' + (p.preset === "custom" ? p.de : "") + '"/></label><label class="campo">Até<input type="date" data-per="ate" value="' + (p.preset === "custom" ? p.ate : "") + '"/></label></div></div>';
  }
  function ligarFiltros(el, tela) {
    const p = est.per[tela];
    const multi = el.querySelector("[data-multi]"); if (multi) multi.addEventListener("click", (e) => { e.stopPropagation(); est.aberto = !est.aberto; el.querySelector(".multi-pop").classList.toggle("hidden", !est.aberto); });
    el.querySelectorAll("[data-unid]").forEach((c) => c.addEventListener("change", () => {
      const id = c.dataset.unid;
      if (id === "*") est.unidades = [];
      else { const s = new Set(est.unidades); if (c.checked) s.add(id); else s.delete(id); est.unidades = s.size === R.UNIDADES.length ? [] : [...s]; }
      est.limiteCli = 50; render();
    }));
    el.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { Object.assign(p, { preset: b.dataset.preset, de: "", ate: "" }); est.limiteCli = 50; render(); }));
    el.querySelectorAll("[data-per]").forEach((i) => i.addEventListener("change", () => { if (p.preset !== "custom") { p.de = ""; p.ate = ""; } p.preset = "custom"; p[i.dataset.per] = i.value; est.limiteCli = 50; render(); }));
  }
  document.addEventListener("click", (e) => { if (est.aberto && !e.target.closest(".multi")) { est.aberto = false; document.querySelectorAll(".multi-pop").forEach((m) => m.classList.add("hidden")); } });

  // ---------- componentes visuais ----------
  function variacao(atual, ant, inverso) {
    if (ant == null) return "";
    if (!ant) return '<div class="var igual">sem base no período anterior</div>';
    const v = (atual - ant) / ant * 100; const cls = Math.abs(v) < 0.5 ? "igual" : (v > 0) !== !!inverso ? "sobe" : "desce";
    return '<div class="var ' + cls + '">' + (v > 0 ? "▲ " : v < 0 ? "▼ " : "") + pct(Math.abs(v)) + " vs. período anterior</div>";
  }
  const kpi = (rot, valor, extra) => '<div class="cartao kpi"><div class="rotulo">' + rot + '</div><div class="valor">' + valor + "</div>" + (extra || "") + "</div>";
  function hbar(linhas, fmtV, suave) { const max = Math.max(1, ...linhas.map((l) => l.v)); return '<div class="hbar">' + linhas.map((l) => '<span class="nome" title="' + esc(l.nome) + '">' + esc(l.nome) + '</span><span class="trilho"><i class="' + (suave ? "suave" : "") + '" style="width:' + (l.v / max * 100).toFixed(1) + "%" + (l.cor ? ";background:" + l.cor : "") + '"></i></span><span class="val">' + fmtV(l) + "</span>").join("") + "</div>"; }
  function colunas(itens, fmtV) { const max = Math.max(1, ...itens.map((x) => x.v)); const iMax = itens.reduce((m, x, i) => (x.v > itens[m].v ? i : m), 0); return '<div class="colunas">' + itens.map((x, i) => '<div class="col' + (i === iMax && x.v ? " top" : "") + '" title="' + esc(x.rot + ": " + fmtV(x.v)) + '">' + (i === iMax && x.v ? "<em>" + fmtV(x.v) + "</em>" : "") + '<i style="height:' + Math.max(x.v ? 2 : 0, x.v / max * 100) + '%"></i><span>' + esc(x.rot) + "</span></div>").join("") + "</div>"; }
  function split(a, b, rotA, rotB, corA, corB, fmtV) { const t = a + b || 1; return '<div class="split"><i style="width:' + (a / t * 100) + "%;background:" + corA + '"></i><i style="width:' + (b / t * 100) + "%;background:" + corB + '"></i></div><div class="split-leg"><span><span style="color:' + corA + '">■</span> ' + rotA + " <b>" + pct(a / t * 100) + '</b><div class="mini">' + fmtV(a) + '</div></span><span style="text-align:right"><span style="color:' + corB + '">■</span> ' + rotB + " <b>" + pct(b / t * 100) + '</b><div class="mini">' + fmtV(b) + "</div></span></div>"; }
  // gráfico de linhas (SVG) com uma série por unidade ou a soma da rede; hover mostra os valores do ponto
  function grafLinhas(rotulos, series, fmtV, escala) {
    const W = 760, H = 260, L = 64, Rr = 14, T = 16, B = 34, iw = W - L - Rr, ih = H - T - B, n = rotulos.length;
    const mn = escala ? escala.min : 0; const max = escala ? escala.max : Math.max(1, ...series.flatMap((s) => s.valores)); const x = (i) => L + (n === 1 ? iw / 2 : i * iw / (n - 1)); const y = (v) => T + ih - (v - mn) / (max - mn || 1) * ih;
    const grade = [0, .25, .5, .75, 1].map((f) => { const v = mn + f * (max - mn); return '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#ebebeb"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="10" fill="#717171">' + fmtV(v, true) + "</text>"; }).join("");
    const passo = Math.max(1, Math.ceil(n / 10));
    const eixo = rotulos.map((r, i) => (i % passo === 0 || i === n - 1) ? '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#717171">' + esc(r) + "</text>" : "").join("");
    const linhas = series.map((s) => '<path d="' + s.valores.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ") + '" fill="none" stroke="' + s.cor + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + (n <= 31 ? s.valores.map((v, i) => '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="2.5" fill="' + s.cor + '"/>').join("") : "")).join("");
    const alvos = rotulos.map((r, i) => '<rect class="alvo" data-i="' + i + '" x="' + (x(i) - iw / Math.max(1, n - 1) / 2) + '" y="' + T + '" width="' + Math.max(4, iw / Math.max(1, n - 1)) + '" height="' + ih + '" fill="transparent"/>').join("");
    const id = "gl" + Math.random().toString(36).slice(2, 7);
    grafLinhas.dados = grafLinhas.dados || {}; grafLinhas.dados[id] = { rotulos, series, fmtV, x };
    return '<div style="position:relative" data-graf="' + id + '"><svg viewBox="0 0 ' + W + " " + H + '" width="100%" style="display:block;font-family:Figtree,sans-serif">' + grade + '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '" stroke="#dcdcdc"/>' + linhas + '<line class="guia" x1="0" x2="0" y1="' + T + '" y2="' + (T + ih) + '" stroke="#717171" stroke-dasharray="3 3" visibility="hidden"/>' + eixo + alvos + '</svg><div class="tip-g hidden"></div></div>';
  }
  function ligarLinhas(el) {
    el.querySelectorAll("[data-graf]").forEach((box) => {
      const g = grafLinhas.dados[box.dataset.graf]; const tip = box.querySelector(".tip-g"); const guia = box.querySelector(".guia"); const svg = box.querySelector("svg");
      box.querySelectorAll(".alvo").forEach((r) => {
        r.addEventListener("mousemove", (e) => { const i = Number(r.dataset.i); guia.setAttribute("x1", g.x(i)); guia.setAttribute("x2", g.x(i)); guia.setAttribute("visibility", "visible"); tip.innerHTML = "<b>" + esc(g.rotulos[i]) + "</b><br/>" + g.series.map((s) => '<span style="color:' + s.cor + '">●</span> ' + esc(s.nome) + ": " + g.fmtV(s.valores[i])).join("<br/>"); tip.classList.remove("hidden"); const b = box.getBoundingClientRect(); let left = e.clientX - b.left + 14; if (left > b.width - 180) left = e.clientX - b.left - 190; tip.style.left = left + "px"; tip.style.top = Math.max(0, e.clientY - b.top - 40) + "px"; });
        r.addEventListener("mouseleave", () => { tip.classList.add("hidden"); guia.setAttribute("visibility", "hidden"); });
      });
      svg.addEventListener("mouseleave", () => tip.classList.add("hidden"));
    });
  }
  // agrupa pedidos por dia / semana / mês conforme o tamanho do período
  function buckets(iv, ps) {
    const dias = Math.ceil((iv.ate - iv.de) / 864e5); let de = iv.de;
    if (iv.tudo && ps.length) { de = new Date(ps[0].quando); de.setHours(0, 0, 0, 0); }
    const modo = Math.ceil((iv.ate - de) / 864e5) <= 62 ? "dia" : (iv.ate - de) / 864e5 <= 180 ? "semana" : "mes";
    const chaveDe = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); if (modo === "semana") x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); if (modo === "mes") x.setDate(1); return x.getTime(); };
    const ks = []; for (let d = new Date(chaveDe(de)); d <= iv.ate; modo === "mes" ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + (modo === "semana" ? 7 : 1))) ks.push(d.getTime());
    const rot = (t) => { const d = new Date(t); return modo === "mes" ? d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "") : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
    return { ks, rot, chaveDe, modo, dias };
  }
  function rankingCategorias(ps) {
    const m = {}; const nums = {};
    ps.forEach((p) => p.itens.forEach((i) => { const c = catDe(i); const o = m[c] || (m[c] = { c, valor: 0, vol: 0, peds: new Set() }); o.valor += i.qtd * i.preco; o.vol += i.qtd; o.peds.add(p.numero); }));
    const l = Object.values(m).map((o) => Object.assign(o, { pedidos: o.peds.size })).sort((a, b) => b.valor - a.valor);
    const tv = l.reduce((s, o) => s + o.valor, 0), tp = l.reduce((s, o) => s + o.pedidos, 0), tq = l.reduce((s, o) => s + o.vol, 0);
    if (!l.length) return '<div class="vazio">Sem vendas no período.</div>';
    return '<div style="overflow:auto"><table><thead><tr><th></th><th>Categoria</th><th class="n">Valor</th><th class="n">%</th><th class="n">Pedidos</th><th class="n">%</th><th class="n">Volume (itens)</th><th class="n">%</th></tr></thead><tbody>' +
      l.map((o, i) => '<tr><td><span class="pos' + (i === 0 ? " p1" : "") + '">' + (i + 1) + "º</span></td><td>" + esc(o.c) + '</td><td class="n">' + moeda(o.valor) + '</td><td class="n">' + pct(o.valor / tv * 100, 2) + '</td><td class="n">' + num(o.pedidos) + '</td><td class="n">' + pct(o.pedidos / tp * 100, 2) + '</td><td class="n">' + num(o.vol) + '</td><td class="n">' + pct(o.vol / tq * 100, 2) + "</td></tr>").join("") +
      '<tr class="total"><td></td><td>Total geral</td><td class="n">' + moeda(tv) + '</td><td></td><td class="n">' + num(ps.length) + ' <span class="mini">pedidos</span></td><td></td><td class="n">' + num(tq) + "</td><td></td></tr></tbody></table></div>";
  }

  // ---------- sessão e navegação ----------
  const TELAS = [["dashboard", "Performance geral", "sparkles"], ["abc", "Curva ABC", "star"], ["g", "Catálogo"], ["produtos", "Produtos", "utensils-crossed"], ["g", "CRM"], ["crm", "Dashboard", "heart"], ["clientes", "Clientes", "user"], ["segmentos", "Segmentação", "search"], ["avaliacoes", "Avaliações", "star"], ["g", "Marketing"], ["campanhas", "Campanhas", "message-circle"], ["cupons", "Cupons", "tag"], ["modelos", "Modelos de mensagem", "mail"], ["g", "Rede"], ["unidades", "Unidades", "store"], ["msgsauto", "Mensagens automáticas", "message-circle"]];
  let tela = (location.hash.replace("#", "") || "dashboard");
  function iniciar() {
    if (sessionStorage.getItem("bk_franq") === "1") mostrarApp(); else document.getElementById("login").classList.remove("hidden");
    document.getElementById("form-login").addEventListener("submit", (e) => { e.preventDefault(); if (document.getElementById("senha").value === SENHA) { sessionStorage.setItem("bk_franq", "1"); document.getElementById("login").classList.add("hidden"); mostrarApp(); } else document.getElementById("login-erro").textContent = "Senha incorreta."; });
    document.getElementById("sair").addEventListener("click", (e) => { e.preventDefault(); sessionStorage.removeItem("bk_franq"); location.reload(); });
  }
  function mostrarApp() {
    document.getElementById("app").classList.remove("hidden");
    const menu = document.getElementById("menu");
    menu.innerHTML = TELAS.map(([id, rot, i]) => id === "g" ? '<div class="grupo">' + rot + "</div>" : '<a href="#' + id + '" data-tela="' + id + '" class="' + (["crm", "clientes", "segmentos", "avaliacoes", "campanhas", "cupons", "modelos", "produtos", "unidades", "msgsauto"].includes(id) ? "sub" : "") + '">' + ic(i) + rot + "</a>").join("");
    menu.addEventListener("click", (e) => { const a = e.target.closest("[data-tela]"); if (a) { tela = a.dataset.tela; est.aberto = false; render(); } });
    document.addEventListener("rede:mudou", () => { if (!document.querySelector(".fundo")) render(); });
    render();
  }
  function render() {
    document.querySelectorAll("#menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.tela === tela));
    const el = document.getElementById("tela");
    ({ dashboard: telaDashboard, abc: telaAbc, produtos: telaProdutos, crm: telaCrm, clientes: telaClientes, segmentos: telaSegmentos, avaliacoes: telaAvaliacoes, campanhas: telaCampanhas, cupons: telaCupons, modelos: telaModelos, unidades: telaUnidades, msgsauto: telaMsgsAuto }[tela] || telaDashboard)(el);
  }

  // ---------- PERFORMANCE GERAL ----------
  function resumo(ps, iv) {
    const fat = ps.reduce((s, p) => s + p.totais.total, 0); const n = ps.length;
    const porCli = {}; ps.forEach((p) => { const k = chave(p); porCli[k] = (porCli[k] || 0) + 1; });
    const ks = Object.keys(porCli); const de = iv.de.toISOString();
    const novos = ks.filter((k) => primeiraCompra[k] >= de).length;
    const a = iv.de.toISOString(), b = iv.ate.toISOString(); const av = D.avaliacoes.filter((x) => unidOk(x.unidade) && x.quando >= a && x.quando <= b);
    const bruto = ps.reduce((s, p) => s + p.totais.subtotal, 0), desc = ps.reduce((s, p) => s + (p.totais.desconto || 0), 0);
    return { fat, n, ticket: n ? fat / n : 0, clientes: ks.length, novos, recorrentes: ks.length - novos, recompra: ks.length ? ks.filter((k) => porCli[k] >= 2).length / ks.length * 100 : 0, nota: av.length ? av.reduce((s, x) => s + x.nota, 0) / av.length : null, nAv: av.length, desc, descPct: bruto ? desc / bruto * 100 : 0 };
  }
  function telaDashboard(el) {
    const iv = intervalo(est.per.dashboard); const ivA = anterior(iv);
    const todosPer = pedidosEm(iv, true); const ps = todosPer.filter((p) => p.status !== "cancelado"); const psA = ivA ? pedidosEm(ivA) : null;
    const r = resumo(ps, iv); const ra = psA ? resumo(psA, ivA) : null; const v = (c) => ra ? ra[c] : null;
    const us = unidadesSel();
    // linha do tempo
    const bk = buckets(iv, ps); const idx = {}; bk.ks.forEach((k, i) => (idx[k] = i));
    // por grupo (cada unidade ou a rede somada): faturamento e nº de pedidos por período; o ticket sai da divisão dos dois
    const grupos = est.serie === "rede" || us.length === 1 ? [{ nome: us.length === 1 ? us[0].nome : "Rede", cor: us.length === 1 ? cor(us[0].id) : "#B8172E", filtro: () => true }] : us.map((u) => ({ nome: u.nome, cor: cor(u.id), filtro: (p) => p.unidade === u.id }));
    grupos.forEach((g) => { g.fat = bk.ks.map(() => 0); g.n = bk.ks.map(() => 0); });
    ps.forEach((p) => { const i = idx[bk.chaveDe(p.quando)]; if (i == null) return; grupos.forEach((g) => { if (g.filtro(p)) { g.fat[i] += p.totais.total; g.n[i]++; } }); });
    const series = grupos.map((g) => ({ nome: g.nome === "Rede" ? "Rede (soma)" : g.nome, cor: g.cor, valores: g.fat }));
    const seriesN = grupos.map((g) => ({ nome: g.nome === "Rede" ? "Rede (soma)" : g.nome, cor: g.cor, valores: g.n }));
    const seriesT = grupos.map((g) => ({ nome: g.nome === "Rede" ? "Rede (média)" : g.nome, cor: g.cor, valores: g.fat.map((v, i) => g.n[i] ? v / g.n[i] : 0) }));
    const chipsSerie = (ultimo) => us.length > 1 ? '<div class="chips"><button class="chip' + (est.serie === "unidade" ? " on" : "") + '" data-serie="unidade">Por unidade</button><button class="chip' + (est.serie === "rede" ? " on" : "") + '" data-serie="rede">' + (ultimo || "Rede (soma)") + "</button></div>" : "";
    const legenda = (ss) => '<div class="legenda" style="margin-top:.5rem">' + ss.map((x) => '<span><i style="background:' + x.cor + '"></i>' + esc(x.nome) + "</span>").join("") + "</div>";
    // ranking de unidades
    const porUnid = us.map((u) => { const pu = ps.filter((p) => p.unidade === u.id); const ru = resumo(pu, iv); const pa = psA ? psA.filter((p) => p.unidade === u.id) : null; const canc = todosPer.filter((p) => p.unidade === u.id && p.status === "cancelado").length; return { u, ru, fatA: pa ? pa.reduce((s, p) => s + p.totais.total, 0) : null, canc, cancPct: (pu.length + canc) ? canc / (pu.length + canc) * 100 : 0 }; }).sort((a, b) => b.ru.fat - a.ru.fat);
    // produtos
    const prod = {}; ps.forEach((p) => p.itens.forEach((i) => { const o = prod[i.id] || (prod[i.id] = { nome: i.nome, valor: 0, qtd: 0 }); o.valor += i.qtd * i.preco; o.qtd += i.qtd; }));
    const top = Object.values(prod).sort((a, b) => est.topModo === "valor" ? b.valor - a.valor : b.qtd - a.qtd).slice(0, 10);
    // mix
    const soma = (f) => ps.filter(f).reduce((s, p) => s + p.totais.total, 0);
    const ent = soma((p) => p.modalidade === "entrega"), ret = soma((p) => p.modalidade !== "entrega");
    const pix = soma((p) => /pix/i.test(p.pagamento.metodo)), car = soma((p) => !/pix/i.test(p.pagamento.metodo));
    const nEnt = ps.filter((p) => p.modalidade === "entrega").length, nPix = ps.filter((p) => /pix/i.test(p.pagamento.metodo)).length;
    // horários e dias
    const horas = []; for (let h = 8; h <= 19; h++) horas.push({ rot: h + "h", v: 0 }); const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => ({ rot: d, v: 0 }));
    ps.forEach((p) => { const d = new Date(p.quando); const h = d.getHours(); if (h >= 8 && h <= 19) horas[h - 8].v += p.totais.total; dias[d.getDay()].v += p.totais.total; });
    // cupons e cancelamentos
    const redeCods = new Set(R.cupons().map((c) => c.codigo)); const cup = {};
    ps.forEach((p) => { if (!p.cupom) return; const o = cup[p.cupom.codigo] || (cup[p.cupom.codigo] = { codigo: p.cupom.codigo, usos: 0, desc: 0, fat: 0 }); o.usos++; o.desc += p.totais.desconto || 0; o.fat += p.totais.total; });
    const cups = Object.values(cup).sort((a, b) => b.usos - a.usos).slice(0, 8);
    const canc = todosPer.filter((p) => p.status === "cancelado"); const cancV = canc.reduce((s, p) => s + p.totais.total, 0);

    el.innerHTML = topo("Rede Bread King", "Performance geral", "Período: " + descPeriodo(iv) + (ivA ? " · comparado com " + descPeriodo(ivA) : "") + ".") + barraFiltros("dashboard") +
      '<div class="kpis kpis7">' + kpi("Faturamento", moeda(r.fat), variacao(r.fat, v("fat"))) + kpi("Pedidos", num(r.n), variacao(r.n, v("n"))) + kpi("Ticket médio", moeda(r.ticket), variacao(r.ticket, v("ticket"))) +
      kpi("Clientes ativos", num(r.clientes), '<div class="sub">' + num(r.novos) + " novos · " + num(r.recorrentes) + " recorrentes</div>" + variacao(r.clientes, v("clientes"))) +
      kpi("Taxa de recompra", pct(r.recompra), '<div class="sub">clientes com 2+ pedidos no período</div>' + (ra ? variacao(r.recompra, ra.recompra) : "")) +
      kpi("Avaliação média", r.nota ? r.nota.toFixed(1).replace(".", ",") + ' <small style="color:var(--gold)">★</small>' : "—", '<div class="sub">' + num(r.nAv) + " avaliações</div>") +
      kpi("Desconto em cupons", moeda(r.desc), '<div class="sub">' + pct(r.descPct) + " do faturamento bruto</div>" + variacao(r.desc, v("desc"), true)) + "</div>" +
      '<div class="grade-dash">' +
      '<div class="cartao largo"><div class="cab"><div><h3>Faturamento ao longo do tempo</h3><p class="mini">por ' + bk.modo + "</p></div>" + (us.length > 1 ? '<div class="chips"><button class="chip' + (est.serie === "unidade" ? " on" : "") + '" data-serie="unidade">Por unidade</button><button class="chip' + (est.serie === "rede" ? " on" : "") + '" data-serie="rede">Rede (soma)</button></div>' : "") + "</div>" + (ps.length ? grafLinhas(bk.ks.map(bk.rot), series, (x, c) => c ? curta(x) : moeda(x)) + '<div class="legenda" style="margin-top:.5rem">' + series.map((s) => '<span><i style="background:' + s.cor + '"></i>' + esc(s.nome) + "</span>").join("") + "</div>" : '<div class="vazio">Sem pedidos no período.</div>') + "</div>" +
      '<div class="cartao largo"><div class="cab"><h3>Ranking de unidades</h3></div><div style="overflow:auto"><table><thead><tr><th></th><th>Unidade</th><th class="n">Faturamento</th><th class="n">% da rede</th><th class="n">Pedidos</th><th class="n">Ticket médio</th><th class="n">Variação</th><th class="n">Clientes</th><th class="n">Avaliação</th><th class="n">Cancelamentos</th></tr></thead><tbody>' +
      porUnid.map((x, i) => { const vv = x.fatA ? (x.ru.fat - x.fatA) / x.fatA * 100 : null; return '<tr><td><span class="pos' + (i === 0 ? " p1" : "") + '">' + (i + 1) + 'º</span></td><td><b>' + esc(x.u.nome) + '</b><div class="mini">' + esc(x.u.cidade) + '</div></td><td class="n">' + moeda(x.ru.fat) + '</td><td class="n">' + pct(r.fat ? x.ru.fat / r.fat * 100 : 0) + '</td><td class="n">' + num(x.ru.n) + '</td><td class="n">' + moeda(x.ru.ticket) + '</td><td class="n" style="color:' + (vv == null ? "inherit" : vv >= 0 ? "var(--ok)" : "var(--red)") + '">' + (vv == null ? "—" : (vv >= 0 ? "▲ " : "▼ ") + pct(Math.abs(vv))) + '</td><td class="n">' + num(x.ru.clientes) + '</td><td class="n">' + (x.ru.nota ? x.ru.nota.toFixed(1).replace(".", ",") + " ★" : "—") + '</td><td class="n">' + pct(x.cancPct) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Vendas por categoria</h3><p class="mini">valor dos itens vendidos, sem taxa de entrega e antes dos descontos</p></div></div>' + rankingCategorias(ps) + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Top 10 produtos</h3><div class="chips"><button class="chip' + (est.topModo === "valor" ? " on" : "") + '" data-top="valor">Faturamento</button><button class="chip' + (est.topModo === "qtd" ? " on" : "") + '" data-top="qtd">Quantidade</button></div></div>' + (top.length ? hbar(top.map((t) => ({ nome: t.nome, v: est.topModo === "valor" ? t.valor : t.qtd })), (l) => est.topModo === "valor" ? moeda(l.v) : num(l.v) + " un.") : '<div class="vazio">Sem vendas.</div>') + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Como o cliente compra</h3></div><p class="mini">Modalidade (' + num(nEnt) + " entregas · " + num(ps.length - nEnt) + " retiradas)</p>" + split(ent, ret, "Entrega", "Retirada", "#B8172E", "#D69A2D", moeda) + '<p class="mini" style="margin-top:1.25rem">Pagamento (' + num(nPix) + " Pix · " + num(ps.length - nPix) + " cartão)</p>" + split(pix, car, "Pix", "Cartão", "#B8172E", "#6B4A3A", moeda) + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Melhores horários</h3><p class="mini">faturamento por hora do pedido</p></div>' + colunas(horas, curta) + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Dias da semana</h3><p class="mini">faturamento por dia</p></div>' + colunas(dias, curta) + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Cupons mais usados</h3></div>' + (cups.length ? '<table><thead><tr><th>Cupom</th><th class="n">Usos</th><th class="n">Desconto</th><th class="n">Faturamento</th></tr></thead><tbody>' + cups.map((c) => "<tr><td><b>" + esc(c.codigo) + "</b> " + (redeCods.has(c.codigo) ? '<span class="pill preparo">Rede</span>' : '<span class="pill ativo">Unidade</span>') + '</td><td class="n">' + num(c.usos) + '</td><td class="n">' + moeda(c.desc) + '</td><td class="n">' + moeda(c.fat) + "</td></tr>").join("") + "</tbody></table>" : '<div class="vazio">Nenhum cupom usado no período.</div>') + "</div>" +
      '<div class="cartao"><div class="cab"><h3>Cancelamentos</h3></div><div class="kpis" style="margin:0;grid-template-columns:repeat(3,1fr)"><div class="kpi"><div class="rotulo">Pedidos cancelados</div><div class="valor">' + num(canc.length) + '</div></div><div class="kpi"><div class="rotulo">% dos pedidos</div><div class="valor">' + pct(todosPer.length ? canc.length / todosPer.length * 100 : 0) + '</div></div><div class="kpi"><div class="rotulo">Valor perdido</div><div class="valor" style="font-size:1.25rem">' + moeda(cancV) + "</div></div></div>" +
      (us.length > 1 ? '<div style="margin-top:.75rem">' + hbar(porUnid.map((x) => ({ nome: x.u.nome, v: x.cancPct, cor: cor(x.u.id) })), (l) => pct(l.v)) + "</div>" : "") + "</div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Ticket médio ao longo do tempo</h3><p class="mini">por ' + bk.modo + " · faturamento ÷ pedidos</p></div>" + chipsSerie("Rede (média)") + "</div>" + (ps.length ? grafLinhas(bk.ks.map(bk.rot), seriesT, (x, c) => c ? "R$ " + Math.round(x) : moeda(x)) + legenda(seriesT) : '<div class="vazio">Sem pedidos no período.</div>') + "</div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Número de pedidos ao longo do tempo</h3><p class="mini">por ' + bk.modo + " · sem cancelados</p></div>" + chipsSerie() + "</div>" + (ps.length ? grafLinhas(bk.ks.map(bk.rot), seriesN, (x, c) => c ? num(x) : num(x) + " pedido" + (Math.round(x) === 1 ? "" : "s")) + legenda(seriesN) : '<div class="vazio">Sem pedidos no período.</div>') + "</div>" +
      "</div>";
    ligarFiltros(el, "dashboard"); ligarLinhas(el);
    el.querySelectorAll("[data-serie]").forEach((b) => b.addEventListener("click", () => { est.serie = b.dataset.serie; render(); }));
    el.querySelectorAll("[data-top]").forEach((b) => b.addEventListener("click", () => { est.topModo = b.dataset.top; render(); }));
  }

  // ---------- CRM · DASHBOARD ----------
  const FAIXAS = [["Até 24", 0, 24], ["25 - 34", 25, 34], ["35 - 44", 35, 44], ["45 - 54", 45, 54], ["55 - 64", 55, 64], ["Mais de 65", 65, 200]];
  const COR_FAIXA = ["#E8B4BC", "#D9909A", "#C9606F", "#B8172E", "#8E1223", "#5E0C17"];
  function anel(pctV, centro, sub1, sub2, rot, top) {
    const r = 46, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, pctV / 100));
    return '<div class="anel' + (top ? " top" : "") + '"><svg viewBox="0 0 118 118"><circle cx="59" cy="59" r="' + r + '" fill="none" stroke="#ebebeb" stroke-width="9"/><circle cx="59" cy="59" r="' + r + '" fill="none" stroke="' + (top ? "#B8172E" : "#D9909A") + '" stroke-width="9" stroke-dasharray="' + (c * f).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 59 59)" stroke-linecap="round"/><text x="59" y="55" text-anchor="middle" font-size="17" font-weight="600" fill="#3e3e3e">' + centro + '</text><text x="59" y="72" text-anchor="middle" font-size="10" fill="#717171">' + sub1 + '</text><text x="59" y="86" text-anchor="middle" font-size="10" fill="#717171">' + sub2 + '</text></svg><span class="rot">' + rot + "</span></div>";
  }
  function telaCrm(el) {
    const iv = intervalo(est.per.crm); const ps = pedidosEm(iv); const tv = ps.reduce((s, p) => s + p.totais.total, 0); const vol = ps.reduce((s, p) => s + p.itens.reduce((t, i) => t + i.qtd, 0), 0);
    // gênero e faixa etária a partir do cadastro (conta) do cliente na unidade
    const gen = {}; const fx = {}; const ordemG = ["Feminino", "Masculino", "Outro", "Não informado", "Não identificado"];
    ps.forEach((p) => {
      const c = contas[chave(p)]; const g = !c ? "Não identificado" : (c.genero && c.genero !== "Prefiro não dizer" ? c.genero : "Não informado");
      const o = gen[g] || (gen[g] = { valor: 0, peds: 0, cli: new Set() }); o.valor += p.totais.total; o.peds++; o.cli.add(chave(p));
      const idade = c ? idadeDe(c.nascimento) : null; const f = !c ? "Não identificado" : idade == null ? "Não informado" : (FAIXAS.find((x) => idade >= x[1] && idade <= x[2]) || FAIXAS[0])[0];
      const q = fx[f] || (fx[f] = { valor: 0, peds: 0 }); q.valor += p.totais.total; q.peds++;
    });
    const corG = { "Feminino": "#B8172E", "Masculino": "#D69A2D", "Outro": "#6B4A3A", "Não informado": "#9a9a9a", "Não identificado": "#cfcfcf" };
    const faixas = FAIXAS.map((f) => f[0]).concat(["Não informado", "Não identificado"]);
    // período de venda
    let itens;
    if (est.aba === "horario") { itens = []; for (let h = 8; h <= 19; h++) itens.push({ rot: h + "h às " + (h + 1) + "h", k: h, valor: 0, n: 0 }); ps.forEach((p) => { const h = new Date(p.quando).getHours(); const o = itens.find((x) => x.k === h); if (o) { o.valor += p.totais.total; o.n++; } }); }
    else if (est.aba === "dia") { itens = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => ({ rot: d, k: i, valor: 0, n: 0 })); ps.forEach((p) => { const o = itens[new Date(p.quando).getDay()]; o.valor += p.totais.total; o.n++; }); }
    else { itens = [1, 2, 3, 4, 5].map((s) => ({ rot: s + "ª semana do mês", k: s, valor: 0, n: 0 })); ps.forEach((p) => { const o = itens[Math.min(4, Math.ceil(new Date(p.quando).getDate() / 7) - 1)]; o.valor += p.totais.total; o.n++; }); }
    const maxV = Math.max(0, ...itens.map((x) => x.valor));
    let mostrados = itens; if (est.abaModo === "melhores" && est.aba === "horario") mostrados = itens.slice().sort((a, b) => b.valor - a.valor).slice(0, 6).sort((a, b) => a.k - b.k);
    // pagamento
    const pag = { Pix: { n: 0, v: 0 }, "Cartão": { n: 0, v: 0 } }; ps.forEach((p) => { const k = /pix/i.test(p.pagamento.metodo) ? "Pix" : "Cartão"; pag[k].n++; pag[k].v += p.totais.total; });

    el.innerHTML = topo("CRM", "Dashboard de clientes", "Quem compra, quando e como paga. Período: " + descPeriodo(iv) + ".") + barraFiltros("crm") +
      '<div class="cartao" style="margin-bottom:1rem"><div class="totais"><span>Valor: <b>' + moeda(tv) + "</b></span><span>Pedidos: <b>" + num(ps.length) + "</b></span><span>Volume: <b>" + num(vol) + " itens</b></span><span>Ticket médio: <b>" + moeda(ps.length ? tv / ps.length : 0) + "</b></span></div></div>" +
      '<div class="cartao" style="margin-bottom:1rem"><div class="cab"><div><h3>Ranking de vendas por categoria</h3><p class="mini">valor dos itens vendidos, sem taxa de entrega e antes dos descontos</p></div></div>' + rankingCategorias(ps) + "</div>" +
      '<div class="cartao" style="margin-bottom:1rem"><div class="cab"><div><h3>Gênero</h3><p class="mini">% do faturamento. "Não informado" = tem conta mas não preencheu; "Não identificado" = comprou sem conta no site.</p></div></div><div class="generos">' +
      ordemG.filter((g) => gen[g]).map((g) => { const o = gen[g]; const pp = tv ? o.valor / tv * 100 : 0; return '<div class="genero"><div class="mini">' + g + '</div><div class="pct" style="color:' + corG[g] + '">' + pct(pp, 2) + '</div><div class="barra"><i style="width:' + pp + "%;background:" + corG[g] + '"></i></div><div class="mini">' + num(o.cli.size) + " clientes · " + num(o.peds) + " pedidos</div><b>" + moeda(o.valor) + "</b></div>"; }).join("") + "</div></div>" +
      '<div class="cartao" style="margin-bottom:1rem"><div class="cab"><div><h3>Faixa etária</h3><p class="mini">pela data de nascimento do cadastro</p></div></div><div class="hbar" style="grid-template-columns:minmax(150px,230px) 1fr auto auto">' +
      faixas.filter((f) => fx[f]).map((f, i) => { const o = fx[f]; const pp = tv ? o.valor / tv * 100 : 0; const mx = Math.max(...Object.values(fx).map((x) => x.valor)); return '<span class="nome">' + f + ' <span class="mini">· ' + num(o.peds) + ' pedidos</span></span><span class="trilho" style="height:22px"><i style="width:' + (o.valor / mx * 100) + "%;background:" + (COR_FAIXA[FAIXAS.findIndex((x) => x[0] === f)] || "#cfcfcf") + '"></i></span><span class="val">' + pct(pp, 2) + '</span><span class="val"><b>' + moeda(o.valor) + "</b></span>"; }).join("") + "</div></div>" +
      '<div class="cartao" style="margin-bottom:1rem"><div class="cab"><h3>Período de venda</h3>' + (est.aba === "horario" ? '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem">Mostrar<select data-aba-modo style="height:2.2rem"><option value="melhores"' + (est.abaModo === "melhores" ? " selected" : "") + '>Melhores horários</option><option value="todos"' + (est.abaModo === "todos" ? " selected" : "") + ">Todos os horários</option></select></label>" : "") + '</div><div class="abas">' + [["horario", "Horário"], ["dia", "Dia da semana"], ["semana", "Semana do mês"]].map(([id, r]) => '<button class="' + (est.aba === id ? "on" : "") + '" data-aba="' + id + '">' + r + "</button>").join("") + '</div><div class="aneis">' +
      mostrados.map((x) => anel(tv ? x.valor / tv * 100 : 0, pct(tv ? x.valor / tv * 100 : 0, 2), curta(x.valor), num(x.n) + " pedidos", x.rot, x.valor === maxV && maxV > 0)).join("") + "</div></div>" +
      '<div class="cartao"><div class="cab"><h3>Formas de pagamento</h3></div><table><thead><tr><th>Forma de pagamento</th><th class="n">Pedidos</th><th class="n">Valor</th><th class="n">%</th><th class="n">Ticket médio</th></tr></thead><tbody>' +
      Object.keys(pag).map((k) => "<tr><td>" + k + '</td><td class="n">' + num(pag[k].n) + '</td><td class="n">' + moeda(pag[k].v) + '</td><td class="n">' + pct(tv ? pag[k].v / tv * 100 : 0, 2) + '</td><td class="n">' + moeda(pag[k].n ? pag[k].v / pag[k].n : 0) + "</td></tr>").join("") +
      '<tr class="total"><td>Total geral</td><td class="n">' + num(ps.length) + '</td><td class="n">' + moeda(tv) + '</td><td class="n">100%</td><td class="n">' + moeda(ps.length ? tv / ps.length : 0) + "</td></tr></tbody></table></div>";
    ligarFiltros(el, "crm");
    el.querySelectorAll("[data-aba]").forEach((b) => b.addEventListener("click", () => { est.aba = b.dataset.aba; render(); }));
    const am = el.querySelector("[data-aba-modo]"); if (am) am.addEventListener("change", () => { est.abaModo = am.value; render(); });
  }

  // ---------- CRM · CLIENTES + SEGMENTAÇÃO ----------
  const SEG_VAZIO = { inativoDias: "", pedidosMin: "", pedidosMax: "", top: "", produto: "", categoria: "", categoriaNunca: "", ticketMin: "", totalMin: "", modalidade: "", cupom: "", aniversarioMes: "", genero: "", idadeMin: "", idadeMax: "", cadastro: "", bairro: "" };
  let seg = Object.assign({}, SEG_VAZIO);
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const PRONTOS = [
    { nome: "Inativos há 45+ dias", desc: "Reativação com cupom", f: { inativoDias: "45" } },
    { nome: "Compraram só 1 vez", desc: "Converter em recorrente", f: { pedidosMax: "1" } },
    { nome: "Fiéis (5+ pedidos)", desc: "Programa VIP, novidades", f: { pedidosMin: "5" } },
    { nome: "Top 10% em gasto", desc: "Ofertas premium", f: { top: "10" } },
    { nome: "Aniversariantes do mês", desc: "Cupom de aniversário", f: { aniversarioMes: String(new Date().getMonth() + 1) } },
    { nome: "Compram Confeitaria e nunca Pizzas", desc: "Cross-sell", f: { categoria: "Confeitaria", categoriaNunca: "Pizzas" } },
    { nome: "Mulheres 25 a 45", desc: "Ex.: Dia das Mães", f: { genero: "Feminino", idadeMin: "25", idadeMax: "45" } },
    { nome: "Nunca usaram cupom", desc: "Testar sensibilidade a desconto", f: { cupom: "nunca" } }
  ];
  function clientesDe(iv) {
    const a = iv.de.toISOString(), b = iv.ate.toISOString(); const m = {}; const ultimoGeral = {};
    D.pedidos.forEach((p) => {
      if (p.status === "cancelado" || !unidOk(p.unidade)) return; const k = chave(p);
      if (!ultimoGeral[k] || p.quando > ultimoGeral[k]) ultimoGeral[k] = p.quando;
      if (p.quando < a || p.quando > b) return;
      const c = m[k] || (m[k] = { k, unidade: p.unidade, telefone: String(p.cliente.telefone).replace(/\D/g, ""), nome: p.cliente.nome, email: p.cliente.email, pedidos: [], total: 0, produtos: {}, categorias: {}, modalidades: {}, cupons: 0, bairros: {} });
      c.pedidos.push(p); c.total += p.totais.total; if (p.cupom) c.cupons++; c.modalidades[p.modalidade] = (c.modalidades[p.modalidade] || 0) + 1; if (p.bairro) c.bairros[p.bairro] = (c.bairros[p.bairro] || 0) + 1;
      p.itens.forEach((i) => { c.produtos[i.id] = (c.produtos[i.id] || 0) + i.qtd; const cat = catDe(i); c.categorias[cat] = (c.categorias[cat] || 0) + i.qtd; });
    });
    return Object.values(m).map((c) => {
      const conta = contas[c.k]; c.conta = !!conta; c.genero = conta ? conta.genero || "" : ""; c.nascimento = conta ? conta.nascimento || "" : ""; c.idade = idadeDe(c.nascimento);
      c.mesAniversario = c.nascimento ? Number(c.nascimento.slice(5, 7)) : null;
      c.n = c.pedidos.length; c.ticket = c.total / c.n; c.ultimo = ultimoGeral[c.k]; c.diasSemPedido = Math.floor((Date.now() - new Date(c.ultimo)) / 864e5);
      c.bairro = Object.keys(c.bairros).sort((x, y) => c.bairros[y] - c.bairros[x])[0] || (conta && conta.bairro) || "";
      return c;
    });
  }
  function aplicarSeg(cs, s) {
    let r = cs.filter((c) => {
      if (s.inativoDias && c.diasSemPedido < Number(s.inativoDias)) return false;
      if (s.pedidosMin && c.n < Number(s.pedidosMin)) return false;
      if (s.pedidosMax && c.n > Number(s.pedidosMax)) return false;
      if (s.produto && !c.produtos[s.produto]) return false;
      if (s.categoria && !c.categorias[s.categoria]) return false;
      if (s.categoriaNunca && c.categorias[s.categoriaNunca]) return false;
      if (s.ticketMin && c.ticket < Number(s.ticketMin)) return false;
      if (s.totalMin && c.total < Number(s.totalMin)) return false;
      if (s.bairro && c.bairro !== s.bairro) return false;
      if (s.modalidade && !((c.modalidades[s.modalidade] || 0) > 0 && Object.keys(c.modalidades).length === 1)) return false;
      if (s.cupom === "nunca" && c.cupons > 0) return false;
      if (s.cupom === "sempre" && c.cupons < c.n) return false;
      if (s.aniversarioMes && c.mesAniversario !== Number(s.aniversarioMes)) return false;
      if (s.genero && c.genero !== s.genero) return false;
      if (s.idadeMin && !(c.idade != null && c.idade >= Number(s.idadeMin))) return false;
      if (s.idadeMax && !(c.idade != null && c.idade <= Number(s.idadeMax))) return false;
      if (s.cadastro === "comconta" && !c.conta) return false;
      if (s.cadastro === "semconta" && c.conta) return false;
      return true;
    });
    if (s.top) r = r.sort((a, b) => b.total - a.total).slice(0, Math.max(1, Math.ceil(r.length * Number(s.top) / 100)));
    return r;
  }
  const segAtivo = () => Object.keys(SEG_VAZIO).some((k) => seg[k] !== "" && seg[k] != null);
  function telaClientes(el) {
    const iv = intervalo(est.per.clientes); const todos = clientesDe(iv); const res = todos;
    const q = est.buscaCli.trim().toLowerCase(); const lista = (q ? res.filter((c) => (c.nome + " " + c.email + " " + c.telefone).toLowerCase().includes(q)) : res).sort((a, b) => b.total - a.total);
    el.innerHTML = topo("CRM", "Clientes", "Clientes que compraram no período (" + descPeriodo(iv) + "). Valores do período; \"último pedido\" considera todo o histórico nas unidades escolhidas.", '<button class="btn" data-csv' + (lista.length ? "" : " disabled") + ">Exportar CSV</button>") + barraFiltros("clientes") +
      '<div class="cartao"><div class="linha" style="margin-bottom:1rem;align-items:flex-end"><label class="campo" style="flex:1">Buscar por nome, e-mail ou telefone<input data-busca value="' + esc(est.buscaCli) + '" placeholder="ex.: Ana, 44 9..."/></label><span class="mini" style="padding-bottom:.6rem">' + num(lista.length) + " de " + num(todos.length) + " clientes</span></div>" +
      (lista.length ? '<div style="overflow:auto"><table><thead><tr><th>Cliente</th><th>Unidade</th><th class="n">Pedidos</th><th class="n">Total no período</th><th class="n">Ticket</th><th>Último pedido</th><th>Perfil</th></tr></thead><tbody>' +
        lista.slice(0, est.limiteCli).map((c) => '<tr class="clicavel" data-cli="' + esc(c.k) + '"><td><b>' + esc(c.nome) + '</b><div class="mini">' + esc(fone(c.telefone)) + "</div></td><td>" + '<span style="color:' + cor(c.unidade) + '">●</span> ' + esc(R.nomeUnidade(c.unidade)) + '</td><td class="n">' + c.n + '</td><td class="n"><b>' + moeda(c.total) + '</b></td><td class="n">' + moeda(c.ticket) + "</td><td>" + fmtD(c.ultimo) + '<div class="mini">há ' + c.diasSemPedido + ' dias</div></td><td class="mini">' + (c.conta ? [c.genero || "gênero não informado", c.idade != null ? c.idade + " anos" : ""].filter(Boolean).join(" · ") : "sem conta") + "</td></tr>").join("") + "</tbody></table></div>" +
        (lista.length > est.limiteCli ? '<div style="text-align:center;margin-top:1rem"><button class="btn" data-mais>Mostrar mais (' + num(lista.length - est.limiteCli) + " restantes)</button></div>" : "")
        : '<div class="vazio">Nenhum cliente com esses filtros.</div>') + "</div>";
    ligarFiltros(el, "clientes");
    const b = el.querySelector("[data-busca]"); b.addEventListener("input", () => { est.buscaCli = b.value; est.limiteCli = 50; render(); const n = document.querySelector("[data-busca]"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    const mais = el.querySelector("[data-mais]"); if (mais) mais.addEventListener("click", () => { est.limiteCli += 100; render(); });
    el.querySelectorAll("[data-cli]").forEach((tr) => tr.addEventListener("click", () => abrirCliente(lista.find((c) => c.k === tr.dataset.cli))));
    const csv = el.querySelector("[data-csv]"); if (csv) csv.addEventListener("click", () => baixarCsv("clientes-rede.csv", [["nome", "telefone", "email", "unidade", "pedidos_no_periodo", "total_no_periodo", "ticket_medio", "ultimo_pedido", "dias_sem_pedido", "genero", "idade", "bairro", "tem_conta"]].concat(lista.map((c) => [c.nome, c.telefone, c.email, R.nomeUnidade(c.unidade), c.n, c.total.toFixed(2), c.ticket.toFixed(2), fmtD(c.ultimo), c.diasSemPedido, c.genero, c.idade ?? "", c.bairro, c.conta ? "sim" : "não"]))));
  }
  function abrirCliente(c) {
    if (!c) return; const prods = Object.keys(c.produtos).sort((a, b) => c.produtos[b] - c.produtos[a]).slice(0, 8);
    gaveta('<p class="eyebrow">Cliente · ' + esc(R.nomeUnidade(c.unidade)) + "</p><h2>" + esc(c.nome) + '</h2><p class="mini">' + esc(fone(c.telefone)) + " · " + esc(c.email || "") + "</p>" +
      '<p class="mini" style="margin-top:.35rem">' + (c.conta ? "Tem conta no site" + (c.genero ? " · " + esc(c.genero) : "") + (c.idade != null ? " · " + c.idade + " anos" : "") + (c.nascimento ? " · aniversário " + c.nascimento.slice(8, 10) + "/" + c.nascimento.slice(5, 7) : "") : "Comprou sem conta no site") + (c.bairro ? " · " + esc(c.bairro) : "") + "</p>" +
      '<div class="kpis" style="margin-top:1rem"><div class="cartao kpi"><div class="rotulo">Pedidos</div><div class="valor">' + c.n + '</div></div><div class="cartao kpi"><div class="rotulo">Total</div><div class="valor" style="font-size:1.2rem">' + moeda(c.total) + '</div></div><div class="cartao kpi"><div class="rotulo">Ticket</div><div class="valor" style="font-size:1.2rem">' + moeda(c.ticket) + "</div></div></div>" +
      '<h3 style="margin:1rem 0 .5rem;font-size:1rem">Mais comprados</h3><div class="cartao">' + prods.map((id) => { const p = window.BK && BK.produto(id); return '<div class="mini" style="display:flex;justify-content:space-between;padding:.25rem 0"><span>' + esc(p ? p.nome : id) + "</span><b>" + c.produtos[id] + " un.</b></div>"; }).join("") + "</div>" +
      '<h3 style="margin:1rem 0 .5rem;font-size:1rem">Pedidos no período</h3><div class="cartao">' + c.pedidos.slice().reverse().slice(0, 30).map((p) => '<div style="display:flex;justify-content:space-between;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--line)"><span><b>' + esc(p.numero) + '</b> <span class="mini">' + fmt(p.quando) + " · " + (p.modalidade === "entrega" ? "Entrega" : "Retirada") + " · " + esc(p.pagamento.metodo) + "</span></span><span>" + moeda(p.totais.total) + "</span></div>").join("") + (c.pedidos.length > 30 ? '<p class="mini" style="margin-top:.5rem">Mostrando os 30 mais recentes.</p>' : "") + "</div>");
  }

  // ---------- PRODUTOS (catálogo da rede + desempenho) ----------
  // O catálogo da rede é a fonte dos produtos de todas as unidades. A unidade só ativa/oculta no painel dela.
  const filtroProd = { busca: "", cat: "", sit: "", ordem: "fat" };
  const imgSrc = (p) => !p.imagem ? "../imagens/marca/logo-bread-king-CVrHv7_B.png" : p.imagem.startsWith("data:") ? p.imagem : "../" + p.imagem;
  function vendasPorProduto(ps) { const v = {}; ps.forEach((p) => p.itens.forEach((i) => { const o = v[i.id] || (v[i.id] = { qtd: 0, fat: 0, peds: 0, por: {} }); o.qtd += i.qtd; o.fat += i.qtd * i.preco; o.peds++; o.por[p.unidade] = (o.por[p.unidade] || 0) + i.qtd * i.preco; })); return v; }
  function telaProdutos(el) {
    const iv = intervalo(est.per.produtos); const ps = pedidosEm(iv); const lista = R.produtos(); const vend = vendasPorProduto(ps); const zero = { qtd: 0, fat: 0, peds: 0, por: {} };
    const totFat = lista.reduce((s, p) => s + (vend[p.id] || zero).fat, 0); const totQtd = lista.reduce((s, p) => s + (vend[p.id] || zero).qtd, 0);
    const q = semAcento(filtroProd.busca).trim();
    const vis = lista.map((p) => ({ p, v: vend[p.id] || zero })).filter(({ p, v }) => (!q || semAcento(p.nome).includes(q)) && (!filtroProd.cat || p.categoria === filtroProd.cat) && (!filtroProd.sit || (filtroProd.sit === "ativos" ? p.ativo !== false : filtroProd.sit === "inativos" ? p.ativo === false : !v.qtd)))
      .sort((a, b) => filtroProd.ordem === "fat" ? b.v.fat - a.v.fat : filtroProd.ordem === "qtd" ? b.v.qtd - a.v.qtd : filtroProd.ordem === "preco" ? b.p.preco - a.p.preco : filtroProd.ordem === "nome" ? a.p.nome.localeCompare(b.p.nome) : 0);
    const top = lista.slice().sort((a, b) => (vend[b.id] || zero).fat - (vend[a.id] || zero).fat)[0];
    const sel = (k, rot, ops) => '<label class="campo">' + rot + '<select data-fp="' + k + '">' + ops.map((o) => '<option value="' + esc(o[0]) + '"' + (filtroProd[k] === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>").join("") + "</select></label>";
    el.innerHTML = topo("Catálogo", "Produtos", "", '<button class="btn primario" data-novo-prod>' + ic("plus") + "Novo produto</button>") + barraFiltros("produtos") +
      '<div class="kpis">' + kpi("Produtos no catálogo", num(lista.length), '<div class="sub">' + num(lista.filter((p) => p.ativo !== false).length) + " ativos · " + num(lista.filter((p) => p.ativo === false).length) + " desativados</div>") + kpi("Itens vendidos", num(totQtd), '<div class="sub">no período</div>') + kpi("Faturamento em produtos", moeda(totFat), '<div class="sub">valor dos itens, sem taxa</div>') + kpi("Mais vendido", top && vend[top.id] ? '<span style="font-size:1rem">' + esc(top.nome) + "</span>" : "—", top && vend[top.id] ? '<div class="sub">' + moeda(vend[top.id].fat) + "</div>" : "") + "</div>" +
      '<div class="cartao"><div class="linha" style="margin-bottom:1rem"><label class="campo" style="flex:2">Buscar produto<input data-fp="busca" value="' + esc(filtroProd.busca) + '" placeholder="nome do produto"/></label>' + sel("cat", "Categoria", [["", "Todas"]].concat(BK.CATEGORIAS.map((c) => [c, c]))) + sel("sit", "Situação", [["", "Todos"], ["ativos", "Ativos"], ["inativos", "Desativados"], ["semvenda", "Sem vendas no período"]]) + sel("ordem", "Ordenar por", [["fat", "Faturamento"], ["qtd", "Quantidade vendida"], ["preco", "Preço"], ["nome", "Nome"], ["catalogo", "Ordem do cardápio"]]) + "</div>" +
      (vis.length ? '<div style="overflow:auto"><table><thead><tr><th></th><th>Produto</th><th>Categoria</th><th class="n">Preço</th><th>Unidades</th><th class="n">Vendidos</th><th class="n">Faturamento</th><th class="n">% do total</th><th>Situação</th><th></th></tr></thead><tbody>' +
        vis.map(({ p, v }) => '<tr class="clicavel" data-prod="' + esc(p.id) + '"><td><img class="thumb" src="' + esc(imgSrc(p)) + '" onerror="this.src=\'../imagens/marca/logo-bread-king-CVrHv7_B.png\'" alt=""/></td><td><b>' + esc(p.nome) + '</b><div class="mini">' + esc(p.peso || "") + "</div></td><td>" + esc(p.categoria) + '</td><td class="n">' + moeda(p.preco) + '</td><td class="mini">' + esc(nomesUnid(p.unidades)) + '</td><td class="n">' + num(v.qtd) + '</td><td class="n"><b>' + moeda(v.fat) + '</b></td><td class="n">' + pct(totFat ? v.fat / totFat * 100 : 0, 2) + "</td><td>" + (p.ativo === false ? '<span class="pill inativo">Desativado</span>' : '<span class="pill ativo">Ativo</span>') + (p.destaque ? ' <span class="pill destaque">Destaque</span>' : "") + '</td><td style="white-space:nowrap"><button class="btn pequeno" data-toggle-prod="' + esc(p.id) + '">' + (p.ativo === false ? "Ativar" : "Desativar") + "</button></td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Nenhum produto com esses filtros.</div>') + "</div>" +
      '<p class="mini" style="margin-top:.75rem">Produtos daqui são o cardápio de todas as unidades escolhidas. No painel da unidade eles aparecem travados: a unidade só pode ocultar ou ativar no site dela. "Desativar" aqui tira o produto de todas as unidades.</p>';
    ligarFiltros(el, "produtos");
    el.querySelectorAll("[data-fp]").forEach((i) => i.addEventListener(i.tagName === "INPUT" ? "input" : "change", () => { filtroProd[i.dataset.fp] = i.value; render(); if (i.tagName === "INPUT") { const n = document.querySelector('[data-fp="busca"]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }));
    el.querySelector("[data-novo-prod]").addEventListener("click", () => editarProduto(null));
    el.querySelectorAll("[data-prod]").forEach((tr) => tr.addEventListener("click", (e) => { if (e.target.closest("[data-toggle-prod]")) return; editarProduto(tr.dataset.prod); }));
    el.querySelectorAll("[data-toggle-prod]").forEach((b) => b.addEventListener("click", () => { const p = R.produtos().find((x) => x.id === b.dataset.toggleProd); p.ativo = p.ativo === false; R.salvarProduto(p); toast(p.ativo ? "Produto ativado na rede." : "Produto desativado em todas as unidades."); }));
  }
  function linhaComboRede(x) {
    const ops = R.produtos().filter((q) => q.categoria !== "Combos").map((q) => '<option value="' + esc(q.id) + '"' + (x && x.id === q.id ? " selected" : "") + ">" + esc(q.nome) + " — " + moeda(q.preco) + "</option>").join("");
    return '<div class="linha item-combo" style="margin-bottom:.4rem;align-items:center;flex-wrap:nowrap"><select data-ci style="flex:1;min-width:0;height:2.4rem;border:1px solid var(--line2);border-radius:4px;padding:0 .5rem"><option value="">— produto —</option>' + ops + '</select><input data-cq type="number" min="1" max="20" value="' + (x ? x.qtd : 1) + '" style="width:4.5rem;height:2.4rem;border:1px solid var(--line2);border-radius:4px;padding:0 .5rem"/><button type="button" class="btn pequeno perigo" data-rm-combo>' + ic("x") + "</button></div>";
  }
  function editarProduto(id) {
    const p = id ? Object.assign({}, R.produtos().find((x) => x.id === id)) : { id: "", nome: "", categoria: BK.CATEGORIAS[1], peso: "", descricao: "", preco: 0, destaque: false, ativo: true, imagem: "", unidades: [] };
    const iv = intervalo(est.per.produtos); const v = id ? vendasPorProduto(pedidosEm(iv))[id] : null;
    const g = gaveta('<p class="eyebrow">Catálogo da rede</p><h2>' + (id ? esc(p.nome) : "Novo produto") + "</h2>" +
      (id ? '<div class="cartao" style="margin-top:1rem"><div class="cab" style="margin-bottom:.5rem"><h3>Vendas no período</h3><span class="mini">' + descPeriodo(iv) + "</span></div>" + (v ? '<p style="margin:0 0 .75rem"><b>' + num(v.qtd) + "</b> vendidos · <b>" + moeda(v.fat) + "</b> · " + num(v.peds) + " pedidos</p>" + hbar(unidadesSel().map((u) => ({ nome: u.nome, v: v.por[u.id] || 0, cor: cor(u.id) })), (l) => moeda(l.v)) : '<p class="mini">Sem vendas no período nas unidades escolhidas.</p>') + "</div>" : "") +
      '<form id="fprod" style="display:grid;gap:.85rem;margin-top:1rem">' +
      '<label class="campo">Nome<input name="nome" required value="' + esc(p.nome) + '"/></label>' +
      '<div class="grade2"><label class="campo">Categoria<select name="categoria">' + BK.CATEGORIAS.map((c) => "<option" + (p.categoria === c ? " selected" : "") + ">" + c + "</option>").join("") + '</select></label><label class="campo">Peso / quantidade<input name="peso" value="' + esc(p.peso || "") + '" placeholder="ex.: 800g ou C/12 un"/></label></div>' +
      '<div class="grade2"><label class="campo">Preço (R$)<input name="preco" type="number" step="0.01" min="0" required value="' + p.preco + '"/></label><label class="campo">Situação na rede<select name="ativo"><option value="1"' + (p.ativo !== false ? " selected" : "") + '>Ativo</option><option value="0"' + (p.ativo === false ? " selected" : "") + ">Desativado</option></select></label></div>" +
      '<label class="campo">Descrição<textarea name="descricao">' + esc(p.descricao || "") + "</textarea></label>" +
      '<div class="campo">Disponível nas unidades' + checksUnidades(p.unidades) + "</div>" +
      '<div class="campo"><span>Foto</span><div class="linha" style="align-items:center"><img class="thumb" id="prev-foto" src="' + esc(imgSrc(p)) + '" alt=""/><input type="file" accept="image/*" id="foto" style="height:auto;padding:.4rem;flex:1"/></div><input name="imagem" value="' + esc(p.imagem && !p.imagem.startsWith("data:") ? p.imagem : "") + '" placeholder="ou caminho: imagens/produtos/arquivo.jpg"/></div>' +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="destaque" style="height:auto"' + (p.destaque ? " checked" : "") + "/> Marcar como Destaque</label>" +
      '<div id="bloco-combo" class="' + (p.categoria === "Combos" ? "" : "hidden") + '"><p class="eyebrow" style="margin:.25rem 0 .4rem">Composição do combo</p><div id="itens-combo">' + (p.combo || []).map(linhaComboRede).join("") + '</div><button type="button" class="btn pequeno" data-add-combo>' + ic("plus") + 'Adicionar item</button><p class="mini" id="soma-combo" style="margin-top:.4rem"></p></div>' +
      '<div class="linha" style="justify-content:space-between;margin-top:.25rem">' + (id ? '<button type="button" class="btn perigo" data-excluir-prod>Excluir do catálogo</button>' : "<span></span>") + '<span class="linha"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Salvar e publicar</button></span></div></form>');
    const unidades = ligarChecks(g); let dataUrl = p.imagem && p.imagem.startsWith("data:") ? p.imagem : null;
    g.querySelector("#foto").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const r = Math.min(1, 800 / Math.max(img.width, img.height)); c.width = img.width * r; c.height = img.height * r; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); dataUrl = c.toDataURL("image/jpeg", 0.85); g.querySelector("#prev-foto").src = dataUrl; }; img.src = URL.createObjectURL(f); });
    const bloco = g.querySelector("#bloco-combo"); const soma = () => { let t = 0; g.querySelectorAll(".item-combo").forEach((l) => { const q = R.produtos().find((x) => x.id === l.querySelector("[data-ci]").value); if (q) t += q.preco * (Number(l.querySelector("[data-cq]").value) || 1); }); g.querySelector("#soma-combo").textContent = t ? "Soma dos itens avulsos: " + moeda(t) : ""; };
    g.querySelector('[name="categoria"]').addEventListener("change", (e) => bloco.classList.toggle("hidden", e.target.value !== "Combos"));
    g.querySelector("[data-add-combo]").addEventListener("click", () => g.querySelector("#itens-combo").insertAdjacentHTML("beforeend", linhaComboRede(null)));
    g.addEventListener("click", (e) => { const r = e.target.closest("[data-rm-combo]"); if (r) { r.closest(".item-combo").remove(); soma(); } });
    g.addEventListener("change", (e) => { if (e.target.matches("[data-ci],[data-cq]")) soma(); }); soma();
    const ex = g.querySelector("[data-excluir-prod]"); if (ex) ex.addEventListener("click", () => { if (confirm('Excluir "' + p.nome + '" do catálogo? Ele some do site de todas as unidades. (Pra só tirar temporariamente, use Desativar.)')) { R.excluirProduto(p.id); fecharGaveta(); toast("Produto excluído do catálogo."); } });
    g.querySelector("#fprod").addEventListener("submit", (e) => {
      e.preventDefault(); const d = new FormData(e.target); const nome = d.get("nome").trim();
      let novoId = p.id; if (!novoId) { const b = BK.slug(nome) || "produto"; novoId = b; let k = 1; while (R.produtos().some((x) => x.id === novoId)) novoId = b + "-" + (++k); }
      const combo = d.get("categoria") === "Combos" ? [...g.querySelectorAll(".item-combo")].map((l) => ({ id: l.querySelector("[data-ci]").value, qtd: Number(l.querySelector("[data-cq]").value) || 1 })).filter((x) => x.id) : undefined;
      R.salvarProduto({ id: novoId, nome, categoria: d.get("categoria"), peso: d.get("peso").trim(), descricao: d.get("descricao").trim(), preco: Number(d.get("preco")), destaque: !!d.get("destaque"), ativo: d.get("ativo") === "1", imagem: dataUrl || d.get("imagem").trim() || (p.imagem && !p.imagem.startsWith("data:") ? p.imagem : "") || "", unidades: unidades(), combo });
      fecharGaveta(); toast("Produto salvo e publicado nas unidades."); render();
    });
  }

  // ---------- CURVA ABC ----------
  // A = itens que somam 80% da receita; B = os próximos 15%; C = os últimos 5%.
  let abcTipo = "produtos";
  function telaAbc(el) {
    const iv = intervalo(est.per.abc); const ps = pedidosEm(iv); const tot = {};
    if (abcTipo === "produtos") ps.forEach((p) => p.itens.forEach((i) => { const o = tot[i.id] || (tot[i.id] = { nome: i.nome, extra: catDe(i), qtd: 0, valor: 0 }); o.qtd += i.qtd; o.valor += i.qtd * i.preco; }));
    else if (abcTipo === "categorias") ps.forEach((p) => p.itens.forEach((i) => { const c = catDe(i); const o = tot[c] || (tot[c] = { nome: c, extra: "", qtd: 0, valor: 0 }); o.qtd += i.qtd; o.valor += i.qtd * i.preco; }));
    else ps.forEach((p) => { const k = chave(p); const o = tot[k] || (tot[k] = { nome: p.cliente.nome, extra: R.nomeUnidade(p.unidade), unidade: p.unidade, qtd: 0, valor: 0 }); o.qtd++; o.valor += p.totais.total; });
    const lista = Object.values(tot).sort((a, b) => b.valor - a.valor); const total = lista.reduce((s, x) => s + x.valor, 0); let acum = 0;
    lista.forEach((x) => { acum += x.valor; x.pct = total ? x.valor / total * 100 : 0; x.acum = total ? acum / total * 100 : 0; x.classe = x.acum - x.pct < 80 ? "A" : x.acum - x.pct < 95 ? "B" : "C"; });
    const res = ["A", "B", "C"].map((c) => { const l = lista.filter((x) => x.classe === c); return { c, n: l.length, v: l.reduce((s, x) => s + x.valor, 0) }; });
    const nomeTipo = { produtos: ["produto", "produtos", "Produto", "Categoria"], clientes: ["cliente", "clientes", "Cliente", "Unidade"], categorias: ["categoria", "categorias", "Categoria", ""] }[abcTipo];
    const corC = { A: "#B8172E", B: "#D69A2D", C: "#9a9a9a" };
    el.innerHTML = topo("Relatórios", "Curva ABC", "", '<button class="btn" data-csv-abc' + (lista.length ? "" : " disabled") + ">Exportar CSV</button>") + barraFiltros("abc") +
      '<div class="cartao" style="margin-bottom:1rem"><div class="cab" style="margin:0"><div class="chips">' + [["produtos", "Produtos"], ["categorias", "Categorias"], ["clientes", "Clientes"]].map(([id, r]) => '<button class="chip' + (abcTipo === id ? " on" : "") + '" data-tipo="' + id + '">' + r + "</button>").join("") + '</div><span class="mini">A = somam 80% da receita · B = próximos 15% · C = últimos 5%</span></div></div>' +
      '<div class="kpis">' + res.map((r) => '<div class="cartao kpi"><div class="rotulo"><span style="color:' + corC[r.c] + '">●</span> Classe ' + r.c + '</div><div class="valor">' + num(r.n) + " <small>" + (r.n === 1 ? nomeTipo[0] : nomeTipo[1]) + '</small></div><div class="sub">' + moeda(r.v) + " · " + pct(total ? r.v / total * 100 : 0) + " da receita · " + pct(lista.length ? r.n / lista.length * 100 : 0) + " dos " + nomeTipo[1] + "</div></div>").join("") + "</div>" +
      (lista.length ? '<div class="cartao" style="margin-bottom:1rem"><div class="cab"><h3>Concentração da receita</h3><span class="mini">' + num(lista.length) + " " + nomeTipo[1] + " · " + moeda(total) + '</span></div><div class="split" style="height:18px">' + res.map((r) => '<i title="Classe ' + r.c + '" style="width:' + (total ? r.v / total * 100 : 0) + "%;background:" + corC[r.c] + '"></i>').join("") + '</div><div class="split" style="height:18px;margin-top:.25rem">' + res.map((r) => '<i title="Classe ' + r.c + '" style="width:' + (lista.length ? r.n / lista.length * 100 : 0) + "%;background:" + corC[r.c] + ';opacity:.55"></i>').join("") + '</div><div class="legenda"><span>Barra de cima: % da receita</span><span>Barra de baixo: % dos ' + nomeTipo[1] + "</span>" + res.map((r) => '<span><i style="background:' + corC[r.c] + '"></i>Classe ' + r.c + "</span>").join("") + "</div></div>" : "") +
      '<div class="cartao">' + (lista.length ? '<div style="overflow:auto"><table><thead><tr><th>#</th><th>' + nomeTipo[2] + "</th>" + (nomeTipo[3] ? "<th>" + nomeTipo[3] + "</th>" : "") + '<th class="n">' + (abcTipo === "clientes" ? "Pedidos" : "Qtd") + '</th><th class="n">Receita</th><th class="n">%</th><th class="n">% acum.</th><th>Classe</th></tr></thead><tbody>' +
        lista.slice(0, est.limiteAbc).map((x, i) => "<tr><td>" + (i + 1) + "</td><td><b>" + esc(x.nome) + "</b></td>" + (nomeTipo[3] ? "<td>" + (x.unidade ? '<span style="color:' + cor(x.unidade) + '">●</span> ' : "") + esc(x.extra) + "</td>" : "") + '<td class="n">' + num(x.qtd) + '</td><td class="n">' + moeda(x.valor) + '</td><td class="n">' + pct(x.pct, 2) + '</td><td class="n">' + pct(x.acum) + '</td><td><span class="pill" style="background:' + corC[x.classe] + ';color:#fff">' + x.classe + "</span></td></tr>").join("") + "</tbody></table></div>" + (lista.length > est.limiteAbc ? '<div style="text-align:center;margin-top:1rem"><button class="btn" data-mais-abc>Mostrar mais (' + num(lista.length - est.limiteAbc) + " restantes)</button></div>" : "") : '<div class="vazio">Sem vendas no período.</div>') + "</div>";
    ligarFiltros(el, "abc");
    el.querySelectorAll("[data-tipo]").forEach((b) => b.addEventListener("click", () => { abcTipo = b.dataset.tipo; est.limiteAbc = 100; render(); }));
    const mais = el.querySelector("[data-mais-abc]"); if (mais) mais.addEventListener("click", () => { est.limiteAbc += 200; render(); });
    const csv = el.querySelector("[data-csv-abc]"); if (csv) csv.addEventListener("click", () => baixarCsv("curva-abc-" + abcTipo + ".csv", [["posicao", nomeTipo[0]].concat(nomeTipo[3] ? [nomeTipo[3].toLowerCase()] : []).concat([abcTipo === "clientes" ? "pedidos" : "quantidade", "receita", "pct", "pct_acumulado", "classe"])].concat(lista.map((x, i) => [i + 1, x.nome].concat(nomeTipo[3] ? [x.extra] : []).concat([x.qtd, x.valor.toFixed(2), x.pct.toFixed(2), x.acum.toFixed(1), x.classe])))));
  }

  // ---------- seletor de unidades dos formulários (cupons e modelos) ----------
  function checksUnidades(sel) { const todas = !sel || !sel.length; return '<div class="unid-checks" data-checks><label class="' + (todas ? "on" : "") + '"><input type="checkbox" value="*"' + (todas ? " checked" : "") + "/> Todas as unidades</label>" + R.UNIDADES.map((u) => '<label class="' + (!todas && sel.includes(u.id) ? "on" : "") + '"><input type="checkbox" value="' + u.id + '"' + (!todas && sel.includes(u.id) ? " checked" : "") + "/> " + esc(u.nome) + "</label>").join("") + "</div>"; }
  function ligarChecks(g) {
    const box = g.querySelector("[data-checks]"); const sync = () => box.querySelectorAll("label").forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
    box.addEventListener("change", (e) => { const v = e.target.value; const todas = box.querySelector('input[value="*"]'); const us = [...box.querySelectorAll('input:not([value="*"])')];
      if (v === "*") { if (todas.checked) us.forEach((i) => (i.checked = false)); else todas.checked = true; }
      else { todas.checked = false; const marc = us.filter((i) => i.checked); if (!marc.length || marc.length === us.length) { todas.checked = true; us.forEach((i) => (i.checked = false)); } }
      sync(); });
    return () => { const todas = box.querySelector('input[value="*"]').checked; return todas ? [] : [...box.querySelectorAll('input:not([value="*"]):checked')].map((i) => i.value); };
  }
  const nomesUnid = (l) => !l || !l.length ? "Todas as unidades" : l.map(R.nomeUnidade).join(", ");

  // ---------- CRM · SEGMENTAÇÃO (mesmo formato da tela da unidade) ----------
  let pubEdit = null, pubEditNome = "";
  const resumoFiltros = (f) => { const n = Object.keys(f || {}).filter((k) => f[k] !== "" && f[k] != null).length; return n + " filtro" + (n === 1 ? "" : "s"); };
  function telaSegmentos(el) {
    const iv = intervalo(est.per.segmentos); const todos = clientesDe(iv); const res = aplicarSeg(todos, seg).sort((a, b) => b.total - a.total);
    const salvos = R.publicos(); if (pubEdit && !salvos.some((p) => p.id === pubEdit)) pubEdit = null;
    const editando = pubEdit ? salvos.find((p) => p.id === pubEdit) : null;
    const prods = window.BK ? BK.produtos() : []; const cats = window.BK ? BK.CATEGORIAS : [];
    const bairros = [...new Set(unidadesSel().flatMap((u) => u.bairros))].sort();
    const sel = (nome, rot, ops) => '<label class="campo">' + rot + '<select data-s="' + nome + '"><option value="">—</option>' + ops.map((o) => '<option value="' + esc(o[0]) + '"' + (String(seg[nome]) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>").join("") + "</select></label>";
    const inp = (nome, rot, ph) => '<label class="campo">' + rot + '<input data-s="' + nome + '" type="number" min="0" value="' + esc(seg[nome]) + '" placeholder="' + (ph || "") + '"/></label>';
    const totalRes = res.reduce((s, c) => s + c.total, 0);
    el.innerHTML = topo("CRM", "Segmentação", "", '<button class="btn" data-limpar>Limpar filtros</button>') + barraFiltros("segmentos", true) +
      '<div class="cartao" style="margin-bottom:1rem"><p class="eyebrow" style="margin-bottom:.5rem">Públicos salvos</p>' +
      (salvos.length ? '<div class="lista-seg">' + salvos.map((s) => '<div class="card-seg salvo' + (pubEdit === s.id ? " editando" : "") + '" data-salvo="' + s.id + '"><b>' + esc(s.nome) + '</b><span class="mini">' + esc(nomesUnid(s.unidades)) + " · " + resumoFiltros(s.f) + " · " + (s.editadoEm ? "editado em " + fmtD(s.editadoEm) : "salvo em " + fmtD(s.criadoEm)) + '</span><span class="acoes-seg"><button type="button" class="btn pequeno" data-editar-pub="' + s.id + '">Editar</button><button type="button" class="btn pequeno perigo" data-del-pub="' + s.id + '">Excluir</button></span></div>').join("") + "</div>"
        : '<p class="mini">Nenhum público salvo ainda. Monte os filtros abaixo e clique em "Salvar público".</p>') + "</div>" +
      '<div class="cartao" style="margin-bottom:1rem"><p class="eyebrow" style="margin-bottom:.5rem">Públicos prontos</p><div class="lista-seg">' + PRONTOS.map((s, i) => '<div class="card-seg" data-pronto="' + i + '"><b>' + esc(s.nome) + '</b><span class="mini">' + esc(s.desc) + "</span></div>").join("") + "</div></div>" +
      '<div class="cartao">' +
      (editando ? '<div class="aviso-edicao"><div><b>Editando o público “' + esc(editando.nome) + '”</b><span class="mini">Ajuste o nome, as unidades (no filtro lá em cima) e os filtros. Depois clique em Salvar alterações.</span></div><label class="campo">Nome do público<input data-nome-pub value="' + esc(pubEditNome) + '"/></label><div class="linha"><button type="button" class="btn pequeno" data-cancelar-edicao>Cancelar</button><button type="button" class="btn pequeno primario" data-salvar-edicao>Salvar alterações</button></div></div>' : "") +
      '<p class="eyebrow" style="margin-bottom:.5rem">Filtros</p><div class="grade3">' +
      '<div class="campo" style="grid-column:1/-1">Unidades (todas, uma ou várias)' + checksUnidades(est.unidades) + "</div>" +
      inp("inativoDias", "Sem pedir há (dias) ≥", "ex.: 45") + inp("pedidosMin", "Nº de pedidos ≥") + inp("pedidosMax", "Nº de pedidos ≤") +
      inp("ticketMin", "Ticket médio ≥ R$") + inp("totalMin", "Total gasto ≥ R$") + inp("top", "Top % em gasto", "ex.: 10") +
      sel("produto", "Comprou o produto", prods.map((p) => [p.id, p.nome])) + sel("categoria", "Comprou a categoria", cats.map((c) => [c, c])) + sel("categoriaNunca", "Nunca comprou a categoria", cats.map((c) => [c, c])) +
      sel("genero", "Gênero", [["Feminino", "Feminino"], ["Masculino", "Masculino"], ["Outro", "Outro"]]) + inp("idadeMin", "Idade ≥") + inp("idadeMax", "Idade ≤") +
      sel("aniversarioMes", "Aniversário no mês", MESES.map((m, i) => [String(i + 1), m])) + sel("modalidade", "Só pede por", [["entrega", "Entrega"], ["retirada", "Retirada"]]) + sel("cupom", "Cupom", [["nunca", "Nunca usou"], ["sempre", "Sempre usa"]]) +
      sel("cadastro", "Cadastro no site", [["comconta", "Tem conta"], ["semconta", "Sem conta"]]) + sel("bairro", "Bairro", bairros.map((b) => [b, b])) + "</div>" +
      '<div class="linha" style="margin-top:1rem;align-items:center"><h3 style="font-size:1.1rem">' + num(res.length) + " cliente" + (res.length === 1 ? "" : "s") + ' no público <span class="mini">· ' + moeda(totalRes) + " em compras no período</span></h3><span style=\"flex:1\"></span>" + (editando ? "" : '<button class="btn pequeno primario" data-salvar-pub' + (segAtivo() ? "" : " disabled") + ">Salvar público</button>") + '<button class="btn pequeno" data-csv-seg' + (res.length ? "" : " disabled") + ">Exportar CSV</button></div>" +
      (res.length ? '<div style="overflow:auto;margin-top:.75rem"><table><thead><tr><th>Cliente</th><th>Unidade</th><th class="n">Pedidos</th><th class="n">Total no período</th><th>Último pedido</th><th>Bairro</th></tr></thead><tbody>' +
        res.slice(0, est.limiteSeg).map((c) => '<tr class="clicavel" data-cli="' + esc(c.k) + '"><td><b>' + esc(c.nome) + '</b><div class="mini">' + esc(fone(c.telefone)) + '</div></td><td><span style="color:' + cor(c.unidade) + '">●</span> ' + esc(R.nomeUnidade(c.unidade)) + '</td><td class="n">' + c.n + '</td><td class="n">' + moeda(c.total) + "</td><td>" + fmtD(c.ultimo) + '<div class="mini">há ' + c.diasSemPedido + " dias</div></td><td>" + esc(c.bairro || "—") + "</td></tr>").join("") + "</tbody></table></div>" +
        (res.length > est.limiteSeg ? '<div style="text-align:center;margin-top:1rem"><button class="btn" data-mais>Mostrar mais (' + num(res.length - est.limiteSeg) + " restantes)</button></div>" : "")
        : '<div class="vazio">Nenhum cliente com esses filtros.</div>') + "</div>";
    ligarFiltros(el, "segmentos");
    const lerUnid = ligarChecks(el); el.querySelector("[data-checks]").addEventListener("change", () => { est.unidades = lerUnid(); est.limiteSeg = 50; render(); });
    el.querySelectorAll("[data-s]").forEach((i) => i.addEventListener("change", () => { seg[i.dataset.s] = i.value; est.limiteSeg = 50; render(); }));
    el.querySelector("[data-limpar]").addEventListener("click", () => { seg = Object.assign({}, SEG_VAZIO); render(); });
    el.querySelectorAll("[data-pronto]").forEach((d) => d.addEventListener("click", () => { seg = Object.assign({}, SEG_VAZIO, PRONTOS[Number(d.dataset.pronto)].f); est.limiteSeg = 50; render(); }));
    // card: aplica o público; Editar: abre a edição; Excluir: remove
    el.querySelectorAll("[data-salvo]").forEach((d) => d.addEventListener("click", (e) => { if (e.target.closest("button")) return; const s = salvos.find((x) => x.id === d.dataset.salvo); seg = Object.assign({}, SEG_VAZIO, s.f); est.unidades = (s.unidades || []).slice(); render(); }));
    el.querySelectorAll("[data-editar-pub]").forEach((b) => b.addEventListener("click", () => { const s = salvos.find((x) => x.id === b.dataset.editarPub); pubEdit = s.id; pubEditNome = s.nome; seg = Object.assign({}, SEG_VAZIO, s.f); est.unidades = (s.unidades || []).slice(); render(); }));
    el.querySelectorAll("[data-del-pub]").forEach((b) => b.addEventListener("click", () => { const s = salvos.find((x) => x.id === b.dataset.delPub); if (confirm("Excluir o público “" + s.nome + "”?")) { if (pubEdit === s.id) pubEdit = null; R.excluirPublico(s.id); toast("Público excluído."); } }));
    const nomePub = el.querySelector("[data-nome-pub]"); if (nomePub) nomePub.addEventListener("input", () => { pubEditNome = nomePub.value; });
    const canc = el.querySelector("[data-cancelar-edicao]"); if (canc) canc.addEventListener("click", () => { pubEdit = null; render(); });
    const salvEd = el.querySelector("[data-salvar-edicao]"); if (salvEd) salvEd.addEventListener("click", () => { const nome = pubEditNome.trim() || editando.nome; pubEdit = null; R.salvarPublico(Object.assign({}, editando, { nome, f: Object.assign({}, seg), unidades: est.unidades.slice(), editadoEm: new Date().toISOString(), clientesNaHora: res.length })); toast("Público “" + nome + "” atualizado."); });
    const salvar = el.querySelector("[data-salvar-pub]"); if (salvar) salvar.addEventListener("click", () => { const nome = prompt("Nome do público:"); if (!nome) return; R.salvarPublico({ id: "pub-" + Date.now().toString(36), nome: nome.trim(), f: Object.assign({}, seg), unidades: est.unidades.slice(), criadoEm: new Date().toISOString(), clientesNaHora: res.length }); toast("Público salvo."); });
    const mais = el.querySelector("[data-mais]"); if (mais) mais.addEventListener("click", () => { est.limiteSeg += 100; render(); });
    el.querySelectorAll("[data-cli]").forEach((tr) => tr.addEventListener("click", () => abrirCliente(res.find((c) => c.k === tr.dataset.cli))));
    const csv = el.querySelector("[data-csv-seg]"); if (csv) csv.addEventListener("click", () => baixarCsv("publico-rede.csv", [["nome", "telefone", "email", "unidade", "pedidos_no_periodo", "total_no_periodo", "ultimo_pedido", "dias_sem_pedido", "bairro"]].concat(res.map((c) => [c.nome, c.telefone, c.email, R.nomeUnidade(c.unidade), c.n, c.total.toFixed(2), fmtD(c.ultimo), c.diasSemPedido, c.bairro]))));
  }

  // ---------- REDE · UNIDADES (dados fixos que o painel da unidade só consulta) ----------
  const DIAS_SEM = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  function telaUnidades(el) {
    const t = R.unidadesDados(); const iv = intervalo({ preset: "30d" }); const ps = D.pedidos.filter((p) => p.status !== "cancelado" && p.quando >= iv.de.toISOString());
    el.innerHTML = topo("Rede", "Unidades") +
      '<div class="grade-unid">' + R.UNIDADES.map((u) => { const d = t[u.id] || {}; const pu = ps.filter((p) => p.unidade === u.id); const fat = pu.reduce((s, p) => s + p.totais.total, 0);
        return '<div class="cartao unid"><div class="linha" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div><p class="eyebrow" style="color:' + cor(u.id) + '">● ' + esc(d.cidade || u.cidade) + "</p><h3>" + esc(d.nomeCompleto || "Bread King " + u.nome) + '</h3></div><button class="btn pequeno" data-editar-unid="' + u.id + '">Editar</button></div>' +
          '<div class="mini" style="margin-top:.6rem;display:grid;gap:.3rem"><span>' + ic("map-pin") + " " + esc([d.endereco, d.bairro].filter(Boolean).join(" · ") || "—") + "</span><span>" + ic("phone") + " " + esc(d.whatsappFormatado || "—") + "</span><span>" + ic("clock") + " " + esc(d.horario || "—") + "</span>" + (d.cnpj ? "<span>CNPJ " + esc(d.cnpj) + "</span>" : "") + "</div>" +
          '<div class="totais" style="margin-top:.8rem"><span>30 dias: <b>' + moeda(fat) + "</b></span><span><b>" + num(pu.length) + "</b> pedidos</span><span><b>" + num(u.id === "palhoca" && window.UNIDADE ? (window.UNIDADE.taxasEntrega || []).length : u.bairros.length) + "</b> bairros de entrega</span></div></div>";
      }).join("") + "</div>";
    el.querySelectorAll("[data-editar-unid]").forEach((b) => b.addEventListener("click", () => editarUnidade(b.dataset.editarUnid)));
  }
  function editarUnidade(id) {
    const d = Object.assign({}, R.unidadesDados()[id]); const hs = d.horarios || {};
    const campo = (nome, rot, extra) => '<label class="campo">' + rot + '<input name="' + nome + '" value="' + esc(d[nome] || "") + '"' + (extra || "") + "/></label>";
    const g = gaveta('<p class="eyebrow">Unidade</p><h2>' + esc(d.nomeCompleto || R.nomeUnidade(id)) + '</h2><form id="funid" style="display:grid;gap:.85rem;margin-top:1rem">' +
      '<p class="eyebrow" style="margin-top:.25rem">Identificação</p><div class="grade2">' + campo("nome", "Nome da unidade", " required") + campo("nomeCompleto", "Nome completo (aparece no site)", " required") + campo("razaoSocial", "Razão social") + campo("cnpj", "CNPJ") + "</div>" +
      '<p class="eyebrow" style="margin-top:.25rem">Contato</p><div class="grade2">' + campo("whatsappFormatado", "WhatsApp", ' placeholder="(48) 99999-9999" required') + campo("email", "E-mail") + campo("instagramUsuario", "Instagram", ' placeholder="@breadking..."') + campo("site", "Site") + "</div>" +
      '<p class="eyebrow" style="margin-top:.25rem">Endereço</p><div class="grade2">' + campo("endereco", "Rua e número", " required") + campo("bairro", "Bairro") + campo("cidade", "Cidade, UF", ' placeholder="Palhoça, SC"') + "</div>" +
      '<p class="eyebrow" style="margin-top:.25rem">Funcionamento</p>' + campo("horario", "Horário (texto que aparece no site)", ' placeholder="Todos os dias: 08h às 20h"') +
      '<div class="horarios-ed">' + DIAS_SEM.map((dia, i) => '<label class="campo">' + dia + '<input data-dia="' + i + '" value="' + esc((hs[i] || []).join(", ")) + '" placeholder="fechado"/></label>').join("") + '</div><p class="mini">Formato 08:00-20:00. Dois turnos: 08:00-12:00, 14:00-19:00. Vazio = fechado. O site usa isso pra mostrar Aberto/Fechado.</p>' +
      '<label class="campo">Sobre a loja<textarea name="sobre">' + esc(d.sobre || "") + "</textarea></label>" +
      '<p class="mini" id="erro-unid" style="color:var(--red)"></p><div class="linha" style="justify-content:flex-end"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Salvar e publicar</button></div></form>');
    g.querySelector("#funid").addEventListener("submit", (e) => {
      e.preventDefault(); const f = new FormData(e.target); const erro = g.querySelector("#erro-unid"); const horarios = {}; let ruim = "";
      g.querySelectorAll("[data-dia]").forEach((i) => { const v = i.value.split(",").map((x) => x.trim().replace(/\s/g, "").replace(/h/g, ":00").replace(/::/g, ":")).filter(Boolean); v.forEach((x) => { if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(x)) ruim = DIAS_SEM[i.dataset.dia] + ": “" + x + "”"; }); horarios[i.dataset.dia] = v; });
      if (ruim) { erro.textContent = "Horário fora do formato em " + ruim + ". Use 08:00-20:00."; return; }
      const fone = f.get("whatsappFormatado").trim(); const dig = fone.replace(/\D/g, "");
      if (dig.length < 10) { erro.textContent = "WhatsApp incompleto. Use DDD + número."; return; }
      const ig = f.get("instagramUsuario").trim().replace(/^@?/, "@");
      R.salvarUnidade(id, { nome: f.get("nome").trim(), nomeCompleto: f.get("nomeCompleto").trim(), razaoSocial: f.get("razaoSocial").trim(), cnpj: f.get("cnpj").trim(), whatsappFormatado: fone, whatsapp: dig.startsWith("55") ? dig : "55" + dig, email: f.get("email").trim(), instagramUsuario: ig === "@" ? "" : ig, instagram: ig === "@" ? "" : "https://instagram.com/" + ig.slice(1), site: f.get("site").trim(), endereco: f.get("endereco").trim(), bairro: f.get("bairro").trim(), cidade: f.get("cidade").trim(), horario: f.get("horario").trim(), horarios, sobre: f.get("sobre").trim() });
      fecharGaveta(); toast("Dados da unidade " + f.get("nome").trim() + " publicados."); render();
    });
  }

  // ---------- REDE · MENSAGENS AUTOMÁTICAS (status do pedido, valem pra todas as unidades) ----------
  const EVENTOS_MSG = [
    ["pago", "Pedido aceito", "Quando a loja aceita o pedido e ele vai pra Em preparo."],
    ["pronto", "Pronto pra retirada", "Só pedidos de retirada. Na entrega o cliente continua vendo Em preparo."],
    ["saiu", "Saiu pra entrega", "Quando a loja move o pedido pra Em rota."],
    ["concluido", "Pedido concluído", "Quando o pedido é finalizado."],
    ["cancelado", "Pedido recusado", "Quando a loja recusa o pedido. Use {motivo} pro motivo escolhido."]
  ];
  const VARS_AUTO = [["{nome}", "primeiro nome"], ["{numero}", "número do pedido"], ["{loja}", "nome da unidade"], ["{endereco}", "endereço da loja"], ["{total}", "valor do pedido"], ["{motivo}", "motivo da recusa"]];
  const exemploAuto = (t) => t.replace(/\{nome\}/g, "Ana").replace(/\{numero\}/g, "PAL-10234").replace(/\{loja\}/g, "Bread King Palhoça").replace(/\{endereco\}/g, "Av. Atílio Pedro Pagani, 1275").replace(/\{total\}/g, "R$ 87,40").replace(/\{motivo\}/g, "produto em falta");
  function telaMsgsAuto(el) {
    const m = R.msgsAuto();
    el.innerHTML = topo("Rede", "Mensagens automáticas", "", '<button class="btn" data-padrao>Restaurar textos padrão</button><button class="btn primario" data-salvar-auto>Salvar e publicar</button>') +
      '<div class="aviso" style="margin-bottom:1rem">Enviadas no WhatsApp do cliente quando a loja muda o status do pedido. Valem para todas as unidades. Variáveis: ' + VARS_AUTO.map((v) => "<b>" + v[0] + "</b> " + v[1]).join(" · ") + "</div>" +
      (m.rede ? "" : '<p class="mini" style="margin:-.25rem 0 1rem">Ainda não publicadas pelo Franchising. Os textos abaixo são os que as unidades usam hoje.</p>') +
      '<div style="display:grid;gap:1rem">' + EVENTOS_MSG.map(([id, rot, desc]) => '<div class="cartao msg-auto' + (m.envio[id] === false ? " off" : "") + '" data-ev="' + id + '"><div class="linha" style="justify-content:space-between;align-items:flex-start"><div><h3 style="font-size:1.05rem">' + rot + '</h3><p class="mini">' + desc + '</p></div><label class="chave"><input type="checkbox" data-envio="' + id + '"' + (m.envio[id] !== false ? " checked" : "") + '/><span></span> Enviar</label></div>' +
        '<div class="msg-auto-corpo"><label class="campo">Texto<textarea data-texto="' + id + '" style="min-height:5.5rem">' + esc(m.textos[id] || "") + '</textarea></label><div><p class="mini" style="margin-bottom:.35rem">Prévia</p><div class="balao" data-prev="' + id + '"></div></div></div></div>').join("") + "</div>";
    const prev = (id) => { el.querySelector('[data-prev="' + id + '"]').textContent = exemploAuto(el.querySelector('[data-texto="' + id + '"]').value); };
    EVENTOS_MSG.forEach(([id]) => { prev(id); el.querySelector('[data-texto="' + id + '"]').addEventListener("input", () => prev(id)); el.querySelector('[data-envio="' + id + '"]').addEventListener("change", (e) => el.querySelector('[data-ev="' + id + '"]').classList.toggle("off", !e.target.checked)); });
    el.querySelector("[data-padrao]").addEventListener("click", () => { if (!confirm("Voltar todos os textos pro padrão? (só salva quando clicar em Salvar e publicar)")) return; EVENTOS_MSG.forEach(([id]) => { el.querySelector('[data-texto="' + id + '"]').value = BK.MSGS_AUTO_PADRAO[id]; prev(id); }); });
    el.querySelector("[data-salvar-auto]").addEventListener("click", () => {
      const envio = {}, textos = {}; let vazio = "";
      EVENTOS_MSG.forEach(([id, rot]) => { envio[id] = el.querySelector('[data-envio="' + id + '"]').checked; textos[id] = el.querySelector('[data-texto="' + id + '"]').value.trim(); if (envio[id] && !textos[id]) vazio = rot; });
      if (vazio) { toast("Escreva o texto de “" + vazio + "” ou desligue o envio."); return; }
      R.salvarMsgsAuto({ envio, textos }); toast("Mensagens automáticas publicadas para todas as unidades.");
    });
  }

  // ---------- CUPONS (da rede + os que as unidades criaram) ----------
  let filtroCupom = { origem: "", unidade: "" };
  function telaCupons(el) {
    const hoje = new Date().toISOString().slice(0, 10);
    const daRede = R.cupons().map((c) => Object.assign({}, c, { origem: "rede" }));
    const dasUnid = R.cuponsUnidades().map((c) => Object.assign({}, c, { origem: "unidade" }));
    // usos: cupom da unidade conta só os pedidos dela; cupom da rede conta as unidades onde vale (e que não têm cupom próprio com o mesmo código)
    const proprio = new Set(dasUnid.map((c) => c.unidade + "|" + c.codigo));
    const usosDe = (c) => { const o = { n: 0, desc: 0, por: {} }; D.pedidos.forEach((p) => { if (!p.cupom || p.status === "cancelado" || p.cupom.codigo !== c.codigo) return; if (c.origem === "unidade" ? p.unidade !== c.unidade : (!R.vale(c, p.unidade) || proprio.has(p.unidade + "|" + c.codigo))) return; o.n++; o.desc += p.totais.desconto || 0; o.por[p.unidade] = (o.por[p.unidade] || 0) + 1; }); return o; };
    const todos = daRede.concat(dasUnid).map((c) => Object.assign(c, { usos: usosDe(c) }));
    const situacao = (c) => c.ativo === false ? ["Inativo", "inativo"] : (c.validade && hoje > c.validade) ? ["Vencido", "cancelado"] : (c.limite && c.usos.n >= c.limite) ? ["Esgotado", "cancelado"] : (c.inicio && hoje < c.inicio) ? ["Agendado", "preparo"] : ["Ativo", "ativo"];
    const vis = todos.filter((c) => (!filtroCupom.origem || c.origem === filtroCupom.origem) && (!filtroCupom.unidade || (c.origem === "unidade" ? c.unidade === filtroCupom.unidade : R.vale(c, filtroCupom.unidade))))
      .sort((a, b) => (a.origem === b.origem ? 0 : a.origem === "rede" ? -1 : 1) || a.codigo.localeCompare(b.codigo) || String(a.unidade || "").localeCompare(String(b.unidade || "")));
    const chip = (grupo, v, rot, n) => '<button class="chip' + (filtroCupom[grupo] === v ? " on" : "") + '" data-fc="' + grupo + '" data-v="' + v + '">' + rot + (n != null ? " (" + n + ")" : "") + "</button>";
    el.innerHTML = topo("Marketing", "Cupons", "", '<button class="btn primario" data-novo>' + ic("plus") + "Novo cupom da rede</button>") +
      '<div class="cartao filtros" style="margin-bottom:1rem"><div class="chips">' + chip("origem", "", "Todos", todos.length) + chip("origem", "rede", "Criados pelo Franchising", daRede.length) + chip("origem", "unidade", "Criados pelas unidades", dasUnid.length) + '</div><span class="sep"></span><div class="chips">' + chip("unidade", "", "Todas as unidades") + R.UNIDADES.map((u) => chip("unidade", u.id, u.nome)).join("") + "</div></div>" +
      '<div class="cartao">' + (vis.length ? '<div style="overflow:auto"><table><thead><tr><th>Código</th><th>Criado por</th><th>Desconto</th><th>Vale em</th><th>Validade</th><th>Regras</th><th class="n">Usos</th><th>Situação</th><th></th></tr></thead><tbody>' +
        vis.map((c) => { const [r, cl] = situacao(c); const u = c.usos; const rede = c.origem === "rede"; return "<tr><td><b>" + esc(c.codigo) + "</b>" + (c.descricao ? '<div class="mini">' + esc(c.descricao) + "</div>" : "") + "</td><td>" + (rede ? '<span class="pill preparo">Franchising</span>' : '<span class="pill ativo">Unidade</span><div class="mini" style="margin-top:.2rem"><span style="color:' + cor(c.unidade) + '">●</span> ' + esc(R.nomeUnidade(c.unidade)) + "</div>") + "</td><td>" + c.desconto + "%</td><td>" + esc(rede ? nomesUnid(c.unidades) : R.nomeUnidade(c.unidade)) + "</td><td>" + (c.inicio ? "de " + dataBR(c.inicio) + " " : "") + (c.validade ? "até " + dataBR(c.validade) : "sem validade") + '</td><td class="mini">' + [c.minimo ? "mínimo " + moeda(c.minimo) : "", c.umPorCliente ? "1 por cliente" : "", c.limite ? "máx. " + c.limite + " usos" : "", c.exigeLogin ? "precisa de conta" : "", c.primeiraCompra ? "primeira compra" : ""].filter(Boolean).join(" · ") + '</td><td class="n" title="' + esc(Object.keys(u.por).map((k) => R.nomeUnidade(k) + ": " + u.por[k]).join(" · ")) + '">' + num(u.n) + (c.limite ? " / " + c.limite : "") + (u.desc ? '<div class="mini">' + moeda(u.desc) + " em desconto</div>" : "") + '</td><td><span class="pill ' + cl + '">' + r + '</span></td><td style="white-space:nowrap">' + (rede ? '<button class="btn pequeno" data-editar="' + esc(c.codigo) + '">Editar</button> <button class="btn pequeno" data-toggle="' + esc(c.codigo) + '">' + (c.ativo === false ? "Ativar" : "Desativar") + '</button> <button class="btn pequeno perigo" data-excluir="' + esc(c.codigo) + '">Excluir</button>' : '<button class="btn pequeno" data-editar-u="' + esc(c.unidade + "|" + c.codigo) + '">Editar</button> <button class="btn pequeno" data-toggle-u="' + esc(c.unidade + "|" + c.codigo) + '">' + (c.ativo === false ? "Ativar" : "Desativar") + '</button> <button class="btn pequeno perigo" data-excluir-u="' + esc(c.unidade + "|" + c.codigo) + '">Excluir</button>') + "</td></tr>"; }).join("") + "</tbody></table></div>" : '<div class="vazio">Nenhum cupom com esse filtro.</div>') + "</div>" +
      '<p class="mini" style="margin-top:.75rem">O Franchising edita, desativa e exclui qualquer cupom, inclusive os criados pelas unidades (a mudança vale na unidade na hora). Os da Palhoça são os reais deste navegador; os de Maringá e Joinville são exemplos. Se a unidade tiver um cupom próprio com o mesmo código de um da rede, vale o da unidade.</p>';
    el.querySelectorAll("[data-fc]").forEach((b) => b.addEventListener("click", () => { filtroCupom[b.dataset.fc] = b.dataset.v; render(); }));
    el.querySelector("[data-novo]").addEventListener("click", () => editarCupom(null));
    el.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => editarCupom(b.dataset.editar)));
    el.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => { const c = R.cupons().find((x) => x.codigo === b.dataset.toggle); c.ativo = c.ativo === false; R.salvarCupom(c); toast(c.ativo ? "Cupom ativado." : "Cupom desativado."); }));
    el.querySelectorAll("[data-excluir]").forEach((b) => b.addEventListener("click", () => { if (confirm("Excluir o cupom " + b.dataset.excluir + "? Ele deixa de valer em todas as unidades.")) { R.excluirCupom(b.dataset.excluir); toast("Cupom excluído."); } }));
    const doUnid = (v) => { const [u, cod] = v.split("|"); return { u, cod, c: R.cuponsUnidades().find((x) => x.unidade === u && x.codigo === cod) }; };
    el.querySelectorAll("[data-editar-u]").forEach((b) => b.addEventListener("click", () => { const x = doUnid(b.dataset.editarU); editarCupom(x.cod, x.u); }));
    el.querySelectorAll("[data-toggle-u]").forEach((b) => b.addEventListener("click", () => { const x = doUnid(b.dataset.toggleU); x.c.ativo = x.c.ativo === false; R.salvarCupomUnidade(x.u, x.c); toast(x.c.ativo ? "Cupom ativado." : "Cupom desativado."); }));
    el.querySelectorAll("[data-excluir-u]").forEach((b) => b.addEventListener("click", () => { const x = doUnid(b.dataset.excluirU); if (confirm("Excluir o cupom " + x.cod + " da unidade " + R.nomeUnidade(x.u) + "?")) { R.excluirCupomUnidade(x.u, x.cod); toast("Cupom excluído."); } }));
  }
  // unidade = null: cupom da rede; unidade = id: cupom criado por essa unidade (o Franchising também edita)
  function editarCupom(codigo, unidade) {
    const c = codigo ? Object.assign({}, unidade ? R.cuponsUnidades().find((x) => x.unidade === unidade && x.codigo === codigo) : R.cupons().find((x) => x.codigo === codigo)) : { codigo: "", desconto: 10, descricao: "", unidades: [], inicio: "", validade: "", limite: 0, minimo: 0, umPorCliente: false, ativo: true };
    const g = gaveta('<p class="eyebrow">' + (unidade ? "Cupom criado pela unidade " + esc(R.nomeUnidade(unidade)) : "Cupom da rede") + '</p><h2>' + (codigo ? "Editar " + esc(codigo) : "Novo cupom") + '</h2><form id="fcup" style="display:grid;gap:.85rem;margin-top:1rem">' +
      '<div class="grade2"><label class="campo">Código<input name="codigo" required value="' + esc(c.codigo) + '" style="text-transform:uppercase" placeholder="ex.: NATAL15"' + (codigo ? " readonly" : "") + '/></label><label class="campo">Desconto (%)<input name="desconto" type="number" min="1" max="100" required value="' + c.desconto + '"/></label></div>' +
      '<label class="campo">Descrição interna<input name="descricao" value="' + esc(c.descricao || "") + '" placeholder="ex.: campanha de Natal da rede"/></label>' +
      (unidade ? '<label class="campo">Vale na unidade<input value="' + esc(R.nomeUnidade(unidade)) + '" readonly/></label>' : '<div class="campo">Vale nas unidades' + checksUnidades(c.unidades) + "</div>") +
      '<div class="grade2"><label class="campo">Vale a partir de<input name="inicio" type="date" value="' + esc(c.inicio || "") + '"/></label><label class="campo">Vale até<input name="validade" type="date" value="' + esc(c.validade || "") + '"/></label></div>' +
      '<div class="grade2"><label class="campo">Limite total de usos (0 = sem limite)<input name="limite" type="number" min="0" value="' + (c.limite || 0) + '"/></label><label class="campo">Pedido mínimo (R$, 0 = sem mínimo)<input name="minimo" type="number" min="0" step="0.01" value="' + (c.minimo || 0) + '"/></label></div>' +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="umPorCliente" style="height:auto"' + (c.umPorCliente ? " checked" : "") + "/> Só uma vez por cliente (pelo telefone)</label>" +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="ativo" style="height:auto"' + (c.ativo !== false ? " checked" : "") + "/> Ativo</label>" +
      '<p class="mini" id="erro-cup" style="color:var(--red)"></p><div class="linha" style="justify-content:flex-end"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Salvar cupom</button></div></form>');
    const unidades = unidade ? () => [] : ligarChecks(g);
    g.querySelector("#fcup").addEventListener("submit", (e) => {
      e.preventDefault(); const d = new FormData(e.target); const cod = d.get("codigo").trim().toUpperCase().replace(/\s+/g, "");
      if (!codigo && R.cupons().some((x) => x.codigo === cod)) { g.querySelector("#erro-cup").textContent = "Já existe um cupom com esse código."; return; }
      if (d.get("inicio") && d.get("validade") && d.get("inicio") > d.get("validade")) { g.querySelector("#erro-cup").textContent = "A data de início é depois da validade."; return; }
      const dados = { codigo: cod, desconto: Number(d.get("desconto")), descricao: d.get("descricao").trim(), inicio: d.get("inicio"), validade: d.get("validade"), limite: Number(d.get("limite")) || 0, minimo: Number(d.get("minimo")) || 0, umPorCliente: !!d.get("umPorCliente"), ativo: !!d.get("ativo") };
      if (unidade) { R.salvarCupomUnidade(unidade, Object.assign({}, c, dados)); fecharGaveta(); toast("Cupom da unidade " + R.nomeUnidade(unidade) + " atualizado."); render(); return; }
      R.salvarCupom(Object.assign(dados, { unidades: unidades() }), codigo);
      fecharGaveta(); toast("Cupom salvo e publicado nas unidades."); render();
    });
  }

  // ---------- MARKETING · CAMPANHAS (performance dos disparos de WhatsApp das unidades) ----------
  // Conversão = cliente acionado que fez pedido (não cancelado) na mesma unidade em até 7 dias depois do disparo.
  // Comparação = clientes da mesma unidade que já tinham comprado antes e NÃO receberam disparo nos 7 dias antes ou depois.
  const JANELA = 7 * 864e5;
  function indicesCampanhas() {
    const H = {}; D.pedidos.forEach((p) => { if (p.status !== "cancelado") (H[chave(p)] = H[chave(p)] || []).push(p); });
    const porUnid = {}; Object.keys(H).forEach((k) => { const u = k.split("|")[0]; (porUnid[u] = porUnid[u] || []).push(k); });
    const envios = {}; D.campanhas.forEach((c) => c.destinatarios.forEach((d) => { const k = c.unidade + "|" + d.telefone; (envios[k] = envios[k] || []).push(new Date(c.enviadaEm).getTime()); }));
    return { H, porUnid, envios };
  }
  function analisarCampanha(c, I) {
    const t0 = new Date(c.enviadaEm).getTime(), a = c.enviadaEm, b = new Date(t0 + JANELA).toISOString();
    const r = { c, acionados: c.destinatarios.length, conv: [], receita: 0, pedidos: 0, cupom: 0, dias: [0, 0, 0, 0, 0, 0, 0], base: 0, baseConv: 0 };
    const rec = new Set();
    c.destinatarios.forEach((d) => {
      const k = c.unidade + "|" + d.telefone; rec.add(k);
      const ps = (I.H[k] || []).filter((p) => p.quando > a && p.quando <= b); if (!ps.length) return;
      r.conv.push({ nome: d.nome, telefone: d.telefone, pedidos: ps }); ps.forEach((p) => { r.receita += p.totais.total; r.pedidos++; });
      if (c.cupom && ps.some((p) => p.cupom && p.cupom.codigo === c.cupom)) r.cupom++;
      r.dias[Math.min(6, Math.floor((new Date(ps[0].quando) - t0) / 864e5))]++;
    });
    (I.porUnid[c.unidade] || []).forEach((k) => {
      if (rec.has(k)) return; const ps = I.H[k]; if (!ps.length || ps[0].quando >= a) return;
      if ((I.envios[k] || []).some((t) => Math.abs(t - t0) <= JANELA)) return;
      r.base++; if (ps.some((p) => p.quando > a && p.quando <= b)) r.baseConv++;
    });
    return r;
  }
  function somar(rs) {
    const s = { n: rs.length, acionados: 0, conv: 0, receita: 0, pedidos: 0, cupom: 0, comCupom: 0, base: 0, baseConv: 0, dias: [0, 0, 0, 0, 0, 0, 0] };
    rs.forEach((r) => { s.acionados += r.acionados; s.conv += r.conv.length; s.receita += r.receita; s.pedidos += r.pedidos; s.cupom += r.cupom; if (r.c.cupom) s.comCupom += r.conv.length; s.base += r.base; s.baseConv += r.baseConv; r.dias.forEach((v, i) => (s.dias[i] += v)); });
    s.taxa = s.acionados ? s.conv / s.acionados * 100 : 0; s.taxaBase = s.base ? s.baseConv / s.base * 100 : 0; s.ganho = s.taxa - s.taxaBase;
    s.ticket = s.pedidos ? s.receita / s.pedidos : 0; s.porMsg = s.acionados ? s.receita / s.acionados : 0; return s;
  }
  const pp = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " p.p.";
  let ultimasAnalises = [];
  function telaCampanhas(el) {
    const iv = intervalo(est.per.campanhas); const a = iv.de.toISOString(), b = iv.ate.toISOString(); const I = indicesCampanhas();
    const rs = D.campanhas.filter((c) => unidOk(c.unidade) && c.enviadaEm >= a && c.enviadaEm <= b).sort((x, y) => y.enviadaEm.localeCompare(x.enviadaEm)).map((c) => analisarCampanha(c, I));
    ultimasAnalises = rs; const t = somar(rs); const us = unidadesSel();
    const recente = rs.filter((r) => Date.now() - new Date(r.c.enviadaEm) < JANELA).length;
    const grupo = (campo) => { const m = {}; rs.forEach((r) => (m[r.c[campo] || "—"] = m[r.c[campo] || "—"] || []).push(r)); return Object.keys(m).map((k) => Object.assign({ nome: k }, somar(m[k]))).sort((x, y) => y.taxa - x.taxa); };
    const tabelaGrupo = (titulo, campo) => { const l = grupo(campo); return '<div class="cartao"><div class="cab"><h3>' + titulo + '</h3></div>' + (l.length ? '<div style="overflow:auto"><table><thead><tr><th>' + (campo === "modelo" ? "Modelo" : "Público") + '</th><th class="n">Campanhas</th><th class="n">Acionados</th><th class="n">Conversão</th><th class="n">Receita</th></tr></thead><tbody>' + l.map((x) => "<tr><td>" + esc(x.nome) + '</td><td class="n">' + x.n + '</td><td class="n">' + num(x.acionados) + '</td><td class="n"><b>' + pct(x.taxa) + '</b></td><td class="n">' + moeda(x.receita) + "</td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Sem campanhas.</div>') + "</div>"; };
    const vezes = t.taxaBase ? t.taxa / t.taxaBase : 0;
    el.innerHTML = topo("Marketing", "Campanhas") + barraFiltros("campanhas") +
      '<div class="aviso" style="margin-bottom:1rem">Regra da rede: o mesmo cliente recebe no máximo 1 disparo a cada 7 dias. Conversão = cliente acionado que comprou na unidade em até 7 dias depois do disparo.</div>' +
      (rs.length ? '<div class="kpis kpis7">' + kpi("Campanhas disparadas", num(t.n), '<div class="sub">' + us.length + " unidade" + (us.length === 1 ? "" : "s") + "</div>") + kpi("Clientes acionados", num(t.acionados)) +
        kpi("Compraram em 7 dias", num(t.conv), '<div class="sub">' + pct(t.taxa) + " dos acionados</div>") + kpi("Receita em 7 dias", moeda(t.receita), '<div class="sub">' + moeda(t.porMsg) + " por mensagem</div>") +
        kpi("Ticket médio", moeda(t.ticket), '<div class="sub">' + num(t.pedidos) + " pedidos</div>") + kpi("Usaram o cupom", num(t.cupom), '<div class="sub">' + pct(t.comCupom ? t.cupom / t.comCupom * 100 : 0) + " dos convertidos com cupom</div>") +
        kpi("Ganho vs. não acionados", pp(t.ganho), '<div class="var ' + (t.ganho >= 0 ? "sobe" : "desce") + '">' + pct(t.taxa) + " × " + pct(t.taxaBase) + "</div>") + "</div>" +
        '<div class="grade-dash">' +
        '<div class="cartao"><div class="cab"><div><h3>Funil</h3><p class="mini">clientes</p></div></div>' + hbar([{ nome: "Acionados", v: t.acionados }, { nome: "Compraram em 7 dias", v: t.conv }, { nome: "Usaram o cupom", v: t.cupom }], (l) => num(l.v) + (l.nome === "Acionados" ? "" : " · " + pct(t.acionados ? l.v / t.acionados * 100 : 0))) + "</div>" +
        '<div class="cartao"><div class="cab"><div><h3>Acionados × não acionados</h3><p class="mini">% que comprou em 7 dias</p></div></div>' + hbar([{ nome: "Receberam a mensagem", v: t.taxa, cor: "#B8172E" }, { nome: "Não receberam", v: t.taxaBase, cor: "#9a9a9a" }], (l) => pct(l.v)) +
          '<p class="mini" style="margin-top:.75rem">' + (t.taxaBase ? "Quem recebeu a mensagem comprou <b>" + vezes.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "×</b> mais que a base sem mensagem (" + num(t.base) + " comparações: clientes que já tinham comprado na unidade e não receberam disparo nos 7 dias antes ou depois)." : "Sem base de comparação no período.") + "</p></div>" +
        '<div class="cartao"><div class="cab"><div><h3>Em qual dia compram</h3><p class="mini">1ª compra depois do disparo</p></div></div>' + colunas(t.dias.map((v, i) => ({ rot: "Dia " + (i + 1), v })), (v) => num(v) + " clientes") + "</div>" +
        '<div class="cartao largo"><div class="cab"><h3>Ranking de unidades</h3></div><div style="overflow:auto"><table><thead><tr><th>Unidade</th><th class="n">Campanhas</th><th class="n">Acionados</th><th class="n">Compraram</th><th class="n">Conversão</th><th class="n">Sem mensagem</th><th class="n">Ganho</th><th class="n">Receita</th><th class="n">Receita por mensagem</th></tr></thead><tbody>' +
          us.map((u) => Object.assign({ u }, somar(rs.filter((r) => r.c.unidade === u.id)))).sort((x, y) => y.taxa - x.taxa).map((x) => '<tr><td><span style="color:' + cor(x.u.id) + '">●</span> <b>' + esc(x.u.nome) + '</b></td><td class="n">' + x.n + '</td><td class="n">' + num(x.acionados) + '</td><td class="n">' + num(x.conv) + '</td><td class="n"><b>' + pct(x.taxa) + '</b></td><td class="n">' + pct(x.taxaBase) + '</td><td class="n" style="color:' + (x.ganho >= 0 ? "var(--ok)" : "var(--red)") + '">' + pp(x.ganho) + '</td><td class="n">' + moeda(x.receita) + '</td><td class="n">' + moeda(x.porMsg) + "</td></tr>").join("") + "</tbody></table></div></div>" +
        tabelaGrupo("Por modelo de mensagem", "modelo") + tabelaGrupo("Por tipo de público", "nomePublico") +
        '<div class="cartao largo"><div class="cab"><div><h3>Campanhas</h3><p class="mini">' + num(rs.length) + " no período" + (recente ? " · " + recente + " ainda dentro da janela de 7 dias (conversão parcial)" : "") + '</p></div></div><div style="overflow:auto"><table><thead><tr><th>Campanha</th><th>Unidade</th><th>Disparo</th><th>Público</th><th>Modelo</th><th>Cupom</th><th class="n">Acionados</th><th class="n">Compraram</th><th class="n">Conversão</th><th class="n">Receita</th></tr></thead><tbody>' +
          rs.map((r, i) => '<tr class="clicavel" data-camp="' + i + '"><td><b>' + esc(r.c.nome) + "</b>" + (Date.now() - new Date(r.c.enviadaEm) < JANELA ? ' <span class="pill preparo">em andamento</span>' : "") + "</td><td>" + '<span style="color:' + cor(r.c.unidade) + '">●</span> ' + esc(R.nomeUnidade(r.c.unidade)) + "</td><td>" + fmtD(r.c.enviadaEm) + "</td><td>" + esc(r.c.nomePublico || "—") + "</td><td>" + esc(r.c.modelo || "—") + "</td><td>" + esc(r.c.cupom || "—") + '</td><td class="n">' + num(r.acionados) + '</td><td class="n">' + num(r.conv.length) + '</td><td class="n"><b>' + pct(r.acionados ? r.conv.length / r.acionados * 100 : 0) + '</b></td><td class="n">' + moeda(r.receita) + "</td></tr>").join("") + "</tbody></table></div></div>" +
        "</div>"
        : '<div class="cartao vazio">Nenhuma campanha disparada no período.</div>');
    ligarFiltros(el, "campanhas");
    el.querySelectorAll("[data-camp]").forEach((tr) => tr.addEventListener("click", () => abrirCampanhaRede(ultimasAnalises[Number(tr.dataset.camp)])));
  }
  function abrirCampanhaRede(r) {
    if (!r) return; const c = r.c; const taxa = r.acionados ? r.conv.length / r.acionados * 100 : 0; const base = r.base ? r.baseConv / r.base * 100 : 0;
    gaveta('<p class="eyebrow">Campanha · ' + esc(R.nomeUnidade(c.unidade)) + " · disparo " + fmt(c.enviadaEm) + "</p><h2>" + esc(c.nome) + '</h2><p class="mini">Público: ' + esc(c.nomePublico || "—") + " · modelo: " + esc(c.modelo || "—") + (c.cupom ? " · cupom " + esc(c.cupom) : "") + "</p>" +
      '<div class="kpis" style="margin-top:1rem"><div class="cartao kpi"><div class="rotulo">Acionados</div><div class="valor">' + num(r.acionados) + '</div></div><div class="cartao kpi"><div class="rotulo">Compraram em 7 dias</div><div class="valor">' + num(r.conv.length) + '</div><div class="sub">' + pct(taxa) + '</div></div><div class="cartao kpi"><div class="rotulo">Receita</div><div class="valor" style="font-size:1.2rem">' + moeda(r.receita) + '</div></div><div class="cartao kpi"><div class="rotulo">Sem mensagem</div><div class="valor" style="font-size:1.2rem">' + pct(base) + '</div><div class="sub">ganho ' + pp(taxa - base) + "</div></div></div>" +
      '<h3 style="margin:1rem 0 .5rem;font-size:1rem">Quem comprou (' + r.conv.length + ')</h3><div class="cartao">' + (r.conv.length ? r.conv.map((x) => { const p0 = x.pedidos[0]; const tot = x.pedidos.reduce((s, p) => s + p.totais.total, 0); return '<div style="display:flex;justify-content:space-between;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--line)"><span><b>' + esc(x.nome) + '</b> <span class="mini">' + esc(fone(x.telefone)) + " · " + fmt(p0.quando) + " (dia " + (1 + Math.min(6, Math.floor((new Date(p0.quando) - new Date(c.enviadaEm)) / 864e5))) + ")" + (c.cupom && x.pedidos.some((p) => p.cupom && p.cupom.codigo === c.cupom) ? " · usou " + esc(c.cupom) : "") + "</span></span><span>" + moeda(tot) + "</span></div>"; }).join("") : '<div class="vazio">Ninguém comprou ainda.</div>') + "</div>");
  }

  // ---------- CRM · AVALIAÇÕES (só análise) ----------
  let pedPorNum = null;
  const pedidoDaAv = (n) => { if (!pedPorNum) { pedPorNum = {}; D.pedidos.forEach((p) => (pedPorNum[p.numero] = p)); } return pedPorNum[n]; };
  const corNota = (n) => n >= 4.5 ? "#2F7D45" : n >= 4 ? "#D69A2D" : "#B8172E";
  const fmtNota = (n) => n == null || isNaN(n) ? "—" : n.toFixed(2).replace(".", ",");
  function barrasNota(linhas) { return '<div class="hbar">' + linhas.map((l) => '<span class="nome" title="' + esc(l.nome) + '">' + esc(l.nome) + '</span><span class="trilho"><i style="width:' + Math.max(2, (l.v - 1) / 4 * 100).toFixed(1) + "%;background:" + corNota(l.v) + '"></i></span><span class="val">' + fmtNota(l.v) + ' ★ <span class="mini">· ' + num(l.n) + "</span></span>").join("") + "</div>"; }
  const STOP = new Set("para pela pelo como mais muito muita mas que com uma umas uns dos das nos nas não sim foi era tava estava veio bem bastante pedido produto ainda quando sobre todo toda tudo minha meu esse essa isso aqui".split(" "));
  function telaAvaliacoes(el) {
    const iv = intervalo(est.per.avaliacoes); const ivA = anterior(iv); const us = unidadesSel();
    const doPer = (x) => { const a = x.de.toISOString(), b = x.ate.toISOString(); return D.avaliacoes.filter((v) => unidOk(v.unidade) && v.quando >= a && v.quando <= b).map((v) => Object.assign({}, v, { p: pedidoDaAv(v.numero) })); };
    const avs = doPer(iv).sort((x, y) => x.quando.localeCompare(y.quando)); const avsA = ivA ? doPer(ivA) : null;
    const media = (l) => l.length ? l.reduce((s, v) => s + v.nota, 0) / l.length : null;
    const concl = (x, u) => { const a = x.de.toISOString(), b = x.ate.toISOString(); return D.pedidos.filter((p) => p.status === "concluido" && (u ? p.unidade === u : unidOk(p.unidade)) && p.quando >= a && p.quando <= b).length; };
    const res = (l, x, u) => { const m = media(l); return { n: l.length, media: m, taxa: (concl(x, u) ? l.length / concl(x, u) * 100 : 0), altas: l.length ? l.filter((v) => v.nota >= 4).length / l.length * 100 : 0, baixas: l.length ? l.filter((v) => v.nota <= 2).length / l.length * 100 : 0 }; };
    const r = res(avs, iv), ra = avsA ? res(avsA, ivA) : null;
    const varNota = (atual, ant) => atual == null || ant == null ? "" : '<div class="var ' + (Math.abs(atual - ant) < 0.01 ? "igual" : atual > ant ? "sobe" : "desce") + '">' + (atual >= ant ? "▲ " : "▼ ") + Math.abs(atual - ant).toFixed(2).replace(".", ",") + " vs. período anterior</div>";
    // por unidade + alertas
    const porU = us.map((u) => { const l = avs.filter((v) => v.unidade === u.id); const la = avsA ? avsA.filter((v) => v.unidade === u.id) : null; let seq = 0, maxSeq = 0, fimSeq = null; l.forEach((v) => { if (v.nota <= 2) { seq++; if (seq > maxSeq) { maxSeq = seq; fimSeq = v.quando; } } else seq = 0; }); return Object.assign({ u, l, ant: la ? media(la) : null, nAnt: la ? la.length : 0, maxSeq, fimSeq, dist: [5, 4, 3, 2, 1].map((n) => l.filter((v) => v.nota === n).length) }, res(l, iv, u.id)); });
    const alertas = [];
    porU.forEach((x) => {
      if (x.media != null && x.ant != null && x.n >= 10 && x.nAnt >= 10 && x.ant - x.media >= 0.15) alertas.push("<b>" + esc(x.u.nome) + "</b>: nota caiu de " + fmtNota(x.ant) + " para " + fmtNota(x.media) + " em relação ao período anterior.");
      if (x.maxSeq >= 3) alertas.push("<b>" + esc(x.u.nome) + "</b>: " + x.maxSeq + " notas 1–2 seguidas (a última em " + fmtD(x.fimSeq) + ").");
      if (x.n >= 10 && x.baixas >= 8) alertas.push("<b>" + esc(x.u.nome) + "</b>: " + pct(x.baixas) + " das avaliações com nota 1–2.");
    });
    // evolução: semana até 120 dias, senão mês; sem avaliação na semana/mês repete o valor anterior
    const de0 = iv.tudo && avs.length ? new Date(avs[0].quando) : iv.de; const dias = (iv.ate - de0) / 864e5; const modo = dias <= 120 ? "semana" : "mes";
    const chaveAv = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); if (modo === "semana") x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); else x.setDate(1); return x.getTime(); };
    const ks = []; for (let d = new Date(chaveAv(de0)); d <= iv.ate; modo === "mes" ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7)) ks.push(d.getTime());
    const rotAv = (k) => { const d = new Date(k); return modo === "mes" ? d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "") : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
    const serieNota = (l) => { const s = ks.map(() => ({ t: 0, n: 0 })); const ix = {}; ks.forEach((k, i) => (ix[k] = i)); l.forEach((v) => { const i = ix[chaveAv(v.quando)]; if (i != null) { s[i].t += v.nota; s[i].n++; } }); let ult = media(l) || 0; return s.map((o) => (ult = o.n ? o.t / o.n : ult)); };
    const seriesEv = us.length === 1 || est.serie === "rede" ? [{ nome: us.length === 1 ? us[0].nome : "Rede", cor: us.length === 1 ? cor(us[0].id) : "#B8172E", valores: serieNota(avs) }] : porU.map((x) => ({ nome: x.u.nome, cor: cor(x.u.id), valores: serieNota(x.l) }));
    // onde a nota cai
    const grupoNota = (f, nomes) => nomes.map((nm) => { const l = avs.filter((v) => v.p && f(v.p) === nm); return { nome: nm, v: media(l), n: l.length }; }).filter((x) => x.n);
    const faixaH = (p) => { const h = new Date(p.quando).getHours(); return h < 12 ? "Manhã (8h–11h)" : h < 15 ? "Almoço (12h–14h)" : h < 18 ? "Tarde (15h–17h)" : "Noite (18h–20h)"; };
    const DS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const prodN = {}; avs.forEach((v) => v.p && v.p.itens.forEach((i) => { const o = prodN[i.id] || (prodN[i.id] = { nome: i.nome, t: 0, n: 0 }); o.t += v.nota; o.n++; }));
    const piores = Object.values(prodN).filter((o) => o.n >= 8).map((o) => ({ nome: o.nome, v: o.t / o.n, n: o.n })).sort((x, y) => x.v - y.v).slice(0, 8);
    // comentários
    const coms = avs.filter((v) => v.comentario);
    const palavras = {}; coms.filter((v) => v.nota <= 2).forEach((v) => semAcento(v.comentario).replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)).forEach((w) => (palavras[w] = (palavras[w] || 0) + 1)));
    const topPal = Object.keys(palavras).sort((x, y) => palavras[y] - palavras[x]).slice(0, 10);
    const q = semAcento(est.avBusca).trim();
    const visC = coms.filter((v) => (!est.avNota || v.nota === Number(est.avNota)) && (!q || semAcento(v.comentario).includes(q))).reverse();
    const estrelas = (n) => '<span style="color:var(--gold)">' + "★".repeat(n) + '</span><span style="color:#dcdcdc">' + "★".repeat(5 - n) + "</span>";
    el.innerHTML = topo("CRM", "Avaliações") + barraFiltros("avaliacoes") +
      '<div class="kpis kpis5">' + kpi("Nota média", r.media != null ? fmtNota(r.media) + ' <small style="color:var(--gold)">★</small>' : "—", varNota(r.media, ra && ra.media)) + kpi("Avaliações", num(r.n), ra ? variacao(r.n, ra.n) : "") +
        kpi("Taxa de avaliação", pct(r.taxa), '<div class="sub">dos pedidos concluídos</div>') + kpi("Notas 4 e 5", pct(r.altas), ra ? variacao(r.altas, ra.altas) : "") + kpi("Notas 1 e 2", pct(r.baixas), ra ? variacao(r.baixas, ra.baixas, true) : "") + "</div>" +
      (alertas.length ? '<div class="cartao alertas" style="margin-bottom:1rem"><h3>Alertas</h3>' + alertas.map((a) => "<p>" + a + "</p>").join("") + "</div>" : "") +
      '<div class="grade-dash">' +
      '<div class="cartao largo"><div class="cab"><h3>Ranking de unidades</h3></div><div style="overflow:auto"><table><thead><tr><th></th><th>Unidade</th><th class="n">Nota média</th><th class="n">Variação</th><th class="n">Avaliações</th><th class="n">Taxa de avaliação</th><th class="n">Notas 4–5</th><th class="n">Notas 1–2</th></tr></thead><tbody>' +
        porU.slice().sort((x, y) => (y.media || 0) - (x.media || 0)).map((x, i) => { const dv = x.media != null && x.ant != null ? x.media - x.ant : null; return '<tr><td><span class="pos' + (i === 0 ? " p1" : "") + '">' + (i + 1) + 'º</span></td><td><b>' + esc(x.u.nome) + '</b></td><td class="n"><b style="color:' + corNota(x.media || 0) + '">' + fmtNota(x.media) + ' ★</b></td><td class="n" style="color:' + (dv == null ? "inherit" : dv >= 0 ? "var(--ok)" : "var(--red)") + '">' + (dv == null ? "—" : (dv >= 0 ? "▲ " : "▼ ") + Math.abs(dv).toFixed(2).replace(".", ",")) + '</td><td class="n">' + num(x.n) + '</td><td class="n">' + pct(x.taxa) + '</td><td class="n">' + pct(x.altas) + '</td><td class="n">' + pct(x.baixas) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Distribuição das notas</h3><p class="mini">% das avaliações de cada unidade</p></div><div class="legenda">' + [5, 4, 3, 2, 1].map((n, i) => '<span><i style="background:' + ["#2F7D45", "#8DBF6A", "#D69A2D", "#D9909A", "#B8172E"][i] + '"></i>' + n + "★</span>").join("") + "</div></div>" +
        porU.map((x) => '<div class="dist-linha"><span class="nome">' + esc(x.u.nome) + '</span><div class="dist-barra">' + x.dist.map((v, i) => v ? '<i style="width:' + (v / Math.max(1, x.n) * 100) + "%;background:" + ["#2F7D45", "#8DBF6A", "#D69A2D", "#D9909A", "#B8172E"][i] + '" title="' + (5 - i) + "★: " + v + " (" + pct(v / x.n * 100) + ')">' + (v / x.n >= 0.07 ? pct(v / x.n * 100, 0) : "") + "</i>" : "").join("") + '</div><span class="mini">' + num(x.n) + "</span></div>").join("") + "</div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Evolução da nota média</h3><p class="mini">por ' + modo + "</p></div>" + (us.length > 1 ? '<div class="chips"><button class="chip' + (est.serie === "unidade" ? " on" : "") + '" data-serie="unidade">Por unidade</button><button class="chip' + (est.serie === "rede" ? " on" : "") + '" data-serie="rede">Rede</button></div>' : "") + "</div>" +
        (avs.length ? grafLinhas(ks.map(rotAv), seriesEv, (v) => fmtNota(v), { min: Math.max(1, Math.floor(Math.min(...seriesEv.flatMap((s) => s.valores)) * 2) / 2 - 0.5), max: 5 }) + '<div class="legenda" style="margin-top:.5rem">' + seriesEv.map((s) => '<span><i style="background:' + s.cor + '"></i>' + esc(s.nome) + "</span>").join("") + "</div>" : '<div class="vazio">Sem avaliações no período.</div>') + "</div>" +
      '<div class="cartao"><div class="cab"><div><h3>Entrega × retirada</h3><p class="mini">nota média</p></div></div>' + barrasNota(grupoNota((p) => p.modalidade === "entrega" ? "Entrega" : "Retirada", ["Entrega", "Retirada"])) +
        '<p class="mini" style="margin:1rem 0 .5rem">Horário do pedido</p>' + barrasNota(grupoNota(faixaH, ["Manhã (8h–11h)", "Almoço (12h–14h)", "Tarde (15h–17h)", "Noite (18h–20h)"])) + "</div>" +
      '<div class="cartao"><div class="cab"><div><h3>Dia da semana</h3><p class="mini">nota média pelo dia do pedido</p></div></div>' + barrasNota(grupoNota((p) => DS[new Date(p.quando).getDay()], DS)) + "</div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Produtos com pior nota</h3><p class="mini">nota média dos pedidos que tinham o produto (mínimo 8 avaliações)</p></div></div>' + (piores.length ? barrasNota(piores) : '<div class="vazio">Poucas avaliações no período.</div>') + "</div>" +
      '<div class="cartao largo"><div class="cab"><div><h3>Comentários</h3><p class="mini">' + num(coms.length) + " de " + num(avs.length) + " avaliações têm comentário</p></div></div>" +
        (topPal.length ? '<p class="mini" style="margin-bottom:.4rem">Palavras mais frequentes nas notas 1–2 (clique pra buscar)</p><div class="chips" style="margin-bottom:1rem">' + topPal.map((w) => '<button class="chip' + (q === w ? " on" : "") + '" data-palavra="' + esc(w) + '">' + esc(w) + " (" + palavras[w] + ")</button>").join("") + "</div>" : "") +
        '<div class="linha" style="align-items:flex-end;margin-bottom:.75rem"><div class="chips">' + [["", "Todas"], ["5", "5★"], ["4", "4★"], ["3", "3★"], ["2", "2★"], ["1", "1★"]].map(([v, rt]) => '<button class="chip' + (est.avNota === v ? " on" : "") + '" data-nota="' + v + '">' + rt + "</button>").join("") + '</div><label class="campo" style="flex:1;min-width:220px">Buscar no comentário<input type="search" data-busca-av value="' + esc(est.avBusca) + '" placeholder="ex.: atraso, frio, torta"/></label></div>' +
        (visC.length ? visC.slice(0, est.limiteAv).map((v) => '<div class="comentario"><div class="linha" style="justify-content:space-between;align-items:center"><span>' + estrelas(v.nota) + ' <span class="mini">· <span style="color:' + cor(v.unidade) + '">●</span> ' + esc(R.nomeUnidade(v.unidade)) + " · " + fmtD(v.quando) + " · pedido " + esc(v.numero) + (v.p ? " · " + (v.p.modalidade === "entrega" ? "entrega" : "retirada") : "") + '</span></span></div><p>“' + esc(v.comentario) + "”</p>" + (v.p ? '<div class="mini">' + esc(v.p.itens.map((i) => i.qtd + "× " + i.nome).join(", ")) + "</div>" : "") + "</div>").join("") +
          (visC.length > est.limiteAv ? '<div style="text-align:center;margin-top:1rem"><button class="btn" data-mais-av>Mostrar mais (' + num(visC.length - est.limiteAv) + " restantes)</button></div>" : "")
          : '<div class="vazio">Nenhum comentário com esse filtro.</div>') + "</div>" +
      "</div>";
    ligarFiltros(el, "avaliacoes"); ligarLinhas(el);
    el.querySelectorAll("[data-serie]").forEach((b) => b.addEventListener("click", () => { est.serie = b.dataset.serie; render(); }));
    el.querySelectorAll("[data-nota]").forEach((b) => b.addEventListener("click", () => { est.avNota = b.dataset.nota; est.limiteAv = 30; render(); }));
    el.querySelectorAll("[data-palavra]").forEach((b) => b.addEventListener("click", () => { est.avBusca = q === b.dataset.palavra ? "" : b.dataset.palavra; est.avNota = ""; est.limiteAv = 30; render(); }));
    const bu = el.querySelector("[data-busca-av]"); bu.addEventListener("input", () => { est.avBusca = bu.value; est.limiteAv = 30; render(); const n = document.querySelector("[data-busca-av]"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    const mais = el.querySelector("[data-mais-av]"); if (mais) mais.addEventListener("click", () => { est.limiteAv += 50; render(); });
  }

  // ---------- MODELOS DE MENSAGEM ----------
  const CATS_MODELO = ["Reativação", "Fidelidade", "Lançamento", "Datas", "Recorrência", "Promoção", "Boas-vindas", "Pós-venda", "Outra"];
  const VARS = [["{nome}", "primeiro nome do cliente"], ["{loja}", "nome da unidade"], ["{cupom}", "cupom da campanha"], ["{site}", "site da unidade"], ["{produto}", "produto em destaque"]];
  const exemplo = (t, u) => t.replace(/\{nome\}/g, "Ana").replace(/\{loja\}/g, "Bread King " + (u ? R.nomeUnidade(u) : "Maringá")).replace(/\{cupom\}/g, "REDE15").replace(/\{site\}/g, "breadking" + (u || "maringa") + ".com.br").replace(/\{produto\}/g, "Torta Royale Lechedor");
  let filtroCatModelo = "", buscaModelo = "";
  const semAcento = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function telaModelos(el) {
    const ms = R.modelos(); const cats = [...new Set(ms.map((m) => m.categoria))].sort();
    const q = semAcento(buscaModelo).trim();
    const vis = ms.filter((m) => (!filtroCatModelo || m.categoria === filtroCatModelo) && (!q || semAcento(m.nome).includes(q)));
    el.innerHTML = topo("Marketing", "Modelos de mensagem", "Textos prontos que o franchising publica para as unidades usarem nas campanhas de WhatsApp. Na unidade eles aparecem com a etiqueta \"Franqueadora\" e não podem ser editados.", '<button class="btn primario" data-novo>' + ic("plus") + "Novo modelo</button>") +
      '<div class="aviso" style="margin-bottom:1rem">Variáveis: ' + VARS.map((v) => "<b>" + v[0] + "</b> " + v[1]).join(" · ") + "</div>" +
      '<label class="campo" style="margin-bottom:.75rem">Buscar modelo pelo nome<input type="search" data-busca-modelo value="' + esc(buscaModelo) + '" placeholder="ex.: Aniversário, Lançamento Royale..."/></label>' + (q ? '<p class="mini" style="margin:-.25rem 0 .75rem">' + vis.length + " modelo" + (vis.length === 1 ? "" : "s") + " encontrado" + (vis.length === 1 ? "" : "s") + "</p>" : "") +
      '<div class="chips" style="margin-bottom:1rem"><button class="chip' + (!filtroCatModelo ? " on" : "") + '" data-cat="">Todas (' + ms.length + ")</button>" + cats.map((c) => '<button class="chip' + (filtroCatModelo === c ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + " (" + ms.filter((m) => m.categoria === c).length + ")</button>").join("") + "</div>" +
      (vis.length ? [...new Set(vis.map((m) => m.categoria))].sort().map((cat) => '<div class="cartao" style="margin-bottom:1rem"><p class="eyebrow" style="margin-bottom:.25rem">' + esc(cat) + "</p>" + vis.filter((m) => m.categoria === cat).map((m) => '<div style="padding:.85rem 0;border-bottom:1px solid var(--line)"><div class="linha" style="justify-content:space-between;align-items:center"><div><b style="font-weight:500">' + esc(m.nome) + '</b> <span class="mini">· ' + esc(nomesUnid(m.unidades)) + '</span></div><span><button class="btn pequeno" data-editar="' + m.id + '">Editar</button> <button class="btn pequeno" data-duplicar="' + m.id + '">Duplicar</button> <button class="btn pequeno perigo" data-excluir="' + m.id + '">Excluir</button></span></div><p style="margin:.45rem 0 0;font-size:.9rem;white-space:pre-wrap">' + esc(m.texto) + "</p></div>").join("") + "</div>").join("") : '<div class="cartao vazio">' + (q || filtroCatModelo ? "Nenhum modelo com esse nome" + (filtroCatModelo ? " na categoria " + esc(filtroCatModelo) : "") + "." : "Nenhum modelo ainda. Crie o primeiro.") + "</div>");
    const bm = el.querySelector("[data-busca-modelo]"); bm.addEventListener("input", () => { buscaModelo = bm.value; render(); const n = document.querySelector("[data-busca-modelo]"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    el.querySelector("[data-novo]").addEventListener("click", () => editarModelo(null));
    el.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { filtroCatModelo = b.dataset.cat; render(); }));
    el.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => editarModelo(b.dataset.editar)));
    el.querySelectorAll("[data-duplicar]").forEach((b) => b.addEventListener("click", () => { const m = R.modelos().find((x) => x.id === b.dataset.duplicar); editarModelo(null, Object.assign({}, m, { id: "", nome: m.nome + " (cópia)" })); }));
    el.querySelectorAll("[data-excluir]").forEach((b) => b.addEventListener("click", () => { if (confirm("Excluir este modelo? Ele some do painel das unidades.")) { R.excluirModelo(b.dataset.excluir); toast("Modelo excluído."); } }));
  }
  function editarModelo(id, base) {
    const m = id ? Object.assign({}, R.modelos().find((x) => x.id === id)) : Object.assign({ id: "", nome: "", categoria: "Promoção", unidades: [], texto: "Oi, {nome}! " }, base || {});
    const g = gaveta('<p class="eyebrow">Modelo do franchising</p><h2>' + (id ? "Editar modelo" : "Novo modelo") + '</h2><form id="fmod" style="display:grid;gap:.85rem;margin-top:1rem">' +
      '<label class="campo">Nome do modelo<input name="nome" required value="' + esc(m.nome) + '" placeholder="ex.: Lançamento Tortas Royale"/></label>' +
      '<label class="campo">Categoria<select name="categoria">' + CATS_MODELO.map((c) => "<option" + (m.categoria === c ? " selected" : "") + ">" + c + "</option>").join("") + "</select></label>" +
      '<div class="campo">Publicar para' + checksUnidades(m.unidades) + "</div>" +
      '<label class="campo">Texto da mensagem<textarea name="texto" required style="min-height:9rem">' + esc(m.texto) + '</textarea></label><div class="vars">' + VARS.map((v) => '<button type="button" data-var="' + v[0] + '" title="' + esc(v[1]) + '">+ ' + v[0] + "</button>").join("") + '</div>' +
      '<div><p class="mini" style="margin-bottom:.35rem">Prévia (exemplo com a cliente Ana)</p><div class="balao" id="prev"></div><p class="mini" id="cont" style="margin-top:.35rem"></p></div>' +
      '<div class="linha" style="justify-content:flex-end"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Salvar e publicar</button></div></form>');
    const unidades = ligarChecks(g); const ta = g.querySelector('[name="texto"]');
    const prev = () => { const us = unidades(); g.querySelector("#prev").textContent = exemplo(ta.value, us.length === 1 ? us[0] : null); g.querySelector("#cont").textContent = ta.value.length + " caracteres"; };
    ta.addEventListener("input", prev); g.querySelector("[data-checks]").addEventListener("change", prev); prev();
    g.querySelectorAll("[data-var]").forEach((b) => b.addEventListener("click", () => { const s = ta.selectionStart ?? ta.value.length, e2 = ta.selectionEnd ?? ta.value.length; ta.value = ta.value.slice(0, s) + b.dataset.var + ta.value.slice(e2); ta.focus(); ta.selectionStart = ta.selectionEnd = s + b.dataset.var.length; prev(); }));
    g.querySelector("#fmod").addEventListener("submit", (e) => { e.preventDefault(); const d = new FormData(e.target); R.salvarModelo({ id: m.id || "mf-" + Date.now().toString(36), nome: d.get("nome").trim(), categoria: d.get("categoria"), origem: "franqueadora", unidades: unidades(), texto: d.get("texto").trim(), atualizadoEm: new Date().toISOString() }); fecharGaveta(); toast("Modelo publicado para " + nomesUnid(unidades()).toLowerCase() + "."); render(); });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
