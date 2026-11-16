import sys
def rep(s, a, b, cnt=1):
    n = s.count(a); assert n == cnt, (a[:80], n); return s.replace(a, b)

JS = r"""
// ══ Corrector v80 / Calcador v135: las hojas de calificaciones de la batería, también por los alumnos ══
// Aules (o el navegador) a veces corta el nombre de la hoja («Calificaciones-…-ISO GEO-3.csv»): sin la tarea ni su número
// no se puede casar por el nombre. Pero los números de participante de la hoja («Participante29214120») son los mismos que
// los de las carpetas del zip de entregas de esa tarea, y son distintos en cada tarea: casan la hoja sin dudas.
function idsHojaBat(h) {
    if (!h.ids) { h.ids = new Set(); String(h.texto || '').split(/\r?\n/).slice(1).forEach(l => { const m = /^﻿?"?\s*(?:participante|participant)\s*(\d+)/i.exec(l); if (m) h.ids.add(m[1]); }); }
    return h.ids;
}
function idsTareaBat(t) {
    const s = new Set(t.idsZip || []);
    const r = (t.res && t.res.ids) || t._ids; if (r) Object.values(r).forEach(v => { if (v) s.add(String(v)); });
    return s;
}
async function leerIdsZipBat(t) {
    if (t.idsZip || !t.file) return;
    try { const ab = await t.file.arrayBuffer(), ids = new Set();
        listarZip(ab).forEach(e => { const m = /_(\d+)_assign(?:submission|feedback)_/.exec(e.nombre); if (m) ids.add(m[1]); });
        t.idsZip = [...ids]; } catch (e) { t.idsZip = []; }
}
const comunesBat = (a, b) => { let n = 0; a.forEach(x => { if (b.has(x)) n++; }); return n; };
const _casarHojaNom = casarHoja;
casarHoja = function (t) {
    const it = idsTareaBat(t), h0 = _casarHojaNom(t);
    // por el nombre, salvo que los alumnos digan que es de otra tarea
    if (h0 && !(it.size && idsHojaBat(h0).size && !comunesBat(it, idsHojaBat(h0)))) { t.hojaPor = t.cmid && h0.cmid === t.cmid ? 'num' : 'nombre'; return h0; }
    t.hojaPor = '';
    if (!it.size) return null;
    let mejor = null, m = 0;
    bat.hojas.forEach(h => { const c = comunesBat(it, idsHojaBat(h)); if (c > m) { m = c; mejor = h; } });
    if (mejor && m >= Math.max(1, Math.ceil(it.size / 2))) { t.hojaPor = 'alumnos'; return mejor; }
    return null;
};
const _leerArchivosBatIds = leerArchivosBat;
leerArchivosBat = async function (files) {
    const r = await _leerArchivosBatIds.apply(this, arguments);
    if (bat.hojas.length) { for (const t of bat.tareas) await leerIdsZipBat(t); bat.tareas.forEach(t => { t.hoja = casarHoja(t); }); }
    return r;
};
// Lo que se guarda en la batería: cómo casó la hoja y los alumnos de cada zip
const _datosBateriaIds = datosBateria;
datosBateria = function () {
    const d = _datosBateriaIds.apply(this, arguments);
    d.tareas.forEach((x, i) => { const t = bat.tareas[i]; if (t) { if (t.hojaPor) x.hojaPor = t.hojaPor; if (t.idsZip) x.idsZip = t.idsZip; } });
    return d;
};
const _abrirDatosBateriaIds = abrirDatosBateria;
abrirDatosBateria = async function (d) {
    if (d && Array.isArray(d.tareas)) { const extra = d.tareas.map(x => x && { hojaPor: x.hojaPor || '', idsZip: x.idsZip || null });
        const r = await _abrirDatosBateriaIds.apply(this, arguments);
        bat.tareas.forEach((t, i) => { const e = extra[i]; if (e) { if (e.idsZip) t.idsZip = e.idsZip; if (t.hoja && e.hojaPor) t.hojaPor = e.hojaPor; } });
        if (typeof pintarBateria === 'function') pintarBateria();
        return r; }
    return _abrirDatosBateriaIds.apply(this, arguments);
};
// Avisos: las hojas cargadas que no casan con ninguna tarea
const _pintarBateriaIds = pintarBateria;
pintarBateria = function () {
    _pintarBateriaIds.apply(this, arguments);
    const d = document.getElementById('batTabla'); if (!d || !bat.tareas.length) return;
    const usadas = new Set(bat.tareas.map(t => t.hoja).filter(Boolean)), sueltas = bat.hojas.filter(h => !usadas.has(h));
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    if (sueltas.length) d.insertAdjacentHTML('afterbegin', `<div class="bat-duda bat-sueltas">⚠️ ${sueltas.length === 1 ? 'Una hoja de calificaciones no casa' : sueltas.length + ' hojas de calificaciones no casan'} con ninguna tarea (ni por el nombre ni por sus alumnos): ${sueltas.map(h => `<b>${esc(h.archivo)}</b>`).join(', ')}. ¿Falta el zip de entregas de esa tarea?</div>`);
};
"""

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    assert 'function idsHojaBat' not in s
    s = rep(s, "// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna", JS.lstrip('\n') + "\n// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna")
    s = rep(s, """<td>${t.hoja ? `<span title="${esc(t.hoja.archivo)}">✔ ${t.cmid && t.hoja.cmid === t.cmid ? 'nº ' + esc(t.cmid) : 'por el nombre'}</span>` : '<span class="ctx-nota">—</span>'}</td>""",
        """<td>${t.hoja ? `<span title="${esc(t.hoja.archivo)}">✔ ${t.hojaPor === 'alumnos' ? 'por los alumnos' : t.cmid && t.hoja.cmid === t.cmid ? 'nº ' + esc(t.cmid) : 'por el nombre'}</span>` : `<span class="bat-sin-hoja" title="No hay hoja de calificaciones de Aules para esta tarea: no habrá «- con notas.csv» que subir. Descárgala en la tarea de Aules (Acción sobre las calificaciones → Descargar hoja de calificaciones) y añádela${bat.hojas.length ? '' : ' (no se ha cargado ninguna)'}">⚠️ sin hoja</span>`}</td>""")
    s = rep(s, "    .bat-duda {", "    .bat-sin-hoja { color:#a3560f; font-size:12px; white-space:nowrap; cursor:help; }\n    .bat-sueltas { max-width:none; margin:0 0 6px; font-size:12px; }\n    .bat-duda {")
    open(f, 'w', encoding='utf-8').write(s); print('ok', f)
