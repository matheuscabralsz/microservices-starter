# Local Development Environment

This directory contains Docker Compose configuration and scripts for local development.

## Quick Start

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Database Migrations

### For Fresh Setup (New Database)
Database migrations in `init-scripts/` run **automatically** when PostgreSQL container is created for the first time.

```bash
# Start fresh with auto-migrations
docker-compose down -v  # Remove old database
docker-compose up -d postgres  # Migrations run automatically
```

### For Existing Database
If the database already exists, run migrations manually:

```bash
# Run all migrations
./run-migrations.sh
```

The migration script:
- ✅ Checks if PostgreSQL is running
- ✅ Runs all SQL files in `init-scripts/` (except database creation)
- ✅ Is **idempotent** - safe to run multiple times
- ✅ Shows success/failure for each migration

## Services

### PostgreSQL (Port 5432)
- **Database**: `todos`
- **User**: `postgres`
- **Password**: `postgres`

### Kafka Broker (Ports 9092-9093)
- **Bootstrap Server**: `localhost:9092`
- **Mode**: KRaft (no Zookeeper)
- **Topic**: `todo-events` (3 partitions)

### Kafka UI (Port 8080)
- **URL**: http://localhost:8080
- View topics, messages, consumer groups

### Todo Service (Port 3105)
- **URL**: http://localhost:3105
- **Health**: http://localhost:3105/health

## Directory Structure

```
tools/local-dev/
├── docker-compose.yml       # Service definitions
├── init-scripts/            # Auto-run on first DB creation
│   ├── 01-init-todos-db.sql
│   ├── 02-create-events-table.sql
│   └── 03-update-todos-table.sql
├── kafka/
│   └── init-topics.sh       # Kafka topic initialization
└── run-migrations.sh        # Manual migration runner
```

## Common Commands

```bash
# View logs
docker-compose logs -f kafka
docker-compose logs -f postgres

# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart kafka

# Execute command in container
docker-compose exec postgres psql -U postgres -d todos

# Verify Kafka topic
docker-compose exec kafka /opt/kafka/bin/kafka-topics.sh \
  --list --bootstrap-server localhost:9092
```

## Troubleshooting

### Migrations not running?
- **Fresh setup**: Migrations auto-run on first PostgreSQL start
- **Existing database**: Run `./run-migrations.sh`

### Kafka unhealthy?
```bash
# Check logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Database connection refused?
```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# Check if ready
docker-compose exec postgres pg_isready -U postgres
```
