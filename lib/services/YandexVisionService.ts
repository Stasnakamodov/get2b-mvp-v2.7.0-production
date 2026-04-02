import { db } from "@/lib/db"
// Используем библиотеку xlsx для работы с Excel файлами
import * as XLSX from 'xlsx';

export class YandexVisionService {
  private apiKey: string;
  private folderId: string;
  private baseUrl = 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze';

  constructor() {
    this.apiKey = process.env.YANDEX_VISION_API_KEY || '';
    this.folderId = process.env.YANDEX_FOLDER_ID || '';
    
    
    if (!this.apiKey || !this.folderId) {
      throw new Error('Yandex Vision API не настроен. Проверьте YANDEX_VISION_API_KEY и YANDEX_FOLDER_ID');
    }
  }

  /**
   * Классифицирует объекты на изображении (определяет что изображено)
   */
  async classifyImage(imageBase64: string): Promise<{
    labels: Array<{ name: string; confidence: number }>;
    description: string;
  }> {
    try {

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
            content: imageBase64,
            features: [{
              type: 'CLASSIFICATION',
              classificationConfig: {
                model: 'quality'
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

      // Извлекаем классификацию
      const classification = data.results?.[0]?.results?.[0]?.classification;
      const labels = classification?.properties?.map((prop: any) => ({
        name: prop.name,
        confidence: prop.probability
      })) || [];

      // Создаем описание на основе меток с высокой уверенностью
      const topLabels = labels
        .filter((label: any) => label.confidence > 0.3)
        .slice(0, 5)
        .map((label: any) => label.name);

      const description = topLabels.join(', ');


      return {
        labels,
        description
      };
    } catch (error) {
      console.error('❌ YandexVision классификация ошибка:', error);
      throw error;
    }
  }

  /**
   * Распознает текст из изображения (по URL)
   */
  async recognizeText(imageUrl: string): Promise<string> {
    try {

      // Скачиваем изображение и конвертируем в base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      return await this.recognizeTextFromBase64(base64Image);
    } catch (error) {
      console.error('❌ YandexVision ошибка:', error);
      throw error;
    }
  }

  /**
   * Распознает текст из изображения (из base64)
   */
  async recognizeTextFromBase64(imageBase64: string): Promise<string> {
    try {

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
            content: imageBase64,
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

      // Извлекаем текст из результатов
      const text = data.results?.[0]?.results?.[0]?.textDetection?.pages?.[0]?.blocks
        ?.map((block: any) => block.lines?.map((line: any) => line.words?.map((word: any) => word.text).join(' ')).join(' '))
        .join('\n') || '';


      return text;
    } catch (error) {
      console.error('❌ YandexVision OCR ошибка:', error);
      throw error;
    }
  }

  /**
   * Распознает текст из PDF документа
   */
  async recognizeTextFromPdf(pdfUrl: string): Promise<string> {
    try {
      
      // Скачиваем PDF файл
      const fileResponse = await fetch(pdfUrl);
      if (!fileResponse.ok) {
        throw new Error(`Ошибка загрузки PDF файла: ${fileResponse.status}`);
      }
      
      const arrayBuffer = await fileResponse.arrayBuffer();
      
      // Конвертируем PDF в base64
      const base64Pdf = Buffer.from(arrayBuffer).toString('base64');
      
      
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
      
      // Извлекаем текст из результатов
      const text = data.results?.[0]?.results?.[0]?.textDetection?.pages
        ?.map((page: any) => page.blocks
          ?.map((block: any) => block.lines?.map((line: any) => line.words?.map((word: any) => word.text).join(' ')).join(' '))
          .join('\n'))
        .join('\n') || '';


      if (text.length === 0) {
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
    
    if (fileType.includes('pdf')) {
      return await this.recognizeTextFromPdf(fileUrl);
    } else if (fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('png')) {
      return await this.recognizeText(fileUrl);
    } else if (fileType.includes('xlsx') || fileType.includes('xls') || fileType.includes('spreadsheetml') || fileType.includes('openxmlformats-officedocument.spreadsheetml')) {
      // Для XLSX файлов извлекаем данные напрямую
      return await this.extractTextFromXlsx(fileUrl);
    } else if (fileType.includes('docx') || fileType.includes('doc') || fileType.includes('openxmlformats')) {
      // Для DOCX файлов извлекаем текст напрямую
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
      
      // Скачиваем DOCX файл
      const response = await fetch(docxUrl);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки файла: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Используем mammoth для извлечения текста
      const mammoth = await import('mammoth');
      const result = await mammoth.default.extractRawText({ 
        buffer: Buffer.from(arrayBuffer)
      });
      
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
      
      // Скачиваем XLSX файл с таймаутом и повторными попытками
      let fileResponse;
      let retries = 3;
      
      while (retries > 0) {
        try {
          
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
            
            try {
              // Извлекаем путь к файлу из URL
              const urlParts = xlsxUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const bucketName = 'step2-ready-invoices'; // Используем тот же bucket
              
              
              const { data, error } = await db.storage
                .from(bucketName)
                .download(fileName);
              
              if (error) {
                throw new Error(`Supabase Storage ошибка: ${error.message}`);
              }
              
              if (!data) {
                throw new Error('Файл не найден в Supabase Storage');
              }
              
              const arrayBuffer = await data.arrayBuffer();
              
              // Продолжаем обработку с загруженным файлом
              const workbook = XLSX.read(arrayBuffer, { type: 'array' });
              
              let extractedText = '';
              
              // Обрабатываем каждый лист
              workbook.SheetNames.forEach((sheetName, index) => {
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
      
      // Читаем XLSX файл
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let extractedText = '';
      
      // Обрабатываем каждый лист
      workbook.SheetNames.forEach((sheetName, index) => {
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