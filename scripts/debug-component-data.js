#!/usr/bin/env node

/**
 * Отладка: проверяем точные данные которые приходят в компонент
 */

async function debug() {
  console.log('🔍 ОТЛАДКА ДАННЫХ КОМПОНЕНТА\n');

  // Запрос к API
  const response = await fetch('http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ?limit=1');
  const data = await response.json();

  if (!data.success || !data.products || data.products.length === 0) {
    console.error('❌ API не вернул товары');
    return;
  }

  const product = data.products[0];

  console.log('═'.repeat(80));
  console.log('ТОВАР:', product.product_name);
  console.log('═'.repeat(80));
  console.log('');

  // Проверяем поля
  console.log('📋 ПОЛЯ В ОБЪЕКТЕ PRODUCT:');
  console.log('');

  const imageFields = ['image_url', 'images', 'imageUrl', 'img'];
  imageFields.forEach(field => {
    if (field in product) {
      console.log(`  ✅ ${field.padEnd(15)}: ${JSON.stringify(product[field]).substring(0, 100)}`);
    } else {
      console.log(`  ❌ ${field.padEnd(15)}: ОТСУТСТВУЕТ`);
    }
  });

  console.log('');
  console.log('═'.repeat(80));
  console.log('ЛОГИКА КОМПОНЕНТА (строка 589-591):');
  console.log('═'.repeat(80));
  console.log('');

  const hasImageUrl = product.image_url;
  const hasImages = product.images && product.images.length > 0;
  const condition = hasImageUrl || hasImages;
  const srcValue = product.image_url || product.images?.[0] || '';

  console.log('Условие: (product.image_url || (product.images && product.images.length > 0))');
  console.log('  product.image_url:', hasImageUrl ? '✅ TRUE' : '❌ FALSE');
  console.log('  product.images?.length:', product.images?.length || 0);
  console.log('  РЕЗУЛЬТАТ условия:', condition ? '✅ TRUE (покажет <img>)' : '❌ FALSE (покажет placeholder)');
  console.log('');
  console.log('Значение src: product.image_url || product.images?.[0] || \'\'');
  console.log('  РЕЗУЛЬТАТ:', srcValue);
  console.log('');

  if (condition && srcValue) {
    console.log('✅ КОМПОНЕНТ ДОЛЖЕН ПОКАЗАТЬ КАРТИНКУ');
    console.log('');
    console.log('Тест загрузки URL:');

    try {
      const imgResponse = await fetch(srcValue, { method: 'HEAD' });
      console.log('  Status:', imgResponse.status, imgResponse.statusText);
      console.log('  Headers:');
      imgResponse.headers.forEach((value, key) => {
        console.log(`    ${key}: ${value}`);
      });

      if (imgResponse.ok) {
        console.log('');
        console.log('✅ URL ДОСТУПЕН! Картинка должна загрузиться.');
        console.log('');
        console.log('⚠️  ЕСЛИ КАРТИНКА НЕ ОТОБРАЖАЕТСЯ В UI:');
        console.log('    1. Откройте консоль браузера (F12)');
        console.log('    2. Ищите ошибки "ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА"');
        console.log('    3. Проверьте вкладку Network → Img');
        console.log('    4. Проверьте CSP заголовки');
      } else {
        console.log('');
        console.log(`❌ URL НЕДОСТУПЕН! Status: ${imgResponse.status}`);
      }
    } catch (error) {
      console.log('  ❌ Ошибка запроса:', error.message);
    }

  } else {
    console.log('❌ КОМПОНЕНТ ПОКАЖЕТ PLACEHOLDER');
    console.log('');
    console.log('ПРИЧИНА:');
    if (!hasImageUrl && !hasImages) {
      console.log('  • Отсутствуют оба поля: image_url и images');
    } else if (!srcValue) {
      console.log('  • src пустой');
    }
  }

  console.log('');
  console.log('═'.repeat(80));
  console.log('ПОЛНЫЙ JSON ТОВАРА:');
  console.log('═'.repeat(80));
  console.log(JSON.stringify(product, null, 2));
}

debug().catch(console.error);
