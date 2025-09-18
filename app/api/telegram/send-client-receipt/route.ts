import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API] Отправка чека клиента с кнопками')
    
    const { documentUrl, caption, projectRequestId } = await request.json()
    
    console.log('📤 [API] Получены данные:', {
      documentUrl: documentUrl?.substring(0, 100) + '...',
      caption: caption?.substring(0, 100) + '...',
      projectRequestId
    })
    
    if (!documentUrl || !caption || !projectRequestId) {
      return NextResponse.json({ 
        error: 'Document URL, caption and projectRequestId are required' 
      }, { status: 400 })
    }
    
    // Извлекаем путь к файлу из URL Supabase
    const urlParts = documentUrl.split('/')
    const bucketName = urlParts[urlParts.length - 3] // step7-client-confirmations
    const filePath = urlParts.slice(-2).join('/') // userId/filename
    
    console.log('🔍 [API] Извлеченные данные из URL:', {
      bucketName,
      filePath,
      originalUrl: documentUrl
    })
    
    // Скачиваем файл с Supabase Storage через admin client
    console.log('⬇️ [API] Скачиваем файл с Supabase Storage...')
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(bucketName)
      .download(filePath)
    
    if (downloadError) {
      console.error('❌ [API] Ошибка скачивания файла:', downloadError)
      throw new Error(`Ошибка скачивания файла: ${downloadError.message}`)
    }
    
    if (!fileData) {
      throw new Error('Файл не найден в Supabase Storage')
    }
    
    const fileName = filePath.split('/').pop() || 'client-receipt.pdf'
    
    console.log('📄 [API] Файл скачан:', {
      fileName,
      size: fileData.size,
      type: fileData.type
    })
    
    // Создаем FormData для отправки файла
    const formData = new FormData()
    formData.append('chat_id', process.env.TELEGRAM_CHAT_ID || '')
    formData.append('document', fileData, fileName)
    formData.append('caption', caption)
    formData.append('reply_markup', JSON.stringify({
      inline_keyboard: [
        [
          { text: "✅ Одобрить чек клиента", callback_data: `approve_client_receipt_${projectRequestId}` },
          { text: "❌ Отклонить чек клиента", callback_data: `reject_client_receipt_${projectRequestId}` },
        ],
      ],
    }))
    
    console.log('📤 [API] Отправляем файл в Telegram...')
    const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    })
    
    const telegramResult = await telegramResponse.json()
    
    if (!telegramResponse.ok) {
      console.error('❌ [API] Telegram API ошибка:', telegramResult)
      throw new Error(`Telegram API error: ${telegramResult.description || telegramResponse.statusText}`)
    }
    
    console.log('✅ [API] Файл отправлен в Telegram успешно:', telegramResult)
    
    return NextResponse.json({
      success: true,
      message: 'Чек клиента с кнопками отправлен успешно',
      result: telegramResult
    })
    
  } catch (error) {
    console.error('❌ [API] Ошибка отправки чека клиента:', error)
    return NextResponse.json({
      error: 'Ошибка отправки чека клиента',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 