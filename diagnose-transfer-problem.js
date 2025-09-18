console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМЫ ПЕРЕНОСА ТОВАРОВ');
console.log('=====================================');

// Проверяем состояние оранжевой и синей комнат
async function diagnoseTransferProblem() {
    const baseUrl = 'http://localhost:3000';
    
    try {
        console.log('\n1️⃣ ПРОВЕРКА ОРАНЖЕВОЙ КОМНАТЫ (catalog_verified_suppliers)');
        const verifiedSuppliersResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_verified_suppliers`);
        const verifiedSuppliers = await verifiedSuppliersResponse.json();
        
        console.log(`📊 Найдено поставщиков в оранжевой комнате: ${verifiedSuppliers.length}`);
        
        if (verifiedSuppliers.length > 0) {
            console.log('\n📋 Список поставщиков:');
            for (const supplier of verifiedSuppliers.slice(0, 3)) {
                console.log(`  - ${supplier.name} (ID: ${supplier.id}) - Active: ${supplier.is_active}`);
            }
        }
        
        console.log('\n2️⃣ ПРОВЕРКА ТОВАРОВ В ОРАНЖЕВОЙ КОМНАТЕ (catalog_verified_products)');
        const verifiedProductsResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_verified_products`);
        const verifiedProducts = await verifiedProductsResponse.json();
        
        console.log(`📦 Найдено товаров в оранжевой комнате: ${verifiedProducts.length}`);
        
        // Группируем товары по поставщикам
        const productsBySupplier = {};
        verifiedProducts.forEach(product => {
            const supplierId = product.supplier_id;
            if (!productsBySupplier[supplierId]) {
                productsBySupplier[supplierId] = [];
            }
            productsBySupplier[supplierId].push(product);
        });
        
        console.log('\n📋 Товары по поставщикам:');
        Object.entries(productsBySupplier).forEach(([supplierId, products]) => {
            const supplier = verifiedSuppliers.find(s => s.id === supplierId);
            const supplierName = supplier ? supplier.name : 'НЕ НАЙДЕН';
            console.log(`  - ${supplierName} (${supplierId}): ${products.length} товаров`);
            
            if (products.length > 0) {
                console.log(`    Примеры: ${products.slice(0, 2).map(p => p.name).join(', ')}`);
            }
        });
        
        console.log('\n3️⃣ ПРОВЕРКА СИНЕЙ КОМНАТЫ (catalog_user_suppliers)');
        const userSuppliersResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_user_suppliers`);
        const userSuppliers = await userSuppliersResponse.json();
        
        console.log(`🏢 Найдено поставщиков в синей комнате: ${userSuppliers.length}`);
        
        if (userSuppliers.length > 0) {
            console.log('\n📋 Импортированные поставщики:');
            for (const supplier of userSuppliers) {
                console.log(`  - ${supplier.name} (ID: ${supplier.id}) - Source: ${supplier.source_supplier_id} - Active: ${supplier.is_active}`);
            }
        }
        
        console.log('\n4️⃣ ПРОВЕРКА ТОВАРОВ В СИНЕЙ КОМНАТЕ (catalog_user_products)');
        const userProductsResponse = await fetch(`${baseUrl}/api/supabase-direct?table=catalog_user_products`);
        const userProducts = await userProductsResponse.json();
        
        console.log(`📦 Найдено товаров в синей комнате: ${userProducts.length}`);
        
        // Группируем товары по поставщикам в синей комнате
        const userProductsBySupplier = {};
        userProducts.forEach(product => {
            const supplierId = product.supplier_id;
            if (!userProductsBySupplier[supplierId]) {
                userProductsBySupplier[supplierId] = [];
            }
            userProductsBySupplier[supplierId].push(product);
        });
        
        console.log('\n📋 Товары по поставщикам в синей комнате:');
        Object.entries(userProductsBySupplier).forEach(([supplierId, products]) => {
            const supplier = userSuppliers.find(s => s.id === supplierId);
            const supplierName = supplier ? supplier.name : 'НЕ НАЙДЕН';
            console.log(`  - ${supplierName} (${supplierId}): ${products.length} товаров`);
        });
        
        console.log('\n5️⃣ ДИАГНОСТИКА ПРОБЛЕМЫ');
        console.log('====================');
        
        // Проверяем есть ли поставщики без товаров в синей комнате
        let problemFound = false;
        
        for (const userSupplier of userSuppliers) {
            const userProductsCount = userProductsBySupplier[userSupplier.id]?.length || 0;
            const sourceSupplierProducts = productsBySupplier[userSupplier.source_supplier_id]?.length || 0;
            
            if (sourceSupplierProducts > 0 && userProductsCount === 0) {
                console.log(`❌ ПРОБЛЕМА: ${userSupplier.name}`);
                console.log(`   - В оранжевой комнате: ${sourceSupplierProducts} товаров`);
                console.log(`   - В синей комнате: ${userProductsCount} товаров`);
                console.log(`   - Source supplier ID: ${userSupplier.source_supplier_id}`);
                problemFound = true;
            }
        }
        
        if (!problemFound) {
            console.log('✅ Проблем с переносом товаров не обнаружено');
        }
        
    } catch (error) {
        console.error('❌ Ошибка диагностики:', error.message);
    }
}

// Запускаем диагностику
diagnoseTransferProblem();