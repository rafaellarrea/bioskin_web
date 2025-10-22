# 📚 Carpeta de Blogs JSON

Esta carpeta contiene blogs estáticos en formato JSON que se cargan automáticamente en la pestaña de blogs del sitio web.

## 📁 **Estructura de Archivos**

```
src/data/blogs/
├── index.json                          # Índice de todos los blogs JSON
├── acido-hialuronico-beneficios.json   # Blog sobre ácido hialurónico  
├── tecnologia-ipl-fotorrejuvenecimiento.json  # Blog sobre IPL
├── exosomas-medicina-estetica.json     # Blog sobre exosomas
└── README.md                           # Este archivo
```

## 🎯 **Cómo Funciona**

1. **Carga Automática**: Todos los archivos JSON en esta carpeta se cargan automáticamente
2. **Prioridad de Fuentes**: `localStorage > JSON Files > Servidor`
3. **Sin Duplicados**: Se evitan blogs duplicados usando el campo `slug`
4. **Índice Centralizado**: El archivo `index.json` lista todos los blogs disponibles

## 📝 **Formato de Archivo JSON**

Cada blog debe seguir este formato exacto:

```json
{
  "id": "blog-unique-id",
  "title": "Título del Blog",
  "slug": "titulo-del-blog-sin-espacios",
  "excerpt": "Resumen breve del contenido...",
  "content": "# Título\n\nContenido completo en Markdown...",
  "category": "medico-estetico",
  "author": "Dr. BIOSKIN",
  "publishedAt": "2024-10-22T09:00:00.000Z",
  "readTime": 8,
  "tags": ["tag1", "tag2", "tag3"],
  "image": "/images/ruta/imagen-principal.jpg",
  "imagenPrincipal": "/images/ruta/imagen-principal.jpg",
  "imagenConclusion": "/images/ruta/imagen-conclusion.jpg",
  "featured": true,
  "source": "json-static"
}
```

## ✅ **Campos Requeridos**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único del blog |
| `title` | string | Título principal |
| `slug` | string | URL amigable (sin espacios, caracteres especiales) |
| `excerpt` | string | Resumen de 1-2 oraciones |
| `content` | string | Contenido completo en Markdown |
| `category` | string | `"medico-estetico"` o `"tecnico"` |
| `author` | string | Nombre del autor |
| `publishedAt` | string | Fecha ISO 8601 |
| `readTime` | number | Tiempo de lectura en minutos |

## 🎨 **Campos Opcionales**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tags` | array | Etiquetas del blog |
| `image` | string | Imagen principal (fallback) |
| `imagenPrincipal` | string | Imagen al inicio del blog |
| `imagenConclusion` | string | Imagen al final del blog |
| `featured` | boolean | Blog destacado (aparece primero) |
| `source` | string | Origen del blog (usar `"json-static"`) |

## 🚀 **Agregar un Nuevo Blog**

### **Método 1: Manual**
1. Crear archivo `nuevo-blog.json` en esta carpeta
2. Usar el formato JSON mostrado arriba
3. Actualizar `index.json` agregando entrada al array `blogFiles`
4. Incrementar `totalBlogs` en `index.json`

### **Método 2: Exportación desde Admin**
1. Ir a la gestión de blogs en el admin
2. Crear/editar blog existente
3. Hacer clic en el botón 📁 "Exportar JSON" del blog
4. Guardar el archivo descargado en esta carpeta
5. Actualizar `index.json` manualmente

## 🔄 **Actualizar index.json**

Cuando agregues un nuevo archivo JSON, debes actualizar `index.json`:

```json
{
  "version": "1.0",
  "lastUpdated": "2024-10-22T12:00:00.000Z",
  "blogFiles": [
    {
      "file": "nuevo-blog.json",
      "id": "blog-004",
      "title": "Título del Nuevo Blog",
      "slug": "titulo-del-nuevo-blog", 
      "category": "medico-estetico",
      "featured": false,
      "publishedAt": "2024-10-22T15:00:00.000Z"
    }
  ],
  "categories": ["medico-estetico", "tecnico"],
  "totalBlogs": 4
}
```

## 📊 **Categorías Disponibles**

- **`medico-estetico`**: Tratamientos médicos estéticos
- **`tecnico`**: Información técnica sobre equipos

## 🖼️ **Imágenes**

Las imágenes deben estar en la carpeta `public/images/` y usar rutas absolutas:

```
✅ Correcto: "/images/services/tratamiento/imagen.jpg"
❌ Incorrecto: "imagen.jpg"
❌ Incorrecto: "../images/imagen.jpg"
```

## 🔍 **Validación**

El sistema valida automáticamente:
- ✅ Formato JSON válido
- ✅ Campos requeridos presentes
- ✅ Slugs únicos (no duplicados)
- ✅ Fechas en formato ISO 8601
- ✅ Categorías válidas

## 🚨 **Resolución de Problemas**

### **Blog no aparece en el sitio**
1. Verificar que el archivo JSON esté en la carpeta correcta
2. Validar formato JSON con un validador online
3. Asegurar que `index.json` incluya el archivo
4. Verificar que el `slug` sea único

### **Error de formato**
1. Comparar con blogs existentes
2. Verificar que todas las comillas sean dobles (`"`)
3. Escapar caracteres especiales en el contenido
4. Usar `\n` para saltos de línea en `content`

### **Imágenes no aparecen**
1. Verificar que las rutas sean absolutas
2. Comprobar que las imágenes existan en `public/images/`
3. Usar extensiones válidas: `.jpg`, `.jpeg`, `.png`, `.webp`

## 💡 **Tips**

- **Contenido en Markdown**: El campo `content` soporta Markdown completo
- **Slugs SEO**: Usar formato `kebab-case` para los slugs
- **Fechas**: Usar formato ISO 8601 para compatibilidad
- **Backup**: Los blogs JSON son respaldo permanente y portátil

## 🔗 **API Endpoint**

Los blogs JSON se sirven a través del endpoint:
- `GET /api/blogs/json-files` - Todos los blogs
- `GET /api/blogs/json-files?file=blog.json` - Blog específico

## 📈 **Ventajas de los Blogs JSON**

1. **Persistencia garantizada**: No se eliminan automáticamente
2. **Control total**: Formato y contenido completamente controlable
3. **Portabilidad**: Fácil backup y migración
4. **SEO optimizado**: Control total sobre metadatos
5. **Sin limitaciones**: No depende de localStorage o servidor