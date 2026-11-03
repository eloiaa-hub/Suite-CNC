// Anidador: cantos (CSV, lista, dibujo, guardar y reabrir) y resumen de material, tiempo y coste.
// Uso: node cantos_coste.js [carpeta de capturas]
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.argv[2] || require('os').tmpdir();
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cantos-'));
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 950 }, acceptDownloads: true }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'anidador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const cerca = (a, b, t = 1e-6) => Math.abs(a - b) <= t;
  await p.evaluate(() => { ['tL', 'tA', 'tG', 'tP', 'tM', 'hD', 'hH'].forEach((id, i) => document.getElementById(id).value = [2440, 1220, 16, 0.5, 10, 6, 4][i]); document.getElementById('hSel').value = ''; todo(); });

  // 1) CSV con títulos en otro orden, cantos por número y por letras, dos tipos de canto
  const csv = path.join(TMP, 'despiece.csv');
  fs.writeFileSync(csv, '﻿Pieza;Cantidad;Largo;Ancho;Veta;Canto largo;Canto ancho;Tipo de canto\nCostado;2;720;400;sí;1;0;PVC 2 mm\nTapa;1;800;420;sí;2;2;PVC 2 mm\nBalda;3;560;380;sí;L1 A1 A2;;ABS 0,4 mm\nTrasera;1;720;560;no;0;0;\nFrente;2;500;150;sí;todos;;PVC 2 mm\n');
  await p.setInputFiles('#archivo', csv); await p.waitForTimeout(400);
  const lista = await p.evaluate(() => piezas.map(q => ({ n: q.nombre, L: q.L, A: q.A, cant: q.cant, c: Object.keys(q.cantos || {}).sort().join(''), t: q.tipoCanto ? tipoCantoDe(q).nombre : '' })));
  const esp = { Costado: [720, 400, 2, 'L1', 'PVC 2 mm'], Tapa: [800, 420, 1, 'A1A2L1L2', 'PVC 2 mm'], Balda: [560, 380, 3, 'A1A2L1', 'ABS 0,4 mm'], Trasera: [720, 560, 1, '', ''], Frente: [500, 150, 2, 'A1A2L1L2', 'PVC 2 mm'] };
  ok('CSV: columnas por su título, cantos (0/1/2, «L1 A1 A2», «todos») y tipos de canto', lista.length === 5 && lista.every(x => { const e = esp[x.n]; return e && x.L === e[0] && x.A === e[1] && x.cant === e[2] && x.c === e[3] && x.t === e[4]; }), JSON.stringify(lista));
  ok('CSV: dos tipos de canto en el panel de coste', await p.evaluate(() => costes.tipos.map(t => t.nombre).join('|')) === 'PVC 2 mm|ABS 0,4 mm');

  // 2) metros de canto: a mano
  const exceso = 20, esperado = { 'PVC 2 mm': 2 * (720 + exceso) + 1 * (2 * 800 + 2 * 420 + 4 * exceso) + 2 * (2 * 500 + 2 * 150 + 4 * exceso), 'ABS 0,4 mm': 3 * (560 + 2 * 380 + 3 * exceso) };
  let r = await p.evaluate(() => { const r = resumenCoste(); return { nT: r.nT, cantos: r.cantos.map(x => [x.t.nombre, x.m]), area: r.area, areaT: r.areaT, min: r.minutos, rec: r.recorrido, ent: r.entradas, total: r.total }; });
  ok('metros de canto por tipo (con 20 mm de exceso por tramo)', r.cantos.length === 2 && r.cantos.every(([n, m]) => cerca(m, esperado[n] / 1000, 1e-9)), JSON.stringify(r.cantos) + ' esperado ' + JSON.stringify(esperado));
  const areaEsp = 2 * 720 * 400 + 800 * 420 + 3 * 560 * 380 + 720 * 560 + 2 * 500 * 150;
  ok('superficie de las piezas y desperdicio', cerca(r.area, areaEsp, 1e-6) && r.nT === 1, `${r.area} / ${areaEsp} · ${r.nT} tablero(s)`);
  // tiempo: 9 piezas, perímetro × pasadas (16,5 mm a 6 mm por pasada = 3) / 1000 + 4 s por pasada
  const perim = 2 * 2 * (720 + 400) + 2 * (800 + 420) + 3 * 2 * (560 + 380) + 2 * (720 + 560) + 2 * 2 * (500 + 150);
  ok('tiempo de máquina: recorrido × pasadas al avance, más 4 s por pasada', cerca(r.rec, perim * 3, 1e-6) && r.ent === 9 * 3 && cerca(r.min, perim * 3 / 1000 + 27 * 4 / 60, 1e-9), `${r.rec} mm · ${r.ent} pasadas · ${r.min.toFixed(2)} min`);
  ok('sin precios no hay total', r.total === null);
  // precios
  await p.fill('#cTablero', '42,50'); await p.fill('#cMaquina', '30');
  await p.fill('#tiposCanto tr[data-i="0"] input[data-k="precio"]', '0,80'); await p.fill('#tiposCanto tr[data-i="1"] input[data-k="precio"]', '0.35');
  r = await p.evaluate(() => { const r = resumenCoste(); return { total: r.total, min: r.minutos, cantos: r.cantos.map(x => x.m * x.precio) }; });
  const totEsp = 42.5 + esperado['PVC 2 mm'] / 1000 * 0.8 + esperado['ABS 0,4 mm'] / 1000 * 0.35 + r.min / 60 * 30;
  ok('coste total = tableros + cantos + máquina', cerca(r.total, totEsp, 1e-9), `${r.total.toFixed(2)} € (esperado ${totEsp.toFixed(2)})`);
  ok('el foco se queda en el precio mientras se escribe', await p.evaluate(() => document.activeElement && document.activeElement.dataset.k === 'precio'));
  ok('resumen pintado', /Total aproximado/.test(await p.textContent('#resumen')) && /PVC 2 mm/.test(await p.textContent('#resumen')));

  // carga por tablero: se suma al tiempo
  await p.fill('#cCarga', '5'); const t5 = await p.evaluate(() => resumenCoste().minutos); await p.fill('#cCarga', '');
  ok('carga y descarga: 5 min más por tablero', Math.abs(t5 - r.min - 5) < 1e-9, `${t5.toFixed(2)} / ${r.min.toFixed(2)}`);
  // 3) clic en la lista: quitar y poner cantos
  const antes = await p.evaluate(() => Object.keys(piezas.find(q => q.nombre === 'Trasera').cantos || {}).length);
  await p.click('#lista tr:nth-child(4) [data-canto="A2"] .toque', { force: true });
  await p.click('#lista tr:nth-child(4) [data-canto="L2"] .toque', { force: true });
  const desp = await p.evaluate(() => Object.keys(piezas.find(q => q.nombre === 'Trasera').cantos || {}).sort().join(''));
  ok('clic en los lados del dibujo de la lista pone cantos', antes === 0 && desp === 'A2L2', desp);
  ok('con dos tipos, la pieza con canto elige el suyo en la lista', await p.evaluate(() => !!document.querySelector('#lista tr:nth-child(4) select.tcanto')));

  // 4) dibujo: lados con canto según el giro
  const lados = await p.evaluate(() => {
    const out = {}; resultado.tableros[0].col.filter(c => c.p.nombre === 'Costado' || c.p.nombre === 'Trasera').forEach(c => {
      const L = lineasCanto(c, contornosColocados(c, ''), [], []);
      out[c.p.nombre + '@' + c.g + '/' + c.k] = L.map(([a, b2]) => Math.abs(a.y - b2.y) < 1e-9 ? (Math.abs(a.y - c.y) < Math.abs(a.y - (c.y + c.h)) ? 'abajo' : 'arriba') : (Math.abs(a.x - c.x) < Math.abs(a.x - (c.x + c.w)) ? 'izquierda' : 'derecha')).sort().join(','); });
    return out; });
  const okDib = Object.entries(lados).every(([k, v]) => { const g = +k.split('@')[1].split('/')[0];
    if (k.startsWith('Costado')) return v === ['abajo', 'derecha', 'arriba', 'izquierda'][g / 90];
    return v === [['arriba', 'derecha'], ['arriba', 'izquierda'], ['abajo', 'izquierda'], ['abajo', 'derecha']][g / 90].sort().join(','); });
  ok('en el tablero, los lados con canto siguen a la pieza girada', okDib && Object.keys(lados).length === 3, JSON.stringify(lados));
  ok('líneas de canto en la vista', await p.evaluate(() => document.querySelectorAll('#vista polyline').length) >= 9);
  await p.evaluate(() => { const c = resultado.tableros[0].col.find(c => c.p.nombre === 'Costado'); c.p.giro = 90; todo(); });
  const giro = await p.evaluate(() => { const c = resultado.tableros[0].col.find(c => c.p.nombre === 'Costado'); const [a, b2] = lineasCanto(c, [], [], [])[0]; return { g: c.g, vertical: Math.abs(a.x - b2.x) < 1e-9, derecha: Math.abs(a.x - (c.x + c.w)) < Math.abs(a.x - c.x) }; });
  ok('girada 90°: el canto del largo de abajo pasa a la derecha', giro.g === 90 && giro.vertical && giro.derecha, JSON.stringify(giro));
  await p.evaluate(() => { piezas.find(q => q.nombre === 'Costado').giro = null; todo(); });
  ok('SVG exportado con los cantos', (await p.evaluate(() => svgTablero(0))).split('class="canto"').length - 1 >= 9);

  // 5) piezas del Calcador: canto en el contorno exterior
  const ej = ejercicios().find(f => /Ejercicio 12/.test(f)) || ejercicios()[0];
  await p.setInputFiles('#archivo', ej); await p.waitForTimeout(400);
  const j = await p.evaluate(() => { const q = piezas[piezas.length - 1]; const m0 = medidasPieza(q, resultado.T).canto; q.cantoPerim = true; const m1 = medidasPieza(q, resultado.T);
    const g = geomPieza(q, 0), ext = g.contornos.filter((k, i) => clasesDe(g.contornos, g.contornos.map(poliContorno))[i] === 'exterior' && k.cerrado);
    const perimMuestreo = ext.reduce((a, k) => { const pol = poliContorno(k); let L = 0; for (let i = 1; i < pol.length; i++) L += Math.hypot(pol[i].x - pol[i - 1].x, pol[i].y - pol[i - 1].y); return a + L; }, 0);
    return { m0, m1: m1.canto, ext: ext.length, perim: perimMuestreo, area: m1.area, bb: g.w * g.h, nombre: q.nombre }; });
  ok(`pieza del Calcador (${path.basename(ej)}): canto = contorno exterior con sus arcos (+ exceso)`, j.m0 === 0 && j.ext >= 1 && Math.abs(j.m1 - j.ext * 20 - j.perim) / j.perim < 0.002, JSON.stringify(j));
  ok('pieza del Calcador: superficie real (sin agujeros) menor que su caja', j.area > 0 && j.area <= j.bb + 1e-6);
  await p.evaluate(() => { pintarLista(); pintarVista(); });

  // 6) guardar el tablero y reabrirlo: los cantos y sus tipos vuelven
  const proyecto = await p.evaluate(() => JSON.stringify(proyectoTablero(0)));
  const fj = path.join(TMP, 'tablero.json'); fs.writeFileSync(fj, proyecto);
  await p.evaluate(() => { piezas = []; costes.tipos = [{ id: 'c1', nombre: 'Canto', precio: '' }]; todo(); });
  await p.setInputFiles('#archivo', fj); await p.waitForTimeout(500);
  const re = await p.evaluate(() => piezas.map(q => `${q.nombre}:${Object.keys(q.cantos || {}).sort().join('')}${q.cantoPerim ? '+contorno' : ''}:${nCantos(q) ? tipoCantoDe(q).nombre : ''}`).sort());
  ok('reabrir el tablero: cada pieza con sus cantos y su tipo', re.includes('Costado:L1:PVC 2 mm') && re.includes('Balda:A1A2L1:ABS 0,4 mm') && re.includes('Trasera:A2L2:PVC 2 mm') && re.some(x => /\+contorno:/.test(x)), JSON.stringify(re));

  // 7) CSV de la lista y del despiece con coste; plantilla
  const [d1] = await Promise.all([p.waitForEvent('download'), p.click('#btnCSV')]); const lcsv = fs.readFileSync(await d1.path(), 'utf8');
  ok('⬇ Lista (CSV) con las columnas de cantos', /canto largo;canto ancho;tipo de canto/.test(lcsv) && /Balda;560;380;3;sí;1;2;ABS 0,4 mm/.test(lcsv), lcsv.split('\n').slice(0, 3).join(' | '));
  // la lista exportada se vuelve a leer igual
  await p.evaluate(() => { piezas = []; todo(); }); const f2 = path.join(TMP, 'lista.csv'); fs.writeFileSync(f2, lcsv); await p.setInputFiles('#archivo', f2); await p.waitForTimeout(300);
  const ida = await p.evaluate(() => piezas.map(q => `${q.nombre}:${(q.cantos && q.cantos.L1 ? 1 : 0) + (q.cantos && q.cantos.L2 ? 1 : 0)}${(q.cantos && q.cantos.A1 ? 1 : 0) + (q.cantos && q.cantos.A2 ? 1 : 0)}`).join(' '));
  ok('la lista exportada se vuelve a abrir con los mismos cantos (por lados)', /Balda:12/.test(ida) && /Costado:10/.test(ida) && /Tapa:22/.test(ida), ida);
  const [d2] = await Promise.all([p.waitForEvent('download'), p.click('#btnCoste')]); const ccsv = fs.readFileSync(await d2.path(), 'utf8');
  ok('⬇ Despiece y coste (CSV)', /Canto total \(m\)/.test(ccsv) && /Total aproximado/.test(ccsv) && /Tiempo de máquina/.test(ccsv), d2.suggestedFilename());
  const [d3] = await Promise.all([p.waitForEvent('download'), p.click('#btnPlantilla')]); const pl = fs.readFileSync(await d3.path(), 'utf8');
  ok('plantilla CSV con cantos', /canto largo;canto ancho;tipo de canto/.test(pl));

  // 8) el estado (precios y tipos) se recuerda
  await p.fill('#tiposCanto tr[data-i="0"] input[data-k="precio"]', '0,80'); await p.waitForTimeout(100);
  await p.reload(); await p.waitForTimeout(400);
  const st = await p.evaluate(() => ({ t: document.getElementById('cTablero').value, m: document.getElementById('cMaquina').value, tipos: costes.tipos.map(t => t.nombre + '=' + t.precio).join('|') }));
  ok('al volver a abrir: precios y tipos de canto', st.t === '42,50' && st.m === '30' && /PVC 2 mm=0,80/.test(st.tipos), JSON.stringify(st));
  await p.screenshot({ path: path.join(OUT, 'anidador_cantos.png'), fullPage: true });
  // móvil: sin desplazamiento horizontal
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 800 }); await m.goto('file://' + path.join(SUITE, 'anidador.html')); await m.waitForTimeout(400);
  ok('móvil sin desplazamiento horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
  console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
