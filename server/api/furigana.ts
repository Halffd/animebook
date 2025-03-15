import { initializeTokenizer, makeFurigana } from '~/server/services/tokenizer'
import type { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body

    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Text is required and must be a string'
      })
    }

    if (text.length > 1000) {
      throw createError({
        statusCode: 400,
        message: 'Text is too long (maximum 1000 characters)'
      })
    }

    console.log(`[API] Processing furigana request for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    
    // Use makeFurigana directly instead of tokenizing manually
    const furigana = await makeFurigana(text)
    
    console.log(`[API] Furigana generated successfully: ${JSON.stringify(furigana)}`)
    
    return { furigana }

  } catch (error: unknown) {
    console.error('[API] Furigana API error:', error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}) 