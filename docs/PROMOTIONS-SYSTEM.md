# 🎉 Sistema de Promociones BIOSKIN

## 📋 Descripción
Sistema **100% MANUAL** de gestión de promociones para servicios, productos y equipos de BIOSKIN. 

**IMPORTANTE**: Las promociones **NO se activan automáticamente**. Debes editar el archivo `data/promotions.json` manualmente para activar/desactivar promociones.

El chatbot **Matías** lee este archivo antes de responder sobre precios y menciona las promociones que tengan `"active": true`.

## 🗂️ Estructura

### Archivos principales:
- **`data/promotions.json`** - Base de datos de promociones (editable manualmente)
- **`lib/promotions-service.js`** - Servicio de lectura (NO valida fechas automáticamente)
- **`lib/chatbot-ai-service.js`** - Integración con el chatbot

## ⚠️ ACTIVACIÓN MANUAL

### Cómo funciona:
1. **Editas `data/promotions.json`** y cambias `"active": true`
2. **Haces commit y push** a GitHub
3. **Vercel redespliega** (~1-2 min)
4. **Matías empieza a mencionar** la promoción

### Las fechas son solo informativas:
- `validFrom` y `validUntil` son para que **tú** sepas cuándo activar/desactivar
- El sistema **NO** activa/desactiva automáticamente por fechas
- **Tú decides** cuándo cambiar `"active": true/false`

## 📝 Promociones Actuales

### 🔥 PRE BLACK WEEK (Viernes 14 - Domingo 16 Nov)
```json
{
  "id": "promo-pre-blackweek-limpieza",
  "name": "Pre Black Week - Limpieza Facial 2x1",
  "service": "Limpieza facial profunda",
  "active": true,  // ← CAMBIAR A false después del domingo 16
  "promoPrice": 40,
  "originalPrice": 50,
  "quantity": 2,
  "validFrom": "2024-11-14",
  "validUntil": "2024-11-16",
  "displayMessage": "🔥 ¡PRE BLACK WEEK! Limpieza facial profunda: 2x$40 USD..."
}
```

### 🛒 BLACK WEEK (24 Nov - 1 Dic) - PRÓXIMAMENTE
```json
{
  "id": "promo-blackweek-2024",
  "name": "Black Week 2024",
  "description": "Descuentos especiales en servicios seleccionados",
  "validFrom": "2024-11-24",
  "validUntil": "2024-12-01",
  "status": "programada",
  "note": "Activar manualmente el 24 de noviembre"
}
```
```json
{
  "id": "promo-limpieza-2x40",
  "name": "Limpieza Facial 2x1",
  "service": "Limpieza facial profunda",
  "serviceId": "limpieza-facial",
  "type": "package",
  "active": true,
  "description": "2 Limpiezas faciales profundas",
  "originalPrice": 50,
  "promoPrice": 40,
  "discount": 20,
  "discountType": "percentage",
  "quantity": 2,
  "pricePerUnit": 20,
  "validFrom": "2024-11-15",
  "validUntil": "2024-12-31",
  "terms": [
    "Aplica solo para Limpieza facial profunda",
    "Las 2 sesiones deben usarse en un plazo de 60 días",
    "No acumulable con otras promociones"
  ],
  "displayMessage": "🎉 ¡PROMOCIÓN ACTIVA! Limpieza facial profunda: 2x$40 USD (precio regular 1x$25 USD). Ahorra $10 en tu segundo tratamiento."
}
```

## ✏️ Cómo Gestionar Promociones (MANUAL)

### 1. Activar una promoción

**Ejemplo: Activar PRE BLACK WEEK (14-16 Nov)**
```json
{
  "id": "promo-pre-blackweek-limpieza",
  "active": true,  // ← Cambiar de false a true
  ...
}
```

**Pasos:**
1. Editar `data/promotions.json`
2. Cambiar `"active": false` → `"active": true`
3. Commit: `git add data/promotions.json`
4. Commit: `git commit -m "Activar PRE BLACK WEEK"`
5. Push: `git push`
6. Esperar 1-2 min (Vercel redespliega)

### 2. Desactivar una promoción (después del 16 de Nov)

```json
{
  "id": "promo-pre-blackweek-limpieza",
  "active": false,  // ← Cambiar de true a false
  ...
}
```

### 3. Activar BLACK WEEK (24 Nov - 1 Dic)

**El 24 de noviembre:**
1. Abrir `data/promotions.json`
2. Buscar la promoción en `"upcoming"`
3. Copiar el objeto completo
4. Moverlo a `"services"` (o `"products"` / `"equipment"`)
5. Agregar `"active": true`
6. Definir todos los campos requeridos (precio, mensaje, etc.)
7. Commit y push

**Ejemplo de migración:**
```json
"services": [
  {
    "id": "promo-blackweek-hifu",
    "name": "Black Week - HIFU",
    "service": "HIFU full face",
    "active": true,  // ← AGREGAR esto
    "type": "discount",
    "originalPrice": 60,
    "promoPrice": 50,
    "discount": 17,
    "validFrom": "2024-11-24",
    "validUntil": "2024-12-01",
    "displayMessage": "🛒 ¡BLACK WEEK! HIFU full face: $50 USD (precio regular $60 USD). Válido 24 nov - 1 dic."
  }
]
```
```json
"services": [
  {
    "id": "promo-unique-id",
    "name": "Nombre corto de la promoción",
    "service": "Nombre exacto del servicio",
    "serviceId": "slug-del-servicio",
    "type": "package" | "discount" | "bundle",
    "active": true,
    "description": "Descripción detallada",
    "originalPrice": 100,
    "promoPrice": 80,
    "discount": 20,
    "discountType": "percentage" | "fixed",
    "quantity": 2,
    "pricePerUnit": 40,
    "validFrom": "2024-11-15",
    "validUntil": "2024-12-31",
    "terms": ["Término 1", "Término 2"],
    "displayMessage": "🎉 Mensaje que verá el cliente"
  }
]
```

#### Para PRODUCTOS:
```json
"products": [
  {
    "id": "promo-producto-xyz",
    "name": "3x2 en Serums",
    "service": "Serum Vitamina C",
    "type": "bundle",
    "active": true,
    "originalPrice": 90,
    "promoPrice": 60,
    "discount": 33,
    "quantity": 3,
    "displayMessage": "🎉 ¡3x2 en Serum Vitamina C! Lleva 3 por solo $60 USD"
  }
]
```

#### Para EQUIPOS:
```json
"equipment": [
  {
    "id": "promo-equipo-abc",
    "name": "Descuento Black Friday",
    "service": "Láser CO2 Fraccionado",
    "type": "discount",
    "active": true,
    "originalPrice": 5000,
    "promoPrice": 4000,
    "discount": 20,
    "displayMessage": "🎉 ¡Black Friday! Láser CO2 con 20% de descuento: $4000 USD"
  }
]
```

### 2. Activar/Desactivar Promoción
Cambiar el campo `"active"`:
```json
"active": true  // Promoción visible
"active": false // Promoción oculta
```

### 3. Desactivar TODO el Sistema
En el archivo `promotions.json`, cambiar:
```json
"active": false  // Sistema completo desactivado
```

## 🤖 Comportamiento del Chatbot

### Flujo automático:
1. **Usuario pregunta por precio** → Matías verifica `promotions.json`
2. **Si hay promoción activa** → Menciona promoción PRIMERO + precio regular
3. **Si NO hay promoción** → Menciona precio regular + ofrece consultar opciones

### Ejemplos de respuestas:

**CON PROMOCIÓN:**
```
Usuario: "¿Cuánto cuesta la limpieza facial?"
Matías: "¡Tenemos una promoción especial! 🎉 Limpieza facial profunda: 2x$40 USD 
         (precio regular 1x$25 USD). Ahorra $10 en tu segundo tratamiento. 
         Duración: 90 min. ¿Te interesa aprovechar esta oferta?"
```

**SIN PROMOCIÓN:**
```
Usuario: "¿Cuánto cuesta el HIFU?"
Matías: "HIFU full face: $60 USD, duración 120 min. Por el momento no contamos 
         con descuentos en este tratamiento, pero puedo consultar opciones de 
         pago si te interesa. ¿Deseas agendar? 😊"
```

## 📅 Calendario de Promociones 2024

### ✅ PRE BLACK WEEK (ACTIVA)
- **Fechas**: Viernes 14 - Domingo 16 de noviembre
- **Promo**: Limpieza facial 2x$40 USD
- **Estado**: `"active": true` ✅
- **Acción**: Desactivar el lunes 17 de noviembre

### ⏳ BLACK WEEK (PRÓXIMA)
- **Fechas**: 24 de noviembre - 1 de diciembre
- **Promo**: Descuentos en servicios seleccionados
- **Estado**: `"status": "programada"` (en sección `upcoming`)
- **Acción**: Activar manualmente el 24 de noviembre

## ⚠️ RECORDATORIOS IMPORTANTES

### Tareas manuales requeridas:

1. **17 de noviembre (lunes)**
   - [ ] Desactivar PRE BLACK WEEK: cambiar `"active": false`
   - [ ] Commit y push

2. **24 de noviembre (domingo)**
   - [ ] Activar BLACK WEEK: mover de `upcoming` a `services`
   - [ ] Definir servicios con descuento y precios
   - [ ] Cambiar `"active": true`
   - [ ] Commit y push

3. **2 de diciembre (lunes)**
   - [ ] Desactivar BLACK WEEK: cambiar `"active": false`
   - [ ] Commit y push

### El sistema NO hace esto automáticamente
- ❌ No activa promociones por fecha
- ❌ No desactiva promociones vencidas
- ❌ No valida fechas
- ✅ Solo lee el campo `"active": true/false`

## 🔄 Flujo de trabajo

- **Cache**: 5 minutos para evitar lecturas constantes del archivo
- **Actualización automática**: Después de 5 min, se recarga el archivo
- **Limpiar cache manualmente**: 
  ```javascript
  promotionsService.clearCache();
  ```

## 📊 Validaciones Automáticas

El sistema valida:
- ✅ Fechas de vigencia (`validFrom`, `validUntil`)
- ✅ Estado activo (`active: true`)
- ✅ Coincidencia de nombre de servicio/producto
- ✅ Estructura JSON correcta

## 🚀 Deployment

Los cambios en `data/promotions.json` se despliegan automáticamente:
```bash
git add data/promotions.json
git commit -m "Actualizar promoción: [descripción]"
git push
```

Vercel redesplegará en ~1-2 minutos.

## 🛠️ Mantenimiento

### Agregar nueva promoción:
1. Editar `data/promotions.json`
2. Agregar objeto en el array correspondiente (`services`, `products`, `equipment`)
3. Verificar fechas y mensaje de display
4. Commit y push

### Terminar promoción:
```json
"active": false
```

### Extender vigencia:
```json
"validUntil": "2025-01-31"
```

## 📦 Tipos de Promoción

- **`package`** - Paquetes (ej: 2x1, 3x2)
- **`discount`** - Descuentos porcentuales o fijos
- **`bundle`** - Combos de servicios/productos

## ⚙️ Configuración del Bot

En `promotions.json`:
```json
"bot_instructions": {
  "checkBeforePrice": true,        // Verificar siempre antes de dar precio
  "alwaysMentionIfActive": true,   // Mencionar promoción si está activa
  "suggestBestDeal": true,         // Sugerir mejor opción al cliente
  "priority": "promotion_first"    // Prioridad a promociones
}
```

## 📈 Monitoreo

Para ver promociones activas desde código:
```javascript
import { promotionsService } from './lib/promotions-service.js';

// Ver todas las activas
const active = promotionsService.getActivePromotions();

// Buscar por servicio
const promo = promotionsService.findPromotionByService('limpieza facial');

// Resumen
const summary = promotionsService.getPromotionsSummary();
console.log(summary.message);
```

## 🎯 Promoción Actual

### Limpieza Facial 2x$40
- **Precio**: 2 sesiones por $40 USD (ahorro de $10)
- **Vigencia**: Hasta 31 de diciembre 2024
- **Términos**: 
  - Válido solo para Limpieza facial profunda
  - 2 sesiones deben usarse en 60 días
  - No acumulable con otras promociones

---

**Última actualización**: 15 de noviembre 2024  
**Versión**: 1.0  
**Autor**: Sistema BIOSKIN
