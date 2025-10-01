'use client';

import React from 'react';
import { Users, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  city?: string;
  created_at?: string;
}

interface BlueRoomSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueRoomSuppliers: Supplier[];
  blueRoomLoading: boolean;
  catalogSourceStep: number;
  handleSelectBlueRoomSupplier: (supplier: Supplier) => void;
}

export default function BlueRoomSupplierModal({
  isOpen,
  onClose,
  blueRoomSuppliers,
  blueRoomLoading,
  catalogSourceStep,
  handleSelectBlueRoomSupplier,
}: BlueRoomSupplierModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Выберите поставщика из синей комнаты
          </DialogTitle>
          <DialogDescription>
            Выберите поставщика для заполнения шага {catalogSourceStep}
          </DialogDescription>
        </DialogHeader>

        {blueRoomLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Загрузка поставщиков...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {blueRoomSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => handleSelectBlueRoomSupplier(supplier)}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {supplier.name}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {supplier.contact_email && (
                      <div>📧 {supplier.contact_email}</div>
                    )}
                    {supplier.contact_phone && (
                      <div>📞 {supplier.contact_phone}</div>
                    )}
                    {supplier.category && (
                      <div>🏷️ {supplier.category}</div>
                    )}
                    {supplier.city && (
                      <div>📍 {supplier.city}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    ID: {supplier.id}
                  </div>
                  <div className="text-xs text-gray-400">
                    {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
