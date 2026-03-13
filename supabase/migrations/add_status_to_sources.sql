-- Add 'status' column to the 'sources' table
-- This column tracks the study status of each source in the project flow.
-- Valid values: 'not_started', 'reading', 'processed', 'mastered'

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started';

-- Add a check constraint to ensure valid status values
ALTER TABLE sources
ADD CONSTRAINT sources_status_check
CHECK (status IN ('not_started', 'reading', 'processed', 'mastered'));

-- Comment on the column for documentation
COMMENT ON COLUMN sources.status IS 'Study flow status: not_started, reading, processed, mastered';
