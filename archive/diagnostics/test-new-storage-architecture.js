// Тест новой архитектуры хранения файлов аккредитации
const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase
const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewStorageArchitecture() {
  console.log('🧪 Тестирование новой архитектуры хранения файлов\n');

  try {
    // 1. Проверяем существование новых бакетов
    console.log('1️⃣ Проверка бакетов...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Ошибка получения бакетов:', bucketsError);
      return;
    }

    const requiredBuckets = ['project-images', 'accreditation-certificates', 'accreditation-documents'];
    const existingBuckets = buckets.map(b => b.name);
    
    console.log('📦 Найденные бакеты:', existingBuckets);
    
    for (const bucket of requiredBuckets) {
      if (existingBuckets.includes(bucket)) {
        console.log(`✅ Бакет "${bucket}" существует`);
      } else {
        console.log(`❌ Бакет "${bucket}" НЕ найден`);
      }
    }

    // 2. Проверяем структуру таблицы
    console.log('\n2️⃣ Проверка структуры таблицы...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('accreditation_applications')
      .select('documents_bucket, certificates_bucket, images_bucket')
      .limit(1);

    if (tableError) {
      console.error('❌ Ошибка получения информации о таблице:', tableError);
    } else {
      console.log('✅ Новые поля в таблице:', Object.keys(tableInfo[0] || {}));
    }

    // 3. Проверяем последние заявки
    console.log('\n3️⃣ Проверка последних заявок...');
    
    const { data: applications, error: appsError } = await supabase
      .from('accreditation_applications')
      .select('id, supplier_name, documents_bucket, certificates_bucket, images_bucket, legal_documents_count, certificates_count, products_count')
      .order('created_at', { ascending: false })
      .limit(5);

    if (appsError) {
      console.error('❌ Ошибка получения заявок:', appsError);
    } else {
      console.log(`📋 Найдено заявок: ${applications.length}`);
      
      applications.forEach((app, index) => {
        console.log(`\n📄 Заявка ${index + 1}:`);
        console.log(`   ID: ${app.id}`);
        console.log(`   Поставщик: ${app.supplier_name}`);
        console.log(`   Бакет документов: ${app.documents_bucket || 'НЕ УСТАНОВЛЕН'}`);
        console.log(`   Бакет сертификатов: ${app.certificates_bucket || 'НЕ УСТАНОВЛЕН'}`);
        console.log(`   Бакет изображений: ${app.images_bucket || 'НЕ УСТАНОВЛЕН'}`);
        console.log(`   Документов: ${app.legal_documents_count || 0}`);
        console.log(`   Сертификатов: ${app.certificates_count || 0}`);
        console.log(`   Товаров: ${app.products_count || 0}`);
      });
    }

    // 4. Тестируем загрузку файлов в новые бакеты
    console.log('\n4️⃣ Тест загрузки файлов в новые бакеты...');
    
    const testApplicationId = 'test-new-architecture-' + Date.now();
    
    // Тестовые данные
    const testImageContent = Buffer.from('Test image content');
    const testCertContent = Buffer.from('Test certificate content');
    const testDocContent = Buffer.from('Test legal document content');

    // Загружаем изображение в project-images
    const imagePath = `accreditation/${testApplicationId}/products/0/images/test_image.png`;
    const { data: imageUpload, error: imageError } = await supabase.storage
      .from('project-images')
      .upload(imagePath, testImageContent, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (imageError) {
      console.error('❌ Ошибка загрузки изображения:', imageError);
    } else {
      console.log('✅ Изображение загружено в project-images');
    }

    // Загружаем сертификат в accreditation-certificates
    const certPath = `accreditation/${testApplicationId}/products/0/certificates/test_certificate.pdf`;
    const { data: certUpload, error: certError } = await supabase.storage
      .from('accreditation-certificates')
      .upload(certPath, testCertContent, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (certError) {
      console.error('❌ Ошибка загрузки сертификата:', certError);
    } else {
      console.log('✅ Сертификат загружен в accreditation-certificates');
    }

    // Загружаем документ в accreditation-documents
    const docPath = `accreditation/${testApplicationId}/legal/test_document.pdf`;
    const { data: docUpload, error: docError } = await supabase.storage
      .from('accreditation-documents')
      .upload(docPath, testDocContent, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (docError) {
      console.error('❌ Ошибка загрузки документа:', docError);
    } else {
      console.log('✅ Документ загружен в accreditation-documents');
    }

    // 5. Проверяем публичные URL
    console.log('\n5️⃣ Проверка публичных URL...');
    
    if (!imageError) {
      const { data: imageUrl } = supabase.storage
        .from('project-images')
        .getPublicUrl(imagePath);
      console.log('🔗 URL изображения:', imageUrl.publicUrl);
    }

    if (!certError) {
      const { data: certUrl } = supabase.storage
        .from('accreditation-certificates')
        .getPublicUrl(certPath);
      console.log('🔗 URL сертификата:', certUrl.publicUrl);
    }

    if (!docError) {
      const { data: docUrl } = supabase.storage
        .from('accreditation-documents')
        .getPublicUrl(docPath);
      console.log('🔗 URL документа:', docUrl.publicUrl);
    }

    // 6. Очистка тестовых файлов
    console.log('\n6️⃣ Очистка тестовых файлов...');
    
    if (!imageError) {
      await supabase.storage.from('project-images').remove([imagePath]);
      console.log('🗑️ Тестовое изображение удалено');
    }
    
    if (!certError) {
      await supabase.storage.from('accreditation-certificates').remove([certPath]);
      console.log('🗑️ Тестовый сертификат удален');
    }
    
    if (!docError) {
      await supabase.storage.from('accreditation-documents').remove([docPath]);
      console.log('🗑️ Тестовый документ удален');
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запускаем тест
testNewStorageArchitecture(); 