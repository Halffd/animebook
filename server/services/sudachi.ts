import { $fetch } from 'ofetch'
import type { Token } from '~/types'

const SUDACHI_API_URL = process.env.SUDACHI_API_URL || 'http://localhost:5000'
let isServiceAvailable = false
let lastCheckTime = 0
const CHECK_INTERVAL = 30000 // Check availability every 30 seconds
const MAX_RETRIES = 2
const RETRY_DELAY = 500
const REQUEST_TIMEOUT = 3000

async function checkServiceAvailability(): Promise<boolean> {
  const now = Date.now()
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return isServiceAvailable
  }

  try {
    await $fetch(`${SUDACHI_API_URL}/health`, {
      timeout: 1000,
      retry: 1
    })
    if (!isServiceAvailable) {
      console.log('[Sudachi] Service is now available')
    }
    isServiceAvailable = true
  } catch (error) {
    if (isServiceAvailable) {
      console.warn('[Sudachi] Service is no longer available:', error)
    }
    isServiceAvailable = false
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

export async function analyzeSudachi(text: string, mode = 'A'): Promise<Token[]> {
  // Quick check if service is available
  if (!await checkServiceAvailability()) {
    console.warn('[Sudachi] Service is not available, using simple tokenization')
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

    console.log(`[Sudachi] Analysis successful, received ${response.length} tokens`)
    return response.map((token: any) => ({
      surface_form: token.surface || token.surface_form,
      basic_form: token.dictionary_form || token.basic_form,
      reading: token.reading,
      pos: token.part_of_speech || token.pos
    }))
  } catch (error) {
    console.error('[Sudachi] Analysis failed:', error)
    isServiceAvailable = false // Mark service as unavailable after failure
    
    // Split text into basic tokens as fallback
    return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
  }
} 