# Development

## Prerequisites
- Node.js 18.x or 20.x, npm (preferred)
- Nx CLI (optional)
- Docker (for local containers)
- Java 21 (for api-java-service)

## Naming Conventions
Use `<purpose>-<language-or-framework>-<service-or-web>`.
Examples:
- `billing-golang-service`
- `dashboard-angular-web`
- `blog-react-web`
- `worker-rust-service`

## Getting Started
- Install deps: `npm install`
- Show projects: `npx nx show projects`
- Run Nest service: `npx nx serve api-nest-service`
- Run tests: `npx nx run-many -t test`

## Linting & Formatting
- ESLint and Prettier are used.
- Run: `npx nx lint <project>`

## Commits & Branching
- Branch naming: short kebab-case, e.g., `feat/auth-login`.
- Commit convention: none mandated yet. Consider adopting Conventional Commits later for releases.

## Environments
- dev, prod
- Use `.env` files locally; secrets should not be committed.

## Affected Workflow
- Build/test only what changed:
  - `npx nx affected -t lint,test,build --base=origin/main --head=HEAD`

## Docker Compose (initial)
- Each service should provide a Dockerfile and optional docker-compose snippets for local orchestration.

## Kubernetes (later)
- Migrate services to K8s with Helm or Kustomize. Define resources per service and shared namespaces.

## API Docs
- Use Swagger/OpenAPI for API documentation. Ensure routes are exposed for Swagger UI where applicable.
