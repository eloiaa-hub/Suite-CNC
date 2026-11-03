// Calcador v105: «Seleccionar puntos» (doble flecha, I): ventana, Mayús, clic, Supr, Esc y deshacer.
const { lanzar, path, SUITE } = require('./comun');
(async () => { const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500);
  let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const cmd = async l => { for (const c of l) { await p.fill('#cmd', c); await p.press('#cmd', 'Enter'); await p.waitForTimeout(90); } };
  await cmd(['G0 X0 Y0', 'G1 X10 Y0', 'G1 X20 Y0', 'G1 X30 Y0', 'G1 X30 Y20', 'G3 X0 Y20 I-15 J0', 'G1 X0 Y0']);
  await cmd(['G0 X50 Y0', 'G1 X60 Y0', 'G1 X60 Y10', 'G1 X50 Y10', 'G1 X50 Y0']);
  await p.evaluate(() => encuadrar()); await p.waitForTimeout(200);
  const scr = (x, y) => p.evaluate(([x, y]) => { const r = cv.getBoundingClientRect(), q = aPantalla({ x, y }); return { x: r.left + q.x, y: r.top + q.y }; }, [x, y]);
  ok('el botón de la doble flecha está junto a la flecha', await p.evaluate(() => { const bs = [...document.querySelectorAll('#toolStrip .tool-btn')]; return bs[0].dataset.h === 'editar' && bs[1].dataset.h === 'puntos'; }));
  await p.evaluate(() => document.activeElement.blur()); await p.keyboard.press('i'); ok('tecla I', await p.evaluate(() => herramienta === 'puntos'));
  // ventana sobre (10,0) y (20,0)
  let a = await scr(7, 3), c = await scr(23, -3); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(c.x, c.y, { steps: 5 }); await p.screenshot({ path: '/tmp/claude-0/inf/ui/pts1.png' }); await p.mouse.up(); await p.waitForTimeout(150);
  ok('la ventana elige los dos puntos', await p.evaluate(() => selPuntos.size === 2) && /2 puntos elegidos/.test(await p.textContent('#stHint')));
  await p.screenshot({ path: '/tmp/claude-0/inf/ui/pts2.png' });
  await p.keyboard.press('Delete'); await p.waitForTimeout(150);
  let r = await p.evaluate(() => contornos[0].pts.map(q => [q.x, q.y]).join(' ') + ' | arcos ' + contornos[0].b.filter(x => x).length + ' | ' + contornos[0].cerrado);
  ok('Supr los borra: el contorno conserva su arco y sigue cerrado', r === '0,0 30,0 30,20 0,20 | arcos 1 | true', r);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
  ok('Ctrl+Z los recupera', await p.evaluate(() => contornos[0].pts.length === 6 && selPuntos.size === 0));
  // Mayús: añadir; un clic: solo ese; un contorno entero
  a = await scr(45, -5); c = await scr(65, 15); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(c.x, c.y, { steps: 4 }); await p.mouse.up();
  const v = await scr(30, 20); await p.keyboard.down('Shift'); await p.mouse.click(v.x, v.y); await p.keyboard.up('Shift'); await p.waitForTimeout(100);
  ok('ventana + Mayús y clic: 5 puntos', await p.evaluate(() => selPuntos.size === 5));
  await p.keyboard.press('Backspace'); await p.waitForTimeout(150);
  r = await p.evaluate(() => contornos.length + ' contorno · ' + contornos[0].pts.length + ' puntos · arcos ' + contornos[0].b.filter(x => x).length);
  ok('borra el contorno pequeño entero y el punto del arco (el tramo queda recto)', r === '1 contorno · 5 puntos · arcos 0', r);
  await p.keyboard.press('Escape'); const v2 = await scr(10, 0); await p.mouse.click(v2.x, v2.y); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok('Esc: ninguno', await p.evaluate(() => selPuntos.size === 0));
  await p.keyboard.press('v'); ok('al cambiar de herramienta no queda nada elegido', await p.evaluate(() => herramienta === 'editar' && selPuntos.size === 0));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); })();
