# Snippet Box

![Snippet library screenshot](./.github/img/snippets.png)

> **Fork maintained by [Corredor-Mediterraneo](https://github.com/Corredor-Mediterraneo)** — Based on [pawelmalak/snippet-box](https://github.com/pawelmalak/snippet-box), updated to the latest dependencies and enhanced with new features, security fixes, and performance optimizations.

## Description

Snippet Box is a simple self-hosted app for organizing your code snippets. It allows you to easily create, edit, browse and manage your snippets in various languages. With built-in Markdown support, Snippet Box makes it very easy to add notes or simple documentation to your code.

## Technology

- **Backend**
  - Node.js **22+** (upgraded from 18)
  - TypeScript
  - **Express 5** (upgraded from 4)
  - Sequelize ORM + SQLite
- **Frontend**
  - **React 19** (upgraded from 17)
  - TypeScript
  - Bootstrap
  - **Vite** (upgraded from Create React App)
- **Deployment**
  - Docker (multi-stage build)

## 🆕 What's New in This Fork

This fork includes significant improvements over the original [pawelmalak/snippet-box](https://github.com/pawelmalak/snippet-box):

### New Features

| Feature | Description |
|---------|-------------|
| **📥 JSON Import** | Import snippets from a JSON file via `POST /api/snippets/import` — migrate from the original version seamlessly |
| **🔌 MCP Server** | Built-in [Model Context Protocol](https://modelcontextprotocol.io/) server for AI editor integration (Cursor, Claude Desktop, etc.) |
| **☁️ Google Drive Backup** | Optional automatic backup of your database to Google Drive |
| **🔒 Rate Limiting** | Built-in rate limiting (100 req/min per IP) to protect against abuse |
| **🛡️ Body Size Validation** | Request body limited to 1MB to prevent DoS attacks |

### Security Improvements

- **Rate limiting** on all endpoints (100 requests/minute per IP)
- **Request body size limit** (1MB) to prevent memory exhaustion attacks
- **Backup endpoint authentication** — requires `x-backup-api-key` header to prevent unauthorized backups
- **CORS configuration** — configurable allowed origins via `CORS_ORIGINS` env var
- **Fixed search injection** — search filters now build dynamic `where` clauses safely
- **Fixed MCP `delete_snippet`** — properly cleans up `Snippet_Tag` associations before deleting

### Performance Optimizations

- **6 SQLite indexes** on frequently queried columns (`title`, `description`, `language`, `snippet_id`, `tag_id`, `tag name`)
- **FTS5 full-text search** — SQLite FTS5 virtual table with auto-sync triggers for fast, relevant search results
- **Tag cache** — in-memory cache with 30s TTL eliminates redundant `SELECT * FROM tags` queries
- **Parallel tag creation** — tags are created and associated using `Promise.all()` instead of sequential loops
- **Pagination** — `GET /api/snippets?limit=10&offset=0` to avoid loading all snippets at once (max 200)
- **Strict comparison** — fixed `==` to `===` in tag matching to prevent type coercion bugs

### Bug Fixes

- **Search with empty filters** — fixed broken logic when `query` is empty but `tags`/`languages` are provided
- **Dockerfile** — removed broken `COPY db.sqlite3` line that caused build failures
- **Frontend console.log** — removed debug logging from production code

### Comparison Table

| Feature | Original (pawelmalak) | This Fork |
|---------|----------------------|-----------|
| Node.js | 18 | **22+** |
| Express | 4 | **5** |
| React | 17 | **19** |
| Bundler | Create React App | **Vite** |
| JSON Import | ❌ | ✅ |
| MCP Server | ❌ | ✅ |
| Google Drive Backup | ❌ | ✅ |
| Rate Limiting | ❌ | ✅ |
| Body Size Limit | ❌ | ✅ |
| SQLite Indexes | ❌ | ✅ (6 indexes) |
| Tag Cache | ❌ | ✅ (30s TTL) |
| Parallel Tag Creation | ❌ | ✅ |
| Search Bug (empty filters) | 🐛 | ✅ Fixed |
| MCP delete bug | 🐛 | ✅ Fixed |
| Dockerfile build error | 🐛 | ✅ Fixed |
| FTS5 Full-Text Search | ❌ | ✅ |
| Pagination API | ❌ | ✅ |
| Backup Auth | ❌ | ✅ (API key) |
| CORS | ❌ | ✅ (configurable) |

## Development

```sh
# clone repository
git clone https://github.com/Corredor-Mediterraneo/snippet-box.git
cd snippet-box

# install dependencies (run only once)
npm run init

# start backend and frontend development servers
npm run dev
```

## Installation

### With Docker

#### Building image

```sh
# Building image for Linux
docker build -t snippet-box .

# Build image for ARM
docker buildx build \
  --platform linux/arm/v7,linux/arm64 \
  -f Dockerfile.arm \
  -t snippet-box:arm .
```

#### Deployment

```sh
# run container
# for ARM use snippet-box:arm tag
docker run -p 5000:5000 -v /path/to/data:/app/data snippet-box
```

#### Docker Compose

```yaml
version: '3'
services:
  snippet-box:
    image: snippet-box:latest
    container_name: snippet-box
    volumes:
      - /path/to/host/data:/app/data
    ports:
      - 5000:5000
    restart: unless-stopped
```

### Without Docker

```sh
git clone https://github.com/Corredor-Mediterraneo/snippet-box.git
cd snippet-box
npm run init
npm run build
NODE_ENV=production node build/server.js
```

## Functionality

### Search

Search your snippets with built-in tags and language filters. Supports `lang:`, `tag:`, and free-text queries.

![Homescreen screenshot](./.github/img/home.png)

### Pinned Snippets

Pin your favorite / important snippets to home screen for easy and quick access.

### Snippet Library

Manage your snippets through snippet library. Easily filter and access your code using tags.

![Snippet library screenshot](./.github/img/snippets.png)

### Snippet Detail

View your code, snippet details and documentation. Built-in syntax highlighting. Easily perform snippet actions like edit, pin or delete from a single place.

![Snippet screenshot](./.github/img/snippet.png)

### Editor

Create and edit your snippets from a simple and easy to use editor.

![Editor screenshot](./.github/img/editor.png)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/snippets` | Get all snippets (supports `?limit=&offset=` pagination) |
| POST | `/api/snippets` | Create new snippet |
| GET | `/api/snippets/:id` | Get snippet by ID |
| PUT | `/api/snippets/:id` | Update snippet |
| DELETE | `/api/snippets/:id` | Delete snippet |
| POST | `/api/snippets/search` | Search with filters |
| GET | `/api/snippets/statistics/count` | Tag count statistics |
| GET | `/api/snippets/raw/:id` | Raw code output |
| POST | `/api/snippets/export` | Export all as JSON |
| POST | `/api/snippets/export/json` | Export selected as JSON |
| POST | `/api/snippets/export/markdown` | Export by tag as Markdown |
| POST | `/api/snippets/export/markdown/selected` | Export selected as Markdown |
| **POST** | **`/api/snippets/import`** | **Import snippets from JSON** *(new)* |
| POST | `/api/backup` | Backup to Google Drive *(new)* |

### Import Snippets (New)

Import snippets from a JSON file compatible with the export format:

```bash
curl -X POST http://localhost:5000/api/snippets/import \
  -H "Content-Type: application/json" \
  -d '{
    "snippets": [
      {
        "title": "My Snippet",
        "description": "A useful snippet",
        "language": "typescript",
        "code": "console.log(\"hello\");",
        "docs": "Prints hello to console",
        "tags": ["utility", "logging"],
        "isPinned": false
      }
    ]
  }'
```

Response:

```json
{
  "data": {
    "imported": 1,
    "errors": 0,
    "importedIds": [42],
    "errorDetails": []
  }
}
```

### Google Drive Backup (New)

Configure the following environment variables to enable Google Drive backup:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_FOLDER_ID=your_folder_id  # optional
BACKUP_API_KEY=your_secret_api_key  # required for authentication
```

Then trigger a backup (requires API key):

```bash
curl -X POST http://localhost:5000/api/backup \
  -H "x-backup-api-key: your_secret_api_key"
```

### MCP Server (New)

The built-in MCP server exposes snippet operations to AI editors. Configure your editor to connect via stdio:

```json
{
  "mcpServers": {
    "snippet-box": {
      "command": "node",
      "args": ["build/mcp.js"]
    }
  }
}
```

Available tools: `list_snippets`, `get_snippet`, `create_snippet`, `update_snippet`, `delete_snippet`, `search_snippets`.

## Usage

### Search functionality

Visit wiki for search functionality and available filters reference: [Search functionality](https://github.com/pawelmalak/snippet-box/wiki/Search-functionality)

## License

Original project by [pawelmalak](https://github.com/pawelmalak/snippet-box) — MIT License.
