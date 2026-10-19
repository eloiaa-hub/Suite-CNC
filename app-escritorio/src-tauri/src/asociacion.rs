//! Asociación de extensiones para la versión portable.
//!
//! Un instalador registra las extensiones al instalar, pero una app portable
//! no se instala. Por eso la app lo hace cuando el usuario lo pide
//! (menú Archivo → «Asociar archivos…»), solo para el usuario actual y sin
//! permisos de administrador. «Quitar asociación» lo deshace.
//!
//! - `.sim3d`: se abre con esta app al hacer doble clic.
//! - `.nc .gcode .tap .ngc`: solo se añade la app a «Abrir con…», sin quitar
//!   esas extensiones a otros programas.

use crate::edicion::EDICION;
use std::path::Path;

pub const EXT_PROYECTO: &str = "sim3d";
pub const EXT_GCODE: &[&str] = &["nc", "gcode", "tap", "ngc"];

// ─────────────────────────────── Windows ───────────────────────────────
#[cfg(windows)]
mod sistema {
    use super::*;
    use winreg::enums::{HKEY_CURRENT_USER, KEY_ALL_ACCESS, KEY_READ};
    use winreg::RegKey;

    fn progid_proyecto() -> String {
        format!("{}.Proyecto", EDICION.progid)
    }
    fn progid_gcode() -> String {
        format!("{}.GCode", EDICION.progid)
    }

    fn clases() -> Result<RegKey, String> {
        RegKey::predef(HKEY_CURRENT_USER)
            .create_subkey(r"Software\Classes")
            .map(|(k, _)| k)
            .map_err(|e| format!("No se pudo abrir el registro: {e}"))
    }

    fn comando(exe: &Path) -> String {
        format!("\"{}\" \"%1\"", exe.display())
    }

    fn crear_progid(c: &RegKey, progid: &str, descripcion: &str, exe: &Path) -> std::io::Result<()> {
        let (k, _) = c.create_subkey(progid)?;
        k.set_value("", &descripcion)?;
        k.create_subkey("DefaultIcon")?.0.set_value("", &format!("\"{}\",0", exe.display()))?;
        k.create_subkey(r"shell\open\command")?.0.set_value("", &comando(exe))?;
        Ok(())
    }

    pub fn asociar(exe: &Path) -> Result<String, String> {
        let c = clases()?;
        let r: std::io::Result<()> = (|| {
            let (pp, pg) = (progid_proyecto(), progid_gcode());
            crear_progid(&c, &pp, "Proyecto del Simulador 3D (Suite CNC)", exe)?;
            crear_progid(&c, &pg, "Programa G-code", exe)?;
            let (e, _) = c.create_subkey(format!(".{EXT_PROYECTO}"))?;
            e.set_value("", &pp)?;
            e.set_value("Content Type", &"application/x-sim3d")?;
            e.create_subkey("OpenWithProgids")?.0.set_value(&pp, &"")?;
            for ext in EXT_GCODE {
                c.create_subkey(format!(r".{ext}\OpenWithProgids"))?.0.set_value(&pg, &"")?;
            }
            Ok(())
        })();
        r.map_err(|e| format!("No se pudo escribir en el registro: {e}"))?;
        notificar();
        Ok(format!(
            "Listo: los archivos .sim3d se abrirán con {} al hacer doble clic, \
             y los .nc, .gcode, .tap y .ngc la tendrán en «Abrir con…».\n\n\
             Si mueves la carpeta de la app a otro sitio, vuelve a asociar los archivos.",
            EDICION.nombre
        ))
    }

    pub fn quitar() -> Result<String, String> {
        let c = clases()?;
        let (pp, pg) = (progid_proyecto(), progid_gcode());
        let _ = c.delete_subkey_all(&pp);
        let _ = c.delete_subkey_all(&pg);
        if let Ok(e) = c.open_subkey_with_flags(format!(".{EXT_PROYECTO}"), KEY_ALL_ACCESS) {
            let actual: String = e.get_value("").unwrap_or_default();
            drop(e);
            if actual == pp {
                let _ = c.delete_subkey_all(format!(".{EXT_PROYECTO}"));
            }
        }
        for ext in EXT_GCODE {
            if let Ok(k) = c.open_subkey_with_flags(format!(r".{ext}\OpenWithProgids"), KEY_ALL_ACCESS) {
                let _ = k.delete_value(&pg);
            }
        }
        notificar();
        Ok("Asociación quitada: Windows ya no abrirá los archivos con esta app.".into())
    }

    pub fn estado(exe: &Path) -> bool {
        clases()
            .and_then(|c| {
                c.open_subkey_with_flags(format!(r"{}\shell\open\command", progid_proyecto()), KEY_READ)
                    .map_err(|e| e.to_string())
            })
            .and_then(|k| k.get_value::<String, _>("").map_err(|e| e.to_string()))
            .map(|v| v == comando(exe))
            .unwrap_or(false)
    }

    /// Avisa al Explorador para que actualice iconos y asociaciones al momento.
    fn notificar() {
        use windows_sys::Win32::UI::Shell::{SHChangeNotify, SHCNE_ASSOCCHANGED, SHCNF_IDLIST};
        unsafe { SHChangeNotify(SHCNE_ASSOCCHANGED as i32, SHCNF_IDLIST, std::ptr::null(), std::ptr::null()) };
    }
}

// ─────────────────────────────── Linux ───────────────────────────────
#[cfg(target_os = "linux")]
mod sistema {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::process::Command;

    const ID: &str = EDICION.id;
    const MIME: &str = "application/x-sim3d";
    static ICONO: &[u8] = include_bytes!(env!("SUITE_ICONO_128"));

    fn datos_usuario() -> Result<PathBuf, String> {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .filter(|p| p.is_absolute())
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local/share")))
            .ok_or_else(|| "No se encontró la carpeta del usuario".to_string())
    }

    fn rutas() -> Result<(PathBuf, PathBuf, PathBuf, PathBuf), String> {
        let d = datos_usuario()?;
        Ok((
            d.join(format!("applications/{ID}.desktop")),
            d.join(format!("mime/packages/{ID}.xml")),
            d.join(format!("icons/hicolor/128x128/apps/{ID}.png")),
            d.join("icons/hicolor/128x128/mimetypes/application-x-sim3d.png"),
        ))
    }

    /// Comillas según la especificación de los archivos .desktop
    fn comillas(p: &Path) -> String {
        let s = p.to_string_lossy();
        let mut out = String::from("\"");
        for ch in s.chars() {
            if matches!(ch, '"' | '`' | '$' | '\\') {
                out.push('\\');
            }
            out.push(ch);
        }
        out.push('"');
        out.replace('%', "%%")
    }

    fn escribir(ruta: &Path, datos: &[u8]) -> Result<(), String> {
        if let Some(d) = ruta.parent() {
            fs::create_dir_all(d).map_err(|e| e.to_string())?;
        }
        fs::write(ruta, datos).map_err(|e| format!("No se pudo escribir {}: {e}", ruta.display()))
    }

    fn refrescar() {
        if let Ok(d) = datos_usuario() {
            let _ = Command::new("update-mime-database").arg(d.join("mime")).status();
            let _ = Command::new("update-desktop-database").arg(d.join("applications")).status();
            let _ = Command::new("gtk-update-icon-cache").args(["-f", "-t"]).arg(d.join("icons/hicolor")).status();
        }
    }

    pub fn asociar(exe: &Path) -> Result<String, String> {
        if crate::portable::es_flatpak() {
            return Err("En la versión Flatpak las asociaciones ya vienen incluidas en el paquete.".into());
        }
        let (desktop, mime, icono, icono_mime) = rutas()?;
        let globs: String = EXT_GCODE.iter().map(|e| format!("    <glob pattern=\"*.{e}\"/>\n")).collect();
        let xml = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="{MIME}">
    <comment>Proyecto del Simulador 3D (Suite CNC)</comment>
    <sub-class-of type="application/json"/>
    <glob pattern="*.{EXT_PROYECTO}"/>
  </mime-type>
  <mime-type type="text/x-gcode">
    <comment>Programa G-code</comment>
    <sub-class-of type="text/plain"/>
{globs}  </mime-type>
</mime-info>
"#
        );
        let entrada = format!(
            "[Desktop Entry]\nType=Application\nName={}\n\
             Comment=Herramientas CNC: simulador de programas G-code en 3D\nExec={} %f\nIcon={ID}\nTerminal=false\n\
             Categories=Education;Engineering;\nMimeType={MIME};text/x-gcode;\n",
            EDICION.nombre,
            comillas(exe)
        );
        escribir(&mime, xml.as_bytes())?;
        escribir(&desktop, entrada.as_bytes())?;
        escribir(&icono, ICONO)?;
        escribir(&icono_mime, ICONO)?;
        refrescar();
        let _ = Command::new("xdg-mime").args(["default", &format!("{ID}.desktop"), MIME]).status();
        Ok(format!(
            "Listo: los archivos .sim3d se abrirán con {} al hacer doble clic, \
             y los de G-code la tendrán en «Abrir con».\n\n\
             Si mueves la app a otra carpeta, vuelve a asociar los archivos.",
            EDICION.nombre
        ))
    }

    pub fn quitar() -> Result<String, String> {
        let (desktop, mime, icono, icono_mime) = rutas()?;
        for r in [&desktop, &mime, &icono, &icono_mime] {
            let _ = fs::remove_file(r);
        }
        refrescar();
        Ok("Asociación quitada.".into())
    }

    pub fn estado(exe: &Path) -> bool {
        rutas()
            .ok()
            .and_then(|(desktop, ..)| fs::read_to_string(desktop).ok())
            .map(|t| t.contains(&comillas(exe)))
            .unwrap_or(false)
    }
}

// ─────────────────────────────── Otros (macOS) ───────────────────────────────
#[cfg(not(any(windows, target_os = "linux")))]
mod sistema {
    use super::*;
    pub fn asociar(_: &Path) -> Result<String, String> {
        Err("En este sistema las asociaciones las gestiona el propio sistema operativo.".into())
    }
    pub fn quitar() -> Result<String, String> {
        asociar(Path::new(""))
    }
    pub fn estado(_: &Path) -> bool {
        false
    }
}

pub use sistema::{asociar, estado, quitar};
