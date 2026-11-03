(EJERCICIO 7 RANURA (COLISA) G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P4 ──
G0 X35 Y70                    ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G1 X175 Y70 F1000             ; P1 → P2: recta
G2 X175 Y0 I0 J-35            ; P2 → P3: arco horario R35, centro X175 Y35
G1 X35 Y0                     ; P3 → P4: recta
G2 X35 Y70 I0 J35             ; P4 → P1: arco horario R35, centro X35 Y35 (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
