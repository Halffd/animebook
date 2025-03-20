import { defineEventHandler, createError, getRequestHeader, setResponseHeader } from 'h3'
import { createReadStream, stat } from 'fs'
import { promisify } from 'util'
import { join } from 'path'
import { homedir } from 'os'
import type { H3Event } from 'h3'

const statAsync = promisify(stat)

// Get video directory from environment variable or use default
const VIDEO_DIR = process.env.VIDEO_DIR?.replace('~', homedir()) || './videos'

interface NodeError extends Error {
  code?: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get file path from URL
    const path = event.context.params?.path
    if (!path) {
      throw createError({
        statusCode: 400,
        message: 'No path provided'
      })
    }

    // Construct full file path
    const filePath = join(VIDEO_DIR, decodeURIComponent(path))

    // Get file stats
    const stats = await statAsync(filePath)

    // Handle range request
    const range = getRequestHeader(event, 'range')
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
      const chunksize = (end - start) + 1
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