// Tutor v3: la cabecera agrupada (apuntes «La cabecera del programa»). En ✍ Practicar vale la de los apuntes, línea a línea,
// y la agrupada (G de grupos distintos, una sola M, el cambio de herramienta solo, el husillo después, la F de corte);
// lo que no cumple las reglas se explica. El programa resultante pasa la revisión del Simulador sin errores.
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const prueba = async (lineas, coord = 'G90') => { await p.evaluate(() => tuCargarEjemplo(7)); await p.waitForTimeout(300);   // (al abrir, el Tutor termina de prepararlo un instante después)
    return p.evaluate(([lineas, coord]) => { TU.ejercicio = null; cfgMec.coord = coord; cfgMec.comp = 'auto'; tuRefrescar(true); tuModo('practicar'); tuNuevaPractica(); tuPintarTodo();
    const res = []; for (const l of lineas) { document.getElementById('tuEntrada').value = l; const antes = TU.practica.idx; tuComprobar(); res.push({ l, ok: TU.practica.idx > antes, msg: TU.practica.msg ? TU.practica.msg.txt : '' }); }
    return { res, idx: TU.practica.idx + 1, primera: TU.prog.lineas[TU.practica.idx].cod, prog: tuTextoActivo() }; }, [lineas, coord]); };
  // la agrupada de los apuntes
  for (const c of ['G90', 'G91', 'mixta']) {
    const r = await prueba(['G71 G90 G40 G0 Z20', 'T101 M06', 'F1000 S12000 M03'], c);
    ok(`${c}: G71 G90 G40 G0 Z20 · T101 M06 · F1000 S12000 M03 valen y pasa al primer contorno`, r.res.every(x => x.ok) && /hace también la línea 5/.test(r.res[0].msg) && r.idx === 7, `sigue en ${r.idx}: ${r.primera}`);
  }
  let r = await prueba(['G71 G90', 'T101 M06', 'S12000 M03', 'G0 Z20']);
  ok('la de los apuntes, línea a línea, sigue valiendo', r.res.every(x => x.ok) && r.idx === 7);
  r = await prueba(['G71 G90 G0 Z20', 'T101 M06', 'S12000 M03']);
  ok('G71 G90 G0 Z20 (sin G40) también', r.res.every(x => x.ok) && r.idx === 7);
  // lo que no vale, con su motivo
  const malas = [['T101 M06 M03', /Una sola función M/], ['S12000 T101 M06 M03', /Una sola función M/], ['G71 G90 T101 M06', /propia línea/], ['G90 G91 G71', /mismo grupo/],
    ['G71 G90 S12000 M03', /Primero el cambio de herramienta/], ['G71 G90 G0 Z50', /altura de seguridad es Z20/], ['Z20 G0 G90 G71', /orden de las letras/]];
  r = await prueba(malas.map(m => m[0]));
  malas.forEach(([l, re], k) => ok(`no vale «${l}»`, !r.res[k].ok && re.test(r.res[k].msg), r.res[k].msg.slice(0, 110)));
  r = await prueba(['G71 G90 G40 G0 Z20', 'T101 M06', 'F300 S12000 M03', 'S15000 M03', 'M03 S12000', 'F1000 S12000 M03']);
  ok('la F de la cabecera es la de corte; la S, la de ⚙️ Mecanizado; S antes que M', /F es la de corte: F1000/.test(r.res[2].msg) && /S12000/.test(r.res[3].msg) && /orden de las letras/.test(r.res[4].msg) && r.res[5].ok);
  // el programa del alumno, en el Simulador
  const prog = await p.evaluate(() => { const L = TU.prog.lineas, e = () => document.getElementById('tuEntrada'); while (!TU.practica.fin) { e().value = L[TU.practica.idx].cod; tuComprobar(); }
    const d = tuDatosInforme(); return { txt: tuTextoActivo(), l5: d.tutor.lineas.find(x => x.n === 5).txt, total: d.tutor.total, hechas: d.tutor.bien + d.tutor.ayuda + d.tutor.vistas }; });
  ok('el programa empieza con la cabecera agrupada y el informe dice dónde está la línea 5', /^\(RESUELTO 8 - ARO\)\nG71 G90 G40 G0 Z20\nT101 M06\nF1000 S12000 M03\n/.test(prog.txt) && prog.l5 === '(en la línea 2)' && prog.total === prog.hechas, prog.l5);
  const s = await ctx.newPage(); s.on('pageerror', e => errs.push('sim: ' + e.message)); await s.goto('file://' + path.join(SUITE, 'simulador3d.html')); await s.waitForTimeout(1200);
  const rev = await s.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); return revisarPrograma().map(x => x.nivel + ': ' + x.msg); }, prog.txt);
  ok('el Simulador lo revisa sin errores ni avisos', !rev.length, rev.join(' | '));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
