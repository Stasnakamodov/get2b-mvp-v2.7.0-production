// Функция для получения читаемого названия источника данных
export const getSourceDisplayName = (source: string) => {
  switch (source) {
    case 'profile':
      return 'Профиль пользователя'
    case 'template':
      return 'Шаблон проекта'
    case 'catalog':
      return 'Каталог поставщиков'
    case 'blue_room':
      return 'Синяя комната'
    case 'orange_room':
      return 'Оранжевая комната'
    case 'echo_cards':
      return 'Эхо карточки'
    case 'manual':
      return 'Ручной ввод'
    case 'upload':
      return 'Загрузить (Yandex Vision OCR)'
    case 'automatic':
      return 'Автоматически'
    default:
      return source || 'Ручной ввод'
  }
}