import { Dispatch, SetStateAction } from 'react'

// Хук для управления обработчиками каталога
export const useCatalogHandlers = (
  setShowCatalogModal: Dispatch<SetStateAction<boolean>>
) => {
  const handleAddProductsFromCatalog = () => {
    setShowCatalogModal(true)
  }

  return {
    handleAddProductsFromCatalog
  }
}