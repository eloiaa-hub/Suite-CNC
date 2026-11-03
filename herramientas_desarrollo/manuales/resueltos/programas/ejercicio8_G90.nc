(EJERCICIO 8 ARO G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A2 ──
G0 X70 Y50                    ; en rápido hasta encima de A1
G1 Z-3 F150                   ; baja despacio a la profundidad
G3 X30 Y50 I-20 J0 F1000      ; A1 → A2: arco antihorario R20, centro X50 Y50
G3 X70 Y50 I20 J0             ; A2 → A1: arco antihorario R20, centro X50 Y50 (cierra)
G0 Z20                        ; sube antes de ir al siguiente trazado
; ── Exterior: P1 … P2 ──
G0 X100 Y50                   ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G3 X0 Y50 I-50 J0 F1000       ; P1 → P2: arco antihorario R50, centro X50 Y50
G3 X100 Y50 I50 J0            ; P2 → P1: arco antihorario R50, centro X50 Y50 (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
