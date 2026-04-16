-- 013_create_listings.sql
-- Каталог объявлений: клиенты публикуют заявки на покупку, поставщики связываются через ЧатХаб.
-- Идемпотентная миграция (IF NOT EXISTS / DROP IF EXISTS).

BEGIN;

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_client_profile_id uuid REFERENCES client_profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 10 AND 150),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 2000),
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  category_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL,
  deadline_date date,
  is_urgent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'expired')),
  expires_at timestamptz NOT NULL,
  views_count integer NOT NULL DEFAULT 0,
  contacts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listings_expires_max_60_days CHECK (expires_at <= created_at + interval '60 days')
);

CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_category_status
  ON listings (category_id, status);

CREATE INDEX IF NOT EXISTS idx_listings_author
  ON listings (author_id);

CREATE INDEX IF NOT EXISTS idx_listings_urgent_status
  ON listings (is_urgent, status);

CREATE INDEX IF NOT EXISTS idx_listings_expires_open
  ON listings (expires_at)
  WHERE status = 'open';

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_rooms_listing
  ON chat_rooms (listing_id)
  WHERE listing_id IS NOT NULL;

ALTER TABLE project_specifications
  ADD COLUMN IF NOT EXISTS source_listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_specs_source_listing
  ON project_specifications (source_listing_id)
  WHERE source_listing_id IS NOT NULL;

COMMIT;
