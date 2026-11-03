// El profesor (Calcador v115 / Corrector v60): su nota y su comentario, ◀ ▶ entre alumnos, guardar y abrir la corrección,
// la hoja de devolución y las notas para Aules con lo del profesor.
const { lanzar, abrir, path, fs } = require('./comun.js');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.json'), 'utf8')), nc = fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.nc'), 'utf8');
    const clase = [['Ana', nc], ['Bruno', nc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20')], ['Carla', nc.replace(/\nM30[^\n]*/, '\n')]];
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(({ d, clase }) => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = clase.map(([a, t]) => ({ alumno: a, archivo: a + '.nc', texto: t })); recorregirMasiva(); }, { d: json, clase });
        const n0 = await pg.evaluate(() => masiva.lista.map(it => it.v.nota));
        // ✎ desde la lista
        await pg.evaluate(() => document.querySelector('#mvTabla tr[data-k="1"] button[data-a="prof"]').click());
        await pg.fill('#profNota', '6,5'); await pg.fill('#profCom', 'Revisa el sentido del arco de la esquina.'); await pg.click('#profOk');
        let R = await pg.evaluate(() => { const it = masiva.lista[1]; return { nota: it.v.nota, auto: it.v.notaAuto, prof: it.notaProf, fila: document.querySelector('#mvTabla tr[data-k="1"]').textContent }; });
        ok(R.nota === 6.5 && R.auto === n0[1] && /6,5✎💬/.test(R.fila.replace(/\s+/g, '')), `${prog}: ✎ Bruno: nota 6,5 (orientativa ${R.auto}), con ✎💬 en la lista`);
        await pg.evaluate(() => recorregirMasiva());
        ok(await pg.evaluate(() => masiva.lista[1].v.nota === 6.5 && masiva.lista[0].v.nota === masiva.lista[0].v.notaAuto), `${prog}: al recorregir, se conserva la nota del profesor`);
        // la corrección detallada: la barra, ◀ ▶ y Alt+→
        await pg.evaluate(() => verAlumno(0)); await pg.waitForTimeout(300);
        R = await pg.evaluate(() => ({ vis: document.getElementById('crAlumno').style.display !== 'none', txt: document.getElementById('crAlumno').textContent.replace(/\s+/g, ' ') }));
        ok(R.vis && /Ana 1 de 3/.test(R.txt), `${prog}: en la corrección detallada, la barra del alumno: «${R.txt.trim().slice(0, 30)}»`);
        await pg.fill('#crComProf', 'Muy bien.'); await pg.click('#crSig'); await pg.waitForTimeout(300);
        R = await pg.evaluate(() => ({ k: masiva.viendo, nom: document.querySelector('.cr-al-nom b').textContent, nota: document.getElementById('crNotaProf').value, ana: masiva.lista[0].comProf }));
        ok(R.k === 1 && R.nom === 'Bruno' && R.nota === '6.5' && R.ana === 'Muy bien.', `${prog}: ▶ pasa a Bruno (con su nota 6,5) y guarda el comentario de Ana`);
        await pg.keyboard.press('Alt+ArrowRight'); await pg.waitForTimeout(300);
        ok(await pg.evaluate(() => masiva.viendo === 2 && document.getElementById('crSig').disabled), `${prog}: Alt+→ pasa a Carla, la última`);
        await pg.fill('#crNotaProf', '4'); await pg.evaluate(() => volverAMasiva()); await pg.waitForTimeout(200);
        ok(await pg.evaluate(() => masiva.lista[2].notaProf === 4 && masiva.lista[2].v.nota === 4 && document.getElementById('modalMasiva').classList.contains('visible')), `${prog}: al volver a la lista, guarda la nota de Carla (4)`);
        // el CSV
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/"Nota orientativa";"Comentario del profesor"/.test(csv) && /"Bruno"[^\n]*;6,5;[^\n]*"Revisa el sentido del arco de la esquina\."/.test(csv), `${prog}: el CSV, con la nota orientativa y el comentario`);
        // Aules
        const hoja = await pg.evaluate(() => rellenarHojaAules('"Identificador","Nombre completo","Calificación","Calificación máxima","Comentarios de retroalimentación"\n"Participante 1","Bruno","","10,00",""\n', { comentario: true }));
        ok(/"6,50"/.test(hoja.texto) && /Comentario del profesor: Revisa el sentido del arco de la esquina\.\nNota: 6,5 sobre 10 \(orientativa del Corrector: [\d,]+\)\./.test(hoja.texto), `${prog}: Aules: 6,50 y el comentario del profesor delante`);
        // la devolución
        const dev = await pg.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write: t => { h += t; }, close() {} }, focus() {}, print() {}, addEventListener() {} }); try { imprimirDevoluciones(); } finally { window.open = o; } return h; });
        ok((dev.match(/<section class="inf">/g) || []).length === 3 && !/class="inf res"/.test(dev) && /<title>Devolución/.test(dev) && /Lo que tienes que revisar/.test(dev), `${prog}: 🖨 Devoluciones: una hoja por alumno, sin el resumen de la clase`);
        ok(/Comentario del profesor:<\/b> Revisa el sentido/.test(dev) && /<span>Nota del profesor<\/span><b>6,5<\/b>/.test(dev) && /<span>Nota<\/span>/.test(dev), `${prog}: con el comentario, «Nota del profesor» o «Nota»`);
        // guardar y abrir la corrección
        const d = await pg.evaluate(() => JSON.parse(JSON.stringify(datosCorreccion())));
        ok(d.tipo === 'correccion-calcador' && d.lista.length === 3 && d.lista[1].notaProf === 6.5 && d.lista[0].comProf === 'Muy bien.' && d.ejercicio && d.ejercicio.calcador, `${prog}: 💾 la corrección guardada (ejercicio, programas, notas y comentarios)`);
        await pg.evaluate(() => { masiva.lista = []; contornos = []; pintarMasiva(); });
        await pg.evaluate(d => abrirDatosCorreccion(d), d); await pg.waitForTimeout(300);
        const R2 = await pg.evaluate(() => masiva.lista.map(it => [it.alumno, it.v.nota, it.notaProf ?? null, it.comProf || ''].join('|')));
        ok(R2.join('/') === `Ana|${n0[0]}||Muy bien./Bruno|6.5|6.5|Revisa el sentido del arco de la esquina./Carla|4|4|` && await pg.evaluate(() => hayPieza()), `${prog}: 📂 al abrirla, todo como estaba (${R2.join(' / ')})`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close(); console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
