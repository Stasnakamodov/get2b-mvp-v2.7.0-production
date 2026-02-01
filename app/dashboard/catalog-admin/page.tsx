'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Building,
  Users,
  Package,
  Plus,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { AdminStats } from './components/AdminStats'
import { SuppliersTable } from './components/SuppliersTable'
import { OtapiImport } from './components/OtapiImport'
import { useToast } from '@/hooks/use-toast'

interface Supplier {
  id: string
  name: string
  company_name?: string
  category: string
  country: string
  moderation_status: 'pending' | 'approved' | 'rejected'
  is_active: boolean
  is_verified: boolean
  public_rating?: number
  products_count?: number
  created_at: string
}

interface Stats {
  totalProducts: number
  totalSuppliers: number
  verifiedSuppliers: number
  pendingSuppliers: number
  todayImports: number
}

/**
 * Админ-панель каталога
 *
 * URL: /dashboard/catalog-admin
 *
 * Функции:
 * - Оранжевая комната: верифицированные поставщики
 * - Синяя комната: пользовательские поставщики
 * - Модерация поставщиков
 * - Импорт из OTAPI
 * - Статистика
 */
export default function CatalogAdminPage() {
  const [activeTab, setActiveTab] = useState('orange')
  const [verifiedSuppliers, setVerifiedSuppliers] = useState<Supplier[]>([])
  const [userSuppliers, setUserSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSuppliers: 0,
    verifiedSuppliers: 0,
    pendingSuppliers: 0,
    todayImports: 0
  })
  const [showImportDialog, setShowImportDialog] = useState(false)
  const { toast } = useToast()

  // Загрузка данных
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Загружаем верифицированных поставщиков
      const verifiedRes = await fetch('/api/catalog/verified-suppliers')
      const verifiedData = await verifiedRes.json()

      // Загружаем статистику товаров
      const productsRes = await fetch('/api/catalog/products-paginated?supplier_type=verified&limit=1')
      const productsData = await productsRes.json()

      // Формируем данные
      const suppliers = verifiedData.suppliers || []
      setVerifiedSuppliers(suppliers.map((s: any) => ({
        ...s,
        moderation_status: s.moderation_status || 'approved',
        products_count: s.products_count || 0
      })))

      // Статистика
      setStats({
        totalProducts: productsData.meta?.count || 0,
        totalSuppliers: suppliers.length,
        verifiedSuppliers: suppliers.filter((s: any) => s.is_verified).length,
        pendingSuppliers: suppliers.filter((s: any) => s.moderation_status === 'pending').length,
        todayImports: 0
      })

    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Обработчики действий
  const handleEdit = (supplier: Supplier) => {
    toast({ title: 'Редактирование', description: `Редактирование ${supplier.name}` })
    // TODO: Открыть модалку редактирования
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Удалить поставщика "${supplier.name}"?`)) return

    try {
      const response = await fetch('/api/catalog/verified-suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: supplier.id })
      })

      if (response.ok) {
        toast({ title: 'Удалено', description: `Поставщик ${supplier.name} удалён` })
        loadData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }

  const handleApprove = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/catalog/accredit-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: supplier.id, status: 'approved' })
      })

      if (response.ok) {
        toast({ title: 'Одобрено', description: `Поставщик ${supplier.name} одобрен` })
        loadData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось одобрить', variant: 'destructive' })
    }
  }

  const handleReject = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/catalog/accredit-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: supplier.id, status: 'rejected' })
      })

      if (response.ok) {
        toast({ title: 'Отклонено', description: `Поставщик ${supplier.name} отклонён` })
        loadData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отклонить', variant: 'destructive' })
    }
  }

  const handleViewProducts = (supplier: Supplier) => {
    window.open(`/dashboard/catalog-new?supplier=${supplier.id}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-orange-500" />
              Админ-панель каталога
            </h1>
            <p className="text-gray-500 text-sm">
              Управление поставщиками и товарами
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button
              onClick={() => setShowImportDialog(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Импорт OTAPI
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <AdminStats stats={stats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orange" className="gap-2">
              <Building className="w-4 h-4 text-orange-500" />
              Оранжевая комната
              <Badge className="bg-orange-500 ml-1">{verifiedSuppliers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="blue" className="gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Синяя комната
              <Badge className="bg-blue-500 ml-1">{userSuppliers.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Orange Room - Verified Suppliers */}
          <TabsContent value="orange" className="mt-6">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Оранжевая комната — Аккредитованные поставщики
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Поставщики, прошедшие модерацию. Их товары видны всем пользователям.
              </p>
            </div>

            <SuppliersTable
              suppliers={verifiedSuppliers}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewProducts={handleViewProducts}
            />
          </TabsContent>

          {/* Blue Room - User Suppliers */}
          <TabsContent value="blue" className="mt-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Синяя комната — Личные поставщики пользователей
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Поставщики, добавленные пользователями. Видны только их владельцам.
              </p>
            </div>

            <SuppliersTable
              suppliers={userSuppliers}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewProducts={handleViewProducts}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Импорт товаров из OTAPI</DialogTitle>
          </DialogHeader>
          <OtapiImport />
        </DialogContent>
      </Dialog>
    </div>
  )
}
