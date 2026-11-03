// Calcador: textos de DXF con acentos (\U+XXXX, %%nnn, ANSI_1252 en R12, UTF-8 en DXF 2007+, UTF-8 en un R12)
// Crea los DXF con ezdxf (pip install ezdxf) y los abre de fondo con el botón del Calcador.
// Uso: node dxf_texto.js
const { lanzar, path, SUITE, fs } = require('./comun');
const { execFileSync } = require('child_process');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'dxft-'));
const NOMBRE = 'Zócalo ñ Ø20';
const py = `
import ezdxf, sys, os
d = sys.argv[1]; t = sys.argv[2]
def hacer(ver, nombre, enc=None):
    doc = ezdxf.new(ver); msp = doc.modelspace()
    msp.add_lwpolyline([(0,0),(100,0),(100,50),(0,50)], close=True) if ver != 'R12' else msp.add_polyline2d([(0,0),(100,0),(100,50),(0,50)], close=True)
    msp.add_text(t, dxfattribs={'height': 5, 'insert': (10, 20)})
    if ver != 'R12': msp.add_mtext(t, dxfattribs={'char_height': 5, 'insert': (10, 40)})
    if enc: doc.encoding = enc
    doc.saveas(os.path.join(d, nombre))
hacer('R12', 'r12_1252.dxf')                 # R12 en ANSI_1252 (un byte por acento)
hacer('R2010', 'r2010_utf8.dxf')            # DXF 2010: UTF-8
`;
fs.writeFileSync(path.join(TMP, 'crear.py'), py);
execFileSync('python3', [path.join(TMP, 'crear.py'), TMP, NOMBRE]);
// R12 escrito en ASCII con \\U+ (como el Anidador) y con %%nnn, y un R12 en UTF-8 (algunos programas lo hacen)
const r12 = txt => ['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','0','ENDSEC','0','SECTION','2','ENTITIES',
  '0','LINE','8','0','10','0','20','0','30','0','11','100','21','0','31','0',
  '0','TEXT','8','0','10','10','20','20','30','0','40','5','1',txt,'0','ENDSEC','0','EOF',''].join('\r\n');
fs.writeFileSync(path.join(TMP, 'r12_unicode.dxf'), r12('Z\\U+00F3calo \\U+00F1 %%c20'));
fs.writeFileSync(path.join(TMP, 'r12_nnn.dxf'), r12('Z%%243calo %%241 %%c20'));
fs.writeFileSync(path.join(TMP, 'r12_utf8.dxf'), Buffer.from(r12(NOMBRE), 'utf8'));
(async () => {
  const b = await lanzar(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.waitForTimeout(800);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  for (const f of ['r12_1252.dxf', 'r2010_utf8.dxf', 'r12_unicode.dxf', 'r12_nnn.dxf', 'r12_utf8.dxf']) {
    await p.evaluate(() => { fondo = null; });
    await p.setInputFiles('#fileFondo', path.join(TMP, f));
    await p.waitForFunction(() => fondo && fondo.tipo === 'dxf', null, { timeout: 5000 }).catch(() => {});
    const ts = await p.evaluate(() => fondo ? (fondo.textos || []).map(t => t.s) : null);
    ok(`${f}: «${NOMBRE}»`, ts && ts.length && ts.every(t => t.trim() === NOMBRE), JSON.stringify(ts));
  }
  // el fondo se guarda ya decodificado: al recargar sigue bien
  await p.reload(); await p.waitForTimeout(900);
  const tr = await p.evaluate(() => fondo ? fondo.textos.map(t => t.s) : null);
  ok('al recargar, el fondo conserva los acentos', tr && tr.every(t => t.trim() === NOMBRE), JSON.stringify(tr));
  console.log(`fallos ${fallos}`, errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
