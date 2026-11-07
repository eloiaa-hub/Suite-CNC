#!/usr/bin/env python3
"""Construye laser.html (Calcador láser) a partir de calcador.html, como se hace con el Corrector.

1. Si existe modulo_laser.js (junto a este script), lo copia dentro de calcador.html,
   entre las marcas «MODO LÁSER». En calcador.html ese bloque no hace nada.
2. Escribe laser.html: el mismo programa con data-laser="1", su título, su versión
   y su propio autoguardado (laser_estado), para no mezclarse con el Calcador.

Uso (desde la raíz de la suite):  python3 herramientas_desarrollo/laser/generar_laser.py
"""
import pathlib, re, sys

VERSION_LASER = 'v1'
AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
CALC = RAIZ / 'calcador.html'
SALIDA = RAIZ / 'laser.html'
MODULO = AQUI / 'modulo_laser.js'
INI, FIN = '<!-- MODO LÁSER: inicio -->', '<!-- MODO LÁSER: fin -->'


def cambiar(texto, viejo, nuevo, veces=1):
    n = texto.count(viejo)
    if n != veces:
        sys.exit(f'ERROR: se esperaba {veces} vez/veces «{viejo[:70]}» y hay {n}')
    return texto.replace(viejo, nuevo)


calc = CALC.read_text(encoding='utf-8')

# 1. el módulo dentro de calcador.html
if MODULO.exists():
    bloque = f'{INI}\n<script>\n{MODULO.read_text(encoding="utf-8").rstrip()}\n</script>\n{FIN}\n'
    if INI in calc:
        calc = re.sub(re.escape(INI) + r'.*?' + re.escape(FIN) + r'\n?', lambda m: bloque, calc, flags=re.S)
    else:
        calc = cambiar(calc, '</body>\n</html>', bloque + '</body>\n</html>')
    CALC.write_text(calc, encoding='utf-8')
    print('calcador.html: módulo láser actualizado')

# 2. laser.html
las = calc
las = cambiar(las, '<html lang="es" data-calc2="1">', '<html lang="es" data-calc2="1" data-laser="1">')
las = cambiar(las, '<title>Calcador de contornos — Por Eloi A.A.</title>', '<title>Calcador láser — Por Eloi A.A.</title>')
las = cambiar(las, '<span class="top-bar-title">⬡ Calcador de contornos — Por Eloi A.A.', '<span class="top-bar-title">🔥 Calcador láser — Por Eloi A.A.')
las = re.sub(r'(title="Versión del programa"[^>]*>)v\d+(<)', lambda m: m.group(1) + VERSION_LASER + m.group(2), las, count=1)
las = cambiar(las, "'calcador_estado'", "'laser_estado'", calc.count("'calcador_estado'"))
las = cambiar(las, "'calcador_estado_danado'", "'laser_estado_danado'", calc.count("'calcador_estado_danado'"))
SALIDA.write_text(las, encoding='utf-8')
print(f'laser.html escrito ({SALIDA.stat().st_size // 1024} KB, {VERSION_LASER})')
