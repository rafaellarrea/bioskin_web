# BIOSKIN Website - AI Developer Guide

## Project Overview
BIOSKIN is a medical aesthetics clinic website built with **React 18 + TypeScript + Vite + TailwindCSS**. The site showcases aesthetic treatments, medical equipment, and allows appointment booking with Google Calendar integration.

## Architecture & Key Patterns

### Core Structure
- **Frontend**: React SPA with HashRouter (required for Vercel deployment without server-side routing)
- **Backend**: Vercel serverless functions in `/api/` for email/calendar integration
- **Styling**: TailwindCSS with custom gold theme (`#deb887`) and Poppins/Playfair Display fonts
- **State Management**: Component-level state only, no external state management

### Critical File Organization
```
src/
├── data/products.ts          # Central product catalog (1000+ lines, structured equipment/cosmetics)
├── pages/                    # Route components
├── components/               # Reusable UI components
├── utils/slugify.ts          # URL slug generation for product routing
public/images/                # Organized by feature: productos/, services/, results/
api/                          # Vercel serverless functions
```

### Product System Architecture
Products are centrally defined in `src/data/products.ts` with this structure:
```typescript
{
  name: string;
  shortDescription: string;
  description: string;
  details: string[];
  specifications: Record<string, string>;
  indications: string[];
  price: string;
  images: string[];
  category: "equipment" | "cosmetic";
}
```

**Critical Routing Pattern**: Product routes must maintain this order in `App.tsx`:
```tsx
<Route path="/products/aparatologia" element={<Products initialCategory="equipment" />} />
<Route path="/products/cosmeticos" element={<Products initialCategory="cosmetic" />} />
<Route path="/products/:slug" element={<ProductDetail />} />
<Route path="/products" element={<Products />} />
```

### Development Workflow Conventions

#### Backup File Pattern
The codebase uses `*backup.tsx` files for version control during development:
- Keep backup versions when making significant component changes
- Files like `Navbarbackup.tsx`, `ProductCardbackup.tsx` exist for rollback capability

#### Image Path Convention
All images use absolute paths from `/public/images/`:
```
/images/productos/dispositivos/[device-type]/
/images/productos/cosmeticos/
/images/services/[service-name]/
/images/results/[treatment-type]/
```

### Integration Points

#### Google Services Integration
- **Calendar API**: `/api/getEvents.js` - fetches occupied time slots
- **Email**: `/api/sendEmail.js` - sends confirmation emails and WhatsApp notifications
- **Environment**: Requires `GOOGLE_CREDENTIALS_BASE64` and email credentials

#### WhatsApp Integration Pattern
Email API automatically generates WhatsApp messages with this format:
```javascript
const whatsappMessage = `Hola ${paciente}, ¡gracias por agendar tu cita en BIOSKIN! 🧴✨\n` +
  `Hemos recibido tu solicitud para el servicio "${tratamiento}".\n`;
```

### Component Patterns

#### ImageCarousel Component
Standardized carousel for product/service images with consistent `height` prop:
```tsx
<ImageCarousel images={images} folderPath="" height="h-48" />
```

#### Responsive Design
Uses TailwindCSS with mobile-first approach and custom container class `container-custom`.

### Build & Deployment
- **Dev**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (outputs to `dist/`)
- **Deploy**: Vercel with SPA routing via `vercel.json` rewrites
- **Linting**: ESLint with React hooks and TypeScript rules

## Configuración de OpenAI (API Key)
- Variable requerida: `OPENAI_API_KEY` (no usar prefijo `VITE_` para evitar exponerla en el cliente).
- Dónde se usa: `lib/ai-service.js` vía `process.env.OPENAI_API_KEY`, consumido por la función serverless `api/ai-blog/generate.js`.

### Local (desarrollo)
- Crear un archivo `.env` en la raíz (o copiar desde `.env.example`) y completar:
  - `OPENAI_API_KEY=sk-...`
- Asegúrate de ejecutar el entorno que levanta funciones serverless con variables de entorno cargadas (p. ej. `vercel dev`), o exporta la variable en la sesión:
  - PowerShell: `$env:OPENAI_API_KEY="sk-..."` antes de iniciar el dev server que ejecute las APIs.

Nota: El Vite dev server por sí solo no ejecuta las funciones; las variables se consumen en los handlers de `/api/*`.

### Producción (Vercel)
- En el dashboard de Vercel: Project → Settings → Environment Variables → agregar `OPENAI_API_KEY`.
- Re-deploy para que la función `api/ai-blog/generate.js` tome el valor.

### Validación rápida
- Endpoint: `POST /api/ai-blog/generate` con JSON `{ "category": "medico-estetico" }`.
- Si falta la clave, verás el error: "Configuración de IA no válida. Verificar OPENAI_API_KEY".

### Seguridad
- No expongas la clave en el frontend ni la nombres `VITE_OPENAI_KEY`.
- `.gitignore` ya excluye `.env`; no subir secretos al repo.

### Git Workflow
**ALWAYS** after making any changes to the codebase, execute the following Git commands to save changes to the repository:
```bash
git add .
git commit -m "Descriptive commit message"
git push
```
This ensures all changes are properly tracked and synchronized with the remote repository.

### Spanish Language
All user-facing content is in Spanish. Maintain Spanish naming conventions for components, routes, and content.

**IMPORTANT**: Always respond to the user in Spanish, as this is a Spanish-language project for a medical clinic in a Spanish-speaking region.

### Critical Dependencies
- `react-router-dom ^7.6.0` with HashRouter
- `lucide-react` for icons (excluded from Vite optimization)
- `googleapis` for Google Calendar/Email integration
- `nodemailer` for email sending

When adding new products, update `src/data/products.ts` and ensure images follow the established directory structure.
