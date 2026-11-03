"""Valida un DXF del Anidador con ezdxf y devuelve un resumen en JSON (lo usa anidador.js)."""
import sys, json, ezdxf
from ezdxf import bbox
from ezdxf import recover
doc, aud = recover.readfile(sys.argv[1])
msp = doc.modelspace()
pols = [e for e in msp if e.dxftype() == 'POLYLINE']
xs, ys = [], []
for e in pols:
    if e.dxf.layer == 'TABLERO':
        continue
    for v in e.vertices:
        xs.append(v.dxf.location.x); ys.append(v.dxf.location.y)
print(json.dumps({
    'version': doc.dxfversion, 'polilineas': len(pols), 'textos': len([e for e in msp if e.dxftype() == 'TEXT']),
    'capas': sorted(l.dxf.name for l in doc.layers), 'errores': len(aud.errors),
    'piezas': {'x0': min(xs), 'x1': max(xs), 'y0': min(ys), 'y1': max(ys)} if xs else None,
    'nombres': [e.dxf.text for e in msp if e.dxftype() == 'TEXT'][:6],
    'colores': [e.dxf.color for e in pols if e.dxf.layer != 'TABLERO'],
    'coloresTexto': [e.dxf.color for e in msp if e.dxftype() == 'TEXT'],
    # extensión real de cada polilínea (con sus arcos), para comprobar hacia dónde van los arcos
    'cajas': [[round(v, 3) for v in (b.extmin.x, b.extmin.y, b.extmax.x, b.extmax.y)] for b in (bbox.extents([e]) for e in pols if e.dxf.layer != 'TABLERO')]}, ensure_ascii=False))
