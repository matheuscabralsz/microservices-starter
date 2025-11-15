PolyStack repository – advanced development guidelines

Scope
- This document captures project-specific practices derived from the repository’s technical references. It assumes familiarity with Nx monorepos, Docker, CI/CD, and polyglot service development.
- Source of truth for this guide: docs/initial-idea.md and .claude/CLAUDE.md.

Monorepo model and naming
- Nx monorepo with apps (web/mobile/services), libs (shared UI/utilities), infrastructure (terraform/k8s/docker), tools (generators/local-dev).
- Naming convention: <purpose>-<languageOrFramework>-<category>
  - Categories: web, app, service
  - Common purposes: api, auth, payment, worker, gateway, admin
  - Framework/language: react, angular, vue, nestjs, spring, golang, fastapi, rust, python
  - Examples: api-nest-service, dashboard-vue-web, worker-rust-service

Local development configuration
Prerequisites
- Node 18+ and Nx CLI.
- Docker (Desktop) with Docker Compose enabled.

Environment variables pattern
- Baseline keys (adjust per service):
  - NODE_ENV, PORT, HOST
  - DATABASE_URL, REDIS_URL
  - JWT_SECRET, JWT_EXPIRES_IN
  - STRIPE_API_KEY, SENDGRID_API_KEY
  - SENTRY_DSN, LOG_LEVEL
- Keep secrets out of VCS; use .env files locally and a secrets manager in production.

Ports and service expectations
- Web micro-frontends: typical 3000–3002 assignment (shell-react-web 3000, auth-vue-web 3001, checkout-svelte-web 3002).
- API examples: api-nest-service 3100.
- Infra services via tools/local-dev/docker-compose.yml:
  - PostgreSQL 5432, MongoDB 27017, Redis 6379, Kafka 9092, MinIO 9000.
- Observability references include Grafana 3000; avoid collision with shell-react-web 3000 by remapping either Grafana or the shell app locally.

Docker usage
- Standard Node service Dockerfile (multi-stage) as documented in docs/initial-idea.md.
- Compose file location: tools/local-dev/docker-compose.yml for databases, cache, messaging, and object storage used across services.
- Recommendation: build application images only in CI; during iterative dev, use Nx serve for hot reload and Compose only for infra.

Nx workflows
- Dev servers:
  - nx serve <project> [--port=<port>]
  - Example: nx serve api-nest-service --port=3100
- Build:
  - nx build <project> [--configuration=production]
  - nx run-many --target=build --all
- Test and lint:
  - nx test <project> [--coverage]
  - nx run-many --target=test --all
  - nx lint <project>
- Repo-wide utilities:
  - nx graph (dependency visualization)
  - nx affected:test / nx affected:build (PR/CI targeting)
  - nx reset (clear Nx cache if you see stale results)

Code generation
- Prefer generators to keep structure consistent:
  - Services: nx generate @polystack/generators:service --name=<n> --language=typescript --framework=nestjs
  - Web apps: nx generate @polystack/generators:web-app --name=<n> --framework=react
  - Shared libs: nx generate @polystack/generators:library --name=<n> --type=shared
- New services should expose at minimum:
  - GET /health
  - GET /api/docs (OpenAPI UI)
  - JWT middleware, validation, centralized error handling

API and error standards
- REST endpoint shape per docs/initial-idea.md (list/get/create/put/patch/delete under /api/v1/<resource>). Use 200/201/204/400/401/403/404/422/500 appropriately.
- Response envelope: { success, data, meta? }. Error envelope: { success: false, error: { code, message, details[] } }.

Testing and quality gates
- Target 80%+ coverage across units. Add integration tests for DB, message bus, and external APIs. E2E for critical flows.
- Linting: ESLint (use repository presets). Formatting: Prettier. Run in CI before build.

Security baseline
- JWT RS256; refresh token rotation (15m access, 7d refresh as reference).
- API rate limiting, strict input validation, parameterized DB access, sanitization for XSS, proper CORS.
- Never commit secrets; use env vars locally, secrets manager in prod.

Observability
- Log as JSON: include timestamp, level, service, traceId/spanId, message, and contextual fields.
- Emit health checks with component-level statuses (db/redis/kafka) and version/uptime.
- Track request rate, latency percentiles, error rate, CPU/memory, connections.

Commit and branch conventions
- Branches: feature/<name>, fix/<name>, docs/<name>, refactor/<name>, test/<name>.
- Conventional commits: feat|fix|docs|style|refactor|test|chore(scope): message.

Troubleshooting
- Port conflicts (common: 3000). Adjust nx serve --port or remap Grafana in local Compose.
- Stale build/test results: run nx reset to clear cache.
- Compose dependencies: start tools/local-dev/docker-compose.yml before running services that require DB/Redis/Kafka/MinIO.
- Ensure JWT_SECRET and DB URLs are present for auth- and api-* services; missing values will surface as boot-time failures.

When adding new code
- Follow naming convention and place apps/services under the correct subfolder in apps/.
- Expose /health and /api/docs early to integrate with local monitoring and API explorers.
- Keep configuration isolated in src/config and respect the env var contract above.
- Prefer shared libs under libs/ for cross-cutting utilities to reduce duplication.

Notes
- This guide intentionally omits general-purpose instructions and focuses on this repository’s patterns and expectations described in docs/initial-idea.md and .claude/CLAUDE.md.
