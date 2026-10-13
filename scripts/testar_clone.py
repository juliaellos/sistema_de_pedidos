"""Teste ponta a ponta do site e do painel (file://). Roda em Chromium e WebKit (Safari). Capturas em tmp/."""
import time, json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
RAIZ=Path(__file__).resolve().parent.parent; SITE=RAIZ/"site"; OUT=RAIZ/"tmp"; OUT.mkdir(exist_ok=True)
def rolar(pg): pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,70));} window.scrollTo(0,0);}"); time.sleep(.8)
def roda(nome, launcher):
    erros=[]; pre=nome+"-"
    b=launcher.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page(); pg.set_default_navigation_timeout(90000)
    pg.on("console", lambda m: erros.append(m.text) if m.type=="error" and "ERR_FILE_NOT_FOUND" not in m.text else None)
    pg.on("pageerror", lambda e: erros.append(str(e)))
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded", timeout=90000); time.sleep(1.5); pg.evaluate("()=>localStorage.clear()"); pg.reload(); time.sleep(1.5)
    pg.screenshot(path=str(OUT/(pre+"1-cardapio.png"))); rolar(pg); pg.screenshot(path=str(OUT/(pre+"1b-cardapio-full.png")),full_page=True)
    print(nome,"fontes:", pg.evaluate("()=>[getComputedStyle(document.querySelector('h1')).fontFamily, getComputedStyle(document.body).fontFamily, getComputedStyle(document.body).backgroundColor]"))
    pg.click("[data-ver-mais]"); time.sleep(.6); pg.screenshot(path=str(OUT/(pre+"2-vermais-sobre.png"))); pg.click('[data-aba="horario"]'); time.sleep(.4); pg.screenshot(path=str(OUT/(pre+"2b-vermais-horario.png"))); pg.keyboard.press("Escape"); time.sleep(.3)
    pg.locator("[data-add]").first.click(); time.sleep(.4); pg.locator("[data-add]").nth(5).click(); time.sleep(.4)
    # navegação por clique (sem goto)
    pg.click("#link-carrinho"); time.sleep(1.2); print(nome,"foi pro pedido:", pg.url.endswith("pedido.html"))
    pg.fill('[data-campo="nome"]',"Teste Clone"); pg.fill('[data-campo="email"]',"teste@exemplo.com"); pg.fill('[data-campo="telefone"]',"48988475389")
    pg.select_option('[data-campo="bairro"]',"Pedra Branca"); time.sleep(.3); pg.fill('[data-campo="endereco"]',"Rua Exemplo, 123")
    pg.click("[data-pix-pagar]"); pg.wait_for_url("**/acompanhamento.html*", timeout=60000); time.sleep(1); print(nome,"depois do pix:", pg.url.split("/")[-1][:40]); pg.screenshot(path=str(OUT/(pre+"3-pedido-recebido.png")),full_page=True)
    pg.click(".btn-meus-pedidos"); time.sleep(1); pg.screenshot(path=str(OUT/(pre+"4-meus-pedidos.png"))); print(nome,"meus pedidos:", pg.locator(".lista-pedidos a").count())
    pg.click("a.marca"); time.sleep(1.2); print(nome,"voltou ao cardápio:", pg.url.endswith("index.html"), "recomendados:", pg.locator("#recomendados").count())
    # admin
    pg.goto((SITE/"admin/index.html").as_uri()); time.sleep(1); pg.fill("#senha","breadking"); pg.click("#form-login button"); time.sleep(.8)
    pg.click("[data-pedido]"); time.sleep(.5); pg.evaluate("()=>{window.__abriu=0;window.open=()=>{window.__abriu++;return null;}}")
    pg.click('[data-status="preparo"]'); time.sleep(.3); pg.click('[data-status="saiu"]'); time.sleep(.5)
    print(nome,"abriu whatsapp?", pg.evaluate("()=>window.__abriu"), "| msgs no pedido:", pg.evaluate("()=>BK.pedidos()[0].mensagens.length")); pg.screenshot(path=str(OUT/(pre+"5-admin-saiu.png")))
    pg.click("[data-fechar]"); time.sleep(.3)
    pg.click('[data-tela="config"]'); time.sleep(.4); pg.click("[data-exemplos]"); time.sleep(.8)
    pg.click('[data-tela="clientes"]'); time.sleep(.4); pg.fill("[data-busca-cli]","ana"); time.sleep(.4); print(nome,"busca ana:", pg.locator("[data-cli]").count()); pg.fill("[data-busca-cli]",""); time.sleep(.3)
    pg.click("[data-cli]"); time.sleep(.4); pg.click(".gaveta [data-pedido]"); time.sleep(.4); print(nome,"voltar ao cliente:", pg.locator("[data-voltar-cliente]").count()); pg.click("[data-voltar-cliente]"); time.sleep(.4); pg.screenshot(path=str(OUT/(pre+"6-admin-cliente.png"))); pg.click("[data-fechar]"); time.sleep(.3)
    pg.click('[data-tela="desempenho"]'); time.sleep(.6); pg.hover(".barra >> nth=2"); time.sleep(.3); pg.screenshot(path=str(OUT/(pre+"7-admin-desempenho.png")),full_page=True)
    pg.click('[data-tela="abc"]'); time.sleep(.5); pg.screenshot(path=str(OUT/(pre+"8-admin-abc.png")),full_page=True)
    pg.click('[data-tipo="clientes"]'); time.sleep(.4); print(nome,"abc clientes linhas:", pg.locator("tbody tr").count())
    # cliente vê a mensagem
    pg.goto((SITE/"acompanhamento.html").as_uri()+"?n=BK-1001"); time.sleep(1); pg.screenshot(path=str(OUT/(pre+"9-pedido-com-mensagem.png")),full_page=True)
    m=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True); mp=m.new_page(); mp.goto((SITE/"index.html").as_uri()); time.sleep(1.5); mp.screenshot(path=str(OUT/(pre+"10-mobile.png"))); mp.click("[data-ver-mais]"); time.sleep(.5); mp.screenshot(path=str(OUT/(pre+"10b-mobile-vermais.png")))
    b.close(); print(nome,"ERROS:", erros if erros else "nenhum")
with sync_playwright() as p:
    roda("chromium", p.chromium)
    try: roda("webkit", p.webkit)
    except Exception as e: print("webkit falhou:", str(e)[:300])
