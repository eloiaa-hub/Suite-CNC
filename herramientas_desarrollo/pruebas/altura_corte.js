// Altura de corte incorrecta (Calcador v112 / Corrector v57): el programa de Alumno A (ejercicio 01A) recorre la pieza pero no
// baja de Z0: «Trazado geométrico correcto · Altura de corte incorrecta», y el aviso de N70 (llega al inicio con G1).
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO GEO 01A - Alumno A');   // (el .json, la pieza rehecha con su recorrido; desplazado.js usa el ejercicio real, ISO GEO 01A.json)
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8')), pau = fs.readFileSync(EJ + '.nc', 'utf8');
    const casos = {
        pau,
        arriba: pau.replace('N60 G0 X0 Y0', 'N60 G0 X0 Y0\nN65 G1 Z2'),
        malTrazado: pau.replace('N110 G1 X60 Y20', 'N110 G1 X65 Y20').replace('N120 G1 X30 Y20', 'N120 G1 X30 Y25'),
        bien: pau.replace('N60 G0 X0 Y0\nN70 G1 X-80 Y-50', 'N60 G0 X-80 Y-50\nN65 G0 Z5\nN70 G1 Z-3 F300').replace('N270 G0 Z30\nN280 M2', 'N270 G0 Z30\nN275 M05\nN280 M30'),
        vacio: 'N10 ; nada\nN20 G71 G90\nN30 M30',
        sinZ: pau.replace('N270 G0 Z30', 'N270 G0'),
    };
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        const R = await pg.evaluate(({ d, casos }) => { abrirJSONDatos(d); const o = {};
            for (const [k, t] of Object.entries(casos)) { const r = corregirPrograma(t), v = valorarCorreccion(r); o[k] = { ver: v.veredicto, nota: v.nota, t: r.trazado || null, H: (r.hallazgos || []).map(h => h.tipo + ': ' + h.msg) }; }
            return o; }, { d: json, casos });
        const P = R.pau;
        ok(P.ver === 'altura' && P.nota === 3 && P.t && P.t.ok && P.t.cob === 1, `${prog}: Alumno A → «${await pg.evaluate(() => VER_TXT.altura)}», trazado correcto: nota ${P.nota} (v114: el 50 % de la geometría)`);
        ok(/^error: Altura de corte incorrecta: la fresa no baja nunca \(no hay ninguna Z de corte\), así que no corta nada\. Trazado geométrico correcto: el recorrido en X Y es el de la pieza\./.test(P.H[0]), `${prog}: ${P.H[0].slice(7, 170)}…`);
        ok(P.H.some(h => /^aviso: Si bajara la fresa: N70: este corte se mete en la pieza/.test(h)) && /llegar al punto de inicio con G1 en lugar de G0/.test(P.H[0]), `${prog}: y el aviso de N70 (llegar al inicio con G1)`);
        ok(!P.H.some(h => /Falta mecanizar|ningún movimiento de corte/.test(h)), `${prog}: sin los «Falta mecanizar…» de todo el contorno`);
        ok(R.arriba.ver === 'altura' && /la fresa corta a Z2, por encima de la pieza/.test(R.arriba.H[0]), `${prog}: con G1 Z2: «…corta a Z2, por encima de la pieza…»`);
        ok(R.malTrazado.ver === 'altura' && !R.malTrazado.t.ok && /El trazado geométrico tampoco está bien: con la fresa abajo, mecanizaría el \d+ %/.test(R.malTrazado.H[0]), `${prog}: con el trazado mal: ${R.malTrazado.H[0].slice(110, 230)}…`);
        ok(R.bien.ver === 'bien' && R.bien.nota === 10 && !R.bien.t, `${prog}: el programa de Alumno A, arreglado: bien, 10`);
        ok(R.vacio.ver === 'vacio' && !R.vacio.t, `${prog}: un programa sin recorrido, como siempre: Sin programa válido`);
        ok(R.sinZ.ver !== 'altura' && !R.sinZ.t, `${prog}: un programa sin ninguna Z (2D), como siempre (${R.sinZ.ver})`);
        // en la corrección masiva, en el CSV y en el informe
        await pg.evaluate(({ d, pau }) => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = [{ alumno: 'ALUMNO A', archivo: 'pau.nc', texto: pau }]; recorregirMasiva(); }, { d: json, pau });
        const fila = await pg.evaluate(() => document.querySelector('#mvTabla tr[data-k]').textContent.replace(/\s+/g, ' '));
        ok(/⛔ Altura de corte incorrecta/.test(fila) && /trazado geométrico correcto · altura de corte incorrecta \(no baja de Z0\) · ojo: con la fresa abajo, N70 se metería en la pieza/.test(fila), `${prog}: la fila: ${fila.trim().slice(0, 170)}`);
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/"ALUMNO A";"pau\.nc";"Altura de corte incorrecta"/.test(csv) && /Trazado geométrico correcto/.test(csv), `${prog}: el CSV`);
        const inf = await pg.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write: t => { h += t; }, close() {} }, focus() {}, print() {}, addEventListener() {} }); try { imprimirInformes(); } finally { window.open = o; } return h; });
        ok(/v-altura">⛔ Altura de corte incorrecta/.test(inf) && /Trazado geométrico correcto/.test(inf), `${prog}: el informe`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
