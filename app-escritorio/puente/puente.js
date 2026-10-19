/* ════════════════════════════════════════════════════════════════════
   Puente entre las herramientas de la Suite CNC y la app de escritorio.

   Se añade al final del HTML al compilar la app (scripts/preparar.mjs).
   El HTML original no se toca: si la página se abre en un navegador normal,
   este archivo no está y todo funciona como siempre.

   Dentro de la app añade:
   · Menú «Archivo»: abrir, guardar (en el mismo archivo), guardar como…
   · Proyectos .sim3d: G-code + plano + herramienta + material en un archivo.
   · Autoguardado de recuperación cada 20 s y aviso al cerrar con cambios.
   · Diálogos nativos de Windows/Linux para abrir y guardar.
   · Abrir archivos con doble clic (asociación) o arrastrándolos a la ventana.
   · Enlaces: las guías se abren en otra ventana; los PDF y la web, con el
     programa del sistema.
   ════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const T = window.__TAURI__;
if (!T || !T.core) return;                       // en un navegador normal no hace nada

const invoke = T.core.invoke;
const dlg = T.dialog;
const ventana = T.window.getCurrentWindow();
const esSimulador = typeof cargarGcodeTexto === 'function';

const EXT_GCODE = ['nc', 'gcode', 'tap', 'ngc', 'txt'];
const EXT_PROYECTO = 'sim3d';
const TITULO_APP = 'Simulador G-Code 3D';
const nombreDe = r => String(r).split(/[\\/]/).pop();
const carpetaDe = r => { const m = String(r).match(/^(.*)[\\/][^\\/]*$/); return m ? m[1] : ''; };
const extDe = r => ((String(r).match(/\.([^.\\/]+)$/) || [])[1] || '').toLowerCase();
const sep = () => (navigator.userAgent.includes('Windows') ? '\\' : '/');
let estado = null;   // documento actual (solo en el simulador; se rellena más abajo)
const aviso = m => {
    if (typeof mostrarSnack === 'function') mostrarSnack(m);          // simulador
    else if (typeof snack === 'function') snack(m);                   // Calcador, Generador…
    else console.log(m);
};
const enSuite = !!(window.__suiteVentana || {}).portada;   // ¿la app tiene la portada index.html?

/* ── Escritura de archivos binarios (vídeos, PDF, JSON…) ─────────────── */
function escribirBinario(ruta, datos) {
    return invoke('escribir_binario', new Uint8Array(datos), { headers: { 'x-ruta': encodeURIComponent(ruta) } });
}

async function rutaSugerida(nombre) {
    nombre = nombre || 'archivo';
    const base = estado && estado.ruta ? carpetaDe(estado.ruta) : '';
    return base ? base + sep() + nombre : nombre;
}

/* ── showSaveFilePicker nativo ───────────────────────────────────────────
   El simulador ya usa showSaveFilePicker (G-code, vídeo). Se sustituye por el
   diálogo del sistema, así funciona igual en Windows y en Linux.            */
window.showSaveFilePicker = async function (opc) {
    opc = opc || {};
    const filtros = (opc.types || []).map(t => ({
        name: t.description || 'Archivo',
        extensions: [].concat(...Object.values(t.accept || {})).map(e => String(e).replace(/^\./, ''))
    }));
    const ruta = await dlg.save({ defaultPath: await rutaSugerida(opc.suggestedName), filters: filtros.length ? filtros : undefined });
    if (!ruta) throw new DOMException('Cancelado por el usuario', 'AbortError');
    return {
        kind: 'file', name: nombreDe(ruta), ruta,
        async createWritable() {
            const partes = [];
            return {
                async write(d) { if (d && d.type === 'write') d = d.data; partes.push(d instanceof Blob ? d : new Blob([d])); },
                async close() { await escribirBinario(ruta, await new Blob(partes).arrayBuffer()); }
            };
        }
    };
};

/* ── Descargas (<a download>) → diálogo «Guardar como» ───────────────── */
async function guardarDescarga(href, nombre) {
    try {
        const blob = await (await fetch(href)).blob();
        const ext = extDe(nombre);
        const ruta = await dlg.save({ defaultPath: await rutaSugerida(nombre),
            filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : undefined });
        if (!ruta) { aviso('Cancelado'); return; }
        await escribirBinario(ruta, await blob.arrayBuffer());
        aviso('Guardado: ' + nombreDe(ruta));
    } catch (e) { aviso('No se pudo guardar: ' + e); }
}
// ¿Es una descarga que el navegador guardaría como archivo?
function esDescarga(a) {
    if (!a.hasAttribute('download')) return false;
    if (/^(blob:|data:)/.test(a.href)) return true;
    try { return new URL(a.href, location.href).origin === location.origin; } catch (e) { return false; }
}
const nombreDescarga = a => a.getAttribute('download') || decodeURIComponent(nombreDe(new URL(a.href, location.href).pathname)) || 'archivo';
const clicOriginal = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function () {
    if (esDescarga(this)) { guardarDescarga(this.href, nombreDescarga(this)); return; }
    return clicOriginal.call(this);
};

/* ── Enlaces ─────────────────────────────────────────────────────────── */
async function abrirDocumentoIncluido(pagina) {
    try {
        const r = await fetch(pagina);
        if (!r.ok) throw new Error('no está incluido en la app');
        await invoke('abrir_documento', new Uint8Array(await r.arrayBuffer()), { headers: { 'x-nombre': encodeURIComponent(nombreDe(pagina)) } });
    } catch (e) { aviso('No se pudo abrir «' + nombreDe(pagina) + '»: ' + (e.message || e)); }
}
window.__suiteAbrirDocumento = abrirDocumentoIncluido;

// En los programas sueltos no hay portada: fuera los enlaces «⌂» a index.html
if (!enSuite) {
    const quitarPortada = () => document.querySelectorAll('a.ir-portada, a[href="index.html"], a[href="../index.html"]')
        .forEach(a => { a.style.display = 'none'; });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', quitarPortada); else quitarPortada();
}
document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || /^javascript:/i.test(href)) return;
    if (esDescarga(a)) { e.preventDefault(); guardarDescarga(a.href, nombreDescarga(a)); return; }
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) {                      // web o correo → programa del sistema
        e.preventDefault();
        if (/^(https?|mailto):$/.test(url.protocol)) invoke('abrir_url', { url: url.href }).catch(err => aviso(String(err)));
        return;
    }
    e.preventDefault();
    const ruta = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const pagina = ruta + url.search + url.hash;
    if (/\.html?$/i.test(ruta)) {
        if (ruta === 'index.html') {                                   // ⌂ portada
            if (enSuite) invoke('mostrar_portada').catch(() => {});
            else aviso('La portada con todas las herramientas está en la Suite CNC');
            return;
        }
        // Cada herramienta en su ventana: si ya está abierta, se trae al frente
        invoke('abrir_ventana', { pagina, titulo: (a.textContent || '').trim() || null, reutilizar: true })
            .catch(err => aviso(String(err)));
    } else if (/\.json$/i.test(ruta)) {
        guardarDescarga(url.href, decodeURIComponent(nombreDe(ruta)));   // ejercicios de la biblioteca
    } else {
        abrirDocumentoIncluido(ruta);
    }
}, true);

if (!esSimulador) return;            // páginas de documentación: solo enlaces y descargas

/* ════════════════════════════════════════════════════════════════════
   SIMULADOR: documento actual, proyectos .sim3d y autoguardado
   ════════════════════════════════════════════════════════════════════ */
window.__suiteTituloPropio = true;     // el título lo pone el simulador (● cambios sin guardar…)
estado = {
    ruta: null,          // archivo abierto/guardado (null = sin título)
    tipo: null,          // 'sim3d' | 'gcode'
    base: null,          // firma del último estado guardado
    ultimaAuto: null,    // firma del último autoguardado
    autoArchivo: false   // guardar automáticamente en el propio .sim3d
};
try { estado.autoArchivo = localStorage.getItem('sim3d_autoguardarArchivo') === '1'; } catch (e) {}

// Ajustes que se guardan en el proyecto (en este orden: el modo del material
// va antes que las medidas, porque al cambiarlo se proponen medidas nuevas)
const AJUSTES = ['tipoFresa', 'anguloV', 'diamHerramienta', 'anchoCorte',
                 'matModo', 'matMargen', 'matGrosorAuto', 'matLX', 'matLY', 'matGrosor', 'matOrigen'];
const leerAjustes = () => { const a = {}; AJUSTES.forEach(id => { const el = document.getElementById(id); if (el) a[id] = el.value; }); return a; };
function aplicarAjustes(a) {
    AJUSTES.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !(id in a) || el.value === String(a[id])) return;
        el.value = a[id];
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    });
}

// Se guarda el plano del Calcador tal como llegó, para poder guardarlo en el proyecto
let planoFuente = null;
const cargarPlanoOriginal = cargarPlano, quitarPlanoOriginal = quitarPlano;
cargarPlano = function (d, nombre) {
    const ok = cargarPlanoOriginal.apply(this, arguments);
    if (ok) planoFuente = { nombre: nombre || null, datos: d };
    return ok;
};
quitarPlano = function () { planoFuente = null; return quitarPlanoOriginal.apply(this, arguments); };

const borradorEditor = () => (typeof hayCambiosSinAplicar === 'function' && hayCambiosSinAplicar()) ? editorTexto().value : null;
const nombreLimpio = () => (nombrePrograma || '').replace(/ \(ejemplo\)$/, '');

function proyecto() {
    return {
        formato: 'sim3d', version: 1, aplicacion: 'Simulador G-Code 3D — Suite CNC (Eloi A.A.)',
        nombrePrograma: nombreLimpio(), gcode: textoPrograma, borradorEditor: borradorEditor(),
        ajustes: leerAjustes(), plano: planoFuente
    };
}
const firma = () => JSON.stringify(proyecto());
const haySinGuardar = () => estado.base !== null && firma() !== estado.base;
function marcarGuardado() { estado.base = firma(); estado.ultimaAuto = estado.base; actualizarTitulo(); }
function textoProyecto() { const p = proyecto(); p.guardado = new Date().toISOString(); return JSON.stringify(p, null, 1); }

function nombreDocumento() {
    if (estado.ruta) return nombreDe(estado.ruta);
    return nombreLimpio() ? nombreLimpio().replace(/\.[^.]+$/, '') + ' (sin guardar)' : 'Sin título';
}
let tituloPuesto = '';
function actualizarTitulo() {
    const t = (haySinGuardar() ? '● ' : '') + nombreDocumento() + ' — ' + TITULO_APP;
    if (t !== tituloPuesto) { tituloPuesto = t; ventana.setTitle(t).catch(() => {}); }
}

function cargarProyecto(p, nombre) {
    if (!p || p.formato !== 'sim3d') { aviso('«' + nombre + '» no es un proyecto del Simulador 3D'); return false; }
    if (p.version > 1) aviso('Este proyecto es de una versión más nueva del simulador: puede que falte algo');
    if (typeof editando !== 'undefined' && editando) mostrarModoEdicion(false);
    const codigo = typeof p.gcode === 'string' ? p.gcode : '';
    if (codigo.trim()) {
        cargarGcodeTexto(codigo, p.nombrePrograma || nombre.replace(/\.sim3d$/i, '.nc'));
        if (textoPrograma !== codigo) return false;
    }
    if (p.plano && p.plano.datos) cargarPlano(p.plano.datos, p.plano.nombre || nombre);
    else if (planoFuente || (typeof plano !== 'undefined' && plano)) quitarPlano();
    if (p.ajustes) aplicarAjustes(p.ajustes);
    if (typeof p.borradorEditor === 'string') {
        if (!editando) toggleEdicionCodigo();
        editorTexto().value = p.borradorEditor;
        if (!codigo.trim()) nombrePrograma = p.nombrePrograma || 'programa.nc';
        actualizarGutter();
    }
    if (!codigo.trim() && typeof p.borradorEditor !== 'string') aviso('El proyecto «' + nombre + '» no tiene G-code');
    return true;
}

function decodificar(buf) {
    let t;
    try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch (e) { t = new TextDecoder('windows-1252').decode(buf); }   // archivos antiguos de Windows
    return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
}

/* ── Abrir ─────────────────────────────────────────────────────────── */
async function abrirRuta(ruta, preguntar = true) {
    const nombre = nombreDe(ruta), ext = extDe(ruta);
    let buf;
    try { buf = new Uint8Array(await invoke('leer_archivo', { ruta })); }
    catch (e) { aviso('No se pudo abrir «' + nombre + '»: ' + e); return false; }
    const texto = decodificar(buf);
    let json = null;
    if (ext === EXT_PROYECTO || ext === 'json' || /^\s*\{/.test(texto)) {
        try { json = JSON.parse(texto); } catch (e) { aviso('«' + nombre + '» no es un archivo válido (JSON dañado)'); return false; }
    }
    // Un plano del Calcador se AÑADE al trabajo actual (no lo sustituye)
    if (json && json.formato !== 'sim3d') { cargarPlano(json, nombre); actualizarTitulo(); return true; }
    if (!json && /\u0000/.test(texto.slice(0, 2000))) { aviso('«' + nombre + '» no parece un archivo de texto con G-code'); return false; }

    if (preguntar && !(await confirmarCambios('abrir «' + nombre + '»'))) return false;
    if (json) {
        if (!cargarProyecto(json, nombre)) return false;
        estado.tipo = 'sim3d';
    } else {
        if (typeof editando !== 'undefined' && editando) mostrarModoEdicion(false);
        cargarGcodeTexto(texto, nombre);
        if (textoPrograma !== texto) return false;
        estado.tipo = 'gcode';
    }
    estado.ruta = ruta;
    marcarGuardado();
    if (json && typeof json.borradorEditor === 'string') estado.base = '';   // traía cambios sin aplicar
    invoke('borrar_autoguardado').catch(() => {});
    actualizarTitulo();
    return true;
}

async function abrirDialogo() {
    const r = await dlg.open({
        multiple: false, directory: false, title: 'Abrir',
        defaultPath: estado.ruta ? carpetaDe(estado.ruta) : undefined,
        filters: [
            { name: 'Archivos del simulador', extensions: [EXT_PROYECTO, ...EXT_GCODE, 'json'] },
            { name: 'Proyecto del Simulador 3D (.sim3d)', extensions: [EXT_PROYECTO] },
            { name: 'Programa G-code', extensions: EXT_GCODE },
            { name: 'Plano del Calcador (.json)', extensions: ['json'] }
        ]
    });
    if (r) await abrirRuta(typeof r === 'string' ? r : r.path);
}

/* ── Guardar ───────────────────────────────────────────────────────── */
async function guardar(como = false, silencioso = false) {
    const codigo = editando ? editorTexto().value : textoPrograma;
    if (!codigo.trim() && !planoFuente) { aviso('No hay nada que guardar todavía'); return false; }
    let ruta = estado.ruta, tipo = estado.tipo;
    if (como || !ruta) {
        const base = (estado.ruta ? nombreDe(estado.ruta) : nombreLimpio() || 'programa').replace(/\.[^.]+$/, '');
        const r = await dlg.save({
            title: 'Guardar como',
            defaultPath: await rutaSugerida(base + '.' + EXT_PROYECTO),
            filters: [
                { name: 'Proyecto del Simulador 3D (.sim3d) — G-code, plano, herramienta y material', extensions: [EXT_PROYECTO] },
                { name: 'Solo el programa G-code (.nc)', extensions: EXT_GCODE }
            ]
        });
        if (!r) return false;
        ruta = r;
        tipo = EXT_GCODE.includes(extDe(ruta)) ? 'gcode' : 'sim3d';
        if (tipo === 'sim3d' && extDe(ruta) !== EXT_PROYECTO) ruta += '.' + EXT_PROYECTO;
    }
    try {
        if (tipo === 'gcode') {
            // Los controles antiguos esperan saltos de línea de Windows
            await invoke('escribir_texto', { ruta, contenido: codigo.replace(/\r?\n/g, '\r\n') });
            if (hayCambiosSinAplicar()) aplicarEdicion();
            nombrePrograma = nombreDe(ruta);
            document.getElementById('filenameLabel').textContent = nombrePrograma;
        } else {
            await invoke('escribir_texto', { ruta, contenido: textoProyecto() });
        }
    } catch (e) { aviso('No se pudo guardar: ' + e); return false; }
    estado.ruta = ruta; estado.tipo = tipo;
    marcarGuardado();
    invoke('borrar_autoguardado').catch(() => {});
    aviso((silencioso ? 'Autoguardado: ' : 'Guardado: ') + nombreDe(ruta));
    return true;
}
// Exportar G-code: la función original del simulador (ahora con diálogo nativo)
const exportarGcode = guardarGcode;
// El botón 💾 del editor y Ctrl+S guardan el documento actual
guardarGcode = () => guardar(false);

/* ── Ventana propia para preguntar (3 botones, con el estilo de la suite) ── */
function preguntar(titulo, texto, botones) {
    return new Promise(resolver => {
        const fondo = document.createElement('div');
        fondo.className = 'tauri-fondo';
        fondo.innerHTML = '<div class="tauri-dialogo" role="dialog" aria-modal="true"><h3></h3><p></p><div class="tauri-botones"></div></div>';
        fondo.querySelector('h3').textContent = titulo;
        fondo.querySelector('p').textContent = texto;
        const fin = v => { fondo.remove(); document.removeEventListener('keydown', tecla, true); resolver(v); };
        const tecla = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin('cancelar'); } };
        botones.forEach(b => {
            const el = document.createElement('button');
            el.textContent = b.texto; if (b.principal) el.className = 'principal';
            el.onclick = () => fin(b.id);
            fondo.querySelector('.tauri-botones').appendChild(el);
        });
        document.addEventListener('keydown', tecla, true);
        document.body.appendChild(fondo);
        const p = fondo.querySelector('button.principal'); if (p) p.focus();
    });
}

/** true = se puede seguir (guardado o descartado), false = cancelado */
async function confirmarCambios(accion) {
    if (!haySinGuardar()) return true;
    const r = await preguntar('Cambios sin guardar',
        'Hay cambios sin guardar en «' + nombreDocumento() + '». ¿Quieres guardarlos antes de ' + accion + '?',
        [{ id: 'guardar', texto: '💾 Guardar', principal: true }, { id: 'no', texto: 'No guardar' }, { id: 'cancelar', texto: 'Cancelar' }]);
    if (r === 'cancelar') return false;
    if (r === 'guardar') return guardar(false);
    if (typeof editando !== 'undefined' && editando) mostrarModoEdicion(false);
    return true;
}

/* ── Menú Archivo (en la cabecera) ──────────────────────────────────── */
const estilo = document.createElement('style');
estilo.textContent = `
.tauri-menu { position:fixed; z-index:400; min-width:300px; background:var(--bg-panel); color:var(--text-main);
  border:1px solid var(--border-color); border-radius:8px; box-shadow:var(--shadow); padding:5px 0; font-size:13px; display:none; }
.tauri-menu.visible { display:block; }
.tauri-menu button { display:flex; width:100%; justify-content:space-between; gap:24px; border:0; border-radius:0;
  background:none; color:inherit; padding:7px 14px; text-align:left; font:inherit; cursor:pointer; }
.tauri-menu button:hover { background:var(--accent-light); }
.tauri-menu kbd { font:inherit; font-size:11.5px; color:var(--text-muted); }
.tauri-menu hr { border:0; border-top:1px solid var(--border-color); margin:5px 0; }
.tauri-fondo { position:fixed; inset:0; background:rgba(20,30,40,.45); display:flex; align-items:center; justify-content:center; z-index:500; }
.tauri-dialogo { background:var(--bg-panel); color:var(--text-main); border-radius:10px; box-shadow:var(--shadow);
  padding:20px 22px 16px; max-width:480px; width:calc(100% - 40px); }
.tauri-dialogo h3 { margin:0 0 10px; font-size:16px; color:var(--accent); }
.tauri-dialogo p { margin:0 0 18px; font-size:13.5px; line-height:1.5; white-space:pre-line; }
.tauri-dialogo code { font-size:12px; word-break:break-all; }
.tauri-botones { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
.tauri-botones button { padding:7px 14px; }
`;
document.head.appendChild(estilo);

const menu = document.createElement('div');
menu.className = 'tauri-menu';
menu.setAttribute('role', 'menu');
document.body.appendChild(menu);

// Antes de recargar la ventana para recibir algo del Calcador (temprano.js)
window.__suitePuedeSalir = async accion => {
    if (!(await confirmarCambios(accion))) return false;
    await invoke('borrar_autoguardado').catch(() => {});
    estado.base = firma();       // para no volver a preguntar al cerrar
    return true;
};

const OPCIONES = [
    ['📂 Abrir…', 'Ctrl+O', abrirDialogo],
    ['💾 Guardar', 'Ctrl+S', () => guardar(false)],
    ['💾 Guardar como…', 'Ctrl+Mayús+S', () => guardar(true)],
    ['📤 Exportar solo el G-code (.nc)…', '', () => exportarGcode()],
    null,
    [() => (estado.autoArchivo ? '☑' : '☐') + ' Guardar solo en el proyecto cada 20 s', '', alternarAutoArchivo],
    null,
    ['🔗 Asociar archivos con esta app…', '', asociar],
    ['📁 Abrir la carpeta de datos', '', () => invoke('abrir_carpeta_datos').catch(e => aviso(String(e)))],
    ['ℹ️ Acerca de la versión de escritorio', '', acercaDe]
];
function pintarMenu() {
    menu.innerHTML = '';
    OPCIONES.forEach(o => {
        if (!o) { menu.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button');
        b.setAttribute('role', 'menuitem');
        b.innerHTML = '<span></span><kbd></kbd>';
        b.firstChild.textContent = typeof o[0] === 'function' ? o[0]() : o[0];
        b.lastChild.textContent = o[1];
        b.onclick = () => { cerrarMenu(); o[2](); };
        menu.appendChild(b);
    });
}
function abrirMenu(boton) {
    pintarMenu();
    const r = boton.getBoundingClientRect();
    menu.style.left = Math.max(6, Math.min(r.left, innerWidth - 320)) + 'px';
    menu.style.top = (r.bottom + 4) + 'px';
    menu.classList.add('visible');
}
function cerrarMenu() { menu.classList.remove('visible'); }
document.addEventListener('mousedown', e => { if (!menu.contains(e.target) && !e.target.closest('#btnArchivoTauri')) cerrarMenu(); }, true);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('visible')) { e.preventDefault(); e.stopPropagation(); cerrarMenu(); }
}, true);

function alternarAutoArchivo() {
    estado.autoArchivo = !estado.autoArchivo;
    try { localStorage.setItem('sim3d_autoguardarArchivo', estado.autoArchivo ? '1' : '0'); } catch (e) {}
    aviso(estado.autoArchivo
        ? 'Los proyectos .sim3d ya guardados se guardarán solos cada 20 s'
        : 'Guardado automático desactivado (se sigue haciendo una copia de recuperación)');
}

async function asociar() {
    let info; try { info = await invoke('info_app'); } catch (e) { info = {}; }
    if (info.asociado) {
        const r = await preguntar('Asociación de archivos',
            'Los archivos .sim3d ya se abren con esta app.\n\n¿Quieres quitar la asociación (por ejemplo, antes de borrar o mover la carpeta)?',
            [{ id: 'quitar', texto: 'Quitar asociación' }, { id: 'rehacer', texto: 'Volver a asociar' }, { id: 'cancelar', texto: 'Cancelar', principal: true }]);
        if (r === 'cancelar') return;
        try { await preguntar('Asociación de archivos', await invoke(r === 'quitar' ? 'quitar_asociacion' : 'asociar_extensiones'), [{ id: 'ok', texto: 'Aceptar', principal: true }]); }
        catch (e) { aviso(String(e)); }
        return;
    }
    const r = await preguntar('Asociar archivos',
        'Haz que los proyectos .sim3d se abran con el Simulador 3D al hacer doble clic, y añade la app a «Abrir con…» para los .nc, .gcode, .tap y .ngc.\n\nSolo afecta a tu usuario de este ordenador y no necesita permisos de administrador.',
        [{ id: 'si', texto: '🔗 Asociar', principal: true }, { id: 'cancelar', texto: 'Cancelar' }]);
    if (r !== 'si') return;
    try { await preguntar('Asociar archivos', await invoke('asociar_extensiones'), [{ id: 'ok', texto: 'Aceptar', principal: true }]); }
    catch (e) { aviso(String(e)); }
}

async function acercaDe() {
    let i; try { i = await invoke('info_app'); } catch (e) { aviso(String(e)); return; }
    await preguntar(i.nombre + ' — versión de escritorio ' + i.version,
        (i.portable
            ? '✅ Modo portable: todo se guarda en la carpeta «datos», junto a la app. Puedes copiar la carpeta completa a un USB o a otro ordenador.'
            : 'Modo instalado: los datos se guardan en la carpeta de tu usuario.')
        + '\n\nCarpeta de datos:\n' + i.datos
        + (i.webview && i.webview.indexOf(i.datos) !== 0 ? '\n\nMemoria del motor web (la ruta de la app es muy larga):\n' + i.webview : '')
        + '\n\nArchivos .sim3d asociados: ' + (i.asociado ? 'sí' : 'no')
        + '\n\nLa simulación es la misma que la del simulador3d.html de la suite. Licencia EUPL-1.2.',
        [{ id: 'ok', texto: 'Aceptar', principal: true }]);
}

/* ── Integración con la cabecera del simulador ─────────────────────── */
(function () {
    const cargar = document.querySelector('header button.principal');
    if (cargar) { cargar.onclick = e => { e.preventDefault(); abrirDialogo(); }; cargar.title = 'Abrir un proyecto .sim3d, un programa G-code o el plano del ejercicio (.json del Calcador) — Ctrl+O'; }
    const b = document.createElement('button');
    b.id = 'btnArchivoTauri';
    b.innerHTML = '🗂️<span class="lbl"> Archivo</span> ▾';
    b.title = 'Abrir, guardar, proyectos .sim3d y opciones de la app';
    b.onclick = () => menu.classList.contains('visible') ? cerrarMenu() : abrirMenu(b);
    if (cargar) cargar.insertAdjacentElement('afterend', b); else document.querySelector('header').appendChild(b);
})();

/* ── Teclado ──────────────────────────────────────────────────────── */
window.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    let accion = null;
    if (k === 's') accion = () => guardar(e.shiftKey);
    else if (k === 'o' && !e.shiftKey) accion = abrirDialogo;
    if (!accion) return;
    e.preventDefault(); e.stopImmediatePropagation(); cerrarMenu();
    accion();
}, true);

/* ── Arrastrar archivos a la ventana (con su ruta: luego Ctrl+S guarda en él) ── */
window.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); }, true);
window.addEventListener('dragover', e => e.preventDefault(), true);
try {
    T.webview.getCurrentWebview().onDragDropEvent(ev => {
        const p = ev.payload, pista = document.getElementById('dropHint');
        if (p.type === 'enter' || p.type === 'over') { if (pista) pista.classList.add('dragover'); }
        else {
            if (pista) pista.classList.remove('dragover');
            if (p.type === 'drop' && p.paths && p.paths.length) abrirRuta(p.paths[0]);
        }
    });
} catch (e) { console.warn('Arrastrar archivos no disponible', e); }

/* ── Ejemplos: empiezan como documento nuevo sin título ─────────────── */
if (typeof cargarEjemplo === 'function') {
    const ejemploOriginal = cargarEjemplo;
    cargarEjemplo = async function (id) {
        if (!id) return;
        if (!(await confirmarCambios('abrir el ejemplo'))) { const s = document.getElementById('selEjemplo'); if (s) s.value = ''; return; }
        ejemploOriginal.call(this, id);
        estado.ruta = null; estado.tipo = null; marcarGuardado();
    };
}

/* ── Cerrar la ventana ─────────────────────────────────────────────── */
ventana.onCloseRequested(async ev => {
    if (!haySinGuardar()) { await invoke('borrar_autoguardado').catch(() => {}); return; }
    ev.preventDefault();
    try {
        if (!(await confirmarCambios('salir'))) return;
        await invoke('borrar_autoguardado').catch(() => {});
        await ventana.destroy();
    } catch (e) {
        // Plan B: ya no hay cambios pendientes, así que un cierre normal no vuelve a preguntar
        if (!haySinGuardar()) ventana.close().catch(() => aviso('No se pudo cerrar: ' + (e && e.message || e)));
    }
});

/* ── Autoguardado ──────────────────────────────────────────────────────
   Cada 20 s, si hay cambios:
   · siempre se guarda una copia de recuperación en datos/autoguardado
     (si la app se cierra de golpe, se ofrece recuperarla al abrirla);
   · si está activado «Guardar solo», el .sim3d abierto se guarda él mismo.   */
setInterval(async () => {
    actualizarTitulo();
    if (!haySinGuardar()) return;
    const f = firma();
    if (f === estado.ultimaAuto) return;
    estado.ultimaAuto = f;
    if (estado.autoArchivo && estado.ruta && estado.tipo === 'sim3d') { await guardar(false, true); return; }
    const p = proyecto();
    p.guardado = new Date().toISOString();
    p.recuperacion = { ruta: estado.ruta, tipo: estado.tipo };
    invoke('autoguardar', { contenido: JSON.stringify(p) }).catch(e => console.warn('Autoguardado:', e));
}, 20000);
setInterval(actualizarTitulo, 1500);

/* ── Arranque: archivo con el que se abrió la app, o recuperación ─────── */
async function ofrecerRecuperacion() {
    let rec; try { rec = await invoke('leer_autoguardado'); } catch (e) { return; }
    if (!rec) return;
    let p; try { p = JSON.parse(rec.contenido); } catch (e) { invoke('borrar_autoguardado'); return; }
    const nombre = p.recuperacion && p.recuperacion.ruta ? nombreDe(p.recuperacion.ruta) : (p.nombrePrograma || 'sin título');
    const fecha = new Date(rec.fecha || Date.now()).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    const r = await preguntar('Recuperar trabajo',
        'La última vez el simulador se cerró sin guardar «' + nombre + '».\nHay una copia automática del ' + fecha + '.\n\n¿Quieres recuperarla?',
        [{ id: 'si', texto: '♻️ Recuperar', principal: true }, { id: 'no', texto: 'Descartar' }]);
    if (r !== 'si') { invoke('borrar_autoguardado'); return; }
    if (!cargarProyecto(p, nombre)) return;
    estado.ruta = p.recuperacion ? p.recuperacion.ruta : null;
    estado.tipo = p.recuperacion ? p.recuperacion.tipo : null;
    estado.base = '';                                   // lo recuperado está sin guardar
    actualizarTitulo();
    aviso('Trabajo recuperado: guárdalo con Ctrl+S');
}

window.addEventListener('load', () => setTimeout(async () => {
    estado.base = firma();
    actualizarTitulo();
    T.webviewWindow.getCurrentWebviewWindow().listen('abrir-archivo', ev => abrirRuta(ev.payload));
    let inicial = null;
    try { inicial = await invoke('archivo_inicial'); } catch (e) {}
    try {
        const info = await invoke('info_app');
        for (const a of info.avisos || []) await preguntar('Aviso', a, [{ id: 'ok', texto: 'Entendido', principal: true }]);
    } catch (e) {}
    if (inicial) await abrirRuta(inicial, false);
    else if (location.hash !== '#desdeCalcador') await ofrecerRecuperacion();   // si viene del Calcador, no
}, 500));

// Para pruebas desde la consola
window.__suiteCNC = { estado, proyecto, abrirRuta, guardar, cargarProyecto };
})();
