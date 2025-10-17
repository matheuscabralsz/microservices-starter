# PolyStack - Microservices Starter

A comprehensive polyglot microservices platform built on **Nx 21.6.5** monorepo architecture, designed for cloud deployment (AWS/Azure/GCP).

## Overview

This repository serves as both a **learning project** and a **production-ready starter kit** for future microservices projects using multiple programming languages and frameworks.

## Tech Stack

- **Monorepo**: Nx 21.6.5 (Integrated Workspace)
- **Package Manager**: npm
- **Languages**: TypeScript, JavaScript, Go, Python, Java, Rust
- **Frameworks**: NestJS, React, Angular, Vue, Spring Boot, FastAPI, Actix-web
- **Infrastructure**: Docker, Kubernetes, Terraform
- **CI/CD**: GitHub Actions

## Project Structure

```
polystack/
├── apps/
│   ├── web/                  # Frontend applications
│   ├── mobile/               # Mobile applications
│   └── services/             # Backend microservices
├── libs/
│   ├── shared/               # Shared utilities
│   └── ui-components/        # Design system
├── infrastructure/
│   ├── terraform/            # Infrastructure as Code
│   ├── kubernetes/           # K8s manifests
│   └── docker/               # Dockerfiles
├── tools/
│   ├── generators/           # Code generators
│   └── local-dev/            # Docker Compose
└── docs/                     # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Docker & Docker Compose
- Git

### Installation

```bash
# Install dependencies
npm install

# Verify Nx installation
npx nx --version
```

### Common Commands

```bash
# Serve an application
npm start <app-name>

# Build a project
npm run build <project-name>

# Run tests
npm test <project-name>

# Lint code
npm run lint

# View dependency graph
npm run dep-graph
```

## Documentation

- [Implementation Plan](./docs/api-nest-service-implementation-plan.md) - API NestJS Service TODO CRUD
- [Initial Idea](./docs/initial-idea.md) - Technical specifications
- [Project Guidelines](./.claude/CLAUDE.md) - Development standards

## Status

🚧 **In Development** - Setting up the Nx monorepo infrastructure

## License

MIT
