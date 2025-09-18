/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { useProjectSpecification } from './useProjectSpecification';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ data: [{ id: 'item-1' }, { id: 'item-2' }], error: null })),
      select: jest.fn(() => Promise.resolve({ data: [{ id: 'item-1' }, { id: 'item-2' }], error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })),
    },
  },
}));

describe('useProjectSpecification', () => {
  it('bulk insert спецификации (addItems) — успех', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-1', 'client'));
    const items = [
      { name: 'Товар 1', quantity: 2, price: 100 },
      { name: 'Товар 2', quantity: 1, price: 200 },
    ];
    await act(async () => {
      await result.current.addItems(items);
    });
    // Проверяем, что ошибок нет
    expect(result.current.error).toBeNull();
  });

  it('bulk insert спецификации — ошибка', async () => {
    // Мокаем ошибку
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    mockFrom.mockReturnValueOnce({
      insert: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Ошибка' } })),
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    });
    const { result } = renderHook(() => useProjectSpecification('project-1', 'client'));
    const items = [
      { name: '', quantity: 2, price: 100 }, // невалидное имя
    ];
    await act(async () => {
      await result.current.addItems(items);
    });
    expect(result.current.error).toBe('Ошибка');
  });

  it('ручное добавление позиции (addItem) — успех', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-2', 'client'));
    const item = { name: 'Товар 3', quantity: 5, price: 500 };
    await act(async () => {
      await result.current.addItem(item);
    });
    expect(result.current.error).toBeNull();
  });

  it('ручное добавление позиции (addItem) — ошибка, нет user_id', async () => {
    // Мокаем отсутствие user_id
    const mockAuth = require('@/lib/supabaseClient').supabase.auth.getUser;
    mockAuth.mockImplementationOnce(() => Promise.resolve({ data: { user: null }, error: null }));
    const { result } = renderHook(() => useProjectSpecification('project-2', 'client'));
    const item = { name: 'Товар 4', quantity: 1, price: 100 };
    await act(async () => {
      await result.current.addItem(item);
    });
    expect(result.current.error).toBe('Ошибка авторизации: попробуйте войти заново');
  });

  it('ручное добавление позиции (addItem) — ошибка, нет projectId', async () => {
    const { result } = renderHook(() => useProjectSpecification(null, 'client'));
    const item = { name: 'Товар 5', quantity: 1, price: 100 };
    await act(async () => {
      await result.current.addItem(item);
    });
    // Ошибка не выставляется, но консоль выводит ошибку — можно проверить, что error не изменился
    expect(result.current.error).toBeNull();
  });

  it('редактирование позиции (updateItem) — успех', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-3', 'client'));
    // Мокаем успешный update
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    mockFrom.mockReturnValueOnce({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
    });
    await act(async () => {
      await result.current.updateItem('item-1', { name: 'Товар 3 (обновлён)', price: 999 });
    });
    expect(result.current.error).toBeNull();
  });

  it('редактирование позиции (updateItem) — ошибка', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-3', 'client'));
    // Мокаем ошибку update
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    mockFrom.mockReturnValueOnce({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: { message: 'Ошибка обновления' } }))
      })),
    });
    await act(async () => {
      await result.current.updateItem('item-1', { name: '' });
    });
    expect(result.current.error).toBe('Ошибка обновления');
  });

  it('удаление позиции (deleteItem) — успех', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-4', 'client'));
    // Мокаем успешное удаление
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    mockFrom.mockReturnValueOnce({
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
    });
    await act(async () => {
      await result.current.deleteItem('item-1');
    });
    expect(result.current.error).toBeNull();
  });

  it('удаление позиции (deleteItem) — ошибка', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-4', 'client'));
    // Мокаем ошибку удаления
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    mockFrom.mockReturnValueOnce({
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: { message: 'Ошибка удаления' } }))
      })),
    });
    await act(async () => {
      await result.current.deleteItem('item-1');
    });
    expect(result.current.error).toBe('Ошибка удаления');
  });

  it('fetchSpecification возвращает актуальные данные', async () => {
    const { result } = renderHook(() => useProjectSpecification('project-5', 'client'));
    // Мокаем цепочку select/eq/order
    const mockFrom = require('@/lib/supabaseClient').supabase.from;
    const chain: any = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      order: jest.fn(() => Promise.resolve({ data: [
        { id: 'item-1', name: 'Товар 1', quantity: 2 },
        { id: 'item-2', name: 'Товар 2', quantity: 1 },
      ], error: null })),
    };
    mockFrom.mockReturnValueOnce(chain);
    await act(async () => {
      await result.current.fetchSpecification();
    });
    expect(result.current.items).toEqual([
      { id: 'item-1', name: 'Товар 1', quantity: 2 },
      { id: 'item-2', name: 'Товар 2', quantity: 1 },
    ]);
    expect(result.current.error).toBeNull();
  });
}); 