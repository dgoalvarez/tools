# Switzer

La tipografía del sitio, autoalojada. Los mismos tres archivos que usa
`dgoalvarez.com`, copiados de `C:\portfolio\public\fonts\`.

| Archivo | Peso |
| --- | --- |
| `switzer-400.woff2` | Normal |
| `switzer-500.woff2` | Medio |
| `switzer-600.woff2` | Semi-negrita |

## Origen y licencia

- **Diseñada por** Indian Type Foundry (ITF).
- **Descargada de** https://www.fontshare.com/fonts/switzer
- **Licencia:** ITF Free Font License. Permite uso personal y comercial,
  incluida la incrustación en un sitio web. El texto completo y vigente
  está en https://www.fontshare.com/licenses/itf-ffl — es la referencia,
  no esta nota.

Lo que la licencia **no** permite: revender los archivos, redistribuirlos
como si fueran propios, ni modificarlos. Servirlos desde este dominio
para que se vean en el sitio es exactamente el uso previsto.

## Por qué autoalojada y no desde un CDN

Tres razones, en orden de importancia:

1. **La política de seguridad.** `font-src 'self'` en `vercel.json` no
   admite orígenes externos. Traerlas de fuera obligaría a abrir la CSP.
2. **Nadie más ve quién visita el sitio.** Un CDN de fuentes registra la
   IP de cada persona que carga una página. Este sitio no guarda datos de
   nadie, y eso incluye no dejar que otro los guarde por él.
3. **Velocidad.** Sin una segunda conexión TLS a otro dominio.

## Si hace falta un peso más

Descargarlo de Fontshare en `woff2`, dejarlo aquí con el mismo patrón de
nombre, y añadir su `@font-face` en `src/styles/global.css`. Solo eso: no
hay nada más que registrar. Cada peso extra son ~20 KB que se descargan
en la primera visita, así que conviene añadir solo los que se usen.
