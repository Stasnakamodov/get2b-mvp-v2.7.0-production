'use client';

import React from 'react';
import { Building } from 'lucide-react';
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

interface OrangeRoomSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  orangeRoomSuppliers: Supplier[];
  orangeRoomLoading: boolean;
  catalogSourceStep: number;
  handleSelectOrangeRoomSupplier: (supplier: Supplier) => void;
}

export default function OrangeRoomSupplierModal({
  isOpen,
  onClose,
  orangeRoomSuppliers,
  orangeRoomLoading,
  catalogSourceStep,
  handleSelectOrangeRoomSupplier,
}: OrangeRoomSupplierModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-orange-500" />
            Выберите поставщика из оранжевой комнаты
          </DialogTitle>
          <DialogDescription>
            Выберите аккредитованного поставщика для заполнения шага {catalogSourceStep}
          </DialogDescription>
        </DialogHeader>

        {orangeRoomLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Загрузка поставщиков...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {orangeRoomSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => handleSelectOrangeRoomSupplier(supplier)}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
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
                    <div className="text-orange-600 font-medium">✓ Аккредитованный поставщик</div>
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
