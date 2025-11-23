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

## Quick Start

```bash
# Start all services (PostgreSQL, Kafka, Kafka UI)
cd tools/local-dev
docker-compose up -d

# Run migrations (if database already exists)
./run-migrations.sh

# Fresh start (deletes all data)
docker-compose down -v && docker-compose up -d
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Access PostgreSQL
docker exec -it polystack-postgres psql -U postgres -d todos

# Stop services
docker-compose down
```

## Services & Ports

- **PostgreSQL**: 5432 (DB: `todos`)
- **Kafka Broker**: 9092-9093
- **Kafka UI**: http://localhost:8080
- **Todo Service**: 3105 (when running)

## Status

🚧 **Phase 1 In Progress** - Kafka event-driven architecture (Steps 1-2 complete)

## License

MIT
