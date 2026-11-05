// Arcos I J v7: ¿R o -R? en ⑤ y Cuerda <180° / >180° en ①, con inicio, final y radio.
const { lanzar, path, SUITE } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'arcos_ij.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  // barrido geométrico
  const r = await p.evaluate(() => { const mal = []; cfg.cotas = ['G90', 'G91', 'mixto'];
    for (const [ch, largo] of [['cm', false], ['cM', true]]) { cfg.ang = [ch]; for (let i = 0; i < 80; i++) { const e = generar('sencillo'), a = e.tramos[1]; const dC = q => Math.hypot(q.x - a.C.x, q.y - a.C.y);
        if (!e.deSencillo || a.modo !== 'puntos') mal.push('tipo'); if (Math.abs(dC(a.a) - a.R) > 1e-6 || Math.abs(dC(a.b) - a.R) > 1e-6) mal.push('radio'); if (arcoLargo(a) !== largo) mal.push(ch + ' tamaño');
        if (Math.abs(a.I - (a.C.x - a.a.x)) > .051 || Math.abs(a.J - (a.C.y - a.a.y)) > .051) mal.push('ij'); if (a.I % 1 || a.J % 1) mal.push('decimal');
        const f = a.a.x === a.b.x || a.a.y === a.b.y; if (!f) mal.push('cuerda'); ej = e; textoEnunciado(e); pasosPit(a, 1, 1); } }
    cfg.ang = ['90', '180', '270', 'cm', 'cM']; const v = { ok: 0 };
    for (let i = 0; i < 400; i++) { cfg.leer = ['r']; const e = generar('leer'), a = e.tramos[1];
      if (e.sub === 'r') { if (e.rBien !== (arcoLargo(a) ? -a.R : a.R)) mal.push('signo'); if (Math.abs(a.a.x - a.b.x) + Math.abs(a.a.y - a.b.y) < 1e-6) mal.push('sin arco'); const m = Math.hypot((a.a.x + a.b.x) / 2 - a.C.x, (a.a.y + a.b.y) / 2 - a.C.y); if (m < 1e-6) mal.push('180°'); v.r = (v.r || 0) + 1; v[e.rBien < 0 ? 'neg' : 'pos'] = (v[e.rBien < 0 ? 'neg' : 'pos'] || 0) + 1; }
      else { const c = e.cands.filter(x => x.g === a.g && x.largo === e.bloque.r < 0); if (c.length !== 1 || !c[0].ok) mal.push('R no decide un solo arco'); v.c = (v.c || 0) + 1; } }
    return { mal: [...new Set(mal)], v }; });
  ok('160 arcos de cuerda: geometría, tamaño e I J enteros', !r.mal.some(x => !/signo|180|arco|decide/.test(x)), r.mal.join());
  ok('400 de R: signo correcto, y un bloque con R señala un solo arco de los cuatro', !r.mal.length && r.v.r > 100 && r.v.c > 100 && r.v.neg > 20 && r.v.pos > 20, JSON.stringify(r.v));
  // en pantalla
  await p.evaluate(() => { cfg.cotas = ['G90']; cfg.leer = ['r']; cfg.ang = ['90', '180', '270']; ponerNivel('leer'); });
  for (let i = 0; i < 12; i++) { const s = await p.evaluate(() => { nuevoEjercicio(); return ej.sub; }); if (s === 'r') break; }
  const pant = await p.evaluate(() => { const malo = ej.opcR.indexOf(-ej.rBien); elegirArco(malo); comprobar(); const t1 = document.getElementById('feedback').textContent; const r1 = ej.resuelto; document.getElementById('feedback'); elegirArco(ej.opcR.indexOf(ej.rBien)); comprobar(); return { t1, r1, ok: ej.resuelto, bloque: document.getElementById('zonaResp').textContent, cod: document.getElementById('gcode').textContent, bien: 'R' + fmt(ej.rBien) }; });
  ok('elige mal: lo explica; elige bien: se da por resuelto', /180/.test(pant.t1) && !pant.r1 && pant.ok, pant.t1.slice(0, 90));
  ok('el programa muestra R y no I J', pant.cod.includes(pant.bien) && !/ I-?\d/.test(pant.cod));
  ok('la explicación está en las opciones', await p.evaluate(() => /más de 180/.test(document.querySelector('#opcLeer .expl-r').textContent) && getComputedStyle(document.getElementById('opcLeer')).display !== 'none'));
  await p.locator('#opcLeer .expl-r summary').click(); await p.waitForTimeout(100);
  await p.screenshot({ path: path.join(OUT, 'arcos_r.png') });
  await p.evaluate(() => { cfg.ang = ['cM']; ponerNivel('sencillo'); nuevoEjercicio(); }); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(OUT, 'arcos_cuerda.png') });
  const v2 = await p.evaluate(() => ({ en: document.getElementById('enunciado').textContent, svg: document.querySelector('#canvas, svg') ? 1 : 0, t: pasosActuales ? 1 : 0 })).catch(() => ({}));
  const res = await p.evaluate(() => { resolver && resolver(); return ej.resuelto; }).catch(e => 'x');
  // hoja
  await p.evaluate(() => { cfg.ang = ['cm', 'cM']; cfg.leer = ['r', 'cual', 'error']; abrirHoja(); document.querySelectorAll('#modalHoja [data-hj]').forEach(i => { i.value = { sencillo: 3, leer: 3 }[i.dataset.hj] || 0; }); totalHoja(); window.print = () => {}; imprimirHoja(); });
  await p.waitForTimeout(150);
  const hoja = await p.evaluate(() => ({ h: document.getElementById('hoja').innerHTML, subs: ultimaHoja.lista.filter(e => e.tipo === 'leer').map(e => e.subPedido), sols: document.querySelectorAll('.hj-sol').length }));
  ok('hoja: reparte los tres tipos de ⑤ con soluciones', [...new Set(hoja.subs)].length === 3 && hoja.sols === 6, hoja.subs.join());
  ok('hoja: sin colores de pantalla ni undefined', !/undefined|NaN/.test(hoja.h));
  await p.emulateMedia({ media: 'print' }); await p.pdf({ path: path.join(OUT, 'hoja_r.pdf'), preferCSSPageSize: true, printBackground: true }); await p.emulateMedia({ media: 'screen' });
  // examen con estas opciones
  ok('Examen de Aules con arcos de cuerda', await p.evaluate(() => { cfg.ang = ['cm', 'cM']; const e = generar('sencillo'); e.cotas = 'G90'; const c = clozeDe(e); return c && c.cuerpo && !/undefined|NaN/.test(c.cuerpo); }));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
