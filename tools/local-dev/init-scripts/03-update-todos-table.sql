-- Connect to todos database
\c todos

-- Add new columns to existing todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- Add index for due_date (for reminder queries in Phase 4)
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date) WHERE due_date IS NOT NULL;

-- Comments
COMMENT ON COLUMN todos.user_id IS 'User who owns this todo (mocked in Phase 1)';
COMMENT ON COLUMN todos.due_date IS 'Optional due date for todo item';
COMMENT ON COLUMN todos.version IS 'Version number for optimistic locking';
