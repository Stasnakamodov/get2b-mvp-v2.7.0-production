import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/dashboard/profile/page';

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Тестовая компания',
            inn: '1234567890',
            ogrn: '1063573215232',
            email: 'test@example.com',
            logo_url: null
          }
        ],
        error: null
      })
    }))
  }
}));

// Mock KonturEniCheckModal
jest.mock('@/components/KonturEniCheckModal', () => {
  return function MockKonturEniCheckModal({ open, onClose, companyData }: any) {
    if (!open) return null;
    return (
      <div data-testid="kontur-eni-modal">
        <h2>Проверка компании</h2>
        <p>{companyData.name}</p>
        <button onClick={onClose}>Закрыть</button>
      </div>
    );
  };
});

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерится с заголовком', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Ваши карточки')).toBeInTheDocument();
    });
  });

  it('показывает кнопки добавления клиента и поставщика', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Добавить клиента')).toBeInTheDocument();
      expect(screen.getByText('Добавить поставщика')).toBeInTheDocument();
    });
  });

  it('отображает карточки клиентов', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Тестовая компания')).toBeInTheDocument();
      expect(screen.getByText('ИНН: 1234567890')).toBeInTheDocument();
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    });
  });

  it('показывает кнопку проверки в карточке клиента', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const checkButton = screen.getByTitle('Проверить компанию через Контур.Эни');
      expect(checkButton).toBeInTheDocument();
    });
  });

  it('открывает модальное окно проверки при нажатии кнопки', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const checkButton = screen.getByTitle('Проверить компанию через Контур.Эни');
      fireEvent.click(checkButton);
    });

    expect(screen.getByTestId('kontur-eni-modal')).toBeInTheDocument();
    expect(screen.getByText('Тестовая компания')).toBeInTheDocument();
  });

  it('закрывает модальное окно проверки', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const checkButton = screen.getByTitle('Проверить компанию через Контур.Эни');
      fireEvent.click(checkButton);
    });

    const closeButton = screen.getByText('Закрыть');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('kontur-eni-modal')).not.toBeInTheDocument();
  });

  it('показывает кнопки редактирования и удаления', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('aria-label')?.includes('Edit')
      );
      expect(editButton).toBeInTheDocument();
    });
  });

  it('открывает форму редактирования клиента', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('aria-label')?.includes('Edit')
      );
      if (editButton) {
        fireEvent.click(editButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Редактировать клиента')).toBeInTheDocument();
    });
  });

  it('показывает подтверждение удаления', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg') && button.getAttribute('aria-label')?.includes('Trash')
      );
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Подтвердить удаление')).toBeInTheDocument();
      expect(screen.getByText(/Вы уверены, что хотите удалить профиль/)).toBeInTheDocument();
    });
  });

  it('отображает секции клиентов и поставщиков', async () => {
    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Клиенты')).toBeInTheDocument();
      expect(screen.getByText('Поставщики')).toBeInTheDocument();
    });
  });

  it('показывает пустые слоты когда нет карточек', async () => {
    // Mock empty data
    const { supabase } = require('@/lib/supabaseClient');
    supabase.from().then.mockResolvedValueOnce({
      data: [],
      error: null
    });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Нет карточек клиентов')).toBeInTheDocument();
    });
  });
}); 