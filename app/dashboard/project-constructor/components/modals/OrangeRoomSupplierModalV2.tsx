'use client';

import React, { useState, useCallback } from 'react';
import { Building, Package, ArrowLeft, Search, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VirtualProductList } from '@/components/catalog/VirtualProductList';
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts';

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  city?: string;
  country?: string;
  created_at?: string;
  public_rating?: number;
  projects_count?: number;
  is_featured?: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency?: string;
  images?: any;
  supplier_id: string;
  min_order?: string;
  in_stock?: boolean;
}

interface OrangeRoomSupplierModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  orangeRoomSuppliers: Supplier[];
  orangeRoomLoading: boolean;
  catalogSourceStep: number;
  handleSelectOrangeRoomSupplier: (supplier: Supplier, selectedProducts?: Product[]) => void;
}

/**
 * Улучшенная модалка Orange Room с виртуализацией
 *
 * Два режима:
 * 1. Список поставщиков - выбор поставщика
 * 2. Товары поставщика - выбор товаров с infinite scroll
 */
export default function OrangeRoomSupplierModalV2({
  isOpen,
  onClose,
  orangeRoomSuppliers,
  orangeRoomLoading,
  catalogSourceStep,
  handleSelectOrangeRoomSupplier,
}: OrangeRoomSupplierModalV2Props) {
  // Режим отображения: 'suppliers' или 'products'
  const [viewMode, setViewMode] = useState<'suppliers' | 'products'>('suppliers');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка товаров выбранного поставщика
  const {
    data: productsData,
    isLoading: productsLoading,
  } = useInfiniteProducts({
    supplierType: 'verified',
    supplierId: selectedSupplier?.id,
    enabled: !!selectedSupplier && viewMode === 'products',
    limit: 50,
  });

  const allProducts = flattenProducts(productsData);

  // Выбор поставщика
  const handleSupplierClick = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedProductIds([]);
    setViewMode('products');
  }, []);

  // Выбор/снятие товара
  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProductIds(prev =>
      prev.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  }, []);

  // Подтверждение выбора
  const handleConfirmSelection = useCallback(() => {
    if (!selectedSupplier) return;

    // Получаем выбранные товары
    const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));

    // Вызываем колбэк с поставщиком и товарами
    handleSelectOrangeRoomSupplier(selectedSupplier, selectedProducts.length > 0 ? selectedProducts : undefined);

    // Сбрасываем состояние
    setViewMode('suppliers');
    setSelectedSupplier(null);
    setSelectedProductIds([]);
    setSearchQuery('');
  }, [selectedSupplier, allProducts, selectedProductIds, handleSelectOrangeRoomSupplier]);

  // Возврат к списку поставщиков
  const handleBackToSuppliers = useCallback(() => {
    setViewMode('suppliers');
    setSelectedSupplier(null);
    setSelectedProductIds([]);
    setSearchQuery('');
  }, []);

  // Закрытие модалки
  const handleClose = useCallback(() => {
    setViewMode('suppliers');
    setSelectedSupplier(null);
    setSelectedProductIds([]);
    setSearchQuery('');
    onClose();
  }, [onClose]);

  // Фильтрация поставщиков по поиску
  const filteredSuppliers = orangeRoomSuppliers.filter(supplier =>
    !searchQuery ||
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewMode === 'products' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSuppliers}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Building className="h-5 w-5 text-orange-500" />
            {viewMode === 'suppliers'
              ? 'Оранжевая комната - Аккредитованные поставщики'
              : `Товары: ${selectedSupplier?.name}`
            }
          </DialogTitle>
          <DialogDescription>
            {viewMode === 'suppliers'
              ? `Выберите поставщика для шага ${catalogSourceStep}`
              : 'Выберите товары для добавления в спецификацию (или пропустите для автозаполнения всех)'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={viewMode === 'suppliers' ? 'Поиск поставщиков...' : 'Поиск товаров...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'suppliers' ? (
            // Список поставщиков
            orangeRoomLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2 text-gray-600">Загрузка поставщиков...</span>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Поставщики не найдены</p>
                  </div>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSupplierClick(supplier)}
                      className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold text-gray-800 truncate">
                            {supplier.name}
                          </span>
                          {supplier.is_featured && (
                            <Badge className="bg-orange-500">Топ</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {supplier.category && (
                            <Badge variant="secondary" className="mr-2">
                              {supplier.category}
                            </Badge>
                          )}
                          {supplier.country && (
                            <span className="text-gray-500">📍 {supplier.country}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {supplier.public_rating && supplier.public_rating > 0 && (
                            <span>⭐ {supplier.public_rating.toFixed(1)}</span>
                          )}
                          {supplier.projects_count && supplier.projects_count > 0 && (
                            <span>📦 {supplier.projects_count} проектов</span>
                          )}
                        </div>
                      </div>
                      <div className="text-orange-500">
                        <Package className="h-5 w-5" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            // Товары поставщика с виртуализацией
            <div className="h-[50vh]">
              {selectedProductIds.length > 0 && (
                <div className="mb-3 p-2 bg-orange-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-orange-700">
                    <Check className="h-4 w-4 inline mr-1" />
                    Выбрано товаров: {selectedProductIds.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProductIds([])}
                  >
                    Сбросить
                  </Button>
                </div>
              )}

              <VirtualProductList
                supplierType="verified"
                supplierId={selectedSupplier?.id}
                search={searchQuery}
                onProductSelect={handleProductSelect}
                selectedProductIds={selectedProductIds}
                height={selectedProductIds.length > 0 ? 380 : 420}
                itemHeight={140}
                columns={1}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500">
            {viewMode === 'suppliers'
              ? `${filteredSuppliers.length} поставщиков`
              : `${allProducts.length} товаров загружено`
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            {viewMode === 'products' && (
              <Button
                onClick={handleConfirmSelection}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {selectedProductIds.length > 0
                  ? `Добавить ${selectedProductIds.length} товаров`
                  : 'Выбрать поставщика'
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
