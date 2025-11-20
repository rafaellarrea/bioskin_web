
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { 
    name, 
    email, 
    message, 
    start, 
    end, 
    service, 
    phone,
    notificationType, // 'appointment', 'chatbot_new_conversation', 'chatbot_reactivation', 'chatbot_appointment'
    inactivityMinutes // para reactivaciones
  } = req.body;

  // ============================================
  // CASO 1: NOTIFICACIÓN DE NUEVA CONVERSACIÓN
  // ============================================
  if (notificationType === 'chatbot_new_conversation') {
    const phoneClean = phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${phoneClean}`;
    const adminPanel = 'https://saludbioskin.vercel.app/chatbot-manager.html';
    const messagePreview = message.length > 150 ? message.substring(0, 150) + '...' : message;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `Chatbot BIOSKIN <${process.env.EMAIL_USER}>`,
        to: 'salud.bioskin@gmail.com, rafa1227_g@hotmail.com, dannypau.95@gmail.com',
        subject: '🆕 Nueva conversación en WhatsApp - BIOSKIN Chatbot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ba9256 0%, #d4af37 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">🆕 Nueva Conversación</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ba9256;">
                <p style="margin: 8px 0;"><strong>📱 Teléfono:</strong> <a href="${whatsappLink}" style="color: #25D366;">${phone}</a></p>
                <p style="margin: 8px 0;"><strong>💬 Mensaje:</strong></p>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; margin-top: 8px;">
                  <p style="margin: 0; white-space: pre-wrap;">${messagePreview}</p>
                </div>
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 5px;">💬 Responder en WhatsApp</a>
                <a href="${adminPanel}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 5px;">📊 Ver Panel Admin</a>
              </div>
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">Notificación automática del chatbot BIOSKIN</p>
            </div>
          </div>
        `
      });
      return res.status(200).json({ success: true, message: 'Notificación enviada' });
    } catch (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================
  // CASO 2: REACTIVACIÓN DE CONVERSACIÓN
  // ============================================
  if (notificationType === 'chatbot_reactivation') {
    const phoneClean = phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${phoneClean}`;
    const adminPanel = 'https://saludbioskin.vercel.app/chatbot-manager.html';
    const messagePreview = message.length > 150 ? message.substring(0, 150) + '...' : message;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `Chatbot BIOSKIN <${process.env.EMAIL_USER}>`,
        to: 'salud.bioskin@gmail.com, rafa1227_g@hotmail.com, dannypau.95@gmail.com',
        subject: `🔔 Conversación reactivada (${inactivityMinutes} min) - BIOSKIN Chatbot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ba9256 0%, #d4af37 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">🔔 Conversación Reactivada</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                <strong>⏰ Cliente volvió después de ${inactivityMinutes} minutos de inactividad</strong>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ba9256;">
                <p style="margin: 8px 0;"><strong>📱 Teléfono:</strong> <a href="${whatsappLink}" style="color: #25D366;">${phone}</a></p>
                <p style="margin: 8px 0;"><strong>💬 Mensaje:</strong></p>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; margin-top: 8px;">
                  <p style="margin: 0; white-space: pre-wrap;">${messagePreview}</p>
                </div>
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 5px;">💬 Responder en WhatsApp</a>
                <a href="${adminPanel}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 5px;">📊 Ver Panel Admin</a>
              </div>
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">Notificación automática del chatbot BIOSKIN</p>
            </div>
          </div>
        `
      });
      return res.status(200).json({ success: true, message: 'Notificación enviada' });
    } catch (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================
  // CASO 3: AGENDAMIENTO DESDE CHATBOT
  // ============================================
  if (notificationType === 'chatbot_appointment') {
    const phoneClean = phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${phoneClean}`;
    
    const dateObj = new Date(message + 'T00:00:00-05:00');
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'America/Guayaquil'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `Agendamiento BIOSKIN <${process.env.EMAIL_USER}>`,
        to: 'salud.bioskin@gmail.com, rafa1227_g@hotmail.com, dannypau.95@gmail.com',
        subject: `🗓️ Nueva cita agendada - ${name} (${dateFormatted})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="margin: 0; font-size: 28px;">🗓️ ¡Nueva Cita Agendada!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                <h3 style="color: #28a745; margin-top: 0;">Detalles de la Cita</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>👤 Paciente:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${name}</td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📱 Teléfono:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="${whatsappLink}" style="color: #25D366;">${phone}</a></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>💆 Tratamiento:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${service}</td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>📅 Fecha:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${dateFormatted}</td></tr>
                  <tr><td style="padding: 10px 0;"><strong>⏰ Hora:</strong></td><td style="padding: 10px 0;">${email}</td></tr>
                </table>
              </div>
              <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0;"><strong>📌 Recordatorio:</strong> Esta cita ya fue creada en Google Calendar automáticamente.</p>
              </div>
              <div style="text-align: center;">
                <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 8px;">💬 Contactar Paciente</a>
                <a href="https://calendar.google.com" style="display: inline-block; background: #4285F4; color: white; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 8px;">📅 Ver Calendar</a>
              </div>
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px;">Cita agendada a través del chatbot de WhatsApp</p>
            </div>
          </div>
        `
      });
      return res.status(200).json({ success: true, message: 'Notificación enviada' });
    } catch (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================
  // CASO 4: AGENDAMIENTO NORMAL (flujo original)
  // ============================================
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  // --- Limpia número de teléfono ---
  const phoneClean = phone
    ? phone.replace(/[\s\-+]/g, "").replace(/^0/, "")
    : (message.match(/Teléfono:\s*([\d+\- ]+)/)?.[1] || "").replace(/[\s\-+]/g, "").replace(/^0/, "");

  // --- Extrae datos para WhatsApp cordial ---
  const paciente = name || 'Paciente';
  const tratamiento = service || (message.match(/Servicio:\s*([^\n]+)/)?.[1] || "Tratamiento");
  const fecha = (message.match(/Fecha:\s*([^\n]+)/)?.[1] || "");
  const hora = (message.match(/Hora:\s*([^\n]+)/)?.[1] || "");

  // --- Mensaje cordial para WhatsApp ---
  const whatsappMessage =
    `Hola ${paciente}, ¡gracias por agendar tu cita en BIOSKIN! 🧴✨\n` +
    `Hemos recibido tu solicitud para el servicio “${tratamiento}”.\n` +
    (fecha && hora ? `Tu cita está programada para el ${fecha} a las ${hora} en nuestro consultorio Bioskin Cuenca.\n` : "") +
    `Si tienes alguna consulta, no dudes en responder este mensaje.\n` +
    `¡Nos vemos pronto!\n\n` +
    `— El equipo de BIOSKIN Salud y Estética`;

  const whatsappLink = phoneClean
    ? `https://wa.me/593${phoneClean}?text=${encodeURIComponent(whatsappMessage)}`
    : "";

  // --- Nodemailer setup ---
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // --- 1. ENVÍA CORREO AL STAFF BIOSKIN CON BOTÓN WHATSAPP ---
    await transporter.sendMail({
      from: `Formulario BIOSKIN <${process.env.EMAIL_USER}>`,
      to: `${process.env.EMAIL_TO}, salud.bioskin@gmail.com, rafa1227_g@hotmail.com, dannypau.95@gmail.com`,
      subject: 'Nueva cita agendada - BIOSKIN',
      html: `
        <h2 style="color:#ba9256;margin-bottom:4px;">¡Nueva cita agendada!</h2>
        <p>Hola equipo BIOSKIN,<br>
        Se ha registrado una nueva cita desde la web:</p>
        <ul style="margin-bottom:12px;">
          <li><b>Nombre:</b> ${paciente}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Teléfono:</b> ${phoneClean || "No registrado"}</li>
          <li><b>Servicio:</b> ${tratamiento}</li>
          <li><b>Fecha:</b> ${fecha}</li>
          <li><b>Hora:</b> ${hora}</li>
        </ul>
        <pre style="font-family:inherit;white-space:pre-wrap;background:#f5f5f5;padding:10px;border-radius:8px;">${message}</pre>
        ${
          whatsappLink
            ? `<a href="${whatsappLink}" 
                  style="display:inline-block;background:#25D366;color:#fff;padding:10px 22px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px;"
                  target="_blank">
                Contactar por WhatsApp
              </a>`
            : ""
        }
        <p style="margin-top:18px;color:#7a5a30;">Revisa tu Google Calendar para bloquear la agenda.</p>
        <p style="font-size:12px;color:#888;margin-top:14px;">Este mensaje es automático. No respondas a este correo.</p>
      `,
    });

    // --- 2. ENVÍA CORREO AL PACIENTE (sin botón WhatsApp) ---
    await transporter.sendMail({
      from: `BIO SKIN Salud y Estética <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "¡Hemos recibido tu cita en BIOSKIN!",
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;">
          <h2 style="color:#ba9256;margin-bottom:4px;">¡Tu cita está en proceso!</h2>
          <p>Hola <b>${paciente}</b>,<br>
          Gracias por confiar en <b>BIO SKIN Salud y Estética</b>. Hemos recibido tu solicitud y la estamos procesando.</p>
          <h4 style="margin-top:18px;">Resumen de tu solicitud:</h4>
          <pre style="font-family:inherit;white-space:pre-wrap;background:#f5f5f5;padding:10px;border-radius:8px;">${message}</pre>
          <p style="margin-top:18px;">
            En breve nos contactaremos para confirmarte la hora exacta y resolver cualquier duda.<br>
            <b>Si tienes alguna consulta, puedes responder a este email o escribirnos por WhatsApp.</b>
          </p>
          <p style="margin-top:30px;font-size:15px;">— El equipo de <b>BIOSKIN</b> Cuenca</p>
          <img src="https://saludbioskin.vercel.app/images/logo_bioskin.png" style="height:36px;margin-top:18px;" alt="BIOSKIN logo"/>
        </div>
      `,
    });

    // --- 3. CREA EVENTO EN GOOGLE CALENDAR ---
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    if (start && end) {
      await calendar.events.insert({
        calendarId: credentials.calendar_id,
        requestBody: {
          summary: `Cita: ${paciente} - ${email}`,
          description: message,
          start: { dateTime: start, timeZone: "America/Guayaquil" },
          end: { dateTime: end, timeZone: "America/Guayaquil" }
        }
      });
      console.log("✅ Evento creado exitosamente");
    } else {
      console.log("⚠️ No se encontró fecha u hora válida en el body.");
    }

    return res.status(200).json({ success: true, message: 'Todo enviado y registrado con éxito' });

  } catch (err) {
    console.error('❌ Error al procesar la solicitud:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
}
