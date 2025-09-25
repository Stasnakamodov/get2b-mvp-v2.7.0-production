'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Save, X, FileText } from 'lucide-react'

interface FileUploadFormProps {
  onSave: (data: any) => void
  onCancel: () => void
}

const FileUploadForm = ({ onSave, onCancel }: FileUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onSave({ file })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Загрузите чек пополнения счета</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button type="button" variant="outline">
            Выбрать файл
          </Button>
        </label>
      </div>

      {file && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <FileText className="h-4 w-4 text-blue-600 inline mr-2" />
          <span>Выбран файл: {file.name}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit" disabled={!file}>
          <Save className="h-4 w-4 mr-2" />
          Загрузить
        </Button>
      </div>
    </form>
  )
}

export default FileUploadForm