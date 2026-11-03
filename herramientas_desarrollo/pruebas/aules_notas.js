// ⬆ Notas para Aules (Calcador v108 / Corrector v53): rellenar la hoja de calificaciones de una tarea de Aules con la nota
// y el comentario; casar por número de participante (del zip) o por nombre; la calificación máxima de la tarea; sin entrega.
const { lanzar, abrir, path, fs } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'aules-notas-'));
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
(async () => {
    const nc = fs.readFileSync(EJ + '.nc', 'utf8'), json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    const mal = nc.replace('G2 X150 Y70 I0 J-20', 'G3 X150 Y70 I0 J-20');
    fs.writeFileSync(path.join(TMP, 'entregas.zip'), zip([
        ['Ana García Pérez_101_assignsubmission_file_/pieza.nc', nc],
        ['Bruno Sanz_102_assignsubmission_file_/pieza.nc', mal],
        ['Carla Ruiz Mora_103_assignsubmission_file_/pieza.nc', nc],      // en la hoja se llama distinto: casa por el número
        ['Elena Vidal_105_assignsubmission_file_/pieza.nc', nc],          // no está en la hoja (se ha dado de baja)
    ]));
    // la hoja de calificaciones fuera de línea de Moodle en castellano (calificación sobre 100, con coma decimal)
    const cab = ['Identificador', 'Nombre completo', 'Dirección de correo', 'Estado', 'Calificación', 'Calificación máxima', 'La calificación puede ser cambiada', 'Última modificación (entrega)', 'Última modificación (calificación)', 'Comentarios de retroalimentación'];
    const fila = (id, n, m) => [`Participante ${id}`, n, m, 'Enviado para calificar', '', '100,00', 'Sí', 'jueves, 29 de octubre de 2026, 10:00', '-', ''];
    const hoja = [cab, fila(101, 'Ana García Pérez', 'ana@x.es'), fila(102, 'Bruno Sanz', 'b@x.es'), fila(103, 'Carla María Ruiz Mora', 'c@x.es'), fila(104, 'David López', 'd@x.es')]
        .map(f => f.map(x => '"' + x + '"').join(',')).join('\n') + '\n';
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(d => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = []; }, json);
        await pg.setInputFiles('#mvArchivos', path.join(TMP, 'entregas.zip')); await pg.waitForTimeout(1200);
        const ids = await pg.evaluate(() => masiva.ids);
        ok(ids['Ana García Pérez'] === '101' && ids['Carla Ruiz Mora'] === '103', `${prog}: el número de participante sale del zip (${JSON.stringify(ids)})`);
        await pg.evaluate(() => abrirNotasAules()); await pg.waitForTimeout(200);
        let bajado = null; await pg.exposeFunction('_bajado', (t, n) => { bajado = { t, n }; }).catch(() => {});
        await pg.evaluate(() => { window.descargar = (t, n) => window._bajado(t, n); });
        fs.writeFileSync(path.join(TMP, 'Calificaciones-Tarea 5.csv'), hoja);
        await pg.setInputFiles('#aulesCSV', path.join(TMP, 'Calificaciones-Tarea 5.csv')); await pg.waitForTimeout(500);
        const res = await pg.evaluate(() => document.getElementById('aulesRes').textContent);
        ok(/3 alumnos con nota y comentario/.test(res) && /1 sin entrega/.test(res), `${prog}: ${res.slice(0, 90)}`);
        ok(/No se han encontrado en la hoja: Elena Vidal/.test(res), `${prog}: avisa de la alumna que no está en la hoja`);
        await pg.click('#aulesBajar'); await pg.waitForTimeout(300);
        ok(bajado && bajado.n === 'Calificaciones-Tarea 5 - con notas.csv', `${prog}: se descarga «${bajado && bajado.n}»`);
        const filas = await pg.evaluate(t => leerCSVAules(t).filas, bajado.t);
        const f = id => filas.find(x => x[0] === 'Participante ' + id);
        ok(filas[0].join('|') === cab.join('|') && filas.length === 5, `${prog}: la hoja conserva las columnas y las filas`);
        ok(f(101)[4] === '100,00' && /Nota orientativa del Corrector: 10 sobre 10/.test(f(101)[9]), `${prog}: Ana, ${f(101)[4]} (sobre 100, con coma) · «${f(101)[9].split('\n')[0]}»`);
        const nb = parseFloat(f(102)[4].replace(',', '.'));
        ok(nb < 100 && /Errores:/.test(f(102)[9]), `${prog}: Bruno, ${f(102)[4]} con sus errores en el comentario`);
        ok(f(103)[4] === '100,00', `${prog}: Carla casa por el número aunque el nombre no coincida (${f(103)[4]})`);
        ok(f(104)[4] === '' && f(104)[9] === '', `${prog}: David, sin entrega, se queda como estaba`);
        ok(f(101)[2] === 'ana@x.es' && f(101)[7] === 'jueves, 29 de octubre de 2026, 10:00', `${prog}: el resto de columnas, igual`);
        // una hoja con punto decimal y separador «;», sin comentarios
        const hoja2 = 'Identificador;Nombre completo;Calificación;Calificación máxima\nParticipante 101;Ana García Pérez;;10.00\nParticipante 102;Bruno Sanz;;10.00\n';
        const r2 = await pg.evaluate(t => { const r = rellenarHojaAules(t, { comentario: true }); return { t: r.texto, hayCom: r.hayCom }; }, hoja2);
        ok(/Participante 101;Ana García Pérez;10\.00;10\.00/.test(r2.t) && !r2.hayCom, `${prog}: hoja con «;» y punto decimal, sin columna de comentarios`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive:true, force:true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
