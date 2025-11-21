# Solución: Error ENOENT products.ts en Vercel

## 🔴 Problema Identificado

El chatbot WhatsApp estaba fallando al intentar acceder a información de productos:

```
❌ [ProductsAdapter] Error cargando productos: ENOENT: no such file or directory, open '/var/task/src/data/products.ts'
```

### Causa Raíz
- Vercel serverless functions no tienen acceso al código fuente TypeScript (`.ts`)
- El sistema de archivos es read-only excepto `/tmp`
- `products-adapter.js` intentaba leer directamente `src/data/products.ts`

## ✅ Solución Implementada

### 1. Script de Extracción (`scripts/extract-products-to-json.js`)
Script que lee `products.ts` y genera `data/products.json` estático:

```bash
npm run products:extract
```

**Cuándo ejecutar:**
- Después de modificar `src/data/products.ts`
- Antes de hacer deploy a Vercel
- Durante el proceso de build (si se automatiza)

### 2. Adaptador Mejorado (`lib/products-adapter.js`)

**Jerarquía de fuentes de datos:**
1. **Primario**: `data/products.json` (archivo estático)
2. **Fallback desarrollo**: `src/data/products.ts` (solo local)
3. **Fallback producción**: Productos hardcoded (3 equipos principales)

```javascript
// Orden de intentos:
1. JSON estático → ✅ Funciona en Vercel
2. TypeScript → ⚠️ Solo desarrollo local
3. Hardcoded → 🆘 Último recurso
```

### 3. Función de Búsqueda Precisa

Nueva función `searchEquipmentByPrimaryInfo()` que busca **solo** en:
- Nombre del producto
- Descripción corta

**Problema anterior:** `searchEquipment()` buscaba en toda la info (descripciones largas, especificaciones) causando falsos positivos.

**Ejemplo:**
```javascript
// Antes: Falso positivo
"cavitación" → Match en descripción de HIFU (contiene palabra incidentalmente)

// Ahora: Búsqueda precisa
"cavitación" → No match (no es el nombre del equipo)
"HIFU" → Match correcto en nombre
```

## 📋 Keywords Técnicos Detectados

Lista de keywords que el sistema reconoce para clasificar consultas técnicas:

```javascript
[
  'hifu', 'láser', 'laser', 'co2', 'fraccionado',
  'analizador', 'facial', 'wood',
  'ipl', 'yag', 'radiofrecuencia', 'rf',
  'plasma', 'pen', 'criolipólisis', 'coolsculpting',
  'cavitación', 'ultrasonido', 'mesoterapia',
  'microneedling', 'dermoabrasión', 'peeling',
  'hydrafacial', 'microdermoabrasion', 'electroporacion'
]
```

## 🧪 Tests de Validación

### Test Suite Completo
```bash
node test-equipment-detection-suite.js
```

**Casos validados:**
- ✅ HIFU (conocido) - Detecta correctamente en catálogo
- ✅ Láser CO2 (conocido)
- ✅ Analizador facial (conocido)
- ✅ IPL (conocido)
- ✅ Criolipólisis (desconocido) - No en catálogo
- ✅ Cavitación (desconocido) - Sin falsos positivos
- ✅ Consulta no técnica - No activa detección

### Test de Adaptador
```bash
node test-products-adapter.js
```

Valida:
- Carga de productos desde JSON
- Filtrado por categoría (equipment)
- Stock disponible
- Búsqueda por keywords
- Detección de equipos desconocidos

## 🚀 Workflow de Producción

### 1. Modificar Productos
```bash
# Editar productos
code src/data/products.ts
```

### 2. Extraer a JSON
```bash
npm run products:extract
```

### 3. Commit y Deploy
```bash
git add data/products.json
git commit -m "Actualizar catálogo de productos"
git push
```

### 4. Vercel Deploy Automático
Vercel detecta el push y hace deploy incluyendo `data/products.json`.

## 📊 Estadísticas Actuales

```
Total productos: 4
- Equipamiento: 4
- Cosméticos: 0
- Disponibles en stock: 4

Equipos disponibles:
1. ANALIZADOR FACIAL (2 unidades)
2. Láser CO₂ Fraccionado (1 unidad)
3. HIFU 7D (3 unidades)
4. IPL + YAG + RF (2 unidades)
```

## ⚠️ Consideraciones Importantes

### 1. Sincronización Manual
- El JSON **NO se actualiza automáticamente** desde el TS
- Requiere ejecución manual de `npm run products:extract`
- **Considerar:** Hook pre-commit o CI/CD automation

### 2. Productos Hardcoded
- Solo 3 equipos principales
- Usado únicamente si JSON y TS fallan
- Actualizar cuando cambie catálogo principal

### 3. Vercel Filesystem
- `data/products.json` debe estar en repo Git
- Incluido en `.gitignore` con excepción: `!data/products.json`
- No usar bases de datos SQLite para productos (read-only filesystem)

## 🔧 Troubleshooting

### Problema: Chatbot no encuentra productos nuevos
**Solución:**
```bash
npm run products:extract
git add data/products.json
git commit -m "Sync productos"
git push
```

### Problema: Falsos positivos en detección
**Causa:** Keyword aparece en descripción larga de otro producto.

**Solución:** Agregar keyword a lista de exclusión o ajustar `searchEquipmentByPrimaryInfo()`.

### Problema: Productos no disponibles en Vercel
**Verificar:**
1. ¿Archivo `data/products.json` existe en repo?
2. ¿Está en `.gitignore` sin excepción?
3. ¿Se ejecutó `npm run products:extract` después de cambios?

## 📝 Changelog

**2025-11-21:**
- ✅ Implementado sistema JSON estático para Vercel
- ✅ Agregado fallback de productos hardcoded
- ✅ Creada función `searchEquipmentByPrimaryInfo()`
- ✅ Mejorada detección de keywords técnicos
- ✅ Suite de tests completa (7/7 passing)
- ✅ Documentación completa

## 🎯 Resultado Final

**Antes:**
```
❌ Error ENOENT al buscar products.ts
❌ Chatbot responde incorrectamente sobre equipos
```

**Después:**
```
✅ Carga productos desde JSON en Vercel
✅ Detección precisa de equipos conocidos/desconocidos
✅ Respuestas correctas del chatbot técnico
✅ Tests 100% pasando
```
