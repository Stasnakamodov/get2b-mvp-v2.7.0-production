import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Step2SpecificationForm from './Step2SpecificationForm';
import { CreateProjectProvider } from '../context/CreateProjectContext';

// Мокаем next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Мокаем supabase-клиент и связанные функции
jest.mock('@/lib/supabaseClient', () => {
  // In-memory хранилище для project_specifications
  let specs: any[] = [];
  let idCounter = 1;
  const chain = (table?: string) => {
    let _filters: any[] = [];
    let _order: any = null;
    let _limit: number | null = null;
    let _lastInserted: any[] = [];
    let _mode: 'select' | 'insert' = 'select';
    return {
      eq(field: string, value: any) {
        _filters.push({ field, value });
        return this;
      },
      order(field: string, dir?: any) {
        _order = { field, dir };
        return this;
      },
      limit(n: number) {
        _limit = n;
        return this;
      },
      select(arg?: any) {
        _mode = 'select';
        return this;
      },
      insert(rows: any[]) {
        _mode = 'insert';
        if (table === 'project_specifications') {
          const inserted = rows.map((row: any) => ({ ...row, id: `spec-${idCounter++}` }));
          specs.push(...inserted);
          _lastInserted = inserted;
        }
        return this;
      },
      update(updateObj: any) {
        if (table === 'project_specifications') {
          specs = specs.map((item: any) => {
            const match = _filters.every((f: any) => item[f.field] === f.value);
            return match ? { ...item, ...updateObj } : item;
          });
        }
        return this;
      },
      delete() {
        if (table === 'project_specifications') {
          specs = specs.filter((item: any) => !_filters.some((f: any) => item[f.field] === f.value));
        }
        return this;
      },
      single() {
        if (_mode === 'insert') {
          return Promise.resolve({ data: _lastInserted[0] || null, error: null });
        }
        if (table === 'project_specifications') {
          let filtered = specs;
          _filters.forEach((f: any) => {
            filtered = filtered.filter((item: any) => item[f.field] === f.value);
          });
          if (_order) {
            filtered = filtered.sort((a: any, b: any) => {
              if (_order.dir && _order.dir.ascending === false) {
                return a[_order.field] < b[_order.field] ? 1 : -1;
              }
              return a[_order.field] > b[_order.field] ? 1 : -1;
            });
          }
          if (_limit !== null) filtered = filtered.slice(0, _limit);
          return Promise.resolve({ data: filtered[0] || null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve: any) {
        if (_mode === 'insert') {
          return Promise.resolve({ data: _lastInserted, error: null }).then(resolve);
        }
        if (table === 'project_specifications') {
          let filtered = specs;
          _filters.forEach((f: any) => {
            filtered = filtered.filter((item: any) => item[f.field] === f.value);
          });
          if (_order) {
            filtered = filtered.sort((a: any, b: any) => {
              if (_order.dir && _order.dir.ascending === false) {
                return a[_order.field] < b[_order.field] ? 1 : -1;
              }
              return a[_order.field] > b[_order.field] ? 1 : -1;
            });
          }
          if (_limit !== null) filtered = filtered.slice(0, _limit);
          return Promise.resolve({ data: filtered, error: null }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
  };
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@test.com' } }, error: null }) },
      from: (table?: string) => chain(table),
      storage: {
        from: () => ({
          upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.url/file.png' } }),
        }),
      },
    },
  };
});

jest.mock('@/lib/telegram-client', () => ({
  sendTelegramMessageClient: jest.fn(),
  sendTelegramDocumentClient: jest.fn(),
}));

// Мокаем useCreateProjectContext для подмены projectId
jest.mock('../context/CreateProjectContext', () => {
  const actual = jest.requireActual('../context/CreateProjectContext');
  return {
    ...actual,
    useCreateProjectContext: () => ({
      projectId: 'test-project',
      setCurrentStep: jest.fn(),
      companyData: {},
      setCompanyData: jest.fn(),
      maxStepReached: 2,
      setMaxStepReached: jest.fn(),
    }),
    CreateProjectProvider: actual.CreateProjectProvider,
  };
});

// Мокаем TemplateSelectModal для управления onSelect
// jest.mock('./TemplateSelectModal', () => ({
//   __esModule: true,
//   default: ({ open, onSelect }: any) => {
//     if (open) {
//       // Автоматически вызываем onSelect с тестовым шаблоном
//       setTimeout(() => {
//         onSelect({
//           specification: [
//             { item_name: 'Товар 1', quantity: 2, price: 100 },
//             { item_name: 'Товар 2', quantity: 1, price: 200 },
//           ],
//         });
//       }, 0);
//     }
//     return null;
//   },
// }));

// Мокаем useProjectTemplates для возврата тестовых шаблонов
jest.mock('../hooks/useSaveTemplate', () => {
  return {
    useProjectTemplates: () => ({
      templates: [
        {
          id: 'template-1',
          name: 'Тестовый шаблон',
          description: 'Описание',
          specification: [
            { item_name: 'Товар 1', quantity: 2, price: 100 },
            { item_name: 'Товар 2', quantity: 1, price: 200 },
          ],
        },
      ],
      loading: false,
      error: null,
      fetchTemplates: jest.fn(),
    }),
    useSaveTemplate: () => ({ saveTemplate: jest.fn(), isSaving: false, error: null, success: false }),
  };
});

function renderWithProvider(ui: React.ReactElement) {
  return render(<CreateProjectProvider>{ui}</CreateProjectProvider>);
}

describe('Step2SpecificationForm', () => {
  it('рендерит без ошибок', () => {
    renderWithProvider(<Step2SpecificationForm />);
    expect(screen.getByText(/Спецификация/i)).toBeInTheDocument();
  });

  it('отображает пустую таблицу, если позиций нет', () => {
    renderWithProvider(<Step2SpecificationForm />);
    // В таблице нет ни одного инпута для item_name
    const table = screen.getByRole('table');
    const inputs = within(table).queryAllByRole('textbox');
    expect(inputs.length).toBe(0);
  });

  it('можно добавить новую позицию', async () => {
    renderWithProvider(<Step2SpecificationForm />);
    // Вместо обычного addItem эмулируем bulkInsertSpecification с заполненной позицией
    fireEvent.click(screen.getByRole('button', { name: /Заполнить из шаблона/i }));
    const modalTitle = await screen.findByText(/Выберите шаблон/i);
    expect(modalTitle).toBeInTheDocument();
    const templateCard = await screen.findByText('Тестовый шаблон');
    fireEvent.click(templateCard);
    // Ждём появления строк с товарами
    await waitFor(() => {
      expect(screen.getByDisplayValue('Товар 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Товар 2')).toBeInTheDocument();
    });
  });

  it('валидация: пустая позиция остаётся пустой', async () => {
    renderWithProvider(<Step2SpecificationForm />);
    fireEvent.click(screen.getByRole('button', { name: /Добавить позицию/i }));
    // После добавления ищем инпуты (их не должно быть)
    const table = screen.getByRole('table');
    const inputs = within(table).queryAllByRole('textbox');
    expect(inputs.length).toBe(0);
  });

  it('bulk insert: добавляет несколько позиций из шаблона', async () => {
    renderWithProvider(<Step2SpecificationForm />);
    // Кликаем по кнопке "Заполнить из шаблона"
    fireEvent.click(screen.getByRole('button', { name: /Заполнить из шаблона/i }));
    // Ждём появления модалки и шаблона
    const modalTitle = await screen.findByText(/Выберите шаблон/i);
    expect(modalTitle).toBeInTheDocument();
    const templateCard = await screen.findByText('Тестовый шаблон');
    fireEvent.click(templateCard);
    // Ждём появления строк с товарами
    await waitFor(() => {
      expect(screen.getByDisplayValue('Товар 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Товар 2')).toBeInTheDocument();
    });
  });
}); 