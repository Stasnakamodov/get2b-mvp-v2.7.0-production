/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
  }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key)
    if (!serialized) return defaultValue
    return JSON.parse(serialized) as T
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error)
    return defaultValue
  }
}

/**
 * Check storage quota
 */
export function checkStorageQuota(): { used: number; available: number; percentage: number } {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ""
      total += key.length + value.length
    }
  }

  // Approximate size of localStorage in most browsers (in bytes)
  const quota = 5 * 1024 * 1024 // 5MB
  const available = Math.max(0, quota - total)
  const percentage = (total / quota) * 100

  return {
    used: total,
    available,
    percentage,
  }
}

/**
 * Clean up old data if storage is getting full
 */
export function cleanupStorage<T>(key: string, data: T[], sortField = "createdAt", threshold = 80): T[] {
  const { percentage } = checkStorageQuota()

  if (percentage > threshold && data.length > 1) {
    // Sort by creation date (oldest first)
    const sorted = [...data].sort((a: any, b: any) => {
      const dateA = new Date(a[sortField]).getTime()
      const dateB = new Date(b[sortField]).getTime()
      return dateA - dateB
    })

    // Remove the oldest item
    const newData = sorted.slice(1)
    saveToStorage(key, newData)
    return newData
  }

  return data
}
