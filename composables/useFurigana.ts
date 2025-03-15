import { ref } from 'vue'

// Maximum cache size to prevent memory leaks
const MAX_CACHE_SIZE = 1000

// Constants for retry mechanism
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// State variables
const isProcessing = ref(false)
const error = ref<string | null>(null)
const cache = ref<Map<string, Array<{ text: string; furigana?: string }>>>(new Map())

/**
 * Composable for processing furigana
 * @returns Functions and state for furigana processing
 */
export function useFurigana() {
  /**
   * Process text to add furigana
   * @param text The text to process
   * @param skipCache Whether to skip the cache and force a new request
   * @returns Array of objects with text and furigana
   */
  async function processFurigana(
    text: string,
    skipCache = false,
    retryCount = 0
  ): Promise<Array<{ text: string; furigana?: string }>> {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn('[useFurigana] Empty text provided to processFurigana')
      return [{ text: '' }]
    }

    // Reset error state
    error.value = null

    // Check cache first if not skipping
    if (!skipCache && cache.value.has(text)) {
      console.log('[useFurigana] Using cached furigana result')
      const cachedResult = cache.value.get(text)
      if (cachedResult && cachedResult.length > 0) {
        return cachedResult
      }
    }

    try {
      // Set processing state
      isProcessing.value = true

      console.log(`[useFurigana] Processing text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
      
      // Make API request
      const response = await $fetch('/api/furigana', {
        method: 'POST',
        body: { text },
        retry: 2,
        retryDelay: 500,
        timeout: 10000
      })

      // Validate response
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from furigana API')
      }

      // Cache the result
      if (response.length > 0) {
        // Manage cache size
        if (cache.value.size >= MAX_CACHE_SIZE) {
          // Remove oldest entry (first key)
          const firstKey = cache.value.keys().next().value
          if (firstKey) {
            cache.value.delete(firstKey)
          }
        }
        
        cache.value.set(text, response)
      }

      console.log(`[useFurigana] Processing successful, received ${response.length} tokens`)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[useFurigana] Error processing furigana:', errorMessage)
      error.value = errorMessage

      // Retry if we haven't reached the maximum retry count
      if (retryCount < MAX_RETRIES) {
        console.log(`[useFurigana] Retrying processFurigana (${retryCount + 1}/${MAX_RETRIES})...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return processFurigana(text, skipCache, retryCount + 1)
      }

      // Return the original text if all retries fail
      return [{ text }]
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Clear the furigana cache
   */
  function clearCache() {
    console.log('[useFurigana] Clearing furigana cache')
    cache.value.clear()
  }

  return {
    processFurigana,
    clearCache,
    isProcessing,
    error
  }
} 