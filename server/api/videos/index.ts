import { defineEventHandler, createError } from 'h3'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { homedir } from 'os'

// Get video directory from environment variable or use default
const VIDEO_DIR = process.env.VIDEO_DIR?.replace('~', homedir()) || './videos'

// Supported video extensions
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm'])

interface VideoInfo {
  name: string
  path: string
  size: number
  lastModified: number
  isDirectory: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // Get the requested path from query parameters
    const query = getQuery(event)
    const requestedPath = typeof query.path === 'string' ? query.path : ''
    
    // Construct full directory path
    const dirPath = join(VIDEO_DIR, requestedPath)
    
    // Read directory contents
    const files = await readdir(dirPath)
    
    // Get file info for each item
    const fileInfos = await Promise.all(
      files.map(async (file): Promise<VideoInfo> => {
        const fullPath = join(dirPath, file)
        const stats = await stat(fullPath)
        const relativePath = join(requestedPath, file)
        
        return {
          name: file,
          path: relativePath,
          size: stats.size,
          lastModified: stats.mtimeMs,
          isDirectory: stats.isDirectory()
        }
      })
    )
    
    // Sort directories first, then by last modified date
    const sortedFiles = fileInfos.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return b.lastModified - a.lastModified
    })
    
    // Filter out non-video files (but keep directories)
    const videos = sortedFiles.filter(file => 
      file.isDirectory || VIDEO_EXTENSIONS.has(extname(file.name).toLowerCase())
    )
    
    return {
      videos,
      path: requestedPath,
      directory: dirPath
    }
  } catch (error) {
    console.error('[API] Error listing videos:', error)
    throw createError({
      statusCode: 500,
      message: 'Error listing videos'
    })
  }
}) 