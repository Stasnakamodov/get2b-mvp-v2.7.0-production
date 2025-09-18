import React from "react";
import { motion } from "framer-motion";
import { useAddSupplierContext } from "../context/AddSupplierContext";

const steps = [
  {
    id: 1,
    title: "ОСНОВНАЯ",
    description: "Информация",
  },
  {
    id: 2,
    title: "КОНТАКТЫ", 
    description: "Связь",
  },
  {
    id: 3,
    title: "ПРОФИЛЬ",
    description: "Бизнес",
  },
  {
    id: 4,
    title: "СЕРТИФИКАЦИИ",
    description: "Документы",
  },
  {
    id: 5,
    title: "ТОВАРЫ",
    description: "Каталог",
  },
  {
    id: 6,
    title: "РЕКВИЗИТЫ",
    description: "Платежи",
  },
  {
    id: 7,
    title: "ПРЕВЬЮ",
    description: "Финал",
  },
];

const toRoman = (num: number): string => {
  const romanMap: { [key: number]: string } = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII' };
  return romanMap[num] || num.toString();
};

interface AddSupplierStepperOriginalProps {
  targetTable?: 'supplier_profiles' | 'catalog_user_suppliers';
  isEditing?: boolean; // Флаг редактирования для свободного перемещения по шагам
}

export function AddSupplierStepperOriginal({ targetTable = 'catalog_user_suppliers', isEditing = false }: AddSupplierStepperOriginalProps) {
  const {
    currentStep,
    setCurrentStep,
    maxStepReached,
    setMaxStepReached,
  } = useAddSupplierContext();

  // Цветовая тема
  const themeColor = targetTable === 'supplier_profiles' ? 'green' : 'orange';
  const colorClasses = {
    green: {
      progress: 'bg-green-500',
      circle: 'bg-green-500 border-green-500',
      ring: 'ring-green-200',
    },
    orange: {
      progress: 'bg-orange-500',
      circle: 'bg-orange-500 border-orange-500', 
      ring: 'ring-orange-200',
    }
  };

  const colors = colorClasses[themeColor];

  return (
    <div className="relative my-8">
      {/* Базовая линия (фон) */}
      <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-300 rounded-full" />
      
      {/* Линия прогресса до текущего шага */}
      <div
        className={`absolute top-1/2 left-0 h-2 -translate-y-1/2 ${colors.progress} rounded-full transition-all duration-500`}
        style={{
          width: steps.length === 1
            ? '100%'
            : `${((currentStep - 1) / (steps.length - 1)) * 100}%`
        }}
      />
      
      {/* Кружки */}
      <div className="relative flex justify-between w-full">
        {steps.map((step, index) => {
          const isCompletedOrCurrent = index + 1 <= currentStep;
          const isClickable = isEditing ? true : index + 1 <= maxStepReached; // При редактировании все шаги доступны
          
          return (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  ${isCompletedOrCurrent 
                    ? `${colors.circle}${index + 1 === currentStep ? ` ring-2 ${colors.ring}` : ''}` 
                    : "bg-gray-300 border-gray-400"}
                  ${isClickable ? 'shadow-md shadow-gray-200 hover:scale-105' : ''}
                  ${isEditing && isClickable ? 'hover:ring-2 hover:ring-blue-300' : ''}
                `}
                onClick={() => {
                  if (isClickable) {
                    setCurrentStep(index + 1);
                    // При редактировании также обновляем maxStepReached, если переходим дальше
                    if (isEditing && index + 1 > maxStepReached) {
                      setMaxStepReached(index + 1);
                    }
                  }
                }}
              >
                <span className={`text-lg font-bold ${isCompletedOrCurrent ? "text-white" : "text-gray-400"}`}>
                  {toRoman(index + 1)}
                </span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                className="mt-2 text-center"
              >
                <div className={`text-xs font-medium uppercase tracking-wider ${isCompletedOrCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className={`text-xs ${isCompletedOrCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 