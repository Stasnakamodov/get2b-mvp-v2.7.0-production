'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  Star
} from 'lucide-react'

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

interface SuppliersTableProps {
  suppliers: Supplier[]
  isLoading: boolean
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onApprove: (supplier: Supplier) => void
  onReject: (supplier: Supplier) => void
  onViewProducts: (supplier: Supplier) => void
}

/**
 * Таблица поставщиков для админ-панели
 */
export function SuppliersTable({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewProducts
}: SuppliersTableProps) {
  const [search, setSearch] = useState('')

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Одобрен</Badge>
      case 'rejected':
        return <Badge className="bg-red-500">Отклонён</Badge>
      case 'pending':
      default:
        return <Badge className="bg-yellow-500">На модерации</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Поиск поставщиков..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Поставщик</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Страна</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Рейтинг</TableHead>
              <TableHead>Товаров</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    Загрузка...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Поставщики не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.company_name && (
                        <p className="text-xs text-gray-500">{supplier.company_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{supplier.category}</Badge>
                  </TableCell>
                  <TableCell>{supplier.country}</TableCell>
                  <TableCell>{getStatusBadge(supplier.moderation_status)}</TableCell>
                  <TableCell>
                    {supplier.public_rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {supplier.public_rating.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProducts(supplier)}
                      className="gap-1"
                    >
                      <Package className="w-4 h-4" />
                      {supplier.products_count || 0}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProducts(supplier)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Товары
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(supplier)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        {supplier.moderation_status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onApprove(supplier)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Одобрить
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onReject(supplier)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Отклонить
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete(supplier)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SuppliersTable
