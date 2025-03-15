import { defineEventHandler } from 'h3'
import { tokenize } from '../services/tokenizer'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Test] Testing tokenizer...')
    
    // Test with a simple Japanese sentence
    const text = '私は日本語を勉強しています。'
    console.log(`[Test] Input text: ${text}`)
    
    const tokens = await tokenize(text)
    console.log('[Test] Tokenization successful!')
    
    return {
      success: true,
      message: 'Tokenization successful',
      tokens
    }
  } catch (error) {
    console.error('[Test] Tokenization failed:', error)
    
    return {
      success: false,
      message: 'Tokenization failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}) 