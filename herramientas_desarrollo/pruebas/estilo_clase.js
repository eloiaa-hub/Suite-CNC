// 🔍 Estilo distinto al de clase (Corrector v82 / Calcador v137): indicios de un programa que no está escrito como en clase
// (comentarios en inglés, la cabecera de los manuales, X10.000, caracteres de un chat, los comentarios de la solución del
// Calcador, el programa generado por el Calcador, códigos no dados). No cambia la nota. Datos inventados.
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const nc = fs.readFileSync(EJ + '.nc', 'utf8');
const base = nc.split('\n').map(l => l.replace(/;.*$/, '').trim()).filter(Boolean);
const clase = base.map((l, i) => i === 3 ? l + ' ; arranco el husillo' : l).join('\n');
const ingles = ['```gcode', '%', 'O1000', '(Profile contour - generated program)', 'G21 G17 G40 G49 G80 G90 ; safety line', 'G54 ; work offset', 'T1 M6 ; tool change',
    'M3 S12000 ; spindle on', ...base.slice(6).map(l => l.replace(/([XYIJZ])(-?\d+)(?![\d.])/g, '$1$2.000') + ' ; move to next point'), 'M5', 'M30 ; end of program', '%', '```'].join('\n');
const tutor = base.map((l, i) => l + (i > 5 ? ` ; P${i} → P${i + 1}: recta` : i === 4 ? ' ; arranca el husillo a 12000 rpm' : '')).join('\n');
(async () => {
    const b = await lanzar(), json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    for (const prog of ['corrector.html', 'calcador.html']) {
        const p = await abrir(b, prog);
        await p.evaluate(() => localStorage.removeItem('calcador_estilo'));
        const E = await p.evaluate(T => T.map(t => estiloPrograma(t).map(x => x.k)), [clase, ingles, tutor, nc]);
        ok(E[0].length === 0, `${prog}: un programa como los de clase, sin indicios (${E[0].join() || 'ninguno'})`);
        ok(['ingles', 'cabecera', 'decimales', 'raros', 'codigos'].every(k => E[1].includes(k)), `${prog}: el de un chat: ${E[1].join(', ')}`);
        ok(E[2].includes('calcador') && E[2].length === 1, `${prog}: con los comentarios de la solución del Calcador: ${E[2].join(', ')}`);
        ok(E[3].includes('generado') && !E[3].includes('raros'), `${prog}: el generado por el Calcador: ${E[3].join(', ')}`);
        // en la corrección masiva: la marca 🔍, el resumen, la ventana, el informe del profesor (no la devolución) y el CSV
        await p.evaluate(({ d, L }) => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = L.map((t, k) => ({ alumno: 'Alumno ' + (k + 1), archivo: `p${k}.nc`, texto: t })); recorregirMasiva(); }, { d: json, L: [clase, ingles, tutor, clase] });
        await p.waitForTimeout(300);
        ok(await p.$$eval('#mvTabla .mv-est', x => x.length) === 2 && /🔍 2 con un estilo distinto al de clase/.test(await p.textContent('#mvResumen')), `${prog}: 🔍 en dos alumnos y en el resumen`);
        const notas = await p.evaluate(() => masiva.lista.map(it => it.v.nota));
        await p.click('#mvResumen span[onclick="verEstilo()"]'); await p.waitForSelector('#modalEstilo.visible');
        ok((await p.$$eval('#modalEstilo tr', x => x.length)) === 3 && /indicios, no pruebas/.test(await p.textContent('#modalEstilo')), `${prog}: la ventana con los indicios de cada uno`);
        await p.evaluate(() => document.getElementById('modalEstilo').classList.remove('visible'));
        const H = await p.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
            try { imprimirInformes([1]); const inf = h; h = ''; imprimirDevoluciones([1]); return [inf, h]; } finally { window.open = o; } });
        ok(/🔍 Estilo distinto al de clase/.test(H[0]) && !/Estilo distinto/.test(H[1]), `${prog}: en el informe del profesor, no en la devolución`);
        const [d] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => exportarCSVMasiva())]);
        const csv = fs.readFileSync(await d.path(), 'utf8');
        ok(/"Estilo distinto al de clase"/.test(csv) && /Comentarios en inglés/.test(csv), `${prog}: y en el CSV`);
        // quitarlo: sin marcas; la nota, la misma
        await p.uncheck('#mvEstilo'); await p.waitForTimeout(100);
        ok(await p.$$eval('#mvTabla .mv-est', x => x.length) === 0 && JSON.stringify(await p.evaluate(() => masiva.lista.map(it => it.v.nota))) === JSON.stringify(notas), `${prog}: sin la casilla, sin marcas; la nota no cambia`);
        await p.check('#mvEstilo');
        // la corrección de un programa
        await p.evaluate(() => verAlumno(1)); await p.waitForTimeout(400);
        ok(/Estilo distinto al de clase/.test(await p.textContent('#crResultado')), `${prog}: también en la corrección de un programa`);
        ok(p.errs.length === 0, `${prog}: sin errores de JavaScript ` + p.errs.join(' | '));
        await p.evaluate(() => localStorage.removeItem('calcador_estilo')); await p.close();
    }
    await b.close(); console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
