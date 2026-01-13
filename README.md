# PolyStack - Microservices Starter

A comprehensive polyglot microservices platform built on **Nx 21.6.5** monorepo architecture, designed for cloud deployment (AWS/Azure/GCP).

## Overview

This repository serves as both a **learning project** and a **production-ready starter kit** for future microservices projects using multiple programming languages and frameworks.

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
- Docker & Docker Compose
- Git

## Running the Project

### Docker Compose (Full Stack)

```bash
cd tools/local-dev

# Start all services
docker-compose up -d

# Start with live logs
docker-compose up

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f              # All services
docker-compose logs -f todo-service # Todo service only
docker-compose logs -f postgres     # Database only

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes (full cleanup)
docker-compose down -v
```

## Available Services

| Service | Port | URLs |
|---------|------|------|
| NestJS Monolith | 3000 | http://localhost:3000/health |
| Todo Service | 3105 | http://localhost:3105/health |
| Todo Swagger | 3105 | http://localhost:3105/api/docs |
| PostgreSQL | 5432 | `postgres://postgres:postgres@localhost:5432/polystack_dev` |

## Status

🚧 **In Development** - resource-nodejs-service

## License

MIT
