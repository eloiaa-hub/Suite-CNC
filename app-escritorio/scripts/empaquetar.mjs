// Deja en dist/ lo que se publica de una edición ya compilada:
//   Windows → dist/<Exe>/ (el .exe + LEEME.txt), que el workflow comprime en <Exe>_windows_x64.zip
//   Linux   → dist/<Exe>_linux_x86_64.AppImage
//
//   node scripts/empaquetar.mjs <edición>
// Escribe el nombre del ejecutable en la salida de GitHub Actions (exe=…).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(raiz, 'ediciones', 'ediciones.json'), 'utf8'));
const edicion = process.argv[2] || process.env.SUITE_EDICION || config.porDefecto;
const ed = config.ediciones[edicion];
if (!ed) { console.error('Edición desconocida: ' + edicion); process.exit(1); }

const dist = path.join(raiz, 'dist');
fs.mkdirSync(dist, { recursive: true });
const release = path.join(raiz, 'src-tauri', 'target', 'release');

// LEEME a partir de la plantilla: los bloques [[SIMULADOR]]…[[/SIMULADOR]] y
// [[SUITE]]…[[/SUITE]] solo se dejan si la app lleva el simulador o la portada.
const web = path.join(raiz, 'web');
const lleva = { SIMULADOR: fs.existsSync(path.join(web, 'simulador3d.html')), SUITE: ed.inicio === 'index.html', F12: !!ed.devtools };
let leeme = fs.readFileSync(path.join(raiz, 'portable', 'LEEME_plantilla.txt'), 'utf8');
for (const [k, si] of Object.entries(lleva))
    leeme = leeme.replace(new RegExp(`\\[\\[${k}\\]\\]\\n?([\\s\\S]*?)\\[\\[/${k}\\]\\]\\n?`, 'g'), si ? '$1' : '');
const paginas = fs.existsSync(web) ? fs.readdirSync(web).filter(f => /\.html$/.test(f) && !f.startsWith('tauri')) : [];
leeme = leeme.replaceAll('{NOMBRE}', ed.nombre).replaceAll('{EXE}', ed.exe)
    .replaceAll('{DESCRIPCION}', ed.descripcion || '').replaceAll('{NOMBRE_MAYUS}', ed.nombre.toUpperCase())
    .replaceAll('{PAGINAS}', paginas.join(', '));
void paginas;

let salida;
if (process.platform === 'win32') {
    const carpeta = path.join(dist, ed.exe);
    fs.rmSync(carpeta, { recursive: true, force: true });
    fs.mkdirSync(carpeta, { recursive: true });
    fs.copyFileSync(path.join(release, ed.exe + '.exe'), path.join(carpeta, ed.exe + '.exe'));
    fs.writeFileSync(path.join(carpeta, 'LEEME.txt'), leeme.replace(/\n/g, '\r\n'));
    salida = carpeta;
} else {
    const dir = path.join(release, 'bundle', 'appimage');
    // Tauri lo llama «<nombre>_<versión>_amd64.AppImage»
    const ai = fs.existsSync(dir) && fs.readdirSync(dir).find(f => f.startsWith(ed.nombre + '_') && f.endsWith('.AppImage'));
    if (!ai) { console.error('✗ No hay .AppImage: compila con «appimage»'); process.exit(1); }
    salida = path.join(dist, `${ed.exe}_linux_x86_64.AppImage`);
    fs.copyFileSync(path.join(dir, ai), salida);
    fs.chmodSync(salida, 0o755);
    fs.writeFileSync(path.join(dist, `${ed.exe}_LEEME.txt`), leeme);
}
console.log(`✓ ${path.relative(raiz, salida)}`);
if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `exe=${ed.exe}\npublicar=${ed.publicar === false ? 'privado' : 'publicar'}\n`);
