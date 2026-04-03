import { pool } from "@/lib/db/pool"
import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/src/shared/lib/logger";
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // SQL для создания таблицы user_profiles
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        profile_type TEXT NOT NULL CHECK (profile_type IN ('client', 'supplier')),
        profile_id UUID NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Уникальный индекс для одного основного профиля каждого типа на пользователя
        UNIQUE(user_id, profile_type, is_primary) WHERE is_primary = true
      );

      -- Индексы для быстрого поиска
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_type ON user_profiles(profile_type);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_is_primary ON user_profiles(is_primary);

      -- Функция для автоматического обновления updated_at
      CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Триггер для автоматического обновления updated_at
      CREATE TRIGGER trigger_update_user_profiles_updated_at
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_user_profiles_updated_at();

      -- RLS политики (auth handled at application layer)
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view own profiles" ON user_profiles;
      CREATE POLICY "Users can view own profiles" ON user_profiles
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can create own profiles" ON user_profiles;
      CREATE POLICY "Users can create own profiles" ON user_profiles
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Users can update own profiles" ON user_profiles;
      CREATE POLICY "Users can update own profiles" ON user_profiles
        FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Users can delete own profiles" ON user_profiles;
      CREATE POLICY "Users can delete own profiles" ON user_profiles
        FOR DELETE USING (true);
    `

    // Выполняем SQL
    try {
      await pool.query(createTableSQL)
    } catch (error: any) {
      logger.error('[API] Error creating table:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Проверяем, что таблица создана
    try {
      await pool.query('SELECT * FROM user_profiles LIMIT 1')
    } catch (checkError: any) {
      return NextResponse.json({
        success: false,
        error: `Table created but still not accessible: ${checkError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'user_profiles table created successfully',
      tableExists: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error('[API] Error creating user_profiles table:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 