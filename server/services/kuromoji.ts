// import * as kuromoji from 'kuromoji'
import type { Token } from '~/types'

// Track initialization state
let tokenizer: any = null
let isInitializing = false
let initializationPromise: Promise<any> | null = null
let initializationAttempts = 0
const MAX_INIT_ATTEMPTS = 3
const INIT_RETRY_DELAY = 2000

// Track errors for better debugging
let lastError: Error | null = null
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 5

// Flag to track if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Add a function to dynamically import kuromoji
async function getKuromoji() {
  try {
    // In browser, we can't use kuromoji directly
    if (isBrowser) {
      console.log('[Kuromoji] Browser environment detected, kuromoji is not supported in browser')
      return null
    }
    
    // Use dynamic import for server environment
    if (process.server) {
      try {
        // Use dynamic import instead of require
        const kuromoji = await import('kuromoji')
        return kuromoji.default || kuromoji
      } catch (importError) {
        console.error('[Kuromoji] Failed to dynamically import kuromoji:', importError)
        return null
      }
    }
    
    
    // Fallback for other environments
    console.warn('[Kuromoji] Unable to import kuromoji, not in server environment')
    return null
  } catch (error) {
    console.error('[Kuromoji] Failed to import kuromoji:', error)
    return null
  }
}

export function getTokenizer() {
  return tokenizer
}

export function isInitialized() {
  return tokenizer !== null
}

export async function initializeTokenizer(): Promise<any> {
  // If in browser, don't even try to initialize
  if (isBrowser) {
    console.log('[Kuromoji] Browser environment detected, skipping initialization')
    return Promise.reject(new Error('Kuromoji is not supported in browser environment'))
  }

  // If already initialized, return the tokenizer
  if (tokenizer !== null) {
    return tokenizer
  }

  // If initialization is in progress, return the existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  isInitializing = true
  initializationAttempts++
  
  console.log(`[Kuromoji] Initializing tokenizer (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`)
  
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      const kuromoji = await getKuromoji()
      
      if (!kuromoji) {
        throw new Error('Failed to import kuromoji library')
      }
      
      kuromoji
        .builder({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err: Error | null, _tokenizer: any) => {
          if (err) {
            console.error('[Kuromoji] Failed to initialize tokenizer:', err)
            lastError = err
            consecutiveErrors++
            
            // If we haven't reached max attempts, retry after delay
            if (initializationAttempts < MAX_INIT_ATTEMPTS) {
              console.log(`[Kuromoji] Will retry initialization in ${INIT_RETRY_DELAY}ms`)
              isInitializing = false
              setTimeout(() => {
                initializationPromise = null
                initializeTokenizer().then(resolve).catch(reject)
              }, INIT_RETRY_DELAY)
              return
            }
            
            isInitializing = false
            reject(err)
            return
          }
          
          console.log('[Kuromoji] Tokenizer initialized successfully')
          tokenizer = _tokenizer
          isInitializing = false
          consecutiveErrors = 0
          lastError = null
          resolve(tokenizer)
        })
    } catch (error) {
      console.error('[Kuromoji] Exception during tokenizer initialization:', error)
      isInitializing = false
      lastError = error instanceof Error ? error : new Error(String(error))
      consecutiveErrors++
      
      // If we haven't reached max attempts, retry after delay
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`[Kuromoji] Will retry initialization in ${INIT_RETRY_DELAY}ms`)
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

export async function analyzeKuromoji(text: string, retryCount = 0): Promise<Token[]> {
  // If in browser, immediately use simple tokenization
  if (isBrowser) {
    console.log('[Kuromoji] Browser environment detected, using simple tokenization')
    return simpleTokenize(text)
  }

  // If text is empty or not a string, return empty array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Kuromoji] Empty text provided to analyzeKuromoji function')
    return []
  }

  try {
    // Ensure tokenizer is initialized
    if (!isInitialized()) {
      console.log('[Kuromoji] Tokenizer not initialized, initializing now...')
      try {
        await initializeTokenizer()
      } catch (initError) {
        console.error('[Kuromoji] Initialization failed, falling back to simple tokenization:', initError)
        return simpleTokenize(text)
      }
    }

    if (!tokenizer) {
      console.warn('[Kuromoji] Tokenizer is null, falling back to simple tokenization')
      return simpleTokenize(text)
    }

    console.log(`[Kuromoji] Analyzing text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    const tokens = tokenizer.tokenize(text)
    
    if (!tokens || tokens.length === 0) {
      console.warn('[Kuromoji] Tokenization returned empty result')
      return simpleTokenize(text)
    }
    
    console.log(`[Kuromoji] Analysis successful, received ${tokens.length} tokens`)
    consecutiveErrors = 0
    lastError = null
    
    return tokens.map((token: any) => ({
      surface_form: token.surface_form,
      basic_form: token.basic_form,
      reading: token.reading,
      pos: token.pos
    }))
  } catch (error) {
    console.error('[Kuromoji] Analysis failed:', error)
    lastError = error instanceof Error ? error : new Error(String(error))
    consecutiveErrors++
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`[Kuromoji] ${MAX_CONSECUTIVE_ERRORS} consecutive errors occurred, resetting tokenizer`)
      tokenizer = null
      isInitializing = false
      initializationPromise = null
      initializationAttempts = 0
    }
    
    // Retry if we haven't reached the maximum retry count
    if (retryCount < 2) {
      console.log(`[Kuromoji] Retrying analysis (${retryCount + 1}/2)...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return analyzeKuromoji(text, retryCount + 1)
    }
    
    // Use simple tokenization as fallback
    return simpleTokenize(text)
  }
}

// Simple tokenizer as fallback
function simpleTokenize(text: string): Token[] {
  console.log('[Kuromoji] Using simple tokenizer as fallback')
  
  // Japanese character detection regex
  const JAPANESE_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/
  
  // For Japanese text, try to split by characters for better results
  if (JAPANESE_REGEX.test(text)) {
    return Array.from(text)
      .filter(char => char.trim() !== '')
      .map(char => ({
        surface_form: char,
        basic_form: char,
        reading: char,
        pos: JAPANESE_REGEX.test(char) ? 'japanese' : 'unknown'
      }))
  }
  
  // For non-Japanese text, split by whitespace and punctuation
  return text
    .split(/(\s+|[.,!?;:])/)
    .filter(Boolean)
    .map(createSimpleToken)
} 