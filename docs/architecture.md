# Architecture

This starter is an Nx monorepo intended for microservices on AWS (cloud-agnostic via Terraform).

- API Gateway: Kong (planned)
- Services naming convention: `<purpose>-<language-or-framework>-<service-or-web>`
  - Examples: `billing-golang-service`, `dashboard-angular-web`, `blog-react-web`, `worker-rust-service`
- Initial runtime: Docker Compose (local/dev), then migrate to Kubernetes
- CI: GitHub Actions (primary) with a Jenkins example
- Observability: Kibana (ELK) for logs, Prometheus + Grafana for metrics/alerts, OpenTelemetry for tracing (planned)
- Auth: Multiple auth services possible (JWT-based, Keycloak-based, etc.)

## Repository Layout
- apps/
  - backend/
    - api-nest-service (NestJS)
    - api-java-service (Java)
  - frontend/ (future web apps, e.g., Angular/React)
- packages/ (shared libraries)
- infrastructure/ (Terraform modules, K8s manifests)
- docs/ (documentation)

## API Standards
- Documentation: Swagger/OpenAPI
- Versioning: recommend path-based versions, e.g., `/api/v1/...`
- Consistent error model and standard health endpoints `/health`, `/ready`

## Gateway
- Kong will front services; define routes per service, auth plugins as needed (JWT/OIDC)

## Environments
- dev and prod
- Use environment variables for configuration; never commit secrets; use SSM/Secrets Manager in cloud
