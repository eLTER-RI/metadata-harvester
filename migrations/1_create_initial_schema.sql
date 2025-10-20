-- Up Migration
CREATE TABLE IF NOT EXISTS harvested_records (
  source_url TEXT PRIMARY KEY,
  source_repository TEXT NOT NULL,
  source_checksum TEXT NOT NULL,
  dar_id TEXT UNIQUE,
  dar_checksum TEXT,
  status TEXT,
  last_harvested TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT
);

CREATE TABLE IF NOT EXISTS deims_sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shortname TEXT,
  site_data JSONB NOT NULL,
  checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS record_rules (
  id SERIAL PRIMARY KEY,
  dar_id TEXT NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  target_path TEXT NOT NULL,
  orig_value JSONB,
  new_value JSONB NULL,
  UNIQUE (dar_id, target_path)
);

ALTER TABLE record_rules
ADD CONSTRAINT record_rules_value_check
CHECK (
  orig_value IS NOT NULL OR new_value IS NOT NULL
);

CREATE TABLE IF NOT EXISTS resolved_records (
  id SERIAL PRIMARY KEY,
  dar_id TEXT UNIQUE NOT NULL,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

