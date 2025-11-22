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

## Useful Commands

### Run everything
```bash
cd tools/local-dev && docker-compose up -d
```

### Run psql
```bash
cd tools/local-dev && docker exec -it polystack-postgres psql -U postgres -d todos
```

## Ports
- todo-nodejs-service: 3105

## Databases:
  - todo

## Status

🚧 **In Development** - Setting up the Nx monorepo infrastructure

## License

MIT
