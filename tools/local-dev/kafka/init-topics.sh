#!/bin/bash
set -e

KAFKA_BROKER="kafka:9092"

echo "Waiting for Kafka to be ready..."
sleep 10

echo "Creating todo-events topic..."
kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete \
  --if-not-exists

echo "Topic created successfully!"

kafka-topics.sh --describe \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events
