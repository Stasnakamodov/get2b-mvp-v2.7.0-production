// Компонент добавления банковских реквизитов поставщика
import React from "react";
import { useAddSupplierContext } from "../../catalog/context/AddSupplierContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Building2, 
  Bitcoin,
  Landmark,
  Smartphone,
  FileText
} from "lucide-react";

export function AddSupplierStep4BankingDetails() {
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
        <h2 className="text-2xl font-bold">Банковские реквизиты</h2>
        <p className="text-gray-600 mt-2">
          Добавьте способы получения оплаты от клиентов
        </p>
      </div>

      {/* 🏦 БАНКОВСКИЕ РЕКВИЗИТЫ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Банковские реквизиты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient_name">Получатель платежа</Label>
              <Input
                id="recipient_name"
                value={supplierData.recipient_name || ''}
                onChange={(e) => updateField('recipient_name', e.target.value)}
                placeholder="ООО Ваша компания"
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Название банка</Label>
              <Input
                id="bank_name"
                value={supplierData.bank_name || ''}
                onChange={(e) => updateField('bank_name', e.target.value)}
                placeholder="Сбербанк России"
              />
            </div>
            <div>
              <Label htmlFor="account_number">Номер счета</Label>
              <Input
                id="account_number"
                value={supplierData.account_number || ''}
                onChange={(e) => updateField('account_number', e.target.value)}
                placeholder="40702810..."
              />
            </div>
            <div>
              <Label htmlFor="swift">SWIFT/BIC</Label>
              <Input
                id="swift"
                value={supplierData.swift || ''}
                onChange={(e) => updateField('swift', e.target.value)}
                placeholder="SABRRUMM"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📱 P2P ПЕРЕВОДЫ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            P2P переводы (карта на карту)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p2p_bank">Банк карты</Label>
              <Input
                id="p2p_bank"
                value={supplierData.p2p_bank || ''}
                onChange={(e) => updateField('p2p_bank', e.target.value)}
                placeholder="Сбербанк"
              />
            </div>
            <div>
              <Label htmlFor="p2p_card_number">Номер карты</Label>
              <Input
                id="p2p_card_number"
                value={supplierData.p2p_card_number || ''}
                onChange={(e) => updateField('p2p_card_number', e.target.value)}
                placeholder="2202 **** **** 1234"
              />
            </div>
            <div>
              <Label htmlFor="p2p_holder_name">Держатель карты</Label>
              <Input
                id="p2p_holder_name"
                value={supplierData.p2p_holder_name || ''}
                onChange={(e) => updateField('p2p_holder_name', e.target.value)}
                placeholder="IVAN PETROV"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ₿ КРИПТОВАЛЮТЫ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            Криптовалютные кошельки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crypto_name">Криптовалюта</Label>
              <Input
                id="crypto_name"
                value={supplierData.crypto_name || ''}
                onChange={(e) => updateField('crypto_name', e.target.value)}
                placeholder="USDT, Bitcoin, Ethereum"
              />
            </div>
            <div>
              <Label htmlFor="crypto_network">Сеть</Label>
              <Input
                id="crypto_network"
                value={supplierData.crypto_network || ''}
                onChange={(e) => updateField('crypto_network', e.target.value)}
                placeholder="TRC20, ERC20, BEP20"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="crypto_address">Адрес кошелька</Label>
              <Input
                id="crypto_address"
                value={supplierData.crypto_address || ''}
                onChange={(e) => updateField('crypto_address', e.target.value)}
                placeholder="TJRyWwFs..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🇷🇺 РОССИЙСКИЕ РЕКВИЗИТЫ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            Российские реквизиты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="inn">ИНН</Label>
              <Input
                id="inn"
                value={supplierData.inn || ''}
                onChange={(e) => updateField('inn', e.target.value)}
                placeholder="1234567890"
              />
            </div>
            <div>
              <Label htmlFor="kpp">КПП</Label>
              <Input
                id="kpp"
                value={supplierData.kpp || ''}
                onChange={(e) => updateField('kpp', e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div>
              <Label htmlFor="ogrn">ОГРН</Label>
              <Input
                id="ogrn"
                value={supplierData.ogrn || ''}
                onChange={(e) => updateField('ogrn', e.target.value)}
                placeholder="1234567890123"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 