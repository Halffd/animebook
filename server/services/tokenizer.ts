import { analyzeKuromoji, initializeTokenizer as initializeKuromoji, isInitialized as isKuromojiInitialized } from './kuromoji'
import { analyzeSudachi } from './sudachi'
import type { Token } from '~/types'

// Track initialization state and errors
let isInitialized = false
let isInitializing = false
let initializationPromise: Promise<void> | null = null
let initializationAttempts = 0
const MAX_INIT_ATTEMPTS = 3
const INIT_RETRY_DELAY = 2000

// Default tokenization method
let tokenizationMethod: 'kuromoji' | 'sudachi' = 'kuromoji'

// Track errors for better debugging
let lastError: Error | null = null
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 5

// Japanese text detection regex
const JAPANESE_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/

export function getTokenizationMethod() {
  return tokenizationMethod
}

export function setTokenizationMethod(method: 'kuromoji' | 'sudachi') {
  console.log(`[Tokenizer] Setting tokenization method to ${method}`)
  tokenizationMethod = method
}

export async function initializeTokenizer(): Promise<void> {
  // If already initialized, return
  if (isInitialized) {
    return
  }

  // If initialization is in progress, return the existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  isInitializing = true
  initializationAttempts++
  
  console.log(`[Tokenizer] Initializing tokenizer (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`)
  
  initializationPromise = new Promise<void>(async (resolve, reject) => {
    try {
      // For server-side, initialize Kuromoji
      if (process.server) {
        console.log('[Tokenizer] Server-side initialization')
        await initializeKuromoji()
        isInitialized = true
        isInitializing = false
        consecutiveErrors = 0
        lastError = null
        console.log('[Tokenizer] Server-side initialization complete')
        resolve()
        return
      }
      
      // For client-side, we don't need to initialize anything
      console.log('[Tokenizer] Client-side initialization (no-op)')
      isInitialized = true
      isInitializing = false
      consecutiveErrors = 0
      lastError = null
      resolve()
    } catch (error) {
      console.error('[Tokenizer] Initialization failed:', error)
      isInitializing = false
      lastError = error instanceof Error ? error : new Error(String(error))
      consecutiveErrors++
      
      // If we haven't reached max attempts, retry after delay
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`[Tokenizer] Will retry initialization in ${INIT_RETRY_DELAY}ms`)
        setTimeout(() => {
          initializationPromise = null
          initializeTokenizer().then(resolve).catch(reject)
        }, INIT_RETRY_DELAY)
        return
      }
      
      reject(error)
    }
  })

  return initializationPromise
}

function createSimpleToken(text: string): Token {
  return {
    surface_form: text,
    basic_form: text,
    reading: text,
    pos: 'unknown'
  }
}

// Simple tokenizer as fallback
function simpleTokenize(text: string): Token[] {
  console.log('[Tokenizer] Using simple tokenizer as fallback')
  
  // For Japanese text, try to split by characters for better results
  if (JAPANESE_REGEX.test(text)) {
    return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
  }
  
  // For non-Japanese text, split by whitespace
  return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
}

export async function tokenize(text: string, retryCount = 0): Promise<Token[]> {
  // If text is empty or not a string, return empty array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Tokenizer] Empty text provided to tokenize function')
    return []
  }

  try {
    // Ensure tokenizer is initialized
    if (!isInitialized) {
      console.log('[Tokenizer] Not initialized, initializing now...')
      await initializeTokenizer()
    }

    // Use the selected tokenization method
    if (tokenizationMethod === 'kuromoji') {
      console.log('[Tokenizer] Using Kuromoji tokenizer')
      return await analyzeKuromoji(text)
    } else if (tokenizationMethod === 'sudachi') {
      console.log('[Tokenizer] Using Sudachi tokenizer')
      return await analyzeSudachi(text)
    } else {
      console.warn(`[Tokenizer] Unknown tokenization method: ${tokenizationMethod}, falling back to simple tokenizer`)
      return simpleTokenize(text)
    }
  } catch (error) {
    console.error('[Tokenizer] Tokenization failed:', error)
    lastError = error instanceof Error ? error : new Error(String(error))
    consecutiveErrors++
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`[Tokenizer] ${MAX_CONSECUTIVE_ERRORS} consecutive errors occurred, resetting tokenizer`)
      isInitialized = false
      isInitializing = false
      initializationPromise = null
      initializationAttempts = 0
    }
    
    // Retry if we haven't reached the maximum retry count
    if (retryCount < 2) {
      console.log(`[Tokenizer] Retrying tokenization (${retryCount + 1}/2)...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return tokenize(text, retryCount + 1)
    }
    
    // Use simple tokenizer as fallback
    return simpleTokenize(text)
  }
}

export async function makeFurigana(text: string, mode = 'A'): Promise<Array<{ text: string; furigana?: string }>> {
  // If text is empty or not a string, return simple array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Tokenizer] Empty text provided to makeFurigana function')
    return [{ text }]
  }

  try {
    console.log(`[${process.server ? 'Server' : 'Client'}] Generating furigana for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    const tokens = await tokenize(text)
    
    if (!tokens || tokens.length === 0) {
      console.warn(`[${process.server ? 'Server' : 'Client'}] No tokens generated for text, using simple fallback`)
      // For Japanese text, try to split by characters as a last resort
      if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
        return Array.from(text).map(char => ({ text: char }))
      }
      return [{ text }]
    }
    
    console.log(`[${process.server ? 'Server' : 'Client'}] Tokens:`, JSON.stringify(tokens))

    return tokens.map(token => {
      const surface = token.surface_form
      const reading = token.reading || surface
      
      // Only return furigana if different from surface form
      return { 
        text: surface, 
        furigana: reading !== surface ? reading : undefined 
      }
    })
  } catch (error) {
    console.error(`[${process.server ? 'Server' : 'Client'}] Failed to generate furigana:`, error)
    // Return simple furigana as fallback
    return [{ text }]
  }
} 