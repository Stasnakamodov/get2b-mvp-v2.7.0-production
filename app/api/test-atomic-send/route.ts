import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🧪 [TEST] Получены данные:', {
      hasStepConfigs: !!body.stepConfigs,
      hasManualData: !!body.manualData,
      hasUploadedFiles: !!body.uploadedFiles,
      hasUser: !!body.user,
      currentStage: body.currentStage,
      activeScenario: body.activeScenario,
      stepConfigsKeys: Object.keys(body.stepConfigs || {}),
      manualDataKeys: Object.keys(body.manualData || {}),
      userEmail: body.user?.email
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Тестовый запрос успешен',
      receivedData: {
        stepConfigsCount: Object.keys(body.stepConfigs || {}).length,
        manualDataCount: Object.keys(body.manualData || {}).length,
        currentStage: body.currentStage,
        activeScenario: body.activeScenario
      }
    })

  } catch (error) {
    console.error('❌ [TEST] Ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка тестового запроса: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    )
  }
} 