import re, base64, io, sys
from PIL import Image
SUITE = sys.argv[1]; SH = sys.argv[2]
an = open(f'{SUITE}/manual_anidador.html', encoding='utf-8').read()
head = an[:an.index('<body>')]
head = re.sub(r'<title>.*?</title>', '<title>Libro de calificaciones — Manual para el profesorado</title>', head, flags=re.S)
cola = an[an.index('<script>/* titulos-juntos */'):]
def img(f, w='100%', crop=None, q=80):
    im = Image.open(f'{SH}/{f}').convert('RGB')
    if crop: im = im.crop(crop)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
    return f'<img src="data:image/jpeg;base64,{base64.b64encode(b.getvalue()).decode()}" style="width:{w}">'
def fig(f, cap, w='100%', crop=None): return f'<figure>{img(f, w, crop)}<figcaption>{cap}</figcaption></figure>'

cuerpo = f"""<body>
<style>section + section {{ page-break-before: auto; break-before: auto; margin-top: 9mm; }} h2.cap {{ break-after: avoid-page; page-break-after: avoid; }}</style>
<div class="portada"><div class="sup">Suite CNC · Manual para el profesorado</div><h1>Libro de calificaciones</h1><h2>Las notas de la clase por evaluaciones: importadas del Corrector o puestas a mano, con el peso de cada ejercicio y de cada bloque, tus comentarios y la nota del boletín</h2>
{img('tabla.png', crop=(0, 50, 1440, 900))}<div class="pie">Libro de calificaciones · Suite CNC 2026.11 · © 2026 Eloi A.A.<br>Manual publicado con licencia CC BY-SA 4.0. El programa, con licencia EUPL-1.2.</div></div>
<div class="indice"><h2>Contenido</h2><ol><li>Qué es el Libro de calificaciones</li><li>La pantalla</li><li>Importar las notas del Corrector</li><li>Bloques, ejercicios y pesos</li><li>Poner y cambiar notas a mano</li><li>Tus comentarios y la ficha del alumno</li><li>Evaluaciones, final del curso y boletín</li><li>Guardar, CSV e imprimir</li><li>Problemas frecuentes</li></ol></div>

<section><h2 class="cap"><span>1</span>Qué es el Libro de calificaciones</h2>
<p>El <strong>Libro de calificaciones</strong> reúne las notas de la clase de cada <strong>evaluación</strong> y calcula la nota de la evaluación y la del final del curso.</p>
<ul>
<li><strong>Importa las notas del Corrector</strong>: un ejercicio corregido (también un examen con variantes) y toda una batería de ejercicios. Solo la nota final de cada alumno; si quieres, también sus <strong>criterios</strong> (geometría, lo pedido, seguridad o los apartados de tu rúbrica), para verlos y cambiarlos. Los comentarios y las correcciones no se importan.</li>
<li><strong>Notas a mano</strong>: los ejercicios que corriges en papel, los trabajos, la actitud… se crean como ejercicios y las notas se escriben en la tabla.</li>
<li><strong>Pesos</strong>: cada ejercicio tiene un peso dentro de su <strong>bloque</strong> (Examen, Prácticas, Trabajos…), y cada bloque un peso en la nota de la evaluación. Un bloque puede pedir una nota mínima para hacer media.</li>
<li><strong>Tus comentarios</strong> para cada alumno, en cada evaluación y en el final del curso.</li>
<li>Sale la <strong>nota del boletín</strong> (redondeada), el <strong>acta</strong> de la clase, un <strong>boletín por alumno</strong> y un <strong>CSV</strong> para la hoja de cálculo.</li>
</ul>
<div class="nota clase"><strong>✅ Un ejemplo.</strong> 1.ª evaluación con tres bloques: <em>Examen</em> (40 %), el examen de 17 variantes corregido en la corrección masiva; <em>Prácticas</em> (40 %), los 12 ejercicios corregidos en la batería; y <em>Trabajos</em> (20 %), tres ejercicios corregidos a mano.</div>
<p>Funciona en el navegador, sin instalar nada y sin conexión. El libro se guarda solo en el navegador (al volver a abrirlo, sigue como lo dejaste) y, para tenerlo a salvo o llevarlo a otro ordenador, en un archivo con <span class="boton">💾 Guardar</span>.</p>
</section>

<section><h2 class="cap"><span>2</span>La pantalla</h2>
{fig('tabla.png', 'Una evaluación con tres bloques; en «Prácticas de geometría», los criterios de ISO GEO 01A desplegados (▾). Los nombres son inventados.', crop=(0, 50, 1440, 900))}
<table class="zonas">
<tr><td class="n">1</td><td><strong>Barra de arriba.</strong> 📥 Importar notas, 👥 Alumnos, 💾 Guardar, 📂 Abrir, ⬇ CSV, 🖨 Acta, 🖨 Boletines, 🗋 Nuevo y ❓ Manual.</td></tr>
<tr><td class="n">2</td><td><strong>Grupo y curso.</strong> Salen en el acta y en los boletines.</td></tr>
<tr><td class="n">3</td><td><strong>Pestañas.</strong> Una por evaluación (＋ añade otra) y, a la derecha, <strong>🏁 Final del curso</strong>.</td></tr>
<tr><td class="n">4</td><td><strong>La evaluación.</strong> Su nombre, su peso en la final, si los no entregados cuentan 0, ➕ Bloque, ➕ Ejercicio a mano, ▸ Plegar y ▾ Desplegar (todos los bloques) y ⚙ Opciones.</td></tr>
<tr><td class="n">5</td><td><strong>Los bloques.</strong> Cada uno con su nombre, su peso (entre paréntesis, el % que le toca), su nota mínima y sus ejercicios (clic en uno para editarlo).</td></tr>
<tr><td class="n">6</td><td><strong>La tabla.</strong> Un alumno por fila. Por cada bloque, sus ejercicios y su media; al final, la <strong>Nota</strong> de la evaluación, el <strong>Boletín</strong> y tu <strong>Comentario</strong>. Abajo, la media de la clase. En verde, aprobado; en rojo, suspenso.</td></tr>
</table>
{fig('tabla_dcha.png', 'La parte derecha de la tabla: la media de cada bloque, la nota, el boletín y tus comentarios.', crop=(0, 360, 1440, 900))}
</section>

<section><h2 class="cap"><span>3</span>Importar las notas del Corrector</h2>
<p><span class="boton">📥 Importar notas…</span> (o arrastrar los archivos a la ventana) lee estos archivos del <strong>Corrector</strong>:</p>
<table class="zonas">
<tr><td class="n">A</td><td><strong>La corrección de un ejercicio</strong>, «ISO GEO 01A - corrección.csv»: el ⬇ CSV de la corrección masiva o el de una tarea de la batería. Trae la nota y los <strong>criterios</strong>. Con un examen de <strong>variantes</strong>, cada alumno con la nota de su variante. Si un alumno entregó varios programas, cuenta el mejor.</td></tr>
<tr><td class="n">B</td><td><strong>La hoja de calificaciones de Aules rellenada</strong>, «Calificaciones-… - con notas.csv» (⬆ Notas para Aules). Trae la nota de cada alumno y <strong>toda la clase</strong>, también los que no han entregado: es la mejor para empezar la lista de la clase.</td></tr>
<tr><td class="n">C</td><td><strong>La revisión por alumno de la batería</strong> (👤 Revisión por alumno → ⬇ CSV): una columna por tarea, con el <strong>peso</strong> que le pusiste en la revisión (las que «no cuentan», con peso 0).</td></tr>
<tr><td class="n">D</td><td><strong>El zip de la batería entero</strong> (⬇ Descarga CSV Correcciones): un ejercicio por tarea, de su corrección (con los criterios) o, si no la tiene, de su hoja de Aules. El resumen de la batería no hace falta y no se importa.</td></tr>
</table>
{fig('importar.png', 'Importar seis correcciones a un bloque nuevo, con sus criterios. Abajo, cada alumno del archivo y con quién de la clase casa.')}
<h3>Dónde van</h3>
<ul>
<li><strong>A la evaluación</strong> y <strong>al bloque</strong> que elijas, o a un <strong>bloque nuevo</strong> (escribe su nombre). Cada archivo, o cada tarea, es un ejercicio: puedes cambiarle el nombre, darle su peso o desmarcarlo para no importarlo.</li>
<li>Si en el bloque ya hay un ejercicio con ese nombre, <strong>se actualizan sus notas</strong> (lo dice: «⟳ ya está en el bloque»). Así se puede volver a importar una tarea después de cambiar algo en el Corrector.</li>
<li><strong>Importar también los criterios</strong>: con la casilla marcada, el ejercicio guarda los criterios de cada alumno (▸ en su columna los despliega).</li>
</ul>
<h3>Los alumnos</h3>
<p>Los alumnos se casan con los de la clase <strong>por el nombre</strong>, sin tildes ni mayúsculas y en cualquier orden («MARÍA JOSÉ ORTÍZ PEÑA» es «María José Ortíz Peña»). Cada nombre del archivo sale con:</p>
<ul>
<li><strong>✔ el mismo</strong>: casa sin dudas.</li>
<li><strong>¿es el mismo? compruébalo</strong>: comparte casi todo el nombre con uno de la clase («Carla Ruiz» y «Carla Ruiz Mora»). Si no es él, elige otro en el desplegable.</li>
<li><strong>nuevo</strong>: no está en la clase y se añade (con el nombre bien escrito, no en mayúsculas). Elige <em>— no importar</em> para dejarlo fuera.</li>
</ul>
<div class="nota"><strong>💡 Para empezar.</strong> Importa primero una hoja de calificaciones de Aules: trae a toda la clase con los nombres de Aules, y los demás archivos casarán con ellos.</div>
</section>

<section><h2 class="cap"><span>4</span>Bloques, ejercicios y pesos</h2>
<p>Cada evaluación tiene <strong>bloques</strong> y cada bloque, <strong>ejercicios</strong>.</p>
<ul>
<li><strong>El peso del bloque</strong>: lo que vale en la nota de la evaluación. Lo normal es en %, pero se reparte en proporción: si suman 90, cada uno vale su parte de 90 (entre paréntesis sale el % que le toca, y un aviso si no suman 100).</li>
<li><strong>El peso del ejercicio</strong>: lo que vale dentro de su bloque (×1, ×2…). Un examen puede valer ×2 y las prácticas ×1. Con <strong>peso 0</strong>, el ejercicio no cuenta (sale tachado).</li>
<li><strong>La nota máxima</strong> del ejercicio (10 de serie): si corriges sobre 20, escribe las notas sobre 20 y se pasan a 10 para la media.</li>
<li><strong>mín.</strong> del bloque (vacío: sin mínimo): la nota mínima del bloque para hacer media. Si un alumno no llega, sale <strong>⚠</strong> y su nota de la evaluación se queda, como mucho, en la de ⚙ Opciones (4 de serie).</li>
</ul>
{fig('ejercicio.png', 'Un ejercicio: su nombre, su bloque, su peso y su nota máxima. ↺ Notas importadas devuelve las que has cambiado a mano.', '60%', crop=(455, 305, 985, 597))}
<h3>Cómo se calcula</h3>
<ol>
<li><strong>La media del bloque</strong>: la media de sus ejercicios con su peso (sobre 10). Un ejercicio que el alumno <strong>no ha entregado</strong> (casilla vacía) cuenta <strong>0</strong>; o, si en la evaluación eliges <em>solo cuentan los entregados</em>, no cuenta en su media. Un ejercicio que nadie de la clase tiene todavía no cuenta: no pone ceros.</li>
<li><strong>La nota de la evaluación</strong>: la media de los bloques con su peso (con el tope si no llega al mínimo de algún bloque).</li>
<li><strong>El boletín</strong>: la nota redondeada (⚙ Opciones).</li>
</ol>
<div class="nota clase"><strong>✅ Ejemplo.</strong> Examen 40 % (7), Prácticas 40 % (6,5) y Trabajos 20 % (8): (7 · 40 + 6,5 · 40 + 8 · 20) / 100 = 7,0 → boletín 7.</div>
<h3>Plegar los bloques</h3>
<p>Un bloque con muchos ejercicios (una batería de 12) hace la tabla muy ancha. <strong>Plegado</strong>, la tabla enseña solo su <strong>media</strong>; desplegado, todos sus ejercicios. Clic en el nombre del bloque en la cabecera de la tabla (<strong>▸</strong> plegado, <strong>▾</strong> desplegado) lo pliega o lo despliega; <span class="boton">▸ Plegar</span> y <span class="boton">▾ Desplegar</span> lo hacen con todos. De serie, los bloques de <strong>más de 4 ejercicios</strong> salen plegados. Se recuerda en el libro.</p>
{fig('plegado.png', 'Prácticas de geometría plegado: solo su media; Examen y Trabajos, desplegados.', crop=(0, 120, 1440, 760))}
<p>El <strong>▲</strong> de cada bloque lo sube; <strong>🗑</strong> lo quita con sus ejercicios y sus notas. ➕ en un bloque le añade un ejercicio.</p>
</section>

<section><h2 class="cap"><span>5</span>Poner y cambiar notas a mano</h2>
<ul>
<li><span class="boton">➕ Ejercicio a mano</span> (o ➕ en un bloque): su nombre, su bloque, su peso y su nota máxima. Después, escribe las notas en su columna.</li>
<li><strong>Las casillas</strong> se escriben con coma o con punto; <kbd>Intro</kbd> o las flechas ↑ ↓ pasan al alumno de abajo o de arriba, y <kbd>Tab</kbd> al ejercicio de al lado. Vacía = no entregado.</li>
<li>Una nota <strong>importada</strong> también se puede cambiar: la casilla se pone en <strong>amarillo</strong> y, al pasar el ratón, dice la nota importada. En el ejercicio, <span class="boton">↺ Notas importadas</span> las devuelve todas.</li>
<li><strong>Los criterios</strong>: ▸ en la cabecera de un ejercicio importado con sus criterios los despliega en columnas. Si la nota del Corrector era la suma de los criterios (lo normal), al cambiar un criterio cambia la nota. Abajo, la media de la clase en cada criterio.</li>
</ul>
<h3>👥 Alumnos</h3>
<p>La lista de la clase: cambiar el nombre de un alumno, quitarlo (🗑, con sus notas), añadir alumnos (uno por línea) y <strong>🔗 Unir</strong> a uno que sale dos veces con el nombre escrito de dos maneras (se queda el nombre más completo; si los dos tienen nota en un ejercicio, la más alta).</p>
</section>

<section><h2 class="cap"><span>6</span>Tus comentarios y la ficha del alumno</h2>
<ul>
<li><strong>✎</strong> en la columna <em>Comentario</em>: tu comentario de esa evaluación para ese alumno; ◀ ▶ pasan al anterior o al siguiente. Sale en su boletín.</li>
<li><strong>Clic en el nombre</strong> de un alumno: su <strong>ficha</strong>, con todas sus notas de todas las evaluaciones (bloque a bloque, con los criterios), la del final del curso y tus comentarios de cada evaluación y del final, para escribirlos ahí. <span class="boton">🖨 Su boletín</span> lo imprime.</li>
</ul>
{fig('ficha.png', 'La ficha de un alumno: sus notas, por qué no llega al mínimo y tus comentarios.', '80%', crop=(290, 40, 1150, 860))}
</section>

<section><h2 class="cap"><span>7</span>Evaluaciones, final del curso y boletín</h2>
<ul>
<li><strong>＋</strong> en las pestañas añade una evaluación; su nombre y <strong>🗑</strong> (quitarla) están en su cabecera.</li>
<li><strong>Peso en la final</strong>: lo que vale cada evaluación en la nota final (1 de serie: todas igual).</li>
<li><strong>🏁 Final del curso</strong>: la nota de cada evaluación y su boletín, la nota final (la media de las evaluaciones con su peso), su boletín y tu comentario final.</li>
</ul>
{fig('final.png', 'El final del curso: las dos evaluaciones, la final y el boletín.', crop=(0, 120, 1440, 740))}
<h3>⚙ Opciones</h3>
<ul>
<li><strong>Aprobado desde</strong> (5).</li>
<li><strong>Nota del boletín</strong>: redondeada (6,5 → 7), truncada (6,9 → 6) o con un decimal.</li>
<li><strong>No se aprueba por el redondeo</strong> (marcado de serie): un 4,6 se queda en 4, no sube a 5.</li>
<li><strong>Si no llega a un mínimo de bloque</strong>, la nota de la evaluación se queda como mucho en… (4; vacío: sin tope, solo el aviso ⚠).</li>
</ul>
</section>

<section><h2 class="cap"><span>8</span>Guardar, CSV e imprimir</h2>
<ul>
<li><strong>El navegador recuerda el libro</strong> solo, a cada cambio. Pero solo en ese navegador y en ese ordenador.</li>
<li><span class="boton">💾 Guardar</span>: el libro en un archivo .json (con la fecha). <span class="boton">📂 Abrir</span> (o arrastrarlo a la ventana) lo abre en otro ordenador o sigue con uno guardado. Guárdalo de vez en cuando: es tu copia de seguridad.</li>
<li><span class="boton">⬇ CSV</span>: la evaluación abierta (cada ejercicio, la media de cada bloque, la nota, el boletín y tu comentario) o el final del curso, para la hoja de cálculo o para pasar las notas a la aplicación del centro.</li>
<li><span class="boton">🖨 Acta</span>: la tabla de la evaluación abierta (las medias de los bloques, la nota y el boletín) o la del final del curso.</li>
<li><span class="boton">🖨 Boletines</span>: una hoja por alumno con sus notas bloque a bloque, la nota de cada evaluación, el boletín, tus comentarios y, con más de una evaluación, el final del curso. Para uno solo, en su ficha: 🖨 Su boletín.</li>
<li><span class="boton">🗋 Nuevo</span>: empieza un libro vacío (guarda antes el de ahora).</li>
</ul>
{fig('boletin.png', 'El boletín de un alumno.', '62%')}
<div class="nota atencion"><strong>⚠️ Los datos de los alumnos.</strong> El libro y sus CSV llevan los nombres y las notas de los alumnos: guárdalos donde guardas el resto de las notas, no los compartas.</div>
</section>

<section><h2 class="cap"><span>9</span>Problemas frecuentes</h2>
<dl>
<dt>Un alumno sale dos veces.</dt><dd>Tiene el nombre escrito de dos maneras en dos archivos. En 👥 Alumnos, marca los dos y 🔗 únelos. Para que no pase, al importar comprueba los «¿es el mismo?» y los «nuevo».</dd>
<dt>«No es un CSV de notas que se reconozca».</dt><dd>Lee la corrección del Corrector («- corrección.csv»), la hoja de Aules rellenada («- con notas.csv»), la revisión por alumno de la batería y el zip de la batería. La hoja de Aules <em>sin rellenar</em> no trae notas.</dd>
<dt>El nombre del ejercicio sale cortado o raro.</dt><dd>Sale del nombre del archivo (Aules lo corta a veces). Cámbialo al importar o después, en el ejercicio.</dd>
<dt>Un ejercicio sale tachado y no cuenta.</dt><dd>Tiene peso 0 o nadie de la clase tiene nota en él todavía.</dd>
<dt>Un alumno tiene ⚠ y la nota se queda en 4.</dt><dd>No llega al mínimo de un bloque (mín.). Quita el mínimo del bloque o el tope en ⚙ Opciones si no lo quieres.</dd>
<dt>He vuelto a importar una tarea y no ha creado otra.</dt><dd>Si en el bloque hay un ejercicio con el mismo nombre, actualiza sus notas. Para tener los dos, cámbiale el nombre al importar.</dd>
<dt>He perdido el libro.</dt><dd>El navegador lo recuerda, pero no si se borran los datos del navegador o en otro ordenador: ábrelo desde el último .json que guardaste con 💾.</dd>
</dl>
</section>

"""
open(f'{SUITE}/manual_libro_calificaciones.html', 'w', encoding='utf-8').write(head + cuerpo + cola)
print('ok', len(head + cuerpo + cola))
