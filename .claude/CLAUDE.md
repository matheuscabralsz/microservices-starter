# PolyStack - Claude Code Guide

## Overview
Polyglot microservices platform on Nx monorepo. Learning project + production starter kit.

## Structure
- `apps/web/` - Frontends (React, Angular, Vue, Astro)
- `apps/services/` - Backends (NestJS, Go, Python, Java, Rust)
- `libs/` - Shared code
- `infrastructure/` - Terraform, K8s, Dockerfiles
- `tools/local-dev/` - Docker Compose

## Naming Convention
Pattern: `<purpose>-<language>-<category>`
- `service` = backend, `web` = frontend, `worker` = background jobs
- Examples: `api-nest-service`, `dashboard-vue-web`

## API Standards
Required: `GET /health`, `GET /api/docs`
```json
{ "success": true, "data": {}, "meta": { "page": 1, "total": 100 } }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

## Database Conventions
- Tables: lowercase, singular (`user`, `order`)
- Columns: snake_case, standard: `id`, `created_at`, `updated_at`, `deleted_at`
- Foreign keys: `<table>_id`

## Code Standards
- TypeScript strict mode
- DRY, SOLID principles