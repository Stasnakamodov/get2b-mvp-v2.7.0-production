// Утилиты для работы с датами

// Функция для генерации даты в формате YYYYMMDD для файлов
export const generateFileDate = (): string => {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

// Функция для форматирования даты в локальном формате
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}