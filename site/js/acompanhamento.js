// Acompanhamento do pedido: linha do tempo com o status atual (lido do banco local, atualizado pelo painel admin).
(function () {
  const params = new URLSearchParams(location.search);
  const fmtData = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  function etapas(p) { return BK.STATUS.filter((s) => !(s.soEntrega && p.modalidade !== "entrega") && !(s.soRetirada && p.modalidade !== "retirada")); }
  function render() {
    const el = document.getElementById("acomp"); const n = params.get("n");
    const p = n ? BK.pedido(n) : null;
    if (!p) {
      const meus = (() => { const tel = (JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}).telefone; return tel ? BK.pedidos().filter((x) => x.cliente.telefone.replace(/\D/g, "") === tel.replace(/\D/g, "")).reverse() : []; })();
      el.innerHTML = '<div class="rounded-2xl border border-border bg-card p-8 text-center"><h1 class="text-2xl font-extrabold">Acompanhar pedido</h1><p class="mt-2 text-muted-foreground">' + (n ? "Não encontramos o pedido " + esc(n) + "." : "Escolha um pedido abaixo ou faça um novo no cardápio.") + "</p>" +
        (meus.length ? '<div class="mt-6 space-y-2 text-left">' + meus.map((x) => '<a class="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary" href="acompanhamento.html?n=' + x.numero + '"><span><strong>' + x.numero + '</strong> · ' + fmtData(x.quando) + '</span><span class="text-sm font-bold text-primary">' + esc((BK.STATUS.find((s) => s.id === x.status) || {}).rotulo || x.status) + "</span></a>").join("") + "</div>" : "") +
        '<a class="' + BTN.primary + ' mt-6 h-11 px-6" href="index.html">Ver cardápio</a></div>';
      return;
    }
    const lista = etapas(p); const idx = p.status === "cancelado" ? -1 : lista.findIndex((s) => s.id === p.status);
    const atual = lista[idx]; const novo = params.get("novo") === "1";
    const hist = (id) => (p.historico || []).filter((h) => h.status === id).pop();
    el.innerHTML = (novo ? '<div class="mb-6 rounded-2xl bg-[#DDF1CF] border border-[#b7e0a3] p-5 text-center"><p class="text-lg font-extrabold text-[#2F7D45]">Pagamento confirmado. Pedido recebido! 🎉</p><p class="mt-1 text-sm text-[#2F7D45]">Guarde o número <strong>' + p.numero + '</strong>. Esta página atualiza sozinha conforme a loja avança.</p></div>' : "") +
      '<div class="grid gap-6 lg:grid-cols-[1fr_380px]"><section class="rounded-2xl border border-border bg-card p-6 md:p-8">' +
      '<p class="eyebrow">Pedido ' + p.numero + ' · ' + fmtData(p.quando) + '</p><h1 class="mt-1 text-3xl font-extrabold md:text-4xl">' + (p.status === "cancelado" ? "Pedido cancelado" : esc(atual ? atual.rotulo : p.status)) + "</h1>" +
      '<p class="mt-2 text-muted-foreground">' + (p.status === "cancelado" ? "Fale com a loja se tiver dúvida." : esc(atual ? atual.desc : "")) + "</p>" +
      '<div class="linha-tempo mt-8">' + lista.map((s, i) => { const h = hist(s.id); const cls = i < idx ? "feita" : i === idx ? "atual" : "pendente"; return '<div class="etapa ' + cls + '"><div class="bola">' + (i < idx ? icone("check", "h-3.5 w-3.5") : i === idx ? '<span class="h-2 w-2 rounded-full bg-white"></span>' : "") + '</div><p class="titulo">' + esc(s.rotulo) + "</p>" + (h ? '<p class="text-xs text-muted-foreground">' + fmtData(h.quando) + (h.obs ? " · " + esc(h.obs) : "") + "</p>" : '<p class="text-xs text-muted-foreground">' + esc(s.desc) + "</p>") + "</div>"; }).join("") + "</div>" +
      '<div class="mt-6 flex flex-wrap gap-3"><a class="' + BTN.outline + ' h-11 px-5 rounded-full" href="index.html">' + icone("utensils-crossed") + 'Fazer outro pedido</a><a class="' + BTN.base + ' h-11 px-5 rounded-full bg-whatsapp text-whatsapp-foreground" target="_blank" rel="noopener" href="' + linkWhats("Olá! Sobre o pedido " + p.numero + " (" + p.cliente.nome + "): ") + '"><span class="h-5 w-5">' + LOGO_WHATS + "</span>Falar com a loja</a></div></section>" +
      '<aside class="rounded-2xl border border-border bg-card p-6"><h2 class="text-lg font-extrabold">Resumo</h2><ul class="mt-4 space-y-2 text-sm">' + p.itens.map((i) => '<li class="flex justify-between gap-3"><span>' + i.qtd + "× " + esc(i.nome) + "</span><span class=\"font-semibold\">" + moeda(i.qtd * i.preco) + "</span></li>").join("") + "</ul>" +
      '<div class="mt-4 space-y-1 border-t border-border pt-4 text-sm"><div class="flex justify-between text-muted-foreground"><span>Subtotal</span><span>' + moeda(p.totais.subtotal) + "</span></div>" + (p.totais.desconto ? '<div class="flex justify-between text-green-700"><span>Cupom ' + esc(p.cupom.codigo) + "</span><span>- " + moeda(p.totais.desconto) + "</span></div>" : "") + (p.modalidade === "entrega" ? '<div class="flex justify-between text-muted-foreground"><span>Entrega · ' + esc(p.bairro) + "</span><span>" + moeda(p.totais.taxa) + "</span></div>" : "") + '<div class="flex justify-between text-lg font-extrabold"><span>Total</span><span>' + moeda(p.totais.total) + "</span></div></div>" +
      '<div class="mt-4 border-t border-border pt-4 text-sm text-muted-foreground"><p><strong class="text-foreground">' + (p.modalidade === "entrega" ? "Entrega em" : "Retirada na loja") + "</strong><br/>" + (p.modalidade === "entrega" ? esc(p.endereco) + ", " + esc(p.bairro) : esc(UNIDADE.endereco) + " · " + esc(UNIDADE.horario)) + "</p><p class=\"mt-3\"><strong class=\"text-foreground\">Pagamento</strong><br/>" + esc(p.pagamento.metodo) + " · #" + esc(p.pagamento.codigo) + ' <span class="selo-demo">simulação</span></p><p class="mt-3"><strong class="text-foreground">Cliente</strong><br/>' + esc(p.cliente.nome) + " · " + esc(p.cliente.telefone) + "</p></div></aside></div>";
  }
  document.addEventListener("DOMContentLoaded", () => { render(); setInterval(render, 3000); window.addEventListener("storage", render); });
})();
