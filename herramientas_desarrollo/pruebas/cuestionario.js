// 📝 Cuestionario para Aules (Moodle XML): las respuestas coinciden con la geometría de cada variante, el XML es
// válido y el Cloze está bien escrito. Uso: node cuestionario.js [nº de ejercicios, por defecto 30]
const { lanzar, abrir, ejercicios, fs, path } = require('./comun');
(async () => {
    const b = await lanzar(); let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
    const todos = ejercicios(), N = +process.argv[2] || 30, paso = Math.max(1, Math.floor(todos.length / N));
    const lista = [path.join(__dirname, 'ISO 13 - dos herramientas.json')].concat(todos.filter((_, i) => i % paso === 0).slice(0, N));
    let nPreg = 0, nEj = 0;
    for (const prog of ['calcador.html', 'corrector.html']) {
        const pg = await abrir(b, prog);
        for (const f of (prog === 'calcador.html' ? lista : lista.slice(0, 3))) {
            const d = JSON.parse(fs.readFileSync(f, 'utf8'));
            const r = await pg.evaluate(async d => {
                abrirJSONDatos(d); await new Promise(z => setTimeout(z, 50));
                if (!hayPieza()) return { vacio:true };
                Object.assign(cuestCfg, { n:3, g90:2, g91:2, polar:1, ij:2, r:1, g2g3:1, comp:2 });
                const G = await generarCuest(), malos = [];
                const fn = v => +(+v).toFixed(3), igual = (a, b2, t = 2e-3) => Math.abs(a - b2) <= t;
                G.vars.forEach(v => {
                    const M = v.M;
                    M.puntos.forEach(P => { if (!igual(P.abs.x, fn(P.p.x)) || !igual(P.abs.y, fn(P.p.y))) malos.push(`${v.letra} P${P.n} G90 ${P.abs.x},${P.abs.y} ≠ ${P.p.x},${P.p.y}`);
                        if (P.rel && (!igual(P.rel.x, fn(P.p.x - P.rel.desde.p.x), 4e-3) || !igual(P.rel.y, fn(P.p.y - P.rel.desde.p.y), 4e-3))) malos.push(`${v.letra} P${P.n} G91`);
                        if (!igual(P.pol.r, Math.hypot(P.p.x, P.p.y), 4e-3)) malos.push(`${v.letra} P${P.n} radio polar`);
                        if (P.pol.r > 1e-3) { const a = Math.atan2(P.p.y, P.p.x) * 180 / Math.PI; if (!igual(((P.pol.a - a) % 360 + 540) % 360 - 180, 0, 0.01)) malos.push(`${v.letra} P${P.n} ángulo ${P.pol.a} ≠ ${a}`); } });
                    M.arcos.forEach(A => { if (!igual(A.i, fn(A.c.x - A.desde.p.x), 4e-3) || !igual(A.j, fn(A.c.y - A.desde.p.y), 4e-3)) malos.push(`${v.letra} A${A.n} I J`);
                        if (!igual(Math.abs(A.r), A.radio, 2e-3) || (A.r < 0) !== A.grande) malos.push(`${v.letra} A${A.n} R ${A.r}`);
                        // G2/G3: el producto vectorial de (inicio - centro) y (medio - centro): negativo = horario
                        const cr = (A.desde.p.x - A.c.x) * (A.medio.y - A.c.y) - (A.desde.p.y - A.c.y) * (A.medio.x - A.c.x);
                        if ((cr < 0 ? 'G2' : 'G3') !== A.mov) malos.push(`${v.letra} A${A.n} ${A.mov}`); });
                    // G41/G42: la misma regla que el Simulador (izquierda dentro del contorno, y si es interior o exterior)
                    M.conts.forEach(C => { const c = contornos[C.ci]; });
                    v.preguntas.forEach(q => { (q.txt.match(/\{1:[^}]*\}/g) || []).forEach(z => {
                        if (/^\{1:NUMERICAL:/.test(z)) { if (!/^\{1:NUMERICAL:=-?\d+(\.\d+)?:\d+(\.\d+)?(~=-?\d+(\.\d+)?:\d+(\.\d+)?)?\}$/.test(z)) malos.push('Cloze numérico mal escrito: ' + z); }
                        else if (/^\{1:MULTICHOICE_V:/.test(z)) { const ops = z.slice(17, -1).split('~'); if (ops.filter(o => o.startsWith('=')).length !== 1 || /[{}]/.test(z.slice(1, -1)) || ops.some(o => /:/.test(o))) malos.push('Cloze de opciones mal escrito: ' + z); }
                        else malos.push('Cloze desconocido: ' + z); }); });
                });
                const claves = G.vars.map(v => v.preguntas.map(q => q.clave).join('|'));
                if (new Set(claves).size !== 1) malos.push('las variantes no tienen las mismas preguntas');
                return { malos, n:G.vars[0].preguntas.length, vars:G.vars.length, tipos:G.vars[0].preguntas.map(q => q.clave.replace(/\d+/g, '#')), xml:xmlCuest(G).length };
            }, d);
            if (r.vacio) continue;
            nEj++; nPreg += r.n * r.vars;
            ok(!r.malos.length && r.n > 0, `${prog} · ${path.basename(f)}: ${r.n} preguntas × ${r.vars} variantes · XML ${Math.round(r.xml / 1024)} KB ${r.malos.slice(0, 4).join(' | ')}`);
        }
        // G41/G42 contra la regla del Simulador, y el XML válido, con el ejercicio de prueba
        const r2 = await pg.evaluate(async d => {
            abrirJSONDatos(d); Object.assign(cuestCfg, { n:4, g90:1, g91:1, polar:1, ij:1, r:1, g2g3:1, comp:4 });
            const G = await generarCuest(), out = [];
            G.vars.forEach(v => v.M.conts.forEach(C => { out.push({ v:v.letra, tipo:C.tipo, ccw:C.ccw, debe:C.debe }); }));
            return { out, xml:xmlCuest(G), nq:G.vars[0].preguntas.length };
        }, JSON.parse(fs.readFileSync(lista[0], 'utf8')));
        ok(r2.out.length === 8 && r2.out.every(c => c.debe === (c.tipo === 'interior' ? (c.ccw ? 41 : 42) : (c.ccw ? 42 : 41))) && r2.out.some(c => c.debe === 41) && r2.out.some(c => c.debe === 42), `${prog}: G41/G42 de cada contorno en cada variante ${JSON.stringify(r2.out.slice(0, 4))}`);
        const xml = r2.xml;
        ok(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<quiz>/.test(xml) && (xml.match(/<question type="cloze">/g) || []).length === r2.nq * 4 && (xml.match(/<question type="category">/g) || []).length === r2.nq, `${prog}: XML con ${r2.nq} categorías y ${r2.nq * 4} preguntas`);
        const f = path.join(require('os').tmpdir(), 'cuest_prueba.xml'); fs.writeFileSync(f, xml);
        try { require('child_process').execFileSync('python3', ['-c', `import xml.etree.ElementTree as E,base64,sys\nt=E.parse(sys.argv[1]);q=t.getroot().findall('question')\nfor x in q:\n  for fl in x.iter('file'): base64.b64decode(fl.text, validate=True)\nprint(len(q))`, f]); ok(true, `${prog}: el XML se lee (y sus imágenes PNG en base64)`); }
        catch (e) { ok(false, `${prog}: XML no válido ${String(e.stderr || e.message).slice(0, 300)}`); }
        ok(!pg.errs.length, `${prog}: sin errores de JavaScript ${pg.errs.slice(0, 3).join(' | ')}`);
        await pg.close();
    }
    console.log(`${nEj} ejercicios · ${nPreg} preguntas comprobadas · fallos ${fallos}`);
    await b.close(); process.exit(fallos ? 1 : 0);
})();
