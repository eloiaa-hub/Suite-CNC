// Calcador v133 / Corrector v78: ⬆ Devoluciones para Aules (un zip con la devolución de cada alumno, con su número de
// participante, para «Subir varios archivos de retroalimentación en un zip»; en la batería, un zip por tarea), la casilla
// «con la solución» y 🔁 lo que repite cada alumno en la revisión (ficha, hoja resumen y CSV). Los mismos datos que bateria.js.
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'devaules-'));
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
function crc32(b) { let c, t = crc32.t || (crc32.t = Array.from({ length:256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; })); let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; }
function zip(entradas) {
    const loc = [], cen = []; let off = 0;
    for (const [n, d0] of entradas) {
        const nombre = Buffer.from(n, 'utf8'), d = Buffer.from(d0, 'utf8'), c = zlib.deflateRawSync(d), crc = crc32(d);
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(c.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(nombre.length, 26);
        const e = Buffer.alloc(46); e.writeUInt32LE(0x02014b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(20, 6); e.writeUInt16LE(0x800, 8); e.writeUInt16LE(8, 10); e.writeUInt32LE(crc, 16); e.writeUInt32LE(c.length, 20); e.writeUInt32LE(d.length, 24); e.writeUInt16LE(nombre.length, 28); e.writeUInt32LE(off, 42);
        loc.push(h, nombre, c); cen.push(e, nombre); off += 30 + nombre.length + c.length;
    }
    const C = Buffer.concat(cen), f = Buffer.alloc(22); f.writeUInt32LE(0x06054b50, 0); f.writeUInt16LE(entradas.length, 8); f.writeUInt16LE(entradas.length, 10); f.writeUInt32LE(C.length, 12); f.writeUInt32LE(off, 16);
    return Buffer.concat([...loc, C, f]);
}
const CURSO = 'Curs de prova-1A 1000000001';
(async () => {
    const e18 = JSON.parse(fs.readFileSync(ejercicios().find(f => /\/Ejercicio 18\.json$/.test(f)), 'utf8'));
    const iso = JSON.parse(fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.json'), 'utf8')), isoNc = fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.nc'), 'utf8');
    const b = await lanzar(), pg = await abrir(b, 'corrector.html');
    // los programas de cada ejercicio y las variantes del examen «ISO GEO 02» (con el Corrector)
    const P = await pg.evaluate(({ e18, iso }) => {
        const prog = d => { abrirJSONDatos(JSON.parse(JSON.stringify(d))); generarMec(); return ultimoMec.nc; };
        const out = { e18: prog(e18) };
        abrirJSONDatos(JSON.parse(JSON.stringify(e18))); cfgHoja.num = 'ISO GEO 02'; document.getElementById('projectName').value = 'ISO GEO 02';
        Object.assign(varCfg, { n: 3, aOriginal: true, ex: true, ey: true, giro: false, cero: false, escala: false, medidas: false }); generarVariantes();
        out.vars = varGen.map(v => ({ letra: v.letra, datos: v.datos, nc: prog(v.datos) }));
        return out;
    }, { e18, iso });
    const dir = path.join(TMP, 'Entregas 2CFS7'); fs.mkdirSync(dir);
    const F = (n, c) => { fs.writeFileSync(path.join(dir, n), c); return path.join(dir, n); };
    const al = (n, id) => `${n}_${id}_assignsubmission_file_/pieza.nc`;
    const files = [
        F('Ejercicio aleatorio 64921.json', JSON.stringify(Object.assign(JSON.parse(JSON.stringify(iso)), { calcador: Object.assign({}, iso.calcador, { cfgHoja: Object.assign({}, iso.calcador && iso.calcador.cfgHoja, { titulo: 'ISO GEO 01A' }) }) }))),
        F('ISO GEO 01A.json', JSON.stringify(e18)), F('ISO_09.json', JSON.stringify(iso)),
        ...P.vars.map(v => F(`ISO GEO 02${v.letra}.json`, JSON.stringify(v.datos))),
        F(`${CURSO}-ISO GEO 01A-11829876.zip`, zip([[al('Ana García', 501), P.e18], [al('Bruno Sanz', 502), P.e18.replace(/(G1 X\d+(?:\.\d+)? Y)(\d+)/g, (m, a, y, i, s) => s.indexOf('G1 X') === i ? m : a + (+y + 7))], [al('Carla Ruiz', 503), P.e18]])),
        F('Tarea20112026_ISO_09.zip', zip([[al('Ana García', 601), isoNc], [al('David López', 602), isoNc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20')]])),
        F(`${CURSO}-ISO GEO 02-11829877.zip`, zip([[al('Ana García', 701), P.vars[1].nc], [al('Bruno Sanz', 702), P.vars[2].nc], [al('Carla Ruiz', 703), P.vars[0].nc]])),
        F(`${CURSO}-Práctica libre-11829999.zip`, zip([[al('Ana García', 801), isoNc]])),
        F(`Calificaciones-${CURSO}-ISO GEO 01A-11829876.csv`, '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación","Calificación máxima","Comentarios de retroalimentación"\n"Participante 501","Ana García","a@x","","","10,00",""\n"Participante 502","Bruno Sanz","b@x","","","10,00",""\n"Participante 503","Carla Ruiz","c@x","","","10,00",""\n'),
        F('notas.txt', 'otra cosa'),
    ];
    // un lector de zip sin comprimir (los que hace el corrector)
    const leerZip = buf => { const out = {}; let i = 0; while (buf.readUInt32LE(i) === 0x04034b50) { const n = buf.readUInt16LE(i + 26), x = buf.readUInt16LE(i + 28), tam = buf.readUInt32LE(i + 18);
        const nom = buf.slice(i + 30, i + 30 + n).toString('utf8'); out[nom] = buf.slice(i + 30 + n + x, i + 30 + n + x + tam); i += 30 + n + x + tam; } return out; };
    for (const prog of ['corrector.html', 'calcador.html']) {
        const p = prog === 'corrector.html' ? pg : await abrir(b, prog);
        await p.evaluate(() => { localStorage.removeItem('calcador_bateria'); localStorage.removeItem('corrector_devolSol'); abrirMasiva(); abrirBateria(); });
        ok(!!(await p.$('#batDevAules')) && !!(await p.$('#modalBateria .devol-sol')), `${prog}: ⬆ Devoluciones para Aules y «con la solución» en la batería`);
        await p.setInputFiles('#batArchivos', files.map(f => ({ name: path.basename(f), mimeType: /\.zip$/.test(f) ? 'application/zip' : 'application/octet-stream', buffer: fs.readFileSync(f) })));
        await p.waitForFunction(() => bat.tareas.length === 4, null, { timeout: 15000 });
        await p.click('#batCorregir'); await p.waitForFunction(() => !document.getElementById('batCorregir').disabled, null, { timeout: 60000 }); await p.waitForTimeout(200);
        // la batería: un zip con un zip por tarea
        const [d1] = await Promise.all([p.waitForEvent('download'), p.click('#batDevAules')]);
        const Z = leerZip(fs.readFileSync(await d1.path())), nz = Object.keys(Z);
        console.log('   ' + nz.join(' | '));
        ok(nz.length === 3 && nz.every(n => /^Devoluciones para Aules - .+\.zip$/.test(n)), `${prog}: la batería da un zip por tarea corregida (${nz.length})`);
        const z01 = leerZip(Z[nz.find(n => /01A/.test(n))]), n01 = Object.keys(z01);
        console.log('   ' + n01.join(' | '));
        ok(n01.length === 3 && n01.every(n => /^[^_/]+_\d+_assignsubmission_file_Devolución [^_/]+\.html$/.test(n)), `${prog}: cada alumno, con su número de participante: ${n01[0]}`);
        const h0 = z01[n01.find(n => /^Ana/.test(n))].toString('utf8');
        ok(/<title>Devolución — Ana García — /.test(h0) && /Programa correcto/.test(h0) && /Cómo se ha evaluado/.test(h0) && !/window\.print/.test(h0) && (h0.match(/<section class="inf">/g) || []).length === 1, `${prog}: la de Ana: su página, con la solución y los criterios, sin imprimirse sola`);
        // la casilla: sin la solución
        await p.uncheck('#modalBateria .devol-sol');
        ok(await p.evaluate(() => localStorage.getItem('corrector_devolSol') === '0'), `${prog}: la casilla se recuerda`);
        const [d2] = await Promise.all([p.waitForEvent('download'), p.click('#batDevAules')]);
        const Z2 = leerZip(fs.readFileSync(await d2.path())), z2 = leerZip(Z2[Object.keys(Z2).find(n => /01A/.test(n))]), h2 = Object.values(z2)[0].toString('utf8');
        ok(!/Programa correcto/.test(h2) && /Cómo se ha evaluado/.test(h2), `${prog}: sin la casilla, sin el programa correcto (y con los criterios)`);
        await p.check('#modalBateria .devol-sol');
        // la corrección masiva de una tarea: su zip
        await p.evaluate(() => verTareaBat(bat.tareas.findIndex(t => t.tarea === 'ISO GEO 01A'))); await p.waitForTimeout(400);
        ok(await p.$eval('#modalMasiva .devol-sol', x => x.checked), `${prog}: la casilla de la corrección masiva sigue marcada`);
        const [d3] = await Promise.all([p.waitForEvent('download'), p.click('#modalMasiva button[onclick="zipDevolucionesAules()"]')]);
        const z3 = leerZip(fs.readFileSync(await d3.path()));
        ok(Object.keys(z3).join() === n01.join() && /^Devoluciones para Aules - /.test(d3.suggestedFilename()), `${prog}: ⬆ Devoluciones para Aules en la corrección masiva (${d3.suggestedFilename()})`);
        await p.evaluate(() => { document.getElementById('modalMasiva').classList.remove('visible'); abrirBateria(); });
        // 🔁 lo que repite: el mismo error en dos tareas de Ana
        const rep = await p.evaluate(() => {
            const A = alumnosRev(), a = A.find(x => x.nombre === 'Ana García'), T = tareasRev().filter(t => a.celdas.get(t));
            T.slice(0, 2).forEach((t, i) => a.celdas.get(t).it.r.hallazgos.push({ tipo: 'error', cat: 'escritura', msg: `N${40 + i}: falta anular la compensación con G40 antes de salir`, pista: 'G40 al salir del contorno', linea: 3 }));
            const R = repetidosRev(a); return { n: R.n, E: R.E.map(e => e.titulo + ' ' + e.tareas.length) };
        });
        ok(rep.n === 3 && rep.E.some(e => /falta anular la compensación con G40 antes de salir 2/.test(e)), `${prog}: 🔁 lo que repite (${JSON.stringify(rep)})`);
        await p.click('#batRev'); await p.waitForSelector('#modalRevision.visible .rev-tabla');
        ok(!!(await p.$('#modalRevision .devol-sol')), `${prog}: «con la solución» también en la revisión`);
        await p.click(`.rev-ver[data-key="ana garcia"]`); await p.waitForSelector('.rev-repite');
        ok(/en 2 de 3/.test(await p.textContent('.rev-repite')), `${prog}: la ficha dice lo que repite`);
        const H = await p.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
            try { imprimirPorAlumno(true, ['ana garcia'], false); } finally { window.open = o; } return h; });
        ok(/Lo que se te repite/.test(H) && /en 2 de 3/.test(H), `${prog}: y su hoja resumen`);
        const [d4] = await Promise.all([p.waitForEvent('download'), p.click('#revCSV')]);
        ok(/Lo que repite[^\n]*\n[\s\S]*Ana García[^\n]*falta anular la compensación con G40 antes de salir \(2\)/.test(fs.readFileSync(await d4.path(), 'utf8')), `${prog}: y el CSV`);
        ok(p.errs.length === 0, `${prog}: sin errores de JavaScript ` + p.errs.join(' | '));
        await p.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
