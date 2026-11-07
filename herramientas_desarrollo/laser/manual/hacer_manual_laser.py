#!/usr/bin/env python3
"""Escribe manual_laser.html (con las capturas dentro) a partir de este texto y de las capturas de la carpeta.

Uso: python3 herramientas_desarrollo/laser/manual/hacer_manual_laser.py CARPETA_CAPTURAS
Después, manual_laser.pdf se imprime con Chrome (pdf_manual.js, en esta misma carpeta).
"""
import base64, pathlib, re, sys

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent.parent
CAP = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / 'capturas'

# Los mismos estilos que el resto de manuales de la suite (los del Corrector)
modelo = (RAIZ / 'manual_corrector.html').read_text(encoding='utf-8')
estilo = modelo[modelo.index('<style>'):modelo.index('</style>') + 8]
juntos = modelo[modelo.index('<script>/* titulos-juntos */'):modelo.index('</script>', modelo.index('<script>/* titulos-juntos */')) + 9]


def img(nombre, ancho='100%', pie=''):
    datos = base64.b64encode((CAP / nombre).read_bytes()).decode()
    f = f'<figure><img src="data:image/jpeg;base64,{datos}" style="width:{ancho}">'
    return f + (f'<figcaption>{pie}</figcaption>' if pie else '') + '</figure>'


B = lambda t: f'<span class="boton">{t}</span>'

capitulos = []
def cap(titulo, html):
    capitulos.append((titulo, html))

cap('Qué es el Calcador láser', f'''
<p>El <strong>Calcador láser</strong> es el Calcador de contornos preparado para la <strong>cortadora láser del taller</strong> (Atheon de Nomatech, con controladora Ruida). Se dibuja la pieza igual que en el Calcador, con sus cotas y su programa ISO, y además:</p>
<ul>
<li>escribe el <strong>archivo .rd</strong> que recibe la máquina, con la velocidad, la potencia y las pasadas de cada capa, igual que los que hace Atheon Design;</li>
<li>escribe el <strong>programa ISO para láser</strong> de la pieza (G90, G91 o mixta), para que los alumnos lo estudien igual que el de la fresa;</li>
<li>corta en la láser los <strong>programas G-code de los alumnos</strong>: G1, G2 y G3 cortan y G0 se mueve sin láser;</li>
<li>guarda una <strong>biblioteca de parámetros de corte</strong> por material y grosor, que lee y escribe también el Param.lib de Atheon Design;</li>
<li>enseña la <strong>mesa de la máquina</strong> con el cero máquina y dónde queda la pieza;</li>
<li>guarda el trabajo como <strong>proyecto .rld</strong> para abrirlo y retocarlo en Atheon Design.</li>
</ul>
<p>Es el mismo programa que el Calcador con el modo láser activado, así que el dibujo, las cotas, la biblioteca de ejercicios y la apertura de DXF, SVG y JSON funcionan igual: consulta el <strong>manual del Calcador</strong> para todo eso. Guarda su propio trabajo: lo que hagas aquí no cambia lo que tengas abierto en el Calcador.</p>
<div class="nota atencion"><strong>⚠️ Antes de cortar.</strong> La láser corta lo que dice el archivo. Prueba cada archivo nuevo con <strong>poca potencia</strong> o solo con el <strong>marco</strong> del panel (el recorrido del contorno exterior con el láser apagado), comprueba dónde queda la pieza y no dejes nunca la máquina cortando sola.</div>
''')

cap('La pantalla', img('pantalla.jpg', pie='El Calcador láser con una pieza de la biblioteca de inicio y la pestaña 🔥 Láser.') + f'''
<table class="zonas">
<tr><td class="n">1</td><td><strong>Barra superior.</strong> El nombre del trabajo, {B('🗋 Nuevo')}, {B('📂 Abrir')}, {B('🖼 Fondo')}, {B('💾 Guardar')}, {B('⬇ Exportar')}, {B('🗂 Biblioteca')} y {B('📖 Manual')}, como en el Calcador.</td></tr>
<tr><td class="n">2</td><td><strong>🟫 Mesa.</strong> Enseña la mesa de la láser, el cero máquina y dónde queda la pieza (capítulo 7).</td></tr>
<tr><td class="n">3</td><td><strong>Herramientas de dibujo</strong> y, a su lado, las pestañas Dibujo, Construcción y Formas: las del Calcador.</td></tr>
<tr><td class="n">4</td><td><strong>El lienzo</strong>, con la pieza, sus cotas y el cero pieza.</td></tr>
<tr><td class="n">5</td><td><strong>Panel derecho</strong>, con dos pestañas: {B('📋 Solución')}, el programa ISO para láser (capítulo 4), y {B('🔥 Láser')}, todo lo de la máquina.</td></tr>
<tr><td class="n">6</td><td><strong>Qué se corta</strong>: el dibujo o un programa G-code (capítulo 10).</td></tr>
<tr><td class="n">7</td><td><strong>📚 Parámetros de corte</strong>: la biblioteca de materiales (capítulo 6).</td></tr>
<tr><td class="n">8</td><td><strong>Resumen</strong> de la pieza y, debajo, {B('👁 Vista previa…')}, {B('⬇ Exportar .rd')}, {B('💾 Guardar proyecto .rld')} y los ajustes de la <strong>⚙️ Máquina</strong>.</td></tr>
</table>
<p>No aparecen las partes del Calcador que solo sirven para la fresa: la pestaña ⚙️ Máquina del programa, la compensación, la fresa, la profundidad y la Z, ni los bloques de ejercicios y corrección.</p>
''')

cap('La pieza: dibujarla o abrirla', f'''
<p>La pieza se dibuja, se calca o se abre como en el Calcador (rectas, arcos, figuras, texto de una línea, DXF, SVG o un JSON de la biblioteca). Cada contorno va a una de las dos <strong>capas</strong> del láser:</p>
<table class="tabla"><tr><th>Capa</th><th>Qué va en ella</th><th>Para qué</th></tr>
<tr><td><strong>● Corte</strong> (negra)</td><td>Los contornos <strong>cerrados</strong>: el exterior de la pieza y los agujeros.</td><td>Atravesar el material.</td></tr>
<tr><td><strong style="color:#0000ff">● Marcado</strong> (azul)</td><td>Los trazos <strong>abiertos</strong>, los <strong>textos</strong> y lo que en la pestaña Contornos sea <strong>grabado</strong> o <strong>cajera</strong>.</td><td>Marcar la superficie con poca potencia, sin atravesarla.</td></tr></table>
<p>Para que un contorno cerrado se marque en lugar de cortarse, cámbiale la operación a <strong>grabado</strong> en la pestaña <strong>Contornos</strong> del panel derecho.</p>
<div class="nota"><strong>💡 Las cotas no se cortan.</strong> Al láser solo van los contornos: las cotas, los nombres de los puntos, la rejilla y el fondo son para el plano.</div>
''')

cap('📋 Solución: el programa para láser', f'''
<div class="par"><div>{img('solucion.jpg', pie='El bloque «🔥 Láser» y el programa de la pieza.')}</div><div>
<p>La pestaña {B('📋 Solución')} escribe el <strong>programa ISO de la pieza para una láser</strong> mientras se dibuja, comentado línea a línea, como en el Calcador. En el bloque <strong>🔥 Láser</strong>:</p>
<ul>
<li><strong>Coordenadas:</strong> G90 (absolutas), G91 (incrementales, con el primer desplazamiento en G90) o mixta (G90 para entrar y salir, G91 en el recorrido).</li>
<li><strong>Herramienta:</strong> el láser. No hay fresa, compensación ni Z.</li>
<li><strong>Corte</strong> y <strong>Marcado:</strong> el <strong>material</strong> de la biblioteca, la <strong>velocidad</strong>, las <strong>pasadas</strong> y la <strong>potencia</strong> mínima y máxima.</li>
<li><strong>Soplado de aire</strong> y el <strong>orden</strong> de los contornos.</li>
</ul>
<p>Son los mismos valores que en la pestaña 🔥 Láser: si cambias uno, cambia en las dos.</p>
</div></div>
<h3>Cómo se lee</h3>
<table class="tabla"><tr><th>Código</th><th>En la láser</th></tr>
<tr><td><code>G71 G90</code></td><td>Milímetros y coordenadas absolutas, como siempre.</td></tr>
<tr><td><code>M08</code> / <code>M09</code></td><td>Abre y cierra el soplado de aire.</td></tr>
<tr><td><code>G0 X… Y…</code></td><td>Desplazamiento rápido con el láser apagado.</td></tr>
<tr><td><code>M03 S600</code></td><td>Enciende el láser. <strong>S</strong> es la potencia de 0 a 1000: S600 = 60 %.</td></tr>
<tr><td><code>G1</code> / <code>G2</code> / <code>G3 … F1800</code></td><td>Corta en recta o en arco. <strong>F</strong> va en mm/min: F1800 = 30 mm/s.</td></tr>
<tr><td><code>M05</code></td><td>Apaga el láser.</td></tr>
<tr><td>Pasadas</td><td>En lugar de bajar en Z, el láser repite el contorno: cada pasada empieza con su <code>M03</code> y acaba con su <code>M05</code>.</td></tr></table>
<p>Primero se marca y después se corta; los agujeros, antes que el contorno que los rodea. Con {B('⬇ Guardar .nc')} se guarda el programa.</p>
<div class="par"><div>{img('explicacion.jpg', pie='Al pulsar una línea, el panel explica qué hace cada código.')}</div><div>
<p>Como en el Calcador, <strong>al pulsar una línea</strong> (o avanzar con ▶▏) el panel explica qué hace cada código y el láser se mueve sobre el dibujo: el <strong>M03</strong> enciende el láser, la <strong>S</strong> es la potencia, el <strong>G0</strong> se mueve con el láser apagado…</p></div></div>
<div class="nota atencion"><strong>⚠️ La Atheon no lee G-code.</strong> Este programa es para aprender a programar una láser: sigue las costumbres de las láseres que sí leen G-code (M03 S… y M05). A la máquina del taller se le envía el archivo <strong>.rd</strong> (capítulo 9).</div>
''')

cap('🔥 Láser: capas y orden de corte', img('laser_capas.jpg', '78%', 'Qué se corta y las dos capas.') + f'''
<p>En la pestaña {B('🔥 Láser')}, cada capa tiene:</p>
<ul>
<li><strong>mm/s:</strong> la velocidad de corte.</li>
<li><strong>Mín %</strong> y <strong>Máx %:</strong> la potencia. La máxima es la de corte; la mínima, la que usa la máquina al frenar en las esquinas, para que no se quemen. Con el mismo valor en las dos, la potencia no cambia.</li>
<li><strong>Cortar:</strong> sin marcar, la capa no se envía a la máquina.</li>
<li><strong>Aire:</strong> el soplado, que limpia el humo y evita que la madera arda.</li>
<li><strong>Pasadas:</strong> cuántas veces se repite cada contorno. Para grosores que no atraviesa de una vez, es mejor 2 pasadas rápidas que 1 muy lenta.</li>
</ul>
<h3>El orden</h3>
<ol>
<li>Primero la capa <strong>Marcado</strong> y después la <strong>Corte</strong>: si se marcara después, la pieza ya estaría suelta y podría moverse.</li>
<li>En cada capa, los <strong>interiores</strong> (agujeros) antes que el contorno que los rodea.</li>
<li>Entre los que pueden ir, el <strong>más cercano</strong>, y se entra por su punto más próximo, para moverse lo menos posible en vacío.</li>
</ol>
''')

cap('📚 Parámetros de corte', f'''
<div class="par"><div>{img('biblioteca.jpg', pie='La biblioteca, con los parámetros de inicio.')}</div><div>
<p>La biblioteca guarda la <strong>velocidad, la potencia, las pasadas y el aire</strong> de cada material y grosor, para corte o para marcado. Se guarda en el navegador: sigue ahí al volver a abrir el programa.</p>
<ul>
<li>{B('Usar')} pone sus valores en su capa. Encima de la lista se lee el material en uso; si después cambias un valor a mano, deja de figurar.</li>
<li>En {B('📋 Solución')} el material se elige con el selector <strong>Material</strong> de cada capa, y el programa lo comenta.</li>
<li>{B('✎')} edita y {B('✕')} borra.</li>
<li>Las etiquetas <span style="color:#b9772e;border:1px solid #e0b98a;border-radius:4px;padding:0 4px;font-size:9pt">orientativo</span> señalan valores que no se han probado: compruébalos.</li>
</ul></div></div>
<h3>Guardar un material nuevo</h3>
<div class="par"><div>{img('biblioteca_form.jpg', pie='Guardar los valores de la capa Corte como un material nuevo.')}</div><div>
<p>Cuando unos valores corten bien, pulsa {B('＋ Guardar Corte')} (o {B('＋ Guardar Marcado')}): se abre el formulario con los valores de la capa. Escribe el material, el grosor y una nota (cuándo lo probaste, cómo salió) y guárdalo.</p></div></div>
<h3>Exportar e importar</h3>
<ul>
<li>{B('⬇ Exportar')} descarga la biblioteca en un JSON, para llevarla a otro ordenador o compartirla con el departamento. {B('⬆ Importar…')} la carga: <strong>Agregar</strong> añade los materiales que no tengas, y <strong>Sustituir</strong> deja solo los del archivo.</li>
<li>{B('⬆ Importar…')} también lee el <strong>Param.lib</strong> de Atheon Design, su biblioteca de parámetros: los cortes pasan a la capa Corte y los grabados a Marcado. {B('⬇ Atheon (.lib)')} guarda la nuestra en ese formato (las pasadas, que Param.lib no tiene, van en la nota).</li>
<li>{B('Parámetros de inicio')} añade los de la suite (archivo <code>biblioteca_laser/Parametros_laser_inicio.json</code>):</li>
</ul>
<table class="tabla"><tr><th>Material</th><th>Grosor</th><th>Velocidad</th><th>Potencia</th><th>Origen</th></tr>
<tr><td>MDF</td><td>3 mm</td><td>30 mm/s</td><td>60 %</td><td>Biblioteca de fábrica de Atheon</td></tr>
<tr><td>MDF</td><td>4 mm</td><td>23 mm/s</td><td>60 %</td><td>Interpolado · orientativo</td></tr>
<tr><td>MDF</td><td>5 mm</td><td>17 mm/s</td><td>60 %</td><td>Biblioteca de fábrica de Atheon</td></tr>
<tr><td>MDF</td><td>10 mm</td><td>7 mm/s</td><td>60 %</td><td>Interpolado · orientativo</td></tr>
<tr><td>Acrílico</td><td>3 mm</td><td>30 mm/s</td><td>60 %</td><td>Biblioteca de fábrica de Atheon</td></tr>
<tr><td>Acrílico</td><td>5 mm</td><td>16 mm/s</td><td>60 %</td><td>Interpolado · orientativo</td></tr>
<tr><td>Acrílico</td><td>10 mm</td><td>4 mm/s</td><td>60 %</td><td>Biblioteca de fábrica de Atheon</td></tr>
<tr><td>MDF, marcar líneas</td><td>—</td><td>200 mm/s</td><td>14 %</td><td>Del grabado de Atheon · orientativo</td></tr></table>
<div class="nota clase"><strong>👩‍🏫 En el taller.</strong> Cada tablero es distinto (humedad, cola, densidad). Corta una tira de prueba con los parámetros de la biblioteca y ajústalos: si no atraviesa, baja la velocidad o añade una pasada; si quema el borde, sube la velocidad.</div>
''')

cap('🟫 La mesa', img('mesa.jpg', '82%', 'La mesa de la Atheon con la pieza centrada.') + f'''
<p>La casilla <strong>🟫 Mesa</strong>, junto al nombre del trabajo, enseña en el lienzo:</p>
<ul>
<li>la <strong>superficie útil</strong> de la máquina (1000 × 700 mm);</li>
<li>el <strong>cero máquina</strong>, arriba a la derecha, con el sentido de sus ejes: <strong>X hacia la izquierda e Y hacia abajo</strong>, como lo cuenta el panel de la máquina;</li>
<li>la pieza, con un recuadro <span class="verde-t">verde</span> si cabe y <span class="rojo-t">rojo</span> si se sale (con el aviso también en el Resumen);</li>
<li>el <strong>cero pieza</strong>, con su posición en la máquina, y dónde estará el <strong>cabezal al empezar</strong>.</li>
</ul>
''' + img('mesa_detalle.jpg', '82%', 'La pieza en la mesa: el cero pieza y el cabezal al empezar.') + f'''
<p>En el recuadro <strong>Mesa de la láser</strong> se escribe dónde está el cero pieza, en <strong>X</strong> e <strong>Y</strong> desde el cero máquina. {B('Centrar la pieza')} la pone en el centro de la mesa y {B('⤢ Ver la mesa')} la encuadra entera.</p>
<div class="nota"><strong>💡 ¿Cuándo importa la posición?</strong> Con el inicio en <strong>posición actual del cabezal</strong> (el normal, capítulo 12), la pieza se corta donde pongas el cabezal y la mesa sirve para ver si cabe y planificar el tablero. Con <strong>coordenadas de la mesa</strong>, la máquina corta la pieza exactamente donde la ves.</div>
''')

cap('Vista previa y simulación', img('vista_previa.jpg', pie='La vista previa a mitad de la simulación, con las órdenes del archivo.') + f'''
<p>{B('👁 Vista previa…')} enseña el recorrido del láser tal como irá en el archivo:</p>
<ul>
<li>en negro (Corte) y azul (Marcado), lo que corta; en <strong>discontinua</strong>, los desplazamientos en vacío;</li>
<li>la cruz naranja <strong>cabezal</strong>: el punto de la pieza que queda bajo el cabezal al empezar;</li>
<li>{B('▶ Simular')} y la barra recorren el trabajo; el punto rojo es el láser. Lo que falta por cortar se ve en gris;</li>
<li>arriba, lo que corta, el tiempo aproximado y el tamaño del archivo; {B('Órdenes del .rd')} lista lo que contiene el archivo, orden por orden.</li>
</ul>
<p>La rueda amplía y arrastrando se desplaza la vista.</p>
''')

cap('Exportar el .rd y cortar', img('resumen.jpg', '62%', 'El Resumen y los botones para exportar.') + f'''
<p>El <strong>Resumen</strong> da el tamaño de la pieza, cuántos trazados son de corte y de marcado, lo que recorre con el láser y en vacío, y el tiempo aproximado. Avisa si un contorno de corte no está cerrado (la pieza no se soltaría) o si la pieza se sale de la mesa.</p>
<p>{B('⬇ Exportar .rd')} descarga el archivo con el nombre del trabajo. Es el mismo formato que envía Atheon Design: controladora Ruida, código 0x88, con la velocidad, la potencia y las pasadas de cada capa.</p>
<h3>En la máquina</h3>
<ol>
<li>Copia el <code>.rd</code> a un <strong>pendrive</strong> y cárgalo desde el panel de la máquina (menú de archivos, memoria USB).</li>
<li>Coloca el tablero y enfoca el láser a su altura.</li>
<li>Lleva el cabezal al punto de inicio. Con los ajustes de siempre, el cabezal marca la <strong>esquina inferior izquierda de la pieza</strong>: la pieza queda <strong>a la derecha y hacia arriba</strong> del cabezal.</li>
<li>Pulsa el <strong>marco</strong> (Frame) del panel: el cabezal recorre el contorno con el láser apagado. Comprueba que la pieza cabe en el tablero.</li>
<li>Abre el aire y el extractor, cierra la tapa y empieza. No dejes la máquina sola.</li>
</ol>
<div class="nota atencion"><strong>⚠️ La primera vez.</strong> Prueba un archivo nuevo con poca potencia, o una pieza pequeña y asimétrica (una «F») para ver que no sale en espejo. Si saliera en espejo o en otro sitio, revisa el <strong>Origen</strong> y la <strong>Referencia</strong> en ⚙️ Máquina.</div>
''')

cap('Desde un programa G-code', img('gcode.jpg', '62%', 'Un programa de un alumno abierto para cortarlo en la láser.') + f'''
<p>{B('📂 Desde un programa G-code…')}, en <strong>Qué se corta</strong>, abre un programa ISO (<code>.nc</code>, <code>.iso</code>, <code>.txt</code>…) y lo prepara para la láser:</p>
<ul>
<li><strong>G1, G2 y G3 cortan</strong> y <strong>G0</strong> se mueve sin láser.</li>
<li>No se tienen en cuenta la <strong>Z</strong> ni la <strong>compensación</strong> G41/G42: el láser sigue el contorno programado, que es la pieza a su medida.</li>
<li>Entiende lo mismo que el resto de la suite: G90/G91, arcos con I J o con R, polares, G70/G71…</li>
<li>Todo va a la capa <strong>Corte</strong>, con sus parámetros.</li>
</ul>
''' + img('gcode_vista.jpg', '82%', 'La vista previa del programa del alumno: la entrada desde X0 Y0 se cortaría.') + f'''
<p>Lo que esté mal programado <strong>sale mal en la pieza</strong>: si el alumno entra con G1 en lugar de G0, el láser corta la entrada, y el Resumen avisa de que el contorno no se cierra. Los errores del programa se enseñan en rojo debajo del nombre.</p>
<p>{B('✏️ Volver al dibujo')} vuelve a cortar lo dibujado.</p>
<div class="nota clase"><strong>👩‍🏫 En clase.</strong> Los alumnos escriben el programa de una pieza sencilla, lo comprueban en el Simulador 3D y, si está bien, se corta en la láser en un momento. Ver su pieza cortada (o con el error a la vista) les enseña más que la nota.</div>
''')

cap('Guardar el proyecto .rld para Atheon Design', f'''
<p>{B('💾 Guardar proyecto .rld (Atheon Design)')} guarda el trabajo como un proyecto de <strong>Atheon Design</strong>, para abrirlo allí y retocarlo (añadir piezas, cambiar capas, enviarlo a la máquina desde el ordenador):</p>
<ul>
<li>cada contorno es un <strong>objeto</strong>, y los arcos son <strong>curvas</strong>, no tramos cortos;</li>
<li>el <strong>Corte</strong> va en la capa <strong>negra</strong> y el <strong>Marcado</strong> en la <strong>azul</strong>, cada una con su velocidad, potencia y pasadas;</li>
<li>la pieza queda en el sitio de la <strong>🟫 Mesa</strong> y la mesa tiene el tamaño de ⚙️ Máquina.</li>
</ul>
<div class="nota"><strong>💡 ¿.rd o .rld?</strong> El <strong>.rd</strong> va directo a la máquina (pendrive) y no se puede editar. El <strong>.rld</strong> es el proyecto de Atheon Design: se abre en el ordenador, se retoca y desde allí se envía.</div>
''')

cap('⚙️ Máquina', f'''
<div class="par"><div>{img('maquina.jpg', pie='Los ajustes de la máquina, en la pestaña 🔥 Láser.')}</div><div>
<p>Se ajustan una vez y se recuerdan. Los de la Atheon del taller ya vienen puestos.</p></div></div>
<table class="tabla"><tr><th>Ajuste</th><th>Qué es</th></tr>
<tr><td><strong>Mesa</strong></td><td>La superficie útil: 1000 × 700 mm.</td></tr>
<tr><td><strong>Origen</strong></td><td>Dónde está el cero máquina: arriba a la derecha.</td></tr>
<tr><td><strong>Inicio</strong></td><td><strong>Posición actual del cabezal</strong> (el normal, como Atheon Design): la pieza se corta donde pongas el cabezal. <strong>Coordenadas de la mesa</strong>: donde la ves en 🟫 Mesa. <strong>Punto de anclaje</strong>: desde el punto fijado en el panel.</td></tr>
<tr><td><strong>Referencia</strong></td><td>Con «posición actual», el punto de la pieza que queda bajo el cabezal: la esquina inferior izquierda (como Atheon Design), otra esquina o el centro.</td></tr>
<tr><td><strong>Formato</strong></td><td><strong>Atheon Design</strong>: el .rd copia orden por orden uno hecho por Atheon Design. <strong>Genérico Ruida</strong>: la variante de MeerK40t; úsala solo si la otra diera problemas.</td></tr>
<tr><td><strong>Controlador</strong></td><td>El código con que se cifra el .rd: 0x88 en la Atheon (controladoras RDC644x).</td></tr>
<tr><td><strong>Vel. en vacío</strong></td><td>Solo para calcular el tiempo aproximado.</td></tr>
<tr><td><strong>Tolerancia arcos</strong></td><td>Cuánto se pueden separar del arco los tramos rectos con que el .rd hace las curvas (0,02 mm).</td></tr>
<tr><td><strong>Interiores primero · Optimizar</strong></td><td>El orden de corte del capítulo 5.</td></tr></table>
''')

cap('Antes de cortar y problemas frecuentes', f'''
<h3>Antes de cortar</h3>
<ul class="check">
<li>La pieza tiene los contornos de corte <strong>cerrados</strong> (el Resumen no avisa de nada).</li>
<li>Cada capa tiene el <strong>material</strong> del tablero y las pasadas necesarias.</li>
<li>La pieza <strong>cabe</strong> en el tablero (🟫 Mesa y el marco del panel).</li>
<li>El láser está <strong>enfocado</strong> a la altura del tablero.</li>
<li>El <strong>aire</strong> y el <strong>extractor</strong> están en marcha y la tapa cerrada.</li>
<li>Hay alguien delante de la máquina mientras corta.</li>
</ul>
<dl class="faq">
<dt>La pieza no se suelta del tablero.</dt><dd>Falta potencia o sobra velocidad para ese grosor: baja la velocidad o pon una pasada más, y guarda el material corregido en la biblioteca. Comprueba también el enfoque.</dd>
<dt>El borde sale quemado.</dt><dd>Sube la velocidad, baja la potencia mínima (la de las esquinas) o comprueba que el aire está abierto.</dd>
<dt>La pieza sale en otro sitio o en espejo.</dt><dd>Revisa el <strong>Inicio</strong>, la <strong>Referencia</strong> y el <strong>Origen</strong> en ⚙️ Máquina. Con «posición actual», el cabezal marca la esquina inferior izquierda de la pieza.</dd>
<dt>Corta una línea que no está en el dibujo.</dt><dd>Si es un programa G-code, el alumno se mueve con G1 donde debía ir con G0. En la vista previa los desplazamientos en vacío salen en discontinua: lo que sale continuo, se corta.</dd>
<dt>«No hay nada que cortar».</dt><dd>Las dos capas están sin la casilla <strong>Cortar</strong>, o el programa G-code no tiene G1, G2 ni G3.</dd>
<dt>Los valores de la biblioteca no son los nuevos.</dt><dd>La biblioteca se guarda en el navegador. Pulsa {B('Parámetros de inicio')} y elige <strong>Sustituir</strong> (pierdes los tuyos) o <strong>Agregar</strong>.</dd>
<dt>Atheon Design no abre el .rld.</dt><dd>Envía la pieza con el <strong>.rd</strong>, que va directo a la máquina, y avisa con el archivo para revisarlo.</dd>
</dl>
''')

indice = ''.join(f'<li>{t}</li>' for t, _ in capitulos)
secciones = ''.join(f'<section><h2 class="cap"><span>{i}</span>{t}</h2>\n{h}\n</section>\n' for i, (t, h) in enumerate(capitulos, 1))
portada = base64.b64encode((CAP / 'portada.jpg').read_bytes()).decode()
html = f'''<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Calcador láser — Manual para el profesorado</title>{estilo}</head><body>
<div class="portada"><div class="sup">Suite CNC · Manual para el profesorado</div><h1>Calcador láser</h1><h2>Del dibujo, o del programa de un alumno, a la cortadora láser del taller</h2>
<img src="data:image/jpeg;base64,{portada}"><div class="pie">Calcador láser · Suite CNC 2026.11 · © 2026 Eloi A.A.<br>Manual publicado con licencia CC BY-SA 4.0. El programa, con licencia EUPL-1.2.</div></div>
<div class="indice"><h2>Contenido</h2><ol>{indice}</ol></div>
{secciones}{juntos}
</body></html>'''
(RAIZ / 'manual_laser.html').write_text(html, encoding='utf-8')
print('manual_laser.html', len(html) // 1024, 'KB,', len(capitulos), 'capítulos')
