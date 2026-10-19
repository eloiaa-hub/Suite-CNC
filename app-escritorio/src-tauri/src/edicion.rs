//! Edición de la app (Suite, Calcador, Simulador…). Se elige al compilar con
//! SUITE_EDICION; los datos vienen de ediciones/ediciones.json (ver build.rs).

pub struct Edicion {
    /// Clave en ediciones.json (profesorado, calcador…)
    #[allow(dead_code)]
    pub clave: &'static str,
    /// Nombre que ve el usuario
    pub nombre: &'static str,
    /// Página que se abre al arrancar
    pub inicio: &'static str,
    /// Título de la ventana principal
    pub titulo: &'static str,
    /// Identificador de la app
    pub id: &'static str,
    /// Prefijo de los tipos de archivo en el registro de Windows
    #[cfg_attr(not(windows), allow(dead_code))]
    pub progid: &'static str,
}

pub const EDICION: Edicion = Edicion {
    clave: env!("SUITE_EDICION_ID"),
    nombre: env!("SUITE_NOMBRE"),
    inicio: env!("SUITE_INICIO"),
    titulo: env!("SUITE_TITULO"),
    id: env!("SUITE_ID"),
    progid: env!("SUITE_PROGID"),
};

/// Página del simulador: los .sim3d y .nc se abren siempre en ella (si la app la lleva).
pub const PAGINA_SIMULADOR: &str = "simulador3d.html";

/// ¿Esta edición tiene la portada con todas las herramientas?
pub fn con_portada() -> bool {
    EDICION.inicio == "index.html"
}
