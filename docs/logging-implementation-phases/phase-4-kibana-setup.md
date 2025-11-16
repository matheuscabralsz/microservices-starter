# Phase 4: Kibana Setup and Visualization - Detailed Implementation Plan

**Phase**: 4 of 5
**Goal**: Configure Kibana dashboards and visualizations for log analysis
**Duration**: 2-3 hours
**Prerequisites**: Phase 1, 2, 3 completed (Logs flowing into Elasticsearch)

---

## Overview

This phase transforms raw log data in Elasticsearch into actionable insights through Kibana visualizations and dashboards. You'll create:

1. **Index Patterns** - Connect Kibana to Elasticsearch indexes
2. **Discover View** - Explore and search logs
3. **Visualizations** - Charts, graphs, and metrics
4. **Dashboards** - Comprehensive monitoring views
5. **Saved Searches** - Pre-configured queries for common scenarios
6. **Alerts** (optional) - Automated notifications for critical events

**End Result**: Real-time dashboards showing API performance, error rates, business metrics, and system health.

---

## Prerequisites Check

Before starting, verify:
- [ ] Phase 3 completed (log-java-service running)
- [ ] Logs flowing into Elasticsearch indexes
- [ ] Kibana accessible: http://localhost:5601
- [ ] At least 100+ logs in Elasticsearch (for meaningful visualizations)
- [ ] Elasticsearch indexes exist: `logs-api`, `logs-error`, `logs-business`

**Generate Sample Logs** (if needed):
```bash
# Generate API logs
for i in {1..50}; do
  curl http://localhost:3100/api/v1/todos
  sleep 0.5
done
```

---

## Kibana Navigation Overview

**Main Sections**:
- **Discover**: Search and explore logs
- **Visualize**: Create charts and graphs
- **Dashboard**: Combine visualizations
- **Stack Management**: Configure index patterns, settings

**Access Kibana**: Open http://localhost:5601 in your browser

---

## Step-by-Step Implementation

### Step 1: Create Index Patterns

**Duration**: 10 minutes

**What are Index Patterns?**
Index patterns tell Kibana which Elasticsearch indexes to query and which field to use as the time filter.

**Steps**:

1. **Open Kibana**: http://localhost:5601

2. **Navigate to Stack Management**:
   - Click hamburger menu (☰) → "Stack Management"
   - Or direct URL: http://localhost:5601/app/management

3. **Go to Index Patterns**:
   - Under "Kibana" section → "Index Patterns"
   - Or direct URL: http://localhost:5601/app/management/kibana/indexPatterns

4. **Create API Logs Index Pattern**:
   - Click "Create index pattern"
   - **Index pattern name**: `logs-api*`
   - Click "Next step"
   - **Time field**: Select `timestamp`
   - Click "Create index pattern"

5. **Create Error Logs Index Pattern**:
   - Click "Create index pattern" again
   - **Index pattern name**: `logs-error*`
   - **Time field**: `timestamp`
   - Click "Create index pattern"

6. **Create Business Logs Index Pattern**:
   - **Index pattern name**: `logs-business*`
   - **Time field**: `timestamp`
   - Click "Create index pattern"

**Why Use Wildcards (`*`)?**
- Supports time-based indexes (e.g., `logs-api-2025.01`, `logs-api-2025.02`)
- Future-proof for index rotation
- Standard Elasticsearch best practice

**Verify Index Patterns**:
- You should see 3 index patterns listed
- Each should show field count (e.g., "15 fields")

---

### Step 2: Explore Logs in Discover

**Duration**: 15 minutes

**What is Discover?**
The Discover view lets you search, filter, and explore your log data in real-time.

**Steps**:

1. **Open Discover**:
   - Click hamburger menu → "Discover"
   - Or URL: http://localhost:5601/app/discover

2. **Select Index Pattern**:
   - Top-left dropdown → Select `logs-api*`

3. **Adjust Time Range**:
   - Top-right calendar icon → "Last 24 hours"
   - Or "Last 7 days" if you have older data

4. **Explore Available Fields**:
   - Left sidebar shows all fields: `service`, `method`, `path`, `statusCode`, etc.
   - Click on a field to see top values and statistics

5. **Add Columns to View**:
   - Hover over fields in left sidebar
   - Click "+" icon to add to table
   - Recommended columns:
     - `timestamp`
     - `service`
     - `method`
     - `path`
     - `statusCode`
     - `responseTime`

6. **Try Sample Searches**:

   **Search for Errors (HTTP 500)**:
   ```
   statusCode: 500
   ```

   **Search for Specific Endpoint**:
   ```
   path: "/api/v1/todos"
   ```

   **Search for Slow Requests (>1000ms)**:
   ```
   responseTime > 1000
   ```

   **Search for GET Requests**:
   ```
   method: "GET"
   ```

   **Complex Query (Errors on Specific Endpoint)**:
   ```
   statusCode: 500 AND path: "/api/v1/todos"
   ```

7. **Save a Search**:
   - Click "Save" (top-right)
   - Name: "API Errors (5xx)"
   - Description: "All API requests with status 500-599"
   - Click "Save"

**Useful Saved Searches to Create**:
- "Recent API Errors (5xx)"
- "Slow Requests (>1s)"
- "Failed Authentication Attempts"
- "Recent Business Events"

---

### Step 3: Create Visualizations

**Duration**: 45 minutes

Visualizations transform data into charts and graphs.

#### Visualization 1: Request Volume Over Time (Line Chart)

**Purpose**: Show API request rate over time

**Steps**:
1. Navigate to "Visualize" → "Create visualization"
2. Select "Lens" (modern visualization editor)
3. Select index pattern: `logs-api*`
4. **Vertical axis**:
   - Drag "Count" to vertical axis
   - Label: "Request Count"
5. **Horizontal axis**:
   - Drag `timestamp` to horizontal axis
   - Interval: "Auto"
6. **Chart type**: Line
7. **Time range**: Last 24 hours
8. **Save**:
   - Name: "API Request Volume"
   - Description: "Total API requests over time"

**Expected Result**: Line chart showing request count per time interval

---

#### Visualization 2: Status Code Distribution (Pie Chart)

**Purpose**: Show breakdown of HTTP status codes (200, 404, 500, etc.)

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Slice by**: Drag `statusCode` to breakdown
3. **Size**: Count
4. **Chart type**: Pie
5. **Top values**: 10
6. **Save**: "HTTP Status Code Distribution"

**Expected Result**: Pie chart with colors for each status code

---

#### Visualization 3: Average Response Time (Metric)

**Purpose**: Single number showing average API response time

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Metric**:
   - Drag `responseTime` to metric
   - Aggregation: Average
   - Format: Duration (milliseconds)
3. **Chart type**: Metric
4. **Save**: "Average Response Time"

**Expected Result**: Large number showing average response time (e.g., "125ms")

---

#### Visualization 4: Top Endpoints by Request Count (Bar Chart)

**Purpose**: Which endpoints receive the most traffic?

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Vertical axis**: Count
3. **Horizontal axis**:
   - `path.keyword` (use keyword for exact match)
   - Order by: Metric (descending)
   - Size: 10
4. **Chart type**: Bar (horizontal)
5. **Save**: "Top Endpoints by Request Count"

**Expected Result**: Horizontal bar chart ranking endpoints

---

#### Visualization 5: Error Rate Over Time (Area Chart)

**Purpose**: Visualize error trends

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Vertical axis**: Count
3. **Horizontal axis**: `timestamp`
4. **Filter**: Add filter
   - Field: `statusCode`
   - Operator: "is between"
   - Value: 500 to 599
5. **Chart type**: Area
6. **Save**: "Error Rate (5xx) Over Time"

---

#### Visualization 6: Slowest Endpoints (Table)

**Purpose**: Identify performance bottlenecks

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Rows**:
   - `path.keyword`
   - Top values: 10
3. **Metrics**:
   - Average `responseTime` (label: "Avg Response Time")
   - Count (label: "Request Count")
   - Max `responseTime` (label: "Max Response Time")
4. **Sort**: By Average Response Time (descending)
5. **Chart type**: Table
6. **Save**: "Slowest Endpoints"

---

#### Visualization 7: Requests by Service (Donut Chart)

**Purpose**: Show which services generate the most logs

**Steps**:
1. Create visualization → Lens → `logs-api*`
2. **Slice by**: `service.keyword`
3. **Size**: Count
4. **Chart type**: Donut
5. **Save**: "Requests by Service"

---

#### Visualization 8: Error Count (Metric with Color Threshold)

**Purpose**: Show total errors with color-coded warning levels

**Steps**:
1. Create visualization → Lens → `logs-error*` (error index!)
2. **Metric**: Count
3. **Chart type**: Metric
4. **Color**:
   - Click "Advanced" → "Color"
   - 0-10: Green
   - 11-50: Yellow
   - 51+: Red
5. **Save**: "Total Errors"

---

#### Visualization 9: Business Events Timeline (Vertical Bar)

**Purpose**: Show business event frequency

**Steps**:
1. Create visualization → Lens → `logs-business*`
2. **Vertical axis**: Count
3. **Horizontal axis**: `timestamp`
4. **Break down by**: `action.keyword`
5. **Chart type**: Bar (stacked)
6. **Save**: "Business Events Timeline"

---

#### Visualization 10: Geographic Distribution (Map)

**Purpose**: Show requests by location (if geo-IP is enabled)

**Note**: Requires geo-IP enrichment (advanced). Skip for now, implement in Phase 5.

---

### Step 4: Create Main Dashboard

**Duration**: 30 minutes

**What is a Dashboard?**
A dashboard combines multiple visualizations into a single monitoring view.

**Steps**:

1. **Navigate to Dashboard**:
   - Hamburger menu → "Dashboard"
   - Click "Create dashboard"

2. **Add Visualizations**:
   - Click "Add from library"
   - Select visualizations you created:
     - API Request Volume (line chart)
     - HTTP Status Code Distribution (pie)
     - Average Response Time (metric)
     - Total Errors (metric)
     - Top Endpoints by Request Count (bar)
     - Error Rate Over Time (area)
   - Click "Add"

3. **Arrange Layout**:
   - Drag visualizations to arrange
   - Resize by dragging corners
   - **Suggested Layout**:
     ```
     ┌─────────────────────┬─────────────────┐
     │ Average Response    │ Total Errors    │
     │ Time (metric)       │ (metric)        │
     ├─────────────────────┴─────────────────┤
     │ API Request Volume (line chart)       │
     │                                       │
     ├─────────────────────┬─────────────────┤
     │ Status Code         │ Top Endpoints   │
     │ Distribution (pie)  │ (bar chart)     │
     ├─────────────────────┴─────────────────┤
     │ Error Rate Over Time (area chart)     │
     │                                       │
     └───────────────────────────────────────┘
     ```

4. **Configure Time Range**:
   - Top-right → Set to "Last 24 hours"
   - Enable "Auto-refresh": Every 30 seconds

5. **Add Filters** (optional):
   - Click "Add filter"
   - Example: Filter by specific service
   - Field: `service.keyword`
   - Value: `todo-nodejs-service`

6. **Save Dashboard**:
   - Click "Save" (top-right)
   - Name: "API Monitoring Dashboard"
   - Description: "Real-time API performance and error monitoring"
   - Tags: "api", "monitoring"
   - Click "Save"

**Dashboard Features**:
- **Interactive**: Click on chart elements to drill down
- **Time range**: Adjust for historical analysis
- **Filters**: Add temporary filters
- **Export**: Share as PDF or PNG
- **Embed**: Embed in other tools

---

### Step 5: Create Additional Dashboards

**Duration**: 20 minutes

#### Dashboard 2: Error Analysis Dashboard

**Visualizations**:
- Total Errors (metric)
- Errors by Error Type (pie chart)
- Error Trend (line chart)
- Recent Errors (table)

**Index Pattern**: `logs-error*`

**Steps**:
1. Create new dashboard
2. Create visualization: "Errors by Type"
   - Pie chart
   - Slice by: `errorType.keyword`
3. Create visualization: "Recent Errors"
   - Table
   - Columns: `timestamp`, `service`, `errorType`, `message`
   - Sort by timestamp (descending)
4. Add existing: "Total Errors", "Error Rate Over Time"
5. Save: "Error Analysis Dashboard"

---

#### Dashboard 3: Business Metrics Dashboard

**Visualizations**:
- Business Events Count (metric)
- Events by Action (bar chart)
- Events by Entity (pie chart)
- Recent Business Events (table)

**Index Pattern**: `logs-business*`

**Steps**:
1. Create new dashboard
2. Create visualization: "Events by Action"
   - Bar chart
   - Breakdown by: `action.keyword`
3. Create visualization: "Events by Entity"
   - Pie chart
   - Slice by: `entity.keyword`
4. Create visualization: "Recent Business Events"
   - Table
   - Columns: `timestamp`, `action`, `entity`, `userId`
5. Save: "Business Metrics Dashboard"

---

### Step 6: Set Up Saved Queries and Filters

**Duration**: 10 minutes

**Saved Queries** allow you to quickly apply common searches across visualizations.

**Create Saved Queries**:

1. **Navigate to Discover**
2. **Create Query: "Production Errors"**:
   - Search: `environment: "production" AND level: "error"`
   - Save query: Name "Production Errors"

3. **Create Query: "Slow API Requests"**:
   - Search: `responseTime > 1000`
   - Save query: Name "Slow API Requests"

4. **Create Query: "Failed Authentication"**:
   - Index: `logs-security*`
   - Search: `action: "auth.failed"`
   - Save query: Name "Failed Auth Attempts"

**Use Saved Queries in Dashboards**:
- In any dashboard → Click "Add filter" → "Saved queries"
- Select a saved query to apply it

---

### Step 7: Configure Auto-Refresh and Alerts

**Duration**: 15 minutes

#### Enable Auto-Refresh

**Steps**:
1. Open any dashboard
2. Top-right → Click refresh icon
3. Select refresh interval: "30 seconds" or "1 minute"
4. Enable auto-refresh toggle

**Use Case**: Real-time monitoring on large screens

---

#### Create Alerts (Optional - Requires X-Pack Basic)

**Note**: Kibana alerting requires Elasticsearch X-Pack (free Basic tier).

**Example Alert: High Error Rate**

**Steps**:
1. Navigate to "Stack Management" → "Alerts and Insights" → "Rules and Connectors"
2. Click "Create rule"
3. Select rule type: "Elasticsearch query"
4. **Rule details**:
   - Name: "High Error Rate Alert"
   - Check every: 1 minute
   - Notify: When error count > 10
5. **Query**:
   - Index: `logs-error*`
   - Query: `*`
   - Time window: Last 5 minutes
   - Threshold: Count > 10
6. **Actions**:
   - Email (requires SMTP setup)
   - Slack (requires webhook)
   - Webhook (generic HTTP)
7. Save

**Common Alerts to Create**:
- High error rate (>10 errors/min)
- Slow response time (avg >2s)
- Service down (no logs in 5 min)
- Failed authentication spike (>5 failures/min)

---

## Dashboard Best Practices

### Design Principles

1. **Most Important Metrics on Top**: Place critical metrics (errors, response time) at the top

2. **Use Color Strategically**:
   - Green: Good (low errors, fast response)
   - Yellow: Warning (moderate errors)
   - Red: Critical (high errors, slow response)

3. **Limit Visualizations**: 6-8 per dashboard (avoid clutter)

4. **Consistent Time Ranges**: Use same time range across all panels

5. **Include Context**: Add markdown panels with explanations

6. **Group Related Metrics**: Keep related visualizations together

---

### Performance Optimization

**For Large Datasets**:
- Use sampling for high-cardinality fields
- Limit table rows to 10-20
- Use aggregations instead of raw data
- Set appropriate time ranges (don't query years of data)

**Refresh Strategy**:
- Development: Auto-refresh every 30s
- Production: Auto-refresh every 1-5 minutes
- Historical analysis: Disable auto-refresh

---

## Example Dashboard Layouts

### Layout 1: Executive Summary

```
┌────────────┬────────────┬────────────┬────────────┐
│ Total      │ Avg Resp   │ Error      │ Uptime     │
│ Requests   │ Time       │ Rate       │            │
│ (metric)   │ (metric)   │ (metric)   │ (metric)   │
├────────────┴────────────┴────────────┴────────────┤
│ Request Volume Over Time (line chart)             │
│                                                    │
├────────────────────────┬───────────────────────────┤
│ Status Code Dist       │ Top Endpoints             │
│ (donut)                │ (bar)                     │
└────────────────────────┴───────────────────────────┘
```

---

### Layout 2: Technical Deep-Dive

```
┌──────────────────────────────────────────────────┐
│ Request Timeline (line with multiple series)     │
│                                                   │
├────────────────────┬─────────────────────────────┤
│ Response Time      │ Error Details               │
│ Distribution       │ (table)                     │
│ (heatmap)          │                             │
├────────────────────┼─────────────────────────────┤
│ Slowest Endpoints  │ Most Common Errors          │
│ (table)            │ (pie)                       │
└────────────────────┴─────────────────────────────┘
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Index patterns created for all log types
- [ ] Can search and filter logs in Discover
- [ ] At least 5 visualizations created
- [ ] Main API Monitoring Dashboard created
- [ ] Dashboard auto-refresh enabled
- [ ] Saved searches created
- [ ] Time range filters work correctly
- [ ] Drill-down works (click chart → filter applied)
- [ ] Dashboard loads in <3 seconds
- [ ] All visualizations show data (no empty charts)

---

## Common Kibana Queries (KQL Examples)

**Kibana Query Language (KQL)**:

```kql
# Exact match
service: "todo-nodejs-service"

# Wildcard
path: "/api/v1/*"

# Range
responseTime > 1000 AND responseTime < 5000

# Multiple values (OR)
statusCode: (404 OR 500 OR 503)

# AND condition
method: "POST" AND statusCode: 500

# NOT condition
NOT statusCode: 200

# Exists check
errorCode: *

# Date range
timestamp >= "2025-01-01" AND timestamp < "2025-02-01"

# Nested field
metadata.userId: "user-123"

# Regex (use Lucene syntax)
path: /api\/v[0-9]\/todos/
```

---

## Troubleshooting

### Issue: "No results found"

**Causes**:
- Time range too narrow
- Index pattern mismatch
- No data in Elasticsearch

**Solutions**:
1. Expand time range to "Last 7 days"
2. Verify data exists: `curl http://localhost:9200/logs-api/_count`
3. Check index pattern matches index name

---

### Issue: Visualization shows "No data"

**Causes**:
- Incorrect field name
- No data matches filters
- Field not mapped correctly

**Solutions**:
1. Check field exists in index pattern
2. Remove all filters and re-add one by one
3. Verify field mapping: Index Pattern → Fields tab

---

### Issue: Dashboard is slow to load

**Causes**:
- Too many visualizations
- Large time range
- Complex aggregations

**Solutions**:
1. Reduce number of panels (max 8)
2. Shorten time range to "Last 24 hours"
3. Use sampling for high-cardinality fields
4. Increase Elasticsearch heap size

---

### Issue: "Index pattern does not match any indices"

**Solution**:
```bash
# Check if index exists
curl http://localhost:9200/_cat/indices?v

# If missing, ensure logs are flowing
# Check Java service logs
```

---

## Export and Backup

**Export Dashboard**:
1. Open dashboard
2. Click "Share" → "Export"
3. Save as JSON file

**Import Dashboard**:
1. "Stack Management" → "Saved Objects"
2. Click "Import"
3. Upload JSON file

**Backup All Kibana Objects**:
1. "Stack Management" → "Saved Objects"
2. Select all → "Export"
3. Save JSON file to `docs/kibana-exports/`

---

## Next Steps

After Phase 4:

1. **Phase 5**: Production enhancements (DLQ, monitoring, security)
2. Add more services to logging system
3. Create service-specific dashboards
4. Implement log retention policies
5. Set up production alerts

---

## Success Criteria

Phase 4 is complete when:

- ✅ Index patterns created for all log types
- ✅ Discover view configured and usable
- ✅ At least 8 visualizations created
- ✅ Main API Monitoring Dashboard operational
- ✅ Error Analysis Dashboard created
- ✅ Business Metrics Dashboard created
- ✅ Auto-refresh enabled on dashboards
- ✅ Saved searches created
- ✅ Dashboard loads quickly (<3 seconds)
- ✅ All visualizations display data correctly
- ✅ Team can use dashboards for monitoring

**Estimated Completion Time**: 2-3 hours

---

## Learning Outcomes

After Phase 4, you'll understand:

- ✅ Kibana index patterns and field mappings
- ✅ KQL (Kibana Query Language) syntax
- ✅ Creating visualizations (charts, tables, metrics)
- ✅ Dashboard design and layout
- ✅ Time-series analysis
- ✅ Aggregations and metrics
- ✅ Real-time monitoring patterns
- ✅ Alerting strategies (if implemented)

---

## References

- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Kibana Query Language (KQL)](https://www.elastic.co/guide/en/kibana/current/kuery-query.html)
- [Kibana Visualizations](https://www.elastic.co/guide/en/kibana/current/dashboard.html)
- [Kibana Alerting](https://www.elastic.co/guide/en/kibana/current/alerting-getting-started.html)
