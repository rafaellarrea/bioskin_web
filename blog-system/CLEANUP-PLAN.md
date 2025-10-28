# 🧹 LIMPIEZA DE ARCHIVOS NO UTILIZADOS

## Archivos a eliminar (no están siendo usados en el sistema de blogs):

### Archivos de prueba y debugging:
- test-*.js (todos los archivos de prueba)
- test-*.html (interfaces de prueba)
- debug-*.js
- debug-*.html
- run-blog-test.bat

### Archivos obsoletos del blog-generator-local:
- blog-generator-local/server.js (versión vieja)
- blog-generator-local/server-simple.js
- blog-generator-local/server-full.js
- blog-generator-local/test-*.js
- blog-generator-local/run-*.bat (excepto run-production.bat)
- blog-generator-local/start.bat

### Archivos de documentación duplicados:
- CORRECCIÓN-BLOGS-SOLUCIONADO.md
- RESUMEN-BLOGS-SISTEMA.md
- SOLUCION-PERSISTENCIA-BLOGS.md
- SISTEMA-BLOGS-ORGANIZADO.md

### Otros archivos temporales:
- init-database.js (si no se usa)
- server.log
- Archivos .zip de backup

## ✅ Archivos que SÍ se mantienen (son necesarios):

### Sistema principal:
- src/ (código fuente del sitio web)
- api/ (endpoints de Vercel)
- lib/ (librerías compartidas)
- public/images/ (imágenes del sitio)

### Configuración:
- package.json
- vercel.json
- .env, .env.example
- tailwind.config.js, vite.config.ts

### Blog system (nuevo):
- blog-system/ (todo el contenido)

### Datos:
- src/data/blogs/ (blogs generados)
- data/blogs-generated.json (si se usa)

### Documentación principal:
- README.md
- ARCHITECTURE.md
- PROGRESS.md