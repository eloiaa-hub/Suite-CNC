// Diagnóstico (Calcador v115 / Corrector v60): la pieza en espejo o girada 180° (con o sin otro cero) y G90/G91 confundidos.
const { lanzar, abrir, path, fs } = require('./comun.js');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const D = __dirname + '/';
(async () => {
    const j01 = JSON.parse(fs.readFileSync(D + 'ISO GEO 01A.json', 'utf8')), pau = fs.readFileSync(D + 'ISO GEO 01A - Alumno A.nc', 'utf8');
    const bien = pau.replace('N60 G0 X0 Y0\nN70 G1 X-80 Y-50', 'N60 G0 X-80 Y-50\nN65 G0 Z5\nN70 G1 Z-3 F300').replace('N270 G0 Z30\nN280 M2', 'N270 G0 Z30\nN275 M05\nN280 M30');
    const iso = JSON.parse(fs.readFileSync(D + 'ISO 13 - dos herramientas.json', 'utf8')), isoNc = fs.readFileSync(D + 'ISO 13 - dos herramientas.nc', 'utf8');
    const neg = (t, L) => t.replace(new RegExp(`([${L}])(-?\\d+)`, 'g'), (m, c, v) => c + (-v));
    const swap23 = t => t.replace(/G2 /g, 'G_3 ').replace(/G3 /g, 'G2 ').replace(/G_3 /g, 'G3 ');
    let px = 0, py = 0; const inc = bien.split('\n').map(l => { const X = /X(-?\d+)/.exec(l), Y = /Y(-?\d+)/.exec(l); if (X) { const v = +X[1]; l = l.replace(X[0], 'X' + (v - px)); px = v; } if (Y) { const v = +Y[1]; l = l.replace(Y[0], 'Y' + (v - py)); py = v; } return l; }).join('\n');
    const C01 = { bien, espejoY: neg(bien, 'Y'), espejoYmovido: neg(bien, 'Y').replace(/X(-?\d+)/g, (m, v) => 'X' + (+v + 80)), inc, absG91: bien.replace('G71 G90 G40', 'G71 G91 G40'), roto: bien.replace('N110 G1 X60 Y20', 'N110 G1 X65 Y25') };
    const C13 = { bien: isoNc, espejoX: swap23(neg(isoNc, 'XI')), giro: neg(neg(isoNc, 'XI'), 'YJ') };
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        const R = await pg.evaluate(({ j01, iso, C01, C13 }) => { const o = {}, una = (k, t) => { const r = corregirPrograma(t), v = valorarCorreccion(r); o[k] = { ver: v.veredicto, nota: v.nota, dg: r.diagnostico || null, dz: r.desplazado || null, h0: (r.hallazgos[0] || {}).msg || '' }; };
            abrirJSONDatos(j01); Object.entries(C01).forEach(([k, t]) => una(k, t)); abrirJSONDatos(iso); Object.entries(C13).forEach(([k, t]) => una('i_' + k, t)); return o; }, { j01, iso, C01, C13 });
        ok(R.bien.ver === 'bien' && !R.bien.dg && R.i_bien.ver === 'bien' && !R.i_bien.dg, `${prog}: los programas bien hechos, sin diagnóstico`);
        ok(R.espejoY.dg && R.espejoY.dg.tipo === 'espejo' && /^Pieza en espejo arriba-abajo \(las Y con el signo cambiado\)/.test(R.espejoY.h0) && /Revisa el signo de las Y/.test(R.espejoY.h0), `${prog}: 01A con las Y cambiadas: ${R.espejoY.h0.slice(0, 90)}…`);
        ok(R.espejoYmovido.dg && /y, además, con otro cero pieza \(movida X\+80\)/.test(R.espejoYmovido.h0), `${prog}: en espejo y con otro cero: ${(R.espejoYmovido.h0.match(/y, además[^)]*\)/) || [''])[0]}`);
        ok(R.i_espejoX.dg && /^Pieza en espejo izquierda-derecha/.test(R.i_espejoX.h0) && /G41 y G42 cambiados/.test(R.i_espejoX.h0), `${prog}: ISO 13 (dos contornos) con las X cambiadas, y la compensación al otro lado`);
        ok(R.i_giro.dg && /^Pieza girada 180°/.test(R.i_giro.h0), `${prog}: ISO 13 girada 180°`);
        ok(R.inc.dg && R.inc.dg.tipo === 'g91' && /^Coordenadas incrementales con G90/.test(R.inc.h0) && /falta G91/.test(R.inc.h0), `${prog}: incrementales con G90: «…falta G91…»`);
        ok(R.absG91.dg && R.absG91.dg.tipo === 'g90' && /Coordenadas absolutas con G91/.test(R.absG91.h0 + ''), `${prog}: absolutas con G91 (también cuando, en incrementales, la Z no llega a cortar)`);
        ok(!R.roto.dg && !R.roto.dz, `${prog}: un error de verdad (un punto mal): sin diagnóstico`);
        ok(R.espejoY.nota === (await pg.evaluate(({ j01, t }) => { abrirJSONDatos(j01); return valorarCorreccion(_corregirProgramaClase(t)).nota; }, { j01, t: C01.espejoY })), `${prog}: la nota no cambia (${R.espejoY.nota})`);
        await pg.evaluate(({ j01, t }) => { abrirJSONDatos(j01); abrirMasiva(); masiva.lista = [{ alumno: 'Espejo', archivo: 'e.nc', texto: t }]; recorregirMasiva(); }, { j01, t: C01.espejoY });
        ok(/· pieza en espejo/.test(await pg.evaluate(() => document.querySelector('#mvTabla tr[data-k]').textContent)), `${prog}: en la lista, «· pieza en espejo»`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close(); console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
