// Tutor G-Code v1: el programa que escribe (igual que los programas resueltos de los apuntes), la práctica línea a línea,
// los ejercicios (sin programa ni coordenadas) y lo que se ha quitado del Calcador. Guarda los programas en TUTOR_SALIDA (si se da).
const { lanzar, path, SUITE, fs } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  const p = await b.newPage({ viewport: { width: 1440, height: 880 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500);
  // lo que no está en el Tutor
  const vis = await p.evaluate(() => { const v = sel => { const e = document.querySelector(sel); return !!e && e.offsetParent !== null; };
    return { aleatorio: v('button[onclick="abrirGenerador()"]'), mec: v('button[onclick="abrirMec()"]'), cuest: v('button[onclick="abrirCuestionario()"]'), variantes: v('button[onclick="abrirVariantes()"]'),
      dxf: v('button[onclick="exportarDXF()"]'), svg: v('button[onclick="exportarSVG()"]'), hoja: v('button[onclick="abrirHoja()"]'), sol: v('button[onclick="abrirTabla()"]'), corr: v('button[onclick="abrirCorregir()"]'),
      masiva: v('button[onclick="abrirMasiva()"]'), bib: v('button[onclick="abrirBiblioteca()"]'), texto: v('#toolStrip [data-h="texto"]'), guardar: v('.c2-archivo button[onclick="exportarJSON()"]'), sim: v('#tutorPanel button[onclick="tuEnviarSimulador()"]'), nuevo: v('.c2-archivo button[onclick="nuevo()"]'), ejemplos: v('.c2-archivo button[onclick="tuAbrirEjemplos()"]'), nivel: v('#c2PaneDib #tuNivel'), pestanas: [...document.querySelectorAll('#c2Tabs2 button')].map(b => b.textContent).join('/'), exportar: v('.params-box.visor-si'),
      accept: document.getElementById('fileFondo').accept, titulo: document.title, ver: document.querySelector('.ver-suite').textContent }; });
  ok('sin ejercicio aleatorio, Mecanizar, cuestionario, variantes, DXF, SVG, hojas, soluciones, corrección ni biblioteca del profesor',
     !vis.aleatorio && !vis.mec && !vis.cuest && !vis.variantes && !vis.dxf && !vis.svg && !vis.hoja && !vis.sol && !vis.corr && !vis.masiva && !vis.bib && !vis.texto, JSON.stringify(vis));
  ok('como en el Calcador: Nuevo, Abrir, Guardar y Ejemplos arriba; ➜ Simulador 3D en el panel; Dibujo/Construcción/Formas en pestañas, con el nivel en Dibujo; sin Exportar; fondo solo de imágenes; título y versión', vis.guardar && vis.sim && vis.nuevo && vis.ejemplos && vis.nivel && vis.pestanas === 'Dibujo/Construcción/Formas' && !vis.exportar && !/dxf|svg/.test(vis.accept) && vis.titulo === 'Tutor G-Code — Por Eloi A.A.' && vis.ver === 'v6', vis.accept + ' · ' + vis.ver);
  // 1) los programas resueltos de los apuntes: mismo código (sin comentarios) en G90, G91 y mixta
  const RES = path.join(SUITE, 'herramientas_desarrollo/manuales/resueltos/programas/');
  const codigo = t => t.split(/\r?\n/).slice(1).map(l => l.replace(/\(.*?\)/g, '').split(';')[0].trim()).filter(Boolean);
  const casos = [];
  for (let n = 1; n <= 10; n++) { const modos = n <= 8 ? ['G90', 'G91'] : ['mixta']; modos.forEach(m => casos.push({ n, m, f: `ejercicio${n}_${m === 'mixta' ? 'mixta' : m}.nc` })); }
  casos.push({ n: 3, m: 'G90', f: 'ejercicio3_G90_pasadas.nc', paso: 3, prof: 6 }, { n: 3, m: 'G91', f: 'ejercicio3_G91_pasadas.nc', paso: 3, prof: 6 });
  const malos = [];
  for (const c of casos) {
    const nc = await p.evaluate(c => { tuCargarEjemplo(c.n - 1); Object.assign(cfgMec, { coord: c.m, comp: 'G40', Fz: 150, F: 1000, prof: c.prof || 3, paso: c.paso || c.prof || 3, T: 101, S: 12000, zSeg: 20 }); cfgFresa.d = 6; tuPintarMec(); tuRefrescar(true); return TU.prog.texto; }, c);
    const a = codigo(nc), e = codigo(fs.readFileSync(RES + c.f, 'utf8'));
    const k = a.findIndex((l, i) => l !== e[i]);
    if (k >= 0 || a.length !== e.length) malos.push(`${c.f}: línea ${k + 1} «${a[k]}» ≠ «${e[k]}»`);
    if (process.env.TUTOR_SALIDA) fs.writeFileSync(path.join(process.env.TUTOR_SALIDA, c.f), nc);
  }
  ok(`los ${casos.length} programas resueltos de los apuntes salen iguales (G90, G91, mixta y dos pasadas)`, !malos.length, malos.slice(0, 3).join(' | '));
  // 2) práctica: cada línea del programa, escrita tal cual, se acepta; y equivalentes (sin G repetida, R en vez de I J, M3, G21)
  const pr = await p.evaluate(() => {
    tuCargarEjemplo(5); Object.assign(cfgMec, { coord: 'G91', comp: 'auto', Fz: 150 }); tuPintarMec(); tuRefrescar(true); tuModo('practicar');
    const res = []; let vueltas = 0;
    while (!TU.practica.fin && vueltas++ < 200) { const l = TU.prog.lineas[TU.practica.idx]; const prev = tuEstadoTras(TU.practica.idx - 1); const m = tuComparar(prev, tuAplicar(prev, l.cod), tuAplicar(prev, l.cod), l); if (m) res.push(l.cod + ' → ' + m); tuAceptar(l.cod, 'bien'); }
    return { res, fin: TU.practica.fin, bien: TU.practica.bien };
  });
  ok('Practicar: el propio programa (G91 con compensación) se acepta línea a línea hasta el final', pr.fin && !pr.res.length, pr.res.slice(0, 2).join(' | '));
  const prueba = async (lineas) => p.evaluate(lineas => {
    tuCargarEjemplo(4); Object.assign(cfgMec, { coord: 'G90', comp: 'G40', Fz: 150 }); tuPintarMec(); tuRefrescar(true); tuModo('practicar'); tuNuevaPractica();
    return lineas.map(t => { const i = TU.practica.idx; const el = document.getElementById('tuEntrada'); el.value = t; tuComprobar(); return [t, TU.practica.idx > i ? 'ok' : TU.practica.msg.txt]; });
  }, lineas);
  let r = await prueba(['G21 G90', 'T1 M6', 'S12000 M3', 'G0 Z20', 'G0 X0 Y10', 'G1 Z-3 F150', 'G2 X10 Y0 R10 F1000', 'G1 X185', 'G2 X210 Y25 I0 J25', 'G2 X210 Y25 I25 J0', 'G1 X210 Y130', 'X10']);
  ok('Practicar: G21, T1 (= T101), M6 y M3, G1 sin repetir, arco con R: valen', r.every(x => x[1] === 'ok' || x[0] === 'G2 X210 Y25 I0 J25'), JSON.stringify(r.filter(x => x[1] !== 'ok')));
  ok('Practicar: el centro del arco mal (I0 J25) se explica', /centro del arco|revisa la [IJ]|I está bien|J está bien/i.test(r[8][1]), r[8][1]);
  r = await prueba(['G71 G90', 'T101 M06', 'S12000 M03', 'G0 Z20', 'G0 X0 Y10', 'G0 Z-3', 'G1 Z3 F150', 'G1 Z-3', 'G1 Z-3 F150', 'G3 X10 Y0 I0 J-10 F1000', 'G2 X10 Y0 I0 J-10 F1000', 'G1 X175 Y0', 'G91 G1 X175 Y0', 'G1 X185 Y0 F1000']);
  const msg = r.map(x => x[1]);
  ok('Practicar: los errores se explican (G0 al cortar, F que falta, sentido del arco, punto en G90…)', /no puede ir en rápido|no corta/.test(msg[5]) && /Falta el avance F/.test(msg[7]) && /sentido del arco/.test(msg[9]) && msg[10] === 'ok' && /no es correcta|G90/.test(msg[11]) && /G90/.test(msg[12]) && msg[13] === 'ok', JSON.stringify(msg.slice(5)));
  // 3) ejercicios: sin programa, sin coordenadas, solo medir, y no se puede pasar a Aprender
  const ej = await p.evaluate(() => { const i = TU_EJEMPLOS.findIndex(e => e.ejercicio); tuCargarEjemplo(i); return new Promise(res => setTimeout(() => { tuModo('aprender'); tuPestana('puntos');
    const r = { modo: TU.modo, herr: herramienta, puntos: document.getElementById('tuPuntos').textContent, lineas: document.querySelectorAll('#tuLista .tu-l[data-i]').length, total: TU.prog.lineas.length,
      linea: (setHerramienta('linea'), herramienta), botones: [...document.querySelectorAll('#toolStrip .tool-btn')].filter(b => b.offsetParent !== null).map(b => b.dataset.h).join(), descargar: document.getElementById('tuDescargar').hidden };
    tuPestana('programa'); res(r); }, 50)); });
  ok('ejercicio: en Practicar, sin las coordenadas de los puntos, solo «medir» y sin descargar el programa', ej.modo === 'practicar' && /las sacas tú/.test(ej.puntos) && ej.lineas <= 2 && ej.herr === 'medir' && ej.linea === 'medir' && ej.botones === 'medir' && ej.descargar, JSON.stringify(ej));
  r = await p.evaluate(() => { tuSalirEjercicio(); return [TU.ejercicio, TU.modo, herramienta]; });
  ok('✕ Dejar el ejercicio: vuelve a Aprender y a dibujar', r[0] === null && r[1] === 'aprender' && r[2] === 'linea', JSON.stringify(r));
  // un JSON con «tutor.ejercicio» (como el que guarda el Calcador) abre el ejercicio con sus coordenadas
  r = await p.evaluate(() => new Promise(res => { const d = JSON.parse(JSON.stringify(TU_EJEMPLOS[2].datos)); d.tutor = { ejercicio: true, coord: 'G91', comp: 'auto' }; abrirJSONDatos(d);
    setTimeout(() => res([TU.modo, TU.ejercicio && TU.ejercicio.coord, TU.prog.comp, document.getElementById('tuCoord').disabled, TU.prog.lineas.some(l => /G4[12]/.test(l.cod))]), 50); }));
  ok('JSON de ejercicio del Calcador: G91 y compensación fijadas', JSON.stringify(r) === '["practicar","G91","auto",true,true]', JSON.stringify(r));
  await p.evaluate(() => tuSalirEjercicio());
  // 4) mientras se dibuja, el programa crece
  await p.evaluate(() => { contornos = []; refrescar(); setHerramienta('linea'); });
  const n0 = await p.evaluate(() => new Promise(r => setTimeout(() => r(TU.prog.lineas.length), 200)));
  for (const c of ['0,0', '100,0', '100,50']) { await p.fill('#cmd', c); await p.press('#cmd', 'Enter'); await p.waitForTimeout(250); }
  const n1 = await p.evaluate(() => TU.prog.lineas.filter(l => /K\d → K\d/.test(l.com)).length);
  for (const c of ['0,50', '0,0']) { await p.fill('#cmd', c); await p.press('#cmd', 'Enter'); await p.waitForTimeout(250); }
  const n2 = await p.evaluate(() => TU.prog.lineas.filter(l => /P\d → P\d/.test(l.com)).length);
  ok('Aprender: el programa se escribe mientras se dibuja (2 tramos abiertos → 4 al cerrar)', n1 === 2 && n2 === 4, `${n0} · ${n1} · ${n2}`);
  // 5) reproducir: la fresa recorre las líneas y la explicación sigue a la línea marcada
  r = await p.evaluate(() => { tuIrALinea(8); return [TU.sel, document.getElementById('tuExplicar').textContent.includes('Línea 9'), TU.sim && TU.sim.t > 0]; });
  ok('clic en una línea: la fresa va al final de esa línea y sale su explicación', r[0] === 8 && r[1] && r[2], JSON.stringify(r));
  // 6) todas las piezas de ejemplo, en G90, G91 y mixta, con y sin compensación: el programa acaba donde empieza y la explicación no falla
  r = await p.evaluate(() => { const mal = []; TU_EJEMPLOS.forEach((e, i) => { tuCargarEjemplo(i); TU.ejercicio = null; ['G90', 'G91', 'mixta'].forEach(co => ['G40', 'auto'].forEach(cp => {
      Object.assign(cfgMec, { coord: co, comp: cp }); tuRefrescar(true);
      const mv = TUTSIM.parsear(TU.prog.texto), u = mv[mv.length - 1];
      if (!u || Math.abs(u.x) > 1e-6 || Math.abs(u.y) > 1e-6 || TU.explic.length < TU.prog.lineas.length) mal.push(`${e.nombre} ${co} ${cp}`);
      // en G91 y mixta, todos los puntos del contorno se visitan
      const vis = mv.map(m => tuF(m.x) + ',' + tuF(m.y)); contornos.forEach(c => c.pts.forEach(q => { if (!vis.includes(tuF(q.x) + ',' + tuF(q.y)) && cp === 'G40') mal.push(`${e.nombre} ${co}: no pasa por ${tuF(q.x)},${tuF(q.y)}`); }));
    })); }); return mal; });
  ok('las 50 piezas de ejemplo × G90/G91/mixta × G40/G41-G42: el programa pasa por todos los puntos y vuelve al cero', !r.length, r.slice(0, 4).join(' | '));
  // 7) fresa grande y compensación del lado equivocado (tutor_compensacion.json: exterior antihorario con un arco cóncavo de R18,9)
  const pz = JSON.parse(fs.readFileSync(path.join(__dirname, 'tutor_compensacion.json'), 'utf8'));
  await p.evaluate(j => abrirJSONDatos(j), pz); await p.waitForTimeout(300); await p.evaluate(() => { TU.ejercicio = null; tuModo('aprender'); });
  const comp = async (c, d) => p.evaluate(([c, d]) => { const s = document.getElementById('tuCompSel'); s.value = c; s.dispatchEvent(new Event('change')); const e = document.getElementById('tuD'); e.value = d; e.dispatchEvent(new Event('input')); tuRefrescar(true); tuIrALinea(TU.prog.lineas.length - 1);
    // distancia del camino del centro (con compensación) al contorno: el radio de la fresa
    const cs = TU.sim.items.filter(x => x.tipo === 'xy' && !x.rapido && x.cg && x.cg !== x.sg && !x.puente && x.linea >= 9 && x.linea <= 11);
    const m = muestrearContorno(contornos[0]), dist = q => Math.min(...m.map((a, k) => { const b2 = m[(k + 1) % m.length], vx = b2.x - a.x, vy = b2.y - a.y, L = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((q.x - a.x) * vx + (q.y - a.y) * vy) / L)); return Math.hypot(a.x + vx * t - q.x, a.y + vy * t - q.y); }));
    return { T: cfgMec.T, aviso: !document.getElementById('tuAviso').hidden, malos: TU.prog.malos.size, d: cs.map(x => +dist({ x: (x.cg.p1.x + x.cg.p2.x) / 2, y: (x.cg.p1.y + x.cg.p2.y) / 2 }).toFixed(2)) };
  }, [c, d]);
  r = await comp('G41', 10);
  ok('G41 en un exterior antihorario: aviso «se come la pieza, aquí G42» y franja en rojo', r.aviso && r.malos === 1, JSON.stringify(r));
  r = await comp('G42', 10);
  ok('Ø10 con G42: sin aviso, el centro de la fresa a 5 mm del contorno (el Ø del Tutor, no el de T101 en la base)', !r.aviso && r.d.length === 3 && r.d.every(v => Math.abs(v - 5) < 0.05) && r.T !== 101, JSON.stringify(r));
  r = await comp('G42', 40);
  ok('Ø40: el centro de la fresa a 20 mm del contorno', r.d.length >= 2 && r.d.every(v => Math.abs(v - 20) < 0.05), JSON.stringify(r));
  r = await p.evaluate(() => { const e = document.getElementById('tuD'); e.value = 6; e.dispatchEvent(new Event('input')); return [cfgMec.T, document.getElementById('tuHerrNota').textContent]; });
  ok('Ø6: vuelve a la T101 de la base de herramientas', r[0] === 101 && /base de herramientas/.test(r[1]), JSON.stringify(r));
  ok('sin errores de JavaScript', !errs.length, errs.slice(0, 3).join(' | '));
  console.log('fallos', fallos); await b.close();
})();
