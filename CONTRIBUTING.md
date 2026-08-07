# Pit Pong — guía para colaboradores

Plataforma de torneos de ping pong del club CSC Green Pit Stop. Se usa desde un iPad apoyado junto a la mesa.

## Dónde está todo

- **`index.html`** — la app entera: HTML, CSS y JavaScript en un solo archivo, sin build ni dependencias. Se edita y se prueba abriendo el archivo directamente en el navegador.
- **`apps-script/Codigo.gs`** — el backend (Google Apps Script + Google Sheets). Referencia de cómo funciona; el proyecto real de Apps Script y sus credenciales viven en la cuenta de Google del club, pídeselas a Marco.
- **`CONECTAR-SHEETS.html`** — guía interna con el mismo código del backend embebido y un botón de copiar, para redesplegar sin tener que abrir `Codigo.gs` a mano.
- **App publicada:** https://engodigital.github.io/pit-pong/ (GitHub Pages — cualquier `push` a `main` se publica al instante, sin vista previa).

## Formatos de competición

- **Liguilla** — todos contra todos por jornadas, con calendario cerrado; termina con un campeón. Es lo que crea "Crear torneo".
- **Liga abierta** — clasificación permanente sin calendario; se le van añadiendo partidos y nunca termina sola.
- **Eliminatoria** — formato de cuadro antiguo; ya no se crea, pero la app sigue leyendo los que hay guardados.
- **Partida suelta** — un 1vs1 o 2vs2 sin necesidad de torneo.

## Cómo probar cambios

- Abre `index.html` directamente en el navegador (`file://`) — no hace falta servidor local.
- **Nunca pruebes contra la base de datos real del club.** El archivo `.env` (no está en este repo) apunta a la hoja real; para pruebas, pide a Marco una hoja de pruebas aparte o simula el backend interceptando las peticiones a `script.google.com`.
- Prueba con toques reales en dispositivos táctiles (Puppeteer: `touchscreen.tap`, no `mouse.click`) — hay bugs de interfaz que solo aparecen tocando con el dedo.

## Tocar el backend (`Codigo.gs`)

El redeploy es manual: copia el contenido del archivo, pégalo en el editor de Apps Script del proyecto (pídele acceso a Marco) y despliega una nueva versión desde *Implementar → Gestionar implementaciones*. La URL pública no cambia.

## Antes de hacer push a `main`

`main` se publica automáticamente. Si el cambio es grande o toca datos, coméntalo con Marco antes de mergear.

## Contexto adicional

Para el estado detallado del proyecto, decisiones tomadas y temas pendientes (incluye algunos asuntos delicados que no van en este repositorio público) pídele a Marco acceso a la carpeta de documentación interna del proyecto.
