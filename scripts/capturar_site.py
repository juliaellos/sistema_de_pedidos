"""Abre o site de referência num navegador, espera renderizar e salva:
- referencia/capturas/<pagina>.html  (DOM renderizado)
- referencia/capturas/<pagina>-desktop.png / -mobile.png
- referencia/catalogo-bruto.json (produtos lidos do DOM)
"""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://breadkingsaopaulo.com.br"
OUT = Path(__file__).resolve().parent.parent / "referencia" / "capturas"
OUT.mkdir(parents=True, exist_ok=True)
PAGES = {"home": "/", "cardapio": "/cardapio", "pedido": "/pedido", "404": "/pagina-inexistente"}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg = ctx.new_page()
    for name, path in PAGES.items():
        pg.goto(BASE + path, wait_until="networkidle")
        time.sleep(2)
        # rolar pra carregar imagens lazy
        pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} window.scrollTo(0,0);}")
        time.sleep(1.5)
        (OUT / f"{name}.html").write_text(pg.content())
        pg.screenshot(path=str(OUT / f"{name}-desktop.png"), full_page=True)
        print(name, "ok", pg.url)
    # catálogo: por categoria, na página /cardapio
    pg.goto(BASE + "/cardapio", wait_until="networkidle"); time.sleep(2)
    cats = pg.evaluate("""()=>[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(t=>['Confeitaria','Padaria','Pizzas','Salgados','Sem Glúten e Sem Lactose','Sopas','Tortas Especiais','Todos','Todas'].includes(t))""")
    print("categorias:", cats)
    catalogo = {}
    for c in cats:
        pg.get_by_role("button", name=c, exact=True).first.click(); time.sleep(1.2)
        pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}}")
        time.sleep(1)
        items = pg.evaluate("""()=>{
          const cards=[...document.querySelectorAll('img')].map(i=>i.closest('div[class*="card"], article, div[class*="rounded"]')).filter(Boolean);
          const seen=new Set(); const out=[];
          for(const el of cards){ const txt=el.innerText; if(!/R\\$/.test(txt)) continue; const img=el.querySelector('img'); const key=img?.src+txt; if(seen.has(key)) continue; seen.add(key);
            out.push({html: el.outerHTML.slice(0,3000), texto: txt, img: img?.src, alt: img?.alt}); }
          return out; }""")
        catalogo[c] = items
        print(c, len(items))
    (Path(__file__).resolve().parent.parent / "referencia" / "catalogo-bruto.json").write_text(json.dumps(catalogo, ensure_ascii=False, indent=1))
    # mobile shots
    m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
    mp = m.new_page()
    for name, path in PAGES.items():
        mp.goto(BASE + path, wait_until="networkidle"); time.sleep(2)
        mp.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0);}"); time.sleep(1)
        mp.screenshot(path=str(OUT / f"{name}-mobile.png"), full_page=True)
    b.close()
