// Simulador V44: la fresa del panel (bola, V, Ø) manda sobre la de la base cuando el programa trae T101 M06
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const alt = (x, y) => p.evaluate(([x, y]) => { irAlFinal(); const m = material, i = Math.round((x - m.x0) / m.px), j = Math.round((y - m.y0) / m.py); return +m.alturas[i + j * m.nx].toFixed(2); }, [x, y]);
  const prog = 'G90\nT101 M06\nS12000 M03\nG0 X10 Y30 Z5\nG1 Z-3 F300\nG1 X90 F1000\nG0 Z5\nM05\nM30';
  await p.evaluate(prog => { cargarGcodeTexto(prog, 'p.nc'); document.getElementById('anchoCorte').value = 'real'; cambiarAnchoCorte(); }, prog);
  ok('T101 de la base (plana): fondo plano a 2 mm del eje', await alt(50, 32) === -3);
  await p.selectOption('#tipoFresa', 'bola'); await p.waitForTimeout(150);
  let a = await alt(50, 32); ok('bola Ø6 elegida en el panel: a 2 mm del eje, a −3 + 3 − √5 = −2,24', Math.abs(a + 2.24) < 0.1, a);
  await p.selectOption('#tipoFresa', 'v'); await p.waitForTimeout(150);
  a = await alt(50, 32); ok('V de 90° elegida en el panel: a 2 mm del eje, 2 mm más arriba', Math.abs(a + 1) < 0.15, a);
  await p.click('#anguloV', { clickCount: 3 }); await p.keyboard.type('60'); await p.waitForTimeout(200);
  a = await alt(50, 31); ok('el ángulo se escribe (60) y la V de 60° es más estrecha: a 1 mm del eje, −3 + 1/tan 30° = −1,27', await p.inputValue('#anguloV') === '60' && Math.abs(a + 1.27) < 0.15, await p.inputValue('#anguloV') + ' · ' + a);
  ok('la base de herramientas no cambia', await p.evaluate(() => HB.porT(101).tipo === 'plana'));
  ok('el panel lo indica', /T101 en esta simulación/.test(await p.evaluate(() => document.getElementById('notaHerrPrograma').textContent)));
  await p.evaluate(prog => cargarGcodeTexto('; fresa de bola\n' + prog, 'b.nc'), prog);
  a = await alt(50, 32); ok('«fresa de bola» en un comentario: −2,24 a 2 mm del eje', Math.abs(a + 2.24) < 0.1, a);
  const p2 = 'G90\nT101 M06\nS12000 M03\nG0 X10 Y30 Z5\nG1 Z-3 F300\nG1 X90 F1000\nG0 Z5\nM05\nT102 M06\nS12000 M03\nG0 X10 Y60\nG1 Z-3 F300\nG1 X90 F1000\nG0 Z5\nM05\nM30';
  await p.evaluate(prog => { cargarGcodeTexto(prog, 'dos.nc'); irAlFinal(); }, p2);
  ok('con dos herramientas, el panel muestra la del tramo (T102 Ø3)', await p.evaluate(() => document.getElementById('diamHerramienta').value) === '3');
  await p.selectOption('#tipoFresa', 'v'); await p.waitForTimeout(150);
  ok('el cambio solo afecta a la T del tramo', await alt(50, 31) === -3 && await alt(50, 61) > -2.5, `${await alt(50, 31)} / ${await alt(50, 61)}`);
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
