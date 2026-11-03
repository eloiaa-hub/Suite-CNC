// Guarda el G-code que produce el Generador (escala 1:1) para todos los ejercicios y varias configuraciones.
// Sirve de referencia para comprobar que la ventana «Mecanizar» del Calcador da el mismo recorrido.
const { lanzar, ejercicios, abrir, fs, path } = require('./comun');
const CFGS = [
  { id:'basico',       coord:'G90', comp:'G40', estr:'plano',        zt:-3, zs:3,   acab:0,   R:3, F:1000, S:12000, T:101, variante:'ninguna' },
  { id:'pasadas_g91',  coord:'G91', comp:'G40', estr:'concordancia', zt:-6, zs:2,   acab:0,   R:3, F:800,  S:16000, T:102, variante:'ninguna' },
  { id:'comp_oposic',  coord:'G90', comp:'G42', estr:'oposicion',    zt:-4, zs:2,   acab:0,   R:3, F:1000, S:12000, T:101, variante:'ninguna' },
  { id:'acabado',      coord:'G90', comp:'G40', estr:'plano',        zt:-6, zs:3,   acab:0.5, R:3, F:1000, S:12000, T:101, variante:'ninguna' },
  { id:'puentes',      coord:'G90', comp:'G40', estr:'plano',        zt:-6, zs:2,   acab:0,   R:3, F:1000, S:12000, T:101, variante:'puentes' },
  { id:'mixto_g91',    coord:'G91', comp:'G40', estr:'concordancia', zt:-5, zs:2.5, acab:0,   R:2, F:900,  S:15000, T:103, variante:'mixto' },
];
(async () => {
  const b = await lanzar(); const cal = await abrir(b, 'calcador.html'); const gen = await abrir(b, 'generador.html');
  const ref = []; let n = 0;
  for (const f of ejercicios()) {
    let datos; try { datos = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    if (!datos.calcador) continue;
    for (const cfg of CFGS) {
      const exp = await cal.evaluate(([d, v]) => {
        abrirJSONDatos(d);
        const tp = tiposResueltos();
        if (v === 'puentes') contornos.forEach((c, i) => { if (c.cerrado && tp[i] === 'exterior') c.mec = Object.assign({}, c.mec || {}, { op:'corte', puentes:{ n:3, ancho:5, alto:2 } }); });
        if (v === 'mixto') { let k = 0; contornos.forEach((c, i) => { if (!c.cerrado || tp[i] !== 'interior') return;
            c.mec = k === 0 ? { op:'cajera', prof:3, caj:{ estr:'concentrica', paso:50, entrada:'vertical' } } : k === 1 ? { op:'grabado', prof:1 } : { op:'corte', prof:4 }; k++; });
          contornos.forEach((c, i) => { if (c.cerrado && tp[i] === 'exterior') c.mec = Object.assign({}, c.mec || {}, { op:'corte', puentes:{ n:2, ancho:6, alto:1.5 } }); }); }
        memoTipos = null; document.getElementById('selEscala').value = '1';
        return exportarJSON(true);
      }, [datos, cfg.variante]);
      if (!exp) continue;
      const nc = await gen.evaluate(([d, c]) => {
        restaurarEstado(d);
        const v = (id, x) => { document.getElementById(id).value = x; };
        v('gcCoordMode', c.coord); v('gcComp', c.comp); v('gcStrategy', c.estr); v('gcUnits', 'G71');
        v('gcFeed', c.F); v('gcFeedPos', 5000); v('gcTool', c.T); v('gcSpindle', c.S);
        v('gcToolR', c.R * 10); v('gcZsafe', 200); v('gcZtotal', c.zt * 10); v('gcZstep', c.zs * 10); v('gcAcab', c.acab * 10);
        ultimoGcode = ''; generarGcode(); return ultimoGcode;
      }, [exp, cfg]);
      ref.push({ ejercicio: path.basename(f), cfg, calcador: exp.calcador, nc }); n++;
    }
  }
  const dest = path.join(__dirname, 'referencia_generador.json');
  fs.writeFileSync(dest, JSON.stringify(ref));
  console.log(`${n} programas de referencia (${ref.filter(r => !r.nc).length} sin G-code) → ${path.basename(dest)} · errores de página: Calcador ${cal.errs.length}, Generador ${gen.errs.length}`);
  [...new Set(cal.errs.concat(gen.errs))].slice(0, 5).forEach(e => console.log('  ERR', e));
  await b.close();
})();
