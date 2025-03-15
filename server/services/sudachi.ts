import { $fetch } from 'ofetch'
import type { Token } from '~/types'

const SUDACHI_API_URL = process.env.SUDACHI_API_URL || 'http://localhost:5000'
let isServiceAvailable = false
let lastCheckTime = 0
const CHECK_INTERVAL = 30000 // Check availability every 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const REQUEST_TIMEOUT = 5000 // Increased timeout for better reliability

// Track consecutive failures to detect persistent issues
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 5

async function checkServiceAvailability(): Promise<boolean> {
  const now = Date.now()
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return isServiceAvailable
  }

  try {
    await $fetch(`${SUDACHI_API_URL}/health`, {
      timeout: 2000, // Increased timeout for health check
      retry: 2,      // Allow retries for health check
      retryDelay: 500
    })
    
    if (!isServiceAvailable) {
      console.log('[Sudachi] Service is now available')
      consecutiveFailures = 0 // Reset failure counter on success
    }
    isServiceAvailable = true
  } catch (error) {
    if (isServiceAvailable) {
      console.warn('[Sudachi] Service is no longer available:', error)
    }
    isServiceAvailable = false
    consecutiveFailures++
    
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`[Sudachi] Service has been unavailable for ${MAX_CONSECUTIVE_FAILURES} consecutive checks`)
    }
  }

  lastCheckTime = now
  return isServiceAvailable
}

function createSimpleToken(text: string): Token {
  return {
    surface_form: text,
    basic_form: text,
    reading: text,
    pos: 'unknown'
  }
}

export async function analyzeSudachi(text: string, mode = 'A', retryCount = 0): Promise<Token[]> {
  // If text is empty or not a string, return empty array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Sudachi] Empty text provided to analyzeSudachi function')
    return []
  }

  // Quick check if service is available
  if (!await checkServiceAvailability()) {
    console.warn('[Sudachi] Service is not available, using simple tokenization')
    // For Japanese text, try to split by characters for better results
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
      return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
    }
    return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
  }

  try {
    console.log(`[Sudachi] Analyzing text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    const response = await $fetch(`${SUDACHI_API_URL}/analyze`, {
      method: 'POST',
      body: {
        text,
        mode
      },
      retry: MAX_RETRIES,
      retryDelay: RETRY_DELAY,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response || !Array.isArray(response)) {
      console.error('[Sudachi] Invalid response from API:', response)
      throw new Error('Invalid response from Sudachi API')
    }

    if (response.length === 0) {
      console.warn('[Sudachi] API returned empty token array')
      // For Japanese text, try to split by characters as a fallback
      if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
        return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
      }
      return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
    }

    console.log(`[Sudachi] Analysis successful, received ${response.length} tokens`)
    consecutiveFailures = 0 // Reset failure counter on success
    
    return response.map((token: any) => ({
      surface_form: token.surface || token.surface_form,
      basic_form: token.dictionary_form || token.basic_form,
      reading: token.reading,
      pos: token.part_of_speech || token.pos
    }))
  } catch (error) {
    console.error('[Sudachi] Analysis failed:', error)
    isServiceAvailable = false // Mark service as unavailable after failure
    consecutiveFailures++
    
    // Retry if we haven't reached the maximum retry count
    if (retryCount < MAX_RETRIES) {
      console.log(`[Sudachi] Retrying analysis (${retryCount + 1}/${MAX_RETRIES})...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return analyzeSudachi(text, mode, retryCount + 1)
    }
    
    // Split text into basic tokens as fallback
    // For Japanese text, try to split by characters for better results
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
      return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
    }
    return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
  }
} 