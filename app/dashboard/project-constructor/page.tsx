"use client"

import * as React from "react"

// CSS стили для фантомных данных
const phantomDataStyles = `
  .phantom-data-step {
    border-style: solid !important;
    border-width: 2px !important;
  }
`
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Blocks,
  Building,
  FileText,
  Store,
  Users,
  Plus,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Banknote,
  Coins,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
  MousePointerClick,
  Download as DownloadIcon,
  CheckCircle2 as CheckCircle2Icon,
  Upload,
  Save,
  Package,
  Mail,
  Edit,
  Lock,
  ChevronDown,
  Check,
  Loader,
  BarChart3,
  Eye,
  User,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useProjectTemplates } from "../create-project/hooks/useSaveTemplate"
import { useClientProfiles } from "@/hooks/useClientProfiles"
import { useSupplierProfiles } from "@/hooks/useSupplierProfiles"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/components/ui/use-toast"
import CatalogModal from "../create-project/components/CatalogModal"
import { ManagerBotService } from "@/lib/telegram/ManagerBotService"
import { sendTelegramDocumentClient } from "@/lib/telegram-client"
import { sendClientReceiptApprovalRequest } from "@/lib/telegram"

// Структура шагов конструктора
const constructorSteps = [
  { id: 1, name: "Данные клиента", description: "Данные компании", sources: ["profile", "template", "manual", "upload"] },
  { id: 2, name: "Спецификация", description: "Спецификация товаров", sources: ["profile", "template", "catalog", "manual", "upload"] },
  { id: 3, name: "Пополнение агента", description: "Загрузка чека", sources: ["manual"] },
  { id: 4, name: "Метод", description: "Способ оплаты", sources: ["profile", "template", "catalog", "manual"] },
  { id: 5, name: "Реквизиты", description: "Банковские реквизиты", sources: ["profile", "template", "catalog", "manual"] },
  { id: 6, name: "Получение", description: "Получение средств", sources: ["automatic"] },
  { id: 7, name: "Подтверждение", description: "Завершение", sources: ["automatic"] }
]

// Источники данных
const dataSources = {
  profile: { name: "Профиль", icon: Users, color: "bg-blue-500" },
  template: { name: "Шаблон", icon: FileText, color: "bg-green-500" },
  catalog: { name: "Каталог", icon: Store, color: "bg-purple-500" },
  manual: { name: "Вручную", icon: Plus, color: "bg-gray-500" },
  upload: { name: "Загрузить (Yandex Vision OCR)", icon: Eye, color: "bg-orange-500" },
  automatic: { name: "Автоматически", icon: CheckCircle, color: "bg-emerald-500" }
}

// Иконки для шагов
const stepIcons = [
  null,
  Building,
  FileText,
  Clock,
  CreditCard,
  Banknote,
  DownloadIcon,
  CheckCircle2Icon,
]

// Компонент формы для данных компании (Шаг I)
const CompanyForm = ({ onSave, onCancel, initialData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any }) => {
  console.log("🔍 CompanyForm получил initialData:", initialData);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    legalName: initialData?.legalName || '',
    inn: initialData?.inn || '',
    kpp: initialData?.kpp || '',
    ogrn: initialData?.ogrn || '',
    address: initialData?.address || '',
    // Банковские реквизиты
    bankName: initialData?.bankName || '',
    bankAccount: initialData?.bankAccount || '',
    bik: initialData?.bik || '',
    correspondentAccount: initialData?.correspondentAccount || '',
    // Контактные данные
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    director: initialData?.director || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Основные данные компании */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
          Название компании <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Введите название компании"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="legalName" className="text-sm font-semibold text-gray-700">
          Юридическое название <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="legalName"
          value={formData.legalName}
          onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Введите юридическое название"
        />
      </div>
      
      {/* ИНН, КПП, ОГРН */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inn" className="text-sm font-semibold text-gray-700">
            ИНН <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="inn"
            value={formData.inn}
            onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="1234567890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kpp" className="text-sm font-semibold text-gray-700">
            КПП <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="kpp"
            value={formData.kpp}
            onChange={(e) => setFormData(prev => ({ ...prev, kpp: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="123456789"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ogrn" className="text-sm font-semibold text-gray-700">
          ОГРН <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="ogrn"
          value={formData.ogrn}
          onChange={(e) => setFormData(prev => ({ ...prev, ogrn: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="1234567890123"
        />
      </div>
      
      {/* Адрес */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
          Юридический адрес <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="г. Москва, ул. Примерная, д. 1, оф. 100"
        />
      </div>
      
      {/* Банковские реквизиты */}
      <div className="space-y-4 pt-4 border-t border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">Банковские реквизиты</h3>
        
        <div className="space-y-2">
          <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700">
            Название банка <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="Сбербанк России"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bankAccount" className="text-sm font-semibold text-gray-700">
            Расчетный счет <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankAccount"
            value={formData.bankAccount}
            onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="40702810123456789012"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bik" className="text-sm font-semibold text-gray-700">
              БИК <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="bik"
              value={formData.bik}
              onChange={(e) => setFormData(prev => ({ ...prev, bik: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="044525225"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correspondentAccount" className="text-sm font-semibold text-gray-700">
              Корр. счет <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="correspondentAccount"
              value={formData.correspondentAccount}
              onChange={(e) => setFormData(prev => ({ ...prev, correspondentAccount: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="30101810123456789012"
            />
          </div>
        </div>
      </div>

      {/* Контактные данные */}
      <div className="space-y-4 pt-4 border-t border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">Контактные данные</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="info@company.ru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Телефон <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="+7 (495) 123-45-67"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
              Веб-сайт
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="https://www.company.ru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="director" className="text-sm font-semibold text-gray-700">
              Директор
            </Label>
            <Input
              id="director"
              value={formData.director}
              onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Иванов И.И."
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 text-base font-medium">
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

// Компонент формы для контактных данных
const ContactsForm = ({ onSave, onCancel, initialData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any }) => {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="info@company.ru"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
          Телефон <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="+7 (495) 123-45-67"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
          Веб-сайт
        </Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="https://www.company.ru"
        />
      </div>
      

      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 text-base font-medium">
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

// Компонент формы для банковских данных
const BankForm = ({ onSave, onCancel, initialData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any }) => {
  const [formData, setFormData] = useState({
    bankName: initialData?.bankName || '',
    bankAccount: initialData?.bankAccount || '',
    bankCorrAccount: initialData?.bankCorrAccount || '',
    bankBik: initialData?.bankBik || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-2">
        <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700">
          Название банка <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="bankName"
          value={formData.bankName}
          onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Сбербанк России"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bankAccount" className="text-sm font-semibold text-gray-700">
          Расчетный счет <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="bankAccount"
          value={formData.bankAccount}
          onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="40702810123456789012"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bankCorrAccount" className="text-sm font-semibold text-gray-700">
            Корр. счет <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankCorrAccount"
            value={formData.bankCorrAccount}
            onChange={(e) => setFormData(prev => ({ ...prev, bankCorrAccount: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="30101810123456789012"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankBik" className="text-sm font-semibold text-gray-700">
            БИК <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankBik"
            value={formData.bankBik}
            onChange={(e) => setFormData(prev => ({ ...prev, bankBik: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="044525225"
          />
        </div>
      </div>
      

      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 text-base font-medium">
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

// Компонент формы для спецификации (Шаг II)
// Тип для элемента спецификации
interface SpecificationItem {
  name: string;
  quantity: number;
  price: number;
  code?: string;
  unit?: string;
  total?: number;
  description?: string;
}

const SpecificationForm = ({ onSave, onCancel, initialData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any }) => {
  console.log("🔍 SpecificationForm получил initialData:", initialData);
  const [formData, setFormData] = useState({
    supplier: initialData?.supplier || '',
    currency: initialData?.currency || 'RUB',
    items: (initialData?.items || [{ name: '', quantity: 1, price: 0 }]) as SpecificationItem[]
  })

  // Обновляем форму при изменении initialData
  useEffect(() => {
    console.log("🔄 SpecificationForm useEffect - initialData изменился:", initialData);
    console.log("📊 Тип initialData:", typeof initialData);
    console.log("📊 Ключи в initialData:", initialData ? Object.keys(initialData) : 'null');
    if (initialData) {
      const newFormData = {
        supplier: initialData.supplier || '',
        currency: initialData.currency || 'RUB',
        items: initialData.items || [{ name: '', quantity: 1, price: 0 }]
      };
      console.log("📝 SpecificationForm устанавливает новые данные:", newFormData);
      console.log("📊 Количество товаров:", newFormData.items.length);
      console.log("📊 Товары:", newFormData.items);
      setFormData(newFormData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 } as SpecificationItem]
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item: SpecificationItem, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Поставщик *</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Валюта</Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="RUB">RUB</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label>Товары</Label>
        <div className="space-y-2">
          {formData.items.map((item: SpecificationItem, index: number) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Название товара"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Количество"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                placeholder="Цена"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addItem} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Добавить товар
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

// Компонент загрузки файла (Шаг III)
const FileUploadForm = ({ onSave, onCancel }: { onSave: (data: any) => void, onCancel: () => void }) => {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onSave({ file })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Загрузите чек пополнения счета</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button type="button" variant="outline">
            Выбрать файл
          </Button>
        </label>
      </div>
      
      {file && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <FileText className="h-4 w-4 text-blue-600 inline mr-2" />
          <span>Выбран файл: {file.name}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" disabled={!file}>
          <Save className="h-4 w-4 mr-2" />
          Загрузить
        </Button>
      </div>
    </form>
  )
}

// Компонент формы метода оплаты (Шаг IV)
const PaymentMethodForm = ({ onSave, onCancel, initialData, getStepData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any, getStepData?: (stepId: number) => any }) => {
  const [method, setMethod] = useState(initialData?.method || '')
  const [supplier, setSupplier] = useState(initialData?.supplier || '')

  // 🔥 НОВОЕ: Автоматически получаем поставщика из шага 2, если его нет в initialData
  React.useEffect(() => {
    if (!supplier && !initialData?.supplier && getStepData) {
      const step2Data = getStepData(2);
      console.log("🔍 Проверяем данные шага 2:", step2Data);
      if (step2Data?.supplier) {
        setSupplier(step2Data.supplier);
        console.log("🏢 Автоматически получен поставщик из шага 2:", step2Data.supplier);
      }
    }
  }, [supplier, initialData?.supplier, getStepData]);

  // 🔥 ДОПОЛНИТЕЛЬНО: Обновляем поставщика при изменении данных шага 2
  React.useEffect(() => {
    if (getStepData) {
      const step2Data = getStepData(2);
      console.log("🔄 Проверяем обновление поставщика из шага 2:", step2Data);
      if (step2Data?.supplier && step2Data.supplier !== supplier) {
        setSupplier(step2Data.supplier);
        console.log("🔄 Обновлен поставщик из шага 2:", step2Data.supplier);
      }
    }
  }, [getStepData, supplier]);

  // 🔥 ПРИНУДИТЕЛЬНО: Обновляем поставщика при каждом рендере, если он пустой
  React.useEffect(() => {
    if (getStepData && !supplier) {
      const step2Data = getStepData(2);
      if (step2Data?.supplier) {
        setSupplier(step2Data.supplier);
        console.log("🚀 Принудительно установлен поставщик из шага 2:", step2Data.supplier);
      }
    }
  });

  // Если есть предложение из OCR, показываем его
  const hasSuggestion = initialData?.suggested && initialData?.source === 'ocr_invoice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (method) {
      onSave({ method, supplier, suggested: false, source: 'manual' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Показываем предложение из OCR */}
      {hasSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Предложение из инвойса</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            На основе банковских реквизитов в инвойсе предлагаем:
          </p>
          <div className="bg-white border border-blue-300 rounded p-3">
            <span className="text-sm font-medium">Банковский перевод</span>
            <p className="text-xs text-gray-600 mt-1">
              Рекомендуется для международных платежей
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="method">Способ оплаты *</Label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Выберите способ оплаты</option>
          <option value="bank-transfer">Банковский перевод</option>
          <option value="p2p">P2P платеж</option>
          <option value="crypto">Криптовалюта</option>
        </select>
        </div>
        
        <div>
          <Label htmlFor="supplier">Поставщик</Label>
          <Input
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Введите название поставщика"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" disabled={!method}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

// Компонент формы реквизитов (Шаг V)
const RequisitesForm = ({ onSave, onCancel, initialData }: { onSave: (data: any) => void, onCancel: () => void, initialData?: any }) => {
  const [formData, setFormData] = useState({
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    swift: initialData?.swift || '',
    recipientName: initialData?.recipientName || '',
    recipientAddress: initialData?.recipientAddress || '',
    transferCurrency: initialData?.transferCurrency || 'USD',
    supplier: initialData?.supplier || initialData?.recipientName || ''
  })

  // 🔥 НОВОЕ: Автоматически заполняем поставщика из получателя
  React.useEffect(() => {
    if (formData.recipientName && !formData.supplier) {
      setFormData(prev => ({ ...prev, supplier: formData.recipientName }));
    }
  }, [formData.recipientName, formData.supplier]);

  // Если есть предложение из OCR, показываем его
  const hasSuggestion = initialData?.suggested && initialData?.source === 'ocr_invoice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...formData, suggested: false, source: 'manual' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Показываем предложение из OCR */}
      {hasSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Предложение из инвойса</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            На основе банковских реквизитов в инвойсе предлагаем:
          </p>
          <div className="bg-white border border-blue-300 rounded p-3 space-y-2">
            {initialData.accountNumber && (
              <div>
                <span className="text-xs text-gray-600">Номер счета:</span>
                <p className="text-sm font-medium">{initialData.accountNumber}</p>
              </div>
            )}
            {initialData.swift && (
              <div>
                <span className="text-xs text-gray-600">SWIFT код:</span>
                <p className="text-sm font-medium">{initialData.swift}</p>
              </div>
            )}
            {initialData.recipientName && (
              <div>
                <span className="text-xs text-gray-600">Получатель:</span>
                <p className="text-sm font-medium">{initialData.recipientName}</p>
              </div>
            )}
            {initialData.transferCurrency && (
              <div>
                <span className="text-xs text-gray-600">Валюта:</span>
                <p className="text-sm font-medium">{initialData.transferCurrency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bankName">Название банка</Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
            placeholder="Введите название банка"
          />
        </div>
        <div>
          <Label htmlFor="accountNumber">Номер счета *</Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
            required
            placeholder="Введите номер счета"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="swift">SWIFT/BIC код</Label>
        <Input
          id="swift"
          value={formData.swift}
          onChange={(e) => setFormData(prev => ({ ...prev, swift: e.target.value }))}
          placeholder="Введите SWIFT/BIC код"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipientName">Полное наименование получателя</Label>
          <Input
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
            placeholder="Введите название получателя"
          />
        </div>
        <div>
          <Label htmlFor="supplier">Поставщик</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            placeholder="Введите название поставщика"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="recipientAddress">Юридический адрес получателя</Label>
        <Textarea
          id="recipientAddress"
          value={formData.recipientAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
          placeholder="Введите адрес получателя"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="transferCurrency">Валюта перевода</Label>
        <select
          id="transferCurrency"
          value={formData.transferCurrency}
          onChange={(e) => setFormData(prev => ({ ...prev, transferCurrency: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">USD - Доллар США</option>
          <option value="EUR">EUR - Евро</option>
          <option value="RUB">RUB - Российский рубль</option>
          <option value="CNY">CNY - Китайский юань</option>
        </select>
      </div>
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

export default function ProjectConstructorPage() {
  // Добавляем CSS стили для фантомных данных
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = phantomDataStyles
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // Состояния для управления конструктором
  const [stepConfigs, setStepConfigs] = useState<Record<number, string>>({})
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [lastHoveredStep, setLastHoveredStep] = useState<number | null>(null)
  const [manualData, setManualData] = useState<Record<number, any>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>({})
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [templateStepSelection, setTemplateStepSelection] = useState<{templateId: string, availableSteps: number[]} | null>(null)
  const [templateSelection, setTemplateSelection] = useState<boolean>(false)
  const [showBankAccountSelector, setShowBankAccountSelector] = useState<boolean>(false)
  const [bankAccountSourceType, setBankAccountSourceType] = useState<'profile' | 'template'>('profile')
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewType, setPreviewType] = useState<string>('')
  const [editingType, setEditingType] = useState<string>('')
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [autoFillNotification, setAutoFillNotification] = useState<{
    show: boolean;
    message: string;
    supplierName: string;
    filledSteps: number[];
  } | null>(null)
  
  // Состояния для OCR анализа
  const [ocrAnalyzing, setOcrAnalyzing] = useState<Record<number, boolean>>({})
  const [ocrError, setOcrError] = useState<Record<number, string>>({})
  const [ocrDebugData, setOcrDebugData] = useState<Record<number, any>>({})
  const [showStepDataModal, setShowStepDataModal] = useState<boolean>(false)
  const [stepDataToView, setStepDataToView] = useState<{stepId: number, data: any} | null>(null)
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0)
  const [productsPerView] = useState<number>(3)
  
  // Состояние для модального окна эхо данных
  const [echoDataModal, setEchoDataModal] = useState<{
    show: boolean;
    supplierName: string;
    echoData: any;
    projectInfo: any;
  } | null>(null)
  
  const [showPhantomOptions, setShowPhantomOptions] = useState<boolean>(false)
  
  // Состояние для отслеживания доступности эхо данных
  const [echoDataAvailable, setEchoDataAvailable] = useState<{ [key: number]: boolean }>({})
  
  // Состояние для отслеживания загрузки эхо данных
  const [echoDataLoading, setEchoDataLoading] = useState<boolean>(false)
  
  // Состояние для управления всплывающими подсказками эхо данных
  const [echoDataTooltips, setEchoDataTooltips] = useState<{ [key: number]: boolean }>({})
  
  // Состояние для лоадера эхо данных шагов 1 и 2
  const [echoDataLoadingSteps1_2, setEchoDataLoadingSteps1_2] = useState<boolean>(false)

  // Хук для работы с профилями клиентов
  const { profiles: clientProfiles, loading: clientProfilesLoading, fetchProfiles: fetchClientProfiles } = useClientProfiles(user?.id || null)

  // Хук для работы с профилями поставщиков
  const { profiles: supplierProfiles, loading: supplierProfilesLoading, fetchProfiles: fetchSupplierProfiles } = useSupplierProfiles(user?.id || null)

  // Хук для уведомлений
  const { toast } = useToast()

  // Состояние для выбора профиля клиента
  const [showProfileSelector, setShowProfileSelector] = useState<boolean>(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  // Состояние для выбора профиля поставщика
  const [showSupplierProfileSelector, setShowSupplierProfileSelector] = useState<boolean>(false)
  const [selectedSupplierProfileId, setSelectedSupplierProfileId] = useState<string | null>(null)

  // Состояние для модального окна предварительной сводки
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false)

  // Состояние для обработки ошибок загрузки шаблонов
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState<boolean>(false)
  
  // Состояние для отслеживания текущего этапа
  const [currentStage, setCurrentStage] = useState<number>(1)

  // Временно добавлено для совместимости со старым кодом (будет удалено)
  const [catalogSourceStep, setCatalogSourceStep] = useState<number | null>(null)
  const [showCatalogSourceModal, setShowCatalogSourceModal] = useState<boolean>(false)

  // Состояние для модального окна перехода на следующий этап
  const [showStageTransitionModal, setShowStageTransitionModal] = useState<boolean>(false)
  const [dontShowStageTransition, setDontShowStageTransition] = useState<boolean>(false)
  const [stageTransitionShown, setStageTransitionShown] = useState<boolean>(false)
  
  // Состояние для отправки менеджеру
  const [sendingToManager, setSendingToManager] = useState<boolean>(false)
  const [managerNotification, setManagerNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null)

  // Состояние для модального окна выбора поставщика из синей комнаты
  const [showBlueRoomSupplierModal, setShowBlueRoomSupplierModal] = useState<boolean>(false)
  const [blueRoomSuppliers, setBlueRoomSuppliers] = useState<any[]>([])
  const [blueRoomLoading, setBlueRoomLoading] = useState<boolean>(false)

  // Состояние для модального окна выбора поставщика из оранжевой комнаты
  const [showOrangeRoomSupplierModal, setShowOrangeRoomSupplierModal] = useState<boolean>(false)
  const [orangeRoomSuppliers, setOrangeRoomSuppliers] = useState<any[]>([])
  const [orangeRoomLoading, setOrangeRoomLoading] = useState<boolean>(false)
  const [selectedSupplierData, setSelectedSupplierData] = useState<any>(null)

  // Состояния для анимации сделки
  const [dealAnimationStep, setDealAnimationStep] = useState<number>(0) // 0-3: шаги анимации
  const [dealAnimationStatus, setDealAnimationStatus] = useState<string>('') // статус анимации
  const [dealAnimationComplete, setDealAnimationComplete] = useState<boolean>(false)

  // Состояния для степера инфраструктуры (шаги 3, 6, 7)
  const [infrastructureStepperStep, setInfrastructureStepperStep] = useState<number>(0) // 0-2: шаги степера
  const [infrastructureStepperStatus, setInfrastructureStepperStatus] = useState<string>('') // статус степера

  // Состояния для управления статусом апрува менеджера
  const [managerApprovalStatus, setManagerApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [managerApprovalMessage, setManagerApprovalMessage] = useState<string>('')
  const [projectRequestId, setProjectRequestId] = useState<string>('')

  // Состояния для модальных окон после одобрения чека
  const [showRequisitesConfirmationModal, setShowRequisitesConfirmationModal] = useState<boolean>(false)
  const [showStage2SummaryModal, setShowStage2SummaryModal] = useState<boolean>(false)
  const [receiptApprovalStatus, setReceiptApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'waiting' | null>(null)
  const [managerReceiptUrl, setManagerReceiptUrl] = useState<string | null>(null)
  
  // Состояние для модального окна каталога товаров
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false)
  // Состояния каталога удалены - теперь управляются внутри CatalogModal
  const [hasManagerReceipt, setHasManagerReceipt] = useState(false)
  const [isRequestSent, setIsRequestSent] = useState(false)
  const [showFullLoader, setShowFullLoader] = useState(false)
  const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null)
  const [clientReceiptUrl, setClientReceiptUrl] = useState<string | null>(null)
  const [isUploadingClientReceipt, setIsUploadingClientReceipt] = useState(false)
  const [clientReceiptUploadError, setClientReceiptUploadError] = useState<string | null>(null)
  const [projectDetailsDialogOpen, setProjectDetailsDialogOpen] = useState(false)
  const [projectDetails, setProjectDetails] = useState<any>(null)

  // Функция для поиска supplier в любом из заполненных шагов
  const findSupplierInAnyStep = () => {
    console.log('🔍 Ищем supplier в любом из заполненных шагов...')
    console.log('🔍 manualData:', manualData)
    console.log('🔍 selectedSupplierData:', selectedSupplierData)
    
    // Проверяем шаг 2 (товары)
    const step2Data = manualData[2]
    console.log('🔍 step2Data:', step2Data)
    if (step2Data) {
      if (step2Data.supplier) {
        console.log('✅ Найден supplier в шаге 2:', step2Data.supplier)
        return step2Data.supplier
      }
      if (step2Data.items && step2Data.items.length > 0) {
        const firstItem = step2Data.items[0]
        if (firstItem.supplier_name) {
          console.log('✅ Найден supplier_name в шаге 2:', firstItem.supplier_name)
          return firstItem.supplier_name
        }
        if (firstItem.supplier) {
          console.log('✅ Найден supplier в товаре шага 2:', firstItem.supplier)
          return firstItem.supplier
        }
      }
    }
    
    // Проверяем шаг 4 (способы оплаты) - может содержать данные поставщика
    const step4Data = manualData[4]
    console.log('🔍 step4Data:', step4Data)
    if (step4Data) {
      if (step4Data.supplier_name) {
        console.log('✅ Найден supplier_name в шаге 4:', step4Data.supplier_name)
        return step4Data.supplier_name
      }
      if (step4Data.supplier) {
        console.log('✅ Найден supplier в шаге 4:', step4Data.supplier)
        return step4Data.supplier
      }
    }
    
    // Проверяем шаг 5 (реквизиты) - может содержать данные поставщика
    const step5Data = manualData[5]
    console.log('🔍 step5Data:', step5Data)
    if (step5Data) {
      if (step5Data.supplier_name) {
        console.log('✅ Найден supplier_name в шаге 5:', step5Data.supplier_name)
        return step5Data.supplier_name
      }
      if (step5Data.supplier) {
        console.log('✅ Найден supplier в шаге 5:', step5Data.supplier)
        return step5Data.supplier
      }
    }
    
    // Проверяем selectedSupplierData (если был выбран из каталога)
    if (selectedSupplierData) {
      if (selectedSupplierData.name) {
        console.log('✅ Найден supplier в selectedSupplierData:', selectedSupplierData.name)
        return selectedSupplierData.name
      }
      if (selectedSupplierData.company_name) {
        console.log('✅ Найден company_name в selectedSupplierData:', selectedSupplierData.company_name)
        return selectedSupplierData.company_name
      }
    }
    
    console.log('❌ Supplier не найден ни в одном шаге')
    console.log('🔍 Детали manualData:')
    Object.keys(manualData).forEach(key => {
      const numericKey = parseInt(key)
      if (!isNaN(numericKey)) {
        console.log(`  ${key}:`, manualData[numericKey])
      }
    })
    return null
  }

  // Функция для проверки доступности эхо данных
  const checkEchoDataAvailability = async () => {
    console.log('🔍 Проверяем доступность эхо данных...')
    
    // Показываем лоадер
    setEchoDataLoading(true)
    
    // Ищем supplier в любом из заполненных шагов
    const supplierName = findSupplierInAnyStep()
    
    if (!supplierName) {
      console.log('❌ Не найден supplier ни в одном шаге')
      setEchoDataAvailable({})
      setEchoDataLoading(false)
      return
    }

    console.log('🔍 Проверяем эхо данные для поставщика:', supplierName)
    
    try {
      const echoData = await getEchoSupplierData(supplierName)
      if (echoData) {
        console.log('✅ Эхо данные доступны для шагов 4 и 5')
        setEchoDataAvailable({
          4: true,
          5: true
        })
        // Показываем всплывающие подсказки
        setEchoDataTooltips({
          4: true,
          5: true
        })
        
        // Автоматически скрываем подсказки через 10 секунд
        setTimeout(() => {
          setEchoDataTooltips(prev => ({
            ...prev,
            4: false,
            5: false
          }))
        }, 10000)
      } else {
        console.log('❌ Эхо данные недоступны')
        setEchoDataAvailable({})
        setEchoDataTooltips({})
      }
    } catch (error) {
      console.error('❌ Ошибка проверки эхо данных:', error)
      setEchoDataAvailable({})
      setEchoDataTooltips({})
    } finally {
      // Скрываем лоадер
      setEchoDataLoading(false)
    }
  }
  
  // Закрытие выпадающего списка при клике вне его области
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.phantom-options-dropdown')) {
        setShowPhantomOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Получаем реальные шаблоны из базы данных
  const { templates, loading: templatesLoading, error: templatesError, fetchTemplates } = useProjectTemplates()

  // Загружаем шаблоны при монтировании компонента
  React.useEffect(() => {
    // Проверяем аутентификацию перед загрузкой
    const checkAuthAndLoad = async () => {
      try {
        console.log('🔍 Проверка авторизации...')
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          console.log('✅ Пользователь авторизован:', user.email)
          setUser(user)
          console.log('📋 Загружаем шаблоны...')
          await fetchTemplates()
          console.log('👤 Загружаем профили клиентов...')
          await fetchClientProfiles()
          console.log('🏭 Загружаем профили поставщиков...')
          await fetchSupplierProfiles()
        } else {
          console.log('❌ Пользователь не авторизован')
        }
      } catch (error) {
        console.error('❌ Ошибка при проверке авторизации:', error)
      }
    }
    
    checkAuthAndLoad()
  }, []) // Убираем fetchTemplates из зависимостей

  // Polling статуса модерации атомарного конструктора
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return
    
    const checkManagerStatus = async () => {
      try {
        console.log('🔍 Проверяем статус для projectRequestId:', projectRequestId)
        const cleanRequestId = projectRequestId.replace(/[^a-zA-Z0-9]/g, '')
        console.log('🧹 Очищенный requestId для поиска:', cleanRequestId)
        
        const { data: projects, error } = await supabase
          .from('projects')
          .select('atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса модерации:', error)
          return
        }

        if (projects && projects.length > 0 && projects[0].atomic_moderation_status) {
          const status = projects[0].atomic_moderation_status
          console.log('📊 Статус модерации обновлен:', status)
          setManagerApprovalStatus(status)
          
          // Если одобрено, показываем платёжку (шаг 3)
          if (status === 'approved') {
            console.log('✅ Атомарный конструктор одобрен - показываем платёжку')
            // НЕ переходим к этапу 3, остаемся на этапе 2 для показа платёжки
          }
        } else {
          console.log('📊 Записи не найдены или статус пустой')
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса модерации:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkManagerStatus, 4000)
    
    // Первая проверка сразу
    checkManagerStatus()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, setCurrentStage])

  // Polling статуса одобрения чека
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return
    
    const checkReceiptStatus = async () => {
      try {
        console.log('🔍 Проверяем статус чека для projectRequestId:', projectRequestId)
        const cleanRequestId = projectRequestId.replace(/[^a-zA-Z0-9]/g, '')
        console.log('🧹 Очищенный requestId для поиска чека:', cleanRequestId)
        
        const { data: projects, error } = await supabase
          .from('projects')
          .select('status, atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса чека:', error)
          return
        }

        console.log('📊 [DEBUG] Найденные проекты для чека:', projects)

        if (projects && projects.length > 0) {
          const project = projects[0]
          console.log('📊 [DEBUG] Проект найден:', {
            status: project.status,
            atomic_moderation_status: project.atomic_moderation_status
          })
          
          // Обновляем статус менеджера если он не установлен
          if (project.atomic_moderation_status && managerApprovalStatus !== project.atomic_moderation_status) {
            console.log('📊 Обновляем статус менеджера:', project.atomic_moderation_status)
            setManagerApprovalStatus(project.atomic_moderation_status)
          }
          
          if (project.status) {
            const status = project.status
            console.log('📊 Статус чека обновлен:', status)
            
            if (status === 'receipt_approved' && receiptApprovalStatus !== 'approved') {
              console.log('✅ Чек одобрен - переходим к этапу 3 (анимация сделки)')
              setReceiptApprovalStatus('approved')
              setCurrentStage(3) // Переходим к этапу 3: анимация сделки
            } else if (status === 'receipt_rejected' && receiptApprovalStatus !== 'rejected') {
              console.log('❌ Чек отклонен')
              setReceiptApprovalStatus('rejected')
            } else if (status === 'waiting_receipt' && receiptApprovalStatus !== 'waiting') {
              console.log('⏳ Чек загружен, ждет одобрения')
              setReceiptApprovalStatus('waiting')
            }
          } else {
            console.log('📊 Статус чека пустой')
          }
        } else {
          console.log('📊 Записи не найдены')
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса чека:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkReceiptStatus, 4000)
    
    // Первая проверка сразу
    checkReceiptStatus()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, managerApprovalStatus, receiptApprovalStatus])

  // Polling чека от менеджера (шаг 6)
  useEffect(() => {
    if (!projectRequestId || currentStage !== 3) return
    
    // Автоматически отправляем запрос менеджеру при переходе на этап 3
    if (!isRequestSent) {
      console.log('🚀 Автоматически отправляем запрос менеджеру при переходе на этап 3')
      sendManagerReceiptRequest()
    }
    
    const checkManagerReceipt = async () => {
      try {
        console.log('🔍 Проверяем чек от менеджера для projectRequestId:', projectRequestId)
        
        const { data: project, error } = await supabase
          .from('projects')
          .select('status, receipts')
          .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
          .single()
        
        if (error || !project) {
          console.log('📊 Проект не найден для проверки чека менеджера')
          return
        }
        
        console.log('📊 Статус проекта для чека менеджера:', project.status)
        
        // Проверяем наличие чека от менеджера
        let managerReceiptUrl = null
        
        if (project.receipts) {
          try {
            // Пробуем парсить как JSON (новый формат)
            const receiptsData = JSON.parse(project.receipts)
            if (receiptsData.manager_receipt) {
              managerReceiptUrl = receiptsData.manager_receipt
            }
          } catch {
            // Если не JSON, проверяем статус (старый формат)
            if (project.status === 'in_work') {
              managerReceiptUrl = project.receipts
            }
          }
        }
        
        if (managerReceiptUrl && !hasManagerReceipt) {
          console.log('✅ Чек от менеджера найден:', managerReceiptUrl)
          console.log('🔄 Устанавливаем hasManagerReceipt=true')
          setManagerReceiptUrl(managerReceiptUrl)
          setHasManagerReceipt(true)
          
          // Автоматически меняем статус если нужно
          if (project.status === 'waiting_manager_receipt') {
            await supabase
              .from('projects')
              .update({ 
                status: 'in_work',
                updated_at: new Date().toISOString()
              })
              .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
            console.log('✅ Статус изменен на in_work')
          }
        } else if (!managerReceiptUrl && hasManagerReceipt) {
          console.log('❌ Чек от менеджера удален')
          console.log('🔄 Устанавливаем hasManagerReceipt=false')
          setManagerReceiptUrl(null)
          setHasManagerReceipt(false)
        } else {
          console.log('📊 Статус чека менеджера не изменился:', { 
            hasManagerReceipt, 
            managerReceiptUrl: !!managerReceiptUrl,
            projectStatus: project.status 
          })
        }
        
      } catch (error) {
        console.error('❌ Ошибка проверки чека от менеджера:', error)
      }
    }
    
    // Проверяем каждые 5 секунд
    const interval = setInterval(checkManagerReceipt, 5000)
    
    // Первая проверка сразу
    checkManagerReceipt()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, hasManagerReceipt])

  // Функция для загрузки чека клиента о получении средств
  const handleClientReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectRequestId) return

    console.log("🚀 Начинаем загрузку чека клиента:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      projectRequestId
    })

    setIsUploadingClientReceipt(true)
    setClientReceiptUploadError(null)

    try {
      // Получаем ID пользователя для организации файлов
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id || 'unknown'

      // Генерируем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `client-receipt-${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.${fileExtension}`
      const filePath = `${userId}/${fileName}`

      console.log("📤 Загружаем чек клиента:", {
        fileName,
        size: file.size,
        type: file.type,
        projectRequestId
      })

      // Загружаем файл в Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("step7-client-confirmations")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error("❌ Ошибка загрузки в Storage:", uploadError)
        throw new Error("Не удалось загрузить файл: " + uploadError.message)
      }

      // Получаем публичный URL файла
      const { data: urlData } = supabase.storage
        .from("step7-client-confirmations")
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl
      console.log("✅ Файл загружен:", fileUrl)

      // Сохраняем URL в проект
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError)
        throw new Error("Не удалось сохранить ссылку на файл")
      }

      // Отправляем файл менеджеру в Telegram
      const telegramCaption = `📋 КЛИЕНТ ЗАГРУЗИЛ ЧЕК О ПОЛУЧЕНИИ СРЕДСТВ!\n\n` +
        `🆔 Проект: ${projectRequestId}\n` +
        `📛 Название: ${manualData[1]?.name || 'Атомарный проект'}\n` +
        `🏢 Компания: ${manualData[1]?.name || 'Не указано'}\n` +
        `📧 Email: ${manualData[1]?.email || 'Не указано'}\n` +
        `💰 Метод оплаты: ${manualData[4]?.method || 'Не указан'}\n\n` +
        `📄 Клиент подтвердил получение средств от поставщика чеком.\n` +
        `⚠️ Проверьте документ и завершите проект если все корректно.`

      console.log("📤 Отправляем в Telegram:", {
        fileUrl,
        telegramCaption,
        projectRequestId
      })

      try {
        console.log("🔧 Отправляем чек клиента через API с параметрами:", {
          fileUrl: fileUrl?.substring(0, 100) + "...",
          captionLength: telegramCaption?.length,
          projectRequestId
        })
        
        // Отправляем файл менеджеру в Telegram через API endpoint
        const response = await fetch('/api/telegram/send-client-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentUrl: fileUrl,
            caption: telegramCaption,
            projectRequestId
          })
        })
        
        const telegramResult = await response.json()
        
        if (telegramResult.success) {
          console.log("✅ Чек с кнопками одобрения отправлен менеджеру в Telegram:", telegramResult)
        } else {
          console.error("❌ Ошибка API при отправке чека:", telegramResult.error)
          throw new Error(telegramResult.error || 'Неизвестная ошибка API')
        }
      } catch (telegramError) {
        console.error("⚠️ Ошибка отправки в Telegram:", telegramError)
        console.error("⚠️ Детали ошибки:", {
          message: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка',
          stack: telegramError instanceof Error ? telegramError.stack : undefined
        })
        // Продолжаем выполнение даже если Telegram недоступен
      }

      setClientReceiptFile(file)
      setClientReceiptUrl(fileUrl)

      toast({
        title: "Чек загружен!",
        description: "Ваш чек успешно загружен и отправлен менеджеру.",
        variant: "default"
      })

    } catch (error) {
      console.error("❌ Ошибка загрузки чека:", error)
      setClientReceiptUploadError(error instanceof Error ? error.message : "Неизвестная ошибка")
      
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить чек. Попробуйте еще раз.",
        variant: "destructive"
      })
    } finally {
      setIsUploadingClientReceipt(false)
    }
  }

  // Функция для удаления загруженного чека клиента
  const handleRemoveClientReceipt = async () => {
    if (!projectRequestId || !clientReceiptUrl) return

    try {
      // Удаляем URL из базы данных
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: null,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError)
        throw new Error("Не удалось удалить ссылку на файл")
      }

      setClientReceiptFile(null)
      setClientReceiptUrl(null)

      toast({
        title: "Чек удален",
        description: "Вы можете загрузить новый чек.",
        variant: "default"
      })

    } catch (error) {
      console.error("❌ Ошибка удаления чека:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чек.",
        variant: "destructive"
      })
    }
  }

  // Функция для показа деталей проекта
  const handleShowProjectDetails = async () => {
    if (!projectRequestId) return

    console.log("🔍 Загружаем детали проекта:", projectRequestId)

    try {
      // Получаем данные проекта
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("❌ Ошибка загрузки проекта:", error)
        throw new Error("Не удалось загрузить данные проекта")
      }

      if (!projects || projects.length === 0) {
        throw new Error("Проект не найден")
      }

      const project = projects[0]
      setProjectDetails({
        ...project,
        manualData,
        stepConfigs,
        currentStage: getCurrentStage(),
        activeScenario: getActiveScenario()
      })
      setProjectDetailsDialogOpen(true)

      console.log("✅ Детали проекта загружены:", project)
    } catch (error) {
      console.error("❌ Ошибка загрузки деталей проекта:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить детали проекта",
        variant: "destructive",
      })
    }
  }

  // Функция для отправки запроса менеджеру на загрузку чека (шаг 6)
  const sendManagerReceiptRequest = async () => {
    if (!projectRequestId || isRequestSent) {
      console.log('🔄 Запрос уже отправлен или нет projectRequestId')
      return
    }
    
    try {
      setIsRequestSent(true)
      console.log('📤 Отправляем запрос менеджеру на загрузку чека')
      
      // Получаем данные проекта
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
        .single()
      
      if (error || !project) {
        throw new Error('Проект не найден')
      }
      
      // Получаем реквизиты
      let requisiteText = ''
      try {
        const { data: requisiteData } = await supabase
          .from('project_requisites')
          .select('data')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (requisiteData?.data) {
          const req = requisiteData.data
          const details = req.details || req
          
          if (project.payment_method === 'bank-transfer') {
            requisiteText = `\n\n📋 Реквизиты для оплаты:\n• Получатель: ${details.recipientName || '-'}\n• Банк: ${details.bankName || '-'}\n• Счет: ${details.accountNumber || '-'}\n• SWIFT/BIC: ${details.swift || details.cnapsCode || details.iban || '-'}\n• Валюта: ${details.transferCurrency || 'USD'}`
          } else if (project.payment_method === 'p2p') {
            requisiteText = `\n\n💳 Карта для P2P:\n• Банк: ${req.bank || '-'}\n• Номер карты: ${req.card_number || '-'}\n• Держатель: ${req.holder_name || '-'}`
          } else if (project.payment_method === 'crypto') {
            requisiteText = `\n\n🪙 Криптокошелек:\n• Адрес: ${req.address || '-'}\n• Сеть: ${req.network || '-'}`
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось получить реквизиты:', error)
      }
      
      // Отправляем запрос в Telegram
      const response = await fetch('/api/telegram/send-supplier-receipt-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          email: project.email || 'email@example.com',
          companyName: project.company_data?.name || 'Проект',
          amount: project.amount || 0,
          currency: project.currency || 'USD',
          paymentMethod: project.payment_method || 'bank-transfer',
          requisites: requisiteText
        })
      })
      
      if (!response.ok) {
        throw new Error('Ошибка отправки запроса')
      }
      
      console.log('✅ Запрос менеджеру отправлен успешно')
      
      // Обновляем статус проекта на waiting_manager_receipt
      await supabase
        .from('projects')
        .update({ 
          status: 'waiting_manager_receipt',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
      
    } catch (error) {
      console.error('❌ Ошибка отправки запроса менеджеру:', error)
      setIsRequestSent(false)
    }
  }

  // Функция для получения списка шаблонов пользователя из реальной базы данных
  const getUserTemplates = () => {
    console.log('📋 [getUserTemplates] Проверяем шаблоны:', {
      templates: templates,
      loading: templatesLoading,
      error: templatesError,
      length: templates?.length || 0
    });
    
    if (!templates || templates.length === 0) {
      console.log('📋 [getUserTemplates] Шаблоны пусты');
      return []
    }
    
    const mappedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name || 'Без названия',
      description: template.description || 'Шаблон проекта',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
      lastUsed: template.updated_at ? new Date(template.updated_at).toLocaleDateString('ru-RU') : 'Недавно'
    }));
    
    console.log('📋 [getUserTemplates] Преобразованные шаблоны:', mappedTemplates);
    return mappedTemplates;
  }

  // Функция для получения данных поставщика из каталога
  const getSupplierDataFromCatalog = (supplierId: string) => {
    // Здесь будет реальный запрос к базе данных
    // Пока возвращаем моковые данные для тестирования
    console.log('Запрос данных поставщика:', supplierId)
    
    // Моковые данные поставщика из синей комнаты
    const mockSupplierData = {
      "supplier-1": {
        bank_name: "Сбербанк России",
        account_number: "40702810123456789012",
        swift: "SABRRUMM",
        payment_method: "bank-transfer",
        name: "ООО ТехноСнаб",
        contact_email: "info@technosnab.ru",
        contact_phone: "+7 (495) 123-45-67"
      },
      "supplier-2": {
        bank_name: "Тинькофф Банк",
        account_number: "40702810987654321098",
        swift: "TICSRUMM",
        payment_method: "bank-transfer",
        name: "ООО Электроимпорт",
        contact_email: "sales@electroimport.ru",
        contact_phone: "+7 (812) 987-65-43"
      },
      "echo-supplier-1": {
        bank_name: "Эхо Банк",
        account_number: "40702810111111111111",
        swift: "ECHORUMM",
        payment_method: "bank-transfer",
        name: "ООО Эхо Поставщик",
        contact_email: "echo@supplier.ru",
        contact_phone: "+7 (495) 111-11-11"
      }
    }
    
    return mockSupplierData[supplierId as keyof typeof mockSupplierData] || null
  }

  // Функция для получения товаров поставщика из каталога
  const getSupplierProducts = (supplierId: string) => {
    // Здесь будет реальный запрос к базе данных
    // Пока возвращаем моковые данные для тестирования
    console.log('Запрос товаров поставщика:', supplierId)
    
    // Моковые товары поставщиков
    const mockSupplierProducts = {
      "supplier-1": [
        {
          name: "Электронные компоненты",
          quantity: 100,
          price: 150,
          unit: "шт",
          supplier_id: "supplier-1"
        },
        {
          name: "Микросхемы",
          quantity: 50,
          price: 300,
          unit: "шт", 
          supplier_id: "supplier-1"
        }
      ],
      "supplier-2": [
        {
          name: "Проводники",
          quantity: 200,
          price: 25,
          unit: "м",
          supplier_id: "supplier-2"
        },
        {
          name: "Коннекторы",
          quantity: 75,
          price: 80,
          unit: "шт",
          supplier_id: "supplier-2"
        }
      ],
      "echo-supplier-1": [
        {
          name: "Эхо товар 1",
          quantity: 10,
          price: 1000,
          unit: "шт",
          supplier_id: "echo-supplier-1"
        },
        {
          name: "Эхо товар 2",
          quantity: 5,
          price: 2000,
          unit: "шт",
          supplier_id: "echo-supplier-1"
        }
      ]
    }
    
    return mockSupplierProducts[supplierId as keyof typeof mockSupplierProducts] || []
  }

  // Функция автоматического заполнения шагов IV и V на основе данных шага II
  const autoFillStepsFromSupplier = async (stepData: any) => {
    console.log('=== АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ ШАГОВ IV и V ===')
    console.log('Данные для проверки:', stepData)
    
    // Проверяем, есть ли товары в данных
    if (stepData && stepData.items && stepData.items.length > 0) {
      console.log('Найдены товары:', stepData.items)
      
      // Получаем данные поставщика из первого товара
      const firstItem = stepData.items[0]
      
      // Ищем эхо данные по supplier
      if (stepData.supplier) {
        console.log('🔍 Ищем эхо данные для поставщика:', stepData.supplier)
        
        const echoData = await getEchoSupplierData(stepData.supplier)
        
        if (echoData) {
          console.log('🎭 Найдены эхо данные:', echoData)
          
          // Показываем модальное окно с предложением эхо данных
          setEchoDataModal({
            show: true,
            supplierName: stepData.supplier,
            echoData: echoData,
            projectInfo: echoData.project_info
          })
          
          console.log('📋 Показано модальное окно с эхо данными')
          return true
        } else {
          console.log('❌ Эхо данные не найдены для поставщика:', stepData.supplier)
          console.log('ℹ️ Пользователь может найти эхо данные вручную при клике на шаги 4 и 5')
          return false
        }
      } else {
        console.log('❌ supplier не найден в данных')
        return false
      }
    } else {
      console.log('❌ Товары не найдены в данных')
      return false
    }
  }

  // Функция автоматического заполнения шага II на основе данных шагов IV или V
  const autoFillStepFromRequisites = (stepData: any, stepId: number) => {
    console.log(`=== АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ ШАГА II НА ОСНОВЕ ШАГА ${stepId} ===`)
    console.log('Данные для проверки:', stepData)
    
    // Проверяем, есть ли supplier_id в данных
    let supplierId = stepData.supplier_id
    if (!supplierId) {
      console.log('supplier_id не найден в данных шага', stepId)
      return false
    }
    
    console.log('Найден supplier_id:', supplierId)
    
    // Получаем данные поставщика
    const supplierData = getSupplierDataFromCatalog(supplierId)
    
    if (supplierData) {
      console.log('Данные поставщика найдены:', supplierData)
      
      // Получаем товары поставщика (в реальности это будет запрос к каталогу)
      const supplierProducts = getSupplierProducts(supplierId)
      
      if (supplierProducts && supplierProducts.length > 0) {
        // Автоматически заполняем шаг II (спецификация товаров)
        setManualData(prev => ({
          ...prev,
          2: {
            supplier: supplierData.name,
            currency: 'RUB',
            items: supplierProducts.map(product => ({
              ...product,
              supplier_id: supplierId
            })),
            auto_filled: true
          }
        }))
        
        // Устанавливаем источник данных для шага II
        setStepConfigs(prev => ({
          ...prev,
          2: "catalog"
        }))
        
        // Показываем уведомление об автоматическом заполнении
        setAutoFillNotification({
          show: true,
          message: `Товары поставщика автоматически добавлены в спецификацию`,
          supplierName: supplierData.name,
          filledSteps: [2]
        })
        
        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
          setAutoFillNotification(null)
        }, 5000)
        
        // 🔄 Автозаполнение шагов 4-5 после заполнения товаров из каталога
        console.log('🔍 [AUTO-FILL FROM CATALOG] Пытаемся загрузить данные поставщика:', supplierData.name)
        console.log('🚨 [AUTO-FILL FROM CATALOG] Этот лог должен появиться ВСЕГДА!')
        alert(`🚨 [AUTO-FILL] Пытаемся загрузить данные для: ${supplierData.name}`)
        getEchoSupplierData(supplierData.name).then(echoData => {
          if (echoData) {
            console.log('✅ [AUTO-FILL FROM CATALOG] Найдены данные поставщика для автозаполнения:', echoData)
            
            // Заполняем Step IV (Способ оплаты)
            setManualData(prev => ({
              ...prev,
              4: {
                payment_method: echoData.payment_method?.method || 'bank_transfer',
                auto_filled: true,
                supplier_name: supplierData.name,
                echo_source: echoData.project_info?.project_name,
                user_choice: true
              }
            }))
            
            // Заполняем Step V (Реквизиты поставщика)  
            setManualData(prev => ({
              ...prev,
              5: {
                supplier_name: supplierData.name,
                requisites: echoData.requisites || {},
                auto_filled: true,
                echo_source: echoData.project_info?.project_name,
                user_choice: true
              }
            }))
            
            // Обновляем конфигурацию шагов как завершенные
            setStepConfigs(prev => ({
              ...prev,
              4: 'echoData',
              5: 'echoData'
            }))
            
            console.log('✅ [AUTO-FILL FROM CATALOG] Шаги 4-5 автоматически заполнены из каталога')
          } else {
            console.log('❌ [AUTO-FILL FROM CATALOG] Данные поставщика не найдены:', supplierData.name)
          }
        }).catch(error => {
          console.error('❌ [AUTO-FILL FROM CATALOG] Ошибка при загрузке данных поставщика:', error)
        })
        
        console.log('✅ Шаг II автоматически заполнен товарами поставщика')
        return true
      } else {
        console.log('❌ Товары поставщика не найдены')
      }
    } else {
      console.log('❌ Данные поставщика не найдены для ID:', supplierId)
    }
    return false
  }

  // Функция для получения данных из шаблонов для конкретного шага
  const getTemplateDataForStep = async (stepId: number) => {
    console.log('Запрос данных из шаблонов для шага:', stepId)
    
    try {
      // Используем уже загруженные шаблоны из хука
      if (!templates || templates.length === 0) {
        console.log('❌ У пользователя нет шаблонов')
        return null
      }
      
      console.log('✅ Используем загруженные шаблоны:', templates.length)
      
      // Берем первый шаблон (можно добавить выбор)
      const template = templates[0]
      
      // Преобразуем данные шаблона в формат для конкретного шага
      switch (stepId) {
        case 1: // Данные компании
          return {
            name: template.company_name || '',
            legalName: template.company_legal || '',
            inn: template.company_inn || '',
            kpp: template.company_kpp || '',
            ogrn: template.company_ogrn || '',
            address: template.company_address || '',
            bankName: template.company_bank || '',
            bankAccount: template.company_account || '',
            bankCorrAccount: template.company_corr || '',
            bankBik: template.company_bik || '',
            email: template.company_email || '',
            phone: template.company_phone || '',
            website: template.company_website || ''
          }
          
        case 2: // Спецификация товаров
          return {
            supplier: template.supplier_name || '',
            currency: template.currency || 'RUB',
            items: template.specification || []
          }
          
        default:
          return null
      }
      
    } catch (error) {
      console.error('❌ Ошибка получения данных шаблона:', error)
      throw new Error('Ошибка при обработке данных шаблона')
    }
  }



  // Функция для получения эхо данных поставщика из прошлых проектов
  const getEchoSupplierData = async (supplierName: string) => {
    console.log('🔍 Поиск эхо данных для поставщика:', supplierName)
    
    try {
      // Получаем ID пользователя из сессии
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('❌ Пользователь не авторизован')
        return null
      }
      
      // 1. Находим проекты с указанным поставщиком в спецификациях
      const { data: specifications, error: specsError } = await supabase
        .from("project_specifications")
        .select(`project_id, supplier_name, created_at`)
        .eq("user_id", user.id)
        .ilike("supplier_name", `%${supplierName}%`)
        .order("created_at", { ascending: false })
      
      if (specsError) {
        console.error('❌ Ошибка получения спецификаций:', specsError)
        return null
      }
      
      if (!specifications || specifications.length === 0) {
        console.log('❌ Спецификации с поставщиком не найдены')
        return null
      }
      
      console.log('✅ Найдены спецификации:', specifications.length)
      
      // 2. Получаем ID проектов
      const projectIds = specifications.map(s => s.project_id)
      
      // 3. Получаем реквизиты для этих проектов
      const { data: projectRequisites, error: requisitesError } = await supabase
        .from("project_requisites")
        .select(`project_id, type, data, created_at`)
        .in("project_id", projectIds)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (requisitesError) {
        console.error('❌ Ошибка получения реквизитов:', requisitesError)
        return null
      }
      
      if (!projectRequisites || projectRequisites.length === 0) {
        console.log('❌ Реквизиты для проектов не найдены')
        return null
      }
      
      // 4. Получаем детали проектов
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`id, name, payment_method, status, amount, currency, created_at, updated_at`)
        .in("id", projectIds)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
      
      if (projectsError) {
        console.error('❌ Ошибка получения проектов:', projectsError)
        return null
      }
      
      // 5. Находим самый релевантный проект с правильными реквизитами
      console.log('🔍 Анализ проектов и реквизитов:')
      
      // Создаем карту проектов для быстрого поиска
      const projectsMap = new Map(projects.map(p => [p.id, p]))
      
      // Ищем проект с наиболее полными и согласованными данными
      let bestProject = null
      let bestRequisite = null
      let bestScore = 0
      
      for (const requisite of projectRequisites) {
        const project = projectsMap.get(requisite.project_id)
        if (!project) continue
        
        // Проверяем соответствие способа оплаты и типа реквизитов
        const paymentMethodMap: { [key: string]: string } = {
          'bank-transfer': 'bank',
          'p2p': 'p2p',
          'crypto': 'crypto'
        }
        
        const expectedRequisiteType = paymentMethodMap[project.payment_method] || 'bank'
        const actualRequisiteType = requisite.type
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пропускаем проекты с несоответствующими реквизитами
        if (expectedRequisiteType !== actualRequisiteType) {
          console.log(`❌ ПРОПУСКАЕМ проект "${project.name}": НЕСООТВЕТСТВИЕ payment_method="${project.payment_method}" vs тип реквизитов="${actualRequisiteType}"`)
          continue // Пропускаем этот проект полностью
        }
        
        // Вычисляем "релевантность" проекта
        let score = 0
        
        // Базовый балл за наличие данных
        score += 10
        
        // Бонус за соответствие типа реквизитов и способа оплаты (теперь всегда +50)
        score += 50
        console.log(`✅ Проект "${project.name}": payment_method="${project.payment_method}" соответствует типу реквизитов="${actualRequisiteType}"`)
        
        // Бонус за более новый проект
        const daysSinceUpdate = (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 30) score += 20
        else if (daysSinceUpdate < 90) score += 10
        
        // Бонус за завершенные проекты
        if (project.status === 'completed') score += 15
        
        // Бонус за проекты с суммой
        if (project.amount && project.amount > 0) score += 5
        
        console.log(`📊 Проект "${project.name}": релевантность = ${score}`)
        
        if (score > bestScore) {
          bestScore = score
          bestProject = project
          bestRequisite = requisite
        }
      }
      
      if (!bestProject || !bestRequisite) {
        console.log('❌ Подходящий проект не найден')
        return null
      }
      
      // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убеждаемся, что выбранный проект имеет правильные реквизиты
      const finalPaymentMethodMap: { [key: string]: string } = {
        'bank-transfer': 'bank',
        'p2p': 'p2p',
        'crypto': 'crypto'
      }
      
      const finalExpectedType = finalPaymentMethodMap[bestProject.payment_method] || 'bank'
      const finalActualType = bestRequisite.type
      
      if (finalExpectedType !== finalActualType) {
        console.error(`🚨 КРИТИЧЕСКАЯ ОШИБКА: Выбранный проект "${bestProject.name}" имеет несоответствие!`)
        console.error(`   Способ оплаты: ${bestProject.payment_method} (ожидается тип: ${finalExpectedType})`)
        console.error(`   Тип реквизитов: ${finalActualType}`)
        console.error(`   НЕ ВОЗВРАЩАЕМ НЕСООТВЕТСТВУЮЩИЕ ДАННЫЕ!`)
        return null
      }
      
      const requisiteData = bestRequisite.data
      
      console.log('✅ Выбран лучший проект:', bestProject.name)
      console.log('📋 Данные реквизита:', requisiteData)
      console.log('📋 Данные проекта:', bestProject)
      console.log('🔍 Тип реквизита:', bestRequisite.type)
      console.log('🔍 Способ оплаты проекта:', bestProject.payment_method)
      console.log('🏆 Релевантность:', bestScore)
      
      // Проверяем соответствие способа оплаты и типа реквизитов
      const paymentMethodMap: { [key: string]: string } = {
        'bank-transfer': 'bank',
        'p2p': 'p2p',
        'crypto': 'crypto'
      }
      
      const expectedRequisiteType = paymentMethodMap[bestProject.payment_method] || 'bank'
      const actualRequisiteType = bestRequisite.type
      
      if (expectedRequisiteType !== actualRequisiteType) {
        console.warn(`⚠️ НЕСООТВЕТСТВИЕ: Проект имеет payment_method="${bestProject.payment_method}" (ожидается тип="${expectedRequisiteType}"), но реквизит имеет тип="${actualRequisiteType}"`)
      }
      
      // Формируем реквизиты в зависимости от типа
      let requisites: any = {}
      
      if (actualRequisiteType === 'bank') {
        requisites = {
          bankName: requisiteData.bankName || requisiteData.details?.bankName || 'Банк поставщика',
          accountNumber: requisiteData.accountNumber || requisiteData.details?.accountNumber || '****0000',
          swift: requisiteData.swift || requisiteData.details?.swift || 'PHANTOM',
          recipientName: requisiteData.recipientName || requisiteData.details?.recipientName || 'Поставщик',
          supplier_id: `phantom-${bestProject.id}`
        }
      } else if (actualRequisiteType === 'p2p') {
        requisites = {
          card_bank: requisiteData.bank || requisiteData.details?.bank || 'Банк карты',
          card_number: requisiteData.card_number || requisiteData.details?.card_number || '****0000',
          card_holder: requisiteData.holder_name || requisiteData.details?.holder_name || 'Поставщик',
          supplier_id: `phantom-${bestProject.id}`
        }
      } else if (actualRequisiteType === 'crypto') {
        requisites = {
          crypto_network: requisiteData.network || requisiteData.details?.network || 'BTC',
          crypto_address: requisiteData.address || requisiteData.details?.address || 'Адрес кошелька',
          supplier_id: `phantom-${bestProject.id}`
        }
      }
      
      const result = {
        // Шаг IV: Способ оплаты
        payment_method: {
          method: bestProject.payment_method || 'bank-transfer',
          supplier_id: `phantom-${bestProject.id}`
        },
        
        // Шаг V: Реквизиты (правильные в зависимости от типа)
        requisites: {
          ...requisites,
          type: actualRequisiteType // Явно добавляем тип реквизитов
        },
        
        // Дополнительная информация
        project_info: {
          project_name: bestProject.name,
          project_date: bestProject.updated_at,
          amount: bestProject.amount,
          currency: bestProject.currency,
          status: bestProject.status
        }
      }
      
      console.log('🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ getEchoSupplierData:')
      console.log('  - Способ оплаты:', result.payment_method)
      console.log('  - Тип реквизитов:', result.requisites.type)
      console.log('  - Реквизиты:', result.requisites)
      console.log('  - Проверка соответствия:', result.payment_method.method === 'crypto' && result.requisites.type === 'crypto' ? '✅ КРИПТО' : 
                                                      result.payment_method.method === 'p2p' && result.requisites.type === 'p2p' ? '✅ P2P' :
                                                      result.payment_method.method === 'bank-transfer' && result.requisites.type === 'bank' ? '✅ БАНК' : '❌ НЕСООТВЕТСТВИЕ')
      
      return result
      
    } catch (error) {
      console.error('❌ Ошибка получения фантомных данных:', error)
      return null
    }
  }

  // Функция для получения данных профиля клиента
  const getProfileData = async (stepId: number) => {
    console.log('🔍 Получаем данные профиля для шага:', stepId)
    
    if (stepId === 1) {
      // Для шага 1 (данные компании) используем профиль клиента
      if (clientProfilesLoading) {
        console.log('⏳ Профили клиентов загружаются...')
        return null
      }
      
      if (!clientProfiles || clientProfiles.length === 0) {
        console.log('❌ Нет профилей клиентов')
        return null
      }
      
      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (clientProfiles.length > 1 && !selectedProfileId) {
        console.log('🔍 Несколько профилей - показываем выбор')
        setShowProfileSelector(true)
        return null
      }
      
      // Определяем какой профиль использовать
      let targetProfile
      if (selectedProfileId) {
        targetProfile = clientProfiles.find(p => p.id === selectedProfileId)
      } else {
        targetProfile = clientProfiles.find(p => p.is_default) || clientProfiles[0]
      }
      
      if (!targetProfile) {
        console.log('❌ Не найден профиль клиента')
        return null
      }
      
      console.log('✅ Найден профиль клиента:', targetProfile.name)
      
      return {
        name: targetProfile.name,
        legalName: targetProfile.legal_name || '',
        inn: targetProfile.inn || '',
        kpp: targetProfile.kpp || '',
        ogrn: targetProfile.ogrn || '',
        address: targetProfile.legal_address || '',
        bankName: targetProfile.bank_name || '',
        bankAccount: targetProfile.bank_account || '',
        bankCorrAccount: targetProfile.corr_account || '',
        bankBik: targetProfile.bik || '',
        email: targetProfile.email || '',
        phone: targetProfile.phone || '',
        website: targetProfile.website || ''
      }
    }
    
    // Для шагов 2, 4, 5 используем профили поставщиков
    if ([2, 4, 5].includes(stepId)) {
      if (supplierProfilesLoading) {
        console.log('⏳ Профили поставщиков загружаются...')
        return null
      }
      
      if (!supplierProfiles || supplierProfiles.length === 0) {
        console.log('❌ Нет профилей поставщиков')
        return null
      }
      
      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (supplierProfiles.length > 1 && !selectedSupplierProfileId) {
        console.log('🔍 Несколько профилей поставщиков - показываем выбор')
        setShowSupplierProfileSelector(true)
        return null
      }
      
      // Определяем какой профиль использовать
      let targetProfile
      if (selectedSupplierProfileId) {
        targetProfile = supplierProfiles.find(p => p.id === selectedSupplierProfileId)
      } else {
        targetProfile = supplierProfiles.find(p => p.is_default) || supplierProfiles[0]
      }
      
      if (!targetProfile) {
        console.log('❌ Не найден профиль поставщика')
        return null
      }
      
      console.log('✅ Найден профиль поставщика:', targetProfile.name)
      
      // Возвращаем данные в зависимости от шага
      if (stepId === 2) {
        // Шаг 2: Название поставщика и валюта
        return {
          supplier: targetProfile.name,
          currency: targetProfile.transfer_currency || 'USD'
        }
      } else if (stepId === 4) {
        // Шаг 4: Методы оплаты
        return {
          method: targetProfile.payment_methods || 'bank-transfer'
        }
      } else if (stepId === 5) {
        // Шаг 5: Банковские реквизиты
        return {
          bankName: targetProfile.bank_name || '',
          accountNumber: targetProfile.account_number || '',
          swift: targetProfile.swift || '',
          iban: targetProfile.iban || '',
          recipientName: targetProfile.recipient_name || '',
          transferCurrency: targetProfile.transfer_currency || 'USD',
          paymentPurpose: targetProfile.payment_purpose || ''
        }
      }
    }
    
    // Для остальных шагов пока возвращаем null
    console.log('⚠️ Данные профиля для шага', stepId, 'пока не реализованы')
    return null
  }

  // Функция для получения данных шаблона (симуляция)
  const getTemplateData = (templateId: string) => {
    // Находим реальный шаблон в базе данных
    const template = templates?.find(t => t.id === templateId)
    
    if (!template) {
      console.error('Шаблон не найден:', templateId)
      return null
    }
    
    console.log('=== ДАННЫЕ ШАБЛОНА ДЛЯ СПЕЦИФИКАЦИИ ===')
    console.log('template:', template)
    console.log('template.items:', template.items)
    console.log('template.specification:', template.specification)
    console.log('template.data?.specification:', template.data?.specification)
    
    return {
      id: template.id,
      name: template.name || 'Без названия',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
              data: {
          1: {
            name: template.company_name || '',
            legalName: template.company_legal_name || '',
            inn: template.company_inn || '',
            kpp: template.company_kpp || '',
            ogrn: template.company_ogrn || '',
            address: template.company_address || '',
            bankName: template.company_bank || '',
            bankAccount: template.company_account || '',
            bankCorrAccount: template.company_corr_account || template.company_corr || '',
            bankBik: template.company_bik || '',
            email: template.company_email || '',
            phone: template.company_phone || '',
            website: template.company_website || ''
          },
        2: {
          supplier: template.supplier_name || template.data?.supplier_name || template.data?.supplier || '',
          currency: template.currency || 'RUB',
          items: template.items || template.specification || template.data?.specification || []
        }
      }
    }
  }

  // Функция для применения данных шаблона к конкретному шагу
  const applyTemplateStep = (stepId: number, templateData: any) => {
    console.log(`=== ПРИМЕНЕНИЕ ШАБЛОНА ДЛЯ ШАГА ${stepId} ===`)
    console.log('templateData:', templateData)
    console.log('templateData.data:', templateData.data)
    console.log(`templateData.data[${stepId}]:`, templateData.data[stepId as keyof typeof templateData.data])
    
    if (templateData.data[stepId as keyof typeof templateData.data]) {
      // Применяем данные шаблона
      setStepConfigs(prev => ({
        ...prev,
        [stepId]: "template"
      }))
      const stepData = templateData.data[stepId as keyof typeof templateData.data]
      setManualData(prev => ({
        ...prev,
        [stepId]: stepData
      }))
      setSelectedSource(null)
      setTemplateStepSelection(null)
      console.log(`✅ Применены данные шаблона для шага ${stepId}:`, stepData)
      
      // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
      if (stepId === 2) {
        autoFillStepsFromSupplier(stepData)
      }
      
      // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
      if (stepId === 4 || stepId === 5) {
        autoFillStepFromRequisites(stepData, stepId)
      }
    } else {
      console.log(`❌ Нет данных шаблона для шага ${stepId}`)
    }
  }

  // Обработчик выбора шаблона
  const handleTemplateSelect = (templateId: string) => {
    const templateData = getTemplateData(templateId)
    if (!templateData) return
    
    const availableSteps = templateData.availableSteps
    
    // Если шаблон содержит несколько шагов, показываем выбор
    if (availableSteps.length > 1) {
      setTemplateStepSelection({
        templateId: templateId,
        availableSteps: availableSteps
      })
      setTemplateSelection(false)
    } else if (availableSteps.length === 1) {
      // Если только один шаг, применяем его автоматически
      applyTemplateStep(availableSteps[0], templateData)
      setTemplateSelection(false)
    }
  }

  // Обработчик выбора шага в шаблоне
  const handleTemplateStepSelect = (stepId: number) => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (templateData) {
        applyTemplateStep(stepId, templateData)
      }
    }
  }

  // Обработчик заполнения всех шагов из шаблона
  const handleFillAllTemplateSteps = () => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (!templateData) return
      
      // Применяем данные для всех доступных шагов
      templateStepSelection.availableSteps.forEach(stepId => {
        if (templateData.data[stepId as keyof typeof templateData.data]) {
          const stepData = templateData.data[stepId as keyof typeof templateData.data]
          setStepConfigs(prev => ({
            ...prev,
            [stepId]: "template"
          }))
          setManualData(prev => ({
            ...prev,
            [stepId]: stepData
          }))
          
          // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
          if (stepId === 2) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(async () => {
              await autoFillStepsFromSupplier(stepData)
            }, 100)
          }
          
          // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
          if (stepId === 4 || stepId === 5) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(() => {
              autoFillStepFromRequisites(stepData, stepId)
            }, 100)
          }
        }
      })
      
      setSelectedSource(null)
      setTemplateStepSelection(null)
      console.log(`Применены данные шаблона для всех шагов: ${templateStepSelection.availableSteps.join(', ')}`)
    }
  }

  // Обработчик наведения на кубик
  const handleStepHover = (stepId: number) => {
    if (isStepEnabled(stepId)) {
      setHoveredStep(stepId)
      setLastHoveredStep(stepId)
    }
  }

  // Обработчик клика по кубику (теперь не нужен, так как выбор происходит в Block 2)
  const handleStepClick = (stepId: number) => {
    console.log(`🖱️ Клик по шагу ${stepId}`)
    console.log(`📊 manualData[${stepId}]:`, manualData[stepId])
    console.log(`📊 stepConfigs[${stepId}]:`, stepConfigs[stepId])
    
    // Для шагов 4 и 5: показываем модальное окно с предложением данных
    if (stepId === 4 || stepId === 5) {
      console.log(`🎯 Обрабатываем клик по шагу ${stepId}`)
      
      // Если данные уже применены, не показываем ничего (просмотр только через карточки в блоке 2)
      if (manualData[stepId]?.user_choice && stepConfigs[stepId] === 'echoData') {
        console.log('✅ Эхо данные уже применены, просмотр доступен только через карточки в блоке 2')
        return
      }
      
      // Проверяем, есть ли эхо данные
      if (manualData[stepId]?.echo_data) {
        console.log('📋 Показываем модальное окно с эхо данными')
        setEchoDataModal({
          show: true,
          supplierName: manualData[stepId]?.supplier_name || 'Поставщик',
          echoData: manualData[stepId]?.echo_data,
          projectInfo: manualData[stepId]?.echo_data?.project_info
        })
        return
      }
      
      // Если нет эхо данных, предлагаем поиск
      console.log('📋 Предлагаем поиск эхо данных')
      
      // Подробное логирование данных шага 2
      console.log('🔍 Проверяем данные шага 2:')
      console.log('manualData[2]:', manualData[2])
      console.log('stepConfigs[2]:', stepConfigs[2])
      
      // Попробуем найти эхо данные для поставщика из шага 2
      const step2Data = manualData[2]
      console.log('🔍 step2Data:', step2Data)
      
      // Проверяем различные возможные места, где может быть supplier
      let supplierName = null
      if (step2Data) {
        if (step2Data.supplier) {
          supplierName = step2Data.supplier
          console.log('✅ Найден supplier в step2Data.supplier:', supplierName)
        } else if (step2Data.items && step2Data.items.length > 0) {
          // Проверяем первого товара
          const firstItem = step2Data.items[0]
          console.log('🔍 Первый товар:', firstItem)
          if (firstItem.supplier_name) {
            supplierName = firstItem.supplier_name
            console.log('✅ Найден supplier в первом товаре:', supplierName)
          } else if (firstItem.supplier) {
            supplierName = firstItem.supplier
            console.log('✅ Найден supplier в первом товаре (supplier):', supplierName)
          }
        }
      }
      
      if (supplierName) {
        console.log('🔍 Ищем эхо данные для поставщика:', supplierName)
        
        // Показываем лоадер
        setEchoDataLoading(true)

        getEchoSupplierData(supplierName).then(echoData => {
          if (echoData) {
            console.log('✅ Найдены эхо данные, показываем модальное окно')
            setEchoDataModal({
              show: true,
              supplierName: supplierName,
              echoData: echoData,
              projectInfo: echoData.project_info
            })
          } else {
            console.log('❌ Эхо данные для поставщика не найдены, показываем сообщение')
            alert(`Эхо данные для поставщика "${supplierName}" не найдены. Создайте проект с этим поставщиком для получения эхо данных.`)
          }
        }).catch(error => {
          console.error('❌ Ошибка поиска эхо данных:', error)
          alert('Ошибка при поиске эхо данных: ' + (error as Error).message)
        }).finally(() => {
          // Скрываем лоадер
          setEchoDataLoading(false)
        })
      } else {
        console.log('❌ Нет данных поставщика в шаге 2')
        console.log('Доступные поля в step2Data:', step2Data ? Object.keys(step2Data) : 'step2Data is null')
        alert('Сначала заполните шаг 2 (спецификация) с поставщиком, чтобы найти эхо данные.')
      }
      
      return
    }
    
    // Для остальных шагов: стандартная логика hover
    handleStepHover(stepId)
  }

  // Обработчик выбора источника данных
  const handleSourceSelect = (source: string) => {
    if (lastHoveredStep) {
      // Если выбран шаблон, показываем выбор шаблонов пользователя
      if (source === "template") {
        setTemplateSelection(true)
        return
      }
      
      // Для других источников применяем стандартную логику
      setStepConfigs(prev => ({
        ...prev,
        [lastHoveredStep]: source
      }))
      setSelectedSource(source)
      
      // Если выбран каталог, открываем полный каталог напрямую
      if (source === "catalog") {
        console.log("Выбран каталог для шага", lastHoveredStep)
        setShowCatalogModal(true)
        return
      }
      
      // Если выбран загрузка документа, показываем OCR форму
      if (source === "upload") {
        console.log("Выбрана загрузка документа для шага", lastHoveredStep)
        setSelectedSource("upload")
        return
      }
      
      // Если выбран профиль, применяем данные из профиля
      if (source === "profile") {
        console.log('🔍 Применяем данные профиля для шага:', lastHoveredStep)
        getProfileData(lastHoveredStep).then(profileData => {
        if (profileData) {
          setManualData(prev => ({
            ...prev,
            [lastHoveredStep]: profileData
          }))
            console.log(`✅ Применены данные профиля для шага ${lastHoveredStep}`)
          } else {
            console.log(`❌ Не удалось получить данные профиля для шага ${lastHoveredStep}`)
        }
        }).catch(error => {
          console.error('❌ Ошибка получения данных профиля:', error)
        })
      }
      
      // Если выбраны шаблоны, применяем данные из шаблонов
      if (source === "template") {
        try {
          // Проверяем, есть ли загруженные шаблоны
          if (!templates || templates.length === 0) {
            setTemplateError('Нет доступных шаблонов. Создайте шаблон в разделе "Создать проект".')
            return
          }
          
          // Берем первый шаблон
          const template = templates[0]
          let templateData = null
          
          // Преобразуем данные шаблона в формат для конкретного шага
          if (lastHoveredStep === 1) {
            templateData = {
              name: template.company_name || '',
              legalName: template.company_legal || '',
              inn: template.company_inn || '',
              kpp: template.company_kpp || '',
              ogrn: template.company_ogrn || '',
              address: template.company_address || '',
              bankName: template.company_bank || '',
              bankAccount: template.company_account || '',
              bankCorrAccount: template.company_corr || '',
              bankBik: template.company_bik || '',
              email: template.company_email || '',
              phone: template.company_phone || '',
              website: template.company_website || ''
            }
          } else if (lastHoveredStep === 2) {
            templateData = {
              supplier: template.supplier_name || '',
              currency: template.currency || 'RUB',
              items: template.specification || []
            }
          }
          
          if (templateData) {
            setManualData(prev => ({
              ...prev,
              [lastHoveredStep]: templateData
            }))
            console.log(`✅ Применены данные шаблона для шага ${lastHoveredStep}`)
            
            // Если это шаг II (спецификация), ищем фантомные данные поставщика
            if (lastHoveredStep === 2 && templateData.supplier) {
              console.log('🔍 Ищем фантомные данные для поставщика:', templateData.supplier)
              
                      getEchoSupplierData(templateData.supplier).then(echoData => {
          if (echoData) {
            console.log('✅ Найдены эхо данные:', echoData)
                  
                  // Автоматически заполняем шаги IV и V эхо данными
                  setManualData(prev => ({
                    ...prev,
                    4: echoData.payment_method,
                    5: echoData.requisites
                  }))
                  
                  // Устанавливаем источники данных
                  setStepConfigs(prev => ({
                    ...prev,
                    4: "echoData",
                    5: "echoData"
                  }))
                  
                  // Показываем уведомление
                  setAutoFillNotification({
                    show: true,
                    message: `Найдены эхо данные поставщика из проекта "${echoData.project_info.project_name}" (${echoData.project_info.status})`,
                    supplierName: templateData.supplier,
                    filledSteps: [4, 5]
                  })
                  
                  setTimeout(() => {
                    setAutoFillNotification(null)
                  }, 5000)
                } else {
                  console.log('❌ Фантомные данные не найдены')
                }
              }).catch(error => {
                console.error('❌ Ошибка получения эхо данных:', error)
              })
            }
          } else {
            setTemplateError(`Шаблон не содержит данных для шага ${lastHoveredStep}`)
          }
        } catch (error) {
          console.error('❌ Ошибка применения данных шаблона:', error)
          setTemplateError('Ошибка при обработке данных шаблона')
        }
      }
    }
  }

  // Определение текущего этапа
  const getCurrentStage = () => {
    // Проверяем, заполнены ли все основные шаги этапа 1
    const step1Filled = isStepFilledByUser(1)
    const step2Filled = isStepFilledByUser(2)
    const step4Filled = isStepFilledByUser(4)
    const step5Filled = isStepFilledByUser(5)
    
    console.log('🔍 Проверка этапа:', { step1Filled, step2Filled, step4Filled, step5Filled })
    
    const stage1Completed = step1Filled && step2Filled && step4Filled && step5Filled
    
    if (stage1Completed && currentStage === 1) {
      console.log('✅ Этап 1 завершен, переходим к этапу 2')
      
      // Автоматически показываем сводку при завершении этапа 1
      setTimeout(() => {
        console.log('🎯 Автоматически показываем сводку при завершении этапа 1')
        checkSummaryReadiness()
      }, 100)
      
      return 2 // Этап 2: Подготовка инфраструктуры
    } else {
      console.log('⏳ Этап 1 еще не завершен или уже в этапе 2')
      return currentStage // Возвращаем текущий этап
    }
  }

  // Определение активного сценария
  const getActiveScenario = () => {
    // Используем ту же логику, что и в isStepFilledByUser
    if (isStepFilledByUser(1)) {
      return 'A'
    }
    
    if (isStepFilledByUser(2)) {
      return 'B1'
    }
    
    if (isStepFilledByUser(4) || isStepFilledByUser(5)) {
      return 'B2'
    }
    
    return 'none' // Сценарий еще не определен
  }

  // Проверка, заполнен ли шаг пользователем (не эхо данными)
  const isStepFilledByUser = (stepId: number) => {
    // Шаг 1: проверяем что пользователь выбрал источник данных И есть данные
    if (stepId === 1) {
      const hasSource = stepConfigs[1] && stepConfigs[1] !== ''
      const hasData = manualData[1] && Object.keys(manualData[1]).length > 0
      const result = hasSource && hasData
      
      console.log(`🔍 Шаг 1: hasSource=${hasSource}, hasData=${hasData}, результат=${result}`)
      console.log(`🔍 stepConfigs[1]:`, stepConfigs[1])
      console.log(`🔍 manualData[1]:`, manualData[1])
      
      return result
    }
    
    // Шаг 2: проверяем что пользователь выбрал источник данных И есть товары
    if (stepId === 2) {
      const hasSource = stepConfigs[2] && stepConfigs[2] !== ''
      const hasItems = manualData[2] && manualData[2].items && manualData[2].items.length > 0
      const result = hasSource && hasItems
      
      console.log(`🔍 Шаг 2: hasSource=${hasSource}, hasItems=${hasItems}, результат=${result}`)
      console.log(`🔍 stepConfigs[2]:`, stepConfigs[2])
      console.log(`🔍 manualData[2]:`, manualData[2])
      
      return result
    }
    
    // Шаг 3: считаем заполненным если чек одобрен менеджером
    if (stepId === 3) {
      // Проверяем receiptApprovalStatus (локальное состояние)
      const result = receiptApprovalStatus === 'approved' || receiptApprovalStatus === 'waiting'
      
      console.log(`🔍 Шаг 3: receiptApprovalStatus=${receiptApprovalStatus}, результат=${result}`)
      
      return result
    }
    
    // Шаг 6: считаем заполненным если есть чек от менеджера
    if (stepId === 6) {
      const result = hasManagerReceipt
      
      console.log(`🔍 Шаг 6: hasManagerReceipt=${hasManagerReceipt}, managerReceiptUrl=${managerReceiptUrl}, результат=${result}`)
      console.log(`🔍 Шаг 6: projectRequestId=${projectRequestId}, currentStage=${currentStage}`)
      
      return result
    }
    
    // Шаг 7: считаем заполненным если клиент загрузил чек о получении средств
    if (stepId === 7) {
      const result = !!clientReceiptUrl
      
      console.log(`🔍 Шаг 7: clientReceiptUrl=${clientReceiptUrl}, результат=${result}`)
      
      return result
    }
    
    // Шаги 4, 5: считаем заполненными если пользователь явно выбрал (включая эхо данные)
    if (stepId === 4 || stepId === 5) {
      // Проверяем, есть ли выбор пользователя (включая примененные эхо данные)
      const hasUserChoice = manualData[stepId] && manualData[stepId].user_choice
      
      // Проверяем источник данных
      const source = stepConfigs[stepId]
      
      // Проверяем наличие данных
      const hasData = manualData[stepId] && Object.keys(manualData[stepId]).length > 0
      
      // Считаем заполненным если:
      // 1. Пользователь явно выбрал (user_choice: true)
      // 2. ИЛИ есть источник данных (включая echoData)
      // 3. ИЛИ есть данные в manualData
      const result = hasUserChoice || source || hasData
      
      console.log(`🔍 Шаг ${stepId}: user_choice=${hasUserChoice}, source=${source}, hasData=${hasData}, результат=${result}`)
      console.log(`🔍 manualData[${stepId}]:`, manualData[stepId])
      return result
    }
    
    // Остальные шаги
    return stepConfigs[stepId] || manualData[stepId]
  }

  // Функция для перехода к следующему этапу
  const goToNextStage = async () => {
    console.log('🚀 Переход к следующему этапу')
    console.log('  - Текущий этап:', currentStage)
    console.log('  - stageTransitionShown:', stageTransitionShown)
    console.log('  - dontShowStageTransition:', dontShowStageTransition)
    
    // Проверяем, находимся ли мы в модальном окне предварительного просмотра
    if (showSummaryModal) {
      console.log('📋 Мы в модальном окне предварительного просмотра')
      
      // Закрываем модальное окно предварительного просмотра
      setShowSummaryModal(false)
      console.log('✅ Модальное окно предварительного просмотра закрыто')
      
      // Показываем модальное окно перехода к этапу 2 только один раз
      if (!stageTransitionShown && !dontShowStageTransition) {
        console.log('📋 Показываем модальное окно перехода')
        setShowStageTransitionModal(true)
        setStageTransitionShown(true)
      } else {
        // Если уже показывали или отключено - сразу переходим к этапу 2
        console.log('⚡ Сразу переходим к этапу 2')
        await proceedToStage2()
      }
    } else if (currentStage === 2) {
      // Переходим к этапу 3: Анимация сделки
      setCurrentStage(3)
      console.log('✅ Переход к этапу 3: Анимация сделки')
      
      // Запускаем анимацию сделки
      startDealAnimation()
    } else {
      console.log('❌ Неизвестное состояние для перехода')
    }
  }

  // Функция для перехода к этапу 2 (после подтверждения модального окна)
  const proceedToStage2 = async () => {
    console.log('✅ Переход к этапу 2: Подготовка инфраструктуры')
    
    // Закрываем модальное окно перехода
    setShowStageTransitionModal(false)
    
    // Переходим к этапу 2
    setCurrentStage(2)
    console.log('✅ Этап изменен на 2')
    
    // Сбрасываем состояние показа модального окна перехода
    setStageTransitionShown(false)
    
    // Устанавливаем статус ожидания апрува менеджера
    setManagerApprovalStatus('pending')
    console.log('✅ Статус менеджера установлен в pending')
    
    // Автоматически отправляем данные менеджеру (с обработкой ошибок)
    console.log('📤 Автоматическая отправка данных менеджеру при переходе к этапу 2')
    try {
      await handleSendToManager()
      console.log('✅ Данные успешно отправлены менеджеру')
    } catch (error) {
      console.error('❌ Ошибка отправки менеджеру:', error)
      // Показываем уведомление об ошибке, но продолжаем
      setManagerNotification({
        show: true,
        type: 'error',
        message: 'Ошибка отправки в Telegram, но переход к этапу 2 выполнен'
      })
    }
  }

  const openStageTransitionModal = () => {
    setShowStageTransitionModal(true)
    setStageTransitionShown(true)
  }

  // Функция для возврата к редактированию на первом этапе
  const returnToStage1Editing = () => {
    console.log('🔄 Возврат к редактированию на первом этапе')
    console.log('  - Текущий этап до возврата:', currentStage)
    console.log('  - showSummaryModal до возврата:', showSummaryModal)
    console.log('  - showStageTransitionModal до возврата:', showStageTransitionModal)
    
    setShowSummaryModal(false)
    setShowStageTransitionModal(false)
    setCurrentStage(1)
    // Сбрасываем состояние показа модального окна перехода
    setStageTransitionShown(false)
    
    console.log('✅ Все модальные окна закрыты, этап установлен в 1, состояния сброшены')
  }

  // Функция для запуска анимации сделки
  const startDealAnimation = () => {
    console.log('🎬 Запускаем анимацию сделки...')
    setDealAnimationStep(0)
    setDealAnimationStatus('Начинаем анимацию...')
    setDealAnimationComplete(false)
    
    // Шаг 1: Клиент и поставщик начинают движение
    setTimeout(() => {
      setDealAnimationStep(1)
      setDealAnimationStatus('Клиент и поставщик идут к центру...')
    }, 1000)
    
    // Шаг 2: Менеджер проверяет перевод
    setTimeout(() => {
      setDealAnimationStep(2)
      setDealAnimationStatus('Менеджер проверяет перевод...')
    }, 3000)
    
    // Шаг 3: Все встречаются в центре
    setTimeout(() => {
      setDealAnimationStep(3)
      setDealAnimationStatus('Сделка завершена!')
      setDealAnimationComplete(true)
    }, 5000)
  }

  // Функция для запуска степера инфраструктуры
  const startInfrastructureStepper = () => {
    console.log('🏗️ Запускаем степер инфраструктуры...')
    setInfrastructureStepperStep(0)
    setInfrastructureStepperStatus('Начинаем настройку инфраструктуры...')
    
    // Шаг 1: Документы
    setTimeout(() => {
      setInfrastructureStepperStep(1)
      setInfrastructureStepperStatus('Настройка документов...')
    }, 1500)
    
    // Шаг 2: Получение средств
    setTimeout(() => {
      setInfrastructureStepperStep(2)
      setInfrastructureStepperStatus('Настройка получения средств...')
    }, 3000)
    
    // Шаг 3: Подтверждение
    setTimeout(() => {
      setInfrastructureStepperStep(3)
      setInfrastructureStepperStatus('Инфраструктура готова!')
    }, 4500)
  }

  // Функция для подтверждения реквизитов
  const confirmRequisites = () => {
    console.log('✅ Реквизиты подтверждены - показываем сводку этапа 2')
    setShowRequisitesConfirmationModal(false)
    setShowStage2SummaryModal(true)
  }

  // Функция для редактирования реквизитов
  const editRequisites = () => {
    console.log('✏️ Редактирование реквизитов')
    setShowRequisitesConfirmationModal(false)
    // Возвращаемся к редактированию шага 5 (реквизиты)
    setCurrentStage(1) // Возвращаемся к первому этапу для редактирования
  }

  // Функция для перехода к третьему этапу
  const proceedToStage3 = () => {
    console.log('🎬 Переход к этапу 3: Анимация сделки')
    setShowStage2SummaryModal(false)
    setCurrentStage(3)
    startDealAnimation()
  }

  // Функция для получения читаемого названия источника данных
  const getSourceDisplayName = (source: string) => {
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

  // Проверка доступности шага
  const isStepEnabled = (stepId: number) => {
    // Этап 1: Подготовка данных
    if (currentStage === 1) {
      // Активные шаги в этапе 1: 1, 2, 4, 5
      if ([1, 2, 4, 5].includes(stepId)) {
        return true
      }
      
      // Закрытые шаги в этапе 1: 3, 6, 7
      if ([3, 6, 7].includes(stepId)) {
        return false
      }
    }
    
    // Этап 2: Подготовка инфраструктуры
    if (currentStage === 2) {
      // Все шаги доступны в этапе 2
      return true
    }
    
    // Этап 3: Анимация сделки
    if (currentStage === 3) {
      // Все шаги доступны в этапе 3
      return true
    }
    
    return false
  }

  // Получение прогресса
  const getProgress = () => {
    // Считаем только шаги, заполненные пользователем (не эхо данными)
    const filledSteps = [1, 2, 3, 4, 5, 6, 7].filter(stepId => isStepFilledByUser(stepId)).length
    return Math.round((filledSteps / 7) * 100)
  }

  // Получение сводки настроенных шагов
    const getConfiguredStepsSummary = () => {
    const summary = []

    // Проверяем все шаги
    for (let stepId = 1; stepId <= 7; stepId++) {
      const isFilled = isStepFilledByUser(stepId)

      if (isFilled) {
        const step = constructorSteps.find(s => s.id === stepId)
        const source = stepConfigs[stepId]

        const sourceInfo = source ? dataSources[source as keyof typeof dataSources] : null

        const item = {
          stepId: stepId,
          stepName: step?.name,
          sourceName: sourceInfo?.name || 'Вручную',
          source: source,
          data: manualData[stepId]
        }

        summary.push(item)
      }
    }

    return summary.sort((a, b) => a.stepId - b.stepId)
  }

  // Функция проверки готовности к показу сводки
  const checkSummaryReadiness = () => {
    const requiredSteps = [1, 2, 4, 5]
    const filledSteps = requiredSteps.filter(stepId => isStepFilledByUser(stepId))
    
    console.log('🔍 Проверка готовности к сводке:')
    console.log('  - Текущий этап:', currentStage)
    console.log('  - Требуемые шаги:', requiredSteps)
    console.log('  - Заполненные шаги:', filledSteps)
    console.log('  - manualData:', manualData)
    console.log('  - stepConfigs:', stepConfigs)
    
    // НЕ показываем модальное окно предварительного просмотра, если мы уже на этапе 2 или выше
    if (currentStage >= 2) {
      console.log('⏭️ Пропускаем показ модального окна предварительного просмотра - уже на этапе 2+')
      return
    }
    
    // НЕ показываем модальное окно предварительного просмотра, если уже есть активные модальные окна
    if (showSummaryModal || showStageTransitionModal) {
      console.log('⏭️ Пропускаем показ модального окна предварительного просмотра - уже есть активные модальные окна')
      return
    }
    
    requiredSteps.forEach(stepId => {
      const isFilled = isStepFilledByUser(stepId)
      console.log(`  - Шаг ${stepId}: ${isFilled ? '✅ Заполнен' : '❌ Не заполнен'}`)
    })
    
    if (filledSteps.length === requiredSteps.length) {
      console.log('✅ Все основные шаги заполнены - показываем сводку')
      setShowSummaryModal(true)
    } else {
      console.log(`❌ Не все шаги заполнены: ${filledSteps.length}/${requiredSteps.length}`)
    }
  }

  // Обработчик сохранения данных формы
  const handleManualDataSave = (stepId: number, data: any) => {
    console.log('=== СОХРАНЕНИЕ ДАННЫХ ===')
    console.log('stepId:', stepId)
    console.log('data для сохранения:', data)
    
    setManualData(prev => {
      console.log('Текущие manualData:', prev)
      
      // Для шага 1 объединяем данные с существующими
      if (stepId === 1) {
        const existingData = prev[stepId] || {}
        const mergedData = { ...existingData, ...data }
        console.log('Объединенные данные:', mergedData)
        const newData = { ...prev, [stepId]: mergedData }
        
              // Проверяем готовность к сводке после обновления данных (только если не на этапе 2+)
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)
      return newData
      }
      
      // Для остальных шагов просто заменяем
      const newData = { ...prev, [stepId]: data }
      
      // Автоматическое заполнение шагов IV и V после заполнения шага II
      if (stepId === 2) {
        autoFillStepsFromSupplier(data)
      }
      
      // Автоматическое заполнение шага II после заполнения шагов IV или V
      if (stepId === 4 || stepId === 5) {
        autoFillStepFromRequisites(data, stepId)
      }
      
      // Проверяем готовность к сводке после обновления данных (только если не на этапе 2+)
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)
      return newData
    })
    
    // Проверяем переход между этапами
    setTimeout(() => {
      const currentStage = getCurrentStage()
      const previousStage = getCurrentStage() // Это будет предыдущий этап
      
      if (currentStage === 2 && previousStage === 1) {
        // Показываем уведомление о переходе к этапу 2
        setAutoFillNotification({
          show: true,
          message: '🎉 Этап 1 завершен! Теперь доступны шаги 3, 6, 7 для завершения сделки.',
          supplierName: '',
          filledSteps: [3, 6, 7]
        })
      }
    }, 100)
    
    setSelectedSource(null) // Скрываем форму после сохранения
    setEditingType('') // Сбрасываем тип редактирования
  }

  // Обработчик загрузки файла
  const handleFileUpload = async (stepId: number, file: File) => {
    // Сразу показываем индикатор загрузки
    setOcrAnalyzing(prev => ({ ...prev, [stepId]: true }));
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log(`🔍 Начинаем загрузку файла для шага ${stepId}:`, file.name)
      console.log(`📄 Тип файла: ${file.type}`)
      console.log(`📏 Размер файла: ${file.size} байт`)
      
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Необходима авторизация для загрузки файлов');
      }

      // Определяем bucket для загрузки в зависимости от шага
      const bucketMap = {
        1: 'step-a1-ready-company',    // Карточки компаний
        2: 'step2-ready-invoices',     // Спецификации и инвойсы (как в обычном конструкторе)
        3: 'step3-supplier-receipts',  // Чеки поставщиков
        4: 'project-files',            // Документы по оплате
        5: 'project-files',            // Реквизиты
        6: 'step6-client-receipts',    // Чеки клиентов
        7: 'step7-client-confirmations' // Подтверждения
      };

      const bucket = bucketMap[stepId as keyof typeof bucketMap] || 'project-files';
      console.log(`📦 Используем bucket: ${bucket}`)
      
      // Генерируем уникальное имя файла (как в обычном конструкторе)
      const sender = 'atomic-constructor';
      const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^\w.-]+/g, '_').substring(0, 50);
      const fileName = `invoices/atomic/${date}_${timestamp}_${sender}_${cleanName}`;
      
      console.log(`📁 Путь файла: ${fileName}`)
      
      // Загружаем файл в Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true // Перезаписываем файл, если он уже существует
        });

      if (error) {
        console.error("❌ Ошибка загрузки в Supabase Storage:", error);
        throw new Error(`Ошибка загрузки файла: ${error.message}`);
      }

      console.log("✅ Файл успешно загружен в Storage:", data);

      // Получаем публичную ссылку
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const fileUrl = urlData?.publicUrl;
      if (!fileUrl) {
        throw new Error('Не удалось получить ссылку на файл');
      }

      console.log(`🔗 Публичный URL: ${fileUrl}`);
      
      // Сохраняем ссылку на файл
      setUploadedFiles(prev => ({ ...prev, [stepId]: fileUrl }))
      
      // Устанавливаем конфигурацию шага как upload
      setStepConfigs(prev => ({ ...prev, [stepId]: 'upload' }))

      // 🔍 OCR АНАЛИЗ В ЗАВИСИМОСТИ ОТ ШАГА
      console.log(`🔍 Начинаем OCR анализ для шага ${stepId}...`)
      if (stepId === 1) {
        // Анализ карточки компании
        await analyzeCompanyCard(fileUrl, file.type);
      } else if (stepId === 2) {
        // Анализ спецификации/инвойса
        await analyzeSpecification(fileUrl, file.type);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error);
      // Показываем ошибку пользователю
      setOcrError(prev => ({ ...prev, [stepId]: `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` }));
    }
  }

  // 🔍 АНАЛИЗ КАРТОЧКИ КОМПАНИИ
  const analyzeCompanyCard = async (fileUrl: string, fileType: string) => {
    const stepId = 1;
    // setOcrAnalyzing уже установлен в handleFileUpload
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log("🔍 Начинаем анализ карточки компании...");
      
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileType: fileType,
          documentType: 'company_card'
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("❌ Ошибка API:", analysisResponse.status, errorText);
        throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      // Проверяем успешность анализа
      if (!analysisResult.success) {
        console.log("⚠️ Анализ не удался:", analysisResult.error);
        setOcrError(prev => ({ 
          ...prev, 
          [stepId]: analysisResult.error || 'Не удалось извлечь данные из документа' 
        }));
        return;
      }
      
      const extractedData = analysisResult.suggestions;
      
      console.log("✅ Данные компании извлечены:", extractedData);
      console.log("📊 Ключи в extractedData:", Object.keys(extractedData));
      console.log("📊 extractedData.companyName:", extractedData.companyName);
      console.log("📊 extractedData.inn:", extractedData.inn);
      console.log("📊 extractedData.phone:", extractedData.phone);
      console.log("📊 extractedData.email:", extractedData.email);
      console.log("📊 extractedData.bankBik:", extractedData.bankBik);
      console.log("📊 extractedData.bankCorrAccount:", extractedData.bankCorrAccount);
      
      // Сохраняем отладочные данные
      setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }));
      
      // Автозаполнение данных компании
      if (extractedData && Object.keys(extractedData).length > 0) {
        const companyData = {
          name: extractedData.companyName || extractedData.name || '',
          legalName: extractedData.legalName || extractedData.companyName || '',
          inn: extractedData.inn || '',
          kpp: extractedData.kpp || '',
          ogrn: extractedData.ogrn || '',
          address: extractedData.address || '',
          phone: extractedData.phone || '',
          email: extractedData.email || '',
          website: extractedData.website || '',
          director: extractedData.director || '',
          bankName: extractedData.bankName || '',
          bankAccount: extractedData.bankAccount || '',
          bik: extractedData.bankBik || extractedData.bik || '',
          correspondentAccount: extractedData.bankCorrAccount || extractedData.correspondentAccount || ''
        };
        
        // Проверяем, есть ли хотя бы какие-то данные
        const hasData = Object.values(companyData).some(value => value && value.toString().trim() !== '');
        
        if (hasData) {
          // Сохраняем извлеченные данные
          setManualData(prev => ({ ...prev, [stepId]: companyData }));
          console.log("✅ Данные компании автозаполнены:", companyData);
          console.log("📊 Проверяем контактные данные:");
          console.log("📊 companyData.phone:", companyData.phone);
          console.log("📊 companyData.email:", companyData.email);
        } else {
          console.log("⚠️ Данные извлечены, но все поля пустые");
          setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }));
        }
      } else {
        console.log("⚠️ extractedData пустой или не содержит данных");
        setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }));
      }
    } catch (error) {
      console.error("❌ Ошибка анализа карточки компании:", error);
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }));
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
    }
  }

  // 🔍 АНАЛИЗ СПЕЦИФИКАЦИИ/ИНВОЙСА (скопировано из обычного конструктора)
  const analyzeSpecification = async (fileUrl: string, fileType: string) => {
    const stepId = 2;
    // setOcrAnalyzing уже установлен в handleFileUpload
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log("🔍 Начинаем анализ спецификации...");
      
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileType: fileType,
          documentType: 'invoice'
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("❌ Ошибка API:", analysisResponse.status, errorText);
        throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      const extractedData = analysisResult.suggestions;
      const analysisText = analysisResult.extractedText;
        
        console.log("✅ Данные спецификации извлечены:", extractedData);
        console.log("📊 Ключи в extractedData:", Object.keys(extractedData));
        console.log("📊 extractedData.items:", extractedData.items);
        console.log("📊 extractedData.invoiceInfo:", extractedData.invoiceInfo);
        console.log("📊 extractedData.bankInfo:", extractedData.bankInfo);
        console.log("📊 Детали извлеченных данных:");
        console.log("   - invoiceInfo:", extractedData.invoiceInfo);
        console.log("   - seller:", extractedData.invoiceInfo?.seller);
        console.log("   - items count:", extractedData.items?.length || 0);
        console.log("   - items:", extractedData.items);
        console.log("   - bankInfo:", extractedData.bankInfo);
        console.log("   - analysisText (первые 500 символов):", analysisText?.substring(0, 500));
        
        // Сохраняем отладочные данные
        setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }));
        
        // Очищаем название поставщика от лишних символов (всегда)
        let supplierName = extractedData.invoiceInfo?.seller || extractedData.seller || '';
        
        if (supplierName) {
          // Убираем префиксы типа "| Agent: ", "| Buyer:", "Поставщик:", "Продавец:" и т.д.
          supplierName = supplierName
            .replace(/^\|\s*(Agent|Buyer|Seller|Поставщик|Продавец|Покупатель):\s*/i, '')
            .replace(/^\|\s*/g, '')
            .trim();
        }
        
        console.log("🏢 Поставщик из OCR:", supplierName);
        
        // 🔥 НОВОЕ: Извлекаем банковские реквизиты из инвойса
        const bankRequisites = extractBankRequisitesFromInvoice(extractedData, analysisText);
        console.log("🏦 Извлеченные банковские реквизиты:", bankRequisites);
        
        // Автозаполнение спецификации извлеченными данными (как в обычном конструкторе)
        if (extractedData && extractedData.items && extractedData.items.length > 0) {
          const specificationItems = extractedData.items.map((invoiceItem: any) => ({
            name: invoiceItem.name || "Товар из инвойса", // Основное поле name
            item_name: invoiceItem.name || "Товар из инвойса", // Дублируем для совместимости с UI
            item_code: invoiceItem.code || "", // Используем item_code для совместимости с UI
            code: invoiceItem.code || "", // Дублируем для совместимости
            quantity: Number(invoiceItem.quantity) || 1,
            unit: "шт", // Стандартная единица измерения
            price: Number(invoiceItem.price) || 0,
            total: Number(invoiceItem.total) || 0,
            description: invoiceItem.description || ""
          }));
          
          // Сохраняем извлеченные данные
          const specificationData = {
            supplier: supplierName,
            items: specificationItems,
            totalAmount: extractedData.invoiceInfo?.totalAmount || 
              extractedData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0),
            currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
          };
          
          setManualData(prev => {
            const newData = { ...prev, [stepId]: specificationData };
            console.log("🔄 Обновляем manualData для шага", stepId);
            console.log("📊 Новые данные:", newData);
            console.log("📊 manualData после обновления:", newData);
            return newData;
          });
          console.log("✅ Спецификация автозаполнена:", specificationData);
          console.log(`✅ Добавлено ${specificationItems.length} позиций на сумму ${specificationData.totalAmount} руб.`);
          
          // 🔥 НОВОЕ: Автоматически предлагаем способ оплаты и реквизиты
          if (bankRequisites.hasRequisites) {
            suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
          }
        } else {
          // Если товары не найдены, но есть информация о поставщике, сохраняем её
          if (extractedData && extractedData.invoiceInfo && supplierName) {
            const specificationData = {
              supplier: supplierName,
              items: [],
              totalAmount: 0,
              currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
            };
            
            setManualData(prev => ({ ...prev, [stepId]: specificationData }));
            console.log("✅ Поставщик сохранен:", specificationData);
            setOcrError(prev => ({ ...prev, [stepId]: 'Найдена информация об инвойсе, но товары не извлечены. Добавьте позиции вручную.' }));
            
            // 🔥 НОВОЕ: Предлагаем реквизиты даже если нет товаров
            if (bankRequisites.hasRequisites) {
              suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
            }
          } else {
            console.log("⚠️ Товары не найдены в документе");
            setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь товары из документа' }));
          }
        }
    } catch (error) {
      console.error("❌ Ошибка анализа спецификации:", error);
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }));
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
    }
  }

  // 🔥 НОВАЯ ФУНКЦИЯ: Извлечение банковских реквизитов из инвойса
  const extractBankRequisitesFromInvoice = (extractedData: any, analysisText: string) => {
    console.log("🏦 Начинаем извлечение банковских реквизитов из инвойса...");
    
    const requisites = {
      bankName: '',
      accountNumber: '',
      swift: '',
      recipientName: '',
      recipientAddress: '',
      transferCurrency: '',
      hasRequisites: false
    };

    // Извлекаем данные из структурированных полей
    if (extractedData.bankInfo) {
      requisites.bankName = extractedData.bankInfo.bankName || '';
      requisites.accountNumber = extractedData.bankInfo.accountNumber || '';
      requisites.swift = extractedData.bankInfo.swift || '';
      requisites.recipientName = extractedData.bankInfo.recipientName || '';
      requisites.recipientAddress = extractedData.bankInfo.recipientAddress || '';
      requisites.transferCurrency = extractedData.bankInfo.currency || '';
    }

    // 🔥 НОВОЕ: Очищаем recipientName от лишних символов
    if (requisites.recipientName) {
      requisites.recipientName = requisites.recipientName
        .replace(/\(账户名称\):\s*/i, '') // Убираем китайский текст
        .replace(/\(Account Name\):\s*/i, '') // Убираем английский текст
        .replace(/^[^a-zA-Z0-9]*/, '') // Убираем символы в начале
        .trim();
      console.log("🧹 Очищенное recipientName:", requisites.recipientName);
    }

    // Если структурированные данные не найдены, ищем в тексте
    if (!requisites.accountNumber && analysisText) {
      // Поиск номера счета (USD A/C NO., EUR A/C NO., Account Number)
      const accountPatterns = [
        /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Account\s*Number\s*:?\s*(\d+)/i,
        /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Номер\s*счета\s*:?\s*(\d+)/i
      ];
      
      for (const pattern of accountPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.accountNumber = match[1];
          console.log("✅ Найден номер счета:", requisites.accountNumber);
          break;
        }
      }

      // Поиск SWIFT кода
      const swiftPatterns = [
        /SWIFT\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
        /SWIFT\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
        /BIC\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i
      ];
      
      for (const pattern of swiftPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.swift = match[1];
          console.log("✅ Найден SWIFT код:", requisites.swift);
          break;
        }
      }

      // Поиск названия получателя (ACCOUNT NAME, BENEFICIARY)
      const recipientPatterns = [
        /ACCOUNT\s*NAME\s*:?\s*([^\n]+)/i,
        /BENEFICIARY\s*NAME\s*:?\s*([^\n]+)/i,
        /Получатель\s*:?\s*([^\n]+)/i
      ];
      
      for (const pattern of recipientPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.recipientName = match[1].trim();
          console.log("✅ Найдено название получателя:", requisites.recipientName);
          break;
        }
      }

      // Поиск адреса получателя
      const addressPatterns = [
        /BENEFICIARY'?S?\s*ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i,
        /ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i,
        /Адрес\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i
      ];
      
      for (const pattern of addressPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.recipientAddress = match[1].trim();
          console.log("✅ Найден адрес получателя:", requisites.recipientAddress);
          break;
        }
      }

      // Определение валюты из номера счета
      if (analysisText.includes('USD A/C NO.') || analysisText.includes('USD')) {
        requisites.transferCurrency = 'USD';
      } else if (analysisText.includes('EUR A/C NO.') || analysisText.includes('EUR')) {
        requisites.transferCurrency = 'EUR';
      }
    }

    // Проверяем, есть ли хотя бы основные реквизиты
    requisites.hasRequisites = !!(requisites.accountNumber || requisites.swift || requisites.recipientName);
    
    console.log("🏦 Результат извлечения реквизитов:", requisites);
    return requisites;
  };

  // 🔥 НОВАЯ ФУНКЦИЯ: Предложение способа оплаты и реквизитов
  const suggestPaymentMethodAndRequisites = (bankRequisites: any, ocrSupplierName: string) => {
    console.log("💡 Предлагаем способ оплаты и реквизиты:", bankRequisites);
    console.log("🏢 Поставщик из OCR (переданный):", ocrSupplierName);
    
    // Используем переданное имя поставщика
    let supplierName = ocrSupplierName || '';
    
    // Если OCR не нашел поставщика, пробуем из банковских реквизитов
    if (!supplierName) {
      supplierName = bankRequisites.recipientName || '';
      console.log("🔍 Поставщик из банковских реквизитов (fallback):", supplierName);
    }
    
    // Fallback to step 2 data if still empty (though it should be passed now)
    if (!supplierName && manualData[2]?.supplier) {
      supplierName = manualData[2].supplier;
      console.log("🔍 Поставщик из шага 2 (fallback):", supplierName);
    }
    
    console.log("🏢 Финальный поставщик для шага 4:", supplierName);
    
    console.log("🏢 Поставщик для модального окна:", supplierName);
    
    // Автоматически предлагаем "Банковский перевод" как способ оплаты
    const paymentMethodData = {
      method: 'bank-transfer',
      supplier: supplierName,
      suggested: true,
      source: 'ocr_invoice'
    };
    
    // Подготавливаем реквизиты как предложения
    const requisitesData = {
      bankName: bankRequisites.bankName || '',
      accountNumber: bankRequisites.accountNumber || '',
      swift: bankRequisites.swift || '',
      recipientName: bankRequisites.recipientName || '',
      recipientAddress: bankRequisites.recipientAddress || '',
      transferCurrency: bankRequisites.transferCurrency || 'USD',
      suggested: true,
      source: 'ocr_invoice'
    };
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА
    console.log("🔍 ДЕТАЛЬНАЯ ОТЛАДКА РЕКВИЗИТОВ:");
    console.log("   - bankRequisites.bankName:", bankRequisites.bankName);
    console.log("   - bankRequisites.accountNumber:", bankRequisites.accountNumber);
    console.log("   - bankRequisites.swift:", bankRequisites.swift);
    console.log("   - bankRequisites.recipientName:", bankRequisites.recipientName);
    console.log("   - requisitesData.bankName:", requisitesData.bankName);
    console.log("   - requisitesData.accountNumber:", requisitesData.accountNumber);
    console.log("   - requisitesData.swift:", requisitesData.swift);
    
    // Сохраняем предложения в manualData
    setManualData(prev => {
      const newData = {
        ...prev,
        4: paymentMethodData,  // Шаг 4 - Способ оплаты
        5: requisitesData      // Шаг 5 - Реквизиты
      };
      console.log("💾 Сохраняем в manualData[5]:", newData[5]);
      return newData;
    });
    
    // Устанавливаем источники данных
    setStepConfigs(prev => ({
      ...prev,
      4: 'ocr_suggestion',
      5: 'ocr_suggestion'
    }));
    
    console.log("✅ Предложения сохранены:");
    console.log("   - Шаг 4 (Способ оплаты):", paymentMethodData);
    console.log("   - Шаг 5 (Реквизиты):", requisitesData);
  };

  // Обработчик отмены выбора источника
  const handleCancelSource = () => {
    setSelectedSource(null)
    setEditingType('')
  }

  // Функция для открытия модального окна с данными шага
  const handleViewStepData = (stepId: number) => {
    const stepData = manualData[stepId]
    if (stepData) {
      setStepDataToView({ stepId, data: stepData })
      setShowStepDataModal(true)
    }
  }

  const handleRemoveSource = (stepId: number) => {
    // Удаляем источник данных для конкретного шага
    setStepConfigs(prev => {
      const newConfigs = { ...prev }
      delete newConfigs[stepId]
      return newConfigs
    })
    
    // Очищаем сохраненные данные
    setManualData(prev => {
      const newData = { ...prev }
      delete newData[stepId]
      return newData
    })
    
    // Очищаем загруженные файлы
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[stepId]
      return newFiles
    })
    
    // Сбрасываем выбранный источник
    setSelectedSource(null)
  }

  // Функция для открытия предварительного просмотра данных
  const handlePreviewData = (type: string, data: any) => {
    console.log('=== ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР ===')
    console.log('type:', type)
    console.log('data для просмотра:', data)
    console.log('manualData[1]:', manualData[1])
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ДЛЯ РЕКВИЗИТОВ
    if (type === 'requisites') {
      console.log('🔍 ОТЛАДКА РЕКВИЗИТОВ:')
      console.log('   - bankName:', data.bankName)
      console.log('   - accountNumber:', data.accountNumber)
      console.log('   - swift:', data.swift)
      console.log('   - recipientName:', data.recipientName)
      console.log('   - supplier:', data.supplier)
      console.log('   - suggested:', data.suggested)
      console.log('   - source:', data.source)
    }
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ДЛЯ СПОСОБА ОПЛАТЫ
    if (type === 'payment') {
      console.log('🔍 ОТЛАДКА СПОСОБА ОПЛАТЫ:')
      console.log('   - method:', data.method)
      console.log('   - supplier:', data.supplier)
      console.log('   - suggested:', data.suggested)
      console.log('   - source:', data.source)
    }
    
    setPreviewType(type)
    setPreviewData(data)
    setShowPreviewModal(true)
  }

  // Функция для открытия формы редактирования
  const handleEditData = (type: string) => {
    setSelectedSource("manual")
    setShowPreviewModal(false)
    // Сохраняем тип редактируемых данных для передачи в форму
    if (type === 'bank') {
      setEditingType('bank')
    } else if (type === 'contacts') {
      setEditingType('contacts')
    } else {
      setEditingType('company')
    }
  }

  // Функция удалена - счетчики теперь управляются в CatalogModal

  const handleAddProductsFromCatalog = () => {
    console.log('🛒 Открытие полного каталога')
    setShowCatalogModal(true)
  }
  
  // Обработчик добавления товаров из каталога
  const handleCatalogProductsAdd = (products: any[]) => {
    try {
      console.error('🚨🚨🚨 ATOMIC CATALOG ADD CALLED! Products:', products?.length || 0)
      alert('🚨 ATOMIC: Товары получены! Количество: ' + (products?.length || 0))
      console.log('🔥 [ATOMIC] ВЫЗОВ handleCatalogProductsAdd функции!', products?.length || 0, 'товаров')
      console.log('📦 [ATOMIC] Получены товары из каталога:', products)

      // Преобразуем товары в формат Step II
      const catalogItems = products.map(product => ({
        name: product.name || product.item_name || 'Товар из каталога',
        quantity: product.quantity || 1,
        price: parseFloat(product.price) || 0,
        currency: product.currency || 'USD',
        supplier_id: product.supplier_id,
        supplier_name: product.supplier_name,
        image_url: product.image_url || product.images?.[0] || '',
        sku: product.sku || product.item_code || ''
      }))

      // Добавляем товары в Step II
      setManualData(prev => ({
        ...prev,
        2: {
          ...prev[2],
          supplier: catalogItems[0]?.supplier_name || prev[2]?.supplier,
          currency: catalogItems[0]?.currency || prev[2]?.currency || 'USD',
          items: [...(prev[2]?.items || []), ...catalogItems]
        }
      }))

      // Устанавливаем источник данных для Step II
      setStepConfigs(prev => ({
        ...prev,
        2: 'catalog'
      }))

      console.log(`✅ [ATOMIC] Добавлено ${catalogItems.length} товаров в спецификацию`)

      // Вызываем автоматическое заполнение для Step II данных (обратная связь)
      const step2Data = {
        supplier: catalogItems[0]?.supplier_name,
        currency: catalogItems[0]?.currency || 'USD',
        items: catalogItems,
        supplier_id: catalogItems[0]?.supplier_id // Добавляем supplier_id для правильной работы autoFillStepFromRequisites
      }

      // Используем setTimeout для правильной последовательности обновлений состояния
      setTimeout(() => {
        if (catalogItems[0]?.supplier_id) {
          autoFillStepFromRequisites(step2Data, 2)
        }
      }, 100)

      // 🎯 АВТОЗАПОЛНЕНИЕ ДАННЫХ ПОСТАВЩИКА ДЛЯ ШАГОВ IV И V
      const firstProduct = products[0]
      if (firstProduct?.supplier_id) {
        console.log('🔍 [ATOMIC] Загружаем данные поставщика для автозаполнения:', firstProduct.supplier_name)

        // ПРИОРИТЕТ КАТАЛОГА: Когда товары из каталога, ВСЕГДА используем свежие данные каталога
        console.log('🎯 [ATOMIC] Товары добавлены из каталога - приоритет данных каталога над эхо данными')

        // Сначала загружаем АКТУАЛЬНЫЕ данные каталога
        fetch(`/api/catalog/verified-suppliers?search=${encodeURIComponent(firstProduct.supplier_name)}`)
          .then(response => response.json())
          .then(data => {
            console.log('🔍 [ATOMIC] Ответ API verified-suppliers:', data)
            const supplier = data.suppliers?.find((s: any) =>
              s.name.toLowerCase().includes(firstProduct.supplier_name.toLowerCase())
            )

            if (supplier) {
              console.log('✅ [ATOMIC] Найден поставщик в каталоге:', supplier)

              // Заполняем Step IV с РЕАЛЬНЫМИ методами оплаты из каталога
              console.log('🎯 [ATOMIC] Заполняю Step 4 с данными поставщика:', supplier.name)
              console.log('💳 [ATOMIC] Доступные методы оплаты:', supplier.payment_methods)

              // Фильтруем методы оплаты, исключая cash (наличные) и убираем дубликаты
              const normalizedMethods = (supplier.payment_methods || ['bank_transfer'])
                .map(method => method === 'bank_transfer' ? 'bank-transfer' : method) // Нормализуем формат
                .filter(method => method !== 'cash') // Исключаем наличные
                .filter((value, index, self) => self.indexOf(value) === index) // Убираем дубликаты
              const availableMethods = normalizedMethods.length > 0 ? normalizedMethods : ['bank-transfer']

              const step4Data = {
                type: 'multiple',
                methods: availableMethods,
                payment_method: availableMethods[0] || 'bank_transfer',
                auto_filled: true,
                supplier_name: supplier.name,
                supplier_data: supplier,
                catalog_source: 'verified_supplier',
                user_choice: true
              }

              console.log('📋 [ATOMIC] Step 4 Data:', step4Data)

              setManualData(prev => ({
                ...prev,
                4: step4Data
              }))

              // Заполняем Step V с РЕАЛЬНЫМИ реквизитами из каталога
              setManualData(prev => ({
                ...prev,
                5: {
                  supplier_name: supplier.name,
                  supplier_data: supplier,
                  bank_accounts: supplier.bank_accounts || [],
                  crypto_wallets: supplier.crypto_wallets || [],
                  p2p_cards: supplier.p2p_cards || [],
                  requisites: {
                    bank_accounts: supplier.bank_accounts || [],
                    crypto_wallets: supplier.crypto_wallets || [],
                    p2p_cards: supplier.p2p_cards || []
                  },
                  auto_filled: true,
                  catalog_source: 'verified_supplier',
                  user_choice: false
                }
              }))

              // Устанавливаем конфигурацию как каталожную
              setStepConfigs(prev => ({
                ...prev,
                4: 'catalog',
                5: 'catalog'
              }))

              console.log('✅ [ATOMIC] Шаги 4 и 5 заполнены РЕАЛЬНЫМИ данными каталога')

              // Показываем уведомление с реальными данными
              setAutoFillNotification({
                show: true,
                message: `Данные поставщика "${supplier.name}" из каталога применены. Доступно методов: ${supplier.payment_methods?.length || 0}`,
                supplierName: supplier.name,
                filledSteps: [4, 5]
              })

              // Скрываем уведомление через 7 секунд
              setTimeout(() => {
                setAutoFillNotification(null)
              }, 7000)
            } else {
              console.log('❌ [ATOMIC] Поставщик не найден в каталоге, используем эхо данные как fallback')

              // FALLBACK: Пытаемся получить фантомные данные поставщика
              getEchoSupplierData(firstProduct.supplier_name).then(echoData => {
                if (echoData) {
            console.log('✅ [ATOMIC] Найдены фантомные данные для поставщика:', echoData)

            // Автоматически заполняем Steps IV и V напрямую
            console.log('🎯 [ATOMIC] Прямое заполнение шагов 4 и 5 с эхо данными')

            // Заполняем Step IV (Способ оплаты)
            setManualData(prev => ({
              ...prev,
              4: {
                type: 'multiple',
                methods: echoData.payment_method?.available_methods || [echoData.payment_method?.method] || ['bank_transfer'],
                payment_method: echoData.payment_method?.method || 'bank_transfer',
                auto_filled: true,
                supplier_name: firstProduct.supplier_name,
                echo_source: echoData.project_info?.project_name,
                user_choice: true
              }
            }))

            // Заполняем Step V (Реквизиты поставщика)
            setManualData(prev => ({
              ...prev,
              5: {
                supplier_name: firstProduct.supplier_name,
                requisites: echoData.requisites || {},
                auto_filled: true,
                echo_source: echoData.project_info?.project_name,
                user_choice: true
              }
            }))

            // Обновляем конфигурацию шагов как завершенные
            setStepConfigs(prev => ({
              ...prev,
              4: 'echoData',
              5: 'echoData'
            }))

            console.log('✅ [ATOMIC] Шаги 4 и 5 автоматически заполнены эхо данными')

            // Показываем уведомление
            setAutoFillNotification({
              show: true,
              message: `Данные поставщика из проекта "${echoData.project_info.project_name}" автоматически применены`,
              supplierName: firstProduct.supplier_name,
              filledSteps: [4, 5]
            })

            // Скрываем уведомление через 5 секунд
            setTimeout(() => {
              setAutoFillNotification(null)
            }, 5000)
                } else {
                  console.log('❌ [ATOMIC] Нет эхо данных, используем базовые данные')

                  // Fallback с базовыми данными
                  setManualData(prev => ({
                    ...prev,
                    4: {
                      type: 'multiple',
                      methods: ['bank_transfer'],
                      payment_method: 'bank_transfer',
                      auto_filled: true,
                      supplier_name: firstProduct.supplier_name,
                      catalog_source: 'unknown_supplier',
                      user_choice: true
                    }
                  }))

                  setStepConfigs(prev => ({
                    ...prev,
                    4: 'catalog'
                  }))
                }
              }).catch(error => {
                console.error('❌ [ATOMIC] Ошибка загрузки эхо данных:', error)
              })
            }
          }).catch(error => {
            console.error('❌ [ATOMIC] Ошибка загрузки данных каталога:', error)
          })
      }

      // Закрываем модальное окно каталога
      setShowCatalogModal(false)

    } catch (error) {
      console.error('❌ [ATOMIC] КРИТИЧЕСКАЯ ОШИБКА в handleCatalogProductsAdd:', error)
      alert('🚨 ОШИБКА: ' + error)
    }
  }

  // Функции для обработки свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !lastHoveredStep) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    const items = manualData[lastHoveredStep]?.items

    if (isLeftSwipe && items && items.length > 3) {
      // Свайп влево - следующий набор
      setCurrentItemIndex(prev => 
        prev < Math.max(0, items.length - 3) ? prev + 1 : prev
      )
    }
    
    if (isRightSwipe && items && items.length > 3) {
      // Свайп вправо - предыдущий набор
      setCurrentItemIndex(prev => prev > 0 ? prev - 1 : prev)
    }

    // Сброс значений
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Функция для тестирования эхо данных
  const testEchoData = async () => {
    console.log('🧪 Тестирование эхо данных...')
    
    try {
      // Попробуем получить реальные эхо данные для тестирования
      const supplierName = 'Тестовый поставщик'
      const echoData = await getEchoSupplierData(supplierName)
      
      if (echoData) {
        console.log('✅ Найдены реальные эхо данные для тестирования')
        
        // Показываем модальное окно с реальными данными
        setEchoDataModal({
          show: true,
          supplierName: supplierName,
          echoData: echoData,
          projectInfo: echoData.project_info
        })
        
        console.log('📋 Модальное окно должно открыться с реальными данными')
      } else {
        console.log('❌ Реальные эхо данные не найдены для тестирования')
        alert('Реальные эхо данные не найдены. Создайте проект с поставщиком для тестирования.')
      }
      
    } catch (error) {
      console.error('❌ Ошибка тестирования:', error)
      alert('Ошибка при поиске эхо данных: ' + (error as Error).message)
    }
  }

  // Функция для применения эхо данных (вызывается из модального окна)
  const applyEchoData = (echoData: any) => {
    console.log('✅ Применяем эхо данные:', echoData)
    console.log('🔍 Способ оплаты:', echoData.payment_method)
    console.log('🔍 Реквизиты:', echoData.requisites)
    console.log('🔍 Тип реквизитов:', echoData.requisites?.type)
    
    // Применяем данные для шагов 4 и 5
    // Фильтруем методы оплаты, исключая cash (наличные) и убираем дубликаты
    const rawMethods = echoData.payment_method?.available_methods || [echoData.payment_method?.method] || ['bank_transfer']
    const normalizedEchoMethods = rawMethods
      .map(method => method === 'bank_transfer' ? 'bank-transfer' : method) // Нормализуем формат
      .filter(method => method !== 'cash') // Исключаем наличные
      .filter((value, index, self) => self.indexOf(value) === index) // Убираем дубликаты
    const availableEchoMethods = normalizedEchoMethods.length > 0 ? normalizedEchoMethods : ['bank-transfer']

    const step4Data = {
      ...echoData.payment_method,
      type: 'multiple',
      methods: availableEchoMethods,
      user_choice: true,
      source: 'echoData',
      supplier_name: echoData.supplier_name,
      project_info: echoData.project_info
    }
    
    const step5Data = {
      ...echoData.requisites,
      user_choice: true,
      source: 'echoData',
      supplier_name: echoData.supplier_name,
      project_info: echoData.project_info,
      // Явно сохраняем тип реквизитов
      type: echoData.requisites?.type || 
            (echoData.payment_method?.method === 'crypto' ? 'crypto' : 
             echoData.payment_method?.method === 'p2p' ? 'p2p' : 'bank')
    }
    
    console.log('🔍 Тип реквизитов в step5Data:', step5Data.type)
    console.log('🔍 Способ оплаты:', echoData.payment_method?.method)
    
    console.log('📋 Step 4 Data:', step4Data)
    console.log('📋 Step 5 Data:', step5Data)
    
    setManualData(prev => {
      const newData = {
      ...prev,
      4: step4Data,
      5: step5Data
      }
      console.log('🔄 Новые manualData:', newData)
      return newData
    })
    
    // Устанавливаем источник данных
    setStepConfigs(prev => ({
      ...prev,
      4: 'echoData',
      5: 'echoData'
    }))
    
    // Очищаем доступность эхо данных (звездочки исчезнут)
    setEchoDataAvailable(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    // Скрываем всплывающие подсказки
    setEchoDataTooltips(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    // Закрываем модальное окно
    setEchoDataModal(null)
    
    // Показываем уведомление
    alert('Эхо данные успешно применены!')
  }

  // Функция для отклонения эхо данных
  const rejectEchoData = () => {
    console.log('❌ Пользователь отклонил эхо данные')
    
    // Очищаем доступность эхо данных (звездочки исчезнут)
    setEchoDataAvailable(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    // Скрываем всплывающие подсказки
    setEchoDataTooltips(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    setEchoDataModal(null)
  }

  // Автоматически проверяем доступность эхо данных при изменении данных любого шага
  useEffect(() => {
    // Проверяем, есть ли данные в любом из шагов 2, 4, 5
    const hasAnyStepData = manualData[2] || manualData[4] || manualData[5] || selectedSupplierData
    
    if (hasAnyStepData) {
      checkEchoDataAvailability()
    } else {
      setEchoDataAvailable({})
    }
  }, [manualData[2], manualData[4], manualData[5], selectedSupplierData])
  
  // Автоматически ищем эхо данные для шагов 1 и 2 при изменении данных любого шага
  useEffect(() => {
    // Проверяем, есть ли данные в любом из шагов 2, 4, 5
    const hasAnyStepData = manualData[2] || manualData[4] || manualData[5] || selectedSupplierData
    
    if (hasAnyStepData && !(manualData as any).echoSuggestions?.step1) {
      // Ищем эхо данные для шагов 1 и 2
      suggestEchoDataForSteps()
    }
  }, [manualData[2], manualData[4], manualData[5], selectedSupplierData])

  // Обработчик клика по карточке шага в блоке 2
  const handleStepCardClick = (item: any) => {
    // Открываем модальное окно для всех карточек в блоке 2
    handlePreviewData(getPreviewType(item.stepId), item.data)
  }

  // Функция для определения типа предварительного просмотра
  const getPreviewType = (stepId: number) => {
    switch (stepId) {
      case 1: return 'company'
      case 2: return 'product'
      case 4: return 'payment'
      case 5: return 'requisites'
      default: return 'company'
    }
  }

  // Функция для закрытия всплывающей подсказки эхо данных
  const closeEchoDataTooltip = (stepId: number) => {
    setEchoDataTooltips(prev => ({
      ...prev,
      [stepId]: false
    }))
  }

  // Функции для обработки источников каталога
  const handleBlueRoomSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🔵 Загружаем данные из синей комнаты для шага:', catalogSourceStep)
    
    setBlueRoomLoading(true)
    setShowCatalogSourceModal(false)
    
    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 [DEBUG] Сессия:', session ? 'Есть' : 'Нет');
      
      if (!session) {
        console.error('❌ Нет активной сессии для загрузки синей комнаты');
        alert('Ошибка авторизации. Войдите в систему.');
        return;
      }

      console.log('🔍 [DEBUG] Токен доступа:', session.access_token ? 'Есть' : 'Нет');
      console.log('🔍 [DEBUG] User ID:', session.user?.id);

      const response = await fetch('/api/catalog/user-suppliers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      console.log('🔍 [DEBUG] Статус ответа:', response.status);
      console.log('🔍 [DEBUG] Заголовки ответа:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('🔍 [DEBUG] Данные ответа:', data);
      
      if (data.suppliers && data.suppliers.length > 0) {
        console.log('✅ Найдены поставщики в синей комнате:', data.suppliers.length)
        setBlueRoomSuppliers(data.suppliers)
        setShowBlueRoomSupplierModal(true)
      } else {
        console.log('❌ Нет поставщиков в синей комнате')
        console.log('🔍 [DEBUG] Полный ответ API:', data);
        alert('В синей комнате нет поставщиков. Добавьте поставщиков в каталог.')
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки синей комнаты:', error)
      alert('Ошибка загрузки поставщиков из синей комнаты')
    } finally {
      setBlueRoomLoading(false)
    }
  }

  const handleOrangeRoomSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🟠 Загружаем данные из оранжевой комнаты для шага:', catalogSourceStep)
    
    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Нет активной сессии для загрузки оранжевой комнаты');
        alert('Ошибка авторизации. Войдите в систему.');
        return;
      }

      const response = await fetch('/api/catalog/verified-suppliers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      
      if (data.suppliers && data.suppliers.length > 0) {
        console.log('✅ Найдены поставщики в оранжевой комнате:', data.suppliers.length)
        setOrangeRoomSuppliers(data.suppliers)
        setShowOrangeRoomSupplierModal(true)
      } else {
        console.log('❌ Нет поставщиков в оранжевой комнате')
        alert('В оранжевой комнате нет поставщиков.')
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки оранжевой комнаты:', error)
      alert('Ошибка загрузки поставщиков из оранжевой комнаты')
    }
    
    setShowCatalogSourceModal(false)
  }

  const handleEchoCardsSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🔄 Загружаем данные из эхо карточек для шага:', catalogSourceStep)
    
    try {
      const response = await fetch('/api/catalog/echo-cards')
      const data = await response.json()
      
      if (data.echoCards && data.echoCards.length > 0) {
        // Показываем выбор эхо карточки
        console.log('✅ Найдены эхо карточки:', data.echoCards.length)
        // TODO: Показать модальное окно выбора эхо карточки
      } else {
        console.log('❌ Нет эхо карточек')
        // TODO: Показать сообщение об отсутствии эхо карточек
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки эхо карточек:', error)
    }
    
    setShowCatalogSourceModal(false)
  }

  // Функция выбора поставщика из синей комнаты
  // Функция выбора метода оплаты и автоматического заполнения реквизитов
  const handlePaymentMethodSelect = (method: string, supplier: any) => {
    console.log('🎯 Выбран метод оплаты:', method)
    
    // Обновляем шаг 4 - устанавливаем выбранный метод как единственный
    setManualData(prev => ({
      ...prev,
      4: {
        type: 'single',
        method: method,
        selectedMethod: method,
        defaultMethod: method
      }
    }))
    
    // Автоматически заполняем шаг 5 соответствующими реквизитами
    let requisitesData = {}
    
    if (method === 'crypto' && supplier.payment_methods?.crypto) {
      requisitesData = {
        type: 'crypto',
        crypto_name: supplier.payment_methods.crypto.network || 'ETH',
        crypto_address: supplier.payment_methods.crypto.address,
        crypto_network: supplier.payment_methods.crypto.network || 'ETH'
      }
    } else if (method === 'p2p' && supplier.payment_methods?.card) {
      requisitesData = {
        type: 'p2p',
        card_bank: supplier.payment_methods.card.bank,
        card_number: supplier.payment_methods.card.number,
        card_holder: supplier.payment_methods.card.holder,
        card_expiry: supplier.payment_methods.card.expiry || ''
      }
    } else if (method === 'bank' && supplier.payment_methods?.bank) {
      requisitesData = {
        type: 'bank',
        bankName: supplier.payment_methods.bank.bank_name,
        recipientName: supplier.name,
        accountNumber: supplier.payment_methods.bank.account_number,
        swift: supplier.payment_methods.bank.swift_code,
        iban: supplier.payment_methods.bank.iban || '',
        transferCurrency: supplier.currency || 'RUB'
      }
    }
    
    // Сохраняем реквизиты в шаге 5
    setManualData(prev => ({
      ...prev,
      5: requisitesData
    }))
    
    // Устанавливаем источник данных для шага 5
    setStepConfigs(prev => ({
      ...prev,
      5: 'catalog'
    }))
    
    console.log('✅ Автоматически заполнены реквизиты для метода:', method)
    
    // Показываем уведомление
    alert(`Выбран метод оплаты: ${method === 'crypto' ? 'Криптовалюта' : method === 'p2p' ? 'P2P перевод' : 'Банковский перевод'}. Реквизиты автоматически заполнены.`)
  }

  const handleSelectBlueRoomSupplier = async (supplier: any) => {
    console.log('🎯 === НАЧАЛО handleSelectBlueRoomSupplier ===')
    console.log('🎯 supplier:', supplier)
    console.log('🎯 catalogSourceStep:', catalogSourceStep)
    console.log('🎯 lastHoveredStep:', lastHoveredStep)
    
    if (!catalogSourceStep) {
      console.log('❌ catalogSourceStep не установлен, выходим')
      return
    }
    
    try {
      // Используем данные поставщика напрямую (они уже включают catalog_user_products)
      const fullSupplier = supplier
      
      // Сохраняем данные поставщика для использования в других шагах
      setSelectedSupplierData(fullSupplier)
      
      // АВТОМАТИЧЕСКИ заполняем связанные шаги при выборе поставщика!
      console.log('🎯 Автоматически заполняем связанные шаги для поставщика:', fullSupplier.name)
      
      // Шаг 2: Товары поставщика (ОБЯЗАТЕЛЬНО!)
      const specificationData = {
        supplier: fullSupplier.name,
        currency: fullSupplier.currency || 'USD',
        items: fullSupplier.catalog_user_products?.map((product: any) => ({
          name: product.name,
          description: product.description || '',
          quantity: 1,
          price: product.price || 0,
          unit: product.unit || 'шт'
        })) || [],
        user_choice: true
      }
      
      // Шаг 4: Методы оплаты поставщика
      const paymentMethods = []
      if (fullSupplier.payment_methods?.bank) {
        paymentMethods.push('bank')
      }
      if (fullSupplier.payment_methods?.card) {
        paymentMethods.push('p2p')
      }
      if (fullSupplier.payment_methods?.crypto) {
        paymentMethods.push('crypto')
      }
      
      const paymentData = {
        type: 'multiple',
        methods: paymentMethods,
        defaultMethod: paymentMethods[0] || 'bank',
        supplier: fullSupplier.name,
        user_choice: true
      }
      
      // Шаг 5: Реквизиты поставщика
      const allRequisites = []
      if (fullSupplier.payment_methods?.bank) {
        allRequisites.push({
          type: 'bank',
          bankName: fullSupplier.payment_methods.bank.bank_name,
          accountNumber: fullSupplier.payment_methods.bank.account_number,
          bik: fullSupplier.payment_methods.bank.bik,
          correspondentAccount: fullSupplier.payment_methods.bank.correspondent_account,
          supplier: fullSupplier.name
        })
      }
      if (fullSupplier.payment_methods?.card) {
        allRequisites.push({
          type: 'p2p',
          card_number: fullSupplier.payment_methods.card.number,
          card_bank: fullSupplier.payment_methods.card.bank,
          card_holder: fullSupplier.payment_methods.card.holder,
          supplier: fullSupplier.name
        })
      }
      if (fullSupplier.payment_methods?.crypto) {
        allRequisites.push({
          type: 'crypto',
          crypto_address: fullSupplier.payment_methods.crypto.address,
          crypto_network: fullSupplier.payment_methods.crypto.network,
          supplier: fullSupplier.name
        })
      }
      
      const requisitesData = {
        type: 'multiple',
        requisites: allRequisites,
        defaultRequisite: allRequisites[0] || null,
        supplier: fullSupplier.name,
        user_choice: true
      }
      
      // Сохраняем данные для шагов 2, 4, 5 (НЕ шаг 1!)
      setManualData(prev => ({
        ...prev,
        2: specificationData,
        4: paymentData,
        5: requisitesData
      }))
      
      // Устанавливаем источники для шагов 2, 4, 5
      setStepConfigs(prev => ({
        ...prev,
        2: 'blue_room',
        4: 'blue_room',
        5: 'blue_room'
      }))
      
      console.log('✅ Автоматически заполнены связанные шаги для поставщика:')
      console.log('  - Шаг 2 (товары):', specificationData.items.length, 'товаров')
      console.log('  - Шаг 4 (оплата):', paymentMethods.length, 'методов')
      console.log('  - Шаг 5 (реквизиты):', allRequisites.length, 'реквизитов')
      console.log('  - Шаг 1 (клиент): НЕ заполняется (пользователь выберет сам)')
      
      // Закрываем модальное окно каталога
      setShowCatalogSourceModal(false)
      setCatalogSourceStep(null)
      
      // Показываем уведомление об успешном заполнении
      console.log(`✅ Данные поставщика "${fullSupplier.name}" успешно применены ко ВСЕМ шагам!`)
      
      console.log('🎯 Начинаем поиск эхо данных для поставщика:', fullSupplier.name)
      console.log('🎯 Вызываем suggestEchoDataForSteps с данными:', fullSupplier)
      
      // Предлагаем эхо данные для шагов 1 и 2
      try {
        await suggestEchoDataForSteps(fullSupplier)
        console.log('🎯 suggestEchoDataForSteps завершился успешно')
      } catch (error) {
        console.error('❌ Ошибка в suggestEchoDataForSteps:', error)
      }
      
      console.log('🎯 Поиск эхо данных завершен')
      
    } catch (error) {
      console.error('❌ Ошибка при выборе поставщика:', error)
      alert('Ошибка при выборе поставщика')
    }
    
    setShowBlueRoomSupplierModal(false)
  }

  // Функция поиска поставщика в каталоге по реквизитам
  const findSupplierByRequisites = async (requisites: any) => {
    try {
      console.log('🔍 Поиск поставщика по реквизитам:', requisites)
      
      // Получаем всех поставщиков из каталога
      const response = await fetch('/api/catalog/user-suppliers')
      const suppliers = await response.json()
      
      if (!suppliers || suppliers.length === 0) {
        console.log('❌ Нет поставщиков в каталоге')
        return null
      }
      
      // Ищем поставщика с совпадающими реквизитами
      for (const supplier of suppliers) {
        console.log('🔍 Проверяем поставщика:', supplier.name)
        
        // Проверяем банковские реквизиты
        if (requisites.type === 'bank' && supplier.payment_methods?.bank) {
          const bankMatch = 
            supplier.payment_methods.bank.account_number === requisites.accountNumber ||
            supplier.payment_methods.bank.bank_name === requisites.bankName
          
          if (bankMatch) {
            console.log('✅ Найден поставщик по банковским реквизитам:', supplier.name)
            return supplier
          }
        }
        
        // Проверяем P2P реквизиты
        if (requisites.type === 'p2p' && supplier.payment_methods?.card) {
          const p2pMatch = 
            supplier.payment_methods.card.number === requisites.card_number ||
            supplier.payment_methods.card.bank === requisites.card_bank
          
          if (p2pMatch) {
            console.log('✅ Найден поставщик по P2P реквизитам:', supplier.name)
            return supplier
          }
        }
        
        // Проверяем крипто реквизиты
        if (requisites.type === 'crypto' && supplier.payment_methods?.crypto) {
          const cryptoMatch = 
            supplier.payment_methods.crypto.address === requisites.crypto_address ||
            supplier.payment_methods.crypto.network === requisites.crypto_network
          
          if (cryptoMatch) {
            console.log('✅ Найден поставщик по крипто реквизитам:', supplier.name)
            return supplier
          }
        }
      }
      
      console.log('❌ Поставщик с такими реквизитами не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска поставщика по реквизитам:', error)
      return null
    }
  }

  // Функция поиска исторических проектов по реквизитам поставщика
  const findHistoricalProjectsByRequisites = async (supplierRequisites: any) => {
    try {
      console.log('🔍 Поиск исторических проектов по реквизитам:', supplierRequisites)
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          project_name,
          created_at,
          status,
          client_profiles!inner(
            id,
            name,
            company_name,
            inn,
            address,
            email,
            phone
          ),
          project_specifications!inner(
            id,
            items
          ),
          project_requisites!inner(
            id,
            type,
            crypto_address,
            crypto_network,
            card_number,
            card_bank,
            account_number,
            bank_name
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('❌ Ошибка поиска проектов:', error)
        return []
      }
      
      // Фильтруем проекты по совпадению реквизитов
      const matchingProjects = projects?.filter(project => {
        const projectRequisites = project.project_requisites
        
        // Проверяем совпадение по типу реквизитов
        return projectRequisites.some((req: any) => {
          if (supplierRequisites.type === 'crypto' && req.type === 'crypto') {
            return req.crypto_network === supplierRequisites.crypto_network
          }
          if (supplierRequisites.type === 'p2p' && req.type === 'p2p') {
            return req.card_bank === supplierRequisites.card_bank
          }
          if (supplierRequisites.type === 'bank' && req.type === 'bank') {
            return req.bank_name === supplierRequisites.bankName
          }
          return false
        })
      }) || []
      
      console.log('✅ Найдено проектов с совпадающими реквизитами:', matchingProjects.length)
      return matchingProjects
      
    } catch (error) {
      console.error('❌ Ошибка при поиске исторических проектов:', error)
      return []
    }
  }

  // СИСТЕМА 1: Поиск эхо данных по имени поставщика (текущая)
  const suggestEchoDataByName = async (supplierName: string) => {
    try {
      console.log('🔍 === СИСТЕМА 1: Поиск по имени ===')
      console.log('🔍 Ищем поставщика по имени:', supplierName)
      
      const response = await fetch(`/api/catalog/user-suppliers?search=${encodeURIComponent(supplierName)}`)
      const suppliers = await response.json()
      
      if (suppliers.length > 0) {
        const supplier = suppliers[0]
        console.log('✅ Найден поставщик по имени:', supplier.name)
        
        return {
          step1: {
            clients: [{
              name: supplier.contact_person || supplier.name,
              company_name: supplier.company_name,
              inn: supplier.inn,
              address: supplier.address,
              email: supplier.contact_email,
              phone: supplier.contact_phone
            }],
            source: 'nameSearch',
            description: `Данные поставщика по имени: ${supplier.name}`
          }
        }
      }
      
      console.log('❌ Поставщик по имени не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по имени:', error)
      return null
    }
  }

  // СИСТЕМА 2: Поиск эхо данных по реквизитам
  const suggestEchoDataByRequisites = async () => {
    try {
      console.log('🔍 === СИСТЕМА 2: Поиск по реквизитам ===')
      
      // Получаем реквизиты из шага 5
      const step5Data = manualData[5]
      if (!step5Data || !step5Data.requisites) {
        console.log('❌ Нет реквизитов в шаге 5')
        return null
      }
      
      console.log('🔍 Реквизиты из шага 5:', step5Data.requisites)
      
      // Ищем поставщика по реквизитам
      const supplier = await findSupplierByRequisites(step5Data.requisites[0]) // Берем первый выбранный
      
      if (supplier) {
        console.log('✅ Найден поставщик по реквизитам:', supplier.name)
        
        // Получаем товары поставщика
        const productsResponse = await fetch(`/api/catalog/user-suppliers/${supplier.id}/products`)
        const productsData = await productsResponse.json()
        const products = productsData.products || []
        
        return {
          step2: {
            products: products,
            source: 'requisitesSearch',
            description: `Товары поставщика по реквизитам: ${supplier.name}`
          }
        }
      }
      
      console.log('❌ Поставщик по реквизитам не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по реквизитам:', error)
      return null
    }
  }

  // СИСТЕМА 3: Поиск эхо данных по историческим проектам
  const suggestEchoDataByHistory = async () => {
    try {
      console.log('🔍 === СИСТЕМА 3: Поиск по истории ===')
      
      // Получаем реквизиты из шага 5
      const step5Data = manualData[5]
      if (!step5Data || !step5Data.requisites) {
        console.log('❌ Нет реквизитов в шаге 5')
        return null
      }
      
      // Ищем исторические проекты с такими реквизитами
      const historicalProjects = await findHistoricalProjectsByRequisites(step5Data.requisites[0])
      
      if (historicalProjects.length > 0) {
        const bestProject = historicalProjects[0] // Берем самый релевантный
        console.log('✅ Найден исторический проект:', bestProject.project_name)
        
        return {
          step1: {
            clients: bestProject.client_profiles ? [bestProject.client_profiles] : [],
            source: 'historySearch',
            description: `Данные клиента из истории: ${bestProject.project_name}`
          },
          step2: {
            products: bestProject.project_specifications?.[0]?.items || [],
            source: 'historySearch',
            description: `Товары из истории: ${bestProject.project_name}`
          }
        }
      }
      
      console.log('❌ Исторические проекты не найдены')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по истории:', error)
      return null
    }
  }

  // ГЛАВНАЯ ФУНКЦИЯ: Объединяет все системы поиска
  const suggestEchoDataForSteps = async (supplierData?: any) => {
    try {
      console.log('🎯 === НАЧАЛО suggestEchoDataForSteps ===')
      console.log('🎯 supplierData:', supplierData)
      console.log('🎯 Текущий manualData:', manualData)
      console.log('🎯 Текущий stepConfigs:', stepConfigs)
      
      // Показываем лоадер
      setEchoDataLoadingSteps1_2(true)
      
      // Собираем результаты от всех систем
      const allResults = {}
      
      // СИСТЕМА 1: Поиск по имени (если есть supplierData)
      if (supplierData) {
        const supplierName = supplierData.name || supplierData.company_name
        console.log('🎯 Запускаем СИСТЕМУ 1 (по имени):', supplierName)
        
        const result1 = await suggestEchoDataByName(supplierName)
        if (result1) {
          Object.assign(allResults, result1)
          console.log('✅ СИСТЕМА 1 дала результат:', result1)
        }
      }
      
      // СИСТЕМА 2: Поиск по реквизитам (если заполнен шаг 5)
      if (manualData[5] && manualData[5].requisites) {
        console.log('🎯 Запускаем СИСТЕМУ 2 (по реквизитам)')
        
        const result2 = await suggestEchoDataByRequisites()
        if (result2) {
          Object.assign(allResults, result2)
          console.log('✅ СИСТЕМА 2 дала результат:', result2)
        }
      }
      
      // СИСТЕМА 3: Поиск по истории (если заполнен шаг 5)
      if (manualData[5] && manualData[5].requisites) {
        console.log('🎯 Запускаем СИСТЕМУ 3 (по истории)')
        
        const result3 = await suggestEchoDataByHistory()
        if (result3) {
          Object.assign(allResults, result3)
          console.log('✅ СИСТЕМА 3 дала результат:', result3)
        }
      }
      
      // Сохраняем все найденные эхо данные
      if (Object.keys(allResults).length > 0) {
        setManualData(prev => ({
          ...prev,
          echoSuggestions: allResults
        }))
        
        console.log('✅ Все эхо данные сохранены:', allResults)
      } else {
        console.log('❌ Ни одна система не нашла эхо данных')
      }
      
      // Скрываем лоадер
      setEchoDataLoadingSteps1_2(false)
      
    } catch (error) {
      console.error('❌ Ошибка в suggestEchoDataForSteps:', error)
      setEchoDataLoadingSteps1_2(false)
    }
  }

  // Функция отправки данных менеджеру
  // Компонент лоадера ожидания апрува менеджера
  const WaitingApprovalLoader = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-orange-100 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Ожидание подтверждения менеджера
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Ваши данные отправлены на проверку менеджеру. 
            Мы уведомим вас, как только получим подтверждение.
          </p>
          
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-700 font-medium">На рассмотрении</span>
              </div>
              <div className="text-orange-600 font-mono text-xs">
                ID: {projectRequestId?.slice(-8)}
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600">
              Статус: <span className="font-medium">waiting_approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* Информационная панель */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Ожидание ответа</p>
              <p className="text-xs text-gray-500">Менеджер проверяет данные</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Обновление каждые 4 секунды...
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент лоадера ожидания чека от менеджера
  const WaitingManagerReceiptLoader = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-green-100 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Ожидание чека от менеджера
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Агент выполняет перевод поставщику и отправит чек. 
            Мы уведомим вас, как только получим подтверждение.
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">В процессе</span>
              </div>
              <div className="text-green-600 font-mono text-xs">
                ID: {projectRequestId?.slice(-8)}
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              Статус: <span className="font-medium">waiting_manager_receipt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Информационная панель */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Выполняется перевод</p>
              <p className="text-xs text-gray-500">Агент переводит средства поставщику</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Обновление каждые 5 секунд...
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент сообщения об отклонении
  const RejectionMessage = () => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-lg">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <X className="h-8 w-8 text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-red-700 mb-2">
          Запрос отклонен
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {managerApprovalMessage || 'Менеджер отклонил ваш запрос. Проверьте данные и попробуйте снова.'}
        </p>
        <Button 
          onClick={() => {
            setManagerApprovalStatus(null)
            setCurrentStage(1)
          }}
          className="bg-red-500 hover:bg-red-600"
        >
          Вернуться к редактированию
        </Button>
      </div>
    </div>
  );

  // Компонент для шага 3 - Платёжка (использует ту же логику, что и обычный стартап проектов)
  const PaymentForm = () => {
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [projectStatus, setProjectStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)
    
    // Используем глобальное состояние вместо локального
    const isWaitingApproval = receiptApprovalStatus === 'waiting'

    // Получаем данные для платёжки из атомарного конструктора
    const companyData = manualData[1] || {}
    const specificationData = manualData[2] || {}
    const items = specificationData.items || []
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

    // Polling статуса проекта (используем обычную логику проектов)
    useEffect(() => {
      if (receiptApprovalStatus !== 'waiting' || !projectRequestId) return
      
      const checkStatus = async () => {
        try {
          // Ищем проект по atomic_request_id
          const { data, error } = await supabase
            .from('projects')
            .select('status, atomic_moderation_status')
            .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
            .single()

          if (error) {
            console.error('❌ Ошибка проверки статуса:', error)
            return
          }

          if (data) {
            // Используем обычный статус проекта для логики чеков
            if (data.status === 'receipt_approved') {
              setReceiptApprovalStatus('approved')
              if (pollingRef.current) clearInterval(pollingRef.current)
              
              // Переходим к следующему этапу (анимация сделки)
              setCurrentStage(3)
              console.log('✅ Чек одобрен - переходим к этапу 3')
            }
            
            if (data.status === 'receipt_rejected') {
              setReceiptApprovalStatus('rejected')
              if (pollingRef.current) clearInterval(pollingRef.current)
              setError('Чек отклонён менеджером. Пожалуйста, загрузите новый чек.')
            }
          }
        } catch (error) {
          console.error('❌ Ошибка polling статуса:', error)
        }
      }

      pollingRef.current = setInterval(checkStatus, 4000)
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }, [receiptApprovalStatus, projectRequestId, setCurrentStage])

    // Загрузка чека (использует ту же логику, что и обычный стартап проектов)
    const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      setIsUploading(true)
      setError(null)
      setReceiptFile(file)
      
      try {
        // Используем тот же bucket, что и в обычном стартапе проектов
        const date = new Date().toISOString().slice(0,10).replace(/-/g, '')
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filePath = `step3-supplier-receipts/${projectRequestId}/${date}_${cleanName}`
        
        const { data, error } = await supabase.storage
          .from("step3-supplier-receipts")
          .upload(filePath, file)
        
        if (error) {
          throw new Error(error.message)
        }
        
        const { data: urlData } = supabase.storage
          .from("step3-supplier-receipts")
          .getPublicUrl(filePath)
        
        setReceiptUrl(urlData?.publicUrl || "")
        setReceiptApprovalStatus('waiting')
        
        // Обновляем статус проекта на waiting_receipt (как в обычном стартапе)
        if (projectRequestId) {
          try {
            const { error: updateError } = await supabase
              .from('projects')
              .update({ 
                status: 'waiting_receipt',
                updated_at: new Date().toISOString()
              })
              .ilike('atomic_request_id', `%${projectRequestId.replace(/[^a-zA-Z0-9]/g, '')}%`)
            
            if (updateError) {
              console.warn('⚠️ Не удалось обновить статус проекта:', updateError)
            }
            
            // Отправляем чек менеджеру через Telegram
            const response = await fetch('/api/telegram/send-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectRequestId,
                receiptUrl: urlData?.publicUrl,
                fileName: file.name
              })
            })
            
            if (!response.ok) {
              console.warn('⚠️ Не удалось отправить чек в Telegram')
            }
          } catch (error) {
            console.warn('⚠️ Ошибка обработки чека:', error)
          }
        }
        
      } catch (error: any) {
        console.error('❌ Ошибка загрузки чека:', error)
        setError("Ошибка загрузки чека: " + error.message)
      } finally {
        console.log('🔍 Завершение загрузки, isUploading = false')
        setIsUploading(false)
      }
    }

    const handleRemoveReceiptFile = async () => {
      setReceiptFile(null)
      setReceiptUrl(null)
      setReceiptApprovalStatus(null)
      setProjectStatus(null)
      setError(null)
    }

    // Рендер платёжных реквизитов
    const renderPaymentDetails = () => (
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-md">
        <h3 className="text-xl font-bold mb-6 text-center">Платёжные реквизиты</h3>
        <div className="flex flex-col md:flex-row gap-8 mb-6">
          {/* Плательщик */}
          <div className="flex-1 min-w-[220px]">
            <div className="text-lg font-semibold mb-2 text-gray-700">Плательщик</div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div><span className="text-gray-500">Компания:</span> <span className="font-medium">{companyData.name || 'Не указано'}</span></div>
              <div><span className="text-gray-500">ИНН:</span> {companyData.inn || 'Не указано'}</div>
              <div><span className="text-gray-500">Банк:</span> {companyData.bankName || 'Не указано'}</div>
              <div><span className="text-gray-500">Счёт:</span> {companyData.bankAccount || 'Не указано'}</div>
              <div><span className="text-gray-500">БИК:</span> {companyData.bik || 'Не указано'}</div>
            </div>
          </div>
          {/* Получатель */}
          <div className="flex-1 min-w-[220px]">
            <div className="text-lg font-semibold mb-2 text-gray-700">Получатель</div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div><span className="text-gray-500">Компания:</span> <span className="font-medium">ООО "СтройМаркет-Москва"</span></div>
              <div><span className="text-gray-500">Банк:</span> АО "Альфа-Банк"</div>
              <div><span className="text-gray-500">Счёт:</span> 40702810400000012345</div>
              <div><span className="text-gray-500">БИК:</span> 044525593</div>
            </div>
          </div>
        </div>
        {/* Информация о платеже */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-2">
            <div className="flex-1">
              <div className="text-gray-500 text-sm">Назначение платежа</div>
              <div className="font-semibold text-blue-700">Оплата по атомарной сделке</div>
              <div className="text-gray-500 text-xs mt-1">ID запроса: {projectRequestId}</div>
            </div>
            <div className="flex-1 flex md:justify-end mt-4 md:mt-0">
              <div>
                <div className="text-gray-500 text-sm">Сумма к оплате</div>
                <div className="text-2xl font-bold text-green-700">{totalAmount > 0 ? `${totalAmount} USD` : '—'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Спецификация */}
        {items.length > 0 && (
          <>
            <h4 className="font-semibold mt-6 mb-2 text-gray-800">Спецификация</h4>
            <table className="min-w-full text-sm border rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-3 py-2 text-left font-medium">Наименование</th>
                  <th className="px-3 py-2 text-left font-medium">Код</th>
                  <th className="px-3 py-2 text-left font-medium">Кол-во</th>
                  <th className="px-3 py-2 text-left font-medium">Ед. изм.</th>
                  <th className="px-3 py-2 text-left font-medium">Цена</th>
                  <th className="px-3 py-2 text-left font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.code || '—'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.unit || 'шт'}</td>
                    <td className="px-3 py-2">{item.price}</td>
                    <td className="px-3 py-2">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    )

    return (
      <div className="max-w-2xl mx-auto mt-8 text-gray-900">
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <span className="text-blue-800">
              {isWaitingApproval
                ? "Чек загружен, ожидаем подтверждения менеджера"
                : "Ожидаем загрузки чека об оплате"}
            </span>
          </div>
          
          {/* Платёжка */}
          <div id="payment-details-html">{renderPaymentDetails()}</div>
          
          {/* Форма загрузки чека или лоудер */}
          {!isWaitingApproval ? (
            <div className="bg-white rounded-lg p-6 mb-6 flex flex-col items-center border border-gray-200">
              <Label className="mb-2 text-lg font-semibold">Загрузите чек</Label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleReceiptFileChange}
              />
              {!receiptUrl ? (
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading} 
                  className="mb-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Upload className="w-5 h-5 mr-2"/> Загрузить чек
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Посмотреть чек
                  </a>
                  <Button variant="destructive" onClick={handleRemoveReceiptFile}>
                    Удалить чек
                  </Button>
                </div>
              )}
              {isUploading && <div className="text-blue-500 mt-2">Загрузка...</div>}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Ожидание подтверждения оплаты
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Ваш чек успешно загружен и отправлен менеджеру на проверку. 
                    Мы уведомим вас, как только получим подтверждение.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-blue-700 font-medium">На проверке</span>
                      </div>
                      <div className="text-blue-600 font-mono text-xs">
                        ID: {projectRequestId?.slice(-8)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      Статус: <span className="font-medium">waiting_receipt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Информационная панель */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Ожидание ответа</p>
                      <p className="text-xs text-gray-500">Менеджер проверяет чек</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Обновление каждые 4 секунды...
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              {projectStatus === 'approved' && (
                <div className="mt-6 text-center">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => setCurrentStage(3)}
                  >
                    Перейти к анимации сделки
                  </Button>
                </div>
              )}
              {projectStatus === 'rejected' && (
                <div className="mt-6 text-center">
                  <div className="text-red-600 font-semibold mb-2">Атомарный конструктор отклонён менеджером</div>
                  <div className="text-gray-700 text-sm mb-4">
                    Пожалуйста, внесите изменения и отправьте повторно.
                  </div>
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white" 
                    onClick={handleRemoveReceiptFile}
                  >
                    Загрузить новый чек
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Дебаг-поле для вывода ошибок */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm whitespace-pre-wrap">
              <b>Ошибка:</b> {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleSendToManager = async () => {
    try {
      setSendingToManager(true)
      
      console.log('🚀 Отправка данных менеджеру:', {
        stepConfigs,
        manualData,
        uploadedFiles,
        currentStage: getCurrentStage(),
        activeScenario: getActiveScenario()
      })

      const response = await fetch('/api/atomic-constructor/send-to-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          stepConfigs,
          manualData,
          uploadedFiles,
          user,
          currentStage: getCurrentStage(),
          activeScenario: getActiveScenario()
        })
      })

      const result = await response.json()

      if (result.success) {
        // Устанавливаем статус ожидания и ID запроса
        setManagerApprovalStatus('pending')
        setProjectRequestId(result.requestId || `atomic_${Date.now()}`)
        
        setManagerNotification({
          show: true,
          type: 'success',
          message: `Данные отправлены менеджеру! ID запроса: ${result.requestId}`
        })
      } else {
        throw new Error(result.error || 'Неизвестная ошибка')
      }

    } catch (error) {
      console.error('❌ Ошибка отправки менеджеру:', error)
      setManagerNotification({
        show: true,
        type: 'error',
        message: `Ошибка отправки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    } finally {
      setSendingToManager(false)
    }
  }

  return (
    <div className="container mx-auto py-8 pb-24">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Blocks className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Конструктор атомарных сделок</h1>
          <div className="text-sm text-gray-600 ml-4">
            Этап: {currentStage} | Статус менеджера: {managerApprovalStatus || 'null'} | Статус чека: {receiptApprovalStatus || 'null'}
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <Button 
            onClick={handleSendToManager}
            disabled={sendingToManager}
            className="gap-2"
            variant="outline"
          >
            {sendingToManager ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Отправка...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Отправить менеджеру
              </>
            )}
          </Button>
          <Button className="gap-2">
            Запустить проект
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>



      {/* Block 1: 7 кубиков-шагов */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Шаги конструктора</h2>
              <p className="text-gray-600">Выберите источники данных для каждого шага</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Этап {currentStage}: </span>
                <span className="text-gray-600">
                  {currentStage === 1 ? 'Подготовка данных' : 
                   currentStage === 2 ? 'Подготовка инфраструктуры' : 
                   'Анимация сделки'}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Сценарий: </span>
                <span className="text-gray-600">
                  {getActiveScenario() === 'A' ? 'А (Клиент-покупатель)' :
                   getActiveScenario() === 'B1' ? 'Б1 (Поставщик-товары)' :
                   getActiveScenario() === 'B2' ? 'Б2 (Поставщик-реквизиты)' : 'Не определен'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Все 7 кубиков в одной горизонтальной линии */}
          <div className="grid grid-cols-7 gap-4">
            {constructorSteps.map((step) => {
              const isEnabled = isStepEnabled(step.id)
              

              
              return (
              <div
                key={step.id}
                  className={`relative transition-all duration-300 ${
                    isEnabled ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'
                  }`}
                onMouseEnter={() => isEnabled ? handleStepHover(step.id) : null}
                  onClick={() => isEnabled ? handleStepClick(step.id) : null}
              >

                
                <div className={`
                    aspect-square rounded-lg border-2 p-4 flex flex-col items-center justify-center relative group
                  ${(stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                    (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                    (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                    (step.id === 3 && receiptApprovalStatus === 'approved') ||
                    (step.id === 6 && hasManagerReceipt) ||
                    (step.id === 7 && clientReceiptUrl)
                                          ? 'border-blue-500 border-dashed bg-blue-50'
                                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && isEnabled
                                            ? 'border-purple-400 bg-purple-50 hover:border-purple-500'
                                            : isEnabled
                                              ? 'border-gray-300 hover:border-blue-400'
                                              : 'border-gray-200 bg-gray-50'
                                        }
                  `}>
                               {/* Индикатор заблокированного шага с tooltip */}
             {!isEnabled && (
               <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex items-center justify-center group">
                 <div className="text-center">
                   <Lock className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                   <p className="text-xs text-gray-500">Этап {getCurrentStage() === 1 ? '2' : '1'}</p>
                 </div>
                 
                 {/* Tooltip при наведении */}
                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                   <div className="text-center">
                     <p className="font-medium">
                       {step.id === 3 ? 'Документы проекта' :
                        step.id === 6 ? 'Финансовые условия' :
                        step.id === 7 ? 'Запуск проекта' : 'Откроется в следующем этапе'}
                     </p>
                     <p className="text-gray-300">
                       {step.id === 3 ? 'Загрузка документов и спецификаций' :
                        step.id === 6 ? 'Настройка условий оплаты и доставки' :
                        step.id === 7 ? 'Финальная проверка и запуск сделки' : 'Заполните шаги 1, 2, 4, 5 для продолжения'}
                     </p>
                   </div>
                   {/* Стрелка вниз */}
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                 </div>
               </div>
             )}
                    {/* Иконка замка для заблокированных шагов */}
                    {!isEnabled && (
                      <div className="absolute top-2 left-2">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    
                                        
                                        {/* Индикатор эхо данных для шагов 1 и 2 */}
                                        {(step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && (
                      <div className="absolute top-2 left-2">
                                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">📊</span>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Лоадер эхо данных для шагов 1 и 2 */}
                                        {(step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && echoDataLoadingSteps1_2 && (
                      <div className="absolute top-2 left-2">
                                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                              <Loader className="w-3 h-3 text-white animate-spin" />
                                            </div>
                                          </div>
                                        )}
                    
                  {/* Римская цифра в правом верхнем углу */}
                  <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved') ||
                           (step.id === 6 && hasManagerReceipt) ||
                           (step.id === 7 && clientReceiptUrl)
                          ? 'bg-blue-500 text-white'
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-400 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                    {step.id === 1 ? 'I' : step.id === 2 ? 'II' : step.id === 3 ? 'III' : 
                     step.id === 4 ? 'IV' : step.id === 5 ? 'V' : step.id === 6 ? 'VI' : 'VII'}
                  </div>
                  
                  {/* Иконка шага в центре */}
                  <div className="mb-2">
                    {stepIcons[step.id] && React.createElement(stepIcons[step.id] as React.ComponentType<any>, { 
                        className: `h-6 w-6 ${
                          isEnabled 
                            ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                               (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                               (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                               (step.id === 3 && receiptApprovalStatus === 'approved')
                              ? 'text-blue-600'
                              : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                                ? 'text-purple-600'
                                : 'text-gray-600'
                            : 'text-gray-400'
                        }` 
                    })}
                  </div>
                  
                  {/* Название и описание */}
                    <div className={`text-sm font-medium text-center ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved')
                          ? 'text-gray-800' 
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'text-purple-800'
                            : 'text-gray-600'
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className={`text-xs text-center mt-1 ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved')
                          ? 'text-gray-500' 
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'text-purple-600'
                            : 'text-gray-400'
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                  
                  {/* Бейдж с источником данных */}
                  {stepConfigs[step.id] && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {dataSources[stepConfigs[step.id] as keyof typeof dataSources]?.name}
                      </Badge>
                    </div>
                  )}
                    

                </div>
              </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Интерактивная область с вариантами заполнения или анимация сделки */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {currentStage === 3 ? (
                            <h2 className="text-xl font-bold mb-6">📊 Монитор сделки</h2>
          ) : (
            <h2 className="text-xl font-bold mb-6">Область настройки</h2>
          )}
          
          {/* Уведомление об автоматическом заполнении */}
          {autoFillNotification && currentStage !== 3 && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-r-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-700 font-medium">{autoFillNotification.message}</p>
                  <p className="text-green-600 text-sm">
                    Поставщик: {autoFillNotification.supplierName} | 
                    Заполнены шаги: {autoFillNotification.filledSteps.map(step => 
                      step === 4 ? 'IV' : step === 5 ? 'V' : step
                    ).join(', ')}
                  </p>
                </div>
                <button 
                  onClick={() => setAutoFillNotification(null)}
                  className="ml-auto text-green-400 hover:text-green-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Этап 2: Ожидание апрува менеджера или платежка */}
          {currentStage === 2 ? (
            <div className="min-h-[400px] flex items-center justify-center">
                          <div className="text-center">
              <div className="text-lg font-semibold mb-4">Этап 2: Подготовка инфраструктуры</div>
              <div className="text-sm text-gray-600 mb-4">
                Статус менеджера: {managerApprovalStatus || 'null'}
              </div>
              {managerApprovalStatus === 'pending' && <WaitingApprovalLoader />}
              {managerApprovalStatus === 'approved' && <PaymentForm />}
              {managerApprovalStatus === 'rejected' && <RejectionMessage />}
              {!managerApprovalStatus && (
                <div className="text-red-500">
                  Ошибка: статус менеджера не установлен
                </div>
              )}
            </div>
            </div>
          ) : currentStage === 3 && receiptApprovalStatus !== 'approved' ? (
            <div className="min-h-[400px] bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 relative overflow-hidden">
              {/* Статус анимации */}
              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-gray-800 mb-2">
                  {dealAnimationStatus}
                </div>
                <div className="text-sm text-gray-600">
                  Шаг {dealAnimationStep + 1} из 4
                </div>
              </div>

              {/* Анимационная сцена */}
              <div className="relative h-64 bg-white rounded-lg shadow-lg border-2 border-gray-200">
                {/* Клиент (синий) - слева */}
                <div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-2000 ease-in-out"
                  style={{
                    transform: `translateY(-50%) translateX(${dealAnimationStep >= 1 ? 200 : 0}px) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    👤
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-blue-700">
                    Клиент
                  </div>
                </div>

                {/* Поставщик (зеленый) - справа */}
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-2000 ease-in-out"
                  style={{
                    transform: `translateY(-50%) translateX(${dealAnimationStep >= 1 ? -200 : 0}px) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    🏢
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-green-700">
                    Поставщик
                  </div>
                </div>

                {/* Менеджер (оранжевый) - в центре */}
                <div
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                  style={{
                    transform: `translateX(-50%) translateY(-50%) scale(${dealAnimationStep >= 2 ? 1.2 : 1}) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    👨‍💼
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-orange-700">
                    Менеджер
                  </div>
                </div>

                {/* Линии соединения */}
                {dealAnimationStep >= 3 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                    style={{ opacity: 1 }}
                  >
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 rounded-full"></div>
                  </div>
                )}

                {/* Успешное завершение */}
                {dealAnimationComplete && (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-500"
                    style={{ opacity: 1, transform: 'scale(1)' }}
                  >
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <div className="text-green-800 font-semibold">Сделка завершена!</div>
                      <div className="text-green-600 text-sm">Все участники встретились</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Прогресс анимации */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Начало</span>
                  <span>Движение</span>
                  <span>Проверка</span>
                  <span>Завершение</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((dealAnimationStep + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>


            </div>
          ) : currentStage === 3 && receiptApprovalStatus === 'approved' ? (
            <div className="min-h-[400px] bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 relative overflow-hidden">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Шаг 6: Получение средств
                </h3>
                
                {hasManagerReceipt ? (
                  <div className="space-y-4">
                    <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Чек от менеджера готов!</span>
                      </div>
                      <p className="text-green-700 text-sm mb-3">
                        Менеджер загрузил чек об оплате поставщику. Вы можете скачать его.
                      </p>
                      {managerReceiptUrl && (
                        <Button 
                          onClick={() => window.open(managerReceiptUrl, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Скачать чек
                        </Button>
                      )}
                      
                      {/* Кнопка перехода на 7-й шаг */}
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm text-orange-700 mb-3">
                            Теперь вы можете перейти к загрузке чека о получении средств от поставщика
                          </p>
                          <Button 
                            onClick={() => setCurrentStage(4)}
                            className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Перейти к Шагу 7: Загрузить чек о получении
                          </Button>
                        </div>
                      </div>
                    </div>


                  </div>
                ) : (
                  <div className="space-y-4">
                    {isRequestSent ? (
                      <div className="space-y-4">
                        {showFullLoader ? (
                          <WaitingManagerReceiptLoader />
                        ) : (
                          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="font-semibold text-blue-800">Ожидаем чек от менеджера</span>
                            </div>
                            <p className="text-blue-700 text-sm">
                              Агент выполняет перевод поставщику и отправит чек. Мы уведомим вас, когда чек будет готов.
                            </p>
                            <div className="mt-3 text-xs text-blue-600">
                              <strong>ID проекта:</strong> {projectRequestId}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowFullLoader(true)}
                              className="mt-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              Показать подробности
                            </Button>
                          </div>
                        )}
                        {showFullLoader && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowFullLoader(false)}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            Скрыть подробности
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                          <span className="font-semibold text-yellow-800">Готово к отправке запроса</span>
                        </div>
                        <p className="text-yellow-700 text-sm mb-3">
                          Нажмите кнопку ниже, чтобы отправить запрос менеджеру на загрузку чека.
                        </p>
                        <Button 
                          onClick={sendManagerReceiptRequest}
                          disabled={isRequestSent}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          📤 Отправить запрос менеджеру
                        </Button>
                      </div>
                    )}
                    

                  </div>
                )}
              </div>
            </div>



          ) : currentStage === 4 ? (
            <div className="min-h-[400px] bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 relative overflow-hidden">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  Шаг 7: Подтверждение получения средств
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                      <Upload className="h-4 w-4" />
                      Загрузите чек о получении средств
                    </h4>
                    
                    {!clientReceiptUrl ? (
                      <div className="space-y-3">
                        <p className="text-sm text-orange-700">
                          Пожалуйста, загрузите чек или скриншот, подтверждающий что вы получили средства от поставщика.
                        </p>
                        
                        {clientReceiptUploadError && (
                          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            {clientReceiptUploadError}
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleClientReceiptUpload}
                            className="hidden"
                            id="client-receipt-upload-stage4"
                          />
                          
                          <Button
                            onClick={() => document.getElementById('client-receipt-upload-stage4')?.click()}
                            disabled={isUploadingClientReceipt}
                            variant="outline"
                            className="w-full border-orange-300 hover:border-orange-400 text-orange-800"
                          >
                            {isUploadingClientReceipt ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Загружаю чек...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Выбрать файл чека
                              </>
                            )}
                          </Button>
                          
                          <p className="text-xs text-gray-500 text-center">
                            Поддерживаются: JPG, PNG, PDF (макс. 50 МБ)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800">Чек загружен и отправлен менеджеру</p>
                            <a 
                              href={clientReceiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline text-sm"
                            >
                              Просмотреть загруженный чек →
                            </a>
                          </div>
                          <Button
                            onClick={handleRemoveClientReceipt}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:border-red-400"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Удалить
                          </Button>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-sm text-green-700">
                            ✅ Ваш чек отправлен менеджеру. Теперь вы можете завершить проект.
                          </p>
                        </div>
                        
                        {/* Кнопка "Подробнее" */}
                        <div className="flex justify-center mt-4">
                          <Button
                            onClick={handleShowProjectDetails}
                            variant="outline"
                            className="text-blue-600 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Подробнее о проекте
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопка возврата к 6-му шагу */}
                  <div className="mt-4">
                    <Button 
                      onClick={() => setCurrentStage(3)}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Вернуться к Шагу 6
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
            {/* Кнопки действий в правом верхнем углу внутри контейнера */}
            {lastHoveredStep && stepConfigs[lastHoveredStep] && (
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Кнопка удаления */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveSource(lastHoveredStep)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="font-medium">Удалить данные</span>
                  </div>
                </Button>
                

                
                {/* Кнопка добавления товаров из каталога (только для шага 2) */}
                {lastHoveredStep === 2 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddProductsFromCatalog()}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="font-medium">Добавить товары</span>
                    </div>
                  </Button>
                )}
              </div>
            )}
            

            <AnimatePresence>
              {lastHoveredStep && isStepEnabled(lastHoveredStep) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ height: '100%' }}
                >
                  {/* Заголовок выбранного шага */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {lastHoveredStep === 1 ? 'I' : lastHoveredStep === 2 ? 'II' : lastHoveredStep === 3 ? 'III' : 
                         lastHoveredStep === 4 ? 'IV' : lastHoveredStep === 5 ? 'V' : lastHoveredStep === 6 ? 'VI' : 'VII'}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {constructorSteps.find(s => s.id === lastHoveredStep)?.name}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {constructorSteps.find(s => s.id === lastHoveredStep)?.description}
                    </p>
                  </div>

                  {/* Показываем выбор шаблонов пользователя */}
                  {templateSelection ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-800">Выберите шаблон</h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchTemplates()}
                            disabled={templatesLoading}
                          >
                            {templatesLoading ? 'Загрузка...' : 'Обновить'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setTemplateSelection(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {templatesLoading ? (
                          <div className="flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-gray-600">Загрузка шаблонов...</span>
                          </div>
                        ) : templatesError ? (
                          <div className="text-center py-8 text-red-500">
                            <p>Ошибка загрузки шаблонов: {templatesError}</p>
                            <div className="flex gap-2 mt-4 justify-center">
                              <Button 
                                onClick={() => fetchTemplates()}
                                variant="outline" 
                              >
                                Попробовать снова
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/check-project-templates')
                                    const data = await response.json()
                                    console.log('🔍 Результат проверки таблицы:', data)
                                    alert(`Проверка таблицы: ${JSON.stringify(data, null, 2)}`)
                                  } catch (error) {
                                    console.error('Ошибка проверки:', error)
                                    alert('Ошибка проверки таблицы')
                                  }
                                }}
                                variant="outline" 
                              >
                                Проверить таблицу
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/create-project-templates-table', {
                                      method: 'POST'
                                    })
                                    const data = await response.json()
                                    console.log('🔧 Результат создания таблицы:', data)
                                    if (data.success) {
                                      alert('Таблица создана успешно! Обновите страницу.')
                                      window.location.reload()
                                    } else {
                                      alert(`Ошибка создания таблицы: ${data.error}`)
                                    }
                                  } catch (error) {
                                    console.error('Ошибка создания:', error)
                                    alert('Ошибка создания таблицы')
                                  }
                                }}
                                variant="outline" 
                                className="bg-green-50 hover:bg-green-100"
                              >
                                Создать таблицу
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/analyze-database-structure')
                                    const data = await response.json()
                                    console.log('🔍 Результат анализа БД:', data)
                                    alert(`Анализ БД: ${JSON.stringify(data.summary, null, 2)}`)
                                  } catch (error) {
                                    console.error('Ошибка анализа:', error)
                                    alert('Ошибка анализа БД')
                                  }
                                }}
                                variant="outline" 
                                className="bg-blue-50 hover:bg-blue-100"
                              >
                                Анализ БД
                              </Button>
                            </div>
                          </div>
                        ) : getUserTemplates().length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>У вас пока нет сохраненных шаблонов</p>
                            <p className="text-sm mt-2">Создайте шаблон в разделе "Создать проект"</p>
                          </div>
                        ) : (
                          getUserTemplates().map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleTemplateSelect(template.id)}
                            >
                              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{template.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{template.description}</div>
                                <div className="text-xs text-gray-500 mt-1">Использован: {template.lastUsed}</div>
                              </div>
                              <div className="text-blue-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : templateStepSelection ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-800">Выберите шаг для заполнения из шаблона</h4>
                        <Button variant="outline" size="sm" onClick={() => setTemplateStepSelection(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Кнопка "Заполнить все шаги" */}
                      {templateStepSelection.availableSteps.length > 1 && (
                        <div className="mb-4">
                          <Button 
                            onClick={handleFillAllTemplateSteps}
                            variant="outline"
                            className="w-full h-10 text-sm font-medium border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Заполнить все шаги из шаблона
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid gap-4">
                        {templateStepSelection.availableSteps.map((stepId) => {
                          const step = constructorSteps.find(s => s.id === stepId)
                          return (
                            <div
                              key={stepId}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleTemplateStepSelect(stepId)}
                            >
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-lg">
                                  {stepId === 1 ? 'I' : stepId === 2 ? 'II' : stepId === 3 ? 'III' : 
                                   stepId === 4 ? 'IV' : stepId === 5 ? 'V' : stepId === 6 ? 'VI' : 'VII'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{step?.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{step?.description}</div>
                              </div>
                              <div className="text-blue-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  ) : selectedSource === "manual" ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">Заполнение вручную</h4>
                        <Button variant="outline" size="sm" onClick={handleCancelSource}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Формы для разных шагов */}
                      {lastHoveredStep === 1 && editingType === 'company' && (
                        <CompanyForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && editingType === 'contacts' && (
                        <ContactsForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && editingType === 'bank' && (
                        <BankForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && !editingType && (
                        <CompanyForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                      
                      {lastHoveredStep === 2 && (
                        <SpecificationForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                      
                      {lastHoveredStep === 3 && (
                        <FileUploadForm 
                          onSave={(data) => {
                            if (data.file) {
                              handleFileUpload(lastHoveredStep, data.file)
                            }
                            handleManualDataSave(lastHoveredStep, data)
                          }}
                          onCancel={handleCancelSource}
                        />
                      )}
                      
                      {lastHoveredStep === 4 && (
                        <PaymentMethodForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                          getStepData={(stepId) => manualData[stepId]}
                        />
                      )}
                      
                      {lastHoveredStep === 5 && (
                        <RequisitesForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep]}
                        />
                      )}
                    </div>
                  ) : selectedSource === "upload" ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">Загрузка документа</h4>
                        <Button variant="outline" size="sm" onClick={handleCancelSource}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              {lastHoveredStep === 1 ? "Анализ карточки компании" : "Анализ спецификации"}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {lastHoveredStep === 1 
                                ? "Загрузите документ компании для автоматического извлечения данных" 
                                : "Загрузите инвойс или спецификацию для автоматического заполнения"
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Drag & Drop зона */}
                          <div 
                            className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const files = e.dataTransfer.files;
                              if (files.length > 0) {
                                handleFileUpload(lastHoveredStep, files[0]);
                              }
                            }}
                            onClick={() => document.getElementById(`ocr-file-input-${lastHoveredStep}`)?.click()}
                          >
                            <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                            <p className="text-lg font-medium text-slate-700 mb-2">
                              Перетащите файл сюда или нажмите для выбора
                            </p>
                            <p className="text-sm text-slate-500">
                              Поддерживаемые форматы: PDF, JPG, PNG, XLSX, DOCX
                            </p>
                            <input 
                              id={`ocr-file-input-${lastHoveredStep}`}
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(lastHoveredStep, file);
                                }
                              }}
                            />
                          </div>
                          
                          {/* Информация о поддерживаемых документах */}
                          <div className="bg-orange-50 rounded-lg p-4">
                            <h4 className="font-medium text-orange-800 mb-2">
                              {lastHoveredStep === 1 ? "Поддерживаемые документы:" : "Поддерживаемые документы:"}
                            </h4>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {lastHoveredStep === 1 ? (
                                <>
                                  <li>• Карточки компаний</li>
                                  <li>• Свидетельства о регистрации</li>
                                  <li>• Договоры с реквизитами</li>
                                  <li>• Банковские документы</li>
                                </>
                              ) : (
                                <>
                                  <li>• Инвойсы (счета-фактуры)</li>
                                  <li>• Спецификации товаров</li>
                                  <li>• Коммерческие предложения</li>
                                  <li>• Прайс-листы</li>
                                </>
                              )}
                            </ul>
                          </div>
                          
                          {/* Статус загрузки и анализа */}
                          {ocrAnalyzing[lastHoveredStep] && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                                <span className="text-blue-800 font-medium">Анализируем документ...</span>
                              </div>
                              <p className="text-sm text-blue-600 mt-1">
                                Пожалуйста, подождите, извлекаем данные
                              </p>
                            </div>
                          )}
                          
                          {/* Статус успешной загрузки */}
                          {uploadedFiles[lastHoveredStep] && !ocrAnalyzing[lastHoveredStep] && !ocrError[lastHoveredStep] && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-800 font-medium">Файл загружен и проанализирован</span>
                              </div>
                              <p className="text-sm text-green-600 mt-1">
                                Данные автоматически заполнены в форму
                              </p>
                            </div>
                          )}
                          
                          {/* Статус ошибки */}
                          {ocrError[lastHoveredStep] && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <X className="w-5 h-5 text-red-600" />
                                <span className="text-red-800 font-medium">Ошибка анализа</span>
                              </div>
                              <p className="text-sm text-red-600 mt-1">
                                {ocrError[lastHoveredStep]}
                              </p>
                              
                              {/* Отладочная информация */}
                              {ocrDebugData[lastHoveredStep] && (
                                <details className="mt-3">
                                  <summary className="text-sm text-red-700 cursor-pointer">
                                    Показать отладочную информацию
                                  </summary>
                                  <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(ocrDebugData[lastHoveredStep], null, 2)}
                                  </pre>
                                </details>
                                                  )}
                  </div>
                )}

                {/* Блок для 7-го шага - Подтверждение получения */}
                {hasManagerReceipt && (
                  <div className="mt-6">
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                        <Upload className="h-4 w-4" />
                        Шаг 7: Загрузите чек о получении средств
                      </h4>
                      
                      {!clientReceiptUrl ? (
                        <div className="space-y-3">
                          <p className="text-sm text-orange-700">
                            Пожалуйста, загрузите чек или скриншот, подтверждающий что вы получили средства от поставщика.
                          </p>
                          
                          {clientReceiptUploadError && (
                            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                              {clientReceiptUploadError}
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleClientReceiptUpload}
                              className="hidden"
                              id="client-receipt-upload"
                            />
                            
                            <Button
                              onClick={() => document.getElementById('client-receipt-upload')?.click()}
                              disabled={isUploadingClientReceipt}
                              variant="outline"
                              className="w-full border-orange-300 hover:border-orange-400 text-orange-800"
                            >
                              {isUploadingClientReceipt ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Загружаю чек...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Выбрать файл чека
                                </>
                              )}
                            </Button>
                            
                            <p className="text-xs text-gray-500 text-center">
                              Поддерживаются: JPG, PNG, PDF (макс. 50 МБ)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div className="flex-1">
                              <p className="font-medium text-green-800">Чек загружен и отправлен менеджеру</p>
                              <a 
                                href={clientReceiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-orange-600 hover:underline text-sm"
                              >
                                Просмотреть загруженный чек →
                              </a>
                            </div>
                            <Button
                              onClick={handleRemoveClientReceipt}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:border-red-400"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Удалить
                            </Button>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-700">
                              ✅ Ваш чек отправлен менеджеру. Теперь вы можете завершить проект.
                            </p>
                          </div>
                          
                          {/* Кнопка "Подробнее" */}
                          <div className="flex justify-center mt-4">
                            <Button
                              onClick={handleShowProjectDetails}
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Подробнее о проекте
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
                    </div>
                  ) : stepConfigs[lastHoveredStep] ? (
                    // Только 3 кубика с данными для первого шага
                    <div className="flex justify-center">
                      {lastHoveredStep === 1 && manualData[lastHoveredStep] && (
                        <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
                          {/* Кубик 1: Данные компании - кликабельный */}
                          <div 
                            className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:scale-105"
                            onClick={() => handlePreviewData('company', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <Building className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Данные компании</div>
                                <div className="text-xs text-gray-500">Основная информация</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800 font-medium">{manualData[lastHoveredStep].name}</div>
                            <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                          
                          {/* Кубик 2: Данные расчетного счета - кликабельный */}
                          <div 
                            className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 hover:scale-105"
                            onClick={() => handlePreviewData('bank', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <Banknote className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Расчетный счет</div>
                                <div className="text-xs text-gray-500">Банковские реквизиты</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800">{manualData[lastHoveredStep].bankName}</div>
                            {manualData[lastHoveredStep].bankAccount && (
                              <div className="text-xs text-gray-500">{manualData[lastHoveredStep].bankAccount}</div>
                            )}
                            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                          
                          {/* Кубик 3: Дополнительные данные - кликабельный */}
                          <div 
                            className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-300 hover:scale-105"
                            onClick={() => handlePreviewData('contacts', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Дополнительно</div>
                                <div className="text-xs text-gray-500">Контакты и детали</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800">{manualData[lastHoveredStep].email}</div>
                            {manualData[lastHoveredStep].phone && (
                              <div className="text-sm text-gray-800 mt-1">{manualData[lastHoveredStep].phone}</div>
                            )}
                            <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Кнопка просмотра всех данных шага */}
                      {lastHoveredStep === 1 && manualData[lastHoveredStep] && (
                        <div className="mt-6 flex justify-center">
                          <Button
                            onClick={() => handleViewStepData(lastHoveredStep)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Просмотреть все данные шага
                          </Button>
                        </div>
                      )}
                      

                      
                      {/* Эхо предложения для шага 2 */}
                      {lastHoveredStep === 2 && (manualData as any).echoSuggestions?.step2 && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                              <span className="text-white text-xs">📊</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">Эхо данные найдены!</div>
                              <div className="text-xs text-gray-600">{(manualData as any).echoSuggestions.step2.description}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mb-3">
                            Найдено {(manualData as any).echoSuggestions.step2.products.length} товаров поставщика
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                // Применяем товары из эхо данных
                                const products = (manualData as any).echoSuggestions.step2.products
                                if (products && products.length > 0) {
                                  setManualData(prev => ({
                                    ...prev,
                                    2: {
                                      supplier: products[0].supplier || products[0].supplier_name,
                                      currency: products[0].currency || 'USD',
                                      items: products.map((product: any) => ({
                                        item_name: product.name,
                                        item_code: product.name,
                                        quantity: 1,
                                        price: product.price || 0,
                                        unit: 'шт'
                                      }))
                                    }
                                  }))
                                  setStepConfigs(prev => ({ ...prev, 2: 'echo' }))
                                  alert('Товары поставщика из эхо данных применены!')
                                  
                                  // 🔄 Автозаполнение шагов 4-5 после применения товаров из эха
                                  const supplierName = products[0].supplier || products[0].supplier_name
                                  if (supplierName) {
                                    console.log('🔍 [ECHO AUTO-FILL] Загружаем данные поставщика:', supplierName)
                                    getEchoSupplierData(supplierName).then(echoData => {
                                      if (echoData) {
                                        console.log('✅ [ECHO AUTO-FILL] Найдены данные поставщика для автозаполнения:', echoData)
                                        
                                        // Заполняем Step IV (Способ оплаты)
                                        setManualData(prev => ({
                                          ...prev,
                                          4: {
                                            payment_method: echoData.payment_method?.method || 'bank_transfer',
                                            auto_filled: true,
                                            supplier_name: supplierName,
                                            echo_source: echoData.project_info?.project_name,
                                            user_choice: true
                                          }
                                        }))
                                        
                                        // Заполняем Step V (Реквизиты поставщика)  
                                        setManualData(prev => ({
                                          ...prev,
                                          5: {
                                            supplier_name: supplierName,
                                            requisites: echoData.requisites || {},
                                            auto_filled: true,
                                            echo_source: echoData.project_info?.project_name,
                                            user_choice: true
                                          }
                                        }))
                                        
                                        // Обновляем конфигурацию шагов как завершенные
                                        setStepConfigs(prev => ({
                                          ...prev,
                                          4: 'echoData',
                                          5: 'echoData'
                                        }))
                                        
                                        console.log('✅ [ECHO AUTO-FILL] Шаги 4-5 автоматически заполнены')
                                      } else {
                                        console.log('❌ [ECHO AUTO-FILL] Данные поставщика не найдены:', supplierName)
                                      }
                                    }).catch(error => {
                                      console.error('❌ [ECHO AUTO-FILL] Ошибка при загрузке данных поставщика:', error)
                                    })
                                  }
                                }
                              }}
                            >
                              Применить товары поставщика
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setManualData(prev => {
                                  const { echoSuggestions, ...rest } = prev as any
                                  return rest
                                })
                              }}
                            >
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Глобальные эхо предложения - показываются независимо от lastHoveredStep */}
                      {((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && (
                        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs">📊</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">Найдены эхо данные!</div>
                              <div className="text-xs text-gray-600">
                                {(manualData as any).echoSuggestions?.step1 && 'Данные клиента • '}
                                {(manualData as any).echoSuggestions?.step2 && 'Товары поставщика'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Эхо данные для шага 1 */}
                            {(manualData as any).echoSuggestions?.step1 && (
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-medium text-gray-800 mb-2">
                                  👤 Данные клиента: {(manualData as any).echoSuggestions.step1.description}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Найдено {(manualData as any).echoSuggestions.step1.clients.length} клиентов
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    const firstClient = (manualData as any).echoSuggestions.step1.clients[0]
                                    if (firstClient) {
                                      setManualData(prev => ({
                                        ...prev,
                                        1: {
                                          name: firstClient.name || firstClient.company_name,
                                          legalName: firstClient.company_name || '',
                                          inn: firstClient.inn || '',
                                          address: firstClient.address || '',
                                          email: firstClient.email || '',
                                          phone: firstClient.phone || ''
                                        }
                                      }))
                                      setStepConfigs(prev => ({ ...prev, 1: 'echo' }))
                                      alert('Данные клиента из эхо истории применены!')
                                    }
                                  }}
                                >
                                  Применить данные клиента
                                </Button>
                              </div>
                            )}
                            
                            {/* Эхо данные для шага 2 */}
                            {(manualData as any).echoSuggestions?.step2 && (
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-medium text-gray-800 mb-2">
                                  📦 Товары поставщика: {(manualData as any).echoSuggestions.step2.description}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Найдено {(manualData as any).echoSuggestions.step2.products.length} товаров
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    const products = (manualData as any).echoSuggestions.step2.products
                                    if (products && products.length > 0) {
                                      setManualData(prev => ({
                                        ...prev,
                                        2: {
                                          supplier: products[0].supplier || products[0].supplier_name,
                                          currency: products[0].currency || 'USD',
                                          items: products.map((product: any) => ({
                                            item_name: product.name,
                                            item_code: product.name,
                                            quantity: 1,
                                            price: product.price || 0,
                                            unit: 'шт'
                                          }))
                                        }
                                      }))
                                      setStepConfigs(prev => ({ ...prev, 2: 'echo' }))
                                      alert('Товары поставщика из эхо данных применены!')
                                      
                                      // 🔄 Автозаполнение шагов 4-5 после применения товаров из эха
                                      const supplierName = products[0].supplier || products[0].supplier_name
                                      if (supplierName) {
                                        console.log('🔍 [ECHO AUTO-FILL] Загружаем данные поставщика:', supplierName)
                                        getEchoSupplierData(supplierName).then(echoData => {
                                          if (echoData) {
                                            console.log('✅ [ECHO AUTO-FILL] Найдены данные поставщика для автозаполнения:', echoData)
                                            
                                            // Заполняем Step IV (Способ оплаты)
                                            setManualData(prev => ({
                                              ...prev,
                                              4: {
                                                payment_method: echoData.payment_method?.method || 'bank_transfer',
                                                auto_filled: true,
                                                supplier_name: supplierName,
                                                echo_source: echoData.project_info?.project_name,
                                                user_choice: true
                                              }
                                            }))
                                            
                                            // Заполняем Step V (Реквизиты поставщика)  
                                            setManualData(prev => ({
                                              ...prev,
                                              5: {
                                                supplier_name: supplierName,
                                                requisites: echoData.requisites || {},
                                                auto_filled: true,
                                                echo_source: echoData.project_info?.project_name,
                                                user_choice: true
                                              }
                                            }))
                                            
                                            // Обновляем конфигурацию шагов как завершенные
                                            setStepConfigs(prev => ({
                                              ...prev,
                                              4: 'echoData',
                                              5: 'echoData'
                                            }))
                                            
                                            console.log('✅ [ECHO AUTO-FILL] Шаги 4-5 автоматически заполнены')
                                          } else {
                                            console.log('❌ [ECHO AUTO-FILL] Данные поставщика не найдены:', supplierName)
                                          }
                                        }).catch(error => {
                                          console.error('❌ [ECHO AUTO-FILL] Ошибка при загрузке данных поставщика:', error)
                                        })
                                      }
                                    }
                                  }}
                                >
                                  Применить товары поставщика
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setManualData(prev => {
                                  const { echoSuggestions, ...rest } = prev as any
                                  return rest
                                })
                              }}
                            >
                              Отклонить все эхо данные
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Шаг 2: Горизонтальный слайдер товаров */}
                      {lastHoveredStep === 2 && manualData[lastHoveredStep] && (
                        <div className="flex justify-center">
                          <div className="w-full max-w-6xl">
                            {/* Слайдер товаров */}
                            {manualData[lastHoveredStep]?.items && manualData[lastHoveredStep].items.length > 0 && (
                              <div className="mb-6">
                                {/* Заголовок слайдера */}
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    Товары ({manualData[lastHoveredStep].items.length})
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                      {Math.floor(currentProductIndex / productsPerView) + 1} из {Math.ceil(manualData[lastHoveredStep].items.length / productsPerView)}
                                    </span>
                            </div>
                          </div>
                          
                                {/* Контейнер слайдера */}
                                <div className="relative">
                                  {/* Кнопка "Назад" */}
                                  {currentProductIndex > 0 && (
                                    <button
                                      onClick={() => setCurrentProductIndex(prev => Math.max(0, prev - productsPerView))}
                                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
                                    >
                                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </button>
                                  )}
                                  
                                  {/* Кнопка "Вперед" */}
                                  {currentProductIndex + productsPerView < manualData[lastHoveredStep].items.length && (
                                    <button
                                      onClick={() => setCurrentProductIndex(prev => Math.min(manualData[lastHoveredStep].items.length - productsPerView, prev + productsPerView))}
                                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
                                    >
                                      <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </button>
                                  )}
                                  
                                  {/* Текущие товары (по 3) */}
                                  <div className="grid grid-cols-3 gap-4 mx-12">
                                    {Array.from({ length: productsPerView }, (_, i) => {
                                      const itemIndex = currentProductIndex + i;
                                      const item = manualData[lastHoveredStep].items[itemIndex];
                                      
                                      if (!item) return null;
                                      
                                      return (
                                        <div 
                                          key={itemIndex}
                                className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-400 hover:scale-105"
                                          onClick={() => handlePreviewData('product', item)}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                              <div className="text-sm font-semibold text-gray-800">
                                                Товар {itemIndex + 1}
                                              </div>
                                    <div className="text-xs text-gray-500">Спецификация</div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">📦</span>
                                              <span className="text-gray-800 font-medium text-sm truncate">
                                                {item.item_name || item.name || 'Товар без названия'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">🏷️</span>
                                              <span className="text-gray-800 text-sm">
                                                {item.item_code || 'Без артикула'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">💰</span>
                                              <span className="text-gray-800 text-sm">
                                                {item.price} {manualData[lastHoveredStep]?.currency || 'RUB'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">📊</span>
                                              <span className="text-gray-800 text-sm">
                                                {item.quantity} шт
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">💳</span>
                                              <span className="text-gray-800 font-semibold text-sm">
                                                {item.total} {manualData[lastHoveredStep]?.currency || 'RUB'}
                                            </span>
                                          </div>
                                        </div>
                                
                                <div className="text-xs text-green-600 mt-3 flex items-center gap-1">
                                  <span>Нажмите для просмотра</span>
                                  <Eye className="h-3 w-3" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {/* Индикаторы слайдера */}
                                <div className="flex justify-center gap-2 mt-4">
                                  {Array.from({ length: Math.ceil(manualData[lastHoveredStep].items.length / productsPerView) }, (_, groupIndex) => (
                                    <button
                                      key={groupIndex}
                                      onClick={() => setCurrentProductIndex(groupIndex * productsPerView)}
                                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                        Math.floor(currentProductIndex / productsPerView) === groupIndex
                                          ? 'bg-blue-500' 
                                          : 'bg-gray-300 hover:bg-gray-400'
                                      }`}
                                    />
                                  ))}
                                      </div>
                                  </div>
                                )}
                                
                            {/* Сводная информация */}
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Сводка</div>
                                  <div className="text-xs text-gray-500">Общая информация</div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">🏪</span>
                                  <span className="text-gray-800 font-medium">
                                    {manualData[lastHoveredStep]?.supplier || 
                                     manualData[lastHoveredStep]?.items?.[0]?.item_name || 
                                     'Не указано'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">📦</span>
                                  <span className="text-gray-800">
                                    {manualData[lastHoveredStep]?.items?.length || 0} позиций
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">💰</span>
                                  <span className="text-gray-800">{manualData[lastHoveredStep]?.currency || 'Не указано'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                                            {/* Шаг 4: Методы оплаты - показываем кубики для каждого метода */}
                      {lastHoveredStep === 4 && manualData[lastHoveredStep] && (
                        <div className="flex justify-center">
                          <div className="grid grid-cols-3 gap-4 w-full">
                            {['bank-transfer', 'p2p', 'crypto'].map((method: string, index: number) => {
                                // Логируем данные для отладки
                                if (lastHoveredStep === 4) {
                                  console.log('🔍 [DEBUG] Step 4 Check:', {
                                    method,
                                    manualData4: manualData[4],
                                    methods: manualData[4]?.methods,
                                    includes: manualData[4]?.methods?.includes(method)
                                  })
                                }
                                const hasSupplierData = lastHoveredStep === 4 && manualData[4]?.methods?.includes(method) || false;
                                return <div 
                                  key={index}
                                  className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                    hasSupplierData
                                      ? (method === 'crypto' ? 'border-green-300 bg-green-50 hover:border-green-400' :
                                         method === 'p2p' ? 'border-blue-300 bg-blue-50 hover:border-blue-400' :
                                         'border-orange-300 bg-orange-50 hover:border-orange-400')
                                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                  }`}
                                  onClick={() => handlePaymentMethodSelect(method, selectedSupplierData)}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      hasSupplierData
                                        ? (method === 'crypto' ? 'bg-green-500' :
                                           method === 'p2p' ? 'bg-blue-500' :
                                           'bg-orange-500')
                                        : 'bg-gray-400'
                                    }`}>
                                      <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">
                                        {method === 'crypto' ? 'Криптовалюта' :
                                         method === 'p2p' ? 'P2P перевод' :
                                         'Банковский перевод'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {method === 'crypto' ? 'Крипто платеж' :
                                         method === 'p2p' ? 'P2P платеж' :
                                         'Банковский платеж'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    Статус
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {hasSupplierData ? 'Автозаполнение' : 'Ручное заполнение'}
                                  </div>
                                  <div className={`text-xs mt-2 flex items-center gap-1 ${
                                    method === 'crypto' ? 'text-green-600' :
                                    method === 'p2p' ? 'text-blue-600' :
                                    'text-gray-600'
                                  }`}>
                                    <span>Выбрать</span>
                                    <CheckCircle className="h-3 w-3" />
                                  </div>
                                </div>
                              })
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Шаг 5: Реквизиты - показываем все доступные типы */}
                      {lastHoveredStep === 5 && manualData[lastHoveredStep] && (
                        <div className="flex justify-center">
                          <div className="grid grid-cols-3 gap-4 w-full">
                            {manualData[lastHoveredStep].type === 'multiple' && manualData[lastHoveredStep].requisites ? (
                              // Показываем все кубики реквизитов
                              manualData[lastHoveredStep].requisites.map((requisite: any, index: number) => (
                                <div 
                                  key={index}
                                  className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                    requisite.type === 'crypto' ? 'border-green-200 hover:border-green-300' :
                                    requisite.type === 'p2p' ? 'border-blue-200 hover:border-blue-300' :
                                    'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handlePreviewData('requisites', requisite)}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      requisite.type === 'crypto' ? 'bg-green-500' :
                                      requisite.type === 'p2p' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    }`}>
                                      <Banknote className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">
                                        {requisite.type === 'crypto' ? 'Криптокошелек' :
                                         requisite.type === 'p2p' ? 'Карта поставщика' :
                                         'Расчетный счет'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {requisite.type === 'crypto' ? 'Криптореквизиты' :
                                         requisite.type === 'p2p' ? 'P2P реквизиты' :
                                         'Банковские реквизиты'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    {requisite.type === 'crypto' ? 'Сеть' :
                                     requisite.type === 'p2p' ? 'Банк карты' :
                                     'Банк поставщика'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {requisite.type === 'crypto' ? (requisite.crypto_network || 'Не указана') :
                                     requisite.type === 'p2p' ? (requisite.card_bank || 'Не указан') :
                                     `${requisite.accountNumber || 'Не указано'}`}
                                  </div>
                                  <div className={`text-xs mt-2 flex items-center gap-1 ${
                                    requisite.type === 'crypto' ? 'text-green-600' :
                                    requisite.type === 'p2p' ? 'text-blue-600' :
                                    'text-gray-600'
                                  }`}>
                                    <span>Нажмите для просмотра</span>
                                    <Eye className="h-3 w-3" />
                                  </div>
                                </div>
                              ))
                            ) : (
                              // Показываем один кубик для одиночного типа
                              <div 
                                className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 hover:scale-105 col-span-3"
                                onClick={() => handlePreviewData('requisites', manualData[lastHoveredStep])}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <Banknote className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {manualData[lastHoveredStep].type === 'crypto' ? 'Криптокошелек' :
                                       manualData[lastHoveredStep].type === 'p2p' ? 'Карта поставщика' :
                                       'Расчетный счет'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {manualData[lastHoveredStep].type === 'crypto' ? 'Криптореквизиты' :
                                       manualData[lastHoveredStep].type === 'p2p' ? 'P2P реквизиты' :
                                       'Банковские реквизиты'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-800">
                                  {manualData[lastHoveredStep].type === 'crypto' ? 'Сеть' :
                                   manualData[lastHoveredStep].type === 'p2p' ? 'Банк карты' :
                                   'Банк поставщика'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {manualData[lastHoveredStep].type === 'crypto' ? (manualData[lastHoveredStep].crypto_network || 'Не указана') :
                                   manualData[lastHoveredStep].type === 'p2p' ? (manualData[lastHoveredStep].card_bank || 'Не указан') :
                                   `${manualData[lastHoveredStep].accountNumber || 'Не указано'}`}
                                </div>
                                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                  <span>Нажмите для просмотра</span>
                                  <Eye className="h-3 w-3" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Для других шагов - обычная карточка */}
                      {lastHoveredStep !== 1 && lastHoveredStep !== 2 && lastHoveredStep !== 4 && lastHoveredStep !== 5 && manualData[lastHoveredStep] && (
                        <div 
                          className={`border-2 border-gray-200 rounded-xl p-6 shadow-lg max-w-md w-full transition-all duration-200
                            ${manualData[lastHoveredStep].echo_data 
                              ? 'bg-white/60 backdrop-blur-sm border-indigo-200' 
                              : 'bg-white'}
                          `}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              stepConfigs[lastHoveredStep] === "profile" ? "bg-blue-500" :
                              stepConfigs[lastHoveredStep] === "template" ? "bg-green-500" :
                              (stepConfigs[lastHoveredStep] === "blue_room" || stepConfigs[lastHoveredStep] === "orange_room" || stepConfigs[lastHoveredStep] === "echo_cards") ? "bg-purple-500" :
                              stepConfigs[lastHoveredStep] === "echo" ? "bg-orange-500" :
                              stepConfigs[lastHoveredStep] === "echoData" ? "bg-indigo-500" :
                              stepConfigs[lastHoveredStep] === "manual" ? "bg-gray-500" : "bg-emerald-500"
                            }`}>
                              {stepConfigs[lastHoveredStep] === "profile" ? <Users className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "template" ? <FileText className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "blue_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "orange_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echo_cards" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "catalog" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echo" ? <FileText className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echoData" ? <Clock className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "manual" ? <Plus className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {dataSources[stepConfigs[lastHoveredStep] as keyof typeof dataSources]?.name}
                              </div>
                              {stepConfigs[lastHoveredStep] === "template" && manualData[lastHoveredStep]?.templateName && (
                                <div className="text-xs text-gray-500">{manualData[lastHoveredStep].templateName}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            {lastHoveredStep === 3 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">📄</span>
                                <span className="text-gray-800">{uploadedFiles[lastHoveredStep]}</span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-auto">
                                  ✓ Загружен
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Для шага 5: показываем кубики выбора типа реквизитов */}
                      {lastHoveredStep === 5 && !manualData[5] && (
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-gray-800 mb-4">Выберите тип реквизитов:</h4>
                          <div className="grid grid-cols-3 gap-4 w-full">
                            {/* Банковский перевод */}
                            <div
                              className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-orange-300 hover:scale-105"
                              onClick={() => {
                                console.log('🏦 Выбран банковский перевод');
                                // Устанавливаем данные для банковского перевода
                                setManualData(prev => ({
                                  ...prev,
                                  5: {
                                    type: 'bank',
                                    bankName: '',
                                    accountNumber: '',
                                    swift: '',
                                    recipientName: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                  <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Банковский перевод</div>
                                  <div className="text-xs text-gray-500">Банковские реквизиты</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать банковские реквизиты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                SWIFT, IBAN, счета
                              </div>
                            </div>

                            {/* P2P переводы */}
                            <div
                              className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:scale-105"
                              onClick={() => {
                                console.log('💳 Выбраны P2P переводы');
                                // Устанавливаем данные для P2P
                                setManualData(prev => ({
                                  ...prev,
                                  5: {
                                    type: 'p2p',
                                    card_bank: '',
                                    card_number: '',
                                    card_holder: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">P2P переводы</div>
                                  <div className="text-xs text-gray-500">Карта поставщика</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать P2P карты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                Банковские карты
                              </div>
                            </div>

                            {/* Криптовалюта */}
                            <div
                              className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 hover:scale-105"
                              onClick={() => {
                                console.log('🪙 Выбрана криптовалюта');
                                // Устанавливаем данные для криптовалют
                                setManualData(prev => ({
                                  ...prev,
                                  5: {
                                    type: 'crypto',
                                    crypto_network: '',
                                    crypto_address: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Coins className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Криптовалюта</div>
                                  <div className="text-xs text-gray-500">Криптокошелек</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать криптовалюты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                BTC, ETH, USDT и др.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <h4 className="text-base font-semibold text-gray-800 mb-4">Доступные источники данных:</h4>
                      <div className="grid gap-4">
                        {constructorSteps.find(s => s.id === lastHoveredStep)?.sources.map((source) => {
                          const sourceInfo = dataSources[source as keyof typeof dataSources]
                          const SourceIcon = sourceInfo?.icon
                          return (
                            <div
                              key={source}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleSourceSelect(source)}
                            >
                              <div className={`w-12 h-12 rounded-full ${sourceInfo?.color} flex items-center justify-center shadow-sm`}>
                                <SourceIcon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{sourceInfo?.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                  {source === "profile" && (lastHoveredStep === 1 ? "Использовать данные из профиля клиента" : "Использовать данные из профиля поставщика")}
                                  {source === "template" && "Выбрать из сохраненных шаблонов"}
                                  {source === "catalog" && "Из синей и оранжевой комнат каталога (включая эхо карточки)"}
                                  {source === "manual" && "Заполнить самостоятельно"}
                                  {source === "automatic" && "Автоматическая обработка"}
                                        </div>
      </div>

      {/* Диалог деталей проекта */}
      {projectDetailsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Детали проекта</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectDetailsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {projectDetails && (
              <div className="space-y-6">
                {/* Основная информация */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Основная информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID проекта</p>
                      <p className="font-medium">{projectDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Статус</p>
                      <p className="font-medium">{projectDetails.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Текущий этап</p>
                      <p className="font-medium">{projectDetails.currentStage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Сценарий</p>
                      <p className="font-medium">{projectDetails.activeScenario}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Создан</p>
                      <p className="font-medium">
                        {new Date(projectDetails.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Обновлен</p>
                      <p className="font-medium">
                        {new Date(projectDetails.updated_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Данные шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Данные шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.manualData || {}).map(([stepId, data]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Конфигурации шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Конфигурации шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.stepConfigs || {}).map(([stepId, config]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(config, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Дополнительные данные проекта */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Дополнительные данные</h3>
                  <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(projectDetails, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : lastHoveredStep && !isStepEnabled(lastHoveredStep) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Blocks className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">Сначала настройте основные шаги (I и II)</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Blocks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Наведите на кубик для выбора источника данных</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3: Сводка и запуск проекта */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6">Сводка проекта</h2>
          
          {/* Прогресс бар с мини-кубиками */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс настройки</span>
              <span className="text-sm text-gray-500">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            
            {/* Мини-кубики прогресса */}
            <div className="flex gap-2 mt-4">
              {constructorSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                    stepConfigs[step.id]
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.id}
                </div>
              ))}
            </div>
          </div>

                    {/* Сводка настроенных шагов */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Настроенные шаги:</h3>
            {getConfiguredStepsSummary().length > 0 ? (
              <div className="space-y-2">
                {getConfiguredStepsSummary().map((item) => (
                  <div 
                    key={item.stepId} 
                    className={`flex items-center gap-3 p-3 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border-2 relative z-10 ${
                      item.source === 'echoData' 
                        ? 'bg-purple-50 hover:bg-purple-100 border-purple-400 hover:border-purple-500' 
                        : 'bg-gray-50 hover:bg-gray-100 border-blue-400 hover:border-blue-500'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                    onClick={() => handleStepCardClick(item)}
                  >
                    <div className={`w-8 h-8 rounded text-white flex items-center justify-center text-sm font-bold ${
                      item.source === 'echoData' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {item.stepId}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.stepName}</div>
                      <div className={`text-sm ${
                        item.source === 'echoData' ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        Источник: {item.sourceName}
                        {item.source === 'echoData' && ' ✨'}
                      </div>

                    </div>
                    <ChevronRight className={`h-4 w-4 ${
                      item.source === 'echoData' ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Blocks className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Настройте хотя бы один шаг для продолжения</p>
              </div>
            )}
          </div>

          {/* Кнопка запуска */}
          <div className="flex justify-end">
            <Button 
              className="gap-2"
              disabled={getConfiguredStepsSummary().length === 0}
            >
              Запустить атомарную сделку
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно для предварительного просмотра данных */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewType === 'company' && <Building className="h-5 w-5 text-blue-500" />}
              {previewType === 'bank' && <Banknote className="h-5 w-5 text-green-500" />}
              {previewType === 'contacts' && <Mail className="h-5 w-5 text-purple-500" />}
              {previewType === 'product' && <Package className="h-5 w-5 text-green-500" />}
              {previewType === 'payment' && <CreditCard className="h-5 w-5 text-indigo-500" />}
              {previewType === 'requisites' && <Banknote className="h-5 w-5 text-green-500" />}
              {previewType === 'company' && 'Данные компании'}
              {previewType === 'bank' && 'Банковские реквизиты'}
              {previewType === 'contacts' && 'Контактная информация'}
              {previewType === 'product' && 'Спецификация товаров'}
              {previewType === 'payment' && 'Способ оплаты'}
              {previewType === 'requisites' && (previewData?.type === 'crypto' ? 'Криптореквизиты' :
                                               previewData?.type === 'p2p' ? 'P2P реквизиты' :
                                               'Банковские реквизиты')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {previewType === 'company' && previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Название компании</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.name && previewData.name.trim() !== '' ? previewData.name : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Юридическое название</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.legalName && previewData.legalName.trim() !== '' ? previewData.legalName : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ИНН</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.inn && previewData.inn.trim() !== '' ? previewData.inn : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">КПП</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.kpp && previewData.kpp.trim() !== '' ? previewData.kpp : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ОГРН</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.ogrn && previewData.ogrn.trim() !== '' ? previewData.ogrn : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Юридический адрес</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.address && previewData.address.trim() !== '' ? previewData.address : 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewType === 'bank' && previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.bankName && previewData.bankName.trim() !== '' ? previewData.bankName : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Расчетный счет</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.bankAccount && previewData.bankAccount.trim() !== '' ? `${previewData.bankAccount}` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Корр. счет</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.bankCorrAccount && previewData.bankCorrAccount.trim() !== '' ? previewData.bankCorrAccount : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">БИК</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.bankBik && previewData.bankBik.trim() !== '' ? previewData.bankBik : 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewType === 'contacts' && previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.email && previewData.email.trim() !== '' ? previewData.email : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Телефон</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.phone && previewData.phone.trim() !== '' ? previewData.phone : 'Не указано'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Веб-сайт</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.website && previewData.website.trim() !== '' ? previewData.website : 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewType === 'product' && previewData && (
              <div className="space-y-4">
                {/* 🔥 НОВОЕ: Сводная информация по спецификации */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Сводная информация по спецификации</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                      <div className="mt-1 p-3 bg-white rounded-lg">
                        {(previewData.supplier && previewData.supplier.trim() !== '') || 
                         (previewData.supplier_name && previewData.supplier_name.trim() !== '') ? 
                          (previewData.supplier || previewData.supplier_name) : 'Не указано'}
                    </div>
                  </div>
                  <div>
                      <Label className="text-sm font-medium text-gray-600">Количество позиций</Label>
                      <div className="mt-1 p-3 bg-white rounded-lg">
                        {previewData.items && previewData.items.length > 0 ? 
                          `${previewData.items.length} позиций` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                      <Label className="text-sm font-medium text-gray-600">Общее количество товаров</Label>
                      <div className="mt-1 p-3 bg-white rounded-lg">
                        {previewData.items && previewData.items.length > 0 ? 
                          `${previewData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} шт` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                      <Label className="text-sm font-medium text-gray-600">Общая сумма</Label>
                      <div className="mt-1 p-3 bg-white rounded-lg font-semibold">
                        {previewData.totalAmount ? `${previewData.totalAmount} ${previewData.currency || 'RUB'}` : 
                         (previewData.items && previewData.items.length > 0 ? 
                          `${previewData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)} ${previewData.currency || 'RUB'}` : 'Не указано')}
                    </div>
                  </div>
                    </div>
                  </div>

                {/* 🔥 НОВОЕ: Список товаров (если есть) */}
                {previewData.items && previewData.items.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-800 mb-3">Список товаров ({previewData.items.length})</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {previewData.items.map((item: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 border text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.name || item.item_name || `Товар ${index + 1}`}</span>
                            <span className="text-gray-600">{item.quantity || 0} шт × {item.price || 0} = {item.total || 0}</span>
                          </div>
                        </div>
                      ))}
                </div>
                  </div>
                )}
              </div>
            )}

            {previewType === 'payment' && previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Способ оплаты</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.method && previewData.method.trim() !== '' ? 
                        (previewData.method === 'bank-transfer' ? 'Банковский перевод' :
                         previewData.method === 'p2p' ? 'P2P платеж' :
                         previewData.method === 'crypto' ? 'Криптовалюта' :
                         previewData.method) : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {(previewData.supplier && previewData.supplier.trim() !== '') || 
                       (previewData.supplier_name && previewData.supplier_name.trim() !== '') ||
                       (previewData.recipientName && previewData.recipientName.trim() !== '') ? 
                        (previewData.supplier || previewData.supplier_name || previewData.recipientName) : 'Не указано'}
                    </div>
                  </div>
                  {previewData.project_info && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Источник данных</Label>
                      <div className="mt-1 p-3 bg-indigo-50 rounded-lg">
                        <div className="text-indigo-700">
                          <strong>Проект:</strong> {previewData.project_info.project_name || 'Не указан'}
                        </div>
                        <div className="text-indigo-600 text-sm">
                          <strong>Дата:</strong> {previewData.project_info.project_date ? new Date(previewData.project_info.project_date).toLocaleDateString('ru-RU') : 'Не указана'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {previewType === 'requisites' && previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Крипто реквизиты */}
                  {previewData.type === 'crypto' ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Сеть</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {previewData.crypto_network && previewData.crypto_network.trim() !== '' ? previewData.crypto_network : 'Не указана'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Адрес кошелька</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {previewData.crypto_address && previewData.crypto_address.trim() !== '' ? previewData.crypto_address : 'Не указан'}
                        </div>
                      </div>
                    </>
                  ) : previewData.type === 'p2p' ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Банк карты</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {previewData.card_bank && previewData.card_bank.trim() !== '' ? previewData.card_bank : 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Номер карты</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {previewData.card_number && previewData.card_number.trim() !== '' ? `${previewData.card_number}` : 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Держатель карты</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {previewData.card_holder && previewData.card_holder.trim() !== '' ? previewData.card_holder : 'Не указан'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.bankName && previewData.bankName.trim() !== '' ? previewData.bankName : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.accountNumber && previewData.accountNumber.trim() !== '' ? `${previewData.accountNumber}` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SWIFT/BIC</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.swift && previewData.swift.trim() !== '' ? previewData.swift : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {previewData.recipientName && previewData.recipientName.trim() !== '' ? previewData.recipientName : 'Не указано'}
                    </div>
                  </div>
                    </>
                  )}
                  
                  {/* Общие поля для всех типов */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {(previewData.supplier && previewData.supplier.trim() !== '') || 
                       (previewData.supplier_name && previewData.supplier_name.trim() !== '') ||
                       (previewData.recipientName && previewData.recipientName.trim() !== '') ? 
                        (previewData.supplier || previewData.supplier_name || previewData.recipientName) : 'Не указано'}
                    </div>
                  </div>
                  {previewData.project_info && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Источник данных</Label>
                      <div className="mt-1 p-3 bg-indigo-50 rounded-lg">
                        <div className="text-indigo-700">
                          <strong>Проект:</strong> {previewData.project_info.project_name || 'Не указан'}
                        </div>
                        <div className="text-indigo-600 text-sm">
                          <strong>Дата:</strong> {previewData.project_info.project_date ? new Date(previewData.project_info.project_date).toLocaleDateString('ru-RU') : 'Не указана'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Закрыть
              </Button>
              <Button onClick={() => handleEditData(previewType)} className="gap-2">
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно эхо данных */}
      <Dialog open={echoDataModal?.show || false} onOpenChange={() => setEchoDataModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Найдены эхо данные
            </DialogTitle>
            <DialogDescription>
              Для поставщика <strong>{echoDataModal?.supplierName}</strong> найдены данные из предыдущего проекта
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Информация о проекте */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">Источник данных:</h4>
              <p className="text-indigo-700">
                Проект: <strong>{echoDataModal?.projectInfo?.project_name}</strong>
              </p>
              <p className="text-indigo-600 text-sm">
                Дата: {echoDataModal?.projectInfo?.project_date ? new Date(echoDataModal.projectInfo.project_date).toLocaleDateString('ru-RU') : 'Не указана'}
              </p>
            </div>

            {/* Данные для применения */}
            <div className="space-y-4">
              <h4 className="font-medium">Данные для применения:</h4>
              
              {/* Способ оплаты */}
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Способ оплаты (Шаг IV)</h5>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{echoDataModal?.echoData?.payment_method?.method || 'bank-transfer'}</span>
                </div>
              </div>

              {/* Реквизиты (в зависимости от типа) */}
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  {echoDataModal?.echoData?.payment_method?.method === 'crypto' ? 'Криптореквизиты' :
                   echoDataModal?.echoData?.payment_method?.method === 'p2p' ? 'P2P реквизиты' :
                   'Банковские реквизиты'} (Шаг V)
                </h5>
                <div className="space-y-2 text-sm">
                  {echoDataModal?.echoData?.payment_method?.method === 'crypto' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Сеть: {echoDataModal?.echoData?.requisites?.crypto_network || 'Не указана'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Адрес: {echoDataModal?.echoData?.requisites?.crypto_address || 'Не указан'}</span>
                      </div>
                    </>
                  ) : echoDataModal?.echoData?.payment_method?.method === 'p2p' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Банк: {echoDataModal?.echoData?.requisites?.card_bank || 'Не указан'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Карта: {echoDataModal?.echoData?.requisites?.card_number || 'Не указан'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">Держатель: {echoDataModal?.echoData?.requisites?.card_holder || 'Не указан'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{echoDataModal?.echoData?.requisites?.bankName || 'Банк не указан'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Счет: {echoDataModal?.echoData?.requisites?.accountNumber || 'Не указан'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{echoDataModal?.echoData?.requisites?.recipientName || 'Получатель не указан'}</span>
                  </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={rejectEchoData}>
                Отклонить
              </Button>
              <Button onClick={() => applyEchoData(echoDataModal?.echoData)} className="gap-2">
                <Check className="h-4 w-4" />
                Применить эхо данные
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно выбора профиля клиента */}
      <Dialog open={showProfileSelector} onOpenChange={setShowProfileSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Выберите профиль клиента
            </DialogTitle>
            <DialogDescription>
              У вас несколько профилей клиентов. Выберите один для заполнения данных компании.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {clientProfiles?.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedProfileId === profile.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedProfileId(profile.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-sm text-gray-500">
                      {profile.legal_name || 'Юридическое название не указано'}
                    </p>
                    {profile.is_default && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        По умолчанию
                      </span>
                    )}
                  </div>
                  {selectedProfileId === profile.id && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowProfileSelector(false)}>
              Отмена
            </Button>
            <Button 
              onClick={async () => {
                if (selectedProfileId) {
                  setShowProfileSelector(false)
                  // Применяем выбранный профиль
                  const profileData = await getProfileData(1)
                  if (profileData) {
                    setManualData(prev => ({
                      ...prev,
                      [1]: profileData
                    }))
                    setStepConfigs(prev => ({
                      ...prev,
                      [1]: 'profile'
                    }))
                    console.log('✅ Применен выбранный профиль клиента')
                  }
                }
              }}
              disabled={!selectedProfileId}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Применить профиль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно выбора профиля поставщика */}
      <Dialog open={showSupplierProfileSelector} onOpenChange={setShowSupplierProfileSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-500" />
              Выберите профиль поставщика
            </DialogTitle>
            <DialogDescription>
              У вас несколько профилей поставщиков. Выберите один для заполнения данных.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {supplierProfiles?.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedSupplierProfileId === profile.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSupplierProfileId(profile.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-sm text-gray-500">
                      {profile.category || 'Категория не указана'}
                    </p>
                    {profile.is_default && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                        По умолчанию
                      </span>
                    )}
                  </div>
                  {selectedSupplierProfileId === profile.id && (
                    <Check className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSupplierProfileSelector(false)}>
              Отмена
            </Button>
            <Button 
              onClick={async () => {
                if (selectedSupplierProfileId) {
                  setShowSupplierProfileSelector(false)
                  // Применяем выбранный профиль поставщика
                  // Здесь нужно будет определить для какого шага применять
                  console.log('✅ Выбран профиль поставщика:', selectedSupplierProfileId)
                  // TODO: Применить профиль для соответствующих шагов (2, 4, 5)
                }
              }}
              disabled={!selectedSupplierProfileId}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Применить профиль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно предварительной сводки */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Предварительная сводка атомарной сделки
            </DialogTitle>
            <DialogDescription>
              Все основные данные собраны! Проверьте информацию перед подготовкой инфраструктуры.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Шаг 1 - Данные компании */}
            {manualData[1] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-500" />
                    Шаг 1: Данные компании
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Источник: {getSourceDisplayName(stepConfigs[1])}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Название компании</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].name || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Юридическое название</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].legalName || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ИНН</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].inn || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].email || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Телефон</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].phone || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Адрес</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[1].address || 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 2 - Спецификация товаров */}
            {manualData[2] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Шаг 2: Спецификация товаров
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                      Источник: {getSourceDisplayName(stepConfigs[2])}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[2].supplier || 'Не указан'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Валюта</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[2].currency || 'Не указана'}
                    </div>
                  </div>
                </div>
                {manualData[2].items && manualData[2].items.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Товары</Label>
                    <div className="mt-2 space-y-2">
                      {manualData[2].items.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{item.name || item.item_name || 'Без названия'}</span>
                            <span className="text-sm text-gray-600">{item.quantity || 0} шт.</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Цена: {item.price || 0} {manualData[2].currency || 'RUB'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Шаг 4 - Способ оплаты */}
            {manualData[4] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    Шаг 4: Способ оплаты
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      Источник: {getSourceDisplayName(stepConfigs[4])}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Метод оплаты</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[4].payment_method || manualData[4].method || 'Не указан'}
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 5 - Реквизиты */}
            {manualData[5] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-orange-500" />
                    Шаг 5: {manualData[5].type === 'crypto' ? 'Криптореквизиты' :
                            manualData[5].type === 'p2p' ? 'P2P реквизиты' :
                            'Банковские реквизиты'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                      Источник: {getSourceDisplayName(stepConfigs[5])}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {manualData[5].type === 'crypto' ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Сеть</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].crypto_network || 'Не указана'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Адрес</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                          {manualData[5].crypto_address || 'Не указан'}
                        </div>
                      </div>
                    </>
                  ) : manualData[5].type === 'p2p' ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Банк</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].card_bank || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Номер карты</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                          {manualData[5].card_number || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Держатель</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].card_holder || 'Не указан'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Банк</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].bankName || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].recipientName || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                          {manualData[5].accountNumber || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">SWIFT</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                          {manualData[5].swift || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">IBAN</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                          {manualData[5].iban || 'Не указан'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Валюта перевода</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {manualData[5].transferCurrency || 'Не указана'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Статистика сделки */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Статистика сделки</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Заполнено шагов:</span>
                  <p className="text-blue-900">4 из 7</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Прогресс:</span>
                  <p className="text-blue-900">57%</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Статус:</span>
                  <p className="text-blue-900">Готово к подготовке инфраструктуры</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t relative z-50">
            <Button 
              variant="outline" 
              onMouseDown={(e) => {
                console.log('🔴 КНОПКА ОТМЕНА MOUSEDOWN!')
                console.log('🔴 MouseDown Event:', e)
              }}
              onClick={(e) => {
                console.log('🔴 КНОПКА ОТМЕНА НАЖАТА!')
                console.log('🔴 Event:', e)
                console.log('🔴 Target:', e.target)
                console.log('🔴 CurrentTarget:', e.currentTarget)
                returnToStage1Editing()
              }}
              className="relative z-50"
            >
              Отмена
            </Button>
            <Button 
              onMouseDown={(e) => {
                console.log('🔵 КНОПКА ПЕРЕХОД MOUSEDOWN!')
                console.log('🔵 MouseDown Event:', e)
              }}
              onClick={(e) => {
                console.log('🔵 КНОПКА ПЕРЕХОД НАЖАТА!')
                console.log('🔵 Event:', e)
                console.log('🔵 Target:', e.target)
                console.log('🔵 CurrentTarget:', e.currentTarget)
                goToNextStage()
              }}
              className="gap-2 relative z-50"
            >
              <ArrowRight className="h-4 w-4" />
              Перейти к подготовке инфраструктуры
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Модальное окно перехода на следующий этап */}
      <Dialog open={showStageTransitionModal} onOpenChange={setShowStageTransitionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-500" />
              Переход на следующий этап
            </DialogTitle>
            <DialogDescription>
              {currentStage === 1 
                ? "Вы готовы перейти к подготовке инфраструктуры. Все основные данные собраны!"
                : "Вы готовы перейти к анимации сделки. Инфраструктура настроена!"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Текущий этап */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-bold">
                  {currentStage}
                </div>
                Текущий этап: {currentStage === 1 ? 'Подготовка данных' : 'Подготовка инфраструктуры'}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {currentStage === 1 ? (
                  <>
                    <p>✅ Шаг 1: Данные компании - заполнен</p>
                    <p>✅ Шаг 2: Спецификация товаров - заполнен</p>
                    <p>✅ Шаг 4: Способ оплаты - заполнен</p>
                    <p>✅ Шаг 5: Реквизиты - заполнен</p>
                  </>
                ) : (
                  <>
                    <p>✅ Шаг 3: Документы - настроен</p>
                    <p>✅ Шаг 6: Получение средств - настроено</p>
                    <p>✅ Шаг 7: Подтверждение - настроено</p>
                  </>
                )}
              </div>
            </div>

            {/* Следующий этап */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  {currentStage + 1}
                </div>
                Следующий этап: {currentStage === 1 ? 'Подготовка инфраструктуры' : 'Анимация сделки'}
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                {currentStage === 1 ? (
                  <>
                    <p>🔧 Шаг 3: Загрузка документов</p>
                    <p>🔧 Шаг 6: Настройка получения средств</p>
                    <p>🔧 Шаг 7: Настройка подтверждения</p>
                    <p className="font-medium mt-2">Все шаги станут доступными для настройки</p>
                  </>
                ) : (
                  <>
                    <p>🎬 Блок 2 превратится в анимацию сделки</p>
                    <p>🎬 Реальное отслеживание статуса</p>
                    <p>🎬 Интерактивные уведомления</p>
                    <p className="font-medium mt-2">Сделка перейдет в активную фазу</p>
                  </>
                )}
              </div>
            </div>

            {/* Предупреждение */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  !
                </div>
                <div>
                  <h5 className="font-medium text-yellow-900 mb-1">Внимание</h5>
                  <p className="text-sm text-yellow-700">
                    {currentStage === 1 
                      ? "После перехода данные будут отправлены менеджеру на проверку. Ожидайте подтверждения."
                      : "После перехода сделка станет активной. Убедитесь, что все настройки корректны."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Галочка "Больше не показывать" */}
            {currentStage === 1 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowStageTransition}
                  onChange={(e) => setDontShowStageTransition(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
                  Больше не показывать это окно
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('🔴 КНОПКА ОТМЕНА В МОДАЛЬНОМ ОКНЕ ПЕРЕХОДА НАЖАТА!')
                returnToStage1Editing()
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={() => {
                console.log('🟢 КНОПКА ПРОДОЛЖИТЬ В МОДАЛЬНОМ ОКНЕ ПЕРЕХОДА НАЖАТА!')
                proceedToStage2()
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="h-4 w-4" />
              {currentStage === 1 ? 'Продолжить' : 'Перейти к анимации сделки'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно выбора поставщика из синей комнаты */}
      <Dialog open={showBlueRoomSupplierModal} onOpenChange={setShowBlueRoomSupplierModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Выберите поставщика из синей комнаты
            </DialogTitle>
            <DialogDescription>
              Выберите поставщика для заполнения шага {catalogSourceStep}
            </DialogDescription>
          </DialogHeader>

          {blueRoomLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Загрузка поставщиков...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {blueRoomSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => handleSelectBlueRoomSupplier(supplier)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {supplier.name}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {supplier.contact_email && (
                        <div>📧 {supplier.contact_email}</div>
                      )}
                      {supplier.contact_phone && (
                        <div>📞 {supplier.contact_phone}</div>
                      )}
                      {supplier.category && (
                        <div>🏷️ {supplier.category}</div>
                      )}
                      {supplier.city && (
                        <div>📍 {supplier.city}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      ID: {supplier.id}
                    </div>
                    <div className="text-xs text-gray-400">
                      {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowBlueRoomSupplierModal(false)}>
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно выбора поставщика из оранжевой комнаты */}
      <Dialog open={showOrangeRoomSupplierModal} onOpenChange={setShowOrangeRoomSupplierModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-500" />
              Выберите поставщика из оранжевой комнаты
            </DialogTitle>
            <DialogDescription>
              Выберите аккредитованного поставщика для заполнения шага {catalogSourceStep}
            </DialogDescription>
          </DialogHeader>

          {orangeRoomLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600">Загрузка поставщиков...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {orangeRoomSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => handleSelectBlueRoomSupplier(supplier)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {supplier.name}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {supplier.contact_email && (
                        <div>📧 {supplier.contact_email}</div>
                      )}
                      {supplier.contact_phone && (
                        <div>📞 {supplier.contact_phone}</div>
                      )}
                      {supplier.category && (
                        <div>🏷️ {supplier.category}</div>
                      )}
                      {supplier.city && (
                        <div>📍 {supplier.city}</div>
                      )}
                      <div className="text-orange-600 font-medium">✓ Аккредитованный поставщик</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      ID: {supplier.id}
                    </div>
                    <div className="text-xs text-gray-400">
                      {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowOrangeRoomSupplierModal(false)}>
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно просмотра данных шага */}
      <Dialog open={showStepDataModal} onOpenChange={setShowStepDataModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Данные шага {stepDataToView?.stepId === 1 ? 'I (Данные клиента)' : stepDataToView?.stepId === 2 ? 'II (Спецификация)' : stepDataToView?.stepId}
            </DialogTitle>
            <DialogDescription>
              Просмотр всех данных, заполненных для этого шага
            </DialogDescription>
          </DialogHeader>

          {stepDataToView && (
            <div className="space-y-6">
              {/* JSON представление данных */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Структура данных (JSON)</h3>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-auto max-h-64">
                  {JSON.stringify(stepDataToView.data, null, 2)}
                </pre>
              </div>

              {/* Детальный просмотр для шага 1 */}
              {stepDataToView.stepId === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3">Основная информация</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Название:</span> {stepDataToView.data.name || 'Не указано'}</div>
                      <div><span className="font-medium">Юридическое название:</span> {stepDataToView.data.legalName || 'Не указано'}</div>
                      <div><span className="font-medium">ИНН:</span> {stepDataToView.data.inn || 'Не указано'}</div>
                      <div><span className="font-medium">КПП:</span> {stepDataToView.data.kpp || 'Не указано'}</div>
                      <div><span className="font-medium">ОГРН:</span> {stepDataToView.data.ogrn || 'Не указано'}</div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-800 mb-3">Банковские реквизиты</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Банк:</span> {stepDataToView.data.bankName || 'Не указано'}</div>
                      <div><span className="font-medium">Расчетный счет:</span> {stepDataToView.data.bankAccount || 'Не указано'}</div>
                      <div><span className="font-medium">БИК:</span> {stepDataToView.data.bik || 'Не указано'}</div>
                      <div><span className="font-medium">Корр. счет:</span> {stepDataToView.data.correspondentAccount || 'Не указано'}</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-purple-800 mb-3">Контакты</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Email:</span> {stepDataToView.data.email || 'Не указано'}</div>
                      <div><span className="font-medium">Телефон:</span> {stepDataToView.data.phone || 'Не указано'}</div>
                      <div><span className="font-medium">Сайт:</span> {stepDataToView.data.website || 'Не указано'}</div>
                      <div><span className="font-medium">Директор:</span> {stepDataToView.data.director || 'Не указано'}</div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-orange-800 mb-3">Адрес</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Адрес:</span> {stepDataToView.data.address || 'Не указано'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Детальный просмотр для шага 2 */}
              {stepDataToView.stepId === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3">Информация о поставщике</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Поставщик:</span> {
                        stepDataToView.data.supplier || 
                        stepDataToView.data.supplier_name || 
                        'Не указано'
                      }</div>
                      <div><span className="font-medium">Валюта:</span> {stepDataToView.data.currency || 'Не указано'}</div>
                    </div>
                  </div>

                  {stepDataToView.data.items && stepDataToView.data.items.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-800 mb-3">Товары ({stepDataToView.data.items.length})</h3>
                      <div className="space-y-3">
                        {stepDataToView.data.items.map((item: any, index: number) => (
                          <div key={index} className="bg-white rounded p-3 border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div><span className="font-medium">Название:</span> {item.name || item.item_name || 'Не указано'}</div>
                              <div><span className="font-medium">Код:</span> {item.code || item.item_code || 'Не указано'}</div>
                              <div><span className="font-medium">Количество:</span> {item.quantity || 'Не указано'}</div>
                              <div><span className="font-medium">Цена:</span> {item.price || 'Не указано'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Детальный просмотр для шага 4 */}
              {stepDataToView.stepId === 4 && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-indigo-800 mb-3">Способ оплаты</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Метод:</span> {
                        stepDataToView.data.method === 'bank-transfer' ? 'Банковский перевод' :
                        stepDataToView.data.method === 'p2p' ? 'P2P платеж' :
                        stepDataToView.data.method === 'crypto' ? 'Криптовалюта' :
                        stepDataToView.data.method || 'Не указано'
                      }</div>
                      <div><span className="font-medium">Поставщик:</span> {
                        stepDataToView.data.supplier || 
                        stepDataToView.data.supplier_name || 
                        stepDataToView.data.recipientName || 
                        'Не указано'
                      }</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowStepDataModal(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно подтверждения реквизитов */}
      <Dialog open={showRequisitesConfirmationModal} onOpenChange={setShowRequisitesConfirmationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Подтверждение реквизитов
            </DialogTitle>
            <DialogDescription>
              Проверьте, что все реквизиты указаны правильно и соответствуют данным поставщика.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Реквизиты из шага 5 */}
            {manualData[5] && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  Банковские реквизиты
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[5].bankName || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[5].accountNumber || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SWIFT/BIC</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[5].swift || 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[5].recipientName || 'Не указано'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Адрес получателя</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {manualData[5].recipientAddress || 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Данные поставщика для сравнения */}
            {manualData[2] && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  Данные поставщика
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                      {manualData[2].supplier || 'Не указан'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Валюта</Label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                      {manualData[2].currency || 'Не указана'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={editRequisites}>
              ✏️ Редактировать
            </Button>
            <Button onClick={confirmRequisites}>
              ✅ Все правильно
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно сводки этапа 2 */}
      <Dialog open={showStage2SummaryModal} onOpenChange={setShowStage2SummaryModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Сводка этапа 2: Подготовка инфраструктуры
            </DialogTitle>
            <DialogDescription>
              Все данные проверены и одобрены! Готовы к переходу к анимации сделки.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Статус одобрения */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-700 font-medium">✅ Все проверки пройдены</p>
                  <p className="text-green-600 text-sm">
                    • Атомарный конструктор одобрен менеджером<br/>
                    • Чек об оплате подтвержден<br/>
                    • Реквизиты проверены и корректны
                  </p>
                </div>
              </div>
            </div>

            {/* Краткая сводка по шагам */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Шаг 1 - Компания */}
              {manualData[1] && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Шаг 1: Компания
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Название:</span> {manualData[1].name || 'Не указано'}</div>
                    <div><span className="font-medium">ИНН:</span> {manualData[1].inn || 'Не указано'}</div>
                    <div><span className="font-medium">Email:</span> {manualData[1].email || 'Не указано'}</div>
                  </div>
                </div>
              )}

              {/* Шаг 2 - Спецификация */}
              {manualData[2] && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Шаг 2: Спецификация
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Поставщик:</span> {manualData[2].supplier || 'Не указан'}</div>
                    <div><span className="font-medium">Валюта:</span> {manualData[2].currency || 'Не указана'}</div>
                    <div><span className="font-medium">Товаров:</span> {manualData[2].items?.length || 0}</div>
                  </div>
                </div>
              )}

              {/* Шаг 4 - Способ оплаты */}
              {manualData[4] && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Шаг 4: Способ оплаты
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Метод:</span> {
                      manualData[4].method === 'bank-transfer' ? 'Банковский перевод' :
                      manualData[4].method === 'p2p' ? 'P2P платеж' :
                      manualData[4].method === 'crypto' ? 'Криптовалюта' :
                      manualData[4].method || 'Не указано'
                    }</div>
                    <div><span className="font-medium">Поставщик:</span> {manualData[4].supplier || 'Не указан'}</div>
                  </div>
                </div>
              )}

              {/* Шаг 5 - Реквизиты */}
              {manualData[5] && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Шаг 5: Реквизиты
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Банк:</span> {manualData[5].bankName || 'Не указан'}</div>
                    <div><span className="font-medium">Счет:</span> {manualData[5].accountNumber || 'Не указан'}</div>
                    <div><span className="font-medium">SWIFT:</span> {manualData[5].swift || 'Не указан'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Информация о платеже */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-yellow-800 font-medium">💳 Платеж подтвержден</p>
                  <p className="text-yellow-700 text-sm">
                    Чек об оплате загружен и одобрен менеджером. Все готово для перехода к анимации сделки.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowStage2SummaryModal(false)}>
              Отмена
            </Button>
            <Button onClick={proceedToStage3} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              🎬 Перейти к анимации сделки
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Уведомления о статусе отправки менеджеру */}
      {managerNotification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          managerNotification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {managerNotification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span className="font-medium">
              {managerNotification.type === 'success' ? 'Успешно!' : 'Ошибка!'}
            </span>
          </div>
          <p className="mt-1 text-sm">{managerNotification.message}</p>
          <button
            onClick={() => setManagerNotification(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* 🛒 Модальное окно каталога товаров */}
      <CatalogModal
        open={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onAddProducts={handleCatalogProductsAdd}
      />

    </div>
  )
}

