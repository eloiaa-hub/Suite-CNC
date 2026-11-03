// Calcador v84: alinear y repartir, bloquear, recortar (Y) y alargar (H).
// Uso: node herramientas_cad.js
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const cerca = (a, b, t = 1e-6) => Math.abs(a - b) < t;
  // monta un dibujo: lista de [pts, cerrado, b?] y auxiliares
  const montar = (cs, auxs) => p.evaluate(([cs, auxs]) => {
    contornos.length = 0; cs.forEach(([pts, cerrado, bb]) => contornos.push({ pts: pts.map(([x, y]) => ({ x, y })), b: bb || pts.map(() => 0), cerrado, tipo: 'auto' }));
    aux.length = 0; (auxs || []).forEach(a => aux.push(a)); asegurarUids(); seleccionarUno(-1); setHerramienta('editar'); refrescar(); encuadrar();
  }, [cs, auxs]);
  const pant = q => p.evaluate(q => { const r = cv.getBoundingClientRect(), s = aPantalla(q); return { x: r.left + s.x * r.width / cv.clientWidth, y: r.top + s.y * r.height / cv.clientHeight }; }, q);
  const cs = () => p.evaluate(() => contornos.map(c => ({ pts: c.pts.map(q => [+q.x.toFixed(4), +q.y.toFixed(4)]), b: c.b.slice(), cerrado: c.cerrado, bloq: !!c.bloqueado, grupo: c.grupo || null })));
  const rect = (x, y, w, h) => [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true];
  const bb = c => { const xs = c.pts.map(q => q[0]), ys = c.pts.map(q => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };

  // ── ALINEAR Y REPARTIR
  await montar([rect(0, 0, 20, 10), rect(37, 25, 30, 20), rect(110, 8, 10, 40), rect(112, 10, 4, 4)]);
  await p.evaluate(() => { seleccionarUno(2); seleccionarVarios([2, 3], false); agruparSeleccion(); seleccionarVarios([0, 1, 2, 3], false); });
  ok('el panel de la selección ofrece alinear y repartir', await p.evaluate(() => document.querySelectorAll('#propsContorno .al-b').length === 6 && /Repartir/.test(document.getElementById('propsContorno').textContent)));
  await p.evaluate(() => alinearSeleccion('izq')); let c = await cs();
  ok('alinear a la izquierda: las tres piezas empiezan en X0', cerca(bb(c[0]).x0, 0) && cerca(bb(c[1]).x0, 0) && cerca(bb(c[2]).x0, 0), c.map(o => bb(o).x0).join());
  ok('el grupo se mueve como una pieza (el hueco sigue dentro)', cerca(bb(c[3]).x0, 2) && cerca(bb(c[3]).y0, 10));
  await p.keyboard.press('Control+z'); await p.evaluate(() => { seleccionarVarios([0, 1, 2, 3], false); alinearSeleccion('arriba'); }); c = await cs();
  ok('alinear arriba: todas acaban en Y48', [0, 1, 2].every(i => cerca(bb(c[i]).y1, 48)), c.map(o => bb(o).y1).join());
  await p.evaluate(() => alinearSeleccion('centroX')); c = await cs();
  ok('centrar (mismo centro en X)', [0, 1, 2].every(i => cerca((bb(c[i]).x0 + bb(c[i]).x1) / 2, 60)), c.map(o => (bb(o).x0 + bb(o).x1) / 2).join());
  await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z');
  await p.evaluate(() => { seleccionarVarios([0, 1, 2, 3], false); repartirSeleccion('x'); }); c = await cs();
  const h1 = bb(c[1]).x0 - bb(c[0]).x1, h2 = bb(c[2]).x0 - bb(c[1]).x1;
  ok('repartir en horizontal: la misma separación (y los extremos quietos)', cerca(h1, h2) && cerca(h1, 30) && cerca(bb(c[0]).x0, 0) && cerca(bb(c[2]).x1, 120), `${h1} ${h2}`);
  await p.evaluate(() => { seleccionarVarios([0, 1], false); repartirSeleccion('x'); });
  ok('repartir con dos piezas avisa y no hace nada', await p.evaluate(() => /tres o más/.test(document.getElementById('snackbar').textContent)));

  // ── BLOQUEAR
  await montar([rect(0, 0, 50, 30), rect(70, 0, 20, 20)]);
  await p.evaluate(() => { seleccionarUno(0); bloquearSeleccion(true); }); c = await cs();
  ok('bloquear: el contorno queda marcado y sin seleccionar', c[0].bloq && await p.evaluate(() => !seleccionados().length));
  let q = await pant({ x: 25, y: 0 }); await p.mouse.click(q.x, q.y); await p.waitForTimeout(80);
  ok('clic en un contorno bloqueado: no se coge', await p.evaluate(() => !seleccionados().includes(0)));
  const a = await pant({ x: 25, y: 15 }), z = await pant({ x: 25, y: 0 }); await p.mouse.move(z.x, z.y); await p.mouse.down(); await p.mouse.move(a.x + 60, a.y - 40, { steps: 5 }); await p.mouse.up(); c = await cs();
  ok('arrastrar sobre él no lo mueve', cerca(c[0].pts[0][0], 0) && cerca(c[0].pts[0][1], 0), JSON.stringify(c[0].pts[0]));
  await p.keyboard.press('Escape'); await p.keyboard.press('Control+a');
  ok('Ctrl+A deja fuera los bloqueados', (await p.evaluate(() => seleccionados().join())) === '1');
  await p.evaluate(() => seleccionarCaja({ x: -10, y: -10 }, { x: 100, y: 40 }, false)).catch(() => {});
  ok('la lista lo marca con 🔒', await p.evaluate(() => /🔒/.test(document.querySelector('.ct-item[data-i="0"]').textContent)));
  await p.evaluate(() => document.querySelector('.ct-item[data-i="0"]').click());
  ok('desde la lista sí se selecciona, y el panel ofrece desbloquear', await p.evaluate(() => seleccionados().join() === '0' && /Desbloquear/.test(document.getElementById('propsContorno').textContent)));
  await p.keyboard.press('ArrowRight'); c = await cs(); ok('las flechas no mueven un bloqueado', cerca(c[0].pts[0][0], 0));
  const j = await p.evaluate(() => exportarJSON(true)); await p.evaluate(d => abrirJSONDatos(d), j); c = await cs();
  ok('el JSON guarda el bloqueo', c[0].bloq && !c[1].bloq);
  await p.evaluate(() => { seleccionarUno(0); bloquearSeleccion(false); }); c = await cs(); ok('desbloquear', !c[0].bloq);

  // ── RECORTAR
  await montar([[[[0, 0], [100, 0]], false], [[[50, -50], [50, 50]], false]]);
  await p.keyboard.press('y'); ok('Y: herramienta Recortar', await p.evaluate(() => herramienta === 'recortar'));
  q = await pant({ x: 80, y: 0 }); await p.mouse.move(q.x, q.y); await p.waitForTimeout(60);
  ok('vista previa del trozo (sin errores)', await p.evaluate(() => { const r = calcularRecorte(cursorRaw); return r && !r.error && Math.abs(r.ant.s - 50) < 1e-6 && !r.sig; }));
  await p.mouse.click(q.x, q.y); c = await cs();
  ok('recortar el extremo de una recta hasta el cruce', c.length === 2 && JSON.stringify(c[0].pts) === '[[0,0],[50,0]]', JSON.stringify(c.map(o => o.pts)));
  await p.keyboard.press('Control+z'); c = await cs(); ok('Ctrl+Z lo deshace', JSON.stringify(c[0].pts) === '[[0,0],[100,0]]');
  // trozo central entre dos cortes
  await montar([[[[0, 0], [100, 0]], false], [[[30, -20], [30, 20]], false], [[[70, -20], [70, 20]], false]]);
  await p.evaluate(() => { setHerramienta('recortar'); recortarEn({ x: 50, y: 0.3 }); }); c = await cs();
  const hz = c.filter(o => o.pts.every(v => v[1] === 0)).map(o => JSON.stringify(o.pts)).sort();
  ok('recortar el trozo central: quedan los dos lados', c.length === 4 && hz.join() === '[[0,0],[30,0]],[[70,0],[100,0]]', hz.join(' '));
  // contorno cerrado cruzado por una recta
  await montar([rect(0, 0, 100, 50), [[[50, -10], [50, 60]], false]]);
  await p.evaluate(() => recortarEn({ x: 100, y: 25 })); c = await cs();
  const r0 = c.find(o => o.pts.length > 2);
  ok('recortar un contorno cerrado: queda abierto y sin la mitad derecha', c.length === 2 && r0 && !r0.cerrado && r0.pts.every(v => v[0] <= 50 + 1e-6) && r0.pts.some(v => v[0] === 0), JSON.stringify(c.map(o => o.pts)));
  // con una línea auxiliar
  await montar([[[[0, 10], [100, 10]], false]], [{ t: 'L', p: { x: 30, y: 0 }, d: { x: 0, y: 1 } }]);
  await p.evaluate(() => recortarEn({ x: 10, y: 10 })); c = await cs();
  ok('recortar hasta una línea auxiliar', c.length === 1 && JSON.stringify(c[0].pts) === '[[30,10],[100,10]]', JSON.stringify(c[0].pts));
  // círculo (arco) cortado por una recta
  await montar([[[[0, 0], [20, 0]], true, [1, 1]], [[[-30, 0], [30, 0]], false]]);
  await p.evaluate(() => recortarEn({ x: 10, y: 10 })); c = await cs();
  const arc = c.find(o => o.b.some(v => v));
  ok('recortar medio círculo: queda el arco de abajo', c.length === 2 && arc && !arc.cerrado && await p.evaluate(i => { const m = muestrearContorno(contornos[i]); return m.every(q => q.y <= 1e-6); }, c.indexOf(arc)), JSON.stringify(arc));
  // sin cruces
  await montar([[[[0, 0], [100, 0]], false]]);
  await p.evaluate(() => recortarEn({ x: 50, y: 0 }));
  ok('sin cruces: avisa y no toca nada', (await cs()).length === 1 && await p.evaluate(() => /no cruza/.test(document.getElementById('snackbar').textContent)));
  // bloqueado: no se recorta pero sí corta a los demás
  await montar([[[[0, 0], [100, 0]], false], [[[50, -50], [50, 50]], false]]);
  await p.evaluate(() => { contornos[1].bloqueado = true; recortarEn({ x: 50, y: 30 }); recortarEn({ x: 90, y: 0 }); }); c = await cs();
  ok('un bloqueado no se recorta, pero sirve de borde', JSON.stringify(c[1].pts) === '[[50,-50],[50,50]]' && JSON.stringify(c[0].pts) === '[[0,0],[50,0]]', JSON.stringify(c.map(o => o.pts)));
  await p.keyboard.press('Escape'); ok('Esc vuelve a Editar', await p.evaluate(() => herramienta === 'editar'));

  // ── ALARGAR
  await montar([[[[0, 0], [40, 0]], false], [[[100, -50], [100, 50]], false]]);
  await p.keyboard.press('h'); ok('H: herramienta Alargar', await p.evaluate(() => herramienta === 'alargar'));
  q = await pant({ x: 37, y: 0 }); await p.mouse.move(q.x, q.y); await p.waitForTimeout(60); await p.mouse.click(q.x, q.y); c = await cs();
  ok('alargar una recta hasta el contorno', JSON.stringify(c[0].pts) === '[[0,0],[100,0]]', JSON.stringify(c[0].pts));
  // por el principio, hasta un círculo auxiliar
  await montar([[[[0, 0], [40, 0]], false]], [{ t: 'C', c: { x: 0, y: 0 }, r: 15 }]);
  await p.evaluate(() => alargarEn({ x: 1, y: 0 })); c = await cs();
  ok('por el otro extremo, hasta un círculo auxiliar', JSON.stringify(c[0].pts) === '[[-15,0],[40,0]]', JSON.stringify(c[0].pts));
  // arco de un cuarto (centro 0,0; r 50) hasta la recta X-30
  await montar([[[[50, 0], [0, 50]], false, [Math.tan(Math.PI / 8), 0]], [[[-30, -100], [-30, 100]], false]]);
  await p.evaluate(() => alargarEn({ x: 3, y: 49.9 })); c = await cs();
  const fin = c[0].pts[1];
  ok('alargar un arco: llega a X-30 Y40 siguiendo la circunferencia', cerca(fin[0], -30, 1e-3) && cerca(fin[1], 40, 1e-3) && await p.evaluate(() => { const a = arcoDeBulge(contornos[0].pts[0], contornos[0].pts[1], contornos[0].b[0]); return Math.abs(a.r - 50) < 1e-6 && Math.hypot(a.c.x, a.c.y) < 1e-6; }), JSON.stringify(c[0]));
  await montar([[[[0, 0], [40, 0]], false]]);
  await p.evaluate(() => alargarEn({ x: 38, y: 0 }));
  ok('sin nada delante: avisa', await p.evaluate(() => /no llega/.test(document.getElementById('snackbar').textContent)));

  // ── Corrector: abre un ejercicio con bloqueos sin errores
  const co = await ctx.newPage(); co.on('pageerror', e2 => errs.push('corrector: ' + e2.message)); await co.goto('file://' + path.join(SUITE, 'corrector.html')); await co.waitForTimeout(600);
  await co.evaluate(d => abrirJSONDatos(d), j); await co.waitForTimeout(100);
  ok('Corrector: abre el ejercicio', await co.evaluate(() => contornos.length === 2));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
