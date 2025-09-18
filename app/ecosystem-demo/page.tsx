'use client';

import { useState } from 'react';

const scenarios = [
  {
    id: 'first-project',
    title: '🚀 Первый проект - новичок',
    subtitle: 'Создание с нуля',
    flow: [
      { step: 'Step1', action: 'Создаю профиль "ООО Ромашка" вручную', icon: '👤', color: 'bg-blue-500' },
      { step: 'Step2', action: 'Выбираю поставщика из оранжевой комнаты', icon: '🟠', color: 'bg-orange-500' },
      { step: 'Step3-6', action: 'Прохожу весь процесс оплаты', icon: '💳', color: 'bg-green-500' },
      { step: 'Step7', action: 'Завершаю проект успешно', icon: '✅', color: 'bg-purple-500' },
      { step: 'Эхо', action: 'Поставщик автоматически сохраняется в синюю комнату', icon: '🔄', color: 'bg-cyan-500' }
    ],
    result: 'База знаний: 1 профиль + 1 проверенный поставщик'
  },
  {
    id: 'experienced-user',
    title: '⚡ Опытный пользователь',
    subtitle: 'Автозаполнение',
    flow: [
      { step: 'Step1', action: 'Стартер "Из профиля" - выбираю ООО Ромашка', icon: '🚀', color: 'bg-blue-500' },
      { step: 'Step2', action: 'AI предлагает проверенного поставщика + автозаполняет товары', icon: '🤖', color: 'bg-purple-500' },
      { step: 'Step3-6', action: 'Быстро прохожу (данные уже известны)', icon: '⚡', color: 'bg-yellow-500' },
      { step: 'Step7', action: 'Завершение за 15 минут', icon: '🎯', color: 'bg-green-500' },
      { step: 'Эхо+', action: 'Улучшается статистика поставщика', icon: '📈', color: 'bg-pink-500' }
    ],
    result: 'Экономия времени: 80% данных автозаполнено'
  },
  {
    id: 'bulk-import',
    title: '📊 Массовая загрузка',
    subtitle: 'CSV импорт товаров',
    flow: [
      { step: 'Step1', action: 'Выбираю профиль из списка', icon: '📋', color: 'bg-blue-500' },
      { step: 'Step2', action: 'Стартер "Загрузка карточки" - импорт CSV с 500 товарами', icon: '📁', color: 'bg-indigo-500' },
      { step: 'Auto', action: 'Система находит подходящих поставщиков для каждой категории', icon: '🔍', color: 'bg-orange-500' },
      { step: 'Step3-6', action: 'Группирую по поставщикам и обрабатываю', icon: '🔗', color: 'bg-green-500' },
      { step: 'Step7', action: 'Массовое завершение проектов', icon: '🎊', color: 'bg-purple-500' }
    ],
    result: 'Обработка крупных заказов за несколько часов'
  },
  {
    id: 'ai-recommendations',
    title: '🧠 AI рекомендации',
    subtitle: 'Персональные предложения',
    flow: [
      { step: 'Анализ', action: 'AI изучает историю из 50+ завершенных проектов', icon: '🔬', color: 'bg-cyan-500' },
      { step: 'Step1', action: 'Создаю новый проект для знакомой категории', icon: '🎯', color: 'bg-blue-500' },
      { step: 'Step2', action: 'AI: "Рекомендую Supplier_X (98% успех, -5% к цене)"', icon: '💡', color: 'bg-yellow-500' },
      { step: 'Smart', action: 'Автозаполнение товаров на основе трендов', icon: '📈', color: 'bg-pink-500' },
      { step: 'Step7', action: 'Подтверждение правильности рекомендации', icon: '✨', color: 'bg-green-500' }
    ],
    result: 'Персональные рекомендации становятся точнее с каждым проектом'
  },
  {
    id: 'template-usage',
    title: '📋 Работа с шаблонами',
    subtitle: 'Типовые операции',
    flow: [
      { step: 'Template', action: 'Стартер "По шаблону" - выбираю "Электроника из Китая"', icon: '🗂️', color: 'bg-indigo-500' },
      { step: 'Auto', action: 'Подтягиваются: профиль, поставщики, типовые товары', icon: '🔧', color: 'bg-orange-500' },
      { step: 'Step2', action: 'Корректирую количества и модели', icon: '✏️', color: 'bg-blue-500' },
      { step: 'Step3-6', action: 'Стандартный процесс по отработанной схеме', icon: '⚙️', color: 'bg-green-500' },
      { step: 'Save', action: 'Сохраняю как новый шаблон "Электроника Q1 2024"', icon: '💾', color: 'bg-purple-500' }
    ],
    result: 'Библиотека шаблонов для повторяющихся операций'
  }
];

export default function EcosystemDemo() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const playScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setCurrentStep(0);
    
    // Анимированное проигрывание шагов
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      scenario.flow.forEach((_, index) => {
        setTimeout(() => setCurrentStep(index + 1), (index + 1) * 1000);
      });
    }
  };

  const resetDemo = () => {
    setActiveScenario(null);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Заголовок */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🔄 Экосистема Get2B
          </h1>
          <p className="text-xl text-gray-600">
            Интерактивные сценарии работы: Профили ↔ Проекты ↔ Каталог ↔ Эхо карточки
          </p>
        </div>

        {/* Архитектурная схема */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-center mb-8">🏗️ Архитектура связей</h2>
          <div className="flex justify-center items-center space-x-8 flex-wrap gap-4">
            
            {/* Профили */}
            <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl text-center mb-2">👤</div>
              <div className="font-bold text-blue-800">Профили</div>
              <div className="text-sm text-blue-600">Компании-клиенты</div>
            </div>

            <div className="text-2xl">→</div>

            {/* Проекты (7 шагов) */}
            <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl text-center mb-2">📋</div>
              <div className="font-bold text-green-800">7-Шаговый процесс</div>
              <div className="text-sm text-green-600">Рабочий процесс</div>
            </div>

            <div className="text-2xl">→</div>

            {/* Каталог */}
            <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl text-center mb-2">🏪</div>
              <div className="font-bold text-orange-800">Каталог</div>
              <div className="text-sm text-orange-600">Синяя + Оранжевая</div>
            </div>

            <div className="text-2xl">→</div>

            {/* Эхо карточки */}
            <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl text-center mb-2">🔄</div>
              <div className="font-bold text-purple-800">Эхо карточки</div>
              <div className="text-sm text-purple-600">Автонакопление</div>
            </div>

          </div>
        </div>

        {/* Сценарии */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 cursor-pointer transition-all duration-300 hover:shadow-xl animate-slide-up ${
                activeScenario === scenario.id 
                  ? 'border-blue-500 shadow-2xl transform scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => playScenario(scenario.id)}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{scenario.title}</h3>
                <p className="text-gray-600">{scenario.subtitle}</p>
              </div>

              <div className="space-y-3">
                {scenario.flow.map((flowStep, stepIndex) => (
                  <div
                    key={stepIndex}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                      activeScenario === scenario.id && currentStep > stepIndex
                        ? `${flowStep.color} text-white transform scale-105 animate-pulse`
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-xl">{flowStep.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{flowStep.step}</div>
                      <div className="text-xs opacity-90">{flowStep.action}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-800">Результат:</div>
                <div className="text-xs text-gray-600">{scenario.result}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Активный сценарий - детализация */}
        {activeScenario && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white animate-slide-up mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">
                🎬 Проигрывается: {scenarios.find(s => s.id === activeScenario)?.title}
              </h2>
              <button
                onClick={resetDemo}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                🔄 Сброс
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {scenarios.find(s => s.id === activeScenario)?.flow.map((step, index) => (
                <div
                  key={index}
                  className={`text-center p-4 rounded-lg transition-all duration-500 ${
                    currentStep > index 
                      ? 'bg-white bg-opacity-20 shadow-lg transform scale-110' 
                      : 'bg-white bg-opacity-5'
                  } ${currentStep === index + 1 ? 'animate-bounce' : ''}`}
                >
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <div className="font-bold text-sm">{step.step}</div>
                  <div className="text-xs opacity-80 mt-1">{step.action}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="text-lg">
                📊 Прогресс: {currentStep} / {scenarios.find(s => s.id === activeScenario)?.flow.length || 0}
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(currentStep / (scenarios.find(s => s.id === activeScenario)?.flow.length || 1)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Ключевые принципы */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: '📈',
              title: 'Накопление экспертизы',
              desc: 'Каждый проект улучшает следующий'
            },
            {
              icon: '⚡',
              title: 'Ускорение процессов',
              desc: 'От 3 часов до 15 минут'
            },
            {
              icon: '🎯',
              title: 'Персонализация',
              desc: 'AI учится на вашем опыте'
            },
            {
              icon: '🔒',
              title: 'Контроль качества',
              desc: 'Только проверенные поставщики'
            }
          ].map((principle, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${500 + index * 100}ms` }}
            >
              <div className="text-4xl mb-3">{principle.icon}</div>
              <h3 className="font-bold text-lg mb-2">{principle.title}</h3>
              <p className="text-gray-600 text-sm">{principle.desc}</p>
            </div>
          ))}
        </div>

        {/* Призыв к действию */}
        <div className="text-center animate-fade-in-delayed">
          <p className="text-lg text-gray-600">
            👆 Кликните на любой сценарий выше, чтобы увидеть его в действии!
          </p>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-fade-in-delayed {
          animation: fadeIn 1s ease-out 1s both;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
} 