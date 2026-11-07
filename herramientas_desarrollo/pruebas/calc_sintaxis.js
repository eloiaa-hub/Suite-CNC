// Calcador y Corrector: al corregir, las líneas mal escritas son errores (Escritura), y ningún programa bueno da un error falso.
const { lanzar, path, SUITE, fs } = require('./comun');
const CAB = 'G90\nT101 M06\nS12000 M03\nG0 X0 Y0 Z20\nG1 Z-1 F300\n', PIE = '\nG0 Z20\nM05\nM30';
const MALAS = ['G1 XO Y20', 'GO X10', 'G1 XOY20', 'g1 xo y20', 'G1 X1.2.3', 'G1 X1e400', 'G1 X10 X20', 'G1 X--5', 'HOLA', 'OLA', 'G99 X10', 'G999 X10', 'G1.5 X10', 'G1 X', 'G1 X10 U5', 'G1 X10 (sin cerrar'];
const BUENAS = ['G1 X10 Y20', 'G1X10Y20', 'g1 x10 y20', 'G01 X0 Y0', 'G1 X 25 Y-.5', 'N10 G1 X10', 'G1 X10 ; XO', 'G1 X10 (XO)', '(RANURA (COLISA) G91)', 'O1000', 'G4 P2', 'G1 X1,5'];
const nc = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? nc(path.join(d, e.name)) : /\.nc$/.test(e.name) ? [path.join(d, e.name)] : []);
const PIEZA = path.join(__dirname, 'Prueba01.json');
(async () => {
  const b = await lanzar();
  for (const prog of ['calcador.html', 'corrector.html']) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + path.join(SUITE, prog)); await p.waitForTimeout(900);
    const esc = t => p.evaluate(t => interpretarISO(t).notas.filter(n => n.cat === 'escritura'), t);
    for (const l of MALAS) { const r = await esc(CAB + l + PIE); console.log(`${r.length && r[0].linea === 5 && r[0].tipo === 'error' ? '✓' : '✗'} ${prog} «${l}» es error · ${r[0] ? r[0].msg : 'sin error'}`); }
    for (const l of BUENAS) { const r = await esc(CAB + l + PIE); console.log(`${r.length ? '✗' : '✓'} ${prog} «${l}» es correcta${r.length ? ' · ' + r[0].msg : ''}`); }
    const corpus = nc(SUITE).map(f => ({ n: path.basename(f), t: fs.readFileSync(f, 'latin1') })).concat(JSON.parse(fs.readFileSync(path.join(__dirname, 'raros_corpus.json'), 'utf8')), JSON.parse(fs.readFileSync(path.join(__dirname, 'interp_corpus.json'), 'utf8')));
    const malos = await p.evaluate(c => c.flatMap(x => interpretarISO(x.t).notas.filter(n => n.cat === 'escritura').map(n => x.n + ': ' + n.msg)), corpus);
    console.log(`${malos.length ? '✗' : '✓'} ${prog} ${corpus.length} programas sin errores falsos ${malos.slice(0, 8).join(' | ')}`);
    const g = await p.evaluate(() => { const m = interpretarISO('(R (C) G91)\nG90\nG0 X5 Z5\n(X (Y) G91)\nG0 X7').segs; return m[m.length - 1].p2.x; }); console.log(`${g === 7 ? '✓' : '✗'} ${prog} un G91 dentro de un comentario no cuenta (X${g})`);
    // corrección de verdad: la solución da bien, y una línea mal escrita cambia el veredicto
    await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { abrirTabla(); const sol = textoTabla('iso'); cerrarTabla(); const a = corregirPrograma(sol), notaA = valorarCorreccion(a); const lin = sol.split('\n'); const k = lin.findIndex(l => /G1 .*X0(\.0+)?\b/.test(l)); const malo = k >= 0 ? lin.map((l, i) => i === k ? l.replace(/X0(\.0+)?\b/, 'XO') : l).join('\n') : sol + '\nHOLA'; const c = corregirPrograma(malo), notaC = valorarCorreccion(c); const e = c.hallazgos.filter(h => h.cat === 'escritura'); return { okA: a.ok, escA: a.hallazgos.filter(h => h.cat === 'escritura').length, okC: c.ok, n: e.length, msg: e[0] && e[0].msg, sinCambio: k < 0, notaA: notaA.nota, verC: notaC.veredicto, notaC: notaC.nota }; }).catch(e => ({ exc: e.message }));
    console.log(`${r.okA === true && !r.escA && r.okC === false && r.n >= 1 ? '✓' : '✗'} ${prog} corregir: ${JSON.stringify(r).slice(0, 220)}`);
    console.log(`${errs.length ? '✗' : '✓'} ${prog} sin errores de la página ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
  await b.close();
})();
