// "Banco" local (localStorage) compartilhado entre o site e o painel admin. Em modo simulação, substitui o backend.
// Chaves: bk_db_produtos (catálogo editável), bk_db_pedidos, bk_db_config (ajustes da unidade), bk_db_log.
(function () {
  const U = window.UNIDADE;
  const K = { produtos: "bk_db_produtos", pedidos: "bk_db_pedidos", config: "bk_db_config", versao: "bk_db_versao" };
  const ler = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const gravar = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("banco:mudou", { detail: k })); };
  const CATEGORIAS = ["Confeitaria", "Padaria", "Pizzas", "Salgados", "Sem Glúten e Sem Lactose", "Sopas", "Tortas Especiais"];
  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ e sem lactose/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // produtos: começa com o catálogo clonado; o admin edita por cima
  function produtos() {
    let p = ler(K.produtos, null);
    if (!p) { p = (window.CATALOGO || []).map((x) => Object.assign({ ativo: true }, x)); gravar(K.produtos, p); }
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
    excluirProduto(id) { gravar(K.produtos, produtos().filter((p) => p.id !== id)); },
    restaurarCatalogo() { localStorage.removeItem(K.produtos); produtos(); },
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
        const c = m[tel] || (m[tel] = { telefone: tel, nome: p.cliente.nome, email: p.cliente.email, pedidos: [], total: 0, bairros: {}, modalidades: {}, produtos: {}, categorias: {}, cupons: 0 });
        c.nome = p.cliente.nome || c.nome; c.email = p.cliente.email || c.email;
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

    config() { return Object.assign({}, U, ler(K.config, {})); },
    salvarConfig(c) { gravar(K.config, c); },
    limparTudo() { Object.values(K).forEach((k) => localStorage.removeItem(k)); }
  };
  // UNIDADE efetivo = dados do arquivo + ajustes do admin
  Object.assign(U, ler(K.config, {}));
})();
