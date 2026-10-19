"""Genera el icono de cada app a partir de los dibujos SVG de la portada (index.html).

    python3 scripts/iconos.py ../index.html

Para cada edición de ediciones/ediciones.json toma el icono nº «icono»
(0 = el logo de la cabecera, 1 = el de la primera ficha, 2 = la segunda…),
lo dibuja en blanco sobre el cuadrado azul de la suite y deja en
src-tauri/icons/<edición>/ todos los tamaños (con «npx tauri icon»).

Solo hace falta volver a ejecutarlo si cambias los iconos de la portada.
Necesita: pip install cairosvg
"""
import json, re, subprocess, sys, pathlib
import cairosvg

RAIZ = pathlib.Path(__file__).resolve().parent.parent
portada = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else RAIZ.parent / "index.html").read_text(encoding="utf-8")
ediciones = json.loads((RAIZ / "ediciones" / "ediciones.json").read_text(encoding="utf-8"))["ediciones"]

# 0: logo de la cabecera (sin su cuadrado de fondo) · 1…: iconos de las fichas
logo = re.search(r'<svg class="logo" viewBox="0 0 54 54"[^>]*>(.*?)</svg>', portada, re.S).group(1)
logo = re.sub(r"<rect[^>]*/>", "", logo, count=1)
fichas = re.findall(r'<div class="icono"><svg viewBox="0 0 24 24">(.*?)</svg>', portada, re.S)
dibujos = [("0 0 54 54", logo, None)] + [("0 0 24 24", f, 1.8) for f in fichas]

def svg_icono(viewbox, contenido, grosor):
    x0, y0, w, h = map(float, viewbox.split())
    lado = 1024
    zona = 640 if grosor is None else 600                     # tamaño del dibujo dentro del cuadrado
    k = zona / w
    dx = (lado - zona) / 2 - x0 * k
    dy = (lado - zona) / 2 - y0 * k
    trazo = "" if grosor is None else (
        f'fill="none" stroke="#ffffff" stroke-width="{grosor}" stroke-linecap="round" stroke-linejoin="round"')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{lado}" height="{lado}" viewBox="0 0 {lado} {lado}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0a6cb8"/><stop offset="1" stop-color="#003f73"/></linearGradient></defs>
  <rect x="60" y="60" width="904" height="904" rx="200" fill="url(#g)"/>
  <g transform="translate({dx:.2f} {dy:.2f}) scale({k:.4f})" {trazo}>{contenido}</g>
</svg>'''

for nombre, ed in ediciones.items():
    n = ed.get("icono", 0)
    if n >= len(dibujos):
        print(f"  (no hay icono nº {n} para {nombre}: se queda el de por defecto)")
        continue
    carpeta = RAIZ / "src-tauri" / "icons" / nombre
    carpeta.mkdir(parents=True, exist_ok=True)
    png = carpeta / "fuente.png"
    cairosvg.svg2png(bytestring=svg_icono(*dibujos[n]).encode(), write_to=str(png))
    subprocess.run(["npx", "tauri", "icon", str(png), "-o", str(carpeta)], cwd=RAIZ, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for sobra in ("android", "ios"):
        subprocess.run(["rm", "-rf", str(carpeta / sobra)])
    print(f"  ✓ {nombre}: icono nº {n}")
