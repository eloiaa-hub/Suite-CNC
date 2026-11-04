// Calcador v127: las cotas automáticas se reparten como las de Contornos sencillos, y los archivos antiguos siguen por lados.
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => { localStorage.clear(); confirm = () => true; }); await p.reload(); await p.waitForTimeout(1000); await p.evaluate(() => { confirm = () => true; });
  ok('por defecto, desde el cero', await p.evaluate(() => cfgCotas.dist === 'cero' && document.getElementById('selDist').value === 'cero'));
  const medidas = () => p.evaluate(() => { const r = construirCotas(contornos, tiposResueltos(), 1 / view.z, cfgCotas.nivel, { x:0, y:0 }, {}); return r.T.filter(t => t.ref).map(t => t.s.replace(/^\d+×/, '')); });
  const sobra = (a, c) => { const q = c.slice(), f = []; a.forEach(x => { const i = q.indexOf(x); if (i < 0) f.push(x); else q.splice(i, 1); }); return f; };
  for (const n of [1000, 1007, 1023, 1041, 1066]) {
    const r = await p.evaluate(n => { const O = pcOpciones(); usarPiezaC(n); return { sencillas: cotasManuales.length, ok: contornos.length > 0 }; }, n);
    const man = await p.evaluate(() => { cfgCotas.ver = false; const r = construirCotas(contornos, tiposResueltos(), 1 / view.z, cfgCotas.nivel, { x:0, y:0 }, { }); return r.T.filter(t => t.ref && t.ref.tipo === 'man').map(t => t.s); });
    await p.evaluate(() => { cotasManuales = []; cfgCotas.ver = true; cfgCotas.dist = 'cero'; });
    const aut = await medidas();
    const falta = sobra(man, aut), extra = sobra(aut, man);
    ok(`Nº ${n}: las mismas medidas que Contornos sencillos`, !falta.length && !extra.length, `${man.length} cotas${falta.length ? ' · faltan ' + falta : ''}${extra.length ? ' · sobran ' + extra : ''}`);
  }
  // Reparto: filas por el lado del cero, de menor a mayor, y el total el último
  const fil = await p.evaluate(() => { usarPiezaC(1000); cotasManuales = []; cfgCotas.ver = true; cfgCotas.dist = 'cero'; const r = construirCotas(contornos, tiposResueltos(), 1 / view.z, 'todo', { x:0, y:0 }, {}); return r.T.filter(t => t.ref && (t.ref.tipo === 'zc' && /^f/.test(t.ref.k) || t.ref.tipo === 'tot')).map(t => ({ e: t.ref.eje, v: t.ref.valor, y: t.p.y, x: t.p.x, t: t.ref.tipo })); });
  const X = fil.filter(f => f.e === 'x');
  ok('filas ordenadas, y el total fuera del todo', X.every((f, i) => !i || (f.v > X[i - 1].v && f.y < X[i - 1].y)) && X[X.length - 1].t === 'tot', X.map(f => f.v).join(' '));
  // Un cambio de cero no descuadra y las opciones funcionan
  ok('Solo radios y totales: sin filas', await p.evaluate(() => { const r = construirCotas(contornos, tiposResueltos(), 1 / view.z, 'basico', { x:0, y:0 }, {}); return !r.T.some(t => t.ref && t.ref.tipo === 'zc') && r.T.some(t => t.ref && t.ref.tipo === 'tot'); }));
  ok('ocultar una cota de fila', await p.evaluate(() => { const T = () => construirCotas(contornos, tiposResueltos(), 1 / view.z, 'todo', { x:0, y:0 }, {}).T.filter(t => t.ref && t.ref.tipo === 'zc'); const a = T(), k = cotaClave(a[0].ref); cotasAjuste[k] = { oculta:true }; const n = T().length; delete cotasAjuste[k]; return n === a.length - 1; }));
  // Archivo antiguo
  const dir = path.join(SUITE, 'biblioteca_inicio/Nivel 1 - Rectas'), js = fs.readdirSync(dir).filter(x => x.endsWith('.json'))[0];
  const ant = await p.evaluate(t => { abrirJSONDatos(JSON.parse(t)); return [cfgCotas.dist, document.getElementById('selDist').value]; }, fs.readFileSync(path.join(dir, js), 'utf8'));
  ok('un ejercicio antiguo sigue por lados', ant.join() === 'lados,lados', ant.join());
  const nuevo = await p.evaluate(() => { cfgCotas.dist = 'cero'; const d = JSON.parse(JSON.stringify(cfgCotas)); cfgCotas.dist = 'lados'; asignarCfg(cfgCotas, d); return cfgCotas.dist; });
  ok('se guarda el reparto elegido', nuevo === 'cero');
  await p.evaluate(() => { cfgCotas.ver = true; render(); }); const svg = await p.evaluate(() => { const c = document.getElementById('chkCotasSVG'), a = c.checked; c.checked = true; const s = exportarSVG(true, false) || ''; c.checked = a; return s.length; }); ok('se exporta al SVG', svg > 500);
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
