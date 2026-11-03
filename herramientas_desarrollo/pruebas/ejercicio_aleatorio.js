// Calcador v86: 🧩 Ejercicio aleatorio. Reglas en cientos de semillas (tamaño, cotas en múltiplos del paso, interiores
// dentro con su pared, piezas separadas, huecos para la fresa), la misma semilla da el mismo ejercicio, usar, deshacer,
// JSON, y el programa de ⚙️ Mecanizar de varias propuestas en el Simulador (sin meterse en la pieza).
// Uso: node ejercicio_aleatorio.js
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
  let fallos = 0; const ok = (n, c, info) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${info ? ' · ' + info : ''}`); };
  const CFGS = [
    { nombre:'por defecto', cfg:{} },
    { nombre:'cotas de 1 mm, todas las formas, 1 a 4 interiores', cfg:{ paso:1, ext:['rectangulo', 'poligono', 'estrella', 'circulo', 'ranura'], int:['circulo', 'rectangulo', 'ranura', 'poligono', 'estrella'], iMin:1, iMax:4 } },
    { nombre:'2 a 4 piezas, cotas de 10', cfg:{ pMin:2, pMax:4, paso:10, iMin:0, iMax:2 } },
    { nombre:'girado, fresa de 10, pared de 12', cfg:{ girar:true, fresa:10, pared:12, ext:['rectangulo', 'poligono', 'ranura', 'circulo'] } },
    { nombre:'pequeño (120 × 80), sin interiores', cfg:{ ancho:120, alto:80, iMin:0, iMax:0 } },
    { nombre:'esquinas y lados al 70 %, rectángulos, polígonos y estrellas', cfg:{ pEsq:70, pLado:70, ext:['rectangulo', 'poligono', 'estrella'], int:['rectangulo', 'poligono', 'circulo'], iMin:1, iMax:3 } },
    { nombre:'esquinas y lados, fresa de 12, cotas de 1', cfg:{ pEsq:60, pLado:40, fresa:12, pared:10, paso:1, pMin:1, pMax:2 } },
    { nombre:'nivel 1 (solo rectas horizontales y verticales)', nivel:'rectas', cfg:{ iMin:1, iMax:3 } },
    { nombre:'nivel 2 (chaflanes)', nivel:'inclinadas', cfg:{ iMin:1, iMax:3 } },
    { nombre:'nivel 3 (arcos con I J enteros)', nivel:'tangentes', cfg:{ iMin:1, iMax:3 } },
    { nombre:'nivel 4 (arcos con I J calculados)', nivel:'ij', cfg:{ iMin:1, iMax:3, pMin:1, pMax:2 } },
  ];
  for (const C of CFGS) {
    const r = await p.evaluate(([C, nivel]) => {
      const cfg = Object.assign(JSON.parse(JSON.stringify(GEN_CFG0)), nivel ? GEN_NIVELES[nivel].p : {}, C), q = cfg.paso, D = cfg.fresa, malos = [];
      // comprobación independiente de solapes: los bordes, cada 0,5 mm, dentro del otro
      const denso = P => { const o = []; P.forEach((a, i) => { const b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(dist(a, b) / 0.5)); for (let k = 0; k < n; k++) o.push(add(a, mulv(sub(b, a), k / n))); }); return o; };
      const solapan = (A, B) => { const a = denso(A), b = denso(B); return a.some(p => puntoEnPoligono(p, B)) || b.some(p => puntoEnPoligono(p, A)); };
      const enR = v => Math.abs(v / q - Math.round(v / q)) < 1e-6;
      const enRej = v => Math.abs(v / q - Math.round(v / q)) < 1e-6;
      let piezas = 0, ints = 0, vacios = 0; const mods = { r:0, c:0, ch:0, fuera:0, dentro:0 };
      for (let s = 1000; s < 1150; s++) {
        const e = generarEjercicio(s, cfg), cs = e.contornos; if (!cs.length) { vacios++; continue; }
        const M = cs.map(genMuestras), bb = bboxPts([].concat(...M));
        if (bb.x0 < -1e-6 || bb.y0 < -1e-6 || bb.x1 > cfg.ancho + 1e-6 || bb.y1 > cfg.alto + 1e-6) malos.push(`${s}: se sale del tamaño (${bb.x1.toFixed(1)} × ${bb.y1.toFixed(1)})`);
        if (Math.abs(bb.x0) > q + 1e-6 || Math.abs(bb.y0) > q + 1e-6) malos.push(`${s}: el conjunto no empieza en el cero pieza`);
        // exteriores e interiores: cada contorno, dentro de otro (interior) o no (exterior)
        const dentroDe = i => cs.findIndex((c, j) => j !== i && M[i].every(pt => puntoEnPoligono(pt, M[j])));
        const ext = cs.map((c, i) => dentroDe(i) < 0);
        cs.forEach((c, i) => {
          const f = c.forma;
          if (seCruza(c)) malos.push(`${s}: un contorno se cruza consigo mismo`);
          // cada nivel, con lo suyo
          const T = tramos(c);
          if (nivel === 'rectas' && !T.every(t => !t.b && (Math.abs(t.p1.x - t.p2.x) < 1e-9 || Math.abs(t.p1.y - t.p2.y) < 1e-9) && enR(t.p1.x) && enR(t.p1.y))) malos.push(`${s}: nivel 1 con algo que no es recta horizontal o vertical en la rejilla`);
          if (nivel === 'inclinadas' && !T.every(t => !t.b && enR(t.p1.x) && enR(t.p1.y))) malos.push(`${s}: nivel 2 con un arco o un punto fuera de la rejilla`);
          if (nivel === 'tangentes' && !T.every(t => { if (!enR(t.p1.x) || !enR(t.p1.y)) return false; if (!t.b) return true; const a = arcoDeBulge(t.p1, t.p2, t.b); return Math.abs(a.c.x - Math.round(a.c.x)) < 1e-6 && Math.abs(a.c.y - Math.round(a.c.y)) < 1e-6; })) malos.push(`${s}: nivel 3 con un punto o un centro de arco que no es entero`);
          if (!genArcosOK(c, ext[i], D)) malos.push(`${s}: un arco que la fresa recorre por dentro es más pequeño que su diámetro`);
          // los modificadores que salen (por su forma: en los rectángulos con receta, sus esquinas; en el resto, los arcos y chaflanes)
          if (f && f.esq) f.esq.forEach(e => { if (e.t !== 'v') mods[e.t]++; });
          if (!f) { const o = Math.sign(areaFirmada(c.pts)); c.b.forEach((bb, k) => { if (!bb) return; const a = arcoDeBulge(c.pts[k], c.pts[(k + 1) % c.pts.length], bb); if (Math.abs(a.theta) < Math.PI / 1.9 && a.r > 0) mods[Math.sign(bb) === o ? 'fuera' : 'dentro']++; }); }
          if (!cfg.girar && f) {   // cotas en múltiplos del paso
            if (f.tipo === 'rectangulo' && !(enRej(f.c.x - f.w / 2) && enRej(f.c.y - f.h / 2) && enRej(f.w) && enRej(f.h))) malos.push(`${s}: rectángulo fuera de la rejilla`);
            if (f.tipo === 'circulo' && !(enRej(f.c.x) && enRej(f.c.y) && enRej(f.r))) malos.push(`${s}: círculo fuera de la rejilla`);
            if (f.tipo === 'ranura' && !(c.pts.every(pt => enRej(pt.x) && enRej(pt.y)) && enRej(f.w / 2))) malos.push(`${s}: coliso fuera de la rejilla`);
            if ((f.tipo === 'poligono' || f.tipo === 'estrella') && !(enRej(f.c.x) && enRej(f.c.y))) malos.push(`${s}: centro de ${f.tipo} fuera de la rejilla`);
            if (f.tipo === 'poligono' && !enRej(Math.min(...c.pts.map(pt => pt.y)))) malos.push(`${s}: el lado de abajo del polígono fuera de la rejilla`);
          }
          if (ext[i]) { piezas++; return; }
          ints++;
          const j = dentroDe(i);
          if (!ext[j]) malos.push(`${s}: un interior dentro de otro interior`);
          if (genDistPoligonos(M[i], M[j]) < cfg.pared - 1e-6) malos.push(`${s}: pared de ${genDistPoligonos(M[i], M[j]).toFixed(2)} < ${cfg.pared}`);
          if (c.grupo !== cs[j].grupo || !c.grupo) malos.push(`${s}: el interior no va en el grupo de su pieza`);
          // el hueco cabe para la fresa: el círculo inscrito más grande, de más de dos diámetros
          const bi = bboxPts(M[i]), tam = !f ? 0 : f.tipo === 'circulo' ? 2 * f.r : f.tipo === 'ranura' ? f.w : f.tipo === 'rectangulo' ? Math.min(f.w, f.h) : f.tipo === 'poligono' ? 2 * f.R * Math.cos(Math.PI / f.N) : 2 * f.Ri;
          if (f && tam < 2 * D - 1e-6) malos.push(`${s}: hueco ${f.tipo} de ${tam.toFixed(2)} < 2 × Ø${D}`);
        });
        // interiores de la misma pieza, separados por la pared
        for (let a = 0; a < cs.length; a++) for (let c2 = a + 1; c2 < cs.length; c2++) {
          if (ext[a] && ext[c2]) { const d = genDistPoligonos(M[a], M[c2]); if (d < D + 4 - 1e-6) malos.push(`${s}: piezas a ${d.toFixed(2)} mm (< Ø + 4)`); }
          else if (!ext[a] && !ext[c2] && dentroDe(a) === dentroDe(c2) && genDistPoligonos(M[a], M[c2]) < cfg.pared - 1e-6) malos.push(`${s}: dos interiores a menos de la pared`);
          if (!ext[a] && !ext[c2] && solapan(M[a], M[c2])) malos.push(`${s}: dos interiores se solapan`);
          if (ext[a] !== ext[c2]) { const [h, e2] = ext[a] ? [c2, a] : [a, c2]; if (dentroDe(h) === e2) { const dn = denso(M[h]); if (!dn.every(pt => puntoEnPoligono(pt, M[e2]))) malos.push(`${s}: un interior se sale de su pieza`); } }
        }
        if (e.piezas < cfg.pMin && !e.avisos.length) malos.push(`${s}: ${e.piezas} piezas sin aviso`);
      }
      return { malos, piezas, ints, vacios, mods };
    }, [C.cfg, C.nivel || null]);
    ok(`150 ejercicios (${C.nombre}): cumplen las reglas`, !r.malos.length, `${r.piezas} piezas, ${r.ints} interiores${r.vacios ? `, ${r.vacios} vacíos` : ''}${C.cfg.pEsq ? ' · ' + JSON.stringify(r.mods) : ''}${r.malos.length ? ' · ' + r.malos.slice(0, 4).join(' | ') : ''}`);
    if (C.cfg.pEsq === 70) ok('salen los cinco modificadores (redondeada, hacia dentro, chaflán, arco abombado y hundido)', Object.values(r.mods).every(v => v > 0), JSON.stringify(r.mods));
    if (C.cfg.pEsq === undefined && !C.cfg.ancho && !C.nivel) {
      const sinMod = await p.evaluate(C => { const cfg = Object.assign(JSON.parse(JSON.stringify(GEN_CFG0)), C); const v = JSON.parse(JSON.stringify(cfg)); delete v.pEsq; delete v.pLado; delete v.esq; delete v.lado; delete v.modInt;
        const f = e => JSON.stringify(e.contornos.map(c => [c.pts, c.b])); let iguales = 0; for (let s = 1000; s < 1030; s++) if (f(generarEjercicio(s, v)) === f(generarEjercicio(s, Object.assign({}, cfg, { pEsq:0, pLado:0 })))) iguales++; return iguales; }, C.cfg);
      ok(`(${C.nombre}) un JSON de la v86, sin modificadores, da la misma pieza que con los modificadores a 0 %`, sinMod === 30, sinMod + ' de 30');
    }
  }
  // la misma semilla da el mismo ejercicio
  const igual = await p.evaluate(() => { const f = e => JSON.stringify(e.contornos.map(c => [c.forma, c.pts])); return f(generarEjercicio(4242, cfgGen)) === f(generarEjercicio(4242, cfgGen)) && f(generarEjercicio(4242, cfgGen)) !== f(generarEjercicio(4243, cfgGen)); });
  ok('la misma semilla da el mismo ejercicio (y otra, otro)', igual);
  // la ventana: seis propuestas; clic en una: pasa al dibujo
  await p.evaluate(() => { contornos.push({ pts:[{ x:0, y:0 }, { x:10, y:0 }], b:[0, 0], cerrado:false, tipo:'auto' }); refrescar(); });
  await p.click('button[onclick="abrirGenerador()"]'); await p.waitForTimeout(300);
  ok('la ventana enseña seis propuestas', await p.evaluate(() => document.querySelectorAll('#genLista .gen-ficha').length === 6));
  await p.selectOption('#genPaso', '10'); await p.waitForTimeout(200);
  ok('cambiar un parámetro rehace las propuestas y se recuerda', await p.evaluate(() => cfgGen.paso === 10 && JSON.parse(localStorage.getItem('calcador_generador')).paso === 10));
  const s0 = await p.evaluate(() => +document.querySelector('#genLista .gen-ficha').dataset.s);
  await p.click('#genLista .gen-ficha'); await p.waitForTimeout(300);
  const est = await p.evaluate(() => ({ n: contornos.length, abierto: document.getElementById('modalGenerador').classList.contains('visible'), nombre: document.getElementById('projectName').value, tipos: tiposResueltos ? tiposResueltos() : null, gen: genUltimo }));
  ok('clic en una propuesta: pasa al dibujo, con su nombre, y la ventana se cierra', est.n > 0 && !est.abierto && est.nombre === 'Ejercicio aleatorio ' + s0 && est.gen.semilla === s0, JSON.stringify({ n: est.n, nombre: est.nombre }));
  ok('las formas sin cambios, y los rectángulos con solo esquinas, siguen siendo editables (con su receta)', await p.evaluate(() => contornos.filter(c => c.forma).every(c => formaVigente(c))));   // la propuesta es al azar: puede no llevar formas con receta
  const tipos = await p.evaluate(() => { const t = tiposResueltos(); return contornos.map((c, i) => t[i]); });
  const esp = await p.evaluate(() => { const r = generarEjercicio(genUltimo.semilla, genUltimo.cfg); return r.interiores; });
  ok('el Calcador reconoce los interiores', tipos.filter(t => t === 'interior').length === esp, JSON.stringify(tipos));
  await p.keyboard.press('Control+z');
  ok('Ctrl+Z vuelve al dibujo de antes', await p.evaluate(() => contornos.length === 1 && !contornos[0].cerrado));
  await p.keyboard.press('Control+y');
  const j = await p.evaluate(() => exportarJSON(true));
  ok('el JSON guarda el número y los parámetros', j.calcador.generado && j.calcador.generado.semilla === s0 && j.calcador.generado.cfg.paso === 10);
  await p.evaluate(() => nuevo()); ok('Nuevo lo olvida', await p.evaluate(() => genUltimo === null));
  await p.evaluate(d => abrirJSONDatos(d), j); ok('al abrir el JSON vuelve', await p.evaluate(s => genUltimo && genUltimo.semilla === s, s0));
  // la serie para la clase: a la biblioteca, cada uno con su número de orden
  const serie = await p.evaluate(async () => { genBase = 61000; elegirNivel('tangentes'); document.getElementById('genSerieN').value = 5; const ids = await guardarSerieBib();
    await bibCargar(); const es = ids.map(id => bib.lista.find(e => e.id === id));
    return { n: ids.length, rutas: es.map(e => e.ruta), num: es.map(e => e.datos.calcador.cfgHoja.num), sem: es.map(e => e.datos.calcador.generado.semilla), cotas: es.every(e => e.datos.calcador.cfgCotas.ver), nombre: document.getElementById('projectName').value, genU: genUltimo && genUltimo.semilla }; });
  ok('serie: 5 ejercicios en la biblioteca, en su carpeta, numerados del 1 al 5 y con su número de semilla', serie.n === 5 && serie.rutas.every((r, k) => r.startsWith('Aleatorios/Serie 61000 - nivel 3/') && r.endsWith(`Nº ${61000 + k}.json`)) && serie.num.join() === '1,2,3,4,5' && serie.sem.join() === '61000,61001,61002,61003,61004' && serie.cotas, JSON.stringify(serie.rutas.slice(0, 2)));
  ok('guardar la serie no cambia el dibujo abierto', serie.nombre !== 'Ejercicio aleatorio 61004' && serie.genU === s0, `${serie.nombre} · ${serie.genU}`);
  const nivelLibre = await p.evaluate(() => { elegirNivel('rectas'); document.getElementById('genPEsq').value = 20; cambiarGenerador(); return cfgGen.nivel; });
  ok('al cambiar algo a mano, el nivel pasa a «Libre»', nivelLibre === 'libre');
  // ⚙️ Mecanizar de varias propuestas, en el Simulador: compensación según el trazado, sin meterse en la pieza y todo el contorno cortado
  const sim = await ctx.newPage(); sim.on('pageerror', e => errs.push('sim: ' + e.message)); sim.on('dialog', d => d.accept());
  await sim.goto('file://' + path.join(SUITE, 'simulador3d.html')); await sim.waitForTimeout(1200);
  const res = [], GEN_NIVELES_P = await p.evaluate(() => Object.fromEntries(Object.entries(GEN_NIVELES).filter(([k, v]) => v.p).map(([k, v]) => [k, v.p])));
  for (const [s, extra] of [[2001, {}], [2002, { pMin:2, pMax:3 }], [2003, { ext:['estrella', 'poligono'], int:['circulo', 'poligono'] }], [2004, { girar:true }], [2005, { paso:1, iMin:2, iMax:4 }], [2006, { pEsq:80, pLado:60, ext:['rectangulo', 'poligono'], int:['rectangulo', 'poligono'] }], [2007, { pEsq:80, pLado:60, pMin:2, pMax:3, ext:['estrella', 'rectangulo'], int:['rectangulo', 'circulo'] }], [2008, { pEsq:70, pLado:70, fresa:10, pared:10 }], [2009, GEN_NIVELES_P.rectas], [2010, GEN_NIVELES_P.inclinadas], [2011, Object.assign({ pMin:2, pMax:2 }, GEN_NIVELES_P.tangentes)], [2012, GEN_NIVELES_P.ij]]) {
    const d = await p.evaluate(([s, extra]) => { Object.assign(cfgGen, JSON.parse(JSON.stringify(GEN_CFG0)), extra); usarEjercicio(s); cfgFresa.d = cfgGen.fresa;
      abrirMec(); cfgMec.comp = 'auto'; cfgMec.coord = 'G90'; cfgMec.estr = 'plano'; pintarCamposMec(); generarMec(); cerrarMec();
      return { nc: document.getElementById('mecTexto').value, json: exportarJSON(true) }; }, [s, extra]);
    const r = await sim.evaluate(({ nc, json }) => { cargarGcodeTexto(nc, 'g.nc'); cargarPlano(json, 'g'); const t = document.getElementById('planoEval').innerText; const rev = revisarPrograma().filter(x => x.nivel === 'error').map(x => x.msg);
      return { pc: +((t.match(/mecanizado:\s*([\d.,]+)/) || [])[1] || '0').replace(',', '.'), mete: /Se mete en la pieza/.test(t), rev }; }, d);
    res.push(`${s}: ${r.pc} %${r.mete ? ' · SE METE' : ''}${r.rev.length ? ' · ' + r.rev[0] : ''}`);
    ok(`Nº ${s}: ⚙️ Mecanizar en el Simulador, todo cortado y sin meterse en la pieza`, r.pc >= 99.9 && !r.mete && !r.rev.length, res[res.length - 1]);
  }
  // el Corrector (visor) no tiene el botón y abre el JSON
  const co = await ctx.newPage(); co.on('pageerror', e => errs.push('corrector: ' + e.message)); await co.goto('file://' + path.join(SUITE, 'corrector.html')); await co.waitForTimeout(600);
  await co.evaluate(d => abrirJSONDatos(d), j);
  ok('Corrector: sin el botón, y abre el ejercicio generado', await co.evaluate(() => { const b = document.querySelector('button[onclick="abrirGenerador()"]'); return (!b || b.offsetParent === null) && contornos.length > 0; }));
  ok('sin errores de JavaScript', !errs.length, errs.join(' | '));
  await b.close(); console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
