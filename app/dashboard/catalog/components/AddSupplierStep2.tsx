// Компонент для шага 2 - Контактная информация поставщика
import React from "react";
import { useAddSupplierContext } from "../context/AddSupplierContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Globe, 
  User,
  FileText
} from "lucide-react";

export function AddSupplierStep2() {
  const { supplierData, setSupplierData } = useAddSupplierContext();

  const updateField = (field: string, value: string) => {
    setSupplierData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Контактная информация</h2>
        <p className="text-gray-600 mt-2">
          Укажите контактные данные и местоположение поставщика
        </p>
      </div>

      {/* 🌍 МЕСТОПОЛОЖЕНИЕ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Местоположение
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Страна *</Label>
              <Input
                id="country"
                value={supplierData.country || ''}
                onChange={(e) => updateField('country', e.target.value)}
                placeholder="Китай"
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Город *</Label>
              <Input
                id="city"
                value={supplierData.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Гуанчжоу"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 👤 КОНТАКТНОЕ ЛИЦО */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-500" />
            Контактное лицо
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">ФИО представителя</Label>
              <Input
                id="contact_person"
                value={supplierData.contact_person || ''}
                onChange={(e) => updateField('contact_person', e.target.value)}
                placeholder="Ли Вэй"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Телефон</Label>
              <Input
                id="contact_phone"
                value={supplierData.contact_phone || ''}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                placeholder="+86 139 1234 5678"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={supplierData.contact_email || ''}
                onChange={(e) => updateField('contact_email', e.target.value)}
                placeholder="sales@company.com"
              />
            </div>
            <div>
              <Label htmlFor="website">Веб-сайт</Label>
              <Input
                id="website"
                value={supplierData.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://company.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📝 ОПИСАНИЕ КОМПАНИИ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Описание компании
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description">Описание деятельности</Label>
            <Textarea
              id="description"
              value={supplierData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Краткое описание деятельности компании и её преимуществ..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 🏢 ЮРИДИЧЕСКИЕ АДРЕСА */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Юридические адреса
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="legal_address">Юридический адрес</Label>
            <Textarea
              id="legal_address"
              value={supplierData.legal_address || ''}
              onChange={(e) => updateField('legal_address', e.target.value)}
              placeholder="Полный юридический адрес компании..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="actual_address">Фактический адрес</Label>
            <Textarea
              id="actual_address"
              value={supplierData.actual_address || ''}
              onChange={(e) => updateField('actual_address', e.target.value)}
              placeholder="Фактический адрес ведения деятельности..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 