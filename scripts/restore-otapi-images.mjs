#!/usr/bin/env node
/**
 * Скрипт восстановления реальных изображений товаров из OTAPI API
 * С параллельными запросами для ускорения (5 одновременных)
 *
 * Запуск: node scripts/restore-otapi-images.mjs
 */

import { createClient } from '@supabase/supabase-js'

// ─── Конфигурация ──────────────────────────────────────────────
const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
const OTAPI_KEY = '4722589f-fded-4e56-8765-b422d6aebf03'
const OTAPI_BASE = 'https://otapi.net/service-json'

const CONCURRENCY = 5        // Параллельных запросов к OTAPI
const MAX_RETRIES = 2
const DAILY_CALL_LIMIT = 280 // Лимит OTAPI: 300/день, оставляем буфер 20

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ─── Счётчик API вызовов ───────────────────────────────────────
let apiCallCount = 0
let rateLimitHit = false

function checkCallLimit() {
  if (apiCallCount >= DAILY_CALL_LIMIT) {
    if (!rateLimitHit) {
      rateLimitHit = true
      console.log(`\n⚠️  Достигнут лимит OTAPI: ${apiCallCount}/${DAILY_CALL_LIMIT} вызовов`)
      console.log('Перезапустите скрипт завтра для продолжения.\n')
    }
    return true
  }
  return false
}

// ─── Утилиты ───────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))

function extractItemId(sku) {
  const m = sku.match(/^OTAPI-(\d+)-/)
  return m ? m[1] : null
}

function cleanImageUrl(url) {
  if (!url) return null
  let c = url.replace(/^https?:\/\/img\.alicdn\.com\/imgextra\/\/\//, 'https://')
  if (c.startsWith('//')) c = 'https:' + c
  if (!c.startsWith('http')) c = 'https://' + c
  return c
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function extractImages(info) {
  const images = []
  if (info.MainPictureUrl) images.push(cleanImageUrl(info.MainPictureUrl))

  let pics = info.Pictures
  if (pics && !Array.isArray(pics) && pics.ItemPicture) {
    pics = Array.isArray(pics.ItemPicture) ? pics.ItemPicture : [pics.ItemPicture]
  }
  if (Array.isArray(pics)) {
    for (const pic of pics) {
      const url = pic.Large?.Url || pic.Url || pic.Medium?.Url
      if (url) {
        const cleaned = cleanImageUrl(url)
        if (cleaned && !images.includes(cleaned)) images.push(cleaned)
      }
    }
  }
  return images.slice(0, 10)
}

// ─── OTAPI API ─────────────────────────────────────────────────
async function fetchImagesFromOtapi(itemId, retries = 0) {
  if (checkCallLimit()) return { ok: false, error: 'CallLimit', images: [] }
  try {
    apiCallCount++
    const resp = await fetch(
      `${OTAPI_BASE}/GetItemFullInfo?instanceKey=${OTAPI_KEY}&itemId=${itemId}&language=ru`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    if (data.ErrorCode && data.ErrorCode !== 'Ok') {
      // Обнаружили лимит от сервера
      if (data.ErrorCode === 'AccessDenied') { rateLimitHit = true; apiCallCount = DAILY_CALL_LIMIT }
      return { ok: false, error: data.ErrorCode, images: [] }
    }
    const info = data.OtapiItemFullInfo
    if (!info) return { ok: false, error: 'NoInfo', images: [] }
    const images = extractImages(info)
    return images.length > 0
      ? { ok: true, images, error: null }
      : { ok: false, error: 'NoImages', images: [] }
  } catch (err) {
    if (retries < MAX_RETRIES) {
      await sleep(1000 * (retries + 1))
      return fetchImagesFromOtapi(itemId, retries + 1)
    }
    return { ok: false, error: err.message, images: [] }
  }
}

async function searchImagesByName(name, retries = 0) {
  if (checkCallLimit()) return { ok: false, error: 'CallLimit', images: [] }
  try {
    apiCallCount++
    const query = name.substring(0, 50).replace(/[^\w\sа-яА-ЯёЁ]/g, ' ').trim()
    if (!query || query.length < 3) return { ok: false, error: 'short', images: [] }

    const xml = `<SearchItemsParameters><Provider>Taobao</Provider><ItemTitle>${escapeXml(query)}</ItemTitle></SearchItemsParameters>`
    const params = new URLSearchParams({
      instanceKey: OTAPI_KEY, language: 'ru', xmlParameters: xml,
      framePosition: '0', frameSize: '1'
    })

    const resp = await fetch(`${OTAPI_BASE}/SearchItemsFrame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(15000)
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    // Обнаружение лимита
    if (data.ErrorCode === 'AccessDenied' || data.OtapiResponse?.ErrorCode === 'AccessDenied') {
      rateLimitHit = true; apiCallCount = DAILY_CALL_LIMIT
      return { ok: false, error: 'CallLimit', images: [] }
    }

    let items = data.OtapiResponse?.Result?.Items?.Content?.Item
    if (!items) {
      items = data.OtapiResponse?.Result?.Items
      if (items && !Array.isArray(items)) items = null
    }
    if (!items) return { ok: false, error: 'NoResults', images: [] }
    if (!Array.isArray(items)) items = [items]
    if (items.length === 0) return { ok: false, error: 'Empty', images: [] }

    const item = items[0]
    const images = []
    const mainPic = item.MainPictureUrl || item.PictureUrl
    if (mainPic) images.push(cleanImageUrl(mainPic))

    let pics = item.Pictures
    if (pics && !Array.isArray(pics) && pics.ItemPicture) {
      pics = Array.isArray(pics.ItemPicture) ? pics.ItemPicture : [pics.ItemPicture]
    }
    if (Array.isArray(pics)) {
      for (const p of pics) {
        const url = p.Large?.Url || p.Url || p.Medium?.Url
        if (url) { const c = cleanImageUrl(url); if (c && !images.includes(c)) images.push(c) }
      }
    }
    return { ok: images.length > 0, images: images.slice(0, 5), error: images.length === 0 ? 'NoImages' : null }
  } catch (err) {
    if (retries < MAX_RETRIES) { await sleep(1000 * (retries + 1)); return searchImagesByName(name, retries + 1) }
    return { ok: false, error: err.message, images: [] }
  }
}

// ─── Параллельная обработка батчей ─────────────────────────────
async function processBatch(items, processFn, concurrency = CONCURRENCY, checkLimit = true) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    if (checkLimit && rateLimitHit) {
      // Помечаем оставшиеся как skipped
      for (let j = i; j < items.length; j++) {
        results.push({ product: items[j], status: 'skipped' })
      }
      break
    }
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(item => processFn(item)))
    results.push(...batchResults)
    if (i + concurrency < items.length) await sleep(200)
  }
  return results
}

// ─── Загрузка товаров из Supabase ──────────────────────────────
async function loadProducts(filter) {
  let all = []
  let offset = 0
  const pageSize = 500
  while (true) {
    let q = supabase.from('catalog_verified_products').select('id, sku, name, category, images').eq('is_active', true)
    if (filter === 'otapi') q = q.like('sku', 'OTAPI-%')
    else if (filter === 'non-otapi') q = q.not('sku', 'like', 'OTAPI-%')
    q = q.range(offset, offset + pageSize - 1)
    const { data, error } = await q
    if (error) { console.error('DB error:', error.message); break }
    if (!data || data.length === 0) break
    all = all.concat(data)
    offset += pageSize
    if (data.length < pageSize) break
  }
  return all
}

function needsUpdate(product) {
  return !product.images || product.images.length === 0 || product.images[0]?.includes('dummyimage')
}

// ─── ЭТАП 1: OTAPI товары (прямой запрос + fallback поиск) ────
async function processOtapiProducts() {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  ЭТАП 1: OTAPI товары (прямой запрос по itemId)')
  console.log('═══════════════════════════════════════════════════\n')

  const allProducts = await loadProducts('otapi')
  const toProcess = allProducts.filter(needsUpdate)
  console.log(`Всего OTAPI товаров: ${allProducts.length}, нужно обновить: ${toProcess.length}\n`)

  if (toProcess.length === 0) return { total: allProducts.length, success: 0, noImages: 0, failed: 0 }

  const stats = { total: toProcess.length, success: 0, fallback: 0, noImages: 0, failed: 0, skipped: 0 }
  let processed = 0

  const results = await processBatch(toProcess, async (product) => {
    const itemId = extractItemId(product.sku)
    if (!itemId) return { product, status: 'no-id' }

    // Прямой запрос
    const result = await fetchImagesFromOtapi(itemId)
    if (result.ok) return { product, status: 'direct', images: result.images }
    if (rateLimitHit) return { product, status: 'skipped' }

    // Fallback: поиск по имени
    const searchResult = await searchImagesByName(product.name)
    if (searchResult.ok) return { product, status: 'fallback', images: searchResult.images }

    return { product, status: 'failed', error: result.error }
  })

  // Обновляем БД
  for (const r of results) {
    if (r.status === 'skipped') { stats.skipped++; continue }
    processed++
    if (processed % 50 === 0) {
      console.log(`  Обработано ${processed}/${toProcess.length} (успех: ${stats.success})`)
    }

    if (r.status === 'direct' || r.status === 'fallback') {
      try {
        const { error } = await supabase
          .from('catalog_verified_products')
          .update({ images: r.images })
          .eq('id', r.product.id)
        if (error) throw error
        stats.success++
        if (r.status === 'fallback') stats.fallback++
      } catch {
        stats.failed++
      }
    } else if (r.status === 'failed') {
      stats.noImages++
    } else {
      stats.failed++
    }
  }

  console.log(`\n─── Результаты Этапа 1 ───`)
  console.log(`Обработано: ${processed} (пропущено из-за лимита: ${stats.skipped})`)
  console.log(`✅ Обновлено: ${stats.success} (прямой: ${stats.success - stats.fallback}, поиск: ${stats.fallback})`)
  console.log(`❌ Не найдено: ${stats.noImages}`)
  console.log(`⚠️  Ошибки: ${stats.failed}`)
  return stats
}

// ─── ЭТАП 2: Не-OTAPI товары (поиск по имени) ─────────────────
async function processNonOtapiProducts() {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  ЭТАП 2: Не-OTAPI товары (поиск по имени)')
  console.log('═══════════════════════════════════════════════════\n')

  const allProducts = await loadProducts('non-otapi')
  const toProcess = allProducts.filter(needsUpdate)
  console.log(`Всего не-OTAPI товаров: ${allProducts.length}, нужно обновить: ${toProcess.length}\n`)

  if (toProcess.length === 0) return { total: allProducts.length, success: 0, noResults: 0, failed: 0 }

  const stats = { total: toProcess.length, success: 0, noResults: 0, failed: 0, skipped: 0 }
  let processed = 0

  const results = await processBatch(toProcess, async (product) => {
    const result = await searchImagesByName(product.name)
    if (result.ok) return { product, images: result.images }
    return { product, status: 'failed' }
  })

  for (const r of results) {
    if (r.status === 'skipped') { stats.skipped++; continue }
    processed++
    if (processed % 50 === 0) {
      console.log(`  Обработано ${processed}/${toProcess.length} (успех: ${stats.success})`)
    }

    if (r.images) {
      try {
        const { error } = await supabase
          .from('catalog_verified_products')
          .update({ images: r.images })
          .eq('id', r.product.id)
        if (error) throw error
        stats.success++
      } catch {
        stats.failed++
      }
    } else {
      stats.noResults++
    }
  }

  console.log(`\n─── Результаты Этапа 2 ───`)
  console.log(`Обработано: ${processed} (пропущено из-за лимита: ${stats.skipped})`)
  console.log(`✅ Обновлено: ${stats.success}`)
  console.log(`❌ Не найдено: ${stats.noResults}`)
  console.log(`⚠️  Ошибки: ${stats.failed}`)
  return stats
}

// ─── ЭТАП 3: Проверка ─────────────────────────────────────────
async function verifyImages(sampleSize = 30) {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  ЭТАП 3: Проверка доступности изображений')
  console.log('═══════════════════════════════════════════════════\n')

  const { data } = await supabase
    .from('catalog_verified_products')
    .select('id, images')
    .eq('is_active', true)
    .limit(300)

  if (!data) return { checked: 0, ok: 0, broken: 0 }

  const withReal = data.filter(p => p.images?.[0] && !p.images[0].includes('dummyimage')).slice(0, sampleSize)
  if (withReal.length === 0) { console.log('Нет обновлённых товаров для проверки'); return { checked: 0, ok: 0, broken: 0 } }

  console.log(`Проверяем ${withReal.length} изображений...\n`)
  let ok = 0, broken = 0

  await processBatch(withReal, async (p) => {
    try {
      const r = await fetch(p.images[0], { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      if (r.ok) { ok++; return }
      broken++
      console.log(`  ❌ ${r.status} — ${p.images[0].substring(0, 70)}`)
    } catch {
      broken++
      console.log(`  ❌ Timeout — ${p.images[0].substring(0, 70)}`)
    }
  }, 10, false)

  console.log(`\n✅ Доступно: ${ok}/${withReal.length}`)
  console.log(`❌ Недоступно: ${broken}/${withReal.length}`)
  return { checked: withReal.length, ok, broken }
}

// ─── Финальная статистика ──────────────────────────────────────
async function printFinalStats() {
  console.log('\n═══════════════════════════════════════════════════')
  console.log('  ФИНАЛЬНАЯ СТАТИСТИКА')
  console.log('═══════════════════════════════════════════════════\n')

  const all = await loadProducts(null)
  const total = all.length
  const withDummy = all.filter(p => p.images?.[0]?.includes('dummyimage')).length
  const withReal = total - withDummy

  console.log(`Всего активных товаров:     ${total}`)
  console.log(`С реальными изображениями:  ${withReal}`)
  console.log(`Осталось с заглушками:      ${withDummy}`)
  console.log(`Процент восстановления:     ${((withReal / total) * 100).toFixed(1)}%`)
  console.log(`API вызовов использовано:   ${apiCallCount}/${DAILY_CALL_LIMIT}`)
  if (withDummy > 0) {
    console.log(`\n📅 При лимите ${DAILY_CALL_LIMIT} вызовов/день, перезапустите скрипт завтра.`)
    console.log(`   Скрипт автоматически пропустит уже обновлённые товары.`)
  }
}

// ─── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('🔄 Восстановление реальных изображений товаров Get2B')
  console.log(`Дата: ${new Date().toISOString()}`)
  console.log(`Параллельность: ${CONCURRENCY} запросов\n`)

  // Проверка OTAPI
  const test = await fetchImagesFromOtapi('672273993582')
  if (test.ok) {
    console.log(`✅ OTAPI доступен (${test.images.length} картинок)\n`)
  } else {
    console.log(`⚠️ OTAPI тест: ${test.error}. Продолжаем...\n`)
  }

  const t0 = Date.now()

  const s1 = await processOtapiProducts()
  const s2 = await processNonOtapiProducts()
  const s3 = await verifyImages(30)
  await printFinalStats()

  const mins = ((Date.now() - t0) / 60000).toFixed(1)
  console.log(`\nВремя: ${mins} мин`)
  console.log(`\n═══ ИТОГО ═══`)
  console.log(`Этап 1 (OTAPI):  ${s1.success}/${s1.total}`)
  console.log(`Этап 2 (Поиск):  ${s2.success}/${s2.total}`)
  console.log(`Всего:           ${s1.success + s2.success}/${s1.total + s2.total}`)
  console.log(`Проверка:        ${s3.ok}/${s3.checked} доступны`)
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
