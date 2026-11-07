# Parámetros de corte de la láser

`Parametros_laser_inicio.json` es la biblioteca de parámetros de inicio del **Calcador láser**: velocidad, potencia mínima y máxima, pasadas y aire para cada material y grosor, de corte o de marcado.

| Material | Grosor | Velocidad | Potencia | Origen |
|---|---|---|---|---|
| MDF | 3 mm | 30 mm/s | 60 % | Biblioteca de fábrica de Atheon |
| MDF | 4 mm | 23 mm/s | 60 % | Interpolado (orientativo) |
| MDF | 5 mm | 17 mm/s | 60 % | Biblioteca de fábrica de Atheon |
| MDF | 10 mm | 7 mm/s | 60 % | Interpolado (orientativo) |
| Acrílico | 3 mm | 30 mm/s | 60 % | Biblioteca de fábrica de Atheon |
| Acrílico | 5 mm | 16 mm/s | 60 % | Interpolado (orientativo) |
| Acrílico | 10 mm | 4 mm/s | 60 % | Biblioteca de fábrica de Atheon |
| MDF, marcar líneas | — | 200 mm/s | 14 % | Del grabado a baja potencia de Atheon (orientativo) |

- En el Calcador láser, pestaña 🔥 Láser → **📚 Parámetros de corte** → «⬆ Importar…» y elige este archivo (o pulsa «Parámetros de inicio», que ya los lleva dentro).
- «⬆ Importar…» también lee el **Param.lib** de Atheon Design (su biblioteca de parámetros), y «⬇ Atheon (.lib)» guarda la nuestra en ese mismo formato.
- Haz una prueba con cada material antes de cortar piezas y corrige la entrada; los interpolados, sobre todo.
