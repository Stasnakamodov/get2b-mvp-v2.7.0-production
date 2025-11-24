import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {

    interface TableCheckResults {
      [tableName: string]: {
        exists: boolean;
        error?: string;
        count?: number;
      };
    }

    // Проверяем существование таблиц
    const tables = ['user_profiles', 'client_profiles', 'supplier_profiles']
    const results: TableCheckResults = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = { exists: true, count: data?.length || 0 }
        }
      } catch (err: unknown) {
        results[table] = { exists: false, error: err instanceof Error ? err.message : String(err) }
      }
    }

    // Проверяем структуру user_profiles
    let userProfilesStructure = null
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

      if (!error && data) {
        userProfilesStructure = Object.keys(data[0] || {})
      }
    } catch (err) {
      userProfilesStructure = 'Error getting structure'
    }

    return NextResponse.json({
      success: true,
      tables: results,
      userProfilesStructure,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('[API] Error checking profile tables:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 