# Archivos de referencia de Atheon Design

Un cuadrado de 50 × 50 mm hecho con Atheon Design (el programa de la cortadora láser Atheon de Nomatech, copia de RDWorks):

| Archivo | Qué es |
|---|---|
| `cuadrado_50x50.rd` | Lo que se envía a la máquina: 9 mm/s, 60 %, 2 pasadas, «posición actual» (controladora Ruida, código 0x88) |
| `cuadrado_50x50.plt` | El mismo cuadrado en HPGL (40 unidades por mm) |
| `cuadrado_50x50.rld` | El proyecto de Atheon Design (formato RDWorks 8, todavía sin descifrar del todo) |

La prueba `herramientas_desarrollo/pruebas/laser.js` genera ese mismo trabajo con el Calcador láser y lo compara byte a byte con `cuadrado_50x50.rd` (solo puede cambiar 1 µm de redondeo en el tamaño de la matriz).
