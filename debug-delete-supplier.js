console.log('🔍 ДИАГНОСТИКА УДАЛЕНИЯ ПОСТАВЩИКОВ');
console.log('==================================');

// Функция для диагностики проблемы с удалением поставщиков
async function debugDeleteSupplier() {
    const baseUrl = 'http://localhost:3002';
    
    try {
        console.log('\n1️⃣ ПРОВЕРКА API ENDPOINT');
        
        // Проверим просто отправку OPTIONS запроса к API
        console.log('Проверяем доступность API...');
        const optionsResponse = await fetch(`${baseUrl}/api/catalog/user-suppliers`, {
            method: 'OPTIONS'
        });
        
        console.log(`OPTIONS запрос: ${optionsResponse.status} ${optionsResponse.statusText}`);
        console.log('CORS заголовки:', {
            'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
        });
        
        console.log('\n2️⃣ ПРОВЕРКА GET ЗАПРОСА (без авторизации)');
        
        // Попробуем получить поставщиков без токена
        const getUserSuppliersResponse = await fetch(`${baseUrl}/api/catalog/user-suppliers`);
        const getUserSuppliersResult = await getUserSuppliersResponse.json();
        
        console.log(`GET запрос без токена: ${getUserSuppliersResponse.status}`);
        console.log('Ответ:', getUserSuppliersResult);
        
        if (getUserSuppliersResponse.status === 401) {
            console.log('✅ Авторизация работает - API требует токен');
        } else if (getUserSuppliersResponse.status === 200) {
            console.log('⚠️ API работает, поставщики найдены:', getUserSuppliersResult.suppliers?.length || 0);
        }
        
        console.log('\n3️⃣ ПРОВЕРКА DELETE ЗАПРОСА (без авторизации)');
        
        // Попробуем удалить без токена
        const deleteResponse = await fetch(`${baseUrl}/api/catalog/user-suppliers`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: 'test-id' })
        });
        
        const deleteResult = await deleteResponse.json();
        
        console.log(`DELETE запрос без токена: ${deleteResponse.status}`);
        console.log('Ответ:', deleteResult);
        
        if (deleteResponse.status === 401) {
            console.log('✅ Авторизация работает - DELETE требует токен');
        } else if (deleteResponse.status === 404) {
            console.log('✅ API работает - поставщик не найден (это ожидаемо)');
        } else {
            console.log('⚠️ Неожиданный ответ от DELETE API');
        }
        
        console.log('\n4️⃣ АНАЛИЗ ПРОБЛЕМЫ');
        console.log('==================');
        
        console.log('🔧 Возможные причины проблемы с удалением:');
        console.log('1. Проблема с токеном авторизации в браузере');
        console.log('2. Проблема с сессией пользователя'); 
        console.log('3. Поставщик принадлежит другому пользователю');
        console.log('4. Поставщик уже был удален (is_active=false)');
        console.log('5. Ошибка в логике фронтенда');
        
        console.log('\n📋 РЕКОМЕНДАЦИИ ДЛЯ ПОЛЬЗОВАТЕЛЯ:');
        console.log('1. Перезайдите в аккаунт (обновите сессию)');
        console.log('2. Обновите страницу каталога');
        console.log('3. Проверьте консоль браузера на ошибки');
        console.log('4. Убедитесь что пытаетесь удалить СВОИХ поставщиков');
        
    } catch (error) {
        console.error('❌ Ошибка диагностики:', error.message);
    }
}

debugDeleteSupplier();