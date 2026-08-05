# Paleta de colores — CSC Green Pit Stop / Torneo Ping Pong

Colores extraídos por muestreo de píxeles directamente de `Torneo Ping Pong 5 Agosto 2026.jpeg` (cartel oficial del club). **Estos son los únicos colores a usar en toda la plataforma y en cualquier material futuro del torneo** — no introducir tonos nuevos sin actualizar este archivo primero.

## Paleta principal (extraída de la imagen)

| Color | Hex | RGB | Uso previsto |
|---|---|---|---|
| 🟢 Verde escudo | `#1D5523` | 29, 85, 35 | Color primario. Fondos de header, botones principales, acentos |
| 🟢 Verde oscuro | `#123D1A` | 18, 61, 26 | Hover/active de botones verdes, sombras de sección |
| 🔴 Rojo rasta | `#943026` | 148, 48, 38 | Alertas, "eliminar", indicador de derrota/perdedor |
| 🟡 Dorado mostaza | `#C28C42` | 194, 140, 66 | Títulos, texto destacado, trofeo/ganador |
| 🟤 Marrón madera | `#965828` | 150, 88, 40 | Tarjetas tipo "casillas de bracket", botones secundarios |
| 🟤 Marrón oscuro | `#5B2A17` | 91, 42, 23 | Bordes, sombras, contorno de tarjetas |
| 🔵 Azul cielo | `#28708F` | 40, 112, 143 | Acento terciario, enlaces, detalles puntuales |
| 🟨 Crema papel | `#E6CFB0` | 230, 207, 176 | Fondo general de la app (equivalente al papel del cartel) |
| ⬛ Negro tinta | `#1A1108` | 26, 17, 8 | Texto principal, contornos, iconografía |
| ⬜ Blanco | `#FFFFFF` | 255, 255, 255 | Texto sobre fondos oscuros (verde/marrón/rojo) |

## Variables CSS (usadas en `index.html`)

```css
:root {
  --verde: #1D5523;
  --verde-oscuro: #123D1A;
  --rojo: #943026;
  --dorado: #C28C42;
  --madera: #965828;
  --madera-oscura: #5B2A17;
  --azul: #28708F;
  --crema: #E6CFB0;
  --tinta: #1A1108;
  --blanco: #FFFFFF;
}
```

## Reglas de uso

- **Fondo base:** siempre `--crema`, nunca blanco puro (rompe la coherencia con el cartel).
- **Texto sobre crema/dorado/madera clara:** usar `--tinta` (negro), nunca gris genérico.
- **Texto sobre verde/marrón oscuro/rojo:** usar `--blanco`.
- **Ganador de un partido/torneo:** siempre se resalta en `--dorado` (coherente con el trofeo del cartel).
- **Acción destructiva (eliminar jugador/torneo):** siempre `--rojo`.
- **No usar** grises neutros, azules genéricos de framework (ej. `#007bff`) ni degradados que no estén en esta tabla.

## Logo

Extraído del cartel: el escudo del león con corona (estilo "Lion of Judah") sobre fondo verde, ubicado junto al texto "CLUB CSC GREEN PIT STOP" en la esquina inferior izquierda del cartel original.

- Archivo fuente recortado: `assets/logo-csc-green.png` (320×320px, recorte cuadrado centrado en el escudo)
- Se usa en `index.html` embebido en base64 dentro de un badge circular (imita el estilo de las insignias circulares del propio cartel).

## Fuente

Imagen original: `Torneo Ping Pong 5 Agosto 2026.jpeg` — cartel "Gran Torneo de CSC Green Pit Stop, Copa de Verano 2026".
