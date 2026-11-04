// Examen para 18 alumnos. Calcador v121: 18 variantes distintas, una por alumno, y la corrección masiva con cada una.
// Arcos I J v4: 📝 Examen para Aules (Moodle XML): 18 versiones distintas por tipo, respuestas coherentes con la geometría y plano PNG.
const { lanzar, abrir, path, SUITE, fs, ejercicios } = require('./comun');
const OUT = process.env.OUT || require('os').tmpdir();
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const d = JSON.parse(fs.readFileSync(ejercicios().find(f => /\/Ejercicio 18\.json$/.test(f)), 'utf8'));
  const pg = await abrir(b, 'calcador.html'); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.evaluate(d => { localStorage.removeItem('calcador_repartos'); abrirJSONDatos(d); cfgHoja.num = '20'; cfgHoja.titulo = 'Examen'; document.getElementById('projectName').value = 'Examen';
    Object.assign(varCfg, { n: 20, aOriginal: true, ex: true, ey: true, giro: true, cero: true, escala: false, medidas: true, mm: '10, -10' }); abrirVariantes(); }, d); await pg.waitForTimeout(300);
  const nombres = Array.from({ length: 18 }, (_, i) => `Alumno ${String(i + 1).padStart(2, '0')}`);
  const V = await pg.evaluate(() => { const a = estadoGuardado(), o = []; varGen.forEach(v => { abrirJSONDatos(JSON.parse(JSON.stringify(v.datos))); generarMec(); o.push({ etq: etqVar(v), letra: v.letra, nc: ultimoMec.nc, desc: v.desc, cont: JSON.stringify(v.datos.calcador.contornos.map(c => c.pts)) }); }); restaurarEstado(a); return o; });
  ok('20 variantes, de la A a la T', V.length === 20 && V[19].letra === 'T', V.map(v => v.etq).join(' '));
  ok('las 20 tienen un programa distinto', new Set(V.map(v => v.nc.replace(/^\(.*$/gm, ''))).size === 20, `${new Set(V.map(v => v.nc.replace(/^\(.*$/gm, ''))).size} distintos`);
  await pg.click('text=👥 Preparar el examen (repartir)…'); await pg.waitForTimeout(200);
  await pg.fill('#repLista', nombres.join('\n')); await pg.evaluate(() => { const l = document.getElementById('repLista'); l.dispatchEvent(new Event('input')); l.dispatchEvent(new Event('change')); }); await pg.click('#repRepartir'); await pg.waitForTimeout(150);
  const rep = await pg.evaluate(() => repEx.alumnos.map(a => a.v)); ok('a cada alumno, una variante distinta', new Set(rep).size === 18, rep.join(''));
  const html = await pg.evaluate(async () => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(t) { h += t; }, close() {} } }); try { await document.getElementById('repHojas').onclick(); } finally { window.open = o; } return h; });
  ok('18 hojas con el nombre', (html.match(/<span class="et">Alumno\/a<\/span><span class="v">Alumno \d\d/g) || []).length === 18);
  await pg.screenshot({ path: path.join(OUT, 'examen_reparto.png') });
  const guardado = await pg.evaluate(() => repartosGuardados()['Variantes/Examen']); ok('el reparto queda guardado', guardado && guardado.alumnos.length === 18);
  // cada alumno entrega su programa; el 02 ha hecho el del 01
  const prog = Object.fromEntries(V.map(v => [v.etq, v.nc]));
  await pg.evaluate(({ rep, prog }) => { cerrarVariantes(); document.getElementById('modalReparto').classList.remove('visible'); abrirMasiva(); masiva.lista = []; masiva.ids = {};
    rep.forEach((a, i) => { masiva.lista.push({ alumno: a.n, archivo: 'pieza.nc', texto: i === 1 ? prog[rep[0].etq] : prog[a.etq] }); masiva.ids[a.n] = a.id || ''; }); recorregirMasiva(); }, { rep: guardado.alumnos, prog });
  await pg.evaluate(() => elegirVariantesMasiva()); await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(OUT, 'examen_varmasiva.png') }); await pg.click('#varMasivaSi'); await pg.waitForTimeout(1500);
  const L = await pg.evaluate(() => masiva.lista.map(it => ({ a: it.alumno, asig: it.varAsignada, av: it.varAviso, v: it.v.veredicto, nota: it.v.nota })));
  ok('corrección: cada uno con la suya, y bien', L.filter((x, i) => i !== 1).every(x => x.asig && x.v === 'bien' && !x.av), L.map(x => x.asig + ':' + x.v).join(' '));
  ok('el que ha hecho la de otro, con aviso', /le tocaba la/.test(L[1].av || ''), L[1].av);
  await pg.screenshot({ path: path.join(OUT, 'examen_masiva.png') });
  // el examen con un contorno sencillo: 20 variantes con sus cotas, y la clase corregida con ellas
  const pc = await pg.evaluate(() => { localStorage.removeItem('calcador_repartos'); document.getElementById('modalMasiva') && document.getElementById('modalMasiva').classList.remove('visible'); abrirGenerador(); abrirPiezaContorno(); pcElegirNivel('4'); usarPiezaC(103); cfgHoja.num = '30'; cfgHoja.titulo = 'Examen C'; document.getElementById('projectName').value = 'Examen C';
    Object.assign(varCfg, { n: 20, aOriginal: true, ex: true, ey: true, giro: true, cero: true, escala: false, medidas: true, mm: '10, -10' }); abrirVariantes(); const a = estadoGuardado(), o = {}, mal = [];
    varGen.forEach(v => { const cm = v.datos.calcador.cotasManuales || []; abrirJSONDatos(JSON.parse(JSON.stringify(v.datos))); generarMec(); o[etqVar(v)] = ultimoMec.nc; const ext = contornos.reduce((p, c) => { const A = bboxPts(p.pts), B = bboxPts(c.pts); return (B.x1 - B.x0) > (A.x1 - A.x0) ? c : p; }), bb = bboxPts(ext.pts), cero = Math.min(Math.abs(bb.x0), Math.abs(bb.x1)) < .001 && Math.min(Math.abs(bb.y0), Math.abs(bb.y1)) < .001; if (!cm.length || !cero || cotasManuales.length !== cm.length) mal.push(v.letra); const W = Math.abs(bb.x1 - bb.x0), H = Math.abs(bb.y1 - bb.y0); if (!cotasManuales.some(m => m.tipo === 'h' && Math.abs(Math.abs(m.p2.x - m.p1.x) - W) < .01) || !cotasManuales.some(m => m.tipo === 'v' && Math.abs(Math.abs(m.p2.y - m.p1.y) - H) < .01)) mal.push(v.letra + ' total'); });
    restaurarEstado(a); return { n: varGen.length, mal, o, sin: !document.getElementById('varAviso').textContent.includes('cotas manuales') }; });
  ok('contorno sencillo: 20 variantes, con sus cotas y el cero en una esquina', pc.n === 20 && !pc.mal.length && pc.sin, pc.mal.join());
  ok('contorno sencillo: 20 programas distintos', new Set(Object.values(pc.o).map(x => x.replace(/^\(.*$/gm, ''))).size === 20);
  await pg.click('text=👥 Preparar el examen (repartir)…'); await pg.waitForTimeout(200); await pg.fill('#repLista', nombres.join('\n')); await pg.click('#repRepartir'); await pg.waitForTimeout(150);
  const hx = await pg.evaluate(async () => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(t) { h += t; }, close() {} } }); try { await document.getElementById('repHojas').onclick(); } finally { window.open = o; } return h; });
  ok('las hojas llevan las cotas del contorno sencillo', (hx.match(/<span class="et">Alumno\/a<\/span><span class="v">Alumno \d\d/g) || []).length === 18 && /R\d+/.test(hx) && /Ø\d+/.test(hx));
  const g2 = await pg.evaluate(() => repartosGuardados()['Variantes/Examen C']);
  await pg.evaluate(({ rep, prog }) => { cerrarVariantes(); document.getElementById('modalReparto').classList.remove('visible'); abrirMasiva(); masiva.variantes = []; masiva.lista = []; masiva.ids = {}; rep.forEach(a => { masiva.lista.push({ alumno: a.n, archivo: 'pieza.nc', texto: prog[a.etq] }); masiva.ids[a.n] = a.id || ''; }); recorregirMasiva(); }, { rep: g2.alumnos, prog: pc.o });
  await pg.evaluate(() => elegirVariantesMasiva()); await pg.waitForTimeout(500); await pg.click('#varMasivaSi'); await pg.waitForTimeout(2000);
  const Lc = await pg.evaluate(() => masiva.lista.map(it => ({ asig: it.varAsignada, v: it.v.veredicto, av: it.varAviso }))); ok('contorno sencillo: la clase, corregida con su variante', Lc.length === 18 && Lc.every(x => x.asig && x.v === 'bien' && !x.av), Lc.map(x => x.asig + ':' + x.v).join(' '));
  await pg.close();
  // Arcos I J
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true }); const a = await ctx.newPage(); a.on('pageerror', e => errs.push(e.message));
  await a.goto('file://' + path.join(SUITE, 'arcos_ij.html')); await a.waitForTimeout(600);
  ok('el alumno no ve el botón de examen', !(await a.isVisible('#btnExamenAules')));
  await a.goto('file://' + path.join(SUITE, 'arcos_ij.html') + '#profesor'); await a.reload(); await a.waitForTimeout(800);
  ok('con #profesor se abre la ventana', await a.isVisible('#modalExamen .help-header')); await a.screenshot({ path: path.join(OUT, 'examen_arcos.png') });
  const [dl] = await Promise.all([a.waitForEvent('download', { timeout: 120000 }), a.click('#exBajar')]); const fx = path.join(OUT, 'examen.xml'); await dl.saveAs(fx); const xml = fs.readFileSync(fx, 'utf8');
  ok('nombre del archivo', /Examen de I J \(Aules\)\.xml/.test(dl.suggestedFilename()), dl.suggestedFilename());
  const r = await a.evaluate(t => { const D = new DOMParser().parseFromString(t, 'application/xml'); if (D.querySelector('parsererror')) return { error: 1 };
    const cats = [...D.querySelectorAll('question[type=category] category text')].map(x => x.textContent), q = [...D.querySelectorAll('question[type=cloze]')].map(x => ({ n: x.querySelector('name text').textContent, t: x.querySelector('questiontext > text').textContent, f: x.querySelector('questiontext > file').textContent, s: x.querySelector('generalfeedback text').textContent })); return { cats, q }; }, xml);
  ok('XML válido: 3 categorías y 60 preguntas', r.cats && r.cats.length === 3 && r.q.length === 60, r.cats && r.cats.join(' | '));
  const sinNum = x => x.t.replace(/<img[^>]*>/, ''); ok('60 preguntas distintas', new Set(r.q.map(sinNum)).size === 60);
  ok('huecos Cloze bien escritos', r.q.every(x => { const h = x.t.match(/\{1:[^}]*\}/g) || []; return h.length >= 5 && h.every(y => /^\{1:NUMERICAL:=-?\d+(\.\d)?:0\.05\}$|^\{1:MULTICHOICE:(=G2~G3|G2~=G3)\}$/.test(y)); }));
  ok('la pregunta no lleva la solución fuera de los huecos', r.q.every(x => !/\b[Ii]-?\d/.test(x.t.replace(/\{1:[^}]*\}/g, ''))));
  ok('cada una, con su PNG', r.q.every(x => x.f.startsWith('iVBOR')));
  const png = Buffer.from(r.q[20].f, 'base64'); fs.writeFileSync(path.join(OUT, 'examen_q.png'), png); ok('el plano no es una imagen en blanco', new Set(png).size > 100 && png.length > 6000, png.length + ' bytes');
  // respuestas: se resuelve I J de cada arco desde el modelo con otra cuenta
  const ind = await a.evaluate(() => { const E = examenActual, mal = []; E.grupos.forEach(G => G.lista.forEach(e => e.tramos.forEach(t => { if (!t.q) return; if (Math.abs(t.a.x + t.I - t.C.x) > .051 || Math.abs(t.a.y + t.J - t.C.y) > .051) mal.push('IJ'); if (Math.abs(dist(t.a, t.C) - dist(t.b, t.C)) > .1) mal.push('R'); if (!Number.isInteger(t.I * 10)) mal.push('dec'); const { sw } = angulosArco(t); if ((t.g === 'G2') !== (sw < 0)) mal.push('G'); }))); return { mal, tipos: E.grupos.map(G => G.lista.length), ang: E.grupos[0].lista.map(e => e.ang), pit: E.grupos[1].lista.map(e => e.tramos[1].D.R) }; });
  ok('I, J y el sentido salen de la geometría', !ind.mal.length, ind.mal.slice(0, 5).join());
  ok('dificultad parecida: solo ¼ y ½ vuelta; Pitágoras con resultado entero', ind.ang.every(x => x === 90 || x === 180) && r.q.slice(20, 40).every(x => !/=-?\d+\.\d:/.test(x.t)), `ángulos ${[...new Set(ind.ang)]}`);
  const [w] = await Promise.all([ctx.waitForEvent('page'), a.evaluate(() => imprimirSolucionesExamen())]); await w.waitForTimeout(400); const ns = await w.evaluate(() => document.querySelectorAll('tr').length); ok('🖨 Soluciones: las 60', ns === 60, ns + ' filas'); await w.close();
  const antes = await a.evaluate(() => [cfg.nivel, cfg.ang.join(), Math.random === Math.random]); ok('Arcos I J sigue funcionando después', await a.evaluate(() => { cerrarModal('modalExamen'); nuevoEjercicio(); return !!ej; }));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  console.log('fallos', fallos); await b.close(); process.exit(fallos ? 1 : 0);
})();
