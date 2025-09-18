// Простая реализация сжатия/декомпрессии
// В реальном проекте можно использовать библиотеки как lz-string или pako

export const compress = (data: string): string => {
  // В этой простой реализации мы просто возвращаем исходные данные
  // В реальном проекте здесь будет логика сжатия
  return data
}

export const decompress = (data: string): string => {
  // В этой простой реализации мы просто возвращаем исходные данные
  // В реальном проекте здесь будет логика декомпрессии
  return data
}

// Для реальной реализации сжатия можно использовать lz-string:
// import { compressToUTF16, decompressFromUTF16 } from 'lz-string'
// export const compress = (data: string): string => compressToUTF16(data)
// export const decompress = (data: string): string => decompressFromUTF16(data) || ''
