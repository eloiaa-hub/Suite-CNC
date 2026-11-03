// Prueba de las entregas: 🧾 informe de entrega del Simulador (PDF) y corrección masiva desde el .zip de Aules
// (Calcador y Corrector). Uso: node entregas.js   (con LANG=C.UTF-8 para que Chromium respete las tildes al descargar)
const { lanzar, abrir, SUITE, path, fs } = require('./comun.js');
const zlib = require('zlib'), os = require('os');
const EJ = process.env.EJ || path.join(__dirname, 'ISO 13 - dos herramientas');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'entregas-'));
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
// zip mínimo (deflate o sin comprimir, nombres en UTF-8)
function crc32(b) { let c, t = crc32.t || (crc32.t = Array.from({ length:256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; })); let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; }
function zip(entradas, comprimir = true) {
    const loc = [], cen = []; let off = 0;
    for (const [n, d0] of entradas) {
        const nombre = Buffer.from(n, 'utf8'), d = Buffer.isBuffer(d0) ? d0 : Buffer.from(d0, 'utf8'), c = comprimir ? zlib.deflateRawSync(d) : d, crc = crc32(d);
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(comprimir ? 8 : 0, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(c.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(nombre.length, 26);
        const e = Buffer.alloc(46); e.writeUInt32LE(0x02014b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(20, 6); e.writeUInt16LE(0x800, 8); e.writeUInt16LE(comprimir ? 8 : 0, 10); e.writeUInt32LE(crc, 16); e.writeUInt32LE(c.length, 20); e.writeUInt32LE(d.length, 24); e.writeUInt16LE(nombre.length, 28); e.writeUInt32LE(off, 42);
        loc.push(h, nombre, c); cen.push(e, nombre); off += 30 + nombre.length + c.length;
    }
    const C = Buffer.concat(cen), f = Buffer.alloc(22); f.writeUInt32LE(0x06054b50, 0); f.writeUInt16LE(entradas.length, 8); f.writeUInt16LE(entradas.length, 10); f.writeUInt32LE(C.length, 12); f.writeUInt32LE(off, 16);
    return Buffer.concat([...loc, C, f]);
}
(async () => {
    const b = await lanzar();
    const nc = fs.readFileSync(EJ + '.nc', 'utf8'), json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    const mal = nc.replace('G1 X150 Y20 F1000', 'G1 X150 Y25 F1000'); if (mal === nc) throw new Error('el ejercicio de prueba ha cambiado');
    // 1) informe de entrega en el Simulador 3D (en 3D y en 2D)
    const pdfs = {};
    for (const [prog, en2D] of [['simulador3d.html', false], ['simulador3d.html', true]]) {
        const pg = await abrir(b, prog); await pg.waitForTimeout(600);
        await pg.setInputFiles('#fileInput', EJ + '.json'); await pg.waitForTimeout(400);
        await pg.setInputFiles('#fileInput', EJ + '.nc'); await pg.waitForTimeout(1200);
        if (en2D) await pg.evaluate(() => setModo2D(true));
        await pg.evaluate(() => abrirInforme());
        ok(await pg.$eval('#infDescargar', e => e.disabled), `${prog}: sin nombre no deja descargar`);
        await pg.evaluate(() => { document.getElementById('infAlumno').value = 'Pérez López, Ana'; document.getElementById('infGrupo').value = '1.º DA'; actualizarInforme(); });
        const [dl] = await Promise.all([pg.waitForEvent('download'), pg.evaluate(() => descargarInforme())]);
        const dest = path.join(TMP, prog + (en2D ? '-2d' : '') + '.pdf'); await dl.saveAs(dest); const pdf = fs.readFileSync(dest); pdfs[prog + (en2D ? '-2d' : '')] = pdf;
        ok(pdf.slice(0, 5).toString() === '%PDF-' && /%%EOF\s*$/.test(pdf.slice(-10).toString()), `${prog}: PDF de ${pdf.length} bytes`);
        const d = await pg.evaluate(u => leerInformePDF(new Uint8Array(u)), [...pdf]);
        ok(d && d.valido && d.alumno === 'Pérez López, Ana' && d.programa === normalizarSinPg(nc), `${prog}: el Corrector lee el informe (código ${d && d.codigo}, válido ${d && d.valido})`);
        ok(d && d.plano && d.plano.pc === 100 && d.errores === 0, `${prog}: con la comparación con el plano (${d && d.plano && d.plano.pc} %) y la revisión`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    try { require('child_process').execFileSync('qpdf', ['--check', path.join(TMP, 'simulador3d.html.pdf')]); ok(true, 'qpdf --check: PDF correcto'); } catch (e) { if (e.code === 'ENOENT') console.log('· qpdf no está instalado: no se comprueba la estructura'); else ok(false, 'qpdf --check: ' + String(e.stdout || e.message).slice(0, 200)); }
    // informe manipulado: el programa del JSON incrustado ya no es el del código
    const pdf = pdfs['simulador3d.html'], s = pdf.toString('latin1'), m = /\/SuiteCNC \(([A-Za-z0-9+/=]+)\)/.exec(s);
    const d = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')); d.programa = mal;
    const pdfMal = Buffer.from(s.replace(m[1], Buffer.from(JSON.stringify(d)).toString('base64')), 'latin1');
    // 2) zip de Aules: en carpetas, sin carpetas, texto en línea, informes y un zip dentro
    const html = '<p>' + nc.split('\n').join('<br>') + '</p>';
    const casos = {
        'carpetas.zip': zip([['Pérez López, Ana_101_assignsubmission_file_/pieza.nc', nc], ['Pérez López, Ana_101_assignsubmission_file_/Informe de entrega - Pérez López, Ana - pieza.pdf', pdf],
            ['Gómez Ruiz, Íñigo_102_assignsubmission_file_/pieza.nc', mal], ['Gómez Ruiz, Íñigo_102_assignsubmission_file_/Informe.pdf', pdf], ['Gómez Ruiz, Íñigo_102_assignsubmission_file_/memoria.docx', 'PK'],
            ['Martí Soler, Pau_103_assignsubmission_file_/Informe.pdf', pdf], ['Vidal Roca, Laia_104_assignsubmission_file_/pieza.nc', mal], ['Vidal Roca, Laia_104_assignsubmission_file_/Informe.pdf', pdfMal],
            ['Sanz, Joan_105_assignsubmission_onlinetext_/onlinetext.html', html], ['Roca, Mar_106_assignsubmission_file_/a.nc', nc], ['Roca, Mar_106_assignsubmission_file_/b.nc', mal],
            ['Font, Pere_107_assignsubmission_file_/entrega.zip', zip([['dentro/pieza.nc', nc]])], ['__MACOSX/._x.nc', 'x']]),
        'plano.zip': zip([['Pérez López, Ana_101_assignsubmission_file_pieza.nc', nc], ['Gómez Ruiz, Íñigo_102_assignsubmission_file_programa.nc', mal]], false)
    };
    const espera = {
        'carpetas.zip': { 'Pérez López, Ana':['bien', 'coincide'], 'Gómez Ruiz, Íñigo':['mal', 'no es el del informe'], 'Martí Soler, Pau':['bien', 'tomado del informe'], 'Vidal Roca, Laia':['mal', 'se ha modificado'],
                          'Sanz, Joan':['bien', ''], 'Roca, Mar · a.nc':['bien', ''], 'Roca, Mar · b.nc':['mal', ''], 'Font, Pere':['bien', ''] },
        'plano.zip': { 'Pérez López, Ana':['bien', ''], 'Gómez Ruiz, Íñigo':['mal', ''] }
    };
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(d => { abrirJSONDatos(d); abrirMasiva(); }, json);
        for (const [n, buf] of Object.entries(casos)) for (const sinDS of [false, true]) {
            const f = path.join(TMP, n); fs.writeFileSync(f, buf);
            await pg.evaluate(s => { masiva.lista = []; if (s) { window._DS = window._DS || window.DecompressionStream; window.DecompressionStream = undefined; } else if (window._DS) window.DecompressionStream = window._DS; }, sinDS);
            await pg.setInputFiles('#mvArchivos', f); await pg.waitForTimeout(900);
            const L = await pg.evaluate(() => masiva.lista.map(it => ({ a:it.alumno, v:it.v.veredicto, inf:(estadoInforme(it) || {}).txt || '' })));
            const E = espera[n], malos = [];
            if (L.length !== Object.keys(E).length) malos.push(`${L.length} alumnos (se esperaban ${Object.keys(E).length}): ${L.map(x => x.a).join(' / ')}`);
            L.forEach(x => { const e = E[x.a]; if (!e) malos.push('alumno inesperado ' + x.a); else if (e[0] !== x.v || (e[1] ? !x.inf.includes(e[1]) : x.inf)) malos.push(`${x.a}: ${x.v} «${x.inf}»`); });
            ok(!malos.length, `${prog} · ${n}${sinDS ? ' (descompresión propia)' : ''}: ${L.length} alumnos ${malos.join(' | ')}`);
        }
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    fs.rmSync(TMP, { recursive:true, force:true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
function normalizarSinPg(t) { return String(t || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, ''); }
