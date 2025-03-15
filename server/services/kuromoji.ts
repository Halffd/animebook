import * as kuromoji from 'kuromoji'
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

export function getTokenizer() {
  return tokenizer
}

export function isInitialized() {
  return tokenizer !== null
}

export async function initializeTokenizer(): Promise<any> {
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
  
  initializationPromise = new Promise((resolve, reject) => {
    try {
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
  // If text is empty or not a string, return empty array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn('[Kuromoji] Empty text provided to analyzeKuromoji function')
    return []
  }

  try {
    // Ensure tokenizer is initialized
    if (!isInitialized()) {
      console.log('[Kuromoji] Tokenizer not initialized, initializing now...')
      await initializeTokenizer()
    }

    if (!tokenizer) {
      throw new Error('Tokenizer initialization failed')
    }

    console.log(`[Kuromoji] Analyzing text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    const tokens = tokenizer.tokenize(text)
    
    if (!tokens || tokens.length === 0) {
      console.warn('[Kuromoji] Tokenization returned empty result')
      // For Japanese text, try to split by characters as a fallback
      if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
        return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
      }
      return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
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
    
    // Split text into basic tokens as fallback
    // For Japanese text, try to split by characters for better results
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
      return Array.from(text).filter(char => char.trim() !== '').map(createSimpleToken)
    }
    return text.split(/(\s+)/).filter(Boolean).map(createSimpleToken)
  }
} 