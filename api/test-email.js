
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {return res.status(200).end();}

  const logs = [];
  const log = (m) => logs.push(m);

  try {
    log('📧 Iniciando Diagnóstico SMTP...');
    
    // Check Env Vars
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS ? '******' : 'MISSING';
    
    log(`Configuración: Host=${host}, Port=${port}, User=${user}, Pass=${pass}`);
    
    if (!host || !port || !user || !process.env.EMAIL_PASS) {
      throw new Error('Faltan variables de entorno SMTP');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // Intentar match con configuración actual
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    log('🔄 Verificando conexión (transporter.verify)...');
    
    await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
            if (error) {
                log(`❌ Error Verify: ${error.message}`);
                reject(error);
            } else {
                log('✅ Conexión SMTP Exitosa (Server is ready to take our messages)');
                resolve(success);
            }
        });
    });

    return res.status(200).json({
        success: true,
        message: 'Conexión SMTP exitosa',
        logs
    });

  } catch (error) {
    return res.status(500).json({
        success: false,
        message: 'Fallo en conexión SMTP',
        error: error.message,
        code: error.code, // EAUTH, ESOCKET, etc
        response: error.response,
        logs
    });
  }
}
