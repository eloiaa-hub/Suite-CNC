(EJERCICIO 8 ARO G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A2 ──
G0 X70 Y50                    ; en rápido hasta encima de A1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G3 X-40 Y0 I-20 J0 F1000  ; A1 → A2: arco antihorario R20, centro X50 Y50 (pasa a G91)
G3 X40 Y0 I20 J0              ; A2 → A1: arco antihorario R20, centro X50 Y50 (cierra)
G90 G0 Z20                    ; sube antes de ir al siguiente trazado (la Z, siempre en G90)
; ── Exterior: P1 … P2 ──
G91 G0 X30 Y0                 ; en rápido hasta encima de P1, desde donde está la fresa
G90 G1 Z-3 F150               ; baja despacio a la profundidad (en G90)
G91 G3 X-100 Y0 I-50 J0 F1000 ; P1 → P2: arco antihorario R50, centro X50 Y50 (pasa a G91)
G3 X100 Y0 I50 J0             ; P2 → P1: arco antihorario R50, centro X50 Y50 (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
