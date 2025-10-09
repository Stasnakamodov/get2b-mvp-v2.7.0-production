'use client'

import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 🔍 useOcrUpload Hook
 *
 * Управление загрузкой файлов и OCR анализом для атомарного конструктора.
 *
 * ⚠️ КРИТИЧНО: Все OCR паттерны сохранены из монолита!
 * См. docs/architecture/ocr-patterns-inventory.md
 *
 * Поддерживаемые документы:
 * - Step 1: Карточка компании (documentType: 'company_card')
 * - Step 2: Спецификация/инвойс (documentType: 'invoice')
 *
 * OCR паттерны:
 * - Очистка supplierName от префиксов (| Agent:, | Buyer:, Поставщик:)
 * - Очистка recipientName от китайских символов (账户名称)
 * - Fallback regex для банковских реквизитов
 * - Логика закрытия модала (успех/частичный успех/провал)
 */

interface OcrUploadParams {
  supabase: SupabaseClient
  setManualData: (data: any) => void
  setStepConfigs: (data: any) => void
  setSelectedSource: (source: string | null) => void
  suggestPaymentMethodAndRequisites: (bankRequisites: any, supplierName: string) => void
  uploadFileToStorage: (file: File, options: any) => Promise<{ url: string }>
  generateFileDate: () => string
  cleanFileName: (name: string) => string
  bucketMap: Record<number, string>
}

interface BankRequisites {
  bankName: string
  accountNumber: string
  swift: string
  recipientName: string
  recipientAddress: string
  transferCurrency: string
  hasRequisites: boolean
}

export function useOcrUpload({
  supabase,
  setManualData,
  setStepConfigs,
  setSelectedSource,
  suggestPaymentMethodAndRequisites,
  uploadFileToStorage,
  generateFileDate,
  cleanFileName,
  bucketMap
}: OcrUploadParams) {
  // ========================================
  // СОСТОЯНИЯ OCR
  // ========================================

  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>({})
  const [ocrAnalyzing, setOcrAnalyzing] = useState<Record<number, boolean>>({})
  const [ocrError, setOcrError] = useState<Record<number, string>>({})
  const [ocrDebugData, setOcrDebugData] = useState<Record<number, any>>({})

  // ========================================
  // ФУНКЦИЯ: Загрузка файла + OCR анализ
  // ========================================

  const handleFileUpload = async (stepId: number, file: File) => {
    // Сразу показываем индикатор загрузки
    setOcrAnalyzing(prev => ({ ...prev, [stepId]: true }))
    setOcrError(prev => ({ ...prev, [stepId]: '' }))

    try {
      console.log(`🔍 Начинаем загрузку файла для шага ${stepId}:`, file.name)
      console.log(`📄 Тип файла: ${file.type}`)
      console.log(`📏 Размер файла: ${file.size} байт`)

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Необходима авторизация для загрузки файлов')
      }

      // Определяем bucket для загрузки в зависимости от шага
      const bucket = bucketMap[stepId as keyof typeof bucketMap] || 'project-files'
      console.log(`📦 Используем bucket: ${bucket}`)

      // Генерируем уникальное имя файла
      const date = generateFileDate()
      const timestamp = Date.now()
      const cleanName = cleanFileName(file.name)

      const { url: fileUrl } = await uploadFileToStorage(file, {
        bucket,
        folder: `invoices/atomic`,
        projectRequestId: `${date}_${timestamp}_atomic-constructor`,
        date: ''
      })

      console.log(`🔗 Публичный URL: ${fileUrl}`)

      // Сохраняем ссылку на файл
      setUploadedFiles(prev => ({ ...prev, [stepId]: fileUrl }))

      // Устанавливаем конфигурацию шага как upload
      setStepConfigs(prev => ({ ...prev, [stepId]: 'upload' }))

      // 🔍 OCR АНАЛИЗ В ЗАВИСИМОСТИ ОТ ШАГА
      console.log(`🔍 Начинаем OCR анализ для шага ${stepId}...`)
      if (stepId === 1) {
        // Анализ карточки компании
        await analyzeCompanyCard(fileUrl, file.type)
      } else if (stepId === 2) {
        // Анализ спецификации/инвойса
        await analyzeSpecification(fileUrl, file.type)
      }

    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error)
      setOcrError(prev => ({
        ...prev,
        [stepId]: `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }))
    }
  }

  // ========================================
  // ПАТТЕРН 1: АНАЛИЗ КАРТОЧКИ КОМПАНИИ
  // ========================================

  const analyzeCompanyCard = async (fileUrl: string, fileType: string) => {
    const stepId = 1
    setOcrError(prev => ({ ...prev, [stepId]: '' }))

    try {
      console.log("🔍 Начинаем анализ карточки компании...")

      // Добавляем таймаут для запроса
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 секунд

      let analysisResult: any
      try {
        const analysisResponse = await fetch('/api/document-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileType: fileType,
            documentType: 'company_card' // ⚠️ КРИТИЧНО!
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!analysisResponse.ok) {
          const errorText = await analysisResponse.text()
          console.error("❌ Ошибка API:", analysisResponse.status, errorText)
          throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`)
        }

        analysisResult = await analysisResponse.json()

      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания (60 сек). Попробуйте загрузить файл меньшего размера.')
        }
        throw fetchError
      }

      // Проверяем успешность анализа
      if (!analysisResult.success) {
        console.log("⚠️ Анализ не удался:", analysisResult.error)
        setOcrError(prev => ({
          ...prev,
          [stepId]: analysisResult.error || 'Не удалось извлечь данные из документа'
        }))
        return
      }

      const extractedData = analysisResult.suggestions

      console.log("✅ Данные компании извлечены:", extractedData)
      console.log("📊 Ключи в extractedData:", Object.keys(extractedData))
      console.log("📊 extractedData.companyName:", extractedData.companyName)
      console.log("📊 extractedData.inn:", extractedData.inn)
      console.log("📊 extractedData.phone:", extractedData.phone)
      console.log("📊 extractedData.email:", extractedData.email)
      console.log("📊 extractedData.bankBik:", extractedData.bankBik)
      console.log("📊 extractedData.bankCorrAccount:", extractedData.bankCorrAccount)

      // Сохраняем отладочные данные
      setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }))

      // Автозаполнение данных компании
      if (extractedData && Object.keys(extractedData).length > 0) {
        const companyData = {
          name: extractedData.companyName || extractedData.name || '',
          legalName: extractedData.legalName || extractedData.companyName || '',
          inn: extractedData.inn || '',
          kpp: extractedData.kpp || '',
          ogrn: extractedData.ogrn || '',
          address: extractedData.address || '',
          phone: extractedData.phone || '',
          email: extractedData.email || '',
          website: extractedData.website || '',
          director: extractedData.director || '',
          bankName: extractedData.bankName || '',
          bankAccount: extractedData.bankAccount || '',
          bik: extractedData.bankBik || extractedData.bik || '', // ⚠️ Fallback!
          correspondentAccount: extractedData.bankCorrAccount || extractedData.correspondentAccount || '' // ⚠️ Fallback!
        }

        // Проверяем, есть ли хотя бы какие-то данные
        const hasData = Object.values(companyData).some(value => value && value.toString().trim() !== '')

        if (hasData) {
          // Сохраняем извлеченные данные
          setManualData(prev => ({ ...prev, [stepId]: companyData }))
          console.log("✅ Данные компании автозаполнены:", companyData)
          console.log("📊 Проверяем контактные данные:")
          console.log("📊 companyData.phone:", companyData.phone)
          console.log("📊 companyData.email:", companyData.email)

          // ✅ ЗАКРЫВАЕМ МОДАЛ ТОЛЬКО ПРИ УСПЕШНОМ OCR
          setSelectedSource(null)
        } else {
          console.log("⚠️ Данные извлечены, но все поля пустые")
          setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }))
        }
      } else {
        console.log("⚠️ extractedData пустой или не содержит данных")
        setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }))
      }
    } catch (error) {
      console.error("❌ Ошибка анализа карточки компании:", error)
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }))
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }))
    }
  }

  // ========================================
  // ПАТТЕРН 2: АНАЛИЗ СПЕЦИФИКАЦИИ/ИНВОЙСА
  // ========================================

  const analyzeSpecification = async (fileUrl: string, fileType: string) => {
    const stepId = 2
    setOcrError(prev => ({ ...prev, [stepId]: '' }))

    try {
      console.log("🔍 Начинаем анализ спецификации...")

      // Добавляем таймаут для запроса
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 секунд

      let analysisResult: any
      try {
        const analysisResponse = await fetch('/api/document-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileType: fileType,
            documentType: 'invoice' // ⚠️ КРИТИЧНО!
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!analysisResponse.ok) {
          const errorText = await analysisResponse.text()
          console.error("❌ Ошибка API:", analysisResponse.status, errorText)
          throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`)
        }

        analysisResult = await analysisResponse.json()

      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания (60 сек). Попробуйте загрузить файл меньшего размера.')
        }
        throw fetchError
      }

      const extractedData = analysisResult.suggestions
      const analysisText = analysisResult.extractedText

      console.log("✅ Данные спецификации извлечены:", extractedData)
      console.log("📊 Ключи в extractedData:", Object.keys(extractedData))
      console.log("📊 extractedData.items:", extractedData.items)
      console.log("📊 extractedData.invoiceInfo:", extractedData.invoiceInfo)
      console.log("📊 extractedData.bankInfo:", extractedData.bankInfo)
      console.log("📊 Детали извлеченных данных:")
      console.log("   - invoiceInfo:", extractedData.invoiceInfo)
      console.log("   - seller:", extractedData.invoiceInfo?.seller)
      console.log("   - items count:", extractedData.items?.length || 0)
      console.log("   - items:", extractedData.items)
      console.log("   - bankInfo:", extractedData.bankInfo)
      console.log("   - analysisText (первые 500 символов):", analysisText?.substring(0, 500))

      // Сохраняем отладочные данные
      setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }))

      // 🔥 ПАТТЕРН: Очищаем название поставщика от лишних символов
      let supplierName = extractedData.invoiceInfo?.seller || extractedData.seller || ''

      if (supplierName) {
        // Убираем префиксы типа "| Agent: ", "| Buyer:", "Поставщик:", "Продавец:" и т.д.
        supplierName = supplierName
          .replace(/^\|\s*(Agent|Buyer|Seller|Поставщик|Продавец|Покупатель):\s*/i, '')
          .replace(/^\|\s*/g, '')
          .trim()
      }

      console.log("🏢 Поставщик из OCR:", supplierName)

      // 🔥 ПАТТЕРН 4: Извлекаем банковские реквизиты из инвойса
      const bankRequisites = extractBankRequisitesFromInvoice(extractedData, analysisText)
      console.log("🏦 Извлеченные банковские реквизиты:", bankRequisites)

      // ПАТТЕРН 3: Автозаполнение спецификации извлеченными данными
      if (extractedData && extractedData.items && extractedData.items.length > 0) {
        const specificationItems = extractedData.items.map((invoiceItem: any) => ({
          name: invoiceItem.name || "Товар из инвойса", // Основное поле name
          item_name: invoiceItem.name || "Товар из инвойса", // Дублируем для совместимости с UI
          item_code: invoiceItem.code || "", // Используем item_code для совместимости с UI
          code: invoiceItem.code || "", // Дублируем для совместимости
          quantity: Number(invoiceItem.quantity) || 1,
          unit: "шт", // Стандартная единица измерения
          price: Number(invoiceItem.price) || 0,
          total: Number(invoiceItem.total) || 0,
          description: invoiceItem.description || ""
        }))

        // Сохраняем извлеченные данные
        const specificationData = {
          supplier: supplierName,
          items: specificationItems,
          totalAmount: extractedData.invoiceInfo?.totalAmount ||
            extractedData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0),
          currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
        }

        setManualData(prev => {
          const newData = { ...prev, [stepId]: specificationData }
          console.log("🔄 Обновляем manualData для шага", stepId)
          console.log("📊 Новые данные:", newData)
          console.log("📊 manualData после обновления:", newData)
          return newData
        })
        console.log("✅ Спецификация автозаполнена:", specificationData)
        console.log(`✅ Добавлено ${specificationItems.length} позиций на сумму ${specificationData.totalAmount} руб.`)

        // ✅ ПАТТЕРН 6: ЗАКРЫВАЕМ МОДАЛ ТОЛЬКО ПРИ УСПЕШНОМ OCR
        setSelectedSource(null)

        // 🔥 ПАТТЕРН 8: Автоматически предлагаем способ оплаты и реквизиты
        if (bankRequisites.hasRequisites) {
          suggestPaymentMethodAndRequisites(bankRequisites, supplierName)
        }
      } else {
        // ПАТТЕРН 6: Если товары не найдены, но есть информация о поставщике, сохраняем её
        if (extractedData && extractedData.invoiceInfo && supplierName) {
          const specificationData = {
            supplier: supplierName,
            items: [],
            totalAmount: 0,
            currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
          }

          setManualData(prev => ({ ...prev, [stepId]: specificationData }))
          console.log("✅ Поставщик сохранен:", specificationData)
          setOcrError(prev => ({ ...prev, [stepId]: 'Найдена информация об инвойсе, но товары не извлечены. Добавьте позиции вручную.' }))

          // ✅ ЗАКРЫВАЕМ МОДАЛ ДАЖЕ ЕСЛИ НЕ ВСЕ ДАННЫЕ ИЗВЛЕЧЕНЫ (частичный успех)
          setSelectedSource(null)

          // 🔥 НОВОЕ: Предлагаем реквизиты даже если нет товаров
          if (bankRequisites.hasRequisites) {
            suggestPaymentMethodAndRequisites(bankRequisites, supplierName)
          }
        } else {
          console.log("⚠️ Товары не найдены в документе")
          setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь товары из документа' }))
          // ❌ НЕ ЗАКРЫВАЕМ МОДАЛ при полном провале
        }
      }
    } catch (error) {
      console.error("❌ Ошибка анализа спецификации:", error)
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }))
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }))
    }
  }

  // ========================================
  // ПАТТЕРН 4 + 5: ИЗВЛЕЧЕНИЕ БАНКОВСКИХ РЕКВИЗИТОВ
  // ========================================

  const extractBankRequisitesFromInvoice = (extractedData: any, analysisText: string): BankRequisites => {
    console.log("🏦 Начинаем извлечение банковских реквизитов из инвойса...")

    const requisites: BankRequisites = {
      bankName: '',
      accountNumber: '',
      swift: '',
      recipientName: '',
      recipientAddress: '',
      transferCurrency: '',
      hasRequisites: false
    }

    // Извлекаем данные из структурированных полей
    if (extractedData.bankInfo) {
      requisites.bankName = extractedData.bankInfo.bankName || ''
      requisites.accountNumber = extractedData.bankInfo.accountNumber || ''
      requisites.swift = extractedData.bankInfo.swift || ''
      requisites.recipientName = extractedData.bankInfo.recipientName || ''
      requisites.recipientAddress = extractedData.bankInfo.recipientAddress || ''
      requisites.transferCurrency = extractedData.bankInfo.currency || ''
    }

    // 🔥 ПАТТЕРН 4: Очищаем recipientName от лишних символов
    if (requisites.recipientName) {
      requisites.recipientName = requisites.recipientName
        .replace(/\(账户名称\):\s*/i, '') // Убираем китайский текст
        .replace(/\(Account Name\):\s*/i, '') // Убираем английский текст
        .replace(/^[^a-zA-Z0-9]*/, '') // Убираем символы в начале
        .trim()
      console.log("🧹 Очищенное recipientName:", requisites.recipientName)
    }

    // 🔥 ПАТТЕРН 5: Если структурированные данные не найдены, ищем в тексте
    if (!requisites.accountNumber && analysisText) {
      // Поиск номера счета (USD A/C NO., EUR A/C NO., Account Number)
      const accountPatterns = [
        /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Account\s*Number\s*:?\s*(\d+)/i,
        /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Номер\s*счета\s*:?\s*(\d+)/i
      ]

      for (const pattern of accountPatterns) {
        const match = analysisText.match(pattern)
        if (match) {
          requisites.accountNumber = match[1]
          console.log("✅ Найден номер счета:", requisites.accountNumber)
          break
        }
      }
    }

    // Проверяем наличие реквизитов
    requisites.hasRequisites = !!(
      requisites.bankName ||
      requisites.accountNumber ||
      requisites.recipientName
    )

    console.log("🏦 Итоговые реквизиты:", requisites)
    return requisites
  }

  // ========================================
  // ВОЗВРАЩАЕМ ИНТЕРФЕЙС ХУКА
  // ========================================

  return {
    // Состояния
    uploadedFiles,
    ocrAnalyzing,
    ocrError,
    ocrDebugData,

    // Функции
    handleFileUpload,

    // Вспомогательные
    isUploading: (stepId: number) => ocrAnalyzing[stepId] || false
  }
}
