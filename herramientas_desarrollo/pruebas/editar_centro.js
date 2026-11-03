// Calcador v104: el centro de un arco por teclado (doble clic sobre su cruz), con vista previa:
// X Y o I J; «se mantienen los extremos» (a la mediatriz) o «se mueve el final del arco» (por la recta siguiente); círculos enteros.
const { lanzar, path, SUITE } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const cmd = async l => { for (const c of l) { await p.fill('#cmd', c); await p.press('#cmd', 'Enter'); await p.waitForTimeout(120); } };
  await cmd(['G0 X0 Y0', 'G1 X50 Y0', 'G3 X50 Y40 I0 J20', 'G1 X0 Y40', 'G1 X0 Y0']);
  await p.evaluate(() => { setHerramienta('editar'); encuadrar(); }); await p.waitForTimeout(300);
  const arco = () => p.evaluate(() => { const c = contornos[0], t = tramos(c)[1], a = arcoDeBulge(t.p1, t.p2, t.b); return { c: [+a.c.x.toFixed(3), +a.c.y.toFixed(3)], r: +a.r.toFixed(3), p2: [+t.p2.x.toFixed(3), +t.p2.y.toFixed(3)], n: c.pts.length }; });
  const dbl = async (x, y) => { const s = await p.evaluate(([x, y]) => { const r = cv.getBoundingClientRect(), q = aPantalla({ x, y }); return { x: r.left + q.x, y: r.top + q.y }; }, [x, y]); await p.mouse.dblclick(s.x, s.y); await p.waitForTimeout(250); };
  const escribir = async (a, b2) => { await p.fill('#ccA', String(a)); await p.fill('#ccB', String(b2)); await p.waitForTimeout(150); };
  // 1) se mantienen los extremos
  await dbl(50, 20);
  ok('doble clic en la cruz del centro: se abre la ventana con el centro actual', await p.evaluate(() => ctxPanel.classList.contains('visible') && !!document.getElementById('ccA')) && await p.inputValue('#ccA') === '50' && await p.inputValue('#ccB') === '20');
  await escribir(55, 23); const info1 = await p.textContent('#ccInfo');
  ok('vista previa: el centro se lleva a la mediatriz y se avisa, sin cambiar todavía el dibujo', /queda en X55 Y20/.test(info1) && (await arco()).r === 20, info1.slice(0, 90));
  await p.screenshot({ path: path.join(OUT, 'centro_previa.png') });
  await p.press('#ccA', 'Enter'); await p.waitForTimeout(200); let a = await arco();
  ok('Intro: el arco tiene ese centro y los extremos no se mueven', a.c[0] === 55 && a.c[1] === 20 && a.r === 20.616 && a.p2[0] === 50 && a.p2[1] === 40, JSON.stringify(a));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200); a = await arco();
  ok('se puede deshacer', a.c[0] === 50 && a.r === 20);
  // 2) se mueve el final, en I J
  await dbl(50, 20); await p.selectOption('#ccEnt', 'ij'); await p.selectOption('#ccModo', 'final');
  ok('en I J: el centro se escribe desde el inicio del arco', await p.inputValue('#ccA') === '0' && await p.inputValue('#ccB') === '20');
  await escribir(-2, 22); const info2 = await p.textContent('#ccInfo');
  await p.click('#ccOk'); await p.waitForTimeout(200); a = await arco();
  const d = await p.evaluate(() => { const c = contornos[0]; return [c.pts[2].y, c.pts[3].x, c.pts[3].y]; });
  ok('se mueve el final del arco: inicio y centro como se escriben, el final sobre la recta siguiente', a.c[0] === 48 && a.c[1] === 22 && a.p2[1] === 40 && Math.abs(a.p2[0] - 60.806) < 0.01 && d[0] === 40 && d[1] === 0 && d[2] === 40, JSON.stringify(a) + ' · ' + info2.slice(0, 70));
  // 3) Esc no cambia nada
  const antes = await arco(); await dbl(48, 22); await escribir(10, 10); await p.press('#ccA', 'Escape'); await p.waitForTimeout(150);
  ok('Esc cancela sin cambiar nada', JSON.stringify(await arco()) === JSON.stringify(antes) && await p.evaluate(() => !ctxPanel.classList.contains('visible') && centroEd === null));
  // 4) un centro imposible
  await dbl(48, 22); await p.selectOption('#ccModo', 'final'); await p.selectOption('#ccEnt', 'xy'); await escribir(49, 5);
  ok('si el arco no llega a la recta siguiente, se dice y no deja aplicar', /no llega a la recta siguiente/.test(await p.textContent('#ccInfo')) && await p.evaluate(() => document.getElementById('ccOk').disabled));
  await p.press('#ccA', 'Escape');
  // 5) un círculo se mueve entero
  await p.evaluate(() => { contornos.length = 0; }); await cmd([]); await p.evaluate(() => { setHerramienta('circulo'); });
  await p.evaluate(() => { clicCirculo({ x: 100, y: 100 }); clicCirculo({ x: 115, y: 100 }); setHerramienta('editar'); encuadrar(); }); await p.waitForTimeout(300);
  await dbl(100, 100); await escribir(120, 90); await p.press('#ccA', 'Enter'); await p.waitForTimeout(200);
  const cir = await p.evaluate(() => { const c = contornos[0], t = tramos(c)[0], a = arcoDeBulge(t.p1, t.p2, t.b); return [+a.c.x.toFixed(3), +a.c.y.toFixed(3), +a.r.toFixed(3)]; });
  ok('un círculo se mueve entero, con el mismo radio', cir[0] === 120 && cir[1] === 90 && cir[2] === 15, JSON.stringify(cir));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
