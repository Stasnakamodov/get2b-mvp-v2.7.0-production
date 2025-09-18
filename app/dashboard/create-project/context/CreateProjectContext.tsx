"use client"

import { createContext, useState, useContext, useMemo, useCallback, useEffect, type ReactNode } from "react"

// Create a context for project state
interface ProjectContextType {
  // Основные состояния проекта
  currentStep: number
  setCurrentStep: (step: number) => void
  maxStepReached: number
  setMaxStepReached: (step: number) => void
  projectId: string | null
  setProjectId: (id: string | null) => void
  
  // Данные проекта
  projectName: string
  setProjectName: (name: string) => void
  companyData: any
  setCompanyData: (data: any) => void
  specificationItems: any[]
  setSpecificationItems: (items: any[]) => void
  paymentMethod: string | null
  setPaymentMethod: (method: string | null) => void
  bankDetails: any
  setBankDetails: (details: any) => void
  
  // Методы старта
  startMethod: string | null
  setStartMethod: (method: string | null) => void
  
  // Шаблоны
  savedTemplates: any[]
  saveTemplate: (template: any) => void
  loadTemplate: (index: number) => any
  
  // Эхо карточки
  fillFromEchoCard: (echoCard: any, selectedSteps: any) => void
  
  // Флаг наличия товаров из корзины
  hasCartItems: boolean
  setHasCartItems: (value: boolean) => void
  
  // Данные поставщика
  supplierData: any
  setSupplierData: (data: any) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

function ProjectProvider({ children }: { children: ReactNode }) {
  // Основные состояния
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [projectId, setProjectId] = useState<string | null>(null)
  
  // Данные проекта
  const [projectName, setProjectName] = useState("")
  const [companyData, setCompanyData] = useState(() => ({
    name: "",
    legalName: "",
    inn: "",
    kpp: "",
    ogrn: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankCorrAccount: "",
    bankBik: "",
    email: "",
    phone: "",
    website: "",
  }))
  const [specificationItems, setSpecificationItems] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [bankDetails, setBankDetails] = useState<any>(null)
  
  // Методы старта
  const [startMethod, setStartMethod] = useState<string | null>(null)
  
  // Шаблоны
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  
  // Флаг наличия товаров из корзины
  const [hasCartItems, setHasCartItems] = useState(false)
  
  // Данные поставщика
  const [supplierData, setSupplierDataState] = useState<any>({})
  
  // Обертка с отладкой для setSupplierData
  const setSupplierData = useCallback((data: any) => {
    console.log("🔥 [CONTEXT] setSupplierData вызвана с данными:", data);
    console.log("🔥 [CONTEXT] Тип данных:", typeof data);
    console.log("🔥 [CONTEXT] Ключи:", data ? Object.keys(data) : "NO DATA");
    if (data?.crypto_wallets) {
      console.log("🔥 [CONTEXT] ✅ CRYPTO_WALLETS в данных:", data.crypto_wallets);
    } else {
      console.log("🔥 [CONTEXT] ❌ НЕТ CRYPTO_WALLETS в данных");
    }
    setSupplierDataState(data);
  }, []);

  // Initialize templates from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("projectTemplates")
      if (stored) {
        try {
          setSavedTemplates(JSON.parse(stored))
        } catch (error) {
          console.error("Failed to parse saved templates:", error)
        }
      }
    }
  }, [])

  const saveTemplate = useCallback((template: any) => {
    const updatedTemplates = [...savedTemplates, template]
    setSavedTemplates(updatedTemplates)

    if (typeof window !== "undefined") {
      localStorage.setItem("projectTemplates", JSON.stringify(updatedTemplates))
    }
  }, [savedTemplates])

  const loadTemplate = useCallback((index: number) => {
    return savedTemplates[index]
  }, [savedTemplates])
  
  // Функция для заполнения из эхо карточки
  const fillFromEchoCard = useCallback((echoCard: any, selectedSteps: any) => {
    console.log("[fillFromEchoCard] Начинаем заполнение из эхо карточки:", { echoCard, selectedSteps });
    
    if (selectedSteps.step1 && echoCard.supplier_info) {
      setCompanyData({
        name: echoCard.supplier_info.company_name || "",
        legalName: echoCard.supplier_info.company_name || "",
        inn: echoCard.supplier_info.inn || "",
        kpp: echoCard.supplier_info.kpp || "",
        ogrn: echoCard.supplier_info.ogrn || "",
        address: echoCard.supplier_info.address || "",
        bankName: echoCard.supplier_info.bank_name || "",
        bankAccount: echoCard.supplier_info.bank_account || "",
        bankCorrAccount: echoCard.supplier_info.corr_account || "",
        bankBik: echoCard.supplier_info.bik || "",
        email: echoCard.supplier_info.contact_email || "",
        phone: echoCard.supplier_info.contact_phone || "",
        website: echoCard.supplier_info.website || "",
      })
    }
    
    if (selectedSteps.step2 && echoCard.products) {
      console.log("[fillFromEchoCard] Заполняем Step 2 товарами:", echoCard.products);
      console.log("[fillFromEchoCard] Структура первого товара:", echoCard.products[0]);
      
      const mappedProducts = echoCard.products.map((product: any, index: number) => {
        console.log(`[fillFromEchoCard] Обрабатываем товар ${index}:`, product);
        
        const mappedProduct = {
          name: product.item_name || product.name || "",
          code: product.item_code || product.sku || "",
          quantity: parseInt(product.quantity) || 1,
          unit: product.unit || "шт",
          pricePerUnit: parseFloat(product.price) || 0,
          totalPrice: parseFloat(product.total) || 0,
          description: product.description || "",
          image_url: product.image_url || "",
        };
        
        console.log(`[fillFromEchoCard] Преобразованный товар ${index}:`, mappedProduct);
        return mappedProduct;
      });
      
      console.log("[fillFromEchoCard] Все преобразованные товары:", mappedProducts);
      setSpecificationItems(mappedProducts);
      
      // ВАЖНО: Сохраняем товары в базу данных для Step 2
      if (projectId) {
        console.log("[fillFromEchoCard] Сохраняем товары в базу данных для projectId:", projectId);
        // Вызываем API для сохранения товаров в базу данных
        fetch('/api/project-specifications/bulk-insert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: projectId,
            items: mappedProducts,
            role: 'client'
          }),
        }).then(response => response.json())
        .then(data => {
          console.log("[fillFromEchoCard] Товары сохранены в БД:", data);
        })
        .catch(error => {
          console.error("[fillFromEchoCard] Ошибка сохранения товаров в БД:", error);
        });
      } else {
        console.log("[fillFromEchoCard] projectId еще не создан, товары будут сохранены позже");
      }
    } else {
      console.log("[fillFromEchoCard] Step 2 не заполняется:", { 
        selectedSteps: selectedSteps.step2, 
        hasProducts: !!echoCard.products,
        productsCount: echoCard.products?.length,
        echoCardKeys: echoCard ? Object.keys(echoCard) : 'echoCard is null'
      });
    }
  }, [projectId, setCompanyData, setSpecificationItems])

  const contextValue: ProjectContextType = useMemo(() => ({
    currentStep,
    setCurrentStep,
    maxStepReached,
    setMaxStepReached,
    projectId,
    setProjectId,
    projectName,
    setProjectName,
    companyData,
    setCompanyData,
    specificationItems,
    setSpecificationItems,
    paymentMethod,
    setPaymentMethod,
    bankDetails,
    setBankDetails,
    startMethod,
    setStartMethod,
    savedTemplates,
    saveTemplate,
    loadTemplate,
    fillFromEchoCard,
    hasCartItems,
    setHasCartItems,
    
    // Данные поставщика
    supplierData,
    setSupplierData,
  }), [
    currentStep,
    maxStepReached,
    projectId,
    projectName,
    companyData,
    specificationItems,
    paymentMethod,
    bankDetails,
    startMethod,
    savedTemplates,
    saveTemplate,
    loadTemplate,
    fillFromEchoCard,
    hasCartItems,
    setHasCartItems,
    supplierData,
    setSupplierData,
  ])

  return (
    <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}

// Добавляем алиасы для совместимости
export const CreateProjectProvider = ProjectProvider
export const useCreateProjectContext = useProject

export { ProjectProvider } 