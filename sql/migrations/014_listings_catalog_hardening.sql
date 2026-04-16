-- 014_listings_catalog_hardening.sql
-- Hardening после ревью «Каталога Объявлений»:
--   1. UNIQUE partial index на chat_rooms(listing_id, user_id) — защита от race-дублей
--      листинг-комнат (C1 из review). Семантика: user_id == supplier_user_id (инициатор).
--   2. CHECK на chat_rooms.room_type — добавляет 'listing' как валидный тип.
--   3. CHECK на chat_participants.role — whitelist под 'author'/'supplier' (C1/C2).
--   4. Performance index на listings для быстрого каталога по категории (H4).
-- Идемпотентная (IF NOT EXISTS / DROP IF EXISTS).

BEGIN;

-- 1. UNIQUE partial index: одна активная листинг-комната на пару (listing, supplier).
-- Защищает от гонки в POST /api/listings/[id]/contact на уровне БД.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_chat_rooms_listing_supplier
  ON chat_rooms (listing_id, user_id)
  WHERE listing_id IS NOT NULL AND is_active = true;

-- 2. chat_rooms.room_type whitelist (ранее было text без CHECK).
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_room_type_chk;
ALTER TABLE chat_rooms
  ADD CONSTRAINT chat_rooms_room_type_chk
  CHECK (room_type IN ('ai', 'project', 'listing'));

-- 3. chat_participants.role whitelist.
ALTER TABLE chat_participants DROP CONSTRAINT IF EXISTS chat_participants_role_chk;
ALTER TABLE chat_participants
  ADD CONSTRAINT chat_participants_role_chk
  CHECK (role IN ('owner', 'participant', 'member', 'manager', 'ai', 'author', 'supplier'));

-- 4. Perf index для каталога объявлений: фильтр по категории + сортировка по created_at.
-- Работает только для status='open' (основной hot path /dashboard/listings).
CREATE INDEX IF NOT EXISTS idx_listings_category_status_created
  ON listings (category_id, created_at DESC)
  WHERE status = 'open';

COMMIT;
