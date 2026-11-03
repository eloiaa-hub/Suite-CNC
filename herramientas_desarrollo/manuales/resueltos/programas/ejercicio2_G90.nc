(EJERCICIO 2 PIEZA ESCALONADA G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P8 ──
G0 X0 Y0                      ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X130 Y0 F1000              ; P1 → P2: recta
G1 X130 Y20                   ; P2 → P3: recta
G1 X200 Y20                   ; P3 → P4: recta
G1 X200 Y90                   ; P4 → P5: recta
G1 X125 Y90                   ; P5 → P6: recta
G1 X125 Y135                  ; P6 → P7: recta
G1 X0 Y135                    ; P7 → P8: recta
G1 X0 Y0                      ; P8 → P1: recta (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
