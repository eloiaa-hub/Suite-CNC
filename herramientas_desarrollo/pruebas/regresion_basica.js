// Regresión básica: la solución de cada ejercicio (tabla ISO, en 4 programaciones) sale bien en la corrección,
// la simulación de la corrección y el reproductor funcionan, y el Corrector da lo mismo que el Calcador
const { lanzar, abrir, ejercicios, fs } = require('./comun');
(async () => { const b = await lanzar(); const fallos = []; let n = 0;
  for (const prog of ['calcador.html', 'corrector.html']) {
    const pg = await abrir(b, prog);
    for (const f of ejercicios()) {
      let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; } if (!d.calcador) continue;
      const r = await pg.evaluate(d => { try { abrirJSONDatos(d); cfgFresa.d = 6; const out = [];
        for (const p of ['g90', 'g91', 'mix', 'polar']) {
          abrirTabla(); document.getElementById('tbProg').value = p; document.getElementById('tbCont').value = 'todos'; pintarTabla(); const t = textoTabla('iso'); cerrarTabla();
          const c = corregirPrograma(t); const err = c.hallazgos.filter(h => h.tipo === 'error' && h.cat !== 'requisito');
          if (!c.piezaOk || err.length) out.push(`${p}: ${err.map(h => h.msg.slice(0, 70)).join(' | ') || 'no sale bien'}`);
        }
        abrirCorregir(); document.getElementById('crTexto').value = textoTabla('iso'); ejecutarCorreccion(); abrirSimulacion(); sim.t = sim.T; pintarSim(); cerrarSimulacion(); cerrarCorregir();
        document.getElementById('spComp').value = 'auto'; seleccionarUno(-1); refrescar(); simPlanoFin(); simPlanoInicio(); document.getElementById('spComp').value = '40';
        return out; } catch (e) { return ['EXCEPCIÓN ' + e.message]; } }, d);
      n++; r.forEach(x => fallos.push(`${prog} ${f.split('/').pop()} ${x}`));
    }
    if (pg.errs.length) fallos.push(`${prog}: errores de página ${pg.errs.slice(0, 2).join(' | ')}`);
    await pg.close();
  }
  console.log(`${n} ejercicios (Calcador y Corrector) · fallos ${fallos.length}`); fallos.slice(0, 8).forEach(x => console.log('  ' + x));
  await b.close(); process.exitCode = fallos.length ? 1 : 0; })();
