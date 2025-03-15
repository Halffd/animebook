import { ref } from 'vue'

export function useFurigana() {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const cache = new Map<string, Array<[string, string]>>()
  const MAX_CACHE_SIZE = 1000
  const MAX_RETRY_COUNT = 3
  const RETRY_DELAY = 1000

  // Simple LRU cache implementation
  function addToCache(key: string, value: Array<[string, string]>) {
    if (cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry if cache is full
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }
    cache.set(key, value)
  }

  async function processFurigana(text: string, retryCount = 0): Promise<Array<[string, string]>> {
    if (!text || text.trim() === '') {
      return [[text, '']]
    }

    // Check cache first
    if (cache.has(text)) {
      console.log(`[Client] Using cached furigana for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
      return cache.get(text)!
    }

    isProcessing.value = true
    error.value = null

    try {
      console.log(`[Client] Requesting furigana for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
      
      const response = await fetch('/api/furigana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `Failed to process furigana (${response.status})`
        
        // Retry logic for server errors
        if (response.status >= 500 && retryCount < MAX_RETRY_COUNT) {
          console.warn(`[Client] Server error, retrying (${retryCount + 1}/${MAX_RETRY_COUNT})...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
          return processFurigana(text, retryCount + 1)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.furigana || !Array.isArray(data.furigana)) {
        console.error('[Client] Invalid furigana response:', data)
        throw new Error('Invalid furigana response from server')
      }
      
      console.log(`[Client] Received furigana: ${JSON.stringify(data.furigana)}`)
      
      // Cache the result
      addToCache(text, data.furigana)
      
      return data.furigana
    } catch (e) {
      console.error('[Client] Error processing furigana:', e)
      error.value = e instanceof Error ? e.message : 'Error processing furigana'
      
      // Return a simple fallback
      const fallback: Array<[string, string]> = [[text, '']]
      return fallback
    } finally {
      isProcessing.value = false
    }
  }

  // Clear the cache
  function clearCache() {
    cache.clear()
    console.log('[Client] Furigana cache cleared')
  }

  return {
    processFurigana,
    isProcessing,
    error,
    clearCache
  }
} 