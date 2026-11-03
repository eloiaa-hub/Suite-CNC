// Tutor v4: dos G del mismo grupo en una línea se anulan (G0 G1, G1 G2, G90 G91, G41 G42…) y la línea no vale,
// estén en el orden que estén; G de grupos distintos (G42 G1, G71 G90 G40 G0) siguen valiendo.
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  await p.evaluate(() => tuCargarEjemplo(7)); await p.waitForTimeout(300);
  await p.evaluate(() => { TU.ejercicio = null; tuModo('practicar'); tuNuevaPractica(); });
  const t = v => p.evaluate(v => { const e = document.getElementById('tuEntrada'); e.value = v; const a = TU.practica.idx; tuComprobar(); return { ok: TU.practica.idx > a, msg: TU.practica.msg ? TU.practica.msg.txt : '' }; }, v);
  const directa = l => p.evaluate(l => tuMismoGrupo(l), l);
  ok('G0 G1 → motivo de movimiento', /G0 y G1 son del mismo grupo y se anulan: solo una G de movimiento por línea/.test(await directa('G0 G1 X40 Y30')));
  ok('G1 G2 G3 → los tres', /G1, G2 y G3 son del mismo grupo/.test(await directa('G1 G2 G3 X1')));
  ok('G90 G91, G41 G42, G71 G70', /G90 y G91/.test(await directa('G90 G91')) && /G41 y G42/.test(await directa('G41 G42 G1 X1')) && /G71 y G70/.test(await directa('G71 G70')));
  ok('distintos grupos, repetida o en comentario: vale', !(await directa('G42 G1 X10')) && !(await directa('G71 G90 G40 G0 Z20')) && !(await directa('G1 G1 X5')) && !(await directa('G1 X5 (G0 rápido)')) && !(await directa('G1 X5 ; G0')));
  for (const v of ['G71 G90', 'T101 M06', 'S12000 M03', 'G0 Z20']) await t(v);
  const esp = await p.evaluate(() => TU.prog.lineas[TU.practica.idx].cod), g = esp.replace(/^G0 /, '');
  let r = await t('G0 G1 ' + g); ok(`G0 G1 ${g} no vale`, !r.ok && /mismo grupo y se anulan/.test(r.msg), r.msg);
  r = await t('G1 G0 ' + g); ok(`G1 G0 ${g} no vale (antes valía)`, !r.ok && /G1 y G0 son del mismo grupo/.test(r.msg), r.msg);
  r = await t(esp); ok('la línea bien escrita vale', r.ok);
  const cat = await p.evaluate(() => { const f = Object.values(TU.practica.registro).flatMap(x => x.fallos); return f.map(x => x.cat); });
  ok('en el informe cuentan como «G del mismo grupo»', cat.length === 2 && cat.every(c => c === 'grupoG'), cat.join(','));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
