import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";
import {
  getYandexGPTService,
  YandexGPTUnavailableError,
  type ParsedInvoice,
} from "@/lib/services/YandexGPTService";
import { RussianCompanyExtractor } from "@/lib/ocr/RussianCompanyExtractor";

type InvoiceResult = ParsedInvoice & {
  llmUnavailable?: boolean;
  llmError?: "unavailable" | "failed";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, fileType, documentType } = body;

    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "fileUrl и fileType обязательны" },
        { status: 400 }
      );
    }

    const visionService = getYandexVisionService();
    const extractedText = await visionService.extractTextFromDocument(fileUrl, fileType);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Не удалось извлечь текст из документа",
        suggestions: {
          message:
            "Попробуйте загрузить документ в другом формате (JPG, PNG, DOCX) или убедитесь, что документ содержит читаемый текст",
          supportedFormats: ["JPG", "PNG", "PDF", "DOCX", "XLSX"],
        },
      });
    }

    const result: {
      success: true;
      extractedText: string;
      documentType: string;
      suggestions: Record<string, unknown>;
      llmUnavailable?: boolean;
      llmError?: "unavailable" | "failed";
    } = {
      success: true,
      extractedText,
      documentType,
      suggestions: {},
    };

    if (documentType === "company_card") {
      const extractor = new RussianCompanyExtractor();
      const extractedData = extractor.extractCompanyData(extractedText);
      result.suggestions = convertToLegacyFormat(extractedData);
    } else if (documentType === "invoice") {
      const invoiceResult = await extractInvoiceData(extractedText);
      const { llmUnavailable, llmError, ...suggestions } = invoiceResult;
      result.suggestions = suggestions;
      if (llmUnavailable) result.llmUnavailable = true;
      if (llmError) result.llmError = llmError;
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("❌ Ошибка в API document-analysis:", error);
    return NextResponse.json(
      {
        error: "Ошибка анализа документа",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Преобразует структурированный результат RussianCompanyExtractor в плоский формат,
 * который ожидает UI (Step1CompanyForm, useOcrUpload).
 */
function convertToLegacyFormat(extractedData: any): any {
  const legacy: any = {
    extractionInfo: {
      overallConfidence: extractedData.overallConfidence,
      extractedFields: extractedData.extractedFields,
      timestamp: new Date().toISOString(),
    },
  };

  if (extractedData.companyName) {
    legacy.companyName = extractedData.companyName.value;
    legacy.companyNameConfidence = extractedData.companyName.confidence;
  }

  if (extractedData.legalName) {
    legacy.legalName = extractedData.legalName.value;
    legacy.legalNameConfidence = extractedData.legalName.confidence;
  }

  if (extractedData.inn) {
    legacy.inn = extractedData.inn.value;
    legacy.innConfidence = extractedData.inn.confidence;
  }

  if (extractedData.kpp) {
    legacy.kpp = extractedData.kpp.value;
    legacy.kppConfidence = extractedData.kpp.confidence;
  }

  if (extractedData.ogrn) {
    legacy.ogrn = extractedData.ogrn.value;
    legacy.ogrnConfidence = extractedData.ogrn.confidence;
  }

  if (extractedData.bankName) {
    legacy.bankName = extractedData.bankName.value;
    legacy.bankNameConfidence = extractedData.bankName.confidence;
  }

  if (extractedData.bankAccount) {
    legacy.bankAccount = extractedData.bankAccount.value;
    legacy.bankAccountConfidence = extractedData.bankAccount.confidence;
  }

  if (extractedData.bankBik) {
    legacy.bankBik = extractedData.bankBik.value;
    legacy.bankBikConfidence = extractedData.bankBik.confidence;
  }

  if (extractedData.corrAccount) {
    legacy.bankCorrAccount = extractedData.corrAccount.value;
    legacy.bankCorrAccountConfidence = extractedData.corrAccount.confidence;
  }

  if (extractedData.phone) {
    legacy.phone = extractedData.phone.value;
    legacy.phoneConfidence = extractedData.phone.confidence;
  }

  if (extractedData.email) {
    legacy.email = extractedData.email.value;
    legacy.emailConfidence = extractedData.email.confidence;
  }

  if (extractedData.address) {
    legacy.address = extractedData.address.value;
    legacy.addressConfidence = extractedData.address.confidence;
  }

  if (extractedData.director) {
    legacy.director = extractedData.director.value;
    legacy.directorConfidence = extractedData.director.confidence;
  }

  return legacy;
}

/**
 * Извлекает структурированные данные инвойса из OCR-текста.
 *
 * Для XLSX-путей (вида "=== ЛИСТ: ...") используется табличный парсер, который отлично
 * справляется со структурой таблицы и не требует LLM. Для всех остальных форматов
 * (PDF, DOCX, фото) данные парсит YandexGPT.
 *
 * При недоступности / ошибке YandexGPT возвращается пустая структура с флагом
 * llmUnavailable — фронт покажет пользователю предупреждение и не будет скрывать проблему
 * regex-костылём.
 */
async function extractInvoiceData(text: string): Promise<InvoiceResult> {
  if (text.includes("=== ЛИСТ:")) {
    return extractInvoiceDataFromXlsx(text);
  }

  const startedAt = Date.now();
  try {
    const yandexGpt = getYandexGPTService();
    const parsed = await yandexGpt.parseInvoiceText(text);

    logger.info("✅ [document-analysis] YandexGPT invoice parsed", {
      latencyMs: Date.now() - startedAt,
      itemsFound: parsed.items.length,
      hasInvoiceInfo: Object.keys(parsed.invoiceInfo || {}).length > 0,
      hasBankInfo: !!parsed.bankInfo,
    });

    return parsed;
  } catch (error) {
    const isUnavailable = error instanceof YandexGPTUnavailableError;
    logger.error("❌ [document-analysis] YandexGPT invoice parse failed", {
      latencyMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
      unavailable: isUnavailable,
    });

    return {
      items: [],
      invoiceInfo: {},
      llmUnavailable: true,
      llmError: isUnavailable ? "unavailable" : "failed",
    };
  }
}

function extractInvoiceDataFromXlsx(text: string): InvoiceResult {
  const suggestions: any = {
    items: [],
    invoiceInfo: {},
  };

  const lines = text.split("\n");
  let inItemsSection = false;
  let itemCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("=== ЛИСТ:")) {
      continue;
    }

    if (line.includes("INV:") || line.includes("Счет") || line.includes("Invoice")) {
      const invMatch = line.match(/(?:INV:|Счет|Invoice)[:\s]*([A-Z0-9\-_\/]+)/i);
      if (invMatch && !suggestions.invoiceInfo.number) {
        suggestions.invoiceInfo.number = invMatch[1];
      }
    }

    if (line.includes("dd") && line.includes("2025")) {
      const dateMatch = line.match(/(\w+\s+\d{1,2}\s+\w+\s+\d{4})/);
      if (dateMatch && !suggestions.invoiceInfo.date) {
        suggestions.invoiceInfo.date = dateMatch[1];
      }
    }

    if (line.includes("Agent:") && line.includes("LLC")) {
      const sellerMatch = line.match(/Agent:\s*(.+?)(?:\s+based on|$)/);
      if (sellerMatch && !suggestions.invoiceInfo.seller) {
        suggestions.invoiceInfo.seller = sellerMatch[1].trim();
      }
    }
    if (line.includes("Buyer:") && line.includes("LLC")) {
      const buyerMatch = line.match(/Buyer:\s*(.+?)(?:\s*$)/);
      if (buyerMatch && !suggestions.invoiceInfo.buyer) {
        suggestions.invoiceInfo.buyer = buyerMatch[1].trim();
      }
    }

    if (line.includes("Total") || line.includes("Итого") || line.includes("Total,RMB")) {
      const totalMatch = line.match(/(?:Total|Итого)[:,]?\s*(\d+[.,]?\d*)/i);
      if (totalMatch && !suggestions.invoiceInfo.totalAmount) {
        suggestions.invoiceInfo.totalAmount = totalMatch[1];
        suggestions.invoiceInfo.currency = line.includes("RMB") ? "RMB" : "USD";
      }
    }

    if (line.includes("Total,RUB")) {
      const totalMatch = line.match(/Total,RUB\s*(\d+[.,]?\d*)/i);
      if (totalMatch && !suggestions.invoiceInfo.totalAmountRUB) {
        suggestions.invoiceInfo.totalAmountRUB = totalMatch[1];
      }
    }

    if (
      line.includes("Product description") ||
      line.includes("ITEM NUMBER") ||
      line.includes("QTY") ||
      line.includes("Price,RMB") ||
      line.includes("ITEM NUMBER |")
    ) {
      inItemsSection = true;
      continue;
    }

    if (
      inItemsSection &&
      (line.includes("Total:") || line.includes("Deposit(RMB):") || line.includes("Payment terms:"))
    ) {
      inItemsSection = false;
      continue;
    }

    if (inItemsSection && line.includes("|")) {
      const parts = line
        .split("|")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      // ПРИОРИТЕТ 1: Формат 3 — Номер | Код | Название | Количество | Цена | Сумма (6 колонок)
      if (parts.length >= 6 && line.match(/^\d+\s+\|/)) {
        const itemNumber = parts[0];
        const itemCode = parts[1];
        const itemName = parts[2];
        const quantityStr = parts[3];
        const priceStr = parts[4];
        const totalStr = parts[5] || "";

        if (itemNumber && !isNaN(parseInt(itemNumber)) && itemCode && itemCode.trim().length > 0) {
          const quantity = parseInt(quantityStr.replace(/[^\d]/g, ""));
          const price = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
          const total = totalStr
            ? parseFloat(totalStr.replace(/[^\d.,]/g, "").replace(",", "."))
            : quantity * price;

          if (quantity && price && itemName && itemName.trim().length > 2) {
            suggestions.items.push({
              name: itemName.trim(),
              quantity,
              price,
              total,
              code: itemCode || `ITEM-${++itemCount}`,
              unit: "шт",
            });
          }
        }
      }
      // ПРИОРИТЕТ 2: Формат 1 — Product description | Quantity | Price | Total (3–4 колонки)
      else if (parts.length >= 3 && parts.length < 6 && !line.match(/^(Product|ITEM|QTY|Price|Total)/i)) {
        const itemName = parts[0];
        const quantityStr = parts[1];
        const priceStr = parts[2];
        const totalStr = parts[3] || "";

        if (itemName && itemName.length > 5 && !itemName.match(/^(Product|ITEM|QTY|Price|Total)/i)) {
          const quantity = parseInt(quantityStr.replace(/[^\d]/g, ""));
          const price = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
          const total = totalStr
            ? parseFloat(totalStr.replace(/[^\d.,]/g, "").replace(",", "."))
            : quantity * price;

          if (quantity && price && itemName.length > 5) {
            suggestions.items.push({
              name: itemName.trim(),
              quantity,
              price,
              total,
              code: `ITEM-${++itemCount}`,
              unit: "шт",
            });
          }
        }
      }
      // Формат 2: ITEM NUMBER | CODE | NAME | QTY | PRICE | TOTAL
      else if (parts.length >= 4 && line.match(/^\d+\s+\|/)) {
        const itemNumber = parts[0];
        const itemCode = parts[1];
        const itemName = parts[2];
        const quantityStr = parts[3];
        const priceStr = parts[4];
        const totalStr = parts[5] || "";

        if (itemNumber && !isNaN(parseInt(itemNumber))) {
          const quantity = parseInt(quantityStr.replace(/[^\d]/g, ""));
          const price = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
          const total = totalStr
            ? parseFloat(totalStr.replace(/[^\d.,]/g, "").replace(",", "."))
            : quantity * price;

          if (quantity && price && itemName && itemName.length > 2) {
            suggestions.items.push({
              name: itemName.trim(),
              quantity,
              price,
              total,
              code: itemCode || `ITEM-${++itemCount}`,
              unit: "шт",
            });
          }
        }
      }
    }
  }

  const extractedBankRequisites = extractBankRequisitesFromInvoice(text);
  if (extractedBankRequisites.hasRequisites) {
    suggestions.bankInfo = extractedBankRequisites;
  }

  return suggestions;
}

function extractBankRequisitesFromInvoice(text: string) {
  const requisites = {
    bankName: "",
    accountNumber: "",
    swift: "",
    recipientName: "",
    recipientAddress: "",
    transferCurrency: "",
    hasRequisites: false,
  };

  const accountPatterns = [
    /USD\s*A\/C\s*NO\.?\s*\([^)]*\)\s*:?\s*(\d+)/i,
    /EUR\s*A\/C\s*NO\.?\s*\([^)]*\)\s*:?\s*(\d+)/i,
    /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /Account\s*Number\s*:?\s*(\d+)/i,
    /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /Номер\s*счета\s*:?\s*(\d+)/i,
    /A\/C\s*No:\s*([A-Z0-9]+)/i,
    /Account\s*No:\s*([A-Z0-9]+)/i,
  ];

  for (const pattern of accountPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.accountNumber = match[1];
      break;
    }
  }

  const swiftPatterns = [
    /SWIF\s*CODE\s*\(\)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIFT\s*CODE\s*\(\)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIFT\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIFT\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /BIC\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIF\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
  ];

  for (const pattern of swiftPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.swift = match[1];
      break;
    }
  }

  const bankNamePatterns = [
    /BANK\s*NAME\s*\(银行名称\)\s*:?\s*([^\n]+)/i,
    /BANK\s*NAME\s*:?\s*([^\n]+)/i,
    /BANK\s*OF\s*([^\n]+)/i,
    /([A-Z\s]+BANK[A-Z\s]*)/i,
    /([A-Z\s]+BANK\s+OF\s+[A-Z\s]+)/i,
    /Sellers\s*Bank:\s*([^\n]+)/i,
    /Bank\s*address:\s*([^\n]+)/i,
  ];

  for (const pattern of bankNamePatterns) {
    const match = text.match(pattern);
    if (match) {
      let bankName = match[1].trim();
      bankName = bankName.replace(/^[^a-zA-Z]*/, "").replace(/[^a-zA-Z\s]*$/, "").trim();
      if (bankName.length > 3) {
        requisites.bankName = bankName;
        break;
      }
    }
  }

  const recipientPatterns = [
    /ACCOUNT\s*NAME\s*\(账户名称\)\s*:?\s*([^\n]+)/i,
    /ACCOUNT\s*NAME\s*:?\s*([^\n]+)/i,
    /BENEFICIARY\s*NAME\s*:?\s*([^\n]+)/i,
    /Получатель\s*:?\s*([^\n]+)/i,
  ];

  for (const pattern of recipientPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.recipientName = match[1].trim();
      break;
    }
  }

  const addressPatterns = [
    /BENEFICIARY'?S?\s*ADDRESS\s*\(收款人地址\)\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /BENEFICIARY'?S?\s*ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /Адрес\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      let address = match[1].trim();
      address = cleanAddressFromProductData(address);
      if (address) {
        requisites.recipientAddress = address;
        break;
      }
    }
  }

  if (text.includes("USD A/C NO.") || text.includes("USD")) {
    requisites.transferCurrency = "USD";
  } else if (text.includes("EUR A/C NO.") || text.includes("EUR")) {
    requisites.transferCurrency = "EUR";
  }

  requisites.hasRequisites = !!(
    requisites.accountNumber ||
    requisites.swift ||
    requisites.recipientName
  );

  return requisites;
}

function cleanAddressFromProductData(address: string): string {
  const lines = address.split("\n");
  const cleanLines = lines.filter((line) => {
    const trimmedLine = line.trim();

    if (
      trimmedLine.includes("Product description") ||
      trimmedLine.includes("Quantity, psc") ||
      trimmedLine.includes("Price, RMB") ||
      trimmedLine.includes("Total, RMB") ||
      (trimmedLine.includes("|") && trimmedLine.includes("RMB")) ||
      trimmedLine.match(/^\d+[.,]\d+$/) ||
      (trimmedLine.match(/^\d+$/) && trimmedLine.length > 8)
    ) {
      return false;
    }

    return true;
  });

  return cleanLines.join("\n").trim();
}
