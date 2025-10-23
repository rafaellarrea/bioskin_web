# BIOSKIN Blog Generator Local

## 🚀 Generador de Blogs Local con IA

Aplicación desktop local para generar blogs de BIOSKIN usando inteligencia artificial con OpenAI GPT-4. Incluye editor visual, gestión de imágenes y despliegue automático al sitio web.

### ✨ Características

- 🤖 **Generación con IA**: OpenAI GPT-4 con prompts especializados
- 📝 **Editor Visual**: Vista previa y edición en tiempo real
- 🖼️ **Gestión de Imágenes**: Subida y gestión de imágenes desde URL
- 💾 **Guardado Automático**: Formato JSON compatible con el sistema
- 🚀 **Despliegue Automático**: Git add, commit y push integrado
- 📊 **Monitoreo**: Logs de actividad y estado del sistema
- 🎯 **Sugerencias**: Temas predefinidos por categoría

### 🛠️ Instalación

1. **Instalar dependencias**:
```bash
cd blog-generator-local
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Edita el archivo `.env` y añade tu API key de OpenAI:
```
OPENAI_API_KEY=sk-tu_api_key_aqui
```

3. **Iniciar el servidor**:
```bash
npm start
```

4. **Abrir en el navegador**:
```
http://localhost:3333
```

### 📋 Uso

#### 1. **Seleccionar Tema**
- Elige tipo de blog: "Médico Estético" o "Técnico"
- Selecciona una sugerencia o escribe tema personalizado
- Debe tener al menos 10 caracteres

#### 2. **Generar Blog**
- Clic en "Generar Blog con IA"
- La IA creará contenido estructurado siguiendo el formato BIOSKIN
- El blog aparecerá en la vista previa

#### 3. **Editar Contenido**
- Usa el botón "Editar" para modificar título, excerpt, contenido y tags
- Vista previa en tiempo real
- Soporte completo de Markdown

#### 4. **Gestionar Imágenes**
- Sube imágenes locales (JPG, PNG, WEBP, máx. 10MB)
- Añade imágenes desde URL
- Establece imagen principal
- Vista previa de todas las imágenes

#### 5. **Guardar y Desplegar**
- "Guardar Blog": Crea archivo JSON en `src/data/blogs/`
- "Desplegar al Sitio Web": Git add + commit + push automático
- Integración completa con el sistema web

### 🏗️ Estructura del Proyecto

```
blog-generator-local/
├── package.json              # Dependencias y scripts
├── server.js                 # Servidor Express principal
├── .env.example              # Plantilla de variables de entorno
├── .gitignore               # Archivos ignorados
├── services/
│   ├── blog-generator.js     # Servicio de generación con IA
│   ├── blog-manager.js       # Gestión de guardado/carga
│   └── deploy-manager.js     # Despliegue Git automático
├── public/
│   ├── index.html           # Interface principal
│   └── js/
│       └── app.js           # Frontend JavaScript
├── uploads/                 # Imágenes subidas (generado)
├── saved-blogs/            # Copia local de blogs (generado)
└── exports/                # Exports de blogs (generado)
```

### 🔧 API Endpoints

- `GET /api/topic-suggestions` - Obtener sugerencias de temas
- `POST /api/generate-blog` - Generar blog con IA
- `POST /api/upload-image` - Subir imagen
- `POST /api/save-blog` - Guardar blog en JSON
- `POST /api/deploy-blog` - Desplegar al repositorio
- `GET /api/saved-blogs` - Lista de blogs guardados
- `GET /api/blog/:slug` - Obtener blog específico

### ⚙️ Configuración

#### Variables de Entorno
```bash
OPENAI_API_KEY=sk-xxx          # REQUERIDO: API key de OpenAI
PORT=3333                      # Puerto del servidor (opcional)
NODE_ENV=development           # Entorno (opcional)
```

#### Formatos Soportados
- **Imágenes**: JPG, PNG, WEBP (máx. 10MB)
- **Blogs**: JSON con estructura BIOSKIN
- **Contenido**: Markdown con HTML

### 🚀 Scripts Disponibles

```bash
npm start          # Iniciar servidor de producción
npm run dev        # Iniciar con nodemon (desarrollo)
npm run deploy     # Script de despliegue (futuro)
```

### 🔍 Características Técnicas

#### Generación de IA
- **Modelo**: OpenAI GPT-4
- **Prompts**: Especializados por categoría (médico-estético/técnico)
- **Estructura**: Formato BIOSKIN estandardizado
- **Longitud**: 800-1400 palabras según tipo

#### Gestión de Archivos
- **Guardado**: Dual (local + proyecto)
- **Formato**: JSON compatible con sistema web
- **Validación**: Estructura y campos requeridos
- **Backup**: Copia local automática

#### Despliegue
- **Git**: Integración completa con simple-git
- **Commits**: Mensajes automáticos descriptivos
- **Validación**: Verificación de archivos antes del push
- **Logs**: Registro completo de operaciones

### 🛡️ Seguridad

- ✅ API key en variables de entorno (no expuesta)
- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño de archivos
- ✅ Sanitización de inputs
- ✅ CORS configurado

### 🐛 Troubleshooting

#### Problema: "OPENAI_API_KEY no configurada"
**Solución**: Verifica que el archivo `.env` existe y contiene tu API key válida.

#### Problema: "Error conectando con repositorio remoto"
**Solución**: 
1. Verifica conexión a internet
2. Confirma credenciales de Git
3. Verifica permisos del repositorio

#### Problema: "Blog no encontrado"
**Solución**: Asegúrate de que el archivo JSON se guardó correctamente en `src/data/blogs/`.

### 📞 Soporte

Para soporte técnico o reportar problemas:
- Verifica los logs de actividad en la aplicación
- Revisa la consola del navegador (F12)
- Consulta los logs del servidor en terminal

### 🔄 Próximas Características

- [ ] Plantillas personalizables
- [ ] Exportación a múltiples formatos
- [ ] Programación de publicación
- [ ] Análisis de contenido con métricas
- [ ] Integración con más servicios de IA
- [ ] Sistema de versiones de blogs