(EJERCICIO 4 PIEZA EN CRUZ CON UN AGUJERO G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A4 ──
G0 X85 Y80                    ; en rápido hasta encima de A1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G1 X45 Y0 F1000           ; A1 → A2: recta (pasa a G91)
G1 X0 Y50                     ; A2 → A3: recta
G1 X-45 Y0                    ; A3 → A4: recta
G1 X0 Y-50                    ; A4 → A1: recta (cierra)
G90 G0 Z20                    ; sube antes de ir al siguiente trazado (la Z, siempre en G90)
; ── Exterior: P1 … P10 ──
G91 G0 X-15 Y-80              ; en rápido hasta encima de P1, desde donde está la fresa
G90 G1 Z-3 F150               ; baja despacio a la profundidad (en G90)
G91 G1 X70 Y0 F1000           ; P1 → P2: recta (pasa a G91)
G1 X0 Y70                     ; P2 → P3: recta
G1 X85 Y0                     ; P3 → P4: recta
G1 X0 Y125                    ; P4 → P5: recta
G1 X-140 Y0                   ; P5 → P6: recta
G1 X0 Y-45                    ; P6 → P7: recta
G1 X-85 Y0                    ; P7 → P8: recta
G1 X0 Y-90                    ; P8 → P9: recta
G1 X70 Y0                     ; P9 → P10: recta
G1 X0 Y-60                    ; P10 → P1: recta (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
