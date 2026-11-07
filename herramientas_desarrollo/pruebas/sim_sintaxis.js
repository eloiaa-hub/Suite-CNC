// Simulador: las líneas mal escritas salen como error (incluida la letra O por el cero), y ningún programa bueno de la suite da un error falso.
const { lanzar, path, SUITE, fs } = require('./comun');
const CAB = 'G90\nT101 M06\nS12000 M03\nG0 X0 Y0 Z20\nG1 Z-1 F300\n', PIE = '\nG0 Z20\nM05\nM30';
const MALAS = [['G1 XO Y20', /letra O/], ['G1 X0 YO', /letra O/], ['GO X10', /letra O/], ['G1 XOY20', /letra O/], ['G1 X1O5', /letra O/], ['g1 xo y20', /letra O/], ['G1 X O Y20', /letra O/], ['G1 XO.5', /letra O/],
  ['G1 X1.2.3', /más de un punto/], ['G1 X1e400', /exponente/], ['G1 X10 X20', /dos veces/], ['G1 X--5', /dos signos/], ['G1 XNaN', /No se entiende/], ['G X Y Z', /No se entiende|sin número/], ['GG1 X10', /No se entiende/],
  ['HOLA', /No se entiende/], ['G99 X10', /ciclo/], ['G999 X10', /no existe/], ['G1.5 X10', /entero/], ['G1 X', /sin número/], ['X10 5', /falta la letra/], ['G1 X10 U5', /letra U/], ['G1 X10 (sin cerrar', /Paréntesis/], ['G1 X10)', /Paréntesis/], ['G1 X10 #5', /No se entiende/], ['G1 X10 O5', /principio/]];
const BUENAS = ['G1 X10 Y20', 'G1X10Y20', 'g1 x10 y20', 'G01 X0 Y0', 'G1 X 25 Y-.5', 'G1 X10. Y+3', 'N10 G1 X10', 'G41 G1 X10', '/G1 X10', 'G1 X10 ; XO', 'G1 X10 (XO)', '(RANURA (COLISA) G91)', 'G1 X10 ((A) B)', 'G2 X10 Y0 I5 J0', 'G3 X10 Y0 R5', 'O1000', 'N10 O1000', 'G4 P2', 'G1 X1,5'];
const nc = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? nc(path.join(d, e.name)) : /\.nc$/.test(e.name) ? [path.join(d, e.name)] : []);
(async () => {
  const b = await lanzar(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.waitForTimeout(1000);
  const sint = t => p.evaluate(t => parsearGcode3D(t).meta.sintaxis, t);
  for (const [l, re] of MALAS) { const r = await sint(CAB + l + PIE), m = r.find(x => x.linea === 6); console.log(`${m && re.test(m.msg) ? '✓' : '✗'} «${l}» es error · ${m ? m.msg : 'sin error'}`); }
  for (const l of BUENAS) { const r = await sint(CAB + l + PIE); console.log(`${r.length ? '✗' : '✓'} «${l}» es correcta${r.length ? ' · ' + r[0].msg : ''}`); }
  { const r = await p.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); return revisarPrograma().filter(a => a.linea === 6); }, CAB + 'G1 XO Y20' + PIE);
    console.log(`${r.some(a => a.nivel === 'error' && /letra O/.test(a.msg)) ? '✓' : '✗'} la revisión lo muestra como error · ${JSON.stringify(r).slice(0, 160)}`);
    const k = await p.evaluate(() => document.querySelectorAll('.con-error').length); console.log(`${k ? '✓' : '✗'} la línea se marca en el listado`); }
  { const r = await p.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); return revisarPrograma().filter(a => a.nivel === 'error').length; }, CAB + Array(500).fill('G1 XO').join('\n') + PIE);
    console.log(`${r <= 45 ? '✓' : '✗'} un archivo que no es G-code no llena la lista (${r} errores)`); }
  { const r = await p.evaluate(() => { const m = parsearGcode3D('(RANURA (COLISA) G91)\nG90\nG0 X5 Z5\n(X (Y) G91)\nG0 X7'); return m[m.length - 1].x; }); console.log(`${r === 7 ? '✓' : '✗'} un G91 dentro de un comentario no cuenta (X${r})`); }
  // Programas buenos de la suite: ninguno debe dar errores de escritura
  const corpus = nc(SUITE).map(f => ({ n: path.basename(f), t: fs.readFileSync(f, 'latin1') })).concat(JSON.parse(fs.readFileSync(path.join(__dirname, 'raros_corpus.json'), 'utf8')), JSON.parse(fs.readFileSync(path.join(__dirname, 'interp_corpus.json'), 'utf8')));
  const malos = await p.evaluate(c => c.flatMap(x => parsearGcode3D(x.t).meta.sintaxis.map(s => `${x.n} línea ${s.linea}: «${x.t.split(/\r?\n/)[s.linea - 1]}» ${s.msg}`)), corpus);
  console.log(`${malos.length ? '✗' : '✓'} ${corpus.length} programas de la suite sin errores falsos${malos.length ? ':\n  ' + malos.slice(0, 15).join('\n  ') : ''}`);
  console.log(`${errs.length ? '✗' : '✓'} sin errores de la página ${errs.slice(0, 2).join(' | ')}`);
  await b.close();
})();
