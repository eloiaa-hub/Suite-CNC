(EJERCICIO 2 PIEZA ESCALONADA G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P8 ──
G0 X0 Y0                      ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G1 X130 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G1 X0 Y20                     ; P2 → P3: recta
G1 X70 Y0                     ; P3 → P4: recta
G1 X0 Y70                     ; P4 → P5: recta
G1 X-75 Y0                    ; P5 → P6: recta
G1 X0 Y45                     ; P6 → P7: recta
G1 X-125 Y0                   ; P7 → P8: recta
G1 X0 Y-135                   ; P8 → P1: recta (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
