# 🚀 BIOSKIN Blog System - Sistema de Generación de Blogs

## 📁 Estructura del Sistema

```
blog-system/
├── server/
│   └── server.js           # Servidor principal del sistema de blogs
├── services/
│   ├── blog-generator.js   # Servicio de generación con IA
│   ├── blog-manager.js     # Gestión de blogs y archivos
│   └── deploy-manager.js   # Gestión de despliegues Git
├── public/
│   ├── interface.html      # Interfaz web del generador
│   └── js/
│       └── app.js         # JavaScript del frontend
├── scripts/
│   └── start-blog-server.bat  # Script de inicio para Windows
├── config/
│   ├── package.json       # Dependencias del sistema
│   └── .env.example       # Ejemplo de variables de entorno
└── README.md             # Esta documentación
```

## ⚡ Inicio Rápido

### 1. Configuración Inicial

Asegúrate de tener un archivo `.env` en la raíz del proyecto principal con:
```
OPENAI_API_KEY=tu_api_key_aqui
```

### 2. Iniciar el Sistema

**Opción A - Script Automático (Windows):**
```bash
# Desde el directorio del proyecto
./blog-system/scripts/start-blog-server.bat
```

**Opción B - Manual:**
```bash
# Desde el directorio del proyecto
cd blog-system
npm install express cors multer fs-extra simple-git openai dotenv
cd ..
node blog-system/server/server.js
```

### 3. Usar la Interfaz

Abre tu navegador en: http://localhost:3336

## 🎯 Funcionalidades

### ✅ Generación de Blogs con IA
- Generación automática de contenido médico-estético
- Títulos optimizados para SEO
- Contenido estructurado y profesional
- Categorías: médico-estético y técnico

### ✅ Gestión de Imágenes
- Subida de imágenes con organización automática
- Carpetas individuales por blog
- Redimensionado y optimización
- Integración con estructura de archivos

### ✅ Sistema Organizado
- Cada blog en su propia carpeta
- Metadatos separados
- Índice centralizado
- Estructura compatible con el sitio web

### ✅ Despliegue Automático
- Git add y commit automático
- Push al repositorio
- Despliegue directo en Vercel
- Sincronización completa

## 🔧 Componentes del Sistema

### server.js
Servidor principal que maneja:
- API REST para generación de blogs
- Subida y gestión de imágenes
- Integración con OpenAI
- Despliegue automático con Git

### blog-generator.js
Servicio especializado en:
- Generación de contenido con GPT-4
- Prompts optimizados para medicina estética
- Estructura de contenido profesional
- Metadatos automáticos

### blog-manager.js
Gestión de archivos:
- Creación de estructura organizada
- Manejo de imágenes
- Índice de blogs
- Sincronización de datos

### deploy-manager.js
Automatización de despliegue:
- Comandos Git automatizados
- Verificación de cambios
- Push al repositorio
- Logs de despliegue

## 📋 Requisitos

- Node.js 16+
- OpenAI API Key
- Git configurado
- Repositorio GitHub conectado
- Vercel para despliegue automático

## 🔄 Flujo de Trabajo

1. **Generar** → Crear blog con IA
2. **Subir Imágenes** → Añadir contenido visual
3. **Guardar** → Estructura organizada automática
4. **Desplegar** → Git push y actualización en vivo

## 🛠️ Mantenimiento

### Actualizar Dependencias
```bash
cd blog-system
npm update
```

### Verificar Estado
- Logs del servidor: Consola donde se ejecuta
- Estado de archivos: Revisar `src/data/blogs/`
- Despliegues: Verificar en Vercel dashboard

### Troubleshooting

**Problema**: Error de OpenAI API
**Solución**: Verificar que `.env` tiene `OPENAI_API_KEY` válida

**Problema**: Error de Git
**Solución**: Verificar que Git está configurado y hay permisos

**Problema**: Imágenes no se cargan
**Solución**: Verificar permisos de escritura en carpetas

## 📞 Soporte

El sistema está diseñado para funcionar de forma autónoma. En caso de problemas:

1. Verificar logs en la consola del servidor
2. Comprobar configuración de variables de entorno
3. Revisar permisos de archivos y carpetas
4. Verificar conectividad con OpenAI y GitHub

---

**Sistema desarrollado para BIOSKIN** - Medicina Estética Avanzada  
Versión: 2.0 - Octubre 2025