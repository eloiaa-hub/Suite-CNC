// Corrector v47: el final del programa (M05 y M30, o M02) y los números de bloque. Programa de un alumno («N22 M03» al final).
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const HUGO = `N1 ; EJERCICIO 5
N2 G71 G90 G40
N3 T101 M06
N4 F1000 S12000
N5 M03
N6 G0 Z+20
N7 G01 X80 Y-60
N8 G01 X120 Y-60 Z-3
N9 G01 X120 Y-30
N10 G02 X160 Y-30 I20 J0
N11 G01 X160 Y-80
N12 G02 X150 Y-90 I-10 J0
N13 G01 X110 Y-90
N14 G03 X80 Y-90 I-15 J0
N15 G01 X40 Y-90
N16 G01 X20 Y-70
N17 G01 X20 Y-10
N18 G01 X40 Y-20
N19 G01 X60 Y-10
N20 G01 X60 Y-60
N21 G01 X120 Y-60
N22 M03`;
(async () => {
  const b = await lanzar(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'corrector.html')); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const notas = t => p.evaluate(t => interpretarISO(t).notas.map(n => ({ tipo: n.tipo, cat: n.cat || '', l: n.linea, msg: n.msg })), t);
  const tiene = (ns, tipo, re) => ns.some(n => n.tipo === tipo && re.test(n.msg));
  const fin = t => HUGO.replace('N22 M03', t);
  let n = await notas(HUGO);
  ok('«N22 M03» al final: error de seguridad, en esa línea', n.some(x => x.tipo === 'error' && x.cat === 'seguridad' && x.l === 21 && /M03 arranca el husillo/.test(x.msg)));
  ok('N1, N2, N3…: aviso de numerar de 10 en 10', tiene(n, 'aviso', /de 10 en 10/));
  n = await notas(fin('N22 G0 Z20\nN23 M05\nN24 M30')); ok('M05 y M30: sin errores ni avisos de fin', !n.some(x => /fin de programa|termina|husillo/.test(x.msg)));
  n = await notas(fin('N22 G0 Z20\nN23 M02')); ok('M02: correcto', !n.some(x => /fin de programa|termina|husillo/.test(x.msg)));
  n = await notas(fin('N22 G0 Z20\nN23 M30')); ok('M30 sin M05: aviso', tiene(n, 'aviso', /M30 con el husillo en marcha/) && !n.some(x => x.tipo === 'error' && x.cat === 'seguridad'));
  n = await notas(fin('N22 G0 Z20')); ok('sin fin de programa: error de seguridad', n.some(x => x.tipo === 'error' && x.cat === 'seguridad' && /no termina/.test(x.msg)));
  n = await notas(fin('N22 M05\nN23 M30\nN24 G0 Z50')); ok('después de M30: aviso', tiene(n, 'aviso', /después del fin de programa/));
  n = await notas(HUGO.replace(/^N\d+ ?/gm, '').replace(/M03$/, 'M05\nM30')); ok('sin números de bloque: nada que decir', !n.some(x => /números de bloque|fin de programa|no termina/.test(x.msg)));
  n = await notas(HUGO.split('\n').map(l => l.replace(/^N(\d+)/, (m, k) => 'N' + k * 10)).join('\n').replace('N220 M03', 'N220 M05\nN230 M30')); ok('N10, N20…: correcto', !n.some(x => /números de bloque/.test(x.msg)));
  n = await notas(HUGO.replace('N9 ', 'N8 ')); ok('número repetido: aviso', tiene(n, 'aviso', /tienen que ir creciendo.*repetido/));
  n = await notas(HUGO); ok('termina con la fresa dentro (Z-3): error de seguridad', n.some(x => x.tipo === 'error' && x.cat === 'seguridad' && /termina con la fresa dentro de la pieza/.test(x.msg)));
  ok('N8 baja en diagonal de Z20 a Z-3: aviso', n.some(x => x.tipo === 'aviso' && x.l === 7 && /baja en diagonal/.test(x.msg)));
  n = await notas(fin('N22 G0 Z2\nN23 M05\nN24 M30')); ok('termina en Z2: aviso de subir a Z20', tiene(n, 'aviso', /termina con la fresa abajo/) && !n.some(x => /dentro de la pieza/.test(x.msg)));
  n = await notas(HUGO.replace('N8 G01 X120 Y-60 Z-3', 'N8 G01 X120 Y-60\nN8 G01 Z-3 F300').replace('N22 M03', 'N22 G0 Z20\nN23 M05\nN24 M30')); ok('bajando en vertical y subiendo al final: nada de esto', !n.some(x => /diagonal|termina con la fresa/.test(x.msg)));
  n = await notas('G71 G90\nT101 M06\nS12000 M03\nG0 X0 Y0 Z20\nG1 Z0 F300\nG1 X50 Y0 Z-2 F1000\nG1 X100 Y0\nG0 Z20\nM05\nM30'); ok('rampa suave desde la superficie (2,3°): no se avisa', !n.some(x => /diagonal/.test(x.msg)));
  // el Simulador 3D (V45): las mismas reglas en su revisión
  const sim = await (await p.context().browser()).newPage(); await sim.goto('file://' + path.join(SUITE, 'simulador3d.html')); await sim.waitForTimeout(1200);
  const rs = await sim.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); return revisarPrograma().map(x => x.nivel + ': ' + x.msg); }, HUGO);
  ok('Simulador: M03 al final y fresa dentro (errores), diagonal y N de 1 en 1 (avisos)', rs.some(x => /^error: M03 arranca el husillo/.test(x)) && rs.some(x => /^error: El programa termina con la fresa dentro/.test(x)) && rs.some(x => /^aviso: Baja en diagonal/.test(x)) && rs.some(x => /^aviso: Los números de bloque van de 1 en 1/.test(x)), rs.length + ' mensajes');
  const rs2 = await sim.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); return revisarPrograma().map(x => x.nivel + ': ' + x.msg); }, HUGO.replace('N22 M03\n', '').replace('N22 M03', ''));
  ok('Simulador: arranca el husillo y no termina → error', rs2.some(x => /^error: El programa no termina/.test(x)));
  await sim.close();
  const nuevos = []; for (const f of ejercicios().filter(f => /\.nc$/i.test(f))) { const x = await notas(fs.readFileSync(f, 'utf8')); if (x.some(y => /fin de programa|no termina|números de bloque|arranca el husillo|M30 con el husillo/.test(y.msg))) nuevos.push(path.basename(f)); }
  ok('los programas de la suite no tienen nada de esto', !nuevos.length, nuevos.join(', '));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
