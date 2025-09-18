// ⚠️ ОБНОВЛЕНО: Теперь использует новый ManagerBotService
// Старые функции оставлены для обратной совместимости, но теперь они используют унифицированный сервис

import { ManagerBotService } from './telegram/ManagerBotService';

// Создаем единственный экземпляр сервиса менеджерского бота
let managerBotService: ManagerBotService | null = null;

function getManagerBotService(): ManagerBotService {
  if (!managerBotService) {
    try {
      managerBotService = new ManagerBotService();
    } catch (error) {
      console.warn("❌ Не удалось инициализировать ManagerBotService:", error);
      throw error;
    }
  }
  return managerBotService;
}

// ===============================
// ОБРАТНО-СОВМЕСТИМЫЕ ФУНКЦИИ
// ===============================

export async function sendTelegramMessage(text: string) {
  console.log("🔄 DEPRECATED: sendTelegramMessage - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    await service.sendMessage(text);
    console.log("✅ Сообщение отправлено через ManagerBotService");
  } catch (error) {
    console.error("❌ Ошибка при отправке сообщения:", error);
  }
}

export async function sendTelegramDocument(documentUrl: string, caption?: string) {
  console.log("🔄 DEPRECATED: sendTelegramDocument - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendDocument(documentUrl, caption);
    console.log("✅ Документ отправлен через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке документа:", error);
    throw error;
  }
}

export async function sendClientReceiptApprovalRequest(documentUrl: string, caption: string, projectRequestId: string) {
  console.log("🔄 sendClientReceiptApprovalRequest - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendClientReceiptApprovalRequest(documentUrl, caption, projectRequestId);
    console.log("✅ Чек клиента с кнопками отправлен через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке чека клиента:", error);
    throw error;
  }
}

export async function sendTelegramProjectApprovalRequest(
  text: string,
  projectId: string,
  type: "spec" | "receipt" = "spec",
) {
  console.log("🔄 DEPRECATED: sendTelegramProjectApprovalRequest - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendProjectApprovalRequest(text, projectId, type);
    console.log("✅ Запрос на одобрение отправлен через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке запроса:", error);
    throw error;
  }
}

export async function sendSupplierReceiptRequestToManager({
  projectId,
  email,
  companyName,
  amount,
  currency,
  paymentMethod,
  requisites,
}: {
  projectId: string;
  email: string;
  companyName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  requisites?: string;
}) {
  console.log("🔄 DEPRECATED: sendSupplierReceiptRequestToManager - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendSupplierReceiptRequest({
      projectId,
      email,
      companyName,
      amount,
      currency,
      paymentMethod,
      requisites
    });
    console.log("✅ Запрос на загрузку чека отправлен через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке запроса:", error);
    throw error;
  }
}

export async function sendClientConfirmationRequestToTelegram({
  projectId,
  email,
  companyName,
}: {
  projectId: string;
  email: string;
  companyName: string;
}) {
  console.log("🔄 DEPRECATED: sendClientConfirmationRequestToTelegram - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendClientConfirmationRequest({
      projectId,
      email,
      companyName
    });
    console.log("✅ Запрос на подтверждение отправлен через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке запроса:", error);
    throw error;
  }
}

export async function sendAccreditationRequestToTelegram({
  supplierId,
  supplierName,
  companyName,
  country,
  category,
  userEmail,
  notes,
  productsCount
}: {
  supplierId: string;
  supplierName: string;
  companyName: string;
  country: string;
  category: string;
  userEmail: string;
  notes?: string;
  productsCount: number;
}) {
  console.log("🔄 DEPRECATED: sendAccreditationRequestToTelegram - использует новый ManagerBotService");
  
  try {
    const service = getManagerBotService();
    const result = await service.sendAccreditationRequest({
      supplierId,
      supplierName,
      companyName,
      country,
      category,
      userEmail,
      notes,
      productsCount
    });
    console.log("✅ Заявка на аккредитацию отправлена через ManagerBotService");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке заявки:", error);
    throw error;
  }
}

/**
 * Отправляет уведомление о создании профиля клиента менеджеру
 */
export async function sendClientProfileNotificationToManager({
  userId,
  userName,
  userEmail,
  profileId,
  companyName,
  legalName,
  inn,
  kpp,
  ogrn,
  address,
  email,
  phone,
  bankName,
  bankAccount,
  corrAccount,
  bik
}: {
  userId: string;
  userName?: string;
  userEmail?: string;
  profileId: string;
  companyName: string;
  legalName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  corrAccount: string;
  bik: string;
}) {
  try {
    const service = getManagerBotService();
    const result = await service.sendClientProfileNotification({
      userId,
      userName,
      userEmail,
      profileId,
      companyName,
      legalName,
      inn,
      kpp,
      ogrn,
      address,
      email,
      phone,
      bankName,
      bankAccount,
      corrAccount,
      bik
    });
    console.log("✅ Уведомление о профиле клиента отправлено менеджеру");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке уведомления о профиле клиента:", error);
    throw error;
  }
}

/**
 * Отправляет уведомление о создании профиля поставщика менеджеру
 */
export async function sendSupplierProfileNotificationToManager({
  userId,
  userName,
  userEmail,
  profileId,
  companyName,
  category,
  country,
  city,
  description,
  contactEmail,
  contactPhone,
  website
}: {
  userId: string;
  userName?: string;
  userEmail?: string;
  profileId: string;
  companyName: string;
  category: string;
  country: string;
  city?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}) {
  try {
    const service = getManagerBotService();
    const result = await service.sendSupplierProfileNotification({
      userId,
      userName,
      userEmail,
      profileId,
      companyName,
      category,
      country,
      city,
      description,
      contactEmail,
      contactPhone,
      website
    });
    console.log("✅ Уведомление о профиле поставщика отправлено менеджеру");
    return { success: true, result };
  } catch (error) {
    console.error("❌ Ошибка при отправке уведомления о профиле поставщика:", error);
    throw error;
  }
}
