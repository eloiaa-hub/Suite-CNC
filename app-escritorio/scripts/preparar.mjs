// Prepara la carpeta web/ que se mete dentro del ejecutable de una edición.
//
//   node scripts/preparar.mjs [edición]        (o la variable SUITE_EDICION)
//
// Las ediciones están en ediciones/ediciones.json (una por programa + la Suite).
//
// Qué entra en cada app:
//   1. la página de inicio, lo que diga «incluir» y los archivos «comunes»;
//   2. y, AUTOMÁTICAMENTE, todo lo que esas páginas enlazan o abren
//      (href="…", window.open('…'), '…html'…), siguiendo la cadena:
//      el Calcador abre el Generador y el Simulador → entran los dos.
//      La portada index.html solo entra en la edición que empieza por ella.
//
// Los HTML se copian TAL CUAL y solo se les añade:
//   · tauri/temprano.js al principio (ventanas, mensajes entre herramientas, impresión)
//   · un pequeño registro de errores → datos/registro.txt
//   · tauri/puente.js al final (abrir/guardar, enlaces, menú Archivo del simulador…)
//
// Origen de los archivos:
//   1. La carpeta de arriba (../) si tiene la página de inicio → el repo Herramientas-CNC.
//   2. Si no, la carpeta herramientas/ de este proyecto.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'web');
const config = JSON.parse(fs.readFileSync(path.join(raiz, 'ediciones', 'ediciones.json'), 'utf8'));
const nombreEdicion = process.argv[2] || process.env.SUITE_EDICION || config.porDefecto;
const edicion = config.ediciones[nombreEdicion];
if (!edicion) {
    console.error(`✗ Edición desconocida «${nombreEdicion}». Válidas: ${Object.keys(config.ediciones).join(', ')}`);
    process.exit(1);
}

const candidatos = [path.resolve(raiz, '..'), path.join(raiz, 'herramientas')];
const origen = candidatos.find(d => fs.existsSync(path.join(d, edicion.inicio)));
if (!origen) {
    console.error(`✗ No se encuentra ${edicion.inicio} ni en ${candidatos.join(' ni en ')}`);
    process.exit(1);
}
console.log(`• Edición: ${edicion.nombre} (${nombreEdicion}) · empieza en ${edicion.inicio}`);
console.log(`• Origen de las herramientas: ${origen}`);

const existe = a => { try { return fs.statSync(path.join(origen, a)).isFile(); } catch (e) { return false; } };
const conPortada = edicion.inicio === 'index.html';

// ── 1. Lo pedido ─────────────────────────────────────────────────────
function listar(patron) {
    if (patron.endsWith('/')) {
        const dir = path.join(origen, patron);
        if (!fs.existsSync(dir)) { console.warn(`  (no está la carpeta ${patron})`); return []; }
        return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
            .filter(e => e.isFile())
            .map(e => path.relative(origen, path.join(e.parentPath || e.path, e.name)).split(path.sep).join('/'));
    }
    if (patron.startsWith('*.')) {
        const ext = patron.slice(1).toLowerCase();
        return fs.readdirSync(origen, { withFileTypes: true })
            .filter(e => e.isFile() && e.name.toLowerCase().endsWith(ext)).map(e => e.name);
    }
    if (!existe(patron)) { console.warn(`  (no está ${patron})`); return []; }
    return [patron];
}
const excluir = new Set(edicion.excluir || []);
const incluidos = new Set();
for (const p of [edicion.inicio, ...(edicion.incluir || []), ...(config.comunes || [])])
    for (const a of listar(p)) if (!excluir.has(a)) incluidos.add(a);

// ── 2. Dependencias: lo que enlazan o abren las páginas ──────────────
const EXT_DEP = /\.(html?|pdf|json|csv|txt|png|jpe?g|svg|gif|webp|css|js)$/i;
const REF = /(?:href|src)\s*=\s*["']([^"'#?]+)|["'`]([\w\-./%() ºª]+\.(?:html?|pdf))(?:[#?][^"'`]*)?["'`]/gi;
function dependencias(archivo) {
    const texto = fs.readFileSync(path.join(origen, archivo), 'utf8');
    const dir = path.posix.dirname(archivo);
    const fuera = new Set();
    for (const m of texto.matchAll(REF)) {
        let r = (m[1] || m[2] || '').trim();
        if (!r || /^(https?:|mailto:|data:|blob:|javascript:|#|\/\/)/i.test(r) || !EXT_DEP.test(r)) continue;
        try { r = decodeURIComponent(r); } catch (e) {}
        const a = path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, r));
        if (a.startsWith('..') || a.startsWith('/')) continue;
        if (!conPortada && a === 'index.html') continue;         // la portada solo en la Suite
        if (existe(a) && !excluir.has(a)) fuera.add(a);
    }
    return fuera;
}
const pendientes = [...incluidos].filter(a => /\.html?$/i.test(a));
const revisadas = new Set();
const anadidas = [];
while (pendientes.length) {
    const p = pendientes.pop();
    if (revisadas.has(p)) continue;
    revisadas.add(p);
    for (const d of dependencias(p)) {
        if (incluidos.has(d)) continue;
        incluidos.add(d); anadidas.push(d);
        if (/\.html?$/i.test(d)) pendientes.push(d);
    }
}
const archivos = [...incluidos].sort();

// ── Lo que se añade a cada página ─────────────────────────────────────
// Registro de errores: lo primero, para anotar incluso los de los scripts de la página
const DIAGNOSTICO = `<script>(function(){var T=window.__TAURI__;function r(m){try{T&&T.core&&T.core.invoke('registrar',{texto:String(m)})}catch(e){}}
window.__registrar=r;r('inicio '+location.href+' · '+navigator.userAgent+' · tauri='+(!!T));
window.addEventListener('error',function(e){var t=e.target;r('ERROR '+(e.message||'')+(t&&t!==window&&(t.src||t.href)?' recurso: '+(t.src||t.href):'')+' @'+(e.filename||'')+':'+(e.lineno||'')+':'+(e.colno||''))},true);
window.addEventListener('unhandledrejection',function(e){r('PROMESA RECHAZADA '+(e.reason&&(e.reason.stack||e.reason.message)||e.reason))});
document.addEventListener('DOMContentLoaded',function(){r('DOMContentLoaded')});window.addEventListener('load',function(){r('load · puente='+(!!window.__suiteCNC))});})();</script>`;

function inyectar(html, profundidad) {
    const sube = '../'.repeat(profundidad);           // páginas en subcarpetas (biblioteca_inicio/…)
    const temprano = `${DIAGNOSTICO}<script src="${sube}tauri/temprano.js"></script>`;
    // justo después de <meta charset> (o de <head>), para no alejar el charset del principio
    let h = html.search(/<meta[^>]+charset[^>]*>/i);
    if (h < 0) h = html.search(/<head[^>]*>/i);
    if (h >= 0) { const fin = html.indexOf('>', h) + 1; html = html.slice(0, fin) + temprano + html.slice(fin); }
    else html = temprano + html;
    const etiqueta = `<script src="${sube}tauri/puente.js"></script>`;
    const i = html.lastIndexOf('</body>');
    return i >= 0 ? html.slice(0, i) + etiqueta + '\n' + html.slice(i) : html + '\n' + etiqueta + '\n';
}

// ── Copiar ───────────────────────────────────────────────────────────
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(path.join(destino, 'tauri'), { recursive: true });
for (const f of ['puente.js', 'temprano.js']) fs.copyFileSync(path.join(raiz, 'puente', f), path.join(destino, 'tauri', f));
fs.copyFileSync(path.join(raiz, 'puente', 'tauri-imprimir.html'), path.join(destino, 'tauri-imprimir.html'));

let paginas = 0, bytes = 0;
for (const a of archivos) {
    const de = path.join(origen, a), hacia = path.join(destino, a);
    fs.mkdirSync(path.dirname(hacia), { recursive: true });
    if (/\.html?$/i.test(a)) {
        fs.writeFileSync(hacia, inyectar(fs.readFileSync(de, 'utf8'), a.split('/').length - 1));
        paginas++;
    } else {
        fs.copyFileSync(de, hacia);
    }
    bytes += fs.statSync(hacia).size;
}
// La página de inicio, para que la app sepa con qué arrancar aunque se cambie el nombre
fs.writeFileSync(path.join(destino, 'tauri', 'edicion.json'), JSON.stringify({ edicion: nombreEdicion, ...edicion }, null, 1));

console.log(`  ✓ ${archivos.length} archivos (${paginas} páginas), ${(bytes / 1048576).toFixed(1)} MB`);
const html = archivos.filter(a => /\.html?$/i.test(a) && !a.includes('/'));
console.log(`    páginas: ${html.join(', ')}`);
if (anadidas.length) console.log(`    añadidas por dependencia: ${anadidas.filter(a => !a.includes('/')).join(', ') || '—'}${anadidas.some(a => a.includes('/')) ? ' (+ archivos en subcarpetas)' : ''}`);
console.log('• web/ preparada');
