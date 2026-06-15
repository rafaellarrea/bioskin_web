# Project Guidelines

## Ponytail — Lazy Senior Dev Mode (Activo)

Todos los agentes siguen el principio Ponytail: **el mejor código es el que nunca se escribe**.

Antes de escribir código, detente en el primer nivel que aguante:
1. ¿Necesita existir esto? (YAGNI)
2. ¿Lo hace la stdlib? Úsala.
3. ¿Lo cubre una feature nativa? Úsala.
4. ¿Lo resuelve una dependencia ya instalada? Úsala.
5. ¿Cabe en una línea? Hazlo en una línea.
6. Solo entonces: el mínimo que funcione.

- Sin abstracciones no pedidas. Sin boilerplate. Sin dependencias nuevas si se puede evitar.
- Marca simplificaciones con `// ponytail: <ceiling> → <upgrade path>`.
- No lazy en: validación en trust boundaries, seguridad, manejo de errores que previene pérdida de datos.

---

## Agent Orchestration
Usa el agente más especializado posible según el tipo de tarea:

- **`Experto Frontend`**: cambios en `src/**`, UI/UX, React, Tailwind, accesibilidad y responsive design.
- **`Experto Backend`**: trabajo en `api/**`, `lib/**`, integraciones server-side, validaciones, endpoints y lógica de negocio.
- **`Guardián de Seguridad`**: datos sensibles, credenciales, contraseñas, autenticación, autorización, secretos, `api/**` y hardening.
- **`Auditor de Código`**: limpieza de código legacy, código no usado, errores, duplicación y refactorización segura.
- **`DevOps y Vercel`**: deploys, Vercel, producción, logs, variables de entorno y troubleshooting operativo.
- **`QA y Testing`**: reproducción de bugs, smoke tests, regresión, build/lint/tests y verificación final con evidencia.

## Collaboration Rules
- Si una tarea toca **seguridad**, prioriza `Guardián de Seguridad`.
- Si una tarea toca **backend** y además involucra datos sensibles, coordina `Experto Backend` + `Guardián de Seguridad`.
- Si una tarea modifica `api/**` o `lib/**`, debe pasar revisión de **seguridad** y **QA** antes de considerarse cerrada.
- Si una tarea afecta producción o deployment, usa `DevOps y Vercel`.
- Si se va a eliminar o simplificar código, valida primero con `Auditor de Código` y luego verifica con `QA y Testing`.

## Recommended Skills
- **`vercel-operations`**: despliegues, producción, logs y Vercel.
- **`testing-validation`**: build, lint, tests, regresión y validación real.
- **`code-cleanup-audit`**: auditoría técnica, legacy y limpieza de código.

## Build and Test
- `npm run build` para validación global del frontend.
- Usa scripts o pruebas relevantes antes de afirmar que un fix funciona.
- No declares éxito sin evidencia fresca.

## Git Workflow (Obligatorio)
- Después de CADA cambio en el código, ejecutar siempre: `git add .`, `git commit -m "..."`, `git push`.
- No cerrar una tarea con cambios en archivos sin commit/push.

## Project Conventions
- Mantén los cambios de UI en `src/**`; evita `public/*.html` salvo petición explícita.
- No crear nuevas bases de datos; usar las existentes.
- Vigila el límite de funciones serverless en Vercel y reutiliza endpoints existentes cuando sea posible.
- Actualiza `PROGRESS.md` y `docs/ARCHITECTURE.md` cuando se creen o modifiquen archivos relevantes.
