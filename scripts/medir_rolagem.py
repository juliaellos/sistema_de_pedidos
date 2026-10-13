"""Mede travamentos na rolagem da home: tarefas longas (>50ms) e tempo de scroll."""
import time, sys
from playwright.sync_api import sync_playwright
from pathlib import Path
SITE=Path(__file__).resolve().parent.parent/"site"
with sync_playwright() as p:
    for nome,l in [("chromium",p.chromium),("webkit",p.webkit)]:
        b=l.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
        pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(2)
        pg.evaluate("()=>{window.__long=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__long.push(Math.round(e.duration)))).observe({type:'longtask',buffered:true})}catch(e){}}")
        t0=time.time()
        for i in range(30): pg.mouse.wheel(0,300); time.sleep(0.1)
        dt=time.time()-t0
        imgs=pg.evaluate("()=>({carregadas:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length, total:document.images.length, mem: performance.memory? Math.round(performance.memory.usedJSHeapSize/1e6):null})")
        print(nome,"rolagem 30 passos:",round(dt,2),"s | long tasks:",pg.evaluate("()=>window.__long"),"| imgs:",imgs)
        b.close()
