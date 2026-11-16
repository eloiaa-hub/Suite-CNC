import sys
def rep(s, a, b, cnt=1):
    n = s.count(a); assert n == cnt, (a[:70], n); return s.replace(a, b)

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    # 1) cada página con el título de su variante; la solución y los criterios en la devolución
    s = rep(s, """    const pagina = k => {
        const it = masiva.lista[k], r = it.r || {}, v = it.v;""", """    let solBase;
    const pagina = k => {
        const it = masiva.lista[k], r = it.r || {}, v = it.v, titulo = tituloVariante(it, tituloGen);
        const sol = !modoDevol ? null : it.variante && solImp && solImp.has(it.variante) ? solImp.get(it.variante) : (solBase === undefined ? (solBase = solucionDevol(tituloGen)) : solBase);""")
    s = rep(s, """    const titulo = `${cfgHoja.titulo || nombreProyecto()}${cfgHoja.num ? ' · Ejercicio nº ' + cfgHoja.num : ''}`;
    const cat = {""", """    const titulo = `${cfgHoja.titulo || nombreProyecto()}${cfgHoja.num ? ' · Ejercicio nº ' + cfgHoja.num : ''}`, tituloGen = titulo;
    // el nombre del PDF: con un solo alumno, su nombre y su ejercicio (su variante); con varios, el ejercicio (sin la variante si son distintas)
    const titulos = [...new Set(sel.map(k => tituloVariante(masiva.lista[k], titulo)))];
    const tituloDoc = sel.length === 1 && masiva.lista[sel[0]] ? `${masiva.lista[sel[0]].alumno} — ${titulos[0]}` : titulos.length === 1 ? titulos[0] : titulo.replace(/\\s*\\(variante [A-Z]\\)/i, '').replace(/(nº \\S+?)-[A-Z]$/, '$1');
    const cat = {""")
    s = rep(s, """            <h2>Programa del alumno <small>(en rojo, bloques con error; en naranja, con aviso)</small></h2>
            <div class="prog">${prog}</div>
        </section>`;""", """            <h2>${modoDevol ? 'Tu programa' : 'Programa del alumno'} <small>(en rojo, bloques con error; en naranja, con aviso)</small></h2>
            <div class="prog">${prog}</div>
            ${modoDevol ? `<h2>Cómo se ha evaluado</h2><p class="crit">Se pide: ${esc(pide)}. Tolerancia: ${nf(cfgCorr.tol, 2)} mm. ${esc(textoCriterios(N).replace(/^Nota orientativa/, 'La nota'))}${it.notaProf !== null && it.notaProf !== undefined ? ' La nota final la ha puesto el profesor.' : ''}</p>` : ''}
            ${sol ? `<h2>Programa correcto <small>(una solución, en ${esc(sol.coord)}${sol.nota ? '; ' + esc(sol.nota) : ''}; puede haber otras igual de buenas)</small></h2><div class="prog sol">${sol.L.map(l => `<div>${esc(l) || '&nbsp;'}</div>`).join('')}</div>` : ''}
        </section>`;""")
    s = rep(s, """<title>${modoDevol ? 'Devolución' : 'Corrección'} — ${esc(titulo)}</title>""", """<title>${modoDevol ? 'Devolución' : 'Corrección'} — ${esc(tituloDoc)}</title>""")
    s = rep(s, """        .crit { font-size: 8.5pt; color: #666; }
    </style></head><body>${resumen}""", """        .crit { font-size: 8.5pt; color: #666; }
        .prog.sol { background: #f3faf6; border-color: #cfe8da; }
    </style></head><body>${resumen}""")
    # 2) las variantes: la solución de cada una
    s = rep(s, """    const orig = svgCorreccion; svgCorreccion = r => mapa.has(r) ? mapa.get(r) : orig(r);
    try { return _imprimirInformesBase(ks); } finally { svgCorreccion = orig; }""", """    if (modoDevol) { solImp = new Map(); masiva.variantes.forEach(v => { if (sel.some(k => masiva.lista[k] && masiva.lista[k].variante === v.etq)) conVariante(v, () => solImp.set(v.etq, solucionDevol(tituloVariante({ variante: v.etq }, '')))); }); }
    const orig = svgCorreccion; svgCorreccion = r => mapa.has(r) ? mapa.get(r) : orig(r);
    try { return _imprimirInformesBase(ks); } finally { svgCorreccion = orig; solImp = null; }""")
    s = rep(s, """// Los informes impresos: el dibujo de cada alumno, con su variante
""" if '// Los informes impresos: el dibujo' in s else """// los informes impresos: el dibujo de cada alumno, con su variante
""", """// El título de la variante de un alumno (el de su ficha), o el del ejercicio abierto
function tituloVariante(it, base) {
    const v = it && it.variante && masiva.variantes.find(x => x.etq === it.variante);
    if (!v) return base;
    try { const f = fichaDe(v.datos); return f.titulo ? `${f.titulo}${f.num ? ' · Ejercicio nº ' + f.num : ''}` : base; } catch (e) { return base; }
}
// El programa correcto para la devolución: el de «📋 Solución» del ejercicio abierto, en las coordenadas que pide la hoja
let solImp = null;
function solucionDevol(tit) {
    if (typeof tuGenerar !== 'function') return null;
    const ej = TU.ejercicio, co = cfgMec.coord, pide = { g90: 'G90', g91: 'G91', mix: 'mixta' }[cfgHoja.prog];
    try {
        TU.ejercicio = null; cfgMec.coord = pide || (['G90', 'G91', 'G91T', 'mixta'].includes(co) ? co : 'G90');
        const p = tuGenerar(); if (!p || p.vacio || !p.lineas || !p.lineas.length) return null;
        const L = p.lineas.map(l => l.texto || '');
        const i = p.lineas.findIndex(l => l.titulo); if (i >= 0 && tit) L[i] = `(${tuSinTildes(tit).toUpperCase().replace(/[()]/g, '')})`;
        return { L, coord: { G90: 'absolutas (G90)', G91: 'incrementales (G91)', G91T: 'incrementales (G91, también la Z)', mixta: 'mixta (G90 y G91)' }[cfgMec.coord] || cfgMec.coord,
                 nota: cfgHoja.prog === 'polar' ? 'la hoja pide polares; aquí, en absolutas' : '' };
    } catch (e) { console.warn('Solución', e); return null; }
    finally { TU.ejercicio = ej; cfgMec.coord = co; }
}
// los informes impresos: el dibujo de cada alumno, con su variante
""")
    open(f, 'w', encoding='utf-8').write(s); print('ok', f)
