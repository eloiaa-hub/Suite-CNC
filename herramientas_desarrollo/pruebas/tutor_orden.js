// Tutor: el orden de las letras de la norma (N G X Y Z (I J K o R) F S T M D H). Las líneas del Tutor lo cumplen todas;
// en ✍ Practicar, una línea bien pero desordenada no vale, se explica cómo va y cuenta como «Orden de las letras» en el informe.
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const r = await p.evaluate(async () => {
    const malas = []; let n = 0;
    for (let i = 0; i < TU_EJEMPLOS.length; i++) { tuCargarEjemplo(i); await new Promise(r => setTimeout(r, 30)); TU.ejercicio = null;
      for (const c of ['G90', 'G91', 'mixta']) for (const k of ['G40', 'auto']) { cfgMec.coord = c; cfgMec.comp = k; tuRefrescar(true);
        TU.prog.lineas.forEach(l => { if (l.sep || l.titulo) return; n++; if (tuOrdenLetras(l.cod)) malas.push(l.cod); }); } }
    return { n, malas: [...new Set(malas)] };
  });
  ok(`las ${r.n} líneas que escribe el Tutor (50 piezas, G90/G91/mixta, con y sin compensación) van en orden`, !r.malas.length, r.malas.slice(0, 5).join(' | '));
  const casos = { 'M3 S2000': false, 'X40 F1500 G1 Y30': false, 'G1 Y30 X40': false, 'F300 G1 Z-3': false, 'M06 T101': false, 'G2 X10 Y5 J5 I0': false, 'G1 N10 X5': false, 'M05 G0 Z20': false,
    'N10 G1 X5': true, 'G42 G1 X5 Y5 F1000': true, 'G1 G42 X5 Y5 F1000': true, 'S12000 M03': true, 'T101 M06': true, 'G0 Z20 M05': true, 'G1 X5 Y5 ; F100 comentario': true, 'G2 X10 Y5 I0 J5': true, 'G2 X10 Y5 R5': true };
  const mal = []; for (const [l, bien] of Object.entries(casos)) if (!(await p.evaluate(l => tuOrdenLetras(l), l)) !== bien) mal.push(l);
  ok('desordenadas: M3 S2000, X40 F1500 G1 Y30, G1 Y30 X40, M06 T101, J antes que I…; ordenadas: G42 G1 o G1 G42, S12000 M03, comentarios…', !mal.length, mal.join(' | '));
  // en Practicar
  await p.evaluate(() => { tuCargarEjemplo(5); }); await p.waitForTimeout(500);
  const s = await p.evaluate(() => { TU.ejercicio = null; tuModo('practicar'); const L = TU.prog.lineas, e = () => document.getElementById('tuEntrada'); let msg = '';
    while (!TU.practica.fin) { const cod = L[TU.practica.idx].cod;
      if (/^S\d+ M03$/.test(cod)) { e().value = 'M03 ' + cod.split(' ')[0]; tuComprobar(); msg = TU.practica.msg.txt; }
      e().value = cod; tuComprobar(); }
    const p = TU.practica; return { msg, fallos: p.fallos, cats: JSON.stringify(tuDatosInforme().tutor.cats) }; });
  ok('Practicar: «M03 S12000» no vale y dice cómo va', /orden de las letras.*S12000 M03/.test(s.msg), s.msg);
  ok('en el informe cuenta como «Orden de las letras»', s.fallos === 1 && /"orden":1/.test(s.cats), s.cats + ' · ' + await p.evaluate(() => tuNombreCategoria('orden')));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
