-- Migration 011: Add atomic constructor columns to projects
-- The atomic constructor (app/dashboard/project-constructor) is a parallel
-- 3-stage flow alongside the classic 7-step create-project flow. Its backend
-- (app/api/atomic-constructor/send-to-manager/route.ts) and its manager-polling
-- hook (hooks/project-constructor/useManagerPolling.ts) read/write these fields,
-- but the columns were never added — every insert/select silently errored.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS constructor_type         text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_stage             integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_scenario          text DEFAULT 'none';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_step_configs      jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_manual_data       jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_uploaded_files    jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_request_id        text UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS atomic_moderation_status text DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS steps                    jsonb;

CREATE INDEX IF NOT EXISTS idx_projects_atomic_request_id ON projects (atomic_request_id);
CREATE INDEX IF NOT EXISTS idx_projects_constructor_type  ON projects (constructor_type);
