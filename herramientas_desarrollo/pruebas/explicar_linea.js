// Simulador V42: 💬 explicar la línea marcada y 📍 posición absoluta en las líneas en G91
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.waitForTimeout(1000);
  const R = path.join(SUITE, 'herramientas_desarrollo/manuales/resueltos/programas/');
  const ex = (t, n) => p.evaluate(([t, n]) => { cargarGcodeTexto(t, 'x.nc'); if (n) irALinea(n); return { ex: explicaciones,
      caja: document.getElementById('cuerpoExplicar').textContent, cabeza: document.getElementById('cabExplicar').textContent,
      abs: [...document.querySelectorAll('#listaCodigo .gl')].map(el => { const a = el.querySelector('.abs-g91'); return a ? a.textContent.trim() : ''; }) }; }, [t, n]);
  // G91: posición absoluta en cada línea, igual a la del Simulador
  let t = fs.readFileSync(R + 'ejercicio3_G91.nc', 'utf8'), r = await ex(t, 10);
  ok('ejercicio 3 en G91: «→ X105 Y75» al lado de la línea 10', r.abs[9] === '→ X105 Y75', r.abs[9]);
  ok('las líneas en G90 no llevan posición absoluta', r.abs[6] === '' && r.abs[7] === '' && r.abs[12] === '');
  ok('la suma de la línea 10: Y: 35 + 40 = 75', r.ex[9].sumas.join() === 'X: 105 + 0 = 105,Y: 35 + 40 = 75', r.ex[9].sumas.join());
  ok('el cuadro explica la línea marcada', r.cabeza === '💬 Línea 10' && /Sigue en G91/.test(r.caja) && /hacia arriba/.test(r.caja) && /de X105 Y35 Z-3 a X105 Y75 Z-3/.test(r.caja), r.caja.slice(0, 200));
  // todas las G91 de los programas resueltos: lo anotado coincide con donde acaba la fresa en el Simulador
  let malos = [];
  for (const f of fs.readdirSync(R).filter(f => /G91|mixta/.test(f))) {
    const t = fs.readFileSync(R + f, 'utf8');
    const d = await p.evaluate(t => { cargarGcodeTexto(t, 'x.nc'); const fin = {}; gcodeMoves.forEach(m => fin[m.linea] = m);
      return explicaciones.map((e, i) => e && e.abs ? [i + 1, e.abs, fin[i + 1]] : null).filter(Boolean); }, t);
    d.forEach(([n, a, m]) => { const v = {}; a.split(' ').forEach(w => v[w[0]] = +w.slice(1)); if (['X', 'Y', 'Z'].some(k => k in v && Math.abs(v[k] - m[k.toLowerCase()]) > 1e-6)) malos.push(f + ':' + n); });
    if (!d.length) malos.push(f + ': sin anotaciones');
  }
  ok('programas resueltos en G91 y mixtos: la posición anotada es donde acaba la fresa', !malos.length, malos.join(' '));
  // Arcos: centro con I J y con R
  r = await ex('G90 G0 X0 Y0 Z5\nG1 Z-3 F200\nG2 X20 Y0 I10 J0\nG3 X0 Y0 R-10\nG3 X0 Y0 I10 J0\nM30');
  ok('G2 con I J: el centro (X10 Y0) y los grados', r.ex[2].notas.some(x => /radio 10 con el centro en X10 Y0: recorre 180°/.test(x)), r.ex[2].notas.join(' | '));
  ok('R negativo: el arco largo', r.ex[3].frases.some(f => /R negativo/.test(f.txt)));
  ok('círculo completo en una línea: aviso de hacerlo en dos semicírculos', r.ex[4].notas.some(x => /Círculo completo/.test(x)) && r.ex[4].notas.some(x => /dos semicírculos/.test(x)));
  // Modales, comentarios, fin, ciclos, TpaCAD
  r = await ex('(PRUEBA)\nG90\nG0 X10 Y10 Z5\nX20\nG1 Z-2 F100\nM30\nG0 X0');
  ok('comentario', /comentario/.test(r.ex[0].frases[0].txt));
  ok('sin G de movimiento: sigue G0', r.ex[3].frases.some(f => /sigue valiendo el último, G0/.test(f.txt)));
  ok('después de M30: no se ejecuta', r.ex[6].notas.some(x => /después del fin de programa/.test(x)));
  r = await ex(fs.readFileSync(path.join(SUITE, 'herramientas_desarrollo/manuales/tpacad/pieza_tpacad.nc'), 'utf8'));
  ok('TpaCAD: G71 X Y Z son las medidas del tablero', r.ex[1].frases.some(f => /medidas del tablero/.test(f.txt)));
  ok('G42 sola y la entrada de la compensación', r.ex[3].notas.some(x => /siguiente movimiento/.test(x)) && r.ex[5].notas.some(x => /entrada de la compensación G42/.test(x)));
  ok('G81: plano R, fondo y salida', /baja en rápido hasta Z2, taladra hasta Z-20 .* sale hasta Z20/.test(r.ex[18].resultado), r.ex[18].resultado);
  r = await ex('G90 G0 X0 Y0 Z20\nG91 G81 X10 Y10 R-18 Z-5 F100\nX10\nG80\nM30');
  ok('ciclo en G91: segundo taladro con «→ X20 Y10»', r.abs[2] === '→ X20 Y10' && r.ex[2].frases.some(f => /otro taladro/.test(f.txt)), r.abs[2]);
  // Botones: ocultar el cuadro y las anotaciones
  r = await p.evaluate(() => { cargarGcodeTexto(document.getElementById('gcodeEjemplo').textContent, 'e.nc'); irALinea(3); toggleExplicar(); toggleAbsolutas();
    const a = [document.getElementById('panelExplicar').classList.contains('oculto'), document.querySelectorAll('.abs-g91').length];
    toggleExplicar(); toggleAbsolutas(); return a.concat([document.getElementById('panelExplicar').classList.contains('oculto')]); });
  ok('💬 y 📍 se apagan y se encienden', r[0] === true && r[1] === 0 && r[2] === false, JSON.stringify(r));
  r = await p.evaluate(() => { toggleEdicionCodigo(); const o = document.getElementById('panelExplicar').classList.contains('oculto'); toggleEdicionCodigo(); return [o, document.getElementById('panelExplicar').classList.contains('oculto')]; });
  ok('al editar se oculta el cuadro y al volver se ve', r[0] && !r[1], JSON.stringify(r));
  r = await p.evaluate(() => { cargarGcodeTexto('G71 G90\nT101 M06\nS12000 M04\nG0 X0 Y0 Z5\nG1 Z-3 F300\nG1 X50 F1000\nG0 Z20\nM05\nM30', 'x.nc'); return [revisarPrograma().map(r => r.linea + ' ' + r.msg).join(' | '), explicaciones[2].frases.map(f => f.txt).join(' ')]; });
  ok('M04: aviso «giro antihorario… el giro habitual es M03» en su línea y en la explicación', /^3 M04: giro antihorario/.test(r[0]) && /lo habitual es M03/.test(r[1]), r.join(' · '));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
