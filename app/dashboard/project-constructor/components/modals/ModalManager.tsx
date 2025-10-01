'use client';

import React from 'react';
import { useModals } from './ModalContext';
import PreviewModal from './PreviewModal';
import ProfileSelectorModal from './ProfileSelectorModal';
import SummaryModal from './SummaryModal';
import StageTransitionModal from './StageTransitionModal';
import BlueRoomSupplierModal from './BlueRoomSupplierModal';
import OrangeRoomSupplierModal from './OrangeRoomSupplierModal';
import StepDataModal from './StepDataModal';
import RequisitesConfirmationModal from './RequisitesConfirmationModal';
import Stage2SummaryModal from './Stage2SummaryModal';

interface ModalManagerProps {
  // PreviewModal props
  handleEditData: (type: any) => void;

  // ProfileSelectorModal props
  clientProfiles: any[] | null;
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onApplyProfile: () => Promise<void>;

  // SummaryModal props
  manualData: Record<number, any>;
  stepConfigs: Record<number, string>;
  getSourceDisplayName: (source: string) => string;
  returnToStage1Editing: () => void;
  goToNextStage: () => void;

  // StageTransitionModal props
  currentStage: number;
  nextStage: number;
  dontShowStageTransition: boolean;
  setDontShowStageTransition: (value: boolean) => void;
  proceedToNextStage: () => void;

  // BlueRoomSupplierModal props
  blueRoomSuppliers: any[];
  blueRoomLoading: boolean;
  catalogSourceStep: number;
  handleSelectBlueRoomSupplier: (supplier: any) => void;

  // OrangeRoomSupplierModal props
  orangeRoomSuppliers: any[];
  orangeRoomLoading: boolean;
  handleSelectOrangeRoomSupplier: (supplier: any) => void;

  // StepDataModal props (none needed - uses modal.data)

  // RequisitesConfirmationModal props
  editRequisites: () => void;
  confirmRequisites: () => void;

  // Stage2SummaryModal props
  proceedToStage3: () => void;
}

export default function ModalManager(props: ModalManagerProps) {
  const { modals, closeModal } = useModals();

  return (
    <>
      {/* Preview Modal */}
      <PreviewModal
        isOpen={modals.preview.isOpen}
        onClose={() => closeModal('preview')}
        previewType={modals.preview.data?.previewType || null}
        previewData={modals.preview.data?.previewData}
        handleEditData={props.handleEditData}
      />

      {/* Profile Selector Modal */}
      <ProfileSelectorModal
        isOpen={modals.profileSelector.isOpen}
        onClose={() => closeModal('profileSelector')}
        clientProfiles={props.clientProfiles}
        selectedProfileId={props.selectedProfileId}
        onSelectProfile={props.onSelectProfile}
        onApplyProfile={props.onApplyProfile}
      />

      {/* Summary Modal */}
      <SummaryModal
        isOpen={modals.summary.isOpen}
        onClose={() => closeModal('summary')}
        manualData={props.manualData}
        stepConfigs={props.stepConfigs}
        getSourceDisplayName={props.getSourceDisplayName}
        returnToStage1Editing={props.returnToStage1Editing}
        goToNextStage={props.goToNextStage}
      />

      {/* Stage Transition Modal */}
      <StageTransitionModal
        isOpen={modals.stageTransition.isOpen}
        onClose={() => closeModal('stageTransition')}
        currentStage={props.currentStage}
        nextStage={props.nextStage}
        dontShowStageTransition={props.dontShowStageTransition}
        setDontShowStageTransition={props.setDontShowStageTransition}
        proceedToNextStage={props.proceedToNextStage}
      />

      {/* Blue Room Supplier Modal */}
      <BlueRoomSupplierModal
        isOpen={modals.blueRoomSupplier.isOpen}
        onClose={() => closeModal('blueRoomSupplier')}
        blueRoomSuppliers={props.blueRoomSuppliers}
        blueRoomLoading={props.blueRoomLoading}
        catalogSourceStep={props.catalogSourceStep}
        handleSelectBlueRoomSupplier={props.handleSelectBlueRoomSupplier}
      />

      {/* Orange Room Supplier Modal */}
      <OrangeRoomSupplierModal
        isOpen={modals.orangeRoomSupplier.isOpen}
        onClose={() => closeModal('orangeRoomSupplier')}
        orangeRoomSuppliers={props.orangeRoomSuppliers}
        orangeRoomLoading={props.orangeRoomLoading}
        catalogSourceStep={props.catalogSourceStep}
        handleSelectOrangeRoomSupplier={props.handleSelectOrangeRoomSupplier}
      />

      {/* Step Data Modal */}
      <StepDataModal
        isOpen={modals.stepData.isOpen}
        onClose={() => closeModal('stepData')}
        stepDataToView={modals.stepData.data?.stepDataToView}
      />

      {/* Requisites Confirmation Modal */}
      <RequisitesConfirmationModal
        isOpen={modals.requisitesConfirmation.isOpen}
        onClose={() => closeModal('requisitesConfirmation')}
        manualData={props.manualData}
        editRequisites={props.editRequisites}
        confirmRequisites={props.confirmRequisites}
      />

      {/* Stage 2 Summary Modal */}
      <Stage2SummaryModal
        isOpen={modals.stage2Summary.isOpen}
        onClose={() => closeModal('stage2Summary')}
        manualData={props.manualData}
        proceedToStage3={props.proceedToStage3}
      />
    </>
  );
}
