import { getTokenizationMethod, setTokenizationMethod } from '~/server/services/tokenizer'
import { createError, defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Handle GET request
    if (event.method === 'GET') {
      console.log('[API] Getting current tokenization method')
      return {
        method: getTokenizationMethod()
      }
    }
    
    // Handle POST request
    if (event.method === 'POST') {
      const body = await readBody(event)
      
      // Validate request body
      if (!body) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Request body is required'
        })
      }
      
      const { method } = body
      
      // Validate method
      if (!method) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Method is required'
        })
      }
      
      if (method !== 'kuromoji' && method !== 'sudachi') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Method must be either "kuromoji" or "sudachi"'
        })
      }
      
      // Set tokenization method
      console.log(`[API] Setting tokenization method to ${method}`)
      setTokenizationMethod(method)
      
      return {
        success: true,
        method
      }
    }
    
    // Handle unsupported methods
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
      message: `Method ${event.method} is not allowed`
    })
  } catch (error) {
    console.error('[API] Tokenizer settings API error:', error)
    
    if (error instanceof Error) {
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