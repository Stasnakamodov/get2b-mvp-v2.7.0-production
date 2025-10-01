// Modal Types for Project Constructor
export type ModalType =
  | 'preview'
  | 'echoData'
  | 'profileSelector'
  | 'supplierProfileSelector'
  | 'summary'
  | 'stageTransition'
  | 'blueRoomSupplier'
  | 'orangeRoomSupplier'
  | 'stepData'
  | 'requisitesConfirmation'
  | 'stage2Summary'
  | 'catalog'
  | 'projectDetails';

export interface ModalState {
  type: ModalType;
  isOpen: boolean;
  data?: any;
}

export interface ModalContextValue {
  modals: Record<ModalType, ModalState>;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: (type: ModalType) => void;
  closeAllModals: () => void;
}

// Modal Data Types
export interface PreviewModalData {
  type: 'company' | 'bank' | 'contacts' | 'product' | 'requisites';
  data: any;
}

export interface EchoDataModalData {
  show: boolean;
  supplierName: string;
  echoData: any;
  projectInfo: any;
}

export interface ProfileSelectorModalData {
  profiles: any[];
  onSelect: (profile: any) => void;
}

export interface SupplierProfileSelectorModalData {
  suppliers: any[];
  onSelect: (supplier: any) => void;
}

export interface SummaryModalData {
  stepConfigs: Record<number, string>;
  manualData: Record<number, any>;
  uploadedFiles: Record<number, string>;
}

export interface StageTransitionModalData {
  currentStage: number;
  nextStage: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface BlueRoomSupplierModalData {
  suppliers: any[];
  onSelect: (supplier: any) => void;
}

export interface OrangeRoomSupplierModalData {
  suppliers: any[];
  onSelect: (supplier: any) => void;
}

export interface StepDataModalData {
  step: number;
  data: any;
}

export interface RequisitesConfirmationModalData {
  requisites: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface Stage2SummaryModalData {
  stepConfigs: Record<number, string>;
  manualData: Record<number, any>;
  onConfirm: () => void;
}

export interface CatalogModalData {
  isOpen: boolean;
  onClose: () => void;
  onProductsSelect: (products: any[]) => void;
}

export interface ProjectDetailsModalData {
  projectId: string;
  projectData: any;
}
