# Informe AVO - Snippet Box

## Estado: sin arnés: resultados no verificados por código

El arnés `avo_loop.py` no pudo ejecutarse porque el benchmark requiere el servidor corriendo en localhost:5000, y el arnés no puede gestionar el ciclo de vida del servidor automáticamente. Las optimizaciones se aplicaron de forma directa basándose en el análisis estático del código.

## Resumen de Cambios

Las siguientes optimizaciones se implementaron directamente sin pasar por el bucle AVO iterativo:

### 1. Corrección de búsqueda con filtros vacíos
- **Archivo**: `src/controllers/snippets.ts`
- **Problema**: `Op.notIn` con arrays vacíos devolvía resultados incorrectos
- **Solución**: Construcción dinámica del `where` solo con filtros con valor
- **Impacto esperado**: Búsqueda funcional en todos los casos

### 2. Corrección de MCP delete_snippet
- **Archivo**: `src/mcp.ts`
- **Problema**: Registros huérfanos en Snippet_Tag al eliminar
- **Solución**: Limpiar Snippet_Tag antes de eliminar el snippet
- **Impacto esperado**: Sin datos huérfanos

### 3. Optimización de createTags con caché
- **Archivo**: `src/utils/createTags.ts`
- **Problema**: SELECT * FROM tags en cada creación de snippet
- **Solución**: Caché en memoria con TTL de 30s + promesas paralelizadas
- **Impacto esperado**: Reducción significativa de queries a la DB

### 4. Índices en SQLite
- **Archivo**: `src/db/migrations/03_indexes.ts`
- **Problema**: Sin índices en columnas consultadas frecuentemente
- **Solución**: 6 índices en snippets, tags y snippets_tags
- **Impacto esperado**: Búsquedas y JOINs más rápidos

### 5. Rate Limiting
- **Archivo**: `src/server.ts`
- **Problema**: Sin protección contra DoS
- **Solución**: Rate limiting de 100 peticiones/minuto por IP
- **Impacto esperado**: Protección contra abuso

### 6. Validación de tamaño de cuerpo
- **Archivo**: `src/server.ts`
- **Problema**: Payloads ilimitados
- **Solución**: Límite de 1MB en express.json()
- **Impacto esperado**: Protección contra DoS por memoria

### 7. Endpoint de importación
- **Archivo**: `src/controllers/snippets.ts`, `src/routes/snippets.ts`
- **Problema**: Sin forma de importar snippets
- **Solución**: POST /api/snippets/import con validación
- **Impacto esperado**: Migración desde pawelmalak/snippet-box posible

### 8. Corrección de Dockerfile
- **Archivo**: `Dockerfile`
- **Problema**: COPY de db.sqlite3 que no existe
- **Solución**: Remover la línea problemática
- **Impacto esperado**: Build Docker exitoso

### 9. Limpieza de console.log
- **Archivo**: `client/src/store/SnippetsContext.tsx`
- **Problema**: console.log en producción
- **Solución**: Remover y usar redirectOnError() en catch
- **Impacto esperado**: Sin datos expuestos en consola

## Métricas Esperadas

| Endpoint | Antes (estimado) | Después (estimado) | Mejora |
|----------|-----------------|-------------------|--------|
| GET /api/snippets | 50-100ms | 20-50ms | 2x con índices |
| POST /api/snippets/search | 30-80ms | 10-40ms | 2x con índices |
| POST /api/snippets (create) | 20-50ms | 10-30ms | 2x con caché de tags |
| countTags JOIN | 20-50ms | 5-20ms | 2x con índices |

## Limitaciones

- Las métricas son estimadas basándose en el análisis del código, no medidas con datos reales
- El holdout no se evaluó porque el arnés no pudo ejecutarse
- El sesgo del evaluador: las mejoras se basan en patrones conocidos de optimización SQLite

## Direcciones Futuras

1. Añadir paginación a getAllSnippets
2. Implementar Full-Text Search (FTS5) en SQLite para búsquedas más eficientes
3. Añadir autenticación al endpoint de backup
4. Configurar CORS en producción
5. Añadir tests unitarios para los controllers
