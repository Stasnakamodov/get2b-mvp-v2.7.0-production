import { createClient } from '@supabase/supabase-js'
import { logger } from "@/src/shared/lib/logger";
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    
    // Проверяем существует ли bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      logger.error('❌ Ошибка получения списка buckets:', listError)
      return NextResponse.json({ 
        success: false, 
        error: 'Ошибка получения списка buckets: ' + listError.message 
      }, { status: 500 })
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'step3-supplier-receipts')
    
    if (bucketExists) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bucket step3-supplier-receipts уже существует' 
      })
    }
    
    // Создаем bucket
    const { data, error } = await supabase.storage.createBucket('step3-supplier-receipts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    })
    
    if (error) {
      logger.error('❌ Ошибка создания bucket:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Ошибка создания bucket: ' + error.message 
      }, { status: 500 })
    }
    
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bucket step3-supplier-receipts создан успешно',
      data 
    })
    
  } catch (error: any) {
    logger.error('❌ Неожиданная ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Неожиданная ошибка: ' + error.message 
    }, { status: 500 })
  }
} 