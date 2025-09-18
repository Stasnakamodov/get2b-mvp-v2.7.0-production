require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

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
      contentType: localPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
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

async function fixBrokenLogos() {
  try {
    console.log('🔧 ИСПРАВЛЕНИЕ СЛОМАННЫХ ЛОГОТИПОВ');
    console.log('=' .repeat(50));
    
    const companyLogos = {
      'HeidelbergCement': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/HeidelbergCement_logo.svg/320px-HeidelbergCement_logo.svg.png',
      'Foxconn Technology Group': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Foxconn_logo.svg/320px-Foxconn_logo.svg.png'
    };
    
    for (const [companyName, logoUrl] of Object.entries(companyLogos)) {
      console.log(`\n🔧 Исправляем логотип: ${companyName}`);
      
      // Получаем данные поставщика
      const { data: supplier, error } = await supabase
        .from('catalog_verified_suppliers')
        .select('*')
        .eq('name', companyName)
        .single();
      
      if (error) {
        console.error(`❌ Поставщик ${companyName} не найден:`, error.message);
        continue;
      }
      
      console.log(`📋 Найден поставщик ID: ${supplier.id}`);
      
      try {
        // Скачиваем логотип
        const logoPath = `/tmp/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-logo.png`;
        console.log(`📥 Скачиваем логотип с: ${logoUrl}`);
        await downloadImage(logoUrl, logoPath);
        
        // Загружаем в Supabase
        const timestamp = Date.now();
        const storageFileName = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-logo-${timestamp}.png`;
        const newLogoUrl = await uploadToSupabase(logoPath, storageFileName, 'supplier-logos');
        
        if (newLogoUrl) {
          // Обновляем URL в базе данных
          const { error: updateError } = await supabase
            .from('catalog_verified_suppliers')
            .update({ logo_url: newLogoUrl })
            .eq('id', supplier.id);
          
          if (updateError) {
            console.error(`❌ Ошибка обновления логотипа в БД для ${companyName}:`, updateError.message);
          } else {
            console.log(`✅ Логотип ${companyName} обновлен в базе данных`);
          }
        }
        
        // Очищаем временный файл
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
        
      } catch (downloadError) {
        console.error(`❌ Ошибка загрузки логотипа для ${companyName}:`, downloadError.message);
        
        // Пробуем альтернативный источник
        try {
          console.log('🔄 Используем альтернативный источник...');
          const fallbackUrl = 'https://via.placeholder.com/200x80/0066cc/ffffff?text=' + encodeURIComponent(companyName.substring(0, 10));
          const logoPath = `/tmp/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fallback.png`;
          
          // Скачиваем с помощью curl
          const { execSync } = require('child_process');
          execSync(`curl -s -o ${logoPath} "${fallbackUrl}"`);
          
          const stats = fs.statSync(logoPath);
          if (stats.size > 0) {
            const timestamp = Date.now();
            const storageFileName = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-logo-${timestamp}.png`;
            const newLogoUrl = await uploadToSupabase(logoPath, storageFileName, 'supplier-logos');
            
            if (newLogoUrl) {
              const { error: updateError } = await supabase
                .from('catalog_verified_suppliers')
                .update({ logo_url: newLogoUrl })
                .eq('id', supplier.id);
              
              if (!updateError) {
                console.log(`✅ Альтернативный логотип ${companyName} загружен`);
              }
            }
          }
          
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
          }
        } catch (fallbackError) {
          console.error(`❌ Не удалось загрузить даже альтернативный логотип для ${companyName}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 СЛОМАННЫЕ ЛОГОТИПЫ ИСПРАВЛЕНЫ!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

fixBrokenLogos();