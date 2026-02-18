import React, { useEffect, useState } from "react";
import { AddSupplierProvider, useAddSupplierContext } from "../context/AddSupplierContext";
import { AddSupplierStepperOriginal } from "./AddSupplierStepperOriginal";
import { AddSupplierContentOriginal } from "./AddSupplierContentOriginal";

// Главный компонент модального окна
interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (supplier: any) => void;
  editingSupplier?: any; // Данные поставщика для редактирования
  targetTable?: 'supplier_profiles' | 'catalog_user_suppliers'; // 🆕 НОВЫЙ ПАРАМЕТР: куда сохранять
}

export function AddSupplierModal({
  isOpen,
  onClose,
  onSuccess,
  editingSupplier,
  targetTable = 'catalog_user_suppliers',
}: AddSupplierModalProps) {
  if (!isOpen) return null;

  return (
    <AddSupplierProvider>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white border-4 border-black max-w-7xl w-full h-[95vh] my-4 flex flex-col">
          {/* Header модала */}
          <div className="border-b-2 border-black p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50">
                  {editingSupplier?.logo_url ? (
                    <img 
                      src={editingSupplier.logo_url} 
                      alt="Логотип поставщика" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center font-medium">
                      LOGO
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-light text-black tracking-wide">
                    {editingSupplier ? 'Редактирование поставщика' : 'Добавление нового поставщика'}
                  </h2>
                  {editingSupplier && (
                    <div className="mt-2 mb-1">
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 text-xs uppercase tracking-wider font-medium border border-orange-300">
                        ✏️ Редактирование профиля
                      </span>
                    </div>
                  )}
                  {targetTable === 'supplier_profiles' && (
                    <div className="mt-2 mb-1">
                      <span className="bg-green-100 text-green-800 px-3 py-1 text-xs uppercase tracking-wider font-medium border border-green-300">
                        👤 Профиль пользователя
                      </span>
                    </div>
                  )}
                  <div className="w-24 h-0.5 bg-black mt-2"></div>
                  <p className="text-gray-600 mt-3 font-light">
                    Заполните информацию о новом поставщике
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Степпер в оригинальном стиле */}
            <AddSupplierStepperOriginal 
              targetTable={targetTable} 
              isEditing={!!editingSupplier} 
            />
          </div>

          {/* Контент формы */}
          <div className="flex-1 overflow-hidden">
            <AddSupplierContentOriginal 
              onClose={onClose}
              onSuccess={onSuccess}
              editingSupplier={editingSupplier}
              targetTable={targetTable}
            />
          </div>
        </div>
      </div>
    </AddSupplierProvider>
  );
} 