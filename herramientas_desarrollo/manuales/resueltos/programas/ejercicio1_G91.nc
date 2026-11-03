(EJERCICIO 1 PIEZA EN L G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P6 ──
G0 X0 Y0                      ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G1 X205 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G1 X0 Y190                    ; P2 → P3: recta
G1 X-130 Y0                   ; P3 → P4: recta
G1 X0 Y-60                    ; P4 → P5: recta
G1 X-75 Y0                    ; P5 → P6: recta
G1 X0 Y-130                   ; P6 → P1: recta (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
