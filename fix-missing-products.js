console.log('🔧 ИСПРАВЛЕНИЕ ОТСУТСТВУЮЩИХ ТОВАРОВ');
console.log('===================================');

async function fixMissingProducts() {
    const baseUrl = 'http://localhost:3000';
    
    try {
        console.log('\n1️⃣ ПОЛУЧЕНИЕ ИМПОРТИРОВАННЫХ ПОСТАВЩИКОВ БЕЗ ТОВАРОВ');
        
        // Получаем всех импортированных поставщиков
        const userSuppliersResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_user_suppliers`);
        const userSuppliers = await userSuppliersResponse.json();
        
        const importedSuppliers = userSuppliers.filter(s => 
            s.source_supplier_id && 
            s.is_active === true &&
            s.source_type === 'imported_from_catalog'
        );
        
        console.log(`📊 Найдено импортированных поставщиков: ${importedSuppliers.length}`);
        
        for (const supplier of importedSuppliers) {
            console.log(`\n📋 Проверяю поставщика: ${supplier.name}`);
            
            // Проверяем товары в синей комнате
            const userProductsResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_user_products&supplier_id=${supplier.id}`);
            const userProducts = await userProductsResponse.json();
            
            console.log(`  - Товаров в синей комнате: ${userProducts.length}`);
            
            // Проверяем товары в оранжевой комнате
            const verifiedProductsResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_verified_products&supplier_id=${supplier.source_supplier_id}`);
            const verifiedProducts = await verifiedProductsResponse.json();
            
            console.log(`  - Товаров в оранжевой комнате: ${verifiedProducts.length}`);
            
            if (verifiedProducts.length > 0 && userProducts.length === 0) {
                console.log(`  🔧 НУЖЕН ИМПОРТ ТОВАРОВ для ${supplier.name}`);
                
                // Импортируем товары напрямую в базу
                console.log(`  📦 Импортирую ${verifiedProducts.length} товаров...`);
                
                const userProductsToInsert = verifiedProducts.map(product => ({
                    user_id: supplier.user_id,
                    supplier_id: supplier.id,
                    name: product.name,
                    code: product.code,
                    price: product.price,
                    currency: product.currency || 'USD',
                    category: product.category,
                    description: product.description,
                    min_order: product.min_order,
                    in_stock: product.in_stock,
                    image_url: product.image_url,
                    specifications: product.specifications,
                    is_active: true,
                    created_at: new Date().toISOString()
                }));
                
                // Используем прямой API Supabase для вставки
                try {
                    const insertResponse = await fetch(`${baseUrl}/api/supabase-direct`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'insert',
                            table: 'catalog_user_products',
                            data: userProductsToInsert
                        })
                    });
                    
                    if (insertResponse.ok) {
                        console.log(`  ✅ Успешно импортированы товары для ${supplier.name}`);
                    } else {
                        console.log(`  ❌ Ошибка импорта товаров для ${supplier.name}`);
                    }
                } catch (error) {
                    console.log(`  ❌ Ошибка при импорте товаров: ${error.message}`);
                }
                
            } else if (userProducts.length > 0) {
                console.log(`  ✅ У ${supplier.name} товары уже есть`);
            } else {
                console.log(`  ⚠️ У ${supplier.name} нет товаров в оранжевой комнате`);
            }
        }
        
        console.log('\n🎉 ПРОЦЕСС ЗАВЕРШЕН!');
        console.log('Обновите страницу каталога и проверьте товары поставщиков.');
        
    } catch (error) {
        console.error('❌ Ошибка исправления:', error.message);
    }
}

fixMissingProducts();