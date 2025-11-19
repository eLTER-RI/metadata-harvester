-- Up Migration
CREATE TABLE IF NOT EXISTS manual_records (
  id SERIAL PRIMARY KEY,
  dar_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  title TEXT
);

CREATE INDEX IF NOT EXISTS idx_manual_records_dar_id ON manual_records(dar_id);
CREATE INDEX IF NOT EXISTS idx_manual_records_created_at ON manual_records(created_at DESC);
