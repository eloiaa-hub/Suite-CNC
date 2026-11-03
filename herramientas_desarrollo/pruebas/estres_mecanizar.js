// Estrés de «⚙️ Mecanizar»: operaciones y parámetros al azar sobre todos los ejercicios
const { lanzar, abrir, ejercicios, fs } = require('./comun');
const semilla = +(process.argv[2] || 1), N = +(process.argv[3] || 150); let x = semilla;
const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }, pick = a => a[Math.floor(rnd() * a.length)];
(async () => { const b = await lanzar(); const cal = await abrir(b, 'calcador.html'); const fs_ = ejercicios(); const fallos = []; const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const f = pick(fs_); let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; } if (!d.calcador) continue;
    const cfg = { prof: pick([3, 6, 19, 0.5, 40]), paso: pick([1, 2, 3, 0.05, 50]), acab: pick([0, 0, 0.3, 1, 5]), d: pick([6, 3, 0.2, 12, 30]), coord: pick(['G90', 'G91']), comp: pick(['G40', 'auto', 'G41', 'G42']), estr: pick(['plano', 'concordancia', 'oposicion']), zSeg: pick([20, 5, 100]),
      ops: Array.from({ length: 12 }, () => ({ op: pick(['corte', 'corte', 'grabado', 'cajera', 'isla']), prof: pick([null, null, 1, 4, 25]), pz: rnd() < 0.3 ? { n: pick([1, 3, 6]), ancho: pick([3, 5]), alto: pick([1, 2, 30]) } : null, estr: pick(['concentrica', 'zigzag']), entrada: pick(['vertical', 'rampa']) })) };
    fs.writeFileSync('/tmp/estres_actual.json', JSON.stringify({ f, cfg })); fs.writeFileSync('/tmp/estres_caso_' + i + '.json', JSON.stringify({ f, cfg }));
    const r = await cal.evaluate(([d, c]) => {
      try {
        abrirJSONDatos(d); memoTipos = null; cfgFresa.d = c.d;
        contornos.forEach((k, j) => { if (!k.cerrado) return; const o = c.ops[j % c.ops.length]; k.mec = { op:o.op, prof:o.prof, caj:{ estr:o.estr, paso:50, entrada:o.entrada }, puentes:o.pz || { n:0, ancho:5, alto:2 } }; });
        Object.assign(cfgMec, { prof:c.prof, paso:c.paso, acab:c.acab, coord:c.coord, comp:c.comp, estr:c.estr, zSeg:c.zSeg });
        abrirMec(); const t0 = performance.now(); generarMec(); const ms = performance.now() - t0; cerrarMec();
        if (!ultimoMec) return { aviso: document.getElementById('mecResumen').innerText.slice(0, 90) };
        const nc = ultimoMec.nc; if (/NaN|Infinity|undefined/.test(nc)) return { err: 'valores inválidos' };
        const p = interpretarISO(nc); const errs = p.notas.filter(n => n.tipo === 'error').map(n => n.msg.slice(0, 80));
        const maxProf = Math.max(c.prof, ...contornos.map(k => (k.mec && +k.mec.prof > 0) ? +k.mec.prof : 0));
        let zmin = 0; p.segs.forEach(s => { [s.z0, s.z1].forEach(z => { if (z !== null && z < zmin) zmin = z; }); }); (p.movZ || []).forEach(m => { if (m.z1 < zmin) zmin = m.z1; });
        const rapBajo = p.segs.some(s => s.rapido && ((s.z0 !== null && s.z0 < -1e-6) || (s.z1 !== null && s.z1 < -1e-6)));
        return { ms, errs, hondo: zmin < -maxProf - 1e-6 ? `baja a ${zmin} y lo más hondo pedido es ${maxProf}` : null, rapBajo, bloques: nc.split('\n').length };
      } catch (e) { return { err: 'EXCEPCIÓN ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    }, [d, cfg]);
    fs.appendFileSync('/tmp/estres_t.txt', `${i} ${r.ms ? Math.round(r.ms) : '-'} ${r.bloques || ''} ${JSON.stringify(cfg).slice(0, 110)} ${f.split('/').pop()}\n`);
    const id = `${f.split('/').pop()} Ø${cfg.d} prof ${cfg.prof} paso ${cfg.paso} ${cfg.coord} ${cfg.comp}`;
    if (r.err) fallos.push(`${id}: ${r.err}`);
    else if (!r.aviso) { if (r.errs.length) fallos.push(`${id}: el intérprete marca ${r.errs[0]}`); if (r.hondo) fallos.push(`${id}: ${r.hondo}`); if (r.rapBajo) fallos.push(`${id}: rápido bajo la superficie`); if (r.ms > 3000) fallos.push(`${id}: lento ${Math.round(r.ms)} ms`); }
  }
  console.log(`semilla ${semilla}: ${N} casos en ${Math.round((Date.now() - t0) / 1000)} s · fallos ${fallos.length} · errores de página ${cal.errs.length}`);
  [...new Set(fallos)].slice(0, 8).forEach(x => console.log('  ' + x)); cal.errs.slice(0, 3).forEach(e => console.log('  ERR ' + e));
  await b.close(); })();
