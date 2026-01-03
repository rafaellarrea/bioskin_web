# Internal Virtual Assistant Implementation

## Overview
The internal chatbot (`api/internal-chat.js`) has been enhanced to serve as an **Internal Virtual Assistant** for Bioskin staff. It leverages Gemini AI, Google Calendar, and the Promotions system to provide real-time information.

## Features

### 1. Assistant Mode
- **Endpoint**: `POST /api/internal-chat`
- **Body**: `{ "message": "...", "sessionId": "...", "mode": "assistant" }`
- **Functionality**: Acts as a knowledgeable assistant about Bioskin, not a drafting tool.

### 2. Integrations
- **Google Calendar**: Automatically fetches upcoming events (next 48h) when the user asks about "agenda", "citas", "horarios", etc.
- **Promotions**: Automatically fetches active promotions when the user asks about "promociones", "ofertas", "precios".
- **Bioskin Info**: Has built-in context about location, director, and general specialty.

### 3. Storage Optimization (Neon)
- **Schema**: Uses relational `chat_messages` table (one row per message) to avoid JSONB row limits.
- **Cleanup**: Automatically deletes internal conversations older than 24 hours to preserve storage space on the Neon free tier.
- **Context Limit**: Only sends the last 10 messages to Gemini to save tokens and bandwidth.

## Usage Example

```javascript
const response = await fetch('/api/internal-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "¿Qué tenemos en agenda para mañana?",
    sessionId: "internal_user_123",
    mode: "assistant"
  })
});
```

## Configuration
- **Gemini**: Uses `GOOGLE_GEMINI_API_KEY` or `GEMINI_API_KEY`.
- **Calendar**: Uses `GOOGLE_CREDENTIALS_BASE64`.
