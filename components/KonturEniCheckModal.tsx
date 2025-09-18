import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Info, Shield, Building, Users, FileText, CreditCard } from 'lucide-react';
import { CompanyCheckResult } from '@/lib/services/KonturEniService';

interface KonturEniCheckModalProps {
  open: boolean;
  onClose: () => void;
  companyData: {
    name: string;
    inn: string;
    ogrn: string;
  };
}

const getRiskColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <XCircle className="h-4 w-4" />;
    case 'high': return <AlertTriangle className="h-4 w-4" />;
    case 'medium': return <Info className="h-4 w-4" />;
    case 'low': return <CheckCircle className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

const getOverallRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getRiskTypeIcon = (type: string) => {
  switch (type) {
    case 'bankruptcy': return <Building className="h-4 w-4" />;
    case 'rosfinmonitoring': return <Shield className="h-4 w-4" />;
    case 'arbitration': return <FileText className="h-4 w-4" />;
    case 'fssp': return <CreditCard className="h-4 w-4" />;
    case 'pledge': return <FileText className="h-4 w-4" />;
    case 'foreignAgent': return <Users className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

const getRiskTypeLabel = (type: string) => {
  switch (type) {
    case 'bankruptcy': return 'Банкротство';
    case 'rosfinmonitoring': return 'Росфинмониторинг';
    case 'arbitration': return 'Арбитражные дела';
    case 'fssp': return 'Исполнительные производства';
    case 'pledge': return 'Залоговые обязательства';
    case 'foreignAgent': return 'Иностранные агенты';
    default: return type;
  }
};

export default function KonturEniCheckModal({ open, onClose, companyData }: KonturEniCheckModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CompanyCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckCompany = async () => {
    setIsChecking(true);
    setError(null);
    setCheckResult(null);

    try {
      const response = await fetch('/api/kontur-eni/check-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inn: companyData.inn,
          ogrn: companyData.ogrn,
          name: companyData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при проверке компании');
      }

      setCheckResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsChecking(false);
    }
  };

  const renderRiskCard = (risk: any) => (
    <Card key={risk.type} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRiskTypeIcon(risk.type)}
            <CardTitle className="text-sm">{getRiskTypeLabel(risk.type)}</CardTitle>
          </div>
          <Badge className={getRiskColor(risk.severity)}>
            <div className="flex items-center gap-1">
              {getRiskIcon(risk.severity)}
              {risk.severity === 'critical' && 'Критический'}
              {risk.severity === 'high' && 'Высокий'}
              {risk.severity === 'medium' && 'Средний'}
              {risk.severity === 'low' && 'Низкий'}
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
        {risk.recommendation && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {risk.recommendation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderSummary = () => {
    if (!checkResult?.summary) return null;

    const { summary } = checkResult;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Общая оценка рисков
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalRisks}</div>
              <div className="text-sm text-gray-500">Всего рисков</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.criticalRisks}</div>
              <div className="text-sm text-gray-500">Критических</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.highRisks}</div>
              <div className="text-sm text-gray-500">Высоких</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.mediumRisks}</div>
              <div className="text-sm text-gray-500">Средних</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.lowRisks}</div>
              <div className="text-sm text-gray-500">Низких</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <Badge className={`text-lg px-4 py-2 ${getOverallRiskColor(summary.overallRisk)}`}>
              {summary.overallRisk === 'critical' && 'Критический риск'}
              {summary.overallRisk === 'high' && 'Высокий риск'}
              {summary.overallRisk === 'medium' && 'Средний риск'}
              {summary.overallRisk === 'low' && 'Низкий риск'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Проверка компании через Контур.Эни
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о компании */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о компании</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Название</label>
                  <p className="text-sm">{companyData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ИНН</label>
                  <p className="text-sm">{companyData.inn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ОГРН</label>
                  <p className="text-sm">{companyData.ogrn}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопка проверки */}
          {!checkResult && (
            <div className="flex justify-center">
              <Button 
                onClick={handleCheckCompany} 
                disabled={isChecking}
                className="w-full md:w-auto"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверяем компанию...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Запустить проверку
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Результаты проверки */}
          {checkResult && (
            <div className="space-y-6">
              {renderSummary()}
              
              {checkResult.risks && checkResult.risks.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Найденные риски</h3>
                  <div className="space-y-4">
                    {checkResult.risks.map(renderRiskCard)}
                  </div>
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Риски не обнаружены. Компания прошла проверку успешно.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 