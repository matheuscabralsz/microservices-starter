#!/bin/bash
set -e

echo "======================================"
echo "Running Database Migrations"
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SCRIPTS_DIR="$SCRIPT_DIR/init-scripts"

# Check if PostgreSQL is running
if ! docker ps | grep -q polystack-postgres; then
    echo "Error: PostgreSQL container is not running"
    echo "Start it with: docker-compose up -d postgres"
    exit 1
fi

echo "Waiting for PostgreSQL to be ready..."
sleep 2

# Get list of SQL files in init-scripts (excluding database creation)
SQL_FILES=$(ls -1 "$INIT_SCRIPTS_DIR"/*.sql 2>/dev/null | grep -v "01-init-todos-db.sql" | sort || true)

if [ -z "$SQL_FILES" ]; then
    echo "No migration files found in $INIT_SCRIPTS_DIR"
    exit 0
fi

# Run each migration file
for SQL_FILE in $SQL_FILES; do
    FILENAME=$(basename "$SQL_FILE")
    echo ""
    echo "Running migration: $FILENAME"
    echo "--------------------------------------"

    if docker exec -i polystack-postgres psql -U postgres -d todos < "$SQL_FILE"; then
        echo "✅ Success: $FILENAME"
    else
        echo "❌ Failed: $FILENAME"
        exit 1
    fi
done

echo ""
echo "======================================"
echo "✅ All migrations completed successfully"
echo "======================================"

# Verify tables
echo ""
echo "Verifying tables in 'todos' database:"
docker exec polystack-postgres psql -U postgres -d todos -c "\dt"
