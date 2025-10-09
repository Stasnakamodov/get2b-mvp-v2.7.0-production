'use client'

import React from 'react'
import { Building, Banknote, Mail } from 'lucide-react'
import { DataCube } from './DataCube'

interface Step1CompanyCubesProps {
  data: any
  onPreview: (type: string, data: any) => void
}

/**
 * Step 1 Company Data Cubes
 * Displays 3 interactive cubes showing filled company data:
 * - Company info (name, legal details)
 * - Bank account details
 * - Contact information
 */
export function Step1CompanyCubes({ data, onPreview }: Step1CompanyCubesProps) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
      <DataCube
        icon={Building}
        color="blue"
        title="Данные компании"
        subtitle="Основная информация"
        primaryValue={data.name}
        onClick={() => onPreview('company', data)}
      />

      <DataCube
        icon={Banknote}
        color="green"
        title="Расчетный счет"
        subtitle="Банковские реквизиты"
        primaryValue={data.bankName}
        secondaryValue={data.bankAccount}
        onClick={() => onPreview('bank', data)}
      />

      <DataCube
        icon={Mail}
        color="purple"
        title="Дополнительно"
        subtitle="Контакты и детали"
        primaryValue={data.email}
        secondaryValue={data.phone}
        onClick={() => onPreview('contacts', data)}
      />
    </div>
  )
}
