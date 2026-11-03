// Anidador v8: anidado por la forma real. Piezas curvas (anillos con hueco y discos) y ejercicios del Calcador:
// sin solapes ni separaciones menores que la de la fresa (comprobado con la geometría exacta), dentro del margen,
// las pequeñas en los huecos, mejor que por rectángulos; colocar a mano en un hueco; guardar, reabrir y mecanizar
// de dentro afuera en el Calcador. Uso: node forma_real.js [carpeta de capturas]
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.argv[2] || require('os').tmpdir();
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'forma-'));
const circulo = (r, tipo) => ({ pts: [{ x: -r, y: 0 }, { x: r, y: 0 }], b: [1, 1], cerrado: true, tipo });
const pieza = (nombre, contornos) => ({ version: 7, nombre, calcador: { version: 4, escala: 10, origen: { x: 0, y: 0 }, contornos, cotasAjuste: {}, cotasManuales: [], aux: [], cfgHoja: { titulo: nombre } } });
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 950 }, acceptDownloads: true }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'anidador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const fa = path.join(TMP, 'Anillo.json'), fd = path.join(TMP, 'Disco.json');
  fs.writeFileSync(fa, JSON.stringify(pieza('Anillo', [circulo(150, 'exterior'), circulo(100, 'interior')])));
  fs.writeFileSync(fd, JSON.stringify(pieza('Disco', [circulo(40, 'exterior')])));
  const pon = vals => p.evaluate(vals => { Object.entries(vals).forEach(([id, v]) => { const e = document.getElementById(id); if (e.type === 'checkbox') e.checked = v; else e.value = v; }); todo(); }, vals);
  await pon({ tL: 1000, tA: 650, tG: 16, tP: 0.5, tM: 10, hD: 6, hH: 4, tVeta: false, tModo: 'rect' });
  await p.setInputFiles('#archivo', [fa, fd]); await p.waitForTimeout(400);
  await p.evaluate(() => { piezas.find(q => q.nombre === 'Anillo').cant = 3; piezas.find(q => q.nombre === 'Disco').cant = 10; todo(); });
  // comprobación exacta de un resultado
  const revisar = () => p.evaluate(() => {
    const T = resultado.T, malos = [];
    resultado.tableros.forEach((t, i) => t.col.forEach((a, ia) => {
      const f = formaPieza(a.p, a.g);
      if (a.x < T.M - 1e-3 || a.y < T.M - 1e-3 || a.x + f.w > T.L - T.M + 1e-3 || a.y + f.h > T.A - T.M + 1e-3) malos.push(`T${i + 1} ${a.p.nombre} fuera del margen`);
      if (Math.abs(f.w - a.w) > 1e-6 || Math.abs(f.h - a.h) > 1e-6) malos.push(`T${i + 1} ${a.p.nombre} medidas`);
      t.col.forEach((c2, ib) => { if (ib > ia && !separadas(f, a.x, a.y, formaPieza(c2.p, c2.g), c2.x, c2.y, T.sep - 1e-3)) malos.push(`T${i + 1} ${a.p.nombre}/${c2.p.nombre} a menos de ${T.sep} mm`); });
    }));
    const dentro = resultado.tableros.flatMap(t => t.col.filter(d => d.p.nombre === 'Disco' && t.col.some(a => a.p.nombre === 'Anillo' && Math.hypot(d.x + d.w / 2 - (a.x + a.w / 2), d.y + d.h / 2 - (a.y + a.h / 2)) < 60))).length;
    return { malos, tableros: resultado.tableros.length, piezas: resultado.tableros.reduce((s, t) => s + t.col.length, 0), fuera: resultado.nFuera, dentro, porForma: resultado.porForma,
             largo: Math.max(...resultado.tableros[resultado.tableros.length - 1].col.map(c => c.x + c.w)) };
  });
  const rRect = await revisar();
  ok('por rectángulo: correcto', !rRect.malos.length && rRect.fuera === 0, JSON.stringify(rRect));
  let t0 = Date.now(); await pon({ tModo: 'forma' }); const ms = Date.now() - t0;
  const rForma = await revisar();
  ok(`por la forma real: sin solapes ni separaciones menores que la de la fresa, dentro del margen (${ms} ms)`, !rForma.malos.length && rForma.fuera === 0 && rForma.piezas === 13, JSON.stringify(rForma));
  ok('los discos aprovechan los huecos de los anillos', rForma.dentro >= 3 && rForma.porForma, `${rForma.dentro} discos dentro de un anillo`);
  ok('aprovecha mejor el tablero que por rectángulos', rForma.tableros < rRect.tableros || (rForma.tableros === rRect.tableros && rForma.largo < rRect.largo - 1), `forma: ${rForma.tableros} tablero(s), largo ${rForma.largo.toFixed(0)} · rectángulos: ${rRect.tableros}, ${rRect.largo.toFixed(0)}`);
  ok('rápido (menos de 4 s)', ms < 4000, ms + ' ms');
  ok('el dibujo rellena la forma de cada pieza (y se coge por ella)', await p.evaluate(() => document.querySelectorAll('#vista path.solido').length === resultado.tableros[tableroVisto].col.length && document.querySelectorAll('#vista rect.caja.marco').length > 0));
  await p.screenshot({ path: path.join(OUT, 'anidador_forma.png') });
  // ejercicios del Calcador reales, varios de cada, por la forma: correcto y no peor que por rectángulos
  const ejs = ejercicios().filter(f => /Ejercicio (12|25)\.json|Nota musical|avanzado 0[3-6]|UTN Ejercicio 2/.test(f)).slice(0, 6);
  await p.evaluate(() => { piezas = []; todo(); }); await pon({ tL: 1220, tA: 610, tModo: 'rect' });
  await p.setInputFiles('#archivo', ejs); await p.waitForTimeout(500);
  await p.evaluate(() => { piezas.forEach(q => q.cant = 4); todo(); });
  const eR = await revisar(); t0 = Date.now(); await pon({ tModo: 'forma' }); const ms2 = Date.now() - t0; const eF = await revisar();
  ok(`${ejs.length} ejercicios del Calcador × 4, por la forma: correcto (${ms2} ms)`, !eF.malos.length && eF.fuera === eR.fuera, JSON.stringify({ ...eF, malos: eF.malos.slice(0, 3) }));
  ok('y no peor que por rectángulos', eF.tableros < eR.tableros || (eF.tableros === eR.tableros && eF.largo <= eR.largo + 1e-6), `forma: ${eF.tableros} tablero(s), largo ${eF.largo.toFixed(0)}${eF.porForma ? '' : ' (se queda el de rectángulos)'} · rectángulos: ${eR.tableros}, ${eR.largo.toFixed(0)}`);
  ok('con veta en el tablero y las piezas: sin girar 90°', await p.evaluate(() => { document.getElementById('tVeta').checked = true; piezas.forEach(q => q.veta = true); todo(); return resultado.tableros.every(t => t.col.every(c => c.g % 180 === 0)); }));
  await p.evaluate(() => { document.getElementById('tVeta').checked = false; piezas.forEach(q => q.veta = false); todo(); });
  // colocar a mano un disco dentro del hueco de un anillo: por la forma sí, por el rectángulo no
  await p.evaluate(() => { piezas = []; todo(); }); await pon({ tL: 1000, tA: 650, tModo: 'forma' });
  await p.setInputFiles('#archivo', [fa, fd]); await p.waitForTimeout(400);
  const mano = await p.evaluate(() => {
    const T = resultado.T, an = resultado.tableros[0].col.find(c => c.p.nombre === 'Anillo'), di = resultado.tableros[0].col.find(c => c.p.nombre === 'Disco');
    fijar(an, 0, 100, 100, 0);
    const an2 = resultado.tableros[0].col.find(c => c.p.nombre === 'Anillo'), di2 = resultado.tableros[0].col.find(c => c.p.nombre === 'Disco');
    const x = an2.x + an2.w / 2 - di2.w / 2, y = an2.y + an2.h / 2 - di2.h / 2;
    const okForma = cabeAqui(T, 0, di2, di2.g, x, y, di2);
    const choca = cabeAqui(T, 0, di2, di2.g, an2.x + 5, y, di2);   // encima del anillo
    fijar(di2, 0, x, y, 0);
    const fijadas = resultado.tableros[0].col.filter(c => c.fija).length;
    document.getElementById('tModo').value = 'rect'; const okRect = cabeAqui(T, 0, di2, di2.g, x, y, resultado.tableros[0].col.find(c => c.p.nombre === 'Disco'));
    document.getElementById('tModo').value = 'forma';
    return { okForma, choca, fijadas, okRect, sueltas: resultado.tableros[0].col.filter(c => c.fija).length };
  });
  ok('a mano: un disco dentro del hueco del anillo cabe por la forma (y no por el rectángulo); encima del anillo, no', mano.okForma && !mano.choca && !mano.okRect && mano.fijadas === 2, JSON.stringify(mano));
  // arrastrar con el ratón: el disco queda en rojo encima del anillo
  const enPantalla = (x, y) => p.evaluate(([x, y]) => { const svg = document.getElementById('vista'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return { x: r.left + (vistaMap.ox + vistaMap.k * x) * r.width / vb.width, y: r.top + (vistaMap.oy - vistaMap.k * y) * r.height / vb.height }; }, [x, y]);
  const g = await p.evaluate(() => { const d = resultado.tableros[0].col.find(c => c.p.nombre === 'Disco'), a = resultado.tableros[0].col.find(c => c.p.nombre === 'Anillo'); return { d: { x: d.x + d.w / 2, y: d.y + d.h / 2 }, a: { x: a.x + 25, y: a.y + a.h / 2 } }; });
  await p.evaluate(() => scrollTo(0, 0));
  let a = await enPantalla(g.d.x, g.d.y), d = await enPantalla(g.a.x, g.a.y);
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(d.x, d.y, { steps: 8 }); await p.waitForTimeout(100);
  const rojo = await p.evaluate(() => !!document.querySelector('#vista .pz.mal'));
  await p.keyboard.press('Escape'); await p.mouse.up(); await p.waitForTimeout(200);
  ok('arrastrando el disco encima del anillo, se pone rojo', rojo);
  // guardar y reabrir: las dos siguen colocadas a mano, una dentro de la otra
  const proyecto = await p.evaluate(() => proyectoTablero(0));
  ok('el tablero guardado recuerda el modo', proyecto.anidador.tablero.modo === 'forma');
  const fj = path.join(TMP, 'tablero.json'); fs.writeFileSync(fj, JSON.stringify(proyecto));
  await p.evaluate(() => { piezas = []; document.getElementById('tModo').value = 'rect'; todo(); });
  await p.setInputFiles('#archivo', fj); await p.waitForTimeout(500);
  const re = await p.evaluate(() => ({ modo: document.getElementById('tModo').value, fijas: resultado.tableros[0].col.filter(c => c.fija).length, n: resultado.tableros[0].col.length }));
  ok('al reabrirlo: modo «forma» y las piezas colocadas a mano en su sitio (el disco, dentro del anillo)', re.modo === 'forma' && re.fijas === 2, JSON.stringify(re));
  // en el Calcador: se mecaniza de dentro afuera (disco, hueco del anillo, exterior del anillo)
  const cal = await ctx.newPage(); cal.on('dialog', dd => dd.accept()); await cal.goto('file://' + path.join(SUITE, 'calcador.html')); await cal.waitForTimeout(700);
  const orden = await cal.evaluate(d => { abrirJSONDatos(d); abrirMec(); generarMec(); const t = document.getElementById('mecTexto').value;
    const tr = trazadosParaMecanizar(); return { cab: (t.match(/══════ Trazado \d+\/\d+ — [A-ZÁÉÍÓÚ]+/g) || []).map(x => x.split('— ')[1]), niveles: tr.map(x => x.nivel).sort(), ok: corregirPrograma(t).piezaOk }; }, proyecto);
  ok('en el Calcador, ⚙️ Mecanizar corta de dentro afuera: el disco, el hueco del anillo y su exterior', JSON.stringify(orden.cab.slice(0, 3)) === JSON.stringify(['EXTERIOR', 'INTERIOR', 'EXTERIOR']) && orden.niveles.join(',') === '0,1,2' && orden.ok, JSON.stringify(orden));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
  console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
