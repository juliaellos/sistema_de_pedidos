// "Banco" local (localStorage) compartilhado entre o site e o painel admin. Em modo simulação, substitui o backend.
// Chaves: bk_db_produtos (catálogo editável), bk_db_pedidos, bk_db_config (ajustes da unidade), bk_db_log.
(function () {
  const U = window.UNIDADE;
  const K = { produtos: "bk_db_produtos", pedidos: "bk_db_pedidos", config: "bk_db_config", cupons: "bk_db_cupons", campanhas: "bk_db_campanhas", avaliacoes: "bk_db_avaliacoes", versao: "bk_db_versao" };
  const ler = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const gravar = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("banco:mudou", { detail: k })); };
  const CATEGORIAS = ["Combos", "Confeitaria", "Padaria", "Pizzas", "Salgados", "Sem Glúten e Sem Lactose", "Sopas", "Tortas Especiais"];
  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ e sem lactose/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // produtos: começa com o catálogo clonado; o admin edita por cima
  function produtos() {
    let p = ler(K.produtos, null);
    if (!p) { p = (window.CATALOGO || []).map((x) => Object.assign({ ativo: true }, x)); gravar(K.produtos, p); return p; }
    // itens novos no catálogo do arquivo (ex.: combos) entram sozinhos, exceto os que o admin excluiu de propósito
    const exc = new Set(ler("bk_db_excluidos", [])); const ids = new Set(p.map((x) => x.id)); let mudou = false;
    (window.CATALOGO || []).forEach((x) => { if (!ids.has(x.id) && !exc.has(x.id)) { p.push(Object.assign({ ativo: true }, x)); mudou = true; } });
    if (mudou) { if (window.CATALOGO && window.CATALOGO.length) p.sort((a, b) => { const ia = window.CATALOGO.findIndex((x) => x.id === a.id), ib = window.CATALOGO.findIndex((x) => x.id === b.id); return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib); }); gravar(K.produtos, p); }
    return p;
  }
  const STATUS = [
    { id: "pago", rotulo: "Pago", desc: "Pagamento confirmado. A loja já recebeu seu pedido." },
    { id: "preparo", rotulo: "Em preparo", desc: "Estamos separando e embalando seus produtos." },
    { id: "saiu", rotulo: "Saiu pra entrega", desc: "Seu pedido está a caminho.", soEntrega: true },
    { id: "pronto", rotulo: "Pronto pra retirada", desc: "Pode vir buscar na loja.", soRetirada: true },
    { id: "concluido", rotulo: "Concluído", desc: "Pedido entregue. Obrigado!" }
  ];
  const BK = window.BK = {
    CATEGORIAS, slug, STATUS, ler, gravar,
    produtos, produtosAtivos: () => produtos().filter((p) => p.ativo !== false),
    produto: (id) => produtos().find((p) => p.id === id),
    salvarProduto(p) { const l = produtos(); const i = l.findIndex((x) => x.id === p.id); if (i >= 0) l[i] = p; else l.push(p); gravar(K.produtos, l); },
    excluirProduto(id) { const e = ler("bk_db_excluidos", []); if (!e.includes(id)) e.push(id); localStorage.setItem("bk_db_excluidos", JSON.stringify(e)); gravar(K.produtos, produtos().filter((p) => p.id !== id)); },
    restaurarCatalogo() { localStorage.removeItem(K.produtos); localStorage.removeItem("bk_db_excluidos"); produtos(); },
    novoIdProduto(nome) { const b = slug(nome) || "produto"; let id = b, n = 1; while (produtos().some((p) => p.id === id)) id = b + "-" + (++n); return id; },

    pedidos: () => ler(K.pedidos, []),
    pedido: (n) => ler(K.pedidos, []).find((p) => p.numero === n),
    salvarPedido(p) { const l = ler(K.pedidos, []); const i = l.findIndex((x) => x.numero === p.numero); if (i >= 0) l[i] = p; else l.push(p); gravar(K.pedidos, l); },
    mudarStatus(numero, status, obs) { const p = this.pedido(numero); if (!p) return null; p.status = status; p.historico = p.historico || []; p.historico.push({ status, quando: new Date().toISOString(), obs: obs || "" }); this.salvarPedido(p); return p; },
    novoNumero() { const l = ler(K.pedidos, []); const n = 1000 + l.length + 1; return "BK-" + n; },

    // clientes derivados dos pedidos (chave = telefone só com números)
    clientes() {
      const m = {};
      ler(K.pedidos, []).filter((p) => p.status !== "cancelado").forEach((p) => {
        const tel = String(p.cliente.telefone || "").replace(/\D/g, ""); if (!tel) return;
        const c = m[tel] || (m[tel] = { telefone: tel, nome: p.cliente.nome, email: p.cliente.email, nascimento: "", pedidos: [], total: 0, bairros: {}, modalidades: {}, produtos: {}, categorias: {}, cupons: 0 });
        c.nome = p.cliente.nome || c.nome; c.email = p.cliente.email || c.email; if (p.cliente.nascimento) c.nascimento = p.cliente.nascimento;
        c.pedidos.push(p); c.total += p.totais.total; if (p.cupom) c.cupons++;
        if (p.bairro) c.bairros[p.bairro] = (c.bairros[p.bairro] || 0) + 1;
        c.modalidades[p.modalidade] = (c.modalidades[p.modalidade] || 0) + 1;
        p.itens.forEach((i) => { c.produtos[i.id] = (c.produtos[i.id] || 0) + i.qtd; const pr = BK.produto(i.id); const cat = pr ? pr.categoria : (i.categoria || "Outros"); c.categorias[cat] = (c.categorias[cat] || 0) + i.qtd; });
      });
      return Object.values(m).map((c) => {
        c.pedidos.sort((a, b) => a.quando.localeCompare(b.quando));
        c.primeiro = c.pedidos[0].quando; c.ultimo = c.pedidos[c.pedidos.length - 1].quando; c.n = c.pedidos.length; c.ticket = c.total / c.n;
        c.bairro = Object.keys(c.bairros).sort((a, b) => c.bairros[b] - c.bairros[a])[0] || "";
        c.diasSemPedido = Math.floor((Date.now() - new Date(c.ultimo)) / 864e5);
        if (c.nascimento) { const [y, mo, d] = c.nascimento.split("-").map(Number); const hoje = new Date(); let prox = new Date(hoje.getFullYear(), mo - 1, d); if (prox < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) prox = new Date(hoje.getFullYear() + 1, mo - 1, d); c.mesAniversario = mo; c.diasAteAniversario = Math.round((prox - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 864e5); }
        return c;
      });
    },
    clientePorTelefone(tel) { tel = String(tel || "").replace(/\D/g, ""); return this.clientes().find((c) => c.telefone === tel); },

    // mais pedidos: ranking por quantidade vendida; cai pros destaques se houver poucos pedidos
    maisPedidos(limite) {
      const q = {}; ler(K.pedidos, []).forEach((p) => p.itens.forEach((i) => (q[i.id] = (q[i.id] || 0) + i.qtd)));
      const ativos = this.produtosAtivos();
      let lista = ativos.filter((p) => q[p.id]).sort((a, b) => q[b.id] - q[a.id]);
      if (lista.length < (limite || 8)) { const dest = ativos.filter((p) => p.destaque && !q[p.id]); lista = lista.concat(dest); }
      return lista.slice(0, limite || 8);
    },
    // recomendados pro cliente (telefone salvo no navegador): o que ele mais pede + itens das categorias que ele compra e ainda não levou
    recomendados(tel, limite) {
      const c = this.clientePorTelefone(tel); if (!c) return [];
      const ativos = this.produtosAtivos();
      const repetir = Object.keys(c.produtos).sort((a, b) => c.produtos[b] - c.produtos[a]).map((id) => ativos.find((p) => p.id === id)).filter(Boolean);
      const cats = Object.keys(c.categorias).sort((a, b) => c.categorias[b] - c.categorias[a]);
      const novos = []; cats.forEach((cat) => ativos.filter((p) => p.categoria === cat && !c.produtos[p.id]).slice(0, 3).forEach((p) => novos.push(p)));
      const vistos = new Set(); return repetir.concat(novos).filter((p) => !vistos.has(p.id) && vistos.add(p.id)).slice(0, limite || 8);
    },

    // ---- cupons (com validade, limites e mínimo) ----
    cupons() { let l = ler(K.cupons, null); if (!l) { l = (U.cupons || []).map((c) => Object.assign({ ativo: true, validade: "", limite: 0, umPorCliente: false, minimo: 0, descricao: "" }, c)); gravar(K.cupons, l); } return l; },
    salvarCupom(c) { const l = this.cupons(); const i = l.findIndex((x) => x.codigo === c.codigo); if (i >= 0) l[i] = c; else l.push(c); gravar(K.cupons, l); },
    excluirCupom(codigo) { gravar(K.cupons, this.cupons().filter((c) => c.codigo !== codigo)); },
    usosCupom(codigo, tel) { return ler(K.pedidos, []).filter((p) => p.status !== "cancelado" && p.cupom && p.cupom.codigo === codigo && (!tel || String(p.cliente.telefone).replace(/\D/g, "") === String(tel).replace(/\D/g, ""))).length; },
    validarCupom(codigo, subtotal, tel) {
      codigo = String(codigo || "").trim().toUpperCase(); const c = this.cupons().find((x) => x.codigo === codigo);
      if (!c || c.ativo === false) return { erro: "Cupom inválido ou expirado." };
      const hoje = new Date().toISOString().slice(0, 10);
      if (c.inicio && hoje < c.inicio) return { erro: "Esse cupom ainda não está valendo." };
      if (c.validade && hoje > c.validade) return { erro: "Esse cupom venceu em " + c.validade.split("-").reverse().join("/") + "." };
      if (c.limite && this.usosCupom(codigo) >= c.limite) return { erro: "Esse cupom já atingiu o limite de usos." };
      if (c.umPorCliente && tel && this.usosCupom(codigo, tel) > 0) return { erro: "Você já usou esse cupom." };
      if (c.minimo && subtotal < c.minimo) return { erro: "Esse cupom vale pra pedidos a partir de R$ " + c.minimo.toFixed(2).replace(".", ",") + "." };
      return { cupom: c };
    },
    // ---- campanhas (disparos pra públicos) ----
    campanhas: () => ler(K.campanhas, []),
    salvarCampanha(c) { const l = ler(K.campanhas, []); const i = l.findIndex((x) => x.id === c.id); if (i >= 0) l[i] = c; else l.push(c); gravar(K.campanhas, l); },
    mensagensDoCliente(tel) { tel = String(tel).replace(/\D/g, ""); return ler(K.campanhas, []).filter((c) => c.enviada && (c.destinatarios || []).some((d) => d.telefone === tel)).map((c) => ({ quando: c.enviadaEm, texto: c.mensagem.replace(/\{nome\}/g, (c.destinatarios.find((d) => d.telefone === tel).nome || "").split(" ")[0]), campanha: c.nome })); },
    // ---- avaliações (só depois de concluído) ----
    avaliacoes: () => ler(K.avaliacoes, []),
    avaliacaoDoPedido(numero) { return ler(K.avaliacoes, []).find((a) => a.numero === numero); },
    salvarAvaliacao(a) { const l = ler(K.avaliacoes, []).filter((x) => x.numero !== a.numero); l.push(a); gravar(K.avaliacoes, l); },
    mediaAvaliacoes() { const l = ler(K.avaliacoes, []); return l.length ? { media: l.reduce((s, a) => s + a.nota, 0) / l.length, n: l.length } : null; },

    config() { return Object.assign({}, U, ler(K.config, {})); },
    salvarConfig(c) { gravar(K.config, c); },
    limparTudo() { Object.values(K).forEach((k) => localStorage.removeItem(k)); }
  };
  // UNIDADE efetivo = dados do arquivo + ajustes do admin
  Object.assign(U, ler(K.config, {}));
})();
