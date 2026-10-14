"""Teste ponta a ponta (file://) em Chromium e WebKit: visual novo, conta CPF+senha, cupom SITE10, pedido sem login, perfil/voucher, painel."""
import time, json
from pathlib import Path
from playwright.sync_api import sync_playwright
RAIZ=Path(__file__).resolve().parent.parent; SITE=RAIZ/"site"; OUT=RAIZ/"tmp"; OUT.mkdir(exist_ok=True)
def rolar(pg): pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0);}"); time.sleep(.6)
def roda(nome, launcher, fotos):
    erros=[]; pre=nome+"-"; snap=(lambda n,**k: None) if not fotos else (lambda n,**k: pg.screenshot(path=str(OUT/(pre+n+".png")),**k))
    b=launcher.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page(); pg.set_default_navigation_timeout(90000)
    pg.on("console", lambda m: erros.append(m.text) if m.type=="error" and "ERR_FILE_NOT_FOUND" not in m.text else None); pg.on("pageerror", lambda e: erros.append(str(e)))
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.5); pg.evaluate("()=>localStorage.clear()"); pg.reload(); time.sleep(1.5)
    snap("1-cardapio"); rolar(pg); snap("1b-cardapio-full", full_page=True)
    print(nome,"fonte:", pg.evaluate("()=>getComputedStyle(document.body).fontFamily.split(',')[0]"), "| seções:", pg.locator("[data-category]").count(), "| itens:", pg.locator(".item").count())
    pg.click("[data-ver-mais]"); time.sleep(.5); snap("2-vermais"); print(nome,"instagram no ver mais:", pg.locator(".gaveta-loja a[href*='instagram']").count()); pg.keyboard.press("Escape"); time.sleep(.3)
    print(nome,"stepper externo:", pg.locator("#categorias [data-stepper]").count())
    pg.locator(".btn-add").first.click(); time.sleep(.5); snap("3-modal"); pg.locator('#modal-produto [data-acao="mais"]').click(); pg.locator('#modal-produto [data-acao="mais"]').click(); print(nome,"qtd no modal:", pg.locator("#modal-produto [data-q]").inner_text()); pg.click("[data-madd]"); time.sleep(.4)
    pg.goto((SITE/"index-v2.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.5); snap("1c-v2"); print(nome,"v2 cards verticais:", pg.locator(".item-v").count(), "| estrela/nota no hero:", pg.locator(".loja-nome .selo, .loja-nome .nota").count(), "| pedido mínimo:", pg.locator("text=Pedido mínimo").count())
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.2)
    pg.locator(".btn-add").nth(3).click(); time.sleep(.4); pg.click("[data-madd]"); time.sleep(.3)
    pg.click("#link-carrinho"); time.sleep(1.2); snap("4-pedido-sem-login", full_page=True)
    # pedido sem login -> whatsapp
    pg.evaluate("()=>{window.__urls=[];window.open=(u)=>{window.__urls.push(u);return null;}}"); pg.click("[data-sem-login]"); time.sleep(.4); snap("4b-sem-login-form")
    pg.fill('#modal-sem-login [name="nome"]',"Maria Teste"); pg.fill('#modal-sem-login [name="telefone"]',"48999990000"); pg.fill('#modal-sem-login [name="endereco"]',"Rua das Flores, 10, Pagani"); pg.click("#modal-sem-login form .btn-s.whats"); time.sleep(.4)
    from urllib.parse import unquote; u=pg.evaluate("()=>window.__urls"); print(nome,"sem login ->", (unquote(u[0]).split("text=")[1].replace("\n"," | ")[:260] if u else "NADA"))
    # criar conta
    pg.click('[data-abrir-login="criar"]'); time.sleep(.4); snap("5-criar-conta")
    pg.fill('[data-form="criar"] [name="nome"]',"Teste Clone"); pg.fill('[data-form="criar"] [name="telefone"]',"48988475389"); pg.fill('[data-form="criar"] [name="cpf"]',"52998224725"); pg.fill('[data-form="criar"] [name="email"]',"teste@exemplo.com"); pg.fill('[data-form="criar"] [name="senha"]',"1234"); pg.click('[data-form="criar"] .btn-s'); time.sleep(.8)
    print(nome,"logado:", pg.evaluate("()=>Conta.atual()&&Conta.atual().nome"), "| cupom automático:", pg.locator("text=SITE10").count()>0); snap("6-pedido-logado", full_page=True)
    pg.select_option('[data-campo="bairro"]',"Pedra Branca"); time.sleep(.3); pg.fill('[data-campo="endereco"]',"Rua Exemplo, 123")
    pg.click("[data-pix-pagar]"); pg.wait_for_url("**/acompanhamento.html*", timeout=60000); time.sleep(1); snap("7-pedido-recebido", full_page=True)
    print(nome,"pedido com cpf:", pg.evaluate("()=>BK.pedidos()[0].cliente.cpf"), "cupom:", pg.evaluate("()=>BK.pedidos()[0].cupom&&BK.pedidos()[0].cupom.codigo"))
    # conta: completar cadastro -> voucher
    pg.goto((SITE/"conta.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1); snap("8-conta", full_page=True)
    pg.fill('#form-perfil [name="nascimento"]',"1998-05-12"); pg.select_option('#form-perfil [name="genero"]',"Feminino"); pg.fill('#form-perfil [name="endereco"]',"Rua Exemplo, 123"); pg.select_option('#form-perfil [name="bairro"]',"Pedra Branca"); pg.select_option('#form-perfil [name="comoConheceu"]',"Instagram"); pg.fill('#form-perfil [name="preferencias"]',"Pão de queijo"); pg.click("#form-perfil .btn-s"); time.sleep(.6)
    print(nome,"cadastro:", pg.locator("text=100% completo").count()>0, "| voucher:", pg.locator("text=CADASTRO5").count()>0); snap("9-conta-completa", full_page=True)
    # novo pedido com CADASTRO5
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.2); print(nome,"recomendados:", pg.locator("#recomendados").count(), "| área conta:", pg.locator("#area-conta").inner_text().strip())
    pg.locator(".btn-add").first.click(); time.sleep(.4); pg.click("[data-madd]"); time.sleep(.3); pg.goto((SITE/"pedido.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1)
    pg.fill("[data-cupom]","cadastro5"); pg.click("[data-aplicar-cupom]"); time.sleep(.3); print(nome,"CADASTRO5 aplicado:", pg.locator("text=CADASTRO5 · -5%").count()>0)
    # sair e entrar
    pg.goto((SITE/"conta.html").as_uri(), wait_until="domcontentloaded"); time.sleep(.8); pg.click("[data-sair]"); time.sleep(1.2); pg.click('#area-conta [data-abrir-login]'); time.sleep(.3); pg.fill('[data-form="entrar"] [name="cpf"]',"52998224725"); pg.fill('[data-form="entrar"] [name="senha"]',"errada"); pg.click('[data-form="entrar"] .btn-s'); time.sleep(.3); print(nome,"senha errada:", pg.locator("[data-erro]").inner_text()); pg.fill('[data-form="entrar"] [name="senha"]',"1234"); pg.click('[data-form="entrar"] .btn-s'); time.sleep(.6); print(nome,"relogado:", pg.evaluate("()=>!!Conta.atual()"))
    pg.goto((SITE/"acompanhamento.html").as_uri(), wait_until="domcontentloaded"); time.sleep(.8); print(nome,"meus pedidos:", pg.locator(".lista-pedidos a").count()); snap("10-meus-pedidos")
    # admin
    pg.goto((SITE/"admin/index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1); pg.fill("#senha","breadking"); pg.click("#form-login button"); time.sleep(.8)
    pg.click('[data-tela="config"]'); time.sleep(.4); pg.click("[data-exemplos]"); time.sleep(.8)
    pg.click('[data-tela="modelos"]'); time.sleep(.5); snap("11-admin-modelos", full_page=True); pg.click("[data-usar-modelo]"); time.sleep(.6); print(nome,"campanha a partir do modelo:", pg.locator('#fcamp [name="mensagem"]').input_value()[:50]); snap("12-admin-campanha-modelo"); pg.click("[data-fechar]"); time.sleep(.3)
    pg.click('[data-tela="segmentos"]'); time.sleep(.5); pg.click("text=Mulheres 25 a 45"); time.sleep(.5); print(nome,"mulheres 25-45:", pg.locator("h3").filter(has_text="no público").inner_text()); snap("13-admin-seg-genero", full_page=True)
    pg.click('[data-tela="clientes"]'); time.sleep(.5); snap("14-admin-clientes")
    m=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True); mp=m.new_page(); mp.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.5)
    if fotos: mp.screenshot(path=str(OUT/(pre+"15-mobile.png"))); mp.goto((SITE/"index-v2.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.5); mp.evaluate("()=>window.scrollTo(0,700)"); time.sleep(.5); mp.screenshot(path=str(OUT/(pre+"16-mobile-v2.png")))
    b.close(); print(nome,"ERROS:", erros if erros else "nenhum")
with sync_playwright() as p:
    roda("chromium", p.chromium, True)
    try: roda("webkit", p.webkit, False)
    except Exception as e: print("webkit falhou:", str(e)[:300])
