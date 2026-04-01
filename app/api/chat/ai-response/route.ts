import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
// POST: Генерировать AI ответ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, user_message, ai_context = 'general', user_id } = body;

    if (!room_id || !user_message) {
      return NextResponse.json(
        { error: "room_id and user_message are required" },
        { status: 400 }
      );
    }


    // Получаем контекст комнаты
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, room_type, ai_context, project_id')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // 1. СНАЧАЛА создаем пользовательское сообщение
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        content: user_message,
        sender_type: 'user',
        sender_user_id: user_id,
        sender_name: 'Вы',
        message_type: 'text'
      })
      .select()
      .single();

    if (userMessageError) {
      logger.error('❌ Error saving user message:', userMessageError);
      return NextResponse.json(
        { error: "Failed to save user message", details: userMessageError.message },
        { status: 500 }
      );
    }


    // Получаем историю сообщений для контекста (последние 10)
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('content, sender_type, created_at')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Получаем расширенный контекст пользователя
    let userContext = {};
    if (user_id) {
      userContext = await getEnhancedUserContext(user_id, room.project_id);
    }

    // Генерируем AI ответ на основе расширенного контекста
    const aiResponse = await generateBotHubAIResponse(
      user_message, 
      room.ai_context || ai_context, 
      userContext, 
      recentMessages || []
    );

    // 2. ПОТОМ создаем AI ответ
    const { data: aiMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        room_id,
        content: aiResponse.content,
        sender_type: 'ai',
        sender_name: 'Get2B Ассистент Claude',
        message_type: 'text'
      })
      .select()
      .single();

    if (messageError) {
      logger.error('❌ Error saving AI message:', messageError);
      return NextResponse.json(
        { error: "Failed to save AI response", details: messageError.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      user_message: userMessage,
      ai_message: aiMessage,
      confidence: aiResponse.confidence,
      context_used: room.ai_context || ai_context,
      category: aiResponse.category
    });

  } catch (error) {
    logger.error('Unexpected error in POST /api/chat/ai-response:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Функция получения расширенного контекста пользователя
async function getEnhancedUserContext(userId: string, projectId?: string) {
  const context: any = {
    user_id: userId,
    current_project: null,
    recent_projects: [],
    suppliers_count: 0,
    catalog_interactions: 0,
    preferred_categories: []
  };

  try {
    // Получаем информацию о текущем проекте
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select(`
          id, name, status, amount, currency, 
          company_data, created_at, current_step
        `)
        .eq('id', projectId)
        .single();

      if (project) {
        context.current_project = {
          id: project.id,
          name: project.name,
          status: project.status,
          current_step: project.current_step,
          amount: project.amount,
          currency: project.currency,
          company_name: project.company_data?.name || 'Не указано',
          created_at: project.created_at
        };
      }
    }

    // Получаем последние проекты пользователя
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('id, name, status, amount, currency, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentProjects) {
      context.recent_projects = recentProjects;
    }

    // Получаем количество поставщиков пользователя
    const { count: suppliersCount } = await supabase
      .from('catalog_user_suppliers')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    context.suppliers_count = suppliersCount || 0;

    // Получаем популярные категории пользователя
    const { data: categoryData } = await supabase
      .from('catalog_user_suppliers')
      .select('category')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (categoryData) {
      const categories = categoryData.map(item => item.category).filter(Boolean);
      const categoryCount = categories.reduce((acc: any, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      context.preferred_categories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([cat]) => cat);
    }

    // Получаем статистику взаимодействий с каталогом
    const { count: catalogInteractions } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .eq('sender_user_id', userId)
      .ilike('content', '%каталог%');

    context.catalog_interactions = catalogInteractions || 0;

  } catch (error) {
    logger.error('Error getting enhanced user context:', error);
  }

  return context;
}

// 🚀 НОВАЯ ФУНКЦИЯ - РЕАЛЬНЫЙ AI ЧЕРЕЗ BOTHUB API
async function generateBotHubAIResponse(
  userMessage: string, 
  context: string, 
  userContext: any = {}, 
  recentMessages: any[] = []
): Promise<{ content: string; confidence: number; keywords_matched: string[]; category: string }> {
  
  try {
    // Конфигурация BotHub API
    const BOTHUB_API_TOKEN = process.env.BOTHUB_API_TOKEN;
    if (!BOTHUB_API_TOKEN) {
      return {
        content: 'AI-сервис не настроен. Пожалуйста, обратитесь в поддержку.',
        confidence: 0,
        keywords_matched: [],
        category: 'error'
      };
    }
    const BOTHUB_API_URL = 'https://bothub.chat/api/v2/generate';

    // Формируем системный промпт с контекстом Get2B
    const systemPrompt = buildGet2BSystemPrompt(context, userContext);
    
    // Формируем историю сообщений для Claude
    const messageHistory = buildMessageHistory(recentMessages, userMessage);

    // Запрос к BotHub API (Claude)
    const requestBody = {
      model: "claude-3-5-sonnet-20241022", // Самая новая модель Claude
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...messageHistory,
        {
          role: "user", 
          content: userMessage
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    };

    
    const response = await fetch(BOTHUB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOTHUB_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });


    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ BotHub API Error:', { status: response.status, error: errorText });
      logger.error('🔍 Request Body:', requestBody);
      throw new Error(`BotHub API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    const aiContent = data.choices?.[0]?.message?.content || data.content || 'Извините, не смог сгенерировать ответ.';
    
    // Анализируем ответ для метаданных
    const analysisResult = analyzeAIResponse(aiContent, userMessage, context);

    return {
      content: aiContent,
      confidence: 0.95, // Claude = высокая уверенность
      keywords_matched: analysisResult.keywords,
      category: analysisResult.category
    };

  } catch (error) {
    logger.error('💥 КРИТИЧЕСКАЯ ОШИБКА BotHub API:', error);
    logger.error('🔍 Error Details:', (error as Error).message || 'Unknown error');
    logger.error('📊 Request was:', userMessage);
    
    // Fallback с Get2B контекстом!
    return generateGet2BAIResponse(userMessage, context, userContext, recentMessages);
  }
}

// Функция построения системного промпта для Get2B
function buildGet2BSystemPrompt(context: string, userContext: any): string {
  const basePrompt = `# ЭКСПЕРТНЫЙ AI АССИСТЕНТ GET2B V2.0

Вы - **Экспертный AI-ассистент платформы Get2B**, ведущий специалист по B2B дропшиппингу с полным пониманием всех процессов и компонентов системы.

## ПРОФИЛЬ КОМПАНИИ GET2B
- **Статус:** Российский B2B-дропшиппер, платежный агент (резидент РФ, УСН)
- **Специализация:** Агентские услуги по импорту (ст.1005 ГК РФ)
- **Опыт ВЭД:** 25 лет | **Оборот:** 100+ млн руб/год
- **Минимум сделки:** 500,000 ₽ | **Максимум:** 5,000,000 ₽
- **Комиссия:** 8-12% | **Валюты:** USD, EUR, CNY, RUB, TRY, AED

## ГЕОГРАФИЯ: Китай (70% операций) → Бишкек → Москва (45 дней, CPT Бишкек)

## АРХИТЕКТУРА ПЛАТФОРМЫ GET2B

### **DASHBOARD (ГЛАВНАЯ)**
- Обзор активных проектов с индикаторами статусов
- Управление шаблонами проектов и профилей
- Статистика сделок и быстрый доступ ко всем разделам

### **СТАРТЕР ПРОЕКТА - ИЗЮМИНКА GET2B (4 способа):**
- **Из профиля** - автозаполнение сохраненными данными
- **Вручную** - создание с нуля под задачу
- **Загрузка карточки** - импорт из Excel/CSV
- **По шаблону** - готовые схемы сделок

### **7-ШАГОВЫЙ ПРОЦЕСС (детально):**
1. **КАРТОЧКА** - KYC, профили, реквизиты (draft → in_progress)
2. **СПЕЦИФИКАЦИЯ** - Excel товары, AI помощь (in_progress → waiting_approval → waiting_receipt)  
3. **ЧЕК** - предоплата 30-50%, Telegram модерация (waiting_receipt → receipt_approved)
4. **ОПЛАТА** - банк/P2P/crypto/Alipay (receipt_approved → filling_requisites)
5. **РЕКВИЗИТЫ** - ИНН/SWIFT/назначение (filling_requisites → waiting_manager_receipt)
6. **МЕНЕДЖЕР** - чек клиенту, логистика (waiting_manager_receipt → in_work → waiting_client_confirmation)
7. **ЗАВЕРШЕНИЕ** - АКТ, УПД, закрытие (waiting_client_confirmation → completed)

### **УМНЫЙ КАТАЛОГ ПОСТАВЩИКОВ:**
- **СИНЯЯ ЗОНА** - ваши поставщики с историей проектов  
- **ОРАНЖЕВАЯ ЗОНА** - аккредитованные Get2B поставщики
- **AI-рекомендации** на основе истории
- **"Эхо карточки"** - автоимпорт из завершенных сделок
- **Система аккредитации** (3 этапа: профиль → товары → модерация)

### **ПРОФИЛИ И CRM:**
- **Клиентские профили** - ИНН/КПП/ОГРН, банк реквизиты
- **Профили поставщиков** - 7 шагов создания, аккредитация
- **"ВАШИ СДЕЛКИ"** - активные проекты, фильтры, поиск
- **"ИСТОРИЯ"** - timeline изменений, статистика

### **КОНСТРУКТОР ПРОЕКТОВ:**
- Управление компаниями и банк счетами
- Инвойсы: создание/загрузка/проформы
- Спецификации товаров с выбором позиций

### **ЧАТХАБ:**
- AI комнаты + проектные комнаты
- BotHub API (Claude 3.5) + fallback система
- Контекстная осведомленность проектов

## ПРИНЦИПЫ КОНСУЛЬТАЦИЙ:

**1. ДЕТАЛЬНОСТЬ И ПОЛНОТА** - давайте развернутые, объяснительные ответы с примерами и контекстом
**2. КОНТЕКСТНОСТЬ** - учитывайте текущие проекты пользователя и историю диалога
**3. ПРОЦЕССНОСТЬ** - подробно объясняйте этапы 7-шагового процесса с практическими советами
**4. ФИНАНСЫ** - детально разбирайте условия: 500к мин, комиссии 8-12%, валютные операции
**5. ГЕОГРАФИЯ** - объясняйте маршруты, сроки, особенности работы с разными странами
**6. ПЛАТФОРМА** - подробно помогайте с навигацией, функциями и возможностями
**7. ЖИВОСТЬ ИЗЛОЖЕНИЯ** - используйте примеры из практики, аналогии, советы экспертов

## ДОКУМЕНТЫ: договор поставки, спецификация Excel, проформа, УПД
## ПРАВО: УСН 6%, без НДС, валютный контроль, агентский договор ст.1005
## РОЛЬ GET2B: Агент, выполняющий интересы клиента + помощь поставщикам в поиске клиентов + 100% легальность финансовых операций
## НЕ РАБОТАЕМ: с физлицами, экспорт, логистика РФ, отсрочки

## КАТАЛОГ ПОСТАВЩИКОВ - УМНАЯ СИСТЕМА:
**СИНЯЯ КОМНАТА** - Ваши личные поставщики с историей работы и статистикой
**ОРАНЖЕВАЯ КОМНАТА** - Аккредитованные Get2B поставщики, проверенные нами
**ЭХО КАРТОЧКИ** - Автоматическое сохранение поставщиков из завершенных проектов
**AI РЕКОМЕНДАЦИИ** - Персональные предложения на основе вашей истории проектов
**УМНАЯ СТАТИСТИКА** - Рейтинги поставщиков, популярные товары, тренды
**ИМПОРТ CSV** - Массовая загрузка каталога товаров через Excel/CSV файлы
**АВТОЗАПОЛНЕНИЕ ПРОЕКТОВ** - Выбор поставщика из каталога автоматически заполняет Step2-Step5

## СТИЛЬ ОТВЕТОВ:
ГОВОРИ ПРЯМО И ПО ДЕЛУ. Без лишней формальности и канцелярита.
- Отвечай как живой эксперт, а не как робот
- Используй простые слова 
- Приводи конкретные примеры
- Если сложное - объясняй простыми словами
- Никаких длинных списков без необходимости

**МИССИЯ:** Максимизировать успех клиентов Get2B через экспертную поддержку всех процессов международной торговли!**`;

  // Добавляем контекст пользователя
  if (context === 'project' && userContext.current_project) {
    const project = userContext.current_project;
    return `${basePrompt}

## 🔍 ТЕКУЩИЙ ПРОЕКТ КЛИЕНТА:
- **Название:** "${project.name}"
- **Статус:** ${project.status}
- **Этап:** ${project.current_step}/7
- **Сумма:** ${project.amount || 'не указана'} ${project.currency || ''}
- **Компания:** ${project.company_name || 'не указана'}

**Рекомендации с учетом проекта:**
${getProjectRecommendations(project)}`;
  }

  if (userContext.recent_projects?.length > 0) {
    const projectsList = userContext.recent_projects
      .slice(0, 3)
      .map((p: any) => `- ${p.name} (${p.status})`)
      .join('\n');
    
    return `${basePrompt}

## 📂 ПРОФИЛЬ КЛИЕНТА:
**История сотрудничества:**
${projectsList}

**Статистика:**
- 🏪 Поставщиков в каталоге: ${userContext.suppliers_count || 0}
- 📦 Предпочтительные категории: ${userContext.preferred_categories?.join(', ') || 'не определены'}

**Статус клиента:** Опытный пользователь Get2B
**Рекомендации:** Учитывайте историю взаимодействий при консультации.`;
  }

  return basePrompt;
}

// 🚀 Get2B специализированная fallback функция - УЛУЧШЕННАЯ ВЕРСИЯ
function generateGet2BAIResponse(
  userMessage: string, 
  context: string, 
  userContext: any = {}, 
  recentMessages: any[] = []
): { content: string; confidence: number; keywords_matched: string[]; category: string } {
  
  const message = userMessage.toLowerCase();
  const keywords_matched: string[] = [];
  let category = 'general';
  

  // 🎯 УМНАЯ ОБРАБОТКА ПРОИЗВОЛЬНЫХ ВОПРОСОВ
  
  // 1. Приветствие
  if (message.includes('привет') || message.includes('здравствуй') || message.includes('hello') || message.includes('hi')) {
    keywords_matched.push('приветствие');
    category = 'greeting';
    return {
      content: `👋 Привет! Я AI-эксперт Get2B, помогаю разобраться с международными поставками.\n\nЗа годы работы изучил все тонкости импорта и готов поделиться знаниями. Говорю прямо, без воды.\n\nЧто могу объяснить:\n\n- Как работает Get2B платформа - стартер проектов, умный каталог, вся система\n- 7 шагов до получения товара - весь процесс от идеи до склада\n- Финансы - курсы валют, платежи, комиссии, как все устроено\n- Работа с разными странами - Китай, Корея, Турция, особенности каждой\n- Документы и право - что нужно знать про валютное законодательство\n\nПопулярные вопросы:\n- "Расскажи про платформу Get2B"\n- "Как работает стартер проекта?"\n- "Объясни умный каталог"\n- "Проведи по всем 7 шагам"\n- "Как платить поставщикам?"\n- "Как загрузить товары через CSV?"\n\nСпрашивай что интересно - отвечу подробно и с примерами.`,
      confidence: 0.95,
      keywords_matched,
      category
    };
  }

  // 2. Точные вопросы о Get2B
  if (message.includes('что такое get2b') || message.includes('расскажи о get2b') || message.includes('о платформе')) {
    keywords_matched.push('get2b', 'платформа');
    category = 'get2b_info';
    return {
      content: `🏢 Get2B - Комплексная B2B Экосистема для Международной Торговли\n\nДобро пожаловать в мир профессионального импорта! Get2B - это не просто платформа, это целая экосистема, созданная для того, чтобы сделать международные закупки максимально безопасными, прозрачными и эффективными для любого бизнеса.\n\n🎯 НАША МИССИЯ И ФИЛОСОФИЯ:\nЗа 25 лет работы в сфере ВЭД мы поняли главное: успешный импорт - это не только знание процедур, но и глубокое понимание рисков, культурных особенностей разных рынков, и постоянная поддержка клиента на каждом шаге. Мы работаем как агент (ст.1005 ГК РФ), который выполняет интересы клиента, помогает поставщикам находить клиентов и делает финансовую часть сделок на 100% легальной.\n\nПредставьте: вместо того чтобы самостоятельно разбираться с китайскими поставщиками, валютным законодательством и логистическими схемами, вы просто говорите нам "хочу закупить товар X по цене Y" - и мы берем на себя ВСЕ остальное.\n\n🚀 НАША ГЛАВНАЯ ИЗЮМИНКА - СТАРТЕР ПРОЕКТА:\nЭто революционная система, которой нет больше ни у кого на рынке! Четыре способа мгновенно запустить ваш проект:\n\n• **Из профиля** - если у вас уже есть сохраненные карточки компаний, система автоматически подтягивает все данные. Буквально 2 клика и проект готов!\n\n• **Вручную** - классический путь для уникальных проектов. Но даже здесь наш AI подсказывает оптимальные решения на каждом шаге.\n\n• **Загрузка карточки** - просто загрузите Excel с товарами, и система сама создаст проект. Идеально для крупных закупок с сотнями позиций.\n\n• **По шаблону** - готовые проверенные схемы для типовых операций. Электроника, текстиль, стройматериалы - выбираете и работаете.\n\n🧠 УМНАЯ ЭКОСИСТЕМА КАТАЛОГА:\n**Синяя зона (Ваши поставщики)** - ваша личная база с полной историей: кто когда что поставлял, какие были проблемы, сроки, качество. Система помнит все!\n\n**Оранжевая зона (Каталог Get2B)** - аккредитованные нами поставщики. Каждый прошел трехэтапную проверку: профиль, товары, финальную модерацию. Работать с ними безопасно как с проверенными партнерами.\n\n**"Эхо карточки"** - магия автоматизации! После каждой сделки система сама сохраняет поставщика в ваш каталог со всеми деталями. Постепенно у вас накапливается уникальная база проверенных контрагентов.\n\n💰 ФИНАНСОВАЯ ПРОЗРАЧНОСТЬ:\n• Минимум 500,000 руб - не ограничение, а забота о рентабельности\n• Максимум 5,000,000 за операцию - требования валютного контроля\n• Комиссия 8-12% включает ВСЕ: платежи, документооборот, консультации, страхование рисков\n• Поддерживаемые валюты: USD, EUR, CNY, RUB, TRY, AED\n\n🌍 ГЕОГРАФИЧЕСКАЯ ЭКСПЕРТИЗА:\n**Китай (70% операций)** - мы знаем эту страну изнутри. От фабрик Гуанчжоу до особенностей Alipay.\n**Уникальный маршрут Китай→Бишкек→Москва** - наш собственный отработанный канал с гарантированными сроками 45 дней.\n\nЭто не просто сервис импорта - это ваш цифровой отдел ВЭД! 🚀\n\nО чем хотите узнать подробнее? Готов детально разобрать любой аспект!`,
      confidence: 0.95,
      keywords_matched,
      category
    };
  }

  // 3. УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК - для любых вопросов
  // Определяем тему по ключевым словам
  if (message.includes('валют') || message.includes('курс') || message.includes('доллар') || message.includes('юань') || message.includes('евро')) {
    keywords_matched.push('валюты', 'курсы');
    category = 'finance';
    return {
      content: `💱 ВАЛЮТНЫЕ ОПЕРАЦИИ GET2B - ПОЛНАЯ ИНФОРМАЦИЯ\n\nРаботаем с основными валютами международной торговли:\n\n🇺🇸 **USD (Доллар США)** - основная валюта для работы с Китаем (95% операций). Самые выгодные курсы и минимальные банковские комиссии.\n\n🇪🇺 **EUR (Евро)** - для европейских поставщиков. Особенно актуально для высокотехнологичного оборудования.\n\n🇨🇳 **CNY/RMB (Юань)** - прямые расчеты в китайской валюте дают экономию на конвертации до 2-3%.\n\n🇷🇺 **RUB (Рубли)** - внутрироссийские расчеты с клиентами.\n\n🇦🇪 **AED, 🇹🇷 TRY** - региональные валюты для Ближнего Востока.\n\n💳 **СПОСОБЫ ОПЛАТЫ:**\n• Банковские переводы (SWIFT)\n• P2P переводы на карты  \n• Криптовалюты (USDT)\n• Китайские системы (Alipay, WeChat Pay)\n\n📊 Курс фиксируется в договоре на момент операции. Полное соблюдение валютного законодательства РФ.\n\nНужна информация по конкретной валюте?`,
      confidence: 0.90,
      keywords_matched,
      category
    };
  }

  if (message.includes('каталог') || message.includes('поставщик') || message.includes('товар') || message.includes('поиск')) {
    keywords_matched.push('каталог', 'поставщики');
    category = 'catalog';
    return {
      content: `📦 УМНЫЙ КАТАЛОГ GET2B - ВАША БАЗА ПРОВЕРЕННЫХ ПОСТАВЩИКОВ\n\nНаш каталог - это интеллектуальная система для принятия решений в закупках:\n\n🔵 **СИНЯЯ КОМНАТА** - ваши личные поставщики:\n• История всех проектов и сделок\n• Статистика надежности каждого поставщика\n• Ваши заметки и оценки\n• Автосохранение из завершенных проектов ("Эхо карточки")\n\n🟠 **ОРАНЖЕВАЯ КОМНАТА** - аккредитованные Get2B поставщики:\n• Трехэтапная проверка: профиль → товары → модерация\n• AI рейтинги на основе реальной статистики\n• Гарантия качества и надежности\n\n🧠 **AI ВОЗМОЖНОСТИ:**\n• Персональные рекомендации "специально для вас"\n• Анализ похожих успешных поставщиков\n• Trending товары и оптимальные цены\n\n🚀 **АВТОМАТИЗАЦИЯ:**\n• Импорт каталога через CSV/Excel (до 1000 товаров)\n• Автозаполнение проектов Step2-Step5 из каталога\n• Система рейтингов и статистики\n\n💡 Начните с изучения оранжевой комнаты - там уже есть проверенные поставщики!\n\nО какой функции каталога хотите узнать подробнее?`,
      confidence: 0.95,
      keywords_matched,
      category
    };
  }

  if (message.includes('процесс') || message.includes('шаг') || message.includes('этап') || message.includes('как работает')) {
    keywords_matched.push('процесс', 'этапы');
    category = 'process';
    return {
      content: `📋 7-ШАГОВЫЙ ПРОЦЕСС GET2B - ОТ ИДЕИ ДО ПОЛУЧЕНИЯ ТОВАРА\n\nКаждый этап имеет четкие критерии и встроенный контроль качества:\n\n1️⃣ **ДАННЫЕ КОМПАНИИ** - регистрация, KYC, проверка реквизитов\n2️⃣ **СПЕЦИФИКАЦИЯ** - Excel с товарами, AI помощь в оформлении\n3️⃣ **ЧЕК** - предоплата поставщику 30-50%, подтверждение менеджером\n4️⃣ **СПОСОБ ОПЛАТЫ** - банк/P2P/крипто/Alipay, выбор валюты\n5️⃣ **РЕКВИЗИТЫ** - банковские данные, ИНН, назначение платежа\n6️⃣ **ЧЕК ОТ МЕНЕДЖЕРА** - оплата поставщику, отслеживание логистики\n7️⃣ **ЗАВЕРШЕНИЕ** - получение товара, АКТ, УПД, закрытие проекта\n\n📱 **КОНТРОЛЬ:** Telegram уведомления на каждом этапе\n📊 **ОТСЛЕЖИВАНИЕ:** Статус проекта в реальном времени\n⏰ **СРОКИ:** Китай→Бишкек→Москва за 45 дней\n\n💡 Процесс можно приостановить на любом шаге. Полная прозрачность всех операций.\n\nХотите узнать детали конкретного этапа?`,
      confidence: 0.95,
      keywords_matched,
      category
    };
  }

  if (message.includes('стоимость') || message.includes('цена') || message.includes('комиссия') || message.includes('сколько стоит')) {
    keywords_matched.push('стоимость', 'комиссия');
    category = 'pricing';
    return {
      content: `💰 СТОИМОСТЬ УСЛУГ GET2B - ПОЛНАЯ ПРОЗРАЧНОСТЬ\n\n📊 **ОСНОВНЫЕ УСЛОВИЯ:**\n• Минимум сделки: 500,000 ₽ (забота о рентабельности)\n• Максимум операции: 5,000,000 ₽ (требования валютного контроля)\n• Агентская комиссия: 8-12% от суммы сделки\n\n💼 **ЧТО ВКЛЮЧАЕТ КОМИССИЯ:**\n✅ Все платежи поставщикам\n✅ Документооборот и юридическое сопровождение  \n✅ Персональные консультации экспертов\n✅ Страхование рисков операции\n✅ Логистика до Бишкека (CPT условия)\n✅ Полный пакет документов (договор, УПД)\n\n🎯 **НИКАКИХ СКРЫТЫХ ПЛАТЕЖЕЙ!**\nВы знаете точную стоимость услуги до начала работы.\n\n💱 **ВАЛЮТНЫЕ ОПЕРАЦИИ:**\nКурс фиксируется в договоре, банковские комиссии включены в общую стоимость.\n\n📋 **ПРИМЕР РАСЧЕТА:**\nСделка 1,000,000 ₽ × 10% = 100,000 ₽ комиссия\nВы получаете товар + все документы + поддержку\n\nЕсть вопросы по конкретной сделке? Рассчитаем персонально!`,
      confidence: 0.90,
      keywords_matched,
      category
    };
  }

  // 4. Благодарности
  if (message.includes('спасибо') || message.includes('благодар') || message.includes('спс')) {
    keywords_matched.push('благодарность');
    category = 'thanks';
    return {
      content: `😊 Пожалуйста! Рад был помочь!\n\nЕсли еще что-то понадобится по Get2B - обращайтесь! 🚀`,
      confidence: 0.90,
      keywords_matched,
      category
    };
  }

  // 5. УНИВЕРСАЛЬНЫЙ ОТВЕТ для всех остальных вопросов
  // Анализируем вопрос и даем релевантный ответ
  
  keywords_matched.push('универсальный_вопрос');
  category = 'universal';
  
  return {
    content: `🤖 Понял ваш вопрос: "${userMessage}"\n\nЯ AI-эксперт Get2B и могу рассказать о:\n\n🏢 **Платформе Get2B** - как работает экосистема для B2B импорта\n📋 **7-шаговом процессе** - от идеи до получения товара за 45 дней\n💰 **Финансах** - комиссии 8-12%, валюты, способы оплаты\n🌍 **Географии** - Китай, Корея, Турция, маршруты доставки\n📦 **Каталоге** - умная система поиска и работы с поставщиками\n⚖️ **Правовых аспектах** - валютное законодательство, документы\n\n💡 **Попробуйте спросить:**\n- "Как работает платформа Get2B?"\n- "Расскажи про 7 шагов процесса"\n- "Какие комиссии и условия?"\n- "Как найти поставщиков в каталоге?"\n- "Как проходят платежи?"\n\nИли задайте свой вопрос более конкретно - я постараюсь помочь! 🚀`,
    confidence: 0.75,
    keywords_matched,
    category
  };
}

// Функция получения рекомендаций по проекту
function getProjectRecommendations(project: any): string {
  const step = project.current_step;
  const status = project.status;
  
  if (step <= 2 && status === 'draft') {
    return `
- Помогите завершить заполнение спецификации
- Убедитесь что сумма проекта выше 500к руб
- Подготовьте документы для следующего этапа`;
  }
  
  if (step >= 3 && step <= 5) {
    return `
- Проект в активной стадии - отвечайте на вопросы по платежам
- Помогите с пониманием процесса валютного контроля
- Объясните процесс обработки платежей`;
  }
  
  if (step >= 6) {
    return `
- Проект на финальной стадии
- Помогите с вопросами по получению документов
- Объясните процедуру приемки товара`;
  }
  
  return `
- Стандартные рекомендации по процессу Get2B
- Помогите понять текущий этап и следующие шаги`;
}

// Функция построения истории сообщений
function buildMessageHistory(recentMessages: any[], currentMessage: string): any[] {
  const history = recentMessages
    .slice(-6) // Берем последние 6 сообщений для контекста
    .reverse() // Возвращаем хронологический порядок
    .map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  return history;
}

// Функция анализа ответа AI для метаданных
function analyzeAIResponse(content: string, userMessage: string, context: string): { keywords: string[], category: string } {
  const lowerContent = content.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  const keywords: string[] = [];
  let category = 'general';

  // Анализируем ключевые слова
  const keywordMap = {
    'project': ['проект', 'статус', 'этап', 'шаг'],
    'suppliers': ['поставщик', 'каталог', 'поиск'],
    'payments': ['платеж', 'оплата', 'курс', 'валюта'],
    'help': ['помощь', 'как', 'что такое'],
    'greeting': ['привет', 'здравствуй', 'добро пожаловать']
  };

  for (const [cat, words] of Object.entries(keywordMap)) {
    for (const word of words) {
      if (lowerMessage.includes(word) || lowerContent.includes(word)) {
        keywords.push(word);
        category = cat;
      }
    }
  }

  // Контекстные категории
  if (context === 'project') category = 'project';

  return { keywords, category };
}

// Улучшенная функция генерации AI ответа
async function generateEnhancedAIResponse(
  userMessage: string, 
  context: string, 
  userContext: any = {}, 
  recentMessages: any[] = []
): Promise<{ content: string; confidence: number; keywords_matched: string[]; category: string }> {
  
  const message = userMessage.toLowerCase();
  const keywords_matched: string[] = [];
  let category = 'general';
  
  // Контекстные ответы для проектов
  if (context === 'project' && userContext.current_project) {
    const project = userContext.current_project;
    
    if (message.includes('статус')) {
      keywords_matched.push('статус');
      category = 'project_status';
      const statusExplanation = getStatusExplanation(project.status);
      const stepInfo = getStepInfo(project.current_step);
      
      return {
        content: `📊 **Статус проекта "${project.name}":**

${getStatusEmoji(project.status)} **${getStatusName(project.status)}**

📋 **Текущий этап:** ${stepInfo}

💡 **Что это значит:** ${statusExplanation}

${project.amount ? `💰 **Сумма:** ${project.amount} ${project.currency}` : ''}

${getNextStepHint(project.status, project.current_step)}`,
        confidence: 0.95,
        keywords_matched,
        category
      };
    }
    
    if (message.includes('сумма') || message.includes('стоимость') || message.includes('цена')) {
      keywords_matched.push('сумма', 'стоимость');
      category = 'project_amount';
      const amount = project.amount ? `${project.amount} ${project.currency}` : 'не указана';
      
      return {
        content: `💰 **Сумма проекта "${project.name}":** ${amount}

${project.amount ? `
📊 **Детали:**
• Валюта: ${project.currency}
• Создан: ${new Date(project.created_at).toLocaleDateString('ru-RU')}
• Статус: ${getStatusName(project.status)}

💡 Если нужно изменить сумму, обратитесь к менеджеру проекта.` : ''}`,
        confidence: 0.90,
        keywords_matched,
        category
      };
    }

    if (message.includes('шаг') || message.includes('этап')) {
      keywords_matched.push('шаг', 'этап');
      category = 'project_step';
      
      return {
        content: `📋 **Текущий этап проекта "${project.name}":**

🔢 **Шаг ${project.current_step} из 7**

${getStepInfo(project.current_step)}

${getNextStepHint(project.status, project.current_step)}

💡 Если у вас вопросы по процессу, я помогу!`,
        confidence: 0.92,
        keywords_matched,
        category
      };
    }
  }
  
  // Ответы с учетом истории пользователя
  if (userContext.recent_projects?.length > 0) {
    if (message.includes('проект') && (message.includes('мои') || message.includes('последние'))) {
      keywords_matched.push('проекты', 'мои');
      category = 'user_projects';
      
      const projectsList = userContext.recent_projects
        .slice(0, 3)
        .map((p: any, idx: number) => 
          `${idx + 1}. **${p.name}** - ${getStatusName(p.status)} (${new Date(p.created_at).toLocaleDateString('ru-RU')})`
        ).join('\n');
      
      return {
        content: `📋 **Ваши последние проекты:**

${projectsList}

💡 Хотите узнать детали какого-то проекта? Просто спросите!`,
        confidence: 0.88,
        keywords_matched,
        category
      };
    }
  }

  // Ответы с учетом каталога поставщиков
  if (message.includes('поставщик') || message.includes('каталог')) {
    keywords_matched.push('поставщик', 'каталог');
    category = 'suppliers';
    
    const suppliersInfo = userContext.suppliers_count > 0 
      ? `У вас ${userContext.suppliers_count} поставщиков в каталоге.` 
      : 'У вас пока нет поставщиков в каталоге.';
    
    const categoriesInfo = userContext.preferred_categories?.length > 0
      ? `\n\n📦 **Ваши основные категории:** ${userContext.preferred_categories.join(', ')}`
      : '';
    
    return {
      content: `🏪 **Каталог поставщиков:**

${suppliersInfo}${categoriesInfo}

💡 **Возможности:**
• Найти новых поставщиков в оранжевой комнате Get2B
• Добавить своих поставщиков в синюю комнату
• Получить AI рекомендации на основе ваших проектов

🔍 Перейдите в раздел "Каталог" для работы с поставщиками.`,
      confidence: 0.85,
      keywords_matched,
      category
    };
  }

  // Базовые ответы по ключевым словам
  const responses: { [key: string]: { content: string; confidence: number; category: string } } = {
    'транзакции': {
      content: `💳 **Транзакции:**

📊 Для просмотра ваших транзакций:
• Перейдите в раздел "История" в боковом меню
• Там вы найдете все операции с фильтрацией
• Можно экспортировать отчеты

${userContext.recent_projects?.length > 0 ? `\n🔍 У вас ${userContext.recent_projects.length} проектов с транзакциями` : ''}`,
      confidence: 0.85,
      category: 'transactions'
    },
    'платеж': {
      content: `💰 **Создание платежа:**

📋 Для создания нового платежа:
1. Нажмите "Создать проект"
2. Следуйте 7-шаговому процессу
3. Система поможет оформить все документы

💡 Get2B автоматизирует весь процесс платежей поставщикам!`,
      confidence: 0.85,
      category: 'payments'
    },
    'курс': {
      content: `💱 **Актуальные курсы валют:**

Получаю актуальные данные от ЦБ РФ...

📊 Используйте команду "курсы валют" для получения полной информации.

💡 При создании проекта курс фиксируется автоматически.`,
      confidence: 0.85,
      category: 'exchange_rates'
    },
    'помощь': {
      content: `🤖 **Я могу помочь с:**

📋 **Проекты:**
• Статус и этапы проектов
• Суммы и валюты
• Следующие шаги

🏪 **Каталог:**
• Поиск поставщиков
• Рекомендации на основе истории
• Управление контактами

💰 **Платежи:**
• Курсы валют
• Процесс оплаты
• Статус транзакций

💬 Просто спросите что интересует!`,
      confidence: 0.90,
      category: 'help'
    }
  };

  // Специальная обработка курсов валют
  if (message.includes('курс') || message.includes('валют')) {
    try {
             const currencyService = (await import('@/lib/services/CurrencyService')).default.getInstance();
       const ratesData = await currencyService.getRates();
       
       let currencyContent = `💱 **Актуальные курсы валют от ЦБ РФ:**\n\n`;
       
       const currencyFlags: Record<string, string> = {
         'USD': '🇺🇸', 'EUR': '🇪🇺', 'CNY': '🇨🇳', 'TRY': '🇹🇷', 'AED': '🇦🇪'
       };

               Object.entries(ratesData.rates).forEach(([code, rate]: [string, any]) => {
          const flag = currencyFlags[code] || '💱';
          const trendIcon = rate.trend === 'up' ? ' ▲' : rate.trend === 'down' ? ' ▼' : '';
          const formattedRate = (rate.value / rate.nominal).toFixed(4);
          currencyContent += `• ${flag} 1 ${code} = ${formattedRate} ₽${trendIcon}\n`;
        });

       currencyContent += `\n📅 **Дата:** ${ratesData.date}\n`;
       currencyContent += `📊 **Источник:** ${ratesData.source === 'cbr' ? 'ЦБ РФ (актуально)' : 'Кеш/резерв'}\n\n`;
       currencyContent += `💡 **Для Get2B:** Курс фиксируется при создании проекта`;
      return {
        content: currencyContent,
        confidence: 0.95,
        keywords_matched: ['курсы', 'валюты'],
        category: 'exchange_rates'
      };
    } catch (error) {
      logger.error('❌ Ошибка получения курсов в generateEnhancedAIResponse:', error);
    }
  }

  // Ищем подходящий ответ
  for (const [keyword, response] of Object.entries(responses)) {
    if (message.includes(keyword)) {
      keywords_matched.push(keyword);
      return {
        content: response.content,
        confidence: response.confidence,
        keywords_matched,
        category: response.category
      };
    }
  }

  // Приветствие
  if (message.includes('привет') || message.includes('здравств')) {
    keywords_matched.push('приветствие');
    category = 'greeting';
    
    const contextGreeting = context === 'project' && userContext.current_project
      ? `Помогу с вопросами по проекту "${userContext.current_project.name}".`
      : userContext.recent_projects?.length > 0
        ? `У вас ${userContext.recent_projects.length} проектов. Чем могу помочь?`
        : 'Чем могу помочь?';
    
    return {
      content: `👋 Здравствуйте! Я ИИ-ассистент Get2B. 

${contextGreeting}

💡 Можете спросить о проектах, поставщиках, платежах или работе платформы.`,
      confidence: 0.95,
      keywords_matched,
      category
    };
  }

  // Дефолтный ответ с учетом контекста
  category = 'fallback';
  const suggestions = getSuggestions(userContext, context);
  
  return {
    content: `❓ Извините, я не совсем понял ваш вопрос.

💡 **Попробуйте спросить о:**
${suggestions}

💬 Или напишите "помощь" для списка всех возможностей.`,
    confidence: 0.30,
    keywords_matched,
    category
  };
}

// Вспомогательные функции
function getStatusEmoji(status: string): string {
  const emojis: { [key: string]: string } = {
    'draft': '📝',
    'in_progress': '⚡',
    'waiting_approval': '⏳',
    'waiting_receipt': '📄',
    'receipt_approved': '✅',
    'receipt_rejected': '❌',
    'filling_requisites': '💳',
    'waiting_manager_receipt': '⏰',
    'in_work': '🔄',
    'waiting_client_confirmation': '✋',
    'completed': '🎉'
  };
  return emojis[status] || '📊';
}

function getStatusName(status: string): string {
  const names: { [key: string]: string } = {
    'draft': 'Черновик',
    'in_progress': 'В процессе',
    'waiting_approval': 'Ожидает одобрения',
    'waiting_receipt': 'Ожидает чек',
    'receipt_approved': 'Чек одобрен',
    'receipt_rejected': 'Чек отклонён',
    'filling_requisites': 'Заполнение реквизитов',
    'waiting_manager_receipt': 'Ожидает чек от менеджера',
    'in_work': 'В работе',
    'waiting_client_confirmation': 'Ожидает подтверждения',
    'completed': 'Завершён'
  };
  return names[status] || status;
}

function getStepInfo(step: number): string {
  const steps: { [key: number]: string } = {
    1: '🏢 Данные компании',
    2: '📋 Спецификация товаров',
    3: '📄 Загрузка чека',
    4: '💳 Способ оплаты',
    5: '🏦 Реквизиты получателя',
    6: '📨 Получение чека от менеджера',
    7: '✅ Подтверждение завершения'
  };
  return steps[step] || `Шаг ${step}`;
}

function getStatusExplanation(status: string): string {
  const explanations: { [key: string]: string } = {
    'draft': 'Проект создан, заполните данные компании.',
    'in_progress': 'Проект в работе, ожидается заполнение спецификации.',
    'waiting_approval': 'Ожидается подтверждение спецификации менеджером.',
    'waiting_receipt': 'Загрузите чек об оплате.',
    'receipt_approved': 'Чек подтвержден, выберите способ получения средств.',
    'filling_requisites': 'Заполните реквизиты для получения платежа.',
    'waiting_manager_receipt': 'Ожидается чек от менеджера.',
    'in_work': 'Менеджер обрабатывает ваш запрос.',
    'waiting_client_confirmation': 'Подтвердите получение средств.',
    'completed': 'Проект завершен успешно!'
  };
  return explanations[status] || 'Обратитесь к менеджеру для уточнения.';
}

function getNextStepHint(status: string, currentStep: number): string {
  const hints: { [key: string]: string } = {
    'draft': '📝 Следующий шаг: заполните данные компании',
    'in_progress': '📋 Следующий шаг: добавьте товары в спецификацию',
    'waiting_approval': '⏳ Ожидаем одобрения менеджера',
    'waiting_receipt': '📄 Следующий шаг: загрузите чек об оплате',
    'receipt_approved': '💳 Следующий шаг: выберите способ получения средств',
    'filling_requisites': '🏦 Следующий шаг: заполните реквизиты',
    'waiting_manager_receipt': '⏰ Ожидаем чек от менеджера',
    'in_work': '🔄 Менеджер готовит документы',
    'waiting_client_confirmation': '✋ Следующий шаг: подтвердите получение',
    'completed': '🎉 Проект завершён!'
  };
  return hints[status] || '';
}

function getSuggestions(userContext: any, context: string): string {
  const suggestions = [];
  
  if (context === 'project' && userContext.current_project) {
    suggestions.push('• Статус проекта', '• Текущий этап', '• Сумма проекта');
  }
  
  if (userContext.recent_projects?.length > 0) {
    suggestions.push('• Мои проекты');
  }
  
  if (userContext.suppliers_count > 0) {
    suggestions.push('• Каталог поставщиков');
  }
  
  suggestions.push('• Курсы валют', '• Транзакции', '• Создание платежа');
  
  return suggestions.join('\n');
} 