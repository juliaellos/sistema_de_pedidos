// Dados da rede pro painel da franqueadora (modo simulação).
// - Unidades da rede (Palhoça é real; Maringá e Joinville são exemplos fictícios).
// - 12 meses de pedidos FICTÍCIOS por unidade, gerados sempre iguais (semente fixa) e relativos à data de hoje.
// - Os pedidos reais da Palhoça feitos neste navegador entram somados aos fictícios.
// - Cupons, modelos de mensagem e públicos da franqueadora ficam no localStorage (chaves bk_rede_*),
//   e o site/painel da unidade lê os cupons e modelos que valem pra ela.
(function () {
  const ler = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const gravar = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); document.dispatchEvent(new CustomEvent("rede:mudou", { detail: k })); };

  const bairrosPalhoca = (window.UNIDADE && window.UNIDADE.taxasEntrega || []).map((t) => t.bairro);
  const UNIDADES = [
    { id: "palhoca", nome: "Palhoça", cidade: "Palhoça, SC", ddd: "48", prefixo: "PAL", base: 4.2, pool: 380, bairros: bairrosPalhoca.length ? bairrosPalhoca : ["Pagani", "Pedra Branca", "Centro"] },
    { id: "maringa", nome: "Maringá", cidade: "Maringá, PR", ddd: "44", prefixo: "MGA", base: 6.4, pool: 560, bairros: ["Zona 7", "Zona 1", "Zona 5", "Centro", "Novo Centro", "Jardim Alvorada", "Vila Morangueira", "Jardim Universitário", "Parque das Grevíleas", "Jardim Itália"] },
    { id: "joinville", nome: "Joinville", cidade: "Joinville, SC", ddd: "47", prefixo: "JVE", base: 5.1, pool: 460, bairros: ["Centro", "América", "Glória", "Atiradores", "Costa e Silva", "Bucarein", "Saguaçu", "Boa Vista", "Iririú", "Anita Garibaldi"] }
  ];

  // ---------- gerador fictício ----------
  function rngDe(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const NOMES_F = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana", "Larissa", "Mariana", "Natália", "Patrícia", "Renata", "Sofia", "Tatiane", "Vanessa", "Aline", "Bruna", "Carla", "Débora", "Luana", "Marta", "Rosana"];
  const NOMES_M = ["André", "Bruno", "Carlos", "Diego", "Eduardo", "Felipe", "Gustavo", "Henrique", "Igor", "João", "Lucas", "Marcelo", "Natan", "Otávio", "Pedro", "Rafael", "Samuel", "Thiago", "Vinícius", "Wagner", "Caio", "Fábio", "Leandro", "Mateus", "Rodrigo"];
  const SOBRENOMES = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Mendes", "Barros", "Freitas", "Barbosa", "Pinto", "Moreira", "Cardoso", "Teixeira", "Correia", "Machado", "Schmitt"];
  const PESO_CAT = { "Padaria": 34, "Salgados": 30, "Confeitaria": 15, "Pizzas": 8, "Combos": 4, "Sopas": 3, "Tortas Especiais": 3, "Sem Glúten e Sem Lactose": 3 };
  const PESO_HORA = { 8: 5, 9: 6, 10: 5, 11: 4, 12: 5, 13: 6, 14: 8, 15: 10, 16: 11, 17: 13, 18: 14, 19: 9 };
  const PESO_DIA = [1.25, 0.8, 0.85, 0.9, 0.95, 1.15, 1.35]; // domingo..sábado
  const escolherPeso = (rnd, pares) => { const tot = pares.reduce((s, p) => s + p[1], 0); let r = rnd() * tot; for (const p of pares) { r -= p[1]; if (r <= 0) return p[0]; } return pares[pares.length - 1][0]; };

  function gerarUnidade(u, idx) {
    const rnd = rngDe(20261029 + idx * 7919);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prods = (window.BK ? BK.produtosAtivos() : (window.CATALOGO || [])).filter((p) => p.preco > 0);
    const porCat = {}; prods.forEach((p) => (porCat[p.categoria] = porCat[p.categoria] || []).push(p));
    const cats = Object.keys(PESO_CAT).filter((c) => porCat[c]).map((c) => [c, PESO_CAT[c]]);
    const horas = Object.keys(PESO_HORA).map((h) => [Number(h), PESO_HORA[h]]);
    // clientes: peso de frequência (poucos muito fiéis, muitos esporádicos) e dia em que "chegaram"
    const clientes = [];
    for (let i = 0; i < u.pool; i++) {
      const fem = rnd() < 0.58; const nome = (fem ? NOMES_F : NOMES_M)[Math.floor(rnd() * 25)] + " " + SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)];
      const temConta = rnd() < 0.42; const idade = Math.round(18 + Math.pow(rnd(), 1.3) * 55);
      const nasc = new Date(hoje.getFullYear() - idade, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
      clientes.push({
        nome, telefone: "55" + u.ddd + "9" + String(81000000 + idx * 1000000 + i * 37).slice(-8), email: nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "." + i + "@exemplo.com",
        conta: temConta, genero: temConta && rnd() < 0.88 ? (fem ? "Feminino" : (rnd() < 0.96 ? "Masculino" : "Outro")) : "", nascimento: temConta && rnd() < 0.82 ? nasc.toISOString().slice(0, 10) : "",
        bairro: u.bairros[Math.floor(Math.pow(rnd(), 1.6) * u.bairros.length)], entrega: rnd() < 0.68, peso: 1 / Math.pow(i + 1, 0.75), chegada: i < 30 ? 365 : Math.floor(Math.pow(rnd(), 0.7) * 365)
      });
    }
    clientes.sort((a, b) => b.chegada - a.chegada); // os que chegaram há mais tempo primeiro
    const pedidos = [], avaliacoes = [];
    let seq = 10000;
    const cuponsUso = [["REDE15", 15, 3], ["BEMVINDO10", 10, 4], [u.prefixo === "PAL" ? "PALHOCA5" : u.prefixo === "MGA" ? "MARINGA5" : "JOINVILLE5", 5, 3], ["FIMDESEMANA10", 10, u.id === "palhoca" ? 0 : 2]].filter((c) => c[2] > 0);
    for (let d = 365; d >= 0; d--) {
      const dia = new Date(hoje); dia.setDate(dia.getDate() - d);
      const crescimento = 0.72 + 0.4 * (1 - d / 365); const dez = dia.getMonth() === 11 ? 1.3 : 1;
      let n = Math.round(u.base * PESO_DIA[dia.getDay()] * crescimento * dez * (0.65 + rnd() * 0.7));
      const elegiveis = clientes.filter((c) => c.chegada >= d); const somaPeso = elegiveis.reduce((s, c) => s + c.peso, 0);
      if (!elegiveis.length) continue;
      for (let k = 0; k < n; k++) {
        const hora = escolherPeso(rnd, horas); const quando = new Date(dia); quando.setHours(hora, Math.floor(rnd() * 60), Math.floor(rnd() * 60));
        if (quando > new Date()) continue;
        let r = rnd() * somaPeso, c = elegiveis[0]; for (const x of elegiveis) { r -= x.peso; if (r <= 0) { c = x; break; } }
        const itens = []; const nItens = 1 + Math.floor(Math.pow(rnd(), 1.5) * 4);
        for (let j = 0; j < nItens; j++) { const cat = escolherPeso(rnd, cats); const lista = porCat[cat]; const p = lista[Math.floor(Math.pow(rnd(), 1.4) * lista.length)]; const ja = itens.find((x) => x.id === p.id); if (ja) ja.qtd++; else itens.push({ id: p.id, nome: p.nome, categoria: p.categoria, qtd: 1 + (rnd() < 0.25 ? 1 : 0), preco: p.preco }); }
        const entrega = rnd() < (c.entrega ? 0.85 : 0.2); const sub = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
        const cu = rnd() < 0.13 ? escolherPeso(rnd, cuponsUso.map((x) => [x, x[2]])) : null; const desc = cu ? Math.round(sub * cu[1]) / 100 : 0;
        const taxa = entrega ? [5, 7, 8, 10, 12][Math.floor(rnd() * 5)] : 0; const total = Math.round((sub - desc + taxa) * 100) / 100;
        const cancelado = rnd() < 0.03; const status = cancelado ? "cancelado" : d > 0 ? "concluido" : ["pago", "preparo", "saiu", "concluido"][Math.floor(rnd() * 4)];
        const numero = u.prefixo + "-" + (++seq);
        pedidos.push({ numero, unidade: u.id, quando: quando.toISOString(), cliente: { nome: c.nome, telefone: c.telefone, email: c.email }, modalidade: entrega ? "entrega" : "retirada", bairro: entrega ? c.bairro : "", itens, cupom: cu ? { codigo: cu[0], desconto: cu[1] } : null, totais: { subtotal: sub, desconto: desc, taxa, total }, pagamento: { metodo: rnd() < 0.56 ? "Pix" : "Cartão" }, status, simulado: true });
        if (status === "concluido" && rnd() < 0.3) avaliacoes.push({ unidade: u.id, numero, quando: new Date(quando.getTime() + 864e5).toISOString(), nota: escolherPeso(rnd, [[5, 60], [4, 28], [3, 8], [2, 3], [1, 1]]) });
      }
    }
    // ---------- campanhas de WhatsApp de exemplo (sequência aleatória própria: não muda os pedidos acima) ----------
    // Regra da rede: o mesmo cliente não recebe mais de 1 disparo em 7 dias.
    const rc = rngDe(77001 + idx * 104729); const campanhas = [];
    const hist = {}; pedidos.forEach((p) => { if (p.status !== "cancelado") (hist[p.cliente.telefone] = hist[p.cliente.telefone] || []).push(p.quando); });
    const cupomLoja = u.prefixo === "PAL" ? "PALHOCA5" : u.prefixo === "MGA" ? "MARINGA5" : "JOINVILLE5";
    const TIPOS = [
      { nome: "Reativação", modelo: "Reativação com cupom", publico: "Inativos há 45+ dias", cupom: cupomLoja, desc: 5, conv: 0.10, ok: (h, t) => h.length && (t - new Date(h[h.length - 1])) / 864e5 >= 45 },
      { nome: "Cliente VIP", modelo: "Cliente VIP", publico: "Fiéis (5+ pedidos)", cupom: "REDE15", desc: 15, conv: 0.24, ok: (h) => h.length >= 5 },
      { nome: "Lembrete de fim de semana", modelo: "Lembrete de fim de semana", publico: "Compraram nos últimos 30 dias", cupom: "", conv: 0.16, ok: (h, t) => h.length && (t - new Date(h[h.length - 1])) / 864e5 <= 30 },
      { nome: "Lançamento Tortas Royale", modelo: "Lançamento de produto", publico: "Compraram 2+ vezes", cupom: "", conv: 0.12, ok: (h) => h.length >= 2 },
      { nome: "Aniversariantes do mês", modelo: "Feliz aniversário", publico: "Aniversariantes do mês", cupom: cupomLoja, desc: 5, conv: 0.19, ok: (h, t, c) => c.nascimento && Number(c.nascimento.slice(5, 7)) === t.getMonth() + 1 }
    ];
    const ultimoMsg = {}; let seqC = 0, seqP = 50000;
    for (let d = 340 - Math.floor(rc() * 8); d >= 1; d -= 5 + Math.floor(rc() * 7)) {
      const t = new Date(hoje); t.setDate(t.getDate() - d); t.setHours(10 + Math.floor(rc() * 8), Math.floor(rc() * 60));
      if (t > new Date()) continue;
      const tipo = TIPOS[Math.floor(rc() * TIPOS.length)]; const ti = t.toISOString();
      const antes = (c) => (hist[c.telefone] || []).filter((q) => q < ti);
      const cand = clientes.filter((c) => c.chegada >= d && !(ultimoMsg[c.telefone] && (t - ultimoMsg[c.telefone]) < 7 * 864e5) && tipo.ok(antes(c), t, c));
      if (cand.length < 8) continue;
      const n = Math.min(cand.length, 40 + Math.floor(rc() * 110)); const esc = cand.map((c) => [rc(), c]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]);
      esc.forEach((c) => (ultimoMsg[c.telefone] = t));
      const camp = { id: u.prefixo + "-CAMP-" + (++seqC), unidade: u.id, nome: tipo.nome + " · " + t.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""), nomePublico: tipo.publico, modelo: tipo.modelo, cupom: tipo.cupom, enviadaEm: ti, destinatarios: esc.map((c) => ({ telefone: c.telefone, nome: c.nome })), simulado: true };
      campanhas.push(camp);
      // quem compra por causa da mensagem: pedido extra em 1 a 7 dias (mais nos primeiros dias)
      esc.forEach((c) => {
        if (rc() >= tipo.conv) return;
        const quando = new Date(t.getTime() + (1 + Math.floor(Math.pow(rc(), 1.8) * 7) - 1) * 864e5 + (2 + rc() * 20) * 36e5); if (quando > new Date()) return;
        const itens = []; const nItens = 1 + Math.floor(Math.pow(rc(), 1.5) * 4);
        for (let j = 0; j < nItens; j++) { const cat = escolherPeso(rc, cats); const lista = porCat[cat]; const p = lista[Math.floor(Math.pow(rc(), 1.4) * lista.length)]; const ja = itens.find((x) => x.id === p.id); if (ja) ja.qtd++; else itens.push({ id: p.id, nome: p.nome, categoria: p.categoria, qtd: 1 + (rc() < 0.25 ? 1 : 0), preco: p.preco }); }
        const entrega = rc() < (c.entrega ? 0.85 : 0.2); const sub = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
        const usa = tipo.cupom && rc() < 0.65; const desc = usa ? Math.round(sub * tipo.desc) / 100 : 0; const taxa = entrega ? [5, 7, 8, 10, 12][Math.floor(rc() * 5)] : 0;
        const numero = u.prefixo + "-" + (++seqP); const status = (Date.now() - quando) / 864e5 < 1 ? "preparo" : "concluido";
        pedidos.push({ numero, unidade: u.id, quando: quando.toISOString(), cliente: { nome: c.nome, telefone: c.telefone, email: c.email }, modalidade: entrega ? "entrega" : "retirada", bairro: entrega ? c.bairro : "", itens, cupom: usa ? { codigo: tipo.cupom, desconto: tipo.desc } : null, totais: { subtotal: sub, desconto: desc, taxa, total: Math.round((sub - desc + taxa) * 100) / 100 }, pagamento: { metodo: rc() < 0.56 ? "Pix" : "Cartão" }, status, simulado: true, campanha: camp.id });
        if (status === "concluido" && rc() < 0.3) avaliacoes.push({ unidade: u.id, numero, quando: new Date(quando.getTime() + 864e5).toISOString(), nota: escolherPeso(rc, [[5, 60], [4, 28], [3, 8], [2, 3], [1, 1]]) });
      });
    }
    // ---------- comentários e efeito da entrega nas avaliações de exemplo ----------
    const rv = rngDe(55001 + idx * 7919); const porNum = {}; pedidos.forEach((p) => (porNum[p.numero] = p));
    const COMENT = {
      5: ["Tudo perfeito, chegou rapidinho!", "Pão de queijo maravilhoso, virou rotina aqui em casa.", "Atendimento excelente e produto top.", "A torta é incrível, todo mundo amou.", "Muito prático, assa em minutos e fica igual de padaria.", "Pizza deliciosa, massa muito leve.", "Entrega no horário e tudo bem embalado."],
      4: ["Muito bom, só demorou um pouco.", "Gostei bastante, voltaria a pedir.", "Produto ótimo, embalagem poderia ser melhor.", "Bom custo-benefício.", "Gostoso, mas achei o croissant pequeno."],
      3: ["Ok, nada demais.", "Entrega atrasou uns 30 minutos.", "Produto bom mas veio um item errado.", "Achei caro pela quantidade."],
      2: ["Entrega atrasou bastante.", "Produto chegou descongelado.", "Faltou um item no pedido.", "Demoraram pra responder no WhatsApp."],
      1: ["Pedido chegou muito atrasado e frio.", "Veio item errado e ninguém resolveu.", "Produto descongelado, péssima experiência.", "Atraso de mais de uma hora."]
    };
    avaliacoes.forEach((a) => {
      const p = porNum[a.numero]; if (!p) return;
      const h = new Date(p.quando).getHours();
      if (p.modalidade === "entrega" && rv() < (h >= 18 ? 0.3 : 0.12)) a.nota = Math.max(1, a.nota - 1 - (rv() < 0.3 ? 1 : 0));
      if (rv() < (a.nota <= 3 ? 0.75 : 0.35)) { const l = COMENT[a.nota]; a.comentario = l[Math.floor(rv() * l.length)]; }
    });
    const contas = clientes.filter((c) => c.conta).map((c) => ({ unidade: u.id, telefone: c.telefone, nome: c.nome, email: c.email, genero: c.genero, nascimento: c.nascimento, bairro: c.bairro }));
    return { pedidos, contas, avaliacoes, campanhas };
  }

  let cache = null;
  function dados() {
    if (cache) return cache;
    const out = { pedidos: [], contas: [], avaliacoes: [], campanhas: [] };
    UNIDADES.forEach((u, i) => { const g = gerarUnidade(u, i); out.pedidos.push(...g.pedidos); out.contas.push(...g.contas); out.avaliacoes.push(...g.avaliacoes); out.campanhas.push(...g.campanhas); });
    // pedidos, contas e avaliações reais da Palhoça (feitos no site neste navegador)
    if (window.BK) {
      BK.pedidos().forEach((p) => out.pedidos.push(Object.assign({}, p, { unidade: "palhoca", pagamento: Object.assign({}, p.pagamento, { metodo: /^pix/i.test(p.pagamento && p.pagamento.metodo || "") ? "Pix" : "Cartão" }) })));
      BK.contas().forEach((a) => out.contas.push({ unidade: "palhoca", telefone: String(a.telefone || "").replace(/\D/g, ""), nome: a.nome, email: a.email, genero: a.genero || "", nascimento: a.nascimento || "", bairro: a.bairro || "", real: true }));
      BK.avaliacoes().forEach((a) => out.avaliacoes.push({ unidade: "palhoca", numero: a.numero, quando: a.quando, nota: a.nota, comentario: a.comentario || "" }));
      BK.campanhas().filter((c) => c.enviada).forEach((c) => out.campanhas.push({ id: c.id, unidade: "palhoca", nome: c.nome, nomePublico: c.nomePublico, modelo: ((BK.modelos().find((m) => m.id === c.modeloId) || {}).nome) || "Escrita do zero", cupom: c.cupom || "", enviadaEm: c.enviadaEm, destinatarios: (c.destinatarios || []).map((d) => ({ telefone: String(d.telefone).replace(/\D/g, ""), nome: d.nome })), real: true }));
    }
    out.pedidos.sort((a, b) => a.quando.localeCompare(b.quando));
    cache = out; return out;
  }

  // ---------- cupons, modelos e públicos da franqueadora ----------
  const fimDoProximoMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString().slice(0, 10); };
  const CUPONS_PADRAO = () => [
    { codigo: "REDE15", desconto: 15, descricao: "Campanha de rede: 15% em todas as unidades", unidades: [], inicio: "", validade: fimDoProximoMes(), limite: 0, minimo: 60, umPorCliente: true, ativo: true },
    { codigo: "FIMDESEMANA10", desconto: 10, descricao: "Fim de semana: Maringá e Joinville", unidades: ["maringa", "joinville"], inicio: "", validade: "", limite: 0, minimo: 0, umPorCliente: false, ativo: true }
  ];
  const vale = (x, unidade) => !x.unidades || !x.unidades.length || x.unidades.includes(unidade);

  // ---------- cadastro das unidades (dados fixos que o painel da unidade só consulta) ----------
  const TODO_DIA = (h) => ({ 0: h, 1: h, 2: h, 3: h, 4: h, 5: h, 6: h });
  const DADOS_PADRAO = {
    maringa: { nome: "Maringá", nomeCompleto: "Bread King Maringá", whatsapp: "5544999810001", whatsappFormatado: "(44) 99981-0001", endereco: "Av. Brasil, 4500", bairro: "Zona 1", cidade: "Maringá, PR", horario: "Seg a sáb: 08h às 20h · Dom: 08h às 13h", horarios: Object.assign(TODO_DIA(["08:00-20:00"]), { 0: ["08:00-13:00"] }), razaoSocial: "BREAD KING MARINGÁ ALIMENTOS LTDA (exemplo)", cnpj: "00.000.000/0002-00", email: "maringa@breadking.com.br", instagram: "https://instagram.com/breadkingmaringa", instagramUsuario: "@breadkingmaringa", site: "breadkingmaringa.com.br", sobre: "A primeira padaria de supercongelados do Brasil. Pães, salgados, pizzas e confeitaria que você assa em casa e ficam perfeitos em minutos." },
    joinville: { nome: "Joinville", nomeCompleto: "Bread King Joinville", whatsapp: "5547999820001", whatsappFormatado: "(47) 99982-0001", endereco: "R. do Príncipe, 330", bairro: "Centro", cidade: "Joinville, SC", horario: "Seg a sex: 08h às 19h · Sáb: 08h às 14h", horarios: Object.assign(TODO_DIA(["08:00-19:00"]), { 0: [], 6: ["08:00-14:00"] }), razaoSocial: "BREAD KING JOINVILLE ALIMENTOS LTDA (exemplo)", cnpj: "00.000.000/0003-00", email: "joinville@breadking.com.br", instagram: "https://instagram.com/breadkingjoinville", instagramUsuario: "@breadkingjoinville", site: "breadkingjoinville.com.br", sobre: "A primeira padaria de supercongelados do Brasil. Pães, salgados, pizzas e confeitaria que você assa em casa e ficam perfeitos em minutos." }
  };
  const derivados = (d) => Object.assign(d, {
    mapa: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([d.endereco, d.bairro, d.cidade].filter(Boolean).join(" - ")),
    textoRetirada: "Retire na loja: " + [d.endereco, d.bairro, d.cidade].filter(Boolean).join(" - ") + "."
  });
  function aplicarNomes(t) { UNIDADES.forEach((u) => { const d = t[u.id]; if (d) { u.nome = d.nome || u.nome; u.cidade = d.cidade || u.cidade; } }); }
  function unidadesDados() {
    let t = ler("bk_rede_unidades", null);
    if (!t) {
      t = {}; const U = window.UNIDADE || {}; const campos = (window.BK && BK.CAMPOS_UNIDADE) || [];
      const pal = {}; campos.forEach((k) => { if (U[k] !== undefined) pal[k] = JSON.parse(JSON.stringify(U[k])); }); t.palhoca = pal;
      Object.keys(DADOS_PADRAO).forEach((id) => (t[id] = derivados(JSON.parse(JSON.stringify(DADOS_PADRAO[id])))));
      localStorage.setItem("bk_rede_unidades", JSON.stringify(t));
    }
    aplicarNomes(t); return t;
  }

  // ---------- cupons criados pelas unidades (Palhoça: os reais deste navegador; Maringá e Joinville: exemplos) ----------
  const CUPONS_UNIDADES_EXEMPLO = {
    maringa: [
      { codigo: "MARINGA5", desconto: 5, descricao: "Cupom da loja no balcão e Instagram", inicio: "", validade: "", limite: 0, minimo: 0, umPorCliente: false, ativo: true },
      { codigo: "BEMVINDO10", desconto: 10, descricao: "Primeira compra", inicio: "", validade: "", limite: 0, minimo: 40, umPorCliente: true, ativo: true },
      { codigo: "ZONA7FRETE", desconto: 8, descricao: "Ação de bairro (Zona 7)", inicio: "", validade: "2026-09-30", limite: 100, minimo: 50, umPorCliente: true, ativo: true }
    ],
    joinville: [
      { codigo: "JOINVILLE5", desconto: 5, descricao: "Cupom da loja", inicio: "", validade: "", limite: 0, minimo: 0, umPorCliente: false, ativo: true },
      { codigo: "BEMVINDO10", desconto: 10, descricao: "Primeira compra", inicio: "", validade: "", limite: 0, minimo: 0, umPorCliente: true, ativo: true },
      { codigo: "CLIENTEVIP20", desconto: 20, descricao: "Clientes fiéis (pausado pela loja)", inicio: "", validade: "", limite: 50, minimo: 80, umPorCliente: true, ativo: false }
    ]
  };
  // Maringá e Joinville guardam os cupons em bk_rede_cupons_unidades (simulação); a Palhoça usa os cupons reais da unidade (bk_db_cupons)
  const cuponsExemplo = () => { let t = ler("bk_rede_cupons_unidades", null); if (!t) { t = JSON.parse(JSON.stringify(CUPONS_UNIDADES_EXEMPLO)); localStorage.setItem("bk_rede_cupons_unidades", JSON.stringify(t)); } return t; };
  function cuponsUnidades() {
    const pal = (window.BK ? BK.cuponsLocais() : []).map((c) => Object.assign({}, c, { unidade: "palhoca" })); const t = cuponsExemplo();
    return pal.concat(...Object.keys(t).map((id) => t[id].map((c) => Object.assign({}, c, { unidade: id, exemplo: true }))));
  }
  function salvarCupomUnidade(unidade, c) {
    const limpo = Object.assign({}, c); delete limpo.unidade; delete limpo.exemplo; delete limpo.origem; delete limpo.usos;
    if (unidade === "palhoca") { BK.salvarCupom(limpo); document.dispatchEvent(new CustomEvent("rede:mudou", { detail: "bk_db_cupons" })); return; }
    const t = cuponsExemplo(); const l = t[unidade] || (t[unidade] = []); const i = l.findIndex((x) => x.codigo === limpo.codigo); if (i >= 0) l[i] = limpo; else l.push(limpo); gravar("bk_rede_cupons_unidades", t);
  }
  function excluirCupomUnidade(unidade, codigo) {
    if (unidade === "palhoca") { BK.excluirCupom(codigo); document.dispatchEvent(new CustomEvent("rede:mudou", { detail: "bk_db_cupons" })); return; }
    const t = cuponsExemplo(); t[unidade] = (t[unidade] || []).filter((x) => x.codigo !== codigo); gravar("bk_rede_cupons_unidades", t);
  }

  window.REDE = {
    UNIDADES, dados, vale,
    unidade: (id) => UNIDADES.find((u) => u.id === id),
    nomeUnidade: (id) => (UNIDADES.find((u) => u.id === id) || { nome: id }).nome,
    unidadesDados,
    salvarUnidade(id, d) { const t = unidadesDados(); t[id] = derivados(Object.assign({}, t[id], d)); aplicarNomes(t); gravar("bk_rede_unidades", t); },
    msgsAuto() { return BK.mensagensAuto(); },
    salvarMsgsAuto(o) { gravar("bk_rede_msgs_auto", { envio: o.envio, textos: o.textos, atualizadoEm: new Date().toISOString() }); },
    cuponsUnidades, salvarCupomUnidade, excluirCupomUnidade,
    recarregar() { cache = null; },

    cupons() { let l = ler("bk_rede_cupons", null); if (!l) { l = CUPONS_PADRAO(); localStorage.setItem("bk_rede_cupons", JSON.stringify(l)); } return l; },
    salvarCupom(c, codigoAntigo) { const l = this.cupons().filter((x) => x.codigo !== (codigoAntigo || c.codigo)); l.push(c); gravar("bk_rede_cupons", l); },
    excluirCupom(codigo) { gravar("bk_rede_cupons", this.cupons().filter((x) => x.codigo !== codigo)); },
    cuponsDaUnidade(unidade) { return this.cupons().filter((c) => vale(c, unidade)).map((c) => Object.assign({}, c, { rede: true })); },

    modelos() {
      let l = ler("bk_rede_modelos", null);
      if (!l) { l = ((window.BK && BK.MODELOS_PADRAO) || []).filter((m) => m.origem === "franqueadora").map((m) => Object.assign({}, m, { unidades: [] })); localStorage.setItem("bk_rede_modelos", JSON.stringify(l)); }
      return l;
    },
    salvarModelo(m) { const l = this.modelos(); const i = l.findIndex((x) => x.id === m.id); if (i >= 0) l[i] = m; else l.push(m); gravar("bk_rede_modelos", l); },
    excluirModelo(id) { gravar("bk_rede_modelos", this.modelos().filter((m) => m.id !== id)); },
    modelosDaUnidade(unidade) { return this.modelos().filter((m) => vale(m, unidade)).map((m) => Object.assign({}, m, { origem: "franqueadora", rede: true })); },

    // catálogo da rede (fonte dos produtos das unidades; a lógica de criação/sincronização fica em BK.redeProdutos, js/banco.js)
    produtos() { return BK.redeProdutos(true); },
    salvarProduto(p) { const l = this.produtos(); const i = l.findIndex((x) => x.id === p.id); if (i >= 0) l[i] = p; else l.push(p); gravar("bk_rede_produtos", l); },
    excluirProduto(id) { const e = ler("bk_rede_produtos_excluidos", []); if (!e.includes(id)) e.push(id); localStorage.setItem("bk_rede_produtos_excluidos", JSON.stringify(e)); gravar("bk_rede_produtos", this.produtos().filter((x) => x.id !== id)); },

    publicos: () => ler("bk_rede_publicos", []),
    salvarPublico(p) { const l = ler("bk_rede_publicos", []); const i = l.findIndex((x) => x.id === p.id); if (i >= 0) l[i] = p; else l.push(p); gravar("bk_rede_publicos", l); },
    excluirPublico(id) { gravar("bk_rede_publicos", ler("bk_rede_publicos", []).filter((p) => p.id !== id)); }
  };
  unidadesDados(); // nomes e cidades editados no Franchising valem nos filtros
})();
