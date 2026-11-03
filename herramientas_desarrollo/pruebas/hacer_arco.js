// Calcador v105: «◠ Hacer arco» con los puntos elegidos: tangente a los tramos de al lado (R15 de una esquina vectorizada), por los puntos con R escrito, una esquina viva no es un arco.
const { lanzar, path, SUITE } = require('./comun');
(async () => { const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500);
  let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  // como una silueta vectorizada: una esquina R15 hecha de tramos rectos (con un poco de ruido), y rectas a los lados
  const crear = () => p.evaluate(() => { const pts = [{ x:0, y:0 }, { x:60, y:0 }, { x:60, y:40 }];
    for (let k = 1; k < 8; k++) { const a = k / 8 * Math.PI / 2, r = 15 + (k % 2 ? 0.06 : -0.05); pts.push({ x: 45 + r * Math.cos(a), y: 40 + r * Math.sin(a) }); }
    pts.push({ x:45, y:55 }, { x:0, y:55 });
    contornos.length = 0; contornos.push({ pts, b: pts.map(() => 0), cerrado: true }); if (typeof memoTipos !== 'undefined') memoTipos = null; refrescar(); encuadrar(); setHerramienta('puntos'); });
  const elegir = l => p.evaluate(l => { selPuntos.clear(); l.forEach(i => selPuntos.add('0:' + i)); actualizarEstado(); render(); }, l);
  await crear(); await elegir([2, 3, 4, 5, 6, 7, 8, 9, 10]); await p.waitForTimeout(150);
  ok('con 9 puntos seguidos aparece «◠ Hacer arco (A)» y la pista lo dice', await p.evaluate(() => getComputedStyle(document.getElementById('btnHacerArco')).display !== 'none') && /A: hacer un arco/.test(await p.textContent('#stHint')));
  await p.click('#btnHacerArco'); await p.waitForTimeout(200);
  let info = await p.textContent('#haInfo');
  ok('tangente: R15 con centro en X45 Y40', /^R15(\.0+)?[^.\d]/.test(info.replace(/\s/g, ' ')) || /R1[45]\.9|R15/.test(info), info.slice(0, 90));
  await p.screenshot({ path: '/tmp/claude-0/inf/ui/arco1.png' });
  await p.press('#haModo', 'Enter'); await p.waitForTimeout(200);
  let r = await p.evaluate(() => { const c = contornos[0], t = tramos(c).find(t => t.b), a = arcoDeBulge(t.p1, t.p2, t.b); return { n: c.pts.length, R: +a.r.toFixed(3), c: [+a.c.x.toFixed(2), +a.c.y.toFixed(2)], p1: [+t.p1.x.toFixed(2), +t.p1.y.toFixed(2)], p2: [+t.p2.x.toFixed(2), +t.p2.y.toFixed(2)], tang: (() => { const ts = tramos(c), k = ts.findIndex(x => x.i === t.i), pr = ts[(k - 1 + ts.length) % ts.length], nx = ts[(k + 1) % ts.length]; return [Math.abs(dot(norm(sub(t.p1, a.c)), norm(sub(pr.p2, pr.p1)))), Math.abs(dot(norm(sub(t.p2, a.c)), norm(sub(nx.p2, nx.p1))))].map(v => +v.toFixed(5)); })() }; });
  ok('Intro: 5 puntos, un arco R≈15 centrado en (45,40) y tangente a las dos rectas', r.n === 5 && Math.abs(r.R - 15) < 0.15 && Math.abs(r.c[0] - 45) < 0.15 && Math.abs(r.c[1] - 40) < 0.15 && r.tang[0] < 1e-4 && r.tang[1] < 1e-4, JSON.stringify(r));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150); ok('se puede deshacer', await p.evaluate(() => contornos[0].pts.length === 12));
  // redondeado y escrito, por los puntos
  await elegir([3, 4, 5, 6, 7, 8, 9]); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press('a'); await p.waitForTimeout(150);
  await p.selectOption('#haModo', 'puntos'); await p.selectOption('#haRadio', 'escrito'); await p.fill('#haR', '15'); await p.waitForTimeout(150);
  info = await p.textContent('#haInfo');
  await p.click('#haOk'); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const c = contornos[0], t = tramos(c).find(t => t.b), a = arcoDeBulge(t.p1, t.p2, t.b); return { n: c.pts.length, R: +a.r.toFixed(3) }; });
  ok('por los puntos, con R15 escrito (tecla A)', r.n === 7 && r.R === 15, JSON.stringify(r) + ' · ' + info.slice(0, 60));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(100);
  // una esquina no es un arco
  await elegir([0, 1, 2]); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press('a'); await p.waitForTimeout(150);
  await p.selectOption('#haModo', 'puntos'); await p.selectOption('#haRadio', 'calc'); await p.waitForTimeout(100); info = await p.textContent('#haInfo');
  ok('una esquina viva: «no forman un arco» y no deja aplicar', /no forman un arco/.test(info) && await p.evaluate(() => document.getElementById('haOk').disabled), info.slice(0, 80));
  await p.press('#haModo', 'Escape'); await p.waitForTimeout(100);
  ok('Esc cierra sin cambiar nada', await p.evaluate(() => contornos[0].pts.length === 12 && !arcoEd));
  // puntos no seguidos
  await elegir([3, 5, 7]); ok('si no van seguidos, no hay botón', await p.evaluate(() => getComputedStyle(document.getElementById('btnHacerArco')).display === 'none'));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); })();
