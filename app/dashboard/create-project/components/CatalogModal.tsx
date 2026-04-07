'use client'
import { db } from "@/lib/db/client"

import React, { useState, useEffect } from 'react'
import { X, Search, Package, Building, MapPin, Star, Plus, Users, Clock, Zap, Phone, Mail, Globe, ChevronLeft, Grid3X3, List, ShoppingCart, Minus, Landmark, CreditCard, Wallet, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateProjectContext } from "../context/CreateProjectContext"
import { toast } from "@/hooks/use-toast"

// Хук для безопасного получения контекста проекта
function useOptionalCreateProjectContext() {
  try {
    return useCreateProjectContext()
  } catch (error) {
    // Если контекст недоступен, возвращаем моки
    return {
      fillSupplierData: () => {},
      setCurrentStep: () => {},
      supplierData: null
    }
  }
}
import ProductGridByCategory from '@/components/catalog/ProductGridByCategory'
import type { CatalogCategory, CatalogMode } from '@/lib/types'

interface Product {
  id: string
  name: string
  description: string
  price: string
  currency: string
  min_order: string
  in_stock: boolean
  images: string[]
  sku?: string
}

interface CartItem extends Product {
  quantity: number
  supplier_name: string
  supplier_id: string
  room_type: 'verified' | 'user'
  room_icon: string
  total_price: number
  product_name: string
  room_description: string
}

interface Supplier {
  id: string
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  contact_person?: string
  website?: string
  source_type?: 'user_added' | 'extracted_from_7steps'
  total_projects?: number
  total_spent?: number
  successful_projects?: number
  last_project_date?: string
  catalog_user_products?: Product[]
}

interface VerifiedSupplier {
  id: string
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  public_rating: number
  reviews_count: number
  projects_count: number
  is_featured: boolean
  catalog_verified_products?: Product[]
}


interface CatalogModalProps {
  open: boolean
  onClose: () => void
  onAddProducts: (products: Product[]) => void
}

// Компоненты карточек
const VerifiedSupplierCard = ({ supplier, onImport, onAddToCart }: any) => {
  const [showProducts, setShowProducts] = useState(false)
  
  return (
    <div className="border-2 border-orange-200 rounded-xl p-6 bg-gradient-to-r from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300">
      {/* Header с информацией о поставщике */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {supplier.logo_url ? (
              <img 
                src={supplier.logo_url} 
                alt={supplier.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-orange-300"
                onError={(e) => {
                  console.log(`❌ Ошибка загрузки логотипа ${supplier.name}:`, supplier.logo_url)
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) {
                    e.currentTarget.style.display = 'none'
                    fallback.style.display = 'flex'
                  }
                }}
                onLoad={(e) => {
                  console.log(`✅ Логотип загружен ${supplier.name}:`, supplier.logo_url)
                  const img = e.currentTarget as HTMLImageElement
                  if (img.naturalWidth === 0) {
                    console.log(`❌ Логотип ${supplier.name} имеет нулевую ширину`)
                    const fallback = img.nextElementSibling as HTMLElement
                    if (fallback) {
                      img.style.display = 'none'
                      fallback.style.display = 'flex'
                    }
                  }
                }}
              />
            ) : null}
            <div 
              className="w-12 h-12 rounded-lg bg-orange-200 dark:bg-orange-800 border-2 border-orange-300 dark:border-orange-600 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-lg"
              style={{ display: supplier.logo_url ? 'none' : 'flex' }}
            >
              {supplier.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-800">{supplier.name}</h3>
              <p className="text-sm text-orange-600">{supplier.company_name}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{supplier.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {supplier.country}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {Number(supplier.public_rating || 0).toFixed(1)} ({supplier.reviews_count})
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {supplier.projects_count} проектов
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowProducts(!showProducts)}
            className="flex items-center gap-1"
          >
            <Package className="w-4 h-4" />
            {showProducts ? 'Скрыть' : 'Товары'} ({supplier.catalog_verified_products?.length || 0})
          </Button>
          <Button size="sm" onClick={onImport} className="bg-orange-600 hover:bg-orange-700 text-white">
            Импорт
          </Button>
        </div>
      </div>
      
      {/* Товары поставщика */}
      {showProducts && supplier.catalog_verified_products && supplier.catalog_verified_products.length > 0 && (
        <div className="border-t border-orange-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Товары поставщика:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {supplier.catalog_verified_products.map((product: any) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{product.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      ${product.price} {product.currency} • Мин. заказ: {product.min_order}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddToCart && onAddToCart(product, supplier)}
                    className="ml-2 text-xs px-2 py-1"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {product.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const PersonalSupplierCard = ({ supplier, onAddProduct, onImport, onAddToCart }: any) => {
  const [showProducts, setShowProducts] = useState(false)
  
  return (
    <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
      {/* Header с информацией о поставщике */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {supplier.logo_url ? (
              <img 
                src={supplier.logo_url} 
                alt={supplier.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-blue-300"
                onError={(e) => {
                  console.log(`❌ Ошибка загрузки логотипа (синяя комната) ${supplier.name}:`, supplier.logo_url)
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) {
                    e.currentTarget.style.display = 'none'
                    fallback.style.display = 'flex'
                  }
                }}
                onLoad={(e) => {
                  console.log(`✅ Логотип загружен (синяя комната) ${supplier.name}:`, supplier.logo_url)
                  const img = e.currentTarget as HTMLImageElement
                  if (img.naturalWidth === 0) {
                    console.log(`❌ Логотип (синяя комната) ${supplier.name} имеет нулевую ширину`)
                    const fallback = img.nextElementSibling as HTMLElement
                    if (fallback) {
                      img.style.display = 'none'
                      fallback.style.display = 'flex'
                    }
                  }
                }}
              />
            ) : null}
            <div 
              className="w-12 h-12 rounded-lg bg-blue-200 border-2 border-blue-300 flex items-center justify-center text-blue-700 font-bold text-lg"
              style={{ display: supplier.logo_url ? 'none' : 'flex' }}
            >
              {supplier.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">{supplier.name}</h3>
              <p className="text-sm text-blue-600">{supplier.company_name}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{supplier.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {supplier.country}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {supplier.total_projects || 0} проектов
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {supplier.response_time}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowProducts(!showProducts)}
            className="flex items-center gap-1"
          >
            <Package className="w-4 h-4" />
            {showProducts ? 'Скрыть' : 'Товары'} ({supplier.catalog_user_products?.length || 0})
          </Button>
          <Button size="sm" onClick={onImport} className="bg-blue-600 hover:bg-blue-700 text-white">
            Импорт
          </Button>
        </div>
      </div>
      
      {/* Товары поставщика */}
      {showProducts && supplier.catalog_user_products && supplier.catalog_user_products.length > 0 && (
        <div className="border-t border-blue-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Товары поставщика:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {supplier.catalog_user_products.map((product: any) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{product.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      ${product.price} {product.currency} • Мин. заказ: {product.min_order}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddToCart && onAddToCart(product, supplier)}
                    className="ml-2 text-xs px-2 py-1"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {product.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// Вспомогательные функции для категорий
const getCategoryIcon = (categoryName: string): string => {
  const icons: { [key: string]: string } = {
    'Автотовары': '🚗',
    'Электроника': '📱',
    'Дом и быт': '🏠',
    'Здоровье и медицина': '⚕️',
    'Продукты питания': '🍎',
    'Промышленность': '🏭',
    'Строительство': '🏗️',
    'Текстиль и одежда': '👕'
  }
  return icons[categoryName] || '📦'
}

const getCategoryDescription = (categoryName: string): string => {
  const descriptions: { [key: string]: string } = {
    'Автотовары': 'Автомобильные запчасти и аксессуары',
    'Электроника': 'Электронные устройства и компоненты',
    'Дом и быт': 'Товары для дома и быта',
    'Здоровье и медицина': 'Медицинское оборудование и товары для здоровья',
    'Продукты питания': 'Пищевая продукция и ингредиенты',
    'Промышленность': 'Промышленное оборудование и материалы',
    'Строительство': 'Строительные материалы и инструменты',
    'Текстиль и одежда': 'Текстильная продукция и одежда'
  }
  return descriptions[categoryName] || 'Описание категории'
}


// Константы методов оплаты (как в Step4)
const paymentMethods = [
  {
    id: "bank-transfer",
    title: "Банковский перевод",
    description: "Классический SWIFT/SEPA перевод на расчётный счёт",
    icon: Landmark,
    luxuryAccent: "from-blue-500 to-indigo-500",
  },
  {
    id: "p2p",
    title: "P2P перевод",
    description: "Моментальный перевод на карту поставщика",
    icon: CreditCard,
    luxuryAccent: "from-green-500 to-lime-500",
  },
  {
    id: "crypto",
    title: "Криптовалюта",
    description: "USDT, BTC, ETH и другие сети",
    icon: Wallet,
    luxuryAccent: "from-yellow-400 to-orange-500",
  },
];

export default function CatalogModal({ open, onClose, onAddProducts }: CatalogModalProps) {
  const { fillSupplierData, setCurrentStep, supplierData } = useOptionalCreateProjectContext()
  
  // 🎯 Новое состояние для Category-First режима
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('category-first')
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const [activeRoom, setActiveRoom] = useState<'verified' | 'user'>('verified') // По умолчанию оранжевая комната
  const [authToken, setAuthToken] = useState<string | null>(null)
  
  // 🛒 Состояние корзины товаров
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  
  const [activeMode, setActiveMode] = useState<'personal' | 'verified'>('personal')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Состояния для фильтров и сортировки
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('default')
  
  // Состояния для персональных поставщиков
  const [personalSuppliers, setPersonalSuppliers] = useState<Supplier[]>([])
  const [loadingPersonal, setLoadingPersonal] = useState(false)

  // Состояния для аккредитованных поставщиков
  const [verifiedSuppliers, setVerifiedSuppliers] = useState<VerifiedSupplier[]>([])
  const [loadingVerified, setLoadingVerified] = useState(false)
  
  // Состояния для статистики категорий
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: { verified: number, user: number, total: number } }>({})
  const [loadingStats, setLoadingStats] = useState(false)
  
  // Состояния для товаров
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Состояния для мини-модального окна выбора шагов импорта
  const [showStepsModal, setShowStepsModal] = useState(false)
  const [selectedSteps, setSelectedSteps] = useState({
    step1: false, // Данные компании
    step2: false, // Товары
    step4: false, // Способ оплаты  
    step5: false  // Реквизиты поставщика
  })
  const [currentImportData, setCurrentImportData] = useState<any>(null)

  // Функция получения токена авторизации
  const getAuthToken = async () => {
    const { data: { session } } = await db.auth.getSession()
    setAuthToken(session?.access_token || null)
  }

  // Загружаем корзину из localStorage при открытии модального окна
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      // Загружаем токен
      getAuthToken()

      // Загружаем корзину из localStorage
      const savedCart = localStorage.getItem('catalog_cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setCart(parsedCart)
          console.log('✅ [CATALOG MODAL] Корзина загружена из localStorage:', parsedCart.length, 'товаров')
        } catch (error) {
          console.error('❌ [CATALOG MODAL] Ошибка загрузки корзины из localStorage:', error)
        }
      }
    }
  }, [open])

  // Сохраняем корзину в localStorage при каждом изменении
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      localStorage.setItem('catalog_cart', JSON.stringify(cart))
      if (cart.length > 0) {
        console.log('💾 [CATALOG MODAL] Корзина сохранена в localStorage:', cart.length, 'товаров')
      }
    }
  }, [cart, open])

  // Debug diagnostics removed for production

  // Загрузка персональных поставщиков
  const loadPersonalSuppliers = async () => {
    setLoadingPersonal(true)
    try {
      // Получаем токен авторизации
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        console.error('❌ [CATALOG MODAL] Нет активной сессии для загрузки персональных поставщиков');
        setPersonalSuppliers([]);
        return;
      }

      const response = await fetch('/api/catalog/user-suppliers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      
      if (data.suppliers) {
        console.log('✅ [CATALOG MODAL] Загружено персональных поставщиков:', data.suppliers.length)
        setPersonalSuppliers(data.suppliers)
      } else {
        console.log('⚠️ [CATALOG MODAL] Нет персональных поставщиков в ответе API')
        setPersonalSuppliers([])
      }
    } catch (error) {
      console.error('❌ [CATALOG MODAL] Ошибка загрузки персональных поставщиков:', error)
      setPersonalSuppliers([])
    } finally {
      setLoadingPersonal(false)
    }
  }

  // Загрузка аккредитованных поставщиков Get2B
  const loadVerifiedSuppliers = async () => {
    console.log('🚀🚀🚀 [CATALOG MODAL] *** ВЫЗОВ loadVerifiedSuppliers() ***')
    setLoadingVerified(true)
    try {
      const response = await fetch('/api/catalog/suppliers?verified=true')
      const data = await response.json()
      
      if (data.suppliers) {
        console.log('✅ [CATALOG MODAL] Загружено аккредитованных поставщиков Get2B:', data.suppliers.length)
        console.log('📊 [CATALOG MODAL] Данные поставщиков:', data.suppliers.slice(0, 2).map((s: any) => s.name))
        setVerifiedSuppliers(data.suppliers)
        console.log('🔄 [CATALOG MODAL] Состояние verifiedSuppliers обновлено, длина:', data.suppliers.length)
      } else {
        console.log('❌ [CATALOG MODAL] Нет данных поставщиков в ответе API')
        setVerifiedSuppliers([])
      }
    } catch (error) {
      console.error('❌ [CATALOG MODAL] Ошибка загрузки аккредитованных поставщиков:', error)
      setVerifiedSuppliers([])
    } finally {
      setLoadingVerified(false)
    }
  }

  // Загрузка статистики по категориям
  const loadCategoryStats = async () => {
    try {
      setLoadingStats(true)
      console.log('📊📊📊 [CatalogModal] *** ВЫЗОВ loadCategoryStats() ***')

      const response = await fetch(`/api/catalog/categories?stats=true&t=${Date.now()}`)
      const data = await response.json()

      if (data.success) {
        setCategoryStats(data.categoryStats)
        console.log('✅ [CatalogModal] Статистика загружена:', Object.keys(data.categoryStats).length)
        console.log('📊 [CatalogModal] Детали статистики:', data.categoryStats)
      } else {
        console.error('❌ [CatalogModal] Ошибка загрузки статистики:', data.error)
      }
    } catch (error) {
      console.error('❌ [CatalogModal] Критическая ошибка загрузки статистики:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Загрузка товаров поставщика
  const loadSupplierProducts = async (supplierId: string, supplierType: string = 'user') => {
    setLoadingProducts(true)
    setSupplierProducts([])
    try {
      let response
      if (supplierType === 'verified') {
        // Для аккредитованных поставщиков товары уже загружены в catalog_verified_products
        const verifiedSupplier = verifiedSuppliers.find(s => s.id === supplierId)
        if (verifiedSupplier?.catalog_verified_products) {
          console.log('✅ [CATALOG MODAL] Товары аккредитованного поставщика:', verifiedSupplier.catalog_verified_products.length)
          setSupplierProducts(verifiedSupplier.catalog_verified_products)
        } else {
          setSupplierProducts([])
        }
        return
      } else {
        // Для обычных поставщиков
        // Получаем токен авторизации
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
          console.error('❌ [CATALOG MODAL] Нет активной сессии для загрузки товаров');
          setSupplierProducts([]);
          return;
        }

        response = await fetch(`/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();
        
        if (data.products) {
          setSupplierProducts(data.products)
        } else {
          setSupplierProducts([])
        }
      }
    } catch (error) {
      console.error('❌ [CATALOG MODAL] Ошибка загрузки товаров:', error)
      setSupplierProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // Загружаем только минимальные данные при открытии модального окна
  useEffect(() => {
    console.log('🔄🔄🔄 [CatalogModal] *** useEffect [open] срабатывает, open =', open)
    if (open) {
      console.log('🔄🔄🔄 [CatalogModal] *** Модальное окно открыто, загружаем данные ***')
      getAuthToken()
      // Загружаем статистику категорий для режима "По категориям"
      loadCategoryStats()
      // Не грузим все сразу - будем грузить по требованию при переключении режимов
    }
  }, [open])

  // Сброс фильтров при смене режима + ленивая загрузка данных
  useEffect(() => {
    setCategoryFilter('all')
    setSortBy('default')

    // Загружаем данные только для активного режима
    if (open) {
      switch (activeMode) {
        case 'personal':
          if (personalSuppliers.length === 0 && !loadingPersonal) {
            console.log("🔄 [CATALOG MODAL] Загружаем персональных поставщиков по требованию")
            loadPersonalSuppliers()
          }
          break
        case 'verified':
          console.log("🔍 [CATALOG MODAL] Проверка verified:", {
            suppliersLength: verifiedSuppliers.length,
            loadingVerified,
            activeMode
          })
          if (verifiedSuppliers.length === 0 && !loadingVerified) {
            console.log("🔄 [CATALOG MODAL] Загружаем аккредитованных поставщиков по требованию")
            loadVerifiedSuppliers()
          }
          break
      }
    }
  }, [activeMode, open])

  // Получение уникальных категорий для текущего режима
  const getUniqueCategories = () => {
    const categories = new Set<string>()
    
    if (activeMode === 'personal') {
      personalSuppliers.forEach(supplier => {
        if (supplier.category) categories.add(supplier.category)
      })
    } else if (activeMode === 'verified') {
      verifiedSuppliers.forEach(supplier => {
        if (supplier.category) categories.add(supplier.category)
      })
    }
    
    return Array.from(categories).sort()
  }

  // Функция сортировки для персональных поставщиков
  const sortPersonalSuppliers = (suppliers: Supplier[]) => {
    const sorted = [...suppliers]

    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      case 'name_desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      case 'projects_desc':
        return sorted.sort((a, b) => (b.total_projects || 0) - (a.total_projects || 0))
      case 'projects_asc':
        return sorted.sort((a, b) => (a.total_projects || 0) - (b.total_projects || 0))
      case 'spent_desc':
        return sorted.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      case 'spent_asc':
        return sorted.sort((a, b) => (a.total_spent || 0) - (b.total_spent || 0))
      default:
        return sorted
    }
  }

  // Функция сортировки для аккредитованных поставщиков
  const sortVerifiedSuppliers = (suppliers: VerifiedSupplier[]) => {
    const sorted = [...suppliers]

    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      case 'name_desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      case 'rating_desc':
        return sorted.sort((a, b) => (b.public_rating || 0) - (a.public_rating || 0))
      case 'rating_asc':
        return sorted.sort((a, b) => (a.public_rating || 0) - (b.public_rating || 0))
      case 'projects_desc':
        return sorted.sort((a, b) => (b.projects_count || 0) - (a.projects_count || 0))
      case 'projects_asc':
        return sorted.sort((a, b) => (a.projects_count || 0) - (b.projects_count || 0))
      case 'featured':
        return sorted.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return (b.public_rating || 0) - (a.public_rating || 0)
        })
      default:
        return sorted.sort((a, b) => {
          // Сначала избранные, потом по рейтингу
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return (b.public_rating || 0) - (a.public_rating || 0)
        })
    }
  }

  // Фильтрация поставщиков
  const filteredPersonalSuppliers = personalSuppliers.filter(supplier => {
    // Фильтр по поиску
    const matchesSearch = supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Фильтр по категории
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const filteredVerifiedSuppliers = verifiedSuppliers.filter(supplier => {
    // Фильтр по поиску
    const matchesSearch = supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Фильтр по категории
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Обработка добавления товара в проект
  const handleAddProduct = (product: Product) => {
    onAddProducts([product])
  }

  // Обработка импорта данных из обычного поставщика в текущий проект
  const handleImportFromSupplier = (supplier: Supplier) => {
    setCurrentImportData({ type: 'supplier', data: supplier })
    setSelectedSteps({ step1: false, step2: false, step4: false, step5: false })
    setShowStepsModal(true)
  }

  // Обработка импорта данных из аккредитованного поставщика в текущий проект
  const handleImportFromVerifiedSupplier = (supplier: VerifiedSupplier) => {
    setCurrentImportData({ type: 'verified', data: supplier })
    setSelectedSteps({ step1: false, step2: false, step4: false, step5: false })
    setShowStepsModal(true)
  }

  // Выполнение импорта выбранных шагов
  const executeImport = () => {
    if (!currentImportData) return

    const { type, data } = currentImportData

    if (type === 'supplier') {
      const supplier = data as Supplier
      
      // Создаем объект данных поставщика для импорта
      const supplierImportData = {
        id: supplier.id,
        supplier_info: {
          name: supplier.name,
          company_name: supplier.company_name,
          contact_email: supplier.contact_email,
          contact_phone: supplier.contact_phone,
          city: supplier.city,
          country: supplier.country,
          payment_type: 'bank-transfer'
        },
        products: supplier.catalog_user_products ? supplier.catalog_user_products.map((p: any) => p.name) : [],
        statistics: {
          success_rate: 0,
          total_spent: 0,
          products_count: supplier.catalog_user_products ? supplier.catalog_user_products.length : 0,
          total_projects: 0,
          successful_projects: 0,
          last_project_date: ''
        },
        extraction_info: { completeness_score: 100, needs_manual_review: false }
      }

      fillSupplierData(supplierImportData, selectedSteps)
    } else if (type === 'verified') {
      const supplier = data as VerifiedSupplier
      
      // Создаем объект данных аккредитованного поставщика для импорта
      const verifiedImportData = {
        id: supplier.id,
        supplier_info: {
          name: supplier.name,
          company_name: supplier.company_name,
          contact_email: supplier.contact_email,
          contact_phone: supplier.contact_phone,
          city: supplier.city,
          country: supplier.country,
          payment_type: 'bank-transfer'
        },
        products: supplier.catalog_verified_products ? supplier.catalog_verified_products.map((p: any) => p.name) : [],
        statistics: {
          success_rate: 0,
          total_spent: 0,
          products_count: supplier.catalog_verified_products ? supplier.catalog_verified_products.length : 0,
          total_projects: 0,
          successful_projects: 0,
          last_project_date: ''
        },
        extraction_info: { completeness_score: 100, needs_manual_review: false }
      }

      fillSupplierData(verifiedImportData, selectedSteps)
    }

    // Закрываем модальные окна
    setShowStepsModal(false)
    setCurrentImportData(null)
    onClose()
    
    console.log('✅ [CATALOG MODAL] Импорт выбранных шагов завершен')
  }

  // Обработчик изменения сортировки
  const handleSortChange = (newSortBy: string) => {
    console.log('🔍 [SORT CHANGE] Изменение сортировки с', sortBy, 'на', newSortBy, 'для режима', activeMode)
    setSortBy(newSortBy)
  }

  // 🎯 Функции для определения методов оплаты поставщика (как в Step4)
  const getSupplierRequisitesCount = (methodId: string): number => {
    if (!supplierData) return 0;
    
    switch (methodId) {
      case 'bank-transfer':
        return supplierData.bank_accounts?.length || 0;
      case 'p2p':
        return supplierData.p2p_cards?.length || 0;
      case 'crypto':
        return supplierData.crypto_wallets?.length || 0;
      default:
        return 0;
    }
  };

  const getEnrichedPaymentMethods = () => {
    if (!supplierData?.payment_methods || !Array.isArray(supplierData.payment_methods)) {
      return paymentMethods.map(method => ({
        ...method,
        hasSupplierData: false,
        supplierRequisitesCount: 0
      }));
    }

    return paymentMethods.map(method => ({
      ...method,
      hasSupplierData: supplierData.payment_methods.includes(method.id),
      supplierRequisitesCount: getSupplierRequisitesCount(method.id)
    }));
  };

  // 🛒 Функции работы с корзиной
  const addToCart = (product: Product, supplier: any) => {
    // Запрет на смешивание поставщиков — один проект = один поставщик
    if (cart.length > 0 && cart[0].supplier_id && supplier.id && cart[0].supplier_id !== supplier.id) {
      toast({
        title: 'Разные поставщики',
        description: 'В одном проекте можно использовать товары только от одного поставщика. Очистите корзину, чтобы выбрать другого.',
        variant: 'destructive',
      })
      return
    }

    const cartItem: CartItem = {
      ...product,
      quantity: 1,
      supplier_name: supplier.name,
      supplier_id: supplier.id,
      room_type: supplier.room_type || 'verified',
      room_icon: supplier.room_type === 'user' ? '🔵' : '🧡',
      product_name: product.name,
      room_description: supplier.room_type === 'user' ? 'Персональные поставщики' : 'Аккредитованные поставщики',
      total_price: (parseFloat(product.price) || 0) * 1
    }

    // Проверяем есть ли уже такой товар в корзине
    const existingIndex = cart.findIndex(item =>
      item.id === product.id && item.supplier_id === supplier.id
    )

    if (existingIndex >= 0) {
      // Увеличиваем количество
      const updatedCart = [...cart]
      updatedCart[existingIndex].quantity += 1
      updatedCart[existingIndex].total_price = updatedCart[existingIndex].quantity * parseFloat(product.price)
      setCart(updatedCart)
    } else {
      // Добавляем новый товар
      setCart([...cart, cartItem])
    }

    console.log('🛒 [CART] Товар добавлен в корзину:', product.name)
  }

  const removeFromCart = (productId: string, supplierId: string) => {
    setCart(cart.filter(item => 
      !(item.id === productId && item.supplier_id === supplierId)
    ))
  }

  const updateQuantity = (productId: string, supplierId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, supplierId)
      return
    }
    
    const updatedCart = cart.map(item => {
      if (item.id === productId && item.supplier_id === supplierId) {
        return {
          ...item,
          quantity,
          total_price: quantity * (parseFloat(item.price) || 0)
        }
      }
      return item
    })
    
    setCart(updatedCart)
  }

  const clearCart = () => {
    setCart([])
    // Также очищаем localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('catalog_cart')
      localStorage.removeItem('catalog_active_supplier')
      console.log('🗑️ [CATALOG MODAL] Корзина и localStorage очищены')
    }
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[94rem] w-full max-h-[95vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="border-b-2 border-black dark:border-gray-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-black dark:text-gray-100 tracking-wide flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Каталог поставщиков
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-light mt-1">Выберите товары для вашего проекта</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Кнопка корзины */}
              <button
                onClick={() => setShowCart(!showCart)}
                className={`relative p-3 border-2 border-black dark:border-gray-600 transition-all duration-300 ${
                  showCart
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              
              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Навигация и выбор режима каталога */}
        <div className="border-b-2 border-black px-6 py-3">
          {/* 🎯 Главная навигационная панель */}
          <div className={`flex items-center ${catalogMode === 'category-first' ? 'justify-between' : 'justify-center'} mb-4`}>
            {/* Переключатель режима каталога */}
            <div className="flex border-2 border-black dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setCatalogMode('category-first')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  catalogMode === 'category-first'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                🎯 По категориям
              </button>
              <button
                onClick={() => setCatalogMode('supplier-first')}
                className={`px-6 py-3 text-sm font-medium border-l-2 border-black dark:border-gray-600 transition-all duration-300 ${
                  catalogMode === 'supplier-first'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📋 По поставщикам
              </button>
            </div>

            {/* Комнаты - показываем только в режиме категорий */}
            {catalogMode === 'category-first' && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Комнаты:</span>
                <button
                  onClick={() => {
                    setActiveRoom('verified')
                    setSelectedCategory(null) // Сбрасываем выбранную категорию при смене комнаты
                  }}
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all duration-300 rounded-lg shadow-sm ${
                    activeRoom === 'verified'
                      ? 'bg-orange-200 text-orange-800 border-orange-400'
                      : 'bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-400 hover:bg-orange-200'
                  }`}
                  title="Аккредитованные поставщики"
                >
                  🧡 Оранжевая
                </button>
                <button
                  onClick={() => {
                    setActiveRoom('user')
                    setSelectedCategory(null) // Сбрасываем выбранную категорию при смене комнаты
                  }}
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all duration-300 rounded-lg shadow-sm ${
                    activeRoom === 'user'
                      ? 'bg-blue-200 text-blue-800 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-200'
                  }`}
                  title="Персональные поставщики"
                >
                  🔵 Синяя
                </button>
              </div>
            )}
          </div>

          {/* Вторичная навигация для supplier-first режима */}
          {catalogMode === 'supplier-first' && (
            <div className="flex items-center justify-between">
              {/* Переключатель типов поставщиков */}
              <div className="flex border-2 border-black dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveMode('personal')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeMode === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  📋 Ваши поставщики ({filteredPersonalSuppliers.length})
                </button>
                <button
                  onClick={() => {
                    console.log('🧡🧡🧡 [CATALOG MODAL] *** КЛИК ПО ОРАНЖЕВОЙ КНОПКЕ ***')
                    setActiveMode('verified')
                  }}
                  className={`px-4 py-2 text-sm font-medium border-l-2 border-black dark:border-gray-600 transition-all duration-300 ${
                    activeMode === 'verified'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  🧡 Get2B каталог ({filteredVerifiedSuppliers.length})
                </button>
              </div>

              {/* Поиск */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск поставщиков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:border-gray-400 w-64 text-sm rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Фильтры и счетчики - только для supplier-first режима */}
          {catalogMode === 'supplier-first' && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-6">
                {/* Фильтр по категории */}
                {(activeMode === 'personal' || activeMode === 'verified') && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Категория:</span>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px] border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <SelectValue placeholder="Все категории" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        {getUniqueCategories().map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Сортировка */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Сортировка:</span>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px] border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="По умолчанию" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMode === 'personal' && (
                        <>
                          <SelectItem value="default">По умолчанию</SelectItem>
                          <SelectItem value="name_asc">По названию (А-Я)</SelectItem>
                          <SelectItem value="name_desc">По названию (Я-А)</SelectItem>
                          <SelectItem value="projects_desc">Больше проектов</SelectItem>
                          <SelectItem value="projects_asc">Меньше проектов</SelectItem>
                          <SelectItem value="spent_desc">Больше потрачено</SelectItem>
                          <SelectItem value="spent_asc">Меньше потрачено</SelectItem>
                        </>
                      )}
                      {activeMode === 'verified' && (
                        <>
                          <SelectItem value="default">Рекомендуемые</SelectItem>
                          <SelectItem value="featured">Избранные Get2B</SelectItem>
                          <SelectItem value="name_asc">По названию (А-Я)</SelectItem>
                          <SelectItem value="name_desc">По названию (Я-А)</SelectItem>
                          <SelectItem value="rating_desc">Выше рейтинг</SelectItem>
                          <SelectItem value="rating_asc">Ниже рейтинг</SelectItem>
                          <SelectItem value="projects_desc">Больше проектов</SelectItem>
                          <SelectItem value="projects_asc">Меньше проектов</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Счетчик результатов */}
              <div className="text-sm text-gray-500">
                {activeMode === 'personal' && `Найдено: ${filteredPersonalSuppliers.length} поставщиков`}
                {activeMode === 'verified' && `Найдено: ${filteredVerifiedSuppliers.length} аккредитованных`}
              </div>
            </div>
          )}
        </div>

        {/* Контент с корзиной */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Основной контент */}
          <div className="flex-1 overflow-y-auto">
            {catalogMode === 'category-first' ? (
              selectedCategory ? (
                <div className="p-6">
                  {/* Навигация назад */}
                  <div className="flex items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory(null)}
                      className="mr-4 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Назад к категориям
                    </Button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCategory.category === 'all' ? 'Все товары' : selectedCategory.category}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedCategory.products_count} товаров, {selectedCategory.suppliers_count} поставщиков
                      </p>
                    </div>
                  </div>
                  
                  {/* Контент в зависимости от типа категории */}
                  {selectedCategory.category === 'verified-suppliers' ? (
                    // Показываем аккредитованных поставщиков
                    <div className="grid gap-6">
                      {filteredVerifiedSuppliers.map((supplier) => (
                        <VerifiedSupplierCard
                          key={supplier.id}
                          supplier={supplier}
                          onImport={() => handleImportFromVerifiedSupplier(supplier)}
                          onAddToCart={(product: any) => handleAddProduct(product)}
                        />
                      ))}
                    </div>
                  ) : selectedCategory.category === 'user-suppliers' ? (
                    // Показываем персональных поставщиков
                    <div className="grid gap-6">
                      {filteredPersonalSuppliers.map((supplier) => (
                        <PersonalSupplierCard 
                          key={supplier.id}
                          supplier={supplier}
                          onAddProduct={handleAddProduct}
                          onImport={() => handleImportFromSupplier(supplier)}
                          onAddToCart={(product: any) => handleAddProduct(product)}
                        />
                      ))}
                    </div>
                  ) : (
                    // Сетка товаров по категории
                    <ProductGridByCategory
                      selectedCategory={selectedCategory.category}
                      token={authToken || ''}
                      onAddToCart={(product) => {
                      // Адаптируем product под формат CartItem
                      const cartProduct = {
                        id: product.id,
                        name: product.product_name,
                        description: product.description || '',
                        price: product.price || '0',
                        currency: product.currency || 'USD',
                        min_order: product.min_order || '1',
                        in_stock: product.in_stock,
                        images: product.image_url ? [product.image_url] : [],
                        sku: product.item_code || undefined
                      }
                      
                      // Добавляем в корзину с информацией о поставщике
                      addToCart(cartProduct, {
                        id: product.supplier_id,
                        name: product.supplier_name,
                        room_type: product.room_type,
                        room_icon: product.room_icon
                      })
                    }}
                    cart={cart}
                    activeSupplier={cart.length > 0 ? cart[0].supplier_name : null}
                    />
                  )}
              </div>
            ) : (
              // Показываем простой красивый селектор категорий
              <div className="p-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Выберите категорию товаров</h2>
                  <p className="text-gray-600 dark:text-gray-300">Найдите товары для вашего проекта</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from(new Set([
                    'Автотовары', 'Электроника', 'Дом и быт', 
                    'Здоровье и медицина', 'Продукты питания', 'Промышленность', 
                    'Строительство', 'Текстиль и одежда'
                  ])).map((categoryName) => {
                    const stats = categoryStats[categoryName] || { verified: 0, user: 0, total: 0 }
                    return (
                      <button
                        key={categoryName}
                        onClick={() => setSelectedCategory({
                          category: categoryName,
                          name: categoryName,
                          icon: getCategoryIcon(categoryName),
                          description: getCategoryDescription(categoryName),
                          products_count: 0,
                          suppliers_count: 0,
                          min_price: 0,
                          max_price: 0,
                          available_rooms: ['verified', 'user'],
                          countries: [],
                          rooms_info: {
                            has_verified: true,
                            has_user: true,
                            total_rooms: 2
                          }
                        })}
                        className="group flex flex-col items-center p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                          {getCategoryIcon(categoryName)}
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {categoryName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight mb-3">
                          {getCategoryDescription(categoryName)}
                        </p>
                        
                        {/* Счетчик товаров для активной комнаты */}
                        <div className="flex items-center justify-center text-xs">
                          {activeRoom === 'verified' ? (
                            <span className={`px-3 py-1.5 rounded-full font-semibold ${
                              stats.verified > 0 
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            }`}>
                              {stats.verified} {stats.verified === 1 ? 'товар' : 'товаров'}
                            </span>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-full font-semibold ${
                              stats.user > 0 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            }`}>
                              {stats.user} {stats.user === 1 ? 'товар' : 'товаров'}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
            ) : (
            // 📋 Старый Supplier-First режим
            <div className="p-6">
              {activeMode === 'personal' ? (
                // Персональные поставщики
                <div className="space-y-6">
                  {loadingPersonal ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка ваших поставщиков...</div>
                    </div>
                  ) : filteredPersonalSuppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Поставщики не найдены</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {searchQuery ? 'Попробуйте изменить запрос поиска' : 'У вас пока нет добавленных поставщиков'}
                      </div>
                    </div>
                  ) : (
                    sortPersonalSuppliers(filteredPersonalSuppliers).map((supplier) => (
                  <div key={supplier.id} className="border-2 border-black dark:border-gray-600 p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6 flex-1">
                        {/* Логотип */}
                        <div className="w-24 h-24 border-2 border-black dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                          {supplier.logo_url ? (
                            <img 
                              src={supplier.logo_url} 
                              alt={`Логотип ${supplier.name || supplier.company_name}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building className="w-12 h-12 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xl font-light text-black dark:text-gray-100 tracking-wide">
                              {supplier.name || supplier.company_name || 'Поставщик без названия'}
                            </h3>
                            <div className="w-px h-6 bg-black dark:bg-gray-600"></div>
                            <span className="bg-blue-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                              {supplier.category || 'Категория не указана'}
                            </span>
                            {supplier.source_type === 'extracted_from_7steps' && (
                              <span className="bg-green-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                                ИЗ ПРОЕКТОВ
                              </span>
                            )}
                          </div>
                        
                          {/* Местоположение */}
                          <div className="flex items-center gap-3 mb-4">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">
                              {supplier.city || 'Город не указан'}, {supplier.country || 'Страна не указана'}
                            </span>
                          </div>

                          {/* Описание */}
                          {supplier.description && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 line-clamp-2">{supplier.description}</p>
                            </div>
                          )}

                          {/* Статистика проектов */}
                          {((supplier.total_projects ?? 0) > 0 || (supplier.total_spent ?? 0) > 0) && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-blue-700 font-medium">
                                  📊 Проектов: {supplier.total_projects ?? 0}
                                </span>
                                {(supplier.successful_projects ?? 0) > 0 && (
                                  <span className="text-green-600">
                                    ✅ Успешных: {supplier.successful_projects}
                                  </span>
                                )}
                                {(supplier.total_spent ?? 0) > 0 && (
                                  <span className="text-purple-600">
                                    💰 Потрачено: ${(supplier.total_spent ?? 0).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Контактная информация */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                            {supplier.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{supplier.contact_email}</span>
                              </div>
                            )}
                            {supplier.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{supplier.contact_phone}</span>
                              </div>
                            )}
                            {supplier.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span>{supplier.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий */}
                      <div className="ml-6 flex flex-col gap-2">
                        {/* Кнопка просмотра товаров */}
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            loadSupplierProducts(supplier.id, 'user')
                          }}
                          className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors font-medium uppercase tracking-wider text-xs flex items-center gap-2"
                        >
                          <Package className="w-3 h-3" />
                          ТОВАРЫ
                        </button>
                        
                        {/* Кнопка импорта в текущий проект */}
                        <button
                          onClick={() => {
                            handleImportFromSupplier(supplier)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors font-medium uppercase tracking-wider text-xs flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          ИМПОРТИРОВАТЬ
                        </button>
                      </div>
                    </div>
                  </div>
                    ))
                  )}
                </div>
          ) : (
            // Аккредитованные поставщики Get2B
            <div className="space-y-6">
              {loadingVerified ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Загрузка аккредитованных поставщиков Get2B...</div>
                </div>
              ) : filteredVerifiedSuppliers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Аккредитованные поставщики не найдены</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {searchQuery ? 'Попробуйте изменить запрос поиска' : 'Пока нет аккредитованных поставщиков в системе'}
                  </div>
                </div>
              ) : (
                sortVerifiedSuppliers(filteredVerifiedSuppliers).map((supplier) => (
                  <div key={supplier.id} className="border-2 border-orange-300 dark:border-orange-600 p-6 bg-orange-50 dark:bg-orange-900/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6 flex-1">
                        {/* Логотип */}
                        <div className="w-24 h-24 border-2 border-orange-400 dark:border-orange-600 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                          {supplier.logo_url ? (
                            <img 
                              src={supplier.logo_url} 
                              alt={`Логотип ${supplier.name || supplier.company_name}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-2xl mb-1">🧠</div>
                              <div className="text-xs text-orange-700 dark:text-orange-300 font-bold">GET2B</div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xl font-light text-black dark:text-gray-100 tracking-wide">
                              {supplier.name || supplier.company_name || 'Аккредитованный поставщик'}
                            </h3>
                            <div className="w-px h-6 bg-orange-400"></div>
                            <span className="bg-orange-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                              {supplier.category || 'Категория не указана'}
                            </span>
                            {supplier.is_featured && (
                              <span className="bg-yellow-500 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                                ⭐ РЕКОМЕНДУЕМ
                              </span>
                            )}
                            <span className="bg-green-100 text-green-800 px-3 py-1 text-xs border border-green-200 rounded">
                              ✓ Аккредитован Get2B
                            </span>
                          </div>
                        
                          {/* Местоположение */}
                          <div className="flex items-center gap-3 mb-4">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">
                              {supplier.city || 'Город не указан'}, {supplier.country || 'Страна не указана'}
                            </span>
                          </div>

                          {/* Описание */}
                          {supplier.description && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 line-clamp-2">{supplier.description}</p>
                            </div>
                          )}

                          {/* Статистика */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="border-l-4 border-orange-600 pl-4">
                              <div className="text-2xl font-light text-black dark:text-gray-100">{Number(supplier.public_rating || 0).toFixed(1)}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Рейтинг</div>
                            </div>
                            <div className="border-l-4 border-blue-600 pl-4">
                              <div className="text-2xl font-light text-black dark:text-gray-100">{supplier.projects_count}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Проектов</div>
                            </div>
                            <div className="border-l-4 border-green-600 pl-4">
                              <div className="text-2xl font-light text-black dark:text-gray-100">{supplier.reviews_count}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider">Отзывов</div>
                            </div>
                          </div>

                          {/* Контактная информация */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                            {supplier.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{supplier.contact_email}</span>
                              </div>
                            )}
                            {supplier.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{supplier.contact_phone}</span>
                              </div>
                            )}
                            {supplier.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span>{supplier.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий */}
                      <div className="ml-6 flex flex-col gap-2">
                        {/* Кнопка просмотра товаров */}
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier as any)
                            loadSupplierProducts(supplier.id, 'verified')
                          }}
                          className="bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 transition-colors font-medium uppercase tracking-wider text-xs flex items-center gap-2"
                        >
                          <Package className="w-3 h-3" />
                          ТОВАРЫ
                        </button>
                        
                        {/* Кнопка импорта в текущий проект */}
                        <button
                          onClick={() => {
                            handleImportFromVerifiedSupplier(supplier)
                          }}
                          className="bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 transition-colors font-medium uppercase tracking-wider text-xs flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          ИМПОРТИРОВАТЬ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
            </div>
          )}
        </div>

        {/* Модальное окно просмотра товаров поставщика */}
        {selectedSupplier && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg max-w-[72rem] w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
              {/* Header товаров */}
              <div className="border-b-2 border-black p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-light text-black tracking-wide">
                      Товары поставщика: {selectedSupplier.name || selectedSupplier.company_name}
                    </h3>
                    <div className="w-24 h-0.5 bg-black mt-2"></div>
                  </div>
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Список товаров */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingProducts ? (
                  <div className="text-center py-12">
                    <div className="text-lg text-gray-600">Загрузка товаров...</div>
                  </div>
                ) : supplierProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-lg text-gray-600">У поставщика пока нет товаров</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {supplierProducts.map((product) => (
                      <div key={product.id} className="border-2 border-gray-200 p-6 hover:border-blue-400 transition-all">
                        {/* Изображение товара */}
                        <div className="w-full h-48 bg-gray-100 border border-gray-300 flex items-center justify-center mb-4">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">ФОТО ТОВАРА</span>
                          )}
                        </div>

                        {/* Информация о товаре */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-black text-lg line-clamp-2">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">{product.description}</p>
                          )}

                          {/* Цена и характеристики */}
                          <div className="space-y-2">
                            {product.price && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Цена:</span>
                                <span className="font-semibold text-lg text-blue-600">
                                  {product.price} {product.currency || 'USD'}
                                </span>
                              </div>
                            )}
                            
                            {product.min_order && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Мин. заказ:</span>
                                <span className="text-gray-800 text-sm">{product.min_order}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">В наличии:</span>
                              <span className={`text-sm font-medium ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                                {product.in_stock ? 'Да' : 'Нет'}
                              </span>
                            </div>
                            
                            {product.sku && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Артикул:</span>
                                <span className="text-gray-800 text-sm font-mono">{product.sku}</span>
                              </div>
                            )}
                          </div>

                          {/* Кнопка добавления в корзину */}
                          <button
                            onClick={() => addToCart(product, selectedSupplier)}
                            className="w-full bg-green-600 text-white py-3 hover:bg-green-700 transition-colors font-medium uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Добавить в корзину
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

        {/* 🛒 Модальное окно корзины */}
          {showCart && (
            <div className="absolute top-0 right-0 w-96 h-full border-l-2 border-black bg-gray-50 flex flex-col shadow-2xl z-10">
              {/* Header корзины */}
              <div className="p-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-black">Корзина товаров</h3>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Очистить
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getTotalItems()} товаров на сумму ${getTotalPrice().toFixed(2)}
                </p>
              </div>

              {/* Товары в корзине */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Корзина пуста</p>
                    <p className="text-sm text-gray-500 mt-1">Добавьте товары из каталога</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.id}-${item.supplier_id}`} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-3 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-black dark:text-gray-100 line-clamp-2">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">{item.supplier_name}</span>
                            <span className="text-xs">{item.room_icon}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.supplier_id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.supplier_id, item.quantity - 1)}
                            className="w-6 h-6 border border-gray-400 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.supplier_id, item.quantity + 1)}
                            className="w-6 h-6 border border-gray-400 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm font-medium">${Number(item.total_price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 💳 Блок с методами оплаты поставщика */}
              {cart.length > 0 && supplierData && (
                <div className="p-4 border-t border-gray-300 bg-gray-100">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Способы оплаты поставщика:</h4>
                    <div className="space-y-2">
                      {getEnrichedPaymentMethods().map((method) => {
                        const Icon = method.icon;
                        const isRecommended = method.hasSupplierData;
                        return (
                          <div
                            key={method.id}
                            className={`flex items-center justify-between p-2 rounded-md border text-xs ${
                              isRecommended 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-orange-50 border-orange-200 text-orange-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="font-medium">{method.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isRecommended ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="font-medium">
                                    {method.supplierRequisitesCount > 1 
                                      ? `${method.supplierRequisitesCount} реквизитов`
                                      : 'Есть реквизиты'
                                    }
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Ручной ввод</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer корзины с кнопкой добавления */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <div className="mb-3">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Итого:</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      console.log('🛒 Добавляем корзину в проект:', cart)
                      
                      // Конвертируем cart items в формат Product[]
                      const productsToAdd: Product[] = cart.map((item: CartItem) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        currency: item.currency,
                        min_order: item.min_order,
                        in_stock: item.in_stock,
                        images: item.images,
                        sku: item.sku,
                        // Добавляем информацию о количестве, поставщике и источнике для Step2
                        quantity: item.quantity,
                        supplier_name: item.supplier_name,
                        supplier_id: item.supplier_id,
                        room_type: item.room_type,
                      } as Product & { quantity: number, supplier_name: string, supplier_id: string, room_type: string }))
                      
                      console.log('📦 Передаем товары в Step2:', productsToAdd)
                      console.log('🚨🚨🚨 [CART] Вызываем onAddProducts с корзиной:', productsToAdd.length, 'товаров')
                      onAddProducts(productsToAdd)
                      console.log('✅ [CART] onAddProducts вызван из корзины с товарами:', productsToAdd.length)

                      // Очищаем корзину и localStorage после успешного добавления
                      clearCart()
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('catalog_cart')
                        localStorage.removeItem('catalog_active_supplier')
                        console.log('🗑️ [CATALOG MODAL] localStorage очищен после добавления в проект')
                      }

                      onClose()
                    }}
                    className="w-full bg-green-600 text-white py-3 hover:bg-green-700 transition-colors font-medium uppercase tracking-wider text-sm"
                  >
                    Добавить в проект ({getTotalItems()})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Мини-модальное окно выбора шагов для импорта */}
        {showStepsModal && currentImportData && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg max-w-lg w-full mx-4 shadow-2xl">
              {/* Header */}
              <div className="border-b-2 border-black p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-light text-black tracking-wide">
                      Выберите шаги для импорта
                    </h3>
                    <div className="w-24 h-0.5 bg-black mt-2"></div>
                    <p className="text-sm text-gray-600 mt-3">
                      От поставщика: {currentImportData.data.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowStepsModal(false)
                      setCurrentImportData(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Чекбоксы шагов */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {/* Шаг 1 */}
                  <label className="flex items-start space-x-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSteps.step1}
                      onChange={(e) => setSelectedSteps({...selectedSteps, step1: e.target.checked})}
                      className="w-5 h-5 text-black bg-gray-100 border-2 border-gray-300 rounded focus:ring-black focus:ring-2 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-base font-medium text-black mb-1">Шаг 1: Данные компании</div>
                      <div className="text-sm text-gray-600">Название компании, контактные данные</div>
                    </div>
                  </label>

                  {/* Шаг 2 */}
                  <label className="flex items-start space-x-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSteps.step2}
                      onChange={(e) => setSelectedSteps({...selectedSteps, step2: e.target.checked})}
                      className="w-5 h-5 text-black bg-gray-100 border-2 border-gray-300 rounded focus:ring-black focus:ring-2 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-base font-medium text-black mb-1">Шаг 2: Товары</div>
                      <div className="text-sm text-gray-600">
                        Товары поставщика
                      </div>
                    </div>
                  </label>

                  {/* Шаг 4 */}
                  <label className="flex items-start space-x-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSteps.step4}
                      onChange={(e) => setSelectedSteps({...selectedSteps, step4: e.target.checked})}
                      className="w-5 h-5 text-black bg-gray-100 border-2 border-gray-300 rounded focus:ring-black focus:ring-2 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-base font-medium text-black mb-1">Шаг 4: Способ оплаты</div>
                      <div className="text-sm text-gray-600">
                        {'Банковский перевод (по умолчанию)'
                        }
                      </div>
                    </div>
                  </label>

                  {/* Шаг 5 */}
                  <label className="flex items-start space-x-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSteps.step5}
                      onChange={(e) => setSelectedSteps({...selectedSteps, step5: e.target.checked})}
                      className="w-5 h-5 text-black bg-gray-100 border-2 border-gray-300 rounded focus:ring-black focus:ring-2 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-base font-medium text-black mb-1">Шаг 5: Реквизиты поставщика</div>
                      <div className="text-sm text-gray-600">Email, телефон, адрес</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer с кнопками */}
              <div className="border-t-2 border-black p-6 flex items-center justify-end">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setShowStepsModal(false)
                      setCurrentImportData(null)
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 transition-colors uppercase tracking-wider"
                  >
                    ОТМЕНИТЬ
                  </button>
                  
                  <button
                    onClick={executeImport}
                    disabled={!Object.values(selectedSteps).some(Boolean)}
                    className="px-6 py-3 text-sm font-medium text-white hover:text-blue-500 bg-black border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 uppercase tracking-wider"
                  >
                    ИМПОРТИРОВАТЬ ВЫБРАННЫЕ ШАГИ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}