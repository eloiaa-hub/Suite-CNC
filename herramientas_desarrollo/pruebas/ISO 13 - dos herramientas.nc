;; G-code generado por el Calcador de contornos
;; Proyecto  : ISO 13 - dos herramientas
;; Fecha     : 9/10/2026, 8:48:37
;; Modo      : Absoluto (G90)
;; Unidades  : mm (G71)
;; Herramientas: T101 Ø6 mm · T102 (Fresa plana Ø3) Ø3 mm — cambio con M06
;; Estrategia: Según el plano (sentido dibujado)
;; Pasadas Z : -3
;; Trazados  : 1 exterior(es), 1 interior(es) — se mecanizan exteriores primero y luego interiores
;
G71              ; unidades mm
G90           ; coordenadas absolutas
T101 M06         ; herramienta 1 de 2
S12000 M03        ; arrancar el husillo
G40           ; sin corrección: G41/G42 se activa en la entrada de cada contorno (radio=3mm)
G0 Z20 F5000      ; subir a Z seguro

; -- Cero Pieza (W): pasa a ser el origen X0 Y0 --
G0 X0 Y0 F5000   ; -> Cero pieza

; ══════ Trazado 1/2 — EXTERIOR (entrada P1) ══════
G0 X80 Y98 F5000   ; -> aproximación (fuera del contorno) del trazado 1
; ── Pasada 1 / 1  (Z=-3) ──
G1 Z0 F1000       ; bajar a Z0
G1 Z-3 F1000     ; profundidad -3
G41 G1 X80 Y90 F1000   ; entrada: activa G41 (fresa a la izquierda)
G1 X130 Y90 F1000
G2 X150 Y70 I0 J-20 F1000
G1 X150 Y20 F1000
G1 X130 Y20 F1000
G1 X130 Y50 F1000
G3 X90 Y50 I-20 J0 F1000
G2 X50 Y90 I-40 J0 F1000
G1 X80 Y90 F1000
G40 G1 X80 Y98 F1000   ; salida: anula la compensación
G0 Z20 F5000      ; subir a Z seguro

; ══════ Cambio de herramienta: T102 (Fresa plana Ø3), Ø3 mm ══════
M05              ; parar el husillo
T102 M06         ; cambio de herramienta
S16000 M03        ; arrancar el husillo

; ══════ Trazado 2/2 — INTERIOR (entrada P1) ══════
G0 X65 Y50 F5000   ; -> aproximación (fuera del contorno) del trazado 2
; ── Pasada 1 / 2  (Z=-1.5) ──
G1 Z0 F800       ; bajar a Z0
G1 Z-1.5 F800     ; profundidad -1.5
G42 G1 X70 Y50 F800   ; entrada: activa G42 (fresa a la derecha)
G2 X30 Y50 I-20 J0 F800
G2 X70 Y50 I20 J0 F800
G40 G1 X65 Y50 F800   ; salida: anula la compensación
G0 Z20 F5000      ; subir a Z seguro
G0 X65 Y50 F5000   ; volver a punto de aproximación
; ── Pasada 2 / 2  (Z=-3) ──
G1 Z0 F800       ; bajar a Z0
G1 Z-3 F800     ; profundidad -3
G42 G1 X70 Y50 F800   ; entrada: activa G42 (fresa a la derecha)
G2 X30 Y50 I-20 J0 F800
G2 X70 Y50 I20 J0 F800
G40 G1 X65 Y50 F800   ; salida: anula la compensación
G0 Z20 F5000      ; subir a Z seguro

; ── Retorno a Cero Pieza ──
G0 X0 Y0 F5000   ; -> Cero pieza
M05              ; parar el husillo
M30              ; fin de programa
