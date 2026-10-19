// Compila una edición:  node scripts/compilar.mjs <edición> [portable|appimage|dev]
//   portable  → solo el ejecutable (por defecto)
//   appimage  → Linux: un archivo .AppImage
//   dev       → abre la app en modo desarrollo
// Ediciones: las de ediciones/ediciones.json (profesorado, calcador, simulador…).
// Nombre, ejecutable, identificador, icono y F12 salen de ese archivo.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(raiz, 'ediciones', 'ediciones.json'), 'utf8'));
const [edicion = config.porDefecto, modo = 'portable'] = process.argv.slice(2);
const ed = config.ediciones[edicion];
if (!ed) { console.error(`Ediciones: ${Object.keys(config.ediciones).join(' | ')}`); process.exit(1); }

// Configuración de Tauri de esta edición (se suma a src-tauri/tauri.conf.json)
const iconos = fs.existsSync(path.join(raiz, 'src-tauri', 'icons', edicion, 'icon.ico'))
    ? ['32x32.png', '128x128.png', '128x128@2x.png', 'icon.icns', 'icon.ico'].map(f => `icons/${edicion}/${f}`)
    : undefined;
const conf = {
    productName: ed.nombre,
    mainBinaryName: ed.exe,
    identifier: ed.id,
    bundle: { shortDescription: ed.nombre, longDescription: ed.descripcion || ed.nombre, ...(iconos ? { icon: iconos } : {}) }
};
fs.mkdirSync(path.join(raiz, 'ediciones', '.generado'), { recursive: true });
const archivoConf = `ediciones/.generado/${edicion}.json`;           // relativa: sin líos de rutas en Windows
fs.writeFileSync(path.join(raiz, archivoConf), JSON.stringify(conf, null, 1));

const args = ['tauri', modo === 'dev' ? 'dev' : 'build', '--config', archivoConf];
if (ed.devtools) args.push('--features', 'devtools');
if (modo === 'portable') args.push('--no-bundle');
if (modo === 'appimage') args.push('--bundles', 'appimage');
console.log(`• ${ed.nombre} → ${ed.exe}${ed.devtools ? ' (con F12)' : ''}`);
console.log('> npx ' + args.join(' '));
const r = spawnSync('npx', args, { cwd: raiz, stdio: 'inherit', shell: true, env: { ...process.env, SUITE_EDICION: edicion } });
process.exit(r.status ?? 1);
