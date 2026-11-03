// Herramienta por contorno: ⚙️ Mecanizar con M06, corrección (errores típicos) y Simulador
const { lanzar, path, SUITE, fs } = require('./comun');
const PIEZA = process.env.PIEZA || path.join(__dirname, 'Prueba01.json');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport:{ width:1440, height:900 } }); const errs = [];
  const cal = await ctx.newPage(); cal.on('pageerror', e => errs.push('cal: ' + e.message)); cal.on('dialog', d => d.accept());
  await cal.goto('file://' + path.join(SUITE, 'calcador.html')); await cal.evaluate(() => localStorage.clear()); await cal.reload(); await cal.waitForTimeout(700);
  await cal.evaluate(() => { cfgMec.orden = 'ext'; });   // estas comprobaciones se escribieron con los exteriores primero (el orden se prueba en orden_dxf.js)
  await cal.setInputFiles('#fileJSON', PIEZA); await cal.waitForTimeout(500);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  // el interior (C2) con T102 desde el panel
  await cal.evaluate(() => { sel = 1; refrescar(); if (typeof tuPestana === 'function') tuPestana('contornos'); }); await cal.waitForTimeout(200);
  const opciones = await cal.evaluate(() => [...document.querySelectorAll('#pmHerr option')].map(o => o.textContent));
  ok('panel: campo Herramienta con la base', opciones.length >= 3 && /La general/.test(opciones[0]), opciones.join(' | '));
  await cal.selectOption('#pmHerr', '102'); await cal.waitForTimeout(200);
  ok('mec.T guardado', await cal.evaluate(() => contornos[1].mec && contornos[1].mec.T === 102));
  ok('el plano marca la herramienta en la entrada', await cal.evaluate(() => JSON.stringify(construirCotas(contornos, tiposResueltos(), 1, 'todo', { x:0, y:0 }, {}).T.map(t => t.s || t.t || t.texto)).includes('T102')));
  // ⚙️ Mecanizar
  await cal.evaluate(() => { abrirMec(); cfgMec.comp = 'auto'; pintarCamposMec(); generarMec(); }); await cal.waitForTimeout(300);
  const nc = await cal.evaluate(() => document.getElementById('mecTexto').value);
  const cambio = /G40[^\n]*\n/.test(nc) && /\nM05[^\n]*\nT102 M06[^\n]*\nS16000 M03/.test(nc);
  ok('programa: T101 M06 al empezar y cambio M05 · T102 M06 · S16000 M03', /\nT101 M06/.test(nc) && cambio, '');
  { const [a1, a2] = nc.split(/\nT102 M06/); const fz1 = (a1.match(/G1 Z-[\d.]+ F(\d+)\s*; profundidad/g) || []).map(x => +/F(\d+)/.exec(x)[1]), fz2 = (a2 || '').match(/G1 Z-[\d.]+ F(\d+)\s*; profundidad/g) || [];
    ok('avance de penetración: la general (300) y el de la T102 de la base (200)', fz1.length && fz1.every(f => f === 300) && fz2.length && fz2.every(x => / F200/.test(x)), fz1.join(',') + ' / ' + fz2.join(',')); }
  const res = await cal.evaluate(() => document.getElementById('mecResumen').innerText.replace(/\s+/g, ' '));
  ok('resumen con las dos herramientas', /T101.*T102/.test(res), res.slice(0, 160));
  // corrección del propio programa
  const corr = t => cal.evaluate(t => { const r = corregirPrograma(t); return { e: r.errores, h: r.hallazgos.map(h => `[${h.tipo}/${h.cat}] ${h.msg}`.slice(0, 150)) }; }, t);
  let r = await corr(nc); ok('el programa de ⚙️ Mecanizar se corrige sin errores', r.e === 0, r.h.filter(x => x.startsWith('[error')).join(' || '));
  // errores típicos
  r = await corr(nc.replace(/T102 M06[^\n]*\n/, '')); ok('sin el cambio: «se corta con T101 y el plano pide T102»', r.h.some(x => /pide T102/.test(x)), r.h.filter(x => /herramienta/.test(x)).join(' || '));
  { const v = await cal.evaluate(t => { const r = corregirPrograma(t); const v = valorarCorreccion(r); return { piezaOk: r.piezaOk, incumple: r.incumple, pedido: v.desglose.pedido, seg: v.desglose.seg }; }, nc.replace(/T102 M06[^\n]*\n/, ''));
    ok('herramienta equivocada: la pieza sale bien pero no cumple lo pedido (0 en «lo pedido»)', v.piezaOk && v.incumple && v.pedido === 0 && v.seg > 0, JSON.stringify(v)); }
  r = await corr(nc.replace(/\nG0 Z20 F5000      ; subir a Z seguro\n\n; ══════ Cambio/, '\n\n; ══════ Cambio').replace(/(\nM05[^\n]*\nT102 M06)/, '\nG1 Z-1 F300$1'));
  ok('M06 con la fresa abajo → error de seguridad', r.h.some(x => /M06\) con la fresa (abajo|dentro)/.test(x)), r.h.filter(x => /M06/.test(x)).join(' || '));
  r = await corr(nc.replace(/\nM05[^\n]*\n(T102 M06)/, '\n$1')); ok('sin M05 → aviso', r.h.some(x => x.startsWith('[aviso') && /falta M05/.test(x)) && r.e === 0, r.h.filter(x => /M05/.test(x)).join(' || '));
  r = await corr(nc.replace(/(T102 M06[^\n]*\n)S16000 M03[^\n]*\n/, '$1')); ok('sin M03 tras el cambio → error', r.h.some(x => /husillo parado/.test(x)), r.h.filter(x => /husillo/.test(x)).join(' || '));
  r = await corr(nc.replace(/\nM05[^\n]*\n(T102 M06)/, '\nG28 Z0\nM05\n$1')); ok('G28 → aviso', r.h.some(x => /G28 depende del control/.test(x)), '');
  r = await corr(nc.replace(/T\d{3} M06[^\n]*\n/g, '')); ok('sin ninguna T → error', r.h.some(x => /no indica ninguna/.test(x)), '');
  // hoja de ejercicio
  ok('hoja: herramientas por contorno', await cal.evaluate(() => textoHerramientasHoja()).then(t => /T101.*E1.*T102.*E2/.test(t)), await cal.evaluate(() => textoHerramientasHoja()));
  // una sola herramienta: sin cambios
  await cal.evaluate(() => { delete contornos[1].mec.T; generarMec(); });
  const nc1 = await cal.evaluate(() => document.getElementById('mecTexto').value);
  ok('una sola herramienta: sin M06 de cambio', (nc1.match(/M06/g) || []).length === 1 && !/Cambio de herramienta/.test(nc1));
  fs.writeFileSync(path.join(require('os').tmpdir(), 'dos_herramientas.nc'), nc);
  // simulación del plano: la huella y la fresa dibujada, con el diámetro de la herramienta de cada tramo
  const sp = await cal.evaluate(() => {
    contornos.forEach(c => { if (c.mec) delete c.mec.T; }); contornos[1].mec = Object.assign(contornos[1].mec || {}, { T: 102 }); refrescar();
    construirSimPlano(); simP.visible = true; view.z = 20;
    const radios = {}, arcos = [], orig = ctx.arc;
    const medir = R => { const k = simP.items.findIndex(x => x.tipo === 'xy' && !x.rapido && Math.abs(x.R - R) < 1e-9); simP.t = (simP.items[k].t0 + simP.items[k].t1) / 2; arcos.length = 0; dibujarSimPlano(); return +(arcos[arcos.length - 1] / view.z).toFixed(3); };
    ctx.arc = function (x, y, r, ...m) { arcos.push(r); return orig.call(this, x, y, r, ...m); };
    try { radios.T102 = medir(1.5); radios.general = medir(3); } finally { ctx.arc = orig; }
    return radios;
  });
  ok('simulación del plano: la fresa dibujada es la de cada contorno (T102 Ø3, la general Ø6)', sp.T102 === 1.5 && sp.general === 3, JSON.stringify(sp));
  console.log(`fallos ${fallos}`, errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
