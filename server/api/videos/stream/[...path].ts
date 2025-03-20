import { defineEventHandler, createError, getRequestHeader, setResponseHeader, getQuery } from 'h3'
import { createReadStream, stat } from 'fs'
import { promisify } from 'util'
import { join, resolve } from 'path'
import { homedir } from 'os'
import type { H3Event } from 'h3'

const statAsync = promisify(stat)

// Get video directory from environment variable or use default
const VIDEO_DIR = resolve(process.env.VIDEO_DIR?.replace('~', homedir()) || './videos')

interface NodeError extends Error {
  code?: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get file path from URL and properly decode it
    const path = event.context.params?.path
    if (!path) {
      throw createError({
        statusCode: 400,
        message: 'No path provided'
      })
    }

    // Get timestamp from query if provided
    const query = getQuery(event)
    const timestamp = typeof query.t === 'string' ? parseFloat(query.t) : 0

    // Join path segments if array and decode the entire path at once
    const joinedPath = Array.isArray(path) ? path.join('/') : path
    
    // First decode the URL encoding
    let decodedPath = decodeURIComponent(joinedPath)
    
    // Then decode any remaining percent-encoded characters
    try {
      while (decodedPath.includes('%')) {
        const nextDecoded = decodeURIComponent(decodedPath)
        if (nextDecoded === decodedPath) break
        decodedPath = nextDecoded
      }
    } catch (e) {
      console.warn('[API] Additional decoding failed, using current decoded path:', e)
    }

    // Remove any leading /api/videos/stream/ from the path
    decodedPath = decodedPath.replace(/^\/?(api\/videos\/stream\/)?/, '')

    // Log the path for debugging
    console.log('[API] Streaming video path:', {
      original: path,
      joined: joinedPath,
      decoded: decodedPath,
      videoDir: VIDEO_DIR,
      timestamp
    })

    // Construct and normalize full file path
    const filePath = resolve(join(VIDEO_DIR, decodedPath))

    // Log the final file path
    console.log('[API] Final file path:', filePath)

    // Validate the path to prevent directory traversal
    if (!filePath.startsWith(VIDEO_DIR)) {
      console.error('[API] Directory traversal attempt:', {
        filePath,
        videoDir: VIDEO_DIR
      })
      throw createError({
        statusCode: 403,
        message: 'Invalid path'
      })
    }

    // Get file stats
    let stats
    try {
      stats = await statAsync(filePath)
    } catch (error) {
      const nodeError = error as NodeError
      console.error('[API] Error accessing video file:', {
        error: nodeError,
        code: nodeError.code,
        filePath
      })
      throw createError({
        statusCode: 404,
        message: `Video file not found: ${nodeError.code}`
      })
    }

    // Handle range request
    const range = getRequestHeader(event, 'range')
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
      const chunksize = (end - start) + 1

      if (start >= stats.size || end >= stats.size) {
        throw createError({
          statusCode: 416,
          message: 'Requested range not satisfiable'
        })
      }

      const stream = createReadStream(filePath, { start, end })
      setResponseHeader(event, 'Content-Range', `bytes ${start}-${end}/${stats.size}`)
      setResponseHeader(event, 'Accept-Ranges', 'bytes')
      setResponseHeader(event, 'Content-Length', chunksize)
      setResponseHeader(event, 'Content-Type', 'video/mp4')
      event.node.res.statusCode = 206

      return stream
    } else {
      // Handle full file request
      const stream = createReadStream(filePath)
      setResponseHeader(event, 'Content-Length', stats.size)
      setResponseHeader(event, 'Content-Type', 'video/mp4')
      return stream
    }
  } catch (error) {
    console.error('[API] Error streaming video:', error)
    
    const nodeError = error as NodeError
    throw createError({
      statusCode: nodeError.code === 'ENOENT' ? 404 : 500,
      message: nodeError.code === 'ENOENT' ? 'Video not found' : 'Error streaming video'
    })
  }
}) 