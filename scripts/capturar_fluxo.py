"""Captura 2: carrinho com itens (/pedido preenchido), seções da home uma a uma, 404."""
import time, json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE="https://breadkingsaopaulo.com.br"; OUT=Path(__file__).resolve().parent.parent/"referencia"/"capturas"
def slow_scroll(pg):
    pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,250));} }")
    time.sleep(1.5)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page()
    # home: rolar devagar e fotografar seções
    pg.goto(BASE+"/",wait_until="networkidle"); time.sleep(2); slow_scroll(pg); slow_scroll(pg)
    (OUT/"home-rolada.html").write_text(pg.content())
    pg.screenshot(path=str(OUT/"home-desktop-2.png"),full_page=True)
    for sel in ["#porque","#lojas","footer","header","nav"]:
        try:
            el=pg.locator(sel).first
            if el.count():
                el.scroll_into_view_if_needed(); time.sleep(1.2)
                el.screenshot(path=str(OUT/f"home-{sel.strip('#')}.png"))
                print(sel,"ok")
        except Exception as e: print(sel,"falhou",e)
    # ids de seções existentes
    print("ids:", pg.evaluate("()=>[...document.querySelectorAll('[id]')].map(e=>e.tagName+'#'+e.id).slice(0,60)"))
    # carrinho: adicionar 3 itens no /cardapio
    pg.goto(BASE+"/cardapio",wait_until="networkidle"); time.sleep(2)
    btns=pg.get_by_role("button",name="Adicionar")
    print("botões Adicionar:",btns.count())
    for i in [0,1,5]:
        btns.nth(i).scroll_into_view_if_needed(); btns.nth(i).click(); time.sleep(0.6)
    btns.nth(0).click(); time.sleep(0.6)
    pg.screenshot(path=str(OUT/"cardapio-apos-adicionar.png"))
    (OUT/"cardapio-apos-adicionar.html").write_text(pg.content())
    # clicar num card pra ver se abre detalhe/modal
    pg.locator(".product-card").nth(2).click(); time.sleep(1.2)
    pg.screenshot(path=str(OUT/"cardapio-card-clicado.png")); (OUT/"cardapio-card-clicado.html").write_text(pg.content())
    pg.keyboard.press("Escape"); time.sleep(0.5)
    pg.goto(BASE+"/pedido",wait_until="networkidle"); time.sleep(2)
    (OUT/"pedido-cheio.html").write_text(pg.content()); pg.screenshot(path=str(OUT/"pedido-cheio-desktop.png"),full_page=True)
    # selecionar unidade e entrega pra ver os campos
    try:
        pg.get_by_role("combobox").first.click(); time.sleep(0.8); pg.screenshot(path=str(OUT/"pedido-unidades.png"))
        (OUT/"pedido-unidades.html").write_text(pg.content())
        pg.get_by_role("option").first.click(); time.sleep(0.8)
        pg.get_by_role("button",name="Entrega").first.click(); time.sleep(0.8)
        (OUT/"pedido-entrega.html").write_text(pg.content()); pg.screenshot(path=str(OUT/"pedido-entrega-desktop.png"),full_page=True)
        pg.get_by_role("button",name="Retirada").first.click(); time.sleep(0.8)
        (OUT/"pedido-retirada.html").write_text(pg.content()); pg.screenshot(path=str(OUT/"pedido-retirada-desktop.png"),full_page=True)
        # preencher e capturar a URL do whatsapp sem abrir
        pg.get_by_role("button",name="Entrega").first.click(); time.sleep(0.5)
        for ph,val in [("Nome","Teste Clone"),("Telefone","48988475389"),("Endereço","Rua Exemplo, 123")]:
            try: pg.get_by_placeholder(ph,exact=False).first.fill(val)
            except Exception as e: print("campo",ph,e)
        pg.evaluate("()=>{window.__urls=[];window.open=(u)=>{window.__urls.push(u);return null;}}")
        pg.get_by_role("button",name="Enviar pelo WhatsApp").click(); time.sleep(1)
        urls=pg.evaluate("()=>window.__urls"); print("WA URL:",urls)
        (OUT/"whatsapp-url.json").write_text(json.dumps(urls))
    except Exception as e: print("fluxo pedido falhou:",e)
    m=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True); mp=m.new_page()
    mp.goto(BASE+"/",wait_until="networkidle"); time.sleep(2); slow_scroll(mp); slow_scroll(mp)
    mp.screenshot(path=str(OUT/"home-mobile-2.png"),full_page=True)
    b.close()
