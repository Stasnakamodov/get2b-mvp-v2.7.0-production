"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Info, Shield } from 'lucide-react';
import KonturEniCheckModal from '@/components/KonturEniCheckModal';

export default function TestKonturEniPage() {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [testCompany, setTestCompany] = useState({
    name: 'Тестовая компания',
    inn: '1234567890',
    ogrn: '1063573215232'
  });

  const checkConfiguration = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch('/api/kontur-eni/test');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      setConfigStatus({ error: 'Ошибка при проверке конфигурации' });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const runTestCheck = async () => {
    try {
      const response = await fetch('/api/kontur-eni/check-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCompany),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Тестовая проверка запущена успешно! Проверьте логи сервера.');
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      alert('Ошибка при запуске тестовой проверки');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Тестирование интеграции Контур.Эни</h1>
        <p className="text-gray-600">Проверка настроек и функциональности API Контур.Эни</p>
      </div>

      {/* Проверка конфигурации */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Конфигурация API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkConfiguration} 
            disabled={isLoadingConfig}
            className="w-full md:w-auto"
          >
            {isLoadingConfig ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Проверяем конфигурацию...
              </>
            ) : (
              'Проверить конфигурацию'
            )}
          </Button>

          {configStatus && (
            <div className="space-y-4">
              {configStatus.error ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{configStatus.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Конфигурация проверена успешно
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">API Key</Label>
                      <p className="text-sm text-gray-600">
                        {configStatus.config?.hasApiKey ? '✅ Настроен' : '❌ Не настроен'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Org ID</Label>
                      <p className="text-sm text-gray-600">
                        {configStatus.config?.hasOrgId ? '✅ Настроен' : '❌ Не настроен'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Base URL</Label>
                      <p className="text-sm text-gray-600">{configStatus.config?.baseUrl}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Статус</Label>
                      <p className="text-sm text-gray-600">
                        {configStatus.config?.isConfigured ? '✅ Готов к работе' : '❌ Требует настройки'}
                      </p>
                    </div>
                  </div>

                  {configStatus.testCompanies && (
                    <div>
                      <Label className="text-sm font-medium">Тестовые компании</Label>
                      <div className="mt-2 space-y-2">
                        {configStatus.testCompanies.map((company: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-gray-600">{company.description}</p>
                            <p className="text-xs text-gray-500">ИНН: {company.inn} | ОГРН: {company.ogrn}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Тестовая проверка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Тестовая проверка компании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-name">Название компании</Label>
              <Input
                id="test-name"
                value={testCompany.name}
                onChange={(e) => setTestCompany({...testCompany, name: e.target.value})}
                placeholder="Тестовая компания"
              />
            </div>
            <div>
              <Label htmlFor="test-inn">ИНН</Label>
              <Input
                id="test-inn"
                value={testCompany.inn}
                onChange={(e) => setTestCompany({...testCompany, inn: e.target.value})}
                placeholder="1234567890"
              />
            </div>
            <div>
              <Label htmlFor="test-ogrn">ОГРН</Label>
              <Input
                id="test-ogrn"
                value={testCompany.ogrn}
                onChange={(e) => setTestCompany({...testCompany, ogrn: e.target.value})}
                placeholder="1063573215232"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={() => setShowCheckModal(true)}
              className="flex-1 md:flex-none"
            >
              <Shield className="mr-2 h-4 w-4" />
              Открыть модальное окно проверки
            </Button>
            <Button 
              onClick={runTestCheck}
              variant="outline"
              className="flex-1 md:flex-none"
            >
              Запустить API проверку
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Инструкции */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Инструкции по настройке
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h4>1. Получение API ключей</h4>
            <ul>
              <li>Зарегистрируйтесь на <a href="https://api.testkontur.ru/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Контур.Реестро</a></li>
              <li>Получите API ключ (apiKey) и ID организации (orgId)</li>
            </ul>

            <h4>2. Настройка переменных окружения</h4>
            <p>Добавьте в файл <code>.env.local</code>:</p>
            <pre className="bg-gray-100 p-3 rounded text-sm">
{`KONTUR_ENI_API_KEY=your_api_key_here
KONTUR_ENI_ORG_ID=your_org_id_here
KONTUR_ENI_BASE_URL=https://api.testkontur.ru/realty/assessment/v2.1`}
            </pre>

            <h4>3. Тестирование</h4>
            <ul>
              <li>Нажмите "Проверить конфигурацию" для проверки настроек</li>
              <li>Используйте тестовые данные для проверки API</li>
              <li>Проверьте работу в профиле клиента</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно проверки */}
      {showCheckModal && (
        <KonturEniCheckModal
          open={showCheckModal}
          onClose={() => setShowCheckModal(false)}
          companyData={testCompany}
        />
      )}
    </div>
  );
} 