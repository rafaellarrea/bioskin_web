# BIOSKIN Website - Arquitectura del Proyecto

## 🏗️ Resumen Ejecutivo

**BIOSKIN** es una aplicación web SPA para medicina estética con sistema de blogs IA, catálogo de productos, integración Google Calendar y generación automatizada de contenido médico-técnico.

**Stack Principal**: React 18 + TypeScript + Vite + TailwindCSS + SQLite + OpenAI
**Deployment**: Vercel Serverless + SPA HashRouter
**Estado**: ✅ Producción con desarrollo activo

---

## 📁 Estructura de Directorios

```
project2.0/
├── src/                          # Frontend React
│   ├── pages/                    # Componentes de página
│   ├── components/               # Componentes reutilizables
│   ├── data/                     # Datos centralizados
│   └── utils/                    # Utilidades helper
├── api/                          # Vercel Serverless Functions
│   ├── ai-blog/                  # Endpoints generación IA
│   ├── clinical-records.js       # Endpoint Fichas Clínicas (Neon DB)
│   ├── search.js                 # Endpoint búsqueda IA
│   ├── getEvents.js             # Google Calendar API
│   └── sendEmail.js             # Email/WhatsApp integration
├── lib/                          # Lógica de negocio
│   ├── neon-clinical-db.js      # Neon PostgreSQL connection
│   ├── database.js              # SQLite management
│   └── ai-service.js            # OpenAI integration
├── public/                       # Assets estáticos
│   └── images/                   # Imágenes organizadas por feature
├── data/                        # Base de datos SQLite
├── PROGRESS.md                   # Historial desarrollo proyecto
└── ARCHITECTURE.md              # Documentación arquitectura técnica
```

---

## 🎯 Componentes Principales

### **Frontend Core**

#### **Routing System**
```typescript
// App.tsx - HashRouter para compatibilidad Vercel SPA
<Route path="/products/aparatologia" element={<Products initialCategory="equipment" />} />
<Route path="/products/cosmeticos" element={<Products initialCategory="cosmetic" />} />
<Route path="/products/:slug" element={<ProductDetail />} />  // ⚠️ Order critical
<Route path="/blogs" element={<Blogs />} />
<Route path="/blogs/:slug" element={<BlogDetail />} />
```

#### **Product System**
```typescript
// src/data/products.ts - Central catalog (1000+ lines)
interface Product {
  name: string;
  category: "equipment" | "cosmetic";
  specifications: Record<string, string>;
  indications: string[];
  images: string[];
}

// src/utils/slugify.ts - URL generation
// src/pages/ProductDetail.tsx - Dynamic product pages
```

#### **Blog System with AI**
```typescript
// AI Blog Generation (v2.0 - Production Ready)
api/ai-blog/generate.js      // Main generation endpoint
api/ai-blog/generate-safe.js // Robust version with fallback
api/blogs/test.js            // System diagnostic endpoint

// Core AI Services
lib/ai-service.js            // OpenAI integration + specialized prompts
lib/database.js              // SQLite with weekly controls

// Database Schema
data/blogs.db                // SQLite: blogs, tags, citations, blog_tags
```

### **Backend Architecture**

#### **API Endpoints**
```javascript
// AI Blog Generation
api/ai-blog/generate.js      // POST - Generate blog with weekly limits
api/ai-blog/generate-safe.js // POST - Safe generation with fallback  
api/ai-blog/stats.js         // GET  - Weekly statistics and limits
api/blogs/test.js            // GET  - System diagnostic

// Calendar & Email Integration
api/getEvents.js          // GET  - Google Calendar events
api/sendEmail.js          // POST - Email + WhatsApp notifications

// WhatsApp Chatbot with AI (Noviembre 2025)
api/whatsapp-chatbot.js   // GET/POST - Webhook for WhatsApp Business API
api/chatbot-stats.js      // GET/POST - Monitoring and maintenance
api/chatbot-settings.js   // GET/POST - Global chatbot configuration (toggle)
```

#### **Database Layer**
```javascript
// lib/database.js - SQLite with better-sqlite3 (Blogs system)
Tables:
- blogs (id, title, content, blog_type, week_year, is_ai_generated)
- tags (id, name)
- blog_tags (blog_id, tag_id)  // Many-to-many relation

// lib/neon-chatbot-db.js - Neon PostgreSQL (Chatbot system)
Tables:
- chat_conversations (id, session_id, phone_number, last_message_at, total_messages)
- chat_messages (id, session_id, role, content, tokens_used, timestamp)
```

#### **AI Service**
```javascript
// lib/ai-service.js - OpenAI GPT-4o-mini integration (Blogs)
Features:
- Weekly limits control (2 blogs/week: 1 medical + 1 technical)
- Structured prompts (500-700 words)
- Content validation and formatting

// lib/chatbot-ai-service.js - OpenAI GPT-4o-mini integration (Chatbot)
Features:
- Conversational responses with context history
- Intent detection and custom prompts
- Token optimization (max 500 tokens/response)

// lib/chatbot-cleanup.js - Automatic data maintenance
Features:
- Storage monitoring (512 MB limit on Neon free plan)
- Auto-cleanup of old conversations (>30 days)
- Session trimming (max 50 messages/session)
```

---

## 🔧 Patrones de Diseño

### **Data Management**
- **Centralized Products**: Single source of truth in `src/data/products.ts`
  - Equipment & cosmetics catalog
  - Backend adapter: `lib/products-adapter.js`
  - Used by web + chatbot
- **Centralized Services**: Single source of truth in `src/data/services.ts` ✨ NEW
  - 18 medical-aesthetic services
  - Backend adapter: `lib/services-adapter.js`
  - Replaces duplicate treatments-data.js
  - Used by Services.tsx + WhatsApp chatbot
- **Component State**: No external state management (React local state)
- **Database Queries**: Prepared statements with better-sqlite3
- **API Integration**: Custom hooks pattern

### **File Organization**
- **Backup Pattern**: `*backup.tsx` files for version control
- **Image Convention**: Absolute paths from `/public/images/`
- **Slug Generation**: Consistent URL generation with `slugify.ts`
- **Adapter Pattern**: `lib/*-adapter.js` reads from `src/data/*.ts` (web source)

### **Error Handling**
- **API Validation**: Input validation + error responses
- **Database Transactions**: Safe operations with rollback
- **AI Limits**: Weekly quota enforcement with graceful degradation

---

## 🌐 Integrations & APIs

### **Google Services**
```javascript
// Google Calendar API
- Service account authentication (GOOGLE_CREDENTIALS_BASE64)
- Event fetching for appointment availability
- Calendar integration for booking system

// Gmail API
- Automatic email confirmations
- WhatsApp message generation
- Appointment notifications
```

### **OpenAI Integration**
```javascript
// GPT-4o-mini for content generation
Model: gpt-4o-mini
Usage: Blog content generation with structured prompts
Limits: 2 requests/week (1 medical + 1 technical)
Output: 500-700 words structured content
```

### **Vercel Deployment**
```javascript
// SPA Configuration
- HashRouter for client-side routing
- Serverless functions for API
- Environment variables management
- Static asset optimization
```

---

## 🎨 Design System

### **Theme Configuration**
```css
/* TailwindCSS Custom Theme */
Primary Color: #deb887 (Gold)
Fonts: Poppins (sans), Playfair Display (serif)
Container: container-custom class
Responsive: Mobile-first approach
```

### **Component Library**
```typescript
// Reusable Components
- ImageCarousel: Product/service image display
- ProductCard: Product grid item
- BlogCard: Blog listing item
- ServiceCard: Service showcase
- TestimonialCard: Customer testimonials
- BlogAdmin: Complete admin interface for AI blog generation
- BlogAdminPage: Admin page wrapper with navigation

// Custom Hooks
- useBlogAdmin: State management for blog administration
```

---

## 📊 Data Flow Architecture

```
User Request → HashRouter → Page Component → Custom Hook → API Call → Database → Response → UI Update

Example Blog Generation:
1. UI (test-openai.html) → 
2. POST /api/ai-blog/generate → 
3. checkWeeklyLimits() → 
4. generateBlogWithAI() → 
5. SQLite INSERT → 
6. Response with blog data
```

---

## 🔐 Security & Environment

### **Environment Variables**
```bash
# Development (.env)
OPENAI_API_KEY=sk-proj-...                    # AI blog generation & chatbot
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlI...    # Calendar integration
EMAIL_USER=salud.bioskin@gmail.com           # Email notifications
EMAIL_PASS=osplvayjwkiqbxfe                  # Gmail app password

# Chatbot Variables (Noviembre 2025)
NEON_DATABASE_URL=postgresql://user:pass@...  # Neon PostgreSQL connection
WHATSAPP_VERIFY_TOKEN=tu_token_secreto        # Webhook verification
WHATSAPP_ACCESS_TOKEN=EAAxxxxx                # WhatsApp Business API token
WHATSAPP_PHONE_NUMBER_ID=123456789            # WhatsApp Business phone ID

# Production (Vercel Dashboard)
# Same variables configured in Vercel environment settings
```

### **API Security**
- Input validation on all endpoints
- Rate limiting via weekly quotas
- Environment variable encryption
- CORS configuration for SPA

---

## 📈 Performance Optimizations

### **Build Optimization**
- Vite for fast development and optimized builds
- TailwindCSS purging for reduced bundle size
- Dynamic imports for code splitting
- Image optimization with absolute paths

### **Database Performance**
- SQLite with prepared statements
- Indexed queries for blog filtering
- Minimal table joins
- Efficient pagination support

---

## 🧪 Testing Strategy

### **Development Testing**
- `/test-openai.html` - AI system testing interface
- Manual testing with forceGeneration flag
- Weekly limits validation
- API endpoint verification

### **Quality Assurance**
- TypeScript compilation checks
- ESLint rules enforcement
- Git pre-commit validation
- Manual feature testing

---

## 🚀 Deployment Pipeline

```
Development → Git Commit → GitHub Push → Vercel Auto-Deploy → Production

Environment Setup:
1. Local: npm run dev (Vite server + API functions)
2. Production: Vercel SPA + Serverless Functions
3. Database: SQLite file in project directory
4. Assets: Vercel CDN for static files
```

---

## 📝 Key Architectural Decisions

### **Technology Choices**
- **React 18**: Modern React with TypeScript for type safety
- **Vite**: Fast development and optimized builds vs Create React App
- **HashRouter**: Client-side routing without server configuration
- **SQLite**: Embedded database for simplicity vs external DB
- **Vercel**: Serverless deployment vs traditional hosting

### **Design Patterns**
- **Component-level state**: Avoiding complexity of external state management
- **Custom hooks**: Reusable data fetching logic
- **Prepared statements**: Database performance and security
- **Backup files**: Version control at file level vs Git branches
- **Custom image management**: Optional imagenPrincipal/imagenConclusion fields for manual content control
- **Multi-source blog management**: Combines server memory + localStorage + static data for complete blog control

---

**Arquitectura actualizada**: 16 Octubre 2025  
**Próxima revisión**: Tras integración UI blogs final