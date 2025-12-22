import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = '/api'

// Keys that should NOT be stored in localStorage (too large)
const SKIP_LOCAL_STORAGE_KEYS = ['custom-audio', 'image-pool-v2']

// Session management
let sessionPromise: Promise<void> | null = null

async function ensureSession(): Promise<void> {
  if (sessionPromise) return sessionPromise
  
  sessionPromise = (async () => {
    try {
      // Check if we already have a session
      const response = await fetch(`${API_BASE}/sessions/current`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        return // Session exists
      }
      
      // Create new session
      await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.warn('Failed to establish session, using localStorage only:', err)
    }
  })()
  
  return sessionPromise
}

/**
 * Custom hook to replace useKV from GitHub Spark.
 * Uses localStorage for small data and API for large data (images, audio).
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T | undefined, (value: T) => void] {
  const skipLocalStorage = SKIP_LOCAL_STORAGE_KEYS.includes(key)
  
  // Initialize from localStorage (only for small data)
  const getStoredValue = useCallback((): T => {
    if (skipLocalStorage) return defaultValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }, [key, defaultValue, skipLocalStorage])

  const [value, setValue] = useState<T | undefined>(() => getStoredValue())
  const isInitialized = useRef(false)

  // Load from API on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const loadFromApi = async () => {
      try {
        await ensureSession()
        
        const response = await fetch(`${API_BASE}/settings/${encodeURIComponent(key)}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.value !== null && data.value !== undefined) {
            setValue(data.value)
            // Only cache in localStorage if not a large data key
            if (!skipLocalStorage) {
              try {
                localStorage.setItem(key, JSON.stringify(data.value))
              } catch {
                // Quota exceeded, skip localStorage
              }
            }
          }
        }
      } catch (err) {
        // API not available, use localStorage value
        console.debug(`Using localStorage for ${key}:`, err)
      }
    }

    loadFromApi()
  }, [key, skipLocalStorage])

  // Update function that saves to API (and localStorage for small data)
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    
    // Save to localStorage immediately (only for small data)
    if (!skipLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (err) {
        console.warn('Failed to save to localStorage (quota exceeded?):', err)
      }
    }

    // Sync to API in background
    const syncToApi = async () => {
      try {
        await ensureSession()
        
        await fetch(`${API_BASE}/settings/${encodeURIComponent(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ value: newValue })
        })
      } catch (err) {
        console.debug(`Failed to sync ${key} to API:`, err)
      }
    }

    syncToApi()
  }, [key, skipLocalStorage])

  return [value, updateValue]
}

/**
 * API client for share functionality
 */
export const shareApi = {
  async create(config: Record<string, unknown>): Promise<string> {
    await ensureSession()
    
    const response = await fetch(`${API_BASE}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ config })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create share')
    }
    
    const data = await response.json()
    return data.guid
  },

  async get(guid: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${API_BASE}/shares/${guid}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.config
    } catch {
      return null
    }
  }
}

/**
 * Helper to check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}
