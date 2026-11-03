// Simuladores con T… M06: herramienta de cada tramo (compensación, corte, fresa dibujada) y revisión
const { lanzar, path, SUITE, fs } = require('./comun');
const NC = process.argv[2] || path.join(require('os').tmpdir(), 'dos_herramientas.nc');
(async () => {
  const b = await lanzar(); const errs = []; let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const nc = fs.readFileSync(NC, 'utf8');
  for (const sim of ['simulador3d.html']) {
    const p = await b.newPage({ viewport:{ width:1300, height:850 } }); p.on('pageerror', e => errs.push(sim + ': ' + e.message));
    await p.goto('file://' + path.join(SUITE, sim)); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
    const r = await p.evaluate(nc => {
      cargarGcodeTexto(nc, 'dos.nc');
      const t102 = gcodeMoves.filter(m => m.herr && m.herr.T === 102), t101 = gcodeMoves.filter(m => m.herr && m.herr.T === 101);
      // el círculo interior (centro 50,50, R20) con T102 compensada por dentro: el centro de la fresa a R 18,5
      const pts = puntosPlanos.filter(q => q.z < -1e-6 && gcodeMoves[q.movIdx].herr && gcodeMoves[q.movIdx].herr.T === 102 && gcodeMoves[q.movIdx].comp !== 40);
      const ds = pts.map(q => Math.hypot(q.x - 50, q.y - 50));
      const rev = revisarPrograma().map(x => x.nivel + ': ' + x.msg.slice(0, 70));
      // fresa dibujada y panel
      const i102 = puntosPlanos.findIndex(q => gcodeMoves[q.movIdx].herr && gcodeMoves[q.movIdx].herr.T === 102);
      moverHerramientaA(i102 + 2); const info2 = document.getElementById('infoHerr').textContent, d2 = diamVista;
      moverHerramientaA(5); const info1 = document.getElementById('infoHerr').textContent, d1 = diamVista;
      return { n102: t102.length, n101: t101.length, rmin: Math.min(...ds), rmax: Math.max(...ds), rev, info1, info2, d1, d2, panel: diametroFresa };
    }, nc);
    ok(`${sim}: tramos con T101 y con T102`, r.n101 > 0 && r.n102 > 0, `${r.n101} / ${r.n102}`);
    ok(`${sim}: el interior con T102 compensado a 1,5 mm (radio del centro 18,5)`, Math.abs(r.rmin - 18.5) < 0.05 && Math.abs(r.rmax - 18.5) < 0.05, `${r.rmin.toFixed(3)}–${r.rmax.toFixed(3)}`);
    ok(`${sim}: la fresa dibujada y el panel cambian con el M06`, r.d1 === 6 && r.d2 === 3 && /T101/.test(r.info1) && /T102/.test(r.info2), `${r.info1} → ${r.info2}`);
    ok(`${sim}: revisión sin errores del cambio`, !r.rev.some(x => /M06|husillo|M05/.test(x)), r.rev.join(' | '));
    const revDe = t => p.evaluate(t => { cargarGcodeTexto(t, 'x.nc'); return revisarPrograma().map(x => x.nivel + ': ' + x.msg); }, t);
    let v = await revDe(nc.replace(/\nM05[^\n]*\n(T102 M06)/, '\n$1'));
    ok(`${sim}: sin M05 → aviso`, v.some(x => /^aviso: .*falta M05/.test(x)));
    v = await revDe(nc.replace(/(T102 M06[^\n]*\n)S16000 M03[^\n]*\n/, '$1'));
    ok(`${sim}: sin M03 tras el cambio → error`, v.some(x => /^error: Corta con el husillo parado/.test(x)), v.filter(x => /husillo/.test(x)).join(' | '));
    v = await revDe(nc.replace(/(\nM05[^\n]*\nT102 M06)/, '\nG1 Z-1 F300$1'));
    ok(`${sim}: M06 con la fresa abajo → error`, v.some(x => /^error: Cambio de herramienta \(M06\) con la fresa (abajo|dentro)/.test(x)));
    v = await revDe(nc.replace(/T102 M06/, 'T109 M06'));
    ok(`${sim}: T que no está en la base → aviso`, v.some(x => /T109 no está en la base/.test(x)));
    v = await revDe(nc.replace(/\nM05[^\n]*\n(T102 M06)/, '\nG28 Z0\nM05\n$1'));
    ok(`${sim}: G28 → aviso`, v.some(x => /G28 depende del control/.test(x)));
    // un programa sin M06 de una herramienta sigue igual
    v = await revDe('G90\nT101\nM3 S12000\nG0 Z20\nG0 X0 Y0\nG1 Z-3 F500\nG1 X50\nG0 Z20\nM5\nM30');
    ok(`${sim}: programa sin M06 (T101 sola): sin avisos nuevos`, !v.some(x => /M06|husillo|base/.test(x)), v.join(' | '));
    await p.evaluate(nc => { cargarGcodeTexto(nc, 'dos.nc'); document.getElementById('anchoCorte').value = 'real'; cambiarAnchoCorte(); irAlFinal(); ponerVista('planta'); }, nc); await p.waitForTimeout(600);
    if (sim === 'simulador3d.html') await p.screenshot({ path: path.join(require('os').tmpdir(), 'sim_m06.png'), clip: await p.locator('#viewport').boundingBox() });
    await p.close();
  }
  console.log(`fallos ${fallos}`, errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
