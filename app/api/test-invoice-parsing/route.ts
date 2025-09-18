import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    console.log("🧪 ТЕСТ ПАРСИНГА ИНВОЙСА");
    console.log("📄 Полученный текст:", text);
    console.log("📄 Длина текста:", text.length);
    console.log("📄 Первые 200 символов:", text.substring(0, 200));

    // Импортируем функцию извлечения данных инвойса
    interface InvoiceData {
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
      }>;
      invoiceInfo: {
        number?: string;
        date?: string;
        total?: number;
        currency?: string;
        totalAmount?: number;
        vat?: number;
        seller?: string;
        buyer?: string;
      };
    }

    function extractInvoiceData(text: string): InvoiceData {
      const suggestions: InvoiceData = {
        items: [],
        invoiceInfo: {}
      };

      console.log("🔍 Анализируем текст для извлечения данных инвойса...");

      // Поиск номера инвойса
      const invoiceNumberPatterns = [
        /\b(Инвойс|Счет|Invoice|№|Номер)[:\s]*([A-Z0-9\-_\/]+)/i,
        /\b№\s*([A-Z0-9\-_\/]+)/i,
        /\bСчет\s*№\s*([A-Z0-9\-_\/]+)/i,
        /\bInvoice\s*#\s*([A-Z0-9\-_\/]+)/i
      ];

      for (const pattern of invoiceNumberPatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.number = match[2] || match[1];
          console.log("✅ Номер инвойса найден:", suggestions.invoiceInfo.number);
          break;
        }
      }

      // Поиск даты инвойса
      const datePatterns = [
        /\b(Дата|Date)[:\s]*(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
        /\b(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
        /\b(\d{4}-\d{2}-\d{2})/i
      ];

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.date = match[2] || match[1];
          console.log("✅ Дата инвойса найдена:", suggestions.invoiceInfo.date);
          break;
        }
      }

      // Поиск общей суммы
      const totalPatterns = [
        /\b(Итого|Всего|Сумма|Total|ИТОГО)[:\s]*(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)/i,
        /\b(Итого|Всего|Сумма|Total|ИТОГО)[:\s]*(\d+)\s*(руб|USD|EUR|₽|$|€)/i,
        /\b(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)\s*(Итого|Всего|Сумма|Total|ИТОГО)/i
      ];

      for (const pattern of totalPatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.totalAmount = parseFloat(match[2]) || 0;
          suggestions.invoiceInfo.currency = match[3];
          console.log("✅ Общая сумма найдена:", match[2], match[3]);
          break;
        }
      }

      // Поиск НДС
      const vatPatterns = [
        /\b(НДС|VAT)[:\s]*(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)/i,
        /\b(НДС|VAT)[:\s]*(\d+)\s*(руб|USD|EUR|₽|$|€)/i,
        /\b(НДС|VAT)[:\s]*(\d+[.,]\d{2})%/i
      ];

      for (const pattern of vatPatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.vat = parseFloat(match[2]) || 0;
          console.log("✅ НДС найден:", match[2]);
          break;
        }
      }

      // Поиск поставщика (продавца)
      const sellerPatterns = [
        /\b(Поставщик|Продавец|Seller|Provider)[:\s]*\n*([^\n]+)/i,
        /\b(ООО|ИП|ОАО|ЗАО)[\s]*["«]?([^»"\n]+)["»]?\s*(Поставщик|Продавец)/i,
        /Поставщик\s*\n\s*([^\n]+)/i
      ];

      for (const pattern of sellerPatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.seller = match[2] || match[1];
          console.log("✅ Поставщик найден:", suggestions.invoiceInfo.seller);
          break;
        }
      }

      // Поиск покупателя
      const buyerPatterns = [
        /\b(Покупатель|Buyer|Заказчик|Customer)[:\s]*\n*([^\n]+)/i,
        /\b(ООО|ИП|ОАО|ЗАО)[\s]*["«]?([^»"\n]+)["»]?\s*(Покупатель|Buyer)/i,
        /Покупатель\s*\n\s*([^\n]+)/i
      ];

      for (const pattern of buyerPatterns) {
        const match = text.match(pattern);
        if (match) {
          suggestions.invoiceInfo.buyer = match[2] || match[1];
          console.log("✅ Покупатель найден:", suggestions.invoiceInfo.buyer);
          break;
        }
      }

      // Улучшенный поиск позиций товаров
      const lines = text.split('\n');
      let inItemsSection = false;
      let itemCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Определяем начало секции товаров
        if (line.match(/\b(Товары|Позиции|Items|Наименование|№|№п\/п)\b/i)) {
          inItemsSection = true;
          console.log("📍 Найдена секция товаров в строке:", i + 1);
          continue;
        }

        // Определяем конец секции товаров
        if (inItemsSection && line.match(/\b(Итого|Всего|Сумма|Total|ИТОГО)\b/i)) {
          inItemsSection = false;
          console.log("📍 Конец секции товаров в строке:", i + 1);
          continue;
        }

        if (inItemsSection && line.length > 5) {
          // Паттерны для извлечения позиций товаров
          const itemPatterns = [
            // Паттерн: название | количество | цена | сумма
            /^([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+[.,]\d{2})\s*\|\s*(\d+[.,]\d{2})/i,
            // Паттерн: название x количество = сумма
            /^([^x]+)\s*x\s*(\d+)\s*=\s*(\d+[.,]\d{2})/i,
            // Паттерн: название (количество шт. по цене)
            /^([^(]+)\s*\((\d+)\s*шт\.?\s*по\s*(\d+[.,]\d{2})\)/i,
            // Паттерн: название - количество шт. - цена руб. - сумма
            /^([^-]+)\s*-\s*(\d+)\s*шт\.?\s*-\s*(\d+[.,]\d{2})\s*руб\.?\s*-\s*(\d+[.,]\d{2})/i,
            // Простой паттерн: название количество цена
            /^([^\d]+)\s+(\d+)\s+(\d+[.,]\d{2})/i
          ];

          for (const pattern of itemPatterns) {
            const match = line.match(pattern);
            if (match) {
              const item = {
                name: match[1].trim(),
                quantity: parseInt(match[2]),
                price: parseFloat(match[3].replace(',', '.')),
                total: match[4] ? parseFloat(match[4].replace(',', '.')) : parseInt(match[2]) * parseFloat(match[3].replace(',', '.')),
                code: `ITEM-${++itemCount}`
              };

              // Очищаем название от лишних символов
              item.name = item.name.replace(/[^\w\sа-яёА-ЯЁ\-\.]/gi, '').trim();
              
              if (item.name.length > 2) {
                suggestions.items.push(item);
                console.log("✅ Позиция найдена:", item);
              }
              break;
            }
          }
        }
      }

      // Если не нашли товары в структурированном виде, ищем по ключевым словам
      if (suggestions.items.length === 0) {
        console.log("🔍 Ищем товары по ключевым словам...");
        
        for (const line of lines) {
          // Ищем строки, содержащие названия товаров
          const productKeywords = [
            'компьютер', 'ноутбук', 'телефон', 'принтер', 'сканер', 'монитор', 'клавиатура', 'мышь',
            'кабель', 'адаптер', 'блок', 'зарядка', 'наушники', 'динамик', 'микрофон', 'веб-камера',
            'флешка', 'диск', 'карта', 'память', 'процессор', 'материнская', 'видеокарта', 'жесткий',
            'товар', 'изделие', 'продукт', 'материал', 'комплект', 'набор', 'устройство', 'аппарат'
          ];

          const hasProductKeyword = productKeywords.some(keyword => 
            line.toLowerCase().includes(keyword)
          );

          if (hasProductKeyword) {
            // Ищем числа в строке
            const numbers = line.match(/\d+[.,]?\d*/g);
            if (numbers && numbers.length >= 2) {
              const item = {
                name: line.replace(/\d+[.,]?\d*/g, '').replace(/[^\w\sа-яёА-ЯЁ\-\.]/gi, '').trim(),
                quantity: parseInt(numbers[0]),
                price: parseFloat(numbers[1].replace(',', '.')),
                total: numbers[2] ? parseFloat(numbers[2].replace(',', '.')) : parseInt(numbers[0]) * parseFloat(numbers[1].replace(',', '.')),
                code: `ITEM-${++itemCount}`
              };

              if (item.name.length > 3) {
                suggestions.items.push(item);
                console.log("✅ Товар найден по ключевому слову:", item);
              }
            }
          }
        }
      }

      console.log("📊 Итоговые данные инвойса:", suggestions);
      return suggestions;
    }

    const result = extractInvoiceData(text);

    return NextResponse.json({
      success: true,
      result,
      textLength: text.length,
      foundItems: result.items.length,
      foundInvoiceInfo: Object.keys(result.invoiceInfo).length
    });

  } catch (error) {
    console.error("❌ Ошибка в тестовом парсинге инвойса:", error);
    return NextResponse.json(
      { error: "Ошибка тестирования парсинга инвойса" },
      { status: 500 }
    );
  }
} 