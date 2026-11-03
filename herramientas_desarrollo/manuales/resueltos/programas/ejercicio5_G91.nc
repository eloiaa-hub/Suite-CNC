(EJERCICIO 5 PLACA CON ESQUINAS HACIA DENTRO G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Exterior: P1 … P7 ──
G0 X0 Y10                     ; en rápido hasta encima de P1, desde el cero pieza
G1 Z-3 F150                   ; baja despacio a la profundidad (en G90)
G91 G2 X10 Y-10 I0 J-10 F1000 ; P1 → P2: arco horario R10, centro X0 Y0 (pasa a G91)
G1 X175 Y0                    ; P2 → P3: recta
G2 X25 Y25 I25 J0             ; P3 → P4: arco horario R25, centro X210 Y0
G1 X0 Y105                    ; P4 → P5: recta
G1 X-200 Y0                   ; P5 → P6: recta
G2 X-10 Y-10 I-10 J0          ; P6 → P7: arco horario R10, centro X0 Y130
G1 X0 Y-110                   ; P7 → P1: recta (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
