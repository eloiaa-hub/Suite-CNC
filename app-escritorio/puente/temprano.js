/* ════════════════════════════════════════════════════════════════════
   Suite CNC (escritorio) — se carga al PRINCIPIO de cada página, antes que
   sus propios scripts. Hace que funcione lo que en el navegador dependía de
   las pestañas:

   · window.open('calcador.html…')  → abre la herramienta en otra ventana
   · window.opener / e.source.postMessage → mensajes entre ventanas
     (Calcador ⇄ Generador ⇄ Simulador ⇄ Anidador)
   · window.open('') + document.write  → hojas para imprimir
   · window.open('https://…')  → navegador del sistema

   En un navegador normal este archivo no está y nada cambia.
   ════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const T = window.__TAURI__;
if (!T || !T.core) return;
const invoke = T.core.invoke;
const info = window.__suiteVentana || {};
const yo = info.label || (T.webviewWindow && T.webviewWindow.getCurrentWebviewWindow().label) || '';

/* ── «Ventanas» de otras herramientas, vistas desde esta ─────────────── */
const cerradas = new Set();
const proxies = {};
function ventanaRemota(etiqueta) {
    if (!etiqueta) return null;
    if (proxies[etiqueta]) return proxies[etiqueta];
    const v = {
        __etiqueta: etiqueta,
        get closed() { return cerradas.has(etiqueta); },
        postMessage(datos) {
            invoke('enviar_mensaje', { destino: etiqueta, datos: clonable(datos) })
                .catch(() => cerradas.add(etiqueta));
        },
        focus() { invoke('enfocar_ventana', { etiqueta }).catch(() => {}); },
        close() { invoke('cerrar_ventana', { etiqueta }).catch(() => {}); },
        blur() {}
    };
    return (proxies[etiqueta] = v);
}
// Los mensajes viajan como JSON: se quita lo que no se puede enviar
function clonable(d) {
    try { return JSON.parse(JSON.stringify(d === undefined ? null : d)); } catch (e) { return null; }
}

if (info.opener) {
    try { Object.defineProperty(window, 'opener', { configurable: true, get: () => ventanaRemota(info.opener) }); } catch (e) {}
}

/* ── Mensajes que llegan de otras ventanas → evento «message» normal ─── */
function escuchar(nombre, fn) {
    try {
        const w = T.webviewWindow.getCurrentWebviewWindow();
        return w.listen(nombre, fn);
    } catch (e) { return T.event.listen(nombre, fn); }
}
escuchar('suite-mensaje', ev => {
    const p = ev.payload || {};
    if (p.destino && p.destino !== yo) return;
    const m = new MessageEvent('message', { data: p.datos, origin: location.origin });
    try { Object.defineProperty(m, 'source', { value: ventanaRemota(p.origen) }); } catch (e) {}
    window.dispatchEvent(m);
});
T.event.listen('suite-ventana-cerrada', ev => cerradas.add(ev.payload));

// La portada pide que esta ventana se recargue con otro #… (p. ej. «Abrir en el Simulador»
// cuando el simulador ya estaba abierto)
escuchar('suite-navegar', async ev => {
    const destino = String(ev.payload || '');
    if (typeof window.__suitePuedeSalir === 'function' && !(await window.__suitePuedeSalir('abrir lo que te envían'))) return;
    const ancla = destino.indexOf('#') >= 0 ? destino.slice(destino.indexOf('#')) : '';
    const pregunta = destino.indexOf('?') >= 0 ? destino.slice(destino.indexOf('?')).split('#')[0] : location.search;
    history.replaceState(null, '', location.pathname + pregunta + ancla);
    location.reload();
});

/* ── Hojas para imprimir: window.open('') + document.write(html) ────── */
function ventanaImpresion() {
    let html = '';
    const abrir = () => {
        invoke('guardar_impresion', { html }).then(id =>
            invoke('abrir_ventana', { pagina: 'tauri-imprimir.html?id=' + encodeURIComponent(id), titulo: tituloDe(html) || 'Imprimir' }))
            .catch(e => console.error('Impresión:', e));
    };
    let enviado = false;
    const doc = {
        open() { html = ''; return doc; },
        write(...t) { html += t.join(''); },
        writeln(...t) { html += t.join('') + '\n'; },
        close() { if (!enviado) { enviado = true; abrir(); } },
        get body() { return null; }
    };
    return {
        document: doc, closed: false,
        focus() {}, blur() {}, print() {}, postMessage() {},
        close() {},
        addEventListener() {}, removeEventListener() {}
    };
}
function tituloDe(html) {
    const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    return m ? m[1].trim() : '';
}

/* ── window.open ────────────────────────────────────────────────────── */
const openOriginal = window.open;
window.open = function (url, destino, opciones) {
    url = url == null ? '' : String(url);
    if (url === '' || url === 'about:blank') return ventanaImpresion();
    let u;
    try { u = new URL(url, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) {
        if (/^(https?|mailto):$/.test(u.protocol)) invoke('abrir_url', { url: u.href }).catch(() => {});
        return null;
    }
    const pagina = decodeURIComponent(u.pathname.replace(/^\//, '')) + u.search + u.hash;
    if (!/\.html?($|[?#])/i.test(pagina)) {
        if (window.__suiteAbrirDocumento) window.__suiteAbrirDocumento(pagina);
        return null;
    }
    // Igual que una pestaña nueva del navegador: ventana nueva, con esta como opener
    const etiqueta = 'v' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    invoke('abrir_ventana', { pagina, etiqueta, reutilizar: false }).catch(e => console.error('window.open:', e));
    return ventanaRemota(etiqueta);
};
window.__suiteOpenOriginal = openOriginal;

/* ── window.close() en una herramienta: cerrar su ventana ───────────── */
window.close = function () { invoke('cerrar_ventana', { etiqueta: yo }).catch(() => {}); };

/* ── El título de la ventana sigue al de la página ──────────────────── */
function ponerTitulo() {
    if (window.__suiteTituloPropio) return;     // el simulador pone el suyo (● cambios sin guardar…)
    const t = (document.title || '').trim();
    if (t) T.window.getCurrentWindow().setTitle(t).catch(() => {});
}
document.addEventListener('DOMContentLoaded', ponerTitulo);
window.addEventListener('load', ponerTitulo);
})();
