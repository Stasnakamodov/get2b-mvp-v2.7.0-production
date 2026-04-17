-- 015_add_image_url_to_listings.sql
-- Добавляет главное фото (image_url) к листингам закупочной доски.
-- Заполняется вручную (upload через /api/storage/upload) или через «Найти в каталоге по фото»
-- (берётся первый URL из catalog_verified_products.images[]).
-- NULL — картинки нет, в карточке показывается placeholder.
-- Идемпотентна; ALTER ADD COLUMN nullable — без downtime.

BEGIN;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN listings.image_url IS
  'URL главной картинки листинга (абсолютный URL, обычно /api/storage/project-files/listings/images/...). NULL — картинки нет.';

COMMIT;
