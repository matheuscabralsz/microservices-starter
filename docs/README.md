# Project Documentation

Welcome to the Generic Microservice Starter Template docs.

This folder contains documentation to help you understand, run, and extend the monorepo.

Sections:
- Overview
- Getting Started
- Architecture (see architecture.md)
- Development Workflow (see development.md)
- Testing
- Release & Versioning
- Infrastructure & Deployment (see infra.md)
- Observability (see observability.md)

## Overview
A reusable Nx monorepo template for building microservices (e.g., auth-service, billing-service, worker-service). Prepares for Docker, Kubernetes, Terraform, and observability integrations.

## Getting Started
- Prerequisites: Node 18/20, npm 9+, optional Nx CLI, Docker, Java 21 for api-java-service.
- Install: `npm install`
- Run: `npx nx serve api-nest-service`
- Test all: `npx nx run-many -t test`

For more details, see the repository root README.

## Architecture
- Monorepo managed by Nx.
- apps/ holds deployable services. Example services:
  - backend/api-nest-service: NestJS API.
  - backend/api-java-service: Java-based API.
- packages/ holds shared libraries (to be added as needed).
- infrastructure/ will contain IaC (Kubernetes manifests, Terraform modules) as the project grows.

## Development Workflow
- Create features with Nx generators when possible.
- Keep changes scoped; follow the simplified Contributing guidance in the root README.
- Common commands:
  - List projects: `npx nx show projects`
  - Affected graph/build: `npx nx affected -t build,test --base=origin/main --head=HEAD`
  - Lint: `npx nx lint <project>`
  - Test: `npx nx test <project>`

## Testing
- Unit tests live next to source per project.
- Run all tests: `npx nx run-many -t test`
- Consider adding e2e projects for APIs as the system evolves.

## Release & Versioning
- Suggested: Conventional Commits and semantic versioning.
- Automate changelogs in CI (future improvement).

## Infrastructure & Deployment (roadmap)
Planned items:
- Containerization: Dockerfiles per service and docker-compose for local orchestration.
- Kubernetes: Helm charts or Kustomize for services, plus manifests for namespaces/networking.
- Terraform: Modules for cloud resources (e.g., VPC, databases, registries).
- CI/CD: Nx affected pipelines, image build/push, deploy to clusters.

## Observability (roadmap)
- Logging: structured logs (e.g., pino for Node, logback for Java).
- Tracing: OpenTelemetry SDK auto-instrumentation.
- Metrics: Prometheus scraping and Grafana dashboards.

## Contribution
See the simplified Contributing section in the root README for PR etiquette, branch naming, and quality gates.
