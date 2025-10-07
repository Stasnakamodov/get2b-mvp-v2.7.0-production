import {
  Building,
  FileText,
  Store,
  Users,
  Plus,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Download as DownloadIcon,
  CheckCircle2 as CheckCircle2Icon,
  Eye,
} from "lucide-react"

// Структура шагов конструктора
export const constructorSteps = [
  { id: 1, name: "Данные клиента", description: "Данные компании", sources: ["profile", "template", "manual", "upload"] },
  { id: 2, name: "Спецификация", description: "Спецификация товаров", sources: ["template", "catalog", "manual", "upload"] },
  { id: 3, name: "Пополнение агента", description: "Загрузка чека", sources: ["manual"] },
  { id: 4, name: "Метод", description: "Способ оплаты", sources: ["profile", "template", "catalog", "manual"] },
  { id: 5, name: "Реквизиты", description: "Банковские реквизиты", sources: ["profile", "template", "catalog", "manual"] },
  { id: 6, name: "Получение", description: "Получение средств", sources: ["automatic"] },
  { id: 7, name: "Подтверждение", description: "Завершение", sources: ["automatic"] }
]

// Источники данных
export const dataSources = {
  profile: { name: "Профиль", icon: Users, color: "bg-blue-500" },
  template: { name: "Шаблон", icon: FileText, color: "bg-green-500" },
  catalog: { name: "Каталог", icon: Store, color: "bg-purple-500" },
  manual: { name: "Вручную", icon: Plus, color: "bg-gray-500" },
  upload: { name: "Загрузить (Yandex Vision OCR)", icon: Eye, color: "bg-orange-500" },
  automatic: { name: "Автоматически", icon: CheckCircle, color: "bg-emerald-500" }
}

// Иконки для шагов
export const stepIcons = [
  null,
  Building,
  FileText,
  Clock,
  CreditCard,
  Banknote,
  DownloadIcon,
  CheckCircle2Icon,
]