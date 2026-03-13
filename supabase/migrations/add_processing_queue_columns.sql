-- 1. Agregar nuevas columnas
ALTER TABLE sources ADD COLUMN IF NOT EXISTS in_study_box BOOLEAN DEFAULT false;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS bloom_level TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS atom_count INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. ELIMINAR la restricción vieja PRIMERO para que permita el cambio a 'pending'
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_status_check;

-- 3. Migrar datos existentes
UPDATE sources SET status = 'pending' WHERE status = 'not_started';
UPDATE sources SET status = 'processed' WHERE status IN ('reading', 'mastered', 'processed');
-- Fallback para cualquier otro valor legado o nulo
UPDATE sources SET status = 'pending' WHERE status NOT IN ('pending', 'processing', 'processed', 'error') OR status IS NULL;

-- 4. Volver a agregar la restricción actualizada
ALTER TABLE sources ADD CONSTRAINT sources_status_check 
  CHECK (status IN ('pending', 'processing', 'processed', 'error'));
