// Calcador láser (laser.html): el dibujo y un programa G-code pasan a un .rd válido para la láser (Ruida, código 0x88),
// con el formato de Atheon Design; el Calcador no enseña la pestaña 🔥 Láser
const { lanzar, abrir, ejercicios, fs, path } = require('./comun');
(async () => { const b = await lanzar(); const fallos = [], ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos.push(m); };
  // 1) En el Calcador, el modo láser no aparece
  let pg = await abrir(b, 'calcador.html');
  ok(!(await pg.evaluate(() => !!document.getElementById('tuFuenteLaser') || typeof window.LASER !== 'undefined')), 'calcador.html: sin pestaña 🔥 Láser');
  await pg.close();
  // 2) laser.html: cada ejercicio de la carpeta → .rd que se descifra y vuelve a dar la pieza
  pg = await abrir(b, 'laser.html');
  ok(await pg.evaluate(() => !!document.getElementById('lasPanel') && document.getElementById('tutorPanel').classList.contains('laser')), 'laser.html: pestaña 🔥 Láser activa');
  let n = 0;
  for (const f of ejercicios().slice(0, 12)) {
    let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; } if (!d.calcador) continue;
    const r = await pg.evaluate(d => { try { abrirJSONDatos(d); LASER.volverAlDibujo();
        const g = LASER.generarRD(), dec = LASER.RDCore.decode(g.rd.bytes);
        const cortes = dec.cmds.filter(c => c.hex.startsWith('A8')).length, b = g.rd.bounds;
        const tr = LASER.trazadosDibujo(), xs = [].concat(...tr.map(t => t.pts.map(q => q[0]))), ys = [].concat(...tr.map(t => t.pts.map(q => q[1])));
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        return { magic: dec.magic, fin: dec.cmds[dec.cmds.length - 1].hex, cortes, ancho: (b[2] - b[0]) / 1000, alto: (b[3] - b[1]) / 1000, w, h, max: [b[2], b[3]] };
      } catch (e) { return { error: e.message }; } }, d);
    n++;
    const nom = path.basename(f);
    if (r.error) { ok(false, `${nom}: ${r.error}`); continue; }
    ok(r.magic === 0x88 && r.fin === 'D7' && r.cortes > 0, `${nom}: .rd con código 0x88, ${r.cortes} cortes y fin de archivo`);
    ok(Math.abs(r.ancho - r.w) < 0.01 && Math.abs(r.alto - r.h) < 0.01, `${nom}: mide lo mismo que el dibujo (${r.w.toFixed(2)} × ${r.h.toFixed(2)} mm)`);
    ok(r.max[0] <= 0 && r.max[1] <= 0, `${nom}: coordenadas referidas al cabezal (esquina inferior izquierda), como Atheon Design`);
  }
  // 2b) El programa de 📋 Solución es de láser: sin T, Z ni compensación; M03 S… / M05 y las pasadas repiten el contorno
  const pr = await pg.evaluate(() => { tuFuente('solucion'); tuRefrescar(true); const t = TU.prog.texto.replace(/;.*$/gm, ''), A = LASER.ajustes();
    return { T: /\bT\d|M0?6\b/.test(t), Z: /\bZ-?\d/.test(t), comp: /G4[12]/.test(t), m3: (t.match(/M03 S\d+/g) || []).length, m5: (t.match(/M05/g) || []).length, vacio: TU.prog.vacio }; });
  ok(!pr.vacio && !pr.T && !pr.Z && !pr.comp && pr.m3 > 0 && pr.m3 === pr.m5, `programa de láser: sin T, Z ni G41/G42; ${pr.m3} encendidos M03 y otros tantos M05`);
  // 2c) El mismo trabajo que un .rd real de Atheon Design (cuadrado de 50 × 50, 9 mm/s, 60 %, 2 pasadas): byte a byte
  const ref = fs.readFileSync(path.join(process.env.SUITE || path.join(__dirname, '../..'), 'herramientas_desarrollo/laser/referencia_atheon/cuadrado_50x50.rd'));
  const mio = await pg.evaluate(() => { const A = LASER.ajustes(), copia = JSON.stringify(A);
    Object.assign(A, { inicio: 'current', ref: 'bl', formato: 'atheon', magic: 136, origen: 'tr', optimizar: true, intPrimero: true });
    Object.assign(A.capas[1], { speed: 9, pmin: 60, pmax: 60, passes: 2, air: true, out: true });
    LASER.abrirGcodeTexto('G90\nG0 X0 Y50\nG1 X50\nG1 Y0\nG1 X0\nG1 Y50\nM30\n', 'cuadrado.nc');
    const b = Array.from(LASER.generarRD().rd.bytes); LASER.volverAlDibujo(); Object.assign(A, JSON.parse(copia)); return b; });
  const dif = mio.length === ref.length ? mio.filter((v, i) => v !== ref[i]).length : -1;
  ok(dif >= 0 && dif <= 2, `igual que el .rd de Atheon Design (${ref.length} bytes; ${dif < 0 ? 'distinto tamaño: ' + mio.length : dif + ' bytes distintos, el redondeo de 1 µm'})`);
  // 2d) .rld: con los tramos del cuadrado de Atheon Design sale su mismo proyecto (salvo 64 bytes de un campo que se deja vacío, como en Default.rld)
  const refRld = fs.readFileSync(path.join(process.env.SUITE || path.join(__dirname, '../..'), 'herramientas_desarrollo/laser/referencia_atheon/cuadrado_50x50.rld'));
  const rl = await pg.evaluate(async () => { const x0 = 498.43615000000005, x1 = 548.43615, y0 = 600.9692500000001, y1 = 650.9692500000001;
    const t = [[x0, y1, x1, y1], [x1, y1, x1, y0], [x1, y0, x0, y0], [x0, y0, x0, y1]];
    const b = await LASER.RLD.escribir(t, { speed: 9, pmin: 60, pmax: 60, passes: 2 }, { W: 1000, H: 700 });
    const varios = await LASER.generarRLD().then(() => '', e => e.message);
    LASER.abrirGcodeTexto('G90\nG0 X0 Y0\nG1 X30\nG3 X30 Y20 I0 J10\nG1 X0\nG1 Y0\nM30\n', 'uno.nc');
    const d = await LASER.generarRLD().catch(e => null); LASER.volverAlDibujo();
    return { b: Array.from(b), n: d ? d.length : 0, varios }; });
  const difR = rl.b.length === refRld.length ? rl.b.filter((v, i) => v !== refRld[i]).length : -1;
  ok(difR >= 0 && difR <= 64, `.rld del cuadrado igual que el de Atheon Design (${refRld.length} bytes; ${difR < 0 ? 'distinto tamaño: ' + rl.b.length : difR + ' bytes distintos'})`);
  ok(rl.n > 0 && (rl.n - (refRld.length - 4 * 74)) % 74 === 0, `.rld de una pieza de un contorno: ${(rl.n - (refRld.length - 4 * 74)) / 74} tramos de 74 bytes`);
  ok(/un contorno/.test(rl.varios), '.rld con varios contornos: no se guarda (Atheon Design los uniría con cortes de más)');
  // 2e) 📚 Parámetros de corte: la de inicio va dentro, «Usar» pone los valores en la capa y el programa lo dice
  const ini = JSON.parse(fs.readFileSync(path.join(process.env.SUITE || path.join(__dirname, '../..'), 'biblioteca_laser/Parametros_laser_inicio.json'), 'utf8'));
  const bib = await pg.evaluate(n => { const B = LASER.biblioteca(), e = B.find(x => x.op === 'corte' && x.grosor === 3);
    LASER.usarEntrada(e); const c = LASER.ajustes().capas[1]; tuFuente('solucion'); tuRefrescar(true);
    return { n: B.length, ok: c.speed === e.speed && c.pmax === e.pmax && c.passes === e.passes && c.mat === e.material + ' 3 mm', prog: TU.prog.texto.includes('(' + tuSinTildes(c.mat) + ')') }; }, ini.entradas.length);
  ok(bib.n === ini.entradas.length && bib.ok && bib.prog, `📚 Parámetros de corte: ${bib.n} de inicio (como biblioteca_laser/), «Usar» pone velocidad, potencia y pasadas, y el programa dice el material`);
  // 3) Un programa G-code: G1/G2/G3 cortan y G0 no
  const nc = 'G71 G90\nG0 X0 Y0\nG1 X40\nG3 X40 Y20 I0 J10\nG1 X0\nG1 Y0\nG0 X100 Y100\nM30\n';
  const g = await pg.evaluate(t => { const s = LASER.abrirGcodeTexto(t, 'prueba.nc'); const r = LASER.generarRD(); const res = { n: s.trazados.length, cerrado: s.trazados[0] && s.trazados[0].cerrado, bytes: r.rd.bytes.length }; LASER.volverAlDibujo(); return res; }, nc);
  ok(g.n === 1 && g.cerrado && g.bytes > 300, `G-code → un trazado cerrado (G0 no corta) y un .rd de ${g.bytes} bytes`);
  ok(!pg.errs.length, 'laser.html: sin errores de JavaScript' + (pg.errs.length ? ' · ' + pg.errs.slice(0, 2).join(' | ') : ''));
  console.log(`${n} ejercicios · fallos ${fallos.length}`);
  await b.close(); process.exitCode = fallos.length ? 1 : 0; })();
