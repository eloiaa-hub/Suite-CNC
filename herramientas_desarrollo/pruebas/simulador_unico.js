// Un solo Simulador 3D (V40 y siguientes): con el editor de G-code, sin «Profesor»; el enlace antiguo lleva al nuevo; el Calcador lo abre.
// Uso: node simulador_unico.js
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const errs = [];
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  const info = await p.evaluate(() => ({ titulo: document.title, cab: document.querySelector('h1').innerText, profesor: /profesor/i.test(document.querySelector('h1').innerText) || !!document.querySelector('.pill-profesor'), editor: !!document.getElementById('textoEditor') }));
  ok('título y cabecera sin «Profesor», versión V45', !info.profesor && /V45/.test(info.cab) && info.titulo === 'Simulador G-Code 3D — Por Eloi A.A.', `${info.titulo} · ${info.cab.replace(/\s+/g, ' ')}`);
  // editar, aplicar y simular
  const ed = await p.evaluate(() => { toggleEdicionCodigo(); editorTexto().value = 'G71\nG90\nT101 M06\nS18000 M03\nG0 Z20\nG0 X0 Y0\nG1 Z-3 F150\nG1 X40 F1500\nG0 Z20\nM05\nM30\n'; const okA = aplicarEdicion(); return { okA, moves: gcodeMoves.length, fin: gcodeMoves[gcodeMoves.length - 1] && gcodeMoves[gcodeMoves.length - 1].x }; });
  ok('el editor de G-code: editar y aplicar simula el programa nuevo', ed.okA !== false && ed.moves > 3, JSON.stringify(ed));
  // el enlace antiguo
  const v = await ctx.newPage(); await v.goto('file://' + path.join(SUITE, 'simulador3d_profesor.html') + '#desdeCalcador'); await v.waitForTimeout(1500);
  ok('simulador3d_profesor.html lleva a simulador3d.html (con lo que venga detrás de #)', /simulador3d\.html#desdeCalcador$/.test(v.url()), v.url());
  ok('la página antigua ya no es un simulador (es ligera)', fs.statSync(path.join(SUITE, 'simulador3d_profesor.html')).size < 2000);
  // el Calcador lo abre con el plano y la solución
  const c = await ctx.newPage(); c.on('pageerror', e => errs.push('calcador: ' + e.message)); c.on('dialog', d => d.accept());
  await c.goto('file://' + path.join(SUITE, 'calcador.html')); await c.waitForTimeout(700);
  await c.setInputFiles('#fileJSON', path.join(__dirname, 'Prueba01.json')); await c.waitForTimeout(400);
  const [w] = await Promise.all([ctx.waitForEvent('page'), c.evaluate(() => abrirEnSimulador())]);
  await w.waitForFunction(() => location.hash !== '#desdeCalcador', null, { timeout: 15000 }).catch(() => {}); await w.waitForFunction(() => /Contorno mecanizado: 100/.test((document.getElementById('planoEval') || {}).innerText || ''), null, { timeout: 30000 }).catch(() => {});
  const r = await w.evaluate(() => ({ url: location.href, moves: (typeof gcodeMoves !== 'undefined' && gcodeMoves.length) || 0, plano: (document.getElementById('planoEval') || {}).innerText || '' }));
  ok('«➜ Abrir en el Simulador» del Calcador abre simulador3d.html con el plano y la solución', /simulador3d\.html(#desdeCalcador)?$/.test(r.url) && r.moves > 5 && /Contorno mecanizado: 100/.test(r.plano), JSON.stringify(r));
  ok('la portada tiene un solo Simulador 3D, para alumnado y profesorado', await (async () => { const i = await ctx.newPage(); await i.goto('file://' + path.join(SUITE, 'index.html')); return i.evaluate(() => !document.querySelector('a[href="simulador3d_profesor.html"]') && [...document.querySelectorAll('.ficha')].filter(f => /Simulador 3D/.test(f.textContent)).length === 1); })());
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
