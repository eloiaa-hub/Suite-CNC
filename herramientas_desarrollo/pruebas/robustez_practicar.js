// Robustez de ✍ Practicar del Tutor: 30 líneas raras en G90, G91 y mixta, sin errores ni HTML inyectado
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  await p.setInputFiles('#fileJSON', path.join(SUITE, 'herramientas_desarrollo/pruebas/tutor_compensacion.json')); await p.waitForTimeout(800);
  for (const c of ['G90', 'G91', 'mixta']) {
    await p.evaluate(c => { cfgMec.coord = c; cfgMec.comp = 'auto'; tuPintarMec(); tuRefrescar(true); tuModo('practicar'); }, c); await p.waitForTimeout(300);
    const raras = ['', '   ', ';;;', '((((', 'G', 'G1 X', 'X1e400', 'G1 X--5', 'G1 X5 X6', 'N10 N20', 'G999', 'M999', 'G1 X' + '9'.repeat(400), '💥 G1', 'g1 x5 y5', 'G01X5Y5', 'G1 X5,5', 'T', 'S', 'F-100', 'G2 X10 Y10 R0', 'G2 X10 Y10 I0 J0', 'G3 R-5', '%', 'O1234', '<img src=x onerror="window.__xss=1">', 'G1 X5 ; comentario (con paréntesis', 'G1 X.5 Y-.5', 'G1 X+5', 'G1 X5.', 'G1 X1e2'];
    const msgs = [];
    for (const l of raras) { await p.fill('#tuEntrada', l); await p.press('#tuEntrada', 'Enter'); await p.waitForTimeout(40);
      msgs.push(await p.evaluate(() => { const m = document.querySelector('#tuPractica .tu-msg'); return m ? m.textContent.slice(0, 70) : '(sin mensaje)'; })); }
    // y después, todas las líneas buenas con «Ver la línea» hasta el final
    const fin = await p.evaluate(async () => { let n = 0; while (TU.practica && !TU.practica.fin && n < 200) { TU.practica.fallos = 9; tuVerLinea(); n++; await new Promise(r => setTimeout(r, 5)); } return { n, fin: TU.practica && TU.practica.fin }; });
    console.log(c, '· mensajes distintos:', new Set(msgs).size, '· xss:', await p.evaluate(() => !!window.__xss), '· hasta el final:', JSON.stringify(fin));
    console.log('   ', [...new Set(msgs)].slice(0, 12).join(' | '));
  }
  console.log('ERR', errs); await b.close();
})();
