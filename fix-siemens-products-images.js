require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        console.log(`✅ Скачано: ${filepath} (${stats.size} байт)`);
        
        if (stats.size === 0) {
          reject(new Error('Файл пустой!'));
        } else {
          resolve(filepath);
        }
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function uploadToSupabase(localPath, storagePath, bucket) {
  const stats = fs.statSync(localPath);
  if (stats.size === 0) {
    console.error(`❌ Файл пустой, пропускаем: ${localPath}`);
    return null;
  }
  
  const fileBuffer = fs.readFileSync(localPath);
  
  // Удаляем старый файл если существует
  await supabase.storage
    .from(bucket)
    .remove([storagePath]);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600'
    });

  if (error) {
    console.error(`❌ Ошибка загрузки ${storagePath}:`, error.message);
    return null;
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  console.log(`✅ Загружено в Supabase: ${publicUrl}`);
  return publicUrl;
}

async function fixSiemensProductImages() {
  try {
    console.log('🔧 ИСПРАВЛЕНИЕ КАРТИНОК ТОВАРОВ SIEMENS');
    console.log('=' .repeat(50));
    
    // Получаем данные Siemens
    const { data: siemens, error } = await supabase
      .from('catalog_verified_suppliers')
      .select('*')
      .eq('name', 'Siemens Industrial')
      .single();
    
    if (error) throw error;
    
    console.log('📋 Найден поставщик:', siemens.name);
    console.log('ID:', siemens.id);
    
    // Получаем товары Siemens
    const { data: products, error: prodError } = await supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('supplier_id', siemens.id);
    
    if (prodError) throw prodError;
    
    console.log(`\n📦 Найдено товаров: ${products.length}`);
    
    // Используем разные изображения для разных типов товаров
    const productImages = {
      'SIMATIC S7-1500': [
        'https://cdn.automation24.com/images/popup/6ES7513-1AL02-0AB0.png',
        'https://cdn.automation24.com/images/popup/6ES7515-2AM01-0AB0.png',
        'https://cdn.automation24.com/images/popup/6ES7516-3AN02-0AB0.png'
      ],
      'SINAMICS G120C': [
        'https://cdn.automation24.com/images/popup/6SL3210-1KE11-8UB2.png',
        'https://cdn.automation24.com/images/popup/6SL3210-1KE12-3UB2.png',
        'https://cdn.automation24.com/images/popup/6SL3210-1KE13-2UB2.png'
      ],
      'SIMATIC HMI KTP700': [
        'https://cdn.automation24.com/images/popup/6AV2123-2GB03-0AX0.png'
      ],
      'SIRIUS 3RT2': [
        'https://cdn.automation24.com/images/popup/3RT2026-1BB40.png'
      ]
    };
    
    let imageIndex = {
      'SIMATIC S7-1500': 0,
      'SINAMICS G120C': 0,
      'SIMATIC HMI KTP700': 0,
      'SIRIUS 3RT2': 0
    };
    
    for (const product of products) {
      console.log(`\n🔧 Обрабатываем: ${product.name}`);
      
      // Находим подходящее изображение
      let imageUrl = null;
      let imageKey = null;
      
      for (const key of Object.keys(productImages)) {
        if (product.name.includes(key)) {
          imageKey = key;
          const images = productImages[key];
          imageUrl = images[imageIndex[key] % images.length];
          imageIndex[key]++;
          break;
        }
      }
      
      if (!imageUrl) {
        // Используем общее изображение Siemens PLC
        imageUrl = 'https://cdn.automation24.com/images/popup/6ES7511-1AK02-0AB0.png';
      }
      
      console.log('📥 Загружаем изображение:', imageUrl);
      
      try {
        const imagePath = `/tmp/siemens-product-${product.id}.png`;
        await downloadImage(imageUrl, imagePath);
        
        // Проверяем размер файла
        const stats = fs.statSync(imagePath);
        if (stats.size === 0) {
          console.error('❌ Скачанный файл пустой, пробуем альтернативный URL');
          // Пробуем альтернативный URL
          imageUrl = 'https://cdn.automation24.com/images/popup/6ES7511-1AK02-0AB0.png';
          await downloadImage(imageUrl, imagePath);
        }
        
        const timestamp = Date.now();
        const storageFileName = `siemens-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.png`;
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
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (downloadError) {
        console.error(`❌ Ошибка загрузки изображения для ${product.name}:`, downloadError.message);
        
        // Используем запасное изображение из Unsplash
        try {
          console.log('🔄 Используем запасное изображение...');
          const fallbackUrl = 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80';
          const imagePath = `/tmp/siemens-product-fallback-${product.id}.jpg`;
          
          // Скачиваем с помощью curl
          const { execSync } = require('child_process');
          execSync(`curl -s -o ${imagePath} "${fallbackUrl}"`);
          
          const stats = fs.statSync(imagePath);
          if (stats.size > 0) {
            const timestamp = Date.now();
            const storageFileName = `siemens-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.jpg`;
            const newImageUrl = await uploadToSupabase(imagePath, storageFileName, 'product-images');
            
            if (newImageUrl) {
              const { error: updateError } = await supabase
                .from('catalog_verified_products')
                .update({ images: [newImageUrl] })
                .eq('id', product.id);
              
              if (!updateError) {
                console.log(`✅ Запасная картинка товара загружена`);
              }
            }
          }
          
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (fallbackError) {
          console.error('❌ Не удалось загрузить даже запасное изображение');
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 КАРТИНКИ ТОВАРОВ SIEMENS ИСПРАВЛЕНЫ!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

fixSiemensProductImages();