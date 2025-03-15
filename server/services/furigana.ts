import { tokenize } from './tokenizer'
import type { Token } from '~/types'

// Constants for retry mechanism
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Track errors for better debugging
let lastError: Error | null = null
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 5

// Japanese character detection regex
const HIRAGANA_REGEX = /^[\u3040-\u309F]+$/
const KATAKANA_REGEX = /^[\u30A0-\u30FF]+$/
const KANJI_REGEX = /[\u4E00-\u9FAF\u3400-\u4DBF]/

/**
 * Generates furigana for Japanese text
 * @param text The text to generate furigana for
 * @param retryCount Current retry attempt (internal use)
 * @returns An array of objects with text and furigana
 */
export async function makeFurigana(text: string, retryCount = 0): Promise<Array<{ text: string; furigana?: string }>> {
  // Validate input
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Furigana] Empty text provided to makeFurigana function')
    return []
  }

  try {
    console.log(`[Furigana] Processing text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    
    // Check if text contains Japanese characters
    if (!KANJI_REGEX.test(text) && !HIRAGANA_REGEX.test(text) && !KATAKANA_REGEX.test(text)) {
      console.log('[Furigana] Text contains no Japanese characters, skipping tokenization')
      return [{ text }]
    }
    
    // Tokenize the text
    const tokens = await tokenize(text)
    
    if (!tokens || tokens.length === 0) {
      console.warn('[Furigana] Tokenization returned no tokens')
      return [{ text }]
    }
    
    console.log(`[Furigana] Tokenization successful, processing ${tokens.length} tokens`)
    
    // Process tokens to generate furigana
    return processTokens(tokens)
  } catch (error) {
    console.error('[Furigana] Error generating furigana:', error)
    lastError = error instanceof Error ? error : new Error(String(error))
    consecutiveErrors++
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`[Furigana] ${MAX_CONSECUTIVE_ERRORS} consecutive errors occurred`)
    }
    
    // Retry if we haven't reached the maximum retry count
    if (retryCount < MAX_RETRIES) {
      console.log(`[Furigana] Retrying makeFurigana (${retryCount + 1}/${MAX_RETRIES})...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return makeFurigana(text, retryCount + 1)
    }
    
    // Return the original text if all retries fail
    return [{ text }]
  }
}

/**
 * Process tokens to generate furigana
 * @param tokens Array of tokens from the tokenizer
 * @returns Array of objects with text and furigana
 */
function processTokens(tokens: Token[]): Array<{ text: string; furigana?: string }> {
  return tokens.map(token => {
    const { surface_form, reading } = token
    
    // Skip processing if token is empty
    if (!surface_form || surface_form.trim() === '') {
      return { text: surface_form }
    }
    
    // If no reading is available, return just the text
    if (!reading || reading === surface_form) {
      return { text: surface_form }
    }
    
    // Check if the token contains kanji
    if (!KANJI_REGEX.test(surface_form)) {
      return { text: surface_form }
    }
    
    // If the reading is in katakana, convert to hiragana for furigana
    let furigana = reading
    if (KATAKANA_REGEX.test(reading)) {
      furigana = katakanaToHiragana(reading)
    }
    
    return { text: surface_form, furigana }
  })
}

/**
 * Convert katakana to hiragana
 * @param katakana Katakana string
 * @returns Hiragana string
 */
function katakanaToHiragana(katakana: string): string {
  return katakana.replace(/[\u30A1-\u30F6]/g, match => {
    const code = match.charCodeAt(0) - 0x60
    return String.fromCharCode(code)
  })
} 