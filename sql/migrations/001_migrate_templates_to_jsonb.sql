-- Миграция project_templates: плоские колонки → JSONB data
-- Запустить на VPS перед деплоем, если колонки company_name, etc. существуют

-- Шаг 1: Проверить есть ли колонки (если нет — скрипт пропустит UPDATE)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_templates' AND column_name = 'company_name'
  ) THEN
    -- Мигрировать данные из плоских колонок в JSONB
    UPDATE project_templates
    SET data = jsonb_build_object(
      'company', jsonb_build_object(
        'name', COALESCE(company_name, ''),
        'legalName', COALESCE(company_legal, ''),
        'inn', COALESCE(company_inn, ''),
        'kpp', COALESCE(company_kpp, ''),
        'ogrn', COALESCE(company_ogrn, ''),
        'address', COALESCE(company_address, ''),
        'bankName', COALESCE(company_bank, ''),
        'bankAccount', COALESCE(company_account, ''),
        'bankCorrAccount', COALESCE(company_corr, ''),
        'bankBik', COALESCE(company_bik, ''),
        'email', COALESCE(company_email, ''),
        'phone', COALESCE(company_phone, ''),
        'website', COALESCE(company_website, '')
      ),
      'specification', COALESCE(specification, '[]'::jsonb)
    )
    WHERE data = '{}'::jsonb OR data IS NULL;

    -- Удалить лишние колонки
    ALTER TABLE project_templates
      DROP COLUMN IF EXISTS company_name,
      DROP COLUMN IF EXISTS company_legal,
      DROP COLUMN IF EXISTS company_inn,
      DROP COLUMN IF EXISTS company_kpp,
      DROP COLUMN IF EXISTS company_ogrn,
      DROP COLUMN IF EXISTS company_address,
      DROP COLUMN IF EXISTS company_bank,
      DROP COLUMN IF EXISTS company_account,
      DROP COLUMN IF EXISTS company_corr,
      DROP COLUMN IF EXISTS company_bik,
      DROP COLUMN IF EXISTS company_email,
      DROP COLUMN IF EXISTS company_phone,
      DROP COLUMN IF EXISTS company_website,
      DROP COLUMN IF EXISTS specification;

    RAISE NOTICE 'project_templates: данные мигрированы в JSONB, лишние колонки удалены';
  ELSE
    RAISE NOTICE 'project_templates: плоских колонок нет, миграция не нужна';
  END IF;
END $$;
