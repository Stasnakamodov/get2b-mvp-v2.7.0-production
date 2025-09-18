import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramDocumentClient } from '@/lib/telegram-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Тестируем отправку в Telegram')
    
    const { documentUrl, caption } = await request.json()
    
    console.log('🧪 [TEST] Получены данные:', {
      documentUrl: documentUrl?.substring(0, 100) + '...',
      caption: caption?.substring(0, 100) + '...'
    })
    
    if (!documentUrl) {
      return NextResponse.json({ error: 'Document URL is required' }, { status: 400 })
    }
    
    console.log('🧪 [TEST] Вызываем sendTelegramDocumentClient...')
    const result = await sendTelegramDocumentClient(documentUrl, caption)
    console.log('✅ [TEST] sendTelegramDocumentClient выполнен успешно:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Тестовая отправка в Telegram выполнена успешно',
      result
    })
    
  } catch (error) {
    console.error('❌ [TEST] Ошибка в тестовой отправке:', error)
    return NextResponse.json({
      error: 'Ошибка тестовой отправки',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 