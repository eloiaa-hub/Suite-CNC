// Calcador v122 (prototipo): 📐 Piezas de contorno.
const { lanzar, abrir } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await abrir(b, 'calcador.html'); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const mal = await p.evaluate(() => { const o = []; for (let s = 1; s <= 400; s++) { const P = pcConstruir(s * 97, { red:true, semi:true, pit:true }); if (!P) { o.push(s); continue; } const c = P.cont, t = tramos(c), bb = bboxPts(muestrearContorno(c)); if (!contornoValido(c) || c.pts.length !== c.b.length || t.filter(x => x.b).length !== P.arcos.length || t.some(x => Math.hypot(x.p1.x - x.p2.x, x.p1.y - x.p2.y) < .01) || bb.x0 < -40 || P.W % 10 || P.H % 10) o.push(s); } return o; });
  ok('400 piezas válidas, con medidas redondas', !mal.length, mal.slice(0, 5).join());
  const r = await p.evaluate(() => { abrirGenerador(); abrirPiezaContorno(); usarPiezaC(777); const n = cotasManuales.length, cruces = cotasManuales.filter(m => m.cruz).length, tab = (() => { const sc = document.getElementById('tbCont'); sc.innerHTML = '<option value="todos">Todos</option>'; sc.value = 'todos'; return textoTabla('iso'); })(); const chk = document.getElementById('chkCotasSVG'); chk.checked = true; const svg = exportarSVG(true, false) || ''; const q = cotasManuales.map(m => aPantalla(m.pos)), fuera = q.filter(s => s.x < 0 || s.y < 0 || s.x > W || s.y > H).length; return { n, cruces, g: /G[23] /.test(tab), svg: svg.length, fuera, arcos: tramos(contornos[0]).filter(t => t.b).length, json: JSON.stringify(exportarJSON(true)) }; });
  ok('al usarla, con sus cotas y sus centros', r.n > 2 && r.cruces === r.arcos, `${r.n} cotas`); ok('programa con arcos y plano', r.g && r.svg > 1000); ok('el encuadre incluye las cotas', r.fuera === 0, r.fuera + ' fuera');
  const n2 = await p.evaluate(t => { abrirJSONDatos(JSON.parse(t)); return cotasManuales.length; }, r.json); ok('se conservan al guardar y abrir', n2 === r.n);
  ok('sin errores de JavaScript', !errs.length, errs.join('|')); console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
