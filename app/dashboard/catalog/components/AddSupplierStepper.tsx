import React from "react";
import { useAddSupplierContext } from "../context/AddSupplierContext";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Lock } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Основная информация",
    description: "Название и категория поставщика",
  },
  {
    id: 2,
    title: "Контактная информация", 
    description: "Страна, город, контакты",
  },
  {
    id: 3,
    title: "Товары и услуги",
    description: "Условия заказа и сертификаты",
  },
  {
    id: 4,
    title: "Банковские реквизиты",
    description: "Способы получения оплаты",
  },
  {
    id: 5,
    title: "Загрузка товаров",
    description: "Каталог продукции поставщика",
  },
  {
    id: 6,
    title: "Профиль и сертификации",
    description: "Подробная информация о компании",
  },
  {
    id: 7,
    title: "Финальная проверка",
    description: "Проверка и сохранение данных",
  },
];

interface AddSupplierStepperProps {
  theme?: 'catalog' | 'profile';
}

export function AddSupplierStepper({ theme = 'catalog' }: AddSupplierStepperProps) {
  const {
    currentStep,
    setCurrentStep,
    maxStepReached,
    setMaxStepReached,
    validateStep,
    canProceedToStep,
  } = useAddSupplierContext();

  // Цветовые темы
  const colors = {
    catalog: {
      current: 'bg-orange-500',
      currentText: 'text-orange-600',
      currentBg: 'bg-orange-50',
      currentLine: 'bg-orange-300',
      currentProgress: 'bg-orange-500',
    },
    profile: {
      current: 'bg-green-500', 
      currentText: 'text-green-600',
      currentBg: 'bg-green-50',
      currentLine: 'bg-green-300',
      currentProgress: 'bg-green-500',
    }
  };

  const currentColors = colors[theme];

  const handleStepClick = (stepNumber: number) => {
    if (!canProceedToStep(stepNumber)) return;
    
    // Если переходим назад, просто меняем шаг
    if (stepNumber <= maxStepReached) {
      setCurrentStep(stepNumber);
      return;
    }
    
    // Если переходим вперед, проверяем валидацию предыдущих шагов
    let canProceed = true;
    for (let i = 1; i < stepNumber; i++) {
      if (!validateStep(i)) {
        canProceed = false;
        break;
      }
    }
    
    if (canProceed) {
      setCurrentStep(stepNumber);
      if (stepNumber > maxStepReached) {
        setMaxStepReached(stepNumber);
      }
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return validateStep(stepNumber) ? "completed" : "error";
    }
    if (stepNumber === currentStep) {
      return "current";
    }
    if (stepNumber <= maxStepReached + 1) {
      return "available";
    }
    return "locked";
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return (
          <div className={cn("h-5 w-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center", currentColors.current)}>
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        );
      case "available":
        return <Circle className="h-5 w-5 text-gray-400" />;
      case "locked":
      default:
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <div className="w-full py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIndex) => {
            const status = getStepStatus(step.id);
            const isClickable = canProceedToStep(step.id) || step.id <= maxStepReached;
            
            return (
              <li key={step.id} className="flex-1">
                <div className="flex items-center">
                  {/* Шаг */}
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
                      {
                        "hover:bg-gray-50 cursor-pointer": isClickable,
                        "cursor-not-allowed opacity-50": !isClickable,
                        [currentColors.currentBg]: status === "current",
                        "bg-green-50": status === "completed",
                      }
                    )}
                  >
                    {/* Иконка шага */}
                    <div className="flex items-center justify-center mb-2">
                      {getStepIcon(step.id)}
                    </div>
                    
                    {/* Информация о шаге */}
                    <div className="text-center">
                      <div
                        className={cn("text-sm font-medium", {
                          [currentColors.currentText]: status === "current",
                          "text-green-600": status === "completed",
                          "text-gray-900": status === "available",
                          "text-gray-400": status === "locked",
                        })}
                      >
                        {step.title}
                      </div>
                      <div
                        className={cn("text-xs mt-1", {
                          [currentColors.currentText.replace('600', '500')]: status === "current",
                          "text-green-500": status === "completed",
                          "text-gray-500": status === "available",
                          "text-gray-300": status === "locked",
                        })}
                      >
                        {step.description}
                      </div>
                    </div>
                  </button>
                  
                  {/* Соединительная линия */}
                  {stepIndex < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={cn("h-0.5 w-full", {
                          "bg-green-300": step.id < currentStep && validateStep(step.id),
                          "bg-red-300": step.id < currentStep && !validateStep(step.id),
                          [currentColors.currentLine]: step.id === currentStep,
                          "bg-gray-200": step.id >= currentStep,
                        })}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
      
      {/* Индикатор текущего шага */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          Шаг {currentStep} из {steps.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={cn("h-2 rounded-full transition-all duration-300", currentColors.currentProgress)}
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
} 