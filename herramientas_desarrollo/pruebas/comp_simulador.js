// Programas de ⚙️ Mecanizar con G41/G42 en el Simulador: la trayectoria COMPENSADA (la que dibuja el Simulador)
// debe tocar todo el contorno (donde la fresa cabe) con el borde de la fresa y no meterse nunca en la pieza.
// Uso: node comp_simulador.js [plano.json] [programa.nc ...]   (sin .nc: genera los programas con el Calcador)
const { lanzar, fs, path, SUITE } = require('./comun');
const PIEZA = process.argv[2] || process.env.PIEZA || path.join(__dirname, 'Prueba01.json');
const EXTRA = process.argv.slice(3);
const CFGS = (process.env.CFGS ? JSON.parse(process.env.CFGS) : [
  { comp:'auto', coord:'G90' }, { comp:'auto', coord:'G91' }, { comp:'auto', coord:'mixta' },
  { comp:'auto', coord:'G90', paso:'1' }, { comp:'auto', coord:'G90', acab:'0.5' }, { comp:'auto', coord:'mixta', paso:'1.5', acab:'0.5' },
  { comp:'auto', coord:'G90', estr:'concordancia' }, { comp:'auto', coord:'G91', estr:'oposicion' },
  { comp:'G41', coord:'G90' }, { comp:'G42', coord:'G90' }, { comp:'G40', coord:'G90' }, { comp:'G40', coord:'mixta' },
]);
(async () => {
  const b = await lanzar(); const errs = [];
  const json = JSON.parse(fs.readFileSync(PIEZA, 'utf8'));
  const progs = [];
  if (!process.env.SOLO_EXTRA) {
    const cal = await b.newPage({ viewport:{ width:1440, height:900 } }); cal.on('pageerror', e => errs.push('cal: ' + e.message)); cal.on('dialog', d => d.accept());
    await cal.goto('file://' + path.join(SUITE, 'calcador.html')); await cal.evaluate(() => localStorage.clear()); await cal.reload(); await cal.waitForTimeout(700);
    await cal.setInputFiles('#fileJSON', PIEZA); await cal.waitForTimeout(500);
    await cal.evaluate(() => abrirMec()); await cal.waitForTimeout(300);
    for (const c of CFGS) {
      await cal.evaluate(c => { cfgMec.paso = +(c.paso || cfgMec.prof); cfgMec.acab = +(c.acab || 0); cfgMec.coord = c.coord; cfgMec.comp = c.comp; cfgMec.estr = c.estr || 'plano'; pintarCamposMec(); generarMec(); }, c);
      await cal.waitForTimeout(150);   // el aviso del lado se calcula justo después de pintar la ventana
      // con G41 o G42 en todos, los contornos del lado equivocado se meten en la pieza a propósito (para enseñarlo): el Calcador lo avisa
      const extra = await cal.evaluate(() => { const nc = document.getElementById('mecTexto').value, lin = nc.split('\n');
        const aviso = [...document.querySelectorAll('#mecResumen .mec-aviso')].map(e => e.innerText).find(t => /lado equivocado/.test(t)) || '';
        const tipos = [...aviso.matchAll(/\((exterior|interior)\)/g)].map(m => m[1].toUpperCase());
        const bloques = []; lin.forEach((l, i) => { const m = l.match(/Trazado \d+\/\d+ — (EXTERIOR|INTERIOR|ABIERTO)/); if (m) bloques.push({ desde: i + 1, tipo: m[1] }); });
        bloques.forEach((bq, k) => bq.hasta = k + 1 < bloques.length ? bloques[k + 1].desde - 1 : lin.length);
        return { nc, aviso, malas: bloques.filter(bq => tipos.includes(bq.tipo)) }; });
      progs.push({ nombre: Object.entries(c).map(([k, v]) => k + '=' + v).join(' '), nc: extra.nc, forzada: c.comp === 'G41' || c.comp === 'G42', aviso: extra.aviso, malas: extra.malas });
    }
  }
  EXTRA.forEach(f => progs.push({ nombre: path.basename(f), nc: fs.readFileSync(f, 'utf8') }));
  const sim = await b.newPage({ viewport:{ width:1440, height:900 } }); sim.on('pageerror', e => errs.push('sim: ' + e.message)); sim.on('dialog', d => d.accept());
  await sim.goto('file://' + path.join(SUITE, process.env.SIM || 'simulador3d.html')); await sim.waitForTimeout(1200);
  let fallos = 0;
  for (const p of progs) {
    const r = await sim.evaluate(({ nc, json }) => {
      cargarGcodeTexto(nc, 'prueba.nc'); cargarPlano(json, 'plano');
      const R = diametroFresa / 2, tol = 0.06;
      // centro de la fresa cortando (bajo Z0), densificado
      const C = []; for (let i = 1; i < puntosPlanos.length; i++) { const a = puntosPlanos[i - 1], q = puntosPlanos[i]; if (!(a.z < -1e-6 && q.z < -1e-6)) continue; const n = Math.max(1, Math.ceil(Math.hypot(q.x - a.x, q.y - a.y) / 0.1)); for (let k = 0; k <= n; k++) C.push({ x:a.x + (q.x - a.x) * k / n, y:a.y + (q.y - a.y) * k / n, movIdx:q.movIdx }); }
      // se mete en la pieza: el centro a menos de R del contorno o dentro de la pieza
      const mal = new Set(); let peor = Infinity;
      const abiertos = plano.trazados.filter(t => !t.cerrado), enGrabado = c => abiertos.some(t => { for (let k = 0; k + 1 < t.m.length; k++) if (distASegPlano(c, t.m[k], t.m[k + 1]) < 0.06) return true; return false; });
      // solo los movimientos con G41/G42 y su salida con G40 (las cajeras y los grabados van calculados en G40)
      const conComp = k => { const m = gcodeMoves[k]; return m && (m.comp !== 40 || (k > 0 && gcodeMoves[k - 1].comp !== 40)); };
      C.forEach(c => { if (enGrabado(c) || !conComp(c.movIdx)) return; const d = distPlano(c); if (d < peor) peor = d; if (d < R - tol || (enPiezaPlano(c) && d > tol)) mal.add(gcodeMoves[c.movIdx].linea); });
      // cubierto: cada punto del contorno a distancia R de algún centro
      let tot = 0, sin = 0; const huecos = [];
      plano.trazados.forEach((t, ti) => { for (let k = 0; k + 1 < t.m.length; k++) { const a = t.m[k], q = t.m[k + 1], L = Math.hypot(q.x - a.x, q.y - a.y), n = Math.max(1, Math.ceil(L / 0.5));
        const nl = L ? { x:-(q.y - a.y) / L, y:(q.x - a.x) / L } : { x:0, y:0 };
        for (let s = 0; s < n; s++) { const m = { x:a.x + (q.x - a.x) * (s + 0.5) / n, y:a.y + (q.y - a.y) * (s + 0.5) / n }; let mn = Infinity;
          // solo cuenta donde la fresa cabe (en las esquinas interiores de la pieza queda el radio de la fresa)
          const fuera = [1, -1].filter(sg => !enPiezaPlano({ x:m.x + sg * nl.x * 0.05, y:m.y + sg * nl.y * 0.05 }));
          if (fuera.length === 1) { const c = { x:m.x + fuera[0] * nl.x * R, y:m.y + fuera[0] * nl.y * R }; if (distPlano(c) < R - 0.03 || enPiezaPlano(c)) continue; } for (const c of C) { const d = Math.hypot(c.x - m.x, c.y - m.y); if (d < mn) mn = d; }
          tot += L / n; if (mn > R + tol) { sin += L / n; if (huecos.length < 3) huecos.push(`T${ti + 1} (${m.x.toFixed(1)},${m.y.toFixed(1)}) a ${(mn - R).toFixed(2)}`); } } } });
      const sinG40 = gcodeMoves.length && gcodeMoves[gcodeMoves.length - 1].comp !== 40;
      return { cub: 100 * (1 - sin / tot), mal:[...mal].sort((a, b) => a - b), peor: peor - R, huecos, sinG40, avisos: avisosCompensacion.length, evalTxt: document.getElementById('planoEval').innerText.split('\n')[0] };
    }, { nc:p.nc, json });
    let ok = r.cub > 99.9 && !r.mal.length && !r.sinG40, nota = '';
    if (p.forzada && !ok) {   // lado equivocado a propósito: vale si el Calcador lo avisa y solo se mete el contorno avisado
      const fuera = r.mal.filter(l => !p.malas.some(bq => l >= bq.desde && l <= bq.hasta));
      ok = !!p.aviso && p.malas.length > 0 && !fuera.length && !r.sinG40;
      nota = ok ? `(esperado: ${p.aviso.match(/el contorno[^:]*:/)[0].replace(/:$/, '')}, y el Calcador lo avisa) · ` : `(${p.aviso ? 'se mete fuera del contorno avisado: líneas ' + fuera.join(',') : 'el Calcador NO avisa del lado equivocado'}) · `;
    }
    if (!ok) fallos++;
    console.log(`${ok ? '✓' : '✗'} ${p.nombre.padEnd(44)} ${nota}contorno cortado ${r.cub.toFixed(1).padStart(5)} % · se mete en la pieza: ${r.mal.length ? 'líneas ' + r.mal.slice(0, 8).join(',') : 'no'} · ${r.sinG40 ? 'SIN G40 al final · ' : ''}${r.huecos.join(' | ')}`);
  }
  console.log(`${progs.length} programas · fallos ${fallos}`); if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
