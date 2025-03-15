import { makeFurigana } from '../services/furigana'
import { createError, defineEventHandler } from 'h3'

// Constants for request validation
const MAX_TEXT_LENGTH = 1000
const REQUEST_TIMEOUT = 10000 // 10 seconds

export default defineEventHandler(async (event) => {
  try {
    // Start a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
    })

    // Process the request with timeout
    const result = await Promise.race([
      processRequest(event),
      timeoutPromise
    ])

    return result
  } catch (error) {
    console.error('[API] Furigana API error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        throw createError({
          statusCode: 408,
          statusMessage: 'Request Timeout',
          message: 'The request took too long to process'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: error.message
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'An unknown error occurred'
    })
  }
})

async function processRequest(event: any) {
  // Get request body
  const body = await readBody(event)
  
  // Validate request body
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Request body is required'
    })
  }
  
  const { text } = body
  
  // Validate text
  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Text is required'
    })
  }
  
  if (typeof text !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Text must be a string'
    })
  }
  
  if (text.length > MAX_TEXT_LENGTH) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`
    })
  }
  
  // Generate furigana
  console.log(`[API] Processing furigana request for text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
  const result = await makeFurigana(text)
  
  if (!result || result.length === 0) {
    console.warn('[API] Furigana generation returned empty result')
    return [{ text }]
  }
  
  console.log(`[API] Furigana generation successful, returning ${result.length} tokens`)
  return result
} 