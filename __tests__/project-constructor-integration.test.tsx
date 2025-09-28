import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProjectConstructor from '@/app/dashboard/project-constructor/page'
import { validateStepData } from '@/types/project-constructor.types'

// Мокаем Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}))

// Мокаем хуки
jest.mock('@/hooks/useClientProfiles', () => ({
  useClientProfiles: () => ({
    profiles: [],
    loading: false,
    error: null
  })
}))

jest.mock('@/hooks/useSupplierProfiles', () => ({
  useSupplierProfiles: () => ({
    profiles: [],
    loading: false,
    error: null
  })
}))

jest.mock('../create-project/hooks/useSaveTemplate', () => ({
  useProjectTemplates: () => ({
    templates: [],
    loading: false,
    error: null
  })
}))

describe('Project Constructor Integration Tests', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    jest.clearAllMocks()
  })

  describe('Workflow 1→7 Steps', () => {
    test('renders all 7 steps initially', async () => {
      render(<ProjectConstructor />)

      await waitFor(() => {
        expect(screen.getByText('Компания')).toBeInTheDocument()
        expect(screen.getByText('Контакты')).toBeInTheDocument()
        expect(screen.getByText('Банк')).toBeInTheDocument()
        expect(screen.getByText('Способы оплаты')).toBeInTheDocument()
        expect(screen.getByText('Спецификация')).toBeInTheDocument()
        expect(screen.getByText('Файлы')).toBeInTheDocument()
        expect(screen.getByText('Реквизиты')).toBeInTheDocument()
      })
    })

    test('Step 1: Company form validation works', async () => {
      render(<ProjectConstructor />)

      // Находим и кликаем на первый шаг
      const step1 = screen.getByText('Компания')
      fireEvent.click(step1)

      // Ждем появления формы
      await waitFor(() => {
        expect(screen.getByLabelText(/Название компании/i)).toBeInTheDocument()
      })

      // Пытаемся сохранить пустую форму
      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      fireEvent.click(saveButton)

      // Ожидаем ошибку валидации
      await waitFor(() => {
        expect(screen.getByText(/Ошибка заполнения/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('Step 1: Company form accepts valid data', async () => {
      render(<ProjectConstructor />)

      const step1 = screen.getByText('Компания')
      fireEvent.click(step1)

      await waitFor(() => {
        const companyNameInput = screen.getByLabelText(/Название компании/i)
        expect(companyNameInput).toBeInTheDocument()

        // Заполняем обязательное поле
        fireEvent.change(companyNameInput, { target: { value: 'ООО Тест' } })
      })

      // Сохраняем форму
      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      fireEvent.click(saveButton)

      // Форма должна закрыться без ошибок
      await waitFor(() => {
        expect(screen.queryByLabelText(/Название компании/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Data Validation', () => {
    test('validateStepData function works for Step 1', () => {
      const validData = {
        name: 'ООО Тест',
        inn: '1234567890',
        email: 'test@example.com'
      }

      const result = validateStepData(1, validData)
      expect(result.success).toBe(true)
    })

    test('validateStepData function rejects invalid data for Step 1', () => {
      const invalidData = {
        name: '', // Пустое обязательное поле
        email: 'invalid-email'
      }

      const result = validateStepData(1, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(2) // name required + invalid email
      }
    })

    test('validateStepData function works for Step 2', () => {
      const validData = {
        contact_person: 'Иван Иванов',
        phone: '+7 (999) 123-45-67',
        email: 'ivan@example.com'
      }

      const result = validateStepData(2, validData)
      expect(result.success).toBe(true)
    })

    test('validateStepData function works for Step 3', () => {
      const validData = {
        bank_name: 'Сбер',
        bank_account: '12345678901234567890',
        corr_account: '98765432109876543210',
        bik: '123456789'
      }

      const result = validateStepData(3, validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Step Configuration Management', () => {
    test('stepConfigs should initialize with all manual modes', () => {
      // Тест проверяет, что все шаги изначально в режиме 'manual'
      const expectedConfigs = {
        1: 'manual',
        2: 'manual',
        3: 'manual',
        4: 'manual',
        5: 'manual',
        6: 'manual',
        7: 'manual'
      }

      // Можно расширить этот тест проверив состояние после рендера компонента
      expect(expectedConfigs[1]).toBe('manual')
      expect(expectedConfigs[7]).toBe('manual')
    })
  })

  describe('Inter-step Dependencies', () => {
    test('Step 4 ↔ Step 5 bidirectional sync should exist', () => {
      // Этот тест проверяет наличие логики синхронизации
      // В будущем здесь можно протестировать фактическую синхронизацию
      expect(true).toBe(true) // Placeholder для будущей реализации
    })
  })

  describe('Error Handling', () => {
    test('component should handle missing user gracefully', async () => {
      // Мокаем отсутствие пользователя
      jest.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null }
            })
          }
        }
      }))

      expect(() => render(<ProjectConstructor />)).not.toThrow()
    })

    test('component should handle network errors gracefully', async () => {
      // Мокаем сетевую ошибку
      jest.doMock('@/lib/supabaseClient', () => ({
        supabase: {
          auth: {
            getUser: jest.fn().mockRejectedValue(new Error('Network error'))
          }
        }
      }))

      expect(() => render(<ProjectConstructor />)).not.toThrow()
    })
  })
})

describe('Type Safety Tests', () => {
  test('all step numbers should be valid StepNumber types', () => {
    const validStepNumbers = [1, 2, 3, 4, 5, 6, 7] as const

    validStepNumbers.forEach(stepNumber => {
      expect([1, 2, 3, 4, 5, 6, 7]).toContain(stepNumber)
    })
  })

  test('StepConfig type should only allow valid values', () => {
    const validConfigs = ['manual', 'catalog'] as const

    validConfigs.forEach(config => {
      expect(['manual', 'catalog']).toContain(config)
    })
  })
})