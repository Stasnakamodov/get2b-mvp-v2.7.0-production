'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/test-file-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">🧪 Тест загрузки файлов аккредитации</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Изображение товара:
          </label>
          <input 
            type="file" 
            name="product_image" 
            accept="image/*" 
            required 
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Сертификат товара:
          </label>
          <input 
            type="file" 
            name="product_certificate" 
            accept=".pdf,.doc,.docx,.jpg,.png" 
            required 
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Юридический документ:
          </label>
          <input 
            type="file" 
            name="legal_document" 
            accept=".pdf,.doc,.docx,.jpg,.png" 
            required 
            className="w-full p-2 border rounded"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Отправляем...' : 'Отправить файлы'}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-4">Результат:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 