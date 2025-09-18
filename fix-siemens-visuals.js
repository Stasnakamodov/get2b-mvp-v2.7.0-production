require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Скачано: ${filepath}`);
  return filepath;
}

async function uploadToSupabase(localPath, storagePath, bucket) {
  const fileBuffer = fs.readFileSync(localPath);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: localPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error(`❌ Ошибка загрузки ${storagePath}:`, error.message);
    return null;
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  console.log(`✅ Загружено в Supabase: ${publicUrl}`);
  return publicUrl;
}

async function fixSiemensVisuals() {
  try {
    console.log('🔧 ИСПРАВЛЕНИЕ ВИЗУАЛОВ SIEMENS INDUSTRIAL');
    console.log('=' .repeat(50));
    
    // 1. Получаем данные Siemens
    const { data: siemens, error } = await supabase
      .from('catalog_verified_suppliers')
      .select('*')
      .eq('name', 'Siemens Industrial')
      .single();
    
    if (error) throw error;
    
    console.log('📋 Найден поставщик:', siemens.name);
    console.log('ID:', siemens.id);
    
    // 2. Скачиваем и загружаем реальный логотип Siemens
    console.log('\n📥 Загружаем логотип Siemens...');
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/320px-Siemens-logo.svg.png';
    const logoPath = '/tmp/siemens-logo.png';
    await downloadImage(logoUrl, logoPath);
    
    const logoStoragePath = `siemens-logo-${Date.now()}.png`;
    const newLogoUrl = await uploadToSupabase(logoPath, logoStoragePath, 'supplier-logos');
    
    if (newLogoUrl) {
      // Обновляем URL логотипа в базе данных
      const { error: updateError } = await supabase
        .from('catalog_verified_suppliers')
        .update({ logo_url: newLogoUrl })
        .eq('id', siemens.id);
      
      if (updateError) {
        console.error('❌ Ошибка обновления логотипа в БД:', updateError.message);
      } else {
        console.log('✅ Логотип обновлен в базе данных');
      }
    }
    
    // 3. Получаем товары Siemens
    const { data: products, error: prodError } = await supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('supplier_id', siemens.id);
    
    if (prodError) throw prodError;
    
    console.log(`\n📦 Найдено товаров: ${products.length}`);
    
    // 4. Обновляем картинки товаров
    const productImages = {
      'SIMATIC S7-1500 CPU': 'https://media.rs-online.com/f_auto,q_auto,c_scale,w_500/https://res.cloudinary.com/rsonline/image/upload/v1678273433/160-2468_01.jpg',
      'SINAMICS G120C': 'https://media.distrelec.com/Web/WebShopImages/landscape_large/7-/01/Siemens-6SL3210-1KE11-8UP2-30081017.jpg',
      'SIMATIC HMI KTP700': 'https://media.distrelec.com/Web/WebShopImages/landscape_large/5-/01/Siemens-6AV2123-2GB03-0AX0-30120615.jpg',
      'SIRIUS 3RT2': 'https://media.distrelec.com/Web/WebShopImages/landscape_large/4-/01/Siemens-3RT2025-1BB40-30055414.jpg'
    };
    
    for (const product of products) {
      console.log(`\n🔧 Обрабатываем: ${product.name}`);
      
      // Находим подходящее изображение по ключевым словам в названии
      let imageUrl = null;
      for (const [key, url] of Object.entries(productImages)) {
        if (product.name.includes(key)) {
          imageUrl = url;
          break;
        }
      }
      
      if (!imageUrl) {
        // Используем общее изображение промышленного оборудования Siemens
        imageUrl = 'https://assets.new.siemens.com/siemens/assets/api/uuid:8e3cf513-0c05-4976-9f8f-29e5f91bb5dc/width:750/quality:high/simatic-s7-1500-cpu-1516-3-pn-dp-6es7516-3an02-0ab0.jpg';
      }
      
      const imagePath = `/tmp/siemens-product-${product.id}.jpg`;
      await downloadImage(imageUrl, imagePath);
      
      const storageFileName = `siemens-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
      const newImageUrl = await uploadToSupabase(imagePath, storageFileName, 'product-images');
      
      if (newImageUrl) {
        // Обновляем URL картинки в базе данных
        const { error: updateError } = await supabase
          .from('catalog_verified_products')
          .update({ images: [newImageUrl] })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ Ошибка обновления картинки товара ${product.name}:`, updateError.message);
        } else {
          console.log(`✅ Картинка товара обновлена`);
        }
      }
      
      // Очищаем временный файл
      fs.unlinkSync(imagePath);
    }
    
    // 5. Очищаем временный файл логотипа
    fs.unlinkSync(logoPath);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ВСЕ ВИЗУАЛЫ SIEMENS УСПЕШНО ИСПРАВЛЕНЫ!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

fixSiemensVisuals();