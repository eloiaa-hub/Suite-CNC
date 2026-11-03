// Utilidades comunes de las pruebas de la Suite CNC (Node.js + Playwright)
const path = require('path'), fs = require('fs');
const SUITE = process.env.SUITE || path.resolve(__dirname, '../..');
const EJERCICIOS = process.env.EJERCICIOS || path.join(__dirname, 'ejercicios');
const CHROME = process.env.CHROME || undefined;   // sin CHROME, el navegador que trae Playwright
function lanzar() { const { chromium } = require('playwright'); return chromium.launch({ executablePath: CHROME, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
function ejercicios() {
  const out = [];
  const recorrer = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/Suite_CNC|Pruebas/.test(f)) recorrer(p); } else if (f.endsWith('.json')) out.push(p); } };
  recorrer(EJERCICIOS); return out.sort();
}
async function abrir(b, prog, vp) { const pg = await b.newPage({ viewport: vp || { width: 1440, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message + ' ' + ((e.stack || '').split('\n')[1] || ''))); pg.on('dialog', d => d.accept()); await pg.goto('file://' + path.join(SUITE, prog)); await pg.waitForTimeout(700); pg.errs = errs; return pg; }
module.exports = { SUITE, lanzar, ejercicios, abrir, fs, path };
