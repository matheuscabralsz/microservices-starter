-- Connect to todos database
\c todos

-- Create events table for event sourcing
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    user_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_version ON events(aggregate_id, version);

-- Unique constraint to prevent duplicate events
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_id_unique ON events(event_id);

-- Comments
COMMENT ON TABLE events IS 'Event store for event sourcing pattern';
COMMENT ON COLUMN events.event_id IS 'Unique event identifier (UUID)';
COMMENT ON COLUMN events.aggregate_id IS 'Todo ID (aggregate root)';
COMMENT ON COLUMN events.version IS 'Event version for optimistic locking';
