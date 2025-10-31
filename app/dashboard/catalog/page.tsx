'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Star, MapPin, Phone, Mail, Globe, Building, Users, Package, Filter, CheckCircle, Clock, Zap, X, Upload, Image as ImageIcon, Edit, Trash2, Save, MessageCircle, Heart, ShoppingCart, Grid3X3, List, ArrowLeft } from 'lucide-react'

import { motion } from "framer-motion"
import { CATEGORY_CERTIFICATIONS } from '@/components/catalog-categories-and-certifications'
import { supabase } from '@/lib/supabaseClient'
import { AddSupplierModal } from './components/AddSupplierModal'
import InlineCategoryList from '@/components/catalog/InlineCategoryList'
import SubcategoryList from '@/components/catalog/SubcategoryList'
import ProductGridByCategory from '@/components/catalog/ProductGridByCategory'
import type { CatalogCategory } from '@/lib/types'

export default function CatalogPage() {
  const router = useRouter()
  
  // Состояние для Supabase подключения
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true)

  // Состояния для динамических категорий из API
  const [apiCategories, setApiCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Проверка подключения к Supabase при загрузке
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Импортируем динамически для избежания ошибок на сервере
        const { supabase } = await import('@/lib/supabaseClient')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[SUPABASE CONNECTION ERROR]', error)
          setSupabaseError(error.message)
          setSupabaseConnected(false)
        } else {
          setSupabaseConnected(true)
          setSupabaseError(null)
        }
      } catch (err) {
        console.error('[SUPABASE IMPORT ERROR]', err)
        setSupabaseError('Ошибка загрузки Supabase клиента')
        setSupabaseConnected(false)
      }
    }

    checkSupabaseConnection()
  }, [])

  // Функция загрузки пользовательских поставщиков из API
  const loadSuppliersFromAPI = async () => {
    console.log('🔄 [DEBUG] Начинаем загрузку поставщиков из API...');
    setLoadingSuppliers(true)
    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Нет активной сессии для загрузки поставщиков');
        setRealSuppliers([]);
        return;
      }

      console.log('✅ [DEBUG] Сессия найдена, делаем запрос к API...');
      const response = await fetch('/api/catalog/user-suppliers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      console.log('📡 [DEBUG] Ответ API получен, статус:', response.status);
      const data = await response.json();
      console.log('📊 [DEBUG] Данные ответа API:', data);
      
      if (data.suppliers) {
        console.log('✅ Загружено пользовательских поставщиков:', data.suppliers.length)
        console.log('📊 Данные пользовательских поставщиков:', data.suppliers)
        
        // 🔍 ДЕТАЛЬНАЯ ПРОВЕРКА КАЖДОГО ПОСТАВЩИКА
        data.suppliers.forEach((supplier: any, index: number) => {
          console.log(`🔍 Поставщик ${index + 1} "${supplier.name}":`, {
            contact_email: supplier.contact_email,
            contact_phone: supplier.contact_phone, 
            contact_person: supplier.contact_person,
            website: supplier.website,
            min_order: supplier.min_order,
            response_time: supplier.response_time,
            employees: supplier.employees,
            established: supplier.established,
            description: supplier.description
          })
        })
        
        setRealSuppliers(data.suppliers)
      } else {
        console.warn('⚠️ Нет пользовательских поставщиков в ответе API')
        console.log('📊 Полный ответ API:', data)
        // Устанавливаем пустой массив вместо тестовых данных
        setRealSuppliers([])
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки пользовательских поставщиков:', error)
      // Устанавливаем пустой массив вместо тестовых данных
      setRealSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  // Функция загрузки аккредитованных поставщиков из API
  const loadVerifiedSuppliersFromAPI = async () => {
    setLoadingVerified(true)
    try {
      const response = await fetch('/api/catalog/verified-suppliers')
      const data = await response.json()
      
      if (data.suppliers) {
        console.log('✅ Загружено аккредитованных поставщиков:', data.suppliers.length)
        console.log('📊 Данные аккредитованных поставщиков:', data.suppliers)
        setVerifiedSuppliers(data.suppliers)
      } else {
        console.warn('⚠️ Нет аккредитованных поставщиков в ответе API')
        console.log('📊 Полный ответ API:', data)
        // Устанавливаем пустой массив вместо тестовых данных
        setVerifiedSuppliers([])
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки аккредитованных поставщиков:', error)
      // Устанавливаем пустой массив вместо тестовых данных
      setVerifiedSuppliers([])
    } finally {
      setLoadingVerified(false)
    }
  }

  // Функция загрузки категорий из API
  const loadCategoriesFromAPI = async () => {
    try {
      setLoadingCategories(true)
      console.log('🔧 [DEBUG] Загружаем категории из API...')
      
      const response = await fetch('/api/catalog/categories')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔧 [DEBUG] Данные категорий:', data)
      
      if (data.categories && Array.isArray(data.categories)) {
        setApiCategories(data.categories)
        console.log(`✅ [API] Загружено ${data.categories.length} категорий`)
      } else {
        console.warn('⚠️ [API] Некорректная структура данных для категорий')
        setApiCategories([])
      }
    } catch (error) {
      console.error('❌ [API] Ошибка загрузки категорий:', error)
      // В случае ошибки используем fallback на статические категории
      const fallbackCategories = CATEGORY_CERTIFICATIONS.map(cat => ({
        key: cat.category.toLowerCase().replace(/\s+/g, '_'),
        name: cat.category,
        icon: '📦'
      }))
      setApiCategories(fallbackCategories)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Функция загрузки умных рекомендаций
  const loadRecommendations = async () => {
    setLoadingRecommendations(true)
    setRecommendationsError(null)
    try {
      // Получаем текущего пользователя
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      
      const response = await fetch(`/api/catalog/recommendations?user_id=${userData.user.id}&limit=10`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки рекомендаций')
      }
      
      if (data.success && data.recommendations) {
        console.log('🧠 [SMART RECOMMENDATIONS] Загружено рекомендаций:', data.recommendations)
        setRecommendations(data.recommendations)
      } else {
        throw new Error('Некорректная структура данных рекомендаций')
      }
    } catch (error) {
      console.error('❌ [SMART RECOMMENDATIONS] Ошибка загрузки:', error)
      setRecommendationsError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoadingRecommendations(false)
    }
  }

  // Загружаем поставщиков при монтировании компонента
  useEffect(() => {
    loadSuppliersFromAPI()
    loadVerifiedSuppliersFromAPI()
    loadCategoriesFromAPI() // Добавляем загрузку категорий
  }, [])

  // Обработка URL параметров для автоматического открытия категории
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const categoryParam = params.get('category')
    const viewParam = params.get('view')

    if (categoryParam && viewParam === 'products') {
      console.log('🎯 [URL] Автоматически открываем категорию:', categoryParam)

      // Ждем загрузки категорий
      const checkAndSelectCategory = setInterval(() => {
        if (apiCategories.length > 0) {
          clearInterval(checkAndSelectCategory)

          // Находим категорию по имени
          const category = apiCategories.find(cat => cat.name === categoryParam)

          if (category) {
            console.log('✅ [URL] Категория найдена:', category.name)

            // Загружаем подкатегории для автоматического показа товаров
            const loadSubcategoriesAndSelectFirst = async () => {
              try {
                console.log('📂 [URL] Загружаем подкатегории...')
                const response = await fetch(`/api/catalog/categories/${category.id}/subcategories`)
                const data = await response.json()

                if (data.subcategories && data.subcategories.length > 0) {
                  console.log('✅ [URL] Подкатегории загружены:', data.subcategories.length)
                  // Устанавливаем категорию с подкатегориями
                  setSelectedCategoryData({ ...category, subcategories: data.subcategories })
                  // Автоматически выбираем первую подкатегорию для показа товаров
                  setSelectedSubcategoryData(data.subcategories[0])
                  console.log('🎯 [URL] Автоматически выбрана подкатегория:', data.subcategories[0].name)
                } else {
                  console.warn('⚠️ [URL] У категории нет подкатегорий')
                  // Если нет подкатегорий, показываем саму категорию
                  setSelectedCategoryData(category as CatalogCategory)
                }
              } catch (error) {
                console.error('❌ [URL] Ошибка загрузки подкатегорий:', error)
                // В случае ошибки просто показываем категорию
                setSelectedCategoryData(category as CatalogCategory)
              }
            }

            loadSubcategoriesAndSelectFirst()
          } else {
            console.warn('⚠️ [URL] Категория не найдена:', categoryParam)
          }
        }
      }, 100)

      // Очистка через 5 секунд на случай если категории не загрузились
      setTimeout(() => clearInterval(checkAndSelectCategory), 5000)
    }
  }, [apiCategories])

  // Функция загрузки товаров поставщика
  const loadSupplierProducts = async (supplierId: string, supplierType: string = 'user') => {
    setLoadingProducts(true)
    setSupplierProducts([])
    try {
      let response
      
      if (supplierType === 'verified') {
        // Для verified (оранжевая комната) авторизация не нужна
        response = await fetch(`/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}`)
      } else {
        // Для user (синяя комната) нужна авторизация
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('❌ [CATALOG] Нет активной сессии для загрузки товаров');
          setSupplierProducts([]);
          return;
        }

        response = await fetch(`/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      }
      
      const data = await response.json()
      
      if (data.products) {
        console.log('✅ Загружено товаров поставщика:', data.products.length)
        console.log('📊 Данные товаров:', data.products)
        setSupplierProducts(data.products)
      } else {
        console.warn('⚠️ Нет товаров у поставщика в ответе API')
        console.log('📊 Полный ответ API:', data)
        setSupplierProducts([])
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки товаров поставщика:', error)
      setSupplierProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // ЭХО КАРТОЧКИ: Функция загрузки эхо карточек из API
  const loadEchoCards = async () => {
    setLoadingEchoCards(true)
    setEchoCardsError(null)
    try {
      // Получаем текущего пользователя
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      
      const response = await fetch(`/api/catalog/echo-cards?user_id=${userData.user.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки эхо карточек')
      }
      
      if (data.success && data.echo_cards) {
        console.log('✅ Загружено эхо карточек:', data.echo_cards.length)
        console.log('📊 Данные эхо карточек:', data.echo_cards)
        console.log('📊 Статистика:', data.summary)
        setEchoCards(data.echo_cards)
      } else {
        console.warn('⚠️ Нет эхо карточек в ответе API')
        setEchoCards([])
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки эхо карточек:', error)
      setEchoCardsError(error instanceof Error ? error.message : 'Неизвестная ошибка')
      setEchoCards([])
    } finally {
      setLoadingEchoCards(false)
    }
  }

  // ЭХО КАРТОЧКИ: Функция импорта поставщика в каталог
  const importSupplierFromEchoCard = async (echoCard: any) => {
    try {
      // Получаем текущего пользователя
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      
      const requestData = {
        user_id: userData.user.id,
        supplier_key: echoCard.supplier_key,
        supplier_data: echoCard.supplier_info,
        products: echoCard.products || []
      }
      
      const response = await fetch('/api/catalog/echo-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта поставщика')
      }
      
      if (data.success) {
        console.log('✅ Поставщик импортирован:', data.supplier)
        // Обновляем список поставщиков
        await loadSuppliersFromAPI()
        // Закрываем модальное окно
        setShowEchoCardsModal(false)
        return data
      }
    } catch (error) {
      console.error('❌ Ошибка импорта поставщика:', error)
      throw error
    }
  }

  // Функция запуска проекта с поставщиком
  const handleStartProject = (supplier: any) => {
    console.log('🚀 Начинаем проект с поставщиком:', supplier.name)
    console.log('🔍 [DEBUG] Данные поставщика для handleStartProject:', {
      id: supplier.id,
      name: supplier.name,
      company_name: supplier.company_name,
      source_type: supplier.source_type,
      category: supplier.category
    })
    
    // Переходим на страницу создания проекта с предзаполнением данных поставщика
    const params = new URLSearchParams({
      supplierId: supplier.id.toString(),
      supplierName: supplier.name || '',
      mode: 'catalog'
    })
    
    console.log('🔗 [DEBUG] URL параметры:', params.toString())
    router.push(`/dashboard/create-project?${params.toString()}`)
  }

  // Функция для открытия редактирования поставщика
  const handleEditSupplier = (supplier: any) => {
    console.log('✏️ Редактируем поставщика:', supplier.name)
    setEditingSupplier(supplier)
    setShowAddSupplierModal(true)
  }

  // Состояние каталога
  const [activeMode, setActiveMode] = useState<'clients' | 'catalog'>('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [modalTab, setModalTab] = useState<'info' | 'products' | 'management'>('info')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 8

  // Состояние умных рекомендаций
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)

  // Основные состояния навигации
  const [catalogMode, setCatalogMode] = useState<'suppliers' | 'categories'>('categories')
  const [selectedRoom, setSelectedRoom] = useState<'orange' | 'blue'>('orange')
  
  // Состояние авторизации
  const [authToken, setAuthToken] = useState<string>('')
  const [authLoading, setAuthLoading] = useState(true)

  // Загружаем рекомендации при переключении в оранжевую комнату (каталог)
  useEffect(() => {
    if (catalogMode === 'suppliers' && selectedRoom === 'orange' && !recommendations && !loadingRecommendations) {
      loadRecommendations()
    }
  }, [catalogMode, selectedRoom])

  // Инициализация токена авторизации
  useEffect(() => {
    const initAuth = async () => {
      try {
        setAuthLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          setAuthToken(session.access_token)
          console.log('✅ [AUTH] Токен получен для каталога:', session.access_token.substring(0, 20) + '...')
        } else {
          console.log('⚠️ [AUTH] Нет активной сессии')
        }
      } catch (error) {
        console.error('❌ [AUTH] Ошибка получения токена авторизации:', error)
      } finally {
        setAuthLoading(false)
      }
    }
    initAuth()
  }, [])

  // Поставщики
  const [realSuppliers, setRealSuppliers] = useState<any[]>([])
  const [verifiedSuppliers, setVerifiedSuppliers] = useState<any[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingVerified, setLoadingVerified] = useState(false)

  // Состояние для товаров поставщика в модальном окне
  const [supplierProducts, setSupplierProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  // Состояния для управления товарами
  const [showProductEditor, setShowProductEditor] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    min_order: '',
    sku: '',
    in_stock: true,
    images: [] as string[]
  })
  const [uploadingProductImages, setUploadingProductImages] = useState(false)

  // НОВОЕ: Состояние для замены логотипа поставщика
  const [logoInputRef, setLogoInputRef] = useState<HTMLInputElement | null>(null)
  const [uploadingSupplierLogo, setUploadingSupplierLogo] = useState(false)

  // НОВОЕ: Состояние для модального окна товара
  const [showProductModal, setShowProductModal] = useState(false)
  
  // ЭХО КАРТОЧКИ: Состояние для модального окна
  const [showEchoCardsModal, setShowEchoCardsModal] = useState(false)
  const [echoCards, setEchoCards] = useState<any[]>([])
  const [loadingEchoCards, setLoadingEchoCards] = useState(false)
  const [echoCardsError, setEchoCardsError] = useState<string | null>(null)
  
  // Состояние для выбора шагов импорта (для каждой эхо карточки)
  const [importStepsSelection, setImportStepsSelection] = useState<{[key: string]: {
    step2_products: boolean,
    step4_payment: boolean, 
    step5_requisites: boolean
  }}>({})

  // 🎯 СОСТОЯНИЕ КАТЕГОРИЙ И КОРЗИНЫ
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null)
  const [selectedSubcategoryData, setSelectedSubcategoryData] = useState<any>(null)
  // Убрали showCategorySelector - больше не нужно модальное окно
  
  // 🛒 Состояние корзины
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null) // Активный поставщик в корзине
  const [cartLoaded, setCartLoaded] = useState(false) // Флаг загрузки корзины из localStorage

  // Загружаем корзину из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('catalog_cart')
      const savedSupplier = localStorage.getItem('catalog_active_supplier')

      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setCart(parsedCart)
          console.log('✅ Корзина загружена из localStorage:', parsedCart.length, 'товаров')
        } catch (error) {
          console.error('❌ Ошибка загрузки корзины из localStorage:', error)
        }
      }

      if (savedSupplier) {
        setActiveSupplier(savedSupplier)
      }

      setCartLoaded(true)
    }
  }, [])

  // Сохраняем корзину в localStorage при каждом изменении
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      localStorage.setItem('catalog_cart', JSON.stringify(cart))
      console.log('💾 Корзина сохранена в localStorage:', cart.length, 'товаров')
    }
  }, [cart, cartLoaded])

  // Сохраняем активного поставщика в localStorage
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      if (activeSupplier) {
        localStorage.setItem('catalog_active_supplier', activeSupplier)
      } else {
        localStorage.removeItem('catalog_active_supplier')
      }
    }
  }, [activeSupplier, cartLoaded])

  // Инициализация выбора шагов для эхо карточки
  const initializeStepsSelection = (supplierKey: string) => {
    if (!importStepsSelection[supplierKey]) {
      setImportStepsSelection(prev => ({
        ...prev,
        [supplierKey]: {
          step2_products: true,    // По умолчанию включено
          step4_payment: true,     // По умолчанию включено
          step5_requisites: true   // По умолчанию включено
        }
      }))
    }
  }

  // Обновление выбора шага для конкретной эхо карточки
  const updateStepSelection = (supplierKey: string, step: 'step2_products' | 'step4_payment' | 'step5_requisites', value: boolean) => {
    setImportStepsSelection(prev => ({
      ...prev,
      [supplierKey]: {
        ...prev[supplierKey],
        [step]: value
      }
    }))
  }

  // Состояние для модального окна добавления поставщика
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [echoCardForImport, setEchoCardForImport] = useState<any>(null)
  const [supplierFormStep, setSupplierFormStep] = useState(1)
  const [maxSupplierStep, setMaxSupplierStep] = useState(1)
  const [supplierFormErrors, setSupplierFormErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<{[key: string]: boolean}>({})
  const [supplierFormData, setSupplierFormData] = useState({
    // Шаг 1: Основная информация
    name: '',
    company_name: '',
    category: 'Электроника',
    country: 'Китай',
    city: '',
    description: '',
    logo_url: '', // Добавляем поле для логотипа
    
    // Шаг 2: Контактная информация
    email: '',
    phone: '',
    website: '',
    contact_person: '',
    
    // Шаг 3: Бизнес-профиль
    min_order: '',
    response_time: '',
    employees: '',
    established: '',
    certifications: [] as string[],
    specialties: [] as string[],
    
    // Шаг 4: Товары и каталог
    products: [] as Array<{
      id: string,
      name: string,
      price: string,
      description: string,
      images: string[],
      specifications: {[key: string]: string},
      category: string,
      inStock: boolean,
      minOrder: string
    }>,
    
    // Шаг 5: Платежи и реквизиты
    payment_methods: [] as string[],
    payment_method: '', // Способ оплаты как в создании проекта
    bank_name: '',
    bank_account: '',
    swift_code: '',
    bank_address: '',
    payment_terms: '',
    currency: 'USD',
    // Новые поля для карты и крипты
    card_bank: '',
    card_number: '',
    card_holder: '',
    crypto_network: '',
    crypto_address: ''
  })

  // Функция валидации шагов
  const validateSupplierStep = (step: number): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (step === 1) {
      if (!supplierFormData.name.trim()) errors.name = 'Название поставщика обязательно'
      if (!supplierFormData.company_name.trim()) errors.company_name = 'Название компании обязательно'
      if (!supplierFormData.city.trim()) errors.city = 'Город обязателен'
      if (!supplierFormData.description.trim()) errors.description = 'Описание обязательно'
    }
    
    if (step === 2) {
      if (!supplierFormData.email.trim()) {
        errors.email = 'Email обязателен'
      } else if (!/\S+@\S+\.\S+/.test(supplierFormData.email)) {
        errors.email = 'Некорректный email'
      }
      if (!supplierFormData.phone.trim()) errors.phone = 'Телефон обязателен'
      if (!supplierFormData.contact_person.trim()) errors.contact_person = 'Контактное лицо обязательно'
    }
    
    if (step === 3) {
      if (!supplierFormData.min_order.trim()) errors.min_order = 'Минимальный заказ обязателен'
      if (!supplierFormData.response_time.trim()) errors.response_time = 'Время ответа обязательно'
      if (!supplierFormData.employees.trim()) errors.employees = 'Количество сотрудников обязательно'
      if (!supplierFormData.established.trim()) errors.established = 'Год основания обязателен'
    }
    
    if (step === 4) {
      const certs = CATEGORY_CERTIFICATIONS.find(cat => cat.category === supplierFormData.category)?.certifications || [];
      if (certs.length > 0 && supplierFormData.certifications.length === 0) {
        errors.certifications = 'Выберите хотя бы одну сертификацию'
      }
    }
    
    if (step === 5) {
      if (supplierFormData.products.length === 0) {
        errors.products = 'Добавьте хотя бы один товар'
      }
    }
    
    if (step === 6) {
      // Проверяем, что заполнен хотя бы один способ оплаты
      const hasBankTransfer = supplierFormData.bank_name.trim() && supplierFormData.bank_account.trim()
      const hasCardPayment = supplierFormData.card_bank?.trim() && supplierFormData.card_number?.trim()
      const hasCrypto = supplierFormData.crypto_network?.trim() && supplierFormData.crypto_address?.trim()
      
      if (!hasBankTransfer && !hasCardPayment && !hasCrypto) {
        errors.payment_methods = 'Заполните хотя бы один способ приёма платежей'
      }
      
      // Если начали заполнять банковский перевод, то эти поля обязательны
      if ((supplierFormData.bank_name.trim() || supplierFormData.bank_account.trim()) && 
          (!supplierFormData.bank_name.trim() || !supplierFormData.bank_account.trim())) {
        if (!supplierFormData.bank_name.trim()) errors.bank_name = 'Заполните название банка'
        if (!supplierFormData.bank_account.trim()) errors.bank_account = 'Заполните номер счета'
      }
      
      // Если начали заполнять карточные реквизиты, то эти поля обязательны
      if ((supplierFormData.card_bank?.trim() || supplierFormData.card_number?.trim()) && 
          (!supplierFormData.card_bank?.trim() || !supplierFormData.card_number?.trim())) {
        if (!supplierFormData.card_bank?.trim()) errors.card_bank = 'Заполните банк-эмитент'
        if (!supplierFormData.card_number?.trim()) errors.card_number = 'Заполните номер карты'
      }
      
      // Если начали заполнять крипто, то эти поля обязательны
      if ((supplierFormData.crypto_network?.trim() || supplierFormData.crypto_address?.trim()) && 
          (!supplierFormData.crypto_network?.trim() || !supplierFormData.crypto_address?.trim())) {
        if (!supplierFormData.crypto_network?.trim()) errors.crypto_network = 'Заполните сеть'
        if (!supplierFormData.crypto_address?.trim()) errors.crypto_address = 'Заполните адрес кошелька'
      }
    }
    
    if (step === 7) {
      // Финальная проверка - все данные должны быть заполнены
      if (!supplierFormData.name.trim()) errors.name = 'Название поставщика обязательно'
      if (!supplierFormData.email.trim()) errors.email = 'Email обязателен'
      
      // Проверяем, что заполнен хотя бы один способ оплаты
      const hasBankTransfer = supplierFormData.bank_name.trim() && supplierFormData.bank_account.trim()
      const hasCardPayment = supplierFormData.card_bank?.trim() && supplierFormData.card_number?.trim()
      const hasCrypto = supplierFormData.crypto_network?.trim() && supplierFormData.crypto_address?.trim()
      
      if (!hasBankTransfer && !hasCardPayment && !hasCrypto) {
        errors.payment_methods = 'Заполните хотя бы один способ приёма платежей'
      }
    }
    
    setSupplierFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Структура шагов для SupplierTimeline
  const supplierSteps = [
    { id: 1, title: 'ОСНОВНАЯ', description: 'Информация', icon: Building },
    { id: 2, title: 'КОНТАКТЫ', description: 'Связь', icon: Phone },
    { id: 3, title: 'ПРОФИЛЬ', description: 'Бизнес', icon: Users },
    { id: 4, title: 'СЕРТИФИКАЦИИ', description: 'Документы', icon: CheckCircle },
    { id: 5, title: 'ТОВАРЫ', description: 'Каталог', icon: Package },
    { id: 6, title: 'РЕКВИЗИТЫ', description: 'Платежи', icon: Zap },
    { id: 7, title: 'ПРЕВЬЮ', description: 'Финал', icon: CheckCircle }
  ]

  // Вспомогательная функция для римских цифр
  const toRoman = (num: number): string => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || String(num);
  }

  // Функция клика по шагу (возврат к предыдущим шагам)
  const handleSupplierStepClick = (stepIndex: number) => {
    if (stepIndex <= maxSupplierStep) {
      setSupplierFormStep(stepIndex)
    }
  }

  // Функция сброса формы
  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '', company_name: '', category: CATEGORY_CERTIFICATIONS[0].category, country: 'Китай', city: '', description: '', logo_url: '',
      email: '', phone: '', website: '', contact_person: '',
      min_order: '', response_time: '', employees: '', established: '',
      certifications: [], specialties: [],
      products: [],
      payment_methods: [], payment_method: '', bank_name: '', bank_account: '', swift_code: '', bank_address: '', payment_terms: '', currency: 'USD',
      card_bank: '', card_number: '', card_holder: '', crypto_network: '', crypto_address: ''
    })
    setSupplierFormErrors({})
    setUploadingImages({})
    setSupplierFormStep(1)
    setMaxSupplierStep(1)
  }

  // 🔮 ПРЕДЗАПОЛНЕНИЕ ДАННЫХ ИЗ ЭХО КАРТОЧКИ
  useEffect(() => {
    if (echoCardForImport && showAddSupplierModal) {
      console.log('🔮 Предзаполняем данные из эхо карточки:', echoCardForImport)
      
      const echoData = echoCardForImport.supplier_info
      const selectedSteps = echoCardForImport.selectedSteps || {
        step2_products: true,
        step4_payment: true,
        step5_requisites: true
      }
      
      console.log('📋 Выбранные шаги для импорта:', selectedSteps)
      console.log('📦 Товары из эхо карточки:')
      console.log('  - products_detailed:', echoCardForImport.products_detailed)
      console.log('  - products (fallback):', echoCardForImport.products)
      console.log('🖼️ Товары с картинками:', echoCardForImport.products_detailed?.filter((p: any) => p.image_url).length || 0)
      
      setSupplierFormData({
        // Основная информация из эхо карточки (всегда импортируется)
        name: echoData.name || '',
        company_name: echoData.company_name || '',
        category: echoData.category === 'Не указано' ? 'Электроника' : (echoData.category || 'Электроника'),
        country: echoData.country && echoData.country.trim() !== '' ? echoData.country : 'Китай', // Исправлено: проверяем не только на falsy но и на пустую строку
        city: echoData.city || '',
        description: '', // Описание пользователь заполнит сам
        logo_url: '',
        
        // Контактная информация (всегда импортируется если есть)
        email: echoData.contact_email || '',
        phone: echoData.contact_phone || '',
        website: echoData.website || '',
        contact_person: echoData.contact_person || '',
        
        // Бизнес-информация (ТОЛЬКО реальные данные из проектов)
        min_order: echoData.min_order || '',
        response_time: echoData.response_time || '',
        employees: echoData.employees || '',
        established: echoData.established || '',
        certifications: [],
        specialties: [],
        
        // STEP 2: Товары (импортируется только если выбрано)
        products: selectedSteps.step2_products ? 
          (echoCardForImport.products_detailed || echoCardForImport.products || []).map((productData: any) => {
            // Если это объект с полной информацией
            if (typeof productData === 'object' && productData.name) {
              const newProduct = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                name: productData.name,
                price: productData.price || '',
                description: '',
                images: productData.image_url ? [productData.image_url] : [], // 🖼️ КАРТИНКА ИЗ STEP2
                specifications: {},
                category: echoData.category === 'Не указано' ? 'Электроника' : (echoData.category || 'Электроника'),
                inStock: true,
                minOrder: productData.quantity ? `${productData.quantity} штук` : '1 штука'
              }
              
              console.log(`📦 Создан товар "${newProduct.name}":`)
              console.log(`  - ID: ${newProduct.id}`)
              console.log(`  - Цена: ${newProduct.price}`)
              console.log(`  - Картинка из эхо карточки: ${productData.image_url || 'НЕТ'}`)
              console.log(`  - Массив images: [${newProduct.images.join(', ')}]`)
              console.log(`  - Количество картинок: ${newProduct.images.length}`)
              
              return newProduct
            }
            // Если это просто строка (fallback)
            return {
              id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              name: typeof productData === 'string' ? productData : productData.name,
              price: '',
              description: '',
              images: [],
              specifications: {},
              category: echoData.category === 'Не указано' ? 'Электроника' : (echoData.category || 'Электроника'),
              inStock: true,
              minOrder: '1 штука'
            }
          }) : [],
        
        // STEP 4: Платежные методы (импортируется только если выбрано)
        payment_methods: selectedSteps.step4_payment && echoData.payment_methods ? [echoData.payment_type] : [],
        payment_method: selectedSteps.step4_payment ? (echoData.payment_type || '') : '',
        
        // STEP 5: Реквизиты (импортируется только если выбрано)
        // Банковские реквизиты
        bank_name: selectedSteps.step5_requisites ? (echoData.payment_methods?.bank?.bank_name || '') : '',
        bank_account: selectedSteps.step5_requisites ? (echoData.payment_methods?.bank?.account_number || '') : '',
        swift_code: selectedSteps.step5_requisites ? (echoData.payment_methods?.bank?.swift_code || '') : '',
        bank_address: selectedSteps.step5_requisites ? (echoData.payment_methods?.bank?.bank_address || '') : '',
        
        // P2P карточные реквизиты  
        card_bank: selectedSteps.step5_requisites ? (echoData.payment_methods?.card?.bank || '') : '',
        card_number: selectedSteps.step5_requisites ? (echoData.payment_methods?.card?.number || '') : '',
        card_holder: selectedSteps.step5_requisites ? (echoData.payment_methods?.card?.holder || '') : '',
        
        // Криптореквизиты
        crypto_network: selectedSteps.step5_requisites ? (echoData.payment_methods?.crypto?.network || '') : '',
        crypto_address: selectedSteps.step5_requisites ? (echoData.payment_methods?.crypto?.address || '') : '',
        
        payment_terms: '',
        currency: 'USD'
      })
      
      console.log('✅ Данные предзаполнены из эхо карточки с учетом выбранных шагов')
      console.log('📦 Товары импортированы:', selectedSteps.step2_products)
      console.log('💳 Способ оплаты импортирован:', selectedSteps.step4_payment)
      console.log('🏦 Реквизиты импортированы:', selectedSteps.step5_requisites)
      
      // Логирование финального состояния товаров после импорта
      setTimeout(() => {
        console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА ТОВАРОВ В ФОРМЕ:')
        setSupplierFormData(current => {
          console.log(`📦 Общее количество товаров в форме: ${current.products.length}`)
          current.products.forEach((product, index) => {
            console.log(`  ${index + 1}. "${product.name}":`)
            console.log(`     - ID: ${product.id}`)
            console.log(`     - Картинок: ${product.images?.length || 0}`)
            console.log(`     - Первая картинка: ${product.images?.[0] || 'НЕТ'}`)
          })
          return current
        })
      }, 100)
      
      // Инициализируем состояние uploadingImages для всех импортированных товаров
      if (selectedSteps.step2_products && echoCardForImport.products_detailed?.length > 0) {
        const imageStates: {[key: string]: boolean} = {}
        setSupplierFormData(prev => {
          prev.products.forEach(product => {
            imageStates[product.id] = false
          })
          return prev
        })
                 setUploadingImages(prev => ({...prev, ...imageStates}))
         console.log('🖼️ Инициализировано состояние загрузки изображений для импортированных товаров')
         console.log('📝 Начните с шага 1 и заполните недостающую информацию по всей форме')
       }
    }
  }, [echoCardForImport, showAddSupplierModal])

  // Функция конвертации файла в Base64 (запасной вариант)
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Проверка, есть ли поставщик уже в личном списке
  const isSupplierInPersonalList = (catalogSupplier: any) => {
    console.log('🔍 [DEBUG] Проверяем дублирование для:', catalogSupplier.name || catalogSupplier.company_name)
    console.log('🔍 [DEBUG] В личном списке:', realSuppliers.length, 'поставщиков')
    
    const isDuplicate = realSuppliers.some(personalSupplier => 
      personalSupplier.company_name === catalogSupplier.company_name ||
      personalSupplier.name === catalogSupplier.name ||
      (personalSupplier.contact_email && catalogSupplier.email && 
       personalSupplier.contact_email === catalogSupplier.email)
    )
    
    console.log('🔍 [DEBUG] Результат проверки дублирования:', isDuplicate)
    return isDuplicate
  }

  // Функция добавления поставщика из каталога Get2B в личный список
  const handleAddSupplierToPersonal = async (catalogSupplier: any) => {
    console.log('🔥 [DEBUG] handleAddSupplierToPersonal вызвана для:', catalogSupplier)
    
    // Принудительно сбрасываем loading если он застрял
    setLoading(false)
    
    // Проверяем, нет ли уже такого поставщика
    if (isSupplierInPersonalList(catalogSupplier)) {
      console.log('⚠️ [DEBUG] Поставщик уже в списке!')
      alert('Этот поставщик уже есть в вашем списке!')
      return
    }

    console.log('🚀 [DEBUG] Начинаем импорт поставщика...')
    setLoading(true)
    
    // Дополнительная защита - автосброс через 15 секунд
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 [DEBUG] ЭКСТРЕННЫЙ СБРОС LOADING!')
      setLoading(false)
    }, 15000)
    
    try {
      // Проверяем авторизацию и получаем токен
      console.log('🔐 [DEBUG] Проверяем авторизацию...')
      const { supabase } = await import('@/lib/supabaseClient')
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.access_token) {
        console.log('❌ [DEBUG] Проблема с авторизацией:', authError)
        alert('❌ Сессия истекла. Пожалуйста, войдите в систему заново.')
        window.location.href = '/login'
        return
      }

      console.log('✅ [DEBUG] Авторизация OK, токен получен')
      console.log('📞 [DEBUG] Отправляем запрос к API...')

      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут

      try {
        // Используем новый API для импорта поставщика с токеном
        const response = await fetch('/api/catalog/import-supplier', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            verified_supplier_id: catalogSupplier.id
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId) // Отменяем таймаут если запрос прошел

        console.log('📡 [DEBUG] Ответ от сервера, статус:', response.status)
        const result = await response.json()
        console.log('📄 [DEBUG] Данные ответа:', result)

        if (response.status === 401) {
          console.log('🔒 [DEBUG] 401 - проблемы с авторизацией')
          alert('❌ Сессия истекла. Пожалуйста, войдите в систему заново.')
          window.location.href = '/login'
          return
        }

        if (response.ok) {
          console.log('✅ [DEBUG] Поставщик импортирован успешно:', result.supplier)
          console.log('🔄 [DEBUG] Обновляем список поставщиков...')
          // Обновляем список поставщиков
          await loadSuppliersFromAPI()
          console.log('🔵 [DEBUG] Переключаемся на синюю комнату...')
          // Автоматически переключаемся на личный список
          setActiveMode('clients')
          alert('🎉 Поставщик успешно добавлен в ваш список!\n\nВы переключены на вкладку "Ваши поставщики"')
        } else {
          console.error('❌ [DEBUG] Ошибка при импорте поставщика:', result.error)
          alert(`Ошибка: ${result.error}`)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('❌ [DEBUG] Ошибка fetch запроса:', fetchError)
        
        if (fetchError.name === 'AbortError') {
          console.log('⏰ [DEBUG] Запрос прерван по таймауту')
          alert('⏰ Запрос занял слишком много времени. Проверьте подключение к интернету и попробуйте снова.')
        } else {
          alert('❌ Ошибка сети при импорте поставщика')
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] Критическая ошибка:', error)
      alert('Ошибка при добавлении поставщика. Проверьте подключение к интернету.')
    } finally {
      console.log('🏁 [DEBUG] Функция завершена, сбрасываем loading')
      clearTimeout(emergencyTimeout) // Отменяем экстренный таймаут
      setLoading(false)
    }
  }

  // Функция загрузки логотипа поставщика
  const handleLogoUpload = async (file: File) => {
    if (!file) return

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Поддерживаются только изображения: JPEG, PNG, WebP, SVG')
      return
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    setUploadingImages(prev => ({ ...prev, logo: true }))

    try {
      // Создаем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Попытка загрузки в Supabase Storage
      const { supabase } = await import('@/lib/supabaseClient')
      const { data, error } = await supabase.storage
        .from('supplier-logos')
        .upload(fileName, file)

      if (error) {
        console.warn('⚠️ Ошибка загрузки в Supabase Storage:', error.message)
        // Fallback на Base64
        const base64 = await convertToBase64(file)
        setSupplierFormData(prev => ({ ...prev, logo_url: base64 }))
        console.log('✅ Логотип сохранен как Base64')
      } else {
        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from('supplier-logos')
          .getPublicUrl(fileName)
        
        setSupplierFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }))
        console.log('✅ Логотип загружен в Supabase Storage:', urlData.publicUrl)
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки логотипа:', error)
      // Fallback на Base64
      try {
        const base64 = await convertToBase64(file)
        setSupplierFormData(prev => ({ ...prev, logo_url: base64 }))
        console.log('✅ Логотип сохранен как Base64 (fallback)')
      } catch (base64Error) {
        console.error('❌ Ошибка конвертации в Base64:', base64Error)
        alert('Ошибка загрузки логотипа')
      }
    } finally {
      setUploadingImages(prev => ({ ...prev, logo: false }))
    }
  }

  // Функция сохранения поставщика
  const handleSubmitSupplier = async () => {
    setLoading(true)
    
    try {
      // Подготовка данных для отправки (соответствует структуре API)
      const supplierPayload = {
        name: supplierFormData.name,
        company_name: supplierFormData.company_name,
        category: supplierFormData.category, // Добавляем category как текст
        country: supplierFormData.country && supplierFormData.country.trim() !== '' ? supplierFormData.country : 'Китай', // Исправлено: убеждаемся что country не пустое
        city: supplierFormData.city,
        description: supplierFormData.description,
        logo_url: supplierFormData.logo_url, // Добавляем логотип
        contact_email: supplierFormData.email, // API ожидает contact_email
        contact_phone: supplierFormData.phone, // Исправлено на contact_phone
        website: supplierFormData.website,
        contact_person: supplierFormData.contact_person,
        min_order: supplierFormData.min_order,
        response_time: supplierFormData.response_time,
        employees: supplierFormData.employees,
        established: supplierFormData.established,
        certifications: supplierFormData.certifications,
        specialties: supplierFormData.specialties,
        // 📊 СТАТИСТИКА ПРОЕКТОВ из эхо карточки (если есть)
        total_projects: echoCardForImport?.statistics?.total_projects || 0,
        successful_projects: echoCardForImport?.statistics?.success_rate && echoCardForImport?.statistics?.total_projects ? 
          Math.round((echoCardForImport.statistics.success_rate / 100) * echoCardForImport.statistics.total_projects) : 0,
        cancelled_projects: echoCardForImport?.statistics?.total_projects && echoCardForImport?.statistics?.success_rate ?
          echoCardForImport.statistics.total_projects - Math.round((echoCardForImport.statistics.success_rate / 100) * echoCardForImport.statistics.total_projects) : 0,
        total_spent: echoCardForImport?.statistics?.total_spent || 0,
        // Реквизиты для платежей
        payment_methods: {
          bank: supplierFormData.bank_name ? {
            bank_name: supplierFormData.bank_name,
            account_number: supplierFormData.bank_account,
            swift_code: supplierFormData.swift_code
          } : null,
          card: supplierFormData.card_bank ? {
            bank: supplierFormData.card_bank,
            number: supplierFormData.card_number,
            holder: supplierFormData.card_holder
          } : null,
          crypto: supplierFormData.crypto_network ? {
            network: supplierFormData.crypto_network,
            address: supplierFormData.crypto_address
          } : null
        }
      }

      // Отправка данных поставщика
      console.log('🔧 [DEBUG] Отправляем поставщика с логотипом:', supplierPayload.logo_url);
      console.log('📊 [DEBUG] Статистика проектов из эхо карточки:', {
        echo_stats: echoCardForImport?.statistics,
        calculated_successful: supplierPayload.successful_projects,
        calculated_cancelled: supplierPayload.cancelled_projects,
        total_projects: supplierPayload.total_projects,
        total_spent: supplierPayload.total_spent
      });
      console.log('📝 [DEBUG] ПРОВЕРКА ВСЕХ ПОЛЕЙ ФОРМЫ:', {
        name: supplierFormData.name,
        company_name: supplierFormData.company_name,
        description: supplierFormData.description,
        min_order: supplierFormData.min_order,
        response_time: supplierFormData.response_time,
        employees: supplierFormData.employees,
        established: supplierFormData.established,
        contact_email: supplierFormData.email,
        contact_phone: supplierFormData.phone,
        website: supplierFormData.website,
        contact_person: supplierFormData.contact_person
      });
      console.log('🌍 [DEBUG] ПРОВЕРКА ПОЛЯ COUNTRY:', {
        'Form country': supplierFormData.country,
        'API country': supplierPayload.country,
        'Country length': supplierFormData.country?.length,
        'Is empty string': supplierFormData.country === '',
        'Is undefined': supplierFormData.country === undefined,
        'Is null': supplierFormData.country === null,
        'Boolean validation': !!supplierFormData.country
      });
      console.log('🔧 [DEBUG] Полные данные поставщика для API:', supplierPayload);
      
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Необходима авторизация для добавления поставщика');
      }

      const supplierResponse = await fetch('/api/catalog/user-suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(supplierPayload),
      })

      if (!supplierResponse.ok) {
        const errorData = await supplierResponse.json()
        throw new Error(errorData.error || 'Ошибка при добавлении поставщика')
      }

      const { supplier } = await supplierResponse.json()
      console.log('✅ Поставщик создан:', supplier)

      // Добавление товаров поставщика
      if (supplierFormData.products.length > 0) {
        console.log(`🔧 [DEBUG] Начинаем добавление ${supplierFormData.products.length} товаров`);
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of supplierFormData.products) {
          const productPayload = {
            supplier_id: supplier.id,
            supplier_type: 'user', // Указываем что это товар пользовательского поставщика
            name: product.name,
            description: product.description,
            category: product.category || supplierFormData.category,
            price: product.price ? parseFloat(product.price) : null,
            currency: 'USD',
            min_order: product.minOrder,
            images: product.images,
            specifications: product.specifications,
            in_stock: product.inStock,
            sku: (product as any).sku || null
          }

          console.log(`🔧 [DEBUG] Сохраняем товар "${product.name}":`, productPayload);

          const productResponse = await fetch('/api/catalog/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productPayload),
          })

          if (!productResponse.ok) {
            const errorData = await productResponse.json();
            console.error(`❌ Ошибка при добавлении товара "${product.name}":`, errorData);
            errorCount++;
          } else {
            const result = await productResponse.json();
            console.log(`✅ Товар "${product.name}" добавлен:`, result.product?.id);
            successCount++;
          }
        }
        
        console.log(`📊 [ИТОГО] Товары: ${successCount} успешно, ${errorCount} ошибок`);
      }

      // Успешное завершение
      alert('🎉 Поставщик успешно добавлен в вашу синюю комнату!\n\nТеперь вы можете создавать проекты с этим поставщиком и управлять его товарами.')
      setShowAddSupplierModal(false)
      resetSupplierForm()
      setEchoCardForImport(null) // Очищаем эхо карточку после успешного сохранения
      console.log('✅ Поставщик сохранен, состояние сброшено')
      
      // Обновить список поставщиков из API
      console.log('🔄 Обновляем список поставщиков после добавления...');
      await loadSuppliersFromAPI();
      console.log('✅ Список поставщиков обновлен');

    } catch (error) {
      console.error('❌ Ошибка при сохранении поставщика:', error)
      alert(`Ошибка при добавлении поставщика: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  // Расширенный массив товаров
  const ALL_PRODUCTS = [
    { id: 1, name: 'Смартфон Samsung Galaxy S24', price: '$899', description: 'Флагманский смартфон с AI-функциями', category: 'Электроника', stock: 150, specifications: { screen: '6.2"', memory: '256GB', camera: '50MP', battery: '4000mAh' } },
    { id: 2, name: 'Беспроводные наушники AirPods Pro', price: '$249', description: 'Премиальные TWS наушники с шумоподавлением', category: 'Электроника', stock: 85, specifications: { battery: '6h+24h', bluetooth: '5.3', weight: '56g', anc: 'Активное' } },
    { id: 3, name: 'Умные часы Apple Watch Series 9', price: '$399', description: 'Продвинутые смарт-часы для здоровья и фитнеса', category: 'Электроника', stock: 45, specifications: { display: '45mm', waterproof: '50m', battery: '18h', sensors: 'ЭКГ, SpO2' } },
    { id: 4, name: 'Портативное зарядное Anker 20K', price: '$49', description: 'Быстрая зарядка для всех устройств', category: 'Электроника', stock: 200, specifications: { capacity: '20000mAh', ports: '2 USB-C + 1 USB-A', weight: '490g', fastcharge: '22.5W' } },
    { id: 5, name: 'Bluetooth колонка JBL Charge 5', price: '$129', description: 'Мощная портативная колонка с защитой IP67', category: 'Электроника', stock: 120, specifications: { power: '40W', waterproof: 'IP67', battery: '20h', bluetooth: '5.1' } },
    { id: 6, name: 'Игровая мышь Logitech G Pro X', price: '$79', description: 'Профессиональная беспроводная игровая мышь', category: 'Электроника', stock: 95, specifications: { dpi: '25600', buttons: '8', weight: '63g', battery: '70h' } },
    { id: 7, name: 'Клавиатура механическая Keychron K8', price: '$89', description: 'Беспроводная механическая клавиатура', category: 'Электроника', stock: 75, specifications: { switches: 'Cherry MX', battery: '240h', backlight: 'RGB', layout: 'TKL' } },
    { id: 8, name: 'Веб-камера Logitech C920', price: '$69', description: 'Full HD веб-камера для стриминга', category: 'Электроника', stock: 30, specifications: { resolution: '1080p 30fps', microphone: 'Стерео', autofocus: 'Да', fov: '78°' } },
    { id: 9, name: 'SSD накопитель Samsung 980 PRO 1TB', price: '$149', description: 'Высокоскоростной NVMe SSD', category: 'Электроника', stock: 180, specifications: { capacity: '1TB', interface: 'PCIe 4.0', read: '7000 MB/s', write: '5000 MB/s' } },
    { id: 10, name: 'Монитор ASUS ProArt 27"', price: '$449', description: 'Профессиональный 4K монитор', category: 'Электроника', stock: 25, specifications: { size: '27"', resolution: '4K UHD', panel: 'IPS', refresh: '60Hz' } },
    { id: 11, name: 'Роутер Wi-Fi 6 ASUS AX6000', price: '$299', description: 'Игровой роутер с Wi-Fi 6', category: 'Электроника', stock: 60, specifications: { standard: 'Wi-Fi 6', speed: '6000 Mbps', ports: '8x Gigabit', coverage: '5000 кв.ф' } },
    { id: 12, name: 'Планшет iPad Air 5-го поколения', price: '$599', description: 'Мощный планшет с процессором M1', category: 'Электроника', stock: 40, specifications: { screen: '10.9"', chip: 'Apple M1', storage: '256GB', camera: '12MP' } },
    { id: 13, name: 'Наушники Sony WH-1000XM5', price: '$399', description: 'Флагманские наушники с шумоподавлением', category: 'Электроника', stock: 90, specifications: { anc: 'Адаптивное', battery: '30h', drivers: '30mm', weight: '250g' } },
    { id: 14, name: 'Смарт-TV Samsung 55" QLED', price: '$899', description: 'Премиальный QLED телевизор', category: 'Электроника', stock: 15, specifications: { size: '55"', resolution: '4K', hdr: 'HDR10+', os: 'Tizen' } },
    { id: 15, name: 'Консоль PlayStation 5', price: '$499', description: 'Игровая консоль нового поколения', category: 'Электроника', stock: 8, specifications: { cpu: 'AMD Zen 2', gpu: 'RDNA 2', storage: '825GB SSD', ray_tracing: 'Да' } },
    { id: 16, name: 'Фитнес-браслет Xiaomi Band 8', price: '$39', description: 'Доступный фитнес-трекер', category: 'Электроника', stock: 300, specifications: { display: '1.62"', battery: '16 дней', waterproof: '5ATM', sensors: 'SpO2, Пульс' } },
    { id: 17, name: 'Дрон DJI Mini 3', price: '$759', description: 'Компактный дрон с 4K камерой', category: 'Электроника', stock: 12, specifications: { camera: '4K/60fps', flight_time: '38 мин', weight: '249g', range: '10км' } },
    { id: 18, name: 'Принтер HP LaserJet Pro', price: '$199', description: 'Лазерный принтер для офиса', category: 'Электроника', stock: 55, specifications: { type: 'Лазерный ЧБ', speed: '23 стр/мин', duplex: 'Авто', connectivity: 'Wi-Fi, USB' } }
  ]

  // Вычисляем товары для текущей страницы
  const totalPages = Math.ceil(ALL_PRODUCTS.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = ALL_PRODUCTS.slice(startIndex, endIndex)

  // Динамический массив категорий из API с fallback на статические
  const categories = [
    { value: 'all', label: 'Все категории' },
    ...apiCategories.map(cat => ({ 
      value: cat.name, 
      label: `${cat.icon || '📦'} ${cat.name}` 
    }))
  ]

  // ИСПРАВЛЕНО: Оранжевая комната = аккредитованные поставщики, Синяя комната = персональные поставщики
  const currentSuppliers = selectedRoom === 'orange' ? verifiedSuppliers : realSuppliers

  const filteredSuppliers = currentSuppliers.filter(supplier => {
    // Безопасная проверка на null/undefined
    const supplierName = supplier?.name || supplier?.company_name || ''
    const supplierCategory = supplier?.category || ''
    
    // Исключаем записи с пустыми или null значениями
    if (!supplierName.trim() || supplierName === 'NULL') return false
    
    const matchesSearch = supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplierCategory.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategoryFilter === 'all' || supplierCategory === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Debug logs removed to prevent infinite render loop

  // Безопасная функция для обработки сертификаций
  const getCertifications = (certifications: string | null): string[] => {
    if (!certifications) return []
    try {
      const parsed = JSON.parse(certifications)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Функции для управления товарами
  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      min_order: '',
      sku: '',
      in_stock: true,
      images: []
    })
    setEditingProduct(null)
  }

  const openProductEditor = (product?: any) => {
    if (product) {
      setEditingProduct(product)
      setProductFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        currency: product.currency || 'USD',
        min_order: product.min_order || '',
        sku: product.sku || '',
        in_stock: product.in_stock ?? true,
        images: product.images || []
      })
    } else {
      resetProductForm()
    }
    setShowProductEditor(true)
  }

  const handleProductImageUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploadingProductImages(true)
    const uploadedImages: string[] = []

    try {
      for (const file of imageFiles) {
        // Пробуем загрузить в Supabase Storage
        try {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)

          uploadedImages.push(publicUrl)
        } catch (storageError) {
          console.warn('Supabase Storage не доступен, использую Base64:', storageError)
          const base64 = await convertToBase64(file)
          uploadedImages.push(base64)
        }
      }

      setProductFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }))
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error)
      alert('Ошибка загрузки изображений')
    } finally {
      setUploadingProductImages(false)
    }
  }

  const removeProductImage = (index: number) => {
    setProductFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSaveProduct = async () => {
    if (!selectedSupplier) {
      alert('Ошибка: поставщик не выбран')
      return
    }

    if (!productFormData.name.trim()) {
      alert('Заполните название товара')
      return
    }

    setUploadingProductImages(true)
    
    try {
      const productData = {
        name: productFormData.name.trim(),
        description: productFormData.description.trim(),
        price: productFormData.price.trim() ? parseFloat(productFormData.price.trim()) : null,
        currency: productFormData.currency,
        min_order: productFormData.min_order.trim(),
        sku: productFormData.sku.trim() || null,
        in_stock: productFormData.in_stock,
        images: productFormData.images,
        supplier_id: selectedSupplier.id,
        supplier_type: selectedRoom === 'blue' ? 'user' : 'verified', // Добавляем supplier_type
        category: selectedSupplier.category || 'Без категории' // ИСПРАВЛЕНИЕ: Добавляем category
      }

      const apiUrl = editingProduct 
        ? `/api/catalog/products` 
        : '/api/catalog/products'
      
      const method = editingProduct ? 'PATCH' : 'POST' // ИСПРАВЛЕНИЕ: Используем PATCH вместо PUT

      console.log(`${editingProduct ? 'Обновление' : 'Создание'} товара:`, productData)

      const requestBody = editingProduct 
        ? { id: editingProduct.id, ...productData } // Для PATCH включаем id в body
        : productData

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Нет активной сессии для работы с товарами');
      }

      const response = await fetch(apiUrl, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Ошибка ${editingProduct ? 'обновления' : 'создания'} товара`)
      }

      console.log(`Товар ${editingProduct ? 'обновлен' : 'создан'} успешно:`, result)
      
      alert(`✅ Товар ${editingProduct ? 'обновлен' : 'добавлен'} успешно!`)
      
      // Обновляем список товаров
      const supplierType = selectedRoom === 'blue' ? 'user' : 'verified'
      await loadSupplierProducts(selectedSupplier.id, supplierType)
      
      // Закрываем редактор
      setShowProductEditor(false)
      resetProductForm()

    } catch (error) {
      console.error(`Ошибка ${editingProduct ? 'обновления' : 'создания'} товара:`, error)
      alert(`Ошибка ${editingProduct ? 'обновления' : 'создания'} товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setUploadingProductImages(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }

    try {
      console.log('Удаление товара:', productId)

      const supplierType = selectedRoom === 'blue' ? 'user' : 'verified'

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Нет активной сессии для удаления товара');
      }

      const response = await fetch('/api/catalog/products', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          id: productId,
          supplier_type: supplierType
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка удаления товара')
      }

      console.log('Товар удален успешно:', result)
      alert('✅ Товар удален успешно!')
      
      // Обновляем список товаров
      if (selectedSupplier) {
        await loadSupplierProducts(selectedSupplier.id, supplierType)
      }

    } catch (error) {
      console.error('Ошибка удаления товара:', error)
      alert(`Ошибка удаления товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого поставщика? Это действие нельзя отменить. Все товары поставщика также будут удалены.')) {
      return
    }

    try {
      console.log('Удаление поставщика:', supplierId)

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Нет активной сессии для удаления поставщика');
      }

      const response = await fetch('/api/catalog/user-suppliers', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: supplierId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка удаления поставщика')
      }

      console.log('Поставщик удален успешно:', result)
      alert('✅ Поставщик удален успешно!')
      
      // Закрываем модальное окно и обновляем список поставщиков
      setSelectedSupplier(null)
      await loadSuppliersFromAPI()

    } catch (error) {
      console.error('Ошибка удаления поставщика:', error)
      alert(`Ошибка удаления поставщика: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  // НОВОЕ: Функция для замены логотипа поставщика
  const handleSupplierLogoChange = async (file: File) => {
    if (!selectedSupplier) return

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Поддерживаются только изображения: JPEG, PNG, WebP, SVG')
      return
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    try {
      setUploadingSupplierLogo(true)
      console.log('🔄 Начинаем загрузку нового логотипа для поставщика:', selectedSupplier.id)

      let logoUrl: string;

      try {
        // Создаем уникальное имя файла
        const fileExt = file.name.split('.').pop()
        const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        // Попытка загрузки в Supabase Storage
        const { supabase } = await import('@/lib/supabaseClient')
        const { data, error } = await supabase.storage
          .from('supplier-logos')
          .upload(fileName, file)

        if (error) {
          console.warn('⚠️ Ошибка загрузки в Supabase Storage:', error.message)
          throw error
        }

        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from('supplier-logos')
          .getPublicUrl(fileName)
        
        logoUrl = urlData.publicUrl
        console.log('✅ Логотип загружен в Supabase Storage:', logoUrl)

      } catch (storageError) {
        console.warn('⚠️ Используем fallback на Base64:', storageError)
        // Fallback на Base64
        logoUrl = await convertToBase64(file)
        console.log('✅ Логотип сохранен как Base64')
      }

      // Получаем токен авторизации для обновления
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Нет активной сессии для обновления поставщика');
      }

      // Обновляем поставщика с новым логотипом
      const response = await fetch('/api/catalog/user-suppliers', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          id: selectedSupplier.id,
          logo_url: logoUrl 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка обновления логотипа')
      }

      console.log('✅ Логотип поставщика обновлен:', result.supplier)
      
      // Принудительно обновляем selectedSupplier с новым логотипом + cache busting
      const logoUrlWithCacheBuster = logoUrl.includes('data:') 
        ? logoUrl  // Base64 не нуждается в cache busting
        : `${logoUrl}?v=${Date.now()}` // Добавляем timestamp для принудительного обновления

      setSelectedSupplier({
        ...selectedSupplier,
        logo_url: logoUrlWithCacheBuster,
        updated_at: new Date().toISOString() // Обновляем время
      })

      // Обновляем список поставщиков
      await loadSuppliersFromAPI()

      alert('✅ Логотип успешно обновлен!')

    } catch (error) {
      console.error('❌ Ошибка замены логотипа:', error)
      alert(`Ошибка замены логотипа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setUploadingSupplierLogo(false)
    }
  }

  // Функция для открытия файлового диалога
  const openLogoFileDialog = () => {
    if (logoInputRef) {
      logoInputRef.click()
    }
  }

  // НОВОЕ: Функции для управления модальным окном товара
  const openProductModal = (product: any) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
    setShowProductModal(false)
  }

  // 🎯 ФУНКЦИИ ДЛЯ РЕЖИМА КАТЕГОРИЙ
  const handleCategorySelect = (category: CatalogCategory) => {
    setSelectedCategoryData(category)
    setSelectedSubcategoryData(null) // Сбрасываем подкатегорию при выборе новой категории
  }

  const handleSubcategorySelect = (subcategory: any) => {
    setSelectedSubcategoryData(subcategory)
  }

  const handleBackToCategories = () => {
    setSelectedCategoryData(null)
    setSelectedSubcategoryData(null)
  }

  const handleBackToSubcategories = () => {
    setSelectedSubcategoryData(null)
  }

  // 🛒 ФУНКЦИИ КОРЗИНЫ
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * parseFloat(item.price) }
          : item
      ))
    } else {
      // При добавлении первого товара устанавливаем активного поставщика
      if (cart.length === 0) {
        console.log('🔍 Полный объект товара:', JSON.stringify(product, null, 2))
        const supplierName = product.supplier_company_name || product.supplier_name
        setActiveSupplier(supplierName)
        console.log('🔒 Установлен активный поставщик:', supplierName)
      }
      
      const cartItem = {
        ...product,
        quantity: 1,
        total_price: parseFloat(product.price) || 0,
        room_type: catalogMode === 'categories' ? 'verified' : 'user',
        room_icon: catalogMode === 'categories' ? '🧡' : '🔵'
      }
      setCart([...cart, cartItem])
    }
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.id !== productId)
    setCart(newCart)
    
    // Если корзина стала пустой, сбрасываем активного поставщика
    if (newCart.length === 0) {
      setActiveSupplier(null)
      console.log('🔓 Сброшен активный поставщик - корзина пуста')
    }
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity, total_price: quantity * parseFloat(item.price) }
        : item
    ))
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0)
  }

  const createProjectFromCart = async () => {
    if (cart.length === 0) return
    
    try {
      // Сохраняем корзину в БД для автозаполнения данных поставщика
      console.log('💾 Сохраняем корзину в БД...')
      
      // Находим первого поставщика из корзины (все товары от одного поставщика)
      const firstItem = cart[0]
      const supplierInfo = {
        id: firstItem.supplier_id,
        name: firstItem.supplier_name || firstItem.supplier_company_name,
        company_name: firstItem.supplier_company_name || firstItem.supplier_name,
        // Определяем тип поставщика по room_type если есть
        type: firstItem.room_type === 'verified' ? 'verified' : 
              firstItem.room_type === 'user' ? 'user' : 
              selectedRoom === 'orange' ? 'verified' : 'user'
      }
      
      // 🎯 ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ПОСТАВЩИКА ИЗ БД
      console.log('🔍 Загружаем данные поставщика:', supplierInfo.id, 'тип:', supplierInfo.type)
      let fullSupplierData = null
      
      try {
        const table = supplierInfo.type === 'verified' ? 'catalog_verified_suppliers' : 'catalog_user_suppliers'
        const { data: supplierFromDB, error: supplierError } = await supabase
          .from(table)
          .select('id, name, company_name, category, country, city, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
          .eq('id', supplierInfo.id)
          .single()
        
        if (supplierFromDB && !supplierError) {
          fullSupplierData = supplierFromDB
          console.log('✅ Полные данные поставщика загружены:', fullSupplierData)
        } else {
          console.warn('⚠️ Не удалось загрузить полные данные поставщика:', supplierError)
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки данных поставщика:', err)
      }

      // Подготавливаем данные корзины
      const cartData = {
        user_id: (await supabase.auth.getUser()).data?.user?.id,
        supplier_id: supplierInfo.id,
        supplier_type: supplierInfo.type,
        supplier_name: supplierInfo.name,
        supplier_company_name: supplierInfo.company_name,
        supplier_data: {
          // Сохраняем все данные о поставщике для автозаполнения
          room_type: firstItem.room_type,
          category: fullSupplierData?.category || firstItem.supplier_category,
          country: fullSupplierData?.country || firstItem.supplier_country,
          city: fullSupplierData?.city || firstItem.supplier_city,
          // 🎯 ДОБАВЛЯЕМ РЕКВИЗИТЫ ПОСТАВЩИКА
          payment_methods: fullSupplierData?.payment_methods || [],
          bank_accounts: fullSupplierData?.bank_accounts || [],
          crypto_wallets: fullSupplierData?.crypto_wallets || [],
          p2p_cards: fullSupplierData?.p2p_cards || [],
        },
        cart_items: {
          items: cart.map(item => ({
            id: item.id,
            product_id: item.product_id || item.id,
            product_name: item.name || item.product_name,
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name,
            price: item.price,
            quantity: item.quantity,
            total_price: item.total_price,
            currency: item.currency || 'USD',
            image_url: item.image_url || item.images?.[0],
            sku: item.item_code || item.sku,
            description: item.description,
            min_order: item.min_order
          }))
        },
        items_count: getTotalItems(),
        total_amount: getTotalPrice(),
        currency: cart[0]?.currency || 'USD',
        source: 'catalog'
      }
      
      // Сохраняем в БД
      const { data: savedCart, error } = await supabase
        .from('project_carts')
        .insert(cartData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Ошибка сохранения корзины:', error)
        // Если таблица не существует, используем старый метод
        if (error.message?.includes('does not exist')) {
          console.log('⚠️ Таблица project_carts не найдена, используем URL метод')
          router.push(`/dashboard/create-project?from_cart=true&cart=${encodeURIComponent(JSON.stringify(cart))}`)
          return
        }
        throw error
      }
      
      console.log('✅ Корзина сохранена с ID:', savedCart.id)

      // Очищаем корзину и localStorage после успешного сохранения
      setCart([])
      setActiveSupplier(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('catalog_cart')
        localStorage.removeItem('catalog_active_supplier')
        console.log('🗑️ [CATALOG] localStorage очищен после создания проекта')
      }

      // Переходим к созданию проекта с ID корзины
      router.push(`/dashboard/create-project?from_cart=true&cart_id=${savedCart.id}`)
      
    } catch (error) {
      console.error('Ошибка при сохранении корзины:', error)
      // В случае ошибки используем старый метод через URL
      router.push(`/dashboard/create-project?from_cart=true&cart=${encodeURIComponent(JSON.stringify(cart))}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Уведомление об ошибке Supabase */}
      {!supabaseConnected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <p className="text-red-800 font-medium">Проблемы с подключением к базе данных</p>
                <p className="text-red-600 text-sm">{supabaseError || 'Работаем в автономном режиме'}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log('Catalog refresh requested');
                window.location.reload(); // Пока оставляем только здесь
              }} 
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Обновить
            </button>
          </div>
        </div>
      )}
      {/* Header с черными линиями */}
      <div className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
              <div>
                             <h1 className="text-3xl font-light text-black tracking-wide">Каталог Get2B</h1>
               <div className="w-24 h-0.5 bg-black mt-2"></div>
               <p className="text-gray-600 mt-3 font-light">Управление поставщиками нового поколения</p>
              </div>
              
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-light text-black">{filteredSuppliers.length}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">АКТИВНЫХ</div>
                  </div>
              <div className="w-px h-12 bg-black"></div>
              {/* 🛒 Кнопка корзины */}
              <button
                onClick={() => setShowCart(!showCart)}
                className={`relative p-3 border-2 border-black transition-all duration-300 ${
                  showCart 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setShowAddSupplierModal(true)}
                className="border-2 border-black text-black px-6 py-2 hover:bg-black hover:text-white transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ДОБАВИТЬ
              </button>
              {/* ЭХО КАРТОЧКИ: Кнопка импорта из проектов */}
              {activeMode === 'clients' && (
                <button 
                  onClick={() => {
                    setShowEchoCardsModal(true)
                    loadEchoCards()
                  }}
                  className="border-2 border-purple-600 text-purple-600 px-6 py-2 hover:bg-purple-600 hover:text-white transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
                >
                  🔮 ИМПОРТ ИЗ ПРОЕКТОВ
                </button>
              )}
        </div>
      </div>
      </div>

        {/* Главная навигационная панель */}
          <div className="flex items-center justify-between mb-4">
            {/* Переключатель режима каталога */}
            <div className="flex border-2 border-black rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setCatalogMode('suppliers')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  catalogMode === 'suppliers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                📋 По поставщикам
              </button>
              <button
                onClick={() => setCatalogMode('categories')}
                className={`px-6 py-3 text-sm font-medium border-l-2 border-black transition-all duration-300 ${
                  catalogMode === 'categories'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                🎯 По категориям
              </button>
            </div>

            {/* Переключатель комнат (показывается всегда) */}
            <div className="flex border-2 border-black rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  setSelectedRoom('orange')
                  setSelectedCategoryData(null) // Сбрасываем выбранную категорию при смене комнаты
                }}
                className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  selectedRoom === 'orange'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-black hover:bg-orange-50'
                }`}
                title="Аккредитованные поставщики"
              >
                🧡 Оранжевая комната
              </button>
              <button
                onClick={() => {
                  setSelectedRoom('blue')
                  setSelectedCategoryData(null) // Сбрасываем выбранную категорию при смене комнаты
                }}
                className={`px-6 py-3 text-sm font-medium border-l-2 border-black transition-all duration-300 ${
                  selectedRoom === 'blue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-black hover:bg-blue-50'
                }`}
                title="Персональные поставщики"
              >
                🔵 Синяя комната
              </button>
            </div>
          </div>

          {/* Фильтры и поиск для режима поставщиков */}
          {catalogMode === 'suppliers' && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Поиск поставщиков..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:border-gray-400 w-80 font-light tracking-wide"
                  />
                </div>
                
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="border-2 border-black px-4 py-3 focus:outline-none focus:border-gray-400 font-medium uppercase tracking-wider text-sm"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Счетчик поставщиков */}
              <div className="text-sm text-gray-600">
                {selectedRoom === 'orange' ? 
                  `🧡 Get2B каталог: ${verifiedSuppliers.length} поставщиков` : 
                  `🔵 Ваши поставщики: ${realSuppliers.length} поставщиков`
                }
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={catalogMode === 'categories' ? "w-full px-8 py-12" : "max-w-7xl mx-auto px-8 py-12"}>
        {catalogMode === 'categories' ? (
          // 🎯 Режим категорий
          <div className="space-y-6">
            {!selectedCategoryData ? (
              // УРОВЕНЬ 1: Показываем категории
              <div>
                <div className="mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Выберите категорию товаров</h2>
                    <p className="text-gray-600">Просмотрите товары из разных комнат</p>
                  </div>
                </div>
                {/* Встроенный список категорий */}
                {authLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загружается авторизация...</p>
                  </div>
                ) : (
                  <InlineCategoryList
                    onCategorySelect={handleCategorySelect}
                    selectedRoom={selectedRoom}
                  />
                )}
              </div>
            ) : !selectedSubcategoryData ? (
              // УРОВЕНЬ 2: Показываем подкатегории выбранной категории
              <SubcategoryList
                category={selectedCategoryData}
                onSubcategorySelect={handleSubcategorySelect}
                onBack={handleBackToCategories}
                selectedRoom={selectedRoom}
              />
            ) : (
              // УРОВЕНЬ 3: Показываем товары выбранной подкатегории
              <div>
                {/* Хлебные крошки и заголовок */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToSubcategories}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Назад к подкатегориям
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <h2 className="text-xl font-medium text-gray-800">
                      {selectedSubcategoryData.icon} {selectedSubcategoryData.name}
                    </h2>
                    <span className="text-sm text-gray-500">
                      ({selectedSubcategoryData.products_count || 0} товаров)
                    </span>
                  </div>

                  {/* Хлебные крошки: Категория / Подкатегория */}
                  <div className="text-sm text-gray-500">
                    <span
                      onClick={handleBackToCategories}
                      className="cursor-pointer hover:text-gray-800 transition-colors"
                    >
                      {selectedCategoryData.name}
                    </span>
                    {' / '}
                    <span className="font-medium text-gray-900">
                      {selectedSubcategoryData.name}
                    </span>
                  </div>
                </div>

                {/* Сетка товаров */}
                <ProductGridByCategory
                  selectedCategory={selectedSubcategoryData?.name || selectedSubcategoryData?.category || ''}
                  token={authToken}
                  onAddToCart={addToCart}
                  cart={cart}
                  selectedRoom={selectedRoom}
                  activeSupplier={activeSupplier}
                />
              </div>
            )}
          </div>
        ) : catalogMode === 'suppliers' && selectedRoom === 'blue' ? (
          // Синяя комната - ваши поставщики
          <div className="space-y-6">
            {loadingSuppliers ? (
              <div className="text-center py-12">
                <div className="text-lg text-gray-600">Загрузка ваших поставщиков...</div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg text-gray-600">У вас пока нет поставщиков</div>
                <div className="text-sm text-gray-500 mt-2">Добавьте нового поставщика через кнопку "ДОБАВИТЬ"</div>
                <button 
                  onClick={() => setShowAddSupplierModal(true)}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
                >
                  Добавить первого поставщика
                </button>
              </div>
            ) : (
              filteredSuppliers.map((supplier: any) => (
              <div key={supplier.id} className="border-2 border-black p-8 hover:shadow-2xl transition-all duration-300 group">
                                 <div className="flex items-start justify-between">
                   <div className="flex items-start gap-6 flex-1">
                     {/* Logo - увеличенный */}
                     <div className="w-32 h-32 border-2 border-black flex items-center justify-center bg-gray-50">
                       {supplier.logo_url ? (
                         <img 
                           src={supplier.logo_url} 
                           alt={`Логотип ${supplier.name || supplier.company_name}`}
                           className="w-full h-full object-contain"
                         />
                       ) : (
                       <div className="bg-red-100 border-2 border-red-300 text-center font-bold p-4 flex flex-col items-center justify-center h-full">
                         <Building className="w-16 h-16 mb-2 text-red-500" />
                         <div className="text-sm text-red-700 font-bold">
                           ЛОГОТИП ОТСУТСТВУЕТ
                         </div>
                         <div className="text-xs text-red-600 mt-1">
                           {(supplier.company_name || 'Без названия').substring(0, 15)}
                         </div>
                       </div>
                       )}
                     </div>

                     <div className="flex-1">
                       {/* Header */}
                       <div className="flex items-center gap-4 mb-6">
                         <h3 className="text-2xl font-light text-black tracking-wide">
                           {supplier.name && supplier.name !== 'Название поставщика' 
                             ? supplier.name 
                             : supplier.company_name && supplier.company_name !== 'Название компании'
                             ? supplier.company_name
                             : 'Поставщик без названия'
                           }
                         </h3>
                         <div className="w-px h-6 bg-black"></div>
                         <span className="bg-blue-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                           {supplier.category || 'Категория не указана'}
                         </span>
                         {supplier.source_type === 'extracted_from_7steps' && (
                         <span className="bg-green-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                           ИЗ ПРОЕКТОВ
                         </span>
                         )}
                         {supplier.source_type === 'user_added' && (
                         <span className="bg-blue-100 text-blue-800 px-3 py-1 text-xs uppercase tracking-wider font-medium">
                           ДОБАВЛЕН ВРУЧНУЮ
                         </span>
                         )}
                       </div>
                    
                       {/* Location */}
                       <div className="flex items-center gap-3 mb-6">
                         <MapPin className="w-4 h-4 text-blue-600" />
                         <span className="text-sm">
                           {supplier.city && supplier.city !== 'Категория' ? supplier.city : 'Город не указан'}, {supplier.country}
                         </span>
                       </div>

                       {/* Description */}
                       {supplier.description && supplier.description !== 'Описание компании' && (
                         <div className="mb-4">
                           <p className="text-sm text-gray-600">{supplier.description}</p>
                         </div>
                       )}

                       {/* Project Statistics - добавляем статистику проектов */}
                       {(supplier.total_projects > 0 || supplier.total_spent > 0) && (
                         <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                           <div className="flex items-center gap-4 text-sm">
                             <span className="text-blue-700 font-medium">
                               📊 Проектов: {supplier.total_projects || 0}
                             </span>
                             {supplier.successful_projects > 0 && (
                               <span className="text-green-600">
                                 ✅ Успешных: {supplier.successful_projects}
                               </span>
                             )}
                             {supplier.total_spent > 0 && (
                               <span className="text-blue-600">
                                 💰 Потрачено: ${supplier.total_spent}
                               </span>
                             )}
                           </div>
                         </div>
                       )}

                       {/* Specialties */}
                       <div>
                         <div className="flex flex-wrap gap-3">
                           {(Array.isArray(supplier.specialties) ? supplier.specialties : [])
                             .filter((specialty: any) => specialty && specialty.trim() && specialty !== 'NULL')
                             .map((specialty: string, index: number) => (
                             <span key={index} className="border border-blue-600 text-blue-600 px-3 py-1 text-xs uppercase tracking-wider">
                               {specialty}
                             </span>
                           ))}
                           {(!Array.isArray(supplier.specialties) || supplier.specialties.length === 0 || 
                             supplier.specialties.filter((s: any) => s && s.trim() && s !== 'NULL').length === 0) && (
                             <span className="text-xs text-gray-400">
                               {supplier.source_type === 'extracted_from_7steps' 
                                 ? 'Специализации будут добавлены из следующих проектов' 
                                 : 'Специализации не указаны'
                               }
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                      </div>
                      
                   {/* Stats + Actions - приближены друг к другу */}
                   <div className="flex items-start gap-6 ml-4">
                     {/* Stats Grid - перенесена справа */}
                     <div className="grid grid-cols-1 gap-4">
                       <div className="border-l-4 border-blue-600 pl-4">
                         <div className="text-2xl font-light text-black">{supplier.min_order || 'Не указан'}</div>
                         <div className="text-xs text-gray-500 uppercase tracking-wider">Мин. заказ</div>
                      </div>
                       <div className="border-l-4 border-blue-600 pl-4">
                         <div className="text-2xl font-light text-black">{supplier.response_time || 'Не указано'}</div>
                         <div className="text-xs text-gray-500 uppercase tracking-wider">Ответ</div>
                      </div>
                       <div className="border-l-4 border-blue-600 pl-4">
                         <div className="text-2xl font-light text-black">{supplier.employees || 'Не указано'}</div>
                         <div className="text-xs text-gray-500 uppercase tracking-wider">Сотрудников</div>
                      </div>
                    </div>
                    
                                          {/* Actions */}
                     <div className="flex flex-col gap-3">
                       <button 
                         onClick={() => handleStartProject(supplier)}
                         className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors uppercase tracking-wider text-sm font-medium"
                       >
                         Начать проект
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedSupplier(supplier)
                           setModalTab('info')
                           // Синяя комната = user suppliers
                           loadSupplierProducts(supplier.id, 'user')
                         }}
                         className="border-2 border-black text-black px-6 py-3 hover:bg-black hover:text-white transition-all uppercase tracking-wider text-sm font-medium"
                       >
                         Профиль
                       </button>
                       <button 
                         onClick={() => handleEditSupplier(supplier)}
                         className="border border-green-600 text-green-600 px-6 py-3 hover:bg-green-600 hover:text-white transition-all uppercase tracking-wider text-sm font-medium"
                       >
                         ✏️ Редактировать
                       </button>
                       <button className="border border-blue-600 text-blue-600 px-6 py-3 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider text-sm font-medium">
                         История
                       </button>
                     </div>
                  </div>
                      </div>
                      </div>
             ))
           )}
                    </div>
        ) : catalogMode === 'suppliers' && selectedRoom === 'orange' ? (
          // Оранжевая комната - Get2B каталог с AI рекомендациями
          <div className="space-y-8">
            {/* AI Рекомендации сверху */}
            {loadingRecommendations ? (
              <div className="bg-orange-50 border-2 border-orange-200 p-6">
                <div className="text-center">
                  <div className="text-lg text-orange-800">🧠 Анализируем ваши предпочтения...</div>
                  <div className="text-sm text-orange-600 mt-2">Готовим персональные рекомендации</div>
                </div>
              </div>
            ) : recommendations && (recommendations.top_suppliers?.length > 0 || recommendations.verified_suppliers?.length > 0) ? (
              <div className="space-y-6">
                {/* Персональные рекомендации */}
                {recommendations.top_suppliers?.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-orange-300 p-6">
                    <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                      🎯 Рекомендуем специально для вас
                      <span className="bg-orange-500 text-white px-2 py-1 text-xs rounded">AI</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recommendations.top_suppliers.slice(0, 3).map((supplier: any, index: number) => (
                        <div key={index} className="bg-white border border-orange-300 p-4 rounded shadow-sm">
                          <h4 className="font-medium text-orange-900">{supplier.supplier_name}</h4>
                          <div className="text-sm text-orange-700 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-green-600">✅</span>
                              Успешность: {Math.round((supplier.success_rate || 0) * 100)}%
                            </div>
                            <div>📊 Проектов: {supplier.total_projects || 0}</div>
                            <div>💰 Средний чек: ${supplier.avg_project_value?.toFixed(2) || 'N/A'}</div>
                          </div>
                          <div className="mt-3 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            На основе вашей истории проектов
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Популярные товары */}
                {recommendations.trending_products?.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-300 p-6">
                    <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                      🔥 Популярные товары в системе
                      <span className="bg-green-500 text-white px-2 py-1 text-xs rounded">ТРЕНД</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {recommendations.trending_products.slice(0, 4).map((product: any, index: number) => (
                        <div key={index} className="bg-white border border-green-300 p-3 rounded shadow-sm">
                          <h4 className="font-medium text-green-900 text-sm">{product.product_name}</h4>
                          <div className="text-xs text-green-700 mt-2">
                            <div>🏭 {product.supplier_name}</div>
                            <div>💵 ${product.unit_price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Основной каталог Get2B с AI-улучшениями */}
            <div>
              <h3 className="text-xl font-medium text-black mb-6 uppercase tracking-wider flex items-center gap-2">
                ⭐ Аккредитованные Get2B поставщики
                {recommendations && <span className="bg-orange-500 text-white px-2 py-1 text-xs rounded">УМНАЯ СОРТИРОВКА</span>}
              </h3>
              
              {loadingVerified ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Загрузка умного каталога Get2B...</div>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-600">Поставщики не найдены</div>
                  <div className="text-sm text-gray-500 mt-2">Попробуйте изменить фильтры поиска</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredSuppliers.map((supplier: any) => {
                    // Проверяем, есть ли этот поставщик в рекомендациях
                    const isRecommended = recommendations?.verified_suppliers?.some((rec: any) => 
                      rec.name === supplier.name || rec.company_name === supplier.company_name
                    )
                    const isTopRated = (supplier.rating || 0) >= 4.5
                    
                    return (
                      <div key={supplier.id} className={`border-2 p-8 hover:shadow-2xl transition-all duration-300 group ${
                        isRecommended ? 'border-orange-500 bg-orange-50' : 'border-black'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-6 flex-1">
                            {/* Logo */}
                            <div className="w-32 h-32 border-2 border-black flex items-center justify-center bg-gray-50">
                              {supplier.logo_url ? (
                                <img 
                                  src={supplier.logo_url} 
                                  alt={`Логотип ${supplier.name || supplier.company_name}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="bg-orange-100 border-2 border-orange-300 text-center font-bold p-4 flex flex-col items-center justify-center h-full">
                                  <Building className="w-16 h-16 mb-2 text-orange-500" />
                                  <div className="text-sm text-orange-700 font-bold">
                                    GET2B
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    АККРЕДИТОВАН
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              {/* Header с AI бейджами */}
                              <div className="flex items-center gap-4 mb-6">
                                <h3 className="text-2xl font-light text-black tracking-wide">
                                  {supplier.name || supplier.company_name || 'Поставщик'}
                                </h3>
                                <div className="w-px h-6 bg-black"></div>
                                <span className="bg-orange-500 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                                  {supplier.specialization || 'Get2B'}
                                </span>
                                
                                {/* AI рекомендации бейджи */}
                                {isRecommended && (
                                  <span className="bg-gradient-to-r from-purple-500 to-orange-500 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                                    🧠 РЕКОМЕНДУЕМ
                                  </span>
                                )}
                                {isTopRated && (
                                  <span className="bg-yellow-500 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                                    ⭐ ТОП РЕЙТИНГ
                                  </span>
                                )}
                              </div>
                           
                              {/* Location */}
                              <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-sm">
                                  {supplier.city || 'Город не указан'}, {supplier.country || 'Китай'}
                                </span>
                              </div>

                              {/* Description */}
                              {supplier.description && (
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">{supplier.description}</p>
                                </div>
                              )}

                              {/* AI Insights */}
                              {isRecommended && recommendations && (
                                <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-orange-100 border border-orange-300 rounded">
                                  <div className="text-sm text-orange-800">
                                    <div className="font-medium mb-1">🧠 AI анализ:</div>
                                    <div>• Подходит под ваш профиль заказов</div>
                                    <div>• Высокие показатели надежности</div>
                                    <div>• Рекомендуется на основе успешного опыта других клиентов</div>
                                  </div>
                                </div>
                              )}

                              {/* Certifications */}
                              <div>
                                <div className="flex flex-wrap gap-3">
                                  {getCertifications(supplier.certificates).map((cert: string, index: number) => (
                                    <span key={index} className="border border-orange-500 text-orange-500 px-3 py-1 text-xs uppercase tracking-wider">
                                      {cert}
                                    </span>
                                  ))}
                                  {getCertifications(supplier.certificates).length === 0 && (
                                    <span className="text-xs text-gray-400">
                                      Сертификации уточняются
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Stats + Actions */}
                          <div className="flex items-start gap-6 ml-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 gap-4">
                              <div className="border-l-4 border-orange-500 pl-4">
                                <div className="text-2xl font-light text-black">
                                  {supplier.rating ? `${supplier.rating}/5` : 'Новый'}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Рейтинг</div>
                              </div>
                              <div className="border-l-4 border-orange-500 pl-4">
                                <div className="text-2xl font-light text-black">{supplier.min_order || 'Гибко'}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Мин. заказ</div>
                              </div>
                              <div className="border-l-4 border-orange-500 pl-4">
                                <div className="text-2xl font-light text-black">{supplier.response_time || '24ч'}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Ответ</div>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => handleAddSupplierToPersonal(supplier)}
                                className={`px-6 py-3 hover:bg-opacity-80 transition-colors uppercase tracking-wider text-sm font-medium ${
                                  isRecommended 
                                    ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white' 
                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                              >
                                {isRecommended ? '🧠 Добавить (рекомендуем)' : 'Добавить в мой список'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedSupplier(supplier)
                                  setModalTab('info')
                                  loadSupplierProducts(supplier.id, 'verified')
                                }}
                                className="border-2 border-black text-black px-6 py-3 hover:bg-black hover:text-white transition-all uppercase tracking-wider text-sm font-medium"
                              >
                                Профиль
                              </button>
                              <button className="border border-orange-500 text-orange-500 px-6 py-3 hover:bg-orange-500 hover:text-white transition-all uppercase tracking-wider text-sm font-medium">
                                Связаться
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : catalogMode === 'suppliers' && selectedRoom === 'orange' && recommendations ? (
          // Умные рекомендации (фиолетовые акценты)
          <div className="space-y-6">
            {loadingRecommendations ? (
              <div className="text-center py-12">
                <div className="text-lg text-gray-600">🧠 Генерируем умные рекомендации...</div>
                <div className="text-sm text-gray-500 mt-2">Анализируем ваши проекты и историю поставщиков</div>
              </div>
            ) : recommendationsError ? (
              <div className="text-center py-12">
                <div className="text-lg text-red-600">❌ Ошибка загрузки рекомендаций</div>
                <div className="text-sm text-gray-500 mt-2">{recommendationsError}</div>
                <button 
                  onClick={loadRecommendations}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 hover:bg-purple-700 transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            ) : recommendations ? (
              <div className="space-y-8">
                {/* Топ поставщики по статистике */}
                {recommendations.top_suppliers?.length > 0 && (
                  <div className="border-2 border-purple-600 p-6">
                    <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
                      🏆 Топ поставщики по рейтингу
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.top_suppliers.slice(0, 6).map((supplier: any, index: number) => (
                        <div key={index} className="border border-purple-300 p-4 bg-purple-50">
                          <h4 className="font-medium text-purple-900">{supplier.supplier_name}</h4>
                          <div className="text-sm text-purple-700 mt-2">
                            <div>✅ Успешность: {Math.round(supplier.success_rate * 100)}%</div>
                            <div>📊 Проектов: {supplier.total_projects}</div>
                            <div>💰 Средний чек: ${supplier.avg_project_value?.toFixed(2) || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Популярные товары */}
                {recommendations.trending_products?.length > 0 && (
                  <div className="border-2 border-green-600 p-6">
                    <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
                      🔥 Популярные товары
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.trending_products.slice(0, 6).map((product: any, index: number) => (
                        <div key={index} className="border border-green-300 p-4 bg-green-50">
                          <h4 className="font-medium text-green-900">{product.product_name}</h4>
                          <div className="text-sm text-green-700 mt-2">
                            <div>🏭 Поставщик: {product.supplier_name}</div>
                            <div>💵 Цена: ${product.unit_price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Аккредитованные поставщики */}
                {recommendations.verified_suppliers?.length > 0 && (
                  <div className="border-2 border-orange-600 p-6">
                    <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
                      ⭐ Рекомендованные Get2B поставщики
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.verified_suppliers.slice(0, 4).map((supplier: any, index: number) => (
                        <div key={index} className="border border-orange-300 p-4 bg-orange-50">
                          <h4 className="font-medium text-orange-900">{supplier.name}</h4>
                          <div className="text-sm text-orange-700 mt-2">
                            <div>🏢 Компания: {supplier.company_name}</div>
                            <div>⭐ Рейтинг: {supplier.rating}/5</div>
                            <div>🏷️ Специализация: {supplier.specialization}</div>
                          </div>
                          <button
                            onClick={() => {
                              // Добавляем в личный список
                              handleAddSupplierToPersonal(supplier)
                            }}
                            className="mt-3 bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-700 transition-colors"
                          >
                            Добавить в мой список
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Информационная панель */}
                <div className="bg-purple-100 border border-purple-300 p-6">
                  <h3 className="text-lg font-medium text-purple-900 mb-3">
                    🧠 Как работают умные рекомендации
                  </h3>
                  <div className="text-sm text-purple-800 space-y-2">
                    <div>• Анализируем историю ваших проектов</div>
                    <div>• Оцениваем успешность поставщиков</div>
                    <div>• Находим популярные товары в системе</div>
                    <div>• Рекомендуем проверенных Get2B поставщиков</div>
                  </div>
                  <div className="mt-4 text-xs text-purple-600">
                    Последнее обновление: {new Date(recommendations.generated_at).toLocaleString('ru')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-lg text-gray-600">🤖 Недостаточно данных для рекомендаций</div>
                <div className="text-sm text-gray-500 mt-2">Создайте несколько проектов, чтобы получить персональные рекомендации</div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ✅ НОВОЕ МОДАЛЬНОЕ ОКНО С ПОДДЕРЖКОЙ РЕДАКТИРОВАНИЯ */}
      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => {
            setShowAddSupplierModal(false)
            setEditingSupplier(null)
            setEchoCardForImport(null)
          }}
          onSuccess={(supplier) => {
            // Обновляем список поставщиков после успешного добавления/редактирования
            loadSuppliersFromAPI()
            setShowAddSupplierModal(false)
            setEditingSupplier(null)
            setEchoCardForImport(null)
          }}
          echoCardData={echoCardForImport}
          editingSupplier={editingSupplier}
          targetTable="catalog_user_suppliers"
        />
      )}

      {/* ✅ СТАРОЕ МОДАЛЬНОЕ ОКНО (ВРЕМЕННО СКРЫТО) */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-6xl w-full h-[95vh] my-4 flex flex-col">
            {/* Header модала */}
            <div className="border-b-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50">
                    <div className="text-gray-400 text-xs text-center font-medium">
                      LOGO
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-light text-black tracking-wide">Добавление нового поставщика</h2>
                    {echoCardForImport && (
                      <div className="mt-2 mb-1">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 text-xs uppercase tracking-wider font-medium border border-purple-300">
                          🔮 Импорт из эхо карточки
                        </span>
                      </div>
                    )}
                  <div className="w-24 h-0.5 bg-black mt-2"></div>
                  <p className="text-gray-600 mt-3 font-light">
                    {echoCardForImport ? 'Дозаполните недостающую информацию о поставщике' : 'Заполните информацию о новом поставщике'}
                  </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddSupplierModal(false)
                    resetSupplierForm()
                  }}
                  className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Профессиональная прогресс-линия */}
              <div className="relative my-8">
                {/* Базовая линия (фон) */}
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-300 rounded-full" />
                {/* Линия прогресса до текущего шага */}
                <div
                  className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-orange-500 rounded-full transition-all duration-500"
                  style={{
                    width: supplierSteps.length === 1
                      ? '100%'
                      : `${((supplierFormStep - 1) / (supplierSteps.length - 1)) * 100}%`
                  }}
                />
                {/* Кружки */}
                <div className="relative flex justify-between w-full">
                  {supplierSteps.map((step, index) => {
                    const StepIcon = step.icon
                    const isCompletedOrCurrent = index + 1 <= supplierFormStep
                    const isClickable = index + 1 <= maxSupplierStep
                    return (
                      <div key={step.id} className="flex-1 flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                          className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300
                            ${isCompletedOrCurrent ? `bg-orange-500 border-orange-500${index + 1 === supplierFormStep ? ' ring-2 ring-orange-200' : ''}` : "bg-gray-300 border-gray-400"}
                            ${isClickable ? 'shadow-md shadow-orange-200' : ''}
                          `}
                        >
                          <span className={`text-lg font-bold ${isCompletedOrCurrent ? "text-white" : "text-gray-400"}`}>{toRoman(index + 1)}</span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                          className="mt-2 text-center"
                        >
                          <div className={`text-xs font-medium uppercase tracking-wider ${isCompletedOrCurrent ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</div>
                          <div className={`text-xs ${isCompletedOrCurrent ? 'text-gray-600' : 'text-gray-400'}`}>{step.description}</div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Контент формы */}
            <div className="flex-1 p-6 overflow-y-auto">
              {supplierFormStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Основная информация</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Название поставщика
                       </label>
                       <input
                         type="text"
                         value={supplierFormData.name}
                         onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.name ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="Например: TechFlow Innovations"
                       />
                       {supplierFormErrors.name && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.name}</p>
                       )}
                     </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Название компании
                       </label>
                       <input
                         type="text"
                         value={supplierFormData.company_name}
                         onChange={(e) => setSupplierFormData({...supplierFormData, company_name: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.company_name ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="Официальное название"
                       />
                       {supplierFormErrors.company_name && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.company_name}</p>
                       )}
                     </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Категория
                      </label>
                      <select
                        value={supplierFormData.category}
                        onChange={(e) => setSupplierFormData({
                          ...supplierFormData, 
                          category: e.target.value,
                          certifications: [] // Сбрасываем сертификаты при смене категории
                        })}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Страна
                      </label>
                      <select
                        value={supplierFormData.country}
                        onChange={(e) => setSupplierFormData({...supplierFormData, country: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Китай">🇨🇳 Китай</option>
                        <option value="Турция">🇹🇷 Турция</option>
                        <option value="Индия">🇮🇳 Индия</option>
                        <option value="Южная Корея">🇰🇷 Южная Корея</option>
                        <option value="Малайзия">🇲🇾 Малайзия</option>
                        <option value="Таиланд">🇹🇭 Таиланд</option>
                        <option value="Вьетнам">🇻🇳 Вьетнам</option>
                        <option value="Другая">🌍 Другая</option>
                      </select>
                    </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Город
                       </label>
                       <input
                         type="text"
                         value={supplierFormData.city}
                         onChange={(e) => setSupplierFormData({...supplierFormData, city: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.city ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="Например: Shenzhen"
                       />
                       {supplierFormErrors.city && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.city}</p>
                       )}
                     </div>
                  </div>
                  
                                     <div>
                     <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                       Описание компании
                     </label>
                     <textarea
                       value={supplierFormData.description}
                       onChange={(e) => setSupplierFormData({...supplierFormData, description: e.target.value})}
                       rows={4}
                       className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                         supplierFormErrors.description ? 'border-red-500' : 'border-black'
                       }`}
                       placeholder="Краткое описание деятельности компании и её преимуществ..."
                     />
                     {supplierFormErrors.description && (
                       <p className="mt-1 text-sm text-red-500">{supplierFormErrors.description}</p>
                     )}
                   </div>

                  {/* Блок загрузки логотипа */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      Логотип компании
                    </label>
                    <div className="flex items-start gap-4">
                      {/* Превью логотипа */}
                      <div className="w-32 h-32 border-2 border-black flex items-center justify-center bg-gray-50 relative">
                        {supplierFormData.logo_url ? (
                          <img 
                            src={supplierFormData.logo_url} 
                            alt="Логотип компании" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm text-center font-medium">
                            LOGO
                          </div>
                        )}
                        {uploadingImages.logo && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-xs">Загрузка...</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Кнопки управления */}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleLogoUpload(file)
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <div className="space-y-2">
                          <label
                            htmlFor="logo-upload"
                            className="block w-full px-4 py-2 border-2 border-black bg-white hover:bg-gray-50 text-center cursor-pointer transition-colors"
                          >
                            {supplierFormData.logo_url ? 'Изменить логотип' : 'Загрузить логотип'}
                          </label>
                          {supplierFormData.logo_url && (
                            <button
                              type="button"
                              onClick={() => setSupplierFormData({...supplierFormData, logo_url: ''})}
                              className="block w-full px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-50 text-center transition-colors"
                            >
                              Удалить логотип
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Поддерживаются: JPEG, PNG, WebP, SVG<br/>
                          Максимальный размер: 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {supplierFormStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Контактная информация</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Email
                       </label>
                       <input
                         type="email"
                         value={supplierFormData.email}
                         onChange={(e) => setSupplierFormData({...supplierFormData, email: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.email ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="contact@company.com"
                       />
                       {supplierFormErrors.email && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.email}</p>
                       )}
                     </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Телефон
                       </label>
                       <input
                         type="tel"
                         value={supplierFormData.phone}
                         onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.phone ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="+86 138 0000 0000"
                       />
                       {supplierFormErrors.phone && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.phone}</p>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Веб-сайт
                       </label>
                       <input
                         type="url"
                         value={supplierFormData.website}
                         onChange={(e) => setSupplierFormData({...supplierFormData, website: e.target.value})}
                         className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                         placeholder="https://www.company.com"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                         Контактное лицо
                       </label>
                       <input
                         type="text"
                         value={supplierFormData.contact_person}
                         onChange={(e) => setSupplierFormData({...supplierFormData, contact_person: e.target.value})}
                         className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                           supplierFormErrors.contact_person ? 'border-red-500' : 'border-black'
                         }`}
                         placeholder="Имя менеджера по продажам"
                       />
                       {supplierFormErrors.contact_person && (
                         <p className="mt-1 text-sm text-red-500">{supplierFormErrors.contact_person}</p>
                       )}
                     </div>
                  </div>
                </div>
              )}

              {supplierFormStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Бизнес-профиль</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Минимальный заказ
                      </label>
                      <input
                        type="text"
                        value={supplierFormData.min_order}
                        onChange={(e) => setSupplierFormData({...supplierFormData, min_order: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="$15,000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Время ответа
                      </label>
                      <input
                        type="text"
                        value={supplierFormData.response_time}
                        onChange={(e) => setSupplierFormData({...supplierFormData, response_time: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="2h"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Количество сотрудников
                      </label>
                      <input
                        type="text"
                        value={supplierFormData.employees}
                        onChange={(e) => setSupplierFormData({...supplierFormData, employees: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="500+"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Год основания
                      </label>
                      <input
                        type="text"
                        value={supplierFormData.established}
                        onChange={(e) => setSupplierFormData({...supplierFormData, established: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="2019"
                      />
                    </div>
                  </div>
                </div>
              )}

              {supplierFormStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Сертификации</h3>
                  
                  {/* Отладочная информация */}
                  <div className="bg-gray-100 p-4 border border-gray-300 text-sm">
                    <p><strong>Выбранная категория:</strong> {supplierFormData.category}</p>
                    <p><strong>Найденные сертификаты:</strong> {(CATEGORY_CERTIFICATIONS.find(cat => cat.category === supplierFormData.category)?.certifications || []).join(', ') || 'Нет сертификатов'}</p>
                  </div>
                  
                    <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      Выберите релевантные сертификации для вашей категории
                      </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(CATEGORY_CERTIFICATIONS.find(cat => cat.category === supplierFormData.category)?.certifications || []).map(cert => (
                        <label key={cert} className="flex items-center gap-2 text-black">
                            <input
                              type="checkbox"
                              checked={supplierFormData.certifications.includes(cert)}
                            onChange={e => {
                                if (e.target.checked) {
                                  setSupplierFormData({
                                    ...supplierFormData,
                                    certifications: [...supplierFormData.certifications, cert]
                                  })
                                } else {
                                  setSupplierFormData({
                                    ...supplierFormData,
                                    certifications: supplierFormData.certifications.filter(c => c !== cert)
                                  })
                                }
                              }}
                            />
                          {cert}
                          </label>
                        ))}
                      </div>
                      {supplierFormErrors.certifications && (
                      <p className="text-sm text-red-500 mt-2">{supplierFormErrors.certifications}</p>
                      )}
                    </div>
                </div>
              )}

              {supplierFormStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Товары и каталог</h3>
                  
                  {/* Кнопка добавления товара */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-gray-600 text-sm">Добавьте товары, которые вы производите или поставляете</p>
                    </div>
                    <button
                      onClick={() => {
                        const newProduct = {
                          id: Date.now().toString(),
                          name: '',
                          price: '',
                          description: '',
                          images: [],
                          specifications: {},
                          category: supplierFormData.category,
                          inStock: true,
                          minOrder: ''
                        }
                        setSupplierFormData({
                          ...supplierFormData,
                          products: [...supplierFormData.products, newProduct]
                        })
                      }}
                      className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600 transition-all text-sm font-medium uppercase tracking-wider flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить товар
                    </button>
                  </div>

                  {/* Список товаров */}
                  <div className="space-y-6">
                    {supplierFormData.products.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium uppercase tracking-wider">Товары не добавлены</p>
                        <p className="text-gray-400 text-sm mt-2">Нажмите кнопку "Добавить товар" для начала</p>
                      </div>
                    ) : (
                      supplierFormData.products.map((product, index) => (
                        <div key={product.id} className="border-2 border-black p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                              Товар #{index + 1}
                            </h4>
                            <button
                              onClick={() => {
                                setSupplierFormData({
                                  ...supplierFormData,
                                  products: supplierFormData.products.filter(p => p.id !== product.id)
                                })
                              }}
                              className="text-red-500 hover:bg-red-50 p-2 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                                Название товара
                              </label>
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => {
                                  const updatedProducts = supplierFormData.products.map(p => 
                                    p.id === product.id ? { ...p, name: e.target.value } : p
                                  )
                                  setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                }}
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Например: Беспроводные наушники"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                                Цена
                              </label>
                              <input
                                type="text"
                                value={product.price}
                                onChange={(e) => {
                                  const updatedProducts = supplierFormData.products.map(p => 
                                    p.id === product.id ? { ...p, price: e.target.value } : p
                                  )
                                  setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                }}
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="$25.99"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                                Минимальный заказ
                              </label>
                              <input
                                type="text"
                                value={product.minOrder}
                                onChange={(e) => {
                                  const updatedProducts = supplierFormData.products.map(p => 
                                    p.id === product.id ? { ...p, minOrder: e.target.value } : p
                                  )
                                  setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                }}
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="100 шт"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                                Наличие
                              </label>
                              <select
                                value={product.inStock ? 'true' : 'false'}
                                onChange={(e) => {
                                  const updatedProducts = supplierFormData.products.map(p => 
                                    p.id === product.id ? { ...p, inStock: e.target.value === 'true' } : p
                                  )
                                  setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                }}
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="true">В наличии</option>
                                <option value="false">Под заказ</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                              Описание товара
                            </label>
                            <textarea
                              value={product.description}
                              onChange={(e) => {
                                const updatedProducts = supplierFormData.products.map(p => 
                                  p.id === product.id ? { ...p, description: e.target.value } : p
                                )
                                setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                              }}
                              rows={3}
                              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Детальное описание товара, его особенностей и преимуществ..."
                            />
                          </div>

                          {/* Блок загрузки изображений товара */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                              Изображения товара
                            </label>
                            {/* 🔍 ОТЛАДКА: показываем информацию о картинках */}
                            <div className="text-xs text-gray-500 mb-2">
                              DEBUG: У товара "{product.name}" картинок: {product.images?.length || 0}
                              {product.images && product.images.length > 0 && (
                                <div>Первая картинка: {product.images[0]}</div>
                              )}
                            </div>
                            <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                              <div className="space-y-4">
                                {/* Превью загруженных изображений */}
                                {product.images && product.images.length > 0 && (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {product.images.map((image, imgIndex) => (
                                      <div key={imgIndex} className="relative group">
                                        <img
                                          src={image}
                                          alt={`Товар ${index + 1} - изображение ${imgIndex + 1}`}
                                          className="w-full h-24 object-cover border border-gray-300 rounded"
                                        />
                                        <button
                                          onClick={() => {
                                            const updatedProducts = supplierFormData.products.map(p => 
                                              p.id === product.id 
                                                ? { ...p, images: p.images.filter((_, i) => i !== imgIndex) }
                                                : p
                                            )
                                            setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                          }}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          ×
                                        </button>
                            </div>
                                    ))}
                                  </div>
                                )}

                                {/* Кнопка загрузки */}
                                <div>
                                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500 font-medium uppercase tracking-wider mb-2">
                                    Загрузить изображения
                                  </p>
                                  <p className="text-gray-400 text-sm mb-4">
                                    JPG, PNG до 5MB. Рекомендуется 3-5 фотографий<br/>
                                    <span className="text-orange-500 font-medium">👆 Нажмите "Выбрать файлы" ниже</span>
                                  </p>
                                  
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || [])
                                      console.log(`🖼️ Выбрано ${files.length} файлов для товара "${product.name}" (ID: ${product.id})`)
                                      
                                      if (files.length === 0) {
                                        console.log('❌ Нет файлов для загрузки')
                                        return
                                      }
                                      
                                      console.log(`📁 Файлы:`, files.map(f => `${f.name} (${Math.round(f.size / 1024)}KB)`))
                                      
                                      setUploadingImages({
                                        ...uploadingImages,
                                        [product.id]: true
                                      })
                                      
                                      console.log(`⏳ Начата загрузка изображений для товара ${product.id}`)

                                      // Проверяем размер файлов
                                      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024) // 5MB
                                      if (oversizedFiles.length > 0) {
                                        alert(`Файлы слишком большие (>5MB): ${oversizedFiles.map(f => f.name).join(', ')}`)
                                        setUploadingImages({
                                          ...uploadingImages,
                                          [product.id]: false
                                        })
                                        return
                                      }

                                      try {
                                        const uploadPromises = files.map(async (file) => {
                                          // Создаем уникальное имя файла
                                          const fileName = `product_${product.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                                          
                                          try {
                                            // Импортируем Supabase клиент
                                            const { supabase } = await import('@/lib/supabaseClient')
                                            
                                            // Загружаем в Supabase Storage
                                            const { data, error } = await supabase.storage
                                              .from('product-images')
                                              .upload(fileName, file, {
                                                cacheControl: '3600',
                                                upsert: false
                                              })

                                            if (error) {
                                              console.error('Ошибка загрузки файла:', error.message)
                                              
                                              // Если bucket не существует, используем Base64
                                              if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
                                                console.warn('Bucket product-images не найден, используем Base64')
                                                try {
                                                  const base64 = await convertToBase64(file)
                                                  return base64
                                                } catch (base64Error) {
                                                  console.error('Ошибка конвертации в Base64:', base64Error)
                                                  return `https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=${encodeURIComponent(file.name)}`
                                                }
                                              }
                                              
                                              return null
                                            }

                                            // Получаем публичный URL
                                            const { data: { publicUrl } } = supabase.storage
                                              .from('product-images')
                                              .getPublicUrl(fileName)

                                            return publicUrl
                                          } catch (fileError) {
                                            console.error('Ошибка обработки файла:', file.name, fileError)
                                            // Пытаемся конвертировать в Base64 как запасной вариант
                                            try {
                                              const base64 = await convertToBase64(file)
                                              console.log('✅ Использован Base64 для файла:', file.name)
                                              return base64
                                            } catch (base64Error) {
                                              console.error('Ошибка Base64 конвертации:', base64Error)
                                              return `https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=${encodeURIComponent(file.name)}`
                                            }
                                          }
                                        })

                                        const uploadedUrls = await Promise.all(uploadPromises)
                                        const validUrls = uploadedUrls.filter((url: string | null) => url !== null) as string[]

                                        console.log(`📊 Результат загрузки:`, {
                                          uploadedUrls: uploadedUrls.length,
                                          validUrls: validUrls.length,
                                          urls: validUrls
                                        })

                                        if (validUrls.length > 0) {
                                          const updatedProducts = supplierFormData.products.map(p => 
                                            p.id === product.id 
                                              ? { ...p, images: [...(p.images || []), ...validUrls] }
                                              : p
                                          )
                                          setSupplierFormData({ ...supplierFormData, products: updatedProducts })
                                          
                                          console.log(`✅ Загружено ${validUrls.length} изображений для товара "${product.name}"`)
                                          console.log(`🖼️ Итого изображений у товара: ${(product.images || []).length + validUrls.length}`)
                                        } else {
                                          console.warn('⚠️ Не удалось загрузить ни одного изображения')
                                          alert('Не удалось загрузить изображения. Попробуйте еще раз или обратитесь к администратору.')
                                        }
                                      } catch (error) {
                                        console.error('❌ Критическая ошибка при загрузке изображений:', error)
                                        alert('Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте позже.')
                                      } finally {
                                        setUploadingImages({
                                          ...uploadingImages,
                                          [product.id]: false
                                        })
                                      }
                                    }}
                                    className="hidden"
                                    id={`product-images-${product.id}`}
                                  />
                                  
                                  <label
                                    htmlFor={`product-images-${product.id}`}
                                    className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all cursor-pointer text-sm font-medium uppercase tracking-wider ${
                                      uploadingImages[product.id] ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {uploadingImages[product.id] ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Загрузка...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4" />
                                        Выбрать файлы
                                      </>
                                    )}
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {supplierFormErrors.products && (
                    <p className="text-sm text-red-500 mt-4">{supplierFormErrors.products}</p>
                  )}
                </div>
              )}

              {supplierFormStep === 6 && (
                <div className="space-y-10">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Реквизиты для приёма платежей</h3>
                  <p className="text-gray-600 text-sm mb-6">Заполните реквизиты для всех способов, которые вы поддерживаете. Оставьте пустым, если не используете какой-то способ.</p>

                  {/* Банковский перевод */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><span className="text-2xl">🏦</span> Банковский перевод (SWIFT/SEPA)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Название банка</label>
                        <input type="text" value={supplierFormData.bank_name} onChange={e => setSupplierFormData({...supplierFormData, bank_name: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Bank of China" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Номер счета</label>
                        <input type="text" value={supplierFormData.bank_account} onChange={e => setSupplierFormData({...supplierFormData, bank_account: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="1234567890123456" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">SWIFT/BIC</label>
                        <input type="text" value={supplierFormData.swift_code} onChange={e => setSupplierFormData({...supplierFormData, swift_code: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="BKCHCNBJ" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Валюта</label>
                        <select value={supplierFormData.currency} onChange={e => setSupplierFormData({...supplierFormData, currency: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400">
                          <option value="USD">USD - Доллар США</option>
                          <option value="EUR">EUR - Евро</option>
                          <option value="CNY">CNY - Китайский юань</option>
                          <option value="RUB">RUB - Российский рубль</option>
                          <option value="TRY">TRY - Турецкая лира</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-black mb-2">Адрес банка</label>
                      <textarea value={supplierFormData.bank_address} onChange={e => setSupplierFormData({...supplierFormData, bank_address: e.target.value})} rows={2} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Полный адрес банка для международных переводов..." />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-black mb-2">Платежные условия</label>
                      <select value={supplierFormData.payment_terms} onChange={e => setSupplierFormData({...supplierFormData, payment_terms: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">Выберите условия</option>
                        <option value="30% предоплата, 70% до отгрузки">30% предоплата, 70% до отгрузки</option>
                        <option value="50% предоплата, 50% до отгрузки">50% предоплата, 50% до отгрузки</option>
                        <option value="100% предоплата">100% предоплата</option>
                        <option value="T/T 30 дней">T/T 30 дней</option>
                        <option value="L/C at sight">L/C at sight</option>
                        <option value="Cash on delivery">Cash on delivery</option>
                      </select>
                    </div>
            </div>

                  {/* P2P перевод на карту */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2"><span className="text-2xl">💳</span> P2P перевод на карту</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Банк-эмитент</label>
                        <input type="text" value={supplierFormData.card_bank || ''} onChange={e => setSupplierFormData({...supplierFormData, card_bank: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Сбербанк, Tinkoff, ICBC..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Номер карты</label>
                        <input type="text" value={supplierFormData.card_number || ''} onChange={e => setSupplierFormData({...supplierFormData, card_number: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Владелец карты</label>
                        <input type="text" value={supplierFormData.card_holder || ''} onChange={e => setSupplierFormData({...supplierFormData, card_holder: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="IVAN IVANOV" />
                      </div>
                    </div>
                  </div>

                  {/* Криптовалюта */}
                  <div className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2"><span className="text-2xl">₿</span> Криптовалюта</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Сеть</label>
                        <input type="text" value={supplierFormData.crypto_network || ''} onChange={e => setSupplierFormData({...supplierFormData, crypto_network: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="USDT TRC20, BTC, ETH..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Адрес кошелька</label>
                        <input type="text" value={supplierFormData.crypto_address || ''} onChange={e => setSupplierFormData({...supplierFormData, crypto_address: e.target.value})} className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="0x... или T..." />
                      </div>
                    </div>
                  </div>
                </div>
              )}

                  {/* Отображение ошибок валидации */}
                  {supplierFormStep === 6 && Object.keys(supplierFormErrors).length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <h4 className="text-lg font-semibold text-red-800 mb-2">Исправьте ошибки:</h4>
                      <ul className="space-y-1">
                        {Object.entries(supplierFormErrors).map(([field, error]) => (
                          <li key={field} className="text-sm text-red-600">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

              {supplierFormStep === 7 && (
                <div className="space-y-8">
                  <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Финальное превью</h3>
                  
                  {/* Основная информация */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏢</span> Основная информация
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Название:</span>
                          <span className="font-medium text-black">{supplierFormData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Компания:</span>
                          <span className="font-medium text-black">{supplierFormData.company_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Категория:</span>
                          <span className="font-medium text-black">{supplierFormData.category}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Страна:</span>
                          <span className="font-medium text-black">{supplierFormData.country}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Город:</span>
                          <span className="font-medium text-black">{supplierFormData.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Мин. заказ:</span>
                          <span className="font-medium text-black">{supplierFormData.min_order || 'Не указан'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Контактная информация */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span> Контактная информация
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-black">{supplierFormData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Телефон:</span>
                          <span className="font-medium text-black">{supplierFormData.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Контактное лицо:</span>
                          <span className="font-medium text-black">{supplierFormData.contact_person}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Веб-сайт:</span>
                          <span className="font-medium text-black">{supplierFormData.website || 'Не указан'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Сертификации */}
                  {(() => {
                    const certs = getCertifications(supplierFormData.certifications?.join(',') || null)
                    return certs.length > 0 && (
                      <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                        <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">🏆</span> Сертификации
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {certs.map((cert: string, index: number) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 text-sm border border-purple-200 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Товары */}
                  {supplierFormData.products.length > 0 && (
                    <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📦</span> Каталог товаров ({supplierFormData.products.length})
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {supplierFormData.products.map((product, index) => (
                          <div key={product.id} className="border-2 border-orange-300 bg-white p-4 rounded">
                            {/* Превью изображения товара */}
                            <div className="w-full h-32 bg-gray-100 border border-gray-300 flex items-center justify-center mb-3 rounded">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <span className="text-gray-400 text-sm">ФОТО ТОВАРА</span>
                              )}
                            </div>
                            
                            {/* Информация о товаре */}
                            <h5 className="font-medium text-black mb-2 line-clamp-2">{product.name || `Товар #${index + 1}`}</h5>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description || 'Описание не указано'}</p>
                            
                            <div className="space-y-2">
                              {product.price && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Цена:</span>
                                  <span className="font-medium text-orange-600">{product.price}</span>
                                </div>
                              )}
                              {product.minOrder && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">MOQ:</span>
                                  <span className="font-medium">{product.minOrder}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Статус:</span>
                                <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-orange-600'}`}>
                                  {product.inStock ? 'В наличии' : 'Под заказ'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Реквизиты для платежей */}
                  {(supplierFormData.bank_name || supplierFormData.card_number || supplierFormData.crypto_address) && (
                    <div className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💳</span> Способы оплаты
                      </h4>
                      <div className="space-y-3">
                        {supplierFormData.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Банк:</span>
                            <span className="font-medium text-black">{supplierFormData.bank_name}</span>
                          </div>
                        )}
                        {supplierFormData.card_bank && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">P2P карта:</span>
                            <span className="font-medium text-black">{supplierFormData.card_bank}</span>
                          </div>
                        )}
                        {supplierFormData.crypto_network && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Криптовалюта:</span>
                            <span className="font-medium text-black">{supplierFormData.crypto_network}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Итоговая статистика */}
                  <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span> Итоговая статистика
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{supplierFormData.products.length}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Товаров</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{supplierFormData.certifications.length}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Сертификатов</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{supplierFormData.products.filter(p => p.inStock).length}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">В наличии</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">
                          {[supplierFormData.bank_name, supplierFormData.card_bank, supplierFormData.crypto_network].filter(Boolean).length}
                        </div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Способов оплаты</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

                        {/* Footer модала с кнопками навигации */}
            <div className="border-t-2 border-black p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  {supplierFormStep > 1 && (
                    <button
                      onClick={() => {
                        setSupplierFormStep(supplierFormStep - 1)
                      }}
                      className="border-2 border-black text-black px-6 py-3 hover:bg-black hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                    >
                      ← Назад
                    </button>
                  )}
                
                  {supplierFormStep < supplierSteps.length ? (
                     <button
                       onClick={() => {
                         if (validateSupplierStep(supplierFormStep)) {
                           setSupplierFormStep(supplierFormStep + 1)
                          setMaxSupplierStep(Math.max(maxSupplierStep, supplierFormStep + 1))
                         }
                       }}
                       className="bg-orange-500 text-white px-6 py-3 hover:bg-orange-600 transition-all text-sm font-medium uppercase tracking-wider"
                     >
                      Вперед →
                     </button>
                  ) : (
                     <button
                      onClick={handleSubmitSupplier}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-3 hover:bg-green-700 transition-all text-sm font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '⏳ Сохранение...' : '✓ Добавить поставщика'}
                     </button>
                  )}
                </div>
                  
                                     <button
                     onClick={() => {
                       setShowAddSupplierModal(false)
                       resetSupplierForm()
                       setEchoCardForImport(null) // Очищаем эхо карточку при закрытии
                       console.log('🔄 Форма закрыта, состояние сброшено')
                     }}
                     className="border-2 border-gray-400 text-gray-600 px-6 py-3 hover:bg-gray-400 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                   >
                     Отмена
                   </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно профиля поставщика */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-6xl w-full max-h-[95vh] my-4 flex flex-col">
            {/* Header модала */}
            <div className="border-b-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  {/* Кликабельный логотип */}
                  <div 
                    className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-300 relative group"
                    onClick={openLogoFileDialog}
                    title="Нажмите для смены логотипа"
                  >
                    {uploadingSupplierLogo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : selectedSupplier.logo_url ? (
                      <>
                        <img 
                          src={selectedSupplier.logo_url} 
                          alt={selectedSupplier.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay при наведении */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                            СМЕНИТЬ
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600 text-xs text-center font-bold bg-red-100 w-full h-full flex flex-col items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300">
                        <span>ЛОГОТИП</span>
                        <span>ОТСУТСТВУЕТ</span>
                        <span className="text-[8px] mt-1 opacity-70">КЛИКНИТЕ</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-light text-black tracking-wide">{selectedSupplier.name}</h2>
                    <div className="w-24 h-0.5 bg-black mt-2"></div>
                    <p className="text-gray-600 mt-3 font-light">{selectedSupplier.company_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full">{selectedSupplier.category}</span>
                      <span className="text-gray-600 text-sm">📍 {selectedSupplier.city}, {selectedSupplier.country}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Табы */}
              <div className="flex border-2 border-black">
                <button
                  onClick={() => setModalTab('info')}
                  className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                    modalTab === 'info'
                      ? 'bg-blue-600 text-white border-r-2 border-blue-600'
                      : 'bg-white text-black border-r-2 border-black hover:bg-gray-50'
                  }`}
                >
                  Информация
                </button>
                <button
                  onClick={() => {
                    setModalTab('products')
                    // Загружаем товары при переключении на вкладку с правильным типом
                    if (selectedSupplier) {
                      // Определяем тип поставщика на основе текущего режима
                      const supplierType = selectedRoom === 'blue' ? 'user' : 'verified'
                      loadSupplierProducts(selectedSupplier.id, supplierType)
                    }
                  }}
                  className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                    modalTab === 'products'
                      ? 'bg-blue-600 text-white border-r-2 border-blue-600'
                      : 'bg-white text-black border-r-2 border-black hover:bg-gray-50'
                  }`}
                >
                  Товары
                </button>
                {/* Показываем вкладку управления только для личных поставщиков */}
                {activeMode === 'clients' && (
                  <button
                    onClick={() => {
                      setModalTab('management')
                      // Загружаем товары при переключении на вкладку управления
                      if (selectedSupplier) {
                        loadSupplierProducts(selectedSupplier.id, 'user')
                      }
                    }}
                    className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                      modalTab === 'management'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    Управление
                  </button>
                )}
              </div>
            </div>

            {/* Содержимое модала */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalTab === 'info' ? (
                <div className="space-y-6">
                  {/* Описание */}
                  {selectedSupplier.description && (
                    <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Описание компании</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedSupplier.description}</p>
                    </div>
                  )}

                  {/* Контактная информация */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📞</span> Контактная информация
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-black">{selectedSupplier.contact_email || 'Не указан'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Телефон:</span>
                          <span className="font-medium text-black">{selectedSupplier.contact_phone || 'Не указан'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Контактное лицо:</span>
                          <span className="font-medium text-black">{selectedSupplier.contact_person || 'Не указан'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Веб-сайт:</span>
                          <span className="font-medium text-black">{selectedSupplier.website || 'Не указан'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Бизнес-информация */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏭</span> Бизнес-информация
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Минимальный заказ:</span>
                          <span className="font-medium text-black">{selectedSupplier.min_order || 'Не указан'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Время ответа:</span>
                          <span className="font-medium text-black">{selectedSupplier.response_time || 'Не указано'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Сотрудники:</span>
                          <span className="font-medium text-black">{selectedSupplier.employees || 'Не указано'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Год основания:</span>
                          <span className="font-medium text-black">{selectedSupplier.established || 'Не указан'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Статистика проектов */}
                  <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Статистика проектов
                      </h4>
                      {/* Кнопка обновления из эхо карточки - показываем только если статистика пустая */}
                      {activeMode === 'clients' && (selectedSupplier.total_projects === 0 || !selectedSupplier.total_projects) && (
                        <button
                          onClick={() => {
                            setShowEchoCardsModal(true)
                            console.log('🔄 Открываем эхо карточки для обновления поставщика:', selectedSupplier.name)
                          }}
                          className="bg-purple-600 text-white px-3 py-2 text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors flex items-center gap-2"
                          title="Найти и обновить данные из эхо карточек"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Обновить из эхо карточки
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{selectedSupplier.total_projects || 0}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Всего проектов</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedSupplier.successful_projects || 0}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Успешных</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{selectedSupplier.cancelled_projects || 0}</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Отмененных</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedSupplier.total_spent || 0}$</div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Потрачено</div>
                      </div>
                    </div>
                    
                    {/* Подсказка если статистика пустая */}
                    {(selectedSupplier.total_projects === 0 || !selectedSupplier.total_projects) && activeMode === 'clients' && (
                      <div className="mt-4 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded">
                        💡 <strong>Совет:</strong> Если этот поставщик создан из эхо карточки, используйте кнопку "Обновить из эхо карточки" выше, чтобы загрузить статистику из ваших проектов.
                      </div>
                    )}
                  </div>

                  {/* Сертификации */}
                  {(() => {
                    const certs = selectedSupplier ? getCertifications(selectedSupplier.certifications) : []
                    return certs.length > 0 && (
                      <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                        <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">🏆</span> Сертификации
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {certs.map((cert: string, index: number) => (
                            <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 text-sm border border-purple-200 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : modalTab === 'products' ? (
                <div className="space-y-6">
                  {loadingProducts ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-lg text-gray-600">Загрузка товаров...</div>
                    </div>
                  ) : supplierProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-xl font-semibold mb-2">Каталог товаров</h3>
                      <p className="text-gray-600">У этого поставщика пока нет товаров в каталоге</p>
                      <p className="text-sm text-gray-500 mt-2">Товары добавляются автоматически при создании проектов</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                          <Package className="w-6 h-6 text-blue-600" />
                          Товары поставщика ({supplierProducts.length})
                        </h3>
                        <span className="text-sm text-gray-500">
                          Обновлено: {new Date().toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {supplierProducts.map((product: any) => (
                          <div 
                            key={product.id} 
                            className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group"
                            onClick={() => openProductModal(product)}
                            title="Нажмите для просмотра подробностей"
                          >
                            {/* Изображение товара */}
                            <div className="w-full h-48 border border-gray-200 rounded-md mb-4 flex items-center justify-center bg-gray-50">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <div className="text-gray-400 text-center">
                                  <Package className="w-12 h-12 mx-auto mb-2" />
                                  <span className="text-sm">Нет фото</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Информация о товаре */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 text-lg line-clamp-2">{product.name}</h4>
                              
                              {product.description && (
                                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
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
                              
                              {/* Кнопки действий */}
                              <div className="flex gap-2 pt-3">
                                <button 
                                  className="flex-1 bg-blue-600 text-white py-2 px-3 text-sm rounded hover:bg-blue-700 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // TODO: Реализовать запрос цены
                                    alert('Функция "Запросить цену" в разработке')
                                  }}
                                >
                                  Запросить цену
                                </button>
                                <button 
                                  className="flex-1 border border-blue-600 text-blue-600 py-2 px-3 text-sm rounded hover:bg-blue-600 hover:text-white transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // TODO: Реализовать добавление в проект
                                    alert('Функция "В проект" в разработке')
                                  }}
                                >
                                  В проект
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : modalTab === 'management' ? (
                <div className="space-y-6">
                  {/* Заголовок управления */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                    <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                      <Edit className="w-8 h-8 text-green-600" />
                      Управление товарами поставщика
                    </h3>
                    <p className="text-green-700">
                      Здесь вы можете управлять товарами вашего поставщика: добавлять новые, редактировать существующие и удалять ненужные.
                    </p>
                  </div>

                  {/* Быстрая статистика */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-3xl font-bold text-blue-600">{supplierProducts.length}</div>
                      <div className="text-sm text-blue-700 font-medium">Всего товаров</div>
                    </div>
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {supplierProducts.filter(p => p.in_stock).length}
                      </div>
                      <div className="text-sm text-green-700 font-medium">В наличии</div>
                    </div>
                    <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50 text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {supplierProducts.filter(p => !p.in_stock).length}
                      </div>
                      <div className="text-sm text-orange-700 font-medium">Нет в наличии</div>
                    </div>
                  </div>

                  {/* Управление поставщиком */}
                  <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                    <h4 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
                      <Trash2 className="w-6 h-6 text-red-600" />
                      Опасная зона - Управление поставщиком
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-red-800 mb-2">Удалить поставщика</h5>
                          <p className="text-red-700 text-sm">
                            Полное удаление поставщика из вашей синей комнаты. Будут удалены все товары и связанные данные. 
                            Это действие необратимо.
                          </p>
                          <div className="mt-3">
                            <div className="text-xs text-red-600 space-y-1">
                              <div>• Поставщик: <strong>{selectedSupplier.name}</strong></div>
                              <div>• Товары к удалению: <strong>{supplierProducts.length} шт</strong></div>
                              <div>• ID: <span className="font-mono">{selectedSupplier.id}</span></div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ml-4"
                        >
                          <Trash2 className="w-5 h-5" />
                          Удалить поставщика
                        </button>
                      </div>
                      
                      <div className="border-t border-red-200 pt-4">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <span className="text-red-500">⚠️</span>
                          <span>
                            После удаления поставщик исчезнет из вашего каталога навсегда. 
                            Восстановить данные будет невозможно.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Управление товарами */}
                  <div className="border-2 border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Каталог товаров
                      </h4>
                      <button
                        onClick={() => openProductEditor()}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Добавить товар
                      </button>
                    </div>

                    {loadingProducts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <div className="text-lg text-gray-600">Загрузка товаров...</div>
                      </div>
                    ) : supplierProducts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold mb-2">Нет товаров</h3>
                        <p className="text-gray-600 mb-4">У этого поставщика пока нет товаров в каталоге</p>
                        <button
                          onClick={() => openProductEditor()}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Plus className="w-5 h-5" />
                          Добавить первый товар
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {supplierProducts.map((product: any) => (
                          <div key={product.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 relative group">
                            {/* Кнопки управления */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openProductEditor(product)}
                                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                                title="Редактировать товар"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors"
                                title="Удалить товар"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Изображение товара */}
                            <div className="w-full h-48 border border-gray-200 rounded-md mb-4 flex items-center justify-center bg-gray-50">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <div className="text-gray-400 text-center">
                                  <Package className="w-12 h-12 mx-auto mb-2" />
                                  <span className="text-sm">Нет фото</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Информация о товаре */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 text-lg line-clamp-2">{product.name}</h4>
                              
                              {product.description && (
                                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
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
                              
                              {/* Статус управления */}
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}...</span>
                                  <span className={`text-xs px-2 py-1 rounded ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.in_stock ? 'Активен' : 'Неактивен'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer модала */}
            <div className="border-t-2 border-black p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStartProject(selectedSupplier)}
                    className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-all text-sm font-medium uppercase tracking-wider"
                  >
                    Начать проект
                  </button>
                  <button className="border-2 border-green-600 text-green-600 px-6 py-3 hover:bg-green-600 hover:text-white transition-all text-sm font-medium uppercase tracking-wider">
                    Добавить в избранное
                  </button>
                </div>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="border-2 border-gray-400 text-gray-600 px-6 py-3 hover:bg-gray-400 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно редактора товаров */}
      {showProductEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок модала */}
            <div className="border-b-2 border-black p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                </h2>
                <button
                  onClick={() => setShowProductEditor(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Содержимое модала */}
            <div className="p-6 space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название товара *
                    </label>
                    <input
                      type="text"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите название товара"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Артикул
                    </label>
                    <input
                      type="text"
                      value={productFormData.sku}
                      onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите артикул"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Цена
                      </label>
                      <input
                        type="number"
                        value={productFormData.price}
                        onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Валюта
                      </label>
                      <select
                        value={productFormData.currency}
                        onChange={(e) => setProductFormData({...productFormData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="RUB">RUB</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Минимальный заказ
                    </label>
                    <input
                      type="text"
                      value={productFormData.min_order}
                      onChange={(e) => setProductFormData({...productFormData, min_order: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1 шт"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="in_stock"
                      checked={productFormData.in_stock}
                      onChange={(e) => setProductFormData({...productFormData, in_stock: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="in_stock" className="ml-2 text-sm text-gray-700">
                      В наличии
                    </label>
                  </div>
                </div>

                {/* Изображения */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Изображения товара
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleProductImageUpload(e.target.files)}
                        className="hidden"
                        id="product-images"
                        disabled={uploadingProductImages}
                      />
                      <label htmlFor="product-images" className="cursor-pointer block text-center">
                        {uploadingProductImages ? (
                          <div className="text-blue-600">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            Загрузка...
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">Нажмите для выбора изображений</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Превью изображений */}
                  {productFormData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {productFormData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Изображение ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeProductImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание товара
                </label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Опишите товар, его характеристики и особенности"
                />
              </div>
            </div>

            {/* Footer модала */}
            <div className="border-t-2 border-black p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowProductEditor(false)}
                  className="border-2 border-gray-400 text-gray-600 px-6 py-3 hover:bg-gray-400 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={!productFormData.name.trim()}
                  className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-all text-sm font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingProduct ? 'Сохранить изменения' : 'Добавить товар'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно товара - элегантный дизайн */}
      {selectedProduct && showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white border-4 border-black max-w-5xl w-full max-h-[95vh] my-4 flex flex-col">
            {/* Header модального окна товара */}
            <div className="border-b-2 border-black p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-8">
                  {/* Главное изображение товара */}
                  <div className="w-48 h-48 border-2 border-black flex items-center justify-center bg-gray-50">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img 
                        src={selectedProduct.images[0]} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Package className="w-24 h-24 mx-auto mb-3" />
                        <span className="text-lg font-medium">Нет фото</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Основная информация о товаре */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-4xl font-light text-black tracking-wide mb-2">{selectedProduct.name}</h2>
                      <div className="w-32 h-0.5 bg-black"></div>
                    </div>
                    
                    {selectedProduct.sku && (
                      <p className="text-gray-600 font-mono text-sm">
                        Артикул: <span className="text-black font-medium">{selectedProduct.sku}</span>
                      </p>
                    )}

                    {/* Основные характеристики в одну строку */}
                    <div className="grid grid-cols-3 gap-6 pt-4">
                      <div className="text-center">
                        <div className="text-3xl font-light text-black mb-1">
                          {selectedProduct.price ? `${selectedProduct.price} ${selectedProduct.currency || 'USD'}` : '—'}
                        </div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Цена</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-light text-black mb-1">
                          {selectedProduct.min_order || '—'}
                        </div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Мин. заказ</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-3xl font-light mb-1 ${selectedProduct.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.in_stock ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-gray-600 uppercase tracking-wider">Наличие</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeProductModal}
                  className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Основное содержимое */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Левая колонка - Описание и характеристики */}
                <div className="lg:col-span-2 p-8 border-r-2 border-black">
                  <div className="space-y-8">
                    {/* Описание товара */}
                    {selectedProduct.description && (
                      <div>
                        <h3 className="text-2xl font-light text-black mb-4 tracking-wide">
                          Описание товара
                        </h3>
                        <div className="w-16 h-0.5 bg-black mb-6"></div>
                        <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                          {selectedProduct.description}
                        </div>
                      </div>
                    )}

                    {/* Дополнительные изображения */}
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div>
                        <h3 className="text-2xl font-light text-black mb-4 tracking-wide">
                          Дополнительные изображения
                        </h3>
                        <div className="w-16 h-0.5 bg-black mb-6"></div>
                        <div className="grid grid-cols-3 gap-4">
                          {selectedProduct.images.slice(1).map((image: string, index: number) => (
                            <div key={index} className="border-2 border-gray-200 hover:border-black transition-colors">
                              <img 
                                src={image} 
                                alt={`${selectedProduct.name} - изображение ${index + 2}`}
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Технические характеристики */}
                    {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                      <div>
                        <h3 className="text-2xl font-light text-black mb-4 tracking-wide">
                          Технические характеристики
                        </h3>
                        <div className="w-16 h-0.5 bg-black mb-6"></div>
                        <div className="space-y-3">
                          {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                              <span className="text-gray-600 capitalize text-lg">{key}</span>
                              <span className="font-medium text-black text-lg">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка - Поставщик и действия */}
                <div className="p-8 bg-gray-50 space-y-8">
                  {/* Информация о поставщике */}
                  <div>
                    <h3 className="text-2xl font-light text-black mb-4 tracking-wide">
                      Поставщик
                    </h3>
                    <div className="w-16 h-0.5 bg-black mb-6"></div>
                    
                    <div className="border-2 border-black p-6 bg-white">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 border-2 border-black flex items-center justify-center bg-gray-50">
                          {selectedSupplier?.logo_url ? (
                            <img 
                              src={selectedSupplier.logo_url} 
                              alt={selectedSupplier.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-black">{selectedSupplier?.name}</h4>
                          <p className="text-gray-600">{selectedSupplier?.company_name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Местоположение:</span>
                          <span className="text-black">{selectedSupplier?.city}, {selectedSupplier?.country}</span>
                        </div>
                        {selectedProduct.category && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Категория:</span>
                            <span className="text-black">{selectedProduct.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div>
                    <h3 className="text-2xl font-light text-black mb-4 tracking-wide">
                      Действия
                    </h3>
                    <div className="w-16 h-0.5 bg-black mb-6"></div>
                    
                    <div className="space-y-4">
                      <button className="w-full bg-black text-white py-4 px-6 hover:bg-gray-800 transition-colors text-lg font-medium uppercase tracking-wider flex items-center justify-center gap-3">
                        <MessageCircle className="w-5 h-5" />
                        Запросить цену
                      </button>
                      
                      <button className="w-full border-2 border-black text-black py-4 px-6 hover:bg-black hover:text-white transition-colors text-lg font-medium uppercase tracking-wider flex items-center justify-center gap-3">
                        <Plus className="w-5 h-5" />
                        Добавить в проект
                      </button>
                      
                      <button className="w-full border-2 border-gray-400 text-gray-600 py-3 px-6 hover:bg-gray-400 hover:text-white transition-colors text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-3">
                        <Heart className="w-4 h-4" />
                        В избранное
                      </button>
                    </div>
                  </div>

                  {/* Техническая информация */}
                  <div className="pt-6 border-t border-gray-300">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>ID товара: <span className="font-mono">{selectedProduct.id}</span></div>
                      <div>Добавлен: {new Date(selectedProduct.created_at).toLocaleDateString('ru-RU')}</div>
                      {selectedProduct.updated_at !== selectedProduct.created_at && (
                        <div>Обновлен: {new Date(selectedProduct.updated_at).toLocaleDateString('ru-RU')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ЭХО КАРТОЧКИ: Модальное окно */}
      {showEchoCardsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-[1384px] w-full max-h-[95vh] overflow-hidden border-4 border-black">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b-2 border-black bg-purple-50">
              <div>
                <h2 className="text-3xl font-light text-black tracking-wide">🔮 Эхо карточки из проектов</h2>
                <p className="text-gray-600 mt-1">Поставщики извлеченные из ваших завершенных проектов</p>
              </div>
              <button
                onClick={() => setShowEchoCardsModal(false)}
                className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Содержимое модального окна */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
              {loadingEchoCards ? (
                <div className="text-center py-12">
                  <div className="text-xl text-gray-600">🔍 Анализируем ваши проекты...</div>
                  <div className="text-sm text-gray-500 mt-2">Извлекаем данные поставщиков</div>
                </div>
              ) : echoCardsError ? (
                <div className="text-center py-12">
                  <div className="text-xl text-red-600">❌ Ошибка загрузки</div>
                  <div className="text-sm text-gray-500 mt-2">{echoCardsError}</div>
                  <button 
                    onClick={loadEchoCards}
                    className="mt-4 bg-purple-600 text-white px-6 py-2 hover:bg-purple-700 transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : echoCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-xl text-gray-600">🔮 Эхо карточки не найдены</div>
                  <div className="text-sm text-gray-500 mt-2">
                    У вас пока нет завершенных проектов с данными поставщиков
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Заголовок со статистикой */}
                  <div className="bg-purple-50 border-2 border-purple-200 p-4 mb-6">
                    <div className="text-lg font-medium text-purple-800">
                      🎯 Найдено {echoCards.length} поставщиков из ваших проектов
                    </div>
                    <div className="text-sm text-purple-600 mt-1">
                      Выберите поставщиков для добавления в личный каталог
                    </div>
                  </div>

                  {/* Список эхо карточек */}
                  {echoCards.map((echoCard, index) => (
                    <div key={echoCard.supplier_key} className="border-2 border-gray-300 hover:border-purple-400 transition-all p-6">
                      <div className="flex items-start justify-between">
                        {/* Основная информация */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-2xl font-light text-black tracking-wide">
                              {echoCard.supplier_info.name}
                            </h3>
                            <div className="w-px h-6 bg-gray-400"></div>
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 text-xs uppercase tracking-wider font-medium">
                              {echoCard.supplier_info.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 text-xs uppercase tracking-wider font-medium">
                              ИЗ {echoCard.statistics.total_projects} ПРОЕКТОВ
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-6 mb-4">
                            {/* Статистика проектов */}
                            <div className="border-l-4 border-purple-600 pl-4">
                              <div className="text-2xl font-light text-black">{echoCard.statistics.success_rate}%</div>
                              <div className="text-sm text-gray-600 uppercase tracking-wider">Успешность</div>
                            </div>
                            <div className="border-l-4 border-green-600 pl-4">
                              <div className="text-2xl font-light text-black">${echoCard.statistics.total_spent.toLocaleString()}</div>
                              <div className="text-sm text-gray-600 uppercase tracking-wider">Потрачено</div>
                            </div>
                            <div className="border-l-4 border-blue-600 pl-4">
                              <div className="text-2xl font-light text-black">{echoCard.statistics.products_count}</div>
                              <div className="text-sm text-gray-600 uppercase tracking-wider">Товаров</div>
                            </div>
                          </div>

                          {/* Контактная информация */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            {echoCard.supplier_info.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{echoCard.supplier_info.city}, {echoCard.supplier_info.country}</span>
                              </div>
                            )}
                            {echoCard.supplier_info.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{echoCard.supplier_info.contact_email}</span>
                              </div>
                            )}
                            {echoCard.supplier_info.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{echoCard.supplier_info.contact_phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Товары */}
                          {echoCard.products && echoCard.products.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-700 mb-2">Товары из проектов:</div>
                              <div className="flex flex-wrap gap-2">
                                {echoCard.products.slice(0, 5).map((product: string, idx: number) => (
                                  <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs border border-gray-300">
                                    {product}
                                  </span>
                                ))}
                                {echoCard.products.length > 5 && (
                                  <span className="text-xs text-gray-500">
                                    +{echoCard.products.length - 5} еще
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Полнота данных */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-sm text-gray-600">
                              Полнота данных: {echoCard.extraction_info.completeness_score}%
                            </div>
                            <div className="flex-1 bg-gray-200 h-2">
                              <div 
                                className="bg-purple-600 h-2" 
                                style={{width: `${echoCard.extraction_info.completeness_score}%`}}
                              ></div>
                            </div>
                          </div>

                          {/* ВЫБОР ШАГОВ ИМПОРТА */}
                          {(() => {
                            initializeStepsSelection(echoCard.supplier_key)
                            const selection = importStepsSelection[echoCard.supplier_key] || {
                              step2_products: true,
                              step4_payment: true,
                              step5_requisites: true
                            }
                            
                            return (
                              <div className="bg-gray-50 border-2 border-gray-200 p-4 mb-4">
                                <div className="text-sm font-medium text-gray-700 mb-3">
                                  🎯 Выберите данные для импорта из 7-шагового процесса:
                                </div>
                                <div className="space-y-2">
                                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selection.step2_products}
                                      onChange={(e) => updateStepSelection(echoCard.supplier_key, 'step2_products', e.target.checked)}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium">STEP 2</span>
                                      <span className="text-sm">Товары и спецификации ({echoCard.statistics.products_count} товаров)</span>
                                    </div>
                                  </label>
                                  
                                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selection.step4_payment}
                                      onChange={(e) => updateStepSelection(echoCard.supplier_key, 'step4_payment', e.target.checked)}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-medium">STEP 4</span>
                                      <span className="text-sm">Способ оплаты ({echoCard.supplier_info.payment_type || 'неизвестно'})</span>
                                    </div>
                                  </label>
                                  
                                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selection.step5_requisites}
                                      onChange={(e) => updateStepSelection(echoCard.supplier_key, 'step5_requisites', e.target.checked)}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium">STEP 5</span>
                                      <span className="text-sm">Реквизиты поставщика (банк/карта/криптa)</span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Кнопка импорта */}
                        <div className="ml-6">
                          <button
                            onClick={() => {
                              const selectedSteps = importStepsSelection[echoCard.supplier_key] || {
                                step2_products: true,
                                step4_payment: true,
                                step5_requisites: true
                              }
                              // ИСПРАВЛЕНИЕ: Сбрасываем форму и устанавливаем шаг 1
                              resetSupplierForm()
                              setSupplierFormStep(1)
                              setMaxSupplierStep(1)
                              // Затем устанавливаем эхо карточку для импорта
                              setEchoCardForImport({...echoCard, selectedSteps})
                              setShowAddSupplierModal(true)
                              setShowEchoCardsModal(false)
                              console.log('🚀 Импорт эхо карточки: форма сброшена, начинаем с шага 1')
                            }}
                            className="bg-purple-600 text-white px-6 py-3 hover:bg-purple-700 transition-colors font-medium uppercase tracking-wider text-sm flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            ДОЗАПОЛНИТЬ
                          </button>
                          {echoCard.extraction_info.needs_manual_review && (
                            <div className="text-xs text-amber-600 mt-1 text-center">
                              ⚠️ Требует проверки
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Футер модального окна */}
            <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 Эхо карточки автоматически создаются из данных ваших проектов
              </div>
              <button
                onClick={() => setShowEchoCardsModal(false)}
                className="border-2 border-gray-400 text-gray-600 px-6 py-2 hover:bg-gray-400 hover:text-white transition-all uppercase tracking-wider text-sm font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно больше не нужно - категории показываются inline */}

      {/* 🛒 Модальное окно корзины */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Корзина ({getTotalItems()})
                  </h2>
                  {activeSupplier && (
                    <p className="text-sm text-gray-600 mt-1">
                      🔒 Поставщик: <span className="font-medium">{activeSupplier}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">Корзина пуста</div>
                  <div className="text-sm text-gray-400">Добавьте товары для создания проекта</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                        {item.images && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.supplier_name}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">${item.price}</span>
                          <span className="text-gray-400">×</span>
                          <span className="text-gray-600">{item.quantity}</span>
                          <span className="text-gray-400">=</span>
                          <span className="font-semibold text-green-600">
                            ${item.total_price.toFixed(2)} {item.currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                {/* Информация о поставщике для шагов 4 и 5 */}
                {activeSupplier && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      💡 Данные поставщика для проекта:
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>📋 Шаг 2: Товары от "{activeSupplier}"</div>
                      <div>💳 Шаг 4: Способ оплаты поставщика будет предложен автоматически</div>
                      <div>🏦 Шаг 5: Реквизиты поставщика будут заполнены из истории</div>
                    </div>
                  </div>
                )}
                
                {/* Подсчет суммы с детализацией */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Количество товаров:</span>
                    <span className="font-medium">{getTotalItems()} шт.</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Сумма товаров:</span>
                    <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">Итого:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={createProjectFromCart}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Перейти к созданию проекта
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Скрытый input для загрузки логотипа поставщика */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleSupplierLogoChange(file)
          }
        }}
        className="hidden"
        ref={(el) => setLogoInputRef(el)}
      />
    </div>
  )
}