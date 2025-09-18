// Используем библиотеку xlsx для работы с Excel файлами
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

export class YandexVisionService {
  private apiKey: string;
  private folderId: string;
  private baseUrl = 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze';

  constructor() {
    this.apiKey = process.env.YANDEX_VISION_API_KEY || '';
    this.folderId = process.env.YANDEX_FOLDER_ID || '';
    
    console.log('🔧 YandexVision: Проверяем переменные окружения...');
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'НЕ НАЙДЕН');
    console.log('📁 Folder ID:', this.folderId ? this.folderId : 'НЕ НАЙДЕН');
    
    if (!this.apiKey || !this.folderId) {
      throw new Error('Yandex Vision API не настроен. Проверьте YANDEX_VISION_API_KEY и YANDEX_FOLDER_ID');
    }
  }

  /**
   * Распознает текст из изображения
   */
  async recognizeText(imageUrl: string): Promise<string> {
    try {
      console.log('🔍 YandexVision: начинаем распознавание текста');
      
      // Скачиваем изображение и конвертируем в base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          folderId: this.folderId,
          analyzeSpecs: [{
            content: base64Image,
            features: [{
              type: 'TEXT_DETECTION',
              textDetectionConfig: {
                languageCodes: ['ru', 'en']
              }
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Yandex Vision API ошибка: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ YandexVision: изображение распознано успешно');
      console.log('📄 Ответ от Yandex Vision API:', JSON.stringify(data, null, 2));

      // Извлекаем текст из результатов
      const text = data.results?.[0]?.results?.[0]?.textDetection?.pages?.[0]?.blocks
        ?.map((block: any) => block.lines?.map((line: any) => line.words?.map((word: any) => word.text).join(' ')).join(' '))
        .join('\n') || '';

      console.log('📄 Извлеченный текст:', text);
      console.log('📄 Длина извлеченного текста:', text.length);

      return text;
    } catch (error) {
      console.error('❌ YandexVision ошибка:', error);
      throw error;
    }
  }

  /**
   * Распознает текст из PDF документа
   */
  async recognizeTextFromPdf(pdfUrl: string): Promise<string> {
    try {
      console.log('🔍 YandexVision: начинаем извлечение текста из PDF');
      
      // Скачиваем PDF файл
      const fileResponse = await fetch(pdfUrl);
      if (!fileResponse.ok) {
        throw new Error(`Ошибка загрузки PDF файла: ${fileResponse.status}`);
      }
      
      const arrayBuffer = await fileResponse.arrayBuffer();
      console.log('📄 PDF файл загружен, размер:', arrayBuffer.byteLength, 'байт');
      
      // Конвертируем PDF в base64
      const base64Pdf = Buffer.from(arrayBuffer).toString('base64');
      
      console.log('🔍 YandexVision: отправляем PDF в Yandex Vision API');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          folderId: this.folderId,
          analyzeSpecs: [{
            content: base64Pdf,
            mimeType: 'application/pdf',
            features: [{
              type: 'TEXT_DETECTION',
              textDetectionConfig: {
                languageCodes: ['ru', 'en']
              }
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Yandex Vision API ошибка:', response.status, errorText);
        throw new Error(`Yandex Vision API ошибка: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ YandexVision: PDF обработан успешно');
      
      // Извлекаем текст из результатов
      const text = data.results?.[0]?.results?.[0]?.textDetection?.pages
        ?.map((page: any) => page.blocks
          ?.map((block: any) => block.lines?.map((line: any) => line.words?.map((word: any) => word.text).join(' ')).join(' '))
          .join('\n'))
        .join('\n') || '';

      console.log('📄 Извлеченный текст из PDF:', text.substring(0, 200) + '...');
      console.log('📄 Длина извлеченного текста:', text.length);

      if (text.length === 0) {
        console.log('⚠️ YandexVision: PDF не содержит извлекаемого текста');
        console.log('💡 Рекомендация: используйте изображения (JPG, PNG) или DOCX файлы');
      }

      return text;
    } catch (error) {
      console.error('❌ YandexVision PDF ошибка:', error);
      throw error;
    }
  }

  /**
   * Определяет тип документа и извлекает текст
   */
  async extractTextFromDocument(fileUrl: string, fileType: string): Promise<string> {
    console.log(`📄 YandexVision: обработка файла типа ${fileType}`);
    
    if (fileType.includes('pdf')) {
      return await this.recognizeTextFromPdf(fileUrl);
    } else if (fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('png')) {
      return await this.recognizeText(fileUrl);
    } else if (fileType.includes('xlsx') || fileType.includes('xls') || fileType.includes('spreadsheetml') || fileType.includes('openxmlformats-officedocument.spreadsheetml')) {
      // Для XLSX файлов извлекаем данные напрямую
      console.log('📄 XLSX файл обнаружен, извлекаем данные...');
      return await this.extractTextFromXlsx(fileUrl);
    } else if (fileType.includes('docx') || fileType.includes('doc') || fileType.includes('openxmlformats')) {
      // Для DOCX файлов извлекаем текст напрямую
      console.log('📄 DOCX файл обнаружен, извлекаем текст...');
      return await this.extractTextFromDocx(fileUrl);
    } else {
      throw new Error(`Неподдерживаемый тип файла: ${fileType}`);
    }
  }

  /**
   * Извлекает текст из DOCX файла
   */
  async extractTextFromDocx(docxUrl: string): Promise<string> {
    try {
      console.log('📄 YandexVision: начинаем извлечение текста из DOCX');
      
      // Скачиваем DOCX файл
      const response = await fetch(docxUrl);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки файла: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📄 Файл загружен, размер:', arrayBuffer.byteLength, 'байт');
      
      // Используем mammoth для извлечения текста
      const mammoth = await import('mammoth');
      const result = await mammoth.default.extractRawText({ 
        buffer: Buffer.from(arrayBuffer)
      });
      
      console.log('✅ YandexVision: текст извлечен из DOCX, длина:', result.value?.length || 0);
      return result.value || '';
    } catch (error) {
      console.error('❌ YandexVision DOCX ошибка:', error);
      throw error;
    }
  }

  /**
   * Извлекает данные из XLSX файла
   */
  async extractTextFromXlsx(xlsxUrl: string): Promise<string> {
    try {
      console.log('🔍 YandexVision: начинаем извлечение данных из XLSX');
      console.log('🔗 URL файла:', xlsxUrl);
      
      // Скачиваем XLSX файл с таймаутом и повторными попытками
      let fileResponse;
      let retries = 3;
      
      while (retries > 0) {
        try {
          console.log(`🔄 Попытка загрузки XLSX файла (осталось попыток: ${retries})`);
          
          // Используем AbortController для таймаута
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут
          
          fileResponse = await fetch(xlsxUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Get2B-OCR/1.0)'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (fileResponse.ok) {
            break; // Успешно загрузили
          } else {
            throw new Error(`HTTP ${fileResponse.status}: ${fileResponse.statusText}`);
          }
        } catch (fetchError) {
          console.warn(`⚠️ Ошибка загрузки XLSX (попытка ${4-retries}/3):`, fetchError);
          retries--;
          
          if (retries === 0) {
            // 🔥 АЛЬТЕРНАТИВНЫЙ СПОСОБ: Попробуем через Supabase клиент
            console.log('🔄 Пробуем альтернативный способ загрузки через Supabase...');
            
            try {
              // Извлекаем путь к файлу из URL
              const urlParts = xlsxUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const bucketName = 'step2-ready-invoices'; // Используем тот же bucket
              
              console.log('📦 Загружаем через Supabase Storage:', { bucketName, fileName });
              
              const { data, error } = await supabase.storage
                .from(bucketName)
                .download(fileName);
              
              if (error) {
                throw new Error(`Supabase Storage ошибка: ${error.message}`);
              }
              
              if (!data) {
                throw new Error('Файл не найден в Supabase Storage');
              }
              
              const arrayBuffer = await data.arrayBuffer();
              console.log('✅ Файл загружен через Supabase, размер:', arrayBuffer.byteLength, 'байт');
              
              // Продолжаем обработку с загруженным файлом
              const workbook = XLSX.read(arrayBuffer, { type: 'array' });
              console.log('📊 Найдено листов:', workbook.SheetNames.length);
              
              let extractedText = '';
              
              // Обрабатываем каждый лист
              workbook.SheetNames.forEach((sheetName, index) => {
                console.log(`📋 Обрабатываем лист: ${sheetName}`);
                const worksheet = workbook.Sheets[sheetName];
                
                // Конвертируем в JSON для извлечения данных
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Добавляем название листа
                extractedText += `=== ЛИСТ: ${sheetName} ===\n`;
                
                // Добавляем данные из листа
                jsonData.forEach((row: any, rowIndex: number) => {
                  if (row && row.length > 0) {
                    const rowText = row.map((cell: any) => String(cell || '')).join(' | ');
                    extractedText += `${rowText}\n`;
                  }
                });
                
                extractedText += '\n';
              });
              
              console.log('✅ YandexVision: данные из XLSX извлечены успешно через Supabase');
              return extractedText;
              
            } catch (supabaseError) {
              console.error('❌ Ошибка загрузки через Supabase:', supabaseError);
              throw new Error(`Не удалось загрузить XLSX файл: ${fetchError}. Supabase ошибка: ${supabaseError}`);
            }
          }
          
          // Ждем перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const arrayBuffer = await fileResponse!.arrayBuffer();
      console.log('📄 XLSX файл загружен, размер:', arrayBuffer.byteLength, 'байт');
      
      // Читаем XLSX файл
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log('📊 Найдено листов:', workbook.SheetNames.length);
      
      let extractedText = '';
      
      // Обрабатываем каждый лист
      workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`📋 Обрабатываем лист: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Конвертируем в JSON для извлечения данных
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Добавляем название листа
        extractedText += `=== ЛИСТ: ${sheetName} ===\n`;
        
        // Добавляем данные из листа
        jsonData.forEach((row: any, rowIndex: number) => {
          if (row && row.length > 0) {
            const rowText = row.map((cell: any) => String(cell || '')).join(' | ');
            extractedText += `${rowText}\n`;
          }
        });
        
        extractedText += '\n';
      });
      
      console.log('✅ YandexVision: данные из XLSX извлечены успешно');
      console.log('📄 Извлеченный текст:', extractedText);
      console.log('📄 Длина извлеченного текста:', extractedText.length);
      
      return extractedText;
    } catch (error) {
      console.error('❌ YandexVision XLSX ошибка:', error);
      throw error;
    }
  }
}

// Создаем единственный экземпляр сервиса
let yandexVisionService: YandexVisionService | null = null;

export function getYandexVisionService(): YandexVisionService {
  if (!yandexVisionService) {
    yandexVisionService = new YandexVisionService();
  }
  return yandexVisionService;
} 