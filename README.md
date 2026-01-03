# 🏥 BIOSKIN - Medicina Estética Avanzada

> Sitio web oficial de la clínica BIOSKIN con sistema de blogs integrado

## 📁 Estructura del Proyecto

```
project2.0/
├── 📂 src/                 # Código fuente principal
├── 📂 api/                 # Endpoints de Vercel
├── 📂 public/              # Recursos públicos
├── 📂 lib/                 # Librerías compartidas
├── 📂 blog-system/         # Sistema de generación de blogs
├── 📂 config/              # Configuraciones del proyecto
├── 📂 docs/                # Documentación completa
├── 📂 scripts/             # Scripts de automatización
├── 📂 .github/             # GitHub workflows
├── 📂 .vercel/             # Configuración Vercel
├── 📂 dist/                # Build de producción
└── 📂 node_modules/        # Dependencias
```

## 🚀 Inicio Rápido

### Desarrollo Local
```bash
npm install
npm run dev
```

### Sistema de Blogs
```bash
cd blog-system
scripts\start-blog-server.bat
# Abrir: http://localhost:3336
```

### Build de Producción
```bash
npm run build
npm run preview
```

## 📚 Documentación

- **📖 Arquitectura**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **🤖 Chatbot & WhatsApp**: [docs/CHATBOT-SYSTEM.md](docs/CHATBOT-SYSTEM.md)
- **📊 Analytics**: [docs/ANALYTICS.md](docs/ANALYTICS.md)
- **🔐 Variables de Entorno**: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- **📈 Progreso**: [docs/PROGRESS.md](docs/PROGRESS.md)
- **🚀 Sistema de Blogs**: [blog-system/README.md](blog-system/README.md)

## ⚙️ Configuración

Las configuraciones del proyecto están organizadas en `config/`:

- `vite.config.ts` - Configuración de Vite
- `tsconfig.json` - TypeScript
- `tailwind.config.js` - TailwindCSS
- `eslint.config.js` - ESLint
- `postcss.config.js` - PostCSS
- `vercel.json` - Vercel

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter ESLint

## 🌐 Despliegue

El sitio está desplegado automáticamente en [Vercel](https://saludbioskin.vercel.app/) desde el repositorio GitHub.

## 📞 Soporte

Para soporte técnico, revisar la documentación en `docs/` o contactar al equipo de desarrollo.

---

**🏥 BIOSKIN - Medicina Estética Avanzada**  
**📅 Versión 2.0 - Octubre 2025**