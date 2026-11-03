// La ventana «⚙️ Mecanizar» del Calcador: parámetros, vista previa, descarga, Simulador y compensación según el trazado
const { lanzar, abrir, fs, path, SUITE } = require('./comun');
const PIEZA = process.env.PIEZA || require('path').join(__dirname, 'Cortar_2_piezas_Correccion_herramienta.json');
(async () => {
  const b = await lanzar(); const ctx = await b.newContext({ viewport:{ width:1440, height:900 }, acceptDownloads:true });
  const cal = await ctx.newPage(); const errs = []; cal.on('pageerror', e => errs.push(e.message)); cal.on('dialog', d => d.accept());
  await cal.goto('file://' + path.join(SUITE, 'calcador.html')); await cal.evaluate(() => localStorage.clear()); await cal.reload(); await cal.waitForTimeout(700);
  await cal.setInputFiles('#fileJSON', PIEZA); await cal.waitForTimeout(500);
  await cal.click('button.c2-ventana-mec'); await cal.waitForTimeout(400);
  const estado = () => cal.evaluate(() => ({ visible: document.getElementById('modalMec').classList.contains('visible'), nc: document.getElementById('mecTexto').value, res: document.getElementById('mecResumen').innerText.replace(/\s+/g, ' ') }));
  let e = await estado();
  console.log(`1) ventana ${e.visible ? 'abierta' : 'NO abierta'} · ${e.nc.split('\n').length} líneas de G-code · ${e.res.slice(0, 200)}`);
  // herramienta de la base: T102 Ø3
  await cal.evaluate(() => { const h = HB.porT(102); const s = document.getElementById('mecHerr'); s.value = h.id; s.dispatchEvent(new Event('change')); }); await cal.waitForTimeout(200);
  console.log('2) T102 de la base:', await cal.evaluate(() => `T${document.getElementById('mecT').value} · Ø${document.getElementById('mecD').value} (Fresa del panel: Ø${cfgFresa.d}) · F${document.getElementById('mecF').value} · paso ${document.getElementById('mecPaso').value} · en el G-code: ${/T102/.test(document.getElementById('mecTexto').value) && /M0?3 S16000/.test(document.getElementById('mecTexto').value)}`));
  // parámetros
  for (const [id, v] of [['mecProf', '6'], ['mecPaso', '2'], ['mecAcab', '0.5'], ['mecZseg', '15']]) { await cal.fill('#' + id, v); await cal.dispatchEvent('#' + id, 'input'); }
  await cal.selectOption('#mecCoord', 'G91'); await cal.waitForTimeout(600);
  e = await estado();
  console.log(`3) prof 6, paso 2, acabado 0,5, Z15, G91: pasadas ${(e.res.match(/pasadas en Z: ([^·]+)/) || [])[1]} · desbastes ${(e.nc.match(/; ── Desbaste/g) || []).length} · acabados ${(e.nc.match(/; ── Acabado/g) || []).length} · G91 ${/^G91/m.test(e.nc)} · Z15 ${/G0 Z15/.test(e.nc)}`);
  // compensación según el trazado: la propia corrección del Calcador comprueba el lado
  await cal.selectOption('#mecCoord', 'G90'); await cal.fill('#mecAcab', '0'); await cal.dispatchEvent('#mecAcab', 'input');
  for (const comp of ['auto', 'G41', 'G42']) {
    await cal.selectOption('#mecComp', comp); await cal.waitForTimeout(600);
    console.log(`4) compensación ${comp.padEnd(4)}:`, await cal.evaluate(() => { const nc = document.getElementById('mecTexto').value, r = corregirPrograma(nc);
      const lado = r.hallazgos.filter(h => h.cat === 'compensacion' && /es (EXTERIOR|INTERIOR)/.test(h.msg));
      return `${(nc.match(/^G4[12]\b/mg) || []).join(',')} · errores de lado en la corrección: ${lado.length}`; }));
  }
  // persistencia: se guarda con el proyecto
  await cal.selectOption('#mecComp', 'auto'); await cal.waitForTimeout(800);
  const json = await cal.evaluate(() => exportarJSON(true).calcador.cfgMec);
  console.log('5) en el JSON:', JSON.stringify(json));
  await cal.evaluate(() => cerrarMec()); await cal.reload(); await cal.waitForTimeout(900);
  console.log('   tras recargar:', await cal.evaluate(() => `prof ${cfgMec.prof}, paso ${cfgMec.paso}, comp ${cfgMec.comp}, T${cfgMec.T}, Ø${cfgFresa.d}`));
  // descarga
  await cal.evaluate(() => abrirMec()); await cal.waitForTimeout(300);
  const [dl] = await Promise.all([cal.waitForEvent('download'), cal.click('#mecDescargar')]);
  const ruta = path.join(require('os').tmpdir(), dl.suggestedFilename()); await dl.saveAs(ruta);
  console.log(`6) descarga «${dl.suggestedFilename()}» · ${fs.readFileSync(ruta, 'utf8').split('\n').length} líneas · igual que en pantalla: ${fs.readFileSync(ruta, 'utf8') === await cal.evaluate(() => document.getElementById('mecTexto').value)}`);
  await cal.screenshot({ path: path.join(require('os').tmpdir(), 'mecanizar.png'), clip: await cal.locator('#modalMec .help-modal').boundingBox() });
  // al Simulador
  const [sim] = await Promise.all([ctx.waitForEvent('page'), cal.click('#mecSimular')]); sim.on('pageerror', x => errs.push('sim: ' + x.message)); await sim.waitForTimeout(4500);
  console.log('7) Simulador:', await sim.evaluate(() => `«${document.getElementById('filenameLabel').textContent}» · ${gcodeMoves.length} movimientos · plano ${plano ? plano.trazados.length + ' trazados' : 'NO'} · fresa Ø${diametroFresa} · ${document.getElementById('planoEval').innerText.split('\n')[0]}`));
  // Corrector
  const cor = await ctx.newPage(); cor.on('pageerror', x => errs.push('cor: ' + x.message)); await cor.goto('file://' + path.join(SUITE, 'corrector.html')); await cor.waitForTimeout(600);
  await cor.setInputFiles('#fileJSON', PIEZA); await cor.waitForTimeout(400);
  console.log('8) Corrector:', await cor.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(x => /Mecanizar/.test(x.textContent)); if (!bt || !bt.offsetParent) return 'sin botón'; bt.click(); return `botón visible · ventana ${document.getElementById('modalMec').classList.contains('visible') ? 'abierta' : 'NO'} · ${document.getElementById('mecTexto').value.split('\n').length} líneas`; }));
  console.log('ERR', errs); await b.close();
})();
