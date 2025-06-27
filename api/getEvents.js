import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Método no permitido");

  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Fecha requerida" });

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  //fecha y hora enviados 
  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;

  const events = await calendar.events.list({
    calendarId: credentials.calendar_id,
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
  });

  const occupied = events.data.items.map((e) => ({
    start: e.start.dateTime,
    end: e.end.dateTime,
  }));

  res.status(200).json({ occupiedTimes: occupied });
}
