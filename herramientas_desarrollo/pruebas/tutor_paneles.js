// Tutor v5: ocultar los paneles (◧ F7, ◨ F8), 👁 Rejilla, 🏷 Nombres, 📏 Cotas, ↶ ↷ ⭘ ✓ en la barra, desplegables de Dibujo y 🖼 Fondo arriba.
const { lanzar, path, SUITE, fs } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(() => { document.querySelectorAll('.modal-overlay.visible').forEach(m => m.classList.remove('visible')); tuCargarEjemplo(TU_EJEMPLOS.findIndex(e => !e.ejercicio)); }); await p.waitForTimeout(500);
  const medir = () => p.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; }; return { cw: Math.round(r('#canvasWrap').width), izq: !!r('.action-panel'), der: !!r('.tutor-panel'), herr: !!r('#toolStrip') }; });
  const a = await medir(); ok('al empezar se ven los dos paneles', a.izq && a.der && a.herr);
  await p.click('#btnPanelIzq'); await p.keyboard.press('F8'); await p.waitForTimeout(250); const c = await medir();
  ok('ocultarlos agranda el dibujo y deja la barra', !c.izq && !c.der && c.herr && c.cw > a.cw, `${a.cw} → ${c.cw} px`);
  await p.screenshot({ path: path.join(OUT, 'tutor_sin_paneles.png') });
  await p.click('#btnVerRejilla'); ok('👁 Rejilla la oculta, el imán sigue', await p.evaluate(() => !verRejilla && snapCfg.rejilla !== undefined));
  await p.reload(); await p.waitForTimeout(1200); const d = await medir();
  ok('al volver a abrir se recuerda', !d.izq && !d.der && await p.evaluate(() => !verRejilla && document.getElementById('btnPanelIzq').classList.contains('oculto')));
  await p.evaluate(() => tuCargarEjemplo(TU_EJEMPLOS.findIndex(e => !e.ejercicio))); await p.waitForTimeout(400); const e = await medir();
  ok('abrir un ejemplo vuelve a mostrar el programa', e.der && !e.izq);
  await p.keyboard.press('F7'); await p.click('#btnVerRejilla'); await p.waitForTimeout(200); const f = await medir(); ok('y se vuelven a mostrar', f.izq && f.der);
  for (const [bt, ch] of [['#btnVerNombres', 'tuNombres'], ['#btnVerCotas', 'chkCotas']]) {
    const x = await p.evaluate(c => document.getElementById(c).checked, ch); await p.click(bt); await p.waitForTimeout(100);
    ok(`${bt} va a la par con su casilla`, await p.evaluate(([b, c, x]) => { const k = document.getElementById(c).checked; return k !== x && document.querySelector(b).classList.contains('visible') === k; }, [bt, ch, x]));
    await p.click(bt);
  }
  const t = await p.evaluate(() => { const s = document.getElementById('toolStrip'), v = q => { const e = s.querySelector(q); return !!e && e.offsetParent !== null; }; return { d: v('button[onclick="deshacer()"]'), r: v('button[onclick="rehacer()"]'), c: !!s.querySelector('#btnCerrar'), t: !!s.querySelector('#btnTerminar'), f: !!document.querySelector('.c2-archivo #btnFondoArriba'), cotas: !!document.querySelector('#c2PaneDib > .c2-cotas #chkCotas'), aj: !!document.querySelector('#c2PaneDib > .c2-ajuste') }; });
  ok('↶ ↷ ⭘ ✓ en la barra, 🖼 Fondo arriba y los desplegables', Object.values(t).every(Boolean), JSON.stringify(t));
  await p.evaluate(() => { tuNivel(1); }); ok('el nivel de herramientas no oculta ↶ ↷', await p.evaluate(() => document.querySelector('#toolStrip button[onclick="deshacer()"]').offsetParent !== null)); await p.evaluate(() => tuNivel(3));
  // ejercicio: sin 🖼 Fondo ni ↶ ↷ ⭘ ✓
  const ie = await p.evaluate(() => TU_EJEMPLOS.findIndex(e => e.ejercicio));
  if (ie >= 0) { await p.evaluate(i => tuCargarEjemplo(i), ie); await p.waitForTimeout(400);
    ok('en un ejercicio no están 🖼 Fondo ni ↶ ↷', await p.evaluate(() => document.documentElement.classList.contains('tu-es-ejercicio') && document.getElementById('btnFondoArriba').offsetParent === null && document.querySelector('#toolStrip button[onclick="deshacer()"]').offsetParent === null));
    await p.screenshot({ path: path.join(OUT, 'tutor_ejercicio.png') }); }
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
