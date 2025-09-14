# Microservices Starter – Development Guidelines

This document captures project-specific, non-obvious details to speed up development and testing in this Nx monorepo.

Last verified: 2025‑09‑13

## Build and Configuration

- Toolchain
  - Node.js 18 or 20, npm 9+ recommended.
  - Nx is used via npx; no global install required.
  - TypeScript 5.8.x and Jest 30 with SWC.
  - Java 21 required for the api-java-service.
- Workspace layout (nx.json)
  - apps in apps/, shared libs in packages/.
  - Nx Jest plugin is enabled; e2e project apps/backend/api-nest-service-e2e is excluded from default unit test plugin discovery.
- Common commands
  - Install deps: npm install
  - List projects: npx nx show projects
  - Affected: npx nx affected -t lint,test,build --base=origin/main --head=HEAD
- Node/Nest service (api-nest-service)
  - Serve: npx nx serve api-nest-service
  - Build: npx nx build api-nest-service (if target is present; otherwise use serve for dev)
- Java service (api-java-service)
  - Nx delegates to Gradle via nx:run-commands targets defined in apps/backend/api-java-service/project.json:
    - Build: npx nx build api-java-service → ./gradlew build
    - Test: npx nx test api-java-service → ./gradlew test
    - Run: npx nx serve api-java-service → ./gradlew bootRun
  - Ensure Java 21 and Gradle wrapper are available. Commands run with cwd apps/backend/api-java-service.

## Testing

- Test runner: Jest 30 with @swc/jest for TS transformation. Root jest.config.ts aggregates project configs via @nx/jest getJestProjectsAsync().
- Run tests
  - All projects: npx nx run-many -t test
  - Single project: npx nx test api-nest-service
  - Watch (per project): npx nx test api-nest-service --watch
- Adding a unit test (Nest example)
  - Co-locate spec files with sources. Example path: apps/backend/api-nest-service/src/app/foo.spec.ts
  - Minimal example:
    
    describe('sanity', () => {
      it('adds numbers', () => {
        expect(1 + 2).toBe(3);
      });
    });
    
  - Verified command: npx nx test api-nest-service
- Important Jest/SWC details
  - Each TS project has its own jest.config.ts. For api-nest-service it reads a local .spec.swcrc to configure SWC.
  - Environment gotcha (fixed): Jest 30 loads TS config as ESM; __dirname is undefined in ESM. Use ESM-safe resolution:
    
    const DIR = new URL('.', import.meta.url).pathname;
    const swcJestConfig = JSON.parse(readFileSync(`${DIR}.spec.swcrc`, 'utf-8'));
    
  - This change has been applied so tests run without ESM/__dirname issues.
- Coverage
  - api-nest-service outputs coverage to test-output/jest/coverage.

## Linting and Code Style

- ESLint flat config at eslint.config.mjs with @nx/eslint-plugin.
  - Module boundaries enforced via @nx/enforce-module-boundaries; tags are currently permissive (* → *). Add tags to libs as they appear and restrict dependencies accordingly.
- Formatting via Prettier (no repo-level script; use your editor integration or run prettier directly).
- Suggested commit style: none enforced; consider Conventional Commits in CI later.

## Debugging and Developer Tips

- Nx target defaults set test to depend on ^build (nx.json). If a project defines a build target, Nx will build upstream deps before testing. If tests appear stale, try npx nx reset.
- Nx Cloud prompts may appear in CLI output; the workspace is not connected and this is benign for local dev.
- Environment variables
  - Use .env files per service during local dev; never commit secrets.
  - For Nest apps, configure ConfigModule appropriately (not yet prewired here).
- E2E tests
  - An e2e project exists (api-nest-service-e2e). It’s excluded from unit test plugin auto-discovery. Run it explicitly when it’s configured (e.g., npx nx e2e api-nest-service-e2e) and ensure any required server is running beforehand.

## Repro/Validation Performed

- Verified unit tests run for api-nest-service after ESM-safe jest.config.ts fix:
  - npx nx test api-nest-service → 3 tests passed locally (including a trivial sanity spec used to confirm the flow).
  - The sanity spec was only for demonstration and has been removed to keep the repo clean.

## Future Enhancements (notes for maintainers)

- Add consistent scripts section to root package.json (lint, test, affected) for convenience.
- Introduce project tags and tighter boundary rules as packages/ libraries are added.
- Standardize environment configuration (e.g., @nestjs/config for Node, Spring profiles for Java) and document variables.
- Add Dockerfiles and CI examples per service as they stabilize.
