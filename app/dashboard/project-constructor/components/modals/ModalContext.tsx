'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ModalType, ModalState, ModalContextValue } from './types';

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const initialModalState: Record<ModalType, ModalState> = {
  preview: { type: 'preview', isOpen: false },
  echoData: { type: 'echoData', isOpen: false },
  profileSelector: { type: 'profileSelector', isOpen: false },
  supplierProfileSelector: { type: 'supplierProfileSelector', isOpen: false },
  summary: { type: 'summary', isOpen: false },
  stageTransition: { type: 'stageTransition', isOpen: false },
  blueRoomSupplier: { type: 'blueRoomSupplier', isOpen: false },
  orangeRoomSupplier: { type: 'orangeRoomSupplier', isOpen: false },
  stepData: { type: 'stepData', isOpen: false },
  requisitesConfirmation: { type: 'requisitesConfirmation', isOpen: false },
  stage2Summary: { type: 'stage2Summary', isOpen: false },
  catalog: { type: 'catalog', isOpen: false },
  projectDetails: { type: 'projectDetails', isOpen: false },
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Record<ModalType, ModalState>>(initialModalState);

  const openModal = useCallback((type: ModalType, data?: any) => {
    setModals((prev) => ({
      ...prev,
      [type]: {
        type,
        isOpen: true,
        data,
      },
    }));
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModals((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        isOpen: false,
        data: undefined,
      },
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(initialModalState);
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
}
