(EJERCICIO 3 PLACA CON UN AGUJERO RECTANGULAR G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A4 ──
G0 X50 Y35                    ; en rápido hasta encima de A1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X105 Y35 F1000             ; A1 → A2: recta
G1 X105 Y75                   ; A2 → A3: recta
G1 X50 Y75                    ; A3 → A4: recta
G1 X50 Y35                    ; A4 → A1: recta (cierra)
G0 Z20                        ; sube antes de ir al siguiente trazado
; ── Exterior: P1 … P4 ──
G0 X0 Y0                      ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X205 Y0 F1000              ; P1 → P2: recta
G1 X205 Y175                  ; P2 → P3: recta
G1 X0 Y175                    ; P3 → P4: recta
G1 X0 Y0                      ; P4 → P1: recta (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
