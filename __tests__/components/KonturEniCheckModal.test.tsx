import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KonturEniCheckModal from '@/components/KonturEniCheckModal';

// Mock fetch
global.fetch = jest.fn();

const mockCompanyData = {
  name: 'Тестовая компания',
  inn: '1234567890',
  ogrn: '1063573215232'
};

describe('KonturEniCheckModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерится с данными компании', () => {
    render(
      <KonturEniCheckModal
        open={true}
        onClose={jest.fn()}
        companyData={mockCompanyData}
      />
    );

    expect(screen.getByText('Проверка компании через Контур.Эни')).toBeInTheDocument();
    expect(screen.getByText('Тестовая компания')).toBeInTheDocument();
    expect(screen.getByText('ИНН: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('ОГРН: 1063573215232')).toBeInTheDocument();
  });

  it('закрывается при нажатии на кнопку закрытия', () => {
    const onClose = jest.fn();
    render(
      <KonturEniCheckModal
        open={true}
        onClose={onClose}
        companyData={mockCompanyData}
      />
    );

    const closeButton = screen.getByRole('button', { name: /закрыть/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('запускает проверку при нажатии кнопки "Проверить компанию"', async () => {
    const mockResponse = {
      checkId: 'test-check-id',
      status: 'Processing'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(
      <KonturEniCheckModal
        open={true}
        onClose={jest.fn()}
        companyData={mockCompanyData}
      />
    );

    const checkButton = screen.getByRole('button', { name: /проверить компанию/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/kontur-eni/check-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockCompanyData),
      });
    });
  });

  it('показывает ошибку при неудачной проверке', async () => {
    const errorMessage = 'Ошибка API';
    (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(
      <KonturEniCheckModal
        open={true}
        onClose={jest.fn()}
        companyData={mockCompanyData}
      />
    );

    const checkButton = screen.getByRole('button', { name: /проверить компанию/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument();
    });
  });

  it('показывает результаты проверки после успешного завершения', async () => {
    const mockCheckResult = {
      checkId: 'test-check-id',
      status: 'Processed',
      results: {
        bankruptcy: { status: 'clean' },
        rosfinmonitoring: { status: 'clean' }
      },
      risks: [
        {
          type: 'bankruptcy',
          severity: 'low',
          description: 'Нет рисков банкротства'
        }
      ],
      summary: {
        totalRisks: 1,
        criticalRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 1,
        overallRisk: 'low'
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkId: 'test-check-id', status: 'Processing' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCheckResult
      });

    render(
      <KonturEniCheckModal
        open={true}
        onClose={jest.fn()}
        companyData={mockCompanyData}
      />
    );

    const checkButton = screen.getByRole('button', { name: /проверить компанию/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText('Общий риск: Низкий')).toBeInTheDocument();
      expect(screen.getByText('Нет рисков банкротства')).toBeInTheDocument();
    });
  });

  it('не рендерится когда open=false', () => {
    render(
      <KonturEniCheckModal
        open={false}
        onClose={jest.fn()}
        companyData={mockCompanyData}
      />
    );

    expect(screen.queryByText('Проверка компании через Контур.Эни')).not.toBeInTheDocument();
  });
}); 