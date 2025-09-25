// Утилиты для работы с файлами

// Функция для очистки имени файла (заменяет недопустимые символы на подчеркивания)
export const cleanFileName = (fileName: string, maxLength: number = 50): string => {
  return fileName.replace(/[^\w.-]+/g, '_').substring(0, maxLength)
}