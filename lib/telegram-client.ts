// Клиентские функции для отправки запросов к API

export async function sendTelegramMessageClient(text: string) {
  try {
    console.log("🚀 Отправляем запрос в /api/telegram/send-message")
    console.log("📝 Текст сообщения:", text)

    const response = await fetch("/api/telegram/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    console.log("📡 Статус ответа:", response.status)
    console.log("📡 Статус OK:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Ошибка ответа:", errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ Результат:", result)
    console.log("✅ Сообщение отправлено в Telegram")
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

    console.log("✅ Запрос на одобрение отправлен в Telegram")
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

    console.log("✅ Документ отправлен в Telegram")
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
  console.log("🚀 [CLIENT] sendSupplierReceiptRequestToManagerClient вызвана с параметрами:", {
    projectId,
    email,
    companyName,
    amount,
    currency,
    paymentMethod,
    requisites
  });
  
  try {
    const requestBody = { projectId, email, companyName, amount, currency, paymentMethod, requisites };
    console.log("📦 [CLIENT] Отправляем тело запроса:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch("/api/telegram/send-supplier-receipt-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 [CLIENT] Статус ответа:", response.status);
    console.log("📡 [CLIENT] Статус OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [CLIENT] Ошибка ответа:", errorText);
      throw new Error("Failed to send supplier receipt request")
    }

    const result = await response.json();
    console.log("✅ [CLIENT] Результат:", result);
    console.log("✅ Запрос на загрузку чека отправлен менеджеру")
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
