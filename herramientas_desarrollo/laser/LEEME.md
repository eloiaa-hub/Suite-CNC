# Calcador láser: desarrollo

- **`modulo_laser.js`**: todo el modo láser (pestaña 🔥 Láser, programa para láser en 📋 Solución, 🟫 Mesa y el motor que escribe los .rd). Vive dentro de `calcador.html`, entre las marcas `MODO LÁSER`, y solo se activa con `data-laser="1"`.
- **`generar_laser.py`**: copia el módulo dentro de `calcador.html` y escribe `laser.html` (marca `data-laser="1"`, título, versión y autoguardado propio). Ejecútalo cada vez que cambies el Calcador o el módulo:

      python3 herramientas_desarrollo/laser/generar_laser.py

- **`generador_rd.html`**: herramienta independiente para abrir cualquier `.rd` (también los de Atheon Design), ver sus órdenes descifradas y la suma de control, y generar `.rd` desde DXF, SVG o PLT. Sirve para comparar archivos.
- **`referencia_atheon/`**: un trabajo real de Atheon Design, con el que se comprueba el formato.
