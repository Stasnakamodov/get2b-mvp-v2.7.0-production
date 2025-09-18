import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";

// POST: Подача заявки на аккредитацию поставщика (обновленная версия)
export async function POST(request: NextRequest) {
  try {
    // ВРЕМЕННО: Отключаем аутентификацию для тестирования
    const user = { id: "86cc190d-0c80-463b-b0df-39a25b22365f" };
    
    console.log("🌟 [API] Подача заявки на аккредитацию (новая версия)");

    // Определяем тип контента
    const contentType = request.headers.get('content-type') || '';
    let supplier_id: string;
    let supplier_type: string;
    let profile_data: any;
    let products: any[];
    let legal_confirmation: any;
    let formData: FormData | null = null;

    if (contentType.includes('multipart/form-data')) {
      // FormData (с файлами)
      formData = await request.formData();
      supplier_id = formData.get('supplier_id') as string;
      supplier_type = formData.get('supplier_type') as string;
      profile_data = JSON.parse(formData.get('profile_data') as string);
      products = JSON.parse(formData.get('products') as string);
      legal_confirmation = JSON.parse(formData.get('legal_confirmation') as string);
    } else {
      // JSON (без файлов, для тестирования)
      const jsonData = await request.json();
      supplier_id = jsonData.supplier_id;
      supplier_type = jsonData.supplier_type;
      profile_data = jsonData.profile_data;
      products = jsonData.products;
      legal_confirmation = jsonData.legal_confirmation;
    }

    // Проверяем и инициализируем данные
    if (!products) products = [];
    if (!profile_data) profile_data = {};
    if (!legal_confirmation) legal_confirmation = {};

    console.log("📋 [API] Данные заявки:", { 
      supplier_id, 
      supplier_type, 
      products_count: products.length,
      has_profile_data: !!profile_data,
      has_legal_confirmation: !!legal_confirmation
    });

    // Валидация данных
    if (!supplier_id || !supplier_type) {
      return NextResponse.json({ 
        error: "Не указан ID поставщика или тип" 
      }, { status: 400 });
    }

    // Проверяем минимальные требования
    if (!products || products.length < 1) {
      return NextResponse.json({ 
        error: "Необходимо добавить минимум 1 товар с сертификатами" 
      }, { status: 400 });
    }

    if (!legal_confirmation || !legal_confirmation.isLegalEntity || !legal_confirmation.hasRightToRepresent || !legal_confirmation.confirmAccuracy) {
      return NextResponse.json({ 
        error: "Необходимо подтвердить все условия" 
      }, { status: 400 });
    }

    // Проверяем, что поставщик принадлежит пользователю
    const { data: supplier, error: supplierError } = await supabaseService
      .from(supplier_type === 'profile' ? 'supplier_profiles' : 'catalog_user_suppliers')
      .select('*')
      .eq('id', supplier_id)
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ 
        error: "Поставщик не найден или нет доступа" 
      }, { status: 404 });
    }

    // Проверяем, нет ли уже активной заявки
    const { data: existingApplication } = await supabaseService
      .from('accreditation_applications')
      .select('id, status')
      .eq('supplier_id', supplier_id)
      .eq('supplier_type', supplier_type)
      .in('status', ['pending', 'in_review'])
      .single();

    if (existingApplication) {
      return NextResponse.json({ 
        error: "У данного поставщика уже есть активная заявка на аккредитацию" 
      }, { status: 409 });
    }

    // Обрабатываем файлы
    const productImageFiles: any[] = [];
    const certificateFiles: any[] = [];
    const legalDocumentFiles: any[] = [];

    // Обрабатываем файлы только если есть FormData
    if (formData) {
      // Получаем файлы изображений товаров
      products.forEach((product: any, pIndex: number) => {
        const imageCount = product.images ? product.images.length : 0;
        for (let iIndex = 0; iIndex < imageCount; iIndex++) {
          const file = formData!.get(`product_${pIndex}_image_${iIndex}`) as File;
          if (file) {
            productImageFiles.push({
              product_index: pIndex,
              image_index: iIndex,
              file: file,
              name: file.name,
              size: file.size,
              type: file.type
            });
          }
        }
      });

      // Получаем файлы сертификатов для товаров
      products.forEach((product: any, pIndex: number) => {
        const certCount = product.certificates.length;
        for (let cIndex = 0; cIndex < certCount; cIndex++) {
          const file = formData!.get(`product_${pIndex}_cert_${cIndex}`) as File;
          if (file) {
            certificateFiles.push({
              product_index: pIndex,
              cert_index: cIndex,
              file: file,
              name: file.name,
              size: file.size,
              type: file.type
            });
          }
        }
      });

      // Получаем юридические документы
      console.log("🔍 [API] Поиск юридических документов в FormData...");
      for (const [key, value] of formData!.entries()) {
        console.log(`📝 [API] FormData поле: ${key} = ${value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value}`);
        
        if (key.startsWith('legal_doc_') && !key.includes('_type') && !key.includes('_name')) {
          const index = key.split('_')[2];
          const type = formData!.get(`legal_doc_${index}_type`) as string;
          const name = formData!.get(`legal_doc_${index}_name`) as string;
          const file = value as File;
          
          console.log(`📄 [API] Найден юридический документ: index=${index}, type=${type}, name=${name}, file=${file.name}, size=${file.size}`);
          
          if (file && file.size > 0) {
            legalDocumentFiles.push({
              index: parseInt(index),
              type: type,
              name: name,
              file: file,
              fileName: file.name,
              size: file.size,
              fileType: file.type
            });
            console.log(`✅ [API] Юридический документ добавлен в список`);
          } else {
            console.log(`⚠️ [API] Файл пустой или отсутствует: ${file.name}, size=${file.size}`);
          }
        }
      }
    }

    // Временно сохраняем файлы для последующей загрузки
    const tempFiles = {
      product_images: productImageFiles,
      certificates: certificateFiles,
      legal_documents: legalDocumentFiles
    };

    console.log("📁 [API] Файлы:", { 
      product_images: productImageFiles.length,
      certificates: certificateFiles.length, 
      legal_docs: legalDocumentFiles.length 
    });

    // Создаем заявку на аккредитацию (без файлов)
    const applicationData = {
      user_id: user.id,
      supplier_id: supplier_id,
      supplier_type: supplier_type,
      supplier_name: profile_data.name || supplier.name,
      company_name: profile_data.company_name || supplier.company_name,
      category: profile_data.category || supplier.category,
      country: profile_data.country || supplier.country,
      status: 'pending',
      
      // Сохраняем обновленные данные профиля
      application_data: JSON.stringify({
        ...supplier,
        ...profile_data,
        updated_fields: Object.keys(profile_data).filter(key => 
          profile_data[key] !== supplier[key]
        )
      }),
      
      // Данные товаров (без файлов)
      products_data: JSON.stringify(products.map((product: any, index: number) => ({
        ...product,
        images_info: [],
        certificates_info: []
      }))),
      
      // Информация о юридических документах (без файлов)
      legal_documents_data: JSON.stringify([]),
      
      // Подтверждения
      legal_confirmation: JSON.stringify(legal_confirmation),
      
      // Счетчики для удобства поиска и фильтрации
      products_count: products.length,
      certificates_count: 0,
      legal_documents_count: 0,
      
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Временно отключаем RLS для тестирования
    const { data: application, error: applicationError } = await supabaseService
      .from('accreditation_applications')
      .insert([applicationData])
      .select()
      .single();

    if (applicationError) {
      console.error("❌ [API] Ошибка создания заявки:", applicationError);
      console.error("❌ [API] Детали ошибки:", {
        code: applicationError.code,
        message: applicationError.message,
        details: applicationError.details,
        hint: applicationError.hint
      });
      return NextResponse.json({ 
        error: "Ошибка создания заявки на аккредитацию",
        details: applicationError.message,
        code: applicationError.code,
        hint: applicationError.hint
      }, { status: 500 });
    }

    console.log("✅ [API] Заявка на аккредитацию создана:", application.id);

    // Сохраняем файлы в Supabase Storage после создания заявки
    const savedFiles: any = {
      product_images: [],
      certificates: [],
      legal_documents: []
    };

    if (formData) {
      console.log("📁 [API] Сохраняем файлы в Supabase Storage...");

      // Сохраняем изображения товаров
      for (const imageFile of tempFiles.product_images) {
        try {
          const fileName = `accreditation/${application.id}/products/${imageFile.product_index}/images/${Date.now()}_${imageFile.name}`;
          const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('project-images')
            .upload(fileName, imageFile.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("❌ [API] Ошибка загрузки изображения:", uploadError);
            continue;
          }

          // Получаем публичный URL
          const { data: urlData } = supabaseService.storage
            .from('project-images')
            .getPublicUrl(fileName);

          savedFiles.product_images.push({
            ...imageFile,
            storage_path: fileName,
            public_url: urlData.publicUrl
          });

          console.log("✅ [API] Изображение сохранено:", fileName);
        } catch (error) {
          console.error("❌ [API] Ошибка сохранения изображения:", error);
        }
      }

      // Сохраняем сертификаты товаров
      for (const certFile of tempFiles.certificates) {
        try {
          const fileName = `accreditation/${application.id}/products/${certFile.product_index}/certificates/${Date.now()}_${certFile.name}`;
          const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('accreditation-certificates')
            .upload(fileName, certFile.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("❌ [API] Ошибка загрузки сертификата:", uploadError);
            continue;
          }

          // Получаем публичный URL
          const { data: urlData } = supabaseService.storage
            .from('accreditation-certificates')
            .getPublicUrl(fileName);

          savedFiles.certificates.push({
            ...certFile,
            storage_path: fileName,
            public_url: urlData.publicUrl
          });

          console.log("✅ [API] Сертификат сохранен:", fileName);
        } catch (error) {
          console.error("❌ [API] Ошибка сохранения сертификата:", error);
        }
      }

      // Сохраняем юридические документы
      for (const docFile of tempFiles.legal_documents) {
        try {
          const fileName = `accreditation/${application.id}/legal/${Date.now()}_${docFile.fileName}`;
          const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('accreditation-documents')
            .upload(fileName, docFile.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("❌ [API] Ошибка загрузки документа:", uploadError);
            continue;
          }

          // Получаем публичный URL
          const { data: urlData } = supabaseService.storage
            .from('accreditation-documents')
            .getPublicUrl(fileName);

          savedFiles.legal_documents.push({
            ...docFile,
            storage_path: fileName,
            public_url: urlData.publicUrl
          });

          console.log("✅ [API] Документ сохранен:", fileName);
        } catch (error) {
          console.error("❌ [API] Ошибка сохранения документа:", error);
        }
      }

      // Обновляем заявку с URL файлов
      const updatedProductsData = JSON.parse(application.products_data).map((product: any, index: number) => ({
        ...product,
        images_info: savedFiles.product_images
          .filter((img: any) => img.product_index === index)
          .map((img: any) => ({
            name: img.name,
            size: img.size,
            type: img.type,
            public_url: img.public_url
          })),
        certificates_info: savedFiles.certificates
          .filter((cert: any) => cert.product_index === index)
          .map((cert: any) => ({
            name: cert.name,
            size: cert.size,
            type: cert.type,
            public_url: cert.public_url
          }))
      }));

      const updatedLegalDocumentsData = savedFiles.legal_documents.map((doc: any) => ({
        type: doc.type,
        name: doc.name,
        fileName: doc.fileName,
        size: doc.size,
        fileType: doc.fileType,
        public_url: doc.public_url
      }));

      // Обновляем заявку с URL файлов
      const { error: updateError } = await supabaseService
        .from('accreditation_applications')
        .update({
          products_data: JSON.stringify(updatedProductsData),
          legal_documents_data: JSON.stringify(updatedLegalDocumentsData),
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (updateError) {
        console.error("❌ [API] Ошибка обновления заявки с URL файлов:", updateError);
      } else {
        console.log("✅ [API] Заявка обновлена с URL файлов");
      }
    }

    // Обновляем данные поставщика из формы (если есть изменения)
    if (supplier_type === 'profile') {
      const updatedFields: any = {};
      Object.keys(profile_data).forEach(key => {
        if (profile_data[key] && profile_data[key] !== supplier[key]) {
          updatedFields[key] = profile_data[key];
        }
      });

      if (Object.keys(updatedFields).length > 0) {
        await supabaseService
          .from('supplier_profiles')
          .update({
            ...updatedFields,
            accreditation_status: 'pending',
            accreditation_application_id: application.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplier_id);
          
        console.log("📝 [API] Обновлены поля профиля:", Object.keys(updatedFields));
      } else {
        // Если нет изменений в профиле, просто обновляем статус аккредитации
        await supabaseService
          .from('supplier_profiles')
          .update({
            accreditation_status: 'pending',
            accreditation_application_id: application.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplier_id);
      }
    }

    // Отправляем уведомление менеджеру
    try {
      await fetch(`${request.nextUrl.origin}/api/telegram/send-accreditation-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          supplierName: profile_data.name || supplier.name,
          companyName: profile_data.company_name || supplier.company_name,
          category: profile_data.category || supplier.category,
          country: profile_data.country || supplier.country,
          productsCount: products.length,
          certificatesCount: certificateFiles.length,
          legalDocumentsCount: legalDocumentFiles.length
        })
      });
    } catch (telegramError) {
      console.error("⚠️ [API] Ошибка отправки Telegram уведомления:", telegramError);
      // Не прерываем процесс, если Telegram недоступен
    }

    return NextResponse.json({
      success: true,
      application_id: application.id,
      message: "Заявка на аккредитацию успешно подана",
      details: {
        products_count: products.length,
        product_images_count: productImageFiles.length,
        certificates_count: certificateFiles.length,
        legal_documents_count: legalDocumentFiles.length,
        profile_updated: Object.keys(profile_data).length > 0
      }
    });

  } catch (error) {
    console.error("❌ [API] Ошибка подачи заявки на аккредитацию:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера при подаче заявки на аккредитацию" 
    }, { status: 500 });
  }
} 