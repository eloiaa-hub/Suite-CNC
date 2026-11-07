// Imprime manual_laser.html a manual_laser.pdf con Chrome (A4, como el resto de manuales de la suite)
// Uso: node herramientas_desarrollo/laser/manual/pdf_manual.js
const { chromium } = require('playwright');
const path = require('path');
const raiz = path.resolve(__dirname, '../../..');
(async () => {
    const b = await chromium.launch(), p = await b.newPage();
    await p.goto('file://' + path.join(raiz, 'manual_laser.html'));
    await p.waitForTimeout(500);
    await p.pdf({ path: path.join(raiz, 'manual_laser.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await b.close();
    console.log('manual_laser.pdf');
})();
