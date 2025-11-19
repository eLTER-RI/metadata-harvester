-- Up Migration
ALTER TABLE harvested_records
ADD COLUMN IF NOT EXISTS site_references JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS habitat_references JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dataset_type JSONB,
ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

