# Generic Microservice Starter Template

A reusable monorepo template for building microservices-based systems, managed by Nx. Intended as a starting point for future services like auth-service, billing-service, worker-service, and more. Planned integrations include Docker, Kubernetes, Terraform, and observability tooling.

## Prerequisites

Before you get started, ensure you have the following installed/set up:

- Node.js: v18.x or v20.x LTS recommended (check with `node -v`).
- pnpm or npm: project is tested with npm, but pnpm/yarn should work. Use npm v9+ (check with `npm -v`).
- Nx CLI (optional): `npm i -g nx` for convenience; otherwise use `npx nx ...`.
- Docker (optional but recommended): required to build/run containerized services like api-nest-service or future services.
- Java 21 and Maven/Gradle (for api-java-service) if you plan to build/run the Java service locally.

## Quick Start

- Install dependencies: `npm install`
- List projects: `npx nx show projects`
- Serve Nest API: `npx nx serve api-nest-service`
- Run tests for all: `npx nx run-many -t test`

## Project Structure

The monorepo is organized into the following top-level directories:

-   `apps/`: Contains the deployable applications.
    -   `backend/`: For backend services.
    -   `frontend/`: For frontend applications.
-   `packages/`: Contains shared libraries and modules.
-   `infrastructure/`: Contains infrastructure as code (e.g., Kubernetes, Terraform).
-   `docs/`: Contains project documentation. See docs/README.md for an overview.

## Development Commands

### Available Projects: `api-nest-service`, `api-java-service`
### Global Commands
- Generate: `nx generate @nx/nest:app --name=<app-name> --directory="apps/<frontend-or-backend>/<directory>"`
- Build: `npx nx build <app-name>`
- Test: `npx nx test <app-name>`
- Run: `npx nx serve <app-name>`
- Clean: `npx nx run api-nest-service:clean`
- Affected build (CI/CD optimization): `npx nx affected -t build,test --base=origin/main --head=HEAD`

### Discovering Generators
You can see a list of all available generators by running `nx list`. To see the generators for a specific package, you can run `nx list <package-name>`, for example `nx list @nx/nest`.

## Contributing

Keep it simple. For any PR:

- Scope: one change per PR. Small and focused.
- Branch: use short kebab‑case (e.g., `feat/auth-login`).
- Quality gate: run lint, tests, and build for affected projects.
- Context: link related issues and note impacted apps/packages.
- Style: follow ESLint/Prettier and Conventional Commits.

Quick PR steps:
1) Create a branch from main. 2) Make the change with tests/docs. 3) `npx nx run-many -t lint,test,build` (or affected). 4) Open PR with a clear title/description.