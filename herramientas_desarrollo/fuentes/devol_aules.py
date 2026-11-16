import sys
def rep(s, a, b, cnt=1):
    n = s.count(a); assert n == cnt, (a[:80], n); return s.replace(a, b)

JS = r"""
// ══ Corrector v78 / Calcador v133 ══
// ── 3 · La devolución, con o sin el programa correcto (se recuerda en el navegador) ──
function devolConSolucion() { try { return localStorage.getItem('corrector_devolSol') !== '0'; } catch (e) { return true; } }
function ponerDevolSolucion(si) {
    try { localStorage.setItem('corrector_devolSol', si ? '1' : '0'); } catch (e) {}
    document.querySelectorAll('.devol-sol').forEach(x => { x.checked = !!si; });
}
const _solucionDevolOpc = solucionDevol;
solucionDevol = function () { return devolConSolucion() ? _solucionDevolOpc.apply(this, arguments) : null; };
function casillaDevolSol() {
    return `<label class="devol-sol-l" title="Que la devolución lleve el programa correcto (el de «📋 Solución»). Quítalo si vas a reutilizar el ejercicio en otro grupo o en el examen"><input type="checkbox" class="devol-sol" ${devolConSolucion() ? 'checked' : ''} onchange="ponerDevolSolucion(this.checked)"> con la solución</label>`;
}

// ── 1 · ⬆ Devoluciones para Aules: un zip con la devolución de cada alumno, para «Subir varios archivos de retroalimentación en un zip» ──
// Moodle casa cada archivo por el número de participante del nombre: «Nombre_123456_assignsubmission_file_Devolución….html»
// (el mismo que traen las entregas del zip descargado de Aules). Sin número, el archivo va con el nombre del alumno, para enviarlo a mano.
const nomArchivo = t => String(t || '').replace(/[\\/:*?"<>|_\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
function paginasDevolucion(ks) {
    let h = ''; const o = window.open;
    window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
    try { imprimirDevoluciones(ks); } finally { window.open = o; }
    const S = h.match(/<section class="inf">[\s\S]*?<\/section>/g) || [], cab = (h.match(/^[\s\S]*?<body>/) || [''])[0];
    return ks.map((k, j) => {
        if (!S[j]) return null;
        const it = masiva.lista[k], tit = `Devolución — ${it.alumno} — ${tituloVariante(it, `${cfgHoja.titulo || nombreProyecto()}${cfgHoja.num ? ' · Ejercicio nº ' + cfgHoja.num : ''}`)}`;
        return cab.replace(/<title>[\s\S]*?<\/title>/, `<title>${String(tit).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`).replace('</style>', '@media screen { body { max-width: 210mm; margin: 0 auto; padding: 12mm; } }</style>') + S[j] + '</body></html>';
    });
}
// Los archivos del zip de la tarea abierta: [[nombre, html], …] y cuántos van sin número de participante
function archivosDevolAules() {
    const por = resultadosAules(), ks = [], ids = [], bases = [];
    por.forEach((x, base) => { const k = masiva.lista.indexOf(x.it); if (k >= 0) { ks.push(k); ids.push(x.id); bases.push(base); } });
    if (!ks.length) return { archivos: [], sinId: 0 };
    const P = paginasDevolucion(ks), num = cfgHoja.num ? ' ' + cfgHoja.num : '';
    const archivos = [], usados = new Set(); let sinId = 0;
    ks.forEach((k, j) => {
        if (!P[j]) return;
        const it = masiva.lista[k], v = masiva.variantes.find(x => x.etq === it.variante);
        let f; try { f = v ? fichaDe(v.datos) : null; } catch (e) { f = null; }
        const doc = nomArchivo(`Devolución ${f && f.num ? f.num : (num.trim() || cfgHoja.titulo || nombreProyecto())}`) + '.html';
        let n = ids[j] ? `${nomArchivo(bases[j]) || 'Alumno'}_${ids[j]}_assignsubmission_file_${doc}` : (sinId++, `${nomArchivo(bases[j]) || 'Alumno'} - ${doc}`);
        while (usados.has(n)) n = n.replace(/\.html$/, ' (2).html'); usados.add(n);
        archivos.push([n, P[j]]);
    });
    return { archivos, sinId };
}
function zipDevolucionesAules() {
    if (!masiva.lista.some(it => it.v && it.v.veredicto !== 'pendiente')) { snack('Corrige antes los programas'); return; }
    if (!hayPieza()) { snack('Abre antes el ejercicio (📂 Abrir ejercicio…)'); return; }
    let r; try { r = archivosDevolAules(); } catch (e) { console.error(e); snack('No se han podido preparar las devoluciones: ' + e.message); return; }
    if (!r.archivos.length) { snack('No hay devoluciones que preparar'); return; }
    const nombre = nomArchivo(`Devoluciones para Aules - ${cfgHoja.titulo || nombreProyecto()}${cfgHoja.num ? ' ' + cfgHoja.num : ''}`) + '.zip';
    descargar(zipBat(r.archivos), nombre, 'application/zip');
    snack(r.sinId === r.archivos.length ? `${r.archivos.length} devoluciones, con el nombre de cada alumno (sin el número de participante de Aules: los programas no venían del zip de Aules)`
        : `${r.archivos.length} devoluciones para Aules${r.sinId ? ` (${r.sinId} sin número de participante: esas no las casará Aules)` : ''}. En la tarea: Ver todas las entregas → Acción sobre las calificaciones: «Subir varios archivos de retroalimentación en un zip»`);
}
// En la batería: un zip con el zip de cada tarea
function zipDevolucionesBat() {
    const T = bat.tareas.filter(t => t.res && t.res.lista && t.res.lista.length);
    if (!T.length) { snack('Corrige antes la batería (▶ Corregir todo)'); return; }
    const zips = []; let n = 0, sinId = 0;
    T.forEach(t => { let r; try { r = conTareaBat(t, () => archivosDevolAules()); } catch (e) { console.warn(e); return; }
        if (!r || !r.archivos.length) return; n += r.archivos.length; sinId += r.sinId;
        zips.push([nomArchivo(`Devoluciones para Aules - ${t.tarea}`) + '.zip', zipBat(r.archivos)]); });
    if (!zips.length) { snack('No hay devoluciones que preparar'); return; }
    descargar(zipBat(zips), `Devoluciones para Aules ${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.zip`, 'application/zip');
    snack(`${zips.length} tareas, ${n} devoluciones${sinId ? ` (${sinId} sin número de participante)` : ''}: dentro, un zip por tarea para subirlo en su tarea de Aules`);
}
const _abrirBateriaDev = abrirBateria;
abrirBateria = function () {
    const r = _abrirBateriaDev.apply(this, arguments);
    const ov = document.getElementById('modalBateria'), d = ov && ov.querySelector('#batImpDev');
    if (d && !ov.querySelector('#batDevAules')) {
        d.insertAdjacentHTML('afterend', `<button class="btn-action sec" id="batDevAules" title="Un zip con un zip por tarea, con la devolución de cada alumno, para subirlo en cada tarea de Aules («Subir varios archivos de retroalimentación en un zip»)">⬆ Devoluciones para Aules</button>${casillaDevolSol()}`);
        ov.querySelector('#batDevAules').onclick = zipDevolucionesBat;
    }
    return r;
};

// ── 7 · Lo que repite cada alumno en las tareas de la batería ──
function repetidosRev(a) {
    const G = new Map(); let n = 0;
    tareasRev().forEach(t => {
        const x = a.celdas.get(t); if (!x || !x.it.r || !x.it.r.hallazgos || !x.it.v || x.it.v.veredicto === 'pendiente') return;
        n++; const vistos = new Set();
        x.it.r.hallazgos.forEach(h => {
            if (h.resumen || (h.tipo !== 'error' && h.tipo !== 'aviso')) return;
            const k = h.tipo + '|' + claveError(h); if (vistos.has(k)) return; vistos.add(k);
            if (!G.has(k)) G.set(k, { tipo: h.tipo, cat: h.cat || '', titulo: String(h.msg).replace(/^\s*(N\d+|l[ií]nea \d+|Al final)\s*:\s*/i, '').replace(/\s*\(y \d+ (vez|veces|bloques?) más\)/, ''), pista: h.pista || '', tareas: [] });
            G.get(k).tareas.push(t.tarea);
        });
    });
    return { n, E: [...G.values()].filter(e => e.tareas.length >= 2).sort((p, q) => q.tareas.length - p.tareas.length || (p.tipo === 'error' ? -1 : 1) - (q.tipo === 'error' ? -1 : 1)) };
}
function htmlRepetidos(a, devol, impreso) {
    const { n, E } = repetidosRev(a); if (!E.length) return '';
    const L = E.slice(0, impreso ? 6 : 10);
    const li = e => `<li class="${e.tipo}"><span class="rr-c">${CAT_ERR[e.cat] || (e.tipo === 'error' ? 'Error' : 'Aviso')}</span> ${escR(e.titulo)} — <b>en ${e.tareas.length} de ${n}</b> <small>(${escR(e.tareas.join(', '))})</small>${e.pista ? `<div class="rr-p">Pista: ${escR(e.pista)}</div>` : ''}</li>`;
    const tit = devol ? '🔁 Lo que se te repite' : '🔁 Lo que repite';
    return impreso ? `<h3 class="rr-t">${tit} <small>(en ${n} tareas entregadas)</small></h3><ol class="rr">${L.map(li).join('')}</ol>${E.length > L.length ? `<p class="crit">Y ${E.length - L.length} más.</p>` : ''}`
        : `<details class="rev-repite" open><summary>${tit} <small>en las ${n} tareas que ha entregado (${E.length})</small></summary><ol class="rr">${L.map(li).join('')}</ol>${E.length > L.length ? `<div class="ctx-nota">Y ${E.length - L.length} más.</div>` : ''}</details>`;
}
const _pintarFichaRevRep = pintarFichaRev;
pintarFichaRev = function (c, a) {
    _pintarFichaRevRep(c, a);
    const cab = c.querySelector('.rev-ficha-cab'); if (cab) cab.insertAdjacentHTML('afterend', htmlRepetidos(a, false, false));
};
const _abrirRevisionDev = abrirRevision;
abrirRevision = function () {
    const r = _abrirRevisionDev.apply(this, arguments);
    const d = document.querySelector('#modalRevision #revDev'); if (d && !d.parentNode.querySelector('.devol-sol')) d.insertAdjacentHTML('afterend', casillaDevolSol());
    return r;
};
document.querySelectorAll('.devol-sol').forEach(x => { x.checked = devolConSolucion(); });
"""

CSS = r"""    .rev-repite { flex:0 0 auto; border:1px solid #e8c48a; background:#fdf6ea; border-radius:8px; padding:6px 10px; font-size:13px; max-height:30%; overflow:auto; }
    .rev-repite summary { cursor:pointer; font-weight:600; } .rev-repite summary small { font-weight:normal; color:var(--text-muted); }
    .rr { margin:4px 0 0 18px; padding:0; } .rr li { margin-bottom:3px; } .rr .rr-c { font-size:11px; font-weight:600; text-transform:uppercase; } .rr li.error .rr-c { color:#b52b2b; } .rr li.aviso .rr-c { color:#a3560f; }
    .rr .rr-p { font-size:12px; color:var(--text-muted); } .rr small { color:var(--text-muted); }
    .devol-sol-l { font-size:12px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
"""

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    assert 'function zipDevolucionesAules' not in s
    s = rep(s, "// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna", JS.lstrip('\n') + "\n// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna")
    s = rep(s, "    .mv-inf { font-size:12px; cursor:help; }", CSS + "    .mv-inf { font-size:12px; cursor:help; }")
    # la barra de la corrección masiva
    s = rep(s, """title="La hoja de devolución de cada alumno: su recorrido, lo que tiene que revisar, tu comentario y la nota">🖨 Devoluciones</button>""",
        """title="La hoja de devolución de cada alumno: su recorrido, lo que tiene que revisar, tu comentario, la nota, cómo se ha evaluado y (si está marcado «con la solución») el programa correcto">🖨 Devoluciones</button>
                <button class="btn-action sec" onclick="zipDevolucionesAules()" title="Un zip con la devolución de cada alumno (una página que se abre en el navegador) para subirlo de una vez a la tarea de Aules: Ver todas las entregas → «Subir varios archivos de retroalimentación en un zip»">⬆ Devoluciones para Aules</button>
                <label class="devol-sol-l" title="Que la devolución lleve el programa correcto (el de «📋 Solución»). Quítalo si vas a reutilizar el ejercicio en otro grupo o en el examen"><input type="checkbox" class="devol-sol" checked onchange="ponerDevolSolucion(this.checked)"> con la solución</label>""")
    # la hoja resumen de cada alumno: lo que repite
    s = rep(s, """        <p class="crit">Media: ${nf1R(a.media)} · ${a.entregadas} de ${a.totalCuentan} tareas entregadas""",
        """        ${htmlRepetidos(a, devol, true)}
        <p class="crit">Media: ${nf1R(a.media)} · ${a.entregadas} de ${a.totalCuentan} tareas entregadas""")
    s = rep(s, """.v-nocumple { color: #a86b00; }`;""", """.v-nocumple { color: #a86b00; }
        .rr-t { font-size: 11pt; margin: 10px 0 3px; } .rr-t small { font-weight: normal; color: #888; font-size: 8pt; } .rr { margin: 0; padding-left: 6mm; font-size: 9pt; } .rr li { margin-bottom: 1mm; }
        .rr .rr-c { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; } .rr li.error .rr-c { color: #b52b2b; } .rr li.aviso .rr-c { color: #a3560f; } .rr small { color: #777; } .rr-p { font-size: 8.5pt; padding: .5mm 2mm; background: #eef4fb; border-radius: 1mm; margin-top: .5mm; }`;""")
    # el CSV de la revisión
    s = rep(s, """    const filas = [['Alumno/a', ...T.map(t => t.tarea), 'Media', 'Entregadas', 'La pieza sale bien'],
        ['(peso)', ...T.map(t => cuentaRev(t) ? d(pesoRev(t)) : 'no cuenta'), revBat().modo === 'cero' ? 'no entregadas = 0' : 'solo entregadas', '', ''],
        ...A.map(a => [a.nombre, ...T.map(t => { const x = a.celdas.get(t); return x ? d(x.it.v.nota) : ''; }), d(a.media), `${a.entregadas}/${a.totalCuentan}`, a.bienN])];""",
        """    const rep = a => { try { return repetidosRev(a).E.map(e => `${e.titulo} (${e.tareas.length})`).join(' | '); } catch (e) { return ''; } };
    const filas = [['Alumno/a', ...T.map(t => t.tarea), 'Media', 'Entregadas', 'La pieza sale bien', 'Lo que repite (en cuántas tareas)'],
        ['(peso)', ...T.map(t => cuentaRev(t) ? d(pesoRev(t)) : 'no cuenta'), revBat().modo === 'cero' ? 'no entregadas = 0' : 'solo entregadas', '', '', ''],
        ...A.map(a => [a.nombre, ...T.map(t => { const x = a.celdas.get(t); return x ? d(x.it.v.nota) : ''; }), d(a.media), `${a.entregadas}/${a.totalCuentan}`, a.bienN, rep(a)])];""")
    open(f, 'w', encoding='utf-8').write(s); print('ok', f)
