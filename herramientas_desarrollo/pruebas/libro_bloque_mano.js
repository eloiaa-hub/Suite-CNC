// 📒 Libro de calificaciones v9: un bloque sin ejercicios tiene su columna para escribir las notas (al escribir la
// primera se crea su ejercicio), minimizar los bloques y la cabecera de grupos y asignaturas. Datos inventados.
const { lanzar, abrir } = require('./comun');
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const b = await lanzar(), p = await abrir(b, 'libro_calificaciones.html');
    await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(400);
    await p.fill('#vAl', 'Ana García López\nBruno Sanz Pérez\nCarla Ruiz Mora'); await p.click('#vAlOk'); await espera(150);
    // 1) ➕ Bloque: su columna para escribir las notas, sin importar nada
    await p.click('#evBloque'); await espera(100);
    await p.fill('.bloque[data-b="0"] .bn', 'ARCOS I, J'); await p.dispatchEvent('.bloque[data-b="0"] .bn', 'change'); await espera(100);
    await p.fill('.bloque[data-b="0"] [data-campo="max"]', '3'); await p.dispatchEvent('.bloque[data-b="0"] [data-campo="max"]', 'change'); await espera(100);
    const col = await p.evaluate(() => [...document.querySelectorAll('input.celda')].map(x => x.dataset.it));
    ok(col.length === 3 && col.every(x => x.startsWith('nuevo:')) && await p.evaluate(() => /ARCOS I, J/.test(document.querySelector('th.nueva').textContent)),
        '➕ Bloque: una columna con el nombre del bloque para escribir las notas');
    // la primera nota crea el ejercicio; Intro baja al siguiente alumno, que ya está en el ejercicio nuevo
    const c0 = (await p.$$('input.celda'))[0]; await c0.fill('2'); await c0.press('Enter'); await espera(450);
    ok(await p.evaluate(() => { const b = L.evals[0].bloques[0]; return b.items.length === 1 && b.items[0].nombre === 'ARCOS I, J' && b.items[0].max === 3 && b.items[0].notas[alumnosOrden()[0].id].n === 2; }),
        'la primera nota crea el ejercicio «ARCOS I, J» (sobre 3, el máx. del bloque) con esa nota');
    ok(await p.evaluate(() => { const a = document.activeElement; return a && a.classList.contains('celda') && a.dataset.a === alumnosOrden()[1].id && a.dataset.it === L.evals[0].bloques[0].items[0].id; }),
        'y el cursor pasa al alumno de abajo, en la misma columna');
    await p.keyboard.type('3'); await p.keyboard.press('Enter'); await espera(450);
    ok(await p.evaluate(() => { const it = L.evals[0].bloques[0].items[0]; return it.notas[alumnosOrden()[1].id].n === 3 && Math.abs(mediaBloque(L.evals[0], L.evals[0].bloques[0], alumnosOrden()[0].id) - 20 / 3) < 1e-9; }),
        'la segunda nota, en el mismo ejercicio; la media del bloque, sobre 10');
    // un segundo bloque vacío y Tab desde el primero
    await p.click('#evBloque'); await espera(100);
    ok(await p.evaluate(() => document.querySelectorAll('input.celda[data-it^="nuevo:"]').length === 3 && document.querySelector('th.nueva') !== null), 'otro bloque, con su columna');
    // 2) minimizar los bloques
    await p.click('#evMini'); await espera(100);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('bloques')).display === 'none' && document.querySelectorAll('.bmini').length === 2 && /ARCOS I, J/.test(document.querySelector('.bmini').textContent)),
        '▴ Minimizar bloques: una línea con cada bloque y su %');
    await p.reload(); await espera(400);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('bloques')).display === 'none'), 'se recuerda');
    await p.click('.bmini'); await espera(100);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('bloques')).display !== 'none'), 'clic en un bloque: se vuelven a ver');
    // 3) minimizar la cabecera de grupos y asignaturas
    await p.evaluate(() => { D.grupos.push(grupoNuevo('1CFS7', 'Mecanització')); D.grupos[0].nombre = '2CFS7'; cambio(); });
    await p.click('#clOcultar'); await espera(100);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('clasesTodo')).display === 'none' && getComputedStyle(document.getElementById('clasesMini')).display === 'flex'), '▴ grupos y asignaturas: una sola línea');
    await p.selectOption('#mG', '1'); await espera(100);
    ok(await p.evaluate(() => L.grupo === '1CFS7 · Mecanització' && document.getElementById('cajaClases').classList.contains('mini-clases')), 'minimizada, se cambia de grupo con su desplegable');
    await p.click('#clMostrar'); await espera(100);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('clasesTodo')).display !== 'none'), '▾ se vuelven a ver las pestañas');
    ok(p.errs.length === 0, 'sin errores de JavaScript ' + p.errs.join(' | '));
    await b.close();
    console.log(`fallos ${fallos}`); process.exit(fallos ? 1 : 0);
})();
