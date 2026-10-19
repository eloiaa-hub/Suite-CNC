//! Modo portable: los datos de la app (ajustes, almacenamiento de la página,
//! autoguardados) se guardan en la carpeta `datos/` junto al ejecutable,
//! para poder llevar la app en un USB o copiar la carpeta a otro ordenador.
//!
//! Si esa carpeta no se puede escribir (app instalada en Archivos de programa,
//! Flatpak, USB protegido…) se usa la carpeta de datos normal del usuario.

use std::fs;
use std::path::{Path, PathBuf};

/// Carpeta donde está "la app" desde el punto de vista del usuario:
/// - AppImage: la carpeta del archivo .AppImage (el ejecutable real está
///   dentro de una imagen montada de solo lectura).
/// - Resto: la carpeta del ejecutable.
pub fn carpeta_app() -> Option<PathBuf> {
    if let Some(appimage) = std::env::var_os("APPIMAGE") {
        return PathBuf::from(appimage).parent().map(Path::to_path_buf);
    }
    std::env::current_exe().ok()?.parent().map(Path::to_path_buf)
}

/// Ruta que debe abrir el sistema para lanzar esta app (para las asociaciones).
pub fn ejecutable_visible() -> Option<PathBuf> {
    if let Some(appimage) = std::env::var_os("APPIMAGE") {
        return Some(PathBuf::from(appimage));
    }
    std::env::current_exe().ok()
}

pub fn es_flatpak() -> bool {
    std::env::var_os("FLATPAK_ID").is_some()
}

fn se_puede_escribir(dir: &Path) -> bool {
    if fs::create_dir_all(dir).is_err() {
        return false;
    }
    let prueba = dir.join(".prueba_escritura");
    let ok = fs::write(&prueba, b"ok").is_ok();
    let _ = fs::remove_file(&prueba);
    ok
}

/// Devuelve (carpeta de datos, ¿es portable?).
pub fn carpeta_datos(alternativa: impl FnOnce() -> Option<PathBuf>) -> (PathBuf, bool) {
    if !es_flatpak() {
        if let Some(base) = carpeta_app() {
            let datos = base.join("datos");
            if se_puede_escribir(&datos) {
                return (datos, true);
            }
        }
    }
    let datos = alternativa()
        .unwrap_or_else(|| std::env::temp_dir().join("simulador3d-suitecnc"));
    let _ = fs::create_dir_all(&datos);
    (datos, false)
}

/// Windows: si junto al ejecutable hay una carpeta `webview2/` con el
/// "WebView2 Fixed Version Runtime", se usa esa en lugar de la del sistema.
/// Así la carpeta portable funciona incluso en equipos sin WebView2.
pub fn usar_webview2_incluido() {
    #[cfg(windows)]
    if let Some(base) = carpeta_app() {
        let dir = base.join("webview2");
        if dir.join("msedgewebview2.exe").is_file() {
            std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", &dir);
        }
    }
}

/// Escritura segura: primero a un archivo temporal y luego se renombra.
/// Si se corta la luz o se saca el USB a mitad, el archivo original no se pierde.
pub fn escribir_atomico(ruta: &Path, datos: &[u8]) -> Result<(), String> {
    if let Some(dir) = ruta.parent() {
        if !dir.as_os_str().is_empty() {
            fs::create_dir_all(dir).map_err(|e| format!("No se pudo crear la carpeta: {e}"))?;
        }
    }
    let mut tmp = ruta.as_os_str().to_owned();
    tmp.push(".guardando~");
    let tmp = PathBuf::from(tmp);
    fs::write(&tmp, datos).map_err(|e| format!("No se pudo escribir «{}»: {e}", ruta.display()))?;
    if let Err(e) = fs::rename(&tmp, ruta) {
        // Algunos sistemas de archivos (o antivirus) no dejan renombrar encima:
        // se escribe directamente.
        let _ = fs::remove_file(&tmp);
        fs::write(ruta, datos).map_err(|e2| format!("No se pudo guardar «{}»: {e2} ({e})", ruta.display()))?;
    }
    Ok(())
}

/// Longitud máxima de la carpeta del perfil del motor web en Windows.
/// WebView2 (Chromium) crea archivos muy anidados dentro de su perfil
/// (…\EBWebView\Default\Local Storage\leveldb\…). Con rutas largas se supera el
/// límite de 260 caracteres de Windows y la página queda EN BLANCO sin avisar.
pub const MAX_RUTA_WEBVIEW: usize = 120;

/// Carpeta del perfil del motor web (localStorage, caché…) y, si no se pudo
/// usar la de `datos/`, el motivo.
pub fn carpeta_webview(datos: &Path, local: Option<PathBuf>) -> (PathBuf, Option<String>) {
    let w = datos.join("webview");
    let largo = w.to_string_lossy().chars().count();
    if cfg!(windows) && largo > MAX_RUTA_WEBVIEW {
        let corta = local.unwrap_or_else(std::env::temp_dir).join("webview");
        let _ = fs::create_dir_all(&corta);
        let motivo = format!(
            "la carpeta de la app tiene una ruta muy larga ({largo} caracteres): \
             la memoria del motor web se guarda en {}",
            corta.display()
        );
        return (corta, Some(motivo));
    }
    (w, None)
}

/// ¿Se está ejecutando desde la carpeta temporal? Es lo que pasa en Windows al
/// abrir el .exe con doble clic DENTRO del ZIP sin descomprimirlo: al cerrar,
/// Windows borra esa carpeta y con ella los datos y autoguardados.
pub fn en_carpeta_temporal() -> bool {
    if !cfg!(windows) {
        return false;
    }
    let (Ok(exe), tmp) = (std::env::current_exe(), std::env::temp_dir()) else { return false };
    let a = exe.to_string_lossy().to_lowercase();
    let b = tmp.to_string_lossy().to_lowercase();
    !b.is_empty() && a.starts_with(b.trim_end_matches('\\'))
}
