import { NextRequest, NextResponse } from 'next/server'
import { ManagerBotService } from '@/lib/telegram/ManagerBotService'

export async function POST(request: NextRequest) {
  try {
    const { projectRequestId, receiptUrl, fileName } = await request.json()

    console.log('📤 [Send Receipt] Отправка чека в Telegram:', {
      projectRequestId,
      receiptUrl,
      fileName
    })

    if (!projectRequestId || !receiptUrl) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      )
    }

    // Отправляем в Telegram с кнопками одобрения
    const managerBot = new ManagerBotService()
    await managerBot.sendReceiptApprovalRequest({
      projectRequestId,
      receiptUrl,
      fileName
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Чек отправлен менеджеру'
    })

  } catch (error) {
    console.error('❌ [Send Receipt] Ошибка отправки чека:', error)
    return NextResponse.json(
      { error: 'Ошибка отправки чека' },
      { status: 500 }
    )
  }
} 