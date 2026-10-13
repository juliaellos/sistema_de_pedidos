"""Abre o clone local (file://) no Chromium, roda o fluxo completo e salva capturas em tmp/."""
import time, json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
RAIZ=Path(__file__).resolve().parent.parent; SITE=RAIZ/"site"; OUT=RAIZ/"tmp"; OUT.mkdir(exist_ok=True)
erros=[]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page()
    pg.on("console", lambda m: erros.append(m.text) if m.type=="error" else None)
    pg.on("pageerror", lambda e: erros.append(str(e)))
    pg.goto((SITE/"index.html").as_uri()); time.sleep(2)
    pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));} window.scrollTo(0,0);}"); time.sleep(1)
    pg.screenshot(path=str(OUT/"clone-home.png"),full_page=True)
    print("cards na home:", pg.locator("[data-card]").count())
    # cardápio: quantidade no card
    pg.goto((SITE/"cardapio.html").as_uri()); time.sleep(1.5)
    pg.locator('[data-stepper] [data-acao="mais"]').first.click(); pg.locator('[data-stepper] [data-acao="mais"]').first.click()
    pg.locator("[data-add]").first.click(); time.sleep(0.5)
    pg.locator("[data-add]").nth(3).click(); time.sleep(0.5)
    pg.screenshot(path=str(OUT/"clone-cardapio-add.png"))
    pg.locator("[data-abrir]").nth(4).click(); time.sleep(0.6); pg.screenshot(path=str(OUT/"clone-modal.png"))
    pg.locator("[data-m='1']").click(); pg.locator("[data-madd]").click(); time.sleep(0.5)
    pg.fill("#busca","pão de queijo"); time.sleep(0.5); pg.screenshot(path=str(OUT/"clone-busca.png")); pg.fill("#busca",""); time.sleep(0.4)
    print("barra:", pg.locator("#barra-carrinho").inner_text().replace("\n"," | "))
    # pedido
    pg.goto((SITE/"pedido.html").as_uri()); time.sleep(1.2)
    pg.screenshot(path=str(OUT/"clone-pedido-vazio-dados.png"),full_page=True)
    pg.fill('[data-campo="nome"]',"Teste Clone"); pg.fill('[data-campo="email"]',"teste@exemplo.com"); pg.fill('[data-campo="telefone"]',"48988475389")
    pg.select_option('[data-campo="bairro"]',"Pedra Branca"); time.sleep(0.3)
    pg.fill('[data-campo="endereco"]',"Rua Exemplo, 123, apto 4")
    pg.fill("[data-cupom]","bemvindo10"); pg.click("[data-aplicar-cupom]"); time.sleep(0.4)
    pg.screenshot(path=str(OUT/"clone-pedido-preenchido.png"),full_page=True)
    print("enviar desabilitado antes de pagar:", pg.locator("[data-enviar]").is_disabled())
    # cartão recusado
    pg.click('[data-metodo="cartao"]'); pg.fill('[data-c="numero"]',"4000000000000002"); pg.fill('[data-c="nome"]',"TESTE"); pg.fill('[data-c="validade"]',"1230"); pg.fill('[data-c="cvv"]',"123"); pg.click("[data-cartao-pagar]"); time.sleep(0.3)
    print("erro cartão:", pg.locator("[data-cartao-erro]").inner_text())
    pg.screenshot(path=str(OUT/"clone-cartao-recusado.png"),full_page=True)
    # pix aprovado
    pg.click('[data-metodo="pix"]'); time.sleep(0.3); pg.screenshot(path=str(OUT/"clone-pix.png"),full_page=True)
    pg.click("[data-pix-pagar]"); time.sleep(0.5); pg.screenshot(path=str(OUT/"clone-pix-aguardando.png"),full_page=True); time.sleep(4.5)
    print("enviar habilitado depois de pagar:", not pg.locator("[data-enviar]").is_disabled())
    pg.screenshot(path=str(OUT/"clone-pago.png"),full_page=True)
    pg.evaluate("()=>{window.__urls=[];window.open=(u)=>{window.__urls.push(u);return null;}}")
    pg.click("[data-enviar]"); time.sleep(0.5)
    urls=pg.evaluate("()=>window.__urls"); 
    from urllib.parse import unquote
    print("URL:", urls[0][:60] if urls else None); print(unquote(urls[0].split("text=")[1]) if urls else "SEM URL")
    print("pedidos gravados:", pg.evaluate("()=>JSON.parse(localStorage.getItem('bk_pedidos_palhoça')||'[]').length"))
    # retirada
    pg.click('[data-modalidade="retirada"]'); time.sleep(0.3); pg.screenshot(path=str(OUT/"clone-retirada.png"),full_page=True)
    # mobile
    m=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True); mp=m.new_page()
    mp.goto((SITE/"index.html").as_uri()); time.sleep(1.5); mp.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0);}"); time.sleep(0.8)
    mp.screenshot(path=str(OUT/"clone-home-mobile.png"),full_page=True)
    mp.goto((SITE/"pedido.html").as_uri()); time.sleep(1); mp.screenshot(path=str(OUT/"clone-pedido-mobile.png"),full_page=True)
    mp.goto((SITE/"404.html").as_uri()); time.sleep(0.5); mp.screenshot(path=str(OUT/"clone-404-mobile.png"))
    b.close()
print("ERROS:", json.dumps(erros, ensure_ascii=False, indent=1) if erros else "nenhum")
