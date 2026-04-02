"use client"

import { logger } from "@/src/shared/lib/logger";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart,
  Search,
  Package,
  Building2,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/db/client";
import { useToast } from "@/components/ui/use-toast";
interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  country?: string;
  city?: string;
  category?: string;
  logo_url?: string;
  room_type: 'verified' | 'user';
  bank_accounts?: any[];
  crypto_wallets?: any[];
  p2p_cards?: any[];
}

interface SpecificationItem {
  id: string;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  image_url?: string;
  category_name?: string;
  subcategory_name?: string;
}

interface SelectedItem extends SpecificationItem {
  selected: boolean;
  proforma_quantity?: number;
  proforma_price?: number;
}

interface ProformaTemplate {
  name: string;
  size: number;
  created_at: string;
  updated_at: string;
  storage_path: string;
}

interface ProformaSelectionModalProps {
  open: boolean;
  onClose: () => void;
  specificationItems: SpecificationItem[];
  projectId: string;
}

type ModalStep = 'suppliers' | 'items' | 'preview';

const ProformaSelectionModal: React.FC<ProformaSelectionModalProps> = ({
  open,
  onClose,
  specificationItems,
  projectId
}) => {
  const { toast } = useToast();

  // States
  const [currentStep, setCurrentStep] = useState<ModalStep>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<ProformaTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProformaTemplate | null>(null);

  // Load suppliers on modal open
  useEffect(() => {
    if (open) {
      loadSuppliers();
      resetModal();
    }
  }, [open]);

  // Filter suppliers based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchQuery, suppliers]);

  // Initialize selected items when supplier is chosen
  useEffect(() => {
    if (selectedSupplier && currentStep === 'items') {
      const itemsWithSelection = specificationItems.map(item => ({
        ...item,
        selected: true, // By default select all items
        proforma_quantity: item.quantity,
        proforma_price: item.price
      }));
      setSelectedItems(itemsWithSelection);
    }
  }, [selectedSupplier, currentStep, specificationItems]);

  const resetModal = () => {
    setCurrentStep('suppliers');
    setSelectedSupplier(null);
    setSelectedItems([]);
    setSearchQuery('');
  };

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      // Load verified suppliers
      const { data: verifiedSuppliers, error: verifiedError } = await db
        .from('catalog_verified_suppliers')
        .select('id, name, company_name, country, city, category, logo_url, bank_accounts, crypto_wallets, p2p_cards')
        .eq('is_active', true);

      // Load user suppliers
      const { data: userSuppliers, error: userError } = await db
        .from('catalog_user_suppliers')
        .select('id, name, company_name, country, city, category, logo_url, bank_accounts, crypto_wallets, p2p_cards')
        .eq('is_active', true);

      if (verifiedError) {
        logger.error('Error loading verified suppliers:', verifiedError);
      }
      if (userError) {
        logger.error('Error loading user suppliers:', userError);
      }

      const allSuppliers: Supplier[] = [
        ...(verifiedSuppliers || []).map(s => ({ ...s, room_type: 'verified' as const })),
        ...(userSuppliers || []).map(s => ({ ...s, room_type: 'user' as const }))
      ];

      setSuppliers(allSuppliers);
      setFilteredSuppliers(allSuppliers);
    } catch (error) {
      logger.error('Error loading suppliers:', error);
      toast({
        title: "❌ Ошибка загрузки",
        description: "Не удалось загрузить список поставщиков",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierSelect = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);

    // Загружаем шаблоны поставщика
    try {
      setIsLoading(true);

      const response = await fetch(`/api/supplier-templates?supplierId=${supplier.id}&supplierType=${supplier.room_type}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      logger.error("❌ Ошибка загрузки шаблонов:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }

    setCurrentStep('items');
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, proforma_quantity: quantity }
          : item
      )
    );
  };

  const handleItemPriceChange = (itemId: string, price: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, proforma_price: price }
          : item
      )
    );
  };

  const getSelectedItemsForGeneration = () => {
    return selectedItems
      .filter(item => item.selected)
      .map(item => ({
        item_name: item.item_name,
        item_code: item.item_code || '',
        quantity: item.proforma_quantity || item.quantity,
        unit: item.unit,
        price: item.proforma_price || item.price,
        total: (item.proforma_quantity || item.quantity) * (item.proforma_price || item.price)
      }));
  };

  const handleGenerateProforma = async () => {
    if (!selectedSupplier || !projectId) return;

    const itemsForGeneration = getSelectedItemsForGeneration();
    if (itemsForGeneration.length === 0) {
      toast({
        title: "❌ Ошибка",
        description: "Выберите хотя бы один товар для проформы",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-supplier-proforma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          supplierId: selectedSupplier.id,
          supplierData: selectedSupplier,
          specificationItems: itemsForGeneration,
          templatePath: selectedTemplate?.storage_path || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Download Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const supplierName = (selectedSupplier.name || selectedSupplier.company_name || 'supplier')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_');
      a.download = `proforma_${supplierName}_${Date.now()}.xlsx`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Проформа создана",
        description: `Проформа для "${selectedSupplier.name}" успешно скачана`,
        variant: "default"
      });

      onClose();
    } catch (error) {
      logger.error('Error generating proforma:', error);
      toast({
        title: "❌ Ошибка генерации",
        description: "Не удалось создать проформу. Попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalSelectedItems = selectedItems.filter(item => item.selected).length;
  const totalAmount = selectedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + ((item.proforma_quantity || item.quantity) * (item.proforma_price || item.price)), 0);

  const renderSuppliersStep = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск по названию, компании или категории..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 border-2 border-blue-200 rounded-xl focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Выберите поставщика для создания проформы</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Доступно {filteredSuppliers.length} поставщиков из каталога с готовыми проформами
            </p>
          </div>
        </div>
      </div>

      {/* Suppliers list */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-300">Загружаем поставщиков...</p>
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Поставщики не найдены' : 'Нет доступных поставщиков'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Проверьте подключение к каталогу'}
            </p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
              onClick={() => handleSupplierSelect(supplier)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  {/* Logo or Icon */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden group-hover:shadow-lg transition-shadow border border-gray-200">
                    {supplier.logo_url ? (
                      <>
                        <img
                          src={supplier.logo_url}
                          alt={`${supplier.name} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            target.style.display = 'none';
                            const fallback = parent?.querySelector('.fallback-icon') as HTMLElement;
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }}
                        />
                        <div className="fallback-icon hidden w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                          <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{supplier.name}</h3>
                      <Badge
                        variant={supplier.room_type === 'verified' ? 'default' : 'secondary'}
                        className={supplier.room_type === 'verified'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {supplier.room_type === 'verified' ? 'Проверенный' : 'Пользователь'}
                      </Badge>
                    </div>

                    {supplier.company_name && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3 truncate">{supplier.company_name}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {supplier.country}{supplier.city && `, ${supplier.city}`}
                          </span>
                        </div>
                      )}
                      {supplier.category && (
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span className="truncate">{supplier.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment methods indicators */}
                    <div className="flex items-center gap-2 mt-3">
                      {supplier.bank_accounts && supplier.bank_accounts.length > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md text-xs">
                          <Check className="w-3 h-3" />
                          Банк
                        </div>
                      )}
                      {supplier.crypto_wallets && supplier.crypto_wallets.length > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-md text-xs">
                          <Check className="w-3 h-3" />
                          Крипто
                        </div>
                      )}
                      {supplier.p2p_cards && supplier.p2p_cards.length > 0 && (
                        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md text-xs">
                          <Check className="w-3 h-3" />
                          P2P
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  const renderItemsStep = () => (
    <div className="space-y-6">
      {/* Selected supplier info */}
      {selectedSupplier && (
        <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">{selectedSupplier.name}</h3>
            <Badge variant={selectedSupplier.room_type === 'verified' ? 'default' : 'secondary'}>
              {selectedSupplier.room_type === 'verified' ? 'Проверенный' : 'Пользователь'}
            </Badge>
          </div>
          {selectedSupplier.company_name && (
            <p className="text-sm text-blue-700 dark:text-blue-400">{selectedSupplier.company_name}</p>
          )}
        </div>
      )}

      {/* Template selection */}
      {templates.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-orange-900 dark:text-orange-300">Доступные шаблоны проформ</h3>
            <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
              {templates.length} шт
            </Badge>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
            Используйте оригинальные шаблоны от поставщика или создайте стандартную проформу
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* Default option - no template */}
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <input
                type="radio"
                name="template"
                value=""
                checked={!selectedTemplate}
                onChange={() => setSelectedTemplate(null)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex items-center gap-2 flex-1">
                <FileBarChart className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Стандартная проформа</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Создать новую проформу с нуля</div>
                </div>
              </div>
            </label>

            {/* Template options */}
            {templates.map((template) => (
              <label
                key={template.storage_path}
                className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              >
                <input
                  type="radio"
                  name="template"
                  value={template.storage_path}
                  checked={selectedTemplate?.storage_path === template.storage_path}
                  onChange={() => setSelectedTemplate(template)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Размер: {(template.size / 1024).toFixed(1)} KB •
                      Загружен: {new Date(template.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Items selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Выберите товары для проформы</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Выбрано: {totalSelectedItems} из {selectedItems.length}
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border-b border-gray-100 last:border-b-0 ${
                item.selected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => handleItemToggle(item.id)}
                />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Название</label>
                    <div className="font-medium">{item.item_name}</div>
                    {item.item_code && (
                      <div className="text-xs text-gray-500">Код: {item.item_code}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Количество</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.proforma_quantity || item.quantity}
                      onChange={(e) => handleItemQuantityChange(item.id, Number(e.target.value))}
                      disabled={!item.selected}
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Цена за ед.</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.proforma_price || item.price}
                      onChange={(e) => handleItemPriceChange(item.id, Number(e.target.value))}
                      disabled={!item.selected}
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Сумма</label>
                    <div className="mt-1 font-semibold text-green-600">
                      ${((item.proforma_quantity || item.quantity) * (item.proforma_price || item.price)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Общая сумма:</span>
            <span className="text-xl font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const selectedItemsForPreview = selectedItems.filter(item => item.selected);
    const isUsingTemplate = selectedTemplate !== null;

    return (
      <div className="space-y-6">
        {/* Preview header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">Предпросмотр проформы</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {isUsingTemplate
                  ? `Использует шаблон: ${selectedTemplate.name}`
                  : 'Стандартная проформа'}
              </p>
            </div>
          </div>
        </div>

        {/* Excel-style preview */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          {/* Excel toolbar mockup */}
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                proforma_{selectedSupplier?.name?.replace(/\s+/g, '_')}_${projectId}.xlsx
              </span>
            </div>
          </div>

          {/* Excel sheet content */}
          <div className="p-6 font-mono text-sm text-gray-900 dark:text-gray-100">
            {isUsingTemplate ? (
              /* Template preview */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded">
                    📄 Шаблон от поставщика: {selectedTemplate.name}
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded p-4">
                  <p className="text-yellow-800 dark:text-yellow-300 text-center">
                    Оригинальная структура проформы поставщика будет сохранена
                  </p>
                </div>

                <div className="border-t-2 border-gray-400 pt-4">
                  <h4 className="font-bold text-lg mb-2">+ ТОВАРЫ ИЗ СПЕЦИФИКАЦИИ ПРОЕКТА:</h4>
                </div>
              </div>
            ) : (
              /* Standard template preview */
              <div className="space-y-2">
                <div className="text-center text-lg font-bold">ПРОФОРМА-ИНВОЙС</div>
                <div className="text-right">Дата: {currentDate}</div>
                <div>Проект: {projectId}</div>
                <div className="mt-4">
                  <div className="font-bold">ПОСТАВЩИК:</div>
                  <div>Название: {selectedSupplier?.name || 'Не указано'}</div>
                  <div>Компания: {selectedSupplier?.company_name || 'Не указано'}</div>
                  <div>Страна: {selectedSupplier?.country || 'Не указано'}</div>
                  <div>Город: {selectedSupplier?.city || 'Не указано'}</div>
                </div>
                <div className="mt-4 font-bold">СПЕЦИФИКАЦИЯ ТОВАРОВ:</div>
              </div>
            )}

            {/* Items table with category grouping */}
            <div className="mt-4 overflow-x-auto">
              {(() => {
                // Group items by category
                const itemsByCategory = selectedItemsForPreview.reduce((acc: Record<string, any[]>, item) => {
                  const category = item.category_name || 'Без категории';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
                }, {} as Record<string, any[]>);

                let itemIndex = 0;

                return (
                  <table className="w-full border-collapse border border-gray-400 dark:border-gray-500 dark:border-gray-500">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-center">№</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Наименование</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Код</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Кол-во</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Ед.изм.</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Цена ($)</th>
                        <th className="border border-gray-400 dark:border-gray-500 px-2 py-1">Сумма ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(itemsByCategory).map(([category, items]) => (
                        <React.Fragment key={category}>
                          {/* Category header */}
                          <tr className="bg-blue-50 dark:bg-blue-900/30">
                            <td className="border border-gray-400 dark:border-gray-500 px-2 py-2 font-bold text-blue-800" colSpan={7}>
                              📦 {category}
                              {items.length > 1 && (
                                <span className="ml-2 text-sm font-normal text-blue-600">
                                  ({(items as any[]).length} позиций)
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Items in this category */}
                          {(items as any[]).map((item: any) => {
                            itemIndex++;
                            const quantity = item.proforma_quantity || 0;
                            const price = item.proforma_price || 0;
                            const total = quantity * price;

                            return (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-center">{itemIndex}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1">{item.item_name}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1">{item.item_code || ''}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-center">{quantity}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-center">{item.unit}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-right">{price.toFixed(2)}</td>
                                <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-right font-semibold">{total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}

                      {/* Total row */}
                      <tr className="bg-yellow-50 dark:bg-yellow-900/30 font-bold">
                        <td className="border border-gray-400 dark:border-gray-500 px-2 py-1" colSpan={6}>ИТОГО:</td>
                        <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-right text-lg">${totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Footer info */}
            <div className="mt-6 space-y-2 text-xs text-gray-600">
              <div className="font-bold">РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ:</div>
              <div>Банковские реквизиты и платежная информация будут добавлены автоматически</div>
              <div className="mt-4">
                <div>ID поставщика: {selectedSupplier?.id}</div>
                <div>Создано: {new Date().toLocaleString('ru-RU')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerateProforma}
          disabled={isGenerating || totalSelectedItems === 0}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-12"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Генерируется...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Скачать проформу Excel
            </>
          )}
        </Button>
      </div>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'suppliers': return 'Выберите поставщика';
      case 'items': return 'Настройте товары';
      case 'preview': return 'Проверьте и скачайте';
      default: return 'Доступные проформы';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'suppliers': return 'Выберите поставщика из каталога для создания персональной проформы';
      case 'items': return 'Выберите товары из спецификации и настройте количество';
      case 'preview': return 'Проверьте данные и скачайте готовую проформу Excel';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <FileBarChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{getStepTitle()}</h2>
                <p className="text-sm text-gray-600 mt-1">{getStepDescription()}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Enhanced Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {/* Step 1 */}
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                    currentStep === 'suppliers'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : currentStep === 'items' || currentStep === 'preview'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep === 'items' || currentStep === 'preview' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      '1'
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200">Поставщик</div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`w-12 h-1 rounded-full transition-colors ${
                  currentStep === 'items' || currentStep === 'preview' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 2 */}
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                    currentStep === 'items'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : currentStep === 'preview'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep === 'preview' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      '2'
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200">Товары</div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`w-12 h-1 rounded-full transition-colors ${
                  currentStep === 'preview' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 3 */}
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                    currentStep === 'preview'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200">Проформа</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step content */}
          {currentStep === 'suppliers' && renderSuppliersStep()}
          {currentStep === 'items' && renderItemsStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </div>

        <DialogFooter className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            {currentStep !== 'suppliers' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'items') setCurrentStep('suppliers');
                  if (currentStep === 'preview') setCurrentStep('items');
                }}
                className="h-11 px-6 rounded-xl border-2 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            )}
          </div>

          {/* Progress info */}
          {currentStep === 'items' && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              Выбрано товаров: {totalSelectedItems} • Сумма: ${totalAmount.toFixed(2)}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-11 px-6 rounded-xl border-2 hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </Button>

            {currentStep === 'suppliers' && selectedSupplier && (
              <Button
                onClick={() => setCurrentStep('items')}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {currentStep === 'items' && totalSelectedItems > 0 && (
              <Button
                onClick={() => setCurrentStep('preview')}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Предпросмотр
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProformaSelectionModal;