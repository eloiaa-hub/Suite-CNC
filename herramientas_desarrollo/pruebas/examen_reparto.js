// 👥 Preparar el examen (Calcador v108 / Corrector v53): repartir las variantes a la clase, las hojas con el nombre de cada
// alumno, la lista del reparto, y la corrección masiva sabe qué variante le tocaba a cada uno (por número de participante o nombre).
const { lanzar, abrir, path, fs, ejercicios } = require('./comun.js');
const os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'reparto-'));
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
(async () => {
    const d = JSON.parse(fs.readFileSync(ejercicios().find(f => /\/Ejercicio 18\.json$/.test(f)), 'utf8'));
    const b = await lanzar(), pg = await abrir(b, 'calcador.html');
    await pg.evaluate(d => { localStorage.removeItem('calcador_repartos'); abrirJSONDatos(d); cfgHoja.num = '7'; cfgHoja.titulo = 'Examen V'; document.getElementById('projectName').value = 'Examen V';
        Object.assign(varCfg, { n: 4, aOriginal: true, ex: true, ey: true, giro: true, cero: false, escala: false, medidas: true, mm: '10' }); abrirVariantes(); }, d);
    await pg.click('text=👥 Preparar el examen (repartir)…'); await pg.waitForTimeout(200);
    // la lista: el CSV de participantes de Aules (Nombre; Apellido(s)) …
    fs.writeFileSync(path.join(TMP, 'participantes.csv'), 'Nombre,Apellido(s),Dirección de correo,Roles\nAna,García Pérez,a@x.es,Estudiante\nBruno,Sanz,b@x.es,Estudiante\nCarla,Ruiz Mora,c@x.es,Estudiante\nDavid,López,d@x.es,Estudiante\nElena,Vidal,e@x.es,Estudiante\n');
    await pg.setInputFiles('#repCSV', path.join(TMP, 'participantes.csv')); await pg.waitForTimeout(200);
    let R = await pg.evaluate(() => repEx.alumnos.map(a => a.n + '=' + a.v).join(', '));
    ok(R === 'Ana García Pérez=A, Bruno Sanz=B, Carla Ruiz Mora=C, David López=D, Elena Vidal=A', `CSV de participantes, en orden: ${R}`);
    // … o la hoja de calificaciones (con el número de participante), pegada en la lista
    const hoja = '"Identificador","Nombre completo","Dirección de correo","Estado","Calificación"\n"Participante 201","Ana García Pérez","a@x.es","",""\n"Participante 202","Bruno Sanz","b@x.es","",""\n"Participante 203","Carla Ruiz Mora","c@x.es","",""\n"Participante 204","David López","d@x.es","",""\n"Participante 205","Elena Vidal","e@x.es","",""\n"Participante 206","Fran Gil","f@x.es","",""\n';
    fs.writeFileSync(path.join(TMP, 'hoja.csv'), hoja);
    await pg.setInputFiles('#repCSV', path.join(TMP, 'hoja.csv')); await pg.waitForTimeout(200);
    R = await pg.evaluate(() => repEx.alumnos.map(a => `${a.n}#${a.id}=${a.v}`).join(', '));
    ok(/Ana García Pérez#201=A/.test(R) && /Fran Gil#206=B/.test(R), `hoja de calificaciones, con el número: ${R}`);
    // al azar: las mismas veces cada una
    await pg.check('input[name="repModo"][value="azar"]'); await pg.click('#repRepartir'); await pg.waitForTimeout(100);
    const cuenta = await pg.evaluate(() => ['A', 'B', 'C', 'D'].map(l => repEx.alumnos.filter(a => a.v === l).length).join(''));
    ok(cuenta.split('').every(c => c === '1' || c === '2') && cuenta.split('').reduce((a, c) => a + +c, 0) === 6, `al azar, repartidas por igual (${cuenta})`);
    // a mano: Bruno, la D
    await pg.evaluate(() => { const s = document.querySelector('#repTabla select[data-k="1"]'); s.value = 'D'; s.onchange(); });
    // las hojas con el nombre
    const html = await pg.evaluate(async () => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(t) { h += t; }, close() {} } });
        try { await document.getElementById('repHojas').onclick(); } finally { window.open = o; } return h; });
    const nombres = (html.match(/<span class="et">Alumno\/a<\/span><span class="v">([^<]+)<\/span>/g) || []).length;
    ok(nombres === 6 && /Fran Gil/.test(html), `6 hojas, cada una con el nombre del alumno en el cajetín (${nombres})`);
    const numBruno = await pg.evaluate(() => { const v = varGen.find(x => x.letra === repEx.alumnos[1].v); return etqVar(v); });
    ok(numBruno === '7D', `Bruno, cambiado a mano, tiene la ${numBruno}`);
    const guardado = await pg.evaluate(() => repartosGuardados()['Variantes/Examen V']);
    ok(guardado && guardado.alumnos.length === 6 && guardado.alumnos[1].etq === '7D' && guardado.alumnos[0].id === '201', `el reparto queda guardado (${guardado && guardado.alumnos.map(a => a.etq).join(',')})`);
    const enBib = await pg.evaluate(async () => { await bibCargar(); return bib.lista.filter(e => /^Variantes\/Examen V\//.test(e.ruta)).length; });
    ok(enBib === 4, `las 4 variantes, en la biblioteca (${enBib})`);
    // la lista del reparto (CSV)
    const csv = await pg.evaluate(() => { let t = ''; const o = window.descargar; window.descargar = x => { t = x; }; try { document.getElementById('repCSVbajar').onclick(); } finally { window.descargar = o; } return t; });
    ok(/"Alumno";"Variante";"Identificador"/.test(csv) && /"Bruno Sanz";"7D";"Participante 202"/.test(csv), 'la lista del reparto en CSV');
    fs.writeFileSync(path.join(TMP, 'reparto.csv'), csv);
    // la corrección masiva: cada uno hace su variante, menos Carla (hace la de Ana) y Fran (no se sabe su número: casa por nombre)
    const rep = guardado.alumnos, progDe = await pg.evaluate(() => { const o = {}; const a = estadoGuardado(); varGen.forEach(v => { abrirJSONDatos(JSON.parse(JSON.stringify(v.datos))); generarMec(); o[etqVar(v)] = ultimoMec.nc; }); restaurarEstado(a); refrescar(); return o; });
    await pg.evaluate(({ rep, progDe }) => {
        cerrarVariantes(); document.getElementById('modalReparto').classList.remove('visible'); abrirMasiva(); masiva.lista = []; masiva.ids = {};
        rep.forEach(a => { const otro = a.n === 'Carla Ruiz Mora' ? Object.keys(progDe).find(e => e !== a.etq) : a.etq; masiva.lista.push({ alumno: a.n, archivo: 'pieza.nc', texto: progDe[otro] }); if (a.n !== 'Fran Gil') masiva.ids[a.n] = a.id; });
        // Bruno sube su entrega con otro nombre en Aules («Bruno Sanz Ortega»): casa por el número
        masiva.lista[1].alumno = 'Bruno Sanz Ortega'; masiva.ids['Bruno Sanz Ortega'] = '202'; delete masiva.ids['Bruno Sanz'];
        recorregirMasiva();
    }, { rep, progDe });
    await pg.evaluate(() => elegirVariantesMasiva()); await pg.waitForTimeout(500);
    const nota = await pg.evaluate(() => document.getElementById('varMasivaRep').textContent);
    ok(/Con reparto guardado.*Examen V \(6 alumnos\)/.test(nota), `la ventana dice que hay reparto: ${nota}`);
    await pg.click('#varMasivaSi'); await pg.waitForTimeout(800);
    const L = await pg.evaluate(() => masiva.lista.map(it => ({ a: it.alumno, var: it.variante, asig: it.varAsignada, av: it.varAviso, v: it.v.veredicto })));
    const x = n => L.find(i => i.a === n) || {};
    ok(L.every(i => i.asig) && x('Ana García Pérez').asig === rep[0].etq, `todos con la variante que le tocaba (${L.map(i => i.a.split(' ')[0] + ':' + i.asig).join(' ')})`);
    ok(x('Bruno Sanz Ortega').asig === '7D' && x('Bruno Sanz Ortega').v === 'bien', `Bruno casa por su número aunque cambie el nombre (${x('Bruno Sanz Ortega').asig})`);
    ok(/le tocaba la/.test(x('Carla Ruiz Mora').av || '') && x('Carla Ruiz Mora').var === rep[2].etq, `Carla: ${x('Carla Ruiz Mora').av}`);
    ok(x('Fran Gil').asig === rep[5].etq && !x('Fran Gil').av, `Fran casa por el nombre (${x('Fran Gil').asig})`);
    // el reparto desde el CSV (en otro navegador)
    await pg.evaluate(() => localStorage.removeItem('calcador_repartos'));
    await pg.evaluate(() => elegirVariantesMasiva()); await pg.waitForTimeout(400);
    await pg.setInputFiles('#modalVarMasiva input[type=file][accept=".csv"]', path.join(TMP, 'reparto.csv')); await pg.waitForTimeout(200);
    await pg.click('#varMasivaSi'); await pg.waitForTimeout(800);
    const L2 = await pg.evaluate(() => masiva.lista.map(it => it.varAsignada).join(','));
    ok(L2 === L.map(i => i.asig).join(','), `con la lista del reparto abierta desde su CSV, igual (${L2})`);
    ok(!pg.errs.length, `sin errores de JavaScript ${pg.errs.join(' | ')}`);
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
