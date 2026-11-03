// Corrección masiva con las variantes de un examen (Calcador v106 / Corrector v51): cada programa se corrige con todas las
// variantes y se queda la que mejor encaja; la que le tocaba sale del nombre del archivo / carpeta / comentario.
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas.json');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const json = JSON.parse(fs.readFileSync(EJ, 'utf8'));
    const b = await lanzar();
    // las variantes y su programa resuelto (con el Calcador)
    const cal = await abrir(b, 'calcador.html');
    const V = await cal.evaluate(async d => {
        abrirJSONDatos(d); cfgHoja.num = '12'; cfgHoja.titulo = 'Examen'; document.getElementById('projectName').value = 'Examen';
        Object.assign(varCfg, { n:4, aOriginal:true, ex:true, ey:true, giro:true, cero:false, escala:false }); generarVariantes();
        const out = varGen.map(v => { abrirJSONDatos(JSON.parse(JSON.stringify(v.datos))); generarMec(); return { letra:v.letra, num:v.datos.cfgHoja && v.datos.cfgHoja.num, datos:v.datos, nc:ultimoMec.nc }; });
        abrirJSONDatos(d); cfgHoja.num = '12'; cfgHoja.titulo = 'Examen'; document.getElementById('projectName').value = 'Examen'; generarVariantes();
        await guardarVariantesBib(false);
        return out;
    }, json);
    ok(V.length === 4 && V.every(v => /^G|^N|^\(|^;|^%/m.test(v.nc)), `4 variantes con su programa`);
    for (const prog of ['calcador.html', 'corrector.html']) {
        const pg = prog === 'calcador.html' ? cal : await abrir(b, prog);
        if (prog !== 'calcador.html') await pg.evaluate(async V => { for (const v of V) await bibGuardarEntrada(entradaDe(v.datos, `Variantes/Examen/Examen - ${v.letra}.json`, `Examen - ${v.letra}.json`)); }, V);
        // el ejercicio de la variante A abierto; los programas de la clase
        await pg.evaluate(({ d, V }) => {
            abrirJSONDatos(JSON.parse(JSON.stringify(V[0].datos))); abrirMasiva(); masiva.lista = [];
            const al = (alumno, archivo, texto) => masiva.lista.push({ alumno, archivo, texto });
            al('Ana', 'ana.nc', V[1].nc);                                 // hace la B, sin decir cuál le tocaba
            al('Berta', 'Berta_12C.nc', V[2].nc);                         // la C, y le tocaba la C
            al('Carlos', 'carlos 12B.nc', V[3].nc);                       // hace la D, le tocaba la B
            al('Diana', 'diana.nc', '(variante D)\n' + V[3].nc);          // la D, lo dice en un comentario
            al('Elena', 'elena.nc', V[0].nc);                             // la A
            recorregirMasiva();
        }, { d: json, V });
        await pg.evaluate(() => elegirVariantesMasiva()); await pg.waitForTimeout(500);
        const marcadas = await pg.evaluate(() => [...document.querySelectorAll('#modalVarMasiva input[data-id]:checked')].length);
        ok(marcadas === 4, `${prog}: la ventana marca las 4 variantes del ejercicio (${marcadas})`);
        await pg.click('#varMasivaSi'); await pg.waitForTimeout(800);
        const L = await pg.evaluate(() => masiva.lista.map(it => ({ a:it.alumno, var:it.variante, asig:it.varAsignada, av:it.varAviso, v:it.v.veredicto, n:it.v.nota })));
        const x = n => L.find(i => i.a === n) || {};
        ok(x('Ana').var === '12B' && x('Ana').v === 'bien' && !x('Ana').av, `${prog}: Ana → ${x('Ana').var} (${x('Ana').v}, ${x('Ana').n})`);
        ok(x('Berta').var === '12C' && x('Berta').asig === '12C' && !x('Berta').av, `${prog}: Berta → ${x('Berta').var}, le tocaba ${x('Berta').asig}`);
        ok(x('Carlos').var === '12B' && /encaja con la variante 12D.*le tocaba la 12B/.test(x('Carlos').av || ''), `${prog}: Carlos → ${x('Carlos').var} · ${x('Carlos').av}`);
        ok(x('Diana').var === '12D' && x('Diana').asig === '12D' && x('Diana').v === 'bien', `${prog}: Diana → ${x('Diana').var} (por «variante D»)`);
        ok(x('Elena').var === '12A' && x('Elena').v === 'bien', `${prog}: Elena → ${x('Elena').var}`);
        const vis = await pg.evaluate(() => ({ marcas: [...document.querySelectorAll('#mvTabla .mv-var')].map(e => e.textContent), dat: document.getElementById('mvEjDat').textContent }));
        ok(vis.marcas.length === 5 && vis.marcas.some(t => /12B ⚠️/.test(t)), `${prog}: la variante junto al nombre: ${vis.marcas.join(' · ')}`);
        ok(/con las variantes 12A, 12B, 12C, 12D/.test(vis.dat), `${prog}: el ejercicio dice las variantes`);
        // el ejercicio abierto no cambia
        ok(await pg.evaluate(() => cfgHoja.num === '12A'), `${prog}: el ejercicio abierto sigue siendo la 12A`);
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/"Variante";"Aviso de variante"/.test(csv) && /Carlos[^\n]*12B[^\n]*le tocaba la 12B/.test(csv), `${prog}: el CSV lleva la variante y su aviso`);
        // ver la corrección de Ana: se abre la 12B; al volver, la 12A
        const k = await pg.evaluate(() => masiva.lista.findIndex(it => it.alumno === 'Ana'));
        await pg.evaluate(k => verAlumno(k), k); await pg.waitForTimeout(400);
        const viendo = await pg.evaluate(() => ({ num: cfgHoja.num, ok: corr && corr.ok }));
        ok(viendo.num === '12B' && viendo.ok, `${prog}: ver a Ana abre la variante 12B (${viendo.num}, ${viendo.ok ? 'bien' : 'mal'})`);
        await pg.evaluate(() => volverAMasiva()); await pg.waitForTimeout(300);
        ok(await pg.evaluate(() => cfgHoja.num === '12A' && document.getElementById('modalMasiva').classList.contains('visible')), `${prog}: al volver, otra vez la 12A y la lista`);
        // los informes: cada alumno con el dibujo de su variante
        const inf = await pg.evaluate(() => { let html = ''; const o = window.open; window.open = () => ({ document: { open() {}, write: t => { html += t; }, close() {} }, focus() {}, print() {}, addEventListener() {}, onload: null });
            try { imprimirInformes(); } catch (e) { html = 'ERROR ' + e.message; } finally { window.open = o; } return html; });
        ok(/🎲 Corregido con la variante 12B/.test(inf) && /le tocaba la 12B/.test(inf), `${prog}: el informe dice la variante ${inf.startsWith('ERROR') ? inf : ''}`);
        // sin variantes: como antes
        await pg.evaluate(() => { elegirVariantesMasiva(); }); await pg.waitForTimeout(400); await pg.click('#varMasivaNo'); await pg.waitForTimeout(300);
        const sin = await pg.evaluate(() => masiva.lista.map(it => it.variante || '').join('') === '' && masiva.lista.find(it => it.alumno === 'Ana').v.veredicto !== 'bien');
        ok(sin, `${prog}: «Sin variantes» corrige con el ejercicio abierto (Ana ya no sale bien)`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
