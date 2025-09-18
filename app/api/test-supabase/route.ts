import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Простой тест подключения
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection OK',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      sessionExists: !!data.session
    })
    
  } catch (err) {
    console.error('Connection test failed:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
  }
} 