(EJERCICIO 7 RANURA (COLISA) G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P4 ──
G0 X35 Y70                    ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G1 X140 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G2 X0 Y-70 I0 J-35            ; P2 → P3: arco horario R35, centro X175 Y35
G1 X-140 Y0                   ; P3 → P4: recta
G2 X0 Y70 I0 J35              ; P4 → P1: arco horario R35, centro X35 Y35 (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
