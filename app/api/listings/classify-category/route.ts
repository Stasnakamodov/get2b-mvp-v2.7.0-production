import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ClassifyInput = z.object({
  title: z.string().min(3).max(300),
  description: z.string().min(0).max(2000).optional(),
})

interface CategoryRow {
  id: string
  name: string
  parent_id: string | null
}

const YANDEX_GPT_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
const TIMEOUT_MS = 20_000

function buildPrompt(title: string, description: string, categories: CategoryRow[]): string {
  const list = categories
    .map((c) => `${c.id} — ${c.name}`)
    .join('\n')
  return `Ты классифицируешь B2B-закупку по каталогу категорий промышленных товаров.

НАЗВАНИЕ: "${title}"
ОПИСАНИЕ: "${description || '—'}"

КАТЕГОРИИ (id — название):
${list}

ЗАДАЧА:
Выбери ОДНУ самую подходящую категорию из списка. Если ни одна не подходит — верни null.

ПРАВИЛА:
1. Ответ СТРОГО валидный JSON без markdown.
2. confidence — число 0..1 (насколько уверен в выборе).
3. Если товар слишком общий или неочевидный — confidence ≤ 0.5.

ФОРМАТ ОТВЕТА:
{"category_id": "<uuid-из-списка-или-null>", "confidence": 0.0-1.0, "reasoning": "короткое объяснение"}

ОТВЕТ (только JSON):`
}

function parseGptJson(text: string): { category_id: string | null; confidence: number; reasoning: string } | null {
  if (!text) return null
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const json = JSON.parse(match[0])
    return {
      category_id: typeof json.category_id === 'string' ? json.category_id : null,
      confidence: Math.max(0, Math.min(1, Number(json.confidence) || 0)),
      reasoning: typeof json.reasoning === 'string' ? json.reasoning : '',
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ClassifyInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { title, description } = parsed.data

    const apiKey = process.env.YANDEX_GPT_API_KEY || process.env.YANDEX_VISION_API_KEY
    const folderId = process.env.YANDEX_FOLDER_ID
    if (!apiKey || !folderId) {
      return NextResponse.json({ success: false, llmUnavailable: true })
    }

    const { rows } = await pool.query<CategoryRow>(
      'SELECT id, name, parent_id FROM catalog_categories ORDER BY parent_id NULLS FIRST, name'
    )
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'no categories' })
    }

    const prompt = buildPrompt(title, description || '', rows)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(YANDEX_GPT_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          modelUri: `gpt://${folderId}/yandexgpt/latest`,
          completionOptions: { stream: false, temperature: 0.1, maxTokens: 300 },
          messages: [{ role: 'user', text: prompt }],
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.warn('[API] classify-category YandexGPT non-OK:', res.status, errText)
        return NextResponse.json({ success: false, llmError: 'failed' })
      }

      const data = await res.json()
      const gptText: string = data?.result?.alternatives?.[0]?.message?.text || ''
      const parsedJson = parseGptJson(gptText)
      if (!parsedJson || !parsedJson.category_id) {
        return NextResponse.json({
          success: true,
          category_id: null,
          confidence: 0,
          reasoning: parsedJson?.reasoning || '',
        })
      }

      const known = rows.find((r) => r.id === parsedJson.category_id)
      if (!known) {
        return NextResponse.json({
          success: true,
          category_id: null,
          confidence: 0,
          reasoning: 'GPT вернул несуществующий id',
        })
      }

      return NextResponse.json({
        success: true,
        category_id: known.id,
        category_name: known.name,
        confidence: parsedJson.confidence,
        reasoning: parsedJson.reasoning,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (err) {
    logger.error('[API] classify-category error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
