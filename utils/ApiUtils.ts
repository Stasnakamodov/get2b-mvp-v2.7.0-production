import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

interface FileUploadConfig {
  bucket: string
  folder: string
  projectRequestId: string
  date?: string
}

interface TelegramMessageData {
  endpoint: string
  payload: Record<string, any>
}

export const uploadFileToStorage = async (
  file: File,
  config: FileUploadConfig
): Promise<{ url: string; path: string }> => {
  const { bucket, folder, projectRequestId, date = new Date().toISOString().slice(0, 10).replace(/-/g, '') } = config

  const cleanName = file.name.replace(/[^\w.-]+/g, '_').substring(0, 50)
  const filePath = `${folder}/${projectRequestId}/${date}_${cleanName}`

  console.log(`📁 Путь файла: ${filePath}`)

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true
    })

  if (error) {
    console.error('❌ Ошибка загрузки файла:', error)
    throw new Error(error.message)
  }

  console.log("✅ Файл успешно загружен в Storage:", data)

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath
  }
}

export const sendTelegramMessage = async (data: TelegramMessageData): Promise<any> => {
  const response = await fetch(`/api/${data.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data.payload)
  })

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`)
  }

  return response.json()
}

export const fetchFromApi = async (endpoint: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export const fetchCatalogData = async (
  endpoint: string,
  params?: Record<string, string>,
  session?: any
): Promise<any> => {
  const url = new URL(`/api/catalog/${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return fetchFromApi(url.toString(), { headers })
}