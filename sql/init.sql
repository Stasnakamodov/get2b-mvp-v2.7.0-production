-- =====================================================
-- CONSOLIDATED init.sql FOR LOCAL POSTGRESQL
-- Replaces hosted Supabase: all tables, indexes,
-- functions, triggers, seed data.
-- Generated from: supabase.types.ts, API routes,
-- migrations-v2-safe/*, migrations/*
-- =====================================================

-- =========================
-- 0. EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. USERS TABLE (replaces Supabase auth.users)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text DEFAULT 'user',
  email_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================
-- 2. CORE TABLES (from supabase.types.ts)
-- =========================

-- 2a. Client profiles
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  legal_name text,
  inn text,
  kpp text,
  ogrn text,
  legal_address text,
  bank_name text,
  bank_account text,
  corr_account text,
  bik text,
  email text,
  phone text,
  website text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2b. Supplier profiles
CREATE TABLE IF NOT EXISTS supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  city text,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  website text,
  contact_person text,
  min_order text,
  response_time text,
  employees text,
  established text,
  certifications jsonb,
  specialties jsonb,
  payment_methods jsonb,
  -- Bank transfer details
  recipient_name text,
  recipient_address text,
  bank_name text,
  bank_address text,
  account_number text,
  swift text,
  iban text,
  cnaps_code text,
  transfer_currency text DEFAULT 'USD',
  payment_purpose text,
  other_details text,
  -- P2P details
  p2p_bank text,
  p2p_card_number text,
  p2p_holder_name text,
  p2p_expiry_date text,
  -- Crypto details
  crypto_name text,
  crypto_address text,
  crypto_network text,
  -- Russian requisites
  inn text,
  kpp text,
  ogrn text,
  legal_address text,
  actual_address text,
  -- Flags
  is_default boolean DEFAULT false,
  user_notes text,
  user_rating numeric,
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2c. Catalog user suppliers
CREATE TABLE IF NOT EXISTS catalog_user_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  city text,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  website text,
  contact_person text,
  min_order text,
  response_time text,
  employees text,
  established text,
  certifications jsonb,
  specialties jsonb,
  payment_methods jsonb,
  source_type text DEFAULT 'manual',
  source_supplier_id uuid,
  import_date timestamptz,
  total_projects integer DEFAULT 0,
  successful_projects integer DEFAULT 0,
  cancelled_projects integer DEFAULT 0,
  last_project_date timestamptz,
  total_spent numeric DEFAULT 0,
  user_notes text,
  user_rating numeric,
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2d. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft',
  current_step integer DEFAULT 1,
  max_step_reached integer DEFAULT 1,
  company_data jsonb,
  amount numeric,
  currency text,
  payment_method text,
  specification_id uuid,
  initiator_role text DEFAULT 'client',
  start_method text DEFAULT 'manual',
  email text,
  receipts text,
  supplier_data jsonb,
  supplier_id text,
  supplier_type text,
  company_card_file text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================
-- 3. TABLES FROM API ROUTE CODE
-- =========================

-- 3a. User profiles (linking table)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type text NOT NULL CHECK (profile_type IN ('client', 'supplier')),
  profile_id uuid NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_type ON user_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_primary ON user_profiles(is_primary);

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- 3b. Project templates
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}',
  role text DEFAULT 'client' CHECK (role IN ('client', 'supplier')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_templates_user_id ON project_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_created_at ON project_templates(created_at DESC);

-- =========================
-- 4. TABLES INFERRED FROM CODE USAGE
-- =========================

-- 4a. Project status history
CREATE TABLE IF NOT EXISTS project_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL,
  previous_status text,
  step integer,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES users(id),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_status_history_project ON project_status_history(project_id);

-- 4b. Project specifications (line items in a spec)
CREATE TABLE IF NOT EXISTS project_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  role text DEFAULT 'client',
  item_name text NOT NULL,
  item_code text,
  image_url text,
  quantity numeric DEFAULT 0,
  unit text,
  price numeric DEFAULT 0,
  total numeric DEFAULT 0,
  supplier_name text,
  category_name text,
  subcategory_name text,
  catalog_product_id uuid,
  catalog_product_source text CHECK (catalog_product_source IN ('verified', 'user')),
  currency text DEFAULT 'RUB',
  description text DEFAULT '',
  supplier_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_specifications_project ON project_specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_specifications_category ON project_specifications(category_name);
CREATE INDEX IF NOT EXISTS idx_project_specifications_subcategory ON project_specifications(subcategory_name);
CREATE INDEX IF NOT EXISTS idx_project_specifications_catalog_product ON project_specifications(catalog_product_id);

-- 4c. Project requisites (payment details per project)
CREATE TABLE IF NOT EXISTS project_requisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  type text DEFAULT 'bank',
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_requisites_project ON project_requisites(project_id);

-- 4d. Project product history
CREATE TABLE IF NOT EXISTS project_product_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  product_name text,
  supplier_name text,
  category text,
  unit_price numeric,
  total_value numeric,
  quantity numeric,
  currency text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_product_history_user ON project_product_history(user_id);

-- 4e. Specifications (legacy/standalone)
CREATE TABLE IF NOT EXISTS specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  name text,
  data jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4f. Profiles (legacy simple profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  company text,
  role text DEFAULT 'user',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4g. Chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  room_type text NOT NULL DEFAULT 'ai',
  ai_context text DEFAULT 'general',
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  description text,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_user ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_project ON chat_rooms(project_id);

-- 4h. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  content text,
  sender_type text NOT NULL DEFAULT 'user',
  sender_name text,
  sender_user_id uuid REFERENCES users(id),
  sender_manager_id uuid,
  message_type text DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- 4i. Chat participants
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  role text DEFAULT 'member',
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);

-- 4j. Chat rooms temp (used by create-tables test route)
CREATE TABLE IF NOT EXISTS chat_rooms_temp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  room_type text DEFAULT 'ai',
  name text,
  ai_context text DEFAULT 'general',
  description text,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4k. Chat messages temp
CREATE TABLE IF NOT EXISTS chat_messages_temp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms_temp(id) ON DELETE CASCADE,
  sender_type text DEFAULT 'user',
  sender_user_id text,
  sender_name text,
  content text,
  message_type text DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4l. Manager assignments
CREATE TABLE IF NOT EXISTS manager_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES users(id),
  assignment_status text DEFAULT 'active',
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_assignments_project ON manager_assignments(project_id);

-- 4m. Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text,
  email text,
  phone text,
  company text,
  message text,
  source text DEFAULT 'website',
  utm_params jsonb,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 4n. Constructor drafts
CREATE TABLE IF NOT EXISTS constructor_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  is_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_constructor_drafts_user ON constructor_drafts(user_id);

-- 4o. Supplier usage patterns (analytics/recommendations)
CREATE TABLE IF NOT EXISTS supplier_usage_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid,
  supplier_name text,
  category text,
  country text,
  total_orders integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  avg_delivery_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4p. Suppliers (legacy table used by older supplier hooks)
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  category text,
  country text,
  city text,
  description text,
  email text,
  phone text,
  website text,
  contact_person text,
  status text DEFAULT 'active',
  rating numeric DEFAULT 0,
  total_products integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================
-- 5. CATALOG BASE TABLES (from migrations-v2-safe)
-- =========================

-- 5a. Catalog categories
CREATE TABLE IF NOT EXISTS catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(50) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  icon varchar(10),
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  has_subcategories boolean DEFAULT false,
  -- Extended columns (from 100_extend_catalog_categories)
  parent_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL,
  level integer DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  full_path text,
  products_count integer DEFAULT 0,
  suppliers_count integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_slug ON catalog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_key ON catalog_categories(key);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON catalog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_cat_parent ON catalog_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cat_level ON catalog_categories(level);
CREATE INDEX IF NOT EXISTS idx_cat_popular ON catalog_categories(is_popular) WHERE is_popular = true;

-- 5b. Catalog subcategories (legacy compat)
CREATE TABLE IF NOT EXISTS catalog_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  key varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, key)
);

-- 5c. Enums for catalog
DO $$ BEGIN
  CREATE TYPE supplier_source_enum AS ENUM ('client_added', 'get2b_accredited');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE accreditation_status_enum AS ENUM ('not_accredited', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5d. Catalog suppliers (generic, with accreditation)
CREATE TABLE IF NOT EXISTS catalog_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  contact_info jsonb,
  category_id uuid REFERENCES catalog_categories(id),
  is_active boolean DEFAULT true,
  accreditation_status accreditation_status_enum DEFAULT 'not_accredited',
  supplier_source supplier_source_enum DEFAULT 'client_added',
  supplier_snapshot jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_country ON catalog_suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON catalog_suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_accreditation ON catalog_suppliers(accreditation_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON catalog_suppliers(is_active);

-- 5e. Catalog verified suppliers (orange room / accredited)
CREATE TABLE IF NOT EXISTS catalog_verified_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text NOT NULL,
  category text,
  country text,
  city text,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  website text,
  contact_person text,
  min_order text,
  specialization text,
  is_verified boolean DEFAULT true,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  rating numeric DEFAULT 0,
  public_rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  projects_count integer DEFAULT 0,
  completed_projects integer DEFAULT 0,
  verified_by uuid REFERENCES users(id),
  payment_methods jsonb,
  bank_accounts jsonb,
  p2p_cards jsonb,
  crypto_wallets jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_suppliers_active ON catalog_verified_suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_verified_suppliers_category ON catalog_verified_suppliers(category);
CREATE INDEX IF NOT EXISTS idx_verified_suppliers_country ON catalog_verified_suppliers(country);
CREATE INDEX IF NOT EXISTS idx_verified_suppliers_featured ON catalog_verified_suppliers(is_featured) WHERE is_featured = true;

-- 5f. Catalog products (generic, linked to catalog_suppliers)
CREATE TABLE IF NOT EXISTS catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES catalog_categories(id),
  subcategory_id uuid REFERENCES catalog_subcategories(id),
  supplier_id uuid REFERENCES catalog_suppliers(id),
  price numeric(10, 2),
  unit text,
  specifications jsonb,
  images text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON catalog_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON catalog_products(subcategory_id);

-- 5g. Catalog verified products (orange room products)
CREATE TABLE IF NOT EXISTS catalog_verified_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES catalog_verified_suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  subcategory_id uuid REFERENCES catalog_subcategories(id),
  sku text,
  price numeric,
  currency text DEFAULT 'RUB',
  min_order text,
  in_stock boolean DEFAULT true,
  specifications jsonb DEFAULT '{}',
  images jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  has_variants boolean DEFAULT false,
  name_normalized text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_verified_products
  ADD CONSTRAINT uq_product_sku UNIQUE (sku);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_product_name_supplier
  ON catalog_verified_products (name, supplier_id);

CREATE INDEX IF NOT EXISTS idx_verified_products_active_category
  ON catalog_verified_products (category, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_verified_products_active_in_stock
  ON catalog_verified_products (in_stock, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_verified_products_active_price
  ON catalog_verified_products (price, is_active) WHERE is_active = true;

-- 5h. Catalog user products (blue room products)
CREATE TABLE IF NOT EXISTS catalog_user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES catalog_user_suppliers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  category text,
  subcategory_id uuid REFERENCES catalog_subcategories(id),
  sku text,
  price numeric,
  currency text DEFAULT 'RUB',
  min_order text,
  in_stock boolean DEFAULT true,
  specifications jsonb DEFAULT '{}',
  images jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_products_supplier ON catalog_user_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_user_products_user ON catalog_user_products(user_id);

-- =========================
-- 6. CATALOG EXTENSION TABLES (from migrations)
-- =========================

-- 6a. Supplier proforma templates
CREATE TABLE IF NOT EXISTS supplier_proforma_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  supplier_type text NOT NULL CHECK (supplier_type IN ('verified', 'user')),
  template_name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size integer,
  original_filename text,
  filling_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  version integer DEFAULT 1,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  CONSTRAINT unique_default_template UNIQUE (supplier_id, supplier_type, is_default)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_proforma_templates_supplier ON supplier_proforma_templates(supplier_id, supplier_type);
CREATE INDEX IF NOT EXISTS idx_proforma_templates_active ON supplier_proforma_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_proforma_templates_default ON supplier_proforma_templates(is_default) WHERE is_default = true;

-- 6b. Catalog image registry
CREATE TABLE IF NOT EXISTS catalog_image_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash text NOT NULL,
  normalized_url text NOT NULL,
  product_id uuid NOT NULL REFERENCES catalog_verified_products(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_image_url_hash UNIQUE (url_hash)
);

CREATE INDEX IF NOT EXISTS idx_image_registry_product ON catalog_image_registry(product_id);
CREATE INDEX IF NOT EXISTS idx_image_registry_hash ON catalog_image_registry(url_hash);

-- 6c. Catalog carts
CREATE TABLE IF NOT EXISTS catalog_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS catalog_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES catalog_carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  product_table text NOT NULL DEFAULT 'catalog_verified_products',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_id uuid,
  added_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_product
  ON catalog_cart_items (cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_catalog_carts_user_id ON catalog_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_cart_items_cart_id ON catalog_cart_items(cart_id);

-- 6d. Catalog collections
CREATE TABLE IF NOT EXISTS catalog_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  rules jsonb NOT NULL DEFAULT '{}',
  rule_type text NOT NULL DEFAULT 'auto',
  sort_field text DEFAULT 'created_at',
  sort_order text DEFAULT 'desc',
  max_products integer DEFAULT 50,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6e. Catalog product variants
CREATE TABLE IF NOT EXISTS catalog_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES catalog_verified_products(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}',
  price numeric,
  currency text DEFAULT 'RUB',
  in_stock boolean DEFAULT true,
  stock_quantity integer,
  images text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON catalog_product_variants(product_id) WHERE is_active = true;

-- 6f. Supplier inquiries
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

-- 6g. Scenario mode tables
CREATE TABLE IF NOT EXISTS project_scenario_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  parent_node_id uuid REFERENCES project_scenario_nodes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid,
  creator_role text CHECK (creator_role IN ('client', 'manager', 'supplier')),
  branched_at_step integer CHECK (branched_at_step BETWEEN 1 AND 7),
  tree_depth integer NOT NULL DEFAULT 1 CHECK (tree_depth >= 1 AND tree_depth <= 3),
  tree_path text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'selected', 'archived')),
  frozen_at timestamptz,
  selected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS project_scenario_deltas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_node_id uuid NOT NULL REFERENCES project_scenario_nodes(id) ON DELETE CASCADE,
  step_number integer NOT NULL CHECK (step_number BETWEEN 1 AND 7),
  step_config text,
  manual_data jsonb DEFAULT '{}',
  uploaded_files jsonb DEFAULT '[]',
  changed_by uuid,
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scenario_node_id, step_number)
);

CREATE TABLE IF NOT EXISTS scenario_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_node_id uuid REFERENCES project_scenario_nodes(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('scenario_created', 'scenario_selected', 'scenario_frozen', 'scenario_updated', 'scenario_deleted')),
  recipient_user_id uuid,
  recipient_role text CHECK (recipient_role IN ('client', 'manager', 'supplier')),
  telegram_message_id text,
  telegram_sent_at timestamptz,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_plan_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id uuid,
  parent_node_id uuid REFERENCES business_plan_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid,
  creator_role text CHECK (creator_role IN ('client', 'manager', 'supplier')),
  tree_depth integer NOT NULL DEFAULT 1 CHECK (tree_depth >= 1 AND tree_depth <= 3),
  tree_path text[] NOT NULL DEFAULT '{}',
  config_data jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'selected', 'archived')),
  frozen_at timestamptz,
  selected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add scenario columns to projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'active_scenario_id') THEN
    ALTER TABLE projects ADD COLUMN active_scenario_id uuid REFERENCES project_scenario_nodes(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'scenario_mode_enabled') THEN
    ALTER TABLE projects ADD COLUMN scenario_mode_enabled boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scenario_nodes_project ON project_scenario_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_nodes_parent ON project_scenario_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_scenario_nodes_status ON project_scenario_nodes(status);
CREATE INDEX IF NOT EXISTS idx_scenario_nodes_tree_path ON project_scenario_nodes USING GIN(tree_path);
CREATE INDEX IF NOT EXISTS idx_scenario_deltas_node ON project_scenario_deltas(scenario_node_id);
CREATE INDEX IF NOT EXISTS idx_scenario_deltas_step ON project_scenario_deltas(step_number);
CREATE INDEX IF NOT EXISTS idx_scenario_notifications_project ON scenario_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_notifications_recipient ON scenario_notifications(recipient_user_id);

-- 6h. Supplier profiles category_id extension
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_category_id
  ON supplier_profiles(category_id);

-- 6i. Payment requisite template tables (used by Step5)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  country text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank text,
  card_number text,
  holder_name text,
  expiry_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  address text,
  network text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6j. Project invoices (used by useProjectInvoices hook)
CREATE TABLE IF NOT EXISTS project_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  role text DEFAULT 'client',
  file_url text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cards_user ON supplier_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user ON crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_user ON project_invoices(user_id);

-- =========================
-- 7. TRIGGERS
-- =========================

-- 7a. Category full_path auto-update
CREATE OR REPLACE FUNCTION update_category_full_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.full_path := NEW.name;
    NEW.level := 0;
  ELSE
    SELECT
      parent.full_path || ' / ' || NEW.name,
      parent.level + 1
    INTO
      NEW.full_path,
      NEW.level
    FROM catalog_categories parent
    WHERE parent.id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_full_path ON catalog_categories;
CREATE TRIGGER trigger_update_category_full_path
  BEFORE INSERT OR UPDATE OF name, parent_id ON catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_full_path();

-- 7b. Category products_count auto-update
CREATE OR REPLACE FUNCTION update_category_products_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE catalog_categories
    SET products_count = (
      SELECT COUNT(*) FROM catalog_products WHERE category_id = OLD.category_id
    )
    WHERE id = OLD.category_id;
  END IF;
  IF NEW.category_id IS NOT NULL THEN
    UPDATE catalog_categories
    SET products_count = (
      SELECT COUNT(*) FROM catalog_products WHERE category_id = NEW.category_id
    )
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_count ON catalog_products;
CREATE TRIGGER trigger_update_products_count
  AFTER INSERT OR UPDATE OF category_id OR DELETE ON catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_category_products_count();

-- 7c. Category suppliers_count auto-update
CREATE OR REPLACE FUNCTION update_category_suppliers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE catalog_categories
    SET suppliers_count = (
      SELECT COUNT(*) FROM catalog_suppliers WHERE category_id = OLD.category_id
    )
    WHERE id = OLD.category_id;
  END IF;
  IF NEW.category_id IS NOT NULL THEN
    UPDATE catalog_categories
    SET suppliers_count = (
      SELECT COUNT(*) FROM catalog_suppliers WHERE category_id = NEW.category_id
    )
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_suppliers_count ON catalog_suppliers;
CREATE TRIGGER trigger_update_suppliers_count
  AFTER INSERT OR UPDATE OF category_id OR DELETE ON catalog_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_category_suppliers_count();

-- 7d. has_subcategories auto-update
CREATE OR REPLACE FUNCTION update_has_subcategories()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE catalog_categories SET has_subcategories = true WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_has_subcategories ON catalog_categories;
CREATE TRIGGER trigger_update_has_subcategories
  AFTER INSERT ON catalog_categories
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_has_subcategories();

-- 7e. Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_verified_products_updated_at ON catalog_verified_products;
CREATE TRIGGER trg_update_verified_products_updated_at
  BEFORE UPDATE ON catalog_verified_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7f. Product name normalization
CREATE OR REPLACE FUNCTION fn_normalize_product_name() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LEFT(NEW.name, 60),
        '[^\w\s]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_product_name ON catalog_verified_products;
CREATE TRIGGER trg_normalize_product_name
  BEFORE INSERT OR UPDATE OF name ON catalog_verified_products
  FOR EACH ROW EXECUTE FUNCTION fn_normalize_product_name();

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_name_normalized_global
  ON catalog_verified_products(name_normalized)
  WHERE name_normalized IS NOT NULL
    AND LENGTH(name_normalized) > 5
    AND is_active = true;

-- 7g. Product variants has_variants trigger
CREATE OR REPLACE FUNCTION update_has_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE catalog_verified_products
    SET has_variants = EXISTS (
      SELECT 1 FROM catalog_product_variants
      WHERE product_id = NEW.product_id AND is_active = true
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE catalog_verified_products
    SET has_variants = EXISTS (
      SELECT 1 FROM catalog_product_variants
      WHERE product_id = OLD.product_id AND is_active = true
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_has_variants ON catalog_product_variants;
CREATE TRIGGER trg_update_has_variants
  AFTER INSERT OR UPDATE OR DELETE ON catalog_product_variants
  FOR EACH ROW EXECUTE FUNCTION update_has_variants();

-- 7h. Proforma template default uniqueness
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE supplier_proforma_templates
    SET is_default = false
    WHERE supplier_id = NEW.supplier_id
      AND supplier_type = NEW.supplier_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_template_trigger ON supplier_proforma_templates;
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON supplier_proforma_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- 7i. Scenario updated_at
CREATE OR REPLACE FUNCTION update_scenario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_scenario_nodes_updated ON project_scenario_nodes;
CREATE TRIGGER tr_scenario_nodes_updated
  BEFORE UPDATE ON project_scenario_nodes
  FOR EACH ROW EXECUTE FUNCTION update_scenario_updated_at();

DROP TRIGGER IF EXISTS tr_scenario_deltas_updated ON project_scenario_deltas;
CREATE TRIGGER tr_scenario_deltas_updated
  BEFORE UPDATE ON project_scenario_deltas
  FOR EACH ROW EXECUTE FUNCTION update_scenario_updated_at();

-- 7j. Auto-fill category from catalog for project_specifications
CREATE OR REPLACE FUNCTION auto_fill_category_from_catalog()
RETURNS TRIGGER AS $$
DECLARE
  v_category text;
  v_subcategory text;
BEGIN
  IF NEW.catalog_product_id IS NOT NULL AND NEW.catalog_product_source IS NOT NULL THEN
    IF NEW.catalog_product_source = 'verified' THEN
      SELECT cp.category, sub.name
      INTO v_category, v_subcategory
      FROM catalog_verified_products cp
      LEFT JOIN catalog_subcategories sub ON cp.subcategory_id = sub.id
      WHERE cp.id = NEW.catalog_product_id;
    ELSIF NEW.catalog_product_source = 'user' THEN
      SELECT cp.category, sub.name
      INTO v_category, v_subcategory
      FROM catalog_user_products cp
      LEFT JOIN catalog_subcategories sub ON cp.subcategory_id = sub.id
      WHERE cp.id = NEW.catalog_product_id;
    END IF;

    IF v_category IS NOT NULL THEN
      NEW.category_name := v_category;
    END IF;
    IF v_subcategory IS NOT NULL THEN
      NEW.subcategory_name := v_subcategory;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_fill_category_trigger ON project_specifications;
CREATE TRIGGER auto_fill_category_trigger
  BEFORE INSERT OR UPDATE ON project_specifications
  FOR EACH ROW EXECUTE FUNCTION auto_fill_category_from_catalog();

-- =========================
-- 8. RPC FUNCTIONS
-- =========================

-- 8a. Category tree
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id uuid,
  parent_id uuid,
  name text,
  slug text,
  icon text,
  level integer,
  full_path text,
  products_count integer,
  suppliers_count integer,
  is_popular boolean,
  path uuid[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT
      c.id, c.parent_id, c.name, c.slug, c.icon, c.level,
      c.full_path, c.products_count, c.suppliers_count,
      c.is_popular, ARRAY[c.id] as path
    FROM catalog_categories c
    WHERE c.parent_id IS NULL AND c.is_active = true
    UNION ALL
    SELECT
      c.id, c.parent_id, c.name, c.slug, c.icon, c.level,
      c.full_path, c.products_count, c.suppliers_count,
      c.is_popular, ct.path || c.id
    FROM catalog_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
  )
  SELECT * FROM category_tree ORDER BY path;
END;
$$ LANGUAGE plpgsql;

-- 8b. Auto-categorize product by name/description
CREATE OR REPLACE FUNCTION auto_categorize_product(product_name text, product_description text)
RETURNS uuid AS $$
DECLARE
  category_id_result uuid;
  search_text text;
BEGIN
  search_text := LOWER(COALESCE(product_name, '') || ' ' || COALESCE(product_description, ''));
  IF search_text ~ '.*(телефон|смартфон|планшет|ноутбук|компьютер|зарядн|наушник|электрон|гаджет).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'electronics'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(авто|машин|масло|шин|двигател|транспорт).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'automotive'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(вода|сок|чай|кофе|снек|шоколад|печень|напит|продукт|еда|пищ).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'food'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(посуд|тарелк|чашк|моющ|чист|быт|хоз|дом).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'home'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(медицин|витамин|маск|перчатк|косметик|крем|шампун|здоров|аптек).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'healthcare'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(одежд|футболк|рубашк|брюк|текстил|ткан|носк|платье).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'textiles'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(строит|цемент|кирпич|инструмент|краск|клей|ремонт).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'construction'; RETURN category_id_result;
  END IF;
  IF search_text ~ '.*(оборудован|станок|упаковк|промышл|завод).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'industrial'; RETURN category_id_result;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8c. Get products by category (unified RPC)
CREATE OR REPLACE FUNCTION get_products_by_category(
  category_name TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH verified_products AS (
    SELECT
      p.id, p.name AS product_name, p.name AS item_name,
      p.id::TEXT AS item_code, p.description, p.category,
      p.price::TEXT AS price, p.currency, p.min_order::TEXT AS min_order,
      p.in_stock, p.specifications, p.images,
      COALESCE(p.images->>0, '') AS image_url,
      s.id AS supplier_id, s.name AS supplier_name,
      s.company_name AS supplier_company_name,
      s.category AS supplier_category, s.country AS supplier_country,
      s.city AS supplier_city, s.contact_email AS supplier_email,
      s.contact_phone AS supplier_phone, s.website AS supplier_website,
      COALESCE(s.rating, 0) AS supplier_rating,
      COALESCE(s.reviews_count, 0) AS supplier_reviews,
      COALESCE(s.projects_count, 0) AS supplier_projects,
      'verified' AS room_type, '' AS room_icon,
      'Аккредитованный поставщик Get2B' AS room_description
    FROM catalog_verified_products p
    INNER JOIN catalog_verified_suppliers s ON p.supplier_id = s.id
    LEFT JOIN catalog_subcategories sub ON p.subcategory_id = sub.id
    WHERE p.is_active = TRUE AND s.is_active = TRUE
      AND (category_name IS NULL OR p.category = category_name OR sub.name = category_name)
      AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.description ILIKE '%' || search_query || '%')
  ),
  user_products AS (
    SELECT
      p.id, p.name AS product_name, p.name AS item_name,
      p.id::TEXT AS item_code, p.description, p.category,
      p.price::TEXT AS price, p.currency, p.min_order::TEXT AS min_order,
      p.in_stock, p.specifications, p.images,
      COALESCE(p.images->>0, '') AS image_url,
      s.id AS supplier_id, s.name AS supplier_name,
      s.company_name AS supplier_company_name,
      s.category AS supplier_category, s.country AS supplier_country,
      s.city AS supplier_city, s.contact_email AS supplier_email,
      s.contact_phone AS supplier_phone, s.website AS supplier_website,
      COALESCE(s.user_rating, 0) AS supplier_rating,
      0 AS supplier_reviews,
      COALESCE(s.total_projects, 0) AS supplier_projects,
      'user' AS room_type, '' AS room_icon,
      'Личный поставщик' AS room_description
    FROM catalog_user_products p
    INNER JOIN catalog_user_suppliers s ON p.supplier_id = s.id
    LEFT JOIN catalog_subcategories sub ON p.subcategory_id = sub.id
    WHERE p.is_active = TRUE AND s.is_active = TRUE
      AND (user_id_param IS NULL OR p.user_id = user_id_param)
      AND (category_name IS NULL OR p.category = category_name OR sub.name = category_name)
      AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.description ILIKE '%' || search_query || '%')
  ),
  all_products AS (
    SELECT * FROM verified_products
    UNION ALL
    SELECT * FROM user_products
  )
  SELECT COALESCE(
    jsonb_agg(to_jsonb(p.*) ORDER BY p.product_name),
    '[]'::JSONB
  ) INTO result
  FROM (
    SELECT * FROM all_products ORDER BY product_name LIMIT limit_param OFFSET offset_param
  ) p;
  RETURN result;
END;
$$;

-- 8d. Get product facets (with subcategory support)
CREATE OR REPLACE FUNCTION get_product_facets(
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_supplier_country TEXT DEFAULT NULL,
  p_supplier_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
  v_search TEXT;
BEGIN
  v_search := regexp_replace(COALESCE(p_search, ''), '[%_\\''";()]', ' ', 'g');
  v_search := trim(v_search);
  IF v_search = '' THEN v_search := NULL; END IF;

  SELECT jsonb_build_object(
    'categories',
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', t.category, 'count', t.cnt) ORDER BY t.cnt DESC), '[]'::jsonb)
     FROM (
       SELECT p.category, count(*) as cnt
       FROM catalog_verified_products p
       LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true
         AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
         AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY p.category
     ) t),
    'subcategories',
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.subcategory_id, 'count', t.cnt) ORDER BY t.cnt DESC), '[]'::jsonb)
     FROM (
       SELECT p.subcategory_id, count(*) as cnt
       FROM catalog_verified_products p
       LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true AND p.subcategory_id IS NOT NULL
         AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
         AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
         AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY p.subcategory_id
     ) t),
    'countries',
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', t.country, 'count', t.cnt) ORDER BY t.cnt DESC), '[]'::jsonb)
     FROM (
       SELECT s.country, count(*) as cnt
       FROM catalog_verified_products p
       JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true AND s.country IS NOT NULL
         AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
         AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
         AND (p_subcategory IS NULL OR p_subcategory = '' OR p.subcategory_id = p_subcategory::uuid)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY s.country
     ) t),
    'stock',
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('in_stock', t.in_stock, 'count', t.cnt)), '[]'::jsonb)
     FROM (
       SELECT p.in_stock, count(*) as cnt
       FROM catalog_verified_products p
       LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true
         AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
         AND (p_subcategory IS NULL OR p_subcategory = '' OR p.subcategory_id = p_subcategory::uuid)
         AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY p.in_stock
     ) t),
    'priceRange',
    (SELECT jsonb_build_object('min_price', COALESCE(min(p.price), 0), 'max_price', COALESCE(max(p.price), 0))
     FROM catalog_verified_products p
     LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = true AND p.price IS NOT NULL
       AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
       AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
       AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
       AND (p_subcategory IS NULL OR p_subcategory = '' OR p.subcategory_id = p_subcategory::uuid)
       AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
       AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)),
    'totalCount',
    (SELECT count(*)
     FROM catalog_verified_products p
     LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = true
       AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%' OR p.description ILIKE '%' || v_search || '%')
       AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
       AND (p_min_price IS NULL OR p.price >= p_min_price)
       AND (p_max_price IS NULL OR p.price <= p_max_price)
       AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
       AND (p_subcategory IS NULL OR p_subcategory = '' OR p.subcategory_id = p_subcategory::uuid)
       AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
       AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid))
  ) INTO result;
  RETURN result;
END;
$$;

-- 8e. Get cart with products
CREATE OR REPLACE FUNCTION get_cart_with_products(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_cart_id UUID;
BEGIN
  SELECT id INTO v_cart_id FROM catalog_carts WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object('cart_id', NULL, 'items', '[]'::jsonb);
  END IF;
  SELECT jsonb_build_object(
    'cart_id', v_cart_id,
    'items', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', ci.id, 'product_id', ci.product_id,
          'quantity', ci.quantity, 'variant_id', ci.variant_id,
          'added_at', ci.added_at,
          'product', jsonb_build_object(
            'id', p.id, 'name', p.name, 'description', p.description,
            'category', p.category, 'sku', p.sku, 'price', p.price,
            'currency', p.currency, 'min_order', p.min_order,
            'in_stock', p.in_stock, 'images', p.images,
            'specifications', p.specifications, 'supplier_id', p.supplier_id,
            'supplier_name', s.name, 'supplier_country', s.country,
            'is_featured', p.is_featured,
            'created_at', p.created_at, 'updated_at', p.updated_at
          )
        )
        ORDER BY ci.added_at DESC
      )
      FROM catalog_cart_items ci
      LEFT JOIN catalog_verified_products p ON p.id = ci.product_id
      LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
      WHERE ci.cart_id = v_cart_id),
      '[]'::jsonb
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- 8f. Supplier template helpers
CREATE OR REPLACE FUNCTION get_supplier_template(
  p_supplier_id uuid,
  p_supplier_type text
)
RETURNS supplier_proforma_templates AS $$
DECLARE
  v_template supplier_proforma_templates;
BEGIN
  SELECT * INTO v_template
  FROM supplier_proforma_templates
  WHERE supplier_id = p_supplier_id
    AND supplier_type = p_supplier_type
    AND is_active = true AND is_default = true
  LIMIT 1;
  IF v_template IS NULL THEN
    SELECT * INTO v_template
    FROM supplier_proforma_templates
    WHERE supplier_id = p_supplier_id
      AND supplier_type = p_supplier_type
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  END IF;
  RETURN v_template;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE supplier_proforma_templates
  SET usage_count = usage_count + 1, last_used_at = now()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- 8g. Scenario branch creation
CREATE OR REPLACE FUNCTION create_scenario_branch(
  p_project_id uuid,
  p_parent_node_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL,
  p_creator_role text DEFAULT 'client',
  p_branched_at_step integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_parent_depth integer;
  v_parent_path text[];
  v_new_id uuid;
BEGIN
  IF p_parent_node_id IS NOT NULL THEN
    SELECT tree_depth, tree_path INTO v_parent_depth, v_parent_path
    FROM project_scenario_nodes
    WHERE id = p_parent_node_id AND project_id = p_project_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Parent scenario node not found'; END IF;
    IF v_parent_depth >= 3 THEN RAISE EXCEPTION 'Maximum tree depth (3) exceeded'; END IF;
  ELSE
    v_parent_depth := 0;
    v_parent_path := '{}';
  END IF;
  INSERT INTO project_scenario_nodes (
    project_id, parent_node_id, name, description,
    created_by, creator_role, branched_at_step,
    tree_depth, tree_path, status
  ) VALUES (
    p_project_id, p_parent_node_id, p_name, p_description,
    p_created_by, p_creator_role, p_branched_at_step,
    v_parent_depth + 1,
    CASE WHEN p_parent_node_id IS NOT NULL THEN v_parent_path || p_parent_node_id::text ELSE '{}' END,
    'active'
  ) RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- 8h. Resolve scenario steps (merge ancestry)
CREATE OR REPLACE FUNCTION get_scenario_resolved_steps(p_scenario_node_id uuid)
RETURNS TABLE (
  step_number integer,
  step_config text,
  manual_data jsonb,
  uploaded_files jsonb,
  source_node_id uuid,
  source_depth integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestry AS (
    SELECT n.id, n.parent_node_id, n.tree_depth
    FROM project_scenario_nodes n WHERE n.id = p_scenario_node_id
    UNION ALL
    SELECT n.id, n.parent_node_id, n.tree_depth
    FROM project_scenario_nodes n
    INNER JOIN ancestry a ON a.parent_node_id = n.id
  ),
  all_deltas AS (
    SELECT d.step_number, d.step_config, d.manual_data, d.uploaded_files,
           a.id AS source_node_id, a.tree_depth AS source_depth
    FROM ancestry a
    INNER JOIN project_scenario_deltas d ON d.scenario_node_id = a.id
  )
  SELECT DISTINCT ON (ad.step_number)
    ad.step_number, ad.step_config, ad.manual_data, ad.uploaded_files,
    ad.source_node_id, ad.source_depth
  FROM all_deltas ad
  ORDER BY ad.step_number, ad.source_depth DESC;
END;
$$ LANGUAGE plpgsql;

-- 8i. Freeze other scenarios
CREATE OR REPLACE FUNCTION freeze_other_scenarios(
  p_project_id uuid,
  p_selected_node_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE project_scenario_nodes
  SET status = 'frozen', frozen_at = now()
  WHERE project_id = p_project_id AND id != p_selected_node_id AND status = 'active';
  UPDATE project_scenario_nodes
  SET status = 'selected', selected_at = now()
  WHERE id = p_selected_node_id AND project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- 8j. Count products by category name (batch)
CREATE OR REPLACE FUNCTION count_products_by_category_name(category_names TEXT[])
RETURNS TABLE (category_name TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT p.category AS category_name, count(*) AS count
  FROM catalog_verified_products p
  WHERE p.is_active = true AND p.category = ANY(category_names)
  GROUP BY p.category;
$$;

-- 8k. Count products by subcategory (batch)
CREATE OR REPLACE FUNCTION count_products_by_subcategory(subcategory_ids UUID[])
RETURNS TABLE (subcategory_id UUID, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT p.subcategory_id, count(*) AS count
  FROM catalog_verified_products p
  WHERE p.is_active = true AND p.subcategory_id = ANY(subcategory_ids)
  GROUP BY p.subcategory_id;
$$;

-- =========================
-- 9. SEED DATA
-- =========================

-- 9a. Base 8 B2B categories
INSERT INTO catalog_categories (key, name, icon, description, sort_order, slug, level, full_path) VALUES
('electronics', 'Электроника', '📱', 'Электронные устройства и гаджеты', 1, 'electronics', 0, 'Электроника'),
('automotive', 'Автотовары', '🚗', 'Автозапчасти и автохимия', 2, 'automotive', 0, 'Автотовары'),
('industrial', 'Промышленность', '⚙️', 'Промышленное оборудование', 3, 'industrial', 0, 'Промышленность'),
('healthcare', 'Здоровье и медицина', '🏥', 'Медицинские товары и оборудование', 4, 'healthcare', 0, 'Здоровье и медицина'),
('textiles', 'Текстиль и одежда', '👕', 'Текстильная продукция и одежда', 5, 'textiles', 0, 'Текстиль и одежда'),
('construction', 'Строительство', '🏗️', 'Строительные материалы и инструменты', 6, 'construction', 0, 'Строительство'),
('food', 'Продукты питания', '🍽️', 'Продукты питания оптом', 7, 'food', 0, 'Продукты питания'),
('home', 'Дом и быт', '🏠', 'Товары для дома и быта', 8, 'home', 0, 'Дом и быт')
ON CONFLICT (key) DO NOTHING;

-- 9b. Subcategories
DO $$
BEGIN
  -- Only seed if subcategories don't already exist
  IF NOT EXISTS (SELECT 1 FROM catalog_categories WHERE level = 1 LIMIT 1) THEN

    -- We need a temp table approach for bulk insert
    CREATE TEMP TABLE IF NOT EXISTS temp_subcategories (
      parent_key text, name text, slug text, icon text, sort_order integer
    );
    TRUNCATE temp_subcategories;

    INSERT INTO temp_subcategories VALUES
    ('electronics', 'Смартфоны и планшеты', 'smartphones-tablets', '📱', 1),
    ('electronics', 'Компьютеры и ноутбуки', 'computers-laptops', '💻', 2),
    ('electronics', 'Аксессуары для гаджетов', 'gadget-accessories', '🔌', 3),
    ('electronics', 'Зарядные устройства', 'chargers', '🔋', 4),
    ('electronics', 'Наушники и колонки', 'audio-devices', '🎧', 5),
    ('automotive', 'Автохимия', 'auto-chemistry', '🧴', 1),
    ('automotive', 'Автоаксессуары', 'auto-accessories', '🚗', 2),
    ('automotive', 'Расходники', 'auto-consumables', '🔧', 3),
    ('automotive', 'Масла и жидкости', 'oils-fluids', '🛢️', 4),
    ('food', 'Напитки', 'beverages', '🥤', 1),
    ('food', 'Снеки и сладости', 'snacks-sweets', '🍫', 2),
    ('food', 'Бакалея', 'grocery', '🌾', 3),
    ('food', 'Консервация', 'canned-food', '🥫', 4),
    ('home', 'Посуда', 'tableware', '🍽️', 1),
    ('home', 'Бытовая химия', 'household-chemicals', '🧼', 2),
    ('home', 'Текстиль для дома', 'home-textiles', '🛏️', 3),
    ('home', 'Хозтовары', 'household-goods', '🧹', 4),
    ('healthcare', 'Медицинские изделия', 'medical-devices', '🏥', 1),
    ('healthcare', 'Косметика и гигиена', 'cosmetics-hygiene', '💄', 2),
    ('healthcare', 'Витамины и БАДы', 'vitamins-supplements', '💊', 3),
    ('healthcare', 'Средства защиты', 'protective-equipment', '😷', 4),
    ('textiles', 'Спецодежда', 'workwear', '👷', 1),
    ('textiles', 'Текстиль оптом', 'textiles-wholesale', '👕', 2),
    ('textiles', 'Домашняя одежда', 'homewear', '🛌', 3),
    ('textiles', 'Аксессуары', 'textile-accessories', '🧢', 4),
    ('construction', 'Строительные материалы', 'building-materials', '🧱', 1),
    ('construction', 'Инструменты', 'tools', '🔨', 2),
    ('construction', 'Электрика', 'electrical', '💡', 3),
    ('construction', 'Сантехника', 'plumbing', '🚰', 4),
    ('industrial', 'Оборудование', 'equipment', '⚙️', 1),
    ('industrial', 'Промышленная химия', 'industrial-chemicals', '⚗️', 2),
    ('industrial', 'Упаковка', 'packaging', '📦', 3),
    ('industrial', 'Расходники', 'industrial-consumables', '🔩', 4);

    INSERT INTO catalog_categories (parent_id, name, key, slug, icon, level, sort_order, is_active)
    SELECT cc.id, ts.name, ts.slug, ts.slug, ts.icon, 1, ts.sort_order, true
    FROM temp_subcategories ts
    INNER JOIN catalog_categories cc ON cc.key = ts.parent_key
    WHERE NOT EXISTS (
      SELECT 1 FROM catalog_categories WHERE key = ts.slug OR slug = ts.slug
    );

    DROP TABLE IF EXISTS temp_subcategories;
  END IF;
END $$;

-- 9c. Seed collections
INSERT INTO catalog_collections (slug, name, description, rules, sort_field, sort_order, max_products, is_active, is_featured, position) VALUES
  ('new-arrivals', 'Новинки', 'Недавно добавленные товары', '{}', 'created_at', 'desc', 50, true, true, 1),
  ('under-5000', 'До 5 000 ₽', 'Товары по выгодной цене', '{"price_max": 5000}', 'price', 'asc', 50, true, true, 2),
  ('in-stock', 'В наличии', 'Товары готовые к отгрузке', '{"in_stock": true}', 'created_at', 'desc', 50, true, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DONE. All tables, indexes, triggers, functions, seeds.
-- =====================================================
