# Observability

Stack choices:
- Logs: Kibana (ELK/OpenSearch)
- Metrics: Prometheus + Grafana
- Traces: OpenTelemetry (export to Tempo/Jaeger in the future)

## Logging
- Use structured JSON logs
- Node (NestJS): use pino/pino-http; map levels to environment
- Java: use logback/log4j2 with JSON encoders
- Correlate requests via trace/span IDs

## Metrics
- Expose Prometheus scrape endpoints per service
- Standard process/runtime metrics + app-specific counters/histograms

## Tracing
- Install OpenTelemetry SDKs and auto-instrumentations for HTTP, DB, etc.
- Propagate trace context through Kong and between services

## Dashboards & Alerts
- Provide default Grafana dashboards per service
- Define SLOs and alert rules (e.g., latency, error rate)
