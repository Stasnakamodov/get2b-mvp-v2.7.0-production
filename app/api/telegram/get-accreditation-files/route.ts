import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получить файлы заявки на аккредитацию
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const fileType = searchParams.get('type'); // 'products', 'certificates', 'documents'
    const productIndex = searchParams.get('productIndex');
    const fileIndex = searchParams.get('fileIndex');

    if (!applicationId) {
      return NextResponse.json({ 
        error: "Не указан ID заявки" 
      }, { status: 400 });
    }

    console.log("🔍 [API] Получение файлов заявки:", { 
      applicationId, 
      fileType, 
      productIndex, 
      fileIndex 
    });

    // Получаем данные заявки
    const { data: application, error } = await supabase
      .from('accreditation_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json({ 
        error: "Заявка не найдена" 
      }, { status: 404 });
    }

    // Парсим данные товаров
    let productsData = [];
    if (application.products_data) {
      try {
        productsData = typeof application.products_data === 'string' 
          ? JSON.parse(application.products_data) 
          : application.products_data;
      } catch (parseError) {
        console.error('Ошибка парсинга products_data:', parseError);
        return NextResponse.json({ 
          error: "Ошибка чтения данных товаров" 
        }, { status: 500 });
      }
    }

    // Парсим данные юридических документов
    let legalDocumentsData = [];
    if (application.legal_documents_data) {
      try {
        legalDocumentsData = typeof application.legal_documents_data === 'string' 
          ? JSON.parse(application.legal_documents_data) 
          : application.legal_documents_data;
      } catch (parseError) {
        console.error('Ошибка парсинга legal_documents_data:', parseError);
      }
    }

    // Формируем ответ в зависимости от типа запроса
    let responseData: any = {};

    switch (fileType) {
      case 'products':
        // Возвращаем информацию о товарах с изображениями
        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          products: productsData.map((product: any, index: number) => ({
            index,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            currency: product.currency,
            images: product.images_info || [],
            certificates: product.certificates_info || []
          }))
        };
        break;

      case 'certificates':
        // Возвращаем все сертификаты
        const allCertificates: Array<{
          productIndex: number;
          productName: string;
          certIndex: number;
          name: string;
          size: number;
          type: string;
        }> = [];
        productsData.forEach((product: any, productIndex: number) => {
          if (product.certificates_info) {
            product.certificates_info.forEach((cert: any, certIndex: number) => {
              allCertificates.push({
                productIndex,
                productName: product.name,
                certIndex,
                name: cert.name,
                size: cert.size,
                type: cert.type
              });
            });
          }
        });
        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          certificates: allCertificates
        };
        break;

      case 'documents':
        // Возвращаем юридические документы
        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          documents: legalDocumentsData.map((doc: any, index: number) => ({
            index,
            type: doc.type,
            name: doc.name,
            fileName: doc.fileName,
            size: doc.size,
            fileType: doc.fileType
          }))
        };
        break;

      case 'product_images':
        // Возвращаем изображения конкретного товара
        if (productIndex === null) {
          return NextResponse.json({ 
            error: "Не указан индекс товара" 
          }, { status: 400 });
        }
        
        const product = productsData[parseInt(productIndex)];
        if (!product) {
          return NextResponse.json({ 
            error: "Товар не найден" 
          }, { status: 404 });
        }

        console.log("🔍 DEBUG: Данные товара для изображений:", {
          productName: product.name,
          imagesInfo: product.images_info,
          imagesCount: product.images_info ? product.images_info.length : 0
        });

        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          productName: product.name,
          productIndex: parseInt(productIndex),
          images: product.images_info || []
        };
        
        console.log("🔍 DEBUG: Ответ для изображений товара:", JSON.stringify(responseData, null, 2));
        break;

      case 'product_certificates':
        // Возвращаем сертификаты конкретного товара
        if (productIndex === null) {
          return NextResponse.json({ 
            error: "Не указан индекс товара" 
          }, { status: 400 });
        }
        
        const productForCerts = productsData[parseInt(productIndex)];
        if (!productForCerts) {
          return NextResponse.json({ 
            error: "Товар не найден" 
          }, { status: 404 });
        }

        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          productName: productForCerts.name,
          productIndex: parseInt(productIndex),
          certificates: productForCerts.certificates_info || []
        };
        break;

      default:
        // Возвращаем общую информацию о файлах
        const totalImages = productsData.reduce((sum: number, product: any) => 
          sum + (product.images_info ? product.images_info.length : 0), 0
        );
        const totalCertificates = productsData.reduce((sum: number, product: any) => 
          sum + (product.certificates_info ? product.certificates_info.length : 0), 0
        );

        responseData = {
          applicationId,
          supplierName: application.supplier_name,
          summary: {
            products: productsData.length,
            totalImages,
            totalCertificates,
            totalDocuments: legalDocumentsData.length
          },
          products: productsData.map((product: any, index: number) => ({
            index,
            name: product.name,
            imagesCount: product.images_info ? product.images_info.length : 0,
            certificatesCount: product.certificates_info ? product.certificates_info.length : 0
          }))
        };
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("❌ [API] Ошибка получения файлов заявки:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 