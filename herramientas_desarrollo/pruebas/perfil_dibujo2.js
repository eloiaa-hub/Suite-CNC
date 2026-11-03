const { lanzar, abrir, fs } = require('./comun');
(async () => { const b = await lanzar(); const cal = await abrir(b, 'calcador.html');
  const caso = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const d = JSON.parse(fs.readFileSync(caso.f, 'utf8'));
  // instrumentar dibujarMec: marcas de tiempo entre sus líneas
  await cal.evaluate(() => { let src = dibujarMec.toString().split('\n'); window.__T = [];
    src = src.map((l, i) => i > 0 && i < src.length - 1 && /;\s*$/.test(l) && !/^\s*(\/\/|const .*=>.*\{$)/.test(l) ? l + ` window.__T.push([${i}, performance.now()]);` : l);
    window.dibujarMec = eval('(' + src.join('\n') + ')'); });
  console.log(await cal.evaluate(([d, c]) => { abrirJSONDatos(d); cfgFresa.d = c.d; contornos.forEach((k, j) => { if (!k.cerrado) return; const o = c.ops[j % c.ops.length]; k.mec = { op:o.op, prof:o.prof, caj:{ estr:o.estr, paso:50, entrada:o.entrada }, puentes:o.pz || { n:0, ancho:5, alto:2 } }; });
    Object.assign(cfgMec, { prof:c.prof, paso:c.paso, acab:c.acab, coord:c.coord, comp:c.comp, estr:c.estr, zSeg:c.zSeg }); abrirMec(); generarMec();
    window.__T = []; const t0 = performance.now(); dibujarMec(); const src = dibujarMec.toString().split('\n');
    let prev = t0; return window.__T.map(([i, t]) => { const r = [Math.round(t - prev), src[i].trim().slice(0, 70)]; prev = t; return r; }).filter(r => r[0] > 50).map(r => r.join(' ms · ')).join('\n'); }, [d, caso.cfg]));
  await b.close(); })();
