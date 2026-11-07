const { chromium } = require('playwright'); const fs = require('fs'); const { lanzar } = require('./comun');
(async () => {
  const b = await lanzar();
  const cal = await b.newPage(); cal.on('dialog', d => d.accept()); await cal.goto('file://' + require('./comun').SUITE + '/calcador.html'); await cal.evaluate(() => localStorage.clear()); await cal.reload(); await cal.waitForTimeout(500);
  // Se regenera a mano cuando cambie el formato de la tabla: node interp_corpus.js
  const files = require('./comun').ejercicios();
  const progs = [];
  for (const f of files) {
    const datos = JSON.parse(fs.readFileSync(f, 'utf8'));
    const ts = await cal.evaluate(d => { abrirJSONDatos(d); const out = [];
      for (const pr of ['g90', 'g91', 'mix', 'polar']) for (const arc of ['ij', 'r']) { abrirTabla(); document.getElementById('tbProg').value = pr; document.getElementById('tbArco').value = arc; document.getElementById('tbCont').value = 'todos'; pintarTabla(); out.push([pr + ' ' + arc, textoTabla('iso')]); cerrarTabla(); }
      return out; }, datos);
    ts.forEach(([k, t]) => progs.push({ n: f.split('/').pop() + ' ' + k, t }));
  }
  fs.writeFileSync(require('path').join(__dirname, 'interp_corpus.json'), JSON.stringify(progs));
  console.log(progs.length, 'programas de tabla'); await b.close(); })();
