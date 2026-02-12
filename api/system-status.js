
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query; // 'calendar' or 'email'
  const logs = [];
  const log = (msg) => logs.push(msg);

  try {
    if (type === 'calendar') {
        log('🔍 Iniciando diagnóstico de conexión Google Calendar...');
        const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
        
        if (!credentialsBase64) {
          log('❌ ERROR: GOOGLE_CREDENTIALS_BASE64 faltante.');
          throw new Error('Missing Credentials');
        }

        const credentials = JSON.parse(
          Buffer.from(credentialsBase64, 'base64').toString('utf8')
        );
        log(`ℹ️ Service Account: ${credentials.client_email}`);

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          },
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        // Simular obtención de cliente (no hace llamada real a menos que listes eventos)
        google.calendar({ version: 'v3', auth });
        log('✅ Cliente instanciado y credenciales válidas en estructura.');
        
        return res.status(200).json({ success: true, logs });

    } else if (type === 'email') {
        log('📧 Iniciando diagnóstico SMTP...');
        const host = process.env.EMAIL_HOST;
        
        if (!host || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            log('Configuración incompleta.');
            throw new Error('Faltan variables SMTP');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: { rejectUnauthorized: false }
        });

        await transporter.verify();
        log('✅ Conexión SMTP verificada exitosamente.');
        return res.status(200).json({ success: true, logs });

    } else {
        return res.status(400).json({ error: 'Invalid type parameter. Use ?type=calendar or ?type=email' });
    }

  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    return res.status(200).json({ success: false, logs, error: error.message, code: error.code });
  }
}
