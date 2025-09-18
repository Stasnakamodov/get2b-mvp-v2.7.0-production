"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, Plus, X } from "lucide-react";
import { checkSupabaseHealth } from '@/lib/supabaseClient';

interface AccreditationData {
  // Шаг 1: Основная информация
  company_name: string;
  legal_name: string;
  country: string;
  city: string;
  address: string;
  website: string;
  established: string;
  employees: string;
  
  // Шаг 2: Товары и услуги
  category: string;
  specialties: string[];
  description: string;
  min_order: string;
  response_time: string;
  
  // Шаг 3: Документы и сертификаты
  certifications: string[];
  documents: File[];
  business_license: string;
  
  // Шаг 4: Банковские реквизиты
  bank_name: string;
  account_number: string;
  swift: string;
  payment_methods: string[];
  
  // Шаг 5: Контактная информация
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  notes: string;
}

const STEPS = [
  { id: 1, title: "Основная информация", description: "Данные о компании" },
  { id: 2, title: "Товары и услуги", description: "Специализация и категории" },
  { id: 3, title: "Документы", description: "Сертификаты и лицензии" },
  { id: 4, title: "Банковские данные", description: "Реквизиты для работы" },
  { id: 5, title: "Контактные данные", description: "Ответственное лицо" },
];

const CATEGORIES = [
  "Электроника",
  "Текстиль и одежда", 
  "Красота и здоровье",
  "Автотовары",
  "Спорт и отдых",
  "Дом и сад",
  "Другое"
];

const PAYMENT_METHODS = [
  "Банковский перевод",
  "T/T (Telegraphic Transfer)",
  "L/C (Letter of Credit)", 
  "Western Union",
  "PayPal",
  "Alibaba Trade Assurance",
  "Другое"
];

export default function AccreditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccreditationData>({
    company_name: "",
    legal_name: "",
    country: "",
    city: "",
    address: "",
    website: "",
    established: "",
    employees: "",
    category: "",
    specialties: [],
    description: "",
    min_order: "",
    response_time: "",
    certifications: [],
    documents: [],
    business_license: "",
    bank_name: "",
    account_number: "",
    swift: "",
    payment_methods: [],
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    contact_position: "",
    notes: ""
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!supplierId || !user?.id) return;

      try {
        setLoading(true);
        console.log(`🔍 [DEBUG] Ищем поставщика ${supplierId} в профиле пользователя ${user.id}`);

        // 🔄 ИСПРАВЛЕНО: Ищем в supplier_profiles (профиль пользователя)
        const { data, error } = await supabase
          .from('supplier_profiles')
          .select('*')
          .eq('id', supplierId)
          .eq('user_id', user.id)
          .maybeSingle();

        console.log(`🔍 [DEBUG] Результат поиска в supplier_profiles:`, { data, error });

        if (error) {
          console.error('❌ [DEBUG] Ошибка Supabase:', error);
          setError(`Ошибка при получении данных поставщика: ${error.message}`);
          setSupplier(null);
          return;
        }

        if (!data) {
          console.log('❌ [DEBUG] Поставщик не найден в профиле пользователя');
          setError(`Поставщик не найден в ваших профилях`);
          setSupplier(null);
          return;
        }

        console.log('✅ [DEBUG] Поставщик найден:', data);
        setSupplier(data);
        setError(null);

      } catch (err) {
        console.error('❌ [DEBUG] Ошибка при загрузке поставщика:', err);
        setError('Произошла ошибка при загрузке данных поставщика');
        setSupplier(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, user?.id]);

  // Получаем пользователя из Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router]);

  const updateFormData = (field: keyof AccreditationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof AccreditationData, item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof AccreditationData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.company_name && formData.country && formData.city);
      case 2:
        return !!(formData.category && formData.description);
      case 3:
        return true; // Документы опциональны
      case 4:
        return true; // Банковские данные опциональны на этапе заявки
      case 5:
        return !!(formData.contact_person && formData.contact_email);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitAccreditation = async () => {
    if (!validateStep(5)) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/catalog/submit-accreditation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_id: supplierId,
          accreditation_data: formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка подачи заявки');
      }

      // Успешная подача заявки
      router.push('/dashboard/profile?accreditation=success');
    } catch (error) {
      console.error('Ошибка подачи заявки:', error);
      alert('Ошибка при подаче заявки. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Products formData={formData} updateFormData={updateFormData} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 3:
        return <Step3Documents formData={formData} updateFormData={updateFormData} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 4:
        return <Step4Banking formData={formData} updateFormData={updateFormData} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 5:
        return <Step5Contacts formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Загрузка данных поставщика...</div>
      </div>
    );
  }

  const progress = (currentStep / 5) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/dashboard/profile')}
          className="border-2 border-black"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Вернуться к профилю
        </Button>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">Аккредитация поставщика</h1>
          <p className="text-gray-600">{supplier.name} • {supplier.country}</p>
        </div>
      </div>

      {/* Информационная панель о предзаполненных данных */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Данные предзаполнены из вашего профиля</h4>
              <p className="text-sm text-blue-800 mb-2">
                Мы автоматически заполнили форму данными о поставщике <strong>{supplier.name}</strong> из вашего личного списка.
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                {supplier.category && <div>✓ Категория: {supplier.category}</div>}
                {supplier.contact_email && <div>✓ Email: {supplier.contact_email}</div>}
                {supplier.website && <div>✓ Веб-сайт: {supplier.website}</div>}
                {supplier.specialties && supplier.specialties.length > 0 && (
                  <div>✓ Специализации: {supplier.specialties.slice(0, 2).join(', ')}{supplier.specialties.length > 2 ? '...' : ''}</div>
                )}
                {supplier.user_notes && <div>✓ Ваши заметки о поставщике</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Прогресс */}
      <Card className="border-2 border-black">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Шаг {currentStep} из 5</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% завершено</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1 ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Контент шага */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="uppercase tracking-wider">
            {STEPS[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Навигация по шагам */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
          className="border-2 border-black"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        
        {currentStep === 5 ? (
          <Button 
            onClick={submitAccreditation} 
            disabled={!validateStep(5) || loading}
            className="bg-green-600 hover:bg-green-700 text-white uppercase tracking-wider"
          >
            {loading ? 'Отправляем...' : 'Подать заявку на аккредитацию'}
          </Button>
        ) : (
          <Button 
            onClick={nextStep} 
            disabled={!validateStep(currentStep)}
            className="border-2 border-black text-black hover:bg-black hover:text-white uppercase tracking-wider"
          >
            Далее
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Компоненты шагов
function Step1BasicInfo({ formData, updateFormData }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="company_name">Название компании <span className="text-red-500">*</span></Label>
        <Input 
          id="company_name" 
          value={formData.company_name} 
          onChange={(e) => updateFormData('company_name', e.target.value)}
          placeholder="ООО 'Ваша компания'"
        />
      </div>
      <div>
        <Label htmlFor="legal_name">Юридическое название</Label>
        <Input 
          id="legal_name" 
          value={formData.legal_name} 
          onChange={(e) => updateFormData('legal_name', e.target.value)}
          placeholder="Полное юридическое название"
        />
      </div>
      <div>
        <Label htmlFor="country">Страна <span className="text-red-500">*</span></Label>
        <Input 
          id="country" 
          value={formData.country} 
          onChange={(e) => updateFormData('country', e.target.value)}
          placeholder="Россия"
        />
      </div>
      <div>
        <Label htmlFor="city">Город <span className="text-red-500">*</span></Label>
        <Input 
          id="city" 
          value={formData.city} 
          onChange={(e) => updateFormData('city', e.target.value)}
          placeholder="Москва"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="address">Адрес</Label>
        <Input 
          id="address" 
          value={formData.address} 
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="Улица, дом, офис"
        />
      </div>
      <div>
        <Label htmlFor="website">Веб-сайт</Label>
        <Input 
          id="website" 
          value={formData.website} 
          onChange={(e) => updateFormData('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div>
        <Label htmlFor="established">Год основания</Label>
        <Input 
          id="established" 
          value={formData.established} 
          onChange={(e) => updateFormData('established', e.target.value)}
          placeholder="2010"
        />
      </div>
      <div>
        <Label htmlFor="employees">Количество сотрудников</Label>
        <Input 
          id="employees" 
          value={formData.employees} 
          onChange={(e) => updateFormData('employees', e.target.value)}
          placeholder="10-50 человек"
        />
      </div>
    </div>
  );
}

function Step2Products({ formData, updateFormData, addArrayItem, removeArrayItem }: any) {
  const [newSpecialty, setNewSpecialty] = useState("");
  
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="category">Основная категория <span className="text-red-500">*</span></Label>
        <select 
          id="category"
          value={formData.category} 
          onChange={(e) => updateFormData('category', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Выберите категорию</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div>
        <Label>Специализации</Label>
        <div className="flex gap-2 mb-2">
          <Input 
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            placeholder="Добавить специализацию"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem('specialties', newSpecialty);
                setNewSpecialty("");
              }
            }}
          />
          <Button 
            type="button"
            onClick={() => {
              addArrayItem('specialties', newSpecialty);
              setNewSpecialty("");
            }}
            className="border-2 border-black"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.specialties.map((specialty: string, index: number) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {specialty}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem('specialties', index)} />
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Описание деятельности <span className="text-red-500">*</span></Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Подробное описание товаров и услуг компании"
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_order">Минимальный заказ</Label>
          <Input 
            id="min_order" 
            value={formData.min_order} 
            onChange={(e) => updateFormData('min_order', e.target.value)}
            placeholder="1000 USD или 100 штук"
          />
        </div>
        <div>
          <Label htmlFor="response_time">Время ответа</Label>
          <Input 
            id="response_time" 
            value={formData.response_time} 
            onChange={(e) => updateFormData('response_time', e.target.value)}
            placeholder="24 часа"
          />
        </div>
      </div>
    </div>
  );
}

function Step3Documents({ formData, updateFormData, addArrayItem, removeArrayItem }: any) {
  const [newCertification, setNewCertification] = useState("");
  
  return (
    <div className="space-y-6">
      <div>
        <Label>Сертификаты и лицензии</Label>
        <div className="flex gap-2 mb-2">
          <Input 
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            placeholder="Добавить сертификат"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem('certifications', newCertification);
                setNewCertification("");
              }
            }}
          />
          <Button 
            type="button"
            onClick={() => {
              addArrayItem('certifications', newCertification);
              setNewCertification("");
            }}
            className="border-2 border-black"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.certifications.map((cert: string, index: number) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {cert}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem('certifications', index)} />
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="business_license">Номер бизнес-лицензии</Label>
        <Input 
          id="business_license" 
          value={formData.business_license} 
          onChange={(e) => updateFormData('business_license', e.target.value)}
          placeholder="Номер регистрации или лицензии"
        />
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600 mb-2">Загрузите документы (опционально)</p>
        <p className="text-sm text-gray-500">Сертификаты, лицензии, портфолио</p>
        <input 
          type="file" 
          multiple 
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="mt-2"
          onChange={(e) => {
            if (e.target.files) {
              updateFormData('documents', Array.from(e.target.files));
            }
          }}
        />
      </div>
    </div>
  );
}

function Step4Banking({ formData, updateFormData, addArrayItem, removeArrayItem }: any) {
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bank_name">Название банка</Label>
          <Input 
            id="bank_name" 
            value={formData.bank_name} 
            onChange={(e) => updateFormData('bank_name', e.target.value)}
            placeholder="Сбербанк"
          />
        </div>
        <div>
          <Label htmlFor="account_number">Номер счета</Label>
          <Input 
            id="account_number" 
            value={formData.account_number} 
            onChange={(e) => updateFormData('account_number', e.target.value)}
            placeholder="40702810..."
          />
        </div>
        <div>
          <Label htmlFor="swift">SWIFT/BIC код</Label>
          <Input 
            id="swift" 
            value={formData.swift} 
            onChange={(e) => updateFormData('swift', e.target.value)}
            placeholder="SABRRUMM"
          />
        </div>
      </div>
      
      <div>
        <Label>Принимаемые способы оплаты</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {PAYMENT_METHODS.map(method => (
            <label key={method} className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={formData.payment_methods.includes(method)}
                onChange={(e) => {
                  if (e.target.checked) {
                    addArrayItem('payment_methods', method);
                  } else {
                    const index = formData.payment_methods.indexOf(method);
                    if (index > -1) removeArrayItem('payment_methods', index);
                  }
                }}
              />
              <span className="text-sm">{method}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Contacts({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_person">Контактное лицо <span className="text-red-500">*</span></Label>
          <Input 
            id="contact_person" 
            value={formData.contact_person} 
            onChange={(e) => updateFormData('contact_person', e.target.value)}
            placeholder="Иван Иванов"
          />
        </div>
        <div>
          <Label htmlFor="contact_position">Должность</Label>
          <Input 
            id="contact_position" 
            value={formData.contact_position} 
            onChange={(e) => updateFormData('contact_position', e.target.value)}
            placeholder="Менеджер по экспорту"
          />
        </div>
        <div>
          <Label htmlFor="contact_email">Email <span className="text-red-500">*</span></Label>
          <Input 
            id="contact_email" 
            type="email"
            value={formData.contact_email} 
            onChange={(e) => updateFormData('contact_email', e.target.value)}
            placeholder="contact@company.com"
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Телефон</Label>
          <Input 
            id="contact_phone" 
            value={formData.contact_phone} 
            onChange={(e) => updateFormData('contact_phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="notes">Дополнительные примечания</Label>
        <Textarea 
          id="notes" 
          value={formData.notes} 
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="Любая дополнительная информация о компании, особенности работы, пожелания"
          rows={4}
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Что происходит после подачи заявки?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ваша заявка будет рассмотрена менеджерами Get2B</li>
          <li>• Мы проверим предоставленную информацию</li>
          <li>• При необходимости запросим дополнительные документы</li>
          <li>• После одобрения ваша компания появится в публичном каталоге</li>
          <li>• Вы получите уведомление о результатах рассмотрения</li>
        </ul>
      </div>
    </div>
  );
} 