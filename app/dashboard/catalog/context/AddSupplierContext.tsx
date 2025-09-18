import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { CATEGORY_CERTIFICATIONS } from '@/components/catalog-categories-and-certifications';

// ТИПЫ ДАННЫХ ПОСТАВЩИКА
export interface SupplierData {
  name: string;
  company_name: string;
  category: string;
  country: string;
  city: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  contact_person: string;
  // Дополнительные поля
  description: string;
  logo_url?: string;
  certifications: string[];
  min_order_amount: number;
  min_order_currency: string;
  delivery_time: string;
  employees: string;
  established: string;
  products?: any[];
  // Платежная информация (опционально)
  payment_methods?: any;
  payment_type?: string;
  // Банковские реквизиты
  recipient_name?: string;
  recipient_address?: string;
  bank_name?: string;
  bank_address?: string;
  account_number?: string;
  swift?: string;
  iban?: string;
  cnaps_code?: string;
  ifsc_code?: string;
  transfer_currency?: string;
  payment_purpose?: string;
  other_details?: string;
  // P2P реквизиты  
  p2p_bank?: string;
  p2p_card_number?: string;
  p2p_holder_name?: string;
  p2p_expiry_date?: string;
  // Криптореквизиты
  crypto_name?: string;
  crypto_address?: string;
  crypto_network?: string;
  // Российские реквизиты
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  actual_address?: string;
}

export interface ProductData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  min_quantity: number;
  unit: string;
  specifications: string;
  certifications: string[];
}

export interface AddSupplierContextType {
  // Навигация по шагам
  currentStep: number;
  setCurrentStep: (step: number) => void;
  maxStepReached: number;
  setMaxStepReached: (step: number) => void;
  
  // Данные поставщика
  supplierData: SupplierData;
  setSupplierData: React.Dispatch<React.SetStateAction<SupplierData>>;
  
  // Товары поставщика
  products: ProductData[];
  setProducts: (products: ProductData[]) => void;
  
  // Источник данных (ручной ввод / импорт из эхо карточки)
  sourceType: 'manual' | 'echo_card' | 'template';
  setSourceType: (type: 'manual' | 'echo_card' | 'template') => void;
  
  // ID черновика для сохранения
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  
  // Флаги состояния
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Функции управления
  resetForm: () => void;
  validateStep: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
}

const defaultSupplierData: SupplierData = {
  name: "",
  company_name: "",
  category: CATEGORY_CERTIFICATIONS[0]?.category || "Электроника",
  country: "Китай",
  city: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  contact_person: "",
  description: "",
  logo_url: "",
  certifications: [],
  products: [], // Добавляем массив товаров по умолчанию
  min_order_amount: 0,
  min_order_currency: "",
  delivery_time: "",
  employees: "",
  established: "",
  // Банковские реквизиты
  recipient_name: "",
  recipient_address: "",
  bank_name: "",
  bank_address: "",
  account_number: "",
  swift: "",
  iban: "",
  cnaps_code: "",
  ifsc_code: "",
  transfer_currency: "USD",
  payment_purpose: "",
  other_details: "",
  // P2P реквизиты
  p2p_bank: "",
  p2p_card_number: "",
  p2p_holder_name: "",
  p2p_expiry_date: "",
  // Криптореквизиты
  crypto_name: "",
  crypto_address: "",
  crypto_network: "",
  // Российские реквизиты
  inn: "",
  kpp: "",
  ogrn: "",
  legal_address: "",
  actual_address: "",
};

const AddSupplierContext = createContext<AddSupplierContextType | undefined>(undefined);

export const AddSupplierProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [supplierData, setSupplierData] = useState<SupplierData>(defaultSupplierData);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [sourceType, setSourceType] = useState<'manual' | 'echo_card' | 'template'>('manual');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // УДАЛЕНО: консольные логи могут вызывать бесконечный цикл
  // useEffect(() => {
  //   console.log("[AddSupplierContext] supplierData изменился:", supplierData);
  //   console.log("[AddSupplierContext] Шаг/Макс шаг:", { currentStep, maxStepReached });
  // }, [supplierData, currentStep, maxStepReached]);

  // Валидация шага (оптимизировано с useCallback)
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Основная информация
        return !!(supplierData.name && supplierData.company_name && supplierData.category);
      case 2: // Контактная информация
        return !!(supplierData.contact_email && supplierData.contact_phone);
      case 3: // Профиль бизнеса
        return true; // Опциональный шаг
      case 4: // Сертификации
        return true; // Опциональный шаг
      case 5: // Каталог товаров
        return true; // Опциональный шаг
      case 6: // Платежные реквизиты
        return true; // Опциональный шаг  
      case 7: // Финальная проверка
        return true; // Опциональный шаг
      default:
        return false;
    }
  }, [supplierData, products]);

  // Проверка возможности перехода к шагу (оптимизировано с useCallback)
  const canProceedToStep = useCallback((step: number): boolean => {
    return step <= maxStepReached + 1;
  }, [maxStepReached]);

  // Сброс формы (оптимизировано с useCallback)
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setMaxStepReached(1);
    setSupplierData(defaultSupplierData);
    setProducts([]);
    setSourceType('manual');
    setDraftId(null);
    setIsLoading(false);
  }, []);

  return (
    <AddSupplierContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        maxStepReached,
        setMaxStepReached,
        supplierData,
        setSupplierData,
        products,
        setProducts,
        sourceType,
        setSourceType,
        draftId,
        setDraftId,
        isLoading,
        setIsLoading,
        resetForm,
        validateStep,
        canProceedToStep,
      }}
    >
      {children}
    </AddSupplierContext.Provider>
  );
};

export const useAddSupplierContext = () => {
  const context = useContext(AddSupplierContext);
  if (!context) {
    throw new Error("useAddSupplierContext must be used within an AddSupplierProvider");
  }
  return context;
}; 