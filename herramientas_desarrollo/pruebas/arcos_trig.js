// Arcos I J v7: nivel ⑥ Trigonometría (arco por ángulos, recta inclinada, esquina con trigonometría y con Pitágoras).
const { lanzar, path, SUITE } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'arcos_ij.html')); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(400); await p.evaluate(() => { if (typeof cerrarGuia === 'function') cerrarGuia(); });
  const geo = await p.evaluate(() => { const mal = []; const d = (u, v) => Math.hypot(u.x - v.x, u.y - v.y); const sal = {};
    cfg.cotas = ['G90', 'G91', 'Mixto'];
    for (const tang of [['not'], ['otros'], ['not', 'otros']]) { cfg.tang = tang; for (const k of ['ang', 'tan', 'esq', 'esqP']) { cfg.trig = [k]; for (let i = 0; i < 150; i++) {
      const e = generar('trig'), a = e.tramos[1], tag = k + ' ' + tang; ej = e; sal[k] = (sal[k] || 0) + 1;
      if (e.kindT !== k) mal.push('tipo');
      if (Math.abs(d(a.a, a.C) - a.R) > .03 || Math.abs(d(a.b, a.C) - a.R) > .03) mal.push(tag + ' no está a R ' + d(a.a, a.C) + ' ' + d(a.b, a.C) + ' R ' + a.R);
      if (Math.abs(a.I - (a.C.x - a.a.x)) > .011 || Math.abs(a.J - (a.C.y - a.a.y)) > .011) mal.push(tag + ' IJ');
      for (const v of [a.a.x, a.a.y, a.b.x, a.b.y, a.I, a.J]) if (Math.abs(v * 100 - Math.round(v * 100)) > 1e-6) mal.push(tag + ' más de 2 decimales');
      if (e.tramos[0].b !== a.a || e.tramos[2].a !== a.b) mal.push('cadena');
      if ([...e.tramos].some(t => [t.a, t.b].some(q => q.x < 0 || q.y < 0))) mal.push(tag + ' negativo');
      if (k !== 'ang') { // tangencia a las dos rectas: radio perpendicular a la recta
        const uIn = (x => { const n = Math.hypot(x.x, x.y); return { x: x.x / n, y: x.y / n }; })({ x: a.a.x - e.tramos[0].a.x, y: a.a.y - e.tramos[0].a.y }), uOut = (x => { const n = Math.hypot(x.x, x.y); return { x: x.x / n, y: x.y / n }; })({ x: e.tramos[2].b.x - a.b.x, y: e.tramos[2].b.y - a.b.y });
        const pr1_ = Math.abs((a.C.x - a.a.x) * uIn.x + (a.C.y - a.a.y) * uIn.y), pr2_ = Math.abs((a.C.x - a.b.x) * uOut.x + (a.C.y - a.b.y) * uOut.y);
        if (pr1_ > .05 || pr2_ > .05) mal.push(tag + ' no tangente ' + pr1_.toFixed(3) + ' ' + pr2_.toFixed(3));
        const giro = angulosArco(a).sw, cruz = uIn.x * uOut.y - uIn.y * uOut.x; if (Math.sign(giro) !== Math.sign(cruz)) mal.push(tag + ' sentido');
      }
      if (k === 'esq' || k === 'esqP') { if (Math.abs(d(e.V, a.a) - d(e.V, a.b)) > .03) mal.push(tag + ' T distinta'); if (Math.abs(d(e.V, a.a) - e.T) > .02) mal.push(tag + ' T ' + d(e.V, a.a) + ' ' + e.T); }
      if (k === 'esq') { const T = a.R * Math.tan(e.alfa / 2 * Math.PI / 180); if (Math.abs(T - e.T) > 1e-9) mal.push('fórmula'); }
      if (k === 'esqP') { if (!Number.isInteger(e.T) || Math.abs(Math.hypot(a.R, e.T) - e.VC) > 1e-9 || Math.abs(d(e.V, a.C) - e.VC) > .03) mal.push('Pitágoras'); const dq = d(e.V, e.Q); if (Math.abs(dq * 10 - Math.round(dq * 10)) > 1e-6) mal.push('VQ no exacta ' + dq); if (dq <= e.T) mal.push('Q antes del final'); }
      textoEnunciado(e); generarPasos(); programa(e, true);
      const pl = dibujarPlano(900, 600); if (/undefined|NaN/.test(pl)) mal.push(tag + ' plano');
      ej = null; } } }
    cfg.tang = ['not']; cfg.trig = ['ang', 'tan', 'esq', 'esqP']; return { mal: [...new Set(mal)].slice(0, 8), sal }; });
  ok('1.800 ejercicios: a R del centro, tangentes, 2 decimales, sin NaN', !geo.mal.length, geo.mal.join(' | '));
  // ejemplos hechos a mano
  const man = await p.evaluate(() => { const arr = []; ej = null; const mk = (k, a) => { cfg.trig = [k]; let e; for (let i = 0; i < 3000; i++) { e = generar('trig'); if (a(e)) return e; } return null; };
    const e1 = mk('tan', e => e.alfa === 30 && e.tramos[1].R === 30 && e.dOut.x === 1 && e.tramos[1].g === 'G2'); arr.push(e1 && [e1.tramos[1].I, e1.tramos[1].J, r2(e1.tramos[1].b.x - e1.tramos[1].a.x), r2(e1.tramos[1].b.y - e1.tramos[1].a.y)]);
    const e3 = mk('esq', e => e.alfa === 60 && e.tramos[1].R === 20 && e.dIn.x === 1 && e.tramos[1].g === 'G3'); arr.push(e3 && [r2(e3.V.x - e3.tramos[1].a.x), e3.tramos[1].I, e3.tramos[1].J, r2(e3.tramos[1].b.x - e3.V.x), r2(e3.tramos[1].b.y - e3.V.y)]);
    return arr; });
  ok('recta 30° R30 G2: I15 J-25.98, avance X15 Y4.02', JSON.stringify(man[0]) === '[15,-25.98,15,4.02]', JSON.stringify(man[0]));
  ok('esquina 60° R20: T 11.55, I0 J20, final a +5.77 +10', man[1] && man[1][0] === 11.55 && man[1][1] === 0 && man[1][2] === 20 && Math.abs(man[1][3] - 5.77) < .011 && Math.abs(man[1][4] - 10) < .011, JSON.stringify(man[1]));
  // en pantalla: corrige con 2 decimales
  await p.evaluate(() => { cfg.cotas = ['G90']; cfg.trig = ['esq']; ponerNivel('trig'); nuevoEjercicio(); });
  const scr = await p.evaluate(() => { const a = ej.tramos[1], fx = (id, v) => { document.getElementById(id).value = String(v).replace('.', ','); }; const rellena = (dx) => { fx('f_ini_x', a.a.x + dx); fx('f_ini_y', a.a.y); document.getElementById('f_1_g').value = a.g; fx('f_1_x', a.b.x); fx('f_1_y', a.b.y); fx('f_1_i', a.I); fx('f_1_j', a.J); };
    rellena(.03); comprobar(); const mal = ej.resuelto; rellena(0); comprobar(); return { mal, bien: ej.resuelto, lab: document.getElementById('pillNivel').textContent }; });
  ok('corrige con 2 decimales: 0,03 de más es fallo; exacto es acierto', scr.mal === false && scr.bien === true);
  ok('etiqueta del nivel', scr.lab === 'TRIGONOMETRÍA', scr.lab);
  const otro = await p.evaluate(() => { cfg.dato = ['cuerda']; cfg.decimal = true; ponerNivel('complejo'); nuevoEjercicio(); return { d: (document.querySelector('#gcode').textContent + ' ' + r1(1.26)), r: r1(1.26), f: fmt(1.26) }; });
  ok('los demás niveles siguen con 1 decimal', otro.r === 1.3 && otro.f === '1.3');
  await p.evaluate(() => { cfg.decimal = false; });
  for (const k of ['ang', 'tan', 'esq', 'esqP']) { await p.evaluate(k => { cfg.trig = [k]; ponerNivel('trig'); cfg.ay.tri = true; nuevoEjercicio(); render(); }, k); await p.waitForTimeout(150); await p.locator('#zonaPlano').screenshot({ path: path.join(OUT, `tr_${k}.png`) }); }
  await p.evaluate(() => { cfg.ay.tri = false; });
  const hoja = await p.evaluate(() => { cfg.trig = ['ang', 'tan', 'esq', 'esqP']; abrirHoja(); document.querySelectorAll('#modalHoja [data-hj]').forEach(i => { i.value = { trig: 6 }[i.dataset.hj] || 0; }); totalHoja(); window.print = () => {}; imprimirHoja(); return { h: document.getElementById('hoja').innerHTML, sols: [...document.querySelectorAll('.hj-sol')].map(x => x.textContent) }; });
  ok('hoja: 6 ejercicios, soluciones y 2 decimales', hoja.sols.length === 6 && /2 decimales/.test(hoja.h) && !/undefined|NaN/.test(hoja.h) && hoja.sols.every(t => /G[23]/.test(t)), hoja.sols[0].slice(0, 90));
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(150); await p.pdf({ path: path.join(OUT, 'hoja_trig.pdf'), preferCSSPageSize: true, printBackground: true }); await p.emulateMedia({ media: 'screen' });
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
