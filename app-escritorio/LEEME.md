# Suite CNC — versión de escritorio (Tauri + Rust)

Convierte la Suite CNC en **apps de escritorio portables** para Windows y Linux, **sin tocar los HTML**. Al compilar se añaden a cada página dos scripts (`tauri/temprano.js` al principio y `tauri/puente.js` al final), que solo actúan dentro de la app. En el navegador, la suite sigue funcionando igual.

## Una app por programa, y la Suite completa

Del mismo código salen 7 apps portables, para Windows y Linux:

| App | Ejecutable | Qué es |
|---|---|---|
| **Suite CNC** | `SuiteCNC.exe` | La portada y todas las herramientas, la biblioteca de inicio, los apuntes y los manuales. Con F12. |
| **Calcador de contornos** | `Calcador.exe` | Lleva dentro el Generador y el Simulador («Abrir en…»), su manual y la biblioteca de inicio. |
| **Corrector** | `Corrector.exe` | Lleva dentro el Calcador, el Generador y el Simulador. |
| **Anidador de tableros** | `Anidador.exe` | Lleva dentro el Calcador (para devolverle el tablero). |
| **Simulador 3D** | `Simulador3D.exe` | El simulador y su guía. |
| **Tutor G-Code** | `TutorGCode.exe` | El tutor y su guía. |
| **Calculadora de taller** | `Calculadora.exe` | La calculadora y su manual. |

- Las apps están definidas en `ediciones/ediciones.json`.
- Lo que cada herramienta enlaza o abre se incluye solo.
- Cada app tiene su icono, sacado de la portada, su carpeta `datos/` y su LEEME.
- Pueden convivir todas en el mismo ordenador.

## Qué añade la versión de escritorio

| | |
|---|---|
| **Portable** | Todo se guarda en `datos/`, junto al `.exe` o al `.AppImage`. Se copia la carpeta a un USB y funciona. |
| **Una ventana por herramienta** | Los enlaces de la portada abren cada herramienta en su ventana. Si ya está abierta, se trae al frente. El ⌂ vuelve a la portada. |
| **Herramientas conectadas** | «Abrir en el Simulador», «Abrir en el Generador», «Devolver al Calcador», Anidador → Calcador… funcionan entre ventanas como entre pestañas: `window.open`, `window.opener` y `postMessage` están emulados. Todas comparten la misma memoria (biblioteca, base de herramientas). |
| **Imprimir** | Las hojas de ejercicio, de soluciones e informes se abren en su ventana con el diálogo de imprimir (también «Guardar como PDF»). |
| **Guardar y descargar** | Todas las descargas (JSON, PDF, PNG, DXF, vídeo…) abren el diálogo «Guardar como» del sistema. |
| **Proyectos `.sim3d`** | En el Simulador: G-code + plano + herramienta + material en un archivo. Ctrl+S guarda en el mismo archivo, Ctrl+Mayús+S es «Guardar como» y Ctrl+O abre. |
| **Autoguardado** | Simulador: copia de recuperación cada 20 s y aviso al cerrar con cambios. |
| **Doble clic** | Simulador → 🗂️ Archivo → «Asociar archivos…»: los `.sim3d` abren el Simulador, y los `.nc .gcode .tap .ngc` lo tienen en «Abrir con». Sin permisos de administrador. |
| **Una sola instancia** | Si la app ya está abierta, el archivo nuevo se abre en ella. |
| **PDF y web** | Se abren con el visor y el navegador del sistema. |

## Estructura

```
(raíz del repo Herramientas-CNC)
├── index.html, calcador.html, simulador3d.html…   ← la suite de siempre (no se toca)
├── biblioteca_inicio/
├── .github/workflows/suite-escritorio.yml          ← compila en GitHub
└── app-escritorio/
    ├── puente/
    │   ├── temprano.js          ← ventanas, mensajes entre herramientas, impresión
    │   ├── puente.js            ← abrir/guardar, enlaces, menú Archivo del simulador
    │   └── tauri-imprimir.html  ← muestra las hojas para imprimir
    ├── scripts/
    │   ├── preparar.mjs         ← elige los archivos de cada app (y sus dependencias)
    │   ├── compilar.mjs         ← compila una app
    │   ├── empaquetar.mjs       ← deja en dist/ el ZIP o el AppImage con su LEEME
    │   └── iconos.py            ← iconos de cada app a partir de la portada
    ├── ediciones/ediciones.json ← TODAS las apps: nombre, ejecutable, archivos, icono…
    ├── portable/LEEME_plantilla.txt ← LEEME.txt de cada ZIP
    └── src-tauri/               ← la parte en Rust
        ├── src/main.rs          ← ventanas, mensajes, abrir/guardar, autoguardado
        ├── build.rs             ← lee la edición de ediciones.json al compilar
        ├── src/edicion.rs       ← datos de la edición compilada
        ├── src/portable.rs      ← carpeta datos/, rutas largas, ZIP sin descomprimir
        └── src/asociacion.rs    ← asociar extensiones (Windows y Linux)
```

`preparar.mjs` coge los archivos de la **raíz del repo** (`../`), así que las apps usan siempre la última versión que subas.

## Compilar en GitHub (sin instalar nada)

- **Probar:** Actions → «Suite CNC (escritorio)» → **Run workflow** (rama `main`). Compila las 7 apps × 2 sistemas a la vez, en unos 10–15 min. Los archivos quedan en **Artifacts**.
- **Publicar:** Releases → *Draft a new release* → etiqueta **`suite-v0.3.0`** (en minúscula) → *Publish*. Se adjuntan `Calcador_windows_x64.zip`, `Calcador_linux_x86_64.AppImage`, etc.

Para no publicar alguna app en las Releases públicas (por ejemplo, la Suite del profesorado), pon `"publicar": false` en su entrada de `ediciones.json`. Seguirá en Artifacts.

Para sacar una versión nueva: actualiza los HTML como siempre, sube `"version"` en `src-tauri/tauri.conf.json` y publica una etiqueta nueva.

## Probar en tu ordenador (opcional)

Necesitas [Rust](https://rustup.rs) y [Node.js](https://nodejs.org).

```
cd app-escritorio
npm install
npm run app -- calcador          ← crea src-tauri/target/release/Calcador(.exe)
npm run app -- calcador dev      ← lo abre en modo desarrollo
npm run suite                    ← la Suite completa
```

## Diagnóstico y rutas largas (Windows)

- En cada arranque se escribe `datos/registro.txt`, con las ventanas abiertas, la carga de cada página y los errores de JavaScript.
- El motor web de Windows (WebView2) **deja la página en blanco** si su carpeta de perfil está en una ruta muy larga (límite de 260 caracteres). Si `datos\webview` supera los 120 caracteres, la app guarda ese perfil en la carpeta local del usuario.
- Si se abre **dentro del ZIP**, avisa de que hay que extraerlo.
- Si la página no carga en 25 s, aparece un mensaje con instrucciones.

## Lo que guarda el navegador no pasa a la app

La app tiene su propia memoria, en `datos/`. La biblioteca del Calcador y la base de herramientas que tengas en Chrome o Edge hay que **exportarlas** desde el navegador e **importarlas** en la app la primera vez.

## Formato `.sim3d`

Es JSON:

```json
{
 "formato": "sim3d", "version": 1,
 "nombrePrograma": "pieza.nc",
 "gcode": "G71 G90\nT101 M06\n…",
 "borradorEditor": null,
 "ajustes": { "tipoFresa": "plana", "diamHerramienta": "6", "matModo": "auto", … },
 "plano": { "nombre": "Inicio 101.json", "datos": { …el JSON del Calcador… } },
 "guardado": "2026-10-18T09:31:07.019Z"
}
```

## Pruebas automáticas (solo para desarrollo)

Las compilaciones de **depuración** (`cargo build`, sin `--release`) aceptan la variable `SUITE_PRUEBA_JS=archivo.js`, que inyecta ese script en todas las ventanas. Con ella se ha comprobado, sin usar las copias de `localStorage` (solo mensajes entre ventanas):

1. Portada → Calcador.
2. Calcador → «Abrir en el Simulador»: llegan el plano y el programa.
3. Calcador → Generador → «Devolver»: el Calcador lo recibe.
4. Hoja de soluciones → ventana de impresión.

Las versiones publicadas (`--release`) no incluyen esta opción.

## Siguientes pasos posibles

- **Separar el repo:** uno privado con todo y otro público para el alumnado.
- **Calcador de práctica** para el alumnado.
- **Flatpak** para Linux.
- **Instaladores** `.msi` / `.exe`.
- **Firma** del ejecutable (SignPath para la edición pública).

Licencia: EUPL-1.2, como la suite.
