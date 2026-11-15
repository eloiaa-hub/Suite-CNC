import sys, os
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = open(os.path.join(S, 'scripts/revision_bateria.js'), encoding='utf-8').read()

CSS = r"""
    .bat-duda { font-size:11px; color:#a3560f; margin-top:3px; max-width:260px; line-height:1.3; }
    .bat-recordada { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:8px 12px; margin:6px 0; border:1px solid var(--accent); border-radius:8px; background:var(--accent-light); font-size:13px; }
    .bat-recordada .btn-action, .rev-barra .btn-action, .rev-ficha-cab .btn-action { width:auto; flex:0 0 auto; padding:4px 12px; white-space:nowrap; }
    .help-modal.rev-modal { width:min(1250px,100%); height:min(900px,100%); max-height:100%; }
    .rev-modal .help-content { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; }
    #revCuerpo { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; }
    .rev-barra { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:13px; }
    .rev-barra select { padding:3px 6px; }
    .rev-con { font-size:12px; white-space:nowrap; }
    .rev-tabla-caja { flex:1; min-height:0; overflow:auto; border:1px solid var(--border-color); border-radius:8px; }
    .rev-tabla { border-collapse:collapse; font-size:13px; width:100%; }
    .rev-tabla th, .rev-tabla td { padding:4px 7px; border-bottom:1px solid var(--border-color); }
    .rev-tabla thead th { position:sticky; top:0; background:var(--bg-panel); z-index:1; font-size:12px; white-space:nowrap; }
    .rev-tabla thead tr.rev-conf td { position:sticky; top:27px; background:var(--bg-app); z-index:1; }
    .rev-tabla tfoot td { background:var(--bg-app); font-weight:600; }
    .rev-al { text-align:left; white-space:nowrap; } .rev-al a { color:var(--text-main); font-weight:600; text-decoration:none; } .rev-al a:hover { text-decoration:underline; color:var(--accent); }
    .rev-t { text-align:center; } .rev-n { text-align:center; white-space:nowrap; }
    td.rev-n[data-key] { cursor:pointer; } td.rev-n[data-key]:hover { background:var(--accent-light); }
    .rev-n.ap, .rev-m.ap, .rev-nota-v.ap, .rev-ficha-media.ap { color:#1e7a48; } .rev-n.su, .rev-m.su, .rev-nota-v.su, .rev-ficha-media.su { color:#b52b2b; }
    .rev-n sup { font-size:9px; margin-left:1px; }
    .rev-no { color:var(--text-muted); } .rev-fuera { opacity:.45; }
    .rev-m { text-align:center; font-weight:700; font-size:14px; border-left:2px solid var(--border-color); }
    .rev-peso { width:46px; padding:1px 3px; font-size:12px; text-align:center; } .rev-cuenta { vertical-align:middle; margin-left:3px; }
    .rev-ficha-cab { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .rev-ficha-nom { font-size:15px; } .rev-ficha-media { font-size:15px; padding:2px 10px; border:2px solid currentColor; border-radius:6px; }
    .rev-tarjetas { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:10px; padding-right:4px; }
    .rev-tarjeta { border:1px solid var(--border-color); border-radius:8px; padding:8px 10px; background:var(--bg-panel); }
    .rev-tarjeta.rev-no { background:var(--bg-app); }
    .rev-tt { display:flex; align-items:center; gap:10px; font-size:14px; margin-bottom:6px; }
    .rev-tt .vered { margin-left:auto; font-size:12px; padding:1px 8px; border-radius:10px; }
    .vered.v-bien { background:#e3f4ea; color:#1e7a48; } .vered.v-nocumple { background:#fbeedd; color:#a3560f; } .vered.v-mal, .vered.v-error, .vered.v-vacio, .vered.v-altura { background:#fbe4e4; color:#b52b2b; }
    .rev-nota-v { font-size:18px; font-weight:700; min-width:34px; text-align:right; }
    .rev-cuerpo { display:flex; gap:12px; align-items:flex-start; }
    .rev-dibujo { flex:0 0 230px; height:160px; border:1px solid var(--border-color); border-radius:6px; background:#fff; cursor:pointer; overflow:hidden; display:flex; align-items:center; justify-content:center; color:var(--text-muted); }
    .rev-dibujo svg { width:100%; height:100%; }
    .rev-datos { flex:1; min-width:0; font-size:13px; }
    .rev-err { margin:2px 0 6px 18px; padding:0; } .rev-err li { margin-bottom:3px; }
    .rev-prof { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px; font-size:12px; }
    .rev-prof .rev-nota { width:52px; text-align:center; } .rev-prof .rev-com { flex:1; min-width:180px; }
    .rev-prof .btn-action { width:auto; padding:3px 10px; }
    @media (max-width:700px) { .rev-cuerpo { flex-direction:column; } .rev-dibujo { flex:none; width:100%; } }"""

ANCLA_CSS = "    .mv-inf { font-size:12px; cursor:help; }"
ANCLA_JS = "// Arrastrar archivos a la ventana de corrección masiva; ordenar por columna"
AYUDA_A = "🖨 Devoluciones de todas las imprimen todas en un solo documento (con «Guardar como PDF», un solo PDF), y 🖨 en cada fila, solo esa tarea."
AYUDA_B = AYUDA_A + " <strong>💾 Guardar batería</strong> la guarda entera en un .json (los ejercicios, los programas, tus notas y comentarios, la revisión) para seguir otro día con <strong>📂 Abrir batería…</strong> (o arrastrándola a la ventana); el navegador recuerda además la última. <strong>👤 Revisión por alumno</strong>: la tabla alumno × tarea con las notas y la media de cada alumno (con un peso por tarea; las no entregadas cuentan 0 o solo cuentan las entregadas; cada tarea se puede quitar de la media), 🔗 unir el mismo alumno escrito de dos maneras, ⬇ CSV, y la ficha de cada alumno con todas sus correcciones, tu nota y tu comentario; 🖨 Informes / Devoluciones por alumno: una hoja resumen con sus notas y su media y, detrás, la corrección de cada tarea. Si una tarea encaja igual con dos ejercicios, gana el del nombre del archivo y la fila avisa (⚠️)."

def rep(s, a, b, cnt=1):
    n = s.count(a)
    assert n == cnt, (a[:60], n)
    return s.replace(a, b)

VERS = {'calcador.html': ('>v130<', '>v131<'), 'corrector.html': ('>v75<', '>v76<')}
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    assert 'function cuentasTareaBat' not in s
    s = rep(s, ANCLA_CSS, CSS.lstrip('\n') + '\n' + ANCLA_CSS)
    s = rep(s, ANCLA_JS, JS + '\n' + ANCLA_JS)
    s = rep(s, AYUDA_A, AYUDA_B, s.count(AYUDA_A) or 1)
    a, b = VERS[os.path.basename(f)]
    s = rep(s, a, b)
    open(f, 'w', encoding='utf-8').write(s)
    print('ok', f)
