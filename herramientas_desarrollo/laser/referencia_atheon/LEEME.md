# Archivos de referencia de Atheon Design

Un cuadrado de 50 × 50 mm hecho con Atheon Design (el programa de la cortadora láser Atheon de Nomatech, copia de RDWorks):

| Archivo | Qué es |
|---|---|
| `cuadrado_50x50.rd` | Lo que se envía a la máquina: 9 mm/s, 60 %, 2 pasadas, «posición actual» (controladora Ruida, código 0x88) |
| `cuadrado_50x50.plt` | El mismo cuadrado en HPGL (40 unidades por mm) |
| `cuadrado_50x50.rld` | El proyecto de Atheon Design (formato RDWorks 8) |
| `placa_un_objeto_exportada.plt` | Una placa con agujeros escrita como un solo objeto, abierta en Atheon Design y exportada: los contornos salen unidos en un recorrido |
| `default_rdworks.rld` | Otro proyecto de RDWorks (mesa de 1200 × 800, un rectángulo de 441 × 318) |

## Lo que se sabe del .rld (comparando los dos proyectos)

- Cabecera `RDFILEVER8.0.01G`; la mesa (ancho y alto, `double`) en 0x14 y 0x1C.
- Parámetros de la capa 0 en 0x19C y una copia en 0x499D6 (la del objeto): velocidad, potencia mín. y máx. del láser 1 y del 2 (`double`), cuatro potencias más en +0xDC y las pasadas (`uint32`) en +0x120.
- El objeto, en 0x49C70: caja (x mín., x máx., y mín., y máx.), `1`, número de tramos, 2 bytes y cada tramo en 74 bytes: 4 de relleno, x1 y1 x2 y2 (`double`, mm) y 38 de relleno (restos de memoria: cambian de un archivo a otro).
- Comprobado abriendo en Atheon Design tres .rld escritos así (cuadrado, «F» y placa con agujeros) y exportándolos a PLT: las medidas, la posición y la orientación salen exactas (mm, X hacia la derecha e Y hacia arriba desde la esquina inferior izquierda de la mesa). Pero **un objeto es un recorrido continuo**: los tramos de la placa salen unidos, con líneas de un contorno al siguiente.
- Sin saber todavía: varios objetos, varias capas, arcos y curvas. Por eso el Calcador láser solo guarda en .rld piezas de un contorno (un objeto en la capa 0).

La prueba `herramientas_desarrollo/pruebas/laser.js` genera ese mismo trabajo con el Calcador láser y lo compara byte a byte con `cuadrado_50x50.rd` (solo puede cambiar 1 µm de redondeo en el tamaño de la matriz).
