import type { Tokenizer, Token } from '~/types'
import { analyzeSudachi } from './sudachi'

// Server-side kuromoji tokenizer
let kuromojiTokenizer: any = null
let kuromojiInitializing = false
let kuromojiInitPromise: Promise<any> | null = null

// Default tokenization method
let tokenizationMethod: 'kuromoji' | 'sudachi' = 'kuromoji'

// Client-side declarations
declare global {
  interface Window {
    kuromoji: {
      builder: (options: { dicPath: string }) => {
        build: (callback: (err: Error | null, tokenizer: any) => void) => void
      }
    }
  }
}

// Create a simple tokenizer for fallback
function createSimpleTokenizer(): Tokenizer {
  return {
    tokenize(text: string): Token[] {
      console.log(`[Tokenizer] Using simple tokenizer for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
      return text.split(/(\s+)/).filter(Boolean).map(part => ({
        surface_form: part,
        basic_form: part,
        reading: part,
        pos: 'unknown'
      }))
    }
  }
}

// Initialize server-side kuromoji
async function initServerKuromoji(): Promise<any> {
  if (kuromojiTokenizer) return kuromojiTokenizer
  if (kuromojiInitPromise) return kuromojiInitPromise

  console.log('[Server] Initializing Kuromoji tokenizer...')
  
  kuromojiInitializing = true
  kuromojiInitPromise = new Promise((resolve, reject) => {
    try {
      // In ESM context, we need to use dynamic import
      import('kuromoji').then((kuromojiModule) => {
        // Use the npm kuromoji package
        const dicPath = 'node_modules/kuromoji/dict'
        
        console.log('[Server] Building kuromoji tokenizer with dictionary path:', dicPath)
        kuromojiModule.default.builder({ dicPath }).build((err: Error | null, tokenizer: any) => {
          if (err) {
            console.error('[Server] Kuromoji initialization error:', err)
            kuromojiInitializing = false
            reject(err)
            return
          }
          
          console.log('[Server] Kuromoji tokenizer initialized successfully')
          kuromojiTokenizer = tokenizer
          kuromojiInitializing = false
          resolve(tokenizer)
        })
      }).catch(error => {
        console.error('[Server] Failed to import kuromoji module:', error)
        kuromojiInitializing = false
        reject(error)
      })
    } catch (error) {
      console.error('[Server] Error during Kuromoji initialization:', error)
      kuromojiInitializing = false
      reject(error)
    }
  })
  
  return kuromojiInitPromise.catch(error => {
    console.error('[Server] Failed to initialize kuromoji, using simple tokenizer:', error)
    return createSimpleTokenizer()
  })
}

// Initialize client-side kuromoji
async function initClientKuromoji(): Promise<Tokenizer> {
  if (kuromojiTokenizer) return kuromojiTokenizer

  return new Promise((resolve) => {
    try {
      const kuromoji = window.kuromoji
      if (!kuromoji) {
        console.warn('[Client] Kuromoji is not loaded, using simple tokenizer')
        resolve(createSimpleTokenizer())
        return
      }

      kuromoji.builder({ dicPath: '/dict' }).build((err: Error | null, t: Tokenizer) => {
        if (err) {
          console.error('[Client] Failed to initialize Kuromoji:', err)
          resolve(createSimpleTokenizer())
          return
        }
        kuromojiTokenizer = t
        resolve(t)
      })
    } catch (error) {
      console.error('[Client] Error during Kuromoji initialization:', error)
      resolve(createSimpleTokenizer())
    }
  })
}

// Initialize the appropriate tokenizer based on environment
export async function initializeTokenizer(): Promise<Tokenizer> {
  if (process.server) {
    try {
      const tokenizer = await initServerKuromoji()
      return {
        tokenize(text: string): Token[] {
          try {
            console.log(`[Server] Tokenizing with Kuromoji: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
            const tokens = tokenizer.tokenize(text)
            return tokens.map((t: any) => ({
              surface_form: t.surface_form,
              basic_form: t.basic_form || t.surface_form,
              reading: t.reading || t.surface_form,
              pos: t.pos || 'unknown'
            }))
          } catch (error) {
            console.error('[Server] Kuromoji tokenization error:', error)
            return createSimpleTokenizer().tokenize(text)
          }
        }
      }
    } catch (error) {
      console.error('[Server] Failed to initialize server tokenizer:', error)
      return createSimpleTokenizer()
    }
  } else {
    return initClientKuromoji()
  }
}

export function setTokenizationMethod(method: 'kuromoji' | 'sudachi') {
  console.log(`[Tokenizer] Setting tokenization method to: ${method}`)
  tokenizationMethod = method
}

export async function tokenize(text: string): Promise<Token[]> {
  // If text is empty or not a string, return empty array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return []
  }

  try {
    if (process.server) {
      console.log(`[Server] Tokenizing text with ${tokenizationMethod}`)
      if (tokenizationMethod === 'sudachi') {
        try {
          return await analyzeSudachi(text)
        } catch (error) {
          console.error('[Server] Sudachi tokenization failed, falling back to Kuromoji:', error)
          const tokenizer = await initializeTokenizer()
          return tokenizer.tokenize(text)
        }
      } else {
        const tokenizer = await initializeTokenizer()
        return tokenizer.tokenize(text)
      }
    } else {
      // Client-side tokenization
      if (tokenizationMethod === 'sudachi') {
        try {
          return await analyzeSudachi(text)
        } catch (error) {
          console.error('[Client] Sudachi tokenization failed:', error)
          return createSimpleTokenizer().tokenize(text)
        }
      } else {
        const tokenizer = await initClientKuromoji()
        return tokenizer.tokenize(text)
      }
    }
  } catch (error) {
    console.error(`[${process.server ? 'Server' : 'Client'}] Tokenization failed:`, error)
    return createSimpleTokenizer().tokenize(text)
  }
}

export async function makeFurigana(text: string, mode = 'A'): Promise<Array<[string, string]>> {
  // If text is empty or not a string, return simple array
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return [[text, '']]
  }

  try {
    console.log(`[${process.server ? 'Server' : 'Client'}] Generating furigana for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    const tokens = await tokenize(text)
    
    if (!tokens || tokens.length === 0) {
      console.warn(`[${process.server ? 'Server' : 'Client'}] No tokens generated for text`)
      return [[text, '']]
    }
    
    console.log(`[${process.server ? 'Server' : 'Client'}] Tokens:`, JSON.stringify(tokens))

    return tokens.map(token => {
      const surface = token.surface_form
      const reading = token.reading || surface
      
      // Only return furigana if different from surface form
      return [surface, reading !== surface ? reading : '']
    })
  } catch (error) {
    console.error(`[${process.server ? 'Server' : 'Client'}] Failed to generate furigana:`, error)
    // Return simple furigana as fallback
    return [[text, '']]
  }
} 