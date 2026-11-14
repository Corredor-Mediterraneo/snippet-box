# Snippet Box - Definición de Funcionalidades

## Resumen del Proyecto

**Snippet Box** es un gestor de snippets auto-hospedado, fork de [pawelmalak/snippet-box](https://github.com/pawelmalak/snippet-box), actualizado a las dependencias más recientes. Permite crear, editar, buscar, exportar y gestionar fragmentos de código en múltiples lenguajes con soporte para tags, backup en Google Drive y un servidor MCP (Model Context Protocol) para integración con IA.

### Stack Tecnológico
- **Backend**: Node.js 22+ + Express 5 + TypeScript + Sequelize ORM + SQLite
- **Frontend**: React + TypeScript + Bootstrap + Vite
- **Deploy**: Docker (multi-stage build)
- **Backup**: Google Drive API (opcional)
- **MCP Server**: Model Context Protocol para integración con editores AI

### Modelos de Datos
- **Snippet**: id, title, description, language, code, docs, isPinned, createdAt, updatedAt
- **Tag**: id, name (único)
- **Snippet_Tag**: tabla intermedia many-to-many (snippet_id, tag_id)

---

## API Endpoints Actuales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/snippets` | Obtener todos los snippets |
| POST | `/api/snippets` | Crear nuevo snippet |
| GET | `/api/snippets/:id` | Obtener snippet por ID |
| PUT | `/api/snippets/:id` | Actualizar snippet |
| DELETE | `/api/snippets/:id` | Eliminar snippet |
| POST | `/api/snippets/search` | Buscar con filtros |
| GET | `/api/snippets/statistics/count` | Conteo de tags |
| GET | `/api/snippets/raw/:id` | Código raw |
| POST | `/api/snippets/export` | Exportar todo JSON |
| POST | `/api/snippets/export/json` | Exportar seleccionados JSON |
| POST | `/api/snippets/export/markdown` | Exportar por tag Markdown |
| POST | `/api/snippets/export/markdown/selected` | Exportar seleccionados Markdown |
| POST | `/api/snippets/import/obsidian` | Importar desde vault de Obsidian |
| POST | `/api/snippets/export/obsidian` | Exportar como vault de Obsidian (ZIP) |
| GET | `/api/snippets/:id/export/obsidian` | Exportar snippet individual como Markdown Obsidian |
| POST | `/api/snippets/import` | Importar snippets desde JSON |
| POST | `/api/snippets/deduplicate` | Eliminar snippets duplicados |
| GET | `/api/snippets/duplicates/count` | Contar snippets duplicados |
| POST | `/api/backup` | Backup a Google Drive |
| GET | `/api/backup/status` | Estado de configuración del backup |
| GET | `/api/backup/list` | Listar backups en Google Drive |
| POST | `/api/backup/restore` | Restaurar último backup |

---

## Requisitos Funcionales

### 1. Importación de Snippets
- Endpoint `POST /api/snippets/import` que acepte JSON con snippets y los importe a la base de datos
- Debe ser compatible con el formato de exportación actual para compatibilidad bidireccional
- Debe manejar la creación de tags asociados
- Debe validar el formato de entrada antes de importar

### 2. Sincronización con pawelmalak/snippet-box
- Capacidad de importar snippets desde la versión original
- Capacidad de exportar en formato compatible para actualizar colecciones originales
- Los snippets nuevos creados en esta versión deben poder sincronizarse con la original

### 3. Búsqueda Funcional
- La búsqueda debe filtrar correctamente por query, tags y languages
- Los filtros vacíos no deben romper la lógica de búsqueda
- Debe soportar búsqueda parcial en título y descripción

### 4. Gestión de Tags
- Los tags deben asociarse correctamente a los snippets
- La creación de tags debe ser eficiente (sin consultas redundantes)
- Los tags deben eliminarse correctamente al eliminar un snippet

### 5. Backup Google Drive
- La funcionalidad de backup debe funcionar con credenciales válidas
- El endpoint debe estar protegido

### 6. MCP Server
- Las herramientas MCP deben funcionar correctamente
- `delete_snippet` debe limpiar las asociaciones Snippet_Tag antes de eliminar

### 7. Importación/Exportación Obsidian Vault
- Endpoint `POST /api/snippets/import/obsidian` que acepte archivos Markdown con YAML frontmatter
- Soporte para frontmatter con: title, description, language, tags, isPinned
- Extracción de bloques de código del cuerpo del archivo Markdown
- Endpoint `POST /api/snippets/export/obsidian` que genere un ZIP con archivos `.md` organizados por lenguaje
- Endpoint `GET /api/snippets/:id/export/obsidian` para exportar un snippet individual
- Los archivos exportados deben ser compatibles con Obsidian (YAML frontmatter + código en bloques fenced)

---

## Fallos de Seguridad

### 1. Sin Rate Limiting
**Severidad**: Media
**Archivo**: `src/server.ts`
**Descripción**: No hay protección contra ataques de fuerza bruta o DoS en ningún endpoint. Un atacante puede hacer peticiones ilimitadas.
**Solución**: Añadir `express-rate-limit` en los endpoints críticos, especialmente en `/api/snippets/search` y `/api/backup`.

### 2. Sin Validación de Tamaño de Cuerpo
**Severidad**: Media
**Archivo**: `src/server.ts` (línea 22)
**Descripción**: `app.use(express.json())` sin límite de tamaño permite enviar payloads arbitrariamente grandes, causando DoS por agotamiento de memoria.
**Solución**: Configurar `express.json({ limit: '1mb' })` o un límite razonable.

### 3. Credenciales expuestas en .env
**Severidad**: Alta
**Archivo**: `src/config/.env`
**Descripción**: Las credenciales de Google Drive (clientId, clientSecret, refreshToken) están en `.env` sin un `.gitignore` adecuado que las proteja.
**Solución**: Verificar que `.env` esté en `.gitignore` y añadir `.env` a la lista de archivos ignorados.

### 4. Sin Sanitización de Entrada en Búsqueda
**Severidad**: Media
**Archivo**: `src/controllers/snippets.ts` (líneas 272-273)
**Descripción**: Los parámetros `query`, `tags` y `languages` se usan directamente en consultas SQL sin sanitización. Aunque Sequelize usa parámetros preparados, la lógica de filtros puede ser manipulada.
**Solución**: Validar y sanitizar los parámetros de entrada con Zod.

### 5. Endpoint Backup sin Autenticación
**Severidad**: Alta
**Archivo**: `src/server.ts` (línea 53)
**Descripción**: El endpoint `/api/backup` es accesible sin autenticación. Cualquier persona con acceso a la API puede disparar un backup o intentar explotar la configuración de Google Drive.
**Solución**: Añadir middleware de autenticación o al menos una clave API simple.

### 6. Sin CORS Configurado
**Severidad**: Baja
**Archivo**: `src/server.ts`
**Descripción**: No hay configuración de CORS explícita. En producción, esto puede permitir peticiones no deseadas desde otros dominios.
**Solución**: Configurar el paquete `cors` con los orígenes permitidos.

### 7. Inyección de Plantillas en Markdown
**Severidad**: Baja
**Archivo**: `src/controllers/export.ts` (líneas 111-123)
**Descripción**: Los valores de `title`, `description`, `language` y `code` se insertan directamente en el Markdown sin escapar, lo que podría permitir inyección de contenido malicioso.
**Solución**: Escapar los caracteres especiales de Markdown antes de la interpolación.

#### Subsección AVO - Seguridad
Para evaluar las mejoras de seguridad con AVO:
- **Métrica**: Número de fallos de seguridad críticos/medios resueltos
- **Evaluación**: Verificar que los tests de seguridad pasan (rate limiting activo, validación de cuerpo, autenticación en backup)
- **Holdout**: Intentar ataques básicos (payload grande, peticiones rápidas, inyección en búsqueda)

---

## Fallos de Funcionalidad

### 1. Búsqueda con Filtros Vacíos Rota
**Severidad**: Alta
**Archivo**: `src/controllers/snippets.ts` (líneas 261-263)
**Descripción**: Cuando `query` está vacío pero hay `tags` o `languages`, la lógica usa `Op.notIn` con arrays vacíos, lo que devuelve resultados incorrectos.
```typescript
const languageFilter = languages.length
  ? { [Op.in]: languages }
  : { [Op.notIn]: languages }; // languages es [], Op.notIn[] devuelve todo
```
**Solución**: Construir el `where` dinámicamente solo con los filtros que tienen valor.

### 2. MCP `delete_snippet` no limpia Snippet_Tag
**Severidad**: Alta
**Archivo**: `src/mcp.ts` (línea 198)
**Descripción**: Al eliminar un snippet vía MCP, se llama a `snippet.destroy()` sin antes eliminar las asociaciones en `Snippet_Tag`. Esto deja registros huérfanos en la tabla intermedia.
**Solución**: Añadir `await Snippet_TagModel.destroy({ where: { snippet_id: args.id } });` antes de `snippet.destroy()`.

### 3. Comparación con `==` en lugar de `===`
**Severidad**: Baja
**Archivo**: `src/utils/createTags.ts` (línea 30)
**Descripción**: Se usa `==` para comparar nombres de tags, lo que puede causar comportamientos inesperados con coerción de tipos.
**Solución**: Cambiar a `===`.

### 4. Sin Endpoint de Importación JSON
**Severidad**: Alta
**Archivo**: No existe
**Descripción**: No hay forma de importar snippets desde un archivo JSON, lo que impide la migración desde la versión original de pawelmalak.
**Solución**: Crear `POST /api/snippets/import` con validación de formato.

### 5. `console.log` en Producción (Frontend)
**Severidad**: Baja
**Archivo**: `client/src/store/SnippetsContext.tsx` (línea 153)
**Descripción**: Hay un `console.log(res.data.data)` en la función `searchSnippets` que expone datos en la consola del navegador en producción.
**Solución**: Remover el `console.log` o condicionarlo a `process.env.NODE_ENV !== 'production'`.

### 6. Dockerfile copia `db.sqlite3` que no existe
**Severidad**: Media
**Archivo**: `Dockerfile` (línea 43)
**Descripción**: `COPY db.sqlite3 ./data/db.sqlite3` intenta copiar un archivo que no existe en el contexto del build, causando error en la construcción de la imagen.
**Solución**: Remover la línea o crear un archivo vacío como placeholder.

### 7. `getAllSnippets` sin paginación
**Severidad**: Media
**Archivo**: `src/controllers/snippets.ts` (línea 51)
**Descripción**: Carga todos los snippets en memoria sin paginación. Con cientos de snippets, esto degrada el rendimiento significativamente.
**Solución**: Añadir parámetros de paginación (limit, offset) o al menos un `limit` máximo.

### 8. Búsqueda con `Op.substring` no usa índices
**Severidad**: Media
**Archivo**: `src/controllers/snippets.ts` (líneas 272-273)
**Descripción**: `Op.substring` genera `LIKE '%query%'` que no puede usar índices B-tree estándar, causando escaneo completo de tabla.
**Solución**: Añadir índices FTS (Full-Text Search) o usar `Op.startsWith` para búsquedas prefix.

#### Subsección AVO - Funcionalidad
Para evaluar las correcciones de funcionalidad con AVO:
- **Métrica**: Porcentaje de tests funcionales que pasan
- **Evaluación**: Ejecutar los tests de caracterización que cubren búsqueda, importación, eliminación y tags
- **Holdout**: Casos de búsqueda con combinaciones de filtros vacíos/no vacíos no usados en el gate

---

## Fallos de Rendimiento

### 1. Sin Índices en SQLite
**Severidad**: Alta
**Archivo**: `src/db/migrations/`
**Descripción**: Las tablas `snippets`, `tags` y `snippets_tags` no tienen índices para las columnas más consultadas (`title`, `description`, `language`, `snippet_id`, `tag_id`).
**Solución**: Crear migración `03_indexes.ts` con índices en:
- `snippets.title` (búsqueda por título)
- `snippets.description` (búsqueda por descripción)
- `snippets.language` (filtrado por lenguaje)
- `snippets_tags.snippet_id` (asociaciones)
- `snippets_tags.tag_id` (asociaciones)
- `tags.name` (búsqueda de tags)

### 2. `createTags` consulta SELECT * en cada llamada
**Severidad**: Media
**Archivo**: `src/utils/createTags.ts` (líneas 10-13)
**Descripción**: Cada vez que se crea un snippet, se ejecuta `SELECT * FROM tags` para obtener todos los tags y comparar. Con muchos tags, esto es ineficiente.
**Solución**: Implementar caché de tags en memoria o usar `TagModel.findAll({ attributes: ['id', 'name'] })` con caché TTL.

### 3. `getAllSnippets` carga todos los snippets
**Severidad**: Media
**Archivo**: `src/controllers/snippets.ts` (línea 51)
**Descripción**: `findAll()` sin `limit` carga todos los registros en memoria. Con miles de snippets, esto consume mucha memoria y tiempo.
**Solución**: Añadir paginación con `limit` y `offset`, o un `limit` máximo predeterminado.

### 4. Sin Caché de Resultados
**Severidad**: Baja
**Archivo**: Varios
**Descripción**: No hay caché de resultados de búsqueda o estadísticas. Las consultas repetidas se ejecutan contra la base de datos cada vez.
**Solución**: Implementar caché simple con `node-cache` para endpoints de lectura frecuente.

### 5. `countTags` sin índice en JOIN
**Severidad**: Media
**Archivo**: `src/controllers/snippets.ts` (líneas 199-210)
**Descripción**: La consulta SQL con JOIN y GROUP BY sobre `snippets_tags` y `tags` no usa índices, causando escaneo completo.
**Solución**: Añadir índices en `snippets_tags.tag_id` y `tags.name`.

### 6. Promesas no paralelizadas en createTags
**Severidad**: Baja
**Archivo**: `src/utils/createTags.ts` (líneas 22-26, 29-38)
**Descripción**: Los bucles `for...of` en `createTags` ejecutan las operaciones secuencialmente en lugar de en paralelo.
**Solución**: Usar `Promise.all()` para crear las asociaciones en paralelo.

#### Subsección AVO - Rendimiento
Para evaluar las mejoras de rendimiento con AVO:
- **Métrica**: Tiempo de respuesta de endpoints clave (search, getAll, create)
- **Evaluación**: Medir latencia con y sin las optimizaciones usando un script de benchmark
- **Holdout**: Consultas con datos reales (100+ snippets) no usados en el benchmark inicial
- **Mínimos**: La latencia no debe subir más del 5% en ningún endpoint

---

## Auditoría de Vulnerabilidades (INCIBE-CERT + AVO)

### Dependencias del Proyecto

**Backend (package.json):**
| Paquete | Versión | Estado | CVEs Conocidas |
|---------|---------|--------|----------------|
| express | ^5.2.1 | ✅ Actualizado | Sin CVEs recientes |
| sequelize | ^6.37.8 | ✅ Parcheado | CVE-2026-30951 (SQL injection JSON) parcheado en 6.37.8 |
| sqlite3 | ^6.0.1 | ⚠️ Revisar | CVE-2025-7709 (FTS5 integer overflow) en SQLite < 3.50.3 |
| googleapis | ^182.0.0 | ✅ Actualizado | Sin CVEs recientes |
| archiver | ^8.0.0 | ✅ Actualizado | Sin CVEs recientes |
| gray-matter | ^4.0.3 | ⚠️ Antiguo | Sin CVEs conocidas, pero sin mantenimiento activo |
| cors | ^2.8.6 | ✅ Estable | Sin CVEs recientes |
| dotenv | ^18.0.4 | ✅ Actualizado | Sin CVEs recientes |

**Frontend (client/package.json):**
| Paquete | Versión | Estado | CVEs Conocidas |
|---------|---------|--------|----------------|
| react | ^19.0.0 | ⚠️ Revisar | CVE-2025-55182 (RCE Server Components) - **No aplica**: este es un SPA sin React Server Functions |
| axios | ^1.20.0 | ✅ Parcheado | CVE-2026-25639 (DoS __proto__) parcheado en 1.13.5; ^1.20.0 incluye parche |
| react-router-dom | ^7.0.0 | ✅ Actualizado | Sin CVEs recientes |
| bootstrap | ^5.3.8 | ✅ Actualizado | Sin CVEs recientes |
| vite | ^5.4.0 | ⚠️ Revisar | CVE-2025-55182 afecta a bundlers con React Server Components - **No aplica** a este SPA |
| sass | ^1.105.1 | ✅ Actualizado | Sin CVEs recientes |
| highlight.js | ^11.12.0 | ✅ Actualizado | Sin CVEs recientes |
| react-markdown | ^10.1.0 | ✅ Actualizado | Sin CVEs recientes |
| dayjs | ^1.11.23 | ✅ Actualizado | Sin CVEs recientes |

**Runtime:**
| Componente | Versión | Estado | CVEs Conocidas |
|------------|---------|--------|----------------|
| Node.js | 22-alpine (Docker) | ⚠️ Actualizar | CVE-2025-55130 (bypass symlinks, High) - parcheado en versiones recientes de 22.x |

### Referencias INCIBE-CERT

- **CVE-2026-25639** (Axios DoS): https://www.incibe.es/incibe-cert/alerta-temprana/vulnerabilidades/cve-2026-25639
  - Gravedad: **ALTA** (CVSS 7.5)
  - Estado en proyecto: **Parcheado** - axios ^1.20.0 > 1.13.5 (versión de parche)

### Recomendaciones AVO - Seguridad

1. **Actualizar Node.js en Dockerfile**: Cambiar `node:22-alpine` por la versión más reciente de 22.x para incluir parches de seguridad
2. **Monitorear gray-matter**: Aunque no tiene CVEs, el paquete está sin mantenimiento activo. Considerar migrar a `js-yaml` + parsing manual si se detectan vulnerabilidades
3. **Verificar sqlite3 nativo**: La versión 6.0.1 usa SQLite 3.44.x; verificar si incluye el parche de CVE-2025-7709 (FTS5)
4. **npm audit**: Ejecutar `npm audit` regularmente para detectar vulnerabilidades nuevas en dependencias transitivas

#### Subsección AVO - Vulnerabilidades
- **Métrica**: Número de CVEs activas en dependencias directas
- **Evaluación**: Revisar semestralmente las dependencias contra INCIBE-CERT y npm audit
- **Holdout**: Dependencias transitivas no listadas arriba
- **Mínimos**: Cero CVEs de severidad ALTA o CRÍTICA sin parche

---

## Recomendación sobre Base de Datos

### Mantener SQLite

**Recomendación**: Mantener SQLite como base de datos para Snippet Box.

**Justificación**:
1. **Uso personal/auto-hospedado**: Snippet Box está diseñado para un solo usuario o equipo pequeño. SQLite es ideal para este caso de uso.
2. **Portabilidad**: Un solo archivo `.sqlite3` es fácil de copiar, respaldar y mover entre entornos.
3. **Sin servidor**: No requiere configuración adicional de servidor de base de datos.
4. **Rendimiento suficiente**: SQLite maneza fácilmente decenas de miles de registros con índices adecuados.
5. **Backup simplificado**: El backup es una copia de archivo, no un dump complejo.
6. **Docker**: La imagen Docker es más ligera sin un servidor de base de datos separado.

**Alternativas evaluadas**:
- **PostgreSQL**: Sobredimensionado para el caso de uso. Requiere contenedor adicional, configuración de conexión y mantenimiento.
- **MongoDB**: No aporta ventajas para datos estructurados como snippets. La consulta por texto y tags se resuelve bien con SQLite + FTS.
- **Neon/Turso**: Servicios gestionados que añaden dependencia externa innecesaria para un proyecto auto-hospedado.

**Conclusión**: SQLite es la opción correcta. Las mejoras de rendimiento se logran con índices adecuados y optimización de queries, no cambiando de motor.

---

## Plan de Implementación

### Fase 1: Documentación (snip.md)
- [x] Crear este archivo con la definición completa

### Fase 2: Correcciones Críticas
- [x] Añadir endpoint `POST /api/snippets/import`
- [x] Corregir búsqueda con filtros vacíos
- [x] Corregir MCP `delete_snippet`
- [x] Corregir `==` a `===` en createTags
- [x] Remover `console.log` del frontend

### Fase 3: Mejoras de Seguridad y Rendimiento
- [x] Añadir índices en SQLite (03_indexes.ts)
- [x] Añadir rate limiting (100 req/min)
- [x] Añadir validación de tamaño de cuerpo (1mb)
- [x] Optimizar createTags con caché
- [x] Corregir Dockerfile

### Fase 4: Evaluación AVO
- [x] Configurar avo.json con métricas
- [x] Generar informe .avo/INFORME.md (sin arnés, resultados no verificados por código)
- [x] Actualizar este archivo con resultados

**Resultado AVO**: El arnés `avo_loop.py` no pudo ejecutarse porque el benchmark requiere el servidor corriendo. Las optimizaciones se aplicaron directamente basándose en análisis estático. El informe completo está en `.avo/INFORME.md`.

---

## Formato de Importación JSON

El formato de importación debe ser compatible con el formato de exportación actual:

```json
{
  "snippets": [
    {
      "title": "string (requerido)",
      "description": "string (opcional)",
      "language": "string (requerido)",
      "code": "string (requerido)",
      "docs": "string (opcional)",
      "tags": ["array", "de", "strings"],
      "isPinned": boolean
    }
  ]
}
```

El endpoint de importación debe:
1. Validar el formato JSON
2. Verificar los campos requeridos
3. Crear los snippets con sus tags asociados
4. Reportar el número de snippets importados y los errores encontrados
