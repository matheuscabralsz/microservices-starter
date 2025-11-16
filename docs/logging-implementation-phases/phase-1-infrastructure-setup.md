# Phase 1: Infrastructure Setup - Detailed Implementation Plan

**Phase**: 1 of 5
**Goal**: Set up Kafka (KRaft mode), Elasticsearch, and Kibana in Docker Compose
**Duration**: 2-3 hours
**Prerequisites**: Docker and Docker Compose installed

---

## Overview

This phase establishes the foundational infrastructure for the centralized logging system. We'll add three critical services to the local development environment:
- **Kafka** (KRaft mode) - Message broker for log streaming
- **Elasticsearch** - Search and analytics engine for log storage
- **Kibana** - Visualization and exploration UI

**Why KRaft Mode?**
- No Zookeeper dependency (simpler setup)
- Faster metadata operations
- Modern Kafka architecture (Kafka 3.0+)
- Future-proof (Zookeeper deprecated in Kafka 4.0)

---

## Prerequisites Check

Before starting, verify:
- [ ] Docker version 20.10+ installed: `docker --version`
- [ ] Docker Compose version 2.0+ installed: `docker-compose --version`
- [ ] At least 4GB RAM available for Docker
- [ ] Ports available: 9092, 9093, 9200, 5601
- [ ] Sufficient disk space (at least 10GB free)

---

## Step-by-Step Implementation

### Step 1: Backup Current Docker Compose Configuration

**Duration**: 2 minutes

**Commands**:
```bash
cd /home/mack/my_workspace/microservices-starter/tools/local-dev
cp docker-compose.yml docker-compose.yml.backup
```

**Verification**:
```bash
ls -l docker-compose.yml*
# Should show both original and backup
```

**Why**: Always backup before making infrastructure changes to allow quick rollback if needed.

---

### Step 2: Add Kafka Service (KRaft Mode)

**Duration**: 15 minutes

**Action**: Edit `tools/local-dev/docker-compose.yml` and add the Kafka service.

**Service Configuration**:
```yaml
services:
  # ... existing services ...

  kafka:
    image: apache/kafka:latest
    container_name: polystack-kafka
    ports:
      - "9092:9092"    # External access
      - "9093:9093"    # Controller port
    environment:
      # KRaft mode configuration
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_NUM_PARTITIONS: 3
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
    volumes:
      - kafka_data:/var/lib/kafka/data
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - polystack-network
```

**Configuration Breakdown**:
- `KAFKA_NODE_ID`: Unique identifier for this broker
- `KAFKA_PROCESS_ROLES`: This node acts as both broker and controller
- `KAFKA_LISTENERS`: Internal listener addresses
- `KAFKA_ADVERTISED_LISTENERS`: Address clients use to connect
- `KAFKA_CONTROLLER_QUORUM_VOTERS`: Controllers participating in consensus
- `CLUSTER_ID`: Unique cluster identifier (required for KRaft)
- `KAFKA_NUM_PARTITIONS`: Default partition count for new topics
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE`: Auto-create topics on first publish

**Why These Settings?**:
- Replication factors set to 1 for single-node local development
- 3 partitions for parallel processing by multiple consumers
- Auto-create enabled for easier development (disable in production)

---

### Step 3: Add Elasticsearch Service

**Duration**: 10 minutes

**Service Configuration**:
```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: polystack-elasticsearch
    ports:
      - "9200:9200"    # HTTP API
      - "9300:9300"    # Node communication
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - bootstrap.memory_lock=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - polystack-network
```

**Configuration Breakdown**:
- `discovery.type=single-node`: Single-node cluster for local development
- `xpack.security.enabled=false`: Disable security for easier local development
- `ES_JAVA_OPTS`: Limit heap size to 512MB (adjust based on your machine)
- `bootstrap.memory_lock=true`: Prevent swapping for better performance

**Why These Settings?**:
- Single-node is sufficient for local development
- Security disabled for easier testing (MUST enable in production)
- Memory limit prevents Elasticsearch from consuming all available RAM

---

### Step 4: Add Kibana Service

**Duration**: 5 minutes

**Service Configuration**:
```yaml
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: polystack-kibana
    ports:
      - "5601:5601"    # Web UI
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=elastic
      - ELASTICSEARCH_PASSWORD=changeme
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5601/api/status || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - polystack-network
```

**Configuration Breakdown**:
- `ELASTICSEARCH_HOSTS`: Elasticsearch connection URL
- `depends_on`: Wait for Elasticsearch to be healthy before starting
- Healthcheck with 10 retries (Kibana takes longer to start)

---

### Step 5: Add Docker Volumes

**Duration**: 2 minutes

**Action**: Add volume definitions at the bottom of `docker-compose.yml`.

```yaml
volumes:
  kafka_data:
    driver: local
  elasticsearch_data:
    driver: local
  # ... existing volumes ...
```

**Why**: Persist data across container restarts to avoid data loss during development.

---

### Step 6: Add Network Configuration (if not exists)

**Duration**: 2 minutes

**Action**: Ensure network is defined at the bottom of `docker-compose.yml`.

```yaml
networks:
  polystack-network:
    driver: bridge
```

**Why**: Isolated network for service communication with DNS resolution.

---

### Step 7: Start Infrastructure Services

**Duration**: 5 minutes

**Commands**:
```bash
cd /home/mack/my_workspace/microservices-starter/tools/local-dev

# Start only the new services
docker-compose up -d kafka elasticsearch kibana

# Watch the logs to monitor startup
docker-compose logs -f kafka elasticsearch kibana
```

**Expected Output**:
```
Creating polystack-kafka ... done
Creating polystack-elasticsearch ... done
Creating polystack-kibana ... done
```

**Startup Time**:
- Kafka: 10-15 seconds
- Elasticsearch: 30-60 seconds
- Kibana: 60-90 seconds

**What to Watch For**:
- Kafka: Look for "Kafka Server started" message
- Elasticsearch: Look for "started" and cluster health = "green"
- Kibana: Look for "http server running"

**Troubleshooting**:
- If services fail to start, check Docker resource limits
- Ensure ports are not already in use: `lsof -i :9092`, `lsof -i :9200`
- Check container logs: `docker-compose logs <service-name>`

---

### Step 8: Verify Kafka is Running

**Duration**: 5 minutes

**Health Check**:
```bash
# Check if Kafka broker is responding
docker-compose exec kafka kafka-broker-api-versions \
  --bootstrap-server localhost:9092

# Expected: List of API versions
```

**Check Container Status**:
```bash
docker-compose ps kafka

# Expected: State = Up (healthy)
```

**Alternative Verification**:
```bash
# Check Kafka logs
docker-compose logs kafka | grep "started"

# Should show: "Kafka Server started"
```

**What Success Looks Like**:
```
kafka-0.9.0.0
kafka-0.9.0.1
kafka-0.10.0.0
...
```

**Common Issues**:
- "Connection refused": Kafka still starting, wait 10 more seconds
- "No route to host": Check ADVERTISED_LISTENERS configuration
- Container exits immediately: Check CLUSTER_ID is set correctly

---

### Step 9: Verify Elasticsearch is Running

**Duration**: 3 minutes

**Health Check**:
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Expected: "status": "green" or "yellow"
```

**Expected Response**:
```json
{
  "cluster_name" : "docker-cluster",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 1,
  "number_of_data_nodes" : 1,
  "active_primary_shards" : 0,
  "active_shards" : 0,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0
}
```

**Check Version**:
```bash
curl http://localhost:9200

# Should return cluster info with version 8.11.0
```

**Common Issues**:
- "Connection refused": Elasticsearch still starting, wait 30 seconds
- "yellow" status: Normal for single-node cluster
- "red" status: Check logs for errors: `docker-compose logs elasticsearch`

---

### Step 10: Verify Kibana is Running

**Duration**: 3 minutes

**Access Kibana UI**:
```bash
# Open in browser
http://localhost:5601

# Or check via curl
curl http://localhost:5601/api/status
```

**Expected**:
- Browser: Kibana home screen loads
- Curl: Status "available"

**Initial Setup**:
- First load may show "Kibana server is not ready yet"
- Wait 1-2 minutes for Kibana to fully initialize
- Refresh the page

**Common Issues**:
- "Kibana server is not ready": Still starting, wait 1 minute
- Can't connect to Elasticsearch: Check Elasticsearch is running
- Blank page: Clear browser cache and reload

---

### Step 11: Create Kafka Topic for Logs

**Duration**: 5 minutes

**Manual Topic Creation** (optional, as auto-create is enabled):
```bash
# Create the 'logs' topic with 3 partitions
docker-compose exec kafka kafka-topics \
  --create \
  --topic logs \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Expected: Created topic logs.
```

**Verify Topic Creation**:
```bash
# List all topics
docker-compose exec kafka kafka-topics \
  --list \
  --bootstrap-server localhost:9092

# Should show: logs
```

**Describe Topic**:
```bash
# Get detailed topic information
docker-compose exec kafka kafka-topics \
  --describe \
  --topic logs \
  --bootstrap-server localhost:9092

# Should show 3 partitions
```

**Why 3 Partitions?**
- Allows parallel consumption by up to 3 consumer instances
- Balances parallelism with complexity
- Can be increased later if needed

**Note**: With `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`, topics are created automatically on first message publish. Manual creation is optional but provides better control.

---

### Step 12: Test End-to-End Infrastructure

**Duration**: 10 minutes

**Test 1: Publish Test Message to Kafka**
```bash
# Publish a test message
echo '{"test":"message","timestamp":"2025-11-16T10:00:00Z"}' | \
  docker-compose exec -T kafka kafka-console-producer \
    --broker-list localhost:9092 \
    --topic logs
```

**Test 2: Consume Test Message**
```bash
# Consume from the beginning
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic logs \
  --from-beginning \
  --max-messages 1

# Expected: {"test":"message","timestamp":"2025-11-16T10:00:00Z"}
# Press Ctrl+C after seeing the message
```

**Test 3: Create Test Index in Elasticsearch**
```bash
# Create a test index
curl -X PUT "localhost:9200/test-index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'

# Expected: {"acknowledged":true,"shards_acknowledged":true,"index":"test-index"}
```

**Test 4: Index Test Document**
```bash
# Add a test document
curl -X POST "localhost:9200/test-index/_doc" -H 'Content-Type: application/json' -d'
{
  "message": "Hello Elasticsearch",
  "timestamp": "2025-11-16T10:00:00Z"
}'

# Expected: {"_index":"test-index","_id":"...","result":"created"}
```

**Test 5: Search Test Document**
```bash
# Search for the document
curl -X GET "localhost:9200/test-index/_search?pretty"

# Expected: Should return the document we just indexed
```

**Test 6: Verify in Kibana**
1. Open http://localhost:5601
2. Go to "Management" → "Stack Management" → "Index Management"
3. Should see `test-index` listed
4. Go to "Discover" (if index pattern exists)

**Cleanup Test Data**:
```bash
# Delete test index
curl -X DELETE "localhost:9200/test-index"
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Kafka container is running and healthy
- [ ] Elasticsearch container is running and healthy
- [ ] Kibana container is running and healthy
- [ ] Kafka topic `logs` exists (or auto-create is enabled)
- [ ] Can publish messages to Kafka topic
- [ ] Can consume messages from Kafka topic
- [ ] Elasticsearch API responds on port 9200
- [ ] Can create indices in Elasticsearch
- [ ] Can index and search documents
- [ ] Kibana UI loads on port 5601
- [ ] All services persist data through restarts

**Final Verification Command**:
```bash
docker-compose ps kafka elasticsearch kibana

# All should show State: Up (healthy)
```

---

## Configuration Reference

### Environment Variables for Future Use

These will be used by application services in Phase 2:

```env
# For Node.js services
KAFKA_BROKERS=localhost:9092
KAFKA_LOG_TOPIC=logs
KAFKA_CLIENT_ID=<service-name>

# For Java log service (Phase 3)
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
SPRING_KAFKA_CONSUMER_GROUP_ID=log-service-group
SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200
```

**Note**: `localhost` vs service name:
- Use `localhost` for applications running on host machine
- Use service name (e.g., `kafka`) for applications running in Docker

---

## Resource Usage

Expected resource consumption:

| Service | CPU (idle) | Memory | Disk |
|---------|-----------|--------|------|
| Kafka | 1-2% | 512MB | 500MB |
| Elasticsearch | 5-10% | 512MB | 1GB |
| Kibana | 2-5% | 256MB | 200MB |
| **Total** | ~10-15% | ~1.3GB | ~2GB |

**Optimization Tips**:
- Reduce Elasticsearch heap if low on RAM: `ES_JAVA_OPTS=-Xms256m -Xmx256m`
- Stop services when not in use: `docker-compose stop kafka elasticsearch kibana`
- Clear old data: `docker volume prune`

---

## Troubleshooting Guide

### Issue: Kafka fails to start with "CLUSTER_ID not set"

**Solution**:
```bash
# Generate a new cluster ID
docker run --rm apache/kafka:latest kafka-storage random-uuid

# Use the output as CLUSTER_ID in docker-compose.yml
```

### Issue: Elasticsearch fails with "max virtual memory areas too low"

**Solution (Linux)**:
```bash
# Increase vm.max_map_count
sudo sysctl -w vm.max_map_count=262144

# Make permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

**Solution (macOS/Windows)**:
- Increase Docker Desktop memory to 4GB+
- Adjust in Docker Desktop → Settings → Resources

### Issue: Ports already in use

**Check what's using the port**:
```bash
lsof -i :9092   # Kafka
lsof -i :9200   # Elasticsearch
lsof -i :5601   # Kibana
```

**Solution**: Stop the conflicting service or change ports in docker-compose.yml

### Issue: Containers exit immediately

**Check logs**:
```bash
docker-compose logs kafka
docker-compose logs elasticsearch
docker-compose logs kibana
```

**Common causes**:
- Insufficient memory
- Port conflicts
- Invalid configuration
- Volume permission issues

### Issue: "Unhealthy" status

**Debug healthcheck**:
```bash
# Manually run healthcheck command
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

**If healthcheck command fails**:
- Check if service is still starting (wait longer)
- Verify ports are accessible inside container
- Check network connectivity

---

## Rollback Procedure

If something goes wrong:

**Step 1: Stop new services**
```bash
docker-compose stop kafka elasticsearch kibana
```

**Step 2: Remove containers**
```bash
docker-compose rm -f kafka elasticsearch kibana
```

**Step 3: Restore backup**
```bash
cd /home/mack/my_workspace/microservices-starter/tools/local-dev
cp docker-compose.yml.backup docker-compose.yml
```

**Step 4: Remove volumes (if needed)**
```bash
docker volume rm local-dev_kafka_data local-dev_elasticsearch_data
```

---

## Next Steps

After Phase 1 is complete:

1. **Phase 2**: Integrate Kafka logger into `todo-nodejs-service`
2. Create shared logging library for reuse across services
3. Implement request/response logging middleware
4. Test log publishing from application to Kafka

**Preparation for Phase 2**:
- Ensure `todo-nodejs-service` is running
- Familiarize with KafkaJS library
- Review todo service code structure

---

## Success Criteria

Phase 1 is complete when:

- ✅ Kafka, Elasticsearch, and Kibana are running in Docker
- ✅ All services pass health checks
- ✅ Kafka topic `logs` exists or auto-create is enabled
- ✅ Can publish and consume messages via Kafka CLI
- ✅ Elasticsearch API responds and accepts documents
- ✅ Kibana UI is accessible and connected to Elasticsearch
- ✅ Services persist data through container restarts
- ✅ No errors in any container logs

**Estimated Completion Time**: 2-3 hours (including troubleshooting)

---

## References

- [Apache Kafka KRaft Mode](https://kafka.apache.org/documentation/#kraft)
- [Elasticsearch Docker Setup](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)
- [Kibana Docker Setup](https://www.elastic.co/guide/en/kibana/current/docker.html)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
