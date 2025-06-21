import nodemailer from "nodemailer";
import credentials from "../../credentials.json";
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }
  const { name, email, message, start, end, service } = req.body;

  // --- Setup Google Calendar ---
  const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );
  oAuth2Client.setCredentials({ refresh_token: credentials.refresh_token });
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // --- Extrae y limpia el número de teléfono ---
  const phoneClean = (() => {
    // Intenta obtener de req.body directamente
    if (req.body.phone) {
      return req.body.phone.replace(/[\s\-+]/g, "").replace(/^0/, "");
    }
    // Si no, busca en el message
    const match = message.match(/Teléfono:\s*([\d+\- ]+)/);
    return match ? match[1].replace(/[\s\-+]/g, "").replace(/^0/, "") : "";
  })();

  // --- Extrae datos para mensaje de WhatsApp ---
  const paciente = name || 'Paciente';
  // El servicio puede venir directo en body, o buscar en message
  const tratamiento =
    service ||
    ((message.match(/Servicio:\s*([^\n]+)/) || [])[1] || "Tratamiento");
  const fecha = (message.match(/Fecha:\s*([^\n]+)/) || [])[1] || "";
  const hora = (message.match(/Hora:\s*([^\n]+)/) || [])[1] || "";

  // --- Mensaje de WhatsApp cordial y personalizado ---
  const whatsappMessage =
    `Hola ${paciente}, ¡gracias por agendar tu cita en BIOSKIN! 🧴✨\n` +
    `Hemos recibido tu solicitud para el servicio “${tratamiento}”.\n` +
    (fecha && hora
      ? `Tu cita está programada para el ${fecha} a las ${hora} en nuestro consultorio Bioskin Cuenca.\n`
      : "") +
    `Si tienes alguna consulta, no dudes en responder este mensaje.\n` +
    `¡Nos vemos pronto!\n\n` +
    `— El equipo de BIOSKIN Salud y Estética`;

  const whatsappLink = phoneClean
    ? `https://wa.me/593${phoneClean}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "";

  // --- Nodemailer setup ---
  const transporter = nodemailer.createTransport({
    service: "gmail",
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
      subject: "Nueva cita agendada - BIOSKIN",
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
    if (start && end) {
      await calendar.events.insert({
        calendarId: credentials.calendar_id,
        requestBody: {
          summary: `Cita: ${paciente} - ${email}`,
          description: message,
          start: {
            dateTime: start,
            timeZone: "America/Guayaquil",
          },
          end: {
            dateTime: end,
            timeZone: "America/Guayaquil",
          },
        },
      });
      console.log("✅ Evento creado exitosamente");
    } else {
      console.log("⚠️ No se encontró fecha u hora válida en el body.");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({ success: false, error: "Error al enviar el correo" });
  }
}
