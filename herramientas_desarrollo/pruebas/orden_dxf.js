// Calcador v82: orden de corte (interiores primero por defecto, elegible) y DXF R12 completo (también con un anidado).
// Uso: node orden_dxf.js        (necesita Python con ezdxf)
const { lanzar, abrir, ejercicios, fs, path, SUITE } = require('./comun');
const { execFileSync } = require('child_process'), os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ordxf-'));
const PY = `
import sys, json, math, ezdxf
doc = ezdxf.readfile(sys.argv[1])             # lectura estricta (sin recuperar)
aud = doc.audit()
msp = doc.modelspace()
L = 0.0; ents = {}
for e in msp:
    t = e.dxftype(); ents[t] = ents.get(t, 0) + 1
    if t == 'LINE': L += math.hypot(e.dxf.end.x - e.dxf.start.x, e.dxf.end.y - e.dxf.start.y)
    elif t == 'ARC':
        a = (e.dxf.end_angle - e.dxf.start_angle) % 360 or 360; L += math.radians(a) * e.dxf.radius
    elif t == 'POLYLINE':
        for s in e.virtual_entities():
            if s.dxftype() == 'LINE': L += math.hypot(s.dxf.end.x - s.dxf.start.x, s.dxf.end.y - s.dxf.start.y)
            else: a = (s.dxf.end_angle - s.dxf.start_angle) % 360 or 360; L += math.radians(a) * s.dxf.radius
from ezdxf import bbox
b = bbox.extents(msp)
print(json.dumps({'version': doc.dxfversion, 'errores': len(aud.errors), 'ents': ents, 'L': L, 'capas': sorted(l.dxf.name for l in doc.layers),
   'caja': [b.extmin.x, b.extmin.y, b.extmax.x, b.extmax.y] if b.has_data else None}))
`;
(async () => {
  const b = await lanzar(); let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
  const cal = await abrir(b, 'calcador.html');
  const ISO = JSON.parse(fs.readFileSync(path.join(__dirname, 'ISO 13 - dos herramientas.json'), 'utf8'));
  // 1) orden de corte
  const gen = () => cal.evaluate(() => { abrirMec(); generarMec(); const t = document.getElementById('mecTexto').value; cerrarMec && cerrarMec();
    return { trazados: (t.match(/══════ Trazado \d+\/\d+ — [A-ZÁÉÍÓÚ]+/g) || []).map(x => x.split('— ')[1]), cab: (t.match(/;; Trazados[^\n]*/) || [''])[0] }; });
  await cal.evaluate(d => { localStorage.clear(); abrirJSONDatos(d); }, ISO);
  let r = await gen();
  ok(r.trazados[0] === 'INTERIOR' && r.trazados[r.trazados.length - 1] === 'EXTERIOR' && /interiores primero/.test(r.cab), `por defecto, interiores primero: ${r.trazados.join(' → ')} · «${r.cab.slice(-45)}»`);
  ok(await cal.evaluate(() => document.getElementById('mecOrden').value) === 'int', 'el campo «Orden de corte» dice «Interiores primero»');
  const tabla = () => cal.evaluate(() => { const d = tablaCuest ? tablaCuest('g90', 'ij') : datosTabla(); return d.grupos.map(g => g.titulo.replace(/^C\d+ · /, '')); });
  ok((await tabla())[0] === 'interior', `la tabla de soluciones también empieza por el interior (${(await tabla()).join(', ')})`);
  await cal.evaluate(() => { abrirMec(); const s = document.getElementById('mecOrden'); s.value = 'ext'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  r = await gen();
  ok(r.trazados[0] === 'EXTERIOR' && r.trazados[r.trazados.length - 1] === 'INTERIOR' && /exteriores primero/.test(r.cab), `eligiendo «Exteriores primero»: ${r.trazados.join(' → ')}`);
  ok((await tabla())[0] === 'exterior', 'y la tabla de soluciones empieza por el exterior');
  const j = await cal.evaluate(() => exportarJSON(true));
  ok(j.calcador.cfgMec.orden === 'ext', 'el orden se guarda en el JSON');
  await cal.evaluate(d => { cfgMec.orden = 'int'; abrirJSONDatos(d); }, j);
  ok(await cal.evaluate(() => cfgMec.orden) === 'ext', 'y se recupera al abrirlo');
  // con un JSON antiguo (sin el campo) queda el de por defecto
  await cal.evaluate(() => { localStorage.clear(); }); await cal.reload(); await cal.waitForTimeout(600);
  await cal.evaluate(d => abrirJSONDatos(d), ISO);
  ok(await cal.evaluate(() => cfgMec.orden) === 'int', 'un ejercicio sin el campo: interiores primero');
  // la corrección no depende del orden: el programa de ⚙️ Mecanizar sale bien y el de la tabla se corrige igual en los dos
  const cor = {};
  for (const o of ['int', 'ext']) cor[o] = await cal.evaluate(o => { cfgMec.orden = o; memoTipos = null; const r1 = corregirPrograma(textoTabla('iso')); abrirMec(); generarMec(); const t2 = document.getElementById('mecTexto').value;
    return { tabla: [r1.piezaOk, r1.hallazgos.filter(h => h.tipo === 'error').length], mec: corregirPrograma(t2).piezaOk }; }, o);
  ok(cor.int.mec && cor.ext.mec && cor.int.tabla[0] && JSON.stringify(cor.int.tabla) === JSON.stringify(cor.ext.tabla), `la corrección no depende del orden ${JSON.stringify(cor)}`);
  // 2) DXF: un ejercicio y un anidado del Anidador abierto en el Calcador, en los dos modos
  const anid = await abrir(b, 'anidador.html');
  await anid.evaluate(() => localStorage.clear()); await anid.reload(); await anid.waitForTimeout(400);
  const ejs = ejercicios().filter(f => /Ejercicio (12|25)\.json|Nota musical|avanzado 03/.test(f)).slice(0, 4);
  await anid.setInputFiles('#archivo', ejs); await anid.waitForTimeout(800);
  await anid.evaluate(() => { piezas.push({ id: 'r1', nombre: 'Tapa ñandú', tipo: 'rect', L: 300, A: 200, cant: 2, veta: true, giro: null, color: 'azul' }); todo(); });
  const tablero = await anid.evaluate(() => proyectoTablero(0));
  const casos = [['ISO 13', ISO], ['Ejercicio 902', JSON.parse(fs.readFileSync(ejercicios().find(f => /Nota musical/.test(f)), 'utf8'))], ['anidado', tablero]];
  for (const [nom, d] of casos) for (const modo of ['lw', 'r12']) {
    const res = await cal.evaluate(([d, modo]) => { abrirJSONDatos(d); document.getElementById('selDxf').value = modo;
      const cs = contornos.filter(c => c.pts.length >= 2); let L = 0; cs.forEach(c => tramos(c).forEach(t => { if (!t.b) L += Math.hypot(t.p2.x - t.p1.x, t.p2.y - t.p1.y); else { const a = arcoDeBulge(t.p1, t.p2, t.b); L += Math.abs(a.theta) * a.r; } }));
      return { dxf: textoDXFCalc(), L, n: cs.length }; }, [d, modo]);
    const f = path.join(TMP, `${nom}_${modo}.dxf`); fs.writeFileSync(f, res.dxf);
    let v; try { v = JSON.parse(execFileSync('python3', ['-c', PY, f]).toString()); } catch (e) { ok(false, `${nom} (${modo}): ezdxf no lo lee ${String(e.stderr || e.message).slice(0, 300)}`); continue; }
    const nEnt = modo === 'lw' ? (v.ents.POLYLINE || 0) : (v.ents.LINE || 0) + (v.ents.ARC || 0);
    ok(v.version === 'AC1009' && !v.errores && Math.abs(v.L - res.L) < 0.01 * res.L + 0.01 && (modo !== 'lw' || nEnt === res.n) && v.capas.includes('PERFIL') && !v.ents.LWPOLYLINE,
      `${nom} (${modo === 'lw' ? 'polilíneas' : 'líneas y arcos'}): R12 sin errores, ${JSON.stringify(v.ents)}, longitud ${v.L.toFixed(1)} / ${res.L.toFixed(1)} mm, capas ${v.capas.join(' ')}`);
    ok(/\$ACADVER\r\n\s*1\r\nAC1009/.test(res.dxf) && /\$EXTMIN/.test(res.dxf) && /\r\n/.test(res.dxf) && /TABLES/.test(res.dxf), `${nom} (${modo}): cabecera con versión, extensión y tablas`);
  }
  // el DXF del Calcador se vuelve a abrir en el Calcador como fondo
  ok(!cal.errs.length && !anid.errs.length, 'sin errores de JavaScript ' + cal.errs.concat(anid.errs).join(' | '));
  await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
  console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
})();
