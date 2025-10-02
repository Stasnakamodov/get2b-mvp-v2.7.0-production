import React from 'react'

interface DealAnimationProps {
  dealAnimationStep: number // 0-3
  dealAnimationStatus: string
  dealAnimationComplete: boolean
}

export const DealAnimation: React.FC<DealAnimationProps> = ({
  dealAnimationStep,
  dealAnimationStatus,
  dealAnimationComplete
}) => {
  return (
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
  )
}
