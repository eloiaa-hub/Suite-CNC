# Archivos de referencia de Atheon Design

Un cuadrado de 50 × 50 mm hecho con Atheon Design (el programa de la cortadora láser Atheon de Nomatech, copia de RDWorks):

| Archivo | Qué es |
|---|---|
| `cuadrado_50x50.rd` | Lo que se envía a la máquina: 9 mm/s, 60 %, 2 pasadas, «posición actual» (controladora Ruida, código 0x88) |
| `cuadrado_50x50.plt` | El mismo cuadrado en HPGL (40 unidades por mm) |
| `cuadrado_50x50.rld` | El proyecto de Atheon Design (formato RDWorks 8) |
| `placa_un_objeto_exportada.plt` | Una placa con agujeros escrita como un solo objeto, abierta en Atheon Design y exportada: los contornos salen unidos en un recorrido |
| `default_rdworks.rld` | Otro proyecto de RDWorks (mesa de 1200 × 800, un rectángulo de 441 × 318) |

| `circulo.rld` / `.plt` | Un círculo (4 curvas Bézier) |
| `dos_cuadrados.rld` / `.plt` | Dos cuadrados separados en la misma capa (2 objetos) |
| `dos_capas.rld` / `.plt` | Un cuadrado en la capa negra y un círculo en la roja (2 capas, 2 objetos) |

## El formato .rld (deducido comparando estos proyectos)

- Cabecera `RDFILEVER8.0.01G`; la mesa (ancho y alto, `double`) en 0x14 y 0x1C.
- **Tabla de capas** desde 0x190, 659 bytes por capa: color (COLORREF `0x00BBGGRR`) en +4 y, desde +0xC, velocidad, potencia mín. y máx. del láser 1 y del 2 (`double`), cuatro potencias más en +0xE8, un indicador de varias pasadas en +0x128 y las pasadas (`uint32`) en +0x12C. Colores: 0 negro, 1 azul, 2 rojo, 3 verde…
- **Capas en uso** en 0x499C6: número (`uint32`) y, por cada capa, 661 bytes con el mismo formato. Su orden es el orden de corte.
- **Objetos**: número (`uint32`) y, por cada objeto, una cabecera de 13 bytes (número del objeto en +5 y color de su capa en +9), la caja (x mín., x máx., y mín., y máx.), cerrado (`uint32`), número de tramos (`uint32`), los tramos y 188 bytes de cierre.
- **Tramos** de 74 bytes: tipo (`uint16`: 0 = recta, 3 = Bézier), 4 bytes de relleno y los puntos (`double`, mm, X a la derecha e Y hacia arriba desde la esquina inferior izquierda de la mesa): recta = inicio y fin; Bézier = inicio, fin, control 1 y control 2. El resto es relleno (restos de memoria del programa).
- Un objeto es un recorrido continuo (`placa_un_objeto_exportada.plt`): cada contorno tiene que ir en su propio objeto.
- El Calcador láser escribe cada contorno como un objeto, los arcos como curvas Bézier de 90° como mucho, el Corte en la capa negra y el Marcado en la azul. La prueba `laser.js` lee estos proyectos, los vuelve a escribir y comprueba que quedan iguales.
