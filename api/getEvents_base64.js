
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Método no permitido");
  }

  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "Fecha requerida" });
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf8")
    );

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: decoded.client_email,
        private_key: decoded.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const startOfDay = new Date(`${date}T00:00:00-05:00`);
    const endOfDay = new Date(`${date}T23:59:59-05:00`);

    const response = await calendar.events.list({
      calendarId: decoded.calendar_id,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const occupiedTimes = events.map((event) => ({
      start: event.start.dateTime,
      end: event.end.dateTime,
    }));

    res.status(200).json({ occupiedTimes });
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ error: "Error al obtener eventos del calendario" });
  }
}
