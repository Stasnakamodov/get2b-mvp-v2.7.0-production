"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle, XCircle } from "lucide-react"

export default function TestOcrDebugPage() {
  const [inputText, setInputText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Введите текст для анализа")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch('/api/test-ocr-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getFieldStatus = (value: any) => {
    if (!value || value === '') return { status: 'empty', icon: XCircle, color: 'text-red-500' }
    return { status: 'found', icon: CheckCircle, color: 'text-green-500' }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🔍 Тест OCR Алгоритма</h1>
        <p className="text-gray-600">Отладка алгоритма извлечения данных компании</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ввод текста */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Введите текст для анализа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Вставьте сюда текст из OCR..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Анализируем...
                </>
              ) : (
                "Анализировать"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Результаты */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Результаты анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Статистика */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Длина текста</p>
                    <p className="font-semibold">{result.debugInfo?.textLength || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Количество строк</p>
                    <p className="font-semibold">{result.debugInfo?.lines || 0}</p>
                  </div>
                </div>

                {/* Извлеченные данные */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Извлеченные данные:</h3>
                  
                                     {Object.entries(result.extractedData || {}).map(([key, value]) => {
                     const status = getFieldStatus(value)
                     const Icon = status.icon
                     
                     return (
                       <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                         <div className="flex items-center gap-2">
                           <Icon className={`h-4 w-4 ${status.color}`} />
                           <span className="font-medium capitalize">{key}:</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-sm text-gray-600">
                             {String(value) || 'Не найдено'}
                           </span>
                           <Badge variant={status.status === 'found' ? 'default' : 'secondary'}>
                             {status.status === 'found' ? 'Найдено' : 'Пусто'}
                           </Badge>
                         </div>
                       </div>
                     )
                   })}
                </div>

                {/* Первые строки текста */}
                {result.debugInfo?.firstLines && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2">Первые 10 строк текста:</h3>
                    <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                      {result.debugInfo.firstLines.map((line: string, index: number) => (
                        <div key={index} className="text-gray-600">
                          {index + 1}: {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Примеры текста */}
      <Card>
        <CardHeader>
          <CardTitle>Примеры текста для тестирования</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Пример 1: Стандартная карточка компании</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInputText(`ООО "ТехноСтрой"
ИНН: 7701234567
КПП: 770101001
ОГРН: 1027700001234
Юридический адрес: 123456, г. Москва, ул. Примерная, д. 1, оф. 100
Банк: ПАО Сбербанк
Расчетный счет: 40702810123456789012
БИК: 044525225
Корреспондентский счет: 30101810400000000225
Телефон: +7 (495) 123-45-67
Email: info@technostroy.ru`)}
              >
                Загрузить пример 1
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Пример 2: С OCR ошибками</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInputText(`ООО "ТехноСтрой"
ИНН: 770-123-456-7
КПП: 770-101-001
ОГРН: 102-770-000-123-4
Юридический адрес: 123456, г. Москва, ул. Примерная, д. 1, оф. 100
Банк: ПАО Сбербанк
Расчетный счет: 4070 2810 1234 5678 9012
БИК: 044 525 225
Корреспондентский счет: 3010 1810 4000 0000 0225
Телефон: +7 (495) 123-45-67
Email: info@technostroy.ru`)}
              >
                Загрузить пример 2
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Пример 3: Табличный формат</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInputText(`| Название | ООО "ТехноСтрой" |
| ИНН | 7701234567 |
| КПП | 770101001 |
| ОГРН | 1027700001234 |
| Адрес | 123456, г. Москва, ул. Примерная, д. 1, оф. 100 |
| Банк | ПАО Сбербанк |
| Счет | 40702810123456789012 |
| БИК | 044525225 |`)}
              >
                Загрузить пример 3
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 