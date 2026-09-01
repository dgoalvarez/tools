---
name: buscar-skills
description: Enumera las skills disponibles - las del proyecto, las del usuario y las de los plugins - con lo que hace cada una y desde dónde viene. Úsalo cuando Diego pregunte qué hay disponible o cuando no esté claro si ya existe una skill para lo que se va a hacer.
---

# Qué skills hay

Las skills se acumulan en tres sitios y ninguno se ve desde los otros. La
consecuencia práctica es que se escribe a mano algo que ya estaba
resuelto, o se construye una skill nueva que duplica una que ya existe.

## Dónde viven

| Dónde | Qué es | Se versiona |
| --- | --- | --- |
| `.claude/skills/` | las de **este proyecto** | sí, con el repo |
| `~/.claude/skills/` | las **tuyas**, en todos los proyectos | no |
| `~/.claude/plugins/` | las que trae un **plugin** instalado | no |

## Cómo listarlas

```
node -e "
const fs=require('fs'),p=require('path');
const sitios=[['proyecto','.claude/skills'],['usuario',p.join(process.env.USERPROFILE||process.env.HOME,'.claude','skills')],['plugins',p.join(process.env.USERPROFILE||process.env.HOME,'.claude','plugins')]];
for(const [de,dir] of sitios){
  if(!fs.existsSync(dir)) continue;
  const vistos=[];
  const mirar=(d,hondo)=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const r=p.join(d,e.name);
    if(e.isDirectory()&&hondo<4) mirar(r,hondo+1);
    else if(e.name==='SKILL.md'){ const t=fs.readFileSync(r,'utf8');
      const n=/^name:\s*(.+)$/m.exec(t)?.[1]?.trim()??p.basename(p.dirname(r));
      const d2=/^description:\s*(.+)$/m.exec(t)?.[1]?.trim()??'';
      vistos.push([n,d2]); } } };
  mirar(dir,0);
  if(!vistos.length) continue;
  console.log('\n== '+de+' ==');
  for(const [n,d2] of vistos.sort()) console.log('  /'+n+'\n     '+d2.slice(0,150));
}
"
```

Y compáralo con la lista de skills disponibles que llega en el aviso del
sistema: lo que esté en disco pero no en esa lista es una skill que no se
está cargando, y casi siempre es por el `name` del encabezado, que tiene
que coincidir con el nombre de la carpeta.

## Antes de escribir una skill nueva

Tres preguntas, en este orden:

1. **¿Ya existe?** Mira la lista. Media docena de skills con nombres
   parecidos es peor que ninguna.
2. **¿Es una skill o es una regla?** Lo que hay que tener en cuenta
   *siempre* —cómo se escriben los commits, qué trampas tiene el CSS— va
   en `CLAUDE.md`, que se lee solo. Una skill es un **procedimiento** que
   se invoca cuando toca.
3. **¿Es una skill o es un guion?** Si son cinco órdenes fijas sin
   decisiones, es un script de npm. Una skill es para cuando hay criterio
   que aplicar entre paso y paso.

Y si va a ser del proyecto, va en `.claude/skills/` para que se versione
con el repo y esté también en la próxima sesión.
