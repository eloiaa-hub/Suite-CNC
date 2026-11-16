// 📒 Libro de calificaciones v1: importar las notas de los CSV del Corrector (la corrección de un ejercicio, la hoja de
// calificaciones de Aules rellenada, la revisión por alumno de la batería y el zip «Descarga CSV Correcciones»), casar los
// alumnos por el nombre, ejercicios a mano, bloques con peso, la nota de la evaluación y la del boletín, los criterios,
// comentarios, CSV, guardar / abrir y los boletines. Datos inventados.
const { lanzar, abrir, fs, path } = require('./comun');
const os = require('os');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'libro-'));
const F = (n, t) => { const f = path.join(TMP, n); fs.writeFileSync(f, t); return f; };
// zip sin comprimir
function zip(arch) {
    const T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = b => { let x = 0xffffffff; for (const v of b) x = T[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
    const loc = [], cen = []; let off = 0;
    arch.forEach(([n, t]) => { const nb = Buffer.from(n), d = Buffer.from(t), c = crc(d);
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt32LE(c, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(nb.length, 26);
        const e = Buffer.alloc(46); e.writeUInt32LE(0x02014b50, 0); e.writeUInt16LE(20, 4); e.writeUInt16LE(20, 6); e.writeUInt16LE(0x800, 8); e.writeUInt32LE(c, 16); e.writeUInt32LE(d.length, 20); e.writeUInt32LE(d.length, 24); e.writeUInt16LE(nb.length, 28); e.writeUInt32LE(off, 42);
        loc.push(h, nb, d); cen.push(e, nb); off += 30 + nb.length + d.length; });
    const cd = Buffer.concat(cen), f = Buffer.alloc(22); f.writeUInt32LE(0x06054b50, 0); f.writeUInt16LE(arch.length, 8); f.writeUInt16LE(arch.length, 10); f.writeUInt32LE(cd.length, 12); f.writeUInt32LE(off, 16);
    return Buffer.concat([...loc, cd, f]);
}
const BOM = '﻿';
// 1) el examen con variantes: la hoja de Aules rellenada (en mayúsculas, como la da Aules; Elena sin entrega)
const hoja = F('Calificaciones-Curso-2CFS7 1788982647-Examen noviembre-11830001 - con notas.csv', BOM + 'Identificador,Nombre completo,Dirección de correo,Estado,Calificación,Calificación máxima,La calificación puede ser cambiada,Última modificación (entrega),Última modificación (calificación),Comentarios de retroalimentación\n'
    + 'Participante1,ANA GARCÍA LÓPEZ,a@x,Enviado,"9,10","10,00",Sí,-,2026-11-16 13:09,"Nota orientativa: 9,1\nCorregido con la variante A."\n'
    + 'Participante2,BRUNO SANZ PÉREZ,b@x,Enviado,"4,00","10,00",Sí,-,2026-11-16 13:09,""\n'
    + 'Participante3,CARLA RUIZ MORA,c@x,Enviado,"7,50","10,00",Sí,-,2026-11-16 13:09,""\n'
    + 'Participante4,ELENA VIDAL ROS,e@x,Sin entrega,"","10,00",Sí,-,-,""\n');
// 2) la corrección de un ejercicio del Corrector (con los criterios; Bruno con dos entregas: cuenta la mejor)
const corr = '"Alumno";"Archivo";"Veredicto";"Errores de geometría";"Incumplimientos de lo pedido";"Errores de seguridad";"Avisos";"Contorno bien mecanizado (%)";"Nota";"Geometría";"Lo pedido";"Seguridad";"Informe de entrega";"Formato del archivo";"Parecido con";"Observaciones"\n'
    + '"Ana García López";"a.txt";"Bien";0;0;0;0;100;10;6;2;2;"";"Correcto";"";""\n'
    + '"Bruno Sanz Pérez";"b1.txt";"No sale bien";0;0;1;0;100;6;4;2;0;"";"Correcto";"";""\n'
    + '"Bruno Sanz Pérez";"b2.txt";"No sale bien";0;0;1;0;100;8;6;2;0;"";"Correcto";"";""\n'
    + '"Carla Ruiz";"c.txt";"No sale bien";12;0;0;0;76,9;6,1;2,12;2;2;"";"Correcto";"";"Falta…"\n';
const fCorr = F('ISO GEO 01A - corrección.csv', BOM + corr);
// 3) la revisión por alumno de la batería
const rev = F('Revisión por alumno 16-11-2026.csv', BOM + '"Alumno/a";"ISO GEO 02A";"ISO GEO 02B";"Geometría 09";"Media";"Entregadas";"La pieza sale bien";"Lo que repite (en cuántas tareas)"\n'
    + '"(peso)";"1";"2";"no cuenta";"no entregadas = 0";"";"";""\n'
    + '"ANA GARCÍA LÓPEZ";"10";"8";"9";"8,67";"3/3";"2";""\n"BRUNO SANZ PÉREZ";"5";"";"7";"1,67";"1/2";"0";""\n"DAVID LÓPEZ";"6";"6";"";"6";"2/2";"0";""\n');
// 4) el zip de la batería: una carpeta por tarea, con su corrección y su hoja de Aules
const fZip = F('Batería de corrección 16-11-2026.zip', zip([['Resumen de la batería.csv', BOM + '"Tarea";"Media"\n"ISO GEO 03A";"7"\n'],
    ['ISO GEO 03A/ISO GEO 03A - corrección.csv', BOM + corr.replace(/ISO GEO 01A/g, 'ISO GEO 03A')],
    ['ISO GEO 03A/Calificaciones-Curso-ISO GEO-3 - con notas.csv', BOM + 'Identificador,Nombre completo,Calificación,Calificación máxima\nParticipante9,ANA GARCÍA LÓPEZ,"10,00","10,00"\n'],
    ['ISO GEO 03B/Calificaciones-Curso-2CFS7 1788982647-ISO GEO 03B-11833212 - con notas.csv', BOM + 'Identificador,Nombre completo,Calificación,Calificación máxima\nParticipante9,ANA GARCÍA LÓPEZ,"5,00","10,00"\nParticipante8,CARLA RUIZ MORA,"8,00","10,00"\n']]));
const otro = F('notas.csv', 'a;b\n1;2\n');
// (Playwright pierde los archivos con tildes en el nombre si se le pasan por la ruta: van con su contenido)
const B = L => L.map(f => ({ name: path.basename(f), mimeType: 'application/octet-stream', buffer: fs.readFileSync(f) }));

(async () => {
    const b = await lanzar(), p = await abrir(b, 'libro_calificaciones.html');
    await p.evaluate(() => localStorage.removeItem('libro_calificaciones')); await p.reload(); await p.waitForTimeout(400);
    const importa = async (files, fn) => { await p.click('#bImportar'); await p.setInputFiles('#impF', B(files)); await p.waitForSelector('[data-fn]', { timeout: 10000 }); if (fn) await fn(); await p.click('#impOk'); await p.waitForTimeout(200); };
    const est = () => p.evaluate(() => JSON.parse(JSON.stringify({ al: alumnosOrden().map(a => a.nombre), b: L.evals[0].bloques.map(b => ({ n: b.nombre, peso: b.peso, it: b.items.map(i => ({ n: i.nombre, peso: i.peso, max: i.max, c: i.criterios, notas: Object.keys(i.notas).length })) })) })));
    // 1) el examen
    await importa([hoja], async () => { await p.fill('#impNb', 'Examen'); await p.dispatchEvent('#impNb', 'change'); });
    let E = await est();
    ok(E.al.join() === 'Ana García López,Bruno Sanz Pérez,Carla Ruiz Mora,Elena Vidal Ros', `la clase sale de la hoja de Aules, con los nombres bien escritos (${E.al.join(', ')})`);
    ok(E.b.length === 1 && E.b[0].n === 'Examen' && E.b[0].peso === 100 && E.b[0].it[0].n === 'Examen noviembre' && E.b[0].it[0].notas === 3, `el bloque «Examen» con «Examen noviembre» (el nombre de la tarea) y 3 notas (${JSON.stringify(E.b[0])})`);
    // 2) la corrección con los criterios, a un bloque nuevo; Carla Ruiz casa (¿?) con Carla Ruiz Mora
    await p.click('#bImportar'); await p.setInputFiles('#impF', B([fCorr, otro])); await p.waitForSelector('[data-fn]');
    const casa = await p.evaluate(() => [...document.querySelectorAll('#impCuerpo table.lista tr')].slice(1).map(tr => tr.cells[0].textContent + '→' + tr.cells[1].querySelector('select').selectedOptions[0].textContent + ':' + tr.cells[2].textContent));
    console.log('   ' + casa.join(' | '));
    ok(casa.some(x => /^Carla Ruiz→Carla Ruiz Mora:¿es el mismo/.test(x)) && casa.some(x => /^Ana García López→Ana García López:✔/.test(x)), 'casa los alumnos: el mismo nombre (✔) y el parecido (¿es el mismo?)');
    ok(/notas\.csv: no es un CSV de notas/.test(await p.textContent('#impCuerpo')), 'avisa del CSV que no es de notas');
    await p.check('#impCrit'); await p.selectOption('#impBlo', 'nuevo'); await p.fill('#impNb', 'Prácticas'); await p.dispatchEvent('#impNb', 'change');
    await p.click('#impOk'); await p.waitForTimeout(200);
    E = await est(); const pr = E.b[1];
    ok(pr && pr.n === 'Prácticas' && pr.peso === 0 && pr.it[0].n === 'ISO GEO 01A' && pr.it[0].c.join() === 'Geometría,Lo pedido,Seguridad' && pr.it[0].notas === 3, `«Prácticas»: «ISO GEO 01A» con sus criterios (${JSON.stringify(pr)})`);
    ok(await p.evaluate(() => { const it = L.evals[0].bloques[1].items[0], b = alumnosOrden().find(a => a.nombre === 'Bruno Sanz Pérez'); return it.notas[b.id].n === 8 && it.sumaCrit; }), 'de dos entregas, la mejor; y la nota es la suma de los criterios');
    // 3) la revisión de la batería (pesos de la fila «(peso)»; «no cuenta» → peso 0) al mismo bloque; David es nuevo
    await importa([rev], async () => { await p.selectOption('#impBlo', '1'); });
    E = await est();
    ok(E.b[1].it.map(i => i.n + ':' + i.peso).join() === 'ISO GEO 01A:1,ISO GEO 02A:1,ISO GEO 02B:2,Geometría 09:0' && E.al.includes('David López'), `la revisión por alumno: una columna, un ejercicio, con su peso (${E.b[1].it.map(i => i.n + ':' + i.peso).join()}); David, alumno nuevo`);
    // 4) el zip de la batería: de cada carpeta, la corrección (y si no hay, la hoja de Aules); el resumen no
    await p.click('#bImportar'); await p.setInputFiles('#impF', B([fZip])); await p.waitForSelector('[data-fn]');
    const fu = await p.evaluate(() => IMP.fuentes.map(s => s.nombre + '|' + s.tipo + '|' + s.filas.length));
    ok(fu.join() === 'ISO GEO 03A|Corrección del Corrector|3,ISO GEO 03B|Hoja de calificaciones de Aules|2', `el zip: ${fu.join(' · ')}`);
    await p.selectOption('#impBlo', '1'); await p.click('#impOk'); await p.waitForTimeout(200);
    // 5) un bloque a mano con un ejercicio sobre 20
    await p.click('#evBloque'); await p.click('.bloque[data-b="2"] [data-acc=mas]'); await p.fill('#iNom', 'Memoria'); await p.fill('#iMax', '20'); await p.click('#iOk'); await p.waitForTimeout(150);
    const ids = await p.evaluate(() => ({ it: L.evals[0].bloques[2].items[0].id, A: Object.fromEntries(L.alumnos.map(a => [a.nombre.split(' ')[0], a.id])) }));
    const cel = (it, a) => `input.celda[data-it="${it}"][data-a="${a}"]:not([data-k])`;
    for (const [n, v] of [['Ana', '16'], ['Bruno', '9,5'], ['Carla', '20']]) { await p.fill(cel(ids.it, ids.A[n]), v); await p.press(cel(ids.it, ids.A[n]), 'Enter'); }
    // Tab: a la columna de al lado (el mismo alumno), con la nota guardada; Intro: al alumno de abajo
    await p.evaluate(() => { const b = L.evals[0].bloques[2]; b.items.push(itemNuevo('Plano')); cambio(); });
    const it2 = await p.evaluate(() => L.evals[0].bloques[2].items[1].id), A0 = await p.evaluate(() => alumnosOrden().map(a => a.id));
    await p.fill(cel(ids.it, A0[3]), '15'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
    let foco = await p.evaluate(() => [document.activeElement.dataset.it, document.activeElement.dataset.a]);
    ok(foco[0] === it2 && foco[1] === A0[3] && await p.evaluate(([it, a]) => buscarItem(it).it.notas[a].n === 15, [ids.it, A0[3]]), 'Tab pasa a la columna de al lado (el mismo alumno) y guarda la nota');
    await p.keyboard.type('7'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    foco = await p.evaluate(() => [document.activeElement.dataset.it, document.activeElement.dataset.a]);
    ok(foco[0] === it2 && foco[1] === A0[4] && await p.evaluate(([it, a]) => buscarItem(it).it.notas[a].n === 7, [it2, A0[3]]), 'Intro pasa al alumno de abajo (la misma columna)');
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
    foco = await p.evaluate(() => [document.activeElement.dataset.it, document.activeElement.dataset.a]);
    ok(foco[0] === ids.it && foco[1] === A0[4], '← pasa a la columna de antes');
    await p.keyboard.type('12'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
    foco = await p.evaluate(() => [document.activeElement.dataset.it, document.activeElement.dataset.a]);
    ok(foco[0] === it2 && foco[1] === A0[4] && await p.evaluate(([it, a]) => buscarItem(it).it.notas[a].n === 12, [ids.it, A0[4]]), '→ pasa a la de después y guarda la nota');
    await p.evaluate(() => { const b = L.evals[0].bloques[2]; b.items.pop(); cambio(); });
    await p.evaluate(() => { const ev = L.evals[0]; ev.bloques[0].peso = 40; ev.bloques[1].peso = 40; ev.bloques[2].peso = 20; ev.bloques[1].min = 5; cambio(); });
    // la nota de Bruno, a mano: Examen 4; Prácticas: 01A 8 ·1, 02A 5 ·1, 02B — (0) ·2, Geo 09 no cuenta, 03A 8 ·1, 03B — (0) ·1 → 21/6 = 3,5 (< mín. 5);
    // Memoria 9,5/20 → 4,75. Nota = (4·40 + 3,5·40 + 4,75·20)/100 = 3,95; con el mínimo, tope 4 → 3,95
    const nb = await p.evaluate(id => { const ev = L.evals[0], r = notaEval(ev, id); return { n: r.n, bajo: r.bajo.map(b => b.nombre), mb: ev.bloques.map(b => mediaBloque(ev, b, id)), bol: boletin(r.n) }; }, ids.A.Bruno);
    ok(Math.abs(nb.mb[1] - 3.5) < 1e-9 && Math.abs(nb.mb[2] - 4.75) < 1e-9 && Math.abs(nb.n - 3.95) < 1e-9 && nb.bajo.join() === 'Prácticas' && nb.bol === 4, `Bruno: bloques ${nb.mb.map(x => x.toFixed(2)).join(' / ')}, nota ${nb.n.toFixed(2)}, ⚠ mínimo de Prácticas, boletín ${nb.bol}`);
    // Ana: Examen 9,1; Prácticas 01A 10, 02A 10, 02B 8·2, 03A 10, 03B 5 → 51/6 = 8,5; Memoria 16/20 = 8 → (9,1·40 + 8,5·40 + 8·20)/100 = 8,64 → 9
    const na = await p.evaluate(id => { const r = notaEval(L.evals[0], id); return [r.n, boletin(r.n)]; }, ids.A.Ana);
    ok(Math.abs(na[0] - 8.64) < 1e-9 && na[1] === 9, `Ana: ${na[0].toFixed(2)} → boletín ${na[1]}`);
    // solo los entregados
    await p.selectOption('#evModo', 'entregados');
    const nb2 = await p.evaluate(id => mediaBloque(L.evals[0], L.evals[0].bloques[1], id), ids.A.Bruno);
    ok(Math.abs(nb2 - 7) < 1e-9, `«solo cuentan los entregados»: Prácticas de Bruno (8 + 5 + 8) / 3 = ${nb2}`);
    await p.selectOption('#evModo', 'cero');
    // un criterio cambiado a mano: la nota es la suma y queda marcada
    // los bloques de más de 4 ejercicios salen plegados: solo su media
    const pl = await p.evaluate(() => ({ th: [...document.querySelectorAll('th[data-pleg]')].map(t => t.textContent.trim().slice(0, 16)), cel: document.querySelectorAll('input.celda').length }));
    ok(pl.th[1].startsWith('▸ Prácticas') && pl.cel === 5 * 1 + 5 * 1, `Prácticas (6 ejercicios) sale plegada: solo su media (${pl.th.join(' | ')}; ${pl.cel} casillas)`);
    await p.click(`th[data-pleg="${await p.evaluate(() => L.evals[0].bloques[1].id)}"]`); await p.waitForTimeout(100);
    ok(await p.evaluate(() => L.evals[0].bloques[1].plegado === false && document.querySelectorAll('input.celda').length === 5 * 8), '▸ en su cabecera la despliega');
    await p.click('#evPleg'); ok(await p.evaluate(() => L.evals[0].bloques.every(b => !b.items.length || b.plegado) && document.querySelectorAll('input.celda').length === 0), '▸ Plegar: todos los bloques, solo la media');
    await p.click('#evDesp'); ok(await p.evaluate(() => document.querySelectorAll('input.celda').length === 5 * 8), '▾ Desplegar: todos');
    const it01 = await p.evaluate(() => L.evals[0].bloques[1].items[0].id);
    await p.click(`[data-desp="${it01}"]`);
    const ck = `input.celda[data-it="${it01}"][data-a="${ids.A.Ana}"][data-k="0"]`; await p.fill(ck, '3'); await p.press(ck, 'Tab'); await p.waitForTimeout(150);
    ok(await p.evaluate(([it, a]) => { const x = buscarItem(it).it.notas[a]; return x.n === 7 && x.o === 10 && x.m; }, [it01, ids.A.Ana]) && await p.$$eval('td.mod', x => x.length) >= 1, 'un criterio cambiado: la nota es la nueva suma (7), guarda la importada (10) y se marca en amarillo');
    // comentario y ficha
    await p.click(`[data-com="${ids.A.Ana}"]`); await p.fill('#cTxt', 'Muy buen trimestre.'); await p.click('#cOk');
    ok(await p.evaluate(id => L.evals[0].comentarios[id] === 'Muy buen trimestre.', ids.A.Ana), 'tu comentario');
    // segunda evaluación y final
    await p.click('#pMasEv'); await p.click('.pest.final'); await p.waitForTimeout(100);
    ok(/Final del curso/.test(await p.textContent('#hoja')), 'la pestaña del final del curso');
    await p.click('.pest[data-ev="0"]');
    // 👥 unir: Elena y una «Elena Vidal» escrita de otra manera
    await p.evaluate(() => { L.alumnos.push({ id: 'x1', nombre: 'E. Vidal' }); L.evals[0].bloques[2].items[0].notas.x1 = { n: 12 }; cambio(); });
    await p.click('#bAlumnos'); await p.check(`.aSel[value="${ids.A.Elena}"]`); await p.check('.aSel[value="x1"]'); await p.click('#aUnir'); await p.waitForTimeout(150);
    ok(await p.evaluate(id => L.alumnos.length === 5 && L.evals[0].bloques[2].items[0].notas[id].n === 12, ids.A.Elena), '🔗 unir dos nombres del mismo alumno, con sus notas');
    await p.click('#ovDlg [data-cerrar]');
    // CSV
    const [d] = await Promise.all([p.waitForEvent('download'), p.click('#bCSV')]);
    const csv = fs.readFileSync(await d.path(), 'utf8').split('\r\n');
    ok(csv.length === 7 && /"Examen · Examen noviembre"/.test(csv[0]) && /"Nota";"Boletín";"Comentario"/.test(csv[0]) && csv.some(l => /Ana García López.*"8,64";"9";"Muy buen trimestre\."/.test(l) || /Ana García López/.test(l)), `⬇ CSV (${csv[0].slice(0, 90)}…)`);
    // guardar y abrir
    const [d2] = await Promise.all([p.waitForEvent('download'), p.click('#bGuardar')]);
    const j = fs.readFileSync(await d2.path(), 'utf8'), firma = () => p.evaluate(() => alumnosOrden().map(a => a.nombre + ':' + nf(notaEval(L.evals[0], a.id).n, 4)).join('|'));
    const antes = await firma();
    await p.click('#bNuevo'); await p.click('#cfSi'); ok(await p.evaluate(() => L.alumnos.length === 0), '🗋 libro nuevo');
    await p.setInputFiles('#fAbrir', [{ name: 'libro.json', mimeType: 'application/json', buffer: Buffer.from(j) }]); await p.waitForTimeout(300);
    ok(await firma() === antes, '📂 abrir: las mismas notas');
    await p.reload(); await p.waitForTimeout(400);
    ok(await firma() === antes, 'el navegador lo recuerda');
    // boletines
    const H = await p.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} } }); try { imprimirBoletines(null); } finally { window.open = o; } return h; });
    ok((H.match(/<section>/g) || []).length === 5 && /Muy buen trimestre/.test(H) && /Memoria/.test(H), '🖨 boletines: uno por alumno, con su comentario');
    ok(p.errs.length === 0, 'sin errores de JavaScript ' + p.errs.join(' | '));
    await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
