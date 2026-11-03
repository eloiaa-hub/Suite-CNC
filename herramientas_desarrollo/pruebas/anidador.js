// Anidador de tableros: colocación correcta (sin solapes, dentro del margen, veta), varios tableros,
// CSV con coma decimal, piezas del Calcador, y el proyecto resultante abierto en el Calcador y mecanizado.
// Uso: node anidador.js [carpeta de capturas]
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.argv[2] || require('os').tmpdir();
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anid-'));
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 950 }, acceptDownloads: true }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('anid: ' + e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'anidador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  // comprobación geométrica de todos los tableros
  const revisar = () => p.evaluate(() => {
    const R = resultado, T = R.T, malos = [];
    R.tableros.forEach((t, i) => t.col.forEach((a, ia) => {
      if (a.x < T.M - 1e-6 || a.y < T.M - 1e-6 || a.x + a.w > T.L - T.M + 1e-6 || a.y + a.h > T.A - T.M + 1e-6) malos.push(`T${i + 1} ${a.p.nombre} fuera del margen`);
      if (T.veta && a.p.veta && a.rot) malos.push(`T${i + 1} ${a.p.nombre} girada con veta`);
      t.col.forEach((b2, ib) => { if (ib <= ia) return;
        const sx = Math.max(a.x, b2.x) - Math.min(a.x + a.w, b2.x + b2.w), sy = Math.max(a.y, b2.y) - Math.min(a.y + a.h, b2.y + b2.h);
        if (Math.max(sx, sy) < T.sep - 1e-6) malos.push(`T${i + 1} ${a.p.nombre} y ${b2.p.nombre} a ${Math.max(sx, sy).toFixed(2)} mm (< ${T.sep})`); });
      // los contornos reales, dentro de su caja
      contornosColocados(a, '').forEach(k => poliContorno(k).forEach(q => { if (q.x < a.x - 1e-3 || q.x > a.x + a.w + 1e-3 || q.y < a.y - 1e-3 || q.y > a.y + a.h + 1e-3) malos.push(`T${i + 1} ${a.p.nombre}: contorno fuera de su caja`); }));
    }));
    return { malos: [...new Set(malos)], tableros: R.tableros.length, piezas: R.tableros.reduce((s, t) => s + t.col.length, 0), fuera: R.nFuera, items: R.nItems };
  });
  const pon = vals => p.evaluate(vals => { Object.entries(vals).forEach(([id, v]) => { const e = document.getElementById(id); if (e.type === 'checkbox') e.checked = v; else e.value = v; }); todo(); }, vals);

  // 1) despiece CSV con coma decimal, títulos y veta
  const csv = path.join(TMP, 'despiece.csv');
  fs.writeFileSync(csv, '﻿nombre;largo;ancho;cantidad;veta\nCostado;720;400;2;sí\nBalda;560,5;380;3;si\nTrasera;720;560;1;no\nZócalo;560;80;2;x\nmala;;;1;\n');
  await pon({ tL: '2440', tA: '1220', tM: '10', hD: '6', hH: '4', tVeta: true });
  await p.setInputFiles('#archivo', csv); await p.waitForFunction(() => piezas.length === 4, null, { timeout: 10000 });
  let r = await revisar();
  ok('CSV: 5 tipos leídos (la línea mala se salta), 8 piezas en 1 tablero', r.items === 8 && r.tableros === 1 && !r.malos.length, JSON.stringify(r));
  ok('CSV: coma decimal (560,5)', await p.evaluate(() => piezas.some(q => q.L === 560.5)));
  // 2) tablero pequeño: varios tableros, y una pieza que no cabe
  await pon({ tL: '1000', tA: '600' });
  r = await revisar();
  ok('tablero 1000×600: varios tableros, la trasera (720×560 + veta no) cabe girada o no, sin solapes', r.tableros >= 3 && !r.malos.length, JSON.stringify(r));
  await p.evaluate(() => { piezas.push({ id: 'grande', nombre: 'Enorme', tipo: 'rect', L: 1200, A: 300, cant: 1, veta: true }); todo(); });
  r = await revisar();
  ok('pieza de 1200 en un tablero de 1000 con veta: no cabe y se avisa', r.fuera === 1 && /no caben/.test(await p.$eval('#avisos', e => e.innerText)), JSON.stringify(r));
  await p.evaluate(() => { piezas.find(q => q.id === 'grande').veta = false; piezas.find(q => q.id === 'grande').L = 590; todo(); });
  r = await revisar(); ok('pieza 590×300 sin veta en 1000×600: cabe', r.fuera === 0 && !r.malos.length, JSON.stringify(r));
  // 3) piezas del Calcador (ejercicios reales)
  await p.evaluate(() => { piezas = []; todo(); });
  const jsons = ejercicios().filter(f => /Ejercicio (05|12|25|30)\.json$|avanzado 03|Prueba/.test(f)).slice(0, 5);
  jsons.push('/root/.claude/uploads/09141c50-cc8e-5b95-8b72-8e456217cfb3/954221a0-Prueba01.json');
  await pon({ tL: '1220', tA: '610' });
  await p.setInputFiles('#archivo', jsons.filter(f => fs.existsSync(f)));
  await p.waitForFunction(n => piezas.length === n, jsons.filter(f => fs.existsSync(f)).length, { timeout: 10000 });
  await p.evaluate(() => { piezas.forEach((q, i) => q.cant = i % 2 ? 2 : 1); todo(); });
  r = await revisar();
  ok(`piezas del Calcador (${jsons.length} archivos): sin solapes y dentro`, !r.malos.length && r.piezas > 0, JSON.stringify(r));
  // mezcla con rectángulos y giro sin veta
  await p.evaluate(() => { piezas.push({ id: 'r1', nombre: 'Tapa ñandú', tipo: 'rect', L: 300, A: 150, cant: 4, veta: false }); todo(); });
  r = await revisar(); ok('mezcla de piezas del Calcador y rectángulos', !r.malos.length, JSON.stringify(r));
  await p.screenshot({ path: path.join(OUT, 'anid_tablero.png') });
  // 4) proyecto del tablero → Calcador
  const proyecto = await p.evaluate(() => proyectoTablero(0));
  const nCont = proyecto.calcador.contornos.length;
  const cal = await ctx.newPage(); cal.on('pageerror', e => errs.push('cal: ' + e.message)); cal.on('dialog', d => d.accept());
  await cal.goto('file://' + path.join(SUITE, 'calcador.html')); await cal.waitForTimeout(700);
  const rc = await cal.evaluate(d => { abrirJSONDatos(d); abrirMec(); generarMec(); const nc = document.getElementById('mecTexto').value;
    const uids = new Set(contornos.map(c => c.uid));
    return { cont: contornos.length, uidsUnicos: uids.size === contornos.length, nc: nc.split('\n').length, error: /error/i.test(document.getElementById('mecResumen').innerText) ? document.getElementById('mecResumen').innerText.slice(0, 200) : '',
             prof: cfgMec.prof, T: cfgMec.T, nombre: document.getElementById('projectName').value, cortes: (nc.match(/══════ Trazado/g) || []).length }; }, proyecto);
  ok(`el Calcador abre el tablero (${nCont} contornos) y ⚙️ Mecanizar genera el programa`, rc.cont === nCont && rc.uidsUnicos && rc.nc > 50 && !rc.error && rc.cortes > 0, JSON.stringify(rc));
  ok('profundidad = grosor + pasante (16,5) y la fresa de la base', rc.prof === 16.5 && rc.T === 101, JSON.stringify({ prof: rc.prof, T: rc.T }));
  await cal.waitForTimeout(400); await cal.screenshot({ path: path.join(OUT, 'anid_calcador.png') });
  await cal.evaluate(() => cerrarMec());
  // 5) ➜ Abrir en el Calcador (pestaña nueva), en un navegador limpio (sin nada guardado del Calcador):
  //    a) con el almacén compartido entre archivos (Chrome, Edge); b) sin él (Firefox con file://): por mensaje
  const estado = await p.evaluate(() => JSON.stringify(piezas));
  for (const aislado of [false, true]) {
    const c2 = await b.newContext({ viewport: { width: 1400, height: 950 } });
    if (aislado) await c2.addInitScript(() => { if (/calcador\.html$/.test(location.pathname)) { const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return k === 'suiteCNC:paraCalcador' ? null : g.call(this, k); }; } });
    const a2 = await c2.newPage(); a2.on('pageerror', e => errs.push('anid2: ' + e.message));
    await a2.goto('file://' + path.join(SUITE, 'anidador.html')); await a2.waitForTimeout(300);
    await a2.evaluate(e => { piezas = JSON.parse(e); $('tL').value = 1220; $('tA').value = 610; todo(); }, estado);
    const nEsperado = await a2.evaluate(() => proyectoTablero(0).calcador.contornos.length);
    const [nueva] = await Promise.all([c2.waitForEvent('page'), a2.click('#btnCalcador')]);
    nueva.on('pageerror', e => errs.push('cal2: ' + e.message)); nueva.on('dialog', d => d.accept());
    await nueva.waitForFunction(n => typeof contornos !== 'undefined' && contornos.length === n, nEsperado, { timeout: 8000 }).catch(() => {});
    const rn = await nueva.evaluate(() => ({ cont: contornos.length }));
    ok(`«➜ Abrir en el Calcador» en un navegador limpio${aislado ? ', sin almacén compartido (como Firefox): por mensaje' : ''}`, rn.cont === nEsperado && nEsperado > 0, JSON.stringify({ ...rn, nEsperado }));
    if (!aislado) await nueva.screenshot({ path: path.join(OUT, 'anid_calcador2.png') });
    await c2.close();
  }
  // 6) cero pieza en otra esquina: las coordenadas cambian de signo
  await pon({ tCero: 'sd' });
  const ys = await p.evaluate(() => { const d = proyectoTablero(0); const xs = d.calcador.contornos.flatMap(c => c.pts.map(q => q.x)), ys = d.calcador.contornos.flatMap(c => c.pts.map(q => q.y)); return { maxX: Math.max(...xs), maxY: Math.max(...ys) }; });
  ok('cero en la esquina superior derecha: todo en X ≤ 0 e Y ≤ 0', ys.maxX <= 1e-6 && ys.maxY <= 1e-6, JSON.stringify(ys));
  await pon({ tCero: 'ii' });
  // 7) guardado al recargar y descarga
  await p.reload(); await p.waitForTimeout(400);
  r = await revisar(); ok('recuerda las piezas al recargar', r.piezas > 0 && !r.malos.length, JSON.stringify(r));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnJSON')]);
  const ruta = path.join(TMP, dl.suggestedFilename()); await dl.saveAs(ruta);
  ok('💾 Guardar tablero (.json)', JSON.parse(fs.readFileSync(ruta, 'utf8')).calcador.contornos.length === nCont, dl.suggestedFilename());
  // 8) colocar a mano con el ratón (sobre el rectángulo de la pieza)
  await p.evaluate(() => { tableroVisto = 0; sel = null; pintarVista(); });
  // punto de pantalla de unas coordenadas del tablero (mm)
  const scr = (x, y) => p.evaluate(([x, y]) => { const svg = document.getElementById('vista'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return { x: r.left + (vistaMap.ox + vistaMap.k * x) * r.width / vb.width, y: r.top + (vistaMap.oy - vistaMap.k * y) * r.height / vb.height }; }, [x, y]);
  const col = (id, k) => p.evaluate(([id, k]) => { for (let i = 0; i < resultado.tableros.length; i++) { const c = resultado.tableros[i].col.find(c => c.p.id === id && c.k === k); if (c) return { t: i, x: c.x, y: c.y, w: c.w, h: c.h, g: c.g, fija: c.fija }; } return null; }, [id, k]);
  const arrastrar = async (a, b) => { await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(b.x, b.y, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(60); };
  const pj = await p.evaluate(() => { const c = resultado.tableros[0].col.find(c => c.p.tipo === 'json'); return { id: c.p.id, k: c.k }; });
  let c0 = await col(pj.id, pj.k);
  // 8a) arrastrar: queda fijada donde se suelta (con el imán, a menos de 8 px) y las demás se recolocan sin solaparse
  const T0 = await p.evaluate(() => ({ L: resultado.T.L, A: resultado.T.A, M: resultado.T.M, k: vistaMap.k }));
  const destino = { x: Math.min(T0.L - T0.M - c0.w - 5, c0.x + 37), y: Math.min(T0.A - T0.M - c0.h - 5, c0.y + 23) };
  await arrastrar(await scr(c0.x + c0.w / 2, c0.y + c0.h / 2), await scr(destino.x + c0.w / 2, destino.y + c0.h / 2));
  let c1 = await col(pj.id, pj.k);
  ok('arrastrar una pieza: queda colocada a mano (📌) donde se suelta', c1.fija && c1.t === 0 && Math.abs(c1.x - destino.x) <= 8 / T0.k + 0.6 && Math.abs(c1.y - destino.y) <= 8 / T0.k + 0.6, JSON.stringify({ destino, c1 }));
  r = await revisar(); ok('las demás se colocan alrededor, sin solapes', !r.malos.length, JSON.stringify(r));
  ok('la chincheta y la marca en la lista', await p.$(`#vista .pz[data-pid="${pj.id}"] [data-pin]`) !== null && /📌 1/.test(await p.$eval(`#lista tr[data-id="${pj.id}"]`, e => e.innerText)));
  // 8b) soltarla encima de otra colocada a mano: no se deja
  const otra = await p.evaluate(id => { const c = resultado.tableros[0].col.find(c => c.p.id !== id); return { id: c.p.id, k: c.k }; }, pj.id);
  let o0 = await col(otra.id, otra.k);
  await arrastrar(await scr(o0.x + o0.w / 2, o0.y + o0.h / 2), await scr(c1.x + c1.w / 2, c1.y + c1.h / 2));
  let o1 = await col(otra.id, otra.k);
  ok('encima de una pieza colocada a mano no se puede soltar (aviso)', !o1.fija && /no cabe/.test(await p.$eval('#snack', e => e.textContent)), JSON.stringify(o1));
  // 8c) doble clic: gira 90° sobre su centro (Mayús: al otro lado), y la tecla R
  c1 = await col(pj.id, pj.k);
  const centro = await scr(c1.x + c1.w / 2, c1.y + c1.h / 2);
  await p.mouse.dblclick(centro.x, centro.y); await p.waitForTimeout(80);
  let c2 = await col(pj.id, pj.k);
  ok('doble clic: girada 90° sobre su centro', c2.fija && c2.g === (c1.g + 90) % 360 && Math.abs(c2.w - c1.h) < 1e-6 && Math.abs((c2.x + c2.w / 2) - (c1.x + c1.w / 2)) < 0.5 + Math.abs(c2.w - c1.w), JSON.stringify({ c1, c2 }));
  await p.keyboard.down('Shift'); await p.mouse.dblclick(centro.x, centro.y); await p.keyboard.up('Shift'); await p.waitForTimeout(80);
  ok('Mayús + doble clic: vuelve (horario)', (await col(pj.id, pj.k)).g === c1.g);
  await p.keyboard.press('r'); await p.waitForTimeout(60);
  ok('tecla R con la pieza seleccionada: gira', (await col(pj.id, pj.k)).g === (c1.g + 90) % 360);
  await p.keyboard.press('Shift+R'); await p.waitForTimeout(60);
  r = await revisar(); ok('tras girarla, sin solapes', !r.malos.length, JSON.stringify(r));
  // 8d) asa de la esquina: escala en % enteros, desde la esquina contraria
  c1 = await col(pj.id, pj.k);
  const esc0 = await p.evaluate(id => escalaDe(piezas.find(q => q.id === id)), pj.id);
  const asa = await (await p.$('#vista .asa-ne')).boundingBox();
  const sw0 = { x: c1.x, y: c1.y };
  await arrastrar({ x: asa.x + 5, y: asa.y + 5 }, await scr(c1.x + c1.w * 0.8, c1.y + c1.h * 0.8));
  const esc1 = await p.evaluate(id => escalaDe(piezas.find(q => q.id === id)), pj.id); let c3 = await col(pj.id, pj.k);
  ok('asa de la esquina: escala 80 % desde la esquina contraria', Math.abs(esc1 / esc0 - 0.8) < 0.011 && Math.abs(esc1 * 100 - Math.round(esc1 * 100)) < 1e-6 && c3.fija && Math.abs(c3.x - sw0.x) < 0.01 && Math.abs(c3.y - sw0.y) < 0.01, JSON.stringify({ esc0, esc1, c3 }));
  ok('la lista muestra la escala', new RegExp(`${+(esc1 * 100).toFixed(1)} %`).test(await p.$eval(`#lista tr[data-id="${pj.id}"]`, e => e.innerText)));
  r = await revisar(); ok('tras escalarla, sin solapes', !r.malos.length, JSON.stringify(r));
  // 8e) rectángulo: asa del lado = largo en mm enteros
  await p.evaluate(() => { piezas.push({ id: 'rg', nombre: 'Girada', tipo: 'rect', L: 300, A: 100, cant: 2, veta: true, giro: null, color: 'rosa' }); todo(); tableroVisto = resultado.tableros.findIndex(t => t.col.some(c => c.p.id === 'rg')); pintarVista(); });
  let g0 = await col('rg', 0); const cg = await scr(g0.x + g0.w / 2, g0.y + g0.h / 2);
  await p.mouse.click(cg.x, cg.y); await p.waitForTimeout(500);       // seleccionar (sin que cuente como doble clic)
  const ae = await (await p.$('#vista .asa-e')).boundingBox();
  await arrastrar({ x: ae.x + 5, y: ae.y + 5 }, await scr(g0.x + 250.4, g0.y + g0.h / 2));
  ok('rectángulo: el asa del lado cambia su largo (250 mm)', await p.evaluate(() => { const q = piezas.find(x => x.id === 'rg'); return q.L === 250 && q.A === 100; }), await p.evaluate(() => JSON.stringify(piezas.find(x => x.id === 'rg'))));
  // 8f) la chincheta suelta la pieza
  g0 = await col('rg', 0);
  const pin = await (await p.$('#vista .pz[data-pid="rg"][data-k="0"] [data-pin]')).boundingBox();
  await p.mouse.click(pin.x + pin.width / 2, pin.y + pin.height / 2); await p.waitForTimeout(80);
  ok('clic en la chincheta: la pieza vuelve al anidado automático', !(await col('rg', 0)).fija && await p.evaluate(() => !piezas.find(x => x.id === 'rg').fijas));
  // 8g) lista: giro y color
  await p.selectOption('#lista tr[data-id="rg"] select[data-c="giro"]', '90');
  const gg = await p.evaluate(() => resultado.tableros.flatMap(t => t.col).filter(c => c.p.id === 'rg').map(c => ({ g: c.g, w: c.w, h: c.h, rot: c.rot })));
  ok('giro 90° en la lista: las dos unidades giradas (100 × 250), el anidador no las vuelve a girar', gg.length === 2 && gg.every(c => c.g === 90 && c.w === 100 && c.h === 250 && !c.rot), JSON.stringify(gg));
  await p.selectOption('#lista tr[data-id="rg"] select[data-c="color"]', 'oliva');
  ok('color en la lista: la pieza se dibuja con él', await p.evaluate(() => { const r = document.querySelector('#vista .pz[data-pid="rg"] .caja'); return !!r && r.getAttribute('stroke') === tonoDe(piezas.find(x => x.id === 'rg')) && colorDe(piezas.find(x => x.id === 'rg')).id === 'oliva'; }));
  ok('cada pieza nueva sale de otro color', await p.evaluate(() => new Set(piezas.slice(0, 7).map(q => q.color)).size >= Math.min(7, piezas.length) - 1));
  r = await revisar(); ok('tras todo, sin solapes y dentro', !r.malos.length, JSON.stringify(r));
  // 8h) el Calcador abre el tablero con la pieza colocada a mano, girada y escalada, y la mecaniza
  await p.evaluate(() => { tableroVisto = 0; pintarVista(); });
  const pr2 = await p.evaluate(() => proyectoTablero(0));
  const rc2 = await cal.evaluate(d => { abrirJSONDatos(d); abrirMec(); generarMec(); const err = /error/i.test(document.getElementById('mecResumen').innerText); cerrarMec(); return { cont: contornos.length, err }; }, pr2);
  ok('el Calcador abre el tablero (pieza a mano, girada y escalada) y la mecaniza', rc2.cont === pr2.calcador.contornos.length && !rc2.err && pr2.anidador.piezas.some(q => q.aMano), JSON.stringify(rc2));
  await p.screenshot({ path: path.join(OUT, 'anid_a_mano.png') });
  await p.reload(); await p.waitForTimeout(400);
  ok('recuerda lo colocado a mano, la escala, el giro y el color al recargar', await p.evaluate(id => { const q = piezas.find(x => x.id === id), g = piezas.find(x => x.id === 'rg'); return !!q.fijas && Math.abs(escalaDe(q) - 0.8 * 1) < 1 && g.giro === 90 && g.color === 'oliva'; }, pj.id));
  r = await revisar(); ok('tras recargar, sin solapes', !r.malos.length, JSON.stringify(r));
  // 8i) cambiar el tablero: una pieza fijada que ya no cabe se suelta sola
  await p.evaluate(id => { const q = piezas.find(x => x.id === id); Object.values(q.fijas)[0].x = 5000; todo(); }, pj.id);
  ok('una pieza a mano que ya no cabe en su sitio se vuelve a colocar sola (aviso)', await p.evaluate(id => !piezas.find(x => x.id === id).fijas, pj.id) && /ya no cabían/.test(await p.$eval('#snack', e => e.textContent)));
  await p.click('#btnSoltar').catch(() => {});
  // 9) exportar el tablero que se ve: PNG, SVG y DXF
  await p.evaluate(() => { if (resultado.tableros.length > 1) { tableroVisto = 1; pintarVista(); } });
  const vis = await p.evaluate(() => ({ i: tableroVisto, n: resultado.tableros[tableroVisto].col.length, cont: proyectoTablero(tableroVisto).calcador.contornos.length, nombre: nombreTablero(tableroVisto), T: { L: resultado.T.L, A: resultado.T.A } }));
  const bajar = async id => { const [d] = await Promise.all([p.waitForEvent('download'), p.click('#' + id)]); const f = path.join(TMP, d.suggestedFilename()); await d.saveAs(f); return f; };
  const fPNG = await bajar('btnPNG'), fSVG = await bajar('btnSVG'), fDXF = await bajar('btnDXF');
  const png = fs.readFileSync(fPNG);
  ok('⬇ PNG: imagen del tablero visto', png.slice(1, 4).toString() === 'PNG' && png.readUInt32BE(16) >= 2000 && path.basename(fPNG).includes(`tablero ${vis.i + 1}`) || vis.i === 0, `${path.basename(fPNG)} ${png.readUInt32BE(16)}×${png.readUInt32BE(20)}`);
  const svg = fs.readFileSync(fSVG, 'utf8');
  ok('⬇ SVG: a escala en mm, con todas las piezas y el cero', svg.includes(`width="${+(vis.T.L + 2 * Math.max(20, 0.05 * Math.max(vis.T.L, vis.T.A))).toFixed(4)}mm"`) && (svg.match(/<g id="pieza\d+"/g) || []).length === vis.n && svg.includes('id="cero"'), `${(svg.match(/<g id="pieza\d+"/g) || []).length} piezas`);
  const arcosSVG = await p.evaluate(() => {
    // cada contorno del SVG (con sus arcos A) ocupa lo mismo que el contorno de verdad
    const T = resultado.T, pad = Math.max(20, 0.05 * Math.max(T.L, T.A)), d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:-9999px;top:0'; d.innerHTML = svgTablero(tableroVisto).replace(/^<\?xml[^>]*>/, ''); document.body.appendChild(d);
    const paths = [...d.querySelectorAll('g[id^="pieza"] path')], conts = dibujoTablero(tableroVisto).flatMap(x => x.cont), malos = [];
    conts.forEach((k, i) => { const bb = cajaDe([k]), g = paths[i].getBBox(), e = 0.2;   // cajaDe muestrea los arcos: en los de radio grande se queda hasta 0,15 mm corta
      if (Math.abs(g.x - (bb.x0 + pad)) > e || Math.abs(g.y - (T.A - bb.y1 + pad)) > e || Math.abs(g.width - bb.w) > e || Math.abs(g.height - bb.h) > e) malos.push(i); });
    d.remove(); return { n: conts.length, conArcos: conts.filter(k => k.b.some(v => Math.abs(v) > 1e-9)).length, malos };
  });
  ok('⬇ SVG: los arcos van hacia el lado bueno (cada contorno ocupa lo mismo que el de verdad)', arcosSVG.conArcos > 0 && !arcosSVG.malos.length , JSON.stringify(arcosSVG));
  ok('⬇ SVG: es XML válido', await p.evaluate(t => !new DOMParser().parseFromString(t, 'image/svg+xml').querySelector('parsererror'), svg));
  fs.copyFileSync(fPNG, path.join(OUT, 'anid_export.png'));
  const { execFileSync } = require('child_process');
  let dx = null; try { dx = JSON.parse(execFileSync('python3', [path.join(__dirname, 'validar_dxf.py'), fDXF]).toString()); } catch (e) { dx = { error: String(e.stderr || e.message).slice(0, 300) }; }
  ok('⬇ DXF: válido (ezdxf), una polilínea por contorno + el tablero, capas y nombres', dx && !dx.error && dx.polilineas === vis.cont + 1 && dx.textos === vis.n && dx.capas.includes('EXTERIOR') && dx.errores === 0, JSON.stringify(dx));
  const ext = await p.evaluate(() => { const d = proyectoTablero(tableroVisto), xs = [], ys = []; d.calcador.contornos.forEach(c => c.pts.forEach(q => { xs.push(q.x); ys.push(q.y); })); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; });
  const cajasJSON = await p.evaluate(() => { const d = proyectoTablero(tableroVisto); return d.calcador.contornos.map(k => { const c = cajaDe([k]); return [c.x0, c.y0, c.x1, c.y1]; }); });
  const arcMal = dx && dx.cajas ? cajasJSON.filter((c, i) => !dx.cajas[i] || c.some((v, j) => Math.abs(v - dx.cajas[i][j]) > 0.2)).length : -1;
  ok('⬇ DXF: los arcos van hacia el lado bueno (cada polilínea ocupa lo mismo que el contorno)', arcMal === 0, `distintas: ${arcMal} de ${cajasJSON.length}`);
  const colEsp = await p.evaluate(() => ({ pol: dibujoTablero(tableroVisto).flatMap(({ c, clases }) => clases.map(k => k === 'exterior' ? colorDe(c.p).aci : 256)), txt: dibujoTablero(tableroVisto).map(({ c }) => colorDe(c.p).aci) }));
  ok('⬇ DXF: el corte exterior y el nombre de cada pieza, con su color (ACI); lo demás, con el de su capa', dx && JSON.stringify(dx.colores) === JSON.stringify(colEsp.pol) && JSON.stringify(dx.coloresTexto) === JSON.stringify(colEsp.txt) && new Set(colEsp.txt).size > 1, JSON.stringify({ dxf: dx && dx.colores.slice(0, 8), esperado: colEsp.pol.slice(0, 8) }));
  ok('⬇ DXF: mismas coordenadas que el .json (origen = cero pieza)', dx && Math.abs(dx.piezas.x0 - ext.x0) < 1e-3 && Math.abs(dx.piezas.x1 - ext.x1) < 1e-3 && Math.abs(dx.piezas.y0 - ext.y0) < 1e-3 && Math.abs(dx.piezas.y1 - ext.y1) < 1e-3, JSON.stringify({ dxf: dx && dx.piezas, json: ext }));
  // el Calcador abre el DXF de fondo
  const rdx = await cal.evaluate(t => { try { crearFondoDXF(t, 'tablero.dxf', null); return { ok: !!fondo && fondo.tipo === 'dxf', acentos: fondo.textos.some(x => x.s === 'Tapa ñandú') && !fondo.textos.some(x => /\\U\+/.test(x.s)) }; } catch (e) { return { ok: false, e: e.message }; } }, fs.readFileSync(fDXF, 'utf8'));
  ok('el Calcador abre el DXF de fondo, con los acentos de los nombres', rdx.ok && rdx.acentos, JSON.stringify(rdx));
  ok('⬇ DXF: los nombres con acentos (\\U+) se leen bien en CAD', dx && dx.nombres.includes('Tapa ñandú') && dx.nombres.every(t => !/\\U\+/.test(t)), JSON.stringify(dx && dx.nombres));
  // 10) reabrir un tablero guardado: cada pieza por separado, colocada (📌) donde estaba
  const firmaTablero = d => JSON.stringify(d.calcador.contornos.map(c => c.pts.map(q => [+(+q.x).toFixed(2), +(+q.y).toFixed(2)]).concat([[c.b.map(v => +(+v).toFixed(4)).join()]])).map(x => JSON.stringify(x)).sort());
  await p.evaluate(() => { tableroVisto = 0; pintarVista(); });
  const guardado = await p.evaluate(() => proyectoTablero(0));
  const fV4 = path.join(TMP, 'tablero_v4.json'); fs.writeFileSync(fV4, JSON.stringify(guardado));
  const viejo = JSON.parse(JSON.stringify(guardado)); viejo.anidador.version = 3;
  viejo.anidador.piezas.forEach(q => { ['contornos', 'tipo', 'ref', 'veta', 'color', 'giroLista', 'w', 'h'].forEach(k => delete q[k]); });
  const fV3 = path.join(TMP, 'tablero_v3.json'); fs.writeFileSync(fV3, JSON.stringify(viejo));
  for (const [fich, et] of [[fV4, 'v4 (con los contornos de cada pieza)'], [fV3, 'anterior (se deducen)']]) {
    const c3 = await b.newContext({ viewport: { width: 1400, height: 950 } }), a3 = await c3.newPage(); a3.on('pageerror', e => errs.push('reabrir: ' + e.message));
    await a3.goto('file://' + path.join(SUITE, 'anidador.html')); await a3.waitForTimeout(300);
    await a3.evaluate(() => { $('hD').value = 6; $('hH').value = 1; todo(); });
    await a3.setInputFiles('#archivo', fich); await a3.waitForFunction(() => piezas.length > 0, null, { timeout: 5000 });
    const re = await a3.evaluate(() => ({ unidades: piezas.reduce((s, q) => s + q.cant, 0), fijas: piezas.reduce((s, q) => s + Object.keys(q.fijas || {}).length, 0), tableros: resultado.tableros.length, hH: $('hH').value, d: proyectoTablero(0) }));
    ok(`reabrir un tablero ${et}: las ${guardado.anidador.piezas.length} unidades, todas 📌 en un tablero`, re.unidades === guardado.anidador.piezas.length && re.fijas === re.unidades && re.tableros === 1, JSON.stringify({ unidades: re.unidades, fijas: re.fijas, tableros: re.tableros }));
    ok(`reabrir ${et}: mismas piezas en el mismo sitio (contornos iguales) y la misma separación`, firmaTablero(re.d) === firmaTablero(guardado) && +re.hH === 4, `hH ${re.hH}`);
    const sep = await a3.evaluate(() => piezas.map(q => [q.nombre, q.tipo, q.cant]));
    ok(`reabrir ${et}: piezas iguales agrupadas en una (con sus unidades)`, sep.some(([, , n]) => n > 1) && sep.length < guardado.anidador.piezas.length, JSON.stringify(sep));
    // y se pueden editar por separado: soltar una y moverla
    const libre = await a3.evaluate(() => { const q = piezas.find(x => x.tipo === 'json'); delete q.fijas[0]; todo(); return resultado.tableros.flatMap(t => t.col).some(c => c.p === q && !c.fija); });
    ok(`reabrir ${et}: cada pieza se puede soltar y recolocar por separado`, libre);
    await c3.close();
  }
  // el archivo de un tablero anterior (v3), con rectángulos
  { const c4 = await b.newContext(), a4 = await c4.newPage(); await a4.goto('file://' + path.join(SUITE, 'anidador.html')); await a4.waitForTimeout(300);
    await a4.setInputFiles('#archivo', path.join(__dirname, 'anidado_v3_usuario.json')); await a4.waitForFunction(() => piezas.length > 0, null, { timeout: 5000 });
    const u = await a4.evaluate(() => ({ p: piezas.map(q => `${q.nombre}:${q.tipo}:${q.L}x${q.A}:${q.cant}`), T: [$('tL').value, $('tA').value], col: resultado.tableros[0].col.map(c => `${c.p.nombre}@${c.x},${c.y}/${c.g}`) }));
    ok('tablero de rectángulos guardado antes (v3): rectángulos editables, en su sitio y con su giro',
      u.p.join() === 'Pieza 1:rect:400x300:1,Pieza 2:rect:164x123:1,Pieza 4:rect:400x200:1,Pieza 5:rect:200x100:1,Pieza 3:rect:141.52x106.14:2' && u.T.join() === '1000,600' && u.col.includes('Pieza 1@10,23.5/270') && u.col.includes('Pieza 3@881.52,161.52/90'), JSON.stringify(u));
    await c4.close(); }
  // 11) pasar una pieza a otro tablero: arrastrarla hasta su pestaña (o a «＋ Tablero nuevo»)
  { const c5 = await b.newContext({ viewport: { width: 1400, height: 950 } }), a5 = await c5.newPage(); a5.on('pageerror', e => errs.push('tableros: ' + e.message));
    await a5.goto('file://' + path.join(SUITE, 'anidador.html')); await a5.waitForTimeout(300);
    await a5.evaluate(() => { $('tL').value = 1000; $('tA').value = 600; piezas = [{ id: 'A', nombre: 'Grande', tipo: 'rect', L: 900, A: 500, cant: 2, veta: true, giro: null, color: 'azul' }, { id: 'B', nombre: 'Taco', tipo: 'rect', L: 100, A: 60, cant: 3, veta: true, giro: null, color: 'rosa' }]; tableroVisto = 0; todo(); });
    const estado = () => a5.evaluate(() => ({ n: resultado.tableros.length, visto: tableroVisto, por: resultado.tableros.map(t => t.col.map(c => c.p.id + c.k + (c.fija ? '📌' : '')).sort().join(',')) }));
    const centroDe = (id, k) => a5.evaluate(([id, k]) => { const c = resultado.tableros[tableroVisto].col.find(c => c.p.id === id && c.k === k); const svg = document.getElementById('vista'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      return { x: r.left + (vistaMap.ox + vistaMap.k * (c.x + c.w / 2)) * r.width / vb.width, y: r.top + (vistaMap.oy - vistaMap.k * (c.y + c.h / 2)) * r.height / vb.height }; }, [id, k]);
    const arrastrarATab = async (id, k, sel) => { const a = await centroDe(id, k); await a5.mouse.move(a.x, a.y); await a5.mouse.down(); await a5.mouse.move(a.x + 30, a.y - 30, { steps: 4 });
      const t = await (await a5.$(sel)).boundingBox(); await a5.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 10 }); await a5.waitForTimeout(80);
      const marcado = await a5.$eval(sel, e => e.classList.contains('destino')); await a5.mouse.up(); await a5.waitForTimeout(150); return marcado; };
    let e0 = await estado();
    const tacoEn0 = await a5.evaluate(() => resultado.tableros[0].col.find(c => c.p.id === 'B').k);
    const marc = await arrastrarATab('B', tacoEn0, '#tableros [data-tab="1"]');
    let e1 = await estado();
    ok('arrastrar una pieza hasta la pestaña de otro tablero: pasa a ese tablero (📌) y se ve ese tablero', marc && e1.n === 2 && e1.visto === 1 && e1.por[1].includes(`B${tacoEn0}📌`), JSON.stringify({ e0, e1 }));
    await a5.evaluate(() => { tableroVisto = 0; pintarVista(); });
    const nuevoVisible = async () => { const a = await centroDe('A', await a5.evaluate(() => resultado.tableros[0].col.find(c => c.p.id === 'A').k)); await a5.mouse.move(a.x, a.y); await a5.mouse.down(); await a5.mouse.move(a.x + 20, a.y + 20, { steps: 3 }); const v = await a5.$eval('#tableros .nuevoTab', e => getComputedStyle(e).display !== 'none'); await a5.mouse.up(); await a5.keyboard.press('Escape'); return v; };
    ok('mientras se arrastra aparece «＋ Tablero nuevo»', await nuevoVisible() && await a5.$eval('#tableros .nuevoTab', e => getComputedStyle(e).display === 'none'));
    await a5.evaluate(() => { piezas.forEach(p => delete p.fijas); tableroVisto = 0; todo(); });
    const tacoK = await a5.evaluate(() => resultado.tableros[0].col.find(c => c.p.id === 'B').k);
    await arrastrarATab('B', tacoK, '#tableros .nuevoTab');
    let e2 = await estado();
    ok('soltarla en «＋ Tablero nuevo»: un tablero más, con esa pieza', e2.n === 3 && e2.visto === 2 && e2.por[2] === `B${tacoK}📌`, JSON.stringify(e2));
    // vaciar un tablero: se quita y los siguientes pasan a su lugar
    await a5.evaluate(() => { piezas.forEach(p => delete p.fijas); piezas.find(p => p.id === 'A').cant = 1; piezas.find(p => p.id === 'B').fijas = { 0: { t: 2, x: 10, y: 10, g: 0 } }; tableroVisto = 0; todo(); });
    let e3 = await estado();
    ok('un tablero que se queda vacío desaparece (la pieza del tablero 3 pasa al 2)', e3.n === 2 && e3.por[1] === 'B0📌', JSON.stringify(e3));
    r = await a5.evaluate(() => resultado.tableros.every(t => t.col.length > 0)); ok('ningún tablero vacío', r);
    await c5.close(); }
  // móvil y tema oscuro
  await p.click('#btnTema'); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, 'anid_oscuro.png') }); await p.click('#btnTema');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 }); m.on('pageerror', e => errs.push('móvil: ' + e.message));
  await m.goto('file://' + path.join(SUITE, 'anidador.html')); await m.waitForTimeout(400);
  ok('móvil sin desplazamiento horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  console.log(`fallos ${fallos}`, errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
