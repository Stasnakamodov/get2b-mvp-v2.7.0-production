export interface KonturEniConfig {
  apiKey: string;
  orgId: string;
  baseUrl?: string;
}

export interface CompanyCheckRequest {
  inn?: string;
  ogrn?: string;
  name?: string;
  address?: string;
}

export interface CompanyCheckResult {
  checkId: string;
  status: 'Processing' | 'Processed' | 'Failed' | 'Cancelled';
  results?: {
    organizationInfo?: any;
    bankruptcy?: any;
    rosfinmonitoring?: any;
    arbitration?: any;
    fssp?: any;
    pledge?: any;
    foreignAgent?: any;
  };
  risks?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation?: string;
  }>;
  summary?: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class KonturEniService {
  private config: KonturEniConfig;
  private baseUrl: string;

  constructor(config: KonturEniConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.testkontur.ru/realty/assessment/v2.1';
  }

  private getAuthHeader(): string {
    return `ReestroAuth apiKey=${this.config.apiKey}&portal.orgId=${this.config.orgId}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kontur API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Создает субъект (организацию) для проверки
   */
  async createSubject(companyData: CompanyCheckRequest): Promise<{ subjectId: string }> {
    const payload = {
      externalId: `company_${Date.now()}`,
      organization: {
        ...(companyData.inn && { inn: companyData.inn }),
        ...(companyData.ogrn && { ogrn: companyData.ogrn }),
        ...(companyData.name && { name: companyData.name }),
        ...(companyData.address && { address: companyData.address }),
      }
    };

    const result = await this.makeRequest('/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return { subjectId: result.subjectId };
  }

  /**
   * Запускает комплексную проверку организации
   */
  async startCompanyCheck(subjectId: string, companyData: CompanyCheckRequest): Promise<{ checkId: string }> {
    const payload = {
      correlationId: `check_${Date.now()}`,
      externalId: `company_check_${Date.now()}`,
      subjectId: subjectId,
      // Базовая информация об организации
      organizationInfo: {
        ...(companyData.inn && { inn: companyData.inn }),
        ...(companyData.ogrn && { ogrn: companyData.ogrn }),
      },
      // Проверка на банкротство
      bankruptcy: {},
      // Проверка в Росфинмониторинге
      rosfinmonitoring: {},
      // Проверка арбитражных дел
      arbitration: {},
      // Проверка исполнительных производств
      fssp: {},
      // Проверка залогов
      pledge: {},
      // Проверка на иностранных агентов
      foreignAgent: {},
    };

    const result = await this.makeRequest('/checks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return { checkId: result.checkId };
  }

  /**
   * Получает результаты проверки
   */
  async getCheckResults(checkId: string): Promise<CompanyCheckResult> {
    const result = await this.makeRequest(`/checks/${checkId}`);
    
    // Анализируем результаты и формируем риски
    const risks = this.analyzeRisks(result);
    const summary = this.calculateRiskSummary(risks);

    return {
      checkId: result.checkId,
      status: result.status,
      results: result.details,
      risks,
      summary,
    };
  }

  /**
   * Получает аналитику по нескольким проверкам
   */
  async getAnalytics(checkIds: string[]): Promise<any> {
    const payload = {
      checkIds: checkIds,
    };

    return await this.makeRequest('/checks/analytics', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Анализирует результаты проверки и формирует список рисков
   */
  private analyzeRisks(checkResult: any): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation?: string;
  }> {
    const risks: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation?: string;
    }> = [];

    // Проверка банкротства
    if (checkResult.details?.bankruptcy?.isBankrupt) {
      risks.push({
        type: 'bankruptcy',
        severity: 'critical',
        description: 'Организация находится в процессе банкротства',
        recommendation: 'Не рекомендуется заключать сделки с организацией в процессе банкротства',
      });
    }

    // Проверка Росфинмониторинга
    if (checkResult.details?.rosfinmonitoring?.isInList) {
      risks.push({
        type: 'rosfinmonitoring',
        severity: 'critical',
        description: 'Организация находится в списках Росфинмониторинга',
        recommendation: 'Требуется дополнительная проверка и согласование с руководством',
      });
    }

    // Проверка арбитражных дел
    if (checkResult.details?.arbitration?.totalCases > 0) {
      const severity = checkResult.details.arbitration.totalCases > 10 ? 'high' : 'medium';
      risks.push({
        type: 'arbitration',
        severity,
        description: `Найдено ${checkResult.details.arbitration.totalCases} арбитражных дел`,
        recommendation: 'Рекомендуется изучить характер арбитражных дел',
      });
    }

    // Проверка исполнительных производств
    if (checkResult.details?.fssp?.totalCases > 0) {
      const totalAmount = checkResult.details.fssp.totalAmount || 0;
      const severity = totalAmount > 1000000 ? 'high' : totalAmount > 100000 ? 'medium' : 'low';
      risks.push({
        type: 'fssp',
        severity,
        description: `Найдено ${checkResult.details.fssp.totalCases} исполнительных производств на сумму ${totalAmount} руб.`,
        recommendation: 'Рекомендуется проверить погашение задолженностей',
      });
    }

    // Проверка залогов
    if (checkResult.details?.pledge?.totalPledges > 0) {
      risks.push({
        type: 'pledge',
        severity: 'medium',
        description: `Найдено ${checkResult.details.pledge.totalPledges} залоговых обязательств`,
        recommendation: 'Рекомендуется проверить залоговые обязательства',
      });
    }

    // Проверка иностранных агентов
    if (checkResult.details?.foreignAgent?.isForeignAgent) {
      risks.push({
        type: 'foreignAgent',
        severity: 'high',
        description: 'Организация находится в реестре иностранных агентов',
        recommendation: 'Требуется дополнительная проверка и согласование',
      });
    }

    return risks;
  }

  /**
   * Рассчитывает общую оценку рисков
   */
  private calculateRiskSummary(risks: Array<{ severity: string }>): {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  } {
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;
    const mediumRisks = risks.filter(r => r.severity === 'medium').length;
    const lowRisks = risks.filter(r => r.severity === 'low').length;

    // Определяем общий уровень риска
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalRisks > 0) {
      overallRisk = 'critical';
    } else if (highRisks > 0) {
      overallRisk = 'high';
    } else if (mediumRisks > 0) {
      overallRisk = 'medium';
    }

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      overallRisk,
    };
  }

  /**
   * Полная проверка компании (создание субъекта + запуск проверки + получение результатов)
   */
  async checkCompany(companyData: CompanyCheckRequest): Promise<CompanyCheckResult> {
    try {
      // 1. Создаем субъект
      const { subjectId } = await this.createSubject(companyData);
      
      // 2. Запускаем проверку
      const { checkId } = await this.startCompanyCheck(subjectId, companyData);
      
      // 3. Ждем завершения проверки (polling)
      let result: CompanyCheckResult;
      let attempts = 0;
      const maxAttempts = 30; // максимум 5 минут (30 * 10 секунд)
      
      while (attempts < maxAttempts) {
        result = await this.getCheckResults(checkId);
        
        if (result.status === 'Processed') {
          return result;
        } else if (result.status === 'Failed' || result.status === 'Cancelled') {
          throw new Error(`Check failed with status: ${result.status}`);
        }
        
        // Ждем 10 секунд перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
      
      throw new Error('Check timeout - exceeded maximum attempts');
    } catch (error) {
      console.error('Kontur Eni check failed:', error);
      throw error;
    }
  }
}

// Создаем экземпляр сервиса с конфигурацией из переменных окружения
export const konturEniService = new KonturEniService({
  apiKey: process.env.KONTUR_ENI_API_KEY || '',
  orgId: process.env.KONTUR_ENI_ORG_ID || '',
  baseUrl: process.env.KONTUR_ENI_BASE_URL || 'https://api.testkontur.ru/realty/assessment/v2.1',
}); 