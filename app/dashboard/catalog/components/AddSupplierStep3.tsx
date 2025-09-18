import React from "react";
import { useAddSupplierContext } from "../context/AddSupplierContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  DollarSign, 
  Clock,
  Award,
  Plus,
  X
} from "lucide-react";

export function AddSupplierStep3() {
  const { supplierData, setSupplierData } = useAddSupplierContext();

  const updateField = (field: string, value: string | number) => {
    setSupplierData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCertification = () => {
    const newCert = prompt("Введите название сертификата:");
    if (newCert && newCert.trim()) {
      setSupplierData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()]
      }));
    }
  };

  const removeCertification = (index: number) => {
    setSupplierData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Товары и условия поставки</h3>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Условия заказа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_order_amount">Минимальная сумма заказа</Label>
              <Input
                id="min_order_amount"
                type="number"
                value={supplierData.min_order_amount || ''}
                onChange={(e) => updateField('min_order_amount', parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="min_order_currency">Валюта</Label>
              <Select 
                value={supplierData.min_order_currency} 
                onValueChange={(value) => updateField('min_order_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - Доллар США</SelectItem>
                  <SelectItem value="EUR">EUR - Евро</SelectItem>
                  <SelectItem value="CNY">CNY - Китайский юань</SelectItem>
                  <SelectItem value="RUB">RUB - Российский рубль</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Сроки поставки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="delivery_time">Время доставки</Label>
            <Input
              id="delivery_time"
              value={supplierData.delivery_time || ''}
              onChange={(e) => updateField('delivery_time', e.target.value)}
              placeholder="7-15 рабочих дней"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Сертификаты и лицензии
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {supplierData.certifications.map((cert, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {cert}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeCertification(index)}
                />
              </Badge>
            ))}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={addCertification}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить сертификат
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Условия оплаты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="payment_type">Тип оплаты</Label>
            <Select 
              value={supplierData.payment_type || ''} 
              onValueChange={(value) => updateField('payment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepayment">100% предоплата</SelectItem>
                <SelectItem value="partial">Частичная предоплата</SelectItem>
                <SelectItem value="post_delivery">Оплата после доставки</SelectItem>
                <SelectItem value="letter_of_credit">Аккредитив</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 