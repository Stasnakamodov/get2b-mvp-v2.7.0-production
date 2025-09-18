import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    const startTime = Date.now()

    // Проверяем подключение к Supabase
    const { data, error } = await supabase.from('projects').select('count').limit(1)

    if (error) {
      console.error('Health check - Database error:', error)
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'error',
          error: error.message
        },
        { status: 503 }
      )
    }

    const responseTime = Date.now() - startTime

    // Проверяем переменные окружения
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'TELEGRAM_BOT_TOKEN'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        supabase: error ? 'error' : 'connected',
        telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing'
      }
    }

    if (missingEnvVars.length > 0) {
      healthData.services = {
        ...healthData.services,
        environment: `missing: ${missingEnvVars.join(', ')}`
      }
    }

    return NextResponse.json(healthData)

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}