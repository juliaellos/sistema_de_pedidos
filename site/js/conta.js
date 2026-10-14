// Conta do cliente (simulação): cadastro e login com CPF + senha, sessão, área no cabeçalho e perfil com voucher de cadastro completo.
(function () {
  const U = window.UNIDADE; const CH = "bk_sessao";
  const soNum = (s) => String(s || "").replace(/\D/g, "");
  const cpfValido = (c) => { c = soNum(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false; let s = 0; for (let i = 0; i < 9; i++) s += Number(c[i]) * (10 - i); let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== Number(c[9])) return false; s = 0; for (let i = 0; i < 10; i++) s += Number(c[i]) * (11 - i); d = (s * 10) % 11; if (d === 10) d = 0; return d === Number(c[10]); };
  const fmtCpf = (c) => soNum(c).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  const Conta = window.Conta = {
    atual() { const cpf = localStorage.getItem(CH); return cpf ? BK.contaPorCpf(cpf) : null; },
    entrar(cpf, senha) { const c = BK.contaPorCpf(cpf); if (!c) return { erro: "Não achamos conta com esse CPF." }; if (c.senha !== senha) return { erro: "Senha incorreta." }; localStorage.setItem(CH, c.cpf); this.sincronizarCliente(c); document.dispatchEvent(new CustomEvent("conta:mudou")); return { conta: c }; },
    sair() { localStorage.removeItem(CH); document.dispatchEvent(new CustomEvent("conta:mudou")); },
    criar(d) {
      if (!d.nome.trim()) return { erro: "Informe seu nome." }; if (soNum(d.telefone).length < 10) return { erro: "Telefone com DDD." }; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { erro: "E-mail inválido." };
      if (!cpfValido(d.cpf)) return { erro: "CPF inválido." }; if ((d.senha || "").length < 4) return { erro: "Senha com pelo menos 4 caracteres." };
      if (BK.contaPorCpf(d.cpf)) return { erro: "Já existe conta com esse CPF. Entre com sua senha." };
      const c = BK.salvarConta({ nome: d.nome.trim(), telefone: soNum(d.telefone), email: d.email.trim(), cpf: soNum(d.cpf), senha: d.senha, nascimento: "", genero: "", endereco: "", bairro: "", comoConheceu: "", preferencias: "" });
      localStorage.setItem(CH, c.cpf); this.sincronizarCliente(c); document.dispatchEvent(new CustomEvent("conta:mudou")); return { conta: c };
    },
    sincronizarCliente(c) { const d = JSON.parse(localStorage.getItem("bk_cliente") || "{}") || {}; localStorage.setItem("bk_cliente", JSON.stringify(Object.assign(d, { nome: c.nome, email: c.email, telefone: c.telefone, nascimento: c.nascimento || d.nascimento || "", endereco: c.endereco || d.endereco || "", bairro: c.bairro || d.bairro || "" }))); },
    primeiraCompra(c) { return !BK.pedidos().some((p) => p.status !== "cancelado" && soNum(p.cliente.telefone) === c.telefone); },
    fmtCpf, cpfValido,
    renderArea() {
      const el = document.getElementById("area-conta"); if (!el) return; const c = this.atual();
      el.innerHTML = c ? '<a class="btn-entrar" href="conta.html" title="Minha conta">' + icone("user") + '<span class="hidden sm:inline">' + esc(c.nome.split(" ")[0]) + "</span></a>" : '<button type="button" class="btn-entrar" data-abrir-login>' + icone("user") + '<span class="hidden sm:inline">Entrar</span></button>';
    },
    // modal de login / cadastro. aba: "entrar" | "criar". aoEntrar: callback
    abrir(aba, aoEntrar, motivo) {
      this.fechar(); const m = document.createElement("div"); m.className = "modal-conta"; m.id = "modal-conta";
      const cupom = BK.cupons().find((x) => x.codigo === "SITE10" && x.ativo !== false);
      const form = (criar) => criar
        ? '<h2>Criar conta</h2><p class="sub">' + (motivo || "Leva um minuto. Com a conta você acompanha o pedido e não perde o carrinho.") + "</p>" + (cupom ? '<div class="aviso-cupom" style="margin-bottom:1rem">' + icone("tag", "h-5 w-5") + "<span><b>" + cupom.desconto + "% OFF</b> na sua primeira compra pelo site com o cupom <b>" + cupom.codigo + "</b>. Ele é aplicado sozinho no pedido.</span></div>" : "") +
          '<form data-form="criar"><label class="campo-s">Nome completo<input name="nome" required autocomplete="name"/></label><div class="grid grid-cols-2 gap-3"><label class="campo-s">Telefone (WhatsApp)<input name="telefone" required inputmode="tel" autocomplete="tel" placeholder="48 9…"/></label><label class="campo-s">CPF<input name="cpf" required inputmode="numeric" placeholder="000.000.000-00"/></label></div><label class="campo-s">E-mail<input name="email" type="email" required autocomplete="email"/></label><label class="campo-s">Senha<input name="senha" type="password" required minlength="4" autocomplete="new-password"/></label><p class="erro campo-s" data-erro style="display:none"></p><button class="btn-s">Criar conta</button></form><p class="sub" style="margin-top:1rem;text-align:center">Já tem conta? <button type="button" class="link-s" data-aba="entrar">Entrar</button></p>'
        : '<h2>Entrar</h2><p class="sub">' + (motivo || "Use seu CPF e senha.") + '</p><form data-form="entrar"><label class="campo-s">CPF<input name="cpf" required inputmode="numeric" placeholder="000.000.000-00" autocomplete="username"/></label><label class="campo-s">Senha<input name="senha" type="password" required autocomplete="current-password"/></label><p class="erro campo-s" data-erro style="display:none"></p><button class="btn-s">Entrar</button></form><p class="sub" style="margin-top:1rem;text-align:center">Ainda não tem conta? <button type="button" class="link-s" data-aba="criar">Criar conta' + (cupom ? " e ganhar " + cupom.desconto + "% OFF" : "") + "</button></p>";
      const pinta = (a) => { m.innerHTML = '<div class="caixa"><button type="button" class="modal-fechar" data-fechar aria-label="Fechar" style="top:.6rem;right:.6rem">' + icone("x", "h-5 w-5") + "</button>" + form(a === "criar") + "</div>"; const i = m.querySelector("input"); if (i) i.focus(); };
      pinta(aba || "entrar"); document.body.appendChild(m); document.body.style.overflow = "hidden";
      m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-fechar]")) return this.fechar(); const ab = e.target.closest("[data-aba]"); if (ab) pinta(ab.dataset.aba); });
      m.addEventListener("input", (e) => { if (e.target.name === "cpf") e.target.value = soNum(e.target.value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); });
      m.addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target; const d = Object.fromEntries(new FormData(f).entries()); const r = f.dataset.form === "criar" ? this.criar(d) : this.entrar(d.cpf, d.senha);
        const erro = f.querySelector("[data-erro]"); if (r.erro) { erro.textContent = r.erro; erro.style.display = "block"; return; }
        this.fechar(); toast(f.dataset.form === "criar" ? "Conta criada, " + r.conta.nome.split(" ")[0] + "!" : "Bem-vindo de volta, " + r.conta.nome.split(" ")[0] + "!"); this.renderArea(); if (aoEntrar) aoEntrar(r.conta);
      });
    },
    fechar() { const m = document.getElementById("modal-conta"); if (m) { m.remove(); document.body.style.overflow = ""; } }
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-abrir-login]"); if (b) Conta.abrir(b.dataset.abrirLogin || "entrar"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") Conta.fechar(); });
  document.addEventListener("conta:mudou", () => Conta.renderArea());

  // ---------- página Minha conta (conta.html) ----------
  window.renderConta = function (el) {
    const c = Conta.atual();
    if (!c) { el.innerHTML = '<div class="cartao-s" style="text-align:center;padding:2.5rem"><h1>Minha conta</h1><p class="sub">Entre pra ver seus dados, pedidos e vouchers.</p><button class="btn-s" style="max-width:260px" data-abrir-login="entrar">Entrar</button><p class="sub" style="margin-top:1rem">ou <button class="link-s" data-abrir-login="criar">criar conta</button></p></div>'; return; }
    const comp = BK.completudeConta(c); const voucher = BK.cupons().find((x) => x.codigo === "CADASTRO5" && x.ativo !== false); const usou = voucher ? BK.usosCupom("CADASTRO5", c.telefone) > 0 : false;
    const campo = (k, rot, tipo, extra) => '<label class="campo-s">' + rot + (tipo === "select" ? '<select name="' + k + '">' + extra.map((o) => '<option value="' + esc(o) + '"' + (c[k] === o ? " selected" : "") + ">" + (o || "—") + "</option>").join("") + "</select>" : tipo === "textarea" ? '<textarea name="' + k + '" rows="2">' + esc(c[k] || "") + "</textarea>" : '<input name="' + k + '" type="' + (tipo || "text") + '" value="' + esc(c[k] || "") + '"' + (k === "cpf" ? " readonly" : "") + "/>") + "</label>";
    el.innerHTML = '<h1>Olá, ' + esc(c.nome.split(" ")[0]) + '</h1><p class="sub">CPF ' + fmtCpf(c.cpf) + " · conta criada em " + new Date(c.criadaEm).toLocaleDateString("pt-BR") + "</p>" +
      '<div class="grid gap-6 lg:grid-cols-[1fr_360px]"><div class="cartao-s"><h2 style="font-size:1.1rem;font-weight:500;margin:0 0 1rem">Meus dados</h2><form id="form-perfil"><div class="grid sm:grid-cols-2 gap-x-4">' +
      campo("nome", "Nome completo") + campo("telefone", "Telefone", "tel") + campo("email", "E-mail", "email") + campo("cpf", "CPF") + campo("nascimento", "Data de nascimento", "date") + campo("genero", "Gênero", "select", ["", "Feminino", "Masculino", "Outro", "Prefiro não dizer"]) +
      campo("endereco", "Endereço (rua, número, complemento)") + '<label class="campo-s">Bairro<select name="bairro"><option value="">—</option>' + (U.taxasEntrega || []).map((t) => '<option' + (c.bairro === t.bairro ? " selected" : "") + ">" + esc(t.bairro) + "</option>").join("") + "</select></label>" +
      campo("comoConheceu", "Como conheceu a Bread King", "select", ["", "Instagram", "Indicação de amigo", "Passei na loja", "Google", "iFood", "Outro"]) + campo("preferencias", "O que mais gosta de pedir", "textarea") +
      '<label class="campo-s">Nova senha (deixe em branco pra manter)<input name="senha" type="password" autocomplete="new-password"/></label></div><div class="flex gap-3 flex-wrap mt-2"><button class="btn-s" style="width:auto">Salvar dados</button><button type="button" class="btn-s neutro" style="width:auto" data-sair>Sair da conta</button></div></form></div>' +
      '<div><div class="cartao-s"><h2 style="font-size:1.1rem;font-weight:500;margin:0 0 .5rem">Cadastro ' + comp.pct + '% completo</h2><div class="barra-progresso"><i style="width:' + comp.pct + '%"></i></div>' +
      (comp.pct === 100 ? (voucher ? '<div class="aviso-cupom" style="margin-top:1rem">' + icone("tag", "h-5 w-5") + "<span>" + (usou ? "Você já usou seu voucher <b>" + voucher.codigo + "</b>. Obrigado!" : "Cadastro completo! Seu voucher <b>" + voucher.codigo + "</b> dá <b>" + voucher.desconto + "% OFF</b> no próximo pedido. Digite no carrinho.") + "</span></div>" : "") : (voucher ? '<p class="sub" style="margin:.75rem 0 .25rem">Complete o cadastro e ganhe um voucher de <b>' + voucher.desconto + "% OFF</b>.</p>" : "") + '<p style="font-size:.82rem;color:var(--cinza)">Falta: ' + comp.faltam.join(", ") + "</p>") + "</div>" +
      '<div class="cartao-s" style="margin-top:1rem"><h2 style="font-size:1.1rem;font-weight:500;margin:0 0 .5rem">Meus pedidos</h2><p class="sub" style="margin:0 0 .75rem">' + BK.pedidos().filter((p) => soNum(p.cliente.telefone) === c.telefone).length + ' pedidos nesta conta.</p><a class="btn-s sec" href="acompanhamento.html">Ver pedidos</a></div></div></div>';
    el.querySelector("#form-perfil").addEventListener("submit", (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries()); if (!d.senha) delete d.senha; d.cpf = c.cpf; const antes = BK.completudeConta(c).pct; BK.salvarConta(Object.assign({}, d)); const depois = BK.completudeConta(Conta.atual()).pct; Conta.sincronizarCliente(Conta.atual()); toast(depois === 100 && antes < 100 && voucher ? "Cadastro completo! Voucher " + voucher.codigo + " liberado." : "Dados salvos."); renderConta(el); Conta.renderArea(); });
    el.querySelector("[data-sair]").addEventListener("click", () => { Conta.sair(); location.href = "index.html"; });
  };
  document.addEventListener("DOMContentLoaded", () => { Conta.renderArea(); const el = document.getElementById("conta"); if (el) { renderConta(el); document.addEventListener("conta:mudou", () => renderConta(el)); } });
})();
