export default async function handler(req, res) {
  const envCheck = {
    NODE_VERSION: process.version,
    CRON_SECRET_EXISTS: !!process.env.CRON_SECRET,
    GOOGLE_CREDENTIALS_EXISTS: !!process.env.GOOGLE_CREDENTIALS_BASE64,
    GOOGLE_CREDENTIALS_LENGTH: process.env.GOOGLE_CREDENTIALS_BASE64 ? process.env.GOOGLE_CREDENTIALS_BASE64.length : 0,
    OPENAI_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
    GEMINI_KEY_EXISTS: !!process.env.GOOGLE_GEMINI_API_KEY,
    POSTGRES_URL_EXISTS: !!process.env.POSTGRES_URL,
  };

  // Try to parse credentials safely
  try {
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
      JSON.parse(decoded);
      envCheck.GOOGLE_CREDENTIALS_VALID_JSON = true;
    }
  } catch (e) {
    envCheck.GOOGLE_CREDENTIALS_VALID_JSON = false;
    envCheck.GOOGLE_CREDENTIALS_ERROR = e.message;
  }

  res.status(200).json(envCheck);
}
