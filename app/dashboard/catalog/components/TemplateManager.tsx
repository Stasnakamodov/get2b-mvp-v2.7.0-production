"use client";

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Upload,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

interface Template {
  id: string;
  template_name: string;
  description?: string;
  original_filename: string;
  file_size: number;
  is_default: boolean;
  usage_count: number;
  created_at: string;
  filling_rules: any;
}

interface TemplateManagerProps {
  supplierId: string;
  supplierType: 'verified' | 'user';
  supplierName: string;
  templates: Template[];
  onTemplatesUpdate: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  supplierId,
  supplierType,
  supplierName,
  templates,
  onTemplatesUpdate
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [fillingRules, setFillingRules] = useState(`{
  "start_row": 13,
  "end_row": 24,
  "max_items": 12,
  "columns": {
    "item_name": "B",
    "quantity": "C",
    "price": "D",
    "total": "F"
  },
  "total_row": 26,
  "total_column": "F",
  "currency": "USD"
}`);

  const resetForm = () => {
    setSelectedFile(null);
    setTemplateName('');
    setDescription('');
    setIsDefault(false);
    setFillingRules(`{
  "start_row": 13,
  "end_row": 24,
  "max_items": 12,
  "columns": {
    "item_name": "B",
    "quantity": "C",
    "price": "D",
    "total": "F"
  },
  "total_row": 26,
  "total_column": "F",
  "currency": "USD"
}`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        // Auto-fill template name from filename
        if (!templateName) {
          const nameFromFile = file.name.replace(/\.(xlsx|xls)$/i, '');
          setTemplateName(nameFromFile);
        }
      } else {
        toast({
          title: "❌ Неверный тип файла",
          description: "Поддерживаются только файлы Excel (.xlsx, .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const validateJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      // Basic validation of required fields
      const required = ['start_row', 'end_row', 'columns'];
      for (const field of required) {
        if (!parsed[field]) {
          toast({
            title: "❌ Ошибка в правилах",
            description: `Отсутствует обязательное поле: ${field}`,
            variant: "destructive"
          });
          return false;
        }
      }
      return true;
    } catch (e) {
      toast({
        title: "❌ Некорректный JSON",
        description: "Проверьте синтаксис правил заполнения",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) {
      toast({
        title: "❌ Заполните обязательные поля",
        description: "Файл и название шаблона обязательны",
        variant: "destructive"
      });
      return;
    }

    if (!validateJSON(fillingRules)) {
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('supplierId', supplierId);
      formData.append('supplierType', supplierType);
      formData.append('templateName', templateName.trim());
      formData.append('description', description.trim());
      formData.append('fillingRules', fillingRules);
      formData.append('isDefault', isDefault.toString());

      const response = await fetch('/api/upload-supplier-template', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Шаблон загружен",
          description: `Шаблон "${templateName}" успешно загружен`,
          variant: "default"
        });

        resetForm();
        setShowUploadModal(false);
        onTemplatesUpdate();
      } else {
        toast({
          title: "❌ Ошибка загрузки",
          description: data.error || "Не удалось загрузить шаблон",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Ошибка сети",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Удалить шаблон "${templateName}"?`)) return;

    try {
      const response = await fetch(`/api/upload-supplier-template?templateId=${templateId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Шаблон удален",
          description: `Шаблон "${templateName}" успешно удален`,
          variant: "default"
        });
        onTemplatesUpdate();
      } else {
        toast({
          title: "❌ Ошибка удаления",
          description: data.error || "Не удалось удалить шаблон",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Ошибка сети",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Шаблоны проформ</h3>
          <p className="text-sm text-gray-600">
            Управление шаблонами для {supplierName} ({templates.length} шт.)
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Загрузить шаблон
        </Button>
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Нет загруженных шаблонов
            </h4>
            <p className="text-gray-500 mb-4">
              Загрузите Excel шаблон проформы для этого поставщика
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Загрузить первый шаблон
            </Button>
          </div>
        ) : (
          templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                      {template.is_default && (
                        <Badge variant="default" className="bg-blue-100 text-blue-700">
                          По умолчанию
                        </Badge>
                      )}
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📁 {template.original_filename}</span>
                      <span>📊 {formatFileSize(template.file_size)}</span>
                      <span>🔄 {template.usage_count} использований</span>
                      <span>📅 {new Date(template.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Show rules in modal or expandable section
                      const rulesStr = JSON.stringify(template.filling_rules, null, 2);
                      alert(`Правила заполнения:\n\n${rulesStr}`);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Правила
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.template_name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Загрузка шаблона проформы</h2>
                <p className="text-sm text-gray-600 font-normal">
                  Поставщик: {supplierName}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* File upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Excel файл шаблона *</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <div className="font-semibold">{selectedFile.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Нажмите для выбора Excel файла (.xlsx, .xls)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Название шаблона *</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Например: GAMMA Standard Proforma"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание шаблона..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked === true)}
                  />
                  <Label htmlFor="isDefault">Использовать по умолчанию</Label>
                </div>
              </div>

              {/* Right column - Rules */}
              <div className="space-y-2">
                <Label htmlFor="fillingRules">Правила заполнения (JSON) *</Label>
                <Textarea
                  id="fillingRules"
                  value={fillingRules}
                  onChange={(e) => setFillingRules(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={14}
                />
                <div className="text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Укажите правила заполнения Excel шаблона в JSON формате
                </div>
              </div>
            </div>

            {/* Help text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-900 mb-2">Как создать правила заполнения:</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• <strong>start_row/end_row</strong>: строки для товаров (например, 13-24)</li>
                    <li>• <strong>columns</strong>: маппинг полей на колонки Excel (A, B, C, etc.)</li>
                    <li>• <strong>total_row/total_column</strong>: ячейка для итоговой суммы</li>
                    <li>• <strong>currency</strong>: валюта по умолчанию</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !templateName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить шаблон
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;