// Клиентские функции для отправки запросов к API

export async function sendTelegramMessageClient(text: string) {
  try {

    const response = await fetch("/api/telegram/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })


    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Ошибка ответа:", errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("❌ Ошибка отправки сообщения в Telegram:", error)
    throw error
  }
}

export async function sendTelegramProjectApprovalRequestClient(
  text: string,
  projectId: string,
  type: "spec" | "receipt" | "invoice" = "spec",
) {
  try {
    const response = await fetch("/api/telegram/send-project-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, projectId, type }),
    })

    if (!response.ok) {
      throw new Error("Failed to send approval request")
    }

    return await response.json()
  } catch (error) {
    console.error("❌ Ошибка отправки запроса на одобрение в Telegram:", error)
    throw error
  }
}

export async function sendTelegramDocumentClient(documentUrl: string, caption?: string) {
  try {
    const response = await fetch("/api/telegram/send-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentUrl, caption }),
    })

    if (!response.ok) {
      throw new Error("Failed to send document")
    }

    return await response.json()
  } catch (error) {
    console.error("❌ Ошибка отправки документа в Telegram:", error)
    throw error
  }
}

export async function sendSupplierReceiptRequestToManagerClient({
  projectId,
  email,
  companyName,
  amount,
  currency,
  paymentMethod,
  requisites,
}: {
  projectId: string
  email: string
  companyName: string
  amount: number
  currency: string
  paymentMethod: string
  requisites?: string
}) {
  try {
    const requestBody = { projectId, email, companyName, amount, currency, paymentMethod, requisites };
    
    const response = await fetch("/api/telegram/send-supplier-receipt-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })


    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [CLIENT] Ошибка ответа:", errorText);
      throw new Error("Failed to send supplier receipt request")
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Ошибка отправки запроса на загрузку чека:", error)
    throw error
  }
}

export async function sendClientConfirmationRequestToTelegramClient({
  projectId,
  email,
  companyName,
}: {
  projectId: string
  email: string
  companyName: string
}) {
  const response = await fetch("/api/telegram/send-client-confirmation-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, email, companyName }),
  })
  if (!response.ok) throw new Error("Failed to send client confirmation request")
  return await response.json()
}

export async function sendClientProfileNotificationClient({
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
  bik,
}: {
  userId: string
  userName?: string
  userEmail?: string
  profileId: string
  companyName: string
  legalName: string
  inn: string
  kpp: string
  ogrn: string
  address: string
  email: string
  phone: string
  bankName: string
  bankAccount: string
  corrAccount: string
  bik: string
}) {
  try {
    const response = await fetch("/api/telegram/send-profile-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "client",
        userId, userName, userEmail, profileId, companyName, legalName, inn, kpp, ogrn, address, email, phone, bankName, bankAccount, corrAccount, bik,
      }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("❌ Ошибка отправки уведомления о профиле клиента:", error)
    throw error
  }
}

export async function sendSupplierProfileNotificationClient({
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
  website,
}: {
  userId: string
  userName?: string
  userEmail?: string
  profileId: string
  companyName: string
  category: string
  country: string
  city?: string
  description?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
}) {
  try {
    const response = await fetch("/api/telegram/send-profile-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "supplier",
        userId, userName, userEmail, profileId, companyName, category, country, city, description, contactEmail, contactPhone, website,
      }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("❌ Ошибка отправки уведомления о профиле поставщика:", error)
    throw error
  }
}
