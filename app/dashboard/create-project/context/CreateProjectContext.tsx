"use client"

import { createContext, useState, useContext, useMemo, useCallback, useEffect, type ReactNode } from "react"
import { logger } from '@/src/shared/lib/logger';
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
  
  // Импорт данных поставщика
  fillSupplierData: (supplierCard: any, selectedSteps: any) => void
  
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
    if (data?.crypto_wallets) {
    } else {
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
          logger.error("Failed to parse saved templates:", error)
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
  
  // Функция для заполнения данных поставщика
  const fillSupplierData = useCallback((supplierCard: any, selectedSteps: any) => {

    if (selectedSteps.step1 && supplierCard.supplier_info) {
      setCompanyData({
        name: supplierCard.supplier_info.company_name || "",
        legalName: supplierCard.supplier_info.company_name || "",
        inn: supplierCard.supplier_info.inn || "",
        kpp: supplierCard.supplier_info.kpp || "",
        ogrn: supplierCard.supplier_info.ogrn || "",
        address: supplierCard.supplier_info.address || "",
        bankName: supplierCard.supplier_info.bank_name || "",
        bankAccount: supplierCard.supplier_info.bank_account || "",
        bankCorrAccount: supplierCard.supplier_info.corr_account || "",
        bankBik: supplierCard.supplier_info.bik || "",
        email: supplierCard.supplier_info.contact_email || "",
        phone: supplierCard.supplier_info.contact_phone || "",
        website: supplierCard.supplier_info.website || "",
      })
    }

    if (selectedSteps.step2 && supplierCard.products) {

      const mappedProducts = supplierCard.products.map((product: any, index: number) => {
        
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
        
        return mappedProduct;
      });
      
      setSpecificationItems(mappedProducts);
      
      // ВАЖНО: Сохраняем товары в базу данных для Step 2
      if (projectId) {
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
        })
        .catch(error => {
          logger.error("[fillSupplierData] Error saving products to DB:", error);
        });
      }
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
    fillSupplierData,
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
    fillSupplierData,
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