// Robustez del Calcador (interfaz v95): almacenamiento corrupto, todos los ejercicios en Solución/Máquina, campos raros, geometrías raras, Tutor y Simulador
const { lanzar, path, SUITE, fs, ejercicios } = require('./comun');
const T = require('os').tmpdir() + '/';
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const res = [];
  const pagina = async (prep) => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + path.join(SUITE, 'calcador.html')); await p.evaluate(() => localStorage.clear()); if (prep) await p.evaluate(prep); await p.reload(); await p.waitForTimeout(1200); return { p, errs }; };
  const conTiempo = (pr, ms) => Promise.race([pr, new Promise((_, r) => setTimeout(() => r(new Error('TIEMPO ' + ms + ' ms')), ms))]);
  const prog = p => p.evaluate(() => TU.prog ? TU.prog.lineas.map(l => l.c).join('\n') : '');
  const informe = async (n, p, errs, extra) => { const t = await prog(p).catch(e => 'EVAL ' + e.message); const malo = /NaN|undefined|Infinity|\bnull\b/.test(t);
    res.push(`${errs.length || malo ? '✗' : '✓'} ${n}${errs.length ? ' · ERR ' + [...new Set(errs)].slice(0, 2).join(' | ') : ''}${malo ? ' · ' + (t.match(/.*(NaN|undefined|Infinity|\bnull\b).*/) || [''])[0] : ''}${extra ? ' · ' + extra : ''}`); };

  // 1) almacenamiento corrupto
  for (const [n, k, v] of [['estado basura', 'calcador_estado', '{x'], ['cfgMec raro', 'calcador_estado', JSON.stringify({ cfgMec: { prof: 'a', paso: -1, coord: 'G99', comp: 5, T: null } })]]) {
    const { p, errs } = await pagina(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`); await informe('arranque con ' + n, p, errs); await p.close(); }

  // 2) cada ejercicio de la suite: Solución y Máquina, G90/G91/mixta × G40/auto, con el reproductor hasta el final
  const fs_ = ejercicios().filter(f => { try { return !!JSON.parse(fs.readFileSync(f, 'utf8')).calcador; } catch (e) { return false; } });
  { const { p, errs } = await pagina(); let n = 0, lentos = []; const t0 = Date.now(); const raros = [];
    for (const f of fs_) { const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      try { const r = await conTiempo(p.evaluate(d => { abrirJSONDatos(d); const out = []; const t = performance.now();
        for (const fu of ['solucion', 'maquina']) { tuFuente(fu); for (const c of ['G90', 'G91', 'mixta']) for (const k of ['G40', 'auto']) { cfgMec.coord = c; cfgMec.comp = k; tuPintarMec(); tuRefrescar(true);
          const txt = TU.prog.lineas.map(l => l.c).join('\n'); if (/NaN|undefined|Infinity/.test(txt)) out.push(fu + ' ' + c + ' ' + k + ': ' + (txt.match(/.*(NaN|undefined|Infinity).*/) || [''])[0]);
          tuFin(); tuInicio(); } }
        tuFuente('solucion'); return { out, ms: performance.now() - t }; }, d), 60000);
        n++; if (r.out.length) raros.push(f.split('/').pop() + ': ' + r.out[0]); if (r.ms > 8000) lentos.push(f.split('/').pop() + ' ' + Math.round(r.ms) + ' ms');
      } catch (e) { raros.push(f.split('/').pop() + ': ' + e.message); } }
    await informe(`${n} ejercicios × Solución/Máquina × 3 coordenadas × 2 compensaciones (${Math.round((Date.now() - t0) / 1000)} s)`, p, errs, (raros.slice(0, 4).join(' / ') || 'sin NaN') + (lentos.length ? ' · lentos: ' + lentos.slice(0, 4).join(', ') : ''));
    await p.close(); }

  // 3) campos del panel ⚙️ Mecanizado con valores raros y la Ventana de Mecanizar con lo mismo
  const PIEZA = path.join(SUITE, 'herramientas_desarrollo/pruebas/Prueba01.json');
  for (const [n, vals] of [['vacíos', { tuProf: '', tuPaso: '', tuF: '', tuS: '', tuZseg: '', tuF0: '', tuAcab: '' }], ['letras', { tuProf: 'x', tuD: 'y', tuT: 'z' }], ['negativos', { tuProf: '-3', tuAcab: '-1', tuZseg: '-5' }],
      ['acabado mayor que la profundidad', { tuProf: '2', tuAcab: '5' }], ['Ø enorme', { tuD: '400' }], ['paso 0,001 prof 50', { tuProf: '50', tuPaso: '0,001' }], ['T 999', { tuT: '999' }]]) {
    const { p, errs } = await pagina(); await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(700);
    try { await p.evaluate(() => tuFuente('maquina'));
      for (const [id, v] of Object.entries(vals)) await conTiempo(p.evaluate(([id, v]) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]), 60000);
      await p.waitForTimeout(500);
      const v = await conTiempo(p.evaluate(() => { abrirMec(); generarMec(); const nc = document.getElementById('mecTexto').value; const r = { lineas: nc.split('\n').length, malo: /NaN|undefined|Infinity/.test(nc), resumen: document.getElementById('mecResumen').innerText.slice(0, 80), cfg: JSON.stringify(cfgMec).slice(0, 160) }; cerrarMec(); return r; }), 60000);
      await informe('Mecanizado ' + n, p, errs, `panel ${await p.evaluate(() => TU.prog.lineas.length)} líneas · ventana ${v.lineas} líneas${v.malo ? ' ¡NaN!' : ''} · ${v.resumen.replace(/\s+/g, ' ')}`);
    } catch (e) { res.push('✗ Mecanizado ' + n + ' · ' + e.message); } await p.close(); }

  // 4) geometrías raras: solo texto, solo trazos abiertos, contorno de 2 puntos, cajera sin exterior, nada
  { const { p, errs } = await pagina(); const r = [];
    for (const [n, f] of [['nada', () => { contornos = []; refrescar(); }],
      ['solo un texto', () => { contornos = []; Object.assign(cfgTexto, { texto: 'AB' }); clicTexto({ x: 10, y: 10 }); refrescar(); }],
      ['solo un trazo abierto', () => { contornos = [{ pts: [{ x: 0, y: 0 }, { x: 30, y: 10 }, { x: 50, y: 0 }], b: [0, 0.4, 0], cerrado: false, tipo: 'auto' }]; refrescar(); }],
      ['contorno de un punto', () => { contornos = [{ pts: [{ x: 5, y: 5 }], b: [0], cerrado: true, tipo: 'auto' }]; refrescar(); }],
      ['cajera sola con isla', () => { contornos = [{ pts: [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 30 }, { x: 0, y: 30 }], b: [0, 0, 0, 0], cerrado: true, tipo: 'auto', mec: { op: 'cajera', prof: 3, caj: { estr: 'zigzag', paso: 50, entrada: 'rampa' } } }, { pts: [{ x: 25, y: 15 }, { x: 15, y: 15 }], b: [1, 1], cerrado: true, tipo: 'auto', mec: { op: 'isla' } }]; refrescar(); }],
      ['puntos repetidos', () => { contornos = [{ pts: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }], b: [0, 0, 0, 0, 0], cerrado: true, tipo: 'auto' }]; refrescar(); }]]) {
      for (const fu of ['solucion', 'maquina']) for (const k of ['G40', 'auto', 'G42']) {
        const x = await conTiempo(p.evaluate(([fs, fu, k]) => { try { (0, eval)('(' + fs + ')')(); tuFuente(fu); cfgMec.comp = k; tuPintarMec(); tuRefrescar(true); tuFin(); tuPestana('puntos'); tuPestana('contornos'); tuPestana('programa'); const t = TU.prog.lineas.map(l => l.c).join('\n'); return /NaN|undefined|Infinity/.test(t) ? 'NaN: ' + (t.match(/.*(NaN|undefined|Infinity).*/) || [''])[0] : 'ok'; } catch (e) { return 'EXC ' + e.message; } }, [f.toString(), fu, k]), 20000).catch(e => e.message);
        if (x !== 'ok') r.push(`${n} ${fu} ${k}: ${x}`); } }
    await informe('geometrías raras × Solución/Máquina × G40/auto/G42', p, errs, r.slice(0, 6).join(' / ') || 'todas bien'); await p.close(); }

  // 5) pestañas, herramientas y selección a toda velocidad
  { const { p, errs } = await pagina(); await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(700);
    const hs = await p.evaluate(() => [...document.querySelectorAll('#toolStrip .tool-btn[data-h]')].map(b => b.dataset.h));
    await p.evaluate(hs => { for (let i = 0; i < 200; i++) { setHerramienta(hs[i % hs.length]); if (i % 7 === 0) { sel = i % contornos.length; selSet = new Set([sel]); refrescar(); } if (i % 11 === 0) tuFuente(i % 2 ? 'maquina' : 'solucion'); document.querySelectorAll('.c2-tabs-izq button')[i % 8] && document.querySelectorAll('.c2-tabs-izq button')[i % 8].click(); } setHerramienta('editar'); }, hs);
    await p.waitForTimeout(800);
    const vis = await p.evaluate(() => [...document.querySelectorAll('.c2-tabs-izq')].map(t => [...t.querySelectorAll('button')].filter(b => !document.getElementById(b.dataset.p).hidden).length).join(','));
    await informe('200 cambios de herramienta, selección, fuente y pestaña', p, errs, 'pestañas visibles por grupo: ' + vis); await p.close(); }

  // 6) ida y vuelta: Calcador → «Para el Tutor» → Tutor; Calcador → Simulador 3D (Solución y Máquina)
  { const { p, errs } = await pagina(); await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(700);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => exportarEjercicioTutor())]); const ruta = T + 'ej_tutor.json'; await dl.saveAs(ruta);
    const tp = await ctx.newPage(); const terr = []; tp.on('pageerror', e => terr.push(e.message)); await tp.goto('file://' + path.join(SUITE, 'tutor.html')); await tp.waitForTimeout(1000);
    await tp.setInputFiles('#fileJSON', ruta); await tp.waitForTimeout(900);
    const st = await tp.evaluate(() => ({ ej: !!TU.ejercicio, modo: TU.modo, n: contornos.length }));
    res.push(`${terr.length ? '✗' : '✓'} Calcador → 🎓 Para el Tutor → Tutor · ${JSON.stringify(st)} ${terr.join(' | ')}`); await tp.close();
    for (const fu of ['solucion', 'maquina']) {
      await p.evaluate(fu => tuFuente(fu), fu);
      const [sim] = await Promise.all([ctx.waitForEvent('page'), p.evaluate(() => tuEnviarSimulador())]); const serr = []; sim.on('pageerror', e => serr.push(e.message));
      await sim.waitForTimeout(2500); const s = await sim.evaluate(() => ({ mov: gcodeMoves.length, plano: !!(window.planoEjercicio || window.plano), rev: document.querySelector('#revisionResumen, .revision-resumen') ? document.querySelector('#revisionResumen, .revision-resumen').textContent.slice(0, 60) : '' })).catch(e => ({ e: e.message }));
      res.push(`${serr.length || !s.mov ? '✗' : '✓'} Calcador (${fu}) → ➜ Simulador 3D · ${JSON.stringify(s)} ${serr.join(' | ')}`); await sim.close(); }
    await informe('(errores del Calcador en las idas y vueltas)', p, errs); await p.close(); }

  console.log(res.join('\n')); await b.close();
})();
