// Calcador v83: agrupar (Ctrl+G, Alt+clic, copias, JSON) y mover la selección con las flechas.
// Uso: node agrupar.js
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const ISO = JSON.parse(fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.json'), 'utf8'));
  await p.evaluate(d => { abrirJSONDatos(d); setHerramienta('editar'); encuadrar(); }, ISO); await p.waitForTimeout(300);
  // coordenadas de pantalla de un punto del dibujo (en mm)
  const pant = q => p.evaluate(q => { const r = cv.getBoundingClientRect(), s = aPantalla(q); return { x: r.left + s.x * r.width / cv.clientWidth, y: r.top + s.y * r.height / cv.clientHeight }; }, q);
  const estado = () => p.evaluate(() => ({ sel: seleccionados().slice().sort(), grupos: contornos.map(c => c.grupo || null), p0: contornos.map(c => ({ x: +c.pts[0].x.toFixed(3), y: +c.pts[0].y.toFixed(3) })) }));
  const p0 = await estado();
  // agrupar con Ctrl+G
  await p.keyboard.press('Control+a'); await p.keyboard.press('Control+g'); await p.waitForTimeout(100);
  let e = await estado();
  ok('Ctrl+A y Ctrl+G: los dos contornos en un grupo', e.grupos[0] && e.grupos[0] === e.grupos[1], JSON.stringify(e.grupos));
  ok('el panel dice «Grupo» y ofrece desagrupar', await p.evaluate(() => /Grupo/.test(document.getElementById('propsContorno').textContent) && !!document.getElementById('pDesagrupar')));
  // clic en el borde del exterior (un punto de su primer tramo): se selecciona el grupo entero
  await p.keyboard.press('Escape'); e = await estado(); ok('Esc quita la selección', !e.sel.length);
  const enBorde = await p.evaluate(() => { const c = contornos[0]; const t = tramos(c)[0]; return { x: t.p1.x + (t.p2.x - t.p1.x) / 3, y: t.p1.y + (t.p2.y - t.p1.y) / 3 }; });
  const enHueco = await p.evaluate(() => { const c = contornos[1]; return muestrearContorno(c)[3]; });
  let q = await pant(enBorde); await p.mouse.click(q.x, q.y); await p.waitForTimeout(100);
  e = await estado(); ok('clic en un contorno del grupo: se selecciona el grupo entero', e.sel.join() === '0,1', e.sel.join());
  ok('se ve el marco del grupo', await p.evaluate(() => gruposDe(seleccionados()).length === 1));
  // Alt + clic: solo ese
  q = await pant(enHueco); await p.keyboard.down('Alt'); await p.mouse.click(q.x, q.y); await p.keyboard.up('Alt'); await p.waitForTimeout(100);
  e = await estado(); ok('Alt + clic: un solo contorno del grupo', e.sel.join() === '1', e.sel.join());
  // flechas
  q = await pant(enBorde); await p.mouse.click(q.x, q.y); await p.waitForTimeout(100);
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowUp'); await p.keyboard.press('Control+ArrowLeft');
  e = await estado();
  const dx = e.p0.map((v, i) => +(v.x - p0.p0[i].x).toFixed(3)), dy = e.p0.map((v, i) => +(v.y - p0.p0[i].y).toFixed(3));
  ok('flechas: 1 mm, Mayús 10 mm, Ctrl 0,1 mm, todo el grupo junto', dx.every(v => v === 1.9) && dy.every(v => v === 10), `ΔX ${dx} ΔY ${dy}`);
  await p.keyboard.press('Control+z'); e = await estado();
  ok('Ctrl+Z deshace las pulsaciones seguidas de una vez', e.p0.every((v, i) => v.x === p0.p0[i].x && v.y === p0.p0[i].y), JSON.stringify(e.p0));
  // sin selección, las flechas recorren la pieza (no mueven nada)
  await p.keyboard.press('Escape'); await p.keyboard.press('ArrowRight'); e = await estado();
  ok('sin selección, las flechas no mueven nada (recorren la pieza)', e.p0.every((v, i) => v.x === p0.p0[i].x && v.y === p0.p0[i].y));
  // arrastrar el grupo con el ratón
  q = await pant(enBorde); await p.mouse.click(q.x, q.y); await p.waitForTimeout(50);
  const q2 = await pant({ x: enBorde.x + 20, y: enBorde.y + 20 });
  await p.mouse.move(q.x, q.y); await p.mouse.down(); await p.mouse.move(q2.x, q2.y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
  e = await estado();
  const mv = e.p0.map((v, i) => [v.x - p0.p0[i].x, v.y - p0.p0[i].y]);
  ok('arrastrar un contorno del grupo mueve el grupo entero', Math.abs(mv[0][0] - mv[1][0]) < 1e-6 && Math.abs(mv[0][1] - mv[1][1]) < 1e-6 && Math.hypot(...mv[0]) > 5, JSON.stringify(mv));
  await p.keyboard.press('Control+z');
  // copiar y pegar: un grupo nuevo
  q = await pant(enBorde); await p.mouse.click(q.x, q.y); await p.keyboard.press('Control+c'); await p.keyboard.press('Control+Shift+v'); await p.waitForTimeout(100);
  e = await estado();
  ok('pegar: la copia es un grupo nuevo (y la selección es la copia)', e.grupos.length === 4 && e.grupos[2] === e.grupos[3] && e.grupos[2] !== e.grupos[0] && e.sel.join() === '2,3', JSON.stringify(e.grupos));
  // matriz rectangular con copias: cada copia, su grupo
  await p.evaluate(() => { seleccionarUno(0); cfgTr.cols = 3; cfgTr.filas = 1; cfgTr.sx = 200; cfgTr.sy = 0; trRect(); });
  e = await estado();
  const gsCopias = new Set(e.grupos.slice(4)); ok('matriz: cada copia del grupo es un grupo propio', e.grupos.length === 8 && gsCopias.size === 2 && !gsCopias.has(e.grupos[0]), JSON.stringify(e.grupos));
  // guardar y reabrir
  const j = await p.evaluate(() => exportarJSON(true));
  await p.evaluate(d => { abrirJSONDatos(d); }, j);
  e = await estado(); ok('el JSON guarda los grupos', e.grupos.filter(Boolean).length === 8 && new Set(e.grupos).size === 4, JSON.stringify(e.grupos));
  // desagrupar
  await p.evaluate(() => { seleccionarUno(0); }); await p.keyboard.press('Control+Shift+g'); e = await estado();
  ok('Ctrl+Mayús+G desagrupa', !e.grupos[0] && !e.grupos[1] && e.grupos[2]);
  await p.evaluate(() => { seleccionarUno(0); }); e = await estado(); ok('y vuelve a seleccionarse por separado', e.sel.join() === '0');
  // un tablero del Anidador: cada pieza de varios contornos llega agrupada
  const an = await ctx.newPage(); an.on('pageerror', e2 => errs.push('anidador: ' + e2.message)); await an.goto('file://' + path.join(SUITE, 'anidador.html')); await an.evaluate(() => localStorage.clear()); await an.reload(); await an.waitForTimeout(300);
  const fj = path.join(require('os').tmpdir(), 'iso13_' + Date.now() + '.json'); fs.writeFileSync(fj, JSON.stringify(ISO));
  await an.setInputFiles('#archivo', fj); await an.waitForTimeout(300); await an.evaluate(() => { piezas[0].cant = 3; todo(); });
  const tab = await an.evaluate(() => proyectoTablero(0));
  const r = await p.evaluate(d => { abrirJSONDatos(d); seleccionarUno(0); return { n: contornos.length, grupos: new Set(contornos.map(c => c.grupo)).size, sel: seleccionados().length }; }, tab);
  ok('tablero del Anidador en el Calcador: cada pieza, un grupo (un clic la selecciona entera)', r.n === 6 && r.grupos === 3 && r.sel === 2, JSON.stringify(r));
  // el Corrector (visor) sigue sin errores y las flechas no mueven nada
  const co = await ctx.newPage(); co.on('pageerror', e2 => errs.push('corrector: ' + e2.message)); await co.goto('file://' + path.join(SUITE, 'corrector.html')); await co.waitForTimeout(600);
  await co.evaluate(d => abrirJSONDatos(d), j); await co.keyboard.press('ArrowRight');
  ok('Corrector: abre el ejercicio con grupos y las flechas no mueven nada', await co.evaluate(x => JSON.stringify(contornos[0].pts[0]) === JSON.stringify(x), (await p.evaluate(() => null)) || j.calcador.contornos[0].pts[0]));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
