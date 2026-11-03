// Robustez del Simulador (V44): campos de la herramienta raros, T sin base, M04, varias herramientas, programa largo
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  const res = []; const conTiempo = (pr, ms) => Promise.race([pr, new Promise((_, r) => setTimeout(() => r(new Error('TIEMPO ' + ms + ' ms')), ms))]);
  const paso = async (n, f) => { const e0 = errs.length; let x; try { x = await conTiempo(f(), 30000); } catch (e) { x = 'EXC ' + e.message; } res.push(`${errs.length > e0 || /EXC|NaN/.test(String(x)) ? '✗' : '✓'} ${n}${x ? ' · ' + x : ''}${errs.length > e0 ? ' · ERR ' + errs.slice(e0).join(' | ') : ''}`); };
  const cargar = t => p.evaluate(t => { cargarGcodeTexto(t, 'p.nc'); irAlFinal(); return gcodeMoves.length + ' mov'; }, t);
  const campo = (id, v) => p.evaluate(([id, v]) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    irAlFinal(); return `Ø${diametroFresa} ${tipoFresa} ${anguloV}° · campo «${el.value}» · ${JSON.stringify(herrPanel)}`; }, [id, v]);
  const P1 = 'G90\nT101 M06\nS12000 M03\nG0 X10 Y30 Z5\nG1 Z-3 F300\nG1 X90 F1000\nG0 Z5\nM05\nM30';
  await paso('programa con T101', () => cargar(P1));
  for (const [id, v] of [['diamHerramienta', ''], ['diamHerramienta', '0'], ['diamHerramienta', '-4'], ['diamHerramienta', 'abc'], ['diamHerramienta', '0,5'], ['diamHerramienta', '1e6'], ['anguloV', ''], ['anguloV', '0'], ['anguloV', '180'], ['anguloV', '-30'], ['anguloV', 'xx']]) {
    if (id === 'anguloV') await p.selectOption('#tipoFresa', 'v');
    await paso(`campo ${id} = «${v}»`, () => campo(id, v)); }
  await paso('fresa de la base T102 elegida en el desplegable', () => p.evaluate(() => { const h = HB.porT(102); aplicarHerramientaSim(h); irAlFinal(); return JSON.stringify(herrPanel); }));
  await paso('T sin la base (T7)', () => cargar('G90\nT7 M06\nS12000 M03\nG0 X0 Y0 Z5\nG1 Z-2 F200\nG1 X50\nG0 Z5\nM30'));
  await paso('… y cambiar a bola', async () => { await p.selectOption('#tipoFresa', 'bola'); return p.evaluate(() => tipoFresa + ' ' + JSON.stringify(herrPanel)); });
  await paso('T sin M06 y M04', () => cargar('G90\nT101\nS12000 M04\nG0 X0 Y0 Z5\nG1 Z-2 F200\nG1 X50\nG0 Z5\nM30'));
  await paso('revisión con M04', () => p.evaluate(() => (document.body.innerText.match(/M04[^\n]{0,60}/) || ['(no aparece)'])[0]));
  await paso('M06 sin T, T0, T-1', () => cargar('G90\nM06\nT0 M06\nT-1 M06\nS12000 M03\nG0 X0 Y0 Z5\nG1 Z-2 F200\nG1 X50\nM30'));
  await paso('tres herramientas y cambio en cada tramo', async () => { await cargar('G90\nT101 M06\nS1 M03\nG0 X0 Y0 Z5\nG1 Z-2 F200\nG1 X50\nG0 Z5\nT102 M06\nS1 M03\nG0 X0 Y20\nG1 Z-2\nG1 X50\nG0 Z5\nT101 M06\nS1 M03\nG0 X0 Y40\nG1 Z-2\nG1 X50\nG0 Z5\nM30');
    const out = []; for (const [i, t] of [[0.3, 'bola'], [0.6, 'v'], [0.95, 'plana']]) { await p.evaluate(i => { indicePlano = Math.round((puntosPlanos.length - 1) * i); moverHerramientaA(indicePlano); }, i); await p.selectOption('#tipoFresa', t); out.push(await p.evaluate(() => JSON.stringify(herrPanel))); }
    return out.join(' → '); });
  await paso('programa vacío / solo comentarios', () => p.evaluate(() => { cargarGcodeTexto('', 'v.nc'); cargarGcodeTexto('; nada\n(nada)', 'c.nc'); return gcodeMoves.length; }));
  await paso('cambiar tipo sin programa', async () => { await p.goto('file://' + path.join(SUITE, 'simulador3d.html')); await p.waitForTimeout(1000); await p.selectOption('#tipoFresa', 'v'); await p.fill('#anguloV', '45'); await p.fill('#diamHerramienta', '8'); return p.evaluate(() => tipoFresa + ' ' + anguloV + ' ' + diametroFresa); });
  await paso('programa largo (40 000 líneas) con T101 y cambio a bola', async () => { let t = 'G90\nT101 M06\nS12000 M03\nG0 X0 Y0 Z5\nG1 Z-1 F2000\n'; for (let i = 0; i < 20000; i++) t += `G1 X${(i % 100) + 0.5} Y${Math.floor(i / 100) * 0.5}\nG1 X${(i % 100)}\n`; t += 'G0 Z5\nM30';
    const t0 = Date.now(); await cargar(t); const t1 = Date.now(); await p.selectOption('#tipoFresa', 'bola'); await p.evaluate(() => irAlFinal()); return `carga ${t1 - t0} ms · cambio a bola ${Date.now() - t1} ms`; });
  console.log(res.join('\n')); await b.close();
})();
