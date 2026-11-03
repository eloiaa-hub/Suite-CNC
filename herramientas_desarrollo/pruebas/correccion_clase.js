// Calcador v109 / Corrector v54: avisos de los códigos no dados en clase (no bajan la nota), la rúbrica por apartados
// (opcional: por defecto, la nota de siempre) y los errores más repetidos de la clase.
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const nc = fs.readFileSync(EJ + '.nc', 'utf8'), json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(() => localStorage.removeItem('calcador_codigos_clase'));
        // ── 8 · los códigos no dados en clase ──
        const raro = '%\nO1000\nN10 G21 G17 G90 G54\nN20 T1 M6 D1\nN30 M3 S12000 M08\nN40 G0 Z20\nN50 G01 X10 Y10\nN60 G43 H1 Z5\nN70 M09\nN80 M05 M30\n%';
        const A = await pg.evaluate(t => avisosClase(t).map(h => h.msg), raro);
        const tiene = re => A.some(m => re.test(m));
        ok(tiene(/^línea 1: «%»/) && tiene(/O1000: el número de programa/) && tiene(/G21 \(milímetros \(en clase, G71\)\)/) && tiene(/G54 \(origen de pieza/) && tiene(/G43 \(compensación de longitud/),
            `${prog}: avisa de %, O1000, G21, G54 y G43`);
        ok(tiene(/D1: en clase no se escribe D/) && tiene(/T1 M6: en clase, el cambio de herramienta se escribe así: T101 M06/) && tiene(/M3 S12000: en clase se escribe primero la velocidad/) && tiene(/M08 \(refrigerante\)/) && tiene(/M09/),
            `${prog}: avisa de D1, T1 M6, M3 S12000, M08 y M09`);
        ok(!tiene(/G17|G90|G01|G0 |M05|M30/), `${prog}: no avisa de G17, G90, G01, M05 ni M30 (dados en clase)`);
        ok(A.filter(m => /^%|«%»/.test(m.replace(/^[^:]*: /, ''))).length === 1 && tiene(/\(y 1 vez más\)/), `${prog}: un aviso por código, con las veces que se repite`);
        const bien = await pg.evaluate(t => avisosClase(t).length, nc);
        ok(bien === 0, `${prog}: el programa de la solución, sin avisos (${bien})`);
        const notas = await pg.evaluate(({ d, t }) => { abrirJSONDatos(d); const malo = t.replace('T101 M06', 'T1 M6 D1').replace('S12000 M03', 'M3 S12000 M08');
            const con = corregirPrograma(malo), vc = valorarCorreccion(con); cfgClase.activo = false; const sin = corregirPrograma(malo), vs = valorarCorreccion(sin); cfgClase.activo = true;
            return { nc: vc.nota, ns: vs.nota, ac: vc.avisos, as: vs.avisos, clase: con.hallazgos.filter(h => h.cat === 'clase').length, ok: con.ok === sin.ok }; }, { d: json, t: nc });
        ok(notas.clase === 4 && notas.ac === notas.as + 4 && notas.nc === notas.ns && notas.ok, `${prog}: 4 avisos de clase (T1 M6, D1, M3 S12000, M08), la misma nota (${notas.nc}) y el mismo veredicto (${JSON.stringify(notas)})`);
        // la lista, cambiada y guardada
        await pg.evaluate(() => { editarCodigosClase(); document.getElementById('ccLista').value = CODIGOS_CLASE_DEF + ' G54'; document.getElementById('ccOk').click(); });
        const g54 = await pg.evaluate(t => ({ a: avisosClase(t).some(h => /G54/.test(h.msg)), guardado: /G54/.test(localStorage.getItem('calcador_codigos_clase')) }), raro);
        ok(!g54.a && g54.guardado, `${prog}: con G54 en la lista, ya no avisa (y queda guardada)`);
        await pg.evaluate(() => { localStorage.removeItem('calcador_codigos_clase'); cfgClase.codigos = CODIGOS_CLASE_DEF; cfgClase.activo = true; });
        // ── la clase: 5 programas ──
        const clase = [
            ['Ana', nc],                                                                                   // bien, con comentarios
            ['Bruno', nc.replace(/;.*$/gm, '')],                                                          // bien, sin comentarios
            ['Carla', nc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20')],                          // G3 en vez de G2
            ['David', nc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20').replace(/;.*$/gm, '')],    // el mismo error
            ['Elena', nc.replace(/\nM30[^\n]*/, '\n')],                                                    // sin M30
        ];
        await pg.evaluate(({ d, clase }) => { abrirJSONDatos(d); delete cfgCorr.rubrica; abrirMasiva(); masiva.lista = clase.map(([a, t]) => ({ alumno: a, archivo: a + '.nc', texto: t })); recorregirMasiva(); }, { d: json, clase });
        const n0 = await pg.evaluate(() => masiva.lista.map(it => it.v.nota));
        ok(await pg.evaluate(() => document.getElementById('mvModoNota').value === 'siempre' && !masiva.lista.some(it => it.v.rub)), `${prog}: por defecto, la nota de siempre (${n0.join(', ')})`);
        // ── 7 · la rúbrica ──
        await pg.selectOption('#mvModoNota', 'apartados'); await pg.waitForTimeout(200);
        const R = await pg.evaluate(() => masiva.lista.map(it => ({ a: it.alumno, n: it.v.nota, s: it.v.notaSiempre, rub: Object.fromEntries(it.v.rub.map(x => [x.k, x.puntos])) })));
        const r = n => R.find(x => x.a === n);
        ok(r('Ana').n === 10 && r('Ana').s === n0[0], `${prog}: rúbrica: Ana, 10 (${JSON.stringify(r('Ana').rub)})`);
        ok(r('Bruno').rub.coment === 0 && r('Bruno').n === 9.5, `${prog}: Bruno, sin comentarios: ${r('Bruno').n}`);
        ok(r('Elena').rub.fin < 1 && r('Elena').n < 10, `${prog}: Elena, sin M30: final ${r('Elena').rub.fin} → ${r('Elena').n}`);
        ok(r('Carla').rub.geo < 4 && r('Carla').n < r('Ana').n, `${prog}: Carla, con el arco al revés: geometría ${r('Carla').rub.geo} → ${r('Carla').n}`);
        ok(await pg.evaluate(() => document.getElementById('mvBtnRub').style.display === '' && [...document.querySelectorAll('.mv-crit-siempre')].every(e => e.style.display === 'none')), `${prog}: se ve ⚙ Rúbrica… y se ocultan los pesos de siempre`);
        await pg.evaluate(() => { editarRubrica(); document.querySelector('#modalRubrica input[data-k="coment"]').value = '0'; document.getElementById('rubOk').click(); });
        ok(await pg.evaluate(() => masiva.lista.find(it => it.alumno === 'Bruno').v.nota === 10 && cfgCorr.rubrica.pesos.coment === 0), `${prog}: con los comentarios a 0, Bruno saca un 10`);
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/"Compensación \(rúbrica\)";"Lo pedido \(rúbrica\)"/.test(csv), `${prog}: el CSV, con los apartados`);
        const inf = await pg.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write: t => { h += t; }, close() {} }, focus() {}, print() {}, addEventListener() {} }); try { imprimirInformes(); } catch (e) { h = 'ERROR ' + e.message; } finally { window.open = o; } return h; });
        ok(/<th>Compensación<\/th>/.test(inf) && /por apartados \(rúbrica/.test(inf), `${prog}: el informe, con el desglose por apartados ${inf.startsWith('ERROR') ? inf : ''}`);
        // ── 6 · los errores más repetidos ──
        ok(/Los errores más repetidos/.test(inf) && /Carla, David/.test(inf), `${prog}: el resumen de los informes, con los errores más repetidos`);
        const E = await pg.evaluate(() => erroresClase().map(e => ({ t: e.tipo, n: e.alumnos.length, a: e.alumnos.join(','), x: e.titulo })));
        const g = E.find(e => e.a === 'Carla,David' && e.t === 'error');
        ok(g && E[0].n >= 2, `${prog}: Carla y David, juntos en el mismo error: «${g && g.x.slice(0, 90)}»`);
        await pg.evaluate(() => verErroresClase()); await pg.waitForTimeout(150);
        const vis = await pg.evaluate(() => ({ filas: document.querySelectorAll('#errLista tr').length - 1, vis: document.getElementById('modalErrClase').classList.contains('visible') }));
        await pg.evaluate(() => { const r = document.querySelector('#modalErrClase input[value="error"]'); r.checked = true; r.onchange(); });
        const soloErr = await pg.evaluate(() => [...document.querySelectorAll('#errLista .err-tipo')].every(e => e.classList.contains('error')));
        ok(vis.vis && vis.filas === E.length && soloErr, `${prog}: la ventana, con ${vis.filas} errores y avisos y el filtro «solo errores»`);
        // volver a la de siempre: las notas de antes
        await pg.selectOption('#mvModoNota', 'siempre'); await pg.waitForTimeout(200);
        ok(JSON.stringify(await pg.evaluate(() => masiva.lista.map(it => it.v.nota))) === JSON.stringify(n0), `${prog}: con la de siempre, otra vez las notas de antes`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
