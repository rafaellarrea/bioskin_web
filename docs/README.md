# 🧴 BIOSKIN Website

> Sistema web avanzado para clínica de medicina estética con catálogo de productos, sistema de citas y generación automática de blogs con IA.

## 🚀 Tecnologías

**Frontend**: React 18 + TypeScript + Vite + TailwindCSS  
**Backend**: Vercel Serverless Functions + SQLite  
**AI**: OpenAI GPT-4o-mini para generación de contenido  
**Integraciones**: Google Calendar + Gmail APIs  

## 📁 Estructura Principal

```
src/
├── pages/          # Componentes de página (Products, Blogs, etc.)
├── components/     # Componentes reutilizables
├── data/          # Catálogo centralizado de productos
└── utils/         # Utilidades y helpers

api/               # Endpoints Vercel Serverless
├── ai-blog/       # Generación de blogs con IA
├── getEvents.js   # Google Calendar API
└── sendEmail.js   # Notificaciones email/WhatsApp

lib/               # Lógica de negocio
├── database.js    # Gestión SQLite
└── ai-service.js  # Integración OpenAI
```

## 🎯 Características Principales

### ✅ Sistema de Productos
- Catálogo completo equipamiento médico-estético + cosmético
- Routing dinámico con slugs SEO-friendly
- Carrusel de imágenes optimizado

### ✅ Sistema de Citas
- Integración Google Calendar en tiempo real
- Envío automático confirmaciones email + WhatsApp
- Gestión disponibilidad horaria

### ✅ Blogs con IA v2.0
- **Control límites**: Máximo 2 blogs/semana (1 técnico + 1 médico estético)
- **Prompts estructurados**: Contenido consistente 500-700 palabras
- **Base de datos SQLite**: Control semanal automático
- **Interface admin**: Página testing con estado visual

## 🛠️ Desarrollo

### Requisitos
- Node.js 18+
- Variables de entorno configuradas

### Setup Local
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Completar con credenciales reales

# Iniciar desarrollo
npm run dev
# Servidor en http://localhost:5173

# Probar sistema IA
# Ir a http://localhost:5173/test-openai.html
```

### Variables de Entorno
```env
# OpenAI (Sistema de blogs IA)
OPENAI_API_KEY=sk-proj-...

# Google Services (Sistema citas)
GOOGLE_CREDENTIALS_BASE64=...
EMAIL_USER=...
EMAIL_PASS=...
```

## 📊 Estado Actual

**✅ Producción**: Sistema completo desplegado en Vercel  
**🔄 Desarrollo**: Mejoras continuas y nuevas funcionalidades  

### Funcionalidades Implementadas
- [x] Sistema productos completo
- [x] Integración Google Calendar/Email
- [x] Blogs con IA v2.0 + control límites
- [x] Documentación técnica completa

### Próximas Mejoras
- [ ] UI final sistema blogs
- [ ] Optimizaciones performance
- [ ] SEO enhancement

## 📚 Documentación

- **[PROGRESS.md](./PROGRESS.md)**: Historial detallado del desarrollo
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Documentación técnica completa
- **[Copilot Instructions](./.github/copilot-instructions.md)**: Guías desarrollo con IA

## 🚀 Deployment

**Producción**: Automático via Vercel desde `main` branch  
**Preview**: Automático en cada PR  

Variables de producción configuradas en Vercel Dashboard.

## 🔧 Stack Completo

```
Frontend:     React 18 + TypeScript + Vite
Styling:      TailwindCSS (#deb887 theme)
Routing:      React Router (HashRouter)
Database:     SQLite + better-sqlite3
AI:           OpenAI GPT-4o-mini
Backend:      Vercel Serverless Functions
Integration:  Google Calendar + Gmail APIs
Deployment:   Vercel SPA + CDN
```

---

**Proyecto**: BIOSKIN Website v2.0  
**Última actualización**: Octubre 2025  
**Desarrollado**: Con asistencia IA (GitHub Copilot)