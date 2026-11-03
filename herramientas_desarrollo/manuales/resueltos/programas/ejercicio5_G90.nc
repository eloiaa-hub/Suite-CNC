(EJERCICIO 5 PLACA CON ESQUINAS HACIA DENTRO G90)
G71 G90                       ; milímetros y coordenadas absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P7 ──
G0 X0 Y10                     ; en rápido hasta encima de P1
G1 Z-3 F150                   ; baja despacio a la profundidad
G2 X10 Y0 I0 J-10 F1000       ; P1 → P2: arco horario R10, centro X0 Y0
G1 X185 Y0                    ; P2 → P3: recta
G2 X210 Y25 I25 J0            ; P3 → P4: arco horario R25, centro X210 Y0
G1 X210 Y130                  ; P4 → P5: recta
G1 X10 Y130                   ; P5 → P6: recta
G2 X0 Y120 I-10 J0            ; P6 → P7: arco horario R10, centro X0 Y130
G1 X0 Y10                     ; P7 → P1: recta (cierra)
G0 Z20                        ; sube a la altura de seguridad
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
