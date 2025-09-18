import { NextRequest } from 'next/server';
import { konturEniService } from '@/lib/services/KonturEniService';

// Mock the KonturEniService
jest.mock('@/lib/services/KonturEniService', () => ({
  konturEniService: {
    checkCompany: jest.fn(),
    getCheckResults: jest.fn(),
  },
}));

describe('KonturEni API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kontur-eni/check-company', () => {
    it('создает проверку компании успешно', async () => {
      const mockCheckResult = {
        checkId: 'test-check-id',
        status: 'Processing',
      };

      (konturEniService.checkCompany as jest.Mock).mockResolvedValue(mockCheckResult);

      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Тестовая компания',
          inn: '1234567890',
          ogrn: '1063573215232',
        }),
      });

      const { POST } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        checkId: 'test-check-id',
        status: 'Processing',
      });
      expect(konturEniService.checkCompany).toHaveBeenCalledWith({
        name: 'Тестовая компания',
        inn: '1234567890',
        ogrn: '1063573215232',
      });
    });

    it('возвращает ошибку при отсутствии обязательных полей', async () => {
      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Тестовая компания',
          // Отсутствуют inn и ogrn
        }),
      });

      const { POST } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'ИНН и ОГРН обязательны для проверки',
      });
    });

    it('обрабатывает ошибки сервиса', async () => {
      const errorMessage = 'Ошибка API Контур.Эни';
      (konturEniService.checkCompany as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Тестовая компания',
          inn: '1234567890',
          ogrn: '1063573215232',
        }),
      });

      const { POST } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: errorMessage,
      });
    });
  });

  describe('GET /api/kontur-eni/check-company', () => {
    it('получает результаты проверки успешно', async () => {
      const mockResults = {
        checkId: 'test-check-id',
        status: 'Processed',
        results: {
          bankruptcy: { status: 'clean' },
          rosfinmonitoring: { status: 'clean' },
        },
        risks: [
          {
            type: 'bankruptcy',
            severity: 'low',
            description: 'Нет рисков банкротства',
          },
        ],
        summary: {
          totalRisks: 1,
          criticalRisks: 0,
          highRisks: 0,
          mediumRisks: 0,
          lowRisks: 1,
          overallRisk: 'low',
        },
      };

      (konturEniService.getCheckResults as jest.Mock).mockResolvedValue(mockResults);

      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company?checkId=test-check-id');

      const { GET } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        ...mockResults,
      });
      expect(konturEniService.getCheckResults).toHaveBeenCalledWith('test-check-id');
    });

    it('возвращает ошибку при отсутствии checkId', async () => {
      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company');

      const { GET } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'checkId обязателен',
      });
    });

    it('обрабатывает ошибки при получении результатов', async () => {
      const errorMessage = 'Ошибка получения результатов';
      (konturEniService.getCheckResults as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request = new NextRequest('http://localhost:3000/api/kontur-eni/check-company?checkId=test-check-id');

      const { GET } = await import('@/app/api/kontur-eni/check-company/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: errorMessage,
      });
    });
  });
}); 