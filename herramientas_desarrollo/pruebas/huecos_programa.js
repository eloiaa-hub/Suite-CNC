// 📝 Completar el programa (Calcador v108 / Corrector v53): la pregunta Cloze con huecos del programa de la solución, en cada
// variante; rellenando los huecos con sus respuestas sale el programa exacto de la variante; el XML y la hoja impresa.
const { lanzar, abrir, path, fs } = require('./comun.js');
const EJ = path.join(__dirname, 'ISO 13 - dos herramientas.json');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const json = JSON.parse(fs.readFileSync(EJ, 'utf8'));
    const b = await lanzar();
    for (const prog of ['calcador.html', 'corrector.html']) {
        const pg = await abrir(b, prog);
        const sinHuecos = await pg.evaluate(async d => { abrirJSONDatos(d); Object.assign(varCfg, { ex: true, ey: true, giro: true, cero: false, escala: false, medidas: false });
            Object.assign(cuestCfg, { n: 3, g90: 2, g91: 0, polar: 0, ij: 1, r: 0, g2g3: 1, comp: 0, huecos: 0 }); const G = await generarCuest(); return G.vars[0].preguntas.length; }, json);
        ok(sinHuecos === 4, `${prog}: con 0 huecos, el cuestionario de siempre (${sinHuecos} preguntas)`);
        const r = await pg.evaluate(async () => {
            cfgMec.comp = 'auto'; cuestCfg.huecos = 8; const G = await generarCuest();
            return G.vars.map(v => { const q = v.preguntas.find(x => x.papel);
                // rellenar los huecos con su respuesta (la primera de cada uno) y quitar el HTML: tiene que salir el programa de la variante
                const lleno = q.txt.replace(/\{1:SHORTANSWER:=([^~}]+)[^}]*\}/g, '$1').replace(/\{1:NUMERICAL:=([^:}]+):[^}]*\}/g, '$1');
                const lineas = [...lleno.matchAll(/<div>(.*?)<\/div>/g)].map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<'));
                return { letra: v.letra, n: (q.txt.match(/\{1:(SHORTANSWER|NUMERICAL):/g) || []).length, g: (q.txt.match(/\{1:SHORTANSWER:/g) || []).length, lineas, prog: v.M.prog.map(l => l.cod), papel: (q.papel.match(/class="hu"/g) || []).length, sol: q.solTxt }; });
        });
        ok(r.length === 3 && r.every(v => v.n === 8 && v.papel === 8), `${prog}: 3 variantes, 8 huecos en cada una (${r.map(v => v.n).join(', ')})`);
        ok(r.every(v => v.g === 3), `${prog}: un reparto equilibrado: 3 funciones (G2/G3, G41/G42) de 8 huecos (${r.map(v => v.g).join(", ")}) · ${r[0].sol}`);
        ok(r.every(v => v.lineas.join('\n') === v.prog.join('\n')), `${prog}: con las respuestas, sale el programa exacto de cada variante`);
        ok(r[0].sol !== r[1].sol, `${prog}: cada variante, sus respuestas · A: ${r[0].sol.slice(0, 70)}… · B: ${r[1].sol.slice(0, 50)}…`);
        const xml = await pg.evaluate(async () => { cuestGen = await generarCuest(); return xmlCuest(cuestGen); });
        ok(/Completar el programa \(8 huecos\)/.test(xml) && /SHORTANSWER:=G[23]~=G0[23]/.test(xml) && (xml.match(/<question type="cloze">/g) || []).length === 15, `${prog}: el XML, con la pregunta en su categoría (${(xml.match(/<question type="cloze">/g) || []).length} preguntas)`);
        const imp = await pg.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(t) { h += t; }, close() {} } }); try { imprimirHuecos(); } finally { window.open = o; } return h; });
        ok((imp.match(/<section class="pag">/g) || []).length === 4 && /Soluciones/.test(imp) && (imp.match(/class="hu"/g) || []).length === 24, `${prog}: la hoja impresa (3 variantes + soluciones, 24 huecos numerados)`);
        // la ventana: hasta 12 huecos y la vista previa con las respuestas
        const ui = await pg.evaluate(async () => { await abrirCuestionario(); const i = document.querySelector('#cuTipos input[data-k="huecos"]'); i.value = '15'; await cambiarCuestionario();
            return { v: cuestCfg.huecos, crudo: /\{1:SHORTANSWER/.test(document.getElementById('cuLista').innerHTML), ve: /Completar el programa/.test(document.getElementById('cuLista').textContent) }; });
        ok(ui.v === 12 && !ui.crudo && ui.ve, `${prog}: en la ventana, como mucho 12 huecos y la vista previa con las respuestas`);
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.join(' | ')}`);
        await pg.close();
    }
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
