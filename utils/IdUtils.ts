// Утилиты для работы с ID

// Функция для очистки project request ID (удаляет все символы кроме букв и цифр)
export const cleanProjectRequestId = (projectRequestId: string): string => {
  return projectRequestId.replace(/[^a-zA-Z0-9]/g, '')
}