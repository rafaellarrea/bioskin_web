# BIOSKIN Website - Progreso del Proyecto

## 📊 Información General
- **Proyecto**: Website medicina estética BIOSKIN
- **Tecnología**: React 18 + TypeScript + Vite + TailwindCSS
- **Inicio**: Octubre 2025
- **Estado**: ✅ Producción + Chatbot WhatsApp Activo

---

## 🎯 Últimas Actualizaciones

### ✅ **Apr 24, 2026: Corrección de correos de staff en agenda**
- 📧 **Asuntos/Cuerpos**: Ajustadas plantillas para cita agendada, cita cancelada, bloqueo creado y bloqueos eliminados.
- 🧭 **Consistencia**: Eliminado mismatch de asunto "cita agendada" en flujos de cancelación.
- 🔔 **Notificación nueva**: Al bloquear horarios desde admin ahora también se envía correo al staff.

### ✅ **Apr 6, 2026: Auditoría Serverless — 12→11 funciones**
- 🗑️ **Eliminada** `api/init-technical-db-vercel.js` — script de migración one-shot sin uso continuo (0 refs). Lógica preservada en `scripts/init-technical-service-db.js`.
- 📊 **Conteo final**: 11/12 funciones serverless (1 slot libre).

### ✅ **Apr 6, 2026: Módulo de Inyectables + Mapeo 3D en Ficha Clínica**
- 💉 **InjectablesSubPanel**: Nuevo componente para registro de inyectables (toxina/HA) con catálogo autocomplete.
- 🔀 **Toggle Switch**: Switch en TreatmentTab para habilitar/deshabilitar el registro de inyectables por tratamiento.
- 🧊 **Clinical3DViewer**: Componente 3D reutilizable extraído de Clinical3D para visor facial embebido.
- 📦 **male_head.glb**: Modelo 3D por defecto servido desde `public/models/clinical/`.
- 🗄️ **DB Migration**: Añadidos `treatment_id`, `product_type`, `units_used`, `injection_plane`, `needle_type`, `mapping_data` a tabla `injectables`.
- 🔌 **API CRUD**: Endpoints `addInjectable`, `updateInjectable`, `deleteInjectable`, `getInjectablesByTreatment` en `api/records.js`.

### ✅ **Apr 6, 2026: Agentes y Skills de Copilot**
- 🤖 **Frontend**: Creado `.github/agents/frontend-expert.agent.md` para React, Tailwind, UI/UX y buenas prácticas.
- 🔐 **Seguridad**: Creado `.github/agents/security-guardian.agent.md` para credenciales, datos sensibles, endpoints y hardening.
- ⚙️ **Backend**: Creado `.github/agents/backend-engineer.agent.md` para APIs, lógica server-side y buenas prácticas de backend.
- 🧹 **Auditoría**: Creado `.github/agents/code-auditor.agent.md` para detectar errores, código obsoleto, pruebas temporales y mejoras de calidad.
- 🚀 **DevOps/Vercel**: Creado `.github/agents/devops-vercel.agent.md` para deploys, producción y troubleshooting operativo.
- ✅ **QA/Testing**: Creado `.github/agents/qa-testing.agent.md` para validación, regresión, smoke tests y verificación con evidencia.
- 🛠️ **Skills**: Agregadas `.github/skills/vercel-operations`, `.github/skills/testing-validation` y `.github/skills/code-cleanup-audit`.
- 📘 **Orquestación**: Agregado `AGENTS.md` con reglas de selección de agentes y `.github/instructions/security-qa-gate.instructions.md` para revisión obligatoria de seguridad y QA en `api/**` y `lib/**`.

### ✅ **Apr 2, 2026: Consentimiento Xeomin 100UI**
- 📄 **Consentimiento**: Agregada plantilla para "Rejuvenecimiento Facial con Toxina Botulínica Tipo A (XEOMIN 100UI)".

### ✅ **Apr 2, 2026: Flujo Inteligente de Cliente en Servicio Técnico**
- 🔎 **Búsqueda Cliente**: Implementado autocompletado por nombre, cédula o teléfono en creación de documentos técnicos.
- 🧭 **UX Admin**: Agregado flujo recomendado de selección de cliente existente o creación de cliente nuevo.
- ⚡ **Atajo**: Nuevo botón "Nuevo para este cliente" desde cada carpeta del dashboard técnico.

### ✅ **Mar 27, 2026: Servicio Técnico por Cliente y Borradores**
- 📁 **Admin Técnico**: Implementada vista tipo carpetas por cliente con documentos agrupados.
- 📝 **Documentos**: Agregado guardado en borrador, edición robusta y nuevo tipo "Acta Entrega/Recepción".
- 🔁 **Operación**: Habilitada copia de informes/proformas/actas entre clientes desde el dashboard.

### ✅ **Mar 23, 2026: UI Segmentation & Print Optimization**
- 🔧 **Frontend**: Segmentado formulario técnico por tipo (Recepción/Informe/Proforma).
- 🖨️ **Print**: Corregida vista de impresión (eliminados elementos web) y agregados términos legales para Ecuador.
- 🖱️ **UX**: Campos dinámicos y checklists específicos por documento.

### ✅ **Mar 23, 2026: BioskinTech Technical Service**
- 🔧 **Backend**: Implementado módulo `api/technical-service.js` y tabla `technical_service_documents` en NeonDB.
- 💻 **Frontend**: Agregado Dashboard de Servicio Técnico, formularios dinámicos y vista de impresión.
- 🧪 **Testing**: Script de validación `scripts/test-technical-service.js`.

### ✅ **Mar 18, 2026: Consent Forms Update**
- 📄 **Consentimiento**: Agregada plantilla para "Tratamiento Combinado de Reducción de Papada no Quirúrgico".

- ✅ **Mar 09, 2026: Cleanup & Optimization**
- 🗑️ **Limpieza**: Eliminada funcionalidad obsoleta de Estadísticas y Analytics.
- 📉 **Frontend**: Removidos componentes de gráficos y métricas del Dashboard Admin.
- 🔧 **Backend**: Eliminados endpoints y servicios de analítica en desuso.
- 📄 **Vistas**: Eliminada página de monitor de chatbot legacy.

- ✅ **Feb 20, 2026: Internal Bot Refactoring**
- 🗑️ **Limpieza**: Eliminado "Monitor de Actividad" del dashboard admin.
- 🔧 **Infraestructura**: Aisladas tablas de base de datos (`internal_bot_*`) para uso exclusivo interno.
- ⚡ **Serverless**: Consolidada lógica de bot en `api/whatsapp-internal.js`, eliminado endpoint heredado.
- 🐛 **Build**: Corregida configuración de Vercel y restaurado botón de respaldo en Dashboard.
- 💾 **Feature**: Agregado módulo de "Gestión de Base de Datos" (Backup) en el Panel React.

- ✅ **Feb 20, 2026: Medical Finance Upgrade**
- 💰 **Finanzas**: Agregado campo "Método de Pago" (Efectivo/Transferencia/etc) en IA y BBDD.
- 📊 **Reportes**: Nuevo desglose detallado de Honorarios Médicos y Formas de Pago en PDF.
- 📝 **UX**: Edición de método de pago antes de guardar registros.

### ✅ **Feb 18, 2026: New Blog Post**
- 📝 **Blog**: Publicado artículo "Luminosidad y Firmeza: IPL + RF".
- 📂 **Estructura**: Creada carpeta `src/data/blogs/ipl-radiofrecuencia-bipolar-beneficios`.
- 📝 **Blog**: Publicado artículo "Analizador Facial Inteligente".
- 📂 **Estructura**: Creada carpeta `src/data/blogs/analizador-facial-inteligente-diagnostico`.
- ✅ Feb 18 Fixed build errors in ExternalMedicalFinance (JSX syntax & Types)
- 📝 **Blog**: Publicado artículo "Láser CO2 Fraccionado: El Estándar de Oro".
- 📂 **Estructura**: Creada carpeta `src/data/blogs/laser-co2-fraccionado-bioskin`.

### ✅ **Feb 18, 2026: Consent Forms Update**
- 📄 **Consentimiento**: Agregada plantilla para "Tratamiento de Melasma con Láser Nd:YAG".
- 📄 **Consentimiento**: Agregada plantilla para "Rejuvenecimiento Facial con Láser de CO2 Fraccionado".
- 📄 **Consentimiento**: Agregada plantilla para "Tratamiento de Depilación Definitiva con IPL".
- 📄 **Consentimiento**: Agregada plantilla para "Tratamiento de Lesiones Pigmentadas Láser Nd:YAG".

### ✅ **Jan 29, 2026: Google Calendar Integration Verification**
- 🛡️ **Diagnóstico**: Verificada y confirmada conectividad completa con API Google Calendar.
- 🧪 **Testing**: Creado script `scripts/verify-calendar-integration.js` para pruebas CRUD automáticas.
- 🔍 **Análisis**: Identificada riesgo en `api/sendEmail.js` donde fallos de correo bloquean agendamiento.

### ✅ **Jan 15, 2026: Inventory Units Update**
- 📏 **Unidades**: Agregada opciones "Gramos", "Onzas" y "UI" al formulario de productos.

### ✅ **Jan 15, 2026: Inventory Batch Deletion**
- 🗑️ **Eliminación**: Implementada eliminación explícita de lotes con limpieza en cascada de movimientos.
- 🛡️ **Integridad**: Actualizada eliminación de productos para borrar automáticamente historial de lotes y movimientos asociados.

### ✅ **Jan 6, 2026: Inventory Audit Improvements**
- 🛡️ **Auditoría**: Mejorado módulo de auditoría de movimientos con eliminación y limpieza de historial.
- 🔍 **Filtros**: Agregados filtros por rango de fechas y tipo de movimiento (Ingreso/Salida).
- 🧹 **Limpieza**: Implementada función para depuración masiva de registros antiguos.

### ✅ **Jan 4, 2026: Inventory Restock & Visual Fixes**
- 🔄 **Reposición**: Agregado botón "Reponer / Nuevo Envase" en modal de consumo para facilitar el flujo de reabastecimiento.
- 📉 **Agotado**: Agregada opción "Agotado" (0%) en selector visual.
- 🔢 **Conteo**: El listado de inventario ahora muestra el conteo de unidades/lotes activos (ej. "2 Unidades").
- 🛠️ **Corrección**: Permitido guardar consumo "0" si el objetivo es solo actualizar la preferencia visual (porcentaje).

### ✅ **Jan 4, 2026: Inventory Display Preference**
- 👁️ **Visualización**: Implementada preferencia de visualización (Porcentaje vs Absoluto) basada en el último método de actualización de stock.
- 🗄️ **Base de Datos**: Agregada columna `preferred_display_unit` a `inventory_items` y migración automática.
- 📊 **Dashboard**: El listado de inventario ahora muestra el porcentaje de stock restante si se usó el selector visual.

### ✅ **Jan 4, 2026: Inventory Consumption Logic**
- 🧮 **Cálculo**: Ajustada lógica de selector visual para calcular consumo basado en el porcentaje del total inicial del lote (ej. 40% de 500ml = 200ml restantes).
- 📊 **UI**: Mejorada visualización de "Nivel Restante" vs "Consumo a Registrar" en el modal.

### ✅ **Jan 4, 2026: Inventory Consumption UI**
- 🎛️ **Selector Visual**: Reemplazado toggle por checkbox para activar modo visual de nivel restante.
- 📉 **Lógica**: Clarificado que el selector visual define el nivel restante en el envase, calculando el consumo automáticamente.

### ✅ **Jan 4, 2026: Prescription Print Styling**
- 📏 **Estilos**: Reducido tamaño de fuente y espaciado en receta médica para optimizar espacio en formato media hoja A4.

### ✅ **Jan 4, 2026: Prescription Print Layout**
- 🖨️ **Impresión**: Ajustado diseño de receta médica para imprimir en media hoja A4 (formato A5 horizontal superior).

### ✅ **Jan 4, 2026: Inventory Visual Overhaul**
- 🎨 **Animaciones**: Implementado `framer-motion` para transiciones suaves y efectos "game-like" en lista de inventario.
- 👁️ **Contraste**: Mejorada legibilidad en modo oscuro (textos blancos/grises claros) y feedback visual en botones.

### ✅ **Jan 4, 2026: Inventory CRUD & UI Polish**
- 🔄 **CRUD Completo**: Implementadas funciones de Edición y Eliminación de productos.
- 🎨 **UI Mejorada**: Botones de acción con iconos claros, tooltips para descripciones y uso de colores corporativos.
- 🛠️ **Flexibilidad**: Edición completa de items incluyendo cambio de Grupo/Categoría.

### ✅ **Jan 4, 2026: Inventory Subcategories**
- 🗂️ **Estructura**: Agregado campo `group_name` para subcategorizar productos (ej. Protectores Solares > Facial/Corporal).
- 🎨 **UI**: Actualizada lista de inventario para agrupar visualmente por Categoría > Subcategoría.
- 📝 **Formulario**: Nuevo campo para asignar Grupo/Familia al crear productos.

### ✅ **Jan 4, 2026: Inventory Module Enhancements**
- 📦 **Inventario**: Agregado campo "Registro Sanitario" y soporte para cantidades decimales (NUMERIC).
- 🎨 **UI**: Implementada vista agrupada por items y selector visual de nivel restante para consumibles.
- ⚙️ **Lógica**: Lotes opcionales (auto-generados) y cálculo de consumo basado en nivel restante visual.

### ✅ **Jan 4, 2026: Serverless Function Optimization**
- 🐛 **Bugfix**: Corregido error `MODULE_NOT_FOUND` en Vercel reemplazando `chatbot-appointment-service.js` por `internal-bot-appointment-service.js` (archivo duplicado).
- ⚡ **Consolidación API**: Fusionados `api/internal-chat.js` y `api/gemini.js` en `api/internal-bot-api.js` para reducir uso de funciones serverless.
- 🧹 **Limpieza**: Eliminados archivos obsoletos y actualizadas referencias en frontend y scripts.

### ✅ **Jan 3, 2026: Codebase Cleanup**
- 🧹 **AI Blog Removal**: Eliminados archivos y endpoints relacionados con la generación automática de blogs con IA (`api/ai-blog`, `lib/dynamic-blogs-storage.js`, etc.) para simplificar el proyecto.

### ✅ **Jan 3, 2026: Inventory Module Initialization**
- 📦 **Inventario**: Inicializada base de datos de inventario en Neon (tablas items, batches, movements).
- 🧪 **Testing**: Creado y ejecutado script de prueba para verificar flujo de inventario.

### ✅ **Jan 3, 2026: Admin UI & Data Updates**
- 🏥 **Ficha Clínica**: Agregada opción "Ninguno" por defecto en antecedentes y ampliada paleta de tratamientos con 28 nuevos servicios.
- 🔙 **Navegación**: Agregado botón "Volver" faltante en Asistente de Respuestas (Gema).
- 🛠️ **Scripts**: Implementados scripts de actualización masiva para opciones de antecedentes y tratamientos.

### ✅ **Jan 3, 2026: Chat Assistant & Clinical Records Fixes**
- 💬 **Prompt Tuning**: Optimizado prompt del asistente interno para incluir descripción y beneficios de tratamientos de forma concisa.
- 🐛 **Recetas**: Corregido bug que impedía guardar items de receta si solo tenían nombre comercial (sin principio activo).
- 🧪 **Testing**: Verificada integridad de guardado de recetas mediante script de prueba.

### ✅ **Jan 3, 2026: Chat Assistant Optimization**
- 💬 **Prompt Tuning**: Optimizado prompt del asistente interno para respuestas más concretas y breves en WhatsApp.

### ✅ **Jan 2, 2026: Internal Assistant & Vercel Optimization**
- 🤖 **Asistente Interno**: Integración con Google Calendar (ver/cancelar citas) y generación de frases motivacionales con IA.
- 📅 **Agenda Diaria**: Sistema de notificación automática vía WhatsApp con agenda del día y frase motivacional.
- ⚡ **Optimización Vercel**: Consolidación de Cron Job en `api/internal-chat.js` para cumplir límite de 12 funciones serverless.

### ✅ **Jan 2, 2026: Internal Chat Assistant Upgrade**
- 🤖 **Persona**: Actualizado prompt del sistema para clonar a "Dra. Daniela Creamer" con saludo formal obligatorio.
- 📜 **Historial**: Implementada barra lateral con historial de conversaciones pasadas.
- 🔄 **CRUD**: Agregada funcionalidad para listar, cargar y eliminar chats anteriores.
- 💅 **UI**: Rediseño completo de `AdminChatAssistant` con soporte para múltiples sesiones.

### ✅ **Jan 2, 2026: UI Fixes**
- 🐛 **WhatsApp Button**: Corregida visibilidad aumentando z-index y ajustando posición.

### ✅ **Dec 26, 2025: Clinical Records - Consultation Section**
- 📝 **Nueva Sección**: Agregada pestaña "Consulta" al inicio de la ficha clínica.
- 🗃️ **Base de Datos**: Creada tabla `consultation_info` en Neon DB para "Motivo de Consulta" y "Enfermedad Actual".
- 🔄 **Integración**: Actualizada API y frontend para soportar lectura/escritura de la nueva sección.

### ✅ **Dec 24, 2025: Clinical Records - UX Fixes**
- ⚡ **Performance**: Eliminado parpadeo y recarga completa de componentes al guardar cambios.
- 🔄 **Estado**: Implementada actualización silenciosa de datos para mantener el foco y estado de edición.
- 🐛 **Bugfix**: Corregido problema que impedía ver mensajes de éxito o continuar editando tras guardar.

### ✅ **Dec 24, 2025: Clinical Records - History Tab Improvements**
- 🔄 **Sincronización**: Implementada actualización automática de datos al guardar.
- 🔒 **UX**: Deshabilitados campos durante el guardado para evitar conflictos.
- 💬 **Feedback**: Reemplazado `alert` intrusivo por mensaje de éxito auto-ocultable.
- 📝 **Edición**: Confirmada y mejorada la capacidad de edición directa en campos de texto.

### ✅ **Dec 24, 2025: Clinical Records - Facial Routine & Bullet Format**
- 🗃️ **Esquema DB**: Agregada columna `facial_routine` a tabla `medical_history`.
- 💾 **Guardado**: Corregido bug que impedía guardar "Rutina de Cuidado Facial".
- 📝 **Formato**: Items guardados con viñetas y saltos de línea en lugar de comas.

### ✅ **Dec 23, 2025: Clinical Records - Delete Feature**
- 🗑️ **Expedientes**: Implementada funcionalidad para eliminar expedientes clínicos individuales.
- ⚙️ **API**: Agregado endpoint `deleteRecord` en `api/records.js` con manejo de cascada.
- 📱 **UI**: Agregado botón de eliminar en la lista de expedientes de `PatientDetail.tsx`.

### ✅ **Dec 23, 2025: Product Pricing & UI Updates**
- 🏷️ **Precios**: Actualizados precios de Analizador, Láser CO2, HIFU y 3 en 1 con descuentos.
- 💅 **UI**: Agregado soporte para precio original tachado y leyenda "IVA INCLUIDO" en tarjetas de producto.
- 🗑️ **Limpieza**: Eliminado modal de oferta HIFU obsoleto.

### ✅ **Dec 22, 2025: Prescription UI Improvements**
- 📏 **Layout**: Reducido ancho del historial y aumentado espacio para la tabla de recetas.
- ↔️ **Tabla**: Implementado scroll horizontal y anchos mínimos para evitar que los campos se corten.

### ✅ **Dec 22, 2025: AI Treatment Recursive Fix**
- 🐛 **Protocolo IA**: Implementado formateador recursivo para manejar objetos anidados (ej. `device_parameters`) en la respuesta de la IA.
- 💅 **Formato**: Mejora visual para listas y objetos anidados en el texto del protocolo.

### ✅ **Dec 22, 2025: AI Treatment Fixes**
- 🐛 **Protocolo IA**: Corregido error de visualización `[object Object]` formateando la respuesta JSON.
- 🧠 **Contexto IA**: Mejorada extracción de datos del examen físico (zona, severidad, distribución) para el prompt.

### ✅ **Dec 22, 2025: AI Diagnosis & History Update**
- 🧠 **IA Diagnóstico**: Implementado botón para generar diagnóstico preliminar y notas clínicas usando OpenAI basado en lesiones marcadas.
- 📝 **Antecedentes**: Renombrado "Antecedentes No Patológicos" a "Hábitos" para mayor claridad.
- ⚡ **API**: Consolidada función de diagnóstico IA en `clinical-records.js` para mantener límite de 12 funciones.

### ✅ **Dec 22, 2025: UX Improvement - Lesion Autocomplete**
- ⌨️ **Input Híbrido**: Reemplazados selectores fijos por inputs con `datalist`.
- 🔍 **Funcionalidad**: Permite buscar en el catálogo existente O escribir una lesión personalizada si no existe.
- 🔄 **Alcance**: Aplicado tanto al selector principal como al modal de edición.

### ✅ **Dec 22, 2025: New Feature - Clinical Severity**
- 🌡️ **Grados**: Implementada opción de severidad (Leve, Moderado, Severo, Profundo) en el modal de edición de marcas.
- 👁️ **Visualización**: Severidad visible en tooltips de mapas y lista lateral.

### ✅ **Dec 22, 2025: UI Fixes & Tooltips (Final)**
- 🐛 **Tooltips**: Implementado renderizado `fixed` a nivel raíz para evitar recorte por `overflow` en contenedores laterales.
- 📏 **Mapa Facial**: Reducido ancho máximo a 450px para mejor proporción.

### ✅ **Dec 22, 2025: UI Fixes & Tooltips**
- 📏 **Mapa Facial**: Reducido ancho máximo a 450px para mejor proporción.
- 🐛 **Tooltips**: Aumentado `z-index` a 100 y agregado `pointer-events-none` para evitar conflictos de superposición con el mapa.

### ✅ **Dec 22, 2025: UI Fixes Mapa Facial (Final)**
- 📜 **Scroll**: Implementado contenedor con scroll vertical (`overflow-y-auto`) y altura fija de 500px.
- 📏 **Dimensiones**: Imagen ajustada a `w-full h-auto` para ocupar todo el ancho disponible sin recortes.
- 🖼️ **Visualización**: Solucionado problema de imagen cortada permitiendo desplazamiento para ver mentón/cuello.

### ✅ **Dec 22, 2025: UI Fixes Mapa Facial (Revert)**
- 📏 **Dimensiones**: Ajustada altura a 500px para coincidir con Mapa Corporal.
- 🎨 **Estilo**: Unificado estilo de contenedor (bordes, sombras) con el componente corporal.
- 🐛 **Fix**: Corregido problema de zoom excesivo que ocultaba partes del rostro.

### ✅ **Dec 22, 2025: UI Fixes Mapa Facial**
- 📏 **Dimensiones**: Eliminada restricción cuadrada y límite de 500px.
- 📜 **Scroll**: Aumentada altura a 800px para mejor visualización de detalles, habilitando scroll en el contenedor.
- 🖼️ **Aspect Ratio**: Imagen ahora usa `object-contain` y tamaño natural para evitar recortes.

### ✅ **Dec 22, 2025: UI Fixes Mapa Corporal (Final)**
- 🎨 **Sticky Header**: Botones de vista ahora son "sticky" para estar siempre visibles.
- 🐛 **Layout Fix**: Corregido problema de recorte (clipping) en contenedor flex centrado.
- 👁️ **Visibilidad**: Botones con fondo sólido y mayor contraste.

### ✅ **Dec 22, 2025: UI Fixes Mapa Corporal**
- 🎨 **Botones Vista**: Rediseño de botones Frontal/Posterior para mayor visibilidad y contraste.
- 👁️ **UX**: Agregada etiqueta explícita "Vista:" para evitar confusión.
- 🐛 **Fix**: Asegurada la renderización correcta del selector de vista en el componente BodyMapCanvas.

### ✅ **Dec 22, 2025: Fix Persistencia Mapas Clínicos**
- 🐛 **Bug Fix**: Corregido error de guardado en `physical_exams` por falta de columnas JSONB.
- 🗄️ **Base de Datos**: Migración automática forzada para agregar columnas `face_map_data` y `body_map_data`.
- 🔄 **Parsing**: Mejora en la carga de datos JSON en el frontend para evitar errores de formato.

### ✅ **Dec 22, 2025: Edición Avanzada de Marcadores (Ficha Clínica)**
- ✏️ **Edición Modal**: Implementado modal para confirmar/editar detalles de la lesión al marcar.
- 📝 **Zonas Manuales**: Permitir edición manual del nombre de la zona (útil para correcciones o zonas corporales específicas).
- 🔄 **Edición Posterior**: Agregada capacidad de editar marcadores ya existentes en la lista.

### ✅ **Dec 22, 2025: Mapeo Corporal 2D (Ficha Clínica)**
- 🗺️ **Mapas Interactivos**: Implementado mapeo 2D para rostro y cuerpo (frontal/posterior) usando imágenes base.
- 🎨 **UI/UX**: Reemplazo de modelo 3D por sistema de marcadores sobre imágenes PNG para mayor compatibilidad.
- 🛠️ **Componentes**: Actualizados FaceMapCanvas y BodyMapCanvas para soportar coordenadas relativas y cambio de vista.

### ✅ **Dec 20, 2025: Módulo Ficha Clínica (Admin)**
- 🏥 **Nueva Funcionalidad**: Implementado sistema completo de Fichas Clínicas en panel administrativo.
- 🗄️ **Base de Datos**: Integración con Neon PostgreSQL (tablas: patients, clinical_records, medical_history, etc.).
- 🔄 **Migración**: Script de extracción de datos desde `centro.db` (SQLite) para catálogos de diagnósticos y tratamientos.
- 🎨 **UI/UX**: Nueva interfaz con pestañas (Antecedentes, Examen Físico, Diagnóstico) y perfil de paciente.
- 🚀 **API**: Endpoints CRUD en `/api/records.js` para gestión de expedientes.

### ✅ **Dec 15, 2025: Fix Build Error (Appointment.tsx)**
- 🐛 **Bug Fix**: Corregido error de sintaxis en `Appointment.tsx` causado por duplicación de código.
- 🧹 **Limpieza**: Eliminado código residual de versiones anteriores en el archivo de agendamiento.
- 🚀 **Build**: Verificación exitosa de `npm run build`.

### ✅ **Dec 15, 2025: Rediseño Visual Futurista (Framer Motion)**
- 🎨 **UI/UX**: Rediseño completo de páginas principales (Home, Services, Products, About, Contact, Blogs, Appointment) con animaciones framer-motion.
- ✨ **Estilo**: Implementación de estética "futurista elegante" con glassmorphism, degradados oscuros y acentos dorados.
- 📱 **Interacción**: Mejoras en transiciones, efectos hover y feedback visual en formularios y tarjetas.

### ✅ **Dec 12, 2025: Rediseño Buscador y SEO Local**
- 🎨 **UI/UX**: Nuevo diseño de barra de búsqueda estilo "KOAJ" integrada bajo el navbar.
- 🌍 **SEO Local**: Implementación de Schema.org `LocalBusiness` y `BlogPosting` con ubicación explícita en Cuenca.
- 📍 **Geo-Tags**: Actualización de coordenadas exactas del Centro Médico Santa María.
- 📱 **Responsive**: Barra visible en escritorio y botón compacto en móvil.

### ✅ **Dec 12, 2025: Reubicación Buscador**
- 🎨 **UI/UX**: Movido el buscador de botón flotante a la barra de navegación superior.
- 📱 **Responsive**: Integración adaptativa en Navbar (escritorio) y menú móvil.
- 🛠️ **Refactor**: Actualizado `AISearch.tsx` para soportar modo `inline` y limpiado `App.tsx`.

### ✅ **Dec 11, 2025: Mejora Buscador y Navegación**
- 🎨 **UI/UX**: Eliminada marca visual "IA" del buscador para una experiencia más integrada.
- 🔗 **Navegación**: Implementado scroll automático a servicios específicos desde resultados de búsqueda.
- 🛠️ **Fix URLs**: Generación robusta de enlaces para productos y servicios en API de búsqueda.

### ✅ **Dec 11, 2025: Actualización Contenido Limpieza Facial**
- 📝 **Precisión**: Eliminada mención de crioradiofrecuencia en "Limpieza Facial" para evitar falsas expectativas.
- 🔄 **Sincronización**: Actualizados `src/data/services.ts` y `data/services.json` con descripción genérica.

### ✅ **Dec 11, 2025: Fix Chatbot Fallback & Regex**
- 🐛 **Fix Regex**: Corregida detección de intención para evitar falso positivo de "no" en "Buenos días".
- 🛡️ **Robustez**: Mejorada la limpieza de mensajes (`trim`) antes del análisis de intenciones.

### ✅ **Dec 07, 2025: Buscador Inteligente con IA**
- 🔍 **Búsqueda Semántica**: Implementado buscador flotante con IA (OpenAI) para consultas naturales.
- ⚡ **Autocompletado**: Sugerencias locales instantáneas de productos y servicios.
- 🚀 **API Serverless**: Nuevo endpoint `/api/search.js` para procesar consultas de forma segura.
- 🎨 **UI/UX**: Botón flotante animado y modal de búsqueda responsivo.

### ✅ **Nov 27, 2025: Actualización de Servicios (Lipopapada)**
- 📝 **Contenido**: Actualizada descripción de "Lipopapada sin cirugía" para incluir crioradiofrecuencia bipolar.
- 🧹 **Limpieza**: Eliminadas referencias a servicios obsoletos (NCTF) en dropdowns de agendamiento.
- 🔄 **Sincronización**: Actualizado `services.json` para reflejar cambios en el bot.

### ✅ **Nov 27, 2025: Refactorización de Promociones**
- 🔄 **Centralización**: Promociones movidas directamente a `services.ts` y `products.json`.
- 🗑️ **Limpieza**: Eliminado `promotions.json` obsoleto.
- 🧩 **Adaptadores**: Actualizados `products-adapter.js` y `services-adapter.js` para leer promociones nativas.
- 🧠 **Servicio Dinámico**: `PromotionsService` ahora agrega promociones en tiempo real desde los catálogos.

### ✅ **Nov 27, 2025: Mejora Flujo Agendamiento (Nombre Primero)**
- 🔄 **Reordenamiento**: El bot ahora pide Nombre -> Fecha -> Hora -> Servicio.
- 👤 **Captura de Datos**: Garantiza que se solicite el nombre antes de iniciar la selección de fecha.
- 🧩 **Nombre Parcial**: Soporte para usuarios que envían solo el primer nombre (pide apellido).
- 🛠️ **Fix Handoff**: Corregida la transferencia de IA a Máquina de Estados para pasar información de usuario existente.

### ✅ **Nov 27, 2025: Actualización de Dirección y Flujo Conversacional**
- 📍 **Dirección Actualizada**: Nueva ubicación en Centro Médico Santa María.
- 🗺️ **Enlaces Permitidos**: Habilitado envío de links de Google Maps en chatbot.
- 💬 **Mejora Conversacional**: Reducción de repetitividad en mención de costo de consulta ($10).

### ✅ **Nov 27, 2025: Fix Import JSON (Node.js Compatibility)**
- 🐛 **Fix SyntaxError**: Reemplazado `import ... assert` por `createRequire` para compatibilidad con Vercel/Node.js.
- ⚡ **Estabilidad**: Solucionado crash del proceso por sintaxis no soportada.

### ✅ **Nov 27, 2025: Fix JSON Leak en Respuestas**
- 🛡️ **Sanitización**: Implementada limpieza automática de JSON anidado en `responseText`.
- 🧠 **Recuperación**: Si el modelo mezcla texto y JSON, el sistema ahora extrae correctamente la parte útil.
- 🚫 **Prevención**: Evita que los usuarios vean metadatos técnicos como `{ "responseText": ... }`.

### ✅ **Nov 27, 2025: Corrección de Errores Críticos (Logs Vercel)**
- 🐛 **Fix Debounce**: Corregido error `res is not defined` al abortar respuestas duplicadas.
- 🐛 **Fix Technical AI**: Agregado import faltante `getOpenAIClient` en servicio técnico.
- ⚡ **Estabilidad**: El sistema ahora maneja correctamente la concurrencia de mensajes sin crashear.

### ✅ **Feb 01, 2026: Actualización de Dirección y Mapa**
- 📍 **Nueva Ubicación**: Actualizada dirección a Av. Ordoñez Lasso y calle del Culantro, Edificio Torre Victoria.
- 🗺️ **Mapa**: Coordenadas actualizadas en la página de contacto (-2.878367, -79.068850).
- 🤖 **IA & Bots**: Actualizados prompts de sistemas con nueva dirección.

### ✅ **Nov 27, 2025: Debounce y Agrupación de Mensajes**
- ⏳ **Espera Inteligente**: El bot espera 10 segundos antes de responder para agrupar mensajes consecutivos.
- 🛑 **Prevención de Conflictos**: Si llega un nuevo mensaje durante la espera, el proceso anterior se cancela.
- 🧠 **Contexto Completo**: La IA recibe todos los mensajes acumulados para dar una respuesta coherente.
- ⚡ **Optimización**: Reduce respuestas fragmentadas y mejora la experiencia de usuario en WhatsApp.

### ✅ **Nov 27, 2025: Ultra-Mejora Chatbot Médico (Triage + Jerga)**
- 🚑 **Triage Clínico**: Detección automática de urgencias (sangrado, infección) -> Escalamiento inmediato
- 🗣️ **Mapeo de Jerga**: "Vampiro" -> PRP, "Baby Botox" -> Preventiva, etc.
- 🛡️ **Seguridad**: Política estricta de NO diagnóstico y NO receta por chat
- 🧠 **Prompt Médico**: Empatía + Venta Consultiva + Cierre ($10 abono)
- 📊 **Metadata**: Respuestas incluyen nivel de triage y tratamientos sugeridos

### ✅ **Nov 27, 2025: Control de Chatbot y Mejoras en Consultas**
- 🤖 **Toggle Admin**: Nuevo control para activar/desactivar chatbot desde panel
- 🧠 **IA Mejorada**: Distingue preguntas sobre costos de consulta vs agendamiento
- 💰 **Respuesta Inteligente**: Explica política de abono de consulta ($10) antes de agendar
- 🛠️ **API Settings**: Nuevo endpoint para gestión de configuración global

### ✅ **Nov 26, 2025: Refactor Radical - IA Verdaderamente Inteligente**
- 🔥 **Eliminadas 282 líneas**: Código predefinido y casos especiales removidos
- 🤖 **IA con contexto completo**: TODAS las consultas procesadas por IA con catálogo completo
- 🎯 **Filosofía**: Confiar en GPT-4o-mini + contexto en lugar de lógica programada
- ✅ **Sistema simplificado**: Solo 1 flujo - IA analiza y responde
- 📋 **Contexto enriquecido**: Servicios con ID, keywords, beneficios, promociones
- 🚫 **Sin casos especiales**: NO más if/else para tratamientos específicos
- 💡 **Resultado**: "Bioestimuladores" → IA busca en keywords/beneficios y lista TODOS los tratamientos relacionados
- 🎨 **Prompt mejorado**: Instrucciones claras para búsqueda por sinónimos y categorías

### ✅ **Nov 26, 2025: Fix Crítico - IA Lista TODOS los Tratamientos por Categoría**
- 🔍 **Detección inteligente**: Distingue entre consulta general ("bioestimuladores") vs específica ("HIFU")
- 📋 **Respuesta completa**: Cuando usuario dice "bioestimuladores", lista TODOS (HIFU, Bioestimuladores inyectables, Microneedling)
- ❌ **Eliminado**: Código predefinido que solo mostraba un tratamiento
- 🤖 **Delegación a IA**: Consultas generales ahora siempre van a IA con contexto completo
- 📝 **Ejemplo agregado**: Prompt incluye respuesta exacta esperada para "bioestimuladores"
- ✅ **Clasificador mejorado**: 3 ejemplos nuevos para consultas de categoría (bioestimuladores, láser, colágeno)
- 🎯 **Resultado**: Usuario ve TODAS las opciones con precios y promociones, puede elegir informadamente

### ✅ **Nov 26, 2025: IA Inteligente con Contexto Completo del Catálogo**
- 🤖 **Uso obligatorio del catálogo**: IA SIEMPRE revisa services.json antes de responder
- 🔍 **Búsqueda por sinónimos**: "Bioestimuladores" encuentra HIFU, Bioestimuladores inyectables, Microneedling
- 🔍 **Keywords inteligentes**: Usa keywords de cada servicio para búsquedas precisas
- 💬 **Respuestas naturales**: NO más mensajes predefinidos robóticos cuando no entiende opción
- ✅ **Contexto en opciones**: Opción "2" (más info) ahora usa IA con contexto completo en lugar de texto fijo
- 📋 **Información completa**: Respuestas incluyen precio, duración, beneficios y promociones activas
- 🎯 **Ejemplo**: Usuario dice "Bioestimuladores" → IA lista HIFU 7D, Bioestimuladores inyectables, Microneedling con precios/promos
- 📈 **Tokens aumentados**: 350 → 500 para respuestas más completas
- 🧠 **Reglas mejoradas**: 12 reglas específicas de comportamiento para contexto primero

### ✅ **Nov 26, 2025: Información de Contacto y Ubicación Actualizada**
- 📍 **Ubicación corregida**: BIOSKIN está en Cuenca, Ecuador (no Quito)
- 🏢 **Dirección completa**: Av. Ordoñez Lasso y calle de la Menta
- 🕐 **Horarios agregados**: Lun-Vie 9am-7pm, Sáb 9am-4pm, Dom cerrado
- 📞 **Contacto completo**: +593 969 890 689, salud.bioskin@gmail.com
- 🤖 **IA actualizada**: Responde correctamente a preguntas de ubicación, horarios, contacto
- 🎯 **Clasificador mejorado**: Detecta location_inquiry, schedule_inquiry, contact_inquiry

### ✅ **Nov 26, 2025: Sistema de Promociones Unificado con Validación Automática**
- 🎁 **Promociones en services.json**: BLACK WEEK integrada para Hollywood Peel, Microneedling, HIFU 7D
- 📅 **Validación de fechas**: Sistema verifica automáticamente si promoción está activa (validFrom - validUntil)
- 🤖 **IA consciente de promos**: Medical AI recibe contexto completo de promociones activas
- 💰 **Respuesta priorizada**: Al preguntar precio, IA menciona promoción PRIMERO si está activa
- 📋 **Estructura completa**: name, originalPrice, promoPrice, discount, savings, validFrom/Until, terms, displayMessage
- ✅ **Respuesta directa mejorada**: price_inquiry también verifica y muestra promociones antes de precio regular
- 🎯 **Ejemplo formato**: "🎉 BLACK WEEK: 1x$35 o 2x$55 ¡Ahorra $15! (Válida hasta 01/12/2025)"

### ✅ **Nov 26, 2025: Búsqueda Inteligente de Servicios con Normalización**
- 🔍 **Normalización de texto**: Elimina guiones, acentos y espacios extra en búsquedas
- ✅ **Variantes aceptadas**: "anti-aging", "antiaging", "anti aging" → mismo resultado
- ✅ **Sin acentos**: "limpieza", "limpiéza" → mismo resultado
- 🎯 **Búsqueda bidireccional**: Encuentra coincidencias parciales en ambas direcciones
- ✅ **Precios correctos**: Ahora muestra precio específico en lugar de respuesta genérica

### ✅ **Nov 26, 2025: Máquina de Estados - Pregunta Abierta de Tratamiento**
- 📋 **Pregunta mejorada**: Cambió "¿Qué tratamiento deseas? Ejemplos: ..." a pregunta abierta
- ✅ **Texto simplificado**: "¿Qué tratamiento o servicio le gustaría agendar?"
- 🔓 **Sin restricciones**: Acepta CUALQUIER texto como tratamiento válido (mínimo 3 caracteres)
- 🔧 **Validación eliminada**: Ya no rechaza tratamientos no encontrados en catálogo
- ✅ **UX mejorada**: Usuario puede escribir tratamiento en sus propias palabras

### ✅ **Nov 26, 2025: Fix Crítico - Agendamiento Real Funcional**
- 🔧 **Import faltante**: Agregado `getAllServices` a `chatbot-medical-ai-service.js`
- 🚨 **Prioridad máquina**: Dual AI ahora respeta `skipAI` flag completamente
- 🚨 **Condición correcta**: Cambió verificación de `!stateMachine.isActive()` a `!skipAI`
- 🚨 **Control total**: Máquina de estados tiene prioridad absoluta sobre IA
- ✅ **Agendamiento real**: Usuario puede completar flujo de agendamiento sin interferencia de IA

### ✅ **Nov 26, 2025: IA Inteligente con Contexto Completo de Servicios**
- 🤖 **Catálogo completo**: IA tiene acceso a 19 servicios con todos los detalles (precio, duración, beneficios)
- 🤖 **Respuestas diferenciadas**: Comportamiento inteligente según tipo de consulta
- 🤖 **Consulta general**: Lista de nombres sin precios → "¿Cuál le interesa conocer en detalle?"
- 🤖 **Consulta específica**: Detalles completos con precio, duración, beneficios → "¿Le gustaría agendar?"
- 🤖 **Tratamiento no disponible**: Respuesta honesta + sugerencia de alternativas similares
- 🤖 **Instrucciones detalladas**: Ejemplos concretos de respuestas esperadas en system prompt
- 🤖 **Aumento tokens**: max_tokens de 200 → 350 para respuestas detalladas
- 🔧 **Detección agendamiento**: Más palabras clave (agenda, reserva, appointment, book)
- 📄 **Documentación**: CHATBOT-IA-INTELIGENTE.md con ejemplos y flujos completos
- ✅ **Sistema completo**: IA responde contextualmente y ofrece agendamiento cuando apropiado

### ✅ **Nov 22, 2025: Sistema Dual de IA Especializada - Médico + Técnico**
- 🤖 **Archivo nuevo**: `lib/chatbot-medical-ai-service.js` creado
- 🤖 **Clasificador médico**: Few-shot learning con 13 ejemplos médico-estéticos
- 🤖 **Clasificador técnico**: Few-shot learning con 11 ejemplos técnicos
- 🤖 **Dos especializaciones**: Medicina estética (tratamientos) vs Equipos (técnico)
- 🤖 **Entrenamiento específico**: Detecta problemas estéticos, consultas de precio, interés en tratamientos
- 🤖 **Flujo médico**: skin_concern → treatment_interest → consultation_offer
- 🤖 **needsConsultation flag**: Determina si requiere evaluación con Dra. Daniela
- 🤖 **Integración completa**: Clasificación dual en paralelo, enrutamiento por confianza (≥0.70), fallback a IA general
- 🤖 **Priorización inteligente**: Sistema resuelve conflictos usando la IA con mayor confianza
- 🤖 **Tracking analytics**: Eventos separados para medical_detected y technical_detected
- 🔧 **Fix notificaciones**: Agregado caso 'technical_inquiry' en sistema de notificaciones
- 🔧 **Validación mejorada**: Detecta mensajes vacíos y previene envíos fallidos
- 🔧 **Logs adicionales**: Mejor trazabilidad de notificaciones WhatsApp al +593969890689
- ✅ **Sistema completo**: Bot ahora tiene dos roles especializados con IA dedicada funcionando en producción

### ✅ **Nov 21, 2025: Sistema de URLs para Imágenes de Productos**
- 🖼️ **URL dinámica**: Cada imagen tiene URL única con parámetro `?img=N`
- 🖼️ **Compartir imagen**: Botón para copiar URL de imagen específica al portapapeles
- 🖼️ **Persistencia**: URL mantiene la imagen seleccionada al recargar página
- 🖼️ **Notificación visual**: Mensaje de confirmación al copiar URL (2 segundos)
- 🖼️ **Navegación mejorada**: Miniaturas actualizan URL automáticamente
- 🖼️ **Animación suave**: Transición fadeIn para notificación de copiado
- ✅ **Uso**: `#/products/nombre-producto?img=2` accede directamente a imagen 2

### ✅ **Nov 21, 2025: Flujo Servicio Técnico Mejorado - Contexto + Confianza**
- 🔧 **Detección de contexto**: Revisa últimos 4 mensajes para identificar equipo mencionado
- 🔧 **Respuesta con equipo**: IA genera línea específica sobre el equipo para mostrar conocimiento
- 🔧 **Respuesta sin equipo**: Pregunta qué equipo tiene y qué problema presenta
- 🔧 **Siempre ofrece derivación**: Incluye pregunta de contacto con departamento técnico
- 🔧 **Información técnica**: Genera 1-2 líneas profesionales sobre el equipo específico
- 🔧 **Genera confianza**: Muestra experiencia con el tipo de dispositivo
- ✅ **Dos flujos optimizados**: Con contexto (empático + específico) vs Sin contexto (pregunta equipo)

### ✅ **Nov 21, 2025: Terminología Profesional - Departamento Técnico**
- 🔧 **Cambio terminológico**: Reemplazado "Ing. Rafael" por "departamento técnico"
- 🔧 **Mensajes actualizados**: Oferta contacto, confirmación, notificaciones
- 🔧 **Detección mejorada**: Eliminado "ingeniero" de palabras clave de solicitud contacto
- 🔧 **Notificación interna**: Mantiene "Departamento Técnico (Ing. Rafael Larrea)" para staff
- 🔧 **Consistencia total**: 8 referencias actualizadas en whatsapp-chatbot.js
- ✅ **Imagen profesional**: Usuario ve departamento genérico, no nombres específicos

### ✅ **Nov 21, 2025: Flujo Servicio Técnico Completo - Revisión + Solicitud Nombre**
- 🔧 **Saludo contextual**: Agregado según hora de Ecuador (Buenos días/tardes/noches)
- 🔧 **Respuesta servicio técnico**: Confirma revisión de equipos (incluso no adquiridos con BIOSKIN)
- 🔧 **Servicios incluidos**: Instalación, revisión/diagnóstico, mantenimiento, reparación
- 🔧 **Flujo mejorado**: Pregunta → Oferta contacto Ing. → Solicita nombre → Envía notificación
- 🔧 **Detección ampliada**: Reconoce "revisar equipo", "manteni", "repar", "install", "soport"
- 🔧 **Notificación con nombre**: Incluye nombre del cliente en mensaje a BIOSKIN
- 🔧 **Mensaje confirmación**: "He notificado al Ing. Rafael, se comunicará con usted..."
- ✅ **3 pasos**: Confirma servicio → Pide nombre → Notifica BIOSKIN (+593969890689)

### ✅ **Nov 21, 2025: Mejora Flujo Contacto Ing. Rafael - Notificación Interna**
- 🔧 **Cambio requerido**: Link WhatsApp no debe mostrarse hasta que bot no pueda resolver
- 🔧 **Nueva lógica**: Bot pregunta "¿desea que el Ing. Rafael le contacte?" primero
- 🔧 **Confirmación usuario**: Detecta "si/sí/ok/dale/claro/por favor/confirmo/acepto"
- 🔧 **Notificación interna**: Envía mensaje a BIOSKIN (+593969890689), NO al usuario
- 🔧 **Mensaje compacto**: "He notificado al Ing. Rafael, él le contactará al [número]"
- 🔧 **Condiciones estrictas**: Solo ofrece contacto cuando consulta es irresoluble por IA
- 🔧 **Criterios**: Solicitud explícita O problema garantía O +3 msgs técnicos sin resolver
- ✅ **Flujo mejorado**: Usuario no escribe al Ing., el Ing. contacta al usuario

### ✅ **Nov 21, 2025: Fix - Detección Contextual de Precios + Storage Error**
- 🔧 **Problema**: Usuario dice "Si" al bot preguntando por precio → no muestra precio
- 🔧 **Causa**: Buscaba contexto en índice -2 en lugar de último mensaje assistant
- 🔧 **Solución**: `conversationHistory.slice().reverse().find(msg => msg.role === 'assistant')`
- 🔧 **Detección mejorada**: Confirma si bot preguntó "¿desea conocer el precio?"
- 🔧 **Palabras clave**: si/sí/ok/dale/claro/por favor/quiero/me interesa/obvio/afirmativo
- 🔧 **Logging añadido**: Muestra tipo detección (directa vs contextual) y contexto
- 🔧 **Storage error fix**: Validar `result[0]` antes de acceder a `size_bytes`
- ✅ **6/6 pruebas pasando**: Solicitud directa, confirmación contextual, sin falsos positivos

### ✅ **Nov 21, 2025: Fix CRÍTICO - Sistema de Notificaciones Email Restaurado**
- 🔧 **Problema identificado**: `conversationResult.isNew` siempre undefined → no enviaba emails
- 🔧 **Detección nueva conversación**: Ahora usa `history.length === 0` (historial vacío)
- 🔧 **Notificación reactivación**: Calcula inactividad desde último mensaje del usuario
- 🔧 **Umbral configurado**: >10 minutos = envía email de reactivación
- 🔧 **Logs detallados**: `🔍 ¿Es nueva conversación?`, `⏱️ Inactividad: X minutos`
- 🔧 **Dos tipos de email**: `chatbot_new_conversation` y `chatbot_reactivation`
- ✅ **Casos cubiertos**: Primera vez, respuesta inmediata (<10min), reactivación (>10min)

### ✅ **Nov 21, 2025: Fix CRÍTICO - Rutas y Saludos en Producción**
- 🔧 **products-adapter.js path fix**: Cambiado `__dirname` → `process.cwd()` para Vercel
- 🔧 **Error resuelto**: "ENOENT: no such file or directory, open '/var/task/src/data/products.ts'"
- 🔧 **Saludo nocturno corregido**: "Buenos días" a 10:41 PM → "Buenas noches"
- 🔧 **Parseo de hora mejorado**: `new Date().getHours()` en lugar de split() manual
- 🔧 **Logs agregados**: `⏰ Hora Ecuador: HH:MM` para debugging
- 🔧 **Aplicado en 3 lugares**: whatsapp-chatbot.js, chatbot-ai-service.js (2 funciones)
- ✅ **Sistema técnico funcional**: Ahora carga productos correctamente desde src/data/

### ✅ **Nov 20, 2025: Unificación de Servicios (Fuente Única de Verdad)**
- ✅ **src/data/services.ts creado**: 18 servicios completos con interface TypeScript
- ✅ **lib/services-adapter.js creado**: Adaptador backend que lee desde services.ts
- ✅ **Services.tsx actualizado**: Ahora importa desde fuente centralizada (elimina array hardcodeado)
- ✅ **Chatbot actualizado**: 3 archivos (chatbot-ai-service, appointment-state-machine, chatbot-appointment-service)
- ✅ **treatments-data.js eliminado**: 178 líneas de código duplicado removidas
- ✅ **Inconsistencias resueltas**: Hollywood Peel ($30 vs $35), Exosomas ($150 vs $130) unificados
- ✅ **18 servicios totales**: Combinación de web (9) + chatbot (15) con metadata completa
- ✅ **Categorización**: evaluacion, facial, laser, corporal, inyectable, avanzado
- ✅ **Patrón consistente**: Siguiendo products-adapter.js (fuente web + adaptador backend)

### ✅ **Nov 20, 2025: Sistema Técnico IA-First Implementado**
- ✅ **Clasificación basada en IA**: `classifyTechnical()` con few-shot learning (6 ejemplos)
- ✅ **Respuestas dinámicas**: `generateTechnicalReply()` usa IA + contexto de productos
- ✅ **Catálogo de productos técnicos**: 4 equipos con especificaciones, stock, keywords
- ✅ **Helpers de productos**: `searchProducts()`, `getProductByModel()`, `checkStock()`
- ✅ **Subtipos técnicos**: support, sales, installation, warranty, specs, other
- ✅ **Límites de seguridad**: No instrucciones peligrosas, escalamiento cuando necesario
- ✅ **Acciones sugeridas**: troubleshoot, send_manual, create_ticket, transfer_engineer, schedule_visit, provide_quote
- ✅ **Transferencia al Ing. Rafael**: Genera resumen automático + link WhatsApp
- ✅ **Tracking técnico**: `saveTrackingEvent` con confidence y productos encontrados
- ✅ **Fallback heurístico**: Keywords si IA falla (confidence < 0.65)

### ✅ **Nov 20, 2025: Refactor UX Conversacional del State Machine**
- ✅ **Funciones helper DRY**: `formatDateFriendly()`, `formatDateShort()`, `formatAvailableSlots()` para eliminar duplicación
- ✅ **Validación de nombres mejorada**: `isValidName()` acepta guiones, apóstrofes ("María-José", "D'Angelo")
- ✅ **Capitalización automática**: `capitalizeName()` normaliza nombres correctamente
- ✅ **Mensajes concisos**: Eliminadas frases redundantes, tono más natural y directo
- ✅ **Manejo de errores robusto**: `safeCall()` wrapper para todas las llamadas externas
- ✅ **Timeout configurable**: Constructor acepta `options.timeoutMinutes` sin modificar código
- ✅ **8 estados mantenidos**: Flujo completo de confirmación preservado (CONFIRMING_DATE + CONFIRMING_TIME)
- ✅ **Mejoras conversacionales**: Ejemplos claros, menos emojis, instrucciones directas

### ✅ **Nov 20, 2025: Restauración Sistema de Agendamiento WhatsApp**
- ✅ **Notificaciones nuevas conversaciones**: Habilitado `notifyNewConversation` al detectar primer contacto
- ✅ **Logs debug detallados**: Agregados logs en callback de agendamiento con datos completos
- ✅ **Mejora manejo errores**: Stack traces completos + fallback a email en `sendToStaffIndividually`
- ✅ **Fix variable isMedical**: Corregida inconsistencia camelCase (ismedical → isMedical)
- ✅ **Página verificación**: Creado `verify-whatsapp-credentials.html` para diagnóstico en producción
- ✅ **Sistema completo funcional**: Flujo agendamiento → Calendar → Notificación staff verificado

### ✅ **Nov 19, 2025: Notificaciones WhatsApp Inteligentes**
- ✅ **Umbral de 15 minutos**: Notificaciones al staff solo cuando conversación inactiva >15 min
- ✅ **Validación de tiempo**: Calcula tiempo desde último mensaje en historial
- ✅ **Evita spam**: No notifica en conversaciones activas (mensajes cada <15 min)
- ✅ **Nueva conversación**: Siempre notifica cuando es primer contacto del paciente
- ✅ **Logging mejorado**: Muestra minutos de inactividad en consola
- ✅ **Datos adicionales**: Notificación incluye `inactivityMinutes` en payload

### ✅ **Nov 19, 2025: Sistema de Notificaciones del Navegador Mejorado**
- ✅ **Solicitud de permisos correcta**: Ahora pide permisos de notificación al usuario
- ✅ **Validación completa**: Verifica soporte del navegador, permisos granted/denied/default
- ✅ **Notificación de prueba**: Muestra notificación inmediata al activar
- ✅ **Feedback visual mejorado**:
  - Botón con `animate-pulse` cuando está activo
  - Punto verde indicador en esquina superior derecha
  - Tooltips descriptivos con emojis
- ✅ **Logs de debugging**: Console.log para rastrear estado de notificaciones
- ✅ **Detección de nuevas conversaciones**: Muestra preview del mensaje (50 caracteres)
- ✅ **Auto-cierre**: Notificaciones se cierran automáticamente después de 5 segundos
- ✅ **Manejo de errores**: Alertas claras cuando hay problemas con permisos

### ✅ **Nov 19, 2025: Fix AdminChatManager + API Stats**
- ✅ **Fix error 400**: Agregado soporte para `action=stats` en API manager
- ✅ **Fix TypeError**: Filtro de conversaciones con validación de campos undefined
- ✅ **Transformación de datos**: API ahora devuelve campos en camelCase
  - `phone_number` → `phone`
  - `last_message` → `lastMessage`
  - `last_message_at` → `lastMessageTime`
  - `unread_count` → `unreadCount`
  - `message_count` → `messageCount`
  - `conversation_state` → `conversationState`
- ✅ Mensajes transformados con `sender`, `message`, `timestamp`, `isRead`
- ✅ Estadísticas con aliases para compatibilidad (camelCase + snake_case)

### ✅ **Nov 19, 2025: Panel Admin Completo + Fix Autenticación**
- ✅ **Fix autenticación**: Variables de entorno tenían saltos de línea (`\n`), agregado `.trim()`
- ✅ Agregadas 6 páginas administrativas completas:
  - 📅 `AdminCalendarManager` - Gestión completa de agenda
  - 🚫 `AdminBlockSchedule` - Bloqueo de horarios 
  - 🕐 `AdminAppointment` - Agendar citas manualmente
  - 📊 `AdminMonitor` - Monitor de actividad en tiempo real
  - 📈 `AdminStats` - Estadísticas del chatbot
  - 💬 `AdminChatManager` - Gestión de conversaciones (ya existente)
- ✅ Dashboard actualizado con 6 tarjetas de acceso
- ✅ Rutas configuradas en `App.tsx`
- ✅ Todas las páginas con autenticación protegida

### ✅ **Nov 19, 2025: Fix Admin Login + Optimización Funciones**
- ✅ **Problema**: Admin login no funcionaba (credenciales no coincidían)
- ✅ Reconfiguradas variables via Vercel CLI:
  - `ADMIN_USERNAME=admin`
  - `ADMIN_PASSWORD=b10sk1n`
- ✅ **Límite de funciones**: Reducidas de 13 a 10 funciones serverless
  - Eliminadas: `test-admin-auth.js`, `test-chatbot-simple.js`, `test-imports.js`
  - **Margen actual**: 10/12 funciones (2 libres)
- ✅ Deployment exitoso en producción
- ✅ Tabla `admin_sessions` inicializada

### ✅ **Nov 19, 2025: Fix CRÍTICO Error Sintaxis - Método Faltante**
- ✅ **PROBLEMA REAL**: Método `getActivePromotions()` no estaba definido en `promotions-service.js`
- ✅ Código del método estaba flotando entre dos métodos (líneas 123-132)
- ✅ Reorganizado: Definido método `getActivePromotions()` correctamente
- ✅ Verificación de sintaxis: `node --check` pasa en ambos archivos
- ⚠️ **Nota**: El error "Unexpected identifier 'data'" era engañoso, apuntaba al import

### ✅ **Nov 19, 2025: Fix Error Sintaxis chatbot-ai-service.js**
- ✅ Renombrada variable `data` a `appointmentData` en método `extractAppointmentData()`
- ✅ Resuelto conflicto con identificadores reservados en módulo ESM
- ✅ Verificación de sintaxis pasada correctamente

### ⚠️ **Nov 18, 2025: Diagnóstico - Panel Admin Sin Conversaciones**
- ❌ **Problema identificado**: Falta variable `POSTGRES_URL` en Vercel
- ✅ Creado endpoint de prueba: `/api/test-db-connection`
- ✅ Documentación completa: `docs/FIX-NO-CONVERSACIONES.md`
- ✅ Actualizado `.env.example` con `POSTGRES_URL`
- 📋 **Solución**: Configurar connection string de Neon PostgreSQL en Vercel
- 🔗 **Variables críticas faltantes**:
  - `POSTGRES_URL` - Base de datos principal del chatbot
  - `WHATSAPP_STAFF_GROUP_ID` - Grupo para notificaciones

### ✅ **Nov 18, 2025: Optimización de Funciones Serverless + Fix Panel Admin**
- ✅ **Reducción de funciones**: De 11 a 10 funciones serverless (límite: 12)
- ✅ Consolidadas 3 funciones de WhatsApp groups en `whatsapp-groups.js`
  - Eliminadas: `check-groups-eligibility.js`, `create-staff-group.js`, `get-invite-link.js`
  - Nueva función unificada con 3 acciones: check, create, invite
- ✅ Creado `chatbot-monitor.js` (faltante) para panel de monitoreo
- ✅ Agregadas funciones faltantes en `neon-chatbot-db-vercel.js`:
  - `getConversationMessages()`, `getTrackingEvents()`, `getWhatsAppTemplates()`, `getUserPreferences()`
- ✅ Delays de conexión implementados en todos los endpoints (1-1.5s)
- ✅ Corregida firma de `saveMessage()` en `chatbot-manager.js`
- ✅ Panel de admin de chats ahora funcional con retry logic

### ✅ **Nov 19, 2025: Sistema Dual de Roles + Control Total Máquina Estados**
- ✅ **Rol Médico (Salomé)**: Tratamientos faciales/corporales, citas médicas
- ✅ **Rol Técnico**: Equipos HIFU, láser, dispositivos médicos, cotizaciones
- ✅ Detección automática de rol según palabras clave de conversación
- ✅ Promociones segmentadas por rol (médico/técnico) en `data/promotions.json`
- ✅ Flag `skipAI` para control total de máquina de estados (fix conversación Clara)
- ✅ IA completamente silenciada cuando flujo de agendamiento está activo

### ✅ **Nov 19, 2025: Notificaciones Centralizadas con Enrutamiento Inteligente**
- ✅ Actualizado a número principal único: +593969890689 (BIOSKIN)
- ✅ Sistema de detección automática de temas (médico vs técnico)
- ✅ Mensajes personalizados: "Para Dra. Daniela Creamer" o "Para Ing. Rafael Larrea"
- ✅ Enlaces WhatsApp mejorados con presentación completa del paciente
- ✅ Contexto automático según tipo de consulta (tratamiento/equipo)
- ✅ Removidos números individuales del staff (consolidación)

### ✅ **Nov 18, 2025: Sistema Grupo WhatsApp - Creación Automática (CORREGIDO)**
- ✅ Confirmado: WhatsApp Cloud API **SÍ permite crear grupos** programáticamente
- ✅ Implementado `ensureStaffGroupExists()` - crea grupo si no existe
- ✅ Script `create-staff-group.js` - creación manual del grupo via API
- ✅ Script `verify-staff-group.js` - verificación de grupo existente
- ✅ Endpoint: `POST /{phone-number-id}/groups` con participants
- ✅ Documentación actualizada: `docs/WHATSAPP-GROUP-API-GUIDE.md`
- ✅ Sistema robusto con fallback a mensajes individuales
- ✅ Logs detallados para troubleshooting

### ✅ **Nov 19, 2025: Sistema de Grupo WhatsApp para Notificaciones**
- ✅ Implementado `notifyStaffGroup()` con soporte para grupo de WhatsApp
- ✅ Grupo incluye: Bot (+593988148890), Rafael (+593997061321), Daniela (+593998653732)
- ✅ 3 tipos de notificaciones: citas, derivaciones, consultas importantes
- ✅ Fallback automático a números individuales si grupo no configurado
- ✅ Documentación completa: `docs/WHATSAPP-STAFF-GROUP-SETUP.md`
- ✅ Script de prueba: `scripts/test-staff-notifications.js`
- ✅ Variable de entorno: `WHATSAPP_STAFF_GROUP_ID` (formato: numero@g.us)

### ✅ **Nov 19, 2025: Sistema de Notificaciones al Staff**
- ✅ Implementado `notifyStaffNewAppointment()` en `whatsapp-chatbot.js`
- ✅ Notificaciones automáticas a +593997061321 (Ing. Rafael Larrea) y +593998653732 (Dra. Daniela Creamer)
- ✅ Mensaje incluye datos completos: paciente, teléfono, tratamiento, fecha, hora
- ✅ Enlace directo al chat con paciente (https://wa.me/[numero])
- ✅ Callback implementado en state machine (no bloquea cita si falla notificación)
- ✅ Notificaciones enviadas automáticamente después de confirmación de cita

### ✅ **Nov 19, 2025: Mejoras UX en Flujo de Agendamiento**
- ✅ Humanizado mensaje inicial: "Con gusto 😊" en lugar de "Perfecto"
- ✅ Mensaje más natural: "Te ayudo aquí mismo" vs "verifico disponibilidad en tiempo real"
- ✅ Mostrar TODAS las horas disponibles (eliminado truncamiento con "...")
- ✅ Filtro de hora de almuerzo (13:00-14:00 excluido de disponibilidad)
- ✅ Dirección completa en mensaje final: "Av. Ordóñez Lasso y Calle de la Menta"
- ✅ Enlace a Google Maps agregado: https://maps.app.goo.gl/KfXhuCB1hEFhQzP56
- ✅ Pregunta de cierre profesional: "¿Hay algo más en lo que pueda asistirle?"

### ✅ **Nov 18, 2025: Fix Crítico - Parseado de Fechas en Español**
- ✅ Agregado soporte para formato "DD de NOMBREMES" (ej: "19 de noviembre")
- ✅ Soporta todos los meses: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre
- ✅ Soporta variante con año: "25 de diciembre de 2025"
- ✅ Creado `test-date-parsing.js` con 18 casos de prueba (100% passing)
- ✅ Bot ahora entiende el formato más natural en español

### ✅ **Nov 18, 2025: Mejoras en Detección de Inicio de Flujo**
- ✅ Patrón ampliado para detectar "por aquí", "opción 2", "la 2", etc.
- ✅ Detección automática de consultas de disponibilidad directas
- ✅ Protección contra interferencia de IA durante flujo activo
- ✅ Prompt de IA reforzado con ejemplos negativos

### ✅ **Nov 18, 2025: Máquina de Estados para Agendamiento Estructurado**
- ✅ Creado `lib/appointment-state-machine.js` con 7 estados definidos
- ✅ Estados: IDLE → AWAITING_DATE → AWAITING_TIME → AWAITING_NAME → AWAITING_SERVICE → CONFIRMING → COMPLETE
- ✅ Validación estricta en cada paso (no avanza sin dato válido)
- ✅ Eliminada lógica redundante de extracción de datos
- ✅ Flujo secuencial garantizado (sin saltos ni repeticiones)
- ✅ Bot solo ofrece 2 opciones al inicio: link directo o guía paso a paso
- ✅ Prompt actualizado para que IA NO interfiera con el flujo estructurado

### ✅ **Nov 18, 2025: Fix - Bot IA Totalmente Funcional**
- ✅ Salomé se presenta correctamente: "Soy Salomé de BIOSKIN" (nunca "soy un asistente")
- ✅ Tratamiento de "usted" reforzado en prompt y ejemplos
- ✅ Integración con Google Calendar habilitada (calendarTools pasado a IA)
- ✅ Bot consulta disponibilidad automáticamente cuando usuario menciona fecha/hora
- ✅ Sistema IA completo operativo (OpenAI + Calendar + Agendamiento)

### ✅ **Nov 18, 2025: Fix - Reducción de Funciones Serverless**
- ✅ Reducidas funciones de 13 a 8 (límite Vercel Hobby: 12)
- ✅ Eliminadas funciones de testing: `test-openai.js`, `test-simple.js`
- ✅ Eliminada función duplicada: `ai-blog/generate.js` (mantener solo `generate-production.js`)
- ✅ Eliminadas funciones admin no críticas: `chatbot-monitor.js`, `init-chatbot-db.js`
- ✅ Convertido `treatments-data.js` a CommonJS para compatibilidad Vercel

### ✅ **Nov 16, 2025: Refactorización - Catálogo Centralizado de Tratamientos**
- ✅ Creado `lib/treatments-data.js` como fuente única de verdad
- ✅ Eliminada duplicación de datos entre archivos
- ✅ `chatbot-ai-service.js` usa `generateCatalogText()` y `findTreatmentByKeyword()`
- ✅ `chatbot-appointment-service.js` importa funciones helper
- ✅ Estructura de datos unificada: TREATMENTS_CATALOG (5 categorías)
- ✅ Mantenimiento simplificado: actualizar precios en un solo lugar

### ✅ **Nov 16, 2025: Límites Médicos y Transferencia Inteligente a Dra.**
- ✅ Bot NO brinda diagnósticos médicos por chat
- ✅ Proporciona info general (precios, duraciones, beneficios básicos)
- ✅ Detecta interés real y sugiere consulta presencial ($10)
- ✅ Transferencia automática a Dra. Daniela con resumen (3 líneas)
- ✅ Link de WhatsApp generado con contexto de la conversación
- ✅ Precio consulta médica: $10 (30 min)

### ✅ **Nov 16, 2025: Cambio de Personalidad - Salomé (Trato Formal)**
- ✅ Nombre del bot cambiado de Matías a Salomé
- ✅ Tratamiento de "usted" en todas las interacciones
- ✅ Tono 100% profesional y formal
- ✅ Mantiene calidez pero con respeto y formalidad

### ✅ **Nov 16, 2025: Humanización del Chatbot WhatsApp**
- ✅ Eliminadas respuestas predefinidas y scripts rígidos
- ✅ Prompt simplificado y más natural (menos instrucciones)
- ✅ IA responde conversacionalmente sin plantillas
- ✅ Consulta automática a Google Calendar cuando detecta fecha/hora
- ✅ Bot más fluido y adaptado a cada conversación

### ✅ **Nov 14, 2025: Endpoint de Inicialización de BD del Chatbot**
- ✅ Creado `/api/init-chatbot-db` para inicializar tablas
- ✅ Interfaz HTML `/init-chatbot-db.html` para ejecución fácil
- ✅ Manejo de errores mejorado en APIs de gestión
- ✅ Mensajes de error descriptivos con hints de solución

### ✅ **Nov 14, 2025: Sistema de Agendamiento Automatizado en Chatbot**

#### **Agendamiento Automático Implementado**
- ✅ Verificación de disponibilidad en tiempo real con Google Calendar
- ✅ Creación automática de citas sin intervención manual
- ✅ Sugerencias inteligentes según preferencias (mañana/tarde/noche, fines de semana)
- ✅ Parseo de lenguaje natural para fechas y horas
- ✅ Validación completa (no domingos, no horas pasadas, horario 09:00-19:00)
- ✅ Integración con sistema de emails y notificaciones WhatsApp

#### **Flujos de Agendamiento**
**Opción 1: Link directo**
- Usuario pide agendar → Bot ofrece https://saludbioskin.vercel.app/#/appointment

**Opción 2: Agendamiento asistido por chat**
1. Bot pregunta fecha/hora preferida
2. Verifica disponibilidad automáticamente en Google Calendar
3. Si disponible: Confirma y pide datos (nombre, teléfono, tratamiento)
4. Si ocupado: Sugiere 3 horarios alternativos cercanos
5. Usuario confirma → Bot agenda automáticamente

**Sugerencias inteligentes:**
- "después de las 5pm" → Filtra solo 17:00-19:00
- "fin de semana" → Muestra sábados disponibles
- "en la mañana" → Muestra 09:00-12:00
- "viernes" → Muestra próximo viernes disponible

#### **Archivos Nuevos**
- ✅ `lib/chatbot-appointment-service.js` - Servicio completo de agendamiento
- ✅ `docs/CHATBOT-AGENDAMIENTO-AUTOMATICO.md` - Documentación técnica

#### **Archivos Modificados**
- ✅ `lib/chatbot-ai-service.js` - Prompt actualizado con flujo de agendamiento
- ✅ `api/whatsapp-chatbot.js` - Integración con sistema de agendamiento

### ✅ **Nov 14, 2025: Chatbot WhatsApp - Sistema Completo con Monitoreo**

#### **Expansión de Funcionalidades**
- ✅ Integración WhatsApp Business API funcionando
- ✅ Respuestas con OpenAI GPT-4o-mini (3s timeout, 150 tokens)
- ✅ Sistema de fallback inteligente con detección de intención
- ✅ Almacenamiento en memoria (fallback storage)
- ✅ Neon PostgreSQL activado con retry logic (2s timeout)
- ✅ Procesamiento síncrono para Vercel (< 10s)

#### **Base de Datos Extendida (5 tablas, 10 índices)**
**Tablas principales:**
- ✅ `chat_conversations` - Conversaciones con columna `preferences` (JSONB)
- ✅ `chat_messages` - Historial completo de mensajes
- ✅ `chatbot_tracking` - Eventos de tracking y webhooks
- ✅ `chatbot_templates` - Plantillas de marketing WhatsApp
- ✅ `chatbot_app_states` - Estados de sincronización de app

**Índices optimizados:**
- ✅ `idx_session_messages` - Mensajes por sesión
- ✅ `idx_active_sessions` - Sesiones activas
- ✅ `idx_tracking_session` - Tracking por sesión
- ✅ `idx_tracking_type` - Tracking por tipo
- ✅ `idx_app_states_timestamp` - Estados por timestamp
- ✅ `idx_conversation_preferences` - Preferencias (GIN index)

#### **Webhooks Procesados (5 tipos)**
- ✅ **message_echoes** - Sincronización con Business Manager (mensajes enviados desde panel web)
- ✅ **tracking_events** - Análisis de interacciones (clics, vistas, engagement)
- ✅ **template_category_update** - Actualizaciones de plantillas de marketing
- ✅ **smb_app_state_sync** - Estado online/offline de WhatsApp Business
- ✅ **user_preferences** - Preferencias de comunicación (notificaciones, idioma, marketing)

#### **Sistema de Monitoreo Implementado**
- ✅ API `/api/chatbot-monitor` con 6 endpoints:
  - `GET /` - Estadísticas generales (conversaciones, mensajes, tracking)
  - `GET ?action=webhooks` - Conteo por tipo de webhook
  - `GET ?action=tracking` - Eventos de tracking recientes
  - `GET ?action=templates` - Estado de plantillas
  - `GET ?action=preferences` - Análisis de preferencias
  - `GET ?action=conversations` - Conversaciones detalladas
- ✅ Panel visual `/chatbot-monitor.html` con dashboard interactivo

#### **AI Training Mejorado (Dataset BIOSKIN)**
**Catálogo completo de 16 tratamientos con precios exactos:**

**Evaluación:**
- Consulta + escáner facial: $10 USD - 30 min

**Limpieza:**
- Limpieza facial profunda: $25 USD - 90 min
- Limpieza + crioradiofrecuencia: $30 USD - 90 min

**Regeneración:**
- Microneedling: $30 USD - 60 min
- PRP (Plasma Rico en Plaquetas): $30 USD - 45 min
- Bioestimuladores de colágeno: $250 USD - 45 min
- Exosomas: $130 USD - 60 min

**Tecnología Láser:**
- Láser CO2: $150 USD - 90 min
- Rejuvenecimiento IPL: $25 USD - 60 min
- Hollywood peel: $35 USD - 90 min
- Eliminación tatuajes: desde $15 USD - 45-60 min

**Avanzados:**
- HIFU full face: $60 USD - 120 min
- Relleno de labios: $160 USD - 60 min
- Tratamiento despigmentante: $30 USD - 90 min

**Protocolo de atención estructurado:**
- ✅ Saludo estandarizado con presentación completa
- ✅ Sistema de consulta: info básica → detalles → requisitos → agendamiento
- ✅ Precios exactos en USD con duración precisa
- ✅ Derivación médica: Dra. Daniela Creamer (+593969890689)
- ✅ Derivación técnica: Ing. Rafael Larrea (equipos)
- ✅ Integración Google Calendar para disponibilidad
- ✅ Confirmación automática por correo + recordatorio 24h

**Funciones del servicio (`lib/chatbot-ai-service.js`):**
- ✅ `generateResponse()` - Generación con contexto de historial
- ✅ `detectIntent()` - Fallback inteligente sin IA
- ✅ `saveTrackingEvent()` - Registro de eventos
- ✅ `upsertTemplate()` - Gestión de plantillas
- ✅ `saveAppState()` - Estados de app
- ✅ `updateUserPreferences()` - Preferencias de usuario

**Funciones Vercel utilizadas:** 8/12 (66% capacidad)
- whatsapp-chatbot.js
- chatbot-stats.js
- chatbot-monitor.js ⭐ NUEVO
- calendar.js
- blogs.js
- analytics.js
- sendEmail.js
- ai-blog/generate-production.js

### ✅ **Nov 13, 2025: Chatbot WhatsApp Básico Funcional**

- ✅ Webhook WhatsApp Business configurado y verificado
- ✅ Integración OpenAI GPT-4o-mini básica
- ✅ Sistema de fallback en memoria
- ✅ Mensajes gratuitos (customer service window)
- ✅ Base de datos inicial (conversaciones + mensajes)

---

## 🚀 Hitos Principales

### ✅ **Fase 1: Estructura Base** (Octubre 2025)
**Descripción**: Configuración inicial del proyecto con React, routing y diseño base
**Logros**:
- ✅ Setup React 18 + TypeScript + Vite
- ✅ Configuración TailwindCSS con tema dorado (#deb887)
- ✅ HashRouter para compatibilidad Vercel SPA
- ✅ Estructura de componentes base

---

### ✅ **Fase 2: Sistema de Productos** (Octubre 2025)
**Descripción**: Implementación del catálogo completo de productos médico-estéticos
**Logros**:
- ✅ Base de datos centralizada en `src/data/products.ts` (1000+ líneas)
- ✅ Sistema de categorías: equipamiento/cosmético
- ✅ Routing dinámico con slugs
- ✅ Componentes ProductCard y ProductDetail
- ✅ Carrusel de imágenes ImageCarousel

**Archivos clave**:
```
src/data/products.ts          # Catálogo centralizado
src/pages/Products.tsx        # Listado con filtros
src/pages/ProductDetail.tsx   # Vista individual
src/utils/slugify.ts          # Generación URLs
```

---

### ✅ **Fase 3: Integración Google Services** (Mayo 2025 - Producción)
**Descripción**: Sistema de citas y comunicación automatizada
**Logros**:
- ✅ Google Calendar API integration
- ✅ Sistema de envío de emails automático
- ✅ Notificaciones WhatsApp integradas
- ✅ Variables de entorno en producción Vercel

**Archivos clave**:
```
api/getEvents.js             # Calendario ocupado
api/sendEmail.js             # Emails + WhatsApp
```

---

### ✅ **Fase 4: Sistema de Blogs con IA** (Octubre 2025)
**Descripción**: Generación automatizada de contenido médico-estético con IA
**Logros**:
- ✅ Integración OpenAI GPT-4o-mini
- ✅ Límite 2 blogs/semana (1 técnico + 1 médico-estético)
- ✅ Base de datos SQLite con control semanal
- ✅ Prompts especializados 500-700 palabras
- ✅ APIs serverless robustas con manejo errores
- ✅ Sistema de validación y diagnóstico
- ✅ Oct 16 Sistema gestión blogs con CRUD completo + formularios
- ✅ Oct 16 Integración OpenAI para generación automática contenido
- ✅ Oct 16 Base datos SQLite blogs con múltiples fuentes datos
- ✅ Oct 20 Gestión completa blogs todas las fuentes (localStorage + servidor)

**Archivos clave**:
```
lib/ai-service.js            # Servicio OpenAI + prompts
lib/database.js              # SQLite blogs + control semanal
api/ai-blog/generate.js      # Endpoint principal
api/ai-blog/generate-safe.js # Endpoint con fallback
api/blogs/test.js            # Diagnóstico sistema
data/blogs.db                # Base datos SQLite
init-database.js             # Inicialización BD
```
```
api/getEvents.js     # Google Calendar API
api/sendEmail.js     # Email + WhatsApp notifications
```

---

### ✅ **Fase 4: Sistema de Blogs con IA v1.0** (Octubre 2025)
**Descripción**: Primera implementación de generación de contenido con OpenAI
**Logros**:
- ✅ Estructura básica de blogs (Blogs.tsx, BlogDetail.tsx)
- ✅ Base de datos SQLite con better-sqlite3
- ✅ Integración OpenAI GPT-4o-mini
- ✅ API endpoints básicos
- ✅ Hooks personalizados useBlogs/useBlog

**Archivos clave**:
```
src/pages/Blogs.tsx           # Listado principal
src/pages/BlogDetail.tsx      # Vista individual
lib/database.js               # SQLite management
lib/ai-service.js             # OpenAI integration
api/ai-blog/generate.js       # API generación
```

---

### ✅ **Fase 5: Sistema de Blogs con IA v2.0** (Octubre 2025) - **ACTUAL**
**Descripción**: Sistema avanzado con control de límites y prompts estructurados
**Logros**:
- ✅ **Control semanal**: Máximo 2 blogs/semana (1 técnico + 1 médico estético)
- ✅ **Prompts estructurados**: Contenido consistente 500-700 palabras
- ✅ **Base de datos mejorada**: Campos control semanal y metadatos IA
- ✅ **API avanzada**: Validaciones, límites y gestión cupos
- ✅ **Interface testing**: Página prueba con estado semanal visual
- ✅ **Estructura médica/técnica**: Plantillas especializadas por tipo
- ✅ Oct 16 Documentación proyecto: PROGRESS.md y ARCHITECTURE.md
- ✅ Oct 16 Protocolo actualizaciones automáticas documentación
- ✅ Oct 16 README.md completo con setup y guías desarrollo
- ✅ Oct 16 Workflow documentación: obligatorio después cada cambio
- ✅ Oct 16 Interface administración completa: BlogAdmin component
- ✅ Oct 16 Hook personalizado useBlogAdmin para gestión estado
- ✅ Oct 16 Endpoint estadísticas semanales api/ai-blog/stats.js
- ✅ Oct 16 Página admin completa con routing /blogs/admin
- ✅ Oct 16 Resolución errores TypeScript y build exitoso
- ✅ Oct 16 Debug y corrección routing Vercel para endpoints API
- ✅ Oct 16 Configuración explícita functions y rewrites en vercel.json
- ✅ Oct 16 Implementación pestaña Admin independiente con interfaz funcional
- ✅ Oct 16 Separación completa administración vs visualización blogs
- ✅ Oct 16 Hook useBlogAdmin con mock data temporal (endpoint fix pendiente)

**Archivos modificados**:
```
lib/ai-service.js             # Prompts estructurados v2.0
lib/database.js               # Schema con control semanal
api/ai-blog/generate.js       # API con validaciones límites
api/ai-blog/status.js         # Endpoint estado semanal
public/test-openai.html       # Interface testing avanzada
```

**Características técnicas**:
- 🔒 Control límites semanales automático (formato ISO semana)
- 📝 Prompts especializados médico-estético vs técnico
- 📊 Estado semanal en tiempo real
- ⚙️ Metadatos versionado prompts IA
- 🎮 Interface administrativa testing

---

## 📈 Métricas Actuales
- **Archivos totales**: ~45 archivos
- **Componentes React**: 12 componentes
- **Páginas**: 8 páginas principales
- **API Endpoints**: 6 endpoints
- **Base de datos**: SQLite (3 tablas principales)
- **Productos catalogados**: 50+ productos
- **Integraciones**: Google Calendar, OpenAI, Email/WhatsApp

---

### ✅ **Fase 8: Sistema de Blogs Organizados** (Octubre 27, 2025)
**Descripción**: Implementación de generador de blogs con estructura organizada
**Logros**:
- ✅ Oct 27 - Sistema de blogs organizados implementado
- ✅ Oct 27 - Estructura individual por blog con directorios
- ✅ Oct 27 - Gestión de imágenes organizadas por blog
- ✅ Oct 27 - API unificada para blogs organizados y legacy
- ✅ Oct 27 - Interfaz mejorada con gestión visual
- ✅ Oct 27 - Despliegue automático con Git integrado
- ✅ Oct 27 - Documentación completa del sistema

### ✅ **Fase 9: Sistema Admin Avanzado con Calendario** (Noviembre 2025)
**Descripción**: Panel administrativo completo con calendario interactivo y analíticas
**Logros**:
- ✅ Nov 03 - Panel administrativo seguro con auth
- ✅ Nov 03 - Sistema analíticas tiempo real Vercel + localStorage  
- ✅ Nov 03 - Calendario administrativo con vistas mensual/semanal
- ✅ Nov 03 - Indicadores visuales días con citas mejorados
- ✅ Nov 03 - Integración Google Calendar completa
- ✅ Nov 03 - Debugging y página prueba calendario
- ✅ Nov 03 - Optimización rendimiento: carga paralela eventos mes
- ✅ Nov 03 - UX mejorada: overlay carga prominente escritorio
- ✅ Nov 03 - Sistema notificaciones: citas próximas 15 días
- ✅ Nov 03 - Botón flotante notificaciones visible con texto
- ✅ Nov 03 - Migración completa Vercel Analytics: contador global real
- ✅ Nov 03 - Sistema analytics personalizado: datos dashboard tiempo real

**Archivos clave**:
```
blog-generator-local/server-production.js    # Servidor con estructura organizada
lib/organized-blogs-service.js               # Servicio de gestión organizada
api/blogs/organized.js                       # API para frontend
SISTEMA-BLOGS-ORGANIZADO.md                  # Documentación completa
```

**Mejoras técnicas**:
- Blogs en directorios individuales con metadata separado
- Imágenes organizadas en carpetas por blog
- Índice automático consolidado de todos los blogs
- Compatibilidad completa con blogs legacy
- Interfaz con modal de gestión de blogs guardados

### ✅ **Fase 10: Navegación Futurista 3.0** (Octubre 29, 2025)
**Descripción**: Rediseño completo de la navegación con interfaz futurista y moderna
**Logros**:
- ✅ Oct 29 - Navegación completamente rediseñada con efectos 3D
- ✅ Oct 29 - Logo animado con efectos de brillo y sparkles
- ✅ Oct 29 - Gradientes dinámicos individuales por cada sección
- ✅ Oct 29 - Efectos hover con transformaciones y sombras
- ✅ Oct 29 - Backdrop blur y glassmorphism en scroll
- ✅ Oct 29 - Iconos Lucide React para cada sección
- ✅ Oct 29 - Menu móvil overlay moderno con animaciones
- ✅ Oct 29 - Botón CTA destacado "Reserva Ahora" con efectos
- ✅ Oct 29 - Sistema de colores único por categoría
- ✅ Oct 29 - Indicadores visuales de página activa mejorados

**Características técnicas**:
- 🎨 11 gradientes únicos por sección con colores específicos
- ⚡ Efectos scroll dinámicos con backdrop-blur
- 📱 Menu móvil completamente rediseñado con overlay
- ✨ Animaciones CSS personalizadas (spin, pulse, scale)
- 🎯 CTA prominente con doble gradiente y hover effects
- 📍 Indicadores activos con barras brillantes
- 🔄 Estados hover individuales con scaling y sombras

**Archivos modificados**:
```
src/components/Navbar.tsx     # Navegación completamente rediseñada
```

### ✅ **Fase 11: Optimización Crítica API - Vercel Deployment** (Noviembre 05, 2025)
**🚨 PROBLEMA CRÍTICO RESUELTO**: Límite de 12 funciones serverless Vercel Hobby plan excedido

#### 🔧 **Consolidación APIs Implementada**:
- ✅ Funciones reducidas de 13 a 5 (reducción 58%)
- ✅ API calendar.js: Consolidación de 7 operaciones (getEvents, getDayEvents, blockSchedule, getBlockedSchedules, deleteBlockedSchedule, deleteEvent, getCalendarEvents)
- ✅ API blogs.js: Consolidación de 3 operaciones (manage, migrate-all, organized)
- ✅ Sistema de acciones implementado para routing unificado

#### �️ **Funciones Eliminadas**:
- ❌ getEvents.js, getDayEvents.js, getCalendarEvents.js → calendar.js
- ❌ blockSchedule.js, getBlockedSchedules.js, deleteBlockedSchedule.js, deleteEvent.js → calendar.js  
- ❌ blogs/json-files.js, blogs/manage.js, blogs/organized.js → blogs.js

#### 🔄 **Frontend Migración Completa**:
- ✅ AdminBlockSchedule.tsx: Todas las referencias migradas a /api/calendar con parámetros action
- ✅ CalendarManager.tsx: API consolidada con sistema de acciones
- ✅ Appointment.tsx: Migrado a nueva estructura API
- ✅ BlogManagement.tsx: Completamente actualizado para /api/blogs

#### 🎯 **Resultado**:
- ✅ Build exitoso
- ✅ Deploy ready para Vercel (5/12 funciones utilizadas)
- ✅ Funcionalidad completa mantenida
- ✅ Zero breaking changes en UI

---

## �🔄 Próximas Fases Planificadas

### **Fase 12: Verificación Deployment** (Pendiente)
- [ ] Test deployment Vercel con APIs consolidadas
- [ ] Verificación funcionalidad completa en producción
- [ ] Monitoring errores post-deployment

### **Fase 13: UI Final Blogs** (Pendiente)
- [ ] Integración interfaz principal blogs
- [ ] Sistema navegación mejorado
- [ ] Diseño responsive optimizado

### **Fase 14: Optimización Producción** (Pendiente)
- [ ] Configuración variables Vercel completa
- [ ] Testing integral sistema
- [ ] Performance optimization
- [ ] SEO enhancement

---

## 🔧 Stack Tecnológico Actual
```
Frontend:     React 18 + TypeScript + Vite
Styling:      TailwindCSS + Custom Theme
Routing:      React Router (HashRouter)
Database:     SQLite + better-sqlite3
AI:           OpenAI GPT-4o-mini
Backend:      Vercel Serverless Functions
Integration:  Google Calendar + Gmail APIs
Deployment:   Vercel SPA
```

---

## 📝 Notas de Desarrollo
- **Patrón backup**: Archivos `*backup.tsx` para control versiones
- **Convención imágenes**: Rutas absolutas `/public/images/`
- **Gestión estado**: Component-level, sin external state management
- **Git workflow**: Commits descriptivos después de cada feature

### ✅ **Fase 12: Formateo y Estructura Blogs** (Noviembre 07, 2025)
**Descripción**: Mejora del formateo y estructura de archivos JSON de blogs existentes
**Logros**:
- ✅ Nov 07 - Formateo correcto archivos JSON blogs existentes
- ✅ Nov 07 - Excerpts completos sin truncamiento
- ✅ Nov 07 - Categorías normalizadas (tecnologia, cuidado-piel)
- ✅ Nov 07 - Autores profesionalizados (Dr./Dra. BIOSKIN)
- ✅ Nov 07 - Tags específicos y relevantes por temática
- ✅ Nov 07 - Imágenes de conclusión añadidas
- ✅ Nov 07 - Metadata ampliada con SEO y social media
- ✅ Nov 07 - Tiempo de lectura actualizado
- ✅ Nov 07 - Contenido limpio sin símbolos ** de formato

**Archivos formateados**:
```
src/data/blogs/cuidado-1762479081670/index.json      # Blog IA
src/data/blogs/cuidado-1762473538084/index.json      # Blog post-tratamiento
src/data/blogs/cuidado-1762479081670/metadata.json   # Metadata completa
src/data/blogs/cuidado-1762473538084/metadata.json   # Metadata completa
```

### 🚨 **Fase 13: CORRECCIÓN CRÍTICA - Bug de Fechas** (Noviembre 07, 2025)
**Descripción**: Solución urgente al problema de bloqueo de horarios en día incorrecto
**Problema identificado**: Sistema bloqueaba horarios del 8 Nov en lugar del 7 Nov debido a comparación UTC vs Local time

**🔧 Corrección aplicada**:
- ✅ Nov 07 - Identificado bug en función `isHourPast()` usando `toISOString()` (UTC)
- ✅ Nov 07 - Corregido en `src/pages/Appointment.tsx`
- ✅ Nov 07 - Corregido en `src/components/AdminAppointment.tsx` 
- ✅ Nov 07 - Corregido en `src/components/AdminBlockSchedule.tsx`
- ✅ Nov 07 - Implementado manejo de fechas locales correctamente
- ✅ Nov 07 - Creado test de validación `public/test-date-fix.html`
- ✅ Nov 07 - Verificación funcional: horarios se bloquean correctamente hoy

**🐛 Causa del problema**:
```javascript
// INCORRECTO (causaba el bug)
const todayString = today.toISOString().split('T')[0]; // UTC time
const selectedString = selectedDate.toISOString().split('T')[0]; // UTC time

// CORREGIDO
const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const todayString = `${todayLocal.getFullYear()}-${(todayLocal.getMonth() + 1).toString().padStart(2, '0')}-${todayLocal.getDate().toString().padStart(2, '0')}`;
```

**💥 Impacto solucionado**:
- ✅ Horarios del día actual se bloquean correctamente después de pasar
- ✅ No más confusión de fechas UTC vs Local time
- ✅ Sistema respeta zona horaria de Ecuador (UTC-5)
- ✅ Funcionamiento correcto a las 19:00 (7 PM) del día actual

**📋 Archivos modificados**:
```
src/pages/Appointment.tsx              # Función isHourPast() corregida
src/components/AdminAppointment.tsx    # Función isHourPast() corregida  
src/components/AdminBlockSchedule.tsx  # Función isHourPast() corregida
public/test-date-fix.html             # Test de validación creado
```

---

**Última actualización**: 07 Noviembre 2025 - CORRECCIÓN CRÍTICA: Bug de fechas UTC vs Local solucionado
**Estado crítico**: ✅ RESUELTO - Sistema de bloqueos funciona correctamente
**Próxima revisión**: Verificación en producción y monitoreo comportamiento
 -     F e b   1 9 ,   2 0 2 6 :   F i x e d   E x t e r n a l M e d i c a l F i n a n c e   c r a s h   ( i d T o E d i t   r e f ) 
 
 
 # # #   '  * * F a s e   1 5 :   O p t i m i z a c i � n   y   L i m p i e z a   d e   C � d i g o   ( G e s t o r   d e   C h a t s ) * *   ( M a r z o   0 1 ,   2 0 2 6 ) 
 * * O b j e t i v o * * :   E l i m i n a r   f u n c i o n a l i d a d e s   o b s o l e t a s   ( \ 
 
 G e s t i � n 
 
 d e 
 
 C h a t s \ )   y   l i m p i a r   c � d i g o   a s o c i a d o   p a r a   m e j o r a r   m a n t e n i b i l i d a d   y   r e d u z i r   d e u d a   t � c n i c a . 
 
 * * C a m b i o s   R e a l i z a d o s * * : 
 -   L'  * * E l i m i n a d o * * :   C o m p o n e n t e   \ s r c / p a g e s / A d m i n C h a t M a n a g e r . t s x \   ( F r o n t e n d   d e   g e s t i � n   d e   c h a t s ) . 
 -   L'  * * E l i m i n a d o * * :   R u t a   \ / a d m i n / c h a t s \   e n   \ s r c / A p p . t s x \ . 
 -   L'  * * E l i m i n a d o * * :   O p c i � n   d e   m e n �   \ G e s t i � n 
 
 d e 
 
 C h a t s \   e n   \ s r c / p a g e s / A d m i n D a s h b o a r d . t s x \ . 
 -   L'  * * L i m p i e z a   A P I * * :   R e m o v i d a s   f u n c i o n e s   \ h a n d l e M a n a g e r E n d p o i n t s \   y   \ h a n d l e M o n i t o r E n d p o i n t s \   d e   \  p i / i n t e r n a l - b o t - a p i . j s \ . 
 -   >���  * * R e f a c t o r i z a c i � n * * :   C � d i g o   m � s   l i m p i o   e n   \  p i / i n t e r n a l - b o t - a p i . j s \   e n f o c a d o   e n   c h a t   i n t e r n o   y   h e r r a m i e n t a s   A I . 
 
 * * A r c h i v o s   A f e c t a d o s * * : 
 -   \ s r c / p a g e s / A d m i n C h a t M a n a g e r . t s x \   ( E l i m i n a d o ) 
 -   \ s r c / A p p . t s x \ 
 -   \ s r c / p a g e s / A d m i n D a s h b o a r d . t s x \ 
 -   \  p i / i n t e r n a l - b o t - a p i . j s \ 
 
 
 