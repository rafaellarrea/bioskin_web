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
│   ├── getEvents.js             # Google Calendar API
│   └── sendEmail.js             # Email/WhatsApp integration
├── lib/                          # Lógica de negocio
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
// src/pages/Blogs.tsx - Main listing with filters
// src/pages/BlogDetail.tsx - Individual post view
// Custom hooks: useBlogs(), useBlog()
```

### **Backend Architecture**

#### **API Endpoints**
```javascript
// Vercel Serverless Functions
api/ai-blog/generate.js    // POST - Generate blog with AI + limits
api/ai-blog/status.js      // GET  - Weekly quota status
api/getEvents.js          // GET  - Google Calendar events
api/sendEmail.js          // POST - Email + WhatsApp notifications
```

#### **Database Layer**
```javascript
// lib/database.js - SQLite with better-sqlite3
Tables:
- blogs (id, title, content, blog_type, week_year, is_ai_generated)
- tags (id, name)
- blog_tags (blog_id, tag_id)  // Many-to-many relation
```

#### **AI Service**
```javascript
// lib/ai-service.js - OpenAI GPT-4o-mini integration
Features:
- Weekly limits control (2 blogs/week: 1 medical + 1 technical)
- Structured prompts (500-700 words)
- Content validation and formatting
```

---

## 🔧 Patrones de Diseño

### **Data Management**
- **Centralized Products**: Single source of truth in `src/data/products.ts`
- **Component State**: No external state management (React local state)
- **Database Queries**: Prepared statements with better-sqlite3
- **API Integration**: Custom hooks pattern

### **File Organization**
- **Backup Pattern**: `*backup.tsx` files for version control
- **Image Convention**: Absolute paths from `/public/images/`
- **Slug Generation**: Consistent URL generation with `slugify.ts`

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
OPENAI_API_KEY=sk-proj-...                    # AI blog generation
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlI...    # Calendar integration
EMAIL_USER=salud.bioskin@gmail.com           # Email notifications
EMAIL_PASS=osplvayjwkiqbxfe                  # Gmail app password

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

---

**Arquitectura actualizada**: 16 Octubre 2025  
**Próxima revisión**: Tras integración UI blogs final