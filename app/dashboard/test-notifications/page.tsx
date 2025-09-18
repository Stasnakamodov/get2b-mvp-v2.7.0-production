'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectStatus } from '@/lib/types/project-status'
import { Bell, Send, MessageSquare, Smartphone, Mail, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface NotificationTest {
  projectId: string
  oldStatus: ProjectStatus
  newStatus: ProjectStatus
  projectData: {
    companyName: string
    amount: number
    currency: string
  }
  recipients: {
    phone?: string
    email?: string
  }
}

interface TestResult {
  channel: string
  success: boolean
  messageId?: string
  error?: string
  sentAt: string
}

export default function TestNotificationsPage() {
  const [testData, setTestData] = useState<NotificationTest>({
    projectId: 'test-project-' + Date.now(),
    oldStatus: 'draft' as ProjectStatus,
    newStatus: 'waiting_approval' as ProjectStatus,
    projectData: {
      companyName: 'Тестовая Компания ООО',
      amount: 50000,
      currency: 'USD'
    },
    recipients: {
      phone: '+79991234567',
      email: 'test@example.com'
    }
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [availableChannels, setAvailableChannels] = useState<string[]>([])

  // Загружаем доступные каналы при монтировании
  useEffect(() => {
    loadAvailableChannels()
  }, [])

  const loadAvailableChannels = async () => {
    try {
      const response = await fetch('/api/notifications/project-status')
      const data = await response.json()
      
      if (data.success) {
        setAvailableChannels(data.availableChannels || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки каналов:', error)
    }
  }

  const testNotifications = async () => {
    setLoading(true)
    setResults([])

    try {
      const response = await fetch('/api/notifications/project-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results || [])
      } else {
        console.error('Ошибка тестирования:', data.error)
      }
    } catch (error) {
      console.error('Ошибка запроса:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'telegram': return <MessageSquare className="w-4 h-4" />
      case 'push': return <Bell className="w-4 h-4" />
      case 'sms': return <Smartphone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'telegram': return 'bg-blue-500'
      case 'push': return 'bg-purple-500'
      case 'sms': return 'bg-green-500'
      case 'email': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success 
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <XCircle className="w-4 h-4 text-red-600" />
  }

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: 'Черновик' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'waiting_approval', label: 'Ожидание одобрения' },
    { value: 'waiting_receipt', label: 'Ожидание чека' },
    { value: 'receipt_approved', label: 'Чек одобрен' },
    { value: 'receipt_rejected', label: 'Чек отклонён' },
    { value: 'filling_requisites', label: 'Заполнение реквизитов' },
    { value: 'waiting_manager_receipt', label: 'Ожидание чека от менеджера' },
    { value: 'in_work', label: 'В работе' },
    { value: 'waiting_client_confirmation', label: 'Ожидание подтверждения клиента' },
    { value: 'completed', label: 'Завершён' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔔 Тестирование уведомлений</h1>
          <p className="text-gray-600">Проверка работы Telegram, Push и SMS уведомлений</p>
        </div>

        {/* Статус каналов */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Статус каналов уведомлений
            </CardTitle>
            <CardDescription>
              Доступные каналы для отправки уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['telegram', 'push', 'sms', 'email'].map(channel => (
                <div key={channel} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    availableChannels.includes(channel) 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}></div>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel)}
                    <span className="capitalize font-medium">{channel}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Настройки теста */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Настройки теста</CardTitle>
              <CardDescription>
                Настройте параметры для тестирования уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Данные проекта */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Данные проекта</Label>
                
                <div>
                  <Label htmlFor="companyName">Название компании</Label>
                  <Input
                    id="companyName"
                    value={testData.projectData.companyName}
                    onChange={(e) => setTestData(prev => ({
                      ...prev,
                      projectData: { ...prev.projectData, companyName: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Сумма</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={testData.projectData.amount}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        projectData: { ...prev.projectData, amount: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Валюта</Label>
                    <Select 
                      value={testData.projectData.currency}
                      onValueChange={(value) => setTestData(prev => ({
                        ...prev,
                        projectData: { ...prev.projectData, currency: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Изменение статуса */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Изменение статуса</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="oldStatus">Старый статус</Label>
                    <Select 
                      value={testData.oldStatus}
                      onValueChange={(value) => setTestData(prev => ({
                        ...prev,
                        oldStatus: value as ProjectStatus
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newStatus">Новый статус</Label>
                    <Select 
                      value={testData.newStatus}
                      onValueChange={(value) => setTestData(prev => ({
                        ...prev,
                        newStatus: value as ProjectStatus
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Получатели */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Получатели</Label>
                
                <div>
                  <Label htmlFor="phone">Телефон (для SMS)</Label>
                  <Input
                    id="phone"
                    placeholder="+79991234567"
                    value={testData.recipients.phone || ''}
                    onChange={(e) => setTestData(prev => ({
                      ...prev,
                      recipients: { ...prev.recipients, phone: e.target.value }
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={testData.recipients.email || ''}
                    onChange={(e) => setTestData(prev => ({
                      ...prev,
                      recipients: { ...prev.recipients, email: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {/* Кнопка тестирования */}
              <Button 
                onClick={testNotifications}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить тестовые уведомления
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Результаты */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Результаты тестирования</CardTitle>
              <CardDescription>
                Статус отправки по каждому каналу
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Нажмите "Отправить тестовые уведомления" для начала тестирования
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg ${
                        result.success 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${getChannelColor(result.channel)} flex items-center justify-center text-white`}>
                            {getChannelIcon(result.channel)}
                          </div>
                          <span className="font-medium capitalize">{result.channel}</span>
                          {getStatusIcon(result.success)}
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Успешно' : 'Ошибка'}
                        </Badge>
                      </div>
                      
                      {result.success ? (
                        <div className="text-sm text-gray-600">
                          {result.messageId && (
                            <div>ID сообщения: <code className="bg-gray-200 px-1 rounded">{result.messageId}</code></div>
                          )}
                          <div>Отправлено: {new Date(result.sentAt).toLocaleString('ru-RU')}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          Ошибка: {result.error}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Сводка */}
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div>Всего отправлено: {results.length}</div>
                      <div>Успешно: {results.filter(r => r.success).length}</div>
                      <div>С ошибками: {results.filter(r => !r.success).length}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 