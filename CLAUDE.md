# GrupoVelasco — Sistema NUMMEROS (control de horas y arqueos)

## Para qué sirve
Sistema web interno para:
- Registrar las **horas trabajadas** del personal por sucursal y semana, y los **pagos** de esas horas.
- Ver calendario, resumen mensual, tablero con gráficos, horarios y lista de personal.
- **Arqueos de caja** (cierres de caja): consultar, capturar uno nuevo, contar la caja, generar el PDF y enviarlo por correo (solo administrador).
  - Desde la v46 la pestaña Arqueos tiene subpestañas: **Historial Arqueos** (con botón "Ver" que abre el arqueo completo), **Historial Gastos** e **Historial Órdenes** (filtros por día, marca y canal).
  - El Nuevo arqueo usa tarjetas (no aspecto de planilla), en este orden: cabecera con datos e indicadores → Detalle de órdenes (botón Pantalla completa) → Egresos (Pantalla completa) → Reporte de ventas / Datos del arqueo / Conteo y comentarios → gráficos con el mismo estilo del Tablero (`chartPanel`, `svgVBars`, `svgHBars`). Funciones `arqSheetHTML`, `arqCalc`, `arqRender`. El borrador se guarda en el navegador (`gvArqDraft`) hasta pulsar Guardar.
  - Logos de marcas en `assets/marcas/`. "Dinero en sobre" = lo contado en el conteo (la caja chica va aparte).
  - Desde la v47 las columnas van por bloques (PedidosYa: Efectivo, Online, Voucher, Dscto Promo · YANGO: Online · Local: Efectivo, POS, QR). Reglas en `GV_SUC` (canales y marcas por sucursal) y `GV_MK` (canales por marca): Equipetrol–SushiFlash solo Local y solo SushiFlash; Noah's solo PedidosYa. Funciones `arqCols`, `colPermitida`.
  - El nuevo arqueo se llena solo: sucursal, fecha de hoy, nro siguiente, y cajero/turno del último arqueo de esa sucursal (`arqAutoDatos`); sugiere cajeros del Personal con cargo "Cajero".
  - Desde la v49: cabecera en 4 columnas (datos / turno y caja / Control Facilito / resumen con cantidad y total), cada bloque se puede minimizar (`arqCol`, se recuerda en el equipo), botones "+ 10 filas" y "+ 5 filas" (`arqMasFilas`).
  - Reglas de órdenes (v49): una fila = una orden con UN tipo de pago (`PAYCOLS`); voucher y descuento de PedidosYa se activan con "+" (`EXTRAS`, `o.ex`); "Mixto" permite varias columnas de Local en una orden (`o.mix`, se guarda como `mx`). Lógica en `cellMotivo` / `arqFilaEstado`. Gastos: todas las columnas obligatorias al guardar.
  - Diferencia con Control Facilito = ventas del sistema − Facilito (positivo = SOBRANTE).
- **Nro de arqueo automático** (v50): no se escribe; al guardar se vuelve a leer de la nube y se usa último + 1 de esa sucursal (`nextNro`). SARAO empieza en 1000 (`nroIni` en `GV_SUC`).
- **Mayúsculas** (v49): todo texto escrito se convierte a MAYÚSCULAS (listener global `input`; excepciones: correos, PIN, direcciones, configuración, clase `nomay`). Cargos y tipos de gasto también en mayúsculas.
- **Cargos del personal** (v47): lista común en `DB.config.cargos` (Ajustes → Cargos); cada trabajador tiene `cargo`. En Personal hay un análisis por cargo (personas por sucursal, horas y pagos del mes).
- **Correo de arqueos**: se configura en Ajustes → Correo de arqueos (con botón de prueba que muestra el error real). El código está en `apps-script/correo-arqueos.gs` y está instalado como archivo `CorreoArqueos.gs` dentro del proyecto de Apps Script "Sistema CONTAX - Control Horarios Grupovelasco SRL" (cuenta info@contaxbolivia.com, junto al correo semanal y el respaldo). Implementación "Correo de arqueos GrupoVelasco" como aplicación web, ejecuta como info@contaxbolivia.com. Para cambiar el código: editar, guardar y Gestionar implementaciones → editar → Nueva versión (la dirección no cambia). Desde la v49 el sistema arma el PDF en el navegador (html2canvas + jsPDF, `arqPdfBase64`: hoja 1 = reporte de ventas, datos y conteo; hoja 2 = 4 gráficos) con hoja membretada NUMMEROS (logo, título, línea verde y pie) y lo manda en el campo `pdf` (base64); el botón "Imprimir / PDF" abre ese mismo PDF (`arqPdfDoc`, respaldo: `printArqPantalla`); el cuerpo del correo es un resumen (`arqMailBody`). Riesgo pendiente: el script envía a cualquier destinatario que reciba.

Pestañas: Inicio, Arqueos, Semana, Calendario, Resumen, Tablero, Horarios, Personal, Ajustes. (Arqueos: admin y cuentas de caja.)
Niveles de usuario: Administrador (todo), Editor (horas y pagos de su sucursal), RRHH (horarios), Lector (solo mira).
- **Cuentas de caja** (v48): los cajeros NO tienen usuario propio; usan la cuenta genérica de su sucursal (editor con una sola sucursal). Al entrar, el sistema pide "¿Quién está en caja?" y se elige de Personal (cargo Cajero). Queda en `session.operador`; se guarda quién cargó horas (`d[i].por`), quién pagó (`pmPor`, `p.por`) y quién hizo el arqueo (`hechoPor`). Botón "Cambiar cajero" para el cambio de turno. Estas cuentas ven Arqueos solo de su sucursal y no pueden sobrescribir un arqueo.
- **Cargo obligatorio** (v48): no se registran horas ni pagos de una persona sin cargo (`needsCargo`, `faltaDato`).
- **Fecha del arqueo** (v48): es el día en que se abrió la caja; si se cierra antes de las 6:00 queda con la fecha del día anterior (`fechaApertura`, `ARQ_HORA_CORTE`).

## Para qué empresa
GRUPOVELASCO SRL (restaurantes). Sucursales en el código: Cine (cerrada), Memphis, Sushiflash; en Arqueos: Equipetrol–Memphis, Equipetrol–SushiFlash y Sarao. Marca visible: "NUMMEROS by CONTAX".

## Cómo está armado (archivos principales)
- `index.html` — TODO el sistema en un solo archivo (≈3.200 líneas: HTML + CSS + JavaScript). Archivo grande: buscar con grep antes de editar.
- `assets/nummeros/clasicos/` — fotos de los personajes "Clásicos" de la marca NUMMEROS.
- `CNAME` — dominio propio.
- La versión está en la variable `APP_VERSION` dentro de `index.html` (hoy `v51`) y se muestra en el login.

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
