# 📋 SISTEMA DE BLOGS BIOSKIN - GUÍA COMPLETA

## 🎯 ¿Qué es este sistema?

El **Sistema de Blogs BIOSKIN** es una herramienta completa para generar contenido médico-estético utilizando inteligencia artificial. Permite crear blogs profesionales, organizarlos automáticamente y desplegarlos en el sitio web de BIOSKIN.

## 📁 Estructura del Sistema

```
blog-system/
├── 📂 server/           # Servidor principal
│   └── server.js        # API REST + Interfaz web
├── 📂 services/         # Servicios especializados  
│   ├── blog-generator.js    # Generación con IA (GPT-4)
│   ├── blog-manager.js      # Gestión de archivos
│   └── deploy-manager.js    # Despliegue automático
├── 📂 public/           # Interfaz web
│   ├── interface.html   # Panel de administración
│   └── js/app.js        # JavaScript del frontend
├── 📂 scripts/          # Scripts de automatización
│   ├── install-dependencies.bat    # Instalación
│   ├── start-blog-server.bat      # Inicio del servidor
│   └── cleanup-project.bat        # Limpieza del proyecto
├── 📂 config/           # Configuración
│   ├── package.json     # Dependencias
│   └── .env.example     # Variables de entorno
└── 📄 documentación/    # Guías y manuales
```

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto principal con:
```
OPENAI_API_KEY=sk-tu_api_key_de_openai_aqui
```

### 2️⃣ **Instalar dependencias**

```bash
# Ejecutar desde blog-system/
scripts\install-dependencies.bat
```

### 3️⃣ **Iniciar el sistema**

```bash
# Ejecutar desde blog-system/
scripts\start-blog-server.bat
```

**🌐 Abrir:** http://localhost:3336

## 🚀 Funcionalidades Principales

### ✅ **Generación Inteligente de Contenido**
- **IA Especializada:** GPT-4 entrenado en medicina estética
- **Contenido Profesional:** Artículos técnicos y divulgativos
- **SEO Optimizado:** Títulos y estructura optimizada
- **Categorías:** Médico-estético y técnico

### ✅ **Gestión Automática de Archivos**
- **Organización:** Cada blog en su propia carpeta
- **Metadatos:** Información estructurada separada
- **Imágenes:** Upload y organización automática
- **Índice:** Sistema de referencias centralizado

### ✅ **Despliegue Automático**
- **Git Integration:** Add, commit y push automático
- **Vercel Deploy:** Despliegue directo al sitio web
- **Sincronización:** Actualización inmediata en producción

### ✅ **Interfaz Amigable**
- **Editor Visual:** Interface intuitiva
- **Preview:** Vista previa en tiempo real
- **Gestión de Imágenes:** Upload drag & drop
- **Control de Calidad:** Validación antes de publicar

## 📝 Flujo de Trabajo Completo

### 1. **Generar Blog**
   - Seleccionar categoría (médico-estético / técnico)
   - Especificar tema o dejar que la IA sugiera
   - Generar contenido automáticamente

### 2. **Personalizar Contenido**
   - Revisar y editar el contenido generado
   - Ajustar título y metadatos
   - Añadir tags relevantes

### 3. **Añadir Imágenes**
   - Subir imagen principal
   - Añadir imágenes adicionales
   - Organización automática en carpetas

### 4. **Guardar y Organizar**
   - Crear estructura de archivos
   - Generar metadatos
   - Actualizar índice general

### 5. **Desplegar**
   - Git commit automático
   - Push al repositorio
   - Despliegue en Vercel
   - ✅ **Blog visible en el sitio web**

## 🛠️ Componentes Técnicos

### **server.js** - Servidor Principal
```javascript
// Funcionalidades principales:
- API REST para generación de blogs
- Gestión de subida de imágenes
- Integración con OpenAI GPT-4
- Automatización de Git
- Interfaz web incorporada
```

### **blog-generator.js** - Motor de IA
```javascript
// Características:
- Prompts especializados en medicina estética
- Generación de títulos SEO-friendly
- Contenido estructurado profesional
- Metadatos automáticos
- Categorización inteligente
```

### **blog-manager.js** - Gestión de Archivos
```javascript
// Responsabilidades:
- Creación de estructura organizada
- Gestión de imágenes y metadatos
- Índice centralizado de blogs
- Validación de contenido
```

### **deploy-manager.js** - Automatización
```javascript
// Funciones:
- Git add/commit/push automático
- Verificación de cambios
- Logs de despliegue
- Manejo de errores
```

## ⚙️ Configuración Avanzada

### **Variables de Entorno**
```env
# Requeridas
OPENAI_API_KEY=sk-...          # API Key de OpenAI

# Opcionales  
NODE_ENV=production            # Entorno de ejecución
PORT=3336                      # Puerto del servidor
GIT_AUTO_DEPLOY=true           # Despliegue automático
```

### **Personalización de Prompts**
El sistema permite personalizar los prompts de IA editando `blog-generator.js`:

```javascript
const medicalPrompt = `
Eres un especialista en medicina estética...
// Personalizar según necesidades
`;
```

## 🔧 Mantenimiento y Troubleshooting

### **Problemas Comunes**

**❌ Error: "OpenAI API Key not configured"**
```bash
# Solución: Verificar archivo .env
echo "OPENAI_API_KEY=sk-tu_key" > .env
```

**❌ Error: "Git command failed"**
```bash
# Solución: Verificar configuración Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

**❌ Error: "Cannot upload images"**
```bash
# Solución: Verificar permisos de carpetas
mkdir -p public/images/blog
chmod 755 public/images/blog
```

### **Mantenimiento Regular**

**Actualizar dependencias:**
```bash
cd blog-system
npm update
```

**Limpiar archivos temporales:**
```bash
scripts\cleanup-project.bat
```

**Verificar estado del sistema:**
```bash
# Revisar logs en la consola del servidor
# Verificar espacio en disco
# Comprobar conectividad con OpenAI
```

## 📊 Estadísticas y Monitoreo

### **Métricas del Sistema**
- Blogs generados por día/mes
- Tiempo promedio de generación
- Uso de tokens de OpenAI
- Éxito de despliegues

### **Logs Importantes**
```bash
# El servidor registra:
- Generaciones de blogs exitosas
- Errores de OpenAI API  
- Problemas de Git
- Uploads de imágenes
- Despliegues completados
```

## 🔒 Seguridad y Backups

### **Seguridad**
- API Key de OpenAI nunca se expone al frontend
- Variables de entorno protegidas
- Validación de inputs del usuario
- Sanitización de contenido

### **Backups**
- Los blogs se guardan en Git (backup automático)
- Estructura organizada permite restauración fácil
- Imágenes incluidas en el repositorio

## 📞 Soporte

### **Recursos de Ayuda**
1. **Documentación:** Este archivo README.md
2. **Logs:** Consola del servidor (depuración)
3. **Plan de Limpieza:** CLEANUP-PLAN.md
4. **Estructura:** Revisar carpeta blog-system/

### **Contacto**
Para soporte técnico o mejoras al sistema, revisar:
- Logs del servidor
- Variables de entorno
- Conectividad de red
- Permisos de archivos

---

**🏥 Sistema desarrollado para BIOSKIN - Medicina Estética Avanzada**  
**📅 Versión 2.0 - Octubre 2025**  
**⚡ Sistema completamente funcional y desplegado**