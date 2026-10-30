# GrupoVelasco — Sistema NUMMEROS (control de horas y arqueos)

## Para qué sirve
Sistema web interno para:
- Registrar las **horas trabajadas** del personal por sucursal y semana, y los **pagos** de esas horas.
- Ver calendario, resumen mensual, tablero con gráficos, horarios y lista de personal.
- **Arqueos de caja** (cierres de caja): consultar, capturar uno nuevo, contar la caja, generar el PDF y enviarlo por correo (solo administrador).

Pestañas: Inicio, Semana, Calendario, Resumen, Tablero, Horarios, Personal, Arqueos (solo admin), Ajustes.
Niveles de usuario: Administrador (todo), Editor (horas y pagos de su sucursal), RRHH (horarios), Lector (solo mira).

## Para qué empresa
GRUPOVELASCO SRL (restaurantes). Sucursales en el código: Cine (cerrada), Memphis, Sushiflash; en Arqueos: Equipetrol–Memphis, Equipetrol–SushiFlash y Sarao. Marca visible: "NUMMEROS by CONTAX".

## Cómo está armado (archivos principales)
- `index.html` — TODO el sistema en un solo archivo (≈3.200 líneas: HTML + CSS + JavaScript). Archivo grande: buscar con grep antes de editar.
- `assets/nummeros/clasicos/` — fotos de los personajes "Clásicos" de la marca NUMMEROS.
- `CNAME` — dominio propio.
- La versión está en la variable `APP_VERSION` dentro de `index.html` (hoy `v44`) y se muestra en el login.

## Dónde se guardan los datos
- **Firebase Firestore**, proyecto `contax-sistemas` (configuración incluida en `index.html`, variable `BUILTIN_CLOUD`):
  - Colección `controlHoras`, documento `principal`: guarda TODA la base (personal, horas, pagos, configuración y **la lista de usuarios con sus PIN**) como un solo texto JSON en el campo `payload`.
  - Colección `gvArqueos`: los arqueos de caja por sucursal.
- Copia local en el navegador (`localStorage`, clave `controlHoras_v1`).
- Envío del arqueo por correo: a una URL de **Google Apps Script** que el admin pega en Ajustes (se guarda dentro de la base, no en el código).
- No usa Firebase Authentication: el login (correo + PIN) se revisa dentro del navegador.

## Cómo se publica
GitHub Pages desde la rama principal, con dominio propio `nummeros-grupovelasco.contaxbolivia.com` (archivo `CNAME`). Cada cambio subido a GitHub se publica solo en unos minutos.
Convención de commits: `vNN: descripción corta` (ej. `v44: ...`); subir también `APP_VERSION` al mismo número.

## Cuidados importantes
- **El repositorio es PÚBLICO.** Nunca escribir claves, PIN reales, tokens ni URLs de Apps Script en el código.
- Hay mejoras de seguridad pendientes en el acceso y en las reglas de Firestore (Jhonny tiene la lista aparte). No escribir usuarios ni PIN reales en el código; la mejora prevista es usar Firebase Authentication y reglas cerradas.
- El proyecto Firebase `contax-sistemas` podría estar compartido con otros sistemas de CONTAX: revisar antes de tocar reglas.
- Todo se guarda como UN solo documento: si dos personas editan a la vez, el último en guardar gana.
- No cambiar los nombres `controlHoras`, `principal`, `gvArqueos` ni la clave `controlHoras_v1`: se perderían los datos guardados.
