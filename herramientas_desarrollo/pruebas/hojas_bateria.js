// Calcador v135 / Corrector v80: las hojas de calificaciones de la batería casan también por los números de participante
// (Aules o el navegador cortan a veces el nombre: «Calificaciones-…-ISO GEO-3.csv»), «⚠️ sin hoja» en las tareas sin ella
// y aviso de las hojas que no casan con ninguna tarea. Los mismos datos que bateria.js.
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hojasbat-'));
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
        F(`Calificaciones-${CURSO}-ISO GEO-1.csv`, '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación","Calificación máxima","Comentarios de retroalimentación"\n' + [701, 702, 703, 704].map(n => `"Participante ${n}","Alumno ${n}","x@x","","","10,00",""`).join('\n') + '\n'),
        F(`Calificaciones-${CURSO}-Geometr.csv`, '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación","Calificación máxima","Comentarios de retroalimentación"\n' + [901, 902].map(n => `Participante${n},"Alumno ${n}","x@x","","","10,00",""`).join('\n') + '\n'),
        F(`Calificaciones-${CURSO}-ISO GEO 01A-11829876.csv`, '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación","Calificación máxima","Comentarios de retroalimentación"\n"Participante 501","Ana García","a@x","","","10,00",""\n"Participante 502","Bruno Sanz","b@x","","","10,00",""\n"Participante 503","Carla Ruiz","c@x","","","10,00",""\n'),
        F('notas.txt', 'otra cosa'),
    ];
    for (const prog of ['corrector.html', 'calcador.html']) {
        const p = prog === 'corrector.html' ? pg : await abrir(b, prog);
        await p.evaluate(() => { localStorage.removeItem('calcador_bateria'); abrirMasiva(); abrirBateria(); });
        const sinHojas = files.filter(f => !/\.csv$/.test(f)), hojas = files.filter(f => /\.csv$/.test(f));
        const subir = L => p.setInputFiles('#batArchivos', L.map(f => ({ name: path.basename(f), mimeType: 'application/octet-stream', buffer: fs.readFileSync(f) })));
        await subir(sinHojas); await p.waitForFunction(() => bat.tareas.length === 4, null, { timeout: 15000 });
        ok(await p.$$eval('.bat-sin-hoja', x => x.length) === 4, `${prog}: «⚠️ sin hoja» en las 4 tareas`);
        await subir(hojas); await p.waitForFunction(() => bat.hojas.length === 3, null, { timeout: 15000 }); await p.waitForTimeout(500);
        const H = await p.evaluate(() => Object.fromEntries(bat.tareas.map(t => [t.tarea, [t.hoja ? t.hoja.archivo.replace(/^.*-(ISO|Geometr)/, '$1') : '', t.hojaPor]])));
        console.log('   ' + JSON.stringify(H));
        ok(H['ISO GEO 01A'][1] === 'num' && /ISO GEO 01A-11829876/.test(H['ISO GEO 01A'][0]), `${prog}: la hoja con su nombre, por el número de la tarea (como antes)`);
        ok(H['ISO GEO 02'][0] === 'ISO GEO-1.csv' && H['ISO GEO 02'][1] === 'alumnos', `${prog}: la hoja con el nombre cortado («…-ISO GEO-1.csv») casa por los alumnos con ISO GEO 02`);
        ok(!H['ISO_09'] || !H['ISO_09'][0], `${prog}: ISO_09 sigue sin hoja`);
        ok(/por los alumnos/.test(await p.textContent('#batTabla')) && await p.$$eval('.bat-sin-hoja', x => x.length) === 2, `${prog}: la tabla dice «✔ por los alumnos» y «⚠️ sin hoja» en las 2 que no tienen`);
        const suelta = await p.evaluate(() => (document.querySelector('.bat-sueltas') || {}).textContent || '');
        ok(/Una hoja de calificaciones no casa con ninguna tarea/.test(suelta) && /Geometr\.csv/.test(suelta), `${prog}: avisa de la hoja que no casa con ninguna tarea («${suelta.slice(0, 70)}…»)`);
        await p.click('#batCorregir'); await p.waitForFunction(() => !document.getElementById('batCorregir').disabled, null, { timeout: 60000 });
        const h2 = await p.evaluate(() => { const h = hojaTareaBat(bat.tareas.find(t => t.tarea === 'ISO GEO 02')); return { n: h.casados.length, sin: h.sinEntrega.length, txt: h.texto }; });
        ok(h2.n === 3 && h2.sin === 1 && /Participante 701[^\n]*,"\d+,\d\d",/.test(h2.txt), `${prog}: y se rellena: 3 con nota y 1 sin entrega`);
        // guardada y abierta: sigue casada por los alumnos
        const j = await p.evaluate(() => JSON.stringify(datosBateria()));
        await p.evaluate(j => abrirDatosBateria(JSON.parse(j)), j);
        await p.waitForFunction(() => bat.tareas.length === 4 && bat.tareas.every(t => !t.casa || (t.res && t.res.lista)), null, { timeout: 60000 }); await p.waitForTimeout(300);
        ok(await p.evaluate(() => { const t = bat.tareas.find(t => t.tarea === 'ISO GEO 02'); return t.hoja && t.hojaPor === 'alumnos' && /ISO GEO-1/.test(t.hoja.archivo); }), `${prog}: 💾 guardada y 📂 abierta, la hoja sigue casada por los alumnos`);
        ok(p.errs.length === 0, `${prog}: sin errores de JavaScript ` + p.errs.join(' | '));
        await p.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
