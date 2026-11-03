// Tutor v2: dejar un ejercicio borra la pieza (sin Deshacer); 🧾 informe de Practicar con su registro; el Corrector lo lee en «Toda la clase» y detecta una copia retocada
const { lanzar, path, SUITE, fs } = require('./comun');
const T = require('os').tmpdir() + '/';
const PIEZA = path.join(__dirname, 'Prueba01.json');
(async () => {
  { const d = JSON.parse(fs.readFileSync(PIEZA, 'utf8')); d.tutor = { ejercicio: true, coord: 'G90', comp: 'auto' }; d.nombre = 'Prueba 01'; fs.writeFileSync(T + 'ej_tutor.json', JSON.stringify(d)); }
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  // 1) el agujero cerrado
  await p.setInputFiles('#fileJSON', T + 'ej_tutor.json'); await p.waitForTimeout(900);
  ok('el ejercicio se abre en Practicar', await p.evaluate(() => !!TU.ejercicio && TU.modo === 'practicar'));
  await p.evaluate(() => tuSalirEjercicio()); await p.waitForTimeout(300);
  let st = await p.evaluate(() => { deshacer(); return { n: contornos.length, ej: !!TU.ejercicio, modo: TU.modo, prog: TU.prog.lineas.length }; });
  ok('«Dejar el ejercicio» borra la pieza y Deshacer no la recupera', st.n === 0 && !st.ej, JSON.stringify(st));
  await p.setInputFiles('#fileJSON', T + 'ej_tutor.json'); await p.waitForTimeout(900);
  await p.evaluate(() => nuevo()); await p.waitForTimeout(300);
  st = await p.evaluate(() => { deshacer(); return { n: contornos.length, ej: !!TU.ejercicio }; });
  ok('«Nuevo» en un ejercicio: igual', st.n === 0 && !st.ej, JSON.stringify(st));
  await p.setInputFiles('#fileJSON', T + 'ej_tutor.json'); await p.waitForTimeout(900);
  st = await p.evaluate(() => { deshacer(); return { n: contornos.length, ej: !!TU.ejercicio }; });
  ok('al abrir el ejercicio, Deshacer no vuelve al dibujo anterior', st.n === 2 && st.ej, JSON.stringify(st));
  // ⬇ Guardar .nc en un ejercicio: solo lo escrito
  const [dl0] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => tuDescargar(false))]); const nc0 = fs.readFileSync(await dl0.path(), 'utf8');
  ok('⬇ Guardar .nc en un ejercicio no da la solución', !/G2|G3/.test(nc0), nc0.split('\n').length + ' líneas');
  // 2) la práctica: errores a propósito, pistas y «Ver la línea»
  const r = await p.evaluate(async () => {
    const L = TU.prog.lineas, malas = { signo: c => c.replace(/X(\d)/, 'X-$1'), g91: c => c.replace(/G90/, 'G91'), basura: () => 'G1 X' };
    let k = 0; const usados = [];
    while (!TU.practica.fin && k < 200) {
      const i = TU.practica.idx, cod = L[i].cod; k++;
      const e = () => document.getElementById('tuEntrada');
      if (i % 5 === 1) { e().value = 'G1 X'; tuComprobar(); usados.push(i + ':basura'); }
      if (i % 4 === 2 && /X\d/.test(cod)) { e().value = cod.replace(/X(\d)/, 'X-$1'); tuComprobar(); usados.push(i + ':signo'); }
      if (i % 7 === 3) { tuPista(); usados.push(i + ':pista'); }
      if (i % 9 === 4) { e().value = 'G0 X0'; tuComprobar(); e().value = 'G0 X0'; tuComprobar(); tuVerLinea(); usados.push(i + ':vista'); continue; }
      e().value = cod; tuComprobar();
      await new Promise(r => setTimeout(r, 0));
    }
    const p = TU.practica; return { fin: p.fin, bien: p.bien, ayuda: p.ayuda, vistas: p.vistas, pistas: p.pistas, fallos: p.fallos, usados: usados.length };
  });
  ok('práctica terminada con fallos, pistas y líneas vistas', r.fin && r.fallos > 0 && r.pistas > 0 && r.vistas > 0, JSON.stringify(r));
  ok('aparece «🧾 Informe para Aules»', await p.evaluate(() => /Informe para Aules/.test(document.getElementById('tuPractica').innerText)));
  await p.evaluate(() => tuAbrirInforme()); await p.waitForTimeout(300);
  ok('sin nombre no se descarga', await p.evaluate(() => document.getElementById('tuInfDescargar').disabled));
  await p.fill('#tuInfAlumno', 'Ana García'); await p.fill('#tuInfGrupo', '1.º DA'); await p.waitForTimeout(100);
  console.log('   resumen:', await p.evaluate(() => document.getElementById('tuInfResumen').innerText.replace(/\n/g, ' | ')));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#tuInfDescargar')]); const pdf = T + 'informe.pdf'; await dl.saveAs(pdf);
  ok('PDF descargado', fs.statSync(pdf).size > 5000, dl.suggestedFilename() + ' · ' + Math.round(fs.statSync(pdf).size / 1024) + ' KB');
  ok('Tutor: sin errores de JavaScript', !errs.length, errs.join(' | '));
  // 3) el Corrector lo lee en «Toda la clase»; una copia retocada no vale
  const raw = fs.readFileSync(pdf, 'latin1'); const m = /\/SuiteCNC \(([A-Za-z0-9+/=]+)\)/.exec(raw);
  const d = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')); d.alumno = 'Bruno Ruiz'; d.tutor.bien = d.tutor.total; d.tutor.vistas = 0; d.tutor.nota = 10;
  fs.writeFileSync(T + 'Bruno Ruiz.pdf', Buffer.from(raw.replace(m[1], Buffer.from(JSON.stringify(d)).toString('base64')), 'latin1'));
  fs.copyFileSync(pdf, T + 'Ana García.pdf');
  const c = await ctx.newPage(); const cerr = []; c.on('pageerror', e => cerr.push(e.message)); c.on('dialog', d => d.accept());
  await c.goto('file://' + path.join(SUITE, 'corrector.html')); await c.evaluate(() => localStorage.clear()); await c.reload(); await c.waitForTimeout(1000);
  await c.setInputFiles('#fileJSON', T + 'ej_tutor.json'); await c.waitForTimeout(700);
  await c.evaluate(() => abrirMasiva()); await c.waitForTimeout(300);
  await c.setInputFiles('#mvArchivos', ['Ana García.pdf', 'Bruno Ruiz.pdf'].map(n => ({ name: n, mimeType: 'application/pdf', buffer: fs.readFileSync(T + n) }))); await c.waitForTimeout(2500);   // (con la ruta, Playwright no sube bien los nombres con tilde)
  const res = await c.evaluate(() => masiva.lista.map(it => ({ alumno: it.alumno, veredicto: it.res && (it.res.veredicto || it.res.estado || ''), inf: estadoInforme(it) })));
  res.forEach(x => console.log('   ', JSON.stringify(x).slice(0, 330)));
  const ana = res.find(x => /Ana/.test(x.alumno)), bruno = res.find(x => /Bruno/.test(x.alumno));
  ok('Corrector: el informe de Ana vale y dice cómo lo ha hecho', ana && ana.inf.ok && /informe del Tutor/.test(ana.inf.txt));
  ok('Corrector: el de Bruno (retocado: nota 10) no vale', bruno && !bruno.inf.ok);
  ok('Corrector: sin errores de JavaScript', !cerr.length, cerr.join(' | '));
  console.log('fallos', fallos); await b.close();
})();
