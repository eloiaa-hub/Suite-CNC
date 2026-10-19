// Suite CNC — versión de escritorio (Eloi A.A.)
//
// La interfaz son los mismos HTML de la suite. Este programa en Rust pone las
// ventanas nativas y lo que el navegador no puede hacer: abrir y guardar en el
// disco, modo portable, autoguardado, asociar archivos y comunicar las
// herramientas entre sí (lo que en el navegador hacían las pestañas).
//
// Hay dos ediciones (ver edicion.rs): «Suite CNC» (profesorado, con la portada
// y todas las herramientas) y «Simulador 3D» (solo el simulador).

// En Windows, que no se abra una consola negra junto a la ventana
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod asociacion;
mod edicion;
mod portable;

use edicion::{con_portada, EDICION, PAGINA_SIMULADOR};
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

const VENTANA_PRINCIPAL: &str = "principal";
const MAX_ARCHIVO: u64 = 60 * 1024 * 1024;
const ARCHIVO_RECUPERACION: &str = "recuperacion.sim3d";

// ─────────────────────────── Registro de diagnóstico ───────────────────────────

/// datos/registro.txt (se reinicia en cada arranque)
static REGISTRO: Mutex<Option<PathBuf>> = Mutex::new(None);

fn registrar_linea(texto: &str) {
    use std::io::Write;
    let ruta = REGISTRO.lock().unwrap().clone();
    if let Some(r) = ruta {
        if let Ok(mut f) = fs::OpenOptions::new().create(true).append(true).open(r) {
            let t = std::time::SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
            let _ = writeln!(f, "[{}.{:03}] {}", (t / 1000) % 100_000, t % 1000, texto);
        }
    }
}

/// Las páginas avisan con registrar("load…") cuando terminan de cargar.
static PAGINA_CARGADA: AtomicBool = AtomicBool::new(false);
const SEGUNDOS_ESPERA_PAGINA: u64 = 25;

// ─────────────────────────── Estado de la app ───────────────────────────

struct Estado {
    datos: PathBuf,
    webview: PathBuf,
    avisos: Vec<String>,
    portable: bool,
    contador: AtomicUsize,
    /// etiqueta de ventana → página que muestra
    paginas: Mutex<HashMap<String, String>>,
    /// etiqueta de ventana → archivo que debe abrir al cargar
    pendientes: Mutex<HashMap<String, String>>,
    /// hojas para imprimir que esperan a que se abra su ventana
    impresiones: Mutex<HashMap<String, String>>,
}

impl Estado {
    fn carpeta_autoguardado(&self) -> PathBuf {
        self.datos.join("autoguardado")
    }
    fn nueva_etiqueta(&self, prefijo: &str) -> String {
        format!("{prefijo}{}", self.contador.fetch_add(1, Ordering::Relaxed))
    }
    /// Ventana abierta que muestra esa página (sin contar #… ni ?…)
    fn ventana_con_pagina(&self, pagina: &str) -> Option<String> {
        let base = sin_ancla(pagina);
        let p = self.paginas.lock().unwrap();
        let mut v: Vec<_> = p.iter().filter(|(_, pg)| sin_ancla(pg) == base).map(|(l, _)| l.clone()).collect();
        v.sort(); // la más antigua primero (la principal se llama «principal»)
        v.into_iter().next()
    }
}

fn sin_ancla(p: &str) -> &str {
    p.split(['#', '?']).next().unwrap_or(p)
}

/// Primer argumento que sea un archivo existente (lo que pasa el sistema al
/// hacer doble clic en un archivo asociado o al arrastrarlo sobre el .exe).
fn ruta_de_args(args: &[String], cwd: Option<&Path>) -> Option<String> {
    args.iter()
        .skip(1)
        .filter(|a| !a.starts_with('-'))
        .map(PathBuf::from)
        .map(|p| match (p.is_relative(), cwd) {
            (true, Some(c)) => c.join(p),
            _ => p,
        })
        .find(|p| p.is_file())
        .map(|p| p.to_string_lossy().into_owned())
}

fn texto_cabecera(req: &Request<'_>, nombre: &str) -> Result<String, String> {
    let v = req
        .headers()
        .get(nombre)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| format!("Falta la cabecera {nombre}"))?;
    Ok(descodificar_url(v))
}

/// Las rutas viajan en una cabecera HTTP codificadas con encodeURIComponent
/// (para que las tildes y la ñ lleguen bien).
fn descodificar_url(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(n) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(n);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn cuerpo_binario<'a>(req: &'a Request<'_>) -> Result<&'a [u8], String> {
    match req.body() {
        InvokeBody::Raw(d) => Ok(d),
        _ => Err("Se esperaban datos binarios".into()),
    }
}

fn pagina_valida(pagina: &str) -> Result<(), String> {
    if pagina.contains("://") || pagina.starts_with('/') || pagina.starts_with('\\') || pagina.contains("..") {
        return Err("Página no válida".into());
    }
    Ok(())
}

// ─────────────────────────── Ventanas ───────────────────────────

fn crear_ventana(
    app: &AppHandle,
    etiqueta: &str,
    pagina: &str,
    titulo: &str,
    opener: Option<&str>,
) -> tauri::Result<WebviewWindow> {
    let estado = app.state::<Estado>();
    // Lo que la página necesita saber ANTES de que se ejecuten sus scripts
    // (temprano.js lo usa para window.opener y los mensajes entre ventanas).
    let info = serde_json::json!({
        "label": etiqueta, "opener": opener, "edicion": EDICION.nombre, "portada": con_portada()
    });
    let b = WebviewWindowBuilder::new(app, etiqueta, WebviewUrl::App(pagina.into()))
        .title(titulo)
        .inner_size(1360.0, 860.0)
        .min_inner_size(720.0, 500.0)
        .center()
        .initialization_script(format!("window.__suiteVentana = {info};"))
        .on_page_load(|w, p| {
            registrar_linea(&format!("ventana «{}»: {:?} {}", w.label(), p.event(), p.url()));
        });
    // Pruebas automáticas: SOLO en compilaciones de depuración (nunca en las publicadas)
    #[cfg(debug_assertions)]
    let b = match std::env::var("SUITE_PRUEBA_JS").ok().and_then(|p| fs::read_to_string(p).ok()) {
        Some(js) => b.initialization_script(js),
        None => b,
    };
    // Solo el simulador recibe los archivos arrastrados con su ruta (para Ctrl+S).
    // El resto de herramientas los recibe como en el navegador.
    let b = if sin_ancla(pagina) == PAGINA_SIMULADOR { b } else { b.disable_drag_drop_handler() };
    // Toda la memoria de las páginas (localStorage) va a la carpeta de datos:
    // en modo portable viaja con la app. La comparten todas las ventanas.
    #[cfg(any(windows, target_os = "linux"))]
    let b = b.data_directory(estado.webview.clone());
    let r = b.build();
    match &r {
        Ok(_) => {
            estado.paginas.lock().unwrap().insert(etiqueta.to_string(), pagina.to_string());
            registrar_linea(&format!("ventana «{etiqueta}» creada ({pagina}, opener={opener:?})"));
        }
        Err(e) => registrar_linea(&format!("ERROR al crear la ventana «{etiqueta}»: {e}")),
    }
    r
}

fn enfocar(app: &AppHandle, etiqueta: &str) -> bool {
    match app.get_webview_window(etiqueta) {
        Some(w) => {
            let _ = w.unminimize();
            let _ = w.show();
            let _ = w.set_focus();
            true
        }
        None => false,
    }
}

/// ¿La app lleva dentro esa página?
fn tiene_pagina(app: &AppHandle, pagina: &str) -> bool {
    app.asset_resolver().get(pagina.to_string()).is_some()
}

/// Abre un archivo (.sim3d, .nc…) en el simulador: en su ventana si ya está
/// abierta, o en una nueva. Si la app no lleva el simulador, abre la principal.
fn abrir_en_simulador(app: &AppHandle, ruta: String) {
    if !tiene_pagina(app, PAGINA_SIMULADOR) {
        registrar_linea(&format!("«{ruta}»: esta app no lleva el simulador"));
        mostrar_principal(app);
        return;
    }
    let estado = app.state::<Estado>();
    if let Some(l) = estado.ventana_con_pagina(PAGINA_SIMULADOR) {
        registrar_linea(&format!("abrir «{ruta}» en la ventana «{l}»"));
        let _ = app.emit_to(l.as_str(), "abrir-archivo", ruta);
        enfocar(app, &l);
        return;
    }
    let l = estado.nueva_etiqueta("simulador");
    estado.pendientes.lock().unwrap().insert(l.clone(), ruta);
    let _ = crear_ventana(app, &l, PAGINA_SIMULADOR, "Simulador G-Code 3D", None);
}

/// La ventana principal (portada o simulador): la enfoca o la vuelve a abrir.
fn mostrar_principal(app: &AppHandle) {
    if !enfocar(app, VENTANA_PRINCIPAL) {
        let _ = crear_ventana(app, VENTANA_PRINCIPAL, EDICION.inicio, EDICION.titulo, None);
    }
}

// ─────────────────────────── Comandos para las páginas ───────────────────────────

#[tauri::command]
fn registrar(window: WebviewWindow, texto: String) {
    if texto.starts_with("load") {
        PAGINA_CARGADA.store(true, Ordering::Relaxed);
    }
    let t: String = texto.chars().take(2000).collect();
    registrar_linea(&format!("«{}»: {t}", window.label()));
}

/// Archivo que esta ventana debe abrir al cargar (doble clic, arrastrar al .exe…)
#[tauri::command]
fn archivo_inicial(window: WebviewWindow, estado: State<Estado>) -> Option<String> {
    estado.pendientes.lock().unwrap().remove(window.label())
}

#[tauri::command]
fn leer_archivo(ruta: String) -> Result<Response, String> {
    let meta = fs::metadata(&ruta).map_err(|e| format!("No se encuentra el archivo: {e}"))?;
    if meta.len() > MAX_ARCHIVO {
        return Err(format!("Archivo demasiado grande ({} MB)", meta.len() / 1_048_576));
    }
    fs::read(&ruta).map(Response::new).map_err(|e| format!("No se pudo leer: {e}"))
}

#[tauri::command]
fn escribir_texto(ruta: String, contenido: String) -> Result<(), String> {
    portable::escribir_atomico(Path::new(&ruta), contenido.as_bytes())
}

#[tauri::command]
fn escribir_binario(request: Request<'_>) -> Result<(), String> {
    let ruta = texto_cabecera(&request, "x-ruta")?;
    portable::escribir_atomico(Path::new(&ruta), cuerpo_binario(&request)?)
}

#[tauri::command]
fn autoguardar(estado: State<Estado>, contenido: String) -> Result<(), String> {
    let r = estado.carpeta_autoguardado().join(ARCHIVO_RECUPERACION);
    portable::escribir_atomico(&r, contenido.as_bytes())
}

#[derive(Serialize)]
struct Recuperacion {
    contenido: String,
    /// milisegundos desde 1970 (para `new Date(fecha)` en JavaScript)
    fecha: u64,
}

#[tauri::command]
fn leer_autoguardado(estado: State<Estado>) -> Option<Recuperacion> {
    let r = estado.carpeta_autoguardado().join(ARCHIVO_RECUPERACION);
    let contenido = fs::read_to_string(&r).ok()?;
    let fecha = fs::metadata(&r)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    Some(Recuperacion { contenido, fecha })
}

#[tauri::command]
fn borrar_autoguardado(estado: State<Estado>) {
    let _ = fs::remove_file(estado.carpeta_autoguardado().join(ARCHIVO_RECUPERACION));
}

#[derive(Serialize)]
struct InfoApp {
    nombre: &'static str,
    version: String,
    portable: bool,
    datos: String,
    webview: String,
    avisos: Vec<String>,
    ejecutable: String,
    sistema: &'static str,
    asociado: bool,
}

#[tauri::command]
fn info_app(app: AppHandle, estado: State<Estado>) -> InfoApp {
    let exe = portable::ejecutable_visible().unwrap_or_default();
    InfoApp {
        nombre: EDICION.nombre,
        version: app.package_info().version.to_string(),
        portable: estado.portable,
        datos: estado.datos.to_string_lossy().into_owned(),
        webview: estado.webview.to_string_lossy().into_owned(),
        avisos: estado.avisos.clone(),
        ejecutable: exe.to_string_lossy().into_owned(),
        sistema: std::env::consts::OS,
        asociado: asociacion::estado(&exe),
    }
}

#[tauri::command]
fn asociar_extensiones() -> Result<String, String> {
    let exe = portable::ejecutable_visible().ok_or("No se encontró el ejecutable")?;
    asociacion::asociar(&exe)
}

#[tauri::command]
fn quitar_asociacion() -> Result<String, String> {
    asociacion::quitar()
}

#[tauri::command]
fn abrir_carpeta_datos(app: AppHandle, estado: State<Estado>) -> Result<(), String> {
    app.opener()
        .open_path(estado.datos.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn abrir_url(app: AppHandle, url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://") || url.starts_with("mailto:")) {
        return Err("Enlace no permitido".into());
    }
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}

/// Documentos incluidos en la app que no son páginas (PDF, licencias…):
/// la página los envía, se copian a datos/documentos y se abren con el
/// programa del sistema (visor de PDF, bloc de notas…).
#[tauri::command]
fn abrir_documento(app: AppHandle, estado: State<Estado>, request: Request<'_>) -> Result<(), String> {
    let nombre = texto_cabecera(&request, "x-nombre")?;
    let nombre: String = Path::new(&nombre)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .ok_or("Nombre no válido")?;
    let nombre = if Path::new(&nombre).extension().is_none() { format!("{nombre}.txt") } else { nombre };
    let destino = estado.datos.join("documentos").join(nombre);
    portable::escribir_atomico(&destino, cuerpo_binario(&request)?)?;
    app.opener()
        .open_path(destino.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}

/// Abre una página de la app en su ventana.
/// - `reutilizar`: si esa página ya está abierta, se trae al frente (enlaces de
///   la portada). Si además lleva #… o ?…, se le pide que se recargue con ella.
/// - `etiqueta`: la elige la página cuando hace window.open (para poder
///   enviarle mensajes enseguida). La ventana que la abre queda como su opener.
/// Es `async` porque en Windows crear ventanas desde un comando síncrono se bloquea.
#[tauri::command]
async fn abrir_ventana(
    app: AppHandle,
    window: WebviewWindow,
    estado: State<'_, Estado>,
    pagina: String,
    titulo: Option<String>,
    etiqueta: Option<String>,
    reutilizar: Option<bool>,
) -> Result<String, String> {
    pagina_valida(&pagina)?;
    if reutilizar.unwrap_or(false) {
        if let Some(l) = estado.ventana_con_pagina(&pagina) {
            if pagina.contains('#') || pagina.contains('?') {
                let _ = app.emit_to(l.as_str(), "suite-navegar", pagina.clone());
            }
            enfocar(&app, &l);
            return Ok(l);
        }
    }
    let l = etiqueta
        .filter(|e| !e.is_empty() && e.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'))
        .unwrap_or_else(|| estado.nueva_etiqueta("v"));
    let titulo = titulo.filter(|t| !t.trim().is_empty()).unwrap_or_else(|| EDICION.titulo.into());
    crear_ventana(&app, &l, &pagina, &titulo, Some(window.label()))
        .map(|_| l)
        .map_err(|e| e.to_string())
}

/// postMessage entre ventanas (lo que hacían window.opener y e.source en el navegador)
#[tauri::command]
fn enviar_mensaje(app: AppHandle, window: WebviewWindow, destino: String, datos: serde_json::Value) -> Result<(), String> {
    if app.get_webview_window(&destino).is_none() {
        return Err("cerrada".into());
    }
    app.emit_to(
        destino.as_str(),
        "suite-mensaje",
        serde_json::json!({ "origen": window.label(), "destino": destino, "datos": datos }),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn enfocar_ventana(app: AppHandle, etiqueta: String) -> bool {
    enfocar(&app, &etiqueta)
}

#[tauri::command]
fn cerrar_ventana(app: AppHandle, etiqueta: String) {
    if let Some(w) = app.get_webview_window(&etiqueta) {
        let _ = w.close();
    }
}

#[tauri::command]
fn ventanas_abiertas(estado: State<Estado>) -> Vec<String> {
    estado.paginas.lock().unwrap().keys().cloned().collect()
}

/// Hojas para imprimir: la página escribe el HTML (window.open('') + document.write)
/// y se abre en una ventana propia que lo muestra y lanza la impresión.
#[tauri::command]
fn guardar_impresion(estado: State<Estado>, html: String) -> String {
    let id = estado.nueva_etiqueta("imp");
    estado.impresiones.lock().unwrap().insert(id.clone(), html);
    id
}

#[tauri::command]
fn obtener_impresion(estado: State<Estado>, id: String) -> Option<String> {
    estado.impresiones.lock().unwrap().remove(&id)
}

/// `async`: crear ventanas desde un comando síncrono bloquea la app (sobre todo en Windows)
#[tauri::command]
async fn mostrar_portada(app: AppHandle) {
    mostrar_principal(&app);
}

// ─────────────────────────── Pruebas ───────────────────────────

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn rutas_con_tildes_y_espacios() {
        // Lo que produce encodeURIComponent("C:\\Clase 1º\\pieza_ñ.nc") en JavaScript
        let codificada = "C%3A%5CClase%201%C2%BA%5Cpieza_%C3%B1.nc";
        assert_eq!(descodificar_url(codificada), "C:\\Clase 1º\\pieza_ñ.nc");
        assert_eq!(descodificar_url("/home/eloi/Mecanizado%20%C3%81rea/a%25b.nc"), "/home/eloi/Mecanizado Área/a%b.nc");
        assert_eq!(descodificar_url("sin%2"), "sin%2"); // secuencia cortada: se deja tal cual
    }

    #[test]
    fn archivo_de_los_argumentos() {
        let dir = std::env::temp_dir().join("prueba_args_sim3d");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("pieza ñ.sim3d"), "{}").unwrap();
        let args = vec!["Simulador3D.exe".into(), "--algo".into(), "pieza ñ.sim3d".into()];
        let r = ruta_de_args(&args, Some(&dir)).unwrap();
        assert!(r.ends_with("pieza ñ.sim3d"));
        assert_eq!(ruta_de_args(&["exe".into(), "no_existe.nc".into()], Some(&dir)), None);
    }

    #[test]
    fn escritura_segura_sobrescribe() {
        let f = std::env::temp_dir().join("prueba_atomico_sim3d").join("a.sim3d");
        portable::escribir_atomico(&f, b"uno").unwrap();
        portable::escribir_atomico(&f, b"dos").unwrap();
        assert_eq!(fs::read(&f).unwrap(), b"dos");
        assert!(!f.with_extension("sim3d.guardando~").exists());
    }

    #[test]
    fn paginas_permitidas() {
        assert!(pagina_valida("calcador.html").is_ok());
        assert!(pagina_valida("biblioteca_inicio/index.html").is_ok());
        assert!(pagina_valida("simulador3d.html#desdeCalcador").is_ok());
        assert!(pagina_valida("../secreto.html").is_err());
        assert!(pagina_valida("https://ejemplo.com").is_err());
        assert!(pagina_valida("/etc/passwd").is_err());
        assert_eq!(sin_ancla("simulador3d.html#desdeCalcador"), "simulador3d.html");
        assert_eq!(sin_ancla("generador.html?x=1#y"), "generador.html");
    }
}

// ─────────────────────────── Arranque ───────────────────────────

fn main() {
    std::panic::set_hook(Box::new(|info| registrar_linea(&format!("PÁNICO: {info}"))));
    portable::usar_webview2_incluido();

    let args: Vec<String> = std::env::args().collect();
    let inicial = ruta_de_args(&args, std::env::current_dir().ok().as_deref());

    tauri::Builder::default()
        // Una sola instancia: si la app ya está abierta y se hace doble clic en
        // un archivo (o se vuelve a abrir la app), se usa la que ya existe.
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            match ruta_de_args(&args, Some(Path::new(&cwd))) {
                Some(r) => abrir_en_simulador(app, r),
                None => mostrar_principal(app),
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|w, ev| {
            if let tauri::WindowEvent::Destroyed = ev {
                let app = w.app_handle();
                app.state::<Estado>().paginas.lock().unwrap().remove(w.label());
                // para que window.opener.closed y similares sepan que ya no está
                let _ = app.emit("suite-ventana-cerrada", w.label());
                registrar_linea(&format!("ventana «{}» cerrada", w.label()));
            }
        })
        .setup(move |app| {
            let alternativa = app.path().app_local_data_dir().ok();
            let (datos, es_portable) = portable::carpeta_datos(|| alternativa.clone());
            let _ = fs::write(datos.join("registro.txt"), "");
            *REGISTRO.lock().unwrap() = Some(datos.join("registro.txt"));
            registrar_linea(&format!(
                "{} {} · {} {} · portable={} · datos={} · exe={:?} · WEBVIEW2_BROWSER_EXECUTABLE_FOLDER={:?}",
                EDICION.nombre, app.package_info().version, std::env::consts::OS, std::env::consts::ARCH,
                es_portable, datos.display(), std::env::current_exe().ok(),
                std::env::var_os("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER")
            ));
            registrar_linea(&format!("archivo inicial: {:?}", inicial));
            let (webview, motivo) = portable::carpeta_webview(&datos, alternativa);
            registrar_linea(&format!("perfil del motor web: {}", webview.display()));
            if let Some(m) = &motivo {
                registrar_linea(&format!("AVISO: {m}"));
            }
            let exe = std::env::current_exe()
                .ok()
                .and_then(|e| e.file_name().map(|n| n.to_string_lossy().into_owned()))
                .unwrap_or_else(|| "la app".into());
            let mut avisos = Vec::new();
            if portable::en_carpeta_temporal() {
                registrar_linea("AVISO: se está ejecutando desde la carpeta temporal (¿dentro del ZIP?)");
                avisos.push(format!(
                    "Parece que has abierto {} DENTRO del archivo ZIP, sin descomprimirlo.\n\n\
                     Funciona, pero al cerrarla Windows borrará tus ajustes y las copias de recuperación.\n\n\
                     Cierra la app, haz clic derecho en el ZIP → «Extraer todo…» y abre {exe} desde la carpeta extraída.",
                    EDICION.nombre
                ));
            }
            // Red de seguridad: si la página no carga, que no quede una ventana en blanco sin explicación
            {
                use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                let h = app.handle().clone();
                let registro = datos.join("registro.txt");
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(SEGUNDOS_ESPERA_PAGINA));
                    if PAGINA_CARGADA.load(Ordering::Relaxed) {
                        return;
                    }
                    registrar_linea(&format!("ERROR: la página no ha terminado de cargar en {SEGUNDOS_ESPERA_PAGINA} s"));
                    h.dialog()
                        .message(format!(
                            "{} no ha podido mostrar su ventana.\n\n\
                             Prueba a mover la carpeta de la app a una ruta corta, por ejemplo C:\\SuiteCNC, \
                             y vuelve a abrirla.\n\n\
                             Si sigue sin funcionar, envía este archivo a tu profesor:\n{}",
                            EDICION.nombre,
                            registro.display()
                        ))
                        .title(EDICION.nombre)
                        .kind(MessageDialogKind::Warning)
                        .show(|_| {});
                });
            }
            app.manage(Estado {
                datos,
                webview,
                avisos,
                portable: es_portable,
                contador: AtomicUsize::new(1),
                paginas: Mutex::new(HashMap::new()),
                pendientes: Mutex::new(HashMap::new()),
                impresiones: Mutex::new(HashMap::new()),
            });
            // Con un archivo (doble clic en un .sim3d…) se abre directamente el
            // simulador; si no, la ventana principal de la edición.
            match (inicial.clone(), EDICION.inicio == PAGINA_SIMULADOR) {
                (Some(r), true) => {
                    app.state::<Estado>().pendientes.lock().unwrap().insert(VENTANA_PRINCIPAL.into(), r);
                    crear_ventana(app.handle(), VENTANA_PRINCIPAL, EDICION.inicio, EDICION.titulo, None)?;
                }
                (Some(r), false) => abrir_en_simulador(app.handle(), r),
                (None, _) => {
                    crear_ventana(app.handle(), VENTANA_PRINCIPAL, EDICION.inicio, EDICION.titulo, None)?;
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            registrar,
            archivo_inicial,
            leer_archivo,
            escribir_texto,
            escribir_binario,
            autoguardar,
            leer_autoguardado,
            borrar_autoguardado,
            info_app,
            asociar_extensiones,
            quitar_asociacion,
            abrir_carpeta_datos,
            abrir_url,
            abrir_documento,
            abrir_ventana,
            enviar_mensaje,
            enfocar_ventana,
            cerrar_ventana,
            ventanas_abiertas,
            guardar_impresion,
            obtener_impresion,
            mostrar_portada,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            registrar_linea(&format!("ERROR al iniciar: {e}"));
            panic!("error al iniciar {}: {e}", EDICION.nombre);
        });
}
