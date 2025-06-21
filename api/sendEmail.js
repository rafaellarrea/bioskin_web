
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // correo a equipo BIOSKIN:
await transporter.sendMail({
  from: `Formulario BIOSKIN <${process.env.EMAIL_USER}>`,
  to: `${process.env.EMAIL_TO}, salud.bioskin@gmail.com, rafa1227_g@hotmail.com, dannypau.95@gmail.com`,  // Puedes agregar más correos aquí
  subject: 'Nueva cita agendada - BIOSKIN',
  html: `
    <h2 style="color:#ba9256;margin-bottom:4px;">¡Nueva cita agendada!</h2>
    <p>Hola equipo BIOSKIN,<br>
    Se ha registrado una nueva cita desde la web:</p>
    <ul style="margin-bottom:12px;">
      <li><b>Nombre:</b> ${name}</li>
      <li><b>Email:</b> ${email}</li>
    </ul>
    <pre style="font-family:inherit;white-space:pre-wrap;background:#f5f5f5;padding:10px;border-radius:8px;">${message}</pre>
    <p style="margin-top:18px;color:#7a5a30;">Revisa tu Google Calendar para bloquear la agenda.</p>
    <p style="font-size:12px;color:#888;margin-top:14px;">Este mensaje es automático. No respondas a este correo.</p>
  `,
});

// Correo al paciente
await transporter.sendMail({
  from: `BIO SKIN Salud y Estética <${process.env.EMAIL_USER}>`,
  to: email,
  subject: '¡Hemos recibido tu cita en BIOSKIN!',
  html: `
    <div style="font-family:Segoe UI,Arial,sans-serif;">
      <h2 style="color:#ba9256;margin-bottom:4px;">¡Tu cita está en proceso!</h2>
      <p>Hola <b>${name}</b>,<br>
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


    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    const dateMatch = message.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/);
    const timeMatch = message.match(/Hora:\s*(\d{2}:\d{2})/);
    const date = dateMatch ? dateMatch[1] : null;
    const time = timeMatch ? timeMatch[1] : null;

    console.log("📅 Detalles del evento:", { date, time });

    {/*if (date && time) {
      const startDateTime = new Date(`${date}T${time}:00-05:00`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60000);

      console.log("➡️ Intentando crear evento desde:", startDateTime.toISOString());

      await calendar.events.insert({
        calendarId: 'salud.bioskin@gmail.com',
        requestBody: {
          summary: `Cita: ${name} - ${email}`,
          description: message,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
        },
      });

      console.log("✅ Evento creado exitosamente");
    } else {
      console.log("⚠️ No se encontró fecha u hora válida en el mensaje.");
    }
    */}

        // Inserta el evento así:
    if (req.body.start && req.body.end) {
      await calendar.events.insert({
        calendarId: credentials.calendar_id,
        requestBody: {
          summary: `Cita: ${name} - ${email}`,
          description: message,
          start: {
            dateTime: req.body.start,
            timeZone: "America/Guayaquil"
          },
          end: {
            dateTime: req.body.end,
            timeZone: "America/Guayaquil"
          }
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
