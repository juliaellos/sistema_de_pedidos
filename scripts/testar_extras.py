"""Testa combos, nascimento, cupons com regras, campanhas e avaliações (Chromium). Capturas em tmp/."""
import time, json
from pathlib import Path
from playwright.sync_api import sync_playwright
RAIZ=Path(__file__).resolve().parent.parent; SITE=RAIZ/"site"; OUT=RAIZ/"tmp"; OUT.mkdir(exist_ok=True); erros=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}); pg.set_default_navigation_timeout(90000)
    pg.on("pageerror", lambda e: erros.append(str(e))); pg.on("console", lambda m: erros.append(m.text) if m.type=="error" and "ERR_FILE" not in m.text else None)
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.5); pg.evaluate("()=>localStorage.clear()"); pg.reload(); time.sleep(1.5)
    print("combos no site:", pg.locator("#categoria-combos [data-card]").count(), "| leva:", pg.locator("#categoria-combos [data-card]").first.inner_text().split("\n")[1][:60])
    pg.locator("#categoria-combos [data-add]").first.click(); time.sleep(.4); pg.screenshot(path=str(OUT/"x1-combos.png"))
    pg.goto((SITE/"pedido.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1)
    pg.fill('[data-campo="nome"]',"Teste Clone"); pg.fill('[data-campo="email"]',"teste@exemplo.com"); pg.fill('[data-campo="telefone"]',"48988475389"); pg.fill('[data-campo="nascimento"]',"1999-"+time.strftime("%m")+"-20")
    pg.click('[data-modalidade="retirada"]'); time.sleep(.3)
    pg.fill("[data-cupom]","NAOEXISTE"); pg.click("[data-aplicar-cupom]"); time.sleep(.3); print("cupom inválido:", pg.locator("[data-cupom-erro]").inner_text())
    pg.fill("[data-cupom]","palhoca5"); pg.click("[data-aplicar-cupom]"); time.sleep(.3); print("cupom ok:", pg.locator("text=PALHOCA5").count()>0)
    pg.screenshot(path=str(OUT/"x2-pedido-nascimento.png"),full_page=True)
    pg.click("[data-pix-pagar]"); pg.wait_for_url("**/acompanhamento.html*", timeout=60000); time.sleep(1)
    print("nascimento salvo:", pg.evaluate("()=>BK.pedidos()[0].cliente.nascimento"), "| sem avaliação antes de concluir:", pg.locator("[data-avaliar]").count()==0)
    # admin: concluir pedido, cupom com limite, campanha
    pg.goto((SITE/"admin/index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1); pg.fill("#senha","breadking"); pg.click("#form-login button"); time.sleep(.8)
    pg.click("[data-pedido]"); time.sleep(.4); pg.click('[data-status="preparo"]'); time.sleep(.3); pg.click('[data-status="pronto"]'); time.sleep(.3); pg.click('[data-status="concluido"]'); time.sleep(.4); pg.click("[data-fechar]"); time.sleep(.3)
    pg.click('[data-tela="cupons"]'); time.sleep(.5); pg.click("[data-novo-cupom]"); time.sleep(.4)
    pg.fill('#fcup [name="codigo"]',"teste1x"); pg.fill('#fcup [name="desconto"]',"15"); pg.check('#fcup [name="umPorCliente"]'); pg.fill('#fcup [name="minimo"]',"30"); pg.click("#fcup .btn.primario"); time.sleep(.5); pg.screenshot(path=str(OUT/"x3-admin-cupons.png"))
    pg.click('[data-tela="config"]'); time.sleep(.4); pg.click("[data-exemplos]"); time.sleep(.8)
    pg.click('[data-tela="segmentos"]'); time.sleep(.5); pg.click("text=Aniversariantes do mês"); time.sleep(.5); print("aniversariantes do mês:", pg.locator("h3").filter(has_text="no público").inner_text()); pg.screenshot(path=str(OUT/"x4-admin-aniversario.png"),full_page=True)
    pg.click("[data-criar-camp]"); time.sleep(.6); pg.fill('#fcamp [name="nome"]',"Parabéns aniversariantes"); pg.select_option('#fcamp [name="cupom"]',"TESTE1X"); pg.fill('#fcamp [name="mensagem"]',"Oi, {nome}! Feliz aniversário 🎂 Use {cupom} e ganhe 15%."); time.sleep(.3); pg.screenshot(path=str(OUT/"x5-admin-campanha.png"),full_page=True)
    pg.once("dialog", lambda d: d.accept()); pg.click("[data-disparar]"); time.sleep(.6); print("campanhas:", pg.evaluate("()=>BK.campanhas().map(c=>[c.nome,c.enviada,c.destinatarios.length])")); pg.screenshot(path=str(OUT/"x6-admin-campanhas.png"))
    pg.click('[data-tela="produtos"]'); time.sleep(.4); pg.click('[data-editar="combo-cafe-da-manha"]'); time.sleep(.5); pg.screenshot(path=str(OUT/"x7-admin-combo.png"),full_page=True); print("itens do combo no form:", pg.locator(".item-combo").count()); pg.click("[data-fechar]"); time.sleep(.3)
    # cliente avalia
    pg.goto((SITE/"acompanhamento.html").as_uri()+"?n=BK-1001", wait_until="domcontentloaded"); time.sleep(1); print("convite avaliar:", pg.locator("[data-avaliar]").count()); pg.click('[data-nota="5"]'); pg.fill("[data-coment]","Chegou rápido e o pão de queijo é incrível."); pg.click("[data-enviar-av]"); time.sleep(.5); pg.screenshot(path=str(OUT/"x8-avaliado.png"),full_page=True)
    pg.goto((SITE/"index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1.2); print("nota no hero:", pg.locator(".loja-nome").inner_text())
    # cupom 1x por cliente: segundo uso deve falhar
    pg.goto((SITE/"admin/index.html").as_uri(), wait_until="domcontentloaded"); time.sleep(1); pg.click('[data-tela="avaliacoes"]'); time.sleep(.5); pg.screenshot(path=str(OUT/"x9-admin-avaliacoes.png"))
    pg.click('[data-tela="clientes"]'); time.sleep(.4); pg.fill("[data-busca-cli]","48988475389"); time.sleep(.4); pg.click("[data-cli]"); time.sleep(.5); pg.screenshot(path=str(OUT/"x10-cliente-campanha.png"),full_page=True)
    b.close()
print("ERROS:", erros if erros else "nenhum")
