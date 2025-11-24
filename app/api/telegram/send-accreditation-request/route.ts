import { NextRequest, NextResponse } from "next/server";
import { ChatBotService } from "@/lib/telegram/ChatBotService";

export async function POST(request: NextRequest) {
  try {

    const {
      applicationId,
      supplierName,
      companyName,
      category,
      country,
      productsCount,
      certificatesCount,
      legalDocumentsCount
    } = await request.json();

    // Валидация данных
    if (!applicationId || !supplierName || !companyName) {
      return NextResponse.json({ 
        error: "Недостаточно данных для отправки уведомления" 
      }, { status: 400 });
    }

    // Используем ChatBotService для отправки уведомления
    const chatBotService = new ChatBotService();
    
    await chatBotService.notifyAccreditationApplication({
      applicationId,
      supplierName,
      companyName,
      category: category || 'Не указана',
      country: country || 'Не указана',
      productsCount: productsCount || 0,
      certificatesCount: certificatesCount || 0,
      legalDocumentsCount: legalDocumentsCount || 0
    });

    return NextResponse.json({ success: true, message: "Уведомление отправлено" });

  } catch (error) {
    console.error("❌ Ошибка при отправке заявки в Telegram:", error);
    return NextResponse.json({ 
      error: "Ошибка при отправке уведомления",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 