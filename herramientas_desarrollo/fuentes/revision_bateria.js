// ── Batería de corrección: casar sin dudas, guardar y abrir la batería, 👤 revisión por alumno, 🖨 informe por alumno ──
// · Al casar una tarea con su ejercicio, si dos encajan igual, gana el que lo hace por el nombre del archivo (antes que por el
//   número o el título de la ficha), y la fila avisa de los otros que también encajan.
// · 💾 Guardar batería / 📂 Abrir batería: un .json con los ejercicios, las tareas, los programas, tus notas y comentarios,
//   las hojas de calificaciones y la revisión (pesos, uniones). El navegador recuerda además la última batería.
// · 👤 Revisión por alumno: una tabla alumno × tarea con las notas, la media (con pesos; las no entregadas cuentan 0 o no
//   cuentan), y la ficha de cada alumno con todas sus correcciones, tu nota y tu comentario.
// · 🖨 Informes / devoluciones por alumno: una hoja resumen por alumno (sus notas y su media) y, si se quiere, la corrección de cada tarea.
// ── 1 · Casar: el nombre del archivo, antes que el número o el título ──
casarTarea = function (t) {
    const nom = tokBat(t.resto), cand = [];
    bat.ejercicios.forEach((e, i) => clavesEjercicio(e).forEach((k, prio) => { const p = encajeBat(nom, k); if (p >= 0) cand.push({ i, len: k.length, p, prio: k.join(' ') === claveEjercicio(e).join(' ') ? 0 : prio || 1 }); }));
    cand.sort((a, b) => b.len - a.len || a.prio - b.prio || b.p - a.p || a.i - b.i);
    const mejor = cand[0] || null;
    const grupos = new Map();
    bat.ejercicios.forEach((e, i) => clavesEjercicio(e).forEach(k => { if (k.length >= 2 && /^[a-h]$/.test(k[k.length - 1])) { const b = k.slice(0, -1).join(' '); if (!grupos.has(b)) grupos.set(b, new Map()); if (!grupos.get(b).has(i)) grupos.get(b).set(i, k[k.length - 1].toUpperCase()); } }));
    let grupo = null;
    grupos.forEach((m, b) => { const letras = new Set(m.values()); if (m.size < 2 || letras.size < 2) return; const k = b.split(' '), p = encajeBat(nom, k);
        if (p >= 0 && (!grupo || k.length > grupo.len)) { const is = [...m.keys()].sort((x, y) => m.get(x).localeCompare(m.get(y)) || x - y); grupo = { is, letras: is.map(i => m.get(i)), len: k.length, p }; } });
    if (grupo && (!mejor || grupo.len >= mejor.len)) return { tipo: 'variantes', is: grupo.is, letras: grupo.letras };
    if (!mejor) return null;
    // los otros ejercicios que encajan igual de bien (otro con el mismo título, por ejemplo)
    const dudas = [...new Set(cand.filter(c => c.i !== mejor.i && c.len === mejor.len).map(c => c.i))];
    return { tipo: 'uno', is: [mejor.i], ...(dudas.length ? { dudas, porArchivo: mejor.prio === 0 } : {}) };
};
// ── 2 · Las cuentas de cada tarea (con las notas del profesor, si las hay) ──
function cuentasTareaBat(t) {
    if (!t.res || !t.res.lista) return;
    const val = t.res.lista.filter(it => it.v && it.v.veredicto !== 'pendiente');
    Object.assign(t.res, { n: t.res.lista.length, media: val.length ? val.reduce((a, it) => a + it.v.nota, 0) / val.length : 0,
        aprueban: val.filter(it => it.v.nota >= 5).length, bien: val.filter(it => it.v.veredicto === 'bien').length });
}
const _pintarBateriaRev = pintarBateria;
pintarBateria = function () {
    bat.tareas.forEach(cuentasTareaBat);
    _pintarBateriaRev.apply(this, arguments);
    const d = document.getElementById('batTabla'); if (!d) return;
    // el aviso de los ejercicios que también encajan
    d.querySelectorAll('select.bat-ej').forEach(s => { const t = bat.tareas[+s.dataset.k]; if (!t || !t.casa || !t.casa.dudas || t.manual) return;
        const n = document.createElement('div'); n.className = 'bat-duda';
        n.textContent = `⚠️ También encaja con: ${t.casa.dudas.map(i => bat.ejercicios[i].archivo).join(', ')}${t.casa.porArchivo ? ' (gana el del nombre del archivo)' : ''}. Comprueba que es el bueno.`;
        s.parentNode.appendChild(n); });
    const b = document.getElementById('batRev'); if (b) b.disabled = !bat.tareas.some(t => t.res && t.res.lista);
};
// ── 3 · Corregir una tarea: del zip o, si se ha abierto una batería guardada, de sus programas ──
const _corregirTareaBatRev = corregirTareaBat;
corregirTareaBat = async function (t) {
    if (t.file || !t.casa) return _corregirTareaBatRev.apply(this, arguments);
    const crudos = t._lista || (t.res && t.res.lista ? t.res.lista.map(crudoAlumno) : null);
    if (!crudos) { t.res = { error: 'Falta el zip de las entregas' }; return; }
    const es = t.casa.is.map(i => bat.ejercicios[i]);
    const antes = { lista: masiva.lista, ids: masiva.ids, variantes: masiva.variantes, reparto: masiva.reparto }, est = estadoGuardado(), sn = window.snack, al = window.alert;
    window.snack = () => {}; window.alert = () => {};
    try {
        (typeof _tuAbrirJSONDatos === 'function' ? _tuAbrirJSONDatos : abrirJSONDatos)(JSON.parse(JSON.stringify(es[0].datos)));
        masiva.ids = Object.assign({}, t._ids || (t.res && t.res.ids) || {});
        masiva.variantes = t.casa.tipo === 'variantes' ? es.map((e, j) => { const k = claveEjercicio(e); return { id: 'bat:' + e.ruta, etq: etqBat(e), letra: (t.casa.letras && t.casa.letras[j]) || k[k.length - 1].toUpperCase(), datos: e.datos }; }) : [];
        masiva.reparto = masiva.variantes.length ? repartoParaVariantes(masiva.variantes) : null;
        masiva.lista = crudos.map(x => ({ ...x }));
        if (masiva.variantes.length) corregirConVariantes(masiva.lista); else masiva.lista.forEach(it => _corregirAlumnoBase(it));
        masiva.lista.forEach(aplicarProf);
        calcularParecidos();
        const L = masiva.lista, E = erroresClase(L).filter(e => e.alumnos.length >= 2);
        t.res = { lista: L, ids: masiva.ids, variantes: masiva.variantes, reparto: masiva.reparto, ejercicio: es[0], parejas: (masiva.parejas || []).length, error: E[0] ? `${E[0].alumnos.length}: ${E[0].titulo}` : '' };
        cuentasTareaBat(t); delete t._lista;
    } catch (e) { console.warn(e); t.res = { error: e.message }; }
    finally { masiva.lista = antes.lista; masiva.ids = antes.ids; masiva.variantes = antes.variantes; masiva.reparto = antes.reparto; restaurarEstado(est); window.snack = sn; window.alert = al; try { refrescar(); pintarMasiva(); } catch (e) {} }
};
const crudoAlumno = it => ({ alumno: it.alumno, archivo: it.archivo, texto: it.texto, ...(it.formato ? { formato: it.formato } : {}), ...(it.informe ? { informe: it.informe } : {}), ...(it.desdeInforme ? { desdeInforme: true } : {}),
    ...(it.notaProf !== null && it.notaProf !== undefined ? { notaProf: it.notaProf } : {}), ...(it.comProf ? { comProf: it.comProf } : {}) });
const _corregirTodoBatRev = corregirTodoBat;
corregirTodoBat = async function () { const r = await _corregirTodoBatRev.apply(this, arguments); guardarBateriaLocal(); return r; };
// ── 4 · Guardar y abrir la batería ──
bat.rev = bat.rev || { modo: 'cero', pesos: {}, fuera: {}, uniones: {} };
function revBat() { if (!bat.rev) bat.rev = { modo: 'cero', pesos: {}, fuera: {}, uniones: {} }; ['pesos', 'fuera', 'uniones'].forEach(k => { if (!esObj(bat.rev[k])) bat.rev[k] = {}; }); if (bat.rev.modo !== 'entregadas') bat.rev.modo = 'cero'; return bat.rev; }
function datosBateria() {
    const iE = e => bat.ejercicios.indexOf(e);
    return { tipo: 'bateria-calcador', version: 1, fecha: new Date().toISOString(),
        ejercicios: bat.ejercicios.map(e => ({ archivo: e.archivo, ruta: e.ruta, datos: e.datos, ...(e.origen ? { origen: e.origen } : {}),
            ...(e.bibEntrada ? { bib: { ruta: e.bibEntrada.ruta, meta: e.bibEntrada.meta || {}, actualizado: e.bibEntrada.actualizado || 0 } } : {}) })),
        hojas: bat.hojas.map(h => ({ archivo: h.archivo, texto: h.texto, resto: h.resto, cmid: h.cmid })),
        tareas: bat.tareas.map(t => ({ archivo: t.archivo, ruta: t.ruta, base: t.base, resto: t.resto, cmid: t.cmid, tarea: t.tarea, casa: t.casa || null, manual: !!t.manual,
            hoja: t.hoja ? bat.hojas.indexOf(t.hoja) : -1,
            res: t.res && t.res.lista ? { ej: iE(t.res.ejercicio), ids: t.res.ids || {}, lista: t.res.lista.map(crudoAlumno) } : t._lista ? { ej: -1, ids: t._ids || {}, lista: t._lista } : null })),
        rev: revBat() };
}
async function abrirDatosBateria(d, callado) {
    if (!esObj(d) || d.tipo !== 'bateria-calcador' || !Array.isArray(d.tareas)) { snack('Ese archivo no es una batería guardada'); return false; }
    bat = { ejercicios: [], tareas: [], hojas: [], rev: d.rev || null };
    bat.ejercicios = (d.ejercicios || []).map(e => { const x = { archivo: e.archivo, ruta: e.ruta, datos: e.datos, ficha: fichaDe(e.datos), ...(e.origen ? { origen: e.origen } : {}) };
        if (e.bib) { try { x.bibEntrada = Object.assign(entradaDe(e.datos, e.bib.ruta, e.archivo), { meta: e.bib.meta || {}, actualizado: e.bib.actualizado || 0 }); } catch (err) {} } return x; });
    bat.hojas = (d.hojas || []).map(h => ({ ...h }));
    bat.tareas = d.tareas.map(t => ({ archivo: t.archivo, ruta: t.ruta, base: t.base, resto: t.resto, cmid: t.cmid, tarea: t.tarea, casa: t.casa, manual: t.manual, file: null,
        hoja: t.hoja >= 0 ? bat.hojas[t.hoja] || null : null, res: null, _lista: t.res ? t.res.lista : null, _ids: t.res ? t.res.ids : null }));
    revBat();
    for (const t of bat.tareas) if (t.casa && t._lista) await corregirTareaBat(t);
    ordenarTareasBat(); pintarBateria();
    if (!callado) snack(`Batería abierta: ${bat.tareas.length} tarea(s), ${bat.tareas.reduce((a, t) => a + (t.res && t.res.n || 0), 0)} programas`);
    return true;
}
function guardarBateria() {
    if (!bat.tareas.some(t => t.res && t.res.lista)) { snack('Corrige antes las tareas (▶ Corregir todo)'); return; }
    const f = new Date(), dd = n => String(n).padStart(2, '0');
    descargar(JSON.stringify(datosBateria()), `Batería ${f.getFullYear()}-${dd(f.getMonth() + 1)}-${dd(f.getDate())}.json`, 'application/json');
    guardarBateriaLocal();
    snack('Batería guardada: ábrela con 📂 Abrir batería… (o arrastrándola a esta ventana) para seguir revisando');
}
const BAT_CLAVE = 'calcador_bateria';
let avisoGrande = false;
function guardarBateriaLocal() {
    if (!bat.tareas.some(t => t.res && t.res.lista)) return;
    try { localStorage.setItem(BAT_CLAVE, JSON.stringify(datosBateria())); }
    catch (e) { if (!avisoGrande) { avisoGrande = true; snack('La batería es demasiado grande para que la recuerde el navegador: guárdala con 💾 Guardar batería'); } }
}
let tGuardarBat = null;
const guardarBateriaPronto = () => { clearTimeout(tGuardarBat); tGuardarBat = setTimeout(guardarBateriaLocal, 600); };
function bateriaRecordada() { try { const d = JSON.parse(localStorage.getItem(BAT_CLAVE) || 'null'); return esObj(d) && d.tipo === 'bateria-calcador' ? d : null; } catch (e) { return null; } }
// tus notas y comentarios, también los que pones desde la corrección masiva (🔍 Ver), se recuerdan
const _ponerProfRev = ponerProf;
ponerProf = function () { const r = _ponerProfRev.apply(this, arguments); if (bat.tareas.length) guardarBateriaPronto(); return r; };
// un .json de batería entre los archivos: se abre
const _leerArchivosBatRev = leerArchivosBat;
leerArchivosBat = async function (files) {
    const resto = [];
    for (const f of [...files]) {
        if (/\.json$/i.test(f.name)) { try { const d = JSON.parse(await f.text()); if (esObj(d) && d.tipo === 'bateria-calcador') { await abrirDatosBateria(d); continue; } } catch (e) {} }
        resto.push(f);
    }
    return _leerArchivosBatRev(resto);
};
// la ventana de la batería: los botones nuevos y, si no hay nada, la última batería recordada
const _abrirBateriaRev = abrirBateria;
abrirBateria = function () {
    const r = _abrirBateriaRev.apply(this, arguments), ov = document.getElementById('modalBateria');
    if (ov && !ov.querySelector('#batGuardar')) {
        const fila1 = ov.querySelector('#batVaciar').parentNode, fila2 = ov.querySelector('#batCorregir').parentNode;
        fila1.insertAdjacentHTML('beforeend', `<button class="btn-action sec" id="batAbrirJ" title="Abre una batería guardada con 💾 Guardar batería (también se puede arrastrar a esta ventana)">📂 Abrir batería…</button><input type="file" id="batJSON" accept=".json" style="display:none">`);
        fila2.insertAdjacentHTML('afterbegin', '');
        ov.querySelector('#batCorregir').insertAdjacentHTML('afterend', `<button class="btn-action" id="batRev" title="Todas las notas de cada alumno: la tabla alumno × tarea, su media y su ficha con todas sus correcciones">👤 Revisión por alumno</button>`);
        fila2.insertAdjacentHTML('beforeend', `<button class="btn-action sec" id="batGuardar" title="Guarda en un archivo toda la batería corregida (los ejercicios, los programas, tus notas y comentarios, la revisión) para seguir otro día">💾 Guardar batería</button>`);
        ov.querySelector('#batAbrirJ').onclick = () => ov.querySelector('#batJSON').click();
        ov.querySelector('#batJSON').onchange = async ev => { const f = ev.target.files[0]; ev.target.value = ''; if (!f) return; try { await abrirDatosBateria(JSON.parse(await f.text())); } catch (e) { snack('El archivo no es un JSON válido'); } };
        ov.querySelector('#batGuardar').onclick = () => guardarBateria();
        ov.querySelector('#batRev').onclick = () => abrirRevision();
        const v = ov.querySelector('#batVaciar'), v0 = v.onclick; v.onclick = () => { v0(); bat.rev = null; revBat(); try { localStorage.removeItem(BAT_CLAVE); } catch (e) {} pintarBateria(); };
    }
    const viejo = ov && ov.querySelector('#batRecordada'); if (viejo) viejo.remove();
    const d = !bat.tareas.length && bateriaRecordada();
    if (d && ov) {
        const n = d.tareas.length, a = new Set(); d.tareas.forEach(t => t.res && t.res.lista.forEach(x => a.add(x.alumno)));
        const div = document.createElement('div'); div.id = 'batRecordada'; div.className = 'bat-recordada';
        div.innerHTML = `💾 El navegador recuerda la última batería (${new Date(d.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}, ${n} tarea${n === 1 ? '' : 's'}). <button class="btn-action" id="batRecuperar">📂 Recuperarla</button> <button class="btn-action sec" id="batOlvidar">Olvidarla</button>`;
        ov.querySelector('#batTabla').before(div);
        div.querySelector('#batRecuperar').onclick = async () => { div.remove(); await abrirDatosBateria(d); };
        div.querySelector('#batOlvidar').onclick = () => { try { localStorage.removeItem(BAT_CLAVE); } catch (e) {} div.remove(); };
    }
    pintarBateria();
    return r;
};
// ── 5 · 👤 Revisión por alumno ──
const claveAlumnoRev = n => normNomAules(n);
function nombreBaseRev(it, ids) {
    return Object.keys(ids || {}).filter(n => it.alumno === n || it.alumno.startsWith(n + ' · ')).sort((a, b) => b.length - a.length)[0] || it.alumno.replace(/ · .*$/, '');
}
function canonRev(k) { const U = revBat().uniones; let x = k, n = 0; while (U[x] && U[x] !== x && n++ < 20) x = U[x]; return x; }
function tareasRev() { return bat.tareas.filter(t => t.res && t.res.lista); }
function alumnosRev() {
    const M = new Map();
    tareasRev().forEach(t => t.res.lista.forEach((it, k) => {
        if (!it.v || it.v.veredicto === 'pendiente') return;
        const nom = nombreBaseRev(it, t.res.ids), key = canonRev(claveAlumnoRev(nom));
        if (!M.has(key)) M.set(key, { key, nombres: new Map(), claves: new Set(), celdas: new Map() });
        const a = M.get(key); a.nombres.set(nom, (a.nombres.get(nom) || 0) + 1); a.claves.add(claveAlumnoRev(nom));
        const c = a.celdas.get(t); if (!c || it.v.nota > c.it.v.nota) a.celdas.set(t, { t, it, k });
    }));
    const L = [...M.values()].map(a => { a.nombre = [...a.nombres.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], 'es'))[0][0]; return a; });
    L.forEach(a => Object.assign(a, mediaRev(a)));
    return L.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
}
const pesoRev = t => { const p = +revBat().pesos[t.tarea]; return isFinite(p) && p >= 0 ? p : 1; };
const cuentaRev = t => !revBat().fuera[t.tarea] && pesoRev(t) > 0;
function mediaRev(a) {
    const T = tareasRev().filter(cuentaRev), R = revBat();
    let s = 0, w = 0, ent = 0, bien = 0;
    T.forEach(t => { const c = a.celdas.get(t), p = pesoRev(t); if (c) { s += p * c.it.v.nota; w += p; ent++; if (c.it.v.veredicto === 'bien') bien++; } else if (R.modo === 'cero') w += p; });
    return { media: w ? s / w : null, entregadas: ent, totalCuentan: T.length, bienN: bien, entregadasTodas: tareasRev().filter(t => a.celdas.get(t)).length };
}
let revVista = { ficha: null };
function abrirRevision(key) {
    if (!tareasRev().length) { snack('Corrige antes las tareas (▶ Corregir todo)'); return; }
    revBat();
    let ov = document.getElementById('modalRevision');
    if (!ov) { ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'modalRevision'; ov.onclick = e => { if (e.target === ov) cerrarRevision(); }; document.body.appendChild(ov); }
    ov.innerHTML = `<div class="help-modal rev-modal"><div class="help-header"><h2>👤 Revisión por alumno</h2><button class="help-close" onclick="cerrarRevision()">✕</button></div>
        <div class="help-content"><div class="rev-barra">
            <label title="Cómo cuentan en la media las tareas que el alumno no ha entregado">Media: <select id="revModo"><option value="cero">las no entregadas cuentan 0</option><option value="entregadas">solo las entregadas</option></select></label>
            <button class="btn-action sec" id="revUnir" title="Junta en una sola fila los alumnos marcados (el mismo alumno, con el nombre escrito distinto en dos tareas)">🔗 Unir los marcados</button>
            <span style="flex:1"></span>
            <label class="rev-con" title="Detrás de la hoja resumen de cada alumno, la corrección de cada una de sus tareas"><input type="checkbox" id="revCon" checked> con la corrección de cada tarea</label>
            <button class="btn-action sec" id="revInf" title="Para ti: una hoja resumen por alumno (sus notas y su media) y la corrección de cada tarea. Si marcas alumnos, solo los marcados">🖨 Informes por alumno</button>
            <button class="btn-action sec" id="revDev" title="Para el alumno: su hoja resumen y la devolución de cada tarea. Si marcas alumnos, solo los marcados">🖨 Devoluciones por alumno</button>
            <button class="btn-action sec" id="revCSV" title="La tabla alumno × tarea con las medias, para Excel o LibreOffice">⬇ CSV</button>
            <button class="btn-action sec" id="revGuardar" title="Guarda toda la batería corregida, con la revisión, en un archivo">💾 Guardar batería</button>
        </div><div id="revCuerpo"></div></div></div>`;
    const g = id => ov.querySelector('#' + id);
    g('revModo').value = revBat().modo;
    g('revModo').onchange = () => { revBat().modo = g('revModo').value; guardarBateriaPronto(); pintarRevision(); };
    g('revUnir').onclick = () => unirMarcadosRev();
    g('revInf').onclick = () => imprimirPorAlumno(false, marcadosRev(), g('revCon').checked);
    g('revDev').onclick = () => imprimirPorAlumno(true, marcadosRev(), g('revCon').checked);
    g('revCSV').onclick = () => csvRevision();
    g('revGuardar').onclick = () => guardarBateria();
    revVista.ficha = key || null;
    pintarRevision(); ov.classList.add('visible');
}
function cerrarRevision() { const ov = document.getElementById('modalRevision'); if (ov) ov.classList.remove('visible'); guardarBateriaLocal(); pintarBateria(); }
const marcadosRev = () => [...document.querySelectorAll('#modalRevision input.rev-sel:checked')].map(x => x.dataset.key);
const escR = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const nf1R = x => x === null || x === undefined ? '—' : String(Math.round(x * 10) / 10).replace('.', ',');
const cortoRev = t => t.tarea.length > 16 ? t.tarea.slice(0, 15) + '…' : t.tarea;
function pintarRevision() {
    const c = document.getElementById('revCuerpo'); if (!c) return;
    if (revVista.ficha) { const a = alumnosRev().find(x => x.key === revVista.ficha); if (a) { pintarFichaRev(c, a); return; } revVista.ficha = null; }
    const T = tareasRev(), A = alumnosRev(), R = revBat();
    const celda = a => t => { const x = a.celdas.get(t); if (!x) return `<td class="rev-n rev-no${cuentaRev(t) ? '' : ' rev-fuera'}" title="No entregada">—</td>`;
        const v = x.it.v, prof = x.it.notaProf !== null && x.it.notaProf !== undefined;
        return `<td class="rev-n ${v.nota >= 5 ? 'ap' : 'su'}${cuentaRev(t) ? '' : ' rev-fuera'}" data-key="${escR(a.key)}" data-t="${bat.tareas.indexOf(t)}" title="${escR(t.tarea)} · ${escR(VER_TXT[v.veredicto] || '')}${prof ? ' · nota del profesor' : ''}${x.it.comProf ? ' · 💬 ' + escR(x.it.comProf) : ''}">${nf1R(v.nota)}${prof ? '<sup>✎</sup>' : ''}${x.it.comProf ? '<sup>💬</sup>' : ''}</td>`; };
    const mediaT = t => { const n = A.map(a => a.celdas.get(t)).filter(Boolean).map(x => x.it.v.nota); return n.length ? n.reduce((s, x) => s + x, 0) / n.length : null; };
    const medias = A.map(a => a.media).filter(x => x !== null);
    c.innerHTML = `<div class="rev-tabla-caja"><table class="rev-tabla"><thead>
        <tr><th></th><th class="rev-al">Alumno/a <small>(${A.length})</small></th>${T.map(t => `<th class="rev-t${cuentaRev(t) ? '' : ' rev-fuera'}" title="${escR(t.tarea)}">${escR(cortoRev(t))}</th>`).join('')}<th class="rev-m">Media</th><th title="Tareas entregadas (de las que cuentan)">Entreg.</th><th title="Tareas en las que la pieza sale bien">Bien</th></tr>
        <tr class="rev-conf"><td></td><td class="rev-al"><small>Peso · cuenta en la media</small></td>${T.map((t, i) => `<td class="rev-n"><input type="number" class="rev-peso" data-i="${i}" min="0" max="10" step="0.5" value="${pesoRev(t)}" title="El peso de «${escR(t.tarea)}» en la media"><input type="checkbox" class="rev-cuenta" data-i="${i}" ${R.fuera[t.tarea] ? '' : 'checked'} title="Cuenta en la media"></td>`).join('')}<td></td><td></td><td></td></tr></thead>
        <tbody>${A.map(a => `<tr><td><input type="checkbox" class="rev-sel" data-key="${escR(a.key)}"></td>
            <td class="rev-al"><a href="#" class="rev-ver" data-key="${escR(a.key)}">${escR(a.nombre)}</a>${a.claves.size > 1 ? ` <span class="rev-unido" title="Unidos: ${escR([...a.nombres.keys()].join(' · '))}">🔗</span>` : ''}</td>
            ${T.map(celda(a)).join('')}<td class="rev-m ${a.media === null ? '' : a.media >= 5 ? 'ap' : 'su'}">${nf1R(a.media)}</td><td class="rev-n">${a.entregadas}/${a.totalCuentan}</td><td class="rev-n">${a.bienN}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td></td><td class="rev-al">Media de la clase</td>${T.map(t => `<td class="rev-n">${nf1R(mediaT(t))}</td>`).join('')}<td class="rev-m">${nf1R(medias.length ? medias.reduce((s, x) => s + x, 0) / medias.length : null)}</td><td></td><td></td></tr></tfoot></table></div>
        <p class="ctx-nota">Pulsa un alumno (o una nota) para ver su ficha con todas sus correcciones. La media es ponderada por el peso de cada tarea; ${R.modo === 'cero' ? 'las tareas no entregadas cuentan como 0' : 'solo cuentan las tareas entregadas'}. Las tareas sin marcar no cuentan. Si un alumno tiene varias entregas en una tarea, cuenta la mejor.</p>`;
    c.querySelectorAll('.rev-ver').forEach(x => x.onclick = e => { e.preventDefault(); revVista.ficha = x.dataset.key; pintarRevision(); });
    c.querySelectorAll('td[data-key]').forEach(x => x.onclick = () => { revVista.ficha = x.dataset.key; revVista.tarea = +x.dataset.t; pintarRevision(); });
    c.querySelectorAll('.rev-peso').forEach(x => x.onchange = () => { const t = T[+x.dataset.i], p = Math.max(0, Math.min(10, +String(x.value).replace(',', '.') || 0)); revBat().pesos[t.tarea] = p; guardarBateriaPronto(); pintarRevision(); });
    c.querySelectorAll('.rev-cuenta').forEach(x => x.onchange = () => { const t = T[+x.dataset.i]; if (x.checked) delete revBat().fuera[t.tarea]; else revBat().fuera[t.tarea] = true; guardarBateriaPronto(); pintarRevision(); });
}
function pintarFichaRev(c, a) {
    const T = tareasRev(), A = alumnosRev(), i = A.findIndex(x => x.key === a.key);
    c.innerHTML = `<div class="rev-ficha-cab"><button class="btn-action sec" id="revTabla">⬅ La tabla</button>
        <button class="btn-action sec" id="revAnt" ${i <= 0 ? 'disabled' : ''} title="El alumno anterior">◀</button><span class="rev-ficha-nom"><b>${escR(a.nombre)}</b> <small>${i + 1} de ${A.length}</small></span><button class="btn-action sec" id="revSig" ${i >= A.length - 1 ? 'disabled' : ''} title="El alumno siguiente">▶</button>
        <span class="rev-ficha-media ${a.media === null ? '' : a.media >= 5 ? 'ap' : 'su'}">Media <b>${nf1R(a.media)}</b></span><span class="ctx-nota">${a.entregadas} de ${a.totalCuentan} entregadas · ${a.bienN} bien</span>
        ${a.claves.size > 1 ? `<button class="btn-action sec" id="revSeparar" title="Separa los nombres que se unieron: ${escR([...a.nombres.keys()].join(' · '))}">✂ Separar</button>` : ''}
        <span style="flex:1"></span><button class="btn-action sec" id="revInfUno">🖨 Su informe</button><button class="btn-action sec" id="revDevUno">🖨 Su devolución</button></div>
        <div class="rev-tarjetas">${T.map(t => tarjetaRev(a, t)).join('')}</div>`;
    const g = id => c.querySelector('#' + id);
    g('revTabla').onclick = () => { revVista.ficha = null; pintarRevision(); };
    g('revAnt').onclick = () => { revVista.ficha = A[i - 1].key; pintarRevision(); };
    g('revSig').onclick = () => { revVista.ficha = A[i + 1].key; pintarRevision(); };
    if (g('revSeparar')) g('revSeparar').onclick = () => { const U = revBat().uniones; [...a.claves].forEach(k => { delete U[k]; }); Object.keys(U).forEach(k => { if (a.claves.has(U[k])) delete U[k]; }); guardarBateriaPronto(); revVista.ficha = null; pintarRevision(); };
    const con = () => { const x = document.getElementById('revCon'); return !x || x.checked; };
    g('revInfUno').onclick = () => imprimirPorAlumno(false, [a.key], con());
    g('revDevUno').onclick = () => imprimirPorAlumno(true, [a.key], con());
    c.querySelectorAll('.rev-tarjeta[data-t]').forEach(card => {
        const t = bat.tareas[+card.dataset.t], x = a.celdas.get(t); if (!x) return;
        const nota = card.querySelector('.rev-nota'), com = card.querySelector('.rev-com');
        const guardar = () => { ponerProf(x.it, nota.value, com.value); cuentasTareaBat(t); guardarBateriaPronto();
            const m = mediaRev(alumnosRev().find(y => y.key === a.key) || a), s = c.querySelector('.rev-ficha-media'); if (s) { s.className = 'rev-ficha-media ' + (m.media === null ? '' : m.media >= 5 ? 'ap' : 'su'); s.innerHTML = `Media <b>${nf1R(m.media)}</b>`; }
            card.querySelector('.rev-nota-v').textContent = nf1R(x.it.v.nota); };
        nota.onchange = guardar; com.onchange = guardar;
        card.querySelector('.rev-abrir').onclick = () => abrirCorreccionRev(t, x.k, a.key);
        const dib = card.querySelector('.rev-dibujo'); if (dib) dib.onclick = () => abrirCorreccionRev(t, x.k, a.key);
    });
    // los dibujos, después (se calculan con el ejercicio de cada tarea)
    setTimeout(() => c.querySelectorAll('.rev-dibujo[data-t]').forEach(d => { const t = bat.tareas[+d.dataset.t], x = a.celdas.get(t); if (!x || d.dataset.hecho) return; d.dataset.hecho = 1; d.innerHTML = dibujoRev(t, x.it); }), 30);
    if (revVista.tarea !== undefined) { const el = c.querySelector(`.rev-tarjeta[data-t="${revVista.tarea}"]`); if (el) el.scrollIntoView({ block: 'nearest' }); revVista.tarea = undefined; }
}
function tarjetaRev(a, t) {
    const x = a.celdas.get(t), ti = bat.tareas.indexOf(t);
    if (!x) return `<div class="rev-tarjeta rev-no"><div class="rev-tt"><b>${escR(t.tarea)}</b>${cuentaRev(t) ? '' : ' <small>(no cuenta)</small>'}</div><div class="ctx-nota">No entregada${revBat().modo === 'cero' && cuentaRev(t) ? ' (cuenta 0 en la media)' : ''}.</div></div>`;
    const it = x.it, v = it.v, H = (it.r && it.r.hallazgos) || [], err = H.filter(h => h.tipo === 'error'), av = H.filter(h => h.tipo === 'aviso');
    const auto = v.notaAuto !== undefined ? v.notaAuto : v.nota;
    return `<div class="rev-tarjeta" data-t="${ti}"><div class="rev-tt"><b>${escR(t.tarea)}</b>${cuentaRev(t) ? (pesoRev(t) !== 1 ? ` <small>(peso ${nf1R(pesoRev(t))})</small>` : '') : ' <small>(no cuenta)</small>'}
            <span class="vered v-${v.veredicto}">${escR(VER_TXT[v.veredicto] || v.veredicto)}</span><span class="rev-nota-v ${v.nota >= 5 ? 'ap' : 'su'}">${nf1R(v.nota)}</span></div>
        <div class="rev-cuerpo"><div class="rev-dibujo" data-t="${ti}" title="Su corrección completa">…</div>
        <div class="rev-datos"><div class="ctx-nota" style="margin:0 0 4px">${escR(it.archivo)}${it.variante ? ' · variante ' + escR(it.variante) : ''}${(it.parecidos || []).length ? ` · <span style="color:#b0301f">👥 muy parecido a ${escR(parecidosRev(t, it))}</span>` : ''}</div>
            ${err.length ? `<ul class="rev-err">${err.slice(0, 4).map(h => `<li>${escR(h.msg)}${h.pista ? `<div class="ctx-nota">💡 ${escR(h.pista)}</div>` : ''}</li>`).join('')}${err.length > 4 ? `<li class="ctx-nota">y ${err.length - 4} error(es) más</li>` : ''}</ul>` : '<div class="ctx-nota">Sin errores.</div>'}
            ${av.length ? `<div class="ctx-nota">${av.length} aviso${av.length === 1 ? '' : 's'}</div>` : ''}
            <div class="rev-prof"><label>Tu nota <input type="text" class="rev-nota" value="${it.notaProf ?? ''}" placeholder="${nf1R(auto)}"></label><input type="text" class="rev-com" value="${escR(it.comProf || '')}" placeholder="Comentario para el alumno"><button class="btn-action sec rev-abrir" title="Abrirla en la corrección masiva, con su programa y la simulación">🔍 Su corrección</button></div>
        </div></div></div>`;
}
// los parecidos de una entrega, con los nombres de su tarea (no los de la corrección masiva abierta)
const parecidosRev = (t, it) => (it.parecidos || []).map(x => { const o = t.res.lista[x.k]; return o ? `${nombreBaseRev(o, t.res.ids)} (${pctPar(x.p)})` : ''; }).filter(Boolean).join(', ');
function dibujoRev(t, it) {
    try { return conTareaBat(t, () => { const v = it.variante && (masiva.variantes || []).find(x => x.etq === it.variante); return v ? conVariante(v, () => svgCorreccion(it.r)) : svgCorreccion(it.r); }) || ''; }
    catch (e) { return ''; }
}
// abrir una corrección desde la revisión, con un botón para volver a la ficha del alumno
let volverRevision = null;
function abrirCorreccionRev(t, k, key) {
    const ov = document.getElementById('modalRevision'); if (ov) ov.classList.remove('visible');
    verTareaBat(bat.tareas.indexOf(t)); volverRevision = key;
    setTimeout(() => verAlumno(k), 50);
}
const _pintarBarraAlumnoRev = pintarBarraAlumno;
pintarBarraAlumno = function () {
    const r = _pintarBarraAlumnoRev.apply(this, arguments), b = document.getElementById('crAlumno');
    if (b && volverRevision && b.style.display !== 'none' && !b.querySelector('#crVolverRev')) {
        const bt = document.createElement('button'); bt.className = 'btn-action'; bt.id = 'crVolverRev'; bt.textContent = '↩ A la revisión'; bt.title = 'Volver a la ficha del alumno en la revisión de la batería';
        bt.onclick = () => { const key = volverRevision; volverAMasiva(); cerrarMasiva(); volverRevision = null; abrirBateria(); abrirRevision(key); };
        b.insertBefore(bt, b.firstChild);
    }
    return r;
};
function unirMarcadosRev() {
    const K = marcadosRev(); if (K.length < 2) { snack('Marca al menos dos alumnos (el mismo alumno con el nombre escrito distinto)'); return; }
    const A = alumnosRev(), choque = revisarChoques(A.filter(a => K.includes(a.key)));
    if (choque) { snack(`No se pueden unir: los dos tienen entregada «${choque}»`); return; }
    const U = revBat().uniones, dest = K[0];
    A.filter(a => K.includes(a.key)).forEach(a => a.claves.forEach(c => { if (c !== dest) U[c] = dest; }));
    guardarBateriaPronto(); pintarRevision(); snack(`${K.length} nombres unidos en uno`);
}
function revisarChoques(L) { const vistos = new Set(); for (const a of L) for (const t of a.celdas.keys()) { if (vistos.has(t)) return t.tarea; vistos.add(t); } return null; }
function csvRevision() {
    const T = tareasRev(), A = alumnosRev(), c = x => '"' + String(x ?? '').replace(/"/g, '""') + '"', d = x => x === null || x === undefined ? '' : String(Math.round(x * 100) / 100).replace('.', ',');
    const filas = [['Alumno/a', ...T.map(t => t.tarea), 'Media', 'Entregadas', 'La pieza sale bien'],
        ['(peso)', ...T.map(t => cuentaRev(t) ? d(pesoRev(t)) : 'no cuenta'), revBat().modo === 'cero' ? 'no entregadas = 0' : 'solo entregadas', '', ''],
        ...A.map(a => [a.nombre, ...T.map(t => { const x = a.celdas.get(t); return x ? d(x.it.v.nota) : ''; }), d(a.media), `${a.entregadas}/${a.totalCuentan}`, a.bienN])];
    descargar('﻿' + filas.map(f => f.map(c).join(';')).join('\r\n'), `Revisión por alumno ${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.csv`, 'text/csv;charset=utf-8');
}
// ── 6 · 🖨 Informes y devoluciones por alumno ──
function imprimirPorAlumno(devol, claves, conTareas) {
    const T = tareasRev(), A = alumnosRev().filter(a => !claves || !claves.length || claves.includes(a.key));
    if (!A.length) { snack('No hay alumnos'); return; }
    let estilo = '';
    const secciones = new Map();   // «clave|tarea» → sección de su corrección
    if (conTareas) T.forEach(t => {
        const fila = A.map(a => a.celdas.get(t)).filter(Boolean); if (!fila.length) return;
        let h = ''; const o = window.open;
        window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
        try { conTareaBat(t, () => devol ? imprimirDevoluciones(fila.map(x => x.k)) : imprimirInformes(fila.map(x => x.k))); } catch (e) { console.warn(e); } finally { window.open = o; }
        if (!estilo) estilo = (h.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
        const S = h.match(/<section class="inf">[\s\S]*?<\/section>/g) || [];
        S.forEach((s, j) => { const x = fila[j]; const a = A.find(y => y.celdas.get(t) === x); if (a) secciones.set(a.key + '|' + bat.tareas.indexOf(t), s); });
    });
    const R = revBat(), hoy = new Date().toLocaleDateString('es-ES');
    const resumen = a => `<section class="inf rev-res"><div class="cab"><div><div class="tit">${devol ? 'Tus ejercicios' : 'Revisión del alumno'}</div><div class="sub">${devol ? 'Devolución' : 'Batería de corrección'} · ${hoy}</div></div>
            <div class="nota ${a.media === null ? '' : a.media >= 5 ? 'ap' : 'su'}"><span>Media</span><b>${nf1R(a.media)}</b></div></div>
        <div class="al"><span>Alumno/a:</span> <b>${escR(a.nombre)}</b></div>
        <table class="tr"><tr><th>Tarea</th><th>Veredicto</th><th>Nota</th>${T.some(t => pesoRev(t) !== 1) ? '<th>Peso</th>' : ''}<th>${devol ? 'Comentario' : 'Errores y comentario'}</th></tr>
        ${T.map(t => { const x = a.celdas.get(t), cuenta = cuentaRev(t);
            if (!x) return `<tr><td>${escR(t.tarea)}</td><td colspan="2">No entregada${R.modo === 'cero' && cuenta ? ' (0)' : ''}</td>${T.some(u => pesoRev(u) !== 1) ? `<td>${cuenta ? nf1R(pesoRev(t)) : '—'}</td>` : ''}<td></td></tr>`;
            const v = x.it.v, e = ((x.it.r && x.it.r.hallazgos) || []).filter(h => h.tipo === 'error');
            return `<tr><td>${escR(t.tarea)}${cuenta ? '' : ' <small>(no cuenta)</small>'}</td><td><span class="vered v-${v.veredicto}">${escR(VER_TXT[v.veredicto] || '')}</span></td><td class="n"><b>${nf1R(v.nota)}</b></td>${T.some(u => pesoRev(u) !== 1) ? `<td>${cuenta ? nf1R(pesoRev(t)) : '—'}</td>` : ''}
                <td style="font-size:85%">${x.it.comProf ? `💬 ${escR(x.it.comProf)}${e.length ? '<br>' : ''}` : ''}${e.length ? escR(e[0].msg.replace(/^(N\d+|l[ií]nea \d+)\s*:\s*/i, '')).slice(0, 160) + (e.length > 1 ? ` <i>(y ${e.length - 1} más)</i>` : '') : (x.it.comProf ? '' : 'Sin errores')}${!devol && (x.it.parecidos || []).length ? `<br><span style="color:#b0301f">👥 muy parecido a ${escR(parecidosRev(t, x.it))}</span>` : ''}</td></tr>`; }).join('')}</table>
        <p class="crit">Media: ${nf1R(a.media)} · ${a.entregadas} de ${a.totalCuentan} tareas entregadas${R.modo === 'cero' ? ' (las no entregadas cuentan 0)' : ' (solo cuentan las entregadas)'}${T.some(t => pesoRev(t) !== 1) ? ', ponderada por el peso de cada tarea' : ''}. ${a.bienN} con la pieza bien.</p></section>`;
    const cuerpo = A.map(a => resumen(a) + (conTareas ? T.map(t => secciones.get(a.key + '|' + bat.tareas.indexOf(t)) || '').join('') : '')).join('\n');
    const extra = `.rev-res .tr td, .rev-res .tr th { padding: 3px 6px; text-align: left; } .rev-res .tr td.n { text-align: center; } section.inf { page-break-after: always; }
        .rev-res .cab { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; margin-bottom: 8px; padding-bottom: 6px; } .rev-res .tit { font-size: 15pt; font-weight: 700; } .rev-res .sub { color: #666; }
        .rev-res .nota { text-align: center; border: 2px solid #999; border-radius: 6px; padding: 4px 12px; } .rev-res .nota span { display: block; font-size: 8pt; color: #666; } .rev-res .nota b { font-size: 18pt; }
        .rev-res .nota.ap { border-color: #1e7a46; color: #1e7a46; } .rev-res .nota.su { border-color: #b0301f; color: #b0301f; } .rev-res table { width: 100%; border-collapse: collapse; } .rev-res th { text-align: left; border-bottom: 1px solid #999; }
        .rev-res td { border-bottom: 1px solid #ddd; vertical-align: top; } .vered { font-size: 8.5pt; } .v-bien { color: #1e7a46; } .v-mal, .v-error, .v-vacio, .v-altura { color: #b0301f; } .v-nocumple { color: #a86b00; }`;
    const w = window.open('', '_blank'); if (!w) { snack('El navegador ha bloqueado la ventana de impresión: permite las ventanas emergentes para este archivo'); return; }
    w.document.open(); w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${devol ? 'Devoluciones' : 'Informes'} por alumno — ${A.length === 1 ? escR(A[0].nombre) : A.length + ' alumnos'}</title><style>${estilo}\n${extra}</style></head><body>${cuerpo}<script>window.onload = () => setTimeout(() => window.print(), 400);<\/script></body></html>`); w.document.close();
    snack(`${devol ? 'Devoluciones' : 'Informes'} de ${A.length} alumno${A.length === 1 ? '' : 's'}: en la ventana de impresión, «Guardar como PDF»`);
}
