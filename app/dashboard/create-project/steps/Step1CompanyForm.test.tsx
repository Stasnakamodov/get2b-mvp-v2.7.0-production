import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1CompanyForm from './Step1CompanyForm';
import { CreateProjectProvider } from '../context/CreateProjectContext';

// Мокаем next/navigation хуки (useRouter, useSearchParams)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Мокаем supabase-клиент и связанные функции
jest.mock('@/lib/supabaseClient', () => {
  // Мок для цепочки .from().select().eq().order() и .insert(...).select().single()
  const selectChain = {
    eq: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: { initiator_role: 'client' }, error: null }),
    }),
  };
  const insertChain = {
    select: () => ({
      single: () => Promise.resolve({ data: { id: 'new-project-id' }, error: null })
    })
  };
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@test.com' } }, error: null }) },
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({}) }),
        select: () => selectChain,
        insert: () => insertChain,
      }),
      storage: {
        from: () => ({
          upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
        }),
      },
    },
  };
});

jest.mock('@/lib/telegram-client', () => ({
  sendTelegramMessageClient: jest.fn(),
  sendTelegramDocumentClient: jest.fn(),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<CreateProjectProvider>{ui}</CreateProjectProvider>);
}

describe('Step1CompanyForm', () => {
  it('рендерит без ошибок', () => {
    renderWithProvider(<Step1CompanyForm />);
    expect(screen.getByLabelText(/Название проекта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название компании/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ИНН/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/КПП/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ОГРН/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Юридический адрес/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название банка/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Расчетный счет/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Корреспондентский счет/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/БИК/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Телефон/i)).toBeInTheDocument();
  });

  it('показывает ошибку при попытке продолжить с пустыми обязательными полями', async () => {
    renderWithProvider(<Step1CompanyForm />);
    const button = screen.getByRole('button', { name: /Проверить и продолжить/i });
    fireEvent.click(button);
    expect(await screen.findByText(/Название проекта обязательно/i)).toBeInTheDocument();
    expect(await screen.findByText(/Название компании обязательно/i)).toBeInTheDocument();
    expect(await screen.findByText(/ИНН обязателен/i)).toBeInTheDocument();
  });

  it('разрешает ввод данных в поля', () => {
    renderWithProvider(<Step1CompanyForm />);
    const nameInput = screen.getByLabelText(/Название компании/i);
    fireEvent.change(nameInput, { target: { value: 'ООО Тест' } });
    expect((nameInput as HTMLInputElement).value).toBe('ООО Тест');
  });

  it('проходит валидацию при заполнении всех обязательных полей', async () => {
    renderWithProvider(<Step1CompanyForm />);
    fireEvent.change(screen.getByLabelText(/Название проекта/i), { target: { value: 'Тестовый проект' } });
    fireEvent.change(screen.getByLabelText(/Название компании/i), { target: { value: 'ООО Тест' } });
    fireEvent.change(screen.getByLabelText(/Юридическое название/i), { target: { value: 'ООО Тест Юр' } });
    fireEvent.change(screen.getByLabelText(/ИНН/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/КПП/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/ОГРН/i), { target: { value: '1234567890123' } });
    fireEvent.change(screen.getByLabelText(/Юридический адрес/i), { target: { value: 'г. Москва, ул. Тестовая, д.1' } });
    fireEvent.change(screen.getByLabelText(/Название банка/i), { target: { value: 'АО Тестбанк' } });
    fireEvent.change(screen.getByLabelText(/Расчетный счет/i), { target: { value: '40702810123450101230' } });
    fireEvent.change(screen.getByLabelText(/Корреспондентский счет/i), { target: { value: '30101810400000000225' } });
    fireEvent.change(screen.getByLabelText(/БИК/i), { target: { value: '044525225' } });
    fireEvent.change(screen.getByLabelText(/Телефон/i), { target: { value: '+7 999 123-45-67' } });
    const button = screen.getByRole('button', { name: /Проверить и продолжить/i });
    fireEvent.click(button);
    // Проверяем, что ошибок валидации нет
    expect(screen.queryByText(/обязателен/)).not.toBeInTheDocument();
  });
}); 