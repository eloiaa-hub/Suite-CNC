const { chromium } = require('playwright'); const fs = require('fs'); const { lanzar } = require('./comun');
(async () => {
  const b = await lanzar();
  const progs = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'interp_corpus.json'), 'utf8')).concat(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'raros_corpus.json'), 'utf8')));
  const cal = await b.newPage(); cal.on('dialog', d => d.accept()); await cal.goto('file://' + require('./comun').SUITE + '/calcador.html'); await cal.waitForTimeout(500);
  const sim = await b.newPage(); await sim.goto('file://' + require('./comun').SUITE + '/' + (process.argv[2] || 'simulador3d.html')); await sim.waitForTimeout(1000);
  const A = await cal.evaluate(ps => ps.map(p => { try { const r = interpretarISO(p.t), ev = [];
      r.segs.forEach(s => ev.push({ ord:s.ord, x:s.p2.x, y:s.p2.y, z:s.z1, l:s.linea + 1, mid: s.tipo === 'A' ? { x:s.c.x + s.r * Math.cos(s.a1 + s.theta / 2), y:s.c.y + s.r * Math.sin(s.a1 + s.theta / 2) } : null }));
      (r.movZ || []).forEach(m => ev.push({ ord:m.ord, x:m.p.x, y:m.p.y, z:m.z1, l:m.linea + 1, mid:null }));
      ev.sort((a, b) => a.ord - b.ord); return ev; } catch (e) { return 'ERROR ' + e.message; } }), progs);
  const B = await sim.evaluate(ps => ps.map(p => { try { return parsearGcode3D(p.t).map(m => { let mid = null; if (m.arco) mid = muestrearMovimiento(m).map(q => ({ x:q.x, y:q.y })); return { x:m.x, y:m.y, z:m.z, l:m.linea, mid }; }); } catch (e) { return 'ERROR ' + e.message; } }), progs);
  const tol = 0.01, difs = []; let iguales = 0;
  const limpia = arr => { const out = []; let ant = null; arr.forEach(e => { if (ant && Math.hypot(e.x - ant.x, e.y - ant.y) < 1e-9 && (e.z === ant.z || e.z === null || ant.z === null) && !e.mid) return; out.push(e); ant = e; }); return out; };
  progs.forEach((p, i) => {
    if (typeof A[i] === 'string' || typeof B[i] === 'string') { difs.push(`${p.n}: ${A[i]} / ${B[i]}`.slice(0, 160)); return; }
    const a = limpia(A[i]), bb = limpia(B[i]); let msg = null;
    for (let k = 0; k < Math.max(a.length, bb.length); k++) {
      const x = a[k], y = bb[k];
      if (!x || !y) { msg = `distinto número de movimientos (Calcador ${a.length}, Simulador ${bb.length}); sobra el de la línea ${(x || y).l}`; break; }
      if (Math.hypot(x.x - y.x, x.y - y.y) > tol) { msg = `línea ${x.l}/${y.l}: Calcador → (${x.x.toFixed(3)}, ${x.y.toFixed(3)}); Simulador → (${y.x.toFixed(3)}, ${y.y.toFixed(3)})`; break; }
      if (x.z !== null && y.z !== null && Math.abs(x.z - y.z) > tol) { msg = `línea ${x.l}: Z ${x.z} en el Calcador y ${y.z} en el Simulador`; break; }
      if (!!x.mid !== !!y.mid) { msg = `línea ${x.l}: arco en ${x.mid ? 'el Calcador' : 'el Simulador'} y recta en el otro`; break; }
      if (x.mid) { const P = y.mid; let d = Infinity; for (let q = 0; q + 1 < P.length; q++) { const a = P[q], c = P[q + 1], ab = { x:c.x - a.x, y:c.y - a.y }, L = ab.x * ab.x + ab.y * ab.y || 1, t = Math.max(0, Math.min(1, ((x.mid.x - a.x) * ab.x + (x.mid.y - a.y) * ab.y) / L)); d = Math.min(d, Math.hypot(x.mid.x - a.x - t * ab.x, x.mid.y - a.y - t * ab.y)); }
        if (d > (process.env.TOLARC ? +process.env.TOLARC : 0.05)) { msg = `línea ${x.l}: el arco del Calcador pasa por (${x.mid.x.toFixed(2)}, ${x.mid.y.toFixed(2)}), a ${d.toFixed(2)} mm del arco del Simulador (¿sentido o centro distinto?)`; break; } }
    }
    if (msg) difs.push(`${p.n}: ${msg}`); else iguales++;
  });
  console.log(`${progs.length} programas · iguales ${iguales} · con diferencias ${difs.length}`);
  const grupos = {}; difs.forEach(d => { const k = d.split(': ').slice(1).join(': ').replace(/-?\d+(\.\d+)?/g, '#').slice(0, 60); (grupos[k] = grupos[k] || []).push(d); });
  Object.entries(grupos).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => console.log(`\n[${v.length}] ${v.slice(0, 2).join('\n     ')}`));
  fs.writeFileSync(require('path').join(__dirname, 'interp_difs.json'), JSON.stringify(difs, null, 1));
  await b.close(); })();
