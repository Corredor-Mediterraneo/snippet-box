---
sessionId: session-261114-172959-duan
---

# Requirements

### Overview & Goals

Snippet Box es un gestor de snippets auto-hospedado (fork de [pawelmalak/snippet-box](https://github.com/pawelmalak/snippet-box)) que permite crear, editar, buscar y gestionar fragmentos de código en múltiples lenguajes. El objetivo es:

1. Revisar el proyecto completo para identificar fallos de seguridad, funcionalidad y rendimiento
2. Darle funcionalidad completa incluyendo importación desde la versión original
3. Evaluar con el skill avo para optimización de rendimiento
4. Documentar todo en `snip.md`

### Scope

**In Scope:**
- Auditoría completa del código backend (Express/TypeScript) y frontend (React)
- Identificación de fallos de seguridad, funcionalidad y rendimiento
- Implementación de endpoint de importación JSON desde pawelmalak/snippet-box
- Implementación de sincronización con colecciones originales
- Corrección de bugs identificados
- Evaluación con skill avo
- Documentación en `snip.md`

**Out of Scope:**
- Cambios de arquitectura mayor (mantener Express + React + SQLite)
- Migración a otra base de datos (se evaluará pero no se implementará sin aprobación)
- Cambios de UI/UX mayores

### User Stories

- Como usuario, quiero importar mis snippets desde la versión original de pawelmalak para migrar sin perder datos
- Como usuario, quiero actualizar una colección original con nuevos snippets añadidos en esta versión
- Como administrador, quiero que la aplicación sea segura contra inyecciones y accesos no autorizados
- Como usuario, quiero que las búsquedas sean rápidas incluso con cientos de snippets

### Functional Requirements

1. **Importación de snippets**: Endpoint `POST /api/snippets/import` que acepte JSON con snippets y los importe a la base de datos
2. **Exportación mejorada**: Capacidad de exportar snippets en formato compatible con importación
3. **Búsqueda funcional**: La búsqueda debe filtrar correctamente por query, tags y languages
4. **Gestión de tags**: Los tags deben asociarse correctamente a los snippets
5. **Backup Google Drive**: Funcionalidad de backup debe funcionar con credenciales válidas
6. **MCP Server**: Las herramientas MCP deben funcionar correctamente

### Non-Functional Requirements

- **Seguridad**: Validación de entrada en todos los endpoints, protección contra inyección SQL
- **Rendimiento**: Respuesta API < 200ms para operaciones básicas
- **Persistencia**: SQLite con migraciones automáticas
- **Docker**: Imagen Docker funcional para despliegue

# Technical Design

### Current Implementation

**Arquitectura:**
- Backend: Node.js + Express + TypeScript + Sequelize ORM + SQLite
- Frontend: React + TypeScript + Bootstrap + Vite
- Deploy: Docker (multi-stage build)
- Backup: Google Drive API (opcional)
- MCP Server: Model Context Protocol para integración con AI

**Modelos de datos:**
- `Snippet`: id, title, description, language, code, docs, isPinned, createdAt, updatedAt
- `Tag`: id, name (único)
- `Snippet_Tag`: tabla intermedia many-to-many

**API Endpoints actuales:**
- `GET/POST /api/snippets` - CRUD snippets
- `GET/PUT/DELETE /api/snippets/:id` - CRUD individual
- `POST /api/snippets/search` - Búsqueda con filtros
- `GET /api/snippets/statistics/count` - Conteo de tags
- `GET /api/snippets/raw/:id` - Código raw
- `POST /api/snippets/export` - Exportar todo JSON
- `POST /api/snippets/export/json` - Exportar seleccionados JSON
- `POST /api/snippets/export/markdown` - Exportar por tag Markdown
- `POST /api/snippets/export/markdown/selected` - Exportar seleccionados Markdown
- `POST /api/backup` - Backup a Google Drive

### Key Decisions

1. **Mantener SQLite**: Para un gestor de snippets personal, SQLite es adecuado. No se recomienda migrar a PostgreSQL/MySQL a menos que se necesite concurrencia alta o distribución. SQLite es portable, sin servidor, y suficiente para miles de snippets.

2. **Formato de importación JSON**: El formato de exportación actual se usará como contrato de importación para compatibilidad bidireccional.

3. **Validación con Zod**: Se añadirá validación estricta en los endpoints críticos usando Zod (ya usado en MCP).

### Fallos Identificados

**Seguridad:**
- Sin rate limiting en endpoints
- Sin validación de tamaño de cuerpo (posible DoS)
- Backup Google Drive expone credenciales en .env sin .gitignore adecuado
- Sin sanitización de entrada en búsqueda (posible inyección)
- Endpoint backup accesible sin autenticación

**Funcionalidad:**
- Endpoint `searchSnippets`: cuando query está vacío pero hay tags/languages, la lógica falla (línea 253-259)
- MCP `delete_snippet`: no elimina las asociaciones Snippet_Tag antes de borrar (línea 198)
- `createTags`: usa comparación `==` en lugar de `===` (línea 30)
- Sin endpoint de importación JSON
- Frontend: `console.log` en producción (línea 153 SnippetsContext.tsx)
- Dockerfile: línea 43 copia `db.sqlite3` que no existe en el build

**Rendimiento:**
- Sin índices en SQLite para búsquedas frecuentes (title, description, language)
- `createTags`: consulta SELECT * FROM tags en cada creación de snippet
- `getAllSnippets`: carga todos los snippets sin paginación
- Búsqueda usa `Op.substring` que no usa índices
- Sin caché de resultados de búsqueda

### Proposed Changes

1. **Añadir endpoint de importación**: `POST /api/snippets/import` con validación de formato
2. **Corregir búsqueda**: Lógica de filtros vacíos en searchSnippets
3. **Corregir MCP delete**: Limpiar Snippet_Tag antes de eliminar
4. **Añadir índices**: Migración para índices en title, description, language
5. **Optimizar createTags**: Cache de tags en memoria
6. **Añadir validación**: Zod en endpoints públicos
7. **Corregir Dockerfile**: Remover línea de copia de db.sqlite3 o crear archivo vacío
8. **Limpiar console.log**: Remover logs de desarrollo del frontend
9. **Añadir rate limiting**: express-rate-limit en endpoints críticos
10. **Evaluar con avo**: Configurar métricas y ejecutar bucle de optimización

### File Structure

Archivos a modificar:
- `src/controllers/snippets.ts` - Corregir búsqueda, añadir importación
- `src/controllers/export.ts` - Mejorar formato exportación
- `src/mcp.ts` - Corregir delete_snippet
- `src/utils/createTags.ts` - Optimizar con cache
- `src/db/migrations/03_indexes.ts` - Nueva migración con índices
- `src/server.ts` - Añadir rate limiting
- `client/src/store/SnippetsContext.tsx` - Remover console.log
- `Dockerfile` - Corregir copia de db
- `snip.md` - Nuevo archivo de documentación

### Architecture Diagram

``` mermaid
graph LR
    A[Frontend React] -->|HTTP| B[Express API]
    B -->|Sequelize| C[(SQLite)]
    B -->|Google API| D[Google Drive Backup]
    B -->|MCP Stdio| E[MCP Server]
    F[Import JSON] -->|POST| B
    B -->|Export JSON/MD| A
```

### Risks

- **Compatibilidad de importación**: El formato JSON de pawelmalak puede diferir del actual - se necesita validación
- **Migración de índices**: En bases de datos grandes puede bloquear operaciones brevemente
- **Rate limiting**: Puede afectar uso legítimo si se configura demasiado restrictivo

# Delivery Steps

### ✓ Step 1: 1. Crear snip.md con definición completa de funcionalidades
- Crear `snip.md` en la raíz del proyecto con toda la documentación
- Incluir sección de fallos de seguridad con subsección avo
- Incluir sección de fallos de funcionalidad con subsección avo
- Incluir sección de fallos de rendimiento con subsección avo
- Documentar requisitos de importación y sincronización
- Recomendar mantener SQLite con justificación

### ✓ Step 2: 2. Implementar endpoint de importación y corregir fallos críticos
- Añadir `POST /api/snippets/import` en `src/controllers/snippets.ts`
- Corregir lógica de búsqueda en `searchSnippets` (líneas 253-259)
- Corregir `delete_snippet` en MCP para limpiar Snippet_Tag
- Corregir comparación `==` a `===` en `createTags`
- Añadir nueva ruta en `src/routes/snippets.ts`
- Remover console.log del frontend

### ✓ Step 3: 3. Añadir índices, validación y rate limiting
- Crear migración `03_indexes.ts` con índices en title, description, language
- Añadir validación de tamaño de cuerpo en server.ts
- Añadir rate limiting en server.ts
- Optimizar createTags con cache de tags en memoria
- Corregir Dockerfile

### ✓ Step 4: 4. Evaluar con skill avo y actualizar github
- Configurar avo.json con métricas de rendimiento
- Generar informe .avo/INFORME.md (sin arnés, resultados no verificados por código)
- Actualizar snip.md con resultados
- Commit y push exitosos a github (master actualizado)

### ✓ Step 5: 5. Actualizar README.md y hacer push
- Reescribir README.md señalando diferencias con pawelmalak/snippet-box original
- Incluir capturas de pantalla de las nuevas funcionalidades (importación, búsqueda corregida)
- Documentar las mejoras de seguridad, funcionalidad y rendimiento
- Añadir sección de MCP Server y Google Drive Backup
- Commit y push a github

### ✓ Step 6: 6. Implementar paginación en getAllSnippets
- Añadir parámetros limit y offset en el controller
- Actualizar la ruta y el frontend para soportar paginación
- Configurar un límite máximo razonable (ej. 100 snippets por página)

### ✓ Step 7: 7. Implementar FTS5 en SQLite para búsqueda
- Crear migración para tabla virtual FTS5
- Actualizar searchSnippets para usar FTS5 en lugar de Op.substring
- Mantener compatibilidad con búsqueda por tags y languages

### ✓ Step 8: 8. Añadir autenticación en endpoint de backup
- Implementar middleware de API key simple para /api/backup
- Configurar la clave en .env
- Actualizar snip.md con la implementación

### ✓ Step 9: 9. Configurar CORS en producción
- Añadir middleware cors en server.ts
- Configurar orígenes permitidos desde .env
- Actualizar snip.md con la implementación

### ✓ Step 10: 10. Commit final y push de todas las mejoras

### ✓ Step 11: 11. Implementar importación y exportación Obsidian vault
- Instalar gray-matter para parsear YAML frontmatter
- Crear controller obsidian.ts con importObsidianVault y exportToObsidian
- Añadir rutas POST /api/snippets/import/obsidian y POST /api/snippets/export/obsidian
- Soportar archivos .md con YAML frontmatter (title, description, language, tags, code, docs)
- Soportar subcarpetas en vaults como categorías
- Actualizar README.md y snip.md
- Commit y push a github

### ✓ Step 12: 12. Test de funcionamiento con Docker y evaluación AVO
- Construir imagen Docker y levantar contenedor
- Importar 64 snippets desde SQLite original de pawelmalak/snippet-box
- Verificar importación: 64/64 snippets, 109 tags, 241 relaciones sin errores
- Benchmark de rendimiento: todos los endpoints < 200ms (medido con 5 iteraciones)
- Pruebas de seguridad: rate limiting (429 después de 59 requests), body size limit (413 para 2MB)
- Verificar funcionalidad: búsqueda FTS5, exportación Obsidian, paginación, migraciones
- Generar informe AVO con métricas reales en .avo/INFORME.md
- Proteger datos confidenciales: .gitignore actualizado, archivos temporales eliminados
- Commit y push a github

### ✓ Step 13: 13. Implementar endpoint de deduplicación en el backend
- Crear controller `deduplication.ts` con función `removeDuplicates`
- Detectar duplicados por título + código (hash MD5 del código)
- Eliminar los duplicados conservando el snippet más antiguo
- Añadir ruta `POST /api/snippets/deduplicate` en snippets.ts
- Actualizar el SnippetsContext con la función `removeDuplicates`
- Actualizar la interfaz Context.ts

### ✓ Step 14: 14. Barra superior con botones de acción en el frontend
- Modificar Navbar.tsx para añadir sección de acciones (Importar JSON, Importar Obsidian, Eliminar duplicados, Backup/Restore)
- Crear componente `ImportJsonModal.tsx` para importación JSON con textarea y carga de archivo
- Crear componente `ImportObsidianModal.tsx` para importación Obsidian con file input y drag & drop
- Crear componente `DeduplicateModal.tsx` para confirmar y mostrar resultados
- Crear componente `BackupModal.tsx` para backup/restore Google Drive con estado configurable
- Dropdown "Import" en navbar con JSON y Obsidian
- Botones "Remove Duplicates" y "Backup / Restore" en navbar

### ✓ Step 15: 15. Endpoints de backup y deduplicación
- Añadir endpoint `GET /api/backup/status` para verificar configuración
- Añadir endpoint `GET /api/backup/list` para listar backups
- Añadir endpoint `POST /api/backup/restore` para restaurar último backup
- Endpoint `POST /api/snippets/deduplicate` para eliminar duplicados
- Endpoint `GET /api/snippets/duplicates/count` para contar duplicados

### ✓ Step 16: 16. Test, commit y push
- Verificar compilación TypeScript frontend y backend
- Test en Docker: deduplicación (309 duplicados detectados), backup status, importación
- Commit y push a github

### ✓ Step 17: 17. Auditoría de vulnerabilidades con INCIBE y AVO
- Revisar todas las dependencias (package.json frontend y backend) contra INCIBE-CERT
- Documentar vulnerabilidades conocidas en snip.md
- Actualizar versiones vulnerables si es posible
- Generar informe AVO de seguridad

### ✓ Step 18: 18. Commit final y push de todas las mejoras
- Commit de snip.md actualizado con auditoría de vulnerabilidades
- Push a github

### ✓ Step 19: 19. Corregir error React #310 en modales del frontend
- Eliminar createPortal de los 4 modales (BackupModal, ImportJsonModal, ImportObsidianModal, DeduplicateModal)
- Mover modales del Navbar al nivel del App component para evitar conflictos con React Router
- Reemplazar useEffect con useRef + async IIFE en BackupModal para evitar re-renders problemáticos
- Verificar con Playwright: Backup modal pasa sin errores, Remove Duplicates pasa sin errores
- Commit y push a github

### ✓ Step 20: 20. Completar menú Import con todas las opciones y modales
- Documentar requerimiento en snip.md: menú Import con SQLite, JSON, Markdown, Obsidian
- Crear modal ImportSqliteModal para importar archivos .sqlite3 nativos
- Crear modal ImportMarkdownModal para importar archivos .md individuales
- Añadir backend endpoint POST /api/snippets/import/sqlite para parsear SQLite
- Añadir backend endpoint POST /api/snippets/import/markdown para archivos markdown
- Actualizar Navbar con todas las opciones de importación
- Actualizar App.tsx con los nuevos modales
- Añadir Bootstrap JS bundle para dropdowns funcionales
- Test con Playwright: 7/7 tests pasan (Backup, Deduplicate, JSON, SQLite, Markdown, Obsidian, dropdown)
- Commit y push a github

### ✓ Step 21: 21. Modal de búsqueda avanzada con autocompletado y ordenación
- Crear endpoint GET /api/snippets/search/suggestions para autocompletado de tags y languages
- Actualizar SearchQuery interface con campos: title, content, sortBy, sortOrder
- Actualizar backend searchSnippets para soportar ordenación y búsqueda por campo
- Crear componente AdvancedSearchModal.tsx con campos separados (título, contenido, tags, lenguaje)
- Implementar autocompletado en tags y languages usando suggestions endpoint
- Añadir opciones de ordenación (fecha creación, título alfabético)
- Reemplazar enlace al wiki del repo original por botón de ayuda que abre el modal
- Actualizar SearchBar.tsx para integrar el modal de búsqueda avanzada
- Test con Playwright: modal se abre, autocompletado funciona, búsqueda con filtros
- Commit y push a github

### ✓ Step 22: 22. Modal de ayuda con ejemplos de búsqueda
- Crear componente SearchHelpModal.tsx con ejemplos de búsqueda
- Incluir ejemplos de filtros por tags, languages, texto libre, combinados
- Reemplazar el enlace externo al wiki por un botón "?" que abre el modal
- Actualizar SearchBar y AdvancedSearchModal para usar el modal de ayuda
- Test con Playwright
- Commit y push a github

### * Step 23: 23. Evaluación AVO y actualización README con capturas
- Ejecutar evaluación AVO completa de la aplicación
- Generar capturas de pantalla genéricas sin datos reales para el README
- Actualizar README.md con capturas del modal de búsqueda avanzada y ayuda
- Actualizar snip.md con resultados de AVO
- Test final con Playwright
- Commit y push a github