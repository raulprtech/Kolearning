-- Migration 003: Add ordering columns, response time tracking, and update view
-- Adds ordering_items and correct_order to atoms for ordering questions
-- Adds last_response_time_ms for per-atom analytics
-- Updates project_details view with phase information

-- 1. Add ordering and analytics columns to atoms
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS ordering_items TEXT[];
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS correct_order TEXT[];
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;

-- 2. Update project_details view to include phase info from sessions
CREATE OR REPLACE VIEW project_details AS
SELECT 
  p.*,
  COALESCE(atom_count.count, 0) as atom_count,
  COALESCE(session_count.count, 0) as session_count,
  COALESCE(source_count.count, 0) as source_count,
  profiles.name as user_name,
  active_session.phase as current_phase,
  active_session.question_formats as current_question_formats
FROM projects p
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM atoms GROUP BY project_id) atom_count ON p.id = atom_count.project_id  
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM sessions GROUP BY project_id) session_count ON p.id = session_count.project_id
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM sources GROUP BY project_id) source_count ON p.id = source_count.project_id
LEFT JOIN profiles ON p.user_id = profiles.id
LEFT JOIN LATERAL (
  SELECT phase, question_formats FROM sessions 
  WHERE sessions.project_id = p.id AND sessions.status = 'Continue'
  ORDER BY session_number LIMIT 1
) active_session ON true;
