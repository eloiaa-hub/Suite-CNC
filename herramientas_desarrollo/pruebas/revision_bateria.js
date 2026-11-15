// 🗃 Batería (Calcador v131 / Corrector v76): si dos ejercicios encajan igual gana el del nombre del archivo (con aviso),
// 💾 guardar / 📂 abrir la batería (y el navegador recuerda la última), 👤 revisión por alumno (medias, pesos, unir, ficha,
// tu nota, CSV) y 🖨 informes / devoluciones por alumno. Los mismos datos que bateria.js.
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'revbat-'));
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
    const CAP = () => { window.__h = ''; window.open = () => ({ document: { open() {}, write(x) { window.__h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} }); };
    for (const prog of ['corrector.html', 'calcador.html']) {
        const p = prog === 'corrector.html' ? pg : await abrir(b, prog);
        await p.evaluate(() => { localStorage.removeItem('calcador_bateria'); abrirMasiva(); abrirBateria(); });
        ok(!!(await p.$('#batGuardar')) && !!(await p.$('#batAbrirJ')) && !!(await p.$('#batRev')), `${prog}: 💾 Guardar batería, 📂 Abrir batería… y 👤 Revisión por alumno`);
        await p.setInputFiles('#batArchivos', files.map(f => ({ name: path.basename(f), mimeType: /\.zip$/.test(f) ? 'application/zip' : 'application/octet-stream', buffer: fs.readFileSync(f) })));
        await p.waitForFunction(() => bat.tareas.length === 4, null, { timeout: 15000 });
        const c01 = await p.evaluate(() => { const t = bat.tareas.find(t => t.tarea === 'ISO GEO 01A'); return { e: bat.ejercicios[t.casa.is[0]].archivo, d: (t.casa.dudas || []).map(i => bat.ejercicios[i].archivo) }; });
        ok(c01.e === 'ISO GEO 01A.json' && c01.d.join() === 'Ejercicio aleatorio 64921.json', `${prog}: ISO GEO 01A casa con «ISO GEO 01A.json» y no con el que solo tiene ese título (${JSON.stringify(c01)})`);
        ok(/También encaja con: Ejercicio aleatorio 64921/.test(await p.textContent('#batTabla')), `${prog}: la fila avisa (⚠️ También encaja con…)`);
        await p.click('#batCorregir'); await p.waitForFunction(() => !document.getElementById('batCorregir').disabled, null, { timeout: 60000 }); await p.waitForTimeout(200);
        ok(await p.evaluate(() => !!localStorage.getItem('calcador_bateria')), `${prog}: el navegador recuerda la batería corregida`);
        await p.click('#batRev'); await p.waitForSelector('#modalRevision.visible .rev-tabla');
        const A = await p.evaluate(() => { const T = tareasRev(); return alumnosRev().map(a => ({ k: a.key, n: a.nombre, m: a.media, ent: a.entregadas, notas: T.map(t => a.celdas.get(t) ? a.celdas.get(t).it.v.nota : null) })); });
        console.log(JSON.stringify(A));
        const ana = A.find(a => a.n === 'Ana García'), david = A.find(a => a.n === 'David López');
        ok(A.length === 4 && ana && david && ana.ent === 3 && david.ent === 1, `${prog}: 4 alumnos en la tabla (Ana con 3 tareas, David con 1)`);
        const media = (v, w) => { let s = 0, n = 0; v.forEach((x, i) => { const p = w ? w[i] : 1; if (x !== null) { s += p * x; n += p; } else if (!w || w.cero !== false) n += p; }); return s / n; };
        ok(Math.abs(david.m - david.notas.reduce((s, x) => s + (x || 0), 0) / 3) < 1e-9, `${prog}: media con las no entregadas a 0 (David: ${david.m.toFixed(2)})`);
        await p.selectOption('#revModo', 'entregadas');
        ok(Math.abs(await p.evaluate(() => alumnosRev().find(a => a.nombre === 'David López').media) - david.notas.find(x => x !== null)) < 1e-9, `${prog}: «solo las entregadas»`);
        await p.selectOption('#revModo', 'cero');
        await p.fill('.rev-peso[data-i="0"]', '2'); await p.dispatchEvent('.rev-peso[data-i="0"]', 'change');
        const mA = await p.evaluate(() => alumnosRev().find(a => a.nombre === 'Ana García').media);
        ok(Math.abs(mA - (2 * ana.notas[0] + ana.notas[1] + ana.notas[2]) / 4) < 1e-9, `${prog}: con peso 2 en la primera tarea (Ana: ${mA.toFixed(2)})`);
        await p.click('.rev-cuenta[data-i="1"]');
        ok(await p.evaluate(() => alumnosRev()[0].totalCuentan === 2), `${prog}: una tarea quitada de la media`);
        await p.click('.rev-cuenta[data-i="1"]');
        // unir: Ana y David no (los dos entregaron ISO_09); Carla y David sí
        const kk = n => A.find(a => a.n === n).k;
        for (const n of ['Ana García', 'David López']) await p.check(`.rev-sel[data-key="${kk(n)}"]`);
        await p.click('#revUnir'); ok(await p.$$eval('.rev-tabla tbody tr', x => x.length) === 4, `${prog}: no une a dos que entregaron la misma tarea`);
        await p.evaluate(() => document.querySelectorAll('.rev-sel').forEach(x => x.checked = false));
        for (const n of ['Carla Ruiz', 'David López']) await p.check(`.rev-sel[data-key="${kk(n)}"]`);
        await p.click('#revUnir'); ok(await p.$$eval('.rev-tabla tbody tr', x => x.length) === 3 && await p.$$eval('.rev-unido', x => x.length) === 1, `${prog}: 🔗 unir dos nombres en uno`);
        await p.click('.rev-unido >> xpath=..//a'); await p.waitForSelector('#revSeparar');
        await p.click('#revSeparar'); ok(await p.$$eval('.rev-tabla tbody tr', x => x.length) === 4, `${prog}: ✂ separar`);
        // la ficha de Ana: dibujos, tu nota y tu comentario
        await p.click(`.rev-ver[data-key="${kk('Ana García')}"]`); await p.waitForSelector('.rev-tarjeta[data-t]'); await p.waitForTimeout(400);
        ok(await p.$$eval('.rev-tarjeta[data-t]', x => x.length) === 3 && await p.$$eval('.rev-dibujo svg', x => x.length) === 3, `${prog}: la ficha con sus 3 correcciones y sus dibujos`);
        await p.fill('.rev-tarjeta[data-t] .rev-nota', '6,5'); await p.dispatchEvent('.rev-tarjeta[data-t] .rev-nota', 'change');
        await p.fill('.rev-tarjeta[data-t] .rev-com', 'Revisa la entrada'); await p.dispatchEvent('.rev-tarjeta[data-t] .rev-com', 'change');
        ok(await p.$eval('.rev-tarjeta[data-t] .rev-nota-v', x => x.textContent) === '6,5', `${prog}: tu nota manda`);
        // informes por alumno
        const H = await p.evaluate(CAP => { eval('(' + CAP + ')')(); const k = alumnosRev().find(a => a.nombre === 'Ana García').key;
            imprimirPorAlumno(false, [k], true); const uno = window.__h; window.__h = ''; imprimirPorAlumno(true, [], false); return { uno, todos: window.__h }; }, CAP.toString());
        ok((H.uno.match(/<section class="inf">/g) || []).length === 3 && /Revisión del alumno/.test(H.uno) && /Revisa la entrada/.test(H.uno), `${prog}: 🖨 su informe: el resumen y sus 3 correcciones, con tu comentario`);
        ok((H.todos.match(/<section class="inf rev-res/g) || []).length === 4 && !/<section class="inf">/.test(H.todos) && /Tus ejercicios/.test(H.todos), `${prog}: 🖨 devoluciones de todos, solo el resumen`);
        await p.click('#revTabla');
        const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#revCSV')]);
        const csv = fs.readFileSync(await dl.path(), 'utf8').split('\r\n');
        ok(csv.length === 6 && /Ana García/.test(csv.join()), `${prog}: ⬇ CSV`);
        // 💾 guardar y 📂 abrir
        const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#revGuardar')]);
        const jb = fs.readFileSync(await dl2.path());
        const firma = q => q.evaluate(() => alumnosRev().map(a => a.nombre + ':' + a.media.toFixed(4)).join('|') + '#' + JSON.stringify(bat.rev.pesos));
        const antes = await firma(p);
        const p2 = await abrir(b, prog);
        await p2.evaluate(() => { localStorage.removeItem('calcador_bateria'); abrirMasiva(); abrirBateria(); });
        await p2.setInputFiles('#batJSON', [{ name: 'Batería.json', mimeType: 'application/json', buffer: jb }]);
        await p2.waitForFunction(() => bat.tareas.length === 4 && bat.tareas.every(t => !t.casa || (t.res && t.res.lista)), null, { timeout: 60000 });
        ok(await firma(p2) === antes, `${prog}: 📂 abrir batería: las mismas medias, pesos y notas`);
        ok(await p2.evaluate(() => bat.tareas.some(t => t.res.lista.some(it => it.comProf === 'Revisa la entrada' && it.v.nota === 6.5))), `${prog}: con tu nota y tu comentario`);
        ok(p2.errs.length === 0, `${prog}: sin errores de JavaScript al abrirla ` + p2.errs.join(' | ')); await p2.close();
        // la última batería, recordada por el navegador
        const err1 = p.errs.slice(); await p.reload(); await p.waitForTimeout(700);
        await p.evaluate(() => { abrirMasiva(); abrirBateria(); });
        ok(!!(await p.$('#batRecordada')), `${prog}: «💾 El navegador recuerda la última batería…»`);
        await p.click('#batRecuperar');
        await p.waitForFunction(() => bat.tareas.length === 4 && bat.tareas.every(t => !t.casa || (t.res && t.res.lista)), null, { timeout: 60000 });
        ok(await firma(p) === antes, `${prog}: 📂 Recuperarla`);
        ok(err1.length === 0 && p.errs.length === 0, `${prog}: sin errores de JavaScript ` + err1.concat(p.errs).join(' | '));
        await p.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
