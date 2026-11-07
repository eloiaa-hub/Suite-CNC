#!/usr/bin/env node
// Lanza las pruebas de la suite, varias a la vez, y resume el resultado. Uso: node ejecutar_todas.js [salida] (PARALELO=4, LIMITE=600 s)
// Quedan fuera: comun.js, los perfil_* (miden tiempos, no comprueban nada), estres_mecanizar (muy larga), motor_vs_generador (compara con fuentes antiguas),
// y los que solo generan datos: interp_corpus y referencia_generador.
// Una prueba falla si termina con error, si una línea empieza por ✗ o si acaba con «ERR [ … ]» (errores de la página): muchas solo lo imprimen.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path');
const FUERA = /^(comun|ejecutar_todas|estres_mecanizar|motor_vs_generador|interp_corpus|referencia_generador|perfil_.*)\.js$/;
const salida = path.resolve(process.argv[2] || path.join(require('os').tmpdir(), 'pruebas-suite')); fs.mkdirSync(salida, { recursive: true });
const lista = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && !FUERA.test(f)).sort();
const FALLO = /^\s*✗|^\s*ERR\s+(?!\[\s*\])\S/m;
const PARALELO = +process.env.PARALELO || 4, LIMITE = (+process.env.LIMITE || 600) * 1000, res = [];
const lanzar = f => new Promise(ok => { const t0 = Date.now(), log = fs.openSync(path.join(salida, f + '.log'), 'w');
  const h = spawn(process.execPath, [f], { cwd: __dirname, stdio: ['ignore', log, log], env: { ...process.env, OUT: path.join(salida, 'archivos') } });
  const tope = setTimeout(() => h.kill('SIGKILL'), LIMITE);
  h.on('close', c => { clearTimeout(tope); fs.closeSync(log); if (c === 0 && FALLO.test(fs.readFileSync(path.join(salida, f + '.log'), 'utf8'))) c = 1; res.push({ f, c, s: Math.round((Date.now() - t0) / 1000) }); console.log(`${c === 0 ? '✓' : '✗'} ${f} (${Math.round((Date.now() - t0) / 1000)} s)`); ok(); }); });
fs.mkdirSync(path.join(salida, 'archivos'), { recursive: true });
(async () => {
  const cola = lista.slice(); await Promise.all(Array.from({ length: PARALELO }, async () => { while (cola.length) await lanzar(cola.shift()); }));
  const mal = res.filter(r => r.c !== 0);
  console.log(`\n${res.length - mal.length} de ${res.length} pruebas bien.`);
  mal.forEach(r => { console.log(`\n✗ ${r.f}`); const t = fs.readFileSync(path.join(salida, r.f + '.log'), 'utf8').split('\n').filter(l => /^\s*✗|^\s*ERR\s|Error/.test(l)).slice(0, 8); t.forEach(l => console.log('   ' + l.slice(0, 300))); });
  process.exit(mal.length ? 1 : 0);
})();
