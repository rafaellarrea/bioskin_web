# 🔧 Scripts de Automatización BIOSKIN

Este directorio contiene scripts de automatización para el desarrollo y mantenimiento del proyecto BIOSKIN.

## 📋 Scripts Disponibles

### 🚀 **setup-environment.bat**
**Propósito**: Configuración inicial del entorno de desarrollo
- Configura variables de entorno (.env)
- Solicita y valida OpenAI API Key
- Configuración opcional de email
- Preparación para desarrollo local

**Uso**: Ejecutar PRIMERO antes que cualquier otro script
```bash
scripts\setup-environment.bat
```

### 📦 **install-dependencies.bat**
**Propósito**: Instalación completa de dependencias
- Instala dependencias npm del proyecto
- Instala Vercel CLI globalmente
- Verifica herramientas necesarias (Node.js, curl)
- Preparación del entorno de desarrollo

**Uso**: Ejecutar después de setup-environment.bat
```bash
scripts\install-dependencies.bat
```

### 🌐 **start-blog-server.bat**
**Propósito**: Inicia la interfaz de generación de blogs con IA (Puerto 3335)
- Interfaz web completa en http://localhost:3335
- Generación de blogs con IA OpenAI
- Sistema de subida de imágenes (drag & drop)
- Vista previa de blogs antes de publicar
- Guardado automático + Git push para deploy

**Uso**: Para generar blogs con la interfaz completa
```bash
scripts\start-blog-server.bat
```

### 🔧 **start-vercel-apis.bat**
**Propósito**: Inicia el servidor Vercel para las APIs (Puerto 3000)
- APIs de backend en http://localhost:3000/api/
- Endpoint de generación IA: /api/ai-blog/generate-production
- APIs de blogs: /api/blogs
- Necesario para que funcione la interfaz de blogs

**Uso**: Ejecutar antes que start-blog-server.bat
```bash
scripts\start-vercel-apis.bat
```

### 🚀 **start-complete-blog-system.bat**
**Propósito**: Inicia TODO el sistema de blogs automáticamente
- Verifica configuración de variables de entorno
- Inicia APIs de Vercel (puerto 3000) en ventana separada
- Inicia interfaz de generación (puerto 3335)
- Sistema completo listo para usar

**Uso**: Script principal - inicia todo el sistema
```bash
scripts\start-complete-blog-system.bat
```

### 🤖 **generate-blog.bat**
**Propósito**: Genera nuevos blogs usando IA
- Interfaz interactiva para seleccionar categoría
- Utiliza OpenAI para generar contenido
- Guarda automáticamente en estructura organizada
- Sincronización automática con frontend

**Categorías disponibles**:
- `medico-estetico`
- `tecnologia-estetica`
- `cuidado-piel`
- `tratamientos-faciales`
- `tratamientos-corporales`

**Uso**: Con el servidor ejecutándose
```bash
scripts\generate-blog.bat
```

### 🧪 **test-blog-system.bat**
**Propósito**: Prueba integral del sistema de blogs
- Verifica conectividad del servidor
- Prueba endpoints de API
- Valida estructura de archivos
- Abre página de prueba en navegador
- Diagnóstico completo del sistema

**Uso**: Para verificar que todo funciona
```bash
scripts\test-blog-system.bat
```

## 🔄 Flujo de Trabajo Recomendado

### 🆕 **Primera Configuración**
```bash
1. scripts\setup-environment.bat      # Configurar variables
2. scripts\install-dependencies.bat   # Instalar dependencias
3. scripts\start-blog-server.bat      # Iniciar servidor
4. scripts\test-blog-system.bat       # Verificar sistema
```

### 📝 **Desarrollo Diario**
```bash
# Opción 1: Sistema completo (recomendado)
1. scripts\start-complete-blog-system.bat    # Inicia todo automáticamente

# Opción 2: Manual (dos ventanas)
1. scripts\start-vercel-apis.bat            # Ventana 1: APIs
2. scripts\start-blog-server.bat            # Ventana 2: Interfaz
```

### 🎯 **Flujo de Trabajo de Generación**
```bash
1. Ejecutar: start-complete-blog-system.bat
2. Abrir: http://localhost:3335
3. Seleccionar categoría del blog
4. Generar contenido con IA (30-60 seg)
5. Subir imágenes (drag & drop)
6. Revisar contenido en vista previa
7. Guardar y desplegar (Git push automático)
```

## ⚙️ Requisitos del Sistema

### **Software Necesario**
- ✅ **Node.js** (v16 o superior)
- ✅ **npm** (incluido con Node.js)
- ✅ **curl** (incluido en Windows 10/11)
- ✅ **Vercel CLI** (se instala automáticamente)

### **Variables de Entorno**
- 🔑 **OPENAI_API_KEY**: Requerida para generación de blogs
- 📧 **GMAIL_USER/GMAIL_PASS**: Opcional para notificaciones
- 📅 **GOOGLE_CREDENTIALS_BASE64**: Opcional para Calendar API

## 🐛 Solución de Problemas

### **Error: "Node.js no está instalado"**
- Descargar e instalar desde: https://nodejs.org/

### **Error: "OPENAI_API_KEY no está configurada"**
- Ejecutar `setup-environment.bat`
- Obtener API Key desde: https://platform.openai.com/api-keys

### **Error: "Servidor no está ejecutándose"**
- Ejecutar `start-blog-server.bat` primero
- Verificar que puerto 3000 esté disponible

### **Error: "Falló la instalación de dependencias"**
- Verificar conexión a internet
- Ejecutar como administrador si es necesario
- Limpiar caché: `npm cache clean --force`

## 📁 Estructura de Archivos Generados

Los scripts crean y mantienen esta estructura:
```
project2.0/
├── .env                    # Variables de entorno (generado por setup-environment.bat)
├── node_modules/           # Dependencias (generado por install-dependencies.bat)
├── src/data/blogs/         # Blogs generados (generado por generate-blog.bat)
│   ├── index.json         # Índice de blogs
│   └── [blog-folders]/    # Carpetas individuales de blogs
└── scripts/               # Este directorio
```

## 🔒 Seguridad

- ✅ Archivo `.env` está en `.gitignore`
- ✅ API Keys nunca se muestran en logs
- ✅ Variables temporales se limpian automáticamente
- ✅ Solo configuración local, no afecta producción

---

**🏥 BIOSKIN - Scripts de Automatización v2.0**  
**📅 Octubre 2024**