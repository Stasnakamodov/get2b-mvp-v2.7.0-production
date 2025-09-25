import { Dispatch, SetStateAction } from 'react'

// Хук для управления обработчиками каталога
export const useCatalogHandlers = (
  setShowCatalogModal: Dispatch<SetStateAction<boolean>>
) => {
  const handleAddProductsFromCatalog = () => {
    console.log('🛒 Открытие полного каталога')
    setShowCatalogModal(true)
  }

  return {
    handleAddProductsFromCatalog
  }
}