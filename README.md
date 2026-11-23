# Nexus Ops QA

Panel web para gestionar órdenes de mantenimiento multi-sede y probar la resiliencia de una API de salud simulando respuestas HTTP `200`, `400`, `404` y `500`.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- React 19
- TypeScript (modo `strict`)
- Tailwind CSS 4
- ESLint

## Funcionalidades

**Gestión de operaciones multi-sede**
- Registro de órdenes con título, sucursal, categoría, prioridad, costo estimado y fecha programada.
- Validación de reglas de negocio antes de guardar, con mensajes de error por campo.
- Filtros por sucursal y estado, y total de costo del filtro aplicado.
- Cambio de estado (`Pendiente`, `En proceso`, `Completado`) y eliminación de órdenes.
- Persistencia en `localStorage`: las órdenes sobreviven a recargar la página.

**Laboratorio API y monitoreo QA**
- Consulta a `/api/health?status=<código>` con los códigos `200`, `400`, `404` y `500`.
- Medición de latencia, historial de las últimas 12 pruebas y contadores de éxitos e incidencias.
- Ejecución individual o de los cuatro escenarios seguidos.
- Manejo de error de red sin romper la interfaz.

## Estructura

```
app/
  api/health/route.ts   Endpoint GET que simula 200, 400, 404 y 500
  layout.tsx            Layout raíz y metadatos
  page.tsx              Página principal
components/
  OperationsManager.tsx Gestión de órdenes de mantenimiento
  ApiQaDashboard.tsx    Pruebas del endpoint de salud
lib/
  qa-validators.ts      Validación de órdenes y mensajes HTTP simulados
models/
  operations.ts         Tipos e interfaces compartidos
```

## Endpoint de salud

```
GET /api/health?status=200|400|404|500
```

Sin parámetro, o con un valor no permitido, responde `200`.

```json
{
  "service": "nexus-ops-qa-api",
  "status": "healthy",
  "statusCode": 200,
  "latencyMs": 0,
  "timestamp": "2026-11-23T19:00:00.000Z"
}
```

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Otros comandos:

```bash
npm run lint        # ESLint
npx tsc --noEmit    # Verificación de tipos
npm run build       # Build de producción
```
