(EJERCICIO 3 PLACA CON UN AGUJERO RECTANGULAR, A 6 MM EN DOS PASADAS G91)
G71 G90                       ; milímetros; empezamos en absolutas
T101 M06                      ; fresa de Ø6
S12000 M03                    ; arranca el husillo a 12000 rpm
G0 Z20                        ; sube a la altura de seguridad
; ── Interior: A1 … A4 ──
G0 X50 Y35                    ; en rápido hasta encima de A1, desde el cero pieza
G1 Z-3 F150                   ; pasada 1: baja a Z-3 (en G90)
G91 G1 X55 Y0 F1000           ; A1 → A2: recta (pasa a G91)
G1 X0 Y40                     ; A2 → A3: recta
G1 X-55 Y0                    ; A3 → A4: recta
G1 X0 Y-40                    ; A4 → A1: recta (cierra)
G90 G1 Z-6 F150               ; pasada 2: baja a Z-6 (en G90)
G91 G1 X55 Y0 F1000           ; A1 → A2: recta (pasa a G91)
G1 X0 Y40                     ; A2 → A3: recta
G1 X-55 Y0                    ; A3 → A4: recta
G1 X0 Y-40                    ; A4 → A1: recta (cierra)
G90 G0 Z20                    ; sube antes de ir al siguiente trazado (la Z, siempre en G90)
; ── Exterior: P1 … P4 ──
G91 G0 X-50 Y-35              ; en rápido hasta encima de P1, desde donde está la fresa
G90 G1 Z-3 F150               ; pasada 1: baja a Z-3 (en G90)
G91 G1 X205 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G1 X0 Y175                    ; P2 → P3: recta
G1 X-205 Y0                   ; P3 → P4: recta
G1 X0 Y-175                   ; P4 → P1: recta (cierra)
G90 G1 Z-6 F150               ; pasada 2: baja a Z-6 (en G90)
G91 G1 X205 Y0 F1000          ; P1 → P2: recta (pasa a G91)
G1 X0 Y175                    ; P2 → P3: recta
G1 X-205 Y0                   ; P3 → P4: recta
G1 X0 Y-175                   ; P4 → P1: recta (cierra)
G90 G0 Z20                    ; sube a la altura de seguridad (vuelve a absolutas)
G0 X0 Y0                      ; vuelve encima del cero pieza
M05                           ; para el husillo
M30                           ; fin del programa
