import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID сценария обязателен' },
        { status: 400 }
      )
    }

    // Дельты удаляются каскадно через ON DELETE CASCADE
    const { error } = await db
      .from('project_scenario_nodes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления сценария:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Ошибка API delete scenario:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
