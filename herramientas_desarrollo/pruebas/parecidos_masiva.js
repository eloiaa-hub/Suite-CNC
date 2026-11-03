// 👥 Programas muy parecidos entre alumnos (Calcador v107 / Corrector v52). Una clase sintética hecha con la solución de
// «ISO 13»: 20 alumnos con su propio estilo (numeración, G1/G01, espacios, decimales, F, comentarios y algún error),
// 4 que escriben igual que los apuntes (correctos y sin comentarios: no son copia), una copia renumerada con dos cambios
// y una copia «disfrazada» (todo reescrito con otro espaciado, pero con los mismos comentarios y el mismo error).
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
let semilla = +(process.env.SEMILLA || 12345); const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647, elige = a => a[Math.floor(rnd() * a.length)];
const base = fs.readFileSync(EJ + '.nc', 'utf8').split('\n').map(l => l.replace(/;.*$/, '').trim()).filter(Boolean);
const COM = { 'G71': ['unidades en mm', 'milimetros', 'en mm'], 'G90': ['absolutas', 'coordenadas absolutas', 'modo absoluto'], 'M06': ['cambio de herramienta', 'cambiar fresa', 'herramienta'],
    'M03': ['encender husillo', 'arranca el cabezal', 'giro a derechas'], 'G41': ['compensacion izquierda', 'activo G41', 'radio a la izquierda'], 'G40': ['quito compensacion', 'anular radio', 'sin compensacion'],
    'Z20': ['subo', 'subir a seguridad', 'arriba'], 'M30': ['fin', 'fin de programa', 'final'], 'M05': ['paro husillo', 'parar cabezal', 'stop husillo'], 'G2 ': ['arco horario', 'radio', 'curva'], 'G3 ': ['arco antihorario', 'curva', 'redondeo'] };
function estilo(o) {
    let lastF = null, n = 0;
    return base.map(l0 => {
        let l = l0;
        if (!o.fTodas) l = l.replace(/ F(\d+)/, (m, f) => f === lastF ? '' : (lastF = f, m));
        if (o.g0x) l = l.replace(/\bG([0-3])\b/g, 'G0$1');
        if (o.dec) l = l.replace(/([XYIJZ])(-?\d+)(?![\d.])/g, (m, c, v) => c + v + o.dec);
        if (o.zmas) l = l.replace(/Z(\d)/, 'Z+$1');
        if (!o.esp) l = l.replace(/ /g, '');
        if (o.min) l = l.toLowerCase();
        let com = '';
        if (o.com && rnd() < o.com) { const k = Object.keys(COM).find(k => l0.includes(k)); if (k) com = ` ${o.par ? '(' : ';'}${elige(COM[k])}${o.par ? ')' : ''}`; }
        if (o.n) { n += o.n; l = 'N' + n + (o.esp ? ' ' : '') + l; }
        return l + com;
    });
}
const conError = (L, k) => { const con = L.map((l, j) => j >= 12 && /[XYxy]-?\d/.test(l) ? j : -1).filter(j => j >= 0);
    for (let i = 0; i < k; i++) { const j = con.splice(Math.floor(rnd() * con.length), 1)[0]; L[j] = L[j].replace(/([XYxy])(-?\d+)/, (m, c, v) => c + (+v + 5 + Math.floor(rnd() * 20))); } return L; };
(async () => {
    const json = JSON.parse(fs.readFileSync(EJ + '.json', 'utf8'));
    const clase = [];
    for (let i = 0; i < 20; i++) {
        const o = { n: elige([0, 10, 10, 1, 5]), g0x: rnd() < 0.5, dec: elige(['', '', '.', '.0', '.000']), zmas: rnd() < 0.3, esp: rnd() < 0.8, min: rnd() < 0.1, fTodas: rnd() < 0.4, com: elige([0, 0.3, 0.6, 1]), par: rnd() < 0.5 };
        clase.push({ alumno: 'Alumno ' + (i + 1), texto: conError(estilo(o), elige([0, 0, 1, 2])).join('\n') });
    }
    // los copiados tienen algo propio que copiar: comentarios y un error (un programa bien hecho y sin comentarios no deja rastro)
    clase[2].texto = conError(estilo({ n: 10, g0x: false, dec: '', esp: true, fTodas: false, com: 0.6, par: false }), 1).join('\n');
    clase[6].texto = conError(estilo({ n: 10, g0x: true, dec: '.', esp: false, fTodas: true, com: 0.5, par: true }), 1).join('\n');
    clase[10].texto = conError(estilo({ n: 10, g0x: true, dec: '', esp: true, fTodas: false, com: 0 }), 2).join('\n');   // sin comentarios, con dos errores
    const apuntes = estilo({ n: 10, g0x: true, dec: '', esp: true, fTodas: false, com: 0 }).join('\n');
    for (let i = 0; i < 4; i++) clase.push({ alumno: 'Apuntes ' + (i + 1), texto: apuntes });
    // la copia: Alumno 3 renumerado (de 5 en 5), con un comentario cambiado y una coordenada distinta
    const orig = clase[2].texto.split('\n'); let n = 0;
    const copia = orig.map(l => l.replace(/^N\d+ ?/, () => 'N' + (n += 5) + ' ')).map((l, i) => i === 3 ? l.replace(/;.*|\(.*\)/, '; cambio de fresa') : l);
    { const j = copia.findIndex((l, i) => i > 20 && /X\d/.test(l)); copia[j] = copia[j].replace(/X(\d+)/, (m, v) => 'X' + (+v + 1)); }
    clase.push({ alumno: 'Copia de 3', texto: copia.join('\n') });
    // la copia disfrazada de Alumno 7: otro espaciado, sin números de bloque, pero con los mismos comentarios y el mismo error
    const d7 = clase[6].texto.split('\n').map(l => l.replace(/^N\d+ ?/, '').replace(/([A-Z])(?=[-+\d.])/g, ' $1').replace(/^ /, '').replace(/ +/g, ' ').replace(/(\d) ([-+\d])/g, '$1$2'));
    clase.push({ alumno: 'Disfrazada de 7', texto: d7.join('\n') });
    { let n = 0; clase.push({ alumno: 'Copia de 11', texto: clase[10].texto.split('\n').map(l => l.replace(/^N\d+ ?/, () => 'N' + (n += 10) + ' ')).join('\n') }); }
    const b = await lanzar();
    for (const prog of ['corrector.html', 'calcador.html']) {
        const pg = await abrir(b, prog);
        await pg.evaluate(({ d, clase }) => { abrirJSONDatos(d); abrirMasiva(); masiva.lista = clase.map((c, k) => ({ alumno: c.alumno, archivo: `p${k}.nc`, texto: c.texto })); recorregirMasiva(); }, { d: json, clase });
        await pg.waitForTimeout(300);
        const P = await pg.evaluate(() => masiva.parejas.map(p => ({ a: masiva.lista[p.a].alumno, b: masiva.lista[p.b].alumno, p: Math.round(p.p * 100), r: razonesPareja(p) })));
        const hay = (x, y) => P.find(p => (p.a === x && p.b === y) || (p.a === y && p.b === x));
        console.log('  ' + prog + ': ' + P.map(p => `${p.a} ↔ ${p.b} ${p.p} % (${p.r})`).join(' | '));
        ok(hay('Alumno 3', 'Copia de 3'), `${prog}: la copia renumerada sale (${(hay('Alumno 3', 'Copia de 3') || {}).p} %)`);
        ok(hay('Alumno 7', 'Disfrazada de 7'), `${prog}: la copia disfrazada sale por los comentarios o el error (${(hay('Alumno 7', 'Disfrazada de 7') || {}).p} %)`);
        ok(hay('Alumno 11', 'Copia de 11'), `${prog}: la copia sin comentarios sale por sus dos errores (${(hay('Alumno 11', 'Copia de 11') || {}).p} %)`);
        ok(!P.some(p => /Apuntes/.test(p.a + p.b)), `${prog}: los 4 que escriben como los apuntes (correctos) no salen`);
        const otros = P.filter(p => !(/Copia de|Disfrazada/.test(p.a + p.b)));
        ok(otros.length === 0, `${prog}: ninguna otra pareja (${otros.length})`);
        const vis = await pg.evaluate(() => ({ marcas: document.querySelectorAll('#mvTabla .mv-par').length, res: document.getElementById('mvResumen').textContent, btn: document.getElementById('mvBtnPar').textContent }));
        ok(vis.marcas === new Set(P.flatMap(p => [p.a, p.b])).size && /muy parecida/.test(vis.res) && /\(\d\)/.test(vis.btn), `${prog}: 👥 junto a ${vis.marcas} nombres, en el resumen y en el botón (${vis.btn})`);
        const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { exportarCSVMasiva(); } finally { window.descargar = o; } return t; });
        ok(/"Parecido con"/.test(csv) && /Copia de 3[^\n]*Alumno 3 \(\d+ %\)/.test(csv), `${prog}: la columna «Parecido con» del CSV`);
        const k = await pg.evaluate(() => masiva.lista.findIndex(it => it.alumno === 'Copia de 3'));
        await pg.evaluate(k => document.querySelector(`#mvTabla tr[data-k="${k}"] .mv-par`).click(), k); await pg.waitForTimeout(200);
        const cmp = await pg.evaluate(() => ({ vis: document.getElementById('modalParMasiva').classList.contains('visible'), ex: document.querySelectorAll('#parCompara .par-prog .ex, #parCompara .par-prog .cm').length, cols: document.querySelectorAll('#parCompara .par-col').length }));
        ok(cmp.vis && cmp.cols === 2 && cmp.ex >= 8, `${prog}: pulsar 👥 compara lado a lado (${cmp.ex} líneas marcadas: raras o con el mismo comentario)`);
        // en el informe del profesor, sí; en la devolución, no
        const doc = await pg.evaluate(() => { const r = {}; let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write: t => { h += t; }, close() {} }, focus() {}, print() {}, addEventListener() {} });
            try { imprimirInformes(); r.inf = h; h = ''; imprimirDevoluciones(); r.dev = h; } finally { window.open = o; } return r; });
        ok(/<h2>Programas muy parecidos<\/h2>/.test(doc.inf) && /<b>Alumno 3<\/b> ↔ <b>Copia de 3<\/b>|<b>Copia de 3<\/b> ↔ <b>Alumno 3<\/b>/.test(doc.inf) && /👥 Muy parecido a: Alumno 3 \(\d+ %\)/.test(doc.inf), `${prog}: en el informe, las parejas en el resumen y «👥 Muy parecido a…» en la hoja del alumno`);
        ok(!/Programas muy parecidos|Muy parecido a/.test(doc.dev), `${prog}: en las devoluciones, nada`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
