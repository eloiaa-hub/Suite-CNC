// 🗃 Batería de corrección (Calcador v110 / Corrector v55): una carpeta con ejercicios (.json), zip de entregas de Aules
// («curso-tarea-número.zip») y una hoja de calificaciones; se casan por el nombre de la tarea (también un examen con
// variantes), se corrige todo y se descarga en un zip.
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bateria-'));
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
        F('ISO GEO 01A.json', JSON.stringify(e18)), F('ISO_09.json', JSON.stringify(iso)),
        ...P.vars.map(v => F(`ISO GEO 02${v.letra}.json`, JSON.stringify(v.datos))),
        F(`${CURSO}-ISO GEO 01A-11829876.zip`, zip([[al('Ana García', 501), P.e18], [al('Bruno Sanz', 502), P.e18.replace(/(G1 X\d+(?:\.\d+)? Y)(\d+)/g, (m, a, y, i, s) => s.indexOf('G1 X') === i ? m : a + (+y + 7))], [al('Carla Ruiz', 503), P.e18]])),
        F('Tarea20112026_ISO_09.zip', zip([[al('Ana García', 601), isoNc], [al('David López', 602), isoNc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20')]])),
        F(`${CURSO}-ISO GEO 02-11829877.zip`, zip([[al('Ana García', 701), P.vars[1].nc], [al('Bruno Sanz', 702), P.vars[2].nc], [al('Carla Ruiz', 703), P.vars[0].nc]])),
        F(`${CURSO}-Práctica libre-11829999.zip`, zip([[al('Ana García', 801), isoNc]])),
        F(`Calificaciones-${CURSO}-ISO GEO 01A-11829876.csv`, '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación","Calificación máxima","Comentarios de retroalimentación"\n"Participante 501","Ana García","a@x","","","10,00",""\n"Participante 502","Bruno Sanz","b@x","","","10,00",""\n"Participante 503","Carla Ruiz","c@x","","","10,00",""\n'),
        F('notas.txt', 'otra cosa'),
    ];
    for (const prog of ['corrector.html', 'calcador.html']) {
        const p = prog === 'corrector.html' ? pg : await abrir(b, prog);
        await p.evaluate(() => abrirMasiva()); await p.click('#modalMasiva button:has-text("🗃 Batería…")'); await p.waitForTimeout(200);
        await p.setInputFiles('#batArchivos', files.map(f => ({ name: path.basename(f), mimeType: /\.zip$/.test(f) ? 'application/zip' : 'application/octet-stream', buffer: fs.readFileSync(f) })));   // (por contenido: el Chromium de las pruebas pierde los nombres con tildes)
        await p.waitForFunction(() => bat.tareas.length === 4 && bat.hojas.length === 1, null, { timeout: 15000 });
        const casa = await p.evaluate(() => bat.tareas.map(t => ({ tarea: t.tarea, cmid: t.cmid, casa: t.casa ? (t.casa.tipo === 'variantes' ? 'var:' + t.casa.is.map(i => bat.ejercicios[i].archivo).join('|') : bat.ejercicios[t.casa.is[0]].archivo) : null, hoja: !!t.hoja })));
        const c = n => casa.find(x => x.tarea === n) || {}; console.log(JSON.stringify(casa));
        ok(casa.length === 4 && await p.evaluate(() => bat.ejercicios.length === 5 && bat.hojas.length === 1), `${prog}: 5 ejercicios, 4 zip y 1 hoja de calificaciones (los demás archivos, fuera)`);
        ok(c('ISO GEO 01A').casa === 'ISO GEO 01A.json' && c('ISO GEO 01A').cmid === '11829876' && c('ISO GEO 01A').hoja, `${prog}: «${CURSO}-ISO GEO 01A-11829876.zip» → ISO GEO 01A.json, con su hoja de calificaciones`);
        ok(c('Tarea20112026_ISO_09').casa === 'ISO_09.json', `${prog}: «Tarea20112026_ISO_09.zip» → ISO_09.json`);
        ok(c('ISO GEO 02').casa === 'var:ISO GEO 02A.json|ISO GEO 02B.json|ISO GEO 02C.json', `${prog}: «…ISO GEO 02…» → las variantes 02A, 02B y 02C`);
        ok(c('Práctica libre').casa === null, `${prog}: «Práctica libre», sin ejercicio`);
        await p.click('#batCorregir'); await p.waitForFunction(() => !document.getElementById('batCorregir').disabled, null, { timeout: 60000 }); await p.waitForTimeout(200);
        const R = await p.evaluate(() => bat.tareas.map(t => ({ tarea: t.tarea, r: t.res && t.res.lista ? { n: t.res.n, media: Math.round(t.res.media * 10) / 10, ap: t.res.aprueban, vars: t.res.lista.map(it => it.alumno + ':' + (it.variante || '') + ':' + it.v.veredicto) } : t.res })));
        const r = n => (R.find(x => x.tarea === n) || {}).r || {};
        ok(r('ISO GEO 01A').n === 3 && r('ISO GEO 01A').vars.filter(x => /bien$/.test(x)).length === 2, `${prog}: ISO GEO 01A: 3 alumnos, 2 bien (${r('ISO GEO 01A').vars})`);
        ok(r('Tarea20112026_ISO_09').n === 2 && r('Tarea20112026_ISO_09').vars.some(x => /^David López::mal$/.test(x)), `${prog}: ISO_09: 2 alumnos, David mal (${r('Tarea20112026_ISO_09').vars})`);
        ok(r('ISO GEO 02').n === 3 && ['Ana García:ISO GEO 02B:bien', 'Bruno Sanz:ISO GEO 02C:bien', 'Carla Ruiz:ISO GEO 02A:bien'].every(x => r('ISO GEO 02').vars.includes(x)), `${prog}: ISO GEO 02, cada uno con su variante (${r('ISO GEO 02').vars})`);
        ok(await p.evaluate(() => masiva.lista.length === 0 && document.querySelectorAll('#mvTabla tr[data-k]').length === 0), `${prog}: la corrección masiva abierta no cambia (ni su lista en pantalla)`);
        // descargar todo
        const todo = await p.evaluate(() => archivosTodoBat().map(([n, t]) => [n, typeof t === 'string' ? t : '']));
        const nom = todo.map(x => x[0]);
        ok(nom[0] === 'Resumen de la batería.csv' && nom.includes('ISO GEO 01A/ISO GEO 01A - corrección.csv') && nom.includes(`ISO GEO 01A/Calificaciones-${CURSO}-ISO GEO 01A-11829876 - con notas.csv`) && nom.includes('ISO GEO 02/ISO GEO 02 - corrección.csv'), `${prog}: el zip: ${nom.length} archivos (${nom.join(' · ').slice(0, 160)}…)`);
        const hoja = todo.find(x => /con notas\.csv$/.test(x[0]))[1]; console.log(hoja.slice(0, 500)); console.log(hoja.slice(0, 400));
        ok(/"Participante 501","Ana García","a@x","","10,00","10,00"/.test(hoja) && /Participante 502[^\n]*Errores:/.test(hoja.replace(/\n(?!")/g, ' ')), `${prog}: la hoja de calificaciones, rellenada`);
        ok(/"Práctica libre";"[^"]*";"sin ejercicio"/.test(todo[0][1]) && /"ISO GEO 02";[^\n]*"ISO GEO 02A ISO GEO 02B ISO GEO 02C"/.test(todo[0][1]), `${prog}: el resumen de la batería`);
        const blob = await p.evaluate(async () => { const z = zipBat(archivosTodoBat()); const ab = await z.arrayBuffer(); const ent = [], ign = []; await entregasDeZip(ab, ent, ign, 0); return { tam: z.size, leidos: ent.length + ign.length }; });
        ok(blob.tam > 1000 && blob.leidos >= 5, `${prog}: el .zip se lee bien (${blob.tam} bytes, ${blob.leidos} archivos)`);
        // el orden de las tareas: el de sus ejercicios en la biblioteca (por número, por título…); sin ejercicio, al final
        const orden = await p.evaluate(() => {
            const guarda = { ej: bat.ejercicios, ta: bat.tareas, ord: bib.filtro.orden }, ent = (num, titulo, ruta) => ({ archivo: ruta, ruta, datos: {}, ficha: {}, bibEntrada: { ficha: { num, titulo }, meta: {}, ruta, actualizado: 0 } });
            bat.ejercicios = [ent('7', 'Zeta', 'b/siete.json'), ent('3', 'Alfa', 'a/tres.json'), ent('12', 'Media', 'c/doce.json')];
            bat.tareas = [{ tarea: 'A tarea siete', casa: { is: [0] } }, { tarea: 'B sin ejercicio', casa: null }, { tarea: 'C tarea doce', casa: { is: [2] } }, { tarea: 'D tarea tres', casa: { is: [1] } }];
            const r = {}; bib.filtro.orden = 'num'; ordenarTareasBat(); r.num = bat.tareas.map(t => t.tarea[0]).join('');
            bib.filtro.orden = 'titulo'; ordenarTareasBat(); r.titulo = bat.tareas.map(t => t.tarea[0]).join('');
            bib.filtro.orden = 'ruta'; ordenarTareasBat(); r.ruta = bat.tareas.map(t => t.tarea[0]).join('');
            bat.ejercicios = guarda.ej; bat.tareas = guarda.ta; bib.filtro.orden = guarda.ord; return r; });
        ok(orden.num === 'DACB' && orden.titulo === 'DCAB' && orden.ruta === 'DACB', `${prog}: las tareas, en el orden de la biblioteca: por número ${orden.num}, por título ${orden.titulo}, por carpeta ${orden.ruta} (sin ejercicio, al final)`);
        // 🖨 los informes y las devoluciones de todas las tareas, en un solo documento; y los de una
        const imp = await p.evaluate(() => { const r = {}; const o = window.open; let h = '';
            window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
            try { h = ''; imprimirBateria(false); r.inf = h; h = ''; imprimirBateria(true); r.dev = h; h = ''; imprimirBateria(false, bat.tareas.findIndex(t => t.tarea === 'ISO GEO 02')); r.una = h; } finally { window.open = o; } return r; });
        const n = (h, re) => (h.match(re) || []).length;
        ok(n(imp.inf, /<section class="inf res">/g) === 3 && n(imp.inf, /<section class="inf">/g) === 8 && /<title>Informes — batería de 3 tareas<\/title>/.test(imp.inf), `${prog}: 🖨 Informes de todas: 3 resúmenes y 8 hojas de alumno en un documento`);
        ok(n(imp.dev, /<section class="inf res">/g) === 0 && n(imp.dev, /<section class="inf">/g) === 8 && /Lo que tienes que revisar/.test(imp.dev), `${prog}: 🖨 Devoluciones de todas: 8 hojas, sin resúmenes`);
        ok(n(imp.una, /<section class="inf res">/g) === 1 && n(imp.una, /<section class="inf">/g) === 3 && /<title>Informes — ISO GEO 02<\/title>/.test(imp.una), `${prog}: 🖨 de una fila: solo esa tarea`);
        ok(await p.evaluate(() => masiva.lista.length === 0 && document.querySelectorAll('#mvTabla tr[data-k]').length === 0), `${prog}: después de imprimir, la corrección masiva abierta no cambia`);
        // ver una tarea en la corrección masiva
        await p.evaluate(() => verTareaBat(bat.tareas.findIndex(t => t.tarea === 'ISO GEO 02'))); await p.waitForTimeout(300);
        const v = await p.evaluate(() => ({ n: masiva.lista.length, vars: masiva.variantes.length, vis: document.getElementById('modalMasiva').classList.contains('visible'), filas: document.querySelectorAll('#mvTabla tr[data-k]').length }));
        ok(v.n === 3 && v.vars === 3 && v.vis && v.filas === 3, `${prog}: 🔍 Ver abre la tarea en la corrección masiva, con sus variantes`);
        // ── los ejercicios desde la biblioteca ──
        // 1) un archivo de biblioteca (⬇ Exportar biblioteca) en la carpeta: los ejercicios se llaman de otra forma, y casan por el número de su ficha
        const paquete = await p.evaluate(({ e18, vars }) => {
            const conNum = (d, num, tit) => { const x = JSON.parse(JSON.stringify(d)); x.calcador.cfgHoja = { ...(x.calcador.cfgHoja || {}), num, titulo: tit }; return x; };
            return { tipo: 'biblioteca-calcador', version: 1, fecha: new Date().toISOString(), ejercicios: [
                { ruta: 'Geometría/Ejercicio 18.json', archivo: 'Ejercicio 18.json', datos: conNum(e18, 'ISO GEO 01A', 'La V') },
                ...vars.map(v => ({ ruta: `Variantes/Examen V/Examen V - ${v.letra}.json`, archivo: `Examen V - ${v.letra}.json`, datos: conNum(v.datos, 'ISO GEO 02' + v.letra, 'Examen V (variante ' + v.letra + ')') })) ] };
        }, { e18, vars: P.vars });
        const soloZip = files.filter(f => /\.zip$|\.csv$/.test(f));
        await p.evaluate(() => { document.getElementById('modalMasiva').classList.remove('visible'); abrirBateria(); document.getElementById('batVaciar').click(); });
        await p.setInputFiles('#batArchivos', [...soloZip, path.join(TMP, 'x')].slice(0, -1).map(f => ({ name: path.basename(f), mimeType: 'application/octet-stream', buffer: fs.readFileSync(f) })).concat([{ name: 'Biblioteca_2026-10-30.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(paquete)) }]));
        await p.waitForFunction(() => bat.tareas.length === 4 && bat.ejercicios.length === 4, null, { timeout: 15000 });
        let cb = await p.evaluate(() => bat.tareas.map(t => t.tarea + '=' + (t.casa ? (t.casa.tipo === 'variantes' ? 'var:' + t.casa.letras.join('') : bat.ejercicios[t.casa.is[0]].archivo) : '-')).join(' | '));
        ok(/ISO GEO 01A=Ejercicio 18\.json/.test(cb) && /ISO GEO 02=var:ABC/.test(cb) && /Tarea20112026_ISO_09=-/.test(cb), `${prog}: archivo de biblioteca en la carpeta: casan por el número de la ficha (${cb})`);
        await p.click('#batCorregir'); await p.waitForFunction(() => !document.getElementById('batCorregir').disabled, null, { timeout: 60000 });
        const rb = await p.evaluate(() => bat.tareas.filter(t => t.res && t.res.lista).map(t => t.tarea + ':' + t.res.lista.map(it => (it.variante || '') + it.v.veredicto).join(',')).join(' | '));
        ok(/ISO GEO 02:ISO GEO 02Bbien,ISO GEO 02Cbien,ISO GEO 02Abien/.test(rb) && /ISO GEO 01A:bien,mal,bien/.test(rb), `${prog}: y se corrigen igual (${rb})`);
        // 2) 🗂 Usar la biblioteca: los ejercicios de la biblioteca de este navegador
        await p.evaluate(async paquete => { for (const e of paquete.ejercicios) await bibGuardarEntrada(entradaDe(e.datos, e.ruta, e.archivo)); await bibCargar(); }, paquete);
        await p.evaluate(() => document.getElementById('batVaciar').click());
        await p.setInputFiles('#batArchivos', soloZip.map(f => ({ name: path.basename(f), mimeType: 'application/octet-stream', buffer: fs.readFileSync(f) })));
        await p.waitForFunction(() => bat.tareas.length === 4, null, { timeout: 15000 });
        await p.click('#batBib'); await p.waitForFunction(() => bat.ejercicios.length >= 4, null, { timeout: 15000 });
        cb = await p.evaluate(() => bat.tareas.map(t => t.tarea + '=' + (t.casa ? (t.casa.tipo === 'variantes' ? 'var:' + t.casa.letras.join('') : bat.ejercicios[t.casa.is[0]].archivo) : '-')).join(' | '));
        ok(/ISO GEO 01A=Ejercicio 18\.json/.test(cb) && /ISO GEO 02=var:ABC/.test(cb), `${prog}: 🗂 Usar la biblioteca: ${cb}`);
        ok(await p.evaluate(() => /🗂/.test(document.getElementById('batTabla').innerHTML)), `${prog}: los de la biblioteca, marcados con 🗂`);
        ok(!p.errs.length, `${prog}: sin errores de JavaScript ${p.errs.join(' | ')}`);
        await p.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
