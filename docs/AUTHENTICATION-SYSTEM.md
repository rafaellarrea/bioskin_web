# 🔐 Sistema de Autenticación del Panel Admin

## Descripción General

El panel administrativo de BIOSKIN cuenta con un **sistema de autenticación robusto** que protege el acceso a las funciones de gestión del chatbot. Este sistema incluye:

- ✅ Login con usuario y contraseña
- ✅ Sesiones persistentes (24 horas)
- ✅ Protección contra acceso no autorizado
- ✅ Notificaciones solo para usuarios autenticados
- ✅ Cierre de sesión seguro

---

## 📋 Respuestas a tus Preguntas

### ¿Alguien sin usuario y contraseña puede recibir notificaciones?

**NO.** El sistema funciona así:

1. **Sin login** → Redirige automáticamente a `/admin-login.html`
2. **Sin sesión válida** → No puede acceder al panel admin
3. **Sin acceso al panel** → No se activan las notificaciones del navegador

Las notificaciones **SOLO** funcionan si:
- ✅ Has iniciado sesión con credenciales válidas
- ✅ Tu sesión sigue activa (no ha expirado)
- ✅ El panel admin está abierto en el navegador

### ¿Hay que ingresar credenciales cada vez?

**NO, la sesión se guarda.** Funciona así:

```
Primera vez:
1. Ingresas usuario y contraseña
2. Sistema crea sesión de 24 horas
3. Token se guarda en localStorage del navegador

Próximas veces:
1. Abres el panel admin
2. Sistema verifica token automáticamente
3. Si es válido → Acceso directo (sin login)
4. Si expiró → Redirige a login
```

**Duración de la sesión:** 24 horas desde el último login

### ¿Se queda guardada la sesión?

**SÍ**, con las siguientes características:

**Almacenamiento:**
- Token guardado en `localStorage` del navegador
- Persiste aunque cierres el navegador
- Válido por 24 horas

**Expira cuando:**
- ❌ Pasan 24 horas desde el login
- ❌ Haces clic en "Cerrar Sesión"
- ❌ Cambias la contraseña
- ❌ Limpias el cache/cookies del navegador

**Seguridad:**
- Cada sesión tiene token único e irrepetible
- Tokens hasheados en la base de datos
- Verificación en cada solicitud al servidor

---

## 🚀 Setup Inicial (Primera Vez)

### Paso 1: Configurar Variable de Entorno

En Vercel, agrega la variable:
```bash
ADMIN_SETUP_SECRET=tu-clave-secreta-aquí
```

Puedes usar un generador de claves o crear una manualmente:
```bash
# Ejemplo de clave segura
ADMIN_SETUP_SECRET=bioskin_admin_2025_secure_key_xyz123
```

### Paso 2: Acceder a la Página de Setup

Ve a: `https://saludbioskin.vercel.app/admin-setup.html`

### Paso 3: Inicializar Base de Datos

1. Haz clic en **"🗄️ Inicializar Tablas"**
2. Esto crea las tablas necesarias en PostgreSQL:
   - `admin_users` - Usuarios administradores
   - `admin_sessions` - Sesiones activas

### Paso 4: Crear Usuario Admin

Completa el formulario:
```
Secret Key: [tu ADMIN_SETUP_SECRET]
Usuario: admin
Contraseña: [contraseña segura de 8+ caracteres]
Email: admin@bioskin.com (opcional)
Nombre: Administrador BIOSKIN (opcional)
```

Haz clic en **"👤 Crear Usuario Admin"**

### Paso 5: Iniciar Sesión

Ve a: `https://saludbioskin.vercel.app/admin-login.html`

Ingresa las credenciales que creaste.

---

## 🔑 Uso Diario

### Login

**URL:** `https://saludbioskin.vercel.app/admin-login.html`

1. Ingresa usuario y contraseña
2. (Opcional) Marca "Mantener sesión activa"
3. Haz clic en **"🔓 Iniciar Sesión"**
4. Serás redirigido al panel admin

### Acceso Automático

Si ya tienes sesión activa:
- Abre directamente: `https://saludbioskin.vercel.app/chatbot-manager.html`
- El sistema verifica tu sesión automáticamente
- Si es válida, entras directamente
- Si expiró, te redirige al login

### Cerrar Sesión

Dentro del panel admin:
- Haz clic en el botón **"🚪 Cerrar Sesión"** (esquina superior derecha)
- Esto invalida tu token inmediatamente
- Serás redirigido al login

---

## 🔒 Seguridad

### Protección de Contraseñas

- ✅ Contraseñas hasheadas con SHA-256
- ✅ Nunca se almacenan en texto plano
- ✅ No se envían por la red sin cifrar

### Tokens de Sesión

- ✅ 64 caracteres hexadecimales aleatorios
- ✅ Únicos e irrepetibles
- ✅ Verificados en cada solicitud
- ✅ Automáticamente invalidados al expirar

### Verificación en Cada Página

Todas las páginas admin verifican la sesión:
```javascript
// Al cargar la página
1. Busca token en localStorage
2. Envía token al servidor para verificación
3. Si válido → Permite acceso
4. Si inválido → Redirige a login
```

### Limpieza Automática

El sistema limpia sesiones expiradas automáticamente.

---

## 📊 Estructura de la Base de Datos

### Tabla: admin_users

```sql
- id (INTEGER) - ID único
- username (VARCHAR) - Nombre de usuario único
- password_hash (VARCHAR) - Hash SHA-256 de la contraseña
- email (VARCHAR) - Email (opcional)
- full_name (VARCHAR) - Nombre completo (opcional)
- created_at (TIMESTAMP) - Fecha de creación
- last_login (TIMESTAMP) - Último inicio de sesión
- is_active (BOOLEAN) - Usuario activo/inactivo
```

### Tabla: admin_sessions

```sql
- id (INTEGER) - ID único
- session_token (VARCHAR) - Token de sesión único
- user_id (INTEGER) - FK a admin_users
- created_at (TIMESTAMP) - Fecha de creación
- expires_at (TIMESTAMP) - Fecha de expiración (24h)
- ip_address (VARCHAR) - IP del login
- user_agent (TEXT) - Navegador usado
- is_active (BOOLEAN) - Sesión activa/inactiva
```

---

## 🛠️ API Endpoints

### POST /api/admin-auth?action=login

Inicia sesión y crea token.

**Request:**
```json
{
  "username": "admin",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "abc123...",
  "expiresAt": "2025-11-19T10:00:00Z",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@bioskin.com"
  }
}
```

### GET /api/admin-auth?action=verify

Verifica si un token es válido.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": { ... },
  "expiresAt": "2025-11-19T10:00:00Z"
}
```

### POST /api/admin-auth?action=logout

Cierra sesión e invalida token.

**Request:**
```json
{
  "sessionToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true
}
```

---

## ⚠️ Solución de Problemas

### "Sesión inválida o expirada"

**Causas:**
- La sesión expiró (24 horas)
- Limpiaste el cache del navegador
- Cambiaste la contraseña

**Solución:**
Vuelve a iniciar sesión en `/admin-login.html`

### "Credenciales inválidas"

**Causas:**
- Usuario o contraseña incorrectos
- Usuario desactivado

**Solución:**
Verifica las credenciales o contacta al administrador del sistema

### "No autorizado"

**Causas:**
- Token no válido
- No has iniciado sesión

**Solución:**
Inicia sesión nuevamente

### No puedo crear usuarios

**Causas:**
- `ADMIN_SETUP_SECRET` no configurado
- Secret incorrecto

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Agrega `ADMIN_SETUP_SECRET` con una clave segura
3. Re-deploy el proyecto

---

## 🔄 Cambiar Contraseña (Próximamente)

Funcionalidad para cambiar contraseña estará disponible en el panel de perfil.

Por ahora, para cambiar contraseña:
1. Conectar directamente a la BD
2. O crear nuevo usuario con `/admin-setup.html`

---

## 📱 Compatibilidad

El sistema de autenticación funciona en:
- ✅ Chrome/Edge (versión moderna)
- ✅ Firefox (versión moderna)
- ✅ Safari (macOS/iOS)
- ✅ Opera/Brave

Requiere:
- JavaScript habilitado
- LocalStorage habilitado
- Cookies habilitadas

---

## 🎯 Flujo Completo

```
1. Usuario abre /chatbot-manager.html
2. Sistema busca token en localStorage
3. ¿Token existe?
   NO → Redirige a /admin-login.html
   SÍ → Continúa al paso 4
4. Sistema verifica token en servidor
5. ¿Token válido?
   NO → Redirige a /admin-login.html
   SÍ → Muestra panel admin
6. Usuario puede usar todas las funciones
7. Notificaciones solo activas si sesión válida
8. Al cerrar sesión → Invalida token
```

---

**Última actualización:** Noviembre 2025  
**Versión:** 2.0  
**Estado:** ✅ Producción
