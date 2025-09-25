// Мапинг bucket-ов для загрузки файлов в зависимости от шага
export const bucketMap = {
  1: 'step-a1-ready-company',    // Карточки компаний
  2: 'step2-ready-invoices',     // Спецификации и инвойсы (как в обычном конструкторе)
  3: 'step3-supplier-receipts',  // Чеки поставщиков
  4: 'project-files',            // Документы по оплате
  5: 'project-files',            // Реквизиты
  6: 'step6-client-receipts',    // Чеки клиентов
  7: 'step7-client-confirmations' // Подтверждения
}

// Функция для закрытия всплывающей подсказки эхо данных
export const closeEchoDataTooltip = (
  stepId: number,
  setEchoDataTooltips: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
) => {
  setEchoDataTooltips(prev => ({
    ...prev,
    [stepId]: false
  }))
}