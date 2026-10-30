/**
 * Correo de arqueos — GrupoVelasco (NUMMEROS by CONTAX)
 *
 * Recibe el arqueo desde el sistema web y lo envía por correo con el PDF adjunto.
 * Cómo instalarlo: ver CLAUDE.md del repo (sección "Correo de arqueos").
 * Aquí NO van claves ni contraseñas: este archivo está en un repositorio público.
 */

// Abre la dirección /exec en el navegador: si ves este texto, el servicio está activo.
function doGet() {
  return ContentService.createTextOutput('Servicio de correo de arqueos CONTAX activo.');
}

// El sistema envía: { html, subject, to, filename }
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var to = String(d.to || '').trim();
    if (!to) throw new Error('Faltan los destinatarios');
    var html = String(d.html || '');
    var pdf = Utilities.newBlob(html, 'text/html', 'arqueo.html')
      .getAs('application/pdf')
      .setName(d.filename || 'arqueo.pdf');
    MailApp.sendEmail({
      to: to,
      subject: d.subject || 'Arqueo de caja',
      htmlBody: html,
      attachments: [pdf],
      name: 'NUMMEROS · Arqueos GrupoVelasco'
    });
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err);
  }
}

// Ejecuta esta función UNA vez con el botón "Ejecutar": pide el permiso para
// enviar correos y te manda un correo de prueba a ti mismo.
function probarCorreoArqueos() {
  var yo = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(yo, 'PRUEBA - Correo de arqueos GrupoVelasco', 'El permiso para enviar correos quedó autorizado.');
  Logger.log('Correo de prueba enviado a ' + yo + '. Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota());
}
