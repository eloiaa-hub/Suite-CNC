(PIEZA CON MUESCA - TPACAD)
G71 X160 Y100 Z19                 ; medidas del tablero: largo X, ancho Y, grosor Z
G0 X80 Y12 Z20 T101 S12000 M03    ; mecanizado 1 (setup): fresa T101
G42                               ; correccion: toda la pieza por fuera
G1 Z-3 F150                       ; baja en la zona que sobra
G1 X80 Y20 F1500                  ; entrada hasta el contorno
G1 X140 Y20
G1 X140 Y60
G3 X120 Y80 I-20 J0
G1 X95 Y80
G2 X65 Y80 I-15 J0
G1 X40 Y80
G3 X20 Y60 I0 J-20
G1 X20 Y20
G1 X80 Y20                        ; vuelve al punto de entrada
G40 G1 X80 Y12                    ; salida
G1 Z20 F5000                      ; sube sin empezar otro mecanizado
G0 X50 Y50 Z20 T104 S4000         ; G0 aislado (TpaCAD lo quita)
G81 X50 Y50 Z-20 R2 T104 S4000 F300
G81 X110 Y50 Z-20 R2 T104 S4000 F300
G80
M2
