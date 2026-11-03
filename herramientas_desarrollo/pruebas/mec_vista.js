const { lanzar, abrir } = require('./comun');
(async () => { const b = await lanzar(); const cal = await abrir(b, 'calcador.html');
  await cal.setInputFiles('#fileJSON', require('path').join(__dirname, 'Cortar_2_piezas_Correccion_herramienta.json')); await cal.waitForTimeout(400);
  await cal.evaluate(() => { cfgFresa.d = 10; cfgMec.comp = 'auto'; abrirMec(); }); await cal.waitForTimeout(400);
  console.log('trayectorias compensadas:', await cal.evaluate(() => { const its = itemsDePrograma(interpretarISO(ultimoMec.nc), 5).items.filter(it => it.tipo === 'xy' && it.cg && it.cg !== it.sg); return its.length; }), '· errores', cal.errs);
  await cal.screenshot({ path: '/tmp/mec_vista.png', clip: await cal.locator('#mecLienzo').boundingBox() }); await b.close(); })();
