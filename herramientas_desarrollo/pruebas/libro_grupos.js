// 📒 Libro de calificaciones v8: varios grupos en el mismo libro, cada uno con su lista de alumnos y sus asignaturas;
// copiar la estructura de una asignatura; notas a mano sin importar nada; quitar y unir alumnos en todo el grupo;
// abrir un libro de antes (una sola clase) y sumar los grupos de otro libro. Datos inventados.
const { lanzar, abrir } = require('./comun');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const b = await lanzar(), p = await abrir(b, 'libro_calificaciones.html');
    await p.evaluate(() => localStorage.removeItem('libro_calificaciones')); await p.reload(); await p.waitForTimeout(400);
    // 1) un libro nuevo: un grupo y una asignatura; sin alumnos, la lista se escribe ahí mismo
    ok(await p.evaluate(() => D.grupos.length === 1 && D.grupos[0].asigs.length === 1 && !!document.getElementById('vAl')), 'libro nuevo: un grupo, una asignatura y el cuadro para escribir la lista');
    await p.click('#aEd'); await p.fill('#sNom', '0987 Automatització'); await p.click('#sOk');
    await p.click('#gEd'); await p.fill('#gNom', '2CFS7'); await p.click('#gOk');
    await p.fill('#vAl', '1. ANA GARCÍA LÓPEZ\nBruno Sanz Pérez\nCarla Ruiz Mora\n\nBruno Sanz Pérez'); await p.click('#vAlOk'); await espera(150);
    ok(await p.evaluate(() => L.alumnos.map(a => a.nombre).join('|') === 'Ana García López|Bruno Sanz Pérez|Carla Ruiz Mora' && L.grupo === '2CFS7 · 0987 Automatització'),
        'la lista escrita a mano (sin números, sin repetidos y con mayúsculas bonitas) y el nombre «2CFS7 · 0987 Automatització»');
    // notas a mano, sin importar nada
    await p.click('#evItem'); await p.fill('#iNom', 'Contorno 1'); await p.click('#iOk'); await espera(100);
    const celdas = await p.$$('input.celda'); await celdas[0].fill('8'); await celdas[0].press('Enter'); await espera(450);
    ok(await p.evaluate(() => { const it = L.evals[0].bloques[0].items[0], a = alumnosOrden()[0]; return L.evals[0].bloques[0].nombre === 'Ejercicios' && it.notas[a.id].n === 8; }), '➕ Ejercicio a mano y la nota escrita en la casilla');
    // 2) otra asignatura del mismo grupo, con la estructura de la primera: mismos alumnos, sin notas
    await p.click('#aMas'); await p.fill('#sNom', 'Proyecto intermodular'); await p.selectOption('#sEst', '0:0'); await p.click('#sOk'); await espera(100);
    ok(await p.evaluate(() => L.a.nombre === 'Proyecto intermodular' && L.alumnos.length === 3 && L.evals[0].bloques[0].items[0].nombre === 'Contorno 1'
        && !Object.keys(L.evals[0].bloques[0].items[0].notas).length && L.evals[0].bloques[0].items[0].id !== D.grupos[0].asigs[0].evals[0].bloques[0].items[0].id),
        '＋ Asignatura con la estructura de otra: los mismos alumnos y ejercicios, sin notas');
    await p.evaluate(() => { L.evals[0].bloques[0].items[0].notas[alumnosOrden()[1].id] = { n: 6 }; cambio(); });
    // 3) otro grupo, con su lista
    await p.click('#gMas'); await p.fill('#gNom', '1CFS7'); await p.fill('#gAsig', 'Mecanitzat'); await p.fill('#gAl', 'Diego Mora Gil\nElena Vidal Ros'); await p.click('#gOk'); await espera(100);
    ok(await p.evaluate(() => D.grupos.length === 2 && gSel === 1 && L.alumnos.length === 2 && L.a.nombre === 'Mecanitzat' && document.querySelectorAll('#tabsG .pill[data-g]').length === 2),
        '＋ Grupo: con su primera asignatura y su lista de alumnos');
    ok(await p.evaluate(() => document.querySelector('#hoja').textContent.includes('no tiene bloques')), 'la asignatura nueva, vacía');
    // cambiar de grupo y de asignatura
    await p.click('#tabsG [data-g="0"]'); await p.click('#tabsA [data-a="1"]');
    ok(await p.evaluate(() => L.grupo === '2CFS7 · Proyecto intermodular' && L.alumnos.length === 3), 'las pestañas cambian de grupo y de asignatura');
    // 4) unir y quitar alumnos: en todas las asignaturas del grupo
    await p.evaluate(() => { const x = { id: 'bx', nombre: 'B. Sanz' }; L.alumnos.push(x); D.grupos[0].asigs[0].evals[0].bloques[0].items[0].notas.bx = { n: 9 }; cambio(); });
    await p.click('#bAlumnos');
    ok(await p.evaluate(() => /Alumnos de 2CFS7/.test(document.getElementById('dlgTit').textContent)), '👥 Alumnos: los del grupo');
    await p.evaluate(() => { const b = alumnosOrden().find(a => a.nombre === 'Bruno Sanz Pérez').id; document.querySelectorAll('.aSel').forEach(c => { c.checked = c.value === 'bx' || c.value === b; }); });
    await p.click('#aUnir'); await espera(100);
    ok(await p.evaluate(() => { const b = L.alumnos.find(a => a.nombre === 'Bruno Sanz Pérez'); return L.alumnos.length === 3 && D.grupos[0].asigs[0].evals[0].bloques[0].items[0].notas[b.id].n === 9 && D.grupos[0].asigs[1].evals[0].bloques[0].items[0].notas[b.id].n === 6; }),
        '🔗 unir: las notas de las dos asignaturas pasan al nombre que queda');
    await p.evaluate(() => { cerrarDlg(); const c = L.alumnos.find(a => a.nombre === 'Carla Ruiz Mora'); D.grupos[0].asigs[0].evals[0].bloques[0].items[0].notas[c.id] = { n: 5 }; quitarAlumno(c.id); cambio(); });
    ok(await p.evaluate(() => L.alumnos.length === 2 && Object.keys(D.grupos[0].asigs[0].evals[0].bloques[0].items[0].notas).length === 2), '🗑 quitar un alumno: se va del grupo con sus notas de todas las asignaturas');
    // 5) el acta y el CSV llevan «grupo · asignatura»
    const H = await p.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { open() {}, write(x) { h += x; }, close() {} } }); try { imprimirActa(); } finally { window.open = o; } return h; });
    ok(/2CFS7 · Proyecto intermodular/.test(H), '🖨 el acta, con el grupo y la asignatura');
    // 6) guardar y volver a abrir: se recuerda todo, también el grupo abierto
    await p.reload(); await p.waitForTimeout(400);
    ok(await p.evaluate(() => D.grupos.length === 2 && L.grupo === '2CFS7 · Proyecto intermodular' && D.grupos[1].alumnos.length === 2), 'el navegador recuerda los grupos y la asignatura abierta');
    const libro = await p.evaluate(() => JSON.stringify(D));
    // 7) un libro de antes (una sola clase) se abre como un grupo con una asignatura
    const viejo = { tipo: 'libro-calificaciones', version: 1, grupo: '2CFS8 · Disseny', curso: '2025-2026', alumnos: [{ id: 'v1', nombre: 'Fernando Gil' }],
        evals: [{ id: 'e1', nombre: '1.ª evaluación', peso: 1, modo: 'cero', comentarios: {}, bloques: [{ id: 'b1', nombre: 'Ejercicios', peso: 100, min: null, max: 10, items: [{ id: 'i1', nombre: 'Plano', peso: 1, max: 10, fuente: 'a mano', notas: { v1: { n: 7 } } }] }] }],
        final: { comentarios: {} }, opc: { aprobado: 5 } };
    await p.setInputFiles('#fAbrir', [{ name: 'viejo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(viejo)) }]); await espera(300);
    ok(await p.evaluate(() => !!document.getElementById('abSum')), 'con un libro abierto, pregunta: sustituir o añadir sus grupos');
    await p.click('#abSum'); await espera(150);
    ok(await p.evaluate(() => D.grupos.length === 3 && L.grupo === '2CFS8 · Disseny' && notaEval(L.evals[0], 'v1').n === 7 && D.curso === '2025-2026'),
        'un libro de antes: se suma como un grupo (2CFS8) con su asignatura (Disseny) y sus notas');
    await p.setInputFiles('#fAbrir', [{ name: 'viejo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(viejo)) }]); await espera(300);
    await p.click('#abSum'); await espera(150);
    ok(await p.evaluate(() => D.grupos.map(g => g.nombre).join('|') === '2CFS7|1CFS7|2CFS8|2CFS8 (2)'), 'el mismo grupo dos veces: «(2)»');
    await p.setInputFiles('#fAbrir', [{ name: 'libro.json', mimeType: 'application/json', buffer: Buffer.from(libro) }]); await espera(300);
    await p.click('#abSus'); await espera(150);
    ok(await p.evaluate(() => D.grupos.length === 2 && L.grupo === '2CFS7 · Proyecto intermodular'), 'sustituir: el libro guardado, tal cual');
    // 8) quitar una asignatura y un grupo
    await p.click('#aEd'); await p.click('#sBorrar'); await p.click('#cfSi'); await espera(100);
    ok(await p.evaluate(() => D.grupos[0].asigs.length === 1 && L.alumnos.length === 2), '🗑 quitar una asignatura: los alumnos se quedan');
    await p.click('#aEd'); await p.click('#sBorrar'); await espera(100);
    ok(await p.evaluate(() => D.grupos[0].asigs.length === 1), 'la última asignatura del grupo no se quita');
    await p.evaluate(() => cerrarDlg());
    await p.click('#gEd'); await p.click('#gBorrar'); await p.click('#cfSi'); await espera(100);
    ok(await p.evaluate(() => D.grupos.length === 1 && D.grupos[0].nombre === '1CFS7'), '🗑 quitar un grupo');
    // 9) la importación va al grupo y la asignatura abiertos
    await p.click('#bImportar');
    await p.setInputFiles('#impF', [{ name: 'x - corrección.csv', mimeType: 'text/csv', buffer: Buffer.from('﻿"Alumno";"Archivo";"Nota"\n"Diego Mora Gil";"d.nc";7\n"Nuevo Alumno";"n.nc";5\n') }]);
    await p.waitForSelector('[data-fn]', { timeout: 10000 });
    ok(await p.evaluate(() => /Se importa en 1CFS7 · Mecanitzat/.test(document.getElementById('impCuerpo').textContent)), '📥 dice en qué grupo y asignatura se importa');
    await p.click('#impOk'); await espera(200);
    ok(await p.evaluate(() => L.alumnos.length === 3 && D.grupos[0].alumnos.length === 3), 'y los alumnos nuevos se suman a ese grupo');
    ok(p.errs.length === 0, 'sin errores de JavaScript ' + p.errs.join(' | '));
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
