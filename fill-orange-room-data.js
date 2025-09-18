// Заполняем оранжевую комнату данными для шагов 4-5
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fillOrangeRoomData() {
  console.log('🚀 Заполняем оранжевую комнату данными для шагов 4-5...\n');

  // Данные для всех поставщиков оранжевой комнаты
  const suppliersData = [
    {
      name: 'ТехноКомплект',
      updates: {
        address: 'Москва, ул. Тверская 15, офис 305',
        contact_telegram: '@tehnokomplekt_manager',
        contact_whatsapp: '+79162345678',
        payment_terms: '50% предоплата, остаток после доставки',
        delivery_terms: 'FOB Москва, доставка по России',
        delivery_time: '7-14 дней',
        min_order_amount: 75000,
        bank_accounts: [{
          bank_name: "Сбербанк России",
          account_number: "40702810400000123456",
          bic: "044525225",
          currency: "RUB",
          swift: "SABRRUMM"
        }],
        crypto_wallets: [{
          network: "USDT TRC20",
          address: "TXyZ1234567890abcdefghijklmn",
          currency: "USDT"
        }],
        p2p_cards: [{
          bank: "Сбербанк",
          card_number: "4276 **** **** 1234",
          holder_name: "ALEKSANDR VOLKOV"
        }]
      }
    },
    {
      name: 'АвтоПрофи',
      updates: {
        address: 'Санкт-Петербург, Невский пр-т 120',
        contact_telegram: '@avtoprofi_spb',
        contact_whatsapp: '+78123456789',
        payment_terms: '30% предоплата, 70% по факту',
        delivery_terms: 'EXW Санкт-Петербург',
        delivery_time: '5-10 дней',
        min_order_amount: 50000,
        bank_accounts: [{
          bank_name: "ВТБ Банк",
          account_number: "40702810500000987654",
          bic: "044030593",
          currency: "RUB",
          swift: "VTBRRUM2SPB"
        }],
        crypto_wallets: [{
          network: "USDT ERC20",
          address: "0xavtoprofi890abcdef1234567890abcdef",
          currency: "USDT"
        }],
        p2p_cards: [{
          bank: "ВТБ",
          card_number: "5536 **** **** 9876",
          holder_name: "SERGEY PETROV"
        }]
      }
    },
    {
      name: 'ЭлектроСтандарт',
      updates: {
        address: 'Екатеринбург, ул. Ленина 25',
        contact_telegram: '@elektrostandart_ekb',
        contact_whatsapp: '+73433456789',
        payment_terms: '100% предоплата',
        delivery_terms: 'DAP до склада покупателя',
        delivery_time: '14-21 день',
        min_order_amount: 100000,
        bank_accounts: [{
          bank_name: "Альфа-Банк",
          account_number: "40702810600000456789",
          bic: "044525593",
          currency: "RUB",
          swift: "ALFARUMM"
        }],
        crypto_wallets: null,
        p2p_cards: [{
          bank: "Альфа-Банк",
          card_number: "4154 **** **** 4567",
          holder_name: "IVAN SIDOROV"
        }]
      }
    },
    {
      name: 'АвтоДеталь Центр',
      updates: {
        address: 'Нижний Новгород, пр-т Гагарина 50',
        contact_telegram: '@avtodetal_nn',
        contact_whatsapp: '+78313456789',
        payment_terms: '50/50 - предоплата и по готовности',
        delivery_terms: 'CIP до терминала ТК',
        delivery_time: '10-15 дней',
        min_order_amount: 60000,
        bank_accounts: [{
          bank_name: "Райффайзенбанк",
          account_number: "40702810700000111222",
          bic: "044525700",
          currency: "RUB",
          swift: "RZBMRUMM"
        }],
        crypto_wallets: [{
          network: "BTC",
          address: "bc1qavtodetal2kgdygjrsqtzq2n0yrf2493p",
          currency: "BTC"
        }],
        p2p_cards: null
      }
    },
    {
      name: 'МегаТех Электроника',
      updates: {
        address: 'Новосибирск, ул. Красный пр-т 99',
        contact_telegram: '@megatech_nsk',
        contact_whatsapp: '+73833456789',
        payment_terms: '40% аванс, 60% по отгрузке',
        delivery_terms: 'FOB Новосибирск',
        delivery_time: '12-18 дней',
        min_order_amount: 80000,
        bank_accounts: [{
          bank_name: "Газпромбанк",
          account_number: "40702810800000333444",
          bic: "044525823",
          currency: "RUB",
          swift: "GAZPRUM2"
        }],
        crypto_wallets: [{
          network: "USDT TRC20",
          address: "TMegaTech567890abcdefghijklmnopqrst",
          currency: "USDT"
        }],
        p2p_cards: [{
          bank: "Газпромбанк",
          card_number: "4349 **** **** 3344",
          holder_name: "DMITRY KOZLOV"
        }]
      }
    },
    {
      name: 'АвтоСервис Профи',
      updates: {
        address: 'Казань, ул. Баумана 88',
        contact_telegram: '@avtoservice_kzn',
        contact_whatsapp: '+78433456789',
        payment_terms: 'По договоренности, от 30% аванса',
        delivery_terms: 'DDP до двери заказчика',
        delivery_time: '7-12 дней',
        min_order_amount: 45000,
        bank_accounts: [{
          bank_name: "Ак Барс Банк",
          account_number: "40702810900000555666",
          bic: "049205805",
          currency: "RUB",
          swift: "AKBSRUM2"
        }],
        crypto_wallets: null,
        p2p_cards: [{
          bank: "Ак Барс",
          card_number: "4276 **** **** 5566",
          holder_name: "RUSLAN GALIMOV"
        }]
      }
    }
  ];

  // Обновляем каждого поставщика
  let successCount = 0;
  for (const supplier of suppliersData) {
    console.log(`📝 Обновляем: ${supplier.name}`);
    
    const { data, error } = await supabase
      .from('catalog_verified_suppliers')
      .update(supplier.updates)
      .eq('name', supplier.name)
      .select();

    if (error) {
      console.log(`❌ Ошибка: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ Успешно обновлен`);
      successCount++;
    } else {
      console.log(`⚠️ Поставщик не найден`);
    }
  }

  console.log(`\n📊 Результат: ${successCount}/${suppliersData.length} поставщиков обновлено`);

  // Проверяем результат
  console.log('\n🔍 Проверяем обновленные данные:');
  const { data: results } = await supabase
    .from('catalog_verified_suppliers')
    .select('name, payment_terms, bank_accounts, crypto_wallets')
    .neq('payment_terms', null);

  if (results) {
    results.forEach(r => {
      console.log(`${r.name}:`);
      console.log(`  Условия: ${r.payment_terms || 'НЕТ'}`);
      console.log(`  Банк: ${r.bank_accounts ? '✅' : '❌'}`);
      console.log(`  Крипто: ${r.crypto_wallets ? '✅' : '❌'}`);
    });
  }
}

fillOrangeRoomData();