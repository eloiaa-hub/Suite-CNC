// Cerrar un arco con una recta (arco + cuerda) y «Unir o cerrar con el extremo más cercano» (Calcador v92)
const { lanzar, path, SUITE } = require('./comun');
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (n, c, i) => { if (!c) fallos++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
  for (const prog of ['calcador.html']) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('file://' + path.join(SUITE, prog)); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
    const caso = (pasos) => p.evaluate(pasos => {
      contornos = []; dib = null; sel = -1;
      for (const s of pasos) {
        if (s.h) setHerramienta(s.h);
        else if (s.esc) terminarDibujo();
        else if (s.unir) { const c = contornos[s.unir[0]]; unirConMasCercano(s.unir[0], s.unir[1] === 'fin' ? c.pts.length - 1 : 0); }
        else clicDibujo({ x:s[0], y:s[1] });
      }
      return contornos.map(c => ({ n:c.pts.length, cerrado:c.cerrado, arcos:c.b.filter(x => x).length }));
    }, pasos);
    let r;
    r = await caso([{ h:'arco3' }, [0, 0], [50, 50], [100, 0], { h:'linea' }, [0, 0]]);
    ok('arco de 3 puntos y, sin terminar, recta hasta su inicio: se cierra', r.length === 1 && r[0].cerrado && r[0].n === 2 && r[0].arcos === 1, JSON.stringify(r));
    r = await caso([{ h:'arco3' }, [0, 0], [50, 50], [100, 0], { esc:1 }, { h:'linea' }, [100, 0], [0, 0]]);
    ok('arco terminado; recta desde su final hasta su inicio: se cierra', r.length === 1 && r[0].cerrado && r[0].n === 2, JSON.stringify(r));
    r = await caso([{ h:'arco3' }, [0, 0], [50, 50], [100, 0], { esc:1 }, { h:'linea' }, [0, 0], [100, 0]]);
    ok('arco terminado; recta desde su inicio hasta su final: se cierra', r.length === 1 && r[0].cerrado && r[0].n === 2, JSON.stringify(r));
    r = await caso([{ h:'linea' }, [0, 0], [100, 0], { h:'arco3' }, [50, 50], [0, 0]]);
    ok('recta y después arco hasta el inicio: se cierra (como antes)', r.length === 1 && r[0].cerrado, JSON.stringify(r));
    r = await caso([{ h:'linea' }, [0, 0], [100, 0], [0, 0]]);
    ok('dos puntos en recta y vuelta al inicio: no se cierra (no hay superficie)', r.length === 1 && !r[0].cerrado, JSON.stringify(r));
    // trazo propio: tres rectas que acaban cerca de su inicio; un arco abierto más lejos
    r = await caso([{ h:'arco3' }, [200, 0], [250, 50], [300, 0], { esc:1 }, { h:'linea' }, [0, 0], [50, 60], [100, 0], [2, 1], { esc:1 }, { unir:[1, 'fin'] }]);
    ok('unir o cerrar: el extremo más cercano es el inicio del propio trazo → lo cierra con una recta', r.length === 2 && r.some(c => c.cerrado && c.n === 4) && r.some(c => !c.cerrado), JSON.stringify(r));
    r = await caso([{ h:'arco3' }, [0, 0], [50, 50], [100, 0], { esc:1 }, { unir:[0, 'fin'] }]);
    ok('unir o cerrar sobre un arco solo: lo cierra con su cuerda', r.length === 1 && r[0].cerrado, JSON.stringify(r));
    r = await caso([{ h:'linea' }, [0, 0], [100, 0], [100, 50], { esc:1 }, { h:'arco3' }, [100, 52], [150, 100], [0, 52], { esc:1 }, { unir:[0, 'fin'] }]);
    ok('unir o cerrar: si el más cercano es otro trazo, los une (como antes)', r.length === 1, JSON.stringify(r));
    ok(prog + ': sin errores de JavaScript', !errs.length, errs.join(' | '));
    await p.close();
  }
  console.log('fallos', fallos); await b.close();
})();
