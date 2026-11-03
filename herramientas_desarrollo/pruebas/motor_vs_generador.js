// Comprueba que el motor de mecanizado del Calcador da el mismo recorrido que el Generador (referencia_generador.json)
const { lanzar, abrir, fs, path } = require('./comun');
const DEV = path.resolve(__dirname, '..');
const INYECTAR = process.env.INYECTAR !== '0';    // 1: se inyecta el motor desde dev/ (antes de integrarlo en el Calcador)
(async () => {
  const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencia_generador.json'), 'utf8'));
  const b = await lanzar(); const cal = await abrir(b, 'calcador.html');
  if (INYECTAR) for (const f of ['clipper_bloque.js', 'caj_bloque.js', 'offset_bloque.js', 'motor_mecanizado.js', 'adaptador_calcador.js']) await cal.addScriptTag({ content: fs.readFileSync(path.join(DEV, f), 'utf8') });
  // líneas sin comentarios, con los números en valor
  // (dentro de una cajera los arcos se ajustan sobre una polilínea con 0,005 mm de tolerancia)
  const norma = nc => { let caj = false; return nc.split('\n').map(l => { if (/; ══════ Trazado/.test(l)) caj = /CAJERA/.test(l); const t = l.replace(/;.*$/, '').trim().replace(/^(T\d+) M06$/, '$1').replace(/^M03 /, 'M3 ').replace(/^S(\d+) M03$/, 'M3 S$1').replace(/^M05$/, 'M5'); return t ? (caj ? '¤' + t : t) : ''; }).filter(Boolean); };
  const nums = l => (l.match(/[A-Z]-?[\d.]+/g) || []);
  let iguales = 0; const difs = [];
  for (const r of ref) {
    const out = await cal.evaluate(([d, c]) => {
      abrirJSONDatos({ calcador: d }); cfgMec.orden = 'ext'; memoTipos = null;   // el Generador cortaba los exteriores primero
      return MEC.generar(trazadosParaMecanizar(), { feed:c.F, feedPos:5000, tool:c.T, toolR:c.R, spindle:c.S, zSafe:20, zTotal:c.zt, zStep:c.zs, sobre:c.acab, coord:c.coord, comp:c.comp, estrategia:c.estr, unidades:'G71', orden:'ext', nombre:'x' });
    }, [r.calcador, r.cfg]);
    if (out.error) { difs.push(`${r.ejercicio} ${r.cfg.id}: ERROR ${out.error}`); continue; }
    const A = norma(r.nc), B = norma(out.nc); let msg = null;
    for (let i = 0; i < Math.max(A.length, B.length); i++) {
      const a = A[i] || '', c = B[i] || '';
      if (a === c) continue;
      const na = nums(a), nb = nums(c);
      const mismo = na.length === nb.length && a.replace(/-?[\d.]+/g, '#') === c.replace(/-?[\d.]+/g, '#') && na.every((x, k) => x[0] === nb[k][0] && Math.abs(parseFloat(x.slice(1)) - parseFloat(nb[k].slice(1))) <= (a.startsWith('¤') ? 0.006 : 0.0011));
      if (!mismo) { msg = `línea ${i + 1}: Generador «${a}» · Calcador «${c}»`; break; }
    }
    if (msg) difs.push(`${r.ejercicio} ${r.cfg.id}: ${msg}`); else iguales++;
  }
  console.log(`${ref.length} programas · iguales al Generador ${iguales} · distintos ${difs.length} · errores de página ${cal.errs.length}`);
  const grupos = {}; difs.forEach(d => { const k = d.replace(/^[^:]+: /, '').replace(/-?[\d.]+/g, '#').slice(0, 50); (grupos[k] = grupos[k] || []).push(d); });
  Object.values(grupos).sort((a, b) => b.length - a.length).slice(0, 8).forEach(v => console.log(`  [${v.length}] ${v[0].slice(0, 230)}`));
  cal.errs.slice(0, 3).forEach(e => console.log('  ERR', e));
  await b.close();
})();
