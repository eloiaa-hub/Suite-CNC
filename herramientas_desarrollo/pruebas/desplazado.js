// Trazado desplazado (Calcador v113 / Corrector v58): con el ejercicio ISO GEO 01A real, el programa de Alumno B tiene la
// forma de la pieza movida X+80 Y+50 (el cero en la esquina de abajo a la izquierda): «Trazado desplazado…», sin cambiar la nota.
const { lanzar, abrir, path, fs } = require('./comun.js');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const mover = (t, dx, dy) => t.replace(/([XY])(-?\d+(?:\.\d+)?)/g, (m, c, v) => c + (+v + (c === 'X' ? dx : dy)));
(async () => {
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'ISO GEO 01A.json'), 'utf8'));
    const flor = fs.readFileSync(path.join(__dirname, 'ISO GEO 01A - Alumno B.nc'), 'utf8'), pau = fs.readFileSync(path.join(__dirname, 'ISO GEO 01A - Alumno A.nc'), 'utf8');
    const bienPau = pau.replace('N60 G0 X0 Y0\nN70 G1 X-80 Y-50', 'N60 G0 X-80 Y-50\nN65 G0 Z5\nN70 G1 Z-3 F300').replace('N270 G0 Z30\nN280 M2', 'N270 G0 Z30\nN275 M05\nN280 M30');
    const casos = { flor, pau, pauMovido: mover(pau, 80, 50), bien: bienPau, otroSitio: mover(bienPau, 10, -5), otraPieza: fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.nc'), 'utf8') };
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        const R = await pg.evaluate(({ d, casos }) => { abrirJSONDatos(d); const o = {};
            for (const [k, t] of Object.entries(casos)) { const r = corregirPrograma(t), v = valorarCorreccion(r); o[k] = { ver: v.veredicto, nota: v.nota, dz: r.desplazado || null, t: r.trazado || null, H: (r.hallazgos || []).map(h => h.tipo + ': ' + h.msg), n: (r.hallazgos || []).length }; }
            return o; }, { d: json, casos });
        const F = R.flor;
        ok(F.dz && F.dz.x === 80 && F.dz.y === 50 && F.dz.ok, `${prog}: Alumno B: trazado desplazado X+80 Y+50`);
        ok(/^error: Trazado desplazado: el recorrido tiene la forma de la pieza, pero movido X\+80 Y\+50: el cero pieza que ha usado no es el del plano, lo ha puesto en la esquina de abajo a la izquierda de la pieza \(X-80 Y-50 en el plano\)\./.test(F.H[0]), `${prog}: ${F.H[0].slice(7, 230)}`);
        ok(/el punto que ha programado como X0 Y\d+ es, con el cero del plano, X-80 Y-?\d+/.test(F.H[0]), `${prog}: con un ejemplo de punto`);
        ok(F.ver === 'mal' && F.nota === 5 && F.H.some(h => /baja en diagonal/.test(h)) && F.H.some(h => /termina con la fresa dentro de la pieza/.test(h)), `${prog}: los demás errores y avisos, como antes; el trazado puntúa: nota ${F.nota} (antes, 2)`);
        ok(R.pau.ver === 'altura' && R.pau.t.ok && !R.pau.dz && R.pau.nota === 3, `${prog}: Alumno A, con el ejercicio real: altura de corte incorrecta, trazado correcto: nota ${R.pau.nota} (el 50 % de la geometría)`);
        ok(R.pauMovido.ver === 'altura' && R.pauMovido.dz && R.pauMovido.dz.x === 80 && R.pauMovido.H.some(h => /Trazado desplazado/.test(h)), `${prog}: sin bajar de Z0 y desplazado: los dos avisos`);
        ok(R.bien.ver === 'bien' && R.bien.nota === 10 && !R.bien.dz, `${prog}: bien hecho: sin aviso de desplazado`);
        ok(R.otroSitio.dz && R.otroSitio.dz.x === 10 && R.otroSitio.dz.y === -5 && /lo ha puesto en X-10 Y5 en el plano/.test(R.otroSitio.H[0]), `${prog}: movido X+10 Y-5: «…lo ha puesto en X-10 Y5 en el plano»`);
        ok(!R.otraPieza.dz, `${prog}: otra pieza: no es un desplazamiento`);
        // el porcentaje: a 0, como antes; con la rúbrica, en el apartado de geometría
        const N2 = await pg.evaluate(({ d, casos }) => { abrirJSONDatos(d); const nota = t => valorarCorreccion(corregirPrograma(t)).nota;
            cfgCorr.notaTrazado = 0; const cero = [nota(casos.flor), nota(casos.pau)]; cfgCorr.notaTrazado = 100; const cien = [nota(casos.flor), nota(casos.pau)];
            cfgCorr.notaTrazado = 50; cfgCorr.rubrica = { modo: 'apartados', pesos: pesosRubrica() }; const rub = [nota(casos.pau), nota(casos.bien)]; delete cfgCorr.rubrica; return { cero, cien, rub }; }, { d: json, casos });
        ok(N2.cero.join() === '2,0' && N2.cien.join() === '8,6' && N2.rub.join() === '2,9.5', `${prog}: al 0 %, ${N2.cero} (como antes); al 100 %, ${N2.cien}; con la rúbrica (Alumno A, y bien sin comentarios): ${N2.rub}`);
        // en la lista
        await pg.evaluate(({ d, flor }) => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = [{ alumno: 'ALUMNO B', archivo: 'flor.nc', texto: flor }]; recorregirMasiva(); }, { d: json, flor });
        const fila = await pg.evaluate(() => document.querySelector('#mvTabla tr[data-k]').textContent.replace(/\s+/g, ' '));
        ok(/❌ No sale bien · trazado desplazado/.test(fila), `${prog}: la fila: ${fila.trim().slice(0, 80)}`);
        await pg.evaluate(() => { const i = document.getElementById('mvTraz'); i.value = '30'; cambiarRequisitosMasiva(); });
        const n30 = await pg.evaluate(() => ({ nota: masiva.lista[0].v.nota, cfg: cfgCorr.notaTrazado }));
        ok(n30.cfg === 30 && n30.nota === 3.8, `${prog}: «Trazado sin cortar o desplazado» al 30 %: Alumno B, ${n30.nota}`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
