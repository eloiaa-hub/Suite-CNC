// Calcador v128: opción «G91 total» (Solución, Tutor y ventana de Mecanizar) y cotas «desde el cero» editables.
const { lanzar, path, SUITE, fs } = require('./comun');
// Interpreta un programa: posición final, puntos visitados y líneas en absolutas con movimiento
function corre(txt) {
  let abs = true, p = { X:null, Y:null, Z:null }, q = { X:0, Y:0, Z:0 }; const pts = [], absMov = [];
  txt.split('\n').forEach(l0 => { const l = l0.split(';')[0].replace(/\(.*\)/, '').trim(); if (!l) return; if (/\bG91\b/.test(l)) abs = false; if (/\bG90\b/.test(l)) abs = true;
    const w = {}; (l.match(/[XYZ]-?[\d.]+/g) || []).forEach(t => { w[t[0]] = +t.slice(1); }); if (!Object.keys(w).length) return;
    if (abs) absMov.push(l); for (const k of 'XYZ') if (k in w) q[k] = abs ? w[k] : q[k] + w[k]; pts.push({ ...q }); });
  return { fin: q, pts, absMov };
}
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  for (const prog of ['calcador.html', 'tutor.html']) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(SUITE, prog)); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const out = []; (typeof TU_EJEMPLOS === 'undefined' ? [] : TU_EJEMPLOS).forEach((e, i) => { tuCargarEjemplo(i); TU.ejercicio = null; for (const [comp, paso] of [['G40', 3], ['auto', 3], ['G40', 1.5]]) { Object.assign(cfgMec, { coord:'G91T', comp, prof:3, paso }); const g = tuGenerar(); out.push({ i, comp, paso, t:g.texto, n:g.etiquetas.filter(q => q.tipo !== 'fuera' && q.tipo !== 'entrada').map(q => q.p) }); } }); return out; });
    const mal = [];
    r.forEach(x => { const c = corre(x.t); const cerca = (a, b) => Math.abs(a - b) < 2e-3;
      const absBien = c.absMov.join('|') === 'G0 Z20|G0 X0 Y0';
      const finBien = cerca(c.fin.X, 0) && cerca(c.fin.Y, 0) && cerca(c.fin.Z, 20);
      const visita = x.n.every(q => c.pts.some(v => cerca(v.X, q.x) && cerca(v.Y, q.y)));
      const z = c.pts.some(v => cerca(v.Z, -3));
      if (!absBien || !finBien || !visita || !z || !/\nG90\s/.test(x.t)) mal.push(`${x.i}/${x.comp}/${x.paso}: abs ${c.absMov.join('|')} fin ${JSON.stringify(c.fin)} visita ${visita} z ${z}`); });
    if (r.length) ok(`${prog}: ${r.length} programas en G91 total: solo el punto de partida en absolutas, vuelve al cero, pasa por todo`, !mal.length, mal.slice(0, 2).join(' || '));
    const sel = await p.evaluate(() => [...document.querySelectorAll('#tuCoord option')].map(o => o.value).join());
    ok(`${prog}: las cuatro opciones`, sel === 'G90,G91,G91T,mixta', sel);
    const viejo = await p.evaluate(() => { confirm = () => true; if (typeof TU_EJEMPLOS !== 'undefined' && TU_EJEMPLOS.length) tuCargarEjemplo(2); else usarPiezaC(1000); TU.ejercicio = null; Object.assign(cfgMec, { coord:'G91', comp:'G40', prof:3, paso:3 }); return tuGenerar().texto; });
    ok(`${prog}: el G91 de siempre no cambia`, /\(la Z, en G90\)/.test(viejo) && !/deja la máquina/.test(viejo));
    ok(`${prog}: sin errores de JavaScript`, !errs.length, errs.join(' | '));
    if (prog === 'calcador.html') {
      // el ejercicio del informe
      const ej = { pts:[{x:50,y:100},{x:180,y:100},{x:180,y:0},{x:50,y:0}], b:[0,-1,0,-1], cerrado:true, tipo:'auto' }, in1 = { pts:[{x:70,y:55},{x:70,y:75},{x:90,y:75},{x:90,y:55}], b:[0,-1,0,-1], cerrado:true, tipo:'auto' };
      const t = await p.evaluate(([a, c]) => { confirm = () => true; contornos = [a, c].map(x => JSON.parse(JSON.stringify(x))); asegurarUids(); TU.ejercicio = null; Object.assign(cfgMec, { coord:'G91T', comp:'G40', prof:3, paso:3, zSeg:20 }); return tuGenerar().lineas.filter(l => !l.sep && !l.titulo).map(l => l.cod); }, [ej, in1]);
      const esp = ['G71 G90','T101 M06','S12000 M03','G0 Z20','G0 X0 Y0','G91 G0 X70 Y55','G1 Z-23 F300','G1 X0 Y20 F1000','G2 X20 Y0 I10 J0','G1 X0 Y-20','G2 X-20 Y0 I-10 J0','G0 Z23','G0 X-20 Y45','G1 Z-23 F300','G1 X130 Y0 F1000','G2 X0 Y-100 I0 J-50','G1 X-130 Y0','G2 X0 Y100 I0 J50','G0 Z23','G0 X-50 Y-100','G90','M05','M30'];
      ok('el ejercicio 58472 sale como se espera', JSON.stringify(t) === JSON.stringify(esp), t.join(' / '));
      // la ventana de Mecanizar, con y sin compensación y con pasadas: mismo criterio
      for (const [comp, paso, n] of [['G40', 3, 1000], ['auto', 1.5, 1007], ['G40', 1.5, 1023]]) {
        const nc = await p.evaluate(([comp, paso, n]) => { usarPiezaC(n); Object.assign(cfgMec, { coord:'G91T', comp, prof:3, paso, zSeg:20 }); generarMec(); const t = document.getElementById('mecTexto'); return t.value !== undefined ? t.value : t.textContent; }, [comp, paso, n]);
        const c = corre(nc), lim = c.absMov.map(l => l.replace(/ F\d+/, '')).join('|');
        ok(`Mecanizar ${n} ${comp} pasada ${paso}: solo el punto de partida en absolutas y vuelve al cero`, lim === 'G0 Z20|G0 X0 Y0' && Math.abs(c.fin.X) < .01 && Math.abs(c.fin.Y) < .01 && c.pts.some(v => Math.abs(v.Z + 3) < .01), lim + ' fin ' + JSON.stringify(c.fin));
      }
      // cotas editables
      const ed = await p.evaluate(([a0, c0]) => {
        contornos = [a0, c0].map(x => JSON.parse(JSON.stringify(x))); asegurarUids(); cotasManuales = []; cotasAjuste = {};
        const refs = () => { const r = construirCotas(contornos, tiposResueltos(), 1 / view.z, 'todo', { x:0, y:0 }, {}); return r.T.filter(t => t.ref && t.ref.tipo === 'zc').map(t => t.ref); };
        const res = {}; cfgCotas.dist = 'cero'; cfgCotas.ver = true; guardarUndo = guardarUndo;
        const f = (k, e) => refs().find(r => r.eje === e && r.k.startsWith(k));
        let r = f('f70', 'x') || f('f80', 'x'); res.todos = refs().map(x => x.eje + x.k + '=' + x.valor + (x.acc ? '' : '(no)')).join(' ');
        const h0 = contornos[1].pts[0].x; r = refs().find(x => x.eje === 'y' && x.valor === 55); res.err1 = aplicarCota(r, 40); res.hueco = contornos[1].pts.map(q => q.y).join();
        r = refs().find(x => x.k.startsWith('ran1')) ; res.err2 = aplicarCota(r, 30); res.ran = contornos[1].pts.map(q => q.y).join();
        r = refs().find(x => x.k.startsWith('ran0')); res.err3 = aplicarCota(r, 100); res.ext = contornos[0].pts.map(q => q.x).join();
        deshacer(); res.ext2 = contornos[0].pts.map(q => q.x).join();
        return res; }, [ej, in1]);
      ok('cambiar la situación de un agujero lo mueve entero', !ed.err1 && ed.hueco === '40,60,60,40', ed.hueco);
      ok('cambiar la longitud de la ranura la alarga', !ed.err2 && /70/.test(ed.ran), ed.ran);
      ok('cambiar el largo de la ranura exterior, y deshacer', !ed.err3 && ed.ext === '50,150,150,50' && ed.ext2 === '50,180,180,50', ed.ext + ' → ' + ed.ext2);
      // en un contorno sencillo: todas las medidas se pueden cambiar y no rompen la pieza
      const rot = await p.evaluate(() => { const fal = []; for (const n of [1000, 1007, 1023, 1041, 1066]) { usarPiezaC(n); cotasManuales = []; cfgCotas.ver = true; cfgCotas.dist = 'cero'; const T = () => construirCotas(contornos, tiposResueltos(), 1 / view.z, 'todo', { x:0, y:0 }, {}).T.filter(t => t.ref && t.ref.tipo === 'zc').map(t => t.ref); const L = T().map(r => r.eje + r.k); for (const c of L) { const r = T().find(x => x.eje + x.k === c); if (!r) continue; if (!r.acc) continue; const v0 = r.valor, e = aplicarCota(r, v0 + 1); if (e) { fal.push(n + c + ':' + e); continue; } const nv = T().find(x => x.valor === v0 + 1 && x.eje === r.eje); if (!nv) fal.push(n + c + ': no cambia a ' + (v0 + 1)); deshacer(); } } return fal; });
      ok('5 contornos sencillos: cada cota de fila, chaflán y cuerda cambia al valor pedido', !rot.length, rot.slice(0, 5).join(' | '));
    }
    await p.close();
  }
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
