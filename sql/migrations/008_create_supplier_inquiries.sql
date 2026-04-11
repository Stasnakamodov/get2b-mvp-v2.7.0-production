-- Create supplier_inquiries table for "Найти поставщика" feature
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS supplier_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES users(id),
  user_email text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_inquiries_status ON supplier_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_supplier_inquiries_created ON supplier_inquiries(created_at DESC);
