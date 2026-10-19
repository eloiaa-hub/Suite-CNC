# Ediciones

Todas las apps que se compilan están en **`ediciones.json`**: la Suite completa y cada programa por separado.

| Clave | App | Ejecutable | Empieza en |
|---|---|---|---|
| `profesorado` | Suite CNC | `SuiteCNC.exe` | `index.html` (la portada y todo) |
| `calcador` | Calcador de contornos | `Calcador.exe` | `calcador.html` |
| `corrector` | Corrector | `Corrector.exe` | `corrector.html` |
| `anidador` | Anidador de tableros | `Anidador.exe` | `anidador.html` |
| `simulador` | Simulador 3D | `Simulador3D.exe` | `simulador3d.html` |
| `tutor` | Tutor G-Code | `TutorGCode.exe` | `tutor.html` |
| `calculadora` | Calculadora de taller | `Calculadora.exe` | `calculadora.html` |

Además de lo que diga `incluir`, cada app lleva **automáticamente** lo que sus páginas enlazan o abren (`scripts/preparar.mjs` lo detecta). Por ejemplo, el Calcador lleva dentro el Generador y el Simulador, porque los abre con «Abrir en…».

Cada campo:

- **`icono`:** el número del icono de la portada (0 = logo, 1 = primera ficha…). Los iconos están en `src-tauri/icons/<clave>/`. Si cambias los de la portada, regenera con `npm run iconos` (necesita `pip install cairosvg`).
- **`devtools`:** con `true`, la app lleva F12 (herramientas de desarrollador).
- **`publicar`:** con `false`, la app no se adjunta a las Releases públicas, aunque sigue en Artifacts.

## Añadir un programa nuevo

1. Copia una entrada en `ediciones.json` y cambia la clave, `nombre`, `exe`, `id` (único), `inicio`, `incluir` e `icono`.
2. Añade la clave a la lista `edicion:` de `.github/workflows/suite-escritorio.yml`.
3. Si tiene icono nuevo en la portada: `npm run iconos`.

## Compilar a mano

```
npm run app -- calcador            (o cualquier otra clave)
npm run app -- calcador dev        (modo desarrollo)
```
