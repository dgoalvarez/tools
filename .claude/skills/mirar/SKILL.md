---
name: mirar
description: Compila, hace las capturas y dice cuáles han cambiado desde la vez anterior, para abrir solo esas. Úsalo después de tocar cualquier cosa que se vea.
---

# Mirar lo que ha cambiado

Existe porque `npm run ver` hace 43 capturas y abrirlas todas no lo hace
nadie: se abren tres, las que uno cree que ha tocado, y el fallo está en
la cuarta.

## Cómo

**1 ·** Apunta cómo estaban las capturas antes:

```
node -e "const fs=require('fs'),c=require('crypto');const d='capturas';const m={};for(const f of fs.readdirSync(d))m[f]=c.createHash('md5').update(fs.readFileSync(d+'/'+f)).digest('hex');fs.writeFileSync(process.env.TEMP+'/capturas-antes.json',JSON.stringify(m))"
```

**2 ·** `npm run build && npm run ver`

**3 ·** Compara y quédate con las que cambiaron:

```
node -e "const fs=require('fs'),c=require('crypto');const a=JSON.parse(fs.readFileSync(process.env.TEMP+'/capturas-antes.json','utf8'));const d='capturas';for(const f of fs.readdirSync(d)){const h=c.createHash('md5').update(fs.readFileSync(d+'/'+f)).digest('hex');if(a[f]!==h)console.log(a[f]?'CAMBIÓ  '+f:'NUEVA   '+f)}"
```

**4 · Abre y mira las que salgan.** De verdad, con la herramienta de
lectura de imágenes. El reloj y el pomodoro cambian en cada pasada porque
enseñan la hora: esos se ignoran salvo que sea lo que estabas tocando.

## Qué buscar

No «si se ve bien», que eso no dice nada. Cosas concretas:

- Algo que aparece dos veces, o que no aparece.
- Texto cortado, o una caja que se sale.
- Un color que no es el de la materia de esa herramienta.
- Un hueco reservado que se quedó vacío, o contenido que empujó lo de
  abajo.
- En claro **y** en oscuro: los acentos y las tintas cambian, los fallos
  también.

## Si falta un estado

Si lo que hay que mirar no se alcanza recargando —una lista con cosas
dentro, una cuenta a medias, un popover abierto— añade su vista a
`scripts/ver.mjs`. Admite `tema`, `query`, `clics`, `guion` y `siembra`,
que deja algo en `sessionStorage` antes de que la isla hidrate.
