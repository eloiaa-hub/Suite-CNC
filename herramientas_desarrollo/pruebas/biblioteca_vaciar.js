// Calcador v129: vaciar la biblioteca, agregar o sustituir al importar, cotas manuales en Dibujo; Arcos I J: botón de R.
const { lanzar, path, SUITE, fs } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
const dir = path.join(SUITE, 'biblioteca_inicio/Nivel 1 - Rectas');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let respuesta = true, textos = []; p.on('dialog', d => { textos.push(d.message()); respuesta ? d.accept() : d.dismiss(); });
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
  const arch = fs.readdirSync(dir).filter(x => x.endsWith('.json')).slice(0, 5).map(x => path.join(dir, x));
  const n = () => p.evaluate(async () => { await bibCargar(); return bib.lista.length; });
  await p.evaluate(() => abrirBiblioteca());
  await p.evaluate(async () => { await bibVaciarAlmacen(); await bibCargar(); pintarBiblioteca(); });
  await p.setInputFiles('#bibArchivos', arch.slice(0, 3)); await p.waitForTimeout(500);
  ok('biblioteca vacía: importa sin preguntar', await n() === 3 && !(await p.$('#bibPregunta')), String(await n()));
  // agregar
  await p.setInputFiles('#bibArchivos', arch.slice(2, 5)); await p.waitForSelector('#bibPregunta');
  const txt = await p.textContent('#bibPregunta'); ok('pregunta con las cantidades', /3 ejercicios/.test(txt));
  await p.screenshot({ path: path.join(OUT, 'bib_pregunta.png') });
  await p.click('#bibPregunta button[data-r="agregar"]'); await p.waitForTimeout(500);
  ok('agregar: suma los nuevos y no duplica', await n() === 5, String(await n()));
  // cancelar
  await p.setInputFiles('#bibArchivos', arch.slice(0, 1)); await p.waitForSelector('#bibPregunta'); await p.click('#bibPregunta button[data-r=""]'); await p.waitForTimeout(300);
  ok('cancelar: no cambia nada', await n() === 5);
  // archivo que no es un ejercicio: no pregunta ni borra
  const malo = path.join(OUT, 'no_es_ejercicio.json'); fs.writeFileSync(malo, '{"hola":1}');
  await p.setInputFiles('#bibArchivos', [malo]); await p.waitForTimeout(300);
  ok('archivo no válido: ni pregunta ni borra', await n() === 5 && !(await p.$('#bibPregunta')));
  // sustituir
  await p.setInputFiles('#bibArchivos', arch.slice(0, 1)); await p.waitForSelector('#bibPregunta'); await p.click('#bibPregunta button[data-r="sustituir"]'); await p.waitForTimeout(400);
  ok('sustituir: queda solo lo importado', await n() === 1, String(await n()));
  // paquete: copia exportada
  const paq = path.join(OUT, 'paquete_bib.json');
  await p.setInputFiles('#bibArchivos', arch.slice(1, 3)); await p.waitForSelector('#bibPregunta'); await p.click('#bibPregunta button[data-r="agregar"]'); await p.waitForTimeout(400);
  const json = await p.evaluate(() => JSON.stringify({ tipo:'biblioteca-calcador', version:1, ejercicios: bib.lista.map(e => ({ ruta:e.ruta, archivo:e.archivo, datos:e.datos, meta:{ nivel:'arcos', etiquetas:['x'] }, anadido:e.anadido, actualizado:e.actualizado })) })); fs.writeFileSync(paq, json);
  await p.setInputFiles('#bibArchivos', arch.slice(3, 4)); await p.waitForSelector('#bibPregunta'); await p.click('#bibPregunta button[data-r="sustituir"]'); await p.waitForTimeout(300);
  await p.setInputFiles('#bibArchivos', [paq]); await p.waitForSelector('#bibPregunta'); const t3 = await p.textContent('#bibPregunta'); await p.click('#bibPregunta button[data-r="sustituir"]'); await p.waitForTimeout(400);
  const et = await p.evaluate(() => bib.lista.every(e => e.meta.etiquetas[0] === 'x'));
  ok('una copia exportada: cuenta sus ejercicios, y conserva etiquetas', await n() === 3 && /3 ejercicios/.test(t3) && et);
  // vaciar
  respuesta = false; await p.click('#bibVaciar'); await p.waitForTimeout(300); ok('vaciar y cancelar: no borra', await n() === 3 && /No se puede deshacer/.test(textos[textos.length - 1]));
  respuesta = true; await p.click('#bibVaciar'); await p.waitForTimeout(400); ok('vaciar: queda vacía', await n() === 0 && !!(await p.evaluate(() => document.getElementById('bibCuenta').textContent !== undefined)));
  textos = []; await p.click('#bibVaciar'); await p.waitForTimeout(200); ok('ya vacía: no pregunta', !textos.length);
  await p.evaluate(() => cerrarBiblioteca());
  // cotas manuales
  const c = await p.evaluate(() => { const f = document.getElementById('fmCota'), d = f.closest('details'), pane = f.closest('#c2PaneDib'); const antes = d && d.open; const sum = d && d.querySelector('summary').textContent; setHerramienta('cotaman'); const abierto = d && d.open, tab = pane && !pane.hidden; return { enDibujo: !!pane, sum, antes, abierto, tab, visible: f.offsetParent !== null, nada: getComputedStyle(document.getElementById('fmNada')).display }; });
  ok('cotas manuales: en Dibujo, plegadas y se abren con la herramienta', c.enDibujo && c.sum === 'Cotas manuales' && c.antes === false && c.abierto && c.tab && c.visible, JSON.stringify(c));
  await p.evaluate(() => { document.getElementById('fmCota').closest('details').open = false; });
  const c2 = await p.evaluate(() => { const d = document.getElementById('fmCota').closest('details'); d.open = true; document.getElementById('cmTipo').value = 'angulo'; document.getElementById('cmTipo').dispatchEvent(new Event('change', { bubbles:true })); return cfgCotaMan.tipo; });
  ok('el selector sigue funcionando', c2 === 'angulo', c2);
  await p.locator('#c2PaneDib').screenshot({ path: path.join(OUT, 'dib_cotaman.png') });
  ok('Calcador: sin errores', !errs.length, errs.join(' | '));
  // Corrector
  const pc = await b.newPage(); const ec = []; pc.on('pageerror', e => ec.push(e.message)); await pc.goto('file://' + path.join(SUITE, 'corrector.html')); await pc.waitForTimeout(800); ok('Corrector: abre sin errores', !ec.length, ec.join(' | ')); await pc.close();
  // Arcos I J
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } }); const ea = []; q.on('pageerror', e => ea.push(e.message));
  await q.goto('file://' + path.join(SUITE, 'arcos_ij.html')); await q.evaluate(() => localStorage.clear()); await q.reload(); await q.waitForTimeout(400);
  await q.evaluate(() => { cfg.leer = ['r']; ponerNivel('leer'); for (let i = 0; i < 30 && ej.sub !== 'r'; i++) nuevoEjercicio(); elegirArco(0); });
  const col = await q.evaluate(() => { const [a, c] = document.querySelectorAll('.opc-arco'), s = getComputedStyle(a), t = getComputedStyle(c); return { sub: ej.sub, color: s.color, fondo: s.backgroundColor, otroFondo: t.backgroundColor, otroColor: t.color }; });
  await q.waitForTimeout(300);
  const col2 = await q.evaluate(() => { const [a] = document.querySelectorAll('.opc-arco'), s = getComputedStyle(a); return { color: s.color, fondo: s.backgroundColor }; });
  ok('R elegida: letra blanca sobre color', col.sub === 'r' && col2.color === 'rgb(255, 255, 255)' && !/255, 255, 255|rgba\(0, 0, 0, 0\)/.test(col2.fondo) && col2.fondo !== col.otroFondo, JSON.stringify(col2));
  await q.locator('.opc-arcos').screenshot({ path: path.join(OUT, 'r_boton.png') });
  ok('Arcos I J: sin errores', !ea.length, ea.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
