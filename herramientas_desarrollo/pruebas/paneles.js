// Calcador v103 / Corrector v49: ocultar los paneles izquierdo (◧, F7) y derecho (◨, F8) —la barra de herramientas siempre se ve—
// y ver u ocultar la rejilla (👁 Rejilla). La zona de dibujo se agranda, el dibujo sigue centrado y se recuerda al volver a abrir.
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const d = ejercicios().map(f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }).find(d => d && d.calcador);
  for (const prog of ['calcador.html', 'corrector.html']) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(SUITE, prog)); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(d => { abrirJSONDatos(d); encuadrar(); }, d); await p.waitForTimeout(300);
    const medir = () => p.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; };
      const c = r('#canvasWrap'), centro = aPantalla({ x: view.cx, y: view.cy });
      return { cw: Math.round(c.width), izq: !!r('.action-panel'), der: !!r('.tutor-panel'), herr: !!r('#toolStrip'), centro: Math.round(centro.x - c.width / 2) }; });
    const a = await medir();
    await p.click('#btnPanelIzq'); await p.waitForTimeout(200); const b1 = await medir();
    await p.keyboard.press('F8'); await p.waitForTimeout(200); const b2 = await medir();
    ok(`${prog}: ocultar los dos paneles agranda el dibujo y deja la barra de herramientas`, !b2.izq && !b2.der && (b2.herr || prog === 'corrector.html') && b2.cw > a.cw + 600 && b1.cw > a.cw + 250 && Math.abs(b2.centro) <= 1, `${a.cw} → ${b1.cw} → ${b2.cw} px`);
    // la rejilla: se cuenta cuántas veces se llama a dibujarRejilla al pintar
    const llamadas = () => p.evaluate(() => { let n = 0; const o = window.dibujarRejilla; window.dibujarRejilla = function () { n++; return o.apply(this, arguments); }; try { dibujar(); } finally { window.dibujarRejilla = o; } return n; });
    const conRej = await llamadas(); await p.click('#btnVerRejilla'); await p.waitForTimeout(200); const sinRej = await llamadas();
    ok(`${prog}: 👁 Rejilla la oculta (el imán sigue aparte)`, conRej === 1 && sinRej === 0 && await p.evaluate(() => !verRejilla && snapCfg.rejilla && !document.getElementById('btnVerRejilla').classList.contains('visible')), `${conRej} → ${sinRej}`);
    if (prog === 'calcador.html') await p.screenshot({ path: path.join(OUT, 'calcador_sin_paneles.png') });
    await p.reload(); await p.waitForTimeout(1200); const c = await medir();
    ok(`${prog}: al volver a abrir se recuerda`, !c.izq && !c.der && await p.evaluate(() => !verRejilla && document.getElementById('btnPanelIzq').classList.contains('oculto')));
    await p.keyboard.press('F7'); await p.click('#btnPanelDer'); await p.click('#btnVerRejilla'); await p.waitForTimeout(200); const e = await medir();
    ok(`${prog}: y se vuelven a mostrar`, e.izq && e.der && e.cw === a.cw && await p.evaluate(() => verRejilla), `${e.cw} px`);
    ok(`${prog}: sin errores de JavaScript`, !errs.length, errs.join(' | '));
    await p.close();
  }
  console.log('fallos', fallos); await b.close();
})();
