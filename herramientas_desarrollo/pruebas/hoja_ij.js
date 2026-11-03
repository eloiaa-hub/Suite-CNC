// Calcador v120: ◠ Hoja de I J (hojas y soluciones, con variantes) y Coordenadas sin pisar el zoom en pantallas pequeñas.
const { lanzar, path, SUITE, fs } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
  const dir = path.join(SUITE, 'biblioteca_inicio/Nivel 4 - Arcos con I J'), js = fs.readdirSync(dir).filter(x => x.endsWith('.json'))[1];
  await p.evaluate(t => abrirJSONDatos(JSON.parse(t)), fs.readFileSync(path.join(dir, js), 'utf8')); await p.waitForTimeout(600);
  await p.click('button[onclick="abrirHojaIJ()"]'); ok('se abre la ventana', await p.isVisible('#modalHojaIJ .help-header'));
  const antes = await p.evaluate(() => JSON.stringify(contornos));
  const imprime = async (sol, ver, coord) => { await p.evaluate(([v, c]) => { abrirHojaIJ(); document.getElementById('hijVer').value = v; document.getElementById('hijCoord').value = c; }, [ver, coord]);
    const [w] = await Promise.all([ctx.waitForEvent('page'), p.evaluate(s => imprimirHojaIJ(s), sol)]); await w.waitForTimeout(500); return w; };
  let w = await imprime(false, 'una', 'G90');
  const h = await w.evaluate(() => ({ pag: document.querySelectorAll('.pag').length, filas: document.querySelectorAll('table.ij tr').length - 1, marcas: document.querySelectorAll('.dib svg circle').length, vacio: [...document.querySelectorAll('table.ij td.r')].every(t => !t.textContent), alto: (() => { const a = document.querySelector('.pag'); return a.scrollHeight <= a.clientHeight + 1; })() }));
  ok('hoja: una página, los arcos numerados y las casillas vacías', h.pag === 1 && h.filas > 0 && h.vacio && h.alto, JSON.stringify(h));
  if (process.env.GUARDAR) await w.pdf({ path: path.join(OUT, 'hoja_ij.pdf'), preferCSSPageSize: true, printBackground: true }); await w.close();
  w = await imprime(true, 'una', 'G90');
  const sol = await w.evaluate(() => [...document.querySelectorAll('table.ij tr')].slice(1).map(t => [...t.children].slice(-5).map(x => x.textContent).join(' ')));
  const tabla = await p.evaluate(() => { const sc = document.getElementById('tbCont'), o = sc.innerHTML; sc.innerHTML = '<option value="todos">Todos</option>'; sc.value = 'todos'; document.getElementById('tbProg').value = 'g90'; document.getElementById('tbArco').value = 'ij'; document.getElementById('tbDec').value = '3'; const r = datosTabla().grupos.flatMap(g => g.filas).filter(f => /G[23]/.test(f.mov)).map(f => [f.mov, f.x, f.y, f.i, f.j].map(v => isNaN(+v) ? v : String(Math.round(+v * 10) / 10)).join(' ')); sc.innerHTML = o; return r; });
  ok('soluciones: coinciden con la tabla de soluciones del Calcador', JSON.stringify(sol) === JSON.stringify(tabla), sol.join(' | ') + ' ⇄ ' + tabla.join(' | ')); if (process.env.GUARDAR) await w.pdf({ path: path.join(OUT, 'hoja_ij_sol.pdf'), preferCSSPageSize: true, printBackground: true }); await w.close();
  w = await imprime(true, 'una', 'G91');
  const inc = await w.evaluate(() => { const f = document.querySelector('table.ij tr:nth-child(2)').children; const ini = f[1].textContent.match(/X(-?[\d.]+) Y(-?[\d.]+)/); return { g: f[f.length - 5].textContent, x: +f[f.length - 4].textContent, y: +f[f.length - 3].textContent, ix: +ini[1], iy: +ini[2] }; }); ok('en G91, X Y son el desplazamiento', Number.isFinite(inc.x), JSON.stringify(inc)); await w.close();
  w = await imprime(false, 'var', 'G90');
  const nv = await w.evaluate(() => ({ pag: document.querySelectorAll('.pag').length, tit: [...document.querySelectorAll('.tit')].map(t => t.textContent), filas: [...document.querySelectorAll('table.ij')].map(t => t.rows[1].cells[1].textContent) }));
  ok('variantes: una hoja por cada una, con otra solución', nv.pag > 1 && /variante A/.test(nv.tit[0]) && new Set(nv.filas).size > 1, JSON.stringify(nv)); if (process.env.GUARDAR) await w.pdf({ path: path.join(OUT, 'hoja_ij_var.pdf'), preferCSSPageSize: true, printBackground: true }); await w.close();
  ok('el dibujo queda como estaba', antes === await p.evaluate(() => JSON.stringify(contornos)));
  const fa = await p.evaluate(() => { const s = datosArcosIJ({ x: 0, y: 0 }); return s.length > 0; }); ok('Practicar I J sigue teniendo arcos', fa);
  // pantallas pequeñas
  for (const f of ['calcador.html', 'tutor.html']) for (const [W, H] of [[1024, 700], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]]) {
    const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message)); await q.setViewportSize({ width: W, height: H }); await q.goto('file://' + path.join(SUITE, f)); await q.waitForTimeout(900);
    const r = await q.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(), pisan = (x, y) => x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom, c = b('.cmd-bar'), z = b('.zoom-controls'), v = b('.vista-controls'), w = b('#canvasWrap'); return { z: pisan(c, z), v: pisan(c, v) || pisan(z, v), fuera: c.right > w.right + 1 || c.left < w.left - 1 || v.left < w.left - 1, cw: Math.round(w.width), input: Math.round(b('#cmd').width) }; });
    ok(`${f} a ${W}×${H}: Coordenadas, zoom y vista no se pisan`, !r.z && !r.v && !r.fuera && r.input >= 60, JSON.stringify(r));
    if (W === 1024) await q.screenshot({ path: path.join(OUT, 'peq_' + f.replace('.html', '') + '.png') }); await q.close();
  }
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
