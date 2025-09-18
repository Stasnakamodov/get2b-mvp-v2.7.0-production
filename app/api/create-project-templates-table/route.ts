import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function POST() {
  try {
    console.log('🔧 Создаем таблицу project_templates...')
    
    // SQL для создания таблицы
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.project_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL DEFAULT '{}',
        role TEXT DEFAULT 'client' CHECK (role IN ('client', 'supplier')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    // Создаем таблицу
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (createError) {
      console.error('❌ Ошибка создания таблицы:', createError)
      return NextResponse.json({
        error: 'Ошибка создания таблицы',
        details: createError.message
      }, { status: 500 })
    }
    
    // Создаем индексы
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_project_templates_user_id ON public.project_templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_project_templates_created_at ON public.project_templates(created_at DESC);
    `
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
    
    if (indexError) {
      console.error('❌ Ошибка создания индексов:', indexError)
      return NextResponse.json({
        error: 'Ошибка создания индексов',
        details: indexError.message
      }, { status: 500 })
    }
    
    // Включаем RLS
    const enableRLSSQL = `ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;`
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })
    
    if (rlsError) {
      console.error('❌ Ошибка включения RLS:', rlsError)
      return NextResponse.json({
        error: 'Ошибка включения RLS',
        details: rlsError.message
      }, { status: 500 })
    }
    
    // Создаем политики RLS
    const createPoliciesSQL = `
      DROP POLICY IF EXISTS "Users can view their own templates" ON public.project_templates;
      DROP POLICY IF EXISTS "Users can insert their own templates" ON public.project_templates;
      DROP POLICY IF EXISTS "Users can update their own templates" ON public.project_templates;
      DROP POLICY IF EXISTS "Users can delete their own templates" ON public.project_templates;
      
      CREATE POLICY "Users can view their own templates" ON public.project_templates
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own templates" ON public.project_templates
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own templates" ON public.project_templates
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own templates" ON public.project_templates
        FOR DELETE USING (auth.uid() = user_id);
    `
    
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL })
    
    if (policyError) {
      console.error('❌ Ошибка создания политик:', policyError)
      return NextResponse.json({
        error: 'Ошибка создания политик RLS',
        details: policyError.message
      }, { status: 500 })
    }
    
    console.log('✅ Таблица project_templates создана успешно')
    
    return NextResponse.json({
      success: true,
      message: 'Таблица project_templates создана успешно'
    })
    
  } catch (error: any) {
    console.error('❌ Неожиданная ошибка:', error)
    return NextResponse.json({
      error: 'Неожиданная ошибка',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
} 