ALTER TABLE harvested_records 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

UPDATE harvested_records 
SET last_seen_at = last_harvested 
WHERE last_seen_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_harvested_records_source_repository 
  ON harvested_records(source_repository);

CREATE INDEX IF NOT EXISTS idx_harvested_records_last_harvested 
  ON harvested_records(last_harvested DESC);

CREATE INDEX IF NOT EXISTS idx_harvested_records_last_seen_at 
  ON harvested_records(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_harvested_records_repo_status 
  ON harvested_records(source_repository, status);

