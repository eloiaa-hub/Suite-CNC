// Calculadora de taller: resultados con valores conocidos, conversión de programas y capturas
// Uso: node calculadora.js [carpeta de capturas]
const { lanzar, path, SUITE, fs } = require('./comun');
const OUT = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await lanzar(); const errs = [];
  const p = await b.newPage({ viewport:{ width:1280, height:900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(SUITE, 'calculadora.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  let fallos = 0;
  const ok = (nombre, cond, info) => { if (!cond) fallos++; console.log(`${cond ? '✓' : '✗'} ${nombre}${info ? ' · ' + info : ''}`); };
  const pon = (vals, radios) => p.evaluate(([vals, radios]) => {
    Object.entries(radios || {}).forEach(([n, v]) => { document.querySelector(`input[name="${n}"][value="${v}"]`).checked = true; });
    Object.entries(vals).forEach(([id, v]) => { document.getElementById(id).value = v; });
    document.querySelector('.hoja.activa').dispatchEvent(new Event('input', { bubbles: true }));
  }, [vals, radios]);
  const hoja = h => p.click(`.pestanas button[data-hoja="${h}"]`);
  const iso = id => p.evaluate(id => [...document.querySelectorAll(`#${id} code`)].map(c => c.textContent), id);
  const resTxt = id => p.evaluate(id => document.getElementById(id).innerText.replace(/\s+/g, ' '), id);
  const avisoTxt = id => p.evaluate(id => document.getElementById(id).innerText.replace(/\s+/g, ' '), id);

  // ── Recta ──
  await hoja('recta');
  await pon({ rL:'50', rA:'36,8699', rX0:'10', rY0:'5' }, { rModo:'la' });
  let L = await iso('rIso'); ok('recta L50 36,87° desde (10,5)', L[0] === 'G90 G1 X50 Y35' && L[1] === 'G91 G1 X40 Y30', L.join(' | '));
  await pon({ rDX:'-30', rDY:'40', rX0:'0', rY0:'0' }, { rModo:'xy' });
  ok('recta ΔX-30 ΔY40 → L50, 126,87°', /longitud 50 mm/i.test(await resTxt('rRes')) && /126\.87/.test(await resTxt('rRes')), await resTxt('rRes'));
  await pon({ rDX:'40', rA:'45' }, { rModo:'xa' });
  L = await iso('rIso'); ok('recta ΔX40 a 45° → ΔY40', L[1] === 'G91 G1 X40 Y40', L.join(' | '));
  await pon({ rDY:'20', rA:'90' }, { rModo:'ya' });
  L = await iso('rIso'); ok('recta vertical ΔY20 a 90° → ΔX0', L[1] === 'G91 G1 X0 Y20', L.join(' | '));
  await pon({ rDX:'10', rA:'90' }, { rModo:'xa' });
  ok('recta ΔX con 90° → aviso', /vertical/.test(await avisoTxt('rAviso')));
  await pon({ rDX:'-10', rA:'30' }, { rModo:'xa' });
  ok('recta signo de ΔX incoherente → aviso', /signo/.test(await avisoTxt('rAviso')));
  await pon({ rL:'60', rA:'-30' }, { rModo:'la' });
  await p.screenshot({ path: path.join(OUT, 'calc_recta.png'), fullPage: false });

  // ── Polares ──
  await hoja('polar');
  await pon({ pR:'60', pA:'30', pPX:'0', pPY:'0' }, { pModo:'pc' });
  L = await iso('pIso'); ok('polar r60 30° → X51.962 Y30', L[0] === 'G90 G1 X51.962 Y30' && L[1] === 'G90 G16 G1 X60 Y30', L.join(' | '));
  await pon({ pX:'-20', pY:'-20', pPX:'0', pPY:'0' }, { pModo:'cp' });
  ok('polar (-20,-20) → r28,284 225°', /28\.284/.test(await resTxt('pRes')) && /225/.test(await resTxt('pRes')), await resTxt('pRes'));
  await pon({ pR:'10', pA:'90', pPX:'50', pPY:'50' }, { pModo:'pc' });
  L = await iso('pIso'); ok('polar con polo (50,50) → X50 Y60 y aviso G16', L[0] === 'G90 G1 X50 Y60' && L.length === 1 && /polo no está/.test(await avisoTxt('pAviso')), L.join(' | '));
  await pon({ pR:'45', pA:'135', pPX:'0', pPY:'0' }, { pModo:'pc' });
  await p.screenshot({ path: path.join(OUT, 'calc_polar.png') });

  // ── Arco ──
  await hoja('arco');
  await pon({ aX1:'20', aY1:'0', aX2:'0', aY2:'20', aR:'20' }, { aSent:'G3', aModo:'r', aLargo:'corto' });
  L = await iso('aIso'); ok('arco G3 corto (20,0)→(0,20) R20 → centro 0,0, I-20 J0', L[0] === 'G90 G3 X0 Y20 I-20 J0' && L[1] === 'G90 G3 X0 Y20 R20', L.join(' | '));
  await pon({}, { aLargo:'largo' });
  L = await iso('aIso'); ok('arco G3 largo → centro 20,20, R-20, 270°', L[0] === 'G90 G3 X0 Y20 I0 J20' && L[1] === 'G90 G3 X0 Y20 R-20' && /270/.test(await resTxt('aRes')), L.join(' | '));
  await pon({}, { aSent:'G2', aLargo:'corto' });
  L = await iso('aIso'); ok('arco G2 corto → centro 20,20 (90°)', L[0] === 'G90 G2 X0 Y20 I0 J20' && /90 °/.test(await resTxt('aRes')), L.join(' | '));
  await pon({ aR:'5' }, { aSent:'G3' });
  ok('arco radio pequeño → aviso con el mínimo', /14\.142/.test(await avisoTxt('aAviso')), await avisoTxt('aAviso'));
  await pon({ aX1:'30', aY1:'50', aX2:'30', aY2:'50', aXC:'50', aYC:'50' }, { aModo:'c', aSent:'G2' });
  L = await iso('aIso'); ok('circunferencia completa con centro → solo I J', L.length === 2 && L[0] === 'G90 G2 X30 Y50 I20 J0' && /360/.test(await resTxt('aRes')), L.join(' | '));
  await pon({ aX1:'0', aY1:'0', aX2:'40', aY2:'0', aXC:'20', aYC:'1' }, { aModo:'c', aSent:'G2' });
  ok('centro a distinta distancia → sin aviso (simétrico)', !/no está a la misma/.test(await avisoTxt('aAviso')));
  await pon({ aXC:'21', aYC:'1' }, {});
  ok('centro mal → aviso', /no está a la misma distancia/.test(await avisoTxt('aAviso')), (await avisoTxt('aAviso')).slice(0, 90));
  await pon({ aX1:'100', aY1:'30', aX2:'80', aY2:'50', aR:'20' }, { aModo:'r', aSent:'G3', aLargo:'corto' });
  await p.screenshot({ path: path.join(OUT, 'calc_arco.png') });

  // ── Conversión ──
  await hoja('conv');
  await p.click('#cEjemplo');
  await pon({ cX0:'0', cY0:'0', cZ0:'0' }, { cModo:'G91' });
  let sal = await p.$eval('#cSal', e => e.value);
  ok('ejemplo → G91', /G91 G0 Z20\nG0 X10 Y10\nG1 Z-23 F300\nG1 X70 Y0\nG3 X20 Y20 I0 J20\nG1 X0 Y30\nG1 X-90 Y0\nG1 X0 Y-50\nG0 Z23\nM30/.test(sal), '\n' + sal);
  // ida y vuelta: G91 → G90 debe dar el original
  const g91 = sal; await p.evaluate(t => { document.getElementById('cEnt').value = t; }, g91); await pon({}, { cModo:'G90' });
  sal = await p.$eval('#cSal', e => e.value);
  ok('ida y vuelta G90 → G91 → G90', sal.includes('G90 G0 Z20\nG0 X10 Y10\nG1 Z-3 F300\nG1 X80 Y10\nG3 X100 Y30 I0 J20\nG1 X100 Y60\nG1 X10 Y60\nG1 X10 Y10\nG0 Z20'), '\n' + sal);
  await p.click('#cEjemplo'); await pon({}, { cModo:'mix' });
  sal = await p.$eval('#cSal', e => e.value);
  ok('mixta: G0 y Z en G90, cortes en G91', sal.includes('G90 G0 Z20\nG0 X10 Y10\nG1 Z-3 F300\nG91 G1 X70 Y0\nG3 X20 Y20 I0 J20\nG1 X0 Y30\nG1 X-90 Y0\nG1 X0 Y-50\nG90 G0 Z20'), '\n' + sal);
  await p.evaluate(() => { document.getElementById('cEnt').value = 'N10 G90 G0 X10,5 Y20 ; entrada\nN20 G1 X20.5 Y20 F500 (corte)\nN30 G91 G2 X10 Y-10 R10\nN40 G90 G1 X50 Y0'; });
  await pon({}, { cModo:'G91' });
  sal = await p.$eval('#cSal', e => e.value);
  ok('N, comentarios, coma decimal, R y entrada mezclada', sal === 'N10 G91 G0 X10.5 Y20 ; entrada\nN20 G1 X10 Y0 F500 (corte)\nN30 G2 X10 Y-10 R10\nN40 G1 X19.5 Y-10', '\n' + sal);
  await p.click('#cEjemplo'); await pon({}, { cModo:'G91' });
  await p.screenshot({ path: path.join(OUT, 'calc_conv.png') });

  // ── Corte ──
  await hoja('corte');
  await pon({ vD:'6', vZ:'2', vS:'18000', vFz:'0.1', vL:'600', vL0:'250', vF0:'5000' }, { vModoS:'S', vModoF:'fz' });
  let t = await resTxt('vRes');
  ok('corte Ø6 S18000 → Vc 339,29 m/min, F 3600', /339\.29/.test(t) && /F 3600 mm\/min/i.test(t) && /S 18000 rpm/i.test(t) && /0 min 13 s/.test(t), t);
  await pon({ vVc:'300' }, { vModoS:'Vc', vModoF:'F' });
  await pon({ vF:'3000' }, {});
  t = await resTxt('vRes');
  ok('corte Vc300 Ø6 → S 15.915, fz 0,094', /15915/.test(t) && /0\.094/.test(t), t);
  await pon({ vF:'300' }, {});
  ok('fz muy pequeño → aviso', /roza/.test(await avisoTxt('vAviso')));
  await pon({ vF:'3000' }, {});
  await p.screenshot({ path: path.join(OUT, 'calc_corte.png') });

  // guardado y tema oscuro
  await p.reload(); await p.waitForTimeout(300);
  ok('recuerda la pestaña y los datos', await p.evaluate(() => document.querySelector('.pestanas .activa').dataset.hoja === 'corte' && document.getElementById('vF').value === '3000'));
  await p.click('#btnTema'); await hoja('arco'); await p.waitForTimeout(100);
  await p.screenshot({ path: path.join(OUT, 'calc_oscuro.png') });
  await p.click('#btnTema');
  // móvil
  const m = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 }); m.on('pageerror', e => errs.push('móvil: ' + e.message));
  await m.goto('file://' + path.join(SUITE, 'calculadora.html')); await m.waitForTimeout(300);
  await m.click('.pestanas button[data-hoja="recta"]');
  ok('móvil sin desplazamiento horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  const anchas = [];
  for (const h of ['recta', 'polar', 'arco', 'conv', 'corte']) { await m.evaluate(h => document.querySelector(`.pestanas [data-hoja="${h}"]`).click(), h); await m.waitForTimeout(150);
    if (await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.hoja.activa .caja')].some(c => c.getBoundingClientRect().right > innerWidth + 1))) anchas.push(h); }
  ok('móvil: ninguna pestaña se sale por la derecha', !anchas.length, anchas.join(', '));
  await m.evaluate(() => document.querySelector('.pestanas [data-hoja="recta"]').click());
  await m.screenshot({ path: path.join(OUT, 'calc_movil.png'), fullPage: true });
  console.log(`fallos ${fallos}`, errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
