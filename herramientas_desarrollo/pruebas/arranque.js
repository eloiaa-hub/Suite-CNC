// Los cinco programas arrancan sin errores
const { lanzar, abrir } = require('./comun');
(async () => { const b = await lanzar(); let mal = 0;
  for (const p of ['index.html', 'calcador.html', 'corrector.html', 'tutor.html', 'generador.html', 'simulador3d.html', 'calculadora.html', 'anidador.html']) {
    const pg = await abrir(b, p); await pg.waitForTimeout(800);
    const ver = await pg.evaluate(() => (document.querySelector('.ver-suite, h1 span, .ver') || {}).textContent || '');
    console.log(`${p.padEnd(26)} ${pg.errs.length ? '✗ ' + pg.errs.join(' | ') : '✓ sin errores'} · ${ver.trim()}`); mal += pg.errs.length; await pg.close(); }
  await b.close(); process.exitCode = mal ? 1 : 0; })();
