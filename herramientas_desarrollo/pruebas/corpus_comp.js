// comp_simulador.js (compensación según el trazado) sobre todos los ejercicios
const { ejercicios, path } = require('./comun'), { execFileSync } = require('child_process');
const CFGS = '[{"comp":"auto","coord":"G90"},{"comp":"auto","coord":"mixta","paso":"1.5","acab":"0.3"}]';
let mal = 0;
for (const f of ejercicios()) {
  const out = execFileSync('node', [path.join(__dirname, 'comp_simulador.js'), f], { env:{ ...process.env, CFGS }, encoding:'utf8' });
  const lin = out.split('\n').filter(l => /^[✓✗]/.test(l) || /^ERR/.test(l));
  if (lin.some(l => !l.startsWith('✓'))) { mal++; console.log('## ' + path.basename(f)); lin.forEach(l => console.log('  ' + l)); }
}
console.log(`${ejercicios().length} ejercicios · con fallos ${mal}`);
