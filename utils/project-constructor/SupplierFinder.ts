/**
 * Utility function to find supplier name in any step data
 * Searches through manualData steps (2, 4, 5) and selectedSupplierData
 *
 * @param manualData - Manual data object containing step data
 * @param selectedSupplierData - Selected supplier data from catalog
 * @returns Supplier name if found, null otherwise
 */
export function findSupplierInAnyStep(
  manualData: Record<number, any>,
  selectedSupplierData: any
): string | null {

  // Проверяем шаг 2 (товары)
  const step2Data = manualData[2]
  if (step2Data) {
    if (step2Data.supplier) {
      return step2Data.supplier
    }
    if (step2Data.items && step2Data.items.length > 0) {
      const firstItem = step2Data.items[0]
      if (firstItem.supplier_name) {
        return firstItem.supplier_name
      }
      if (firstItem.supplier) {
        return firstItem.supplier
      }
    }
  }

  // Проверяем шаг 4 (способы оплаты) - может содержать данные поставщика
  const step4Data = manualData[4]
  if (step4Data) {
    if (step4Data.supplier_name) {
      return step4Data.supplier_name
    }
    if (step4Data.supplier) {
      return step4Data.supplier
    }
  }

  // Проверяем шаг 5 (реквизиты) - может содержать данные поставщика
  const step5Data = manualData[5]
  if (step5Data) {
    if (step5Data.supplier_name) {
      return step5Data.supplier_name
    }
    if (step5Data.supplier) {
      return step5Data.supplier
    }
  }

  // Проверяем selectedSupplierData (если был выбран из каталога)
  if (selectedSupplierData) {
    if (selectedSupplierData.name) {
      return selectedSupplierData.name
    }
    if (selectedSupplierData.company_name) {
      return selectedSupplierData.company_name
    }
  }

  Object.keys(manualData).forEach(key => {
    const numericKey = parseInt(key)
    if (!isNaN(numericKey)) {
    }
  })
  return null
}
