// Corrección masiva (Calcador v100 / Corrector v46): programas entregados en un documento (LibreOffice .odt, Word .docx y .doc,
// RTF), también renombrado a .nc: se corrigen igual y se avisa del formato. Crea los documentos con LibreOffice (soffice).
const { lanzar, abrir, path, fs } = require('./comun.js');
const zlib = require('zlib'), os = require('os'), { execFileSync } = require('child_process');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'entregas-doc-'));
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
function crc32(b) { let c, t = crc32.t || (crc32.t = Array.from({ length:256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; })); let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; }
function zip(entradas) {
    const loc = [], cen = []; let off = 0;
    for (const [n, d0] of entradas) {
        const nombre = Buffer.from(n, 'utf8'), d = Buffer.isBuffer(d0) ? d0 : Buffer.from(d0, 'utf8'), c = zlib.deflateRawSync(d), crc = crc32(d);
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(c.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(nombre.length, 26);
        const e = Buffer.alloc(46); e.writeUInt32LE(0x02014b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(20, 6); e.writeUInt16LE(0x800, 8); e.writeUInt16LE(8, 10); e.writeUInt32LE(crc, 16); e.writeUInt32LE(c.length, 20); e.writeUInt32LE(d.length, 24); e.writeUInt16LE(nombre.length, 28); e.writeUInt32LE(off, 42);
        loc.push(h, nombre, c); cen.push(e, nombre); off += 30 + nombre.length + c.length;
    }
    const C = Buffer.concat(cen), f = Buffer.alloc(22); f.writeUInt32LE(0x06054b50, 0); f.writeUInt16LE(entradas.length, 8); f.writeUInt16LE(entradas.length, 10); f.writeUInt32LE(C.length, 12); f.writeUInt32LE(off, 16);
    return Buffer.concat([...loc, C, f]);
}
const convertir = (txt, nombre, fmt) => { const t = path.join(TMP, nombre + '.txt'); fs.writeFileSync(t, txt); execFileSync('soffice', ['--headless', '--convert-to', fmt, '--outdir', TMP, t], { env: { ...process.env, HOME: TMP }, stdio: 'ignore' }); return fs.readFileSync(path.join(TMP, nombre + '.' + fmt)); };
(async () => {
    try { execFileSync('soffice', ['--version'], { stdio: 'ignore' }); } catch (e) { console.log('· LibreOffice (soffice) no está instalado: no se puede hacer la prueba'); process.exit(0); }
    const nc = fs.readFileSync(EJ + '.nc', 'utf8'), json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    const guion = nc.replace(/X-/, 'X–').replace(/Y-/, 'Y−');   // lo que hace el corrector automático del procesador de textos
    const A = 'Alumno_%_assignsubmission_file_/';
    const ent = [
        ['Texto, Bien_201_assignsubmission_file_/pieza.nc', nc],
        ['Libre, Odt_202_assignsubmission_file_/pieza.odt', convertir(nc, 'a', 'odt')],
        ['Word, Docx_203_assignsubmission_file_/pieza.docx', convertir(nc, 'b', 'docx')],
        ['Word, Doc_204_assignsubmission_file_/pieza.doc', convertir(nc, 'c', 'doc')],
        ['Wordpad, Rtf_205_assignsubmission_file_/pieza.rtf', convertir(nc, 'd', 'rtf')],
        ['Renombrado, Nc_206_assignsubmission_file_/pieza.nc', convertir(nc, 'e', 'odt')],
        ['Guiones, Largos_207_assignsubmission_file_/pieza.docx', convertir(guion, 'f', 'docx')],
        ['Con, Memoria_208_assignsubmission_file_/pieza.nc', nc], ['Con, Memoria_208_assignsubmission_file_/memoria.docx', convertir('Memoria del proyecto.\nHe hecho la pieza con cuidado.', 'g', 'docx')],
        ['Solo, Memoria_209_assignsubmission_file_/memoria.odt', convertir('Memoria del proyecto, sin programa.', 'h', 'odt')],
    ];
    const espera = { 'Texto, Bien':['bien', null], 'Libre, Odt':['bien', /LibreOffice \(\.odt\); debe ser un archivo de texto/], 'Word, Docx':['bien', /Word \(\.docx\)/], 'Word, Doc':['bien', /Word antiguo \(\.doc\)/],
        'Wordpad, Rtf':['bien', /RTF/], 'Renombrado, Nc':['bien', /LibreOffice \(\.odt\) guardado como \.nc/], 'Guiones, Largos':['bien', /Word \(\.docx\)/], 'Con, Memoria':['bien', null], 'Solo, Memoria':['vacio', /ningún programa dentro/] };
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(d => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = []; }, json);
        const f = path.join(TMP, 'entregas.zip'); fs.writeFileSync(f, zip(ent));
        await pg.setInputFiles('#mvArchivos', f); await pg.waitForTimeout(1500);
        const L = await pg.evaluate(() => masiva.lista.map(it => ({ a:it.alumno, v:it.v.veredicto, f:it.formato || null, t:it.texto })));
        for (const [al, [v, re]] of Object.entries(espera)) {
            const x = L.find(x => x.a === al);
            ok(x && x.v === v && (re ? re.test(x.f || '') : !x.f), `${prog} · ${al}: ${x ? x.v : 'no está'}${x && x.f ? ' · ' + x.f : ''}`);
        }
        ok(L.length === Object.keys(espera).length, `${prog}: ${L.length} alumnos (la memoria del que entrega programa no cuenta)`);
        const odt = L.find(x => x.a === 'Libre, Odt'); ok(odt && odt.t.split('\n').length === nc.trim().split('\n').length, `${prog}: del .odt sale el programa entero (${odt && odt.t.split('\n').length} líneas)`);
        const vis = await pg.evaluate(() => ({ marca: document.querySelectorAll('#mvTabla .mv-inf.mal').length, res: document.getElementById('mvResumen').textContent }));
        ok(vis.marca === 7 && /formato de archivo incorrecto: 7/.test(vis.res), `${prog}: 📄⚠️ junto a 7 nombres y en el resumen · ${vis.res.slice(-60)}`);
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/Formato del archivo/.test(csv) && /Texto, Bien[^\n]*Correcto/.test(csv) && /Libre, Odt[^\n]*Formato de archivo incorrecto/.test(csv), `${prog}: el CSV tiene la columna «Formato del archivo»`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close(); fs.rmSync(TMP, { recursive:true, force:true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
