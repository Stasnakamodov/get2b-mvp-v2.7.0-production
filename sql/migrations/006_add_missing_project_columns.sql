-- Migration 006: Add missing columns to projects table
-- These columns are used by the create-project flow but were missing from the DB schema

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'initiator_role') THEN
    ALTER TABLE projects ADD COLUMN initiator_role TEXT DEFAULT 'client';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_method') THEN
    ALTER TABLE projects ADD COLUMN start_method TEXT DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'email') THEN
    ALTER TABLE projects ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'receipts') THEN
    ALTER TABLE projects ADD COLUMN receipts TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'supplier_data') THEN
    ALTER TABLE projects ADD COLUMN supplier_data JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'supplier_id') THEN
    ALTER TABLE projects ADD COLUMN supplier_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'supplier_type') THEN
    ALTER TABLE projects ADD COLUMN supplier_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'company_card_file') THEN
    ALTER TABLE projects ADD COLUMN company_card_file TEXT;
  END IF;
END $$;
