// Painel de gestão da unidade (modo simulação): pedidos com status e mensagem automática, clientes, produtos, segmentações e configurações.
(function () {
  const U = window.UNIDADE;
  const cfg = () => BK.config();
  const moeda = (v) => "R$ " + (Math.round((v || 0) * 100) / 100).toFixed(2).replace(".", ",");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (iso) => iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  const fmtD = (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "";
  const tel = (t) => String(t || "").replace(/\D/g, "");
  const wa = (t, msg) => "https://wa.me/" + (tel(t).startsWith("55") ? tel(t) : "55" + tel(t)) + "?text=" + encodeURIComponent(msg);
  const toast = (m) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
  const MODELOS = { pago: "Oi, {nome}! Recebemos seu pedido {numero} na {loja}. Já estamos preparando tudo. 🥖", preparo: "Oi, {nome}! Seu pedido {numero} está em preparo. Em breve te aviso quando sair.", saiu: "Oi, {nome}! Seu pedido {numero} saiu pra entrega e chega em breve. 🚚 {loja}", pronto: "Oi, {nome}! Seu pedido {numero} está pronto pra retirada na {loja}: {endereco}.", concluido: "Pedido {numero} entregue! Obrigado por pedir na {loja}, {nome}. Até a próxima! 🙌" };
  const modelos = () => Object.assign({}, MODELOS, cfg().modelosMensagem || {});
  const preencher = (m, p) => m.replace(/\{nome\}/g, (p.cliente.nome || "").split(" ")[0]).replace(/\{numero\}/g, p.numero).replace(/\{loja\}/g, cfg().nomeCompleto).replace(/\{endereco\}/g, cfg().endereco).replace(/\{total\}/g, moeda(p.totais.total));

  // ---------- sessão ----------
  const senhaOk = (s) => s === (cfg().admin && cfg().admin.senha || "breadking");
  function iniciar() {
    document.getElementById("login-unidade").textContent = cfg().nomeCompleto; document.getElementById("lateral-unidade").textContent = cfg().nome;
    if (sessionStorage.getItem("bk_admin") === "1") { mostrarApp(); } else document.getElementById("login").classList.remove("hidden");
    document.getElementById("form-login").addEventListener("submit", (e) => { e.preventDefault(); if (senhaOk(document.getElementById("senha").value)) { sessionStorage.setItem("bk_admin", "1"); document.getElementById("login").classList.add("hidden"); mostrarApp(); } else document.getElementById("login-erro").textContent = "Senha incorreta."; });
    document.getElementById("sair").addEventListener("click", (e) => { e.preventDefault(); sessionStorage.removeItem("bk_admin"); location.reload(); });
  }
  const TELAS = [["pedidos", "Pedidos", "package"], ["desempenho", "Desempenho", "sparkles"], ["abc", "Curva ABC", "star"], ["clientes", "Clientes", "user"], ["produtos", "Produtos", "utensils-crossed"], ["segmentos", "Segmentações", "tag"], ["config", "Configurações", "store"]];
  let telaAtual = location.hash.replace("#", "") || "pedidos";
  function mostrarApp() {
    document.getElementById("app").classList.remove("hidden");
    const menu = document.getElementById("menu");
    menu.innerHTML = TELAS.map(([id, rot, ic]) => '<a href="#' + id + '" data-tela="' + id + '">' + icone(ic) + rot + "</a>").join("");
    menu.addEventListener("click", (e) => { const a = e.target.closest("[data-tela]"); if (a) { telaAtual = a.dataset.tela; render(); } });
    document.addEventListener("banco:mudou", () => { if (!document.querySelector(".fundo")) render(); });
    window.addEventListener("storage", () => render());
    render();
  }
  function render() {
    document.querySelectorAll("#menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.tela === telaAtual));
    const el = document.getElementById("tela");
    ({ pedidos: telaPedidos, desempenho: telaDesempenho, abc: telaAbc, clientes: telaClientes, produtos: telaProdutos, segmentos: telaSegmentos, config: telaConfig }[telaAtual] || telaPedidos)(el);
  }
  const topo = (eyebrow, titulo, sub, acoes) => '<div class="topo"><div><p class="eyebrow">' + eyebrow + "</p><h1>" + titulo + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + '</div><div class="linha">' + (acoes || "") + "</div></div>";
  function gaveta(html) { fecharGaveta(); const f = document.createElement("div"); f.className = "fundo"; f.innerHTML = '<div class="gaveta" style="position:relative"><button class="btn pequeno fechar" data-fechar>' + icone("x") + "</button>" + html + "</div>"; f.addEventListener("click", (e) => { if (e.target === f || e.target.closest("[data-fechar]")) fecharGaveta(); }); document.body.appendChild(f); return f; }
  function fecharGaveta() { document.querySelectorAll(".fundo").forEach((f) => f.remove()); }
  const pill = (st) => { const s = BK.STATUS.find((x) => x.id === st); return '<span class="pill ' + st + '">' + (s ? s.rotulo : st === "cancelado" ? "Cancelado" : st) + "</span>"; };

  // ---------- PEDIDOS ----------
  const filtroPed = { status: "", busca: "", de: "", ate: "" };
  function telaPedidos(el) {
    const todos = BK.pedidos().slice().reverse();
    const hoje = new Date().toDateString();
    const deHoje = todos.filter((p) => new Date(p.quando).toDateString() === hoje && p.status !== "cancelado");
    const abertos = todos.filter((p) => ["pago", "preparo", "saiu", "pronto"].includes(p.status));
    const lista = todos.filter((p) => (!filtroPed.status || p.status === filtroPed.status) && (!filtroPed.busca || (p.numero + " " + p.cliente.nome + " " + p.cliente.telefone).toLowerCase().includes(filtroPed.busca.toLowerCase())) && (!filtroPed.de || p.quando >= filtroPed.de) && (!filtroPed.ate || p.quando <= filtroPed.ate + "T23:59:59"));
    el.innerHTML = topo("Operação", "Pedidos", "Mude o status conforme o pedido avança. O cliente acompanha em tempo real.", '<button class="btn" data-exportar-pedidos>' + icone("package") + "Exportar CSV</button>") +
      '<div class="kpis"><div class="cartao kpi"><div class="rotulo">Em aberto</div><div class="valor">' + abertos.length + '</div><div class="sub">aguardando preparo ou entrega</div></div><div class="cartao kpi"><div class="rotulo">Pedidos hoje</div><div class="valor">' + deHoje.length + '</div><div class="sub">' + moeda(deHoje.reduce((s, p) => s + p.totais.total, 0)) + ' faturados</div></div><div class="cartao kpi"><div class="rotulo">Ticket médio hoje</div><div class="valor">' + moeda(deHoje.length ? deHoje.reduce((s, p) => s + p.totais.total, 0) / deHoje.length : 0) + '</div></div><div class="cartao kpi"><div class="rotulo">Total de pedidos</div><div class="valor">' + todos.length + '</div><div class="sub">' + BK.clientes().length + " clientes</div></div></div>" +
      '<div class="cartao"><div class="linha" style="margin-bottom:1rem"><label class="campo">Buscar<input data-f="busca" value="' + esc(filtroPed.busca) + '" placeholder="nº, nome ou telefone"/></label><label class="campo">Status<select data-f="status"><option value="">Todos</option>' + BK.STATUS.map((s) => '<option value="' + s.id + '"' + (filtroPed.status === s.id ? " selected" : "") + ">" + s.rotulo + "</option>").join("") + '<option value="cancelado"' + (filtroPed.status === "cancelado" ? " selected" : "") + '>Cancelado</option></select></label><label class="campo">De<input type="date" data-f="de" value="' + filtroPed.de + '"/></label><label class="campo">Até<input type="date" data-f="ate" value="' + filtroPed.ate + '"/></label></div>' +
      (lista.length ? '<div style="overflow:auto"><table><thead><tr><th>Pedido</th><th>Quando</th><th>Cliente</th><th>Itens</th><th>Modalidade</th><th>Total</th><th>Status</th></tr></thead><tbody>' + lista.map((p) => '<tr class="clicavel" data-pedido="' + p.numero + '"><td><b>' + p.numero + "</b></td><td>" + fmt(p.quando) + "</td><td>" + esc(p.cliente.nome) + '<div class="mini">' + esc(p.cliente.telefone) + "</div></td><td>" + p.itens.reduce((s, i) => s + i.qtd, 0) + "</td><td>" + (p.modalidade === "entrega" ? "Entrega · " + esc(p.bairro) : "Retirada") + "</td><td><b>" + moeda(p.totais.total) + "</b></td><td>" + pill(p.status) + "</td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Nenhum pedido ' + (todos.length ? "com esse filtro." : "ainda. Faça um pedido de teste no site ou gere exemplos em Configurações.") + "</div>") + "</div>";
    el.querySelectorAll("[data-f]").forEach((i) => i.addEventListener("input", () => { filtroPed[i.dataset.f] = i.value; telaPedidos(el); if (i.dataset.f === "busca") { const n = el.querySelector('[data-f="busca"]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }));
    el.querySelectorAll("[data-pedido]").forEach((tr) => tr.addEventListener("click", () => abrirPedido(tr.dataset.pedido)));
    const ex = el.querySelector("[data-exportar-pedidos]"); if (ex) ex.addEventListener("click", () => baixarCsv("pedidos.csv", [["numero", "data", "cliente", "telefone", "email", "modalidade", "bairro", "endereco", "itens", "subtotal", "desconto", "taxa", "total", "pagamento", "status"]].concat(todos.map((p) => [p.numero, fmt(p.quando), p.cliente.nome, p.cliente.telefone, p.cliente.email, p.modalidade, p.bairro, p.endereco, p.itens.map((i) => i.qtd + "x " + i.nome).join("; "), p.totais.subtotal, p.totais.desconto, p.totais.taxa, p.totais.total, p.pagamento.metodo, p.status]))));
  }
  let origemCliente = null;
  function abrirPedido(numero, deCliente) {
    const p = BK.pedido(numero); if (!p) return; origemCliente = deCliente || null;
    const etapas = BK.STATUS.filter((s) => !(s.soEntrega && p.modalidade !== "entrega") && !(s.soRetirada && p.modalidade !== "retirada"));
    const idx = etapas.findIndex((s) => s.id === p.status);
    const g = gaveta((origemCliente ? '<button class="btn pequeno" data-voltar-cliente style="margin-bottom:.75rem">' + icone("arrow-left") + "Voltar ao cliente</button>" : "") + '<p class="eyebrow">Pedido</p><h2>' + p.numero + " · " + pill(p.status) + '</h2><p class="mini">' + fmt(p.quando) + " · " + esc(p.pagamento.metodo) + " #" + esc(p.pagamento.codigo) + "</p>" +
      '<div class="cartao" style="margin-top:1rem"><b>' + esc(p.cliente.nome) + '</b><div class="mini">' + esc(p.cliente.telefone) + " · " + esc(p.cliente.email) + "</div><div class=\"mini\" style=\"margin-top:.35rem\">" + (p.modalidade === "entrega" ? "🚚 " + esc(p.endereco) + " — " + esc(p.bairro) + " (taxa " + moeda(p.totais.taxa) + ")" : "🏪 Retirada na loja") + '</div><div class="linha" style="margin-top:.75rem"><a class="btn pequeno whats" target="_blank" href="' + wa(p.cliente.telefone, "Oi, " + (p.cliente.nome || "").split(" ")[0] + "! Sobre o pedido " + p.numero + ": ") + '">' + icone("message-circle") + "Chamar no WhatsApp</a></div></div>" +
      '<div class="cartao" style="margin-top:.75rem"><table>' + p.itens.map((i) => "<tr><td>" + i.qtd + "× " + esc(i.nome) + '</td><td style="text-align:right">' + moeda(i.qtd * i.preco) + "</td></tr>").join("") + '<tr><td class="mini">Subtotal' + (p.cupom ? " · cupom " + esc(p.cupom.codigo) + " (-" + moeda(p.totais.desconto) + ")" : "") + (p.totais.taxa ? " · taxa " + moeda(p.totais.taxa) : "") + '</td><td style="text-align:right"><b>' + moeda(p.totais.total) + "</b></td></tr></table></div>" +
      '<h3 style="margin:1.25rem 0 .25rem;font-size:1rem">Avançar status</h3><p class="mini">Ao marcar <b>Saiu pra entrega</b> (ou <b>Pronto pra retirada</b>) o cliente recebe a mensagem automática no WhatsApp' + (cfg().mensagensAuto === false ? " (desligado em Configurações)" : "") + ".</p>" +
      '<div class="etapas">' + etapas.map((s, i) => '<button class="btn pequeno ' + (i < idx ? "feito" : i === idx ? "atual" : "") + '" data-status="' + s.id + '"' + (p.status === "cancelado" ? " disabled" : "") + ">" + (i < idx ? "✓ " : "") + s.rotulo + "</button>").join("") + "</div>" +
      '<div class="linha" style="margin-top:.5rem">' + (p.status !== "cancelado" && p.status !== "concluido" ? '<button class="btn pequeno perigo" data-status="cancelado">Cancelar pedido</button>' : "") + "</div>" +
      '<h3 style="margin:1.25rem 0 .5rem;font-size:1rem">Histórico</h3><div class="cartao">' + (p.historico || []).map((h) => '<div class="mini" style="padding:.25rem 0">' + fmt(h.quando) + " · <b>" + esc((BK.STATUS.find((s) => s.id === h.status) || { rotulo: h.status }).rotulo) + "</b>" + (h.obs ? " · " + esc(h.obs) : "") + "</div>").join("") + (p.mensagens || []).map((m) => '<div class="mini" style="padding:.25rem 0;color:#2F7D45">' + fmt(m.quando) + " · 💬 mensagem automática: “" + esc(m.texto) + "”</div>").join("") + "</div>");
    g.querySelectorAll("[data-status]").forEach((b) => b.addEventListener("click", () => mudarStatus(p.numero, b.dataset.status)));
    const v = g.querySelector("[data-voltar-cliente]"); if (v) v.addEventListener("click", () => abrirCliente(origemCliente));
  }
  function mudarStatus(numero, status) {
    const p = BK.pedido(numero); if (!p || p.status === status) return;
    if (status === "cancelado" && !confirm("Cancelar o pedido " + numero + "?")) return;
    const auto = cfg().mensagensAuto !== false;
    let texto = null;
    if (auto && (status === "saiu" || status === "pronto" || (cfg().mensagemConcluido && status === "concluido"))) texto = preencher(modelos()[status], p);
    BK.mudarStatus(numero, status, "pelo painel");
    if (texto) {
      // Simulação do envio automático: a mensagem é registrada como enviada e aparece pro cliente na página do pedido.
      // Em produção, este ponto chama a API de WhatsApp (oficial ou não) e o cliente recebe no aparelho.
      const q = BK.pedido(numero); q.mensagens = q.mensagens || []; q.mensagens.push({ quando: new Date().toISOString(), status, texto, canal: "whatsapp", envio: "automatico-simulado" }); BK.salvarPedido(q);
      toast("Status atualizado. Mensagem enviada automaticamente ao cliente (simulação).");
    } else toast("Status atualizado: " + ((BK.STATUS.find((s) => s.id === status) || { rotulo: status }).rotulo));
    abrirPedido(numero, origemCliente); render();
  }

  // ---------- CLIENTES ----------
  let buscaCli = "";
  function telaClientes(el) {
    const todos = BK.clientes().sort((a, b) => b.ultimo.localeCompare(a.ultimo));
    const q = buscaCli.trim().toLowerCase(); const cs = q ? todos.filter((c) => (c.nome + " " + c.email + " " + c.telefone).toLowerCase().includes(q)) : todos;
    el.innerHTML = topo("CRM", "Clientes", "Cadastro automático a partir dos pedidos pagos.", '<button class="btn" data-exportar-clientes>Exportar CSV</button>') +
      '<div class="cartao"><div class="linha" style="margin-bottom:1rem"><label class="campo" style="flex:1">Buscar por nome, e-mail ou telefone<input data-busca-cli value="' + esc(buscaCli) + '" placeholder="ex.: Ana, ana@..., 48 9..."/></label><span class="mini" style="padding-bottom:.6rem">' + cs.length + " de " + todos.length + " clientes</span></div>" + (cs.length ? '<div style="overflow:auto"><table><thead><tr><th>Cliente</th><th>Pedidos</th><th>Total gasto</th><th>Ticket</th><th>Último pedido</th><th>Bairro</th><th>Prefere</th></tr></thead><tbody>' + cs.map((c) => '<tr class="clicavel" data-cli="' + c.telefone + '"><td><b>' + esc(c.nome) + '</b><div class="mini">' + esc(c.telefone) + " · " + esc(c.email || "") + "</div></td><td>" + c.n + "</td><td><b>" + moeda(c.total) + "</b></td><td>" + moeda(c.ticket) + "</td><td>" + fmtD(c.ultimo) + '<div class="mini">há ' + c.diasSemPedido + " dias</div></td><td>" + esc(c.bairro || "—") + "</td><td>" + ((c.modalidades.entrega || 0) >= (c.modalidades.retirada || 0) ? "Entrega" : "Retirada") + "</td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Nenhum cliente ainda.</div>') + "</div>";
    el.querySelectorAll("[data-cli]").forEach((tr) => tr.addEventListener("click", () => abrirCliente(tr.dataset.cli)));
    const bi = el.querySelector("[data-busca-cli]"); bi.addEventListener("input", () => { buscaCli = bi.value; telaClientes(el); const n = el.querySelector("[data-busca-cli]"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    const ex = el.querySelector("[data-exportar-clientes]"); if (ex) ex.addEventListener("click", () => exportarClientes(cs));
  }
  function exportarClientes(cs) { baixarCsv("clientes.csv", [["nome", "telefone", "email", "pedidos", "total_gasto", "ticket_medio", "primeiro_pedido", "ultimo_pedido", "dias_sem_pedido", "bairro"]].concat(cs.map((c) => [c.nome, c.telefone, c.email, c.n, c.total.toFixed(2), c.ticket.toFixed(2), fmtD(c.primeiro), fmtD(c.ultimo), c.diasSemPedido, c.bairro]))); }
  function abrirCliente(t) {
    const c = BK.clientePorTelefone(t); if (!c) return;
    const prods = Object.keys(c.produtos).sort((a, b) => c.produtos[b] - c.produtos[a]).slice(0, 8);
    const g = gaveta('<p class="eyebrow">Cliente</p><h2>' + esc(c.nome) + '</h2><p class="mini">' + esc(c.telefone) + " · " + esc(c.email || "") + "</p>" +
      '<div class="kpis" style="margin-top:1rem"><div class="cartao kpi"><div class="rotulo">Pedidos</div><div class="valor">' + c.n + '</div></div><div class="cartao kpi"><div class="rotulo">Total</div><div class="valor">' + moeda(c.total) + '</div></div><div class="cartao kpi"><div class="rotulo">Ticket</div><div class="valor">' + moeda(c.ticket) + "</div></div></div>" +
      '<div class="linha"><a class="btn whats" target="_blank" href="' + wa(c.telefone, "Oi, " + c.nome.split(" ")[0] + "! Aqui é da " + cfg().nomeCompleto + ". ") + '">' + icone("message-circle") + "WhatsApp</a></div>" +
      '<h3 style="margin:1.25rem 0 .5rem;font-size:1rem">Mais comprados</h3><div class="cartao">' + prods.map((id) => { const p = BK.produto(id); return '<div class="mini" style="display:flex;justify-content:space-between;padding:.25rem 0"><span>' + esc(p ? p.nome : id) + "</span><b>" + c.produtos[id] + " un.</b></div>"; }).join("") + "</div>" +
      '<h3 style="margin:1.25rem 0 .5rem;font-size:1rem">Pedidos</h3><div class="cartao">' + c.pedidos.slice().reverse().map((p) => '<div class="clicavel" data-pedido="' + p.numero + '" style="display:flex;justify-content:space-between;gap:.5rem;padding:.4rem 0;border-bottom:1px solid var(--line)"><span><b>' + p.numero + '</b> <span class="mini">' + fmt(p.quando) + "</span></span><span>" + moeda(p.totais.total) + " " + pill(p.status) + "</span></div>").join("") + "</div>");
    g.querySelectorAll("[data-pedido]").forEach((d) => d.addEventListener("click", () => abrirPedido(d.dataset.pedido, c.telefone)));
  }

  // ---------- PRODUTOS ----------
  const filtroProd = { busca: "", cat: "" };
  function telaProdutos(el) {
    const todos = BK.produtos();
    const lista = todos.filter((p) => (!filtroProd.cat || p.categoria === filtroProd.cat) && (!filtroProd.busca || p.nome.toLowerCase().includes(filtroProd.busca.toLowerCase())));
    el.innerHTML = topo("Catálogo", "Produtos", todos.length + " produtos · " + todos.filter((p) => p.ativo !== false).length + " ativos no site", '<button class="btn" data-restaurar>Restaurar catálogo original</button><button class="btn primario" data-novo>' + icone("plus") + "Novo produto</button>") +
      '<div class="cartao"><div class="linha" style="margin-bottom:1rem"><label class="campo">Buscar<input data-f="busca" value="' + esc(filtroProd.busca) + '" placeholder="nome do produto"/></label><label class="campo">Categoria<select data-f="cat"><option value="">Todas</option>' + BK.CATEGORIAS.map((c) => '<option' + (filtroProd.cat === c ? " selected" : "") + ">" + c + "</option>").join("") + "</select></label></div>" +
      '<div style="overflow:auto"><table><thead><tr><th></th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Situação</th><th></th></tr></thead><tbody>' + lista.map((p) => '<tr><td><img class="thumb" src="../' + esc(p.imagem || "") + '" onerror="this.src=\'../imagens/marca/logo-bread-king-CVrHv7_B.png\'"/></td><td><b>' + esc(p.nome) + '</b><div class="mini">' + esc(p.peso || "") + "</div></td><td>" + esc(p.categoria) + "</td><td><b>" + moeda(p.preco) + "</b></td><td>" + (p.ativo === false ? '<span class="pill inativo">Oculto</span>' : '<span class="pill ativo">Ativo</span>') + (p.destaque ? ' <span class="pill destaque">⭐ Destaque</span>' : "") + '</td><td style="white-space:nowrap"><button class="btn pequeno" data-editar="' + p.id + '">Editar</button> <button class="btn pequeno" data-toggle="' + p.id + '">' + (p.ativo === false ? "Ativar" : "Ocultar") + '</button> <button class="btn pequeno perigo" data-excluir="' + p.id + '">Excluir</button></td></tr>').join("") + "</tbody></table></div></div>";
    el.querySelectorAll("[data-f]").forEach((i) => i.addEventListener("input", () => { filtroProd[i.dataset.f] = i.value; telaProdutos(el); if (i.dataset.f === "busca") { const n = el.querySelector('[data-f="busca"]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }));
    el.querySelector("[data-novo]").addEventListener("click", () => editarProduto(null));
    el.querySelector("[data-restaurar]").addEventListener("click", () => { if (confirm("Isso apaga todas as edições de produtos e volta ao catálogo clonado. Continuar?")) { BK.restaurarCatalogo(); toast("Catálogo restaurado."); render(); } });
    el.querySelectorAll("[data-editar]").forEach((b) => b.addEventListener("click", () => editarProduto(b.dataset.editar)));
    el.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => { const p = BK.produto(b.dataset.toggle); p.ativo = p.ativo === false; BK.salvarProduto(p); toast(p.ativo ? "Produto visível no site." : "Produto oculto do site."); }));
    el.querySelectorAll("[data-excluir]").forEach((b) => b.addEventListener("click", () => { const p = BK.produto(b.dataset.excluir); if (confirm('Excluir "' + p.nome + '"? (Pra só tirar do site, use Ocultar.)')) { BK.excluirProduto(p.id); toast("Produto excluído."); } }));
  }
  function editarProduto(id) {
    const p = id ? Object.assign({}, BK.produto(id)) : { id: "", nome: "", categoria: BK.CATEGORIAS[0], peso: "", descricao: "", preco: 0, destaque: false, ativo: true, imagem: "" };
    const g = gaveta('<p class="eyebrow">Produto</p><h2>' + (id ? "Editar produto" : "Novo produto") + '</h2><form id="fp" style="display:grid;gap:.75rem;margin-top:1rem">' +
      '<label class="campo">Nome<input name="nome" required value="' + esc(p.nome) + '"/></label>' +
      '<div class="grade2"><label class="campo">Categoria<select name="categoria">' + BK.CATEGORIAS.map((c) => '<option' + (p.categoria === c ? " selected" : "") + ">" + c + "</option>").join("") + '</select></label><label class="campo">Peso / quantidade<input name="peso" value="' + esc(p.peso || "") + '" placeholder="ex.: 800g ou C/12 un"/></label></div>' +
      '<div class="grade2"><label class="campo">Preço (R$)<input name="preco" type="number" step="0.01" min="0" required value="' + p.preco + '"/></label><label class="campo">Situação<select name="ativo"><option value="1"' + (p.ativo !== false ? " selected" : "") + '>Ativo no site</option><option value="0"' + (p.ativo === false ? " selected" : "") + '>Oculto</option></select></label></div>' +
      '<label class="campo">Descrição<textarea name="descricao">' + esc(p.descricao || "") + '</textarea></label>' +
      '<label class="campo"><span>Foto</span><div class="linha"><img class="thumb" id="prev" src="' + (p.imagem ? (p.imagem.startsWith("data:") ? p.imagem : "../" + esc(p.imagem)) : "") + '" onerror="this.style.visibility=\'hidden\'"/><input type="file" accept="image/*" id="foto" style="height:auto;padding:.4rem"/></div><span class="mini" style="font-weight:400">Ou um caminho em imagens/produtos/. A foto é redimensionada pra 800px.</span><input name="imagem" value="' + esc(p.imagem && !p.imagem.startsWith("data:") ? p.imagem : "") + '" placeholder="imagens/produtos/arquivo.jpg"/></label>' +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="destaque" style="height:auto"' + (p.destaque ? " checked" : "") + "/> Marcar como Destaque</label>" +
      '<div class="linha" style="justify-content:flex-end;margin-top:.5rem"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Salvar</button></div></form>');
    let dataUrl = p.imagem && p.imagem.startsWith("data:") ? p.imagem : null;
    g.querySelector("#foto").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const r = Math.min(1, 800 / Math.max(img.width, img.height)); c.width = img.width * r; c.height = img.height * r; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); dataUrl = c.toDataURL("image/jpeg", .85); g.querySelector("#prev").src = dataUrl; g.querySelector("#prev").style.visibility = "visible"; }; img.src = URL.createObjectURL(f); });
    g.querySelector("#fp").addEventListener("submit", (e) => {
      e.preventDefault(); const d = new FormData(e.target);
      const n = { id: p.id || BK.novoIdProduto(d.get("nome")), nome: d.get("nome").trim(), categoria: d.get("categoria"), peso: d.get("peso").trim(), descricao: d.get("descricao").trim(), preco: Number(d.get("preco")), destaque: !!d.get("destaque"), ativo: d.get("ativo") === "1", imagem: dataUrl || d.get("imagem").trim() || p.imagem || "" };
      BK.salvarProduto(n); fecharGaveta(); toast("Produto salvo."); render();
    });
  }

  // ---------- SEGMENTAÇÕES ----------
  const PRONTAS = [
    { nome: "Inativos há 45+ dias", desc: "Reativação com cupom", f: { inativoDias: 45 } },
    { nome: "Compraram só 1 vez", desc: "Converter em recorrente", f: { pedidosMax: 1 } },
    { nome: "Fiéis (3+ pedidos)", desc: "Programa VIP, novidades", f: { pedidosMin: 3 } },
    { nome: "Top 20% em gasto", desc: "Ofertas premium", f: { top: 20 } },
    { nome: "Compraram nos últimos 30 dias", desc: "Pedir avaliação, cross-sell", f: { ultimoDe: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10) } },
    { nome: "Só retirada", desc: "Incentivar entrega", f: { modalidade: "retirada" } },
    { nome: "Nunca usaram cupom", desc: "Testar sensibilidade a desconto", f: { cupom: "nunca" } }
  ];
  let seg = { nome: "", ultimoDe: "", ultimoAte: "", inativoDias: "", pedidosMin: "", pedidosMax: "", produto: "", categoria: "", categoriaNunca: "", ticketMin: "", totalMin: "", top: "", bairro: "", modalidade: "", cupom: "" };
  let msgSeg = "Oi, {nome}! Aqui é da " + U.nomeCompleto + ". ";
  function aplicarSeg(cs) {
    let r = cs.filter((c) => {
      if (seg.ultimoDe && c.ultimo < seg.ultimoDe) return false;
      if (seg.ultimoAte && c.ultimo > seg.ultimoAte + "T23:59:59") return false;
      if (seg.inativoDias && c.diasSemPedido < Number(seg.inativoDias)) return false;
      if (seg.pedidosMin && c.n < Number(seg.pedidosMin)) return false;
      if (seg.pedidosMax && c.n > Number(seg.pedidosMax)) return false;
      if (seg.produto && !c.produtos[seg.produto]) return false;
      if (seg.categoria && !c.categorias[seg.categoria]) return false;
      if (seg.categoriaNunca && c.categorias[seg.categoriaNunca]) return false;
      if (seg.ticketMin && c.ticket < Number(seg.ticketMin)) return false;
      if (seg.totalMin && c.total < Number(seg.totalMin)) return false;
      if (seg.bairro && c.bairro !== seg.bairro) return false;
      if (seg.modalidade && !((c.modalidades[seg.modalidade] || 0) > 0 && Object.keys(c.modalidades).length === 1)) return false;
      if (seg.cupom === "nunca" && c.cupons > 0) return false;
      if (seg.cupom === "sempre" && c.cupons < c.n) return false;
      return true;
    });
    if (seg.top) { r = r.sort((a, b) => b.total - a.total).slice(0, Math.max(1, Math.ceil(r.length * Number(seg.top) / 100))); }
    if (seg.produto) r = r.sort((a, b) => (b.produtos[seg.produto] || 0) - (a.produtos[seg.produto] || 0));
    return r;
  }
  function telaSegmentos(el) {
    const cs = BK.clientes(); const res = aplicarSeg(cs); const prods = BK.produtos(); const salvos = cfg().segmentosSalvos || [];
    const sel = (nome, rot, ops) => '<label class="campo">' + rot + '<select data-s="' + nome + '"><option value="">—</option>' + ops.map((o) => '<option value="' + esc(o[0]) + '"' + (String(seg[nome]) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>").join("") + "</select></label>";
    const inp = (nome, rot, tipo, ph) => '<label class="campo">' + rot + '<input data-s="' + nome + '" type="' + (tipo || "text") + '" value="' + esc(seg[nome]) + '" placeholder="' + (ph || "") + '"/></label>';
    el.innerHTML = topo("Campanhas", "Segmentações", "Combine filtros, veja quem entra e dispare no WhatsApp. Sem API, o envio abre uma conversa por cliente.", '<button class="btn" data-limpar-seg>Limpar filtros</button>') +
      '<div class="cartao" style="margin-bottom:1rem"><p class="eyebrow" style="margin-bottom:.5rem">Públicos prontos</p><div class="lista-seg">' + PRONTAS.concat(salvos).map((s, i) => '<div class="card-seg" data-pronta="' + i + '"><b>' + esc(s.nome) + '</b><span class="mini">' + esc(s.desc || "") + "</span></div>").join("") + "</div></div>" +
      '<div class="cartao"><p class="eyebrow" style="margin-bottom:.5rem">Filtros</p><div class="grade3">' +
      inp("ultimoDe", "Último pedido de", "date") + inp("ultimoAte", "Último pedido até", "date") + inp("inativoDias", "Sem pedir há (dias) ≥", "number", "ex.: 45") +
      inp("pedidosMin", "Nº de pedidos ≥", "number") + inp("pedidosMax", "Nº de pedidos ≤", "number") + inp("top", "Top % em gasto", "number", "ex.: 20") +
      sel("produto", "Comprou o produto", prods.map((p) => [p.id, p.nome])) + sel("categoria", "Comprou a categoria", BK.CATEGORIAS.map((c) => [c, c])) + sel("categoriaNunca", "Nunca comprou a categoria", BK.CATEGORIAS.map((c) => [c, c])) +
      inp("ticketMin", "Ticket médio ≥ R$", "number") + inp("totalMin", "Total gasto ≥ R$", "number") + sel("bairro", "Bairro", cfg().taxasEntrega.map((t) => [t.bairro, t.bairro])) +
      sel("modalidade", "Só pede por", [["entrega", "Entrega"], ["retirada", "Retirada"]]) + sel("cupom", "Cupom", [["nunca", "Nunca usou"], ["sempre", "Sempre usa"]]) + "</div>" +
      '<div class="linha" style="margin-top:1rem;align-items:center"><h3 style="font-size:1.1rem">' + res.length + " cliente" + (res.length === 1 ? "" : "s") + " no público</h3><span style=\"flex:1\"></span><button class=\"btn pequeno\" data-salvar-seg>Salvar público</button><button class=\"btn pequeno\" data-csv-seg" + (res.length ? "" : " disabled") + ">Exportar CSV</button></div>" +
      '<label class="campo" style="margin-top:.75rem">Mensagem da campanha (use {nome})<textarea data-msg>' + esc(msgSeg) + "</textarea></label>" +
      (res.length ? '<div style="overflow:auto;margin-top:.75rem"><table><thead><tr><th>Cliente</th><th>Pedidos</th><th>Total</th><th>Último</th><th>Bairro</th><th></th></tr></thead><tbody>' + res.map((c) => "<tr><td><b>" + esc(c.nome) + '</b><div class="mini">' + esc(c.telefone) + "</div></td><td>" + c.n + "</td><td>" + moeda(c.total) + "</td><td>" + fmtD(c.ultimo) + "</td><td>" + esc(c.bairro || "—") + '</td><td><a class="btn pequeno whats" target="_blank" data-disparo="' + c.telefone + '" href="' + wa(c.telefone, msgSeg.replace(/\{nome\}/g, c.nome.split(" ")[0])) + '">' + icone("message-circle") + "Enviar</a></td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Nenhum cliente com esses filtros.</div>') + "</div>";
    el.querySelectorAll("[data-s]").forEach((i) => i.addEventListener("change", () => { seg[i.dataset.s] = i.value; telaSegmentos(el); }));
    el.querySelector("[data-msg]").addEventListener("input", (e) => { msgSeg = e.target.value; el.querySelectorAll("[data-disparo]").forEach((a) => { const c = cs.find((x) => x.telefone === a.dataset.disparo); a.href = wa(c.telefone, msgSeg.replace(/\{nome\}/g, c.nome.split(" ")[0])); }); });
    el.querySelector("[data-limpar-seg]").addEventListener("click", () => { Object.keys(seg).forEach((k) => (seg[k] = "")); telaSegmentos(el); });
    el.querySelectorAll("[data-pronta]").forEach((d) => d.addEventListener("click", () => { const s = PRONTAS.concat(salvos)[Number(d.dataset.pronta)]; Object.keys(seg).forEach((k) => (seg[k] = "")); Object.assign(seg, s.f); telaSegmentos(el); }));
    el.querySelector("[data-salvar-seg]").addEventListener("click", () => { const nome = prompt("Nome do público:"); if (!nome) return; const c = cfg(); const l = c.segmentosSalvos || []; l.push({ nome, desc: "salvo em " + fmtD(new Date().toISOString()), f: Object.assign({}, seg) }); BK.salvarConfig(Object.assign(BK.ler("bk_db_config", {}), { segmentosSalvos: l })); toast("Público salvo."); });
    const csv = el.querySelector("[data-csv-seg]"); if (csv) csv.addEventListener("click", () => exportarClientes(res));
  }

  // ---------- DESEMPENHO (gráficos) ----------
  let perDes = { meses: 6, de: "", ate: "" };
  function pedidosPeriodo(de, ate) { return BK.pedidos().filter((p) => p.status !== "cancelado" && (!de || p.quando >= de) && (!ate || p.quando <= ate + "T23:59:59")); }
  function limitesPeriodo() {
    if (perDes.de || perDes.ate) return { de: perDes.de, ate: perDes.ate };
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (perDes.meses - 1)); return { de: d.toISOString().slice(0, 10), ate: "" };
  }
  function porMes(ps) {
    const m = {}; ps.forEach((p) => { const k = p.quando.slice(0, 7); const o = m[k] || (m[k] = { k, n: 0, fat: 0 }); o.n++; o.fat += p.totais.total; });
    const { de } = limitesPeriodo(); const ini = new Date((de || (ps[0] && ps[0].quando) || new Date().toISOString()).slice(0, 7) + "-01T12:00:00"); const fim = new Date(); const out = [];
    for (let d = new Date(ini); d <= fim; d.setMonth(d.getMonth() + 1)) { const k = d.toISOString().slice(0, 7); const o = m[k] || { k, n: 0, fat: 0 }; out.push({ k, rotulo: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""), n: o.n, fat: o.fat, ticket: o.n ? o.fat / o.n : 0 }); }
    return out;
  }
  // Gráfico de barras de uma série (SVG puro): barras finas, topo arredondado, grade recessiva, destaque no maior valor, hover com tooltip, tabela alternativa.
  function grafico(titulo, dados, campo, fmtV) {
    const W = 640, H = 240, L = 56, R = 12, T = 18, B = 34; const max = Math.max(1, ...dados.map((d) => d[campo])); const iw = W - L - R, ih = H - T - B; const n = dados.length; const gap = Math.max(4, iw / n * 0.35); const bw = (iw - gap * (n - 1)) / n;
    const ticks = [0, .25, .5, .75, 1].map((f) => f * max); const iMax = dados.reduce((m, d, i) => (d[campo] > dados[m][campo] ? i : m), 0);
    const grade = ticks.map((t) => { const y = T + ih - t / max * ih; return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#EADCC6" stroke-width="1"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#7A655B">' + fmtV(t, true) + "</text>"; }).join("");
    const barras = dados.map((d, i) => { const h = Math.max(d[campo] > 0 ? 3 : 0, d[campo] / max * ih); const x = L + i * (bw + gap); const y = T + ih - h; return '<g class="barra" data-i="' + i + '"><rect x="' + x + '" y="' + T + '" width="' + bw + '" height="' + ih + '" fill="transparent"/><path d="M' + x + ' ' + (T + ih) + ' v-' + Math.max(0, h - 4) + ' a4 4 0 0 1 4 -4 h' + Math.max(0, bw - 8) + ' a4 4 0 0 1 4 4 v' + Math.max(0, h - 4) + ' z" fill="' + (i === iMax ? "#B8172E" : "#D9909A") + '"/>' + (i === iMax && d[campo] > 0 ? '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#2A1612">' + fmtV(d[campo]) + "</text>" : "") + '<text x="' + (x + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#7A655B">' + esc(d.rotulo) + "</text></g>"; }).join("");
    const id = "g" + Math.random().toString(36).slice(2, 7);
    return '<div class="cartao" style="position:relative"><div class="linha" style="justify-content:space-between;align-items:center;margin-bottom:.5rem"><h3 style="font-size:1rem">' + titulo + '</h3><button class="btn pequeno" data-tabela="' + id + '">Ver tabela</button></div>' +
      '<svg id="' + id + '" viewBox="0 0 ' + W + " " + H + '" width="100%" style="display:block;font-family:Inter,sans-serif">' + grade + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ih) + '" y2="' + (T + ih) + '" stroke="#CBB8A0"/>' + barras + "</svg>" +
      '<div class="tip hidden" style="position:absolute;pointer-events:none;background:#2A1612;color:#FFF8EE;font-size:.78rem;padding:.4rem .6rem;border-radius:.5rem;white-space:nowrap"></div>' +
      '<table class="hidden" data-tabela-de="' + id + '" style="margin-top:.5rem"><thead><tr><th>Mês</th><th>' + titulo + "</th></tr></thead><tbody>" + dados.map((d) => "<tr><td>" + esc(d.rotulo) + "</td><td>" + fmtV(d[campo]) + "</td></tr>").join("") + "</tbody></table></div>";
  }
  function ligarGraficos(el, dados, campos) {
    el.querySelectorAll("svg").forEach((svg, gi) => {
      const tip = svg.parentElement.querySelector(".tip"); const [campo, fmtV] = campos[gi];
      svg.querySelectorAll(".barra").forEach((g) => { g.addEventListener("mousemove", (e) => { const d = dados[Number(g.dataset.i)]; const r = svg.parentElement.getBoundingClientRect(); tip.classList.remove("hidden"); tip.textContent = d.rotulo + ": " + fmtV(d[campo]) + " · " + d.n + " pedido" + (d.n === 1 ? "" : "s"); tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top - 34) + "px"; }); g.addEventListener("mouseleave", () => tip.classList.add("hidden")); });
    });
    el.querySelectorAll("[data-tabela]").forEach((b) => b.addEventListener("click", () => { const t = el.querySelector('[data-tabela-de="' + b.dataset.tabela + '"]'); const svg = el.querySelector("#" + b.dataset.tabela); t.classList.toggle("hidden"); svg.classList.toggle("hidden"); b.textContent = t.classList.contains("hidden") ? "Ver tabela" : "Ver gráfico"; }));
  }
  function telaDesempenho(el) {
    const { de, ate } = limitesPeriodo(); const ps = pedidosPeriodo(de, ate); const meses = porMes(ps);
    const fat = ps.reduce((s, p) => s + p.totais.total, 0); const fmtR = (v, curto) => curto ? (v >= 1000 ? "R$ " + (v / 1000).toFixed(1).replace(".", ",") + " mil" : "R$ " + Math.round(v)) : moeda(v); const fmtN = (v) => String(Math.round(v));
    el.innerHTML = topo("Relatórios", "Desempenho", "Faturamento, ticket médio e nº de pedidos por mês.") +
      '<div class="cartao" style="margin-bottom:1rem"><div class="linha" style="align-items:center"><div class="chips">' + [3, 6, 12].map((m) => '<button class="chip ' + (!perDes.de && !perDes.ate && perDes.meses === m ? "on" : "") + '" data-meses="' + m + '">Últimos ' + m + " meses</button>").join("") + '</div><span class="mini">ou período:</span><label class="campo">De<input type="date" data-pd="de" value="' + perDes.de + '"/></label><label class="campo">Até<input type="date" data-pd="ate" value="' + perDes.ate + '"/></label></div></div>' +
      '<div class="kpis"><div class="cartao kpi"><div class="rotulo">Faturamento</div><div class="valor">' + moeda(fat) + '</div><div class="sub">no período</div></div><div class="cartao kpi"><div class="rotulo">Pedidos</div><div class="valor">' + ps.length + '</div></div><div class="cartao kpi"><div class="rotulo">Ticket médio</div><div class="valor">' + moeda(ps.length ? fat / ps.length : 0) + '</div></div><div class="cartao kpi"><div class="rotulo">Clientes que compraram</div><div class="valor">' + new Set(ps.map((p) => String(p.cliente.telefone).replace(/\D/g, ""))).size + "</div></div></div>" +
      (ps.length ? '<div style="display:grid;gap:1rem">' + grafico("Faturamento (R$)", meses, "fat", fmtR) + grafico("Ticket médio (R$)", meses, "ticket", fmtR) + grafico("Número de pedidos", meses, "n", fmtN) + "</div>" : '<div class="cartao vazio">Sem pedidos no período. Gere pedidos de exemplo em Configurações pra ver os gráficos.</div>');
    el.querySelectorAll("[data-meses]").forEach((b) => b.addEventListener("click", () => { perDes = { meses: Number(b.dataset.meses), de: "", ate: "" }; telaDesempenho(el); }));
    el.querySelectorAll("[data-pd]").forEach((i) => i.addEventListener("change", () => { perDes[i.dataset.pd] = i.value; telaDesempenho(el); }));
    ligarGraficos(el, meses, [["fat", fmtR], ["ticket", fmtR], ["n", fmtN]]);
  }

  // ---------- CURVA ABC ----------
  let abc = { tipo: "produtos", de: "", ate: "" };
  function telaAbc(el) {
    const ps = pedidosPeriodo(abc.de, abc.ate); const tot = {};
    if (abc.tipo === "produtos") ps.forEach((p) => p.itens.forEach((i) => { const o = tot[i.id] || (tot[i.id] = { nome: i.nome, qtd: 0, valor: 0, cat: i.categoria || (BK.produto(i.id) || {}).categoria || "" }); o.qtd += i.qtd; o.valor += i.qtd * i.preco; }));
    else ps.forEach((p) => { const k = String(p.cliente.telefone).replace(/\D/g, ""); const o = tot[k] || (tot[k] = { nome: p.cliente.nome, qtd: 0, valor: 0, cat: k }); o.qtd++; o.valor += p.totais.total; });
    const lista = Object.values(tot).sort((a, b) => b.valor - a.valor); const total = lista.reduce((s, x) => s + x.valor, 0); let acum = 0;
    lista.forEach((x) => { acum += x.valor; x.pct = total ? x.valor / total * 100 : 0; x.acum = total ? acum / total * 100 : 0; x.classe = x.acum <= 80 ? "A" : x.acum <= 95 ? "B" : "C"; });
    const cont = (c) => lista.filter((x) => x.classe === c); const res = ["A", "B", "C"].map((c) => ({ c, n: cont(c).length, v: cont(c).reduce((s, x) => s + x.valor, 0) }));
    el.innerHTML = topo("Relatórios", "Curva ABC", "Classe A = itens que somam 80% da receita; B = próximos 15%; C = últimos 5%.") +
      '<div class="cartao" style="margin-bottom:1rem"><div class="linha" style="align-items:center"><div class="chips"><button class="chip ' + (abc.tipo === "produtos" ? "on" : "") + '" data-tipo="produtos">Produtos</button><button class="chip ' + (abc.tipo === "clientes" ? "on" : "") + '" data-tipo="clientes">Clientes</button></div><label class="campo">De<input type="date" data-abc="de" value="' + abc.de + '"/></label><label class="campo">Até<input type="date" data-abc="ate" value="' + abc.ate + '"/></label><span style="flex:1"></span><button class="btn" data-csv-abc>Exportar CSV</button></div></div>' +
      '<div class="kpis">' + res.map((r) => '<div class="cartao kpi"><div class="rotulo">Classe ' + r.c + '</div><div class="valor">' + r.n + " " + (abc.tipo === "produtos" ? "produto" : "cliente") + (r.n === 1 ? "" : "s") + '</div><div class="sub">' + moeda(r.v) + " · " + (total ? Math.round(r.v / total * 100) : 0) + "% da receita</div></div>").join("") + "</div>" +
      '<div class="cartao">' + (lista.length ? '<div style="overflow:auto"><table><thead><tr><th>#</th><th>' + (abc.tipo === "produtos" ? "Produto" : "Cliente") + "</th><th>" + (abc.tipo === "produtos" ? "Categoria" : "Telefone") + '</th><th>Qtd</th><th>Receita</th><th>% </th><th>% acum.</th><th>Classe</th></tr></thead><tbody>' + lista.map((x, i) => "<tr><td>" + (i + 1) + "</td><td><b>" + esc(x.nome) + "</b></td><td>" + esc(x.cat) + "</td><td>" + x.qtd + "</td><td>" + moeda(x.valor) + "</td><td>" + x.pct.toFixed(1) + "%</td><td>" + x.acum.toFixed(1) + '%</td><td><span class="pill ' + (x.classe === "A" ? "concluido" : x.classe === "B" ? "preparo" : "cancelado") + '">' + x.classe + "</span></td></tr>").join("") + "</tbody></table></div>" : '<div class="vazio">Sem pedidos no período.</div>') + "</div>";
    el.querySelectorAll("[data-tipo]").forEach((b) => b.addEventListener("click", () => { abc.tipo = b.dataset.tipo; telaAbc(el); }));
    el.querySelectorAll("[data-abc]").forEach((i) => i.addEventListener("change", () => { abc[i.dataset.abc] = i.value; telaAbc(el); }));
    el.querySelector("[data-csv-abc]").addEventListener("click", () => baixarCsv("curva-abc-" + abc.tipo + ".csv", [["posicao", "nome", abc.tipo === "produtos" ? "categoria" : "telefone", "quantidade", "receita", "pct", "pct_acumulado", "classe"]].concat(lista.map((x, i) => [i + 1, x.nome, x.cat, x.qtd, x.valor.toFixed(2), x.pct.toFixed(1), x.acum.toFixed(1), x.classe]))));
  }

  // ---------- CONFIGURAÇÕES ----------
  function telaConfig(el) {
    const c = cfg(); const m = modelos();
    el.innerHTML = topo("Unidade", "Configurações", "Dados da loja, taxas por bairro, cupons e mensagens automáticas.") +
      '<form id="fc" style="display:grid;gap:1rem"><div class="cartao"><p class="eyebrow" style="margin-bottom:.75rem">Loja</p><div class="grade2">' +
      '<label class="campo">Nome da unidade<input name="nome" value="' + esc(c.nome) + '"/></label><label class="campo">Nome completo<input name="nomeCompleto" value="' + esc(c.nomeCompleto) + '"/></label>' +
      '<label class="campo">WhatsApp (só números, com 55)<input name="whatsapp" value="' + esc(c.whatsapp) + '"/></label><label class="campo">WhatsApp formatado<input name="whatsappFormatado" value="' + esc(c.whatsappFormatado) + '"/></label>' +
      '<label class="campo">Endereço<input name="endereco" value="' + esc(c.endereco) + '"/></label><label class="campo">Bairro / cidade<input name="bairroCidade" value="' + esc(c.bairro + " | " + c.cidade) + '" placeholder="Bairro | Cidade, UF"/></label>' +
      '<label class="campo">Horário<input name="horario" value="' + esc(c.horario) + '"/></label><label class="campo">Senha do painel<input name="senha" type="password" value="' + esc(c.admin && c.admin.senha || "breadking") + '"/></label></div>' +
      '<label class="campo" style="margin-top:.75rem">Texto da entrega (página do pedido)<textarea name="textoEntrega">' + esc(c.textoEntrega) + "</textarea></label></div>" +
      '<div class="cartao"><p class="eyebrow" style="margin-bottom:.75rem">Taxa de entrega por bairro</p><label class="campo">Um por linha: <code>Bairro; valor</code><textarea name="taxas" style="min-height:10rem">' + esc(c.taxasEntrega.map((t) => t.bairro + "; " + t.taxa.toFixed(2)).join("\n")) + "</textarea></label></div>" +
      '<div class="cartao"><p class="eyebrow" style="margin-bottom:.75rem">Cupons</p><label class="campo">Um por linha: <code>CODIGO; desconto em %</code><textarea name="cupons">' + esc(c.cupons.map((x) => x.codigo + "; " + x.desconto).join("\n")) + "</textarea></label></div>" +
      '<div class="cartao"><p class="eyebrow" style="margin-bottom:.75rem">Mensagens automáticas de status</p><p class="mini" style="margin-bottom:.75rem">Variáveis: {nome} {numero} {loja} {endereco} {total}. O envio é automático ao mudar o status. Nesta simulação a mensagem é registrada no pedido e aparece pro cliente na página de acompanhamento; em produção sai pela API de WhatsApp.</p>' +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem;margin-bottom:.75rem"><input type="checkbox" name="mensagensAuto" style="height:auto"' + (c.mensagensAuto !== false ? " checked" : "") + "/> Enviar automaticamente ao marcar “Saiu pra entrega” / “Pronto pra retirada”</label>" +
      '<label class="campo" style="flex-direction:row;align-items:center;gap:.5rem;margin-bottom:.75rem"><input type="checkbox" name="mensagemConcluido" style="height:auto"' + (c.mensagemConcluido ? " checked" : "") + "/> Também enviar ao concluir</label>" +
      '<div class="grade2"><label class="campo">Saiu pra entrega<textarea name="m_saiu">' + esc(m.saiu) + '</textarea></label><label class="campo">Pronto pra retirada<textarea name="m_pronto">' + esc(m.pronto) + '</textarea></label><label class="campo">Concluído<textarea name="m_concluido">' + esc(m.concluido) + "</textarea></label></div></div>" +
      '<div class="linha" style="justify-content:flex-end"><button class="btn primario">Salvar configurações</button></div></form>' +
      '<div class="cartao" style="margin-top:1.5rem"><p class="eyebrow" style="margin-bottom:.5rem">Simulação</p><p class="mini" style="margin-bottom:.75rem">Ferramentas pra testar o painel sem pedidos reais.</p><div class="linha"><button class="btn dourado" data-exemplos>Gerar 40 pedidos de exemplo</button><button class="btn perigo" data-apagar-pedidos>Apagar todos os pedidos</button><button class="btn perigo" data-zerar>Zerar tudo (produtos, pedidos, config)</button></div></div>';
    el.querySelector("#fc").addEventListener("submit", (e) => {
      e.preventDefault(); const d = new FormData(e.target); const bc = (d.get("bairroCidade") || "").split("|");
      const novo = { nome: d.get("nome").trim(), nomeCompleto: d.get("nomeCompleto").trim(), whatsapp: d.get("whatsapp").replace(/\D/g, ""), whatsappFormatado: d.get("whatsappFormatado").trim(), endereco: d.get("endereco").trim(), bairro: (bc[0] || "").trim(), cidade: (bc[1] || "").trim(), horario: d.get("horario").trim(), textoEntrega: d.get("textoEntrega").trim(), admin: { senha: d.get("senha") || "breadking" },
        taxasEntrega: d.get("taxas").split("\n").map((l) => l.split(";")).filter((x) => x[0] && x[0].trim()).map((x) => ({ bairro: x[0].trim(), taxa: Number(String(x[1] || "0").replace(",", ".")) || 0 })),
        cupons: d.get("cupons").split("\n").map((l) => l.split(";")).filter((x) => x[0] && x[0].trim()).map((x) => ({ codigo: x[0].trim().toUpperCase(), desconto: Number(x[1]) || 0 })),
        mensagensAuto: !!d.get("mensagensAuto"), mensagemConcluido: !!d.get("mensagemConcluido"), modelosMensagem: { saiu: d.get("m_saiu"), pronto: d.get("m_pronto"), concluido: d.get("m_concluido") }, segmentosSalvos: c.segmentosSalvos || [] };
      BK.salvarConfig(novo); Object.assign(U, novo); toast("Configurações salvas."); render();
    });
    el.querySelector("[data-exemplos]").addEventListener("click", () => { gerarExemplos(); toast("40 pedidos de exemplo criados (últimos 6 meses)."); });
    el.querySelector("[data-apagar-pedidos]").addEventListener("click", () => { if (confirm("Apagar todos os pedidos e clientes?")) { localStorage.removeItem("bk_db_pedidos"); toast("Pedidos apagados."); render(); } });
    el.querySelector("[data-zerar]").addEventListener("click", () => { if (confirm("Zerar tudo e voltar ao estado inicial do clone?")) { BK.limparTudo(); location.reload(); } });
  }
  function gerarExemplos() {
    const nomes = [["Ana Souza", "48991110001", "Pagani"], ["Bruno Lima", "48991110002", "Pedra Branca"], ["Carla Mendes", "48991110003", "Centro"], ["Diego Rocha", "48991110004", "Passa Vinte"], ["Elisa Nunes", "48991110005", "Ponte do Imaruim"], ["Fábio Costa", "48991110006", "Pagani"], ["Gabi Martins", "48991110007", "Bela Vista"], ["Heitor Alves", "48991110008", "Jardim Eldorado"]];
    const prods = BK.produtosAtivos(); let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let k = 0; k < 40; k++) {
      const c = nomes[Math.floor(rnd() * nomes.length)]; const dias = Math.floor(rnd() * rnd() * 180); const quando = new Date(Date.now() - dias * 864e5 - rnd() * 36e5 * 10).toISOString();
      const itens = []; const n = 1 + Math.floor(rnd() * 3); for (let j = 0; j < n; j++) { const p = prods[Math.floor(rnd() * prods.length)]; itens.push({ id: p.id, nome: p.nome, categoria: p.categoria, qtd: 1 + Math.floor(rnd() * 3), preco: p.preco }); }
      const entrega = rnd() > 0.3; const sub = itens.reduce((s, i) => s + i.qtd * i.preco, 0); const taxa = entrega ? ((cfg().taxasEntrega.find((t) => t.bairro === c[2]) || { taxa: 8 }).taxa) : 0; const cupom = rnd() > 0.7 ? { codigo: "BEMVINDO10", desconto: 10 } : null; const desc = cupom ? Math.round(sub * 10) / 100 : 0;
      const st = dias > 1 ? "concluido" : ["pago", "preparo", "saiu"][Math.floor(rnd() * 3)];
      BK.salvarPedido({ numero: BK.novoNumero(), quando, cliente: { nome: c[0], telefone: c[1], email: c[0].split(" ")[0].toLowerCase() + "@exemplo.com" }, modalidade: entrega ? "entrega" : "retirada", endereco: entrega ? "Rua Exemplo, " + (10 + k) : "", bairro: entrega ? c[2] : "", itens, cupom, totais: { subtotal: sub, desconto: desc, taxa, total: sub - desc + taxa }, pagamento: { metodo: rnd() > 0.5 ? "Pix" : "Cartão final 1234", codigo: "BK-EX" + k, valor: sub - desc + taxa }, status: st, historico: [{ status: "pago", quando, obs: "exemplo" }], mensagens: [], exemplo: true });
    }
  }
  function baixarCsv(nome, linhas) {
    const csv = linhas.map((l) => l.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = nome; a.click();
  }
  document.addEventListener("DOMContentLoaded", iniciar);
})();
