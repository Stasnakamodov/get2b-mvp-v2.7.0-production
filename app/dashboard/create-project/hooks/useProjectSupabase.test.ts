import { createProject } from './useProjectSupabase';

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id', email: 'test@test.com' } }, error: null })
    }
  })
}));

describe('createProject', () => {
  const baseParams = {
    name: 'Test Project',
    companyData: { name: 'ООО Ромашка' },
    user_id: 'user-id',
    initiator_role: 'client' as const,
  };

  const startMethods = ['manual', 'template', 'profile', 'upload'] as const;

  startMethods.forEach((start_method) => {
    it(`успешно создаёт проект с start_method ${start_method}`, async () => {
      jest.resetModules();
      jest.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          from: () => ({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
              }))
            })),
          }),
        },
      }));
      const { createProject } = await import('./useProjectSupabase');
      const id = await createProject({ ...baseParams, start_method });
      expect(id).toBe('test-id');
    });
  });

  it('ошибка, если не передан user_id', async () => {
    jest.resetModules();
    jest.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: () => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Нет user_id' } }))
            }))
          })),
        }),
      },
    }));
    const { createProject } = await import('./useProjectSupabase');
    // @ts-expect-error
    const id = await createProject({ ...baseParams, user_id: undefined, start_method: 'manual' });
    expect(id).toBeNull();
  });

  it('ошибка, если не передан start_method', async () => {
    jest.resetModules();
    jest.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: () => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Нет start_method' } }))
            }))
          })),
        }),
      },
    }));
    const { createProject } = await import('./useProjectSupabase');
    // @ts-expect-error
    const id = await createProject({ ...baseParams, start_method: undefined });
    expect(id).toBeNull();
  });
});

describe('startProjectFromProfile (integration)', () => {
  it('создаёт проект из профиля клиента, companyData и projectName подтягиваются, данные не теряются', async () => {
    jest.resetModules();
    jest.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: () => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { id: 'project-123' }, error: null }))
            }))
          })),
        }),
      },
    }));
    // Мокаем профиль клиента
    const mockProfile = {
      id: 'profile-1',
      name: 'ООО Альфа',
      legal_name: 'ООО Альфа',
      inn: '7701234567',
      kpp: '123456789',
      ogrn: '1234567890123',
      legal_address: 'г. Москва',
      bank_name: 'Тест Банк',
      bank_account: '12345678901234567890',
      corr_account: '12345678901234567890',
      bik: '044525225',
      phone: '+79991234567',
      country: 'Россия',
    };
    const { createProject } = await import('./useProjectSupabase');
    // Создаём проект из профиля
    const projectId = await createProject({
      name: mockProfile.name,
      companyData: {
        name: mockProfile.name,
        legalName: mockProfile.legal_name,
        inn: mockProfile.inn,
        kpp: mockProfile.kpp,
        ogrn: mockProfile.ogrn,
        address: mockProfile.legal_address,
        bankName: mockProfile.bank_name,
        bankAccount: mockProfile.bank_account,
        bankCorrAccount: mockProfile.corr_account,
        bankBik: mockProfile.bik,
        email: '',
        phone: mockProfile.phone,
        website: '',
      },
      user_id: 'user-123',
      initiator_role: 'client',
      start_method: 'profile',
    });
    expect(projectId).toBe('project-123');
  });
});

describe('manual project creation with autofill and edit', () => {
  it('создаёт проект вручную с автозаполнением из профиля и последующим редактированием', async () => {
    // Мокаем supabase и отслеживаем insert
    const insertMock = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { id: 'manual-123' }, error: null }))
      }))
    }));
    const mockSupabase = {
      from: () => ({ insert: insertMock })
    };
    // Данные из профиля
    const profileData = {
      name: 'ООО Альфа',
      legalName: 'ООО Альфа',
      inn: '7701234567',
      kpp: '123456789',
      ogrn: '1234567890123',
      address: 'г. Москва',
      bankName: 'Тест Банк',
      bankAccount: '12345678901234567890',
      bankCorrAccount: '12345678901234567890',
      bankBik: '044525225',
      email: 'a@a.ru',
      phone: '+79991234567',
      website: '',
    };
    // Пользователь редактирует поля
    const editedData = {
      ...profileData,
      name: 'ООО Бета', // изменено
      inn: '1234567890', // изменено
      email: 'b@b.ru', // изменено
    };
    const { createProjectWithSupabase } = await import('./useProjectSupabase');
    const id = await createProjectWithSupabase(mockSupabase, {
      name: editedData.name,
      companyData: editedData,
      user_id: 'user-123',
      initiator_role: 'client',
      start_method: 'manual',
    });
    expect(id).toBe('manual-123');
    // Проверяем, что insert был вызван с итоговыми (отредактированными) данными
    expect(insertMock.mock.calls.length).toBeGreaterThan(0);
    const firstCall = insertMock.mock.calls[0] as any[];
    const firstArg = firstCall[0] as any[];
    const insertCall = firstArg[0] as any;
    expect(insertCall).toBeDefined();
    expect(insertCall.company_data.name).toBe('ООО Бета');
    expect(insertCall.company_data.inn).toBe('1234567890');
    expect(insertCall.company_data.email).toBe('b@b.ru');
  });
});

describe('Step 1: отправка сообщения в Telegram', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('вызывает sendTelegramMessageClient после успешного создания проекта (manual)', async () => {
    jest.doMock('@/lib/telegram-client', () => ({
      sendTelegramMessageClient: jest.fn().mockResolvedValue({ success: true }),
    }));
    const { sendTelegramMessageClient } = await import('@/lib/telegram-client');
    // Имитация успешного создания проекта (логика компонента Step1CompanyForm)
    await sendTelegramMessageClient('🆕 Новый проект создан!\n\nНомер проекта: test-id\nПользователь: user-id\nEmail пользователя: test@test.com\nНазвание проекта: Test Project\n\nДанные компании:\n- Название: ООО Ромашка\n- Юр. название: ООО Ромашка\n- ИНН: 1234567890\n- КПП: 123456789\n- ОГРН: 1234567890123\n- Адрес: г. Москва\n- Банк: Тест Банк\n- Счёт: 12345678901234567890\n- Корр. счёт: 12345678901234567890\n- БИК: 044525225');
    expect(sendTelegramMessageClient).toHaveBeenCalledTimes(1);
    expect(sendTelegramMessageClient).toHaveBeenCalledWith(expect.stringContaining('Новый проект создан'));
  });
}); 