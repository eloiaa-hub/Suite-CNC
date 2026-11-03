// 🎲 Variantes con otras medidas (Calcador v108): alargar o acortar por un corte que solo cruza rectas perpendiculares.
// En «ISO 13» y en todos los ejercicios de la carpeta de ejercicios: los radios de los arcos no cambian, cada tramo o
// conserva su longitud o cambia exactamente lo pedido, el ancho / alto cambian lo pedido, y el programa de la variante sale bien.
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const EJ = ejercicios().find(f => /\/Ejercicio 18\.json$/.test(f));   // la V: se puede cambiar el ancho y el alto
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const b = await lanzar(), pg = await abrir(b, 'calcador.html');
    const revisar = d => pg.evaluate(d => {
        const cp = () => JSON.parse(JSON.stringify(d));
        abrirJSONDatos(cp()); generarMec(); const origOk = ultimoMec ? corregirPrograma(ultimoMec.nc).piezaOk : false; abrirJSONDatos(cp());
        Object.assign(varCfg, { n: 5, aOriginal: true, ex: false, ey: false, giro: false, cero: false, escala: false, medidas: true, mm: '10, -10' });
        const geo = cs => { const T = [].concat(...cs.filter(c => c.pts.length >= 2 && !c.texto && !c.deTexto).map(c => tramos(c)));
            return { radios: T.filter(t => t.b).map(t => { const a = arcoDeBulge(t.p1, t.p2, t.b); return a ? +a.r.toFixed(4) : 0; }).sort((x, y) => x - y).join(','),
                     largos: T.map(t => t.b ? null : Math.hypot(t.p2.x - t.p1.x, t.p2.y - t.p1.y)), caja: bboxPts([].concat(...cs.filter(c => c.pts.length >= 2).map(c => muestrearContorno(c)))) }; };
        const g0 = geo(contornos), base = JSON.parse(JSON.stringify(contornos));
        generarVariantes();
        const out = { n: varGen.length, descs: varGen.map(v => v.desc), mal: [] };
        varGen.slice(1).forEach(v => {
            const m = v.sp.med; if (!m) return;
            const est = transformarEstado({ contornos: JSON.parse(JSON.stringify(base.filter(c => c.pts.length >= 2))), aux: [] }, v.sp), g = geo(est.contornos);
            if (g.radios !== g0.radios) out.mal.push(`${v.letra}: los radios cambian`);
            const dif = g.largos.map((L, k) => L === null ? 0 : Math.abs(L - g0.largos[k])).filter(x => x > 1e-6);
            if (dif.some(x => Math.abs(x - Math.abs(m.x || m.y)) > 1e-6 && !(m.x && m.y))) out.mal.push(`${v.letra}: un tramo cambia ${dif.join(', ')}`);
            const dw = (g.caja.x1 - g.caja.x0) - (g0.caja.x1 - g0.caja.x0), dh = (g.caja.y1 - g.caja.y0) - (g0.caja.y1 - g0.caja.y0);
            if (Math.abs(dw - (m.x || 0)) > 1e-6 || Math.abs(dh - (m.y || 0)) > 1e-6) out.mal.push(`${v.letra}: medidas ${dw}, ${dh} (se pedía ${m.x}, ${m.y})`);
            // el programa de la variante, corregido con la variante, sale bien
            abrirJSONDatos(JSON.parse(JSON.stringify(v.datos))); generarMec();
            if (ultimoMec && origOk) { const r = corregirPrograma(ultimoMec.nc); if (!r.piezaOk) out.mal.push(`${v.letra}: su programa no sale bien`); }
            abrirJSONDatos(cp()); generarVariantes();
        });
        out.conMed = varGen.filter(v => v.sp.med).length;
        return out;
    }, d);
    const iso = await revisar(JSON.parse(fs.readFileSync(EJ, 'utf8')));
    ok(iso.n === 5 && iso.conMed === 4, `Ejercicio 18: ${iso.n} variantes, ${iso.conMed} con otras medidas · ${iso.descs.join(' | ')}`);
    ok(!iso.mal.length, `Ejercicio 18: radios iguales, tramos y medidas exactos, su programa sale bien ${iso.mal.join(' · ')}`);
    // la ventana: la casilla y la descripción
    const ui = await pg.evaluate(() => { abrirVariantes(); const g = id => document.getElementById(id); g('varMed').checked = true; g('varMm').value = '20'; cambiarVariantes();
        return { med: varCfg.medidas, mm: varCfg.mm, txt: document.getElementById('varLista').textContent }; });
    ok(ui.med && ui.mm === '20' && /ancho \d+ mm \(\+20\)|alto \d+ mm \(\+20\)/.test(ui.txt), `la casilla «Otras medidas (mm)» y la descripción: ${ui.txt.match(/(ancho|alto) [^V]*/)?.[0] || ui.txt.slice(0, 80)}`);
    await pg.screenshot({ path: process.env.CAPTURA || '/tmp/variantes_medidas.png' });
    await pg.evaluate(() => cerrarVariantes());
    // todos los ejercicios
    let n = 0, conMed = 0; const malos = [];
    for (const f of ejercicios()) {
        let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
        if (!d || !d.calcador) continue;
        const r = await revisar(d).catch(e => ({ mal: ['ERROR ' + e.message], conMed: 0 }));
        n++; if (r.conMed) conMed++; if (r.mal.length) malos.push(path.basename(f) + ': ' + r.mal.join(' · '));
    }
    ok(n >= 5 && !malos.length, `${n} ejercicios, ${conMed} con alguna medida que se puede cambiar; sin problemas ${malos.slice(0, 5).join(' | ')}`);
    ok(!pg.errs.length, `sin errores de JavaScript ${pg.errs.slice(0, 3).join(' | ')}`);
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
