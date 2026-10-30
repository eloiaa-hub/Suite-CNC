# Novedades de la Suite CNC

La versión de la suite es **año.mes** (por ejemplo, 2026.10). Cada programa conserva además su propio número junto a su título.

## Suite CNC 2026.10

Versiones de los programas: **Calcador v118 · Corrector v63 · Tutor G-Code v4 · Simulador 3D V45 · Calculadora de taller v5 · Anidador de tableros v8**.

### Calcador v118 / Corrector v63: la batería, en el orden de la biblioteca
- Las tareas de la **🗃 Batería** salen en el mismo orden que sus ejercicios en la biblioteca (por número, título, nivel, carpeta o recientes, como esté ordenada), también en el resumen, el zip y los informes de todas; las que no tienen ejercicio, al final.

### Calcador v117 / Corrector v62: los parecidos, en el informe
- Los **programas muy parecidos** salen en los informes (que son para el profesor): las parejas, con su porcentaje y lo que comparten, en el resumen de la clase, y «👥 Muy parecido a…» en la hoja de cada alumno. En las devoluciones para el alumno, no. También en «🖨 Informes de todas» de la batería.

### Calcador v116 / Corrector v61: imprimir toda la batería
- En la **🗃 Batería**: **🖨 Informes de todas** (de cada tarea, el resumen de la clase y una hoja por alumno) y **🖨 Devoluciones de todas**, en un solo documento: con «Guardar como PDF», un solo PDF. Y 🖨 en cada fila, solo esa tarea.

### Calcador v115 / Corrector v60: diagnóstico, la nota del profesor y la devolución
- **Diagnóstico** de dos errores típicos, en el primer error y en la lista: la **pieza en espejo** o girada 180° (los signos de las X o las Y cambiados, con o sin otro cero; y la compensación al otro lado) y **G90 / G91 confundidos** (incrementales con G90, absolutas con G91). La nota no cambia.
- **✎ Tu nota y tu comentario** en cada alumno: tu nota manda sobre la orientativa; pasan a la lista (✎ 💬), al CSV, a los informes, a la devolución y a las notas para Aules, y se conservan al recorregir.
- En la corrección detallada, **◀ ▶** (o Alt+← Alt+→) para ir de un alumno a otro, con tu nota y tu comentario a mano.
- **🖨 Devoluciones**: la hoja para el alumno, con su recorrido, lo que tiene que revisar, tu comentario y la nota.
- **💾 Guardar corrección** y **📂 Abrir corrección**: la corrección de una tarea en un archivo, para seguir otro día.

### Calcador v114 / Corrector v59: el trazado puntúa
- Con «Altura de corte incorrecta» o con «Trazado desplazado», el trazado bien hecho se lleva una parte de los puntos de geometría: criterio nuevo **Trazado sin cortar o desplazado** (de partida, el 50 %), en proporción al contorno bien recorrido. Lo pedido y la seguridad, como siempre. Con 0 %, como antes. En la rúbrica, en el apartado de geometría.

### Calcador v113 / Corrector v58: trazado desplazado
- Si el recorrido tiene la forma de la pieza pero movido porque el alumno ha tomado otro cero pieza, el primer error es «**Trazado desplazado**: … movido X+80 Y+50: el cero pieza que ha usado no es el del plano, lo ha puesto en la esquina de abajo a la izquierda…», con un ejemplo de punto; en la lista, «· trazado desplazado». Los demás errores y la nota no cambian. También cuando la fresa no baja de Z0.

### Calcador v112 / Corrector v57: altura de corte incorrecta
- Si un programa no corta porque la fresa nunca baja de Z0, ya no sale «Sin programa válido»: sale **⛔ Altura de corte incorrecta** y se comprueba el recorrido en X Y como si la fresa estuviera abajo: «**Trazado geométrico correcto**» o lo que falla. Si con la fresa abajo algún movimiento se metería en la pieza (llegar al inicio con G1), sale como aviso con su línea. La nota no cambia.

### Calcador v111 / Corrector v56: la batería, con la biblioteca
- La **🗃 Batería** lee los ejercicios también de un **archivo de biblioteca** (el de ⬇ Exportar biblioteca) que esté en la carpeta, y **🗂 Usar la biblioteca** toma los de la biblioteca del navegador: en la carpeta basta con los zip de las entregas.
- Casan con la tarea por el nombre de su archivo o por el **número** o el **título** de su ficha (también las variantes guardadas: números ISO GEO 02A, 02B…). En el desplegable, los de la biblioteca llevan 🗂.

### Calcador v110 / Corrector v55: batería de corrección
- **🗃 Batería…** (corrección masiva): una carpeta con los ejercicios (.json), los zip de «Descargar todas las entregas» de cada tarea de Aules («curso-ISO GEO 01A-número.zip») y, si están, sus hojas de calificaciones. Cada zip se casa con su ejercicio por el nombre de la tarea (también un examen con variantes: «ISO GEO 02» con «ISO GEO 02A», «02B»…), y se puede cambiar a mano.
- **▶ Corregir todo**: alumnos, nota media, aprobados, el error más repetido y las parejas muy parecidas de cada tarea; 🔍 Ver la abre en la corrección masiva.
- **⬇ Descargar todo (.zip)**: el resumen de la batería, el CSV de cada tarea y sus hojas de calificaciones rellenadas, listas para subir a Aules.
- La hoja de calificaciones rellenada conserva las comillas del original.

### Calcador v109 / Corrector v54: lo que falla en la clase, la rúbrica y los códigos de clase
- **📊 Errores de la clase** (corrección masiva): los errores y avisos que más se repiten, juntando los del mismo tipo aunque sean en otra línea o con otras coordenadas, con una barra, la pista y quiénes los tienen; filtro de errores o avisos e impresión. También en el resumen de «🖨 Informes de todos».
- **Nota por apartados (rúbrica)**, opcional (por defecto, la de siempre): geometría, compensación, lo pedido, seguridad, final del programa, formato y comentarios, con los puntos que elijas (⚙ Rúbrica…). En el informe de cada alumno, en el CSV y en las notas para Aules.
- **Avisar de códigos no dados en clase**: G y M fuera de la lista de clase (G21, G54, G43, M08…), O1000 y «%», la D, la herramienta que no es T101 M06 y el husillo escrito M03 S…. Son avisos: no bajan la nota. La lista se cambia con ✎ y se guarda en el navegador.

### Calcador v108 / Corrector v53: exámenes y notas a Aules
- **⬆ Notas para Aules** (corrección masiva): abre la «hoja de calificaciones» que descarga la tarea de Aules y la rellena con la nota de cada alumno (sobre la calificación máxima de la tarea) y un comentario con su veredicto y sus errores; se sube en Aules con «Subir hoja de calificaciones». Cada alumno se reconoce por su número de participante del zip de Aules o por su nombre.
- **🎲 Variantes con otras medidas**: la casilla «Otras medidas (mm)» alarga o acorta la pieza (ancho, alto o los dos) por donde solo hay rectas; los arcos, los radios y los agujeros no cambian, se conservan las tangencias y cambian las cotas.
- **👥 Preparar el examen** (en 🎲 Variantes): la lista de la clase (pegada, o el CSV de participantes o la hoja de calificaciones de Aules), el reparto de las variantes (en orden o al azar, y a mano), las **hojas con el nombre** de cada alumno, las soluciones y la lista del reparto. El reparto se guarda y la corrección masiva sabe qué variante le tocaba a cada uno (por su número de participante o su nombre); en otro ordenador, se abre su CSV.
- **📝 Completar el programa** (cuestionario para Aules): el programa de la solución con huecos (G2/G3, G41/G42, I J, X Y), como pregunta de respuestas incrustadas que Aules corrige sola, en cada variante; y la hoja para imprimir, con los huecos numerados y las soluciones. Por defecto, 0 huecos: el cuestionario de siempre no cambia.

### Calcador v107 / Corrector v52: programas muy parecidos entre alumnos
- En la **corrección masiva**, **👥 Parecidos**: las parejas de programas que comparten lo que no tiene nadie más en la clase. Cuenta lo raro: líneas con el mismo contenido poco habitual (un error, un valor raro) escritas igual (sin contar los números de bloque), comentarios iguales (sobre todo varios seguidos, en las mismas líneas) y los mismos errores. Una línea bien hecha cuenta muy poco aunque esté escrita igual: dos programas correctos no salen por eso.
- **👥 junto al nombre** (en rojo si el parecido es muy alto), la cuenta en el resumen, la columna **«Parecido con»** del CSV y **⇆ Comparar**: los dos programas lado a lado, con las líneas raras iguales en rojo y los comentarios iguales en amarillo.
- Es un indicio, no una prueba; no sale en el informe impreso del alumno.

### Calcador v106 / Corrector v51: corregir un examen con variantes
- En la **corrección masiva**, **🎲 Variantes…**: se marcan las variantes del examen (de la carpeta Variantes de la biblioteca, o sus JSON) y cada programa se corrige con todas; se queda la que mejor encaja.
- La variante sale **junto al nombre** del alumno (con la nota de cada una al pasar el ratón), en el **CSV** (columnas «Variante» y «Aviso de variante») y en su **informe**, con el dibujo de esa variante. Al ver un alumno se abre su variante.
- **La que le tocaba**: si el nombre del archivo, la carpeta o el principio del programa la dicen («12B», «variante B»), se corrige con esa y avisa (⚠️) si encaja mejor con otra: «ha hecho la 12A, le tocaba la 12B». Si dos variantes encajan casi igual, avisa de que no está claro.

### Calcador v105 / Corrector v50: la interfaz ordenada, seleccionar puntos y hacer arcos
- **Botones de vista**, arriba a la derecha del dibujo: ◧ ◨ (paneles), 👁 Rejilla, **🏷 Nombres** (los nombres de los puntos, antes solo dentro de ⚙️ Mecanizado) y **📏 Cotas** (lo mismo que «Acotar automáticamente»). Las casillas de siempre siguen y van a la par. También en el Corrector.
- **↶ Deshacer, ↷ Rehacer, ⭘ Cerrar y ✓ Terminar**, al pie de la barra de herramientas: se ven aunque se oculte el panel izquierdo.
- **Pestaña Dibujo** en desplegables: Imanes, Comprobar con la fresa, **Cotas y marcas** y **Ajustar medidas** (estos dos, abiertos de entrada).
- **Barra superior**: **🖼 Fondo** (carga el plano a calcar y abre la pestaña Fondo) y **⬇ Exportar ▾** (DXF, SVG y sus opciones). La pestaña Exportar del panel izquierdo desaparece; abajo queda solo Fondo.
- ⚙️ Mecanizado: «Orden» en la misma fila que su desplegable; la casilla 📍 del programa dice «📍 Absolutas».
- **Seleccionar puntos** (la doble flecha, junto a Editar; tecla I): una ventana elige todos los puntos que quedan dentro (Mayús añade, un clic elige uno) y **Supr los borra de una vez**, con un solo Ctrl+Z para recuperarlos. Para limpiar una silueta vectorizada.
- **◠ Hacer arco** (o la tecla A), con 3 o más puntos seguidos elegidos: los cambia por un solo arco, **tangente a los tramos de al lado** (las rectas se recortan o alargan) o **por los puntos** (quedan el primero y el último); el radio, el calculado, redondeado a 0,5 mm o escrito. Vista previa con el radio, el centro y la desviación máxima; si los puntos no forman un arco, no deja aplicarlo.
- Probada antes como «Calcador_Beta.html».

### Calcador v104: el centro de un arco, por teclado
- **Doble clic sobre la cruz del centro** de un arco (o sobre la cota de su posición) abre una ventana para escribir el centro, en **X Y** (desde el cero pieza) o en **I J** (desde el inicio del arco, marcado con un punto verde).
- **Vista previa**: mientras se escribe, el arco nuevo se ve en discontinua naranja, con su centro, su radio y, si cambia, el punto final. Intro aplica, Esc cancela, y se puede deshacer.
- **Dos formas de mover el centro**: con los *extremos fijos* (el centro se lleva a la mediatriz de los extremos y cambia el radio) o *moviendo el final* (el inicio y el centro quedan como se escriben y el final se desliza por la recta siguiente). Un círculo se mueve entero.

### Calcador v103 / Corrector v49: más sitio para dibujar
- Arriba a la derecha de la zona de dibujo, **◧** oculta o muestra el panel izquierdo (opciones, tecla F7) y **◨** el derecho (mecanizado y programa, tecla F8). La barra de herramientas se ve siempre. Al ocultar o mostrar un panel, el dibujo se encuadra para llenar la zona.
- **👁 Rejilla** oculta o muestra la rejilla del fondo. Solo cambia lo que se ve: el imán a la rejilla sigue en ▦ Rejilla (tecla G).
- Se recuerda cómo se deja para la próxima vez.

### Calcador v102 / Corrector v48 / Simulador 3D V45: la fresa arriba al terminar, bajar en diagonal, y las mismas reglas en el Simulador
- **La fresa, arriba al terminar**: terminar el programa con la fresa dentro de la pieza (Z por debajo de 0) es un error de seguridad; con la fresa abajo, sin subir a la altura de seguridad (por debajo de Z5), un aviso. Antes del fin: G0 Z20.
- **Bajar en diagonal**: entrar en el material a la vez que se mueve en X/Y (por ejemplo, de Z20 a Z-30 mientras avanza en X) es un aviso: primero se baja en vertical, con el avance de penetración, y después se corta. Desde la superficie, una rampa suave (hasta 15°) no se avisa, como la entrada en rampa de las cajeras de ⚙️ Mecanizar.
- **El Simulador 3D** revisa lo mismo que el Corrector: no terminar (si arranca el husillo) o terminar arrancándolo, y la fresa dentro del material al terminar, son errores; M30 sin M05, la fresa abajo al terminar, bajar en diagonal y los números de bloque, avisos.

### Calcador v101 / Corrector v47: el final del programa y los números de bloque
- **El final del programa**: el Corrector comprueba que el programa termine con **M05 y M30, o M02**. Si no termina, o termina arrancando el husillo (un M03 después del último corte, como «N22 M03»), es un error de seguridad. M30 sin M05 delante y las instrucciones después del fin de programa son avisos. Antes, el Corrector no miraba el final. Se revisa en los programas que arrancan el husillo (M03); un fragmento sin M03, como el programa de la hoja de soluciones de una herramienta, no. La hoja de soluciones con varias herramientas, que sí lo arranca, termina ahora con M05 y M30.
- **Los números de bloque**: si van de 1 en 1 (N1, N2, N3…), un aviso recomienda de 10 en 10 (N10, N20…), para poder intercalar líneas; si no van creciendo (repetidos o hacia atrás), también un aviso. No bajan la nota. Un programa sin números de bloque es correcto.

### Calcador v100 / Corrector v46: programas entregados en un documento
- En la **corrección masiva** (y desde el zip de Aules), un programa entregado en un documento de LibreOffice (.odt), de Word (.docx o .doc) o en RTF se corrige igual, sacando su texto, aunque el alumno lo haya renombrado a .nc o .txt. Pero se avisa de que el formato es incorrecto: 📄⚠️ junto al nombre, en el resumen de la clase, en una columna nueva del CSV («Formato del archivo») y en su informe impreso. Antes ese alumno no salía en la lista.
- Los guiones largos (–, −) y los espacios duros que pone el procesador de textos se cambian por los normales. Del Word antiguo (.doc) el texto se recupera buscándolo dentro del archivo: el aviso pide revisar que esté completo. Una memoria sin programa no cuenta si el alumno entrega también el programa.

### Calcador v99: la hoja de ejercicio, sin tabla de coordenadas, en color y ajustada al papel
- **🖨 Hoja de ejercicio** ya no tiene la tabla de coordenadas en blanco: solo el enunciado, el plano y el cajetín (y, si se pide, la hoja rayada). Al imprimir varios ejercicios desde la 📚 Biblioteca, una tabla larga no cabía en su página y se montaba sobre el enunciado del ejercicio siguiente. Los ejercicios guardados con la tabla marcada salen ahora sin ella.
- **El plano en color**, con los colores del Calcador (los de la pantalla y de 💾 SVG en color): casilla «Imprimir el plano en color» en la ventana de la hoja y, al imprimir varios desde la Biblioteca, casilla «En color» junto a «🖨 Imprimir sus hojas de ejercicio». Sin marcar, en negro, como antes.
- **Si el plano no cabe a 1:1, se ajusta al papel**: llena el hueco del dibujo y en el cajetín pone «Escala: ajustada (las cotas mandan)». Antes saltaba a la escala normalizada siguiente (1:2) y una pieza que no cabía por poco quedaba a la mitad.

### Tutor G-Code v4: dos G del mismo grupo no valen
- En ✍ Practicar (en el Tutor y en la pestaña Tutor del Calcador), una línea con **dos G del mismo grupo** no vale, estén en el orden que estén: se anulan unas a otras. G0, G1, G2 y G3 nunca van juntas, ni G90 y G91, ni G41/G42/G40, ni G71 y G70. El Tutor dice cuáles son: «G1 y G0 son del mismo grupo y se anulan: solo una G de movimiento por línea». Antes, `G1 G0 X70 Y50` valía (se quedaba con la última) y `G0 G1 X70 Y50` se rechazaba con un motivo equivocado. En el informe para Aules cuenta como «G del mismo grupo en una línea». G de grupos distintos (G42 G1, G71 G90 G40 G0) siguen valiendo.
- Los apuntes «La cabecera del programa» lo explican en el apartado 5, con ejemplos de líneas que no valen.

### Tutor G-Code v3: la cabecera agrupada, y apuntes nuevos «La cabecera del programa»
- **Apuntes nuevos** (`cabecera_programa.html` / `.pdf`, 9 páginas, enlazados desde la ficha de los Códigos ISO): qué es la cabecera; **la cabecera comparada con preparar una fresadora de mano** (un dibujo con la escala de profundidad en mm ↔ G71, la fresa en la pinza ↔ T101 M06, la rueda de velocidades ↔ S12000, el interruptor ↔ M03 y el motor arriba ↔ G0 Z20; las medidas desde la esquina o una tras otra ↔ G90 y G91; seguir la línea con el centro de la fresa ↔ G40, y la velocidad a la que se empuja ↔ F1000); la de los apuntes, una instrucción por línea; la agrupada (G71 G90 G40 G0 Z20 · T101 M06 · F1000 S12000 M03) y por qué se agrupa así; el orden de las letras (y las G del mismo grupo, que se anulan: G0, G1, G2 y G3 nunca en la misma línea); qué se puede juntar en una línea y qué no (los grupos de G, una sola M, el cambio de herramienta solo); por qué no todo en una línea; y cómo lo corrige el Tutor.
- En ✍ Practicar, el Tutor acepta también la **cabecera agrupada** según esas reglas: cuando una línea hace también otra de la cabecera, lo dice y la salta; si no cumple una regla, explica cuál. En el informe, esos errores cuentan como «Agrupar la cabecera».

### Tutor G-Code v2: los ejercicios, sin ver la solución, y el 🧾 informe para Aules
- **El orden de las letras**: en ✍ Practicar, una línea que hace lo correcto pero con las letras desordenadas (M03 S12000, F300 G1 Z-3, X40 F1500 G1 Y30, J antes que I…) no vale: el Tutor dice cómo va, en el orden de la norma y de los apuntes, N G X Y Z (I J K o R) F S T M (D H). Varias G seguidas (G42 G1) valen en cualquier orden. En el informe cuenta como «Orden de las letras».
- **Dejar un ejercicio** (✕ Dejar el ejercicio o 🗋 Nuevo) borra la pieza, y Deshacer no la recupera: antes, la pieza se quedaba en pantalla y en 👁 Aprender se veía su programa, la solución. Al abrir un ejercicio, Deshacer tampoco vuelve al dibujo anterior, y ⬇ Guardar .nc nunca guarda el programa completo.
- **🧾 Informe para Aules**, al terminar un programa en ✍ Practicar: un PDF con las líneas a la primera, con fallos y vistas, las pistas, los intentos fallidos, los errores más repetidos por tipo (escritura, signos, G90/G91, centro del arco I/J/R, sentido G2/G3, tipo de movimiento, compensación, avance, funciones M/T/S, coordenadas), cada intento fallido línea a línea con lo que dijo el Tutor, el dibujo y el programa, con una nota orientativa y un código de comprobación.
- **Calcador v97 y Corrector v45**: en «Toda la clase», el informe del Tutor se lee como el del Simulador (se corrige su programa y se comprueba el código; si se retoca, deja de valer) y su estado dice cómo lo ha escrito el alumno. Los informes del Simulador siguen igual.
- Guía del Tutor: capítulo nuevo, «El informe para Aules»; los manuales del Calcador y del Corrector lo mencionan en la corrección de toda la clase.

### Corrector v44: la apariencia del Calcador
- 🗋 Nuevo, 📂 Abrir, 💾 Guardar y 🗂 Biblioteca en la barra de arriba; a la izquierda, las pestañas ✅ Corregir (un programa o toda la clase) y 🧩 Ejercicios (hoja, soluciones, variantes y Aules) y, debajo, Exportar (DXF y SVG).
- A la derecha, como en el Calcador, el programa de la pieza (📋 Solución o ⚙️ Máquina) con ⚙️ Mecanizado, el reproductor, la explicación de cada línea, ⬇ Guardar .nc, ➜ Simulador 3D y la Ventana de Mecanizar. Sin la pestaña Contornos: el Corrector sigue sin cambiar la pieza.
- El manual del Corrector (HTML y PDF), con la pantalla nueva.
- En el Calcador y el Corrector, los textos de ayuda que hablaban de la sección Fresa o de «Abrir .json» ya dicen dónde están ahora las cosas.

### Calcador v96 y Corrector v43: aviso del lado equivocado en ⚙️ Mecanizar
- Con «G41 en todos» o «G42 en todos», la ventana ⚙️ Mecanizar avisa de qué contornos quedan del lado equivocado (la fresa se come la pieza) y propone «G41/G42 según el trazado». El panel derecho ya lo avisaba; la ventana, no. El lado lo comprueba la propia corrección del Calcador.
- La prueba `comp_simulador.js` daba dos fallos desde hace tiempo: no eran errores del programa, sino los casos de «G41 en todos» y «G42 en todos», que en una pieza con el exterior y el agujero dibujados en el mismo sentido dejan uno de los dos del lado equivocado a propósito (sirven para enseñarlo). Ahora la prueba exige que el Calcador lo avise y que solo se meta en la pieza el contorno avisado; con el agujero invertido, «G41 en todos» sale limpio.

### Calcador v95: la interfaz del Tutor
- **Barra superior**: 🗋 Nuevo, 📂 Abrir, 💾 Guardar y 🗂 Biblioteca, junto al nombre del proyecto.
- **Panel izquierdo en pestañas**: arriba, 🧩 Ejercicios (aleatorio, hoja, soluciones, variantes, Aules y 🎓 Para el Tutor) y ✅ Corregir (un programa o toda la clase); en medio, Dibujo (con los desplegables Imanes y Comprobar con la fresa), Construcción y Formas, que cambian solas con la herramienta elegida; abajo, Fondo y Exportar (DXF y SVG).
- **Panel derecho: el programa de la pieza**, que se escribe mientras se dibuja, con un comentario en cada línea: 📋 Solución (el de la tabla de soluciones) o ⚙️ Máquina (el de ⚙️ Mecanizar, con pasadas, puentes, cajeras y cambios de herramienta). ⚙️ Mecanizado reúne coordenadas, compensación, fresa (o una de la base de herramientas), profundidad, pasada, avances, giro, Z de seguridad y orden. Con el reproductor (⏮ ◀ ▶ ▶▏ ⏭ y velocidad), la explicación de cada línea, la posición absoluta en G91 (📍), ⬇ Guardar .nc y ➜ Simulador 3D. Pestañas 📋 Puntos y ◯ Contornos (la lista y las propiedades de lo seleccionado, que se abre sola al seleccionar con Editar).
- La **Ventana de Mecanizar** de siempre (vista previa, resumen, tiempo y avisos) se abre con su botón en ⚙️ Mecanizado; usa los mismos datos.
- El reproductor de la barra superior pasa al panel derecho (en el Corrector sigue arriba). Todo lo demás funciona igual.
- En pantallas estrechas (portátiles de 1024 px), los dos paneles se estrechan para que el panel derecho no quede cortado (también en el Tutor).
- Revisión de robustez del Calcador, el Tutor y el Simulador: almacenamiento del navegador estropeado, JSON malformados, campos vacíos, con letras o enormes, geometrías raras y cambios rápidos, sin errores ni NaN en el G-code. Las pruebas quedan en `herramientas_desarrollo/pruebas/robustez_*.js`.
- El manual del Calcador (HTML y PDF) se ha rehecho con la interfaz nueva: capturas, la pantalla y los botones de cada capítulo.

### Simulador 3D V44: la fresa de bola y la fresa en V con T de la base
- Corregido: si el programa traía una herramienta de la base (`T101 M06`), el corte y la fresa dibujada salían siempre con la fresa de la base (T101: plana), aunque en el panel se eligiera bola o V o el programa dijera «fresa de bola» en un comentario. Ahora lo que se cambia en el panel (tipo, ángulo de la V, diámetro o una fresa de la lista) se aplica a la T del tramo en el que está la fresa, solo en esta simulación: la base de herramientas no cambia, y el panel lo indica. Con varias herramientas, el panel muestra la de cada tramo al avanzar.

### Simulador 3D V43: aviso con M04
- Si el programa arranca el husillo con **M04** (giro antihorario), la revisión lo avisa: con una fresa normal, a derechas, no corta; lo habitual es M03. La explicación de la línea lo dice también.

### Programa nuevo: Tutor G-Code v1 (alumnado)
- **Como el Calcador**: 🗋 Nuevo, 📂 Abrir, 💾 Guardar y 📚 Ejemplos en la barra de arriba; a la izquierda, Dibujo / Construcción / Formas en pestañas (con el nivel de las herramientas y los imanes plegados en Dibujo) y, debajo, Fondo; ➜ Simulador 3D junto a ⬇ Guardar .nc.
- **Guía del Tutor** (`guia_tutor.html` / `.pdf`, 14 páginas), enlazada desde la portada.
- El Calcador para aprender G-code (`tutor.html`). Se dibuja la pieza y, a la derecha, el Tutor escribe su programa ISO línea a línea, con un comentario en cada línea, al estilo de los programas resueltos: las letras de los puntos (P1… en el exterior, A1… en los agujeros), los interiores primero, la Z siempre en G90.
- **👁 Aprender**: el programa se escribe mientras se dibuja. Al hacer clic en una línea (o con ▶▏, las flechas o ▶) se ve en el dibujo cómo se mueve la fresa, con su huella y, con compensación, el camino de su centro; debajo, la explicación de la línea, como en el Simulador (💬), y en G91 el punto en el que queda la fresa (📍).
- **⚙️ Mecanizado**: G90, G91 o mixta; **compensación** G40, G41/G42 por fuera de la pieza y por dentro de los agujeros, o G41 o G42 a mano (la fresa baja fuera del contorno, en F1, y entra con G41/G42 en E1, en el medio de un lado); fresa, profundidad, pasadas y avances. El recorrido dibujado, con el ancho de la fresa, enseña hasta dónde llega. Si G41 o G42 deja la fresa del lado de la pieza, un aviso dice qué G corresponde y la franja de la fresa sale en rojo. La T va con su Ø de la base de herramientas (la misma del Simulador): con otro Ø, el Tutor usa la T de la base con ese Ø o un número libre.
- **📋 Puntos**: la tabla de puntos (X, Y; en G91 también ΔX y ΔY; los arcos con su centro, I y J).
- **✍ Practicar**: el programa lo escribe el alumno, línea a línea. Si la línea hace lo mismo que la del programa (vale sin repetir el G1, el arco con I J o con R, M3 o M03, G21 o G71…), pasa a la siguiente; si no, el Tutor dice por qué: el signo, G90 o G91 (el punto o lo que se mueve), el centro del arco o el sentido, el avance que falta, la compensación… En verde, en el dibujo, el tramo que toca. Con 💡 Pista y 👁 Ver la línea, la cuenta de líneas a la primera y una nota orientativa.
- **📚 Ejemplos y ejercicios**: los 10 programas resueltos de los apuntes (se ve su programa) y los 40 ejercicios de la biblioteca de inicio (se abren en Practicar, sin programa ni coordenadas: las medidas, en las cotas).
- **Ejercicios del profesor**: en el Calcador, **🎓 Ejercicio para el Tutor** guarda el ejercicio con las coordenadas y la compensación de ⚙️ Mecanizar. En el Tutor se abre en Practicar: se ve el plano, pero no el programa, y el dibujo no se puede cambiar (solo medir).
- Herramientas de dibujo por niveles (1 rectas, 2 rectas y arcos, 3 todas). Sin lo que es del profesor: ejercicio aleatorio, importar DXF y SVG (el fondo, solo imágenes), cuestionario para Aules, variantes, guardar DXF y SVG, corrección, soluciones, hojas, biblioteca, ⚙️ Mecanizar de la máquina, texto de grabado y el mecanizado propio de cada contorno.
- Comprobado: los 20 programas resueltos de los apuntes salen iguales; las 50 piezas de ejemplo en G90, G91 y mixta con G41/G42 se cortan enteras en el Simulador sin meterse en la pieza.

### Simulador 3D V42: qué hace cada línea y dónde queda la fresa en G91
- **💬 Explicar la línea**: debajo del programa, la línea marcada (al hacer clic o al avanzar línea a línea) explicada en castellano palabra por palabra: los códigos G y M, F, S, T, y qué significan los números X, Y, Z (en G90, el punto al que va; en G91, cuánto se mueve y hacia dónde). Dice de dónde a dónde va la fresa, si corta o va en rápido, y avisa de lo que sigue valiendo de líneas anteriores (el G1, el G91). En los arcos, el centro (con I J o con R), el radio y los grados; en los taladros, el plano R, el fondo y la salida. Si la línea tiene un error o un aviso de la revisión, sale también.
- **📍 Posición absoluta en G91**: al lado de cada línea en incrementales, el punto en el que queda la fresa (→ X105 Y75), y en la explicación, la suma (Y: 35 + 40 = 75). Si hay líneas en G91, el panel del programa se ensancha para que se vea.
- Los dos se encienden y se apagan con sus botones, en la cabecera del programa, y el Simulador recuerda cómo se dejan. La guía del Simulador lo explica en el capítulo 4.

### Posición de los agujeros en las cotas (Calcador v93, Corrector v41)
- Corregido: los agujeros que no son redondos ni ranuras (rectangulares, con chaflanes…) se acotaban solo con sus medidas, no con dónde están, y no se podían sacar del plano las coordenadas de sus puntos. Ahora se acota su **esquina inferior izquierda** (su borde izquierdo y su borde de abajo) desde los bordes de la pieza, como el centro de los taladros. Con clic derecho en esas cotas se mueve el agujero.
- La biblioteca de inicio y los programas resueltos se han rehecho con las cotas nuevas.

### Simulador 3D V41: las medidas del tablero, como en TpaCAD
- Una línea `G71 X… Y… Z…` antes del primer movimiento (así da TpaCAD las medidas del tablero: largo, ancho y grosor) ya no es un movimiento: el Simulador pone el material en manual con esas medidas y el cero en la esquina inferior izquierda. Si el siguiente programa no las trae, vuelve a automático.
- Bajar hasta 2 mm más que el grosor del tablero (un corte o un agujero pasante que muerde el martiriño) es ahora un aviso; más de 2 mm sigue siendo un error.

### Apuntes y manuales
- Apuntes nuevos: **Programas resueltos** (`programas_resueltos.html` / `.pdf`, 36 páginas): las letras de una línea, G90, rectas, exterior e interior, G2 y G3, círculos en dos semicírculos, G91 (los mismos ocho ejercicios), mixta y pasadas de profundidad (con la Z siempre en G90). Cada ejercicio con su plano numerado, la tabla de puntos y el programa comentado línea a línea; los programas, en `herramientas_desarrollo/manuales/resueltos/programas/`, comprobados en el Simulador (100 % del contorno).
- Borradores para revisar, aparte: **Taladros: los ciclos fijos** (`taladros.html` / `.pdf`: G81, G82, G83, G73, G80, planos R e inicial, G98/G99, agujeros pasantes y cómo lo lee TpaCAD) y **Programas ISO para TpaCAD** (`iso_tpacad.html` / `.pdf`, según el manual del importador ISO de TpaCAD, con un programa de prueba en `herramientas_desarrollo/manuales/tpacad/pieza_tpacad.nc`).
- Apuntes ISO: capítulo nuevo, **6 Arcos con el centro fuera de la línea: Pitágoras para I y J** (los siguientes pasan a ser del 7 al 13). Es el contenido de los apuntes de los arcos, sin su repaso de G2 y G3, que ya está en el capítulo 5.
- Apuntes aparte: **Arcos con el centro fuera de la línea** (`arcos_pitagoras.html` / `.pdf`): la misma pieza con el centro de la muesca en la línea y 5 mm más abajo, superpuestas; el triángulo rectángulo y Pitágoras para sacar I, J y los puntos del arco, según venga acotado el plano; y un repaso de G2 y G3.
- Apuntes ISO y de los arcos: **por qué R positivo y R negativo**. Con el inicio, el final y el radio hay dos centros posibles (dibujo) y los dos dan un G2; el signo elige el arco corto o el largo (convención de Fanuc). Los errores que provoca (olvidar el menos, arcos de casi 180°, el círculo completo) y una regla práctica: R para arcos claramente menores de media vuelta, I J para el resto.
- Apuntes ISO, arcos: un círculo completo se puede hacer en una línea con I J, pero en clase se hace en dos semicírculos (funciona en todas las máquinas y no depende de que el final coincida exactamente con el inicio).
- Manuales, guía y apuntes en HTML: en pantalla, la hoja centrada y con márgenes (el texto ya no queda pegado a los bordes del navegador). En los PDF, ningún título queda solo al final de una página.

### Cerrar un arco con una recta (Calcador v92, Corrector v40)
- Corregido: un **arco de 3 puntos** seguido de una **recta hasta su primer punto** no cerraba el contorno (pedía al menos 3 puntos); ahora se cierra (arco + cuerda), lo mismo si el arco ya estaba terminado y la recta va de un extremo al otro. Al revés (primero la recta y después el arco) ya funcionaba.
- Editar → clic derecho en un extremo → **🔗 Unir o cerrar con el extremo más cercano**: si el extremo más cercano es el otro del mismo trazo, lo **cierra con una recta**; antes buscaba siempre otro contorno abierto, aunque estuviera más lejos.

### Avance de penetración y S… M03 en toda la suite (Calcador v91, Corrector v39, Calculadora v5)
- ⚙️ Mecanizar tiene un campo nuevo, **Avance de penetración F**: la velocidad al bajar en Z dentro del material (cada pasada de profundidad y el final de un puente), más lenta que la de corte, como en los apuntes: `G1 Z-3 F300` bajando y `F1000` cortando. Hasta Z0 la fresa sigue bajando por el aire a la F de corte, y la recta de entrada ya lleva la F de corte.
- Lo rellena la fresa elegida en la base de herramientas (su «F bajada»), y los contornos con herramienta propia bajan con el de su fresa. Nunca es más rápido que el avance de corte. Por defecto, 300 mm/min.
- **Un solo orden para arrancar el husillo**, el de la norma (la S antes que la M): `S12000 M03`. Lo escriben así ⚙️ Mecanizar, el cambio de herramienta (`G0 Z20 · M05 · T102 M06 · S16000 M03`), los avisos de la corrección, la Calculadora (`S18000 M03`) y los ejemplos y la plantilla del Simulador 3D, que ahora llevan además `T101 M06` y terminan con `M05` y `M30`.
- Los apuntes de los códigos ISO (capítulo 10) y el manual del Calcador (⚙️ Mecanizar) lo explican.

### Biblioteca de inicio
- Carpeta nueva `biblioteca_inicio`: **40 ejercicios** del generador del Calcador, 10 por nivel y de menos a más dentro de cada nivel. Nivel 1, rectas (1–5 en G90, 6–10 en G91); nivel 2, rectas inclinadas (1–5 en G90, 6–10 en mixta); nivel 3, arcos sencillos (G90); nivel 4, arcos con I J (libre).
- Su página, `biblioteca_inicio/index.html` (botón «📚 Biblioteca de inicio» de la portada), los enseña con su miniatura y la programación que piden, y enlaza las descargas y los PDF. Funciona igual en el disco, en GitHub Pages y en Aules.
- `Biblioteca_de_inicio.json` los mete todos de una vez en 📚 Biblioteca («Importar archivos…»), en la carpeta *Biblioteca de inicio*, con las etiquetas *Inicio* y *Nivel N*. También están sueltos, por carpetas, y con las **hojas de ejercicio y las soluciones en PDF**, una por nivel, listas para imprimir.

### Guía del Simulador 3D, nueva
- La guía se ha rehecho entera, con capturas nuevas del Simulador 3D V40 y para el alumnado y el profesorado. Ahora está también en HTML (`guia_simulador.html`), como los manuales.
- Explica lo que faltaba: la base de herramientas y el cambio de herramienta (T… M06), el material en manual, qué se dibuja (Visualización), el tiempo de mecanizado y los mensajes nuevos de la revisión.

### Un solo Simulador 3D (Simulador 3D V40, Calcador v90, Corrector v38)
- El **Simulador 3D** es ahora uno solo, para el alumnado y el profesorado: el que tenía el profesor, con el **editor de G-code** (✏️ Editar, ▶ Aplicar, 💾 Guardar, 📄 Nuevo), sin la etiqueta «Profesor». El alumnado puede corregir su programa en el propio simulador y guardarlo.
- `simulador3d_profesor.html` ya no es un simulador: lleva a `simulador3d.html`, para que los enlaces antiguos (por ejemplo, en Aules) sigan funcionando.
- En el Calcador y el Corrector, «➜ Abrir en el Simulador» abre el Simulador 3D.
- La guía del Simulador tiene un capítulo nuevo, «13 Corregir el programa en el simulador», sobre el editor.

### Centros de los arcos más visibles (Calcador v89, Corrector v37)
- El centro de los arcos, los taladros y las ranuras se marca con una **cruz de 5 mm** (2,5 mm a cada lado) en su propia capa: **rojo oscuro** y más gruesa que las líneas de cota (negra en el SVG y las hojas en negro).
- En las hojas de ejercicio y de soluciones, y en el SVG, el **contorno de la pieza es bastante más grueso** que las cotas (unos 3 pt en una pieza de 200 mm).
- 🧩 Ejercicio aleatorio: el panel de opciones es más ancho y la barra de desplazamiento ya no tapa ningún campo.

### 🧩 Ejercicio aleatorio: niveles, piezas escalonadas y series para la clase (Calcador v88, Corrector v36)
- **Nivel**, con la progresión de clase: 1, solo rectas horizontales y verticales; 2, rectas inclinadas (chaflanes por proyecciones); 3, arcos con el centro en la rejilla (I J enteros); 4, arcos que piden calcular I J y polígonos. Cada nivel pone las formas, esquinas y lados que le tocan; si se cambia algo a mano, pasa a «Libre».
- Forma nueva para las piezas: **escalonada** (un rectángulo con muescas en las esquinas y quizá una ranura en un lado: piezas en L, en T o en U).
- **Serie para la clase**: un ejercicio distinto para cada alumno (los números seguidos desde el primero de las propuestas), guardados en la biblioteca (carpeta Aleatorios/Serie…, numerados en el cajetín) y, si se quiere, con todas sus hojas o sus soluciones impresas de una vez.
- La ventana es más grande y su panel de opciones, más ancho.
- Corregido: dos agujeros rectangulares podían cruzarse en cruz (la distancia se medía solo desde los vértices). Algunos números dan ahora otra pieza.

### 🧩 Ejercicio aleatorio: esquinas y lados en arco (Calcador v87, Corrector v35)
- En **Esquinas y lados**: la probabilidad de que cada esquina de un rectángulo, polígono o estrella salga **redondeada**, **hacia dentro** (cuarto de círculo con centro en la esquina) o con **chaflán**, y de que un lado recto salga como **arco abombado** o **hundido**. Se puede aplicar también a los agujeros.
- Los radios y los chaflanes salen en múltiplos del paso de las cotas; los arcos que la fresa recorre por su lado cóncavo miden al menos su diámetro, así que todo se sigue pudiendo mecanizar. Los rectángulos con solo esquinas siguen siendo editables como rectángulo.
- Un ejercicio generado con la v86 (sin estos parámetros) sale igual con su número.

### 🧩 Ejercicio aleatorio (Calcador v86, Corrector v34)
- **Ejercicios generados al azar** con las formas del Calcador (panel Ejercicio, arriba a la izquierda): rectángulos, polígonos, estrellas, círculos y colisos, con agujeros dentro. Se eligen el tamaño máximo del conjunto (por ejemplo, 250 × 200), cuántas piezas y cuántos interiores, qué formas pueden salir para cada cosa, en qué múltiplos salen las cotas (1, 5 o 10 mm), si las formas van giradas, el diámetro de la fresa y la pared mínima.
- Salen **seis propuestas**, cada una con su **número**; clic en una y pasa al dibujo con sus cotas, con las formas editables y cada pieza agrupada con sus agujeros. El mismo número con los mismos parámetros da el mismo ejercicio, y se guarda en el JSON.
- Todos se pueden mecanizar: ningún agujero más pequeño que dos diámetros de fresa, la pared mínima entre agujeros y con el borde, y las piezas separadas el diámetro más 4 mm.

### Apuntes «Códigos ISO de la Suite CNC» (nuevos)
- **Apuntes para el alumnado** (`apuntes_iso.html` y `apuntes_iso.pdf`, en la portada de la suite): cómo es un programa ISO (el orden de las letras N G X Y Z F S T M, la numeración N10, N20… y los comentarios con ;); los ejes, el cero pieza y las alturas; G71/G70 y G90/G91 (también mixtas); G0 y G1, con el avance de penetración (F150) y el de corte (F1500); los arcos G2 y G3 con I J y con R, y K en los planos G18 y G19 y en la hélice; las coordenadas polares; S, F, M03, M04, M05 y el cambio de herramienta T… M06; el final con M30 y M02; la compensación del radio G40, G41 y G42 paso a paso (la regla de la izquierda y la derecha, exteriores e interiores, la entrada y la salida, las esquinas, concordancia y oposición, y cómo se ve en el Simulador); un programa del Calcador comentado línea a línea; los errores frecuentes con el aviso del Simulador, una hoja resumen para imprimir y, de extra, un poco de historia del G-code.
- El manual del Calcador enlaza los apuntes desde ⚙️ Mecanizar.

### Concordancia y oposición corregidas (Calcador v85, Corrector v33)
- En ⚙️ Mecanizar, las estrategias **Concordancia** y **Oposición** estaban al revés. Con el husillo a derechas (M03), concordancia es la fresa a la izquierda del contorno (G41): exteriores en sentido horario e interiores en antihorario, y así lo hace ahora, también en las cajeras. «Según el plano» no cambia.

### Alinear, repartir, bloquear, recortar y alargar (Calcador v84, Corrector v32)
- **Alinear y repartir** (panel de la selección): seis botones alinean dos o más piezas a la izquierda, al centro, a la derecha, abajo, al centro o arriba, respecto al conjunto; «Repartir ↔ / ↕» deja la misma separación entre tres o más (la primera y la última no se mueven). Cada grupo o texto cuenta como una pieza.
- **🔒 Bloquear** (panel del contorno o de la selección): el contorno ya no se coge en el dibujo (ni clic, ni recuadro, ni Ctrl+A, ni flechas), para calcar o acotar encima sin moverlo por error; los imanes sí lo ven. Lleva 🔒 en el dibujo y en la lista, desde donde se selecciona y se desbloquea. Se guarda en el JSON.
- **Recortar** (tecla Y): clic en el trozo que sobra y se quita hasta los cruces más cercanos con otros contornos o con las auxiliares (o hasta el extremo). **Alargar** (tecla H): clic junto al extremo de un trazo abierto y la recta o el arco se prolonga hasta el primer contorno o auxiliar. Las dos enseñan antes lo que harán.

### Agrupar y mover con las flechas (Calcador v83, Corrector v31)
- **Agrupar** (Editar): selecciona varios contornos y pulsa Ctrl+G o «🔗 Agrupar» en el panel. Un clic en cualquiera selecciona el grupo entero (marco «🔗 grupo»), que se arrastra, gira, escala, copia, pega o borra junto; el recuadro de selección también lo coge entero. Alt + clic selecciona un solo contorno del grupo (para su mecanizado o su herramienta). Ctrl+Mayús+G o «⛓ Desagrupar» lo deshace. Se guarda en el JSON, y cada copia de un grupo (pegar, matrices, «Hacer copia») es un grupo nuevo.
- Los tableros del **Anidador** llegan al Calcador con cada pieza agrupada.
- **Flechas**: con algo seleccionado, lo mueven 1 mm (Mayús: 10 mm; Ctrl: 0,1 mm), y las pulsaciones seguidas se deshacen de una vez. Sin nada seleccionado, siguen recorriendo la pieza. Esc quita la selección.

### Anidador v8: por la forma real
- **Colocar las piezas: por su rectángulo o por su forma real** (caja del tablero). Por la forma real, las piezas se encajan por su contorno y las pequeñas aprovechan los **huecos** de las grandes (un posavasos dentro de un aro). Entre dos piezas queda siempre la separación de la fresa: cada sitio se comprueba con la geometría exacta, con sus arcos. Si no sale mejor que por rectángulos (por ejemplo, con todo rectángulos), se usa el de rectángulos y se avisa.
- Colocar a mano, girar y pasar de tablero también miran la forma: se puede soltar una pieza dentro del hueco de otra. Las piezas se dibujan rellenas por su forma y se cogen por ella. El aprovechamiento cuenta la superficie real. El modo se guarda con el tablero.
- En el Calcador, ⚙️ Mecanizar corta **de dentro afuera**: una pieza dentro del hueco de otra se corta antes que ese hueco, y este antes que el exterior (en una pieza sola, es lo mismo que «interiores primero»).

### Orden de corte y DXF (Calcador v82, Corrector v30)
- **⚙️ Mecanizar corta por defecto los interiores antes que los exteriores**, como se hace en madera: la pieza sigue sujeta al tablero mientras se cortan sus agujeros y el contorno exterior la suelta al final. El campo **Orden de corte** permite volver a «exteriores primero». Se guarda en el JSON; las entradas E1, E2… del plano y la tabla de soluciones siguen el orden elegido. Los grabados y las cajeras van siempre antes.
- **El DXF del Calcador se abre en AutoCAD**: antes era un DXF mínimo con LWPOLYLINE y sin versión, y AutoCAD lo abría vacío (el del Anidador sí se abría). Ahora es un DXF R12 completo, como el del Anidador: cabecera con versión y extensión, tablas de capas y polilíneas con sus arcos (POLYLINE) o líneas y arcos sueltos. Capas: PERFIL, INTERIOR, ABIERTO, CAJERA, ISLA y TEXTO.
- La tabla de soluciones sin abrir (por ejemplo, al imprimir soluciones en lote) vale para todos los contornos, no solo para el primero.

### Entregas y evaluación con Aules (Calcador v81, Corrector v29, Simuladores V39)
- **Corrección masiva desde el zip de Aules**: «📂 Añadir programas o zip de Aules…» (o arrastrar) acepta el .zip de «Descargar todas las entregas». Cada alumno sale del nombre de su carpeta (también en la descarga sin carpetas y con calificación anónima); se leen los programas, el texto en línea pegado en Aules y los .zip que suba el alumno; lo que no es un programa se ignora. Un alumno con dos programas sale dos veces. Funciona sin conexión y sin bibliotecas (con descompresión propia si el navegador no la trae).
- **🧾 Informe de entrega en los Simuladores**: el alumno escribe su nombre y descarga un PDF con su programa completo, la imagen de la simulación terminada (2D o 3D), la revisión, la comparación con el plano y un **código de comprobación** (SHA-256 del programa y del informe). El Corrector lo lee en la corrección masiva: 🧾 si coincide con el programa entregado, 🧾⚠️ si el informe se ha cambiado o el programa no es el mismo; si solo sube el informe, se corrige el programa que lleva dentro. También en el CSV y en el informe impreso.
- **📝 Cuestionario para Aules (Moodle XML)**: preguntas sobre el ejercicio abierto que Aules corrige solo (coordenadas G90, G91 y polares de un punto, I J y R de un arco, G2/G3 y G41/G42), con el plano marcado (P1…, A1…, cero pieza y sentido) y en varias variantes (las de 🎲 Variantes): cada pregunta en su categoría, para añadir una pregunta aleatoria por categoría y que cada alumno reciba una variante distinta.

### Anidador v7: cantos y coste
- Columna **Cantos** en la lista: clic en cada lado de la pieza (en las del Calcador, todo el contorno exterior). En el tablero, el PNG y el SVG, los lados con canto se ven en amarillo, también con la pieza girada.
- CSV con `canto largo`, `canto ancho` (0, 1 o 2, o `L1 L2 A1`, `2L 1A`, `todos`) y `tipo de canto`; las columnas se reconocen por su título. La plantilla y la lista exportada las llevan, y el tablero guardado conserva los cantos.
- Panel **Cantos y coste**: tableros, superficie real de las piezas, desperdicio, metros de cada tipo de canto (con exceso por tramo), tiempo de máquina aproximado (pasadas al avance de la fresa, entradas y carga de cada tablero) y coste con los precios que escribas. «⬇ Despiece y coste (CSV)».

### Calcador de contornos
- Dibujo y calco de piezas con cotas automáticas en cadena (sin números que se pisen), cotas manuales, tangencias (recta tangente y arco de radio R), corte y unión de contornos, cajeras con islas y puentes de sujeción.
- Entrada de coordenadas absolutas, incrementales, polares y en ISO (G1, G2 y G3 con I J o R).
- Ajuste de medidas con el centro de los arcos en la rejilla (I y J exactos).
- Hoja de ejercicio, tabla de soluciones (con el programa ISO y sus alturas de seguridad), variantes para examen y biblioteca de ejercicios con copia de seguridad.
- Corrección de programas, uno a uno o de toda la clase: geometría, seguridad (incluido el rápido sin subir la herramienta), lo pedido y la compensación de radio G40/G41/G42 según el tipo de cada trazado (interior o exterior).
- Simulación del programa del alumno bloque a bloque, con la trayectoria real de la fresa, y reproductor del programa de la pieza en la barra superior.
- «➜ Abrir en el Simulador» con un clic.
- Aviso de cambios sin guardar en archivo.

### Varias herramientas y cambio con M06 (Calcador, Corrector y Simuladores)
- Cada contorno puede llevar **su herramienta** (de la base compartida): campo «Herramienta» en el Mecanizado del panel derecho. En el plano, la entrada lo indica (`E2 · T102`) y la hoja de ejercicio dice qué herramienta corta cada contorno.
- ⚙️ Mecanizar mecaniza por herramientas, con un **cambio como en la norma ISO** entre una y otra: `G0 Z` de seguridad · `M05` · `T102 M06` · `M03 S…`, y el avance, las revoluciones, el paso y el radio de cada fresa. El programa empieza con `T101 M06` y `M03`.
- La corrección comprueba que cada contorno se corte con su herramienta (cuenta como «lo pedido») y el cambio: M06 con la fresa abajo o cortar sin M03 después del cambio son errores de seguridad; que falte M05 o usar G28 (depende del control) son avisos. La compensación usa el radio de la herramienta de cada tramo.
- La **tabla de soluciones** también lo hace: su programa ISO lleva el cambio (`M05` · `T102 M06` · `M03 S…`) antes del primer contorno de cada herramienta, ya a la altura de seguridad (v79).
- La **simulación del plano** dibuja la huella y la fresa con el diámetro de la herramienta de cada contorno (antes, siempre con el de la general), y se rehace al cambiar la herramienta de un contorno (v80).
- Los Simuladores cambian de fresa al leer `T… M06` (diámetro y tipo de la base): el corte, la compensación y la fresa dibujada; el panel muestra la herramienta activa y la revisión avisa de los mismos errores.

### DXF de fondo con acentos (Calcador v79)
- Los textos de un DXF de fondo se leen con sus acentos, eñes y símbolos, venga de donde venga: DXF 2007 o posteriores (en UTF-8), DXF antiguos en su página de códigos (`$DWGCODEPAGE`, normalmente Windows-1252) y los códigos `\U+XXXX` (así escribe el Anidador los nombres) y `%%nnn`, además de `%%c` (Ø), `%%d` (°) y `%%p` (±).

### ⚙️ Mecanizar: el programa de la máquina (Calcador y Corrector)
- El G-code de la máquina se genera dentro del Calcador, en milímetros reales y desde el cero pieza del plano.
- Cortes, grabados, cajeras con islas (concéntricas o en zigzag, entrada vertical o en rampa), puentes, pasadas en Z, desbaste y acabado; estrategia según el plano, en concordancia o en oposición; coordenadas G90, G91 o **mixtas** (G90 en la entrada y el cierre de cada contorno, G91 en el recorrido, como en la tabla de soluciones); G71 o G70. G-code con 3 decimales.
- Herramienta de la base compartida (T, diámetro, F, S y paso se rellenan solos).
- Compensación **G41/G42 según el trazado**: por fuera de los exteriores y por dentro de los interiores.
- Con G41/G42, cada contorno se mecaniza como en los ejemplos del Simulador: la fresa baja fuera del contorno (a Ø + 2 mm, por el lado de la fresa), activa la compensación en una recta de entrada perpendicular y la anula con **G40** en una recta de salida. El programa empieza y termina en G40. Si la entrada P1 es una esquina, se entra por el centro de un lado; la bajada no toca ningún otro contorno de la pieza.
- Vista previa con la banda de la fresa y colores por profundidad, resumen (pasadas, longitud, tiempo) y avisos.
- Descargar .nc, copiar y «➜ Abrir en el Simulador» con un clic. Los ajustes se guardan en la sesión y en el JSON.

### Corrector
- El Calcador sin herramientas de dibujo: abre un ejercicio, corrige, simula, imprime, exporta y genera el G-code con ⚙️ Mecanizar, sin riesgo de modificarlo. Se genera a partir del Calcador.

### Simulador 3D (alumnado y profesorado)
- Vista 3D y **vista 2D** en planta (arranca en 2D si el equipo no tiene 3D).
- **Plano del ejercicio**: abre el JSON del Calcador y colorea el recorrido del programa (autocorrección).
- Grosor del tablero para cortes no pasantes y vaciados.
- Compensación G41/G42 con las esquinas interiores bien resueltas; ejemplos de corte interior y exterior.
- Coordenadas polares (G16) y coma decimal interpretadas igual que en el Calcador.
- **Corte suave en 3D**: las paredes siguen el círculo de la fresa (plana, de bola o en V) en lugar de ir en dientes de sierra, con 400 puntos por lado.
- **Ancho del corte «Real» automático** al cargar un programa con G41/G42 o hecho con ⚙️ Mecanizar: el borde del corte coincide con la pieza. Se puede volver a cambiar a mano.
- El programa que llega desde ⚙️ Mecanizar conserva el nombre del archivo («… (mecanizado).nc»).

### En toda la suite
- **Base de herramientas** compartida (T101…T999), con importación y exportación en JSON y CSV.
- Ventana «Créditos y licencias» en cada programa (EUPL-1.2 y licencias de terceros).

### Revisión de robustez
Pruebas de estrés con miles de programas, proyectos y archivos aleatorios, rotos y extremos en todos los programas. Corregido:
- **Simuladores**: un programa con coordenadas enormes (por ejemplo, un radio de un kilómetro por un cero de más) podía colgar el simulador al dibujar la cuadrícula; ahora la cuadrícula se adapta al tamaño de la escena. Mismo tope en la evaluación del plano.
- **Calcador y Corrector**: la corrección de un programa con un tramo de kilómetros podía tardar más de un minuto (ahora, milisegundos); al seleccionar el aviso de un arco imposible, o uno de «lo pedido», el dibujo de la corrección fallaba; un arco de radio nulo (I0 J0) con G41/G42 rompía la simulación.
- **⚙️ Mecanizar**: con desbaste y acabado, un trazado demasiado estrecho para el sobreespesor (por ejemplo, una media luna fina) se corta sin acabado y el G-code lo avisa.

### Manuales y ayudas
- Las entregas por Aules, en los manuales: el **zip de Aules** y el **informe de entrega** en la corrección masiva (Calcador y Corrector), el capítulo **Cuestionario para Aules** (Corrector, 11) y su apartado en el del Calcador, **Cantos y coste** en el del Anidador (capítulo 12) y **El informe de entrega** en la guía del Simulador (capítulo 12).
- **Manual del Calcador** (84 páginas): capítulo nuevo **«⚙️ Mecanizar: el programa de la máquina»** (herramienta, profundidad, recorrido, cómo es el programa, vista previa y Simulador); capturas al día (la pantalla con sus zonas, el panel Exportar, el mecanizado de un contorno, el Corrector y el reproductor); la barra superior descrita con la biblioteca, el reproductor y el aviso de cambios sin guardar; dudas nuevas en «Problemas frecuentes».
- **Manual de la Calculadora de taller** (`manual_calculadora.html` y `.pdf`, 12 páginas, para el alumnado): cada pestaña con un ejemplo de taller resuelto paso a paso, sus fórmulas, las líneas ISO y los errores típicos (ángulos, R negativo, el polo de G16).
- **Manual del Anidador de tableros** (`manual_anidador.html` y `.pdf`, 18 páginas, para el profesorado): el tablero, la fresa, las piezas y la lista de despiece, colocar a mano con el ratón, del tablero al Calcador y a la máquina, guardar y reabrir, y exportar. Los dos, enlazados desde la portada y desde la ayuda de cada programa.
- **Manual del Calcador**: el cambio de herramienta en la tabla de soluciones, la fresa de cada contorno en el recorrido de la pieza y los acentos de los textos DXF.
- **Ayuda de los Simuladores**: el botón «📂 Cargar G-code / plano».
- **Guía del Simulador para el alumnado** (`guia_simulador.pdf`, 18 páginas): para qué sirve, la pantalla, cargar el programa, la simulación, 2D o 3D, la revisión y sus mensajes, la herramienta, el tablero, la compensación G41/G42, el plano del ejercicio (autocorrección), el vídeo para Aules, el informe de entrega, problemas frecuentes y una lista de comprobación antes de entregar. Enlazada desde la portada y desde la ayuda de los simuladores.
- **Simuladores**: la cabecera cabía mal en pantallas de menos de 1600 píxeles (desaparecían los ajustes ⚙️ y parte de la ayuda); ahora los botones se compactan y caben de 1024 a 1920 píxeles.
- **Manual del Corrector** (`manual_corrector.html` y `.pdf`, 20 páginas, para el profesorado): abrir un ejercicio, corregir un programa, qué se comprueba, la simulación, la corrección de toda la clase con la nota orientativa, demostrar los errores en clase, hojas, variantes, ⚙️ Mecanizar y el Simulador, y problemas frecuentes. El botón «📖 Manual» del Corrector abre ahora su propio manual.
- **Corrección masiva**: con la compensación del lado equivocado, el programa salía «no sale bien» pero con un 10; ahora los errores de compensación cuentan como cortes que dañan la pieza (el del lado, uno por cada corte afectado).

### Interfaz
- **Calcador**: si la pantalla es baja (portátil apaisado, pantalla táctil o zoom del navegador), la barra de herramientas se reparte sola en dos o más columnas y ya no queda cortada por abajo.
- **Calcador**: el panel izquierdo es un poco más ancho y el botón 🧰 de la base de herramientas se ve entero.
- **Calcador**: el botón **«💾 Guardar (.json)»** guarda el proyecto: ese archivo lo abren todos los programas de la suite.

### Compensación con fresas grandes
- **Calcador, Corrector y Simuladores**: con G41/G42 y una fresa más grande que un arco cóncavo o que un hueco de la pieza, el camino de la fresa formaba bucles que se metían en la pieza. Ahora esos bucles se quitan, como haría un CAM: la fresa pasa de largo y deja ese material sin cortar.
- **Corrección**: aviso en la línea del arco cóncavo donde la fresa no cabe («la máquina daría una alarma de interferencia o dejaría ese material sin cortar»), con el diámetro máximo que cabría. La revisión de los Simuladores ya lo marcaba como error.

### Calculadora de taller (nueva, alumnado)
- **Recta inclinada**: de longitud y ángulo a ΔX y ΔY (y al revés, o con una proyección y el ángulo), con el punto final en G90 y en G91.
- **Polares**: de radio y ángulo a X Y y al revés, con el polo en el cero pieza o donde se indique; da también la línea con G16.
- **Arco**: con el inicio, el final, el sentido y el radio (corto o largo) o el centro, saca el centro, I J, R (negativo si pasa de 180°), el ángulo y la longitud. Avisa si el radio no llega o si el centro no está a la misma distancia de los dos puntos.
- **G90 ↔ G91**: convierte un programa entero a absolutas, a incrementales o a mixta (G0 y Z en G90, cortes en G91), sin tocar I J ni R.
- **Velocidades de corte**: revoluciones, velocidad de corte, avance y avance por diente, y el tiempo de mecanizado.
- Cada cálculo con su dibujo, con el símbolo del cero pieza de los planos del Calcador, y las líneas ISO listas para copiar.
- v4: en el móvil, la pestaña del arco (y la de G90 ↔ G91) ya no se sale por la derecha; en el dibujo de la recta, la cota ΔY ya no se corta cuando el punto final queda en el borde.
- Ayudas emergentes en todos los campos, opciones, resultados y botones, y ❓ Ayuda (o F1) con la explicación de cada pestaña. Funciona en el móvil y recuerda los últimos datos.

### Anidador de tableros (nuevo, profesorado)
- Coloca varias piezas en un tablero para cortarlas de una vez: **piezas del Calcador** (.json, con sus arcos, agujeros, cajeras, grabados y puentes) y **listas de despiece** (.csv: nombre; largo; ancho; cantidad; veta), o rectángulos añadidos a mano.
- Tablero con sus medidas, grosor, margen del borde y cero pieza en la esquina que se elija. Separación entre piezas = Ø de la fresa (de la base compartida) + holgura.
- **Veta**: las piezas con veta no se giran; las demás se giran 90° si caben mejor. Si no caben en un tablero, se usan más; las que no caben ni en uno vacío se marcan.
- Cada tablero sale como **proyecto del Calcador** (➜ Abrir en el Calcador o 💾 .json; con el Calcador v80, «➜ Abrir en el Calcador» funciona también en Firefox con los archivos en el ordenador), con la fresa y la profundidad (grosor + corte pasante) ya puestas en ⚙️ Mecanizar.
- **Colocar a mano con el ratón** (v3), sobre el rectángulo de cada pieza: **arrastrar** la deja fijada 📌 donde se suelta (se pega a los márgenes y a las demás piezas, a la distancia de separación) y el anidador coloca las demás alrededor; **doble clic** la gira 90° sobre su centro (Mayús: al otro lado; también la tecla R); las **asas** de la pieza seleccionada cambian su escala en proporción (esquinas) o, en los rectángulos, su largo o su ancho (lados). Clic en la chincheta para soltarla, o 📌 Soltar todas.
- **Reabrir un tablero guardado** (v4): el .json de 💾 Guardar tablero se abre con sus piezas por separado, cada una colocada donde estaba (📌) y con su giro y su escala, y con las medidas del tablero, para seguir editándolo. Las piezas iguales vuelven a ser una con sus unidades. También los tableros guardados con versiones anteriores.
- En la lista, **Giro** (Auto, 0°, 90°, 180°, 270°) y **Color** de cada pieza: se dibuja con él en el tablero, el PNG y el SVG, y cada pieza nueva sale de un color distinto (v3).
- **Pasar una pieza a otro tablero** (v6): se arrastra hasta la pestaña de ese tablero, o hasta «＋ Tablero nuevo», que aparece mientras se arrastra; queda colocada (📌) en el primer hueco libre. Un tablero que se queda sin piezas desaparece.
- **El color de cada pieza en el DXF** (v6): el corte exterior y el nombre de cada pieza llevan su color (el de AutoCAD más parecido); interiores, grabados y cajeras, el color de su capa.
- **v5**: el SVG y el PNG dibujaban algunos arcos hacia el lado contrario (el DXF estaba bien); los nombres de las piezas pequeñas se ajustan a su recuadro, en pantalla y en lo exportado; la pieza que arrastras o escalas se dibuja por encima de las demás y, si ahí no cabe, se pone roja entera.
- **Exportar el tablero que se ve** (v2): ⬇ PNG (imagen), ⬇ SVG (vectorial a escala real en mm, con los arcos de verdad) y ⬇ DXF (R12, en mm, con el cero pieza del proyecto como origen y una capa por tipo: TABLERO, EXTERIOR, INTERIOR, GRABADO, CAJERA y NOMBRES). En el tablero y en lo exportado, cada tipo con su color: corte exterior azul, interior rojo, grabado verde y cajera naranja.
