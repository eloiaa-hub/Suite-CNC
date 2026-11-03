(EJERCICIO 10 PLACA CON UNA ESQUINA CONCAVA Y UN AGUJERO REDONDO MIXTA)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A2 ──
G0 X80 Y85                    ; en rápido hasta encima de A1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G3 X-30 Y0 I-15 J0 F1000  ; A1 → A2: arco antihorario R15, centro X65 Y85 (pasa a G91)
G90 G3 X80 Y85 I15 J0         ; A2 → A1: arco antihorario R15, centro X65 Y85 (cierra, en G90)
G0 Z20                        ; sube antes de ir al siguiente trazado
; ── Exterior: P1 … P7 ──
G0 X35 Y0                     ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G1 X190 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G1 X0 Y115                    ; P2 → P3: recta
G2 X-45 Y45 I0 J45            ; P3 → P4: arco horario R45, centro X225 Y160
G1 X-180 Y0                   ; P4 → P5: recta
G1 X0 Y-115                   ; P5 → P6: recta
G1 X35 Y0                     ; P6 → P7: recta
G90 G1 X35 Y0                 ; P7 → P1: recta (cierra, en G90)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
