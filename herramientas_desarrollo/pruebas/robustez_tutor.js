// Robustez del Tutor: almacenamiento corrupto, JSON malformados, valores extremos en ⚙️ Mecanizado, ejemplos seguidos
const { lanzar, path, SUITE, fs } = require('./comun');
const T = require('os').tmpdir() + '/';
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const res = [];
  const pagina = async (prep) => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + path.join(SUITE, 'tutor.html')); await p.evaluate(() => localStorage.clear());
    if (prep) await p.evaluate(prep); await p.reload(); await p.waitForTimeout(1200); return { p, errs }; };
  const informe = async (n, p, errs, extra) => { const prog = await p.evaluate(() => TU.prog ? TU.prog.lineas.map(l => l.c).join('\n') : '(sin programa)').catch(e => 'EVAL: ' + e.message);
    const malo = /NaN|undefined|Infinity|null/.test(prog); res.push(`${errs.length || malo ? '✗' : '✓'} ${n}${errs.length ? ' · ERR ' + errs.slice(0, 2).join(' | ') : ''}${malo ? ' · programa con NaN/undefined: ' + (prog.match(/.*(NaN|undefined|Infinity|null).*/) || [''])[0] : ''}${extra ? ' · ' + extra : ''}`); };
  const conTiempo = (pr, ms) => Promise.race([pr, new Promise((_, r) => setTimeout(() => r(new Error('TIEMPO ' + ms + ' ms')), ms))]);

  // 1) almacenamiento corrupto
  for (const [n, k, v] of [['estado basura', 'tutor_estado', '{basura'], ['estado null', 'tutor_estado', 'null'], ['estado con contornos raros', 'tutor_estado', JSON.stringify({ contornos: [{ pts: [{ x: 'a' }], b: [] }, null, 5] })],
    ['ejercicio basura', 'tutor_ejercicio', '{"coord":5,"comp":{}}'], ['ejercicio texto', 'tutor_ejercicio', '"hola"'], ['nivel raro', 'tutor_nivel', '99']]) {
    const { p, errs } = await pagina(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`); await informe('arranque con ' + n, p, errs); await p.close(); }

  // 2) JSON malformados al abrir
  const casos = { vacio: '', texto: 'hola', nulo: 'null', array: '[]', sinCalc: '{"a":1}', calcVacio: '{"calcador":{}}', contornosMalos: '{"calcador":{"contornos":[{"pts":[]},{"pts":[{"x":0,"y":0}],"b":[0],"cerrado":true},{"pts":[{"x":0,"y":0},{"x":0,"y":0},{"x":0,"y":0}],"b":[0,0,0],"cerrado":true}]}}',
    ejercicioRaro: '{"calcador":{"contornos":[{"pts":[{"x":0,"y":0},{"x":50,"y":0},{"x":50,"y":30},{"x":0,"y":30}],"b":[0,0,0,0],"cerrado":true}]},"tutor":{"ejercicio":true,"coord":"G99","comp":"XYZ"}}',
    bulgeEnorme: '{"calcador":{"contornos":[{"pts":[{"x":0,"y":0},{"x":50,"y":0}],"b":[1e9,-1e9],"cerrado":true}]}}',
    coordsEnormes: '{"calcador":{"contornos":[{"pts":[{"x":1e12,"y":0},{"x":1e12,"y":1},{"x":0,"y":1e-12}],"b":[0,0,0],"cerrado":true}]}}' };
  for (const [n, txt] of Object.entries(casos)) { fs.writeFileSync(T + n + '.json', txt);
    const { p, errs } = await pagina(); try { await conTiempo(p.setInputFiles('#fileJSON', T + n + '.json'), 15000); await p.waitForTimeout(800);
      for (const c of ['G90', 'G91', 'mixta']) for (const k of ['G40', 'auto', 'G41']) await conTiempo(p.evaluate(([c, k]) => { cfgMec.coord = c; cfgMec.comp = k; tuPintarMec(); tuRefrescar(true); }, [c, k]), 15000);
      await informe('abrir JSON ' + n, p, errs); } catch (e) { res.push('✗ abrir JSON ' + n + ' · ' + e.message); } await p.close(); }

  // 3) valores extremos de ⚙️ Mecanizado sobre una pieza normal
  const PIEZA = path.join(SUITE, 'herramientas_desarrollo/pruebas/tutor_compensacion.json');
  for (const [n, vals] of [['Ø 0,01', { tuD: '0,01' }], ['Ø 500', { tuD: '500' }], ['Ø letras', { tuD: 'abc' }], ['prof 1000 paso 0,001', { tuProf: '1000', tuPaso: '0,001' }], ['prof 0', { tuProf: '0' }], ['paso -3', { tuPaso: '-3' }],
    ['F 1e9', { tuF: '1e9' }], ['S 0', { tuS: '0' }], ['T 0', { tuT: '0' }], ['T 99999', { tuT: '99999' }], ['T -5', { tuT: '-5' }], ['coma decimal 2,5', { tuProf: '2,5' }]]) {
    const { p, errs } = await pagina(); await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(800);
    try { for (const [id, v] of Object.entries(vals)) await conTiempo(p.evaluate(([id, v]) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]), 20000);
      await p.waitForTimeout(400);
      for (const c of ['G90', 'G91', 'mixta']) for (const k of ['G40', 'auto']) await conTiempo(p.evaluate(([c, k]) => { cfgMec.coord = c; cfgMec.comp = k; tuPintarMec(); tuRefrescar(true); }, [c, k]), 20000);
      const n2 = await p.evaluate(() => TU.prog.lineas.length); await informe('Mecanizado ' + n, p, errs, n2 + ' líneas');
    } catch (e) { res.push('✗ Mecanizado ' + n + ' · ' + e.message); } await p.close(); }

  // 4) Practicar con entradas raras
  { const { p, errs } = await pagina(); await p.setInputFiles('#fileJSON', PIEZA); await p.waitForTimeout(800);
    await p.evaluate(() => tuModo('practicar')); await p.waitForTimeout(300);
    const raras = ['', '   ', ';;;', '((((', 'G', 'G1 X', 'X1e400', 'G1 X--5', 'G1 X5 X6', 'N10 N20', 'G999', 'M999', 'G1 X' + '9'.repeat(400), '💥 G1', 'g1 x5 y5', 'G01X5Y5', 'G1 X5,5', 'T', 'S', 'F-100', 'G2 X10 Y10 R0', 'G2 X10 Y10 I0 J0', 'G3 R-5', '%', 'O1234', '<script>alert(1)</script>', 'G1 X5 ; comentario (con paréntesis'];
    const r = []; for (const l of raras) { const x = await conTiempo(p.evaluate(l => { try { const inp = document.querySelector('#tuPractica input, #tuPractica textarea'); if (!inp) return 'sin campo'; inp.value = l; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 'ok'; } catch (e) { return 'EXC ' + e.message; } }, l), 8000).catch(e => e.message); if (x !== 'ok') r.push(l.slice(0, 20) + ': ' + x); }
    await p.evaluate(() => { for (let i = 0; i < 3; i++) tuPista(); tuVerLinea && tuVerLinea(); }).catch(e => r.push('pista: ' + e.message));
    const xss = await p.evaluate(() => !!document.querySelector('#tuPractica script'));
    await informe('Practicar con 27 entradas raras', p, errs, (r.join(' / ') || 'sin excepciones') + (xss ? ' · ¡script inyectado!' : ''));
    await p.close(); }

  // 5) cambios rápidos de modo, ejemplos y niveles
  { const { p, errs } = await pagina();
    try { await conTiempo(p.evaluate(async () => { for (let i = 0; i < TU_EJEMPLOS.length; i++) { tuCargarEjemplo(i); tuModo(i % 2 ? 'practicar' : 'aprender'); tuNivel(1 + i % 3); tuPestana(['programa', 'puntos', 'contornos'][i % 3]); tuPaso(1); tuPlay(); tuFin(); tuInicio(); } await new Promise(r => setTimeout(r, 1500)); }), 60000);
      await informe('50 ejemplos seguidos con cambios de modo, nivel y pestaña', p, errs); } catch (e) { res.push('✗ ejemplos seguidos · ' + e.message); } await p.close(); }

  // 6) Practicar + ⚙️ cambiar coordenadas a mitad; Nuevo en mitad de ejercicio; dibujar en ejercicio
  { const { p, errs } = await pagina();
    await p.evaluate(() => { const i = TU_EJEMPLOS.findIndex(e => e.ejercicio); tuCargarEjemplo(i); }); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const out = []; try { setHerramienta('linea'); out.push('herr=' + herramienta); nuevo(); out.push('tras nuevo: ejercicio=' + !!TU.ejercicio + ' modo=' + TU.modo); deshacer && deshacer(); out.push('deshacer: ej=' + !!TU.ejercicio + ' cont=' + contornos.length); } catch (e) { out.push('EXC ' + e.message); } return out.join(' · '); });
    await p.waitForTimeout(500); await informe('ejercicio → Nuevo → Deshacer', p, errs, r); await p.close(); }

  console.log(res.join('\n')); await b.close();
})();
