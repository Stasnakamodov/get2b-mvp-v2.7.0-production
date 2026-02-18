/**
 * Виджет каталога поставщиков
 * Widgets layer - композиция фич
 */

import React, { useState } from 'react'
import { useManageSuppliers, SupplierList } from '@/src/features/manage-suppliers'
import { Building, Users } from 'lucide-react'
import type { RoomType } from '@/src/entities/supplier'

export function CatalogSuppliersWidget() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const {
    suppliers,
    loading,
    error,
    selectedSupplier,
    setSelectedSupplier,
    createSupplier,
    loadSuppliers,
  } = useManageSuppliers()

  // Filter suppliers by room type
  const filteredSuppliers = React.useMemo(() => {
    let filtered = suppliers

    // Filter by room
    if (selectedRoom === 'orange') {
      filtered = filtered.filter(s => s.room_type === 'verified' || s.status === 'active')
    } else {
      filtered = filtered.filter(s => s.room_type === 'user')
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.company_name?.toLowerCase().includes(query) ||
        s.contact_email?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [suppliers, selectedRoom, searchQuery])

  const handleCreateSupplier = () => {
    setShowAddModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Room Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4">Каталог поставщиков</h2>

        <div className="flex gap-4">
          <button
            onClick={() => setSelectedRoom('orange')}
            className={`
              flex-1 p-4 rounded-lg border-2 transition-all
              ${selectedRoom === 'orange'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">Аккредитованные поставщики</h3>
            <p className="text-sm text-gray-600">Проверенные поставщики с гарантиями</p>
            <div className="mt-2 text-2xl font-bold text-orange-600">
              {suppliers.filter(s => s.status === 'active').length}
            </div>
          </button>

          <button
            onClick={() => setSelectedRoom('blue')}
            className={`
              flex-1 p-4 rounded-lg border-2 transition-all
              ${selectedRoom === 'blue'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">Персональные поставщики</h3>
            <p className="text-sm text-gray-600">Ваши личные поставщики</p>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {suppliers.filter(s => s.room_type === 'user').length}
            </div>
          </button>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SupplierList
          suppliers={filteredSuppliers}
          loading={loading}
          error={error}
          selectedSupplier={selectedSupplier}
          onSelectSupplier={setSelectedSupplier}
          onCreateSupplier={handleCreateSupplier}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </div>
  )
}