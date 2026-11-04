// Arcos I J v6: 🖨 Hoja combinando niveles (por ejemplo ① y ⑤), con sus soluciones y sin descuadrar el A4.
const { lanzar, path, SUITE } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'arcos_ij.html')); await p.evaluate(() => { localStorage.clear(); window.print = () => { window.__impreso = (window.__impreso || 0) + 1; }; window.addEventListener('afterprint', e => e.stopImmediatePropagation(), true); });
  await p.waitForTimeout(300);
  const pon = c => p.evaluate(c => { document.querySelectorAll('#modalHoja [data-hj]').forEach(i => { i.value = c[i.dataset.hj] || 0; }); totalHoja(); }, c);
  const genera = async (c, barajado) => { await p.evaluate(() => abrirHoja()); await pon(c); await p.evaluate(v => { document.getElementById('hjBarajar').checked = !!v; imprimirHoja(); }, barajado); await p.waitForTimeout(150); return p.evaluate(() => ({ tipos: ultimaHoja.lista.map(e => e.tipo), html: document.getElementById('hoja').innerHTML })); };
  await p.evaluate(() => abrirHoja());
  ok('al abrir: 6 del nivel elegido y total correcto', await p.evaluate(() => /6 ejercicios/.test(hjTotal.textContent) && !hjImprimir.disabled));
  await pon({}); ok('sin ejercicios no se puede imprimir', await p.evaluate(() => hjImprimir.disabled));
  await pon({ sencillo: 12, complejo: 12 }); ok('más de 20 no se puede imprimir', await p.evaluate(() => hjImprimir.disabled));
  const antes = await p.evaluate(() => JSON.stringify(ej.tramos));
  let r = await genera({ sencillo: 2, leer: 2 });
  ok('① 2 + ⑤ 2: cuatro ejercicios, en orden', JSON.stringify(r.tipos.map(t => t === 'leer')) === '[false,false,true,true]', r.tipos.join());
  ok('la hoja lleva tabla y bloque', r.html.includes('<table>') && r.html.includes('hj-bloque'));
  ok('la pantalla no cambia de ejercicio', antes === await p.evaluate(() => JSON.stringify(ej.tramos)));
  ok('recuerda las cantidades', await p.evaluate(() => { abrirHoja(); const v = document.querySelector('[data-hj=leer]').value; cerrarModal('modalHoja'); return v === '2'; }));
  // los dos tipos de ⑤
  for (const [sub, re] of [['cual', /Rodea la letra/], ['error', /Rodea las palabras/]]) {
    await p.evaluate(s => { cfg.leer = [s]; }, sub); r = await genera({ leer: 3 });
    const d = await p.evaluate(() => ultimaHoja.lista.map(e => ({ cual: e.sub === 'cual', L: 'ABCD'[e.correcta], malo: e.errTipo, g: e.correcto && e.correcto.g })));
    const sols = await p.evaluate(() => [...document.querySelectorAll('.hj-sol')].map(x => x.textContent));
    ok(`⑤ ${sub}: enunciado para papel y bloque sin colores de pantalla`, re.test(r.html) && !/--col-/.test(r.html.split('<svg')[0]));
    ok(`⑤ ${sub}: la solución dice la respuesta`, sols.length === 3 && sols.every((t, i) => d[i].cual ? t.includes('Arco ' + d[i].L) : (d[i].malo === 'ok' ? /está bien/.test(t) : t.includes('N40'))), sols[0]);
    ok(`⑤ ${sub}: un dibujo por ejercicio`, (r.html.match(/<svg/g) || []).length === 3);
  }
  await p.evaluate(() => { cfg.leer = ['cual', 'error']; });
  // cabe en A4: ningún ejercicio se corta y las hojas son las previstas
  r = await genera({ sencillo: 3, leer: 3 }, true);
  ok('mezclar: los mismos ejercicios', r.tipos.filter(t => t === 'leer').length === 3);
  ok('los arcos se ven grandes en papel', await p.evaluate(() => { const l = []; for (let i = 0; i < 30; i++) l.push(cuerdaEnPapel(generarParaPapel(['sencillo', 'complejo', 'leer'][i % 3]))); return Math.min(...l) >= 95; }));
  ok('las letras de ⑤ no se pisan con los centros', await p.evaluate(() => { cfg.leer = ['cual']; const g = ej; let ok = true; impresion = true; for (let i = 0; i < 60 && ok; i++) { ej = generar('leer'); vista = calcularVista(470, ALTO_HOJA); const pu = [], fi = [ej.tramos[1].C, ej.C2].map(S); ej.cands.forEach(c => { const m = puntoArco(c, .5), l = sitioLetra(c, m, ej.tramos[1], pu), sl = S(l.en); if (fi.some(f => Math.hypot(f.x - sl.x - l.dx, f.y - sl.y - l.dy) < 14)) ok = false; }); } impresion = false; ej = g; cfg.leer = ['cual', 'error']; return ok; }));
  await p.emulateMedia({ media: 'print' });
  const ancho = await p.evaluate(() => { const h = document.getElementById('hoja'); return [...h.querySelectorAll('.hj-ej')].every(e => e.scrollWidth <= e.clientWidth + 1 && e.offsetHeight < 1000); });
  ok('cada ejercicio cabe en el ancho y en una página', ancho);
  const pdf = await p.pdf({ path: path.join(OUT, 'hoja_arcos.pdf'), preferCSSPageSize: true, printBackground: true });
  const pags = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok('PDF A4: 3 hojas o menos (2 de ejercicios y 1 de soluciones)', pags >= 2 && pags <= 3, pags + ' páginas');
  await p.emulateMedia({ media: 'screen' });
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
