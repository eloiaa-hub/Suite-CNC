(EJERCICIO 4 PIEZA EN CRUZ CON UN AGUJERO G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A4 ──
G0 X85 Y80                    ; en rápido hasta encima de A1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X130 Y80 F1000             ; A1 → A2: recta
G1 X130 Y130                  ; A2 → A3: recta
G1 X85 Y130                   ; A3 → A4: recta
G1 X85 Y80                    ; A4 → A1: recta (cierra)
G0 Z20                        ; sube antes de ir al siguiente trazado
; ── Exterior: P1 … P10 ──
G0 X70 Y0                     ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X140 Y0 F1000              ; P1 → P2: recta
G1 X140 Y70                   ; P2 → P3: recta
G1 X225 Y70                   ; P3 → P4: recta
G1 X225 Y195                  ; P4 → P5: recta
G1 X85 Y195                   ; P5 → P6: recta
G1 X85 Y150                   ; P6 → P7: recta
G1 X0 Y150                    ; P7 → P8: recta
G1 X0 Y60                     ; P8 → P9: recta
G1 X70 Y60                    ; P9 → P10: recta
G1 X70 Y0                     ; P10 → P1: recta (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
