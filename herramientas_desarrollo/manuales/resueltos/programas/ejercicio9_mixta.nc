(EJERCICIO 9 PLACA CON UNA ESQUINA REDONDEADA MIXTA)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P5 ──
G0 X0 Y30                     ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G3 X30 Y-30 I30 J0 F1000  ; P1 → P2: arco antihorario R30, centro X30 Y30 (pasa a G91)
G1 X135 Y0                    ; P2 → P3: recta
G1 X0 Y125                    ; P3 → P4: recta
G1 X-165 Y0                   ; P4 → P5: recta
G90 G1 X0 Y30                 ; P5 → P1: recta (cierra, en G90)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
