// Calcador v99: la hoja de ejercicio sin tabla de coordenadas (aunque el ejercicio la tuviera guardada) y con el plano en color.
// Imprime varios ejercicios de la suite desde la Biblioteca, en negro y en color: una página por ejercicio, nada se sale de su página.
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const datos = ejercicios().map(f => { try { const d = JSON.parse(fs.readFileSync(f, 'utf8')); return d.calcador ? d : null; } catch (e) { return null; } }).filter(Boolean).slice(0, 8);
  datos.forEach(d => { d.calcador.cfgHoja = { ...(d.calcador.cfgHoja || {}), tabla: true, rayado: false }; });     // como los ejercicios guardados antes, con la tabla
  ok('la ventana no tiene la casilla de la tabla y sí la del color', await p.evaluate(() => !document.getElementById('hj_tabla') && !!document.getElementById('hj_color') && !!document.getElementById('bibColor')));
  const imprimir = color => p.evaluate(async ([datos, color]) => {
    let html = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(h) { html += h; }, close() {} } });
    bib.lista = datos.map((d, i) => ({ id: 'e' + i, datos: d, ficha: { titulo: 'E' + i } })); cfgHoja.color = color;
    try { await imprimirLoteBib(bib.lista.map(e => e.id), 'hoja'); } finally { window.open = o; }
    return html.replace(/<script[\s\S]*?<\/script>/g, '');
  }, [datos, color]);
  for (const color of [false, true]) {
    const html = await imprimir(color), q = await ctx.newPage(); await q.setContent(html); await q.waitForTimeout(300);
    const r = await q.evaluate(() => [...document.querySelectorAll('.pag')].map(e => ({ sale: e.scrollHeight > e.clientHeight + 1, esc: (e.innerText.match(/ESCALA\s*\n?\s*(1:[\d.,]+)/i) || [])[1] })));
    const pdf = path.join(OUT, `hojas_${color ? 'color' : 'negro'}.pdf`); await q.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
    const paginas = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    ok(`${color ? 'color' : 'negro'}: ${datos.length} ejercicios → ${datos.length} hojas, sin tabla y nada fuera de su página`, r.length === datos.length && paginas === datos.length && !/Tabla de coordenadas/.test(html) && r.every(x => !x.sale), `páginas ${paginas}, escalas ${r.map(x => x.esc).join(' ')}`);
    const negros = /stroke="#000000"/.test(html), colores = /stroke="#d84343"|stroke="#005A9C"|stroke="#[0-9a-fA-F]{6}"/.test(html.replace(/#000000|#333333/g, ''));
    ok(color ? 'en color: los colores del Calcador' : 'en negro: el plano en negro', color ? colores && /print-color-adjust: exact/.test(html) : negros, '');
    await q.close();
  }
  // una pieza que no cabe a 1:1 (la misma, al doble): el plano se ajusta al hueco y el cajetín dice «ajustada (las cotas mandan)»
  for (const orient of ['h', 'v']) {
    const html = await p.evaluate(([d, orient]) => { abrirJSONDatos(JSON.parse(JSON.stringify(d))); contornos.forEach(c => c.pts = c.pts.map(q => ({ ...q, x: q.x * 2.2, y: q.y * 2.2 }))); memoTipos = null;
      let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(t) { h += t; }, close() {} } });
      try { abrirHoja(); document.getElementById('hj_orient').value = orient; imprimirHoja(); } finally { window.open = o; } return h.replace(/<script[\s\S]*?<\/script>/g, ''); }, [datos[1], orient]);
    const q = await ctx.newPage(); await q.setContent(html); await q.waitForTimeout(300);
    const r = await q.evaluate(() => { const d = document.querySelector('.dib').getBoundingClientRect(), s = document.querySelector('.dib svg').getBoundingClientRect(), pg = document.querySelector('.pag');
      return { dentro: s.left >= d.left - 1 && s.right <= d.right + 1 && s.top >= d.top - 1 && s.bottom <= d.bottom + 1, llena: Math.max(s.width / d.width, s.height / d.height), sale: pg.scrollHeight > pg.clientHeight + 1, txt: pg.innerText }; });
    if (orient === 'h') await q.pdf({ path: path.join(OUT, 'hoja_ajustada.pdf'), preferCSSPageSize: true, printBackground: true });
    ok(`${orient === 'h' ? 'A4 horizontal' : 'A4 vertical'}: no cabe a 1:1 → ajustada al hueco, dentro y llenándolo`, /ajustada \(las cotas mandan\)/.test(r.txt) && r.dentro && r.llena > 0.9 && !r.sale, `llena el ${Math.round(r.llena * 100)} %`);
    await q.close();
  }
  ok('después, el Calcador vuelve a como estaba (sin errores)', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
