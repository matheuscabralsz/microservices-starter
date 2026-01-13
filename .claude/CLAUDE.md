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

## When Creating New Services
Always update `tools/local-dev/docker-compose.yml` to include the new service with:
- Build context pointing to the service directory
- Environment variables (PORT, DATABASE_URL, etc.)
- Port mapping
- Dependency on postgres (with health check condition)
- Health check configuration

If the service needs its own database, create an init script in `tools/local-dev/init-scripts/`:
- Name format: `01-init-<dbname>-db.sql`
- Include: `CREATE DATABASE <dbname>;` and `GRANT ALL PRIVILEGES`