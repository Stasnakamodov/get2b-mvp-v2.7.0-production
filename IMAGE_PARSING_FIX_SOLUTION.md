# РЕШЕНИЕ: Исправление парсинга изображений товаров

## Проблема
Парсер извлекает `og:image` (Open Graph) который содержит рекламные баннеры, а не реальные фото товаров.

## Корневая причина
**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/lib/services/PlaywrightParserService.ts`

### Текущий код (НЕПРАВИЛЬНО):
```typescript
// Строки 203-218
const ogData = await page.evaluate(() => {
  const getMeta = (selector: string) =>
    document.querySelector(selector)?.getAttribute('content') || undefined

  return {
    title: getMeta('meta[property="og:title"]') ||
           getMeta('meta[name="twitter:title"]'),
    description: getMeta('meta[property="og:description"]') ||
                getMeta('meta[name="twitter:description"]') ||
                getMeta('meta[name="description"]'),
    imageUrl: getMeta('meta[property="og:image"]') ||  // ❌ ПРОБЛЕМА!
             getMeta('meta[name="twitter:image"]'),     // ❌ ПРОБЛЕМА!
    price: getMeta('meta[property="og:price:amount"]') ||
          getMeta('meta[property="product:price:amount"]')
  }
})
```

### Что не так:
1. `og:image` на Wildberries = рекламный баннер (519x56px)
2. Реальные фото товара находятся в DOM (галерея)
3. Нет валидации размеров изображения

---

## РЕШЕНИЕ 1: Извлечение изображений из галереи

### Новый метод для извлечения изображений:

```typescript
/**
 * Извлечение РЕАЛЬНЫХ изображений товара (НЕ баннеров!)
 */
private async extractProductImages(page: any): Promise<string[]> {
  const images = await page.evaluate(() => {
    const imageUrls: string[] = []
    
    // Функция для проверки валидности URL изображения
    const isValidImageUrl = (url: string | null): boolean => {
      if (!url) return false
      
      // Пропускаем data:image, base64, svg
      if (url.startsWith('data:')) return false
      if (url.includes('.svg')) return false
      
      // Проверяем что это реальный URL изображения
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().includes(ext))
    }
    
    // ПРИОРИТЕТ 1: Wildberries - галерея товара
    const wbGallery = document.querySelectorAll('.slide__content img, .product-gallery img, img[class*="photo"]')
    wbGallery.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      if (isValidImageUrl(src) && !imageUrls.includes(src)) {
        imageUrls.push(src)
      }
    })
    
    // ПРИОРИТЕТ 2: Ozon - галерея
    const ozonGallery = document.querySelectorAll('[data-widget="webGallery"] img, .PhotoView_photo img')
    ozonGallery.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      if (isValidImageUrl(src) && !imageUrls.includes(src)) {
        imageUrls.push(src)
      }
    })
    
    // ПРИОРИТЕТ 3: AliExpress - галерея
    const aliGallery = document.querySelectorAll('.images-view-item img, .magnifier-image')
    aliGallery.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      if (isValidImageUrl(src) && !imageUrls.includes(src)) {
        imageUrls.push(src)
      }
    })
    
    // ПРИОРИТЕТ 4: Универсальный поиск - основное изображение товара
    if (imageUrls.length === 0) {
      const mainImage = document.querySelector('.product-image img, [class*="product"] img, main img')
      const src = mainImage?.getAttribute('src') || mainImage?.getAttribute('data-src')
      if (isValidImageUrl(src)) {
        imageUrls.push(src)
      }
    }
    
    return imageUrls
  })
  
  // Фильтруем и проверяем размеры изображений
  const validImages: string[] = []
  
  for (const imageUrl of images) {
    try {
      // Проверяем размер изображения
      const dimensions = await this.getImageDimensions(imageUrl)
      
      // Валидация:
      // - Минимум 400x400 пикселей
      // - Не баннер (пропорции не больше 3:1)
      if (dimensions.width >= 400 && 
          dimensions.height >= 400 &&
          dimensions.width / dimensions.height <= 3 &&
          dimensions.height / dimensions.width <= 3) {
        validImages.push(imageUrl)
        
        // Достаточно первого валидного изображения
        if (validImages.length >= 1) break
      } else {
        console.log(`⚠️ [Image Filter] Отклонено изображение: ${imageUrl} (${dimensions.width}x${dimensions.height})`)
      }
    } catch (error) {
      console.warn(`⚠️ [Image Filter] Не удалось проверить изображение: ${imageUrl}`)
    }
  }
  
  return validImages
}

/**
 * Получение размеров изображения без полной загрузки
 */
private async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  try {
    // Загружаем только заголовки изображения
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    
    if (!contentType?.startsWith('image/')) {
      throw new Error('Not an image')
    }
    
    // Для более точной проверки загружаем первые байты
    const partialResponse = await fetch(url, {
      headers: { 'Range': 'bytes=0-10000' }
    })
    const buffer = await partialResponse.arrayBuffer()
    
    // Простая проверка через Image (в браузерном контексте)
    // В реальности нужно использовать image-size или sharp
    return { width: 1000, height: 1000 } // Placeholder
    
  } catch (error) {
    return { width: 0, height: 0 }
  }
}
```

---

## РЕШЕНИЕ 2: Обновить extractMetadata

### Новая версия метода:

```typescript
private async extractMetadata(page: any, accessibilityTree: any): Promise<Partial<ParsedProductMetadata>> {
  
  // Метод 1: Open Graph метатеги (БЕЗ imageUrl!)
  const ogData = await page.evaluate(() => {
    const getMeta = (selector: string) =>
      document.querySelector(selector)?.getAttribute('content') || undefined

    return {
      title: getMeta('meta[property="og:title"]') ||
             getMeta('meta[name="twitter:title"]'),
      description: getMeta('meta[property="og:description"]') ||
                  getMeta('meta[name="twitter:description"]') ||
                  getMeta('meta[name="description"]'),
      price: getMeta('meta[property="og:price:amount"]') ||
            getMeta('meta[property="product:price:amount"]')
      // ❌ НЕ берем og:image!
    }
  })

  // Метод 2: Извлечение РЕАЛЬНЫХ изображений товара
  const productImages = await this.extractProductImages(page)
  
  // Метод 3: Accessibility tree (как в Playwright MCP)
  const accessibilityData = this.parseAccessibilityTree(accessibilityTree)

  // Метод 4: DOM селекторы для цены/описания
  const domData = await page.evaluate(() => {
    const getText = (selector: string) =>
      document.querySelector(selector)?.textContent?.trim() || undefined

    return {
      title: getText('h1') || document.title,
      description: getText('.description') ||
                  getText('[data-widget="webDescription"]') ||
                  getText('.product-description') ||
                  getText('.collapsable__content'),
      price: getText('.price-block__final-price') ||
            getText('[data-widget="webPrice"]') ||
            getText('.product-price-value')
    }
  })

  console.log('📦 [Playwright Parser] Извлечено:', {
    ogTitle: !!ogData.title,
    accessibilityTitle: !!accessibilityData.title,
    domTitle: !!domData.title,
    productImages: productImages.length
  })

  // Объединяем (приоритет: productImages > OG > Accessibility > DOM)
  return {
    title: ogData.title || accessibilityData.title || domData.title || '',
    description: ogData.description || accessibilityData.description || domData.description || '',
    imageUrl: productImages[0], // ✅ Используем РЕАЛЬНОЕ изображение из галереи!
    price: ogData.price || domData.price
  }
}
```

---

## РЕШЕНИЕ 3: Быстрая заглушка (если нет времени на полное решение)

### Добавить фильтр по размеру в текущий код:

```typescript
// После строки 256 добавить проверку
imageUrl: ogData.imageUrl || domData.imageUrl,

// ДОБАВИТЬ сразу после extractMetadata:
if (metadata.imageUrl) {
  // Быстрая проверка: если изображение слишком маленькое/узкое - отклоняем
  try {
    const imgCheck = await page.evaluate(async (url: string) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            isValid: img.naturalWidth >= 400 && 
                    img.naturalHeight >= 400 &&
                    img.naturalWidth / img.naturalHeight <= 5
          })
        }
        img.onerror = () => resolve({ width: 0, height: 0, isValid: false })
        img.src = url
      })
    }, metadata.imageUrl)
    
    if (!imgCheck.isValid) {
      console.warn(`⚠️ [Image Filter] Баннер отклонен: ${metadata.imageUrl} (${imgCheck.width}x${imgCheck.height})`)
      metadata.imageUrl = undefined // Обнуляем неправильное изображение
    }
  } catch (error) {
    console.warn('⚠️ [Image Filter] Не удалось проверить изображение')
  }
}
```

---

## План внедрения

### Этап 1: Быстрое исправление (30 минут)
1. Добавить РЕШЕНИЕ 3 (фильтр по размеру)
2. Переимпортировать 30 товаров
3. Проверить результат

### Этап 2: Полное решение (2-3 часа)
1. Реализовать РЕШЕНИЕ 1 (extractProductImages)
2. Обновить РЕШЕНИЕ 2 (extractMetadata)
3. Добавить тесты
4. Переимпортировать все товары

### Этап 3: Мониторинг (постоянно)
1. Логировать размеры всех изображений
2. Алерты если изображение < 400x400
3. Ежедневная проверка качества изображений

---

## Тестирование

### Команда для проверки после исправления:

```bash
# 1. Импортировать тестовый товар
curl -X POST http://localhost:3000/api/catalog/products/import-from-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.wildberries.ru/catalog/123/detail.aspx"}'

# 2. Проверить размер изображения
psql "postgres://..." -c "SELECT name, images FROM catalog_verified_products ORDER BY created_at DESC LIMIT 1;"

# 3. Скачать и проверить
curl -o test.jpg "URL_из_БД"
file test.jpg
sips -g pixelWidth -g pixelHeight test.jpg
```

### Ожидаемый результат:
- Размер файла: > 50 KB
- Разрешение: >= 400x400 пикселей
- Тип: JPEG или PNG с реальным фото товара
- НЕ баннер "Скидки до 50%"

---

## Контрольный список (Checklist)

- [ ] Добавлен метод `extractProductImages()`
- [ ] Обновлен метод `extractMetadata()`
- [ ] Добавлена валидация размеров изображений
- [ ] Убран `og:image` из приоритетных источников
- [ ] Добавлено логирование отклоненных изображений
- [ ] Протестировано на 5 товарах Wildberries
- [ ] Протестировано на 5 товарах Ozon
- [ ] Протестировано на 5 товарах AliExpress
- [ ] Переимпортированы все товары категории ТЕСТОВАЯ
- [ ] Настроен мониторинг качества изображений

---

## Отчет создан
2025-11-27 через Claude Code
