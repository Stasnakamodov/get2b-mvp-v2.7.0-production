"use client"

import React from 'react'
import { WaitingApprovalLoader, RejectionMessage } from '@/components/project-constructor/status/StatusLoaders'
import { PaymentForm } from '@/components/project-constructor/PaymentForm'
import { DealAnimation } from '@/components/project-constructor/DealAnimation'
import { ManagerReceiptSection } from '@/components/project-constructor/ManagerReceiptSection'
import { ClientReceiptUploadSection } from '@/components/project-constructor/ClientReceiptUploadSection'
import type { SupabaseClient } from '@supabase/supabase-js'

interface StageRouterProps {
  // Stage control
  currentStage: number
  setCurrentStage: (stage: number) => void

  // Stage 2 - Manager approval & Payment
  managerApprovalStatus: string | null
  setManagerApprovalStatus: React.Dispatch<React.SetStateAction<"pending" | "approved" | "rejected" | null>>
  managerApprovalMessage: string | null
  receiptApprovalStatus: string | null
  setReceiptApprovalStatus: React.Dispatch<React.SetStateAction<"pending" | "waiting" | "approved" | "rejected" | null>>
  projectRequestId: string
  manualData: Record<number, any>
  uploadSupplierReceipt: (file: File) => Promise<string | null>
  supabase: SupabaseClient
  POLLING_INTERVALS: { PROJECT_STATUS_CHECK: number }

  // Stage 3 - Deal animation & Manager receipt
  dealAnimationStep: number
  dealAnimationStatus: string
  dealAnimationComplete: boolean
  hasManagerReceipt: boolean
  managerReceiptUrl: string | null
  isRequestSent: boolean
  showFullLoader: boolean
  setShowFullLoader: (show: boolean) => void
  sendManagerReceiptRequest: () => Promise<void>

  // Stage 4 - Client receipt
  clientReceiptUrl: string | null
  clientReceiptUploadError: string | null
  isUploadingClientReceipt: boolean
  handleClientReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemoveClientReceipt: () => Promise<void>
  handleShowProjectDetails: () => Promise<void>

  // Stage 1 (default) - render children
  children: React.ReactNode
}

export const StageRouter: React.FC<StageRouterProps> = ({
  currentStage,
  setCurrentStage,
  managerApprovalStatus,
  setManagerApprovalStatus,
  managerApprovalMessage,
  receiptApprovalStatus,
  setReceiptApprovalStatus,
  projectRequestId,
  manualData,
  uploadSupplierReceipt,
  supabase,
  POLLING_INTERVALS,
  dealAnimationStep,
  dealAnimationStatus,
  dealAnimationComplete,
  hasManagerReceipt,
  managerReceiptUrl,
  isRequestSent,
  showFullLoader,
  setShowFullLoader,
  sendManagerReceiptRequest,
  clientReceiptUrl,
  clientReceiptUploadError,
  isUploadingClientReceipt,
  handleClientReceiptUpload,
  handleRemoveClientReceipt,
  handleShowProjectDetails,
  children
}) => {
  // Stage 2: Manager approval & Payment
  if (currentStage === 2) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-4">Этап 2: Подготовка инфраструктуры</div>
          <div className="text-sm text-gray-600 mb-4">
            Статус менеджера: {managerApprovalStatus || 'null'}
          </div>

          {managerApprovalStatus === 'pending' && (
            <WaitingApprovalLoader projectRequestId={projectRequestId} />
          )}

          {managerApprovalStatus === 'approved' && (
            <PaymentForm
              receiptApprovalStatus={receiptApprovalStatus}
              setReceiptApprovalStatus={setReceiptApprovalStatus}
              projectRequestId={projectRequestId}
              manualData={manualData}
              setCurrentStage={setCurrentStage}
              uploadSupplierReceipt={uploadSupplierReceipt}
              supabase={supabase}
              POLLING_INTERVALS={POLLING_INTERVALS}
            />
          )}

          {managerApprovalStatus === 'rejected' && (
            <RejectionMessage
              managerApprovalMessage={managerApprovalMessage || undefined}
              onRejectionReset={() => {
                setManagerApprovalStatus(null)
                setCurrentStage(1)
              }}
            />
          )}

          {!managerApprovalStatus && (
            <div className="text-red-500">
              Ошибка: статус менеджера не установлен
            </div>
          )}
        </div>
      </div>
    )
  }

  // Stage 3: Deal animation (before receipt approval)
  if (currentStage === 3 && receiptApprovalStatus !== 'approved') {
    return (
      <DealAnimation
        dealAnimationStep={dealAnimationStep}
        dealAnimationStatus={dealAnimationStatus}
        dealAnimationComplete={dealAnimationComplete}
      />
    )
  }

  // Stage 3: Manager receipt section (after receipt approval)
  if (currentStage === 3 && receiptApprovalStatus === 'approved') {
    return (
      <ManagerReceiptSection
        hasManagerReceipt={hasManagerReceipt}
        managerReceiptUrl={managerReceiptUrl}
        isRequestSent={isRequestSent}
        showFullLoader={showFullLoader}
        setShowFullLoader={setShowFullLoader}
        projectRequestId={projectRequestId}
        sendManagerReceiptRequest={sendManagerReceiptRequest}
        setCurrentStage={setCurrentStage}
      />
    )
  }

  // Stage 4: Client receipt upload
  if (currentStage === 4) {
    return (
      <ClientReceiptUploadSection
        clientReceiptUrl={clientReceiptUrl}
        clientReceiptUploadError={clientReceiptUploadError}
        isUploadingClientReceipt={isUploadingClientReceipt}
        handleClientReceiptUpload={handleClientReceiptUpload}
        handleRemoveClientReceipt={handleRemoveClientReceipt}
        handleShowProjectDetails={handleShowProjectDetails}
        setCurrentStage={setCurrentStage}
      />
    )
  }

  // Stage 1 (default): Render children (Step configuration area)
  return <>{children}</>
}
