import React, { useCallback } from "react";
import { useAddSupplierContext } from "../context/AddSupplierContext";
import { useSupplierDraft } from "../hooks/useSupplierDraft";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AddSupplierStep1() {
  const {
    supplierData,
    setSupplierData,
    currentStep,
    setCurrentStep,
    maxStepReached,
    setMaxStepReached,
    validateStep,
    sourceType,
    draftId,
  } = useAddSupplierContext();

  const { saveDraft, saving } = useSupplierDraft();
  const { categories, loading: categoriesLoading } = useCategories();

  const updateField = useCallback((field: string, value: string) => {
    setSupplierData({
      ...supplierData,
      [field]: value,
    });
  }, [supplierData, setSupplierData]);

  const handleNext = () => {
    if (validateStep(1)) {
      const nextStep = 2;
      setCurrentStep(nextStep);
      if (nextStep > maxStepReached) {
        setMaxStepReached(nextStep);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!supplierData.name) {
      alert("Введите название поставщика для сохранения черновика");
      return;
    }

    await saveDraft({
      name: `Черновик: ${supplierData.name}`,
      supplierData,
      products: [],
      currentStep: 1,
      maxStepReached,
      sourceType,
      draftId,
    });
  };

  const isValid = validateStep(1);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Основная информация</h2>
        <p className="text-gray-600 mt-2">
          Заполните базовые данные о поставщике
        </p>
        {sourceType === 'echo_card' && (
          <Badge variant="secondary" className="mt-2">
            📊 Импорт из эхо карточки
          </Badge>
        )}
      </div>

      {/* Форма */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о поставщике</CardTitle>
          <CardDescription>
            Заполните обязательные поля для продолжения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Название поставщика */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Название поставщика <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={supplierData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Введите название поставщика"
              className={!supplierData.name ? "border-red-200" : ""}
            />
          </div>

          {/* Юридическое название */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Юридическое название компании <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              value={supplierData.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
              placeholder="Официальное название компании"
              className={!supplierData.company_name ? "border-red-200" : ""}
            />
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <Label>
              Категория деятельности <span className="text-red-500">*</span>
            </Label>
            <Select
              value={supplierData.category}
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger className={!supplierData.category ? "border-red-200" : ""}>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    Загрузка категорий...
                  </SelectItem>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    Категории не найдены
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Контактное лицо */}
          <div className="space-y-2">
            <Label htmlFor="contact_person">Контактное лицо</Label>
            <Input
              id="contact_person"
              value={supplierData.contact_person}
              onChange={(e) => updateField('contact_person', e.target.value)}
              placeholder="Имя представителя компании"
            />
          </div>
        </CardContent>
      </Card>

      {/* Валидация */}
      {!isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Необходимо заполнить обязательные поля:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {!supplierData.name && <li>• Название поставщика</li>}
            {!supplierData.company_name && <li>• Юридическое название компании</li>}
            {!supplierData.category && <li>• Категория деятельности</li>}
          </ul>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saving || !supplierData.name}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Сохранение..." : "Сохранить черновик"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          Далее
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 