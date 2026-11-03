// Simulador V41: la línea G71 X Y Z de TpaCAD (medidas del tablero) y el programa de prueba de los apuntes de TpaCAD
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.waitForTimeout(1000);
  const de = t => p.evaluate(t => { cargarGcodeTexto(t, 'x.nc'); return { n: gcodeMoves.length, mat: [matCfg.modo, matCfg.lx, matCfg.ly, matCfg.grosor], rev: revisarPrograma().map(r => r.nivel + ': ' + r.msg) }; }, t);
  let r = await de(fs.readFileSync(path.join(__dirname, '../manuales/tpacad/pieza_tpacad.nc'), 'utf8'));
  ok('pieza_tpacad.nc: G71 X160 Y100 Z19 da el material, no un movimiento', r.mat.join() === 'manual,160,100,19' && r.n === 22, JSON.stringify(r.mat) + ' · ' + r.n);
  ok('pieza_tpacad.nc: sin errores; los pasantes de Z-20 en 19 son un aviso', !r.rev.some(x => /^error/.test(x)) && r.rev.some(x => /muerde el tablero mártir/.test(x)), r.rev.join(' | '));
  r = await de('G71 G90\nG0 X10 Y10 Z5\nG1 Z-3 F300\nG1 X50\nM30');
  ok('un programa sin medidas vuelve a material automático', r.mat[0] === 'auto');
  r = await de('G0 X0 Y0 Z5\nG71 X40\nG1 Z-1 F100\nM30');
  ok('G71 X… después de un movimiento sigue siendo un movimiento', r.n === 3 && r.mat[0] === 'auto', r.n);
  r = await de('G71 X100 Y50 Z12\nG0 X10 Y10 Z5\nG1 Z-20 F300\nM30');
  ok('más de 2 mm por debajo del grosor: error', r.rev.some(x => /^error: La fresa baja a Z-20/.test(x)));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
