import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface BankAccountFormProps {
  country: string
  onSave: (data: any) => void
  onCancel: () => void
}

const initialDetails = {
  recipientName: "",
  recipientAddress: "",
  bankName: "",
  bankAddress: "",
  accountNumber: "",
  swift: "",
  paymentPurpose: "",
  transferCurrency: "USD",
  cnapsCode: "",
  iban: "",
  otherDetails: "",
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({ country, onSave, onCancel }) => {
  const [name, setName] = useState("")
  const [details, setDetails] = useState({ ...initialDetails })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !details.recipientName || !details.bankName || !details.accountNumber) {
      alert("Пожалуйста, заполните все обязательные поля")
      return
    }
    onSave({ name, country, details })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
      <h3 className="text-lg font-bold mb-4">Добавить реквизиты — {country === "china" ? "Китай" : country === "turkey" ? "Турция" : "Международные"}</h3>
      <div className="space-y-4">
        <div>
          <Label>Название (для записной книжки)</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Основной счёт в Китае" />
        </div>
        <div>
          <Label>Имя получателя</Label>
          <Input name="recipientName" value={details.recipientName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Адрес получателя</Label>
          <Input name="recipientAddress" value={details.recipientAddress} onChange={handleChange} />
        </div>
        <div>
          <Label>Название банка</Label>
          <Input name="bankName" value={details.bankName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Адрес банка</Label>
          <Input name="bankAddress" value={details.bankAddress} onChange={handleChange} />
        </div>
        <div>
          <Label>Номер счёта</Label>
          <Input name="accountNumber" value={details.accountNumber} onChange={handleChange} required />
        </div>
        {country === "china" && (
          <div>
            <Label>CNAPS Code</Label>
            <Input name="cnapsCode" value={details.cnapsCode} onChange={handleChange} />
          </div>
        )}
        {country === "turkey" && (
          <div>
            <Label>IBAN</Label>
            <Input name="iban" value={details.iban} onChange={handleChange} />
          </div>
        )}
        {(country === "other" || country === "turkey") && (
          <div>
            <Label>SWIFT</Label>
            <Input name="swift" value={details.swift} onChange={handleChange} />
          </div>
        )}
        <div>
          <Label>Назначение платежа</Label>
          <Input name="paymentPurpose" value={details.paymentPurpose} onChange={handleChange} />
        </div>
        <div>
          <Label>Валюта перевода</Label>
          <Input name="transferCurrency" value={details.transferCurrency} onChange={handleChange} />
        </div>
        <div>
          <Label>Прочие детали</Label>
          <Input name="otherDetails" value={details.otherDetails} onChange={handleChange} />
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  )
}

export default BankAccountForm
