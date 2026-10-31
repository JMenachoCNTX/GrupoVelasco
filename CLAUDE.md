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
- **v52**: Detalle de órdenes con 10 filas fijas (botón +10) y títulos sólidos. **Ticket térmico 80 mm** (`printTicket`/`ticketHTML`: datos, detalle transaccional, balance, conteo, egresos, comentarios).
  - **Foto del cierre de Control Facilito**: se toma en el nuevo arqueo, el Apps Script la lee con Gemini (`leerFacilito`, clave `GEMINI_API_KEY` en Propiedades del script de info@contaxbolivia.com; modelo por defecto gemini-3.8-flash o `GEMINI_MODEL`; reintenta si Gemini está saturado), se compara con el arqueo (`arqFacRender`), se guarda en Drive (carpeta "Arqueos GrupoVelasco - Control Facilito", `guardarFoto`) y va adjunta al correo (`fotoId`). En el arqueo quedan `facDatos` y `facFoto {id,url}`. Firestore no permite colecciones nuevas (reglas), por eso las fotos van a Drive.
  - **Pago al personal desde la caja**: tipo de gasto "PAGO AL PERSONAL" + nombre del Personal → al guardar el arqueo se agrega a los pagos de la semana de esa persona (`registrarPagosCaja`, `p.origen='caja'`, `p.arq`). Los demás pagos se muestran como "EFECTIVO DEL JUEVES" (`origenPagoHTML`).
  - **Sub-pestañas Personal / Arqueos / Gastos / Órdenes** en Semana, Calendario, Resumen y Tablero (`VT`, `vtSync`, `vtRender`); cada una descarga solo lo que muestra (`vtExcel`, `vtPDF`). Los botones ya no dicen "de lo que veo".
- **v53**:
  - **Foto del cierre de lote del POS** (`leerPOS`) además de Control Facilito; ambas en `FOTO`, se comparan en "Comparación con Control Facilito y el POS", se guardan en Drive (`facFoto`, `posFoto`) y van adjuntas al correo (`fotoIds`).
  - **Fotos con cualquier celular**: botón "Con celular" muestra un QR (`fotoQR`); el celular abre `index.html?subir=TOKEN&t=tipo&u=URL_APPS_SCRIPT` (`paginaSubirFoto`, sin login), sube la foto (`subirTemp`, carpeta Drive "Fotos temporales") y la compu la recoge cada 3 s (`buscarTemp`, la borra al recogerla).
  - **Guardar arqueo exige**: turno, ventas de Control Facilito, al menos una orden; y si hay SOBRANTE/FALTANTE, diferencia con Facilito o con las fotos, un comentario de al menos 15 letras.
  - **Cajeros (cuentas de caja) solo ven lo esencial**: sin Calendario/Resumen/Tablero, sin totales de Semana, sin sub-pestañas de reportes, en Arqueos solo sus últimos 3 días sin montos, Ajustes solo Apariencia (`esCuentaCaja`, clase `body.esCaja`). Los usuarios con todas las sucursales (`seesAll`) ahora sí ven Arqueos y reportes (`puedeReportes`); crear arqueos solo admin y cajas (`puedeCrearArqueo`).
  - **Reporte general** en Resumen (sub-pestaña): diario/semanal/mensual, todas o una sucursal; ventas, arqueos con diferencia, gastos, órdenes por marca y personal (`rgContenido`, `personalRango`); Excel, PDF y "Enviar a dueños" (correos en Ajustes → Correo de arqueos, campo `gvMail.due`; PDF con `pdfDeHTML`).
- **v54 · PedidosYa como total por marca**: los pedidos de PedidosYa ya entran solos a Control Facilito, así que en el arqueo no se cargan orden por orden. Bloque "PedidosYa · Totales del día por marca" (`draft.peya = {marca:{n,onl,efe,vou,promo}}`, `marcasPeya`, `PEYA_MAP`); `arqCalc` los suma; el "Detalle de órdenes" solo tiene YANGO y Local (la columna PedidosYa solo aparece en arqueos antiguos, `arqCols`). En listas y reportes van como líneas "PY" (`peyaLineas`). YANGO y Local siguen orden por orden.
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
- La versión está en la variable `APP_VERSION` dentro de `index.html` (hoy `v54`) y se muestra en el login.

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
