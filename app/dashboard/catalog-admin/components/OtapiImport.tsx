'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Download, CheckCircle, AlertCircle, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES = [
  'Электроника',
  'Дом и быт',
  'Здоровье и красота',
  'Автотовары',
  'Строительство',
  'Текстиль и одежда',
  'Промышленность',
  'Продукты питания'
]

const PROVIDERS = [
  { value: 'Taobao', label: 'Taobao (розница)' },
  { value: '1688', label: '1688 (опт B2B)' },
  { value: 'Alibaba', label: 'Alibaba (международный)' },
  { value: 'AliExpress', label: 'AliExpress (экспорт)' }
]

interface ImportResult {
  success: boolean
  imported: number
  duplicates: number
  errors: number
  message?: string
}

interface SupplierOption {
  id: string
  name: string
  company_name?: string
}

/**
 * Компонент импорта товаров из OTAPI
 */
export function OtapiImport() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [provider, setProvider] = useState('Taobao')
  const [limit, setLimit] = useState('20')
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const { toast } = useToast()

  // Загружаем список верифицированных поставщиков
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch('/api/catalog/suppliers?verified=true')
        const data = await res.json()
        const list = (data.suppliers || []).map((s: any) => ({
          id: s.id,
          name: s.name || s.company_name || 'Без названия',
          company_name: s.company_name
        }))
        setSuppliers(list)
      } catch {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список поставщиков',
          variant: 'destructive'
        })
      } finally {
        setLoadingSuppliers(false)
      }
    }
    loadSuppliers()
  }, [toast])

  const handleImport = async () => {
    if (!query.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите поисковый запрос',
        variant: 'destructive'
      })
      return
    }

    if (!category) {
      toast({
        title: 'Ошибка',
        description: 'Выберите категорию',
        variant: 'destructive'
      })
      return
    }

    if (!supplierId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите поставщика для привязки товаров',
        variant: 'destructive'
      })
      return
    }

    setIsImporting(true)
    setResult(null)

    try {
      const response = await fetch('/api/catalog/import-from-otapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          supplier_id: supplierId,
          category,
          provider,
          limit: parseInt(limit)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта')
      }

      setResult({
        success: true,
        imported: data.imported || 0,
        duplicates: data.duplicates || 0,
        errors: data.errors || 0,
        message: data.message
      })

      toast({
        title: 'Импорт завершён',
        description: `Импортировано ${data.imported} товаров`
      })

    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        duplicates: 0,
        errors: 1,
        message: error.message
      })

      toast({
        title: 'Ошибка импорта',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Импорт из OTAPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-2">
          <Label>Поисковый запрос</Label>
          <Input
            placeholder="Например: смартфон, ноутбук, одежда женская..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category & Provider */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Категория Get2B</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Маркетплейс</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Supplier Selector */}
        <div className="space-y-2">
          <Label>Поставщик (обязательно)</Label>
          <Select value={supplierId} onValueChange={setSupplierId} disabled={loadingSuppliers}>
            <SelectTrigger>
              <SelectValue placeholder={loadingSuppliers ? 'Загрузка...' : 'Выберите поставщика'} />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}{s.company_name && s.company_name !== s.name ? ` (${s.company_name})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Товары будут привязаны к выбранному поставщику
          </p>
        </div>

        {/* Limit */}
        <div className="space-y-2">
          <Label>Количество товаров</Label>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={isImporting || !supplierId}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Импорт...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Начать импорт
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {result.success ? 'Импорт успешен' : 'Ошибка импорта'}
              </span>
            </div>

            {result.success && (
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-green-500" />
                  <span>Импортировано: <strong>{result.imported}</strong></span>
                </div>
                {result.duplicates > 0 && (
                  <Badge variant="secondary">
                    Дубликатов: {result.duplicates}
                  </Badge>
                )}
                {result.errors > 0 && (
                  <Badge variant="destructive">
                    Ошибок: {result.errors}
                  </Badge>
                )}
              </div>
            )}

            {result.message && (
              <p className="text-sm text-gray-600 mt-2">{result.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OtapiImport
