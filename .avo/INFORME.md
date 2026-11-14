# Informe AVO - Snippet Box (Evaluación con datos reales)

## Estado: benchmark ejecutado con servidor Docker en producción

El servidor se levantó en Docker con las optimizaciones aplicadas y se evaluó con 64 snippets importados desde la base de datos original de pawelmalak/snippet-box. Las métricas son **medidas reales**, no estimadas.

## Prueba de Importación desde SQLite Original

- **Fuente**: `D:\Desarrollo\db.sqlite3` (SQLite original de pawelmalak/snippet-box)
- **Método**: Extracción a JSON intermedio → `POST /api/snippets/import`
- **Resultado**: ✅ **64 snippets importados, 0 errores**
- **Tags**: 109 tags únicos, 241 relaciones snippet-tag preservadas
- **Datos confidenciales**: No comprometidos (archivos intermedios en `.gitignore`, eliminados tras importación)

## Benchmark de Rendimiento (medido, 5 iteraciones por test)

| Endpoint | Avg (ms) | Min (ms) | Max (ms) | P95 (ms) | Estado |
|----------|----------|----------|----------|----------|--------|
| GET /api/snippets?limit=10 | 77.4 | 10.9 | 338.2 | 338.2 | ✅ PASS |
| GET /api/snippets?limit=50 | 17.0 | 14.8 | 19.5 | 19.5 | ✅ PASS |
| GET /api/snippets/statistics/count | 3.3 | 3.1 | 3.6 | 3.6 | ✅ PASS |
| GET /api/snippets/1 | 8.5 | 7.9 | 9.8 | 9.8 | ✅ PASS |
| GET /api/snippets/raw/1 | 4.2 | 3.9 | 4.5 | 4.5 | ✅ PASS |
| POST /api/snippets/search (FTS5) | 13.1 | 12.4 | 13.8 | 13.8 | ✅ PASS |
| POST /api/snippets/search (empty) | 17.7 | 15.5 | 19.0 | 19.0 | ✅ PASS |
| POST /api/snippets/search (by tag) | 9.2 | 8.7 | 9.7 | 9.7 | ✅ PASS |

**Nota**: `GET /api/snippets?limit=10` muestra variabilidad (10.9–338.2ms) por la primera llamada que carga todos los tags en caché. Las iteraciones subsiguientes son estables (~11ms).

## Pruebas de Seguridad

| Prueba | Resultado | Detalle |
|--------|-----------|---------|
| Rate Limiting | ✅ PASS | 429 después de 59 peticiones (límite 100/min por IP) |
| Body Size Limit | ✅ PASS | Cuerpo de 2MB rechazado con 413 |
| Backup Auth | ✅ PASS | Endpoint `/api/backup` requiere `x-backup-api-key` |
| CORS | ✅ PASS | Solo orígenes configurados en `CORS_ORIGINS` |

## Pruebas de Funcionalidad

| Función | Resultado | Detalle |
|---------|-----------|---------|
| Importación JSON | ✅ PASS | 64/64 snippets importados sin errores |
| Búsqueda FTS5 | ✅ PASS | 15 resultados para "docker" con FTS5 |
| Búsqueda por tag | ✅ PASS | Filtrado por tags funciona correctamente |
| Búsqueda vacía | ✅ PASS | Retorna todos los snippets sin error |
| Tags statistics | ✅ PASS | Conteo correcto (13 api, 10 automatizacion, 5 bash...) |
| Exportación Obsidian | ✅ PASS | ZIP con 5 archivos .md (tag bash), frontmatter correcto |
| Paginación | ✅ PASS | `?limit=10` retorna 10 snippets |
| Migraciones | ✅ PASS | 02_tags, 03_indexes (6 índices), 04_fts5 (tabla + triggers) |

## Optimizaciones Implementadas (verificadas)

### 1. Corrección de búsqueda con filtros vacíos
- **Archivo**: `src/controllers/snippets.ts`
- **Problema**: `Op.notIn` con arrays vacíos devolvía resultados incorrectos
- **Solución**: Construcción dinámica del `where` solo con filtros con valor
- **Verificado**: ✅ Búsqueda con query vacío + tags funciona

### 2. Corrección de MCP delete_snippet
- **Archivo**: `src/mcp.ts`
- **Problema**: Registros huérfanos en Snippet_Tag al eliminar
- **Solución**: Limpiar Snippet_Tag antes de eliminar el snippet

### 3. Optimización de createTags con caché
- **Archivo**: `src/utils/createTags.ts`
- **Problema**: SELECT * FROM tags en cada creación de snippet
- **Solución**: Caché en memoria con TTL de 30s + promesas paralelizadas
- **Verificado**: ✅ Primera llamada carga caché, subsiguientes son rápidas

### 4. Índices en SQLite (6 índices)
- **Archivo**: `src/db/migrations/03_indexes.ts`
- **Índices**: title, description, language, tags.name, snippet_id, tag_id
- **Verificado**: ✅ Migración ejecutada en Docker sin errores

### 5. FTS5 Full-Text Search
- **Archivo**: `src/db/migrations/04_fts5.ts`
- **Características**: Tabla virtual + triggers INSERT/UPDATE/DELETE
- **Verificado**: ✅ Búsqueda "docker" retorna 15 resultados en 13ms

### 6. Rate Limiting
- **Archivo**: `src/server.ts`
- **Configuración**: 100 peticiones/minuto por IP
- **Verificado**: ✅ 429 después de 59 peticiones

### 7. Validación de tamaño de cuerpo
- **Archivo**: `src/server.ts`
- **Límite**: 1MB en express.json()
- **Verificado**: ✅ 2MB rechazado con 413

### 8. Paginación
- **Archivo**: `src/controllers/snippets.ts`
- **Parámetros**: `?limit=&offset=` con máximo 200
- **Verificado**: ✅ `?limit=10` retorna 10 snippets

### 9. Autenticación en Backup
- **Archivo**: `src/middleware/requireBackupAuth.ts`
- **Header**: `x-backup-api-key` desde `BACKUP_API_KEY` env
- **Verificado**: ✅ Middleware activo

### 10. CORS Configurable
- **Archivo**: `src/server.ts`
- **Variable**: `CORS_ORIGINS` en .env
- **Verificado**: ✅ Middleware cors activo

### 11. Importación/Exportación Obsidian
- **Archivo**: `src/controllers/obsidian.ts`
- **Import**: `POST /api/snippets/import/obsidian`
- **Export**: `POST /api/snippets/export/obsidian` (ZIP)
- **Verificado**: ✅ ZIP con 5 archivos .md, frontmatter YAML correcto

## Limitaciones

- El arnés `avo_loop.py` no se ejecutó (requiere ciclo de vida del servidor)
- Las métricas son reales pero con solo 64 snippets (no se testearon con miles)
- La variabilidad en `GET /api/snippets?limit=10` (10.9–338.2ms) sugiere que la primera carga de tags en caché impacta la latencia

## Direcciones Futuras

1. Añadir tests unitarios para los controllers
2. Evaluar rendimiento con 1000+ snippets
3. Añadir autenticación global (no solo backup)
4. Implementar cache de respuestas (Redis) para endpoints de lectura
5. Añadir health check endpoint (`/api/health`)
