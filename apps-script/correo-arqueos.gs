/**
 * Correo de arqueos — GrupoVelasco (NUMMEROS by CONTAX)
 *
 * - Envía el arqueo por correo con el PDF adjunto (y la foto del cierre de Control Facilito).
 * - Lee la foto del cierre de Control Facilito con Gemini y devuelve los montos.
 * - Guarda la foto como respaldo en Google Drive (carpeta "Arqueos GrupoVelasco - Control Facilito").
 * Cómo instalarlo: ver CLAUDE.md del repo (sección "Correo de arqueos").
 * Aquí NO van claves ni contraseñas: este archivo está en un repositorio público.
 * La clave de Gemini va en Configuración del proyecto → Propiedades del script → GEMINI_API_KEY.
 */
var CARPETA_FOTOS = 'Arqueos GrupoVelasco - Control Facilito';

// Abre la dirección /exec en el navegador: si ves este texto, el servicio está activo.
function doGet() {
  return ContentService.createTextOutput('Servicio de correo de arqueos CONTAX activo.');
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// El sistema envía: { accion?, html, subject, to, filename, pdf?, fotoId? }
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return ContentService.createTextOutput('ERROR: ' + err); }
  if (d.accion === 'leerFacilito') { try { return json_(leerFacilito_(d)); } catch (err) { return json_({ error: String(err) }); } }
  if (d.accion === 'guardarFoto') { try { return json_(guardarFoto_(d)); } catch (err) { return json_({ error: String(err) }); } }
  try {
    var to = String(d.to || '').trim();
    if (!to) throw new Error('Faltan los destinatarios');
    var html = String(d.html || '');
    // el sistema manda el PDF ya armado (base64); si no viene, se convierte el HTML
    var pdf = d.pdf
      ? Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', d.filename || 'arqueo.pdf')
      : Utilities.newBlob(html, 'text/html', 'arqueo.html').getAs('application/pdf').setName(d.filename || 'arqueo.pdf');
    var adjuntos = [pdf];
    if (d.fotoId) { try { adjuntos.push(DriveApp.getFileById(d.fotoId).getBlob()); } catch (err) {} }
    MailApp.sendEmail({
      to: to,
      subject: d.subject || 'Arqueo de caja',
      htmlBody: html,
      attachments: adjuntos,
      name: 'NUMMEROS · Arqueos GrupoVelasco'
    });
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err);
  }
}

// Guarda la foto (base64 JPEG) en Drive y devuelve su id y enlace.
function guardarFoto_(d) {
  var it = DriveApp.getFoldersByName(CARPETA_FOTOS);
  var carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_FOTOS);
  var blob = Utilities.newBlob(Utilities.base64Decode(d.img), d.mime || 'image/jpeg', d.nombre || 'control-facilito.jpg');
  var f = carpeta.createFile(blob);
  return { ok: true, id: f.getId(), url: f.getUrl() };
}

// Lee el ticket "CIERRE DE CAJA" de Control Facilito con Gemini.
function leerFacilito_(d) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('GEMINI_API_KEY');
  if (!key) return { error: 'Falta la clave de Gemini (GEMINI_API_KEY) en las propiedades del script.' };
  var model = props.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  var prompt = 'La imagen es un ticket impreso "CIERRE DE CAJA" del sistema Control Facilito de un restaurante en Bolivia. ' +
    'Lee los montos y devuelve SOLO un objeto JSON con estas claves numéricas (número con punto decimal; usa 0 si no aparece; el descuento va negativo si así figura): ' +
    'ventas_sistema, ingreso_extra, total_venta, apertura, ingreso_efectivo, ingreso_otros, venta_pago_posterior, venta_transferencia, venta_tarjeta, ' +
    'cobros_efectivo, cobros_no_efectivo, descuento, egresos_efectivo, egresos_otros, pagos_efectivo, pagos_otros, compras_efectivo, compras_otros, ' +
    'total, parcial_efectivo, declaracion, total_efectivo, diferencia, ventas_anuladas; ' +
    'y estas de texto: sucursal, caja, fecha_apertura y fecha_cierre (formato AAAA-MM-DD HH:MM).';
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: d.mime || 'image/jpeg', data: d.img } }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });
  var j = JSON.parse(res.getContentText());
  if (j.error) return { error: 'Gemini: ' + j.error.message };
  var t = j.candidates && j.candidates[0] && j.candidates[0].content.parts[0].text;
  if (!t) return { error: 'Gemini no devolvió datos. Prueba con una foto más clara.' };
  return { ok: true, datos: JSON.parse(t) };
}

// Ejecuta esta función UNA vez con el botón "Ejecutar": pide los permisos (correo y Drive)
// y te manda un correo de prueba a ti mismo.
function probarCorreoArqueos() {
  var yo = Session.getEffectiveUser().getEmail();
  var it = DriveApp.getFoldersByName(CARPETA_FOTOS);
  var carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_FOTOS);
  MailApp.sendEmail(yo, 'PRUEBA - Correo de arqueos GrupoVelasco', 'Permisos autorizados. Carpeta de fotos: ' + carpeta.getUrl());
  Logger.log('Correo de prueba enviado a ' + yo + '. Carpeta de fotos: ' + carpeta.getUrl());
}
