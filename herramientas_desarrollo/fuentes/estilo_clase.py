import sys
def rep(s, a, b, cnt=1):
    n = s.count(a); assert n == cnt, (a[:80], n); return s.replace(a, b)

JS = r"""
// ══ Corrector v82 / Calcador v137: 🔍 Estilo distinto al de clase ══
// Indicios (no pruebas) de un programa que no se ha escrito como en clase: una IA, un manual, otra máquina o la solución
// del Calcador copiada. No cambia la nota: sirve para saber a quién preguntarle por su programa.
const ESTILO_CLAVE = 'calcador_estilo';
const cfgEstilo = (() => { try { return localStorage.getItem(ESTILO_CLAVE) !== '0'; } catch (e) { return true; } })();
let estiloActivo = cfgEstilo;
function cambiarEstilo(chk) { estiloActivo = chk.checked; try { localStorage.setItem(ESTILO_CLAVE, estiloActivo ? '1' : '0'); } catch (e) {} if (masiva.lista.length) pintarMasiva(); }
const PAL_INGLES = new Set(('tool spindle start end move moves rapid feed feedrate cut cutting program safe safety return home coolant set units absolute incremental plane clockwise counterclockwise ' +
    'arc line linear profile contour finish finishing roughing rough pass depth retract plunge approach exit entry lead change stop speed rate position point corner radius center centre circle ' +
    'square rectangle pocket origin the to and of with at down up left right go goes first second third begin beginning initial setup machine part workpiece offset compensation cancel turn mode ' +
    'inch inches millimeters millimeter metric select selection drill drilling hole top bottom side outside inside outer inner end of program stock').split(' '));
const FRASES_CALCADOR = [/→/, /\brecta\b/i, /arco (anti)?horario/i, /baja despacio/i, /sube a la altura de seguridad/i, /r[aá]pido hasta encima de/i, /arranca el husillo/i, /fresa de [ØO]/i, /mil[ií]metros y coordenadas/i, /fin de programa/i];
function estiloPrograma(texto) {
    const L = String(texto || '').replace(/\r/g, '').split('\n'), I = [];
    const coms = [], cods = [];
    L.forEach(l => { const c = (l.match(/\(([^)]*)\)/g) || []).map(x => x.slice(1, -1)).concat((/;(.*)$/.exec(l.replace(/\([^)]*\)/g, '')) || [])[1] || []); coms.push(...c.filter(x => x.trim()));
        const cod = l.replace(/\([^)]*\)/g, ' ').replace(/;.*$/, '').trim(); if (cod) cods.push(cod.toUpperCase()); });
    // 1) comentarios en inglés
    const ing = new Set(); coms.forEach(c => (c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{2,}/g) || []).forEach(w => { if (PAL_INGLES.has(w)) ing.add(w); }));
    const fuertes = [...ing].filter(w => !/^(to|at|of|up|go|the|and|set|end|on)$/.test(w));
    if (ing.size >= 3 && fuertes.length >= 2) I.push({ k: 'ingles', msg: `Comentarios en inglés (${[...ing].slice(0, 6).join(', ')}…).` });
    // 2) la cabecera «de seguridad» de los manuales: varios códigos de inicio en una línea
    const INI = ['G17', 'G20', 'G21', 'G40', 'G49', 'G54', 'G80', 'G90', 'G94', 'G64', 'G61'];
    const cab = cods.find(c => { const w = (c.match(/G0*\d+/g) || []).map(x => 'G' + (+x.slice(1))); const cl = codigosClase(); return w.filter(x => INI.includes(x)).length >= 3 && w.filter(x => INI.includes(x) && !cl.has(x)).length >= 2; });
    if (cab) I.push({ k: 'cabecera', msg: `Cabecera «de seguridad» de los manuales y de otras máquinas: «${cab.replace(/^N\d+\s*/, '')}» (con códigos que no se han dado en clase).` });
    // 3) coordenadas con decimales que sobran (X10.000, F300.0)
    const nums = cods.join(' ').match(/[XYZIJFS]-?\d*\.\d+/g) || [], ceros = nums.filter(x => /\.\d*0$/.test(x));
    if (nums.length >= 5 && ceros.length >= 5 && ceros.length / nums.length >= 0.5) I.push({ k: 'decimales', msg: `Números con decimales que sobran: ${ceros.slice(0, 4).join(' ')}… (en clase, X10, no X10.000).` });
    // 0) el programa generado por el Calcador (su cabecera)
    const gen = /G-?code generado por el Calcador|generado por el Calcador de contornos/i.test(L.join('\n'));
    if (gen) I.push({ k: 'generado', msg: 'Es el programa que genera el Calcador de contornos (lleva su cabecera «G-code generado por el Calcador»).' });
    // 4) caracteres de un texto generado: bloques de código, negritas, rayas largas, comillas tipográficas, emojis…
    const cal = coms.filter(c => FRASES_CALCADOR.some(re => re.test(c))).length;
    const raros = L.join('\n').match(/```|\*\*|[—“”‘’✓✔✅⚠]|\p{Extended_Pictographic}|^\s*gcode\s*$|^\s*(nc|cnc|g-?code)\s*$/gimu) || [];
    if (raros.length && !gen) I.push({ k: 'raros', msg: `Caracteres de un texto copiado de un chat o de un documento: ${[...new Set(raros.map(x => x.trim() || '·'))].slice(0, 5).join(' ')}.` });
    // 5) los comentarios de «📋 Solución» del Calcador o del Tutor
    if (cal >= 4 && cal >= coms.length * 0.4) I.push({ k: 'calcador', msg: `Comentarios como los de «📋 Solución» del Calcador o del Tutor (${cal} de ${coms.length}: «${coms.find(c => FRASES_CALCADOR.some(re => re.test(c))).trim().slice(0, 40)}»…).` });
    // 6) códigos y formatos no dados en clase (los mismos avisos de siempre, en uno)
    try { const A = avisosClase(texto).map(h => (/^[^:]+:\s*([^:]+):/.exec(h.msg) || [])[1]).filter(Boolean).map(x => x.replace(/\s*\(.*$/, '').trim());
        if (A.length >= 2) I.push({ k: 'codigos', msg: `${A.length} códigos o formatos no dados en clase: ${A.slice(0, 6).join(', ')}${A.length > 6 ? '…' : ''}.` }); } catch (e) {}
    return I;
}
const estiloDe = it => { if (!it || !it.texto) return []; if (it._estiloT !== it.texto) { it._estiloT = it.texto; it._estilo = estiloPrograma(it.texto); } return it._estilo; };
const textoEstilo = it => estiloDe(it).map(x => x.msg).join(' · ');
// la marca 🔍 junto al nombre y el resumen de la clase
const _pintarMasivaEst = pintarMasiva;
pintarMasiva = function () {
    _pintarMasivaEst.apply(this, arguments);
    const cuerpo = document.getElementById('mvTabla'), res = document.getElementById('mvResumen'), chk = document.getElementById('mvEstilo');
    if (chk) chk.checked = estiloActivo;
    if (!estiloActivo || !cuerpo || !hayPieza()) return;
    let n = 0;
    cuerpo.querySelectorAll('tr[data-k]').forEach(tr => { const it = masiva.lista[+tr.dataset.k], E = estiloDe(it); if (!E.length) return; n++;
        const td = tr.querySelector('td.mv-al'), s = document.createElement('span');
        s.className = 'mv-est' + (E.length >= 2 ? ' alto' : ''); s.textContent = '🔍' + E.length; s.title = 'Estilo distinto al de clase (indicios, no pruebas):\n• ' + E.map(x => x.msg).join('\n• ') + '\nPulsa para ver toda la clase';
        s.onclick = ev => { ev.stopPropagation(); verEstilo(+tr.dataset.k); }; td.appendChild(document.createTextNode(' ')); td.appendChild(s); });
    if (res && n) res.insertAdjacentHTML('beforeend', ` · <span style="color:#7a4b00;cursor:pointer" onclick="verEstilo()" title="Programas que no están escritos como en clase: pregúntales por su programa">🔍 ${n} con un estilo distinto al de clase</span>`);
};
function verEstilo(k) {
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let ov = document.getElementById('modalEstilo');
    if (!ov) { ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'modalEstilo'; ov.onclick = e => { if (e.target === ov) ov.classList.remove('visible'); }; document.body.appendChild(ov); }
    const F = masiva.lista.map((it, i) => ({ it, i, E: estiloDe(it) })).filter(x => x.E.length && (k === undefined || x.i === k)).sort((a, b) => b.E.length - a.E.length);
    ov.innerHTML = `<div class="help-modal" style="width:min(820px,100%)"><div class="help-header"><h2>🔍 Estilo distinto al de clase${k !== undefined ? ' · ' + esc(masiva.lista[k].alumno) : ''}</h2><button class="help-close" onclick="document.getElementById('modalEstilo').classList.remove('visible')">✕</button></div>
        <div class="help-content"><p class="ctx-nota" style="margin-top:0">Son <b>indicios, no pruebas</b>: programas que no están escritos como en clase (comentarios en inglés, la cabecera de los manuales, X10.000, caracteres copiados de un chat, los comentarios de la solución del Calcador, códigos no dados…). Pueden venir de una IA, de un manual, de otra máquina o de un compañero. <b>No cambian la nota</b>: sirven para saber a quién preguntarle por su programa («¿por qué aquí G3?», «¿de dónde sale este J?»).</p>
        ${F.length ? `<table class="par-tabla"><tr><th>Alumno</th><th>Indicios</th><th></th></tr>${F.map(x => `<tr><td><b>${esc(x.it.alumno)}</b></td><td><ul style="margin:0;padding-left:18px">${x.E.map(e => `<li>${esc(e.msg)}</li>`).join('')}</ul></td><td><button class="mv-mini-b" data-k="${x.i}" title="Su corrección y su programa">🔍 Ver</button></td></tr>`).join('')}</table>`
          : '<p>Ningún programa tiene un estilo distinto al de clase.</p>'}</div></div>`;
    ov.querySelectorAll('button[data-k]').forEach(b => b.onclick = () => { ov.classList.remove('visible'); verAlumno(+b.dataset.k); });
    ov.classList.add('visible');
}
// en la corrección de un programa
const _ejecutarCorreccionEst = ejecutarCorreccion;
ejecutarCorreccion = function () {
    const r = _ejecutarCorreccionEst.apply(this, arguments);
    try { if (estiloActivo) { const el = document.getElementById('crResultado'), E = estiloPrograma(document.getElementById('crTexto').value);
        if (el && E.length) el.insertAdjacentHTML('afterbegin', `<div class="cr-estilo" title="Indicios, no pruebas: no cambian la nota"><b>🔍 Estilo distinto al de clase</b> <span class="ctx-nota">(indicios, no pruebas; no cambian la nota)</span><ul>${E.map(e => `<li>${String(e.msg).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</li>`).join('')}</ul></div>`); } } catch (e) {}
    return r;
};
"""

CSS = """    .mv-est { font-size:11px; cursor:pointer; color:#7a4b00; background:#fdf0d5; border-radius:8px; padding:0 4px; white-space:nowrap; }
    .mv-est.alto { background:#f8d9a8; font-weight:600; }
    .cr-estilo { border:1px solid #e8c48a; background:#fdf6ea; border-radius:8px; padding:6px 10px; margin-bottom:8px; font-size:13px; color:#5c3a00; }
    .cr-estilo ul { margin:4px 0 0 18px; padding:0; }
    body.dark-mode .cr-estilo, body.dark-mode .mv-est { background:#3a2e17; color:#f0c674; }
"""

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    assert 'function estiloPrograma' not in s
    s = rep(s, "// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna", JS.lstrip('\n') + "\n// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna")
    s = rep(s, "    .mv-inf { font-size:12px; cursor:help; }", CSS + "    .mv-inf { font-size:12px; cursor:help; }")
    # la casilla, junto a «Avisar de códigos no dados en clase»
    i = s.index('<input type="checkbox" id="mvClase"'); j = s.index('</label>', i) + len('</label>')
    s = s[:j] + '\n                    <label title="Marca con 🔍 los programas que no están escritos como en clase (comentarios en inglés, la cabecera de los manuales, X10.000, caracteres copiados de un chat, los comentarios de la solución del Calcador…). Son indicios, no pruebas; no cambian la nota"><input type="checkbox" id="mvEstilo" checked onchange="cambiarEstilo(this)"> 🔍 Estilo distinto al de clase</label>' + s[j:]
    # el informe del profesor (no la devolución)
    a = """            ${!modoDevol && (it.parecidos || []).length ? `<div class="ar" style="margin:-4px 0 8px;color:#b0301f;font-weight:600">👥 Muy parecido a: ${esc(textoParecidos(it))}</div>` : ''}"""
    s = rep(s, a, a + """
            ${!modoDevol && typeof estiloActivo !== 'undefined' && estiloActivo && estiloDe(it).length ? `<div class="ar" style="margin:-4px 0 8px;color:#7a4b00;font-weight:600">🔍 Estilo distinto al de clase (indicios): ${esc(textoEstilo(it))}</div>` : ''}""")
    # el CSV
    s = rep(s, """...((masiva.parejas || []).length ? ['Parecido con'] : []), ...(rubricaActiva()""", """...((masiva.parejas || []).length ? ['Parecido con'] : []), ...(estiloActivo ? ['Estilo distinto al de clase'] : []), ...(rubricaActiva()""")
    s = rep(s, """...((masiva.parejas || []).length ? [(it.parecidos || []).length ? textoParecidos(it) : ''] : []), ...(rubricaActiva()""", """...((masiva.parejas || []).length ? [(it.parecidos || []).length ? textoParecidos(it) : ''] : []), ...(estiloActivo ? [textoEstilo(it)] : []), ...(rubricaActiva()""")
    open(f, 'w', encoding='utf-8').write(s); print('ok', f)
