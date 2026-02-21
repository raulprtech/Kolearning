-- Migration: Learning Phases System
-- Adds phase tracking, zettelkasten notes, and dependencies to atoms
-- Adds phase and question formats to sessions

-- Add phase tracking to atoms
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'calibracion';
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS zettelkasten_note TEXT;
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS dependencies TEXT[];

-- Add phase and question formats to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'calibracion';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS question_formats TEXT DEFAULT 'Opción Múltiple';

-- Add phase to learning_path_items
ALTER TABLE learning_path_items ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'calibracion';
ALTER TABLE learning_path_items ADD COLUMN IF NOT EXISTS question_formats TEXT DEFAULT 'Opción Múltiple';
