import React from 'react'

interface PaymentDetailsCardProps {
  companyData: {
    name?: string
    inn?: string
    bank_name?: string
    bank_account?: string
    bik?: string
  }
  items: Array<{
    name: string
    code?: string
    quantity: number
    unit?: string
    price: number
    total: number
  }>
  totalAmount: number
  projectRequestId: string
}

export const PaymentDetailsCard: React.FC<PaymentDetailsCardProps> = ({
  companyData,
  items,
  totalAmount,
  projectRequestId
}) => {
  return (
    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-md">
      <h3 className="text-xl font-bold mb-6 text-center">Платёжные реквизиты</h3>
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {/* Плательщик */}
        <div className="flex-1 min-w-[220px]">
          <div className="text-lg font-semibold mb-2 text-gray-700">Плательщик</div>
          <div className="grid grid-cols-1 gap-y-1 text-sm">
            <div><span className="text-gray-500">Компания:</span> <span className="font-medium">{companyData.name || 'Не указано'}</span></div>
            <div><span className="text-gray-500">ИНН:</span> {companyData.inn || 'Не указано'}</div>
            <div><span className="text-gray-500">Банк:</span> {companyData.bank_name || 'Не указано'}</div>
            <div><span className="text-gray-500">Счёт:</span> {companyData.bank_account || 'Не указано'}</div>
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
}
