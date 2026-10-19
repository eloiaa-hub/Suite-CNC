// La edición se elige al compilar con SUITE_EDICION (profesorado, calcador, simulador…).
// Sus datos se leen de ../ediciones/ediciones.json y pasan al programa como
// variables de compilación (ver src/edicion.rs).
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-env-changed=SUITE_EDICION");
    let manifiesto = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let ruta = manifiesto.join("../ediciones/ediciones.json");
    println!("cargo:rerun-if-changed={}", ruta.display());

    let config: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&ruta).expect("falta ediciones/ediciones.json"))
            .expect("ediciones.json no es un JSON válido");
    let nombre = std::env::var("SUITE_EDICION")
        .ok()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| config["porDefecto"].as_str().unwrap_or("simulador").to_string());
    let ed = &config["ediciones"][&nombre];
    if ed.is_null() {
        panic!("Edición desconocida «{nombre}» (mira ediciones/ediciones.json)");
    }
    let texto = |k: &str| ed[k].as_str().unwrap_or_default().to_string();
    println!("cargo:rustc-env=SUITE_EDICION_ID={nombre}");
    println!("cargo:rustc-env=SUITE_NOMBRE={}", texto("nombre"));
    println!("cargo:rustc-env=SUITE_TITULO={}", texto("titulo"));
    println!("cargo:rustc-env=SUITE_INICIO={}", texto("inicio"));
    println!("cargo:rustc-env=SUITE_ID={}", texto("id"));
    // Para el registro de Windows: «SuiteCNC.Calcador», «SuiteCNC.SuiteCNC»…
    println!("cargo:rustc-env=SUITE_PROGID=SuiteCNC.{}", texto("exe"));
    // Icono de la edición (para los archivos asociados en Linux); si no hay, el de por defecto
    let icono = manifiesto.join(format!("icons/{nombre}/128x128.png"));
    let icono = if icono.exists() { icono } else { manifiesto.join("icons/128x128.png") };
    println!("cargo:rerun-if-changed={}", icono.display());
    println!("cargo:rustc-env=SUITE_ICONO_128={}", icono.display());

    tauri_build::build()
}
