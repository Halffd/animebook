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
const JAPANESE_CHAR_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g

// Minimum percentage of Japanese characters required to process furigana (40%)
const MIN_JAPANESE_PERCENTAGE = 0.4

/**
 * Check if text contains enough Japanese characters to warrant furigana processing
 * @param text The text to check
 * @returns Boolean indicating if furigana should be processed
 */
export function shouldProcessFurigana(text: string): boolean {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return false
  }
  
  // Count Japanese characters
  const japaneseMatches = text.match(JAPANESE_CHAR_REGEX)
  const japaneseCount = japaneseMatches ? japaneseMatches.length : 0
  
  // Calculate percentage of Japanese characters
  const totalChars = text.replace(/\s/g, '').length // Ignore whitespace
  if (totalChars === 0) return false
  
  const japanesePercentage = japaneseCount / totalChars
  
  console.log(`[Furigana] Japanese character percentage: ${(japanesePercentage * 100).toFixed(2)}% (${japaneseCount}/${totalChars})`)
  
  return japanesePercentage >= MIN_JAPANESE_PERCENTAGE
}

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
    
    // Check if text contains enough Japanese characters
    if (!shouldProcessFurigana(text)) {
      console.log('[Furigana] Text does not contain enough Japanese characters, skipping tokenization')
      return [{ text }]
    }
    
    // Tokenize the text with better error handling
    let tokens;
    try {
      tokens = await tokenize(text)
    } catch (tokenizeError) {
      console.error('[Furigana] Tokenization failed:', tokenizeError)
      // If tokenization fails, return the original text
      return [{ text }]
    }
    
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
    const surface = token.surface_form
    const reading = token.reading
    
    // Skip processing for spaces and punctuation
    if (/^[\s\p{P}]+$/u.test(surface)) {
      return { text: surface }
    }
    
    // Only add furigana if reading is different from surface form
    // and if the surface form contains kanji
    const hasKanji = /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(surface)
    const needsFurigana = hasKanji && reading && reading !== surface
    
    // Convert katakana to hiragana if needed
    let furigana = undefined
    if (needsFurigana && reading) {
      // Check if reading is in katakana
      if (KATAKANA_REGEX.test(reading)) {
        furigana = katakanaToHiragana(reading)
      } else {
        furigana = reading
      }
    }
    
    return { 
      text: surface, 
      furigana: needsFurigana ? furigana : undefined 
    }
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