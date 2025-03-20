import { defineEventHandler, createError } from 'h3'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { homedir } from 'os'

// Get subtitle directory from environment variable or use default
const SUBTITLES_DIR = process.env.SUBTITLES_DIR?.replace('~', homedir()) || './subtitles'

// Supported subtitle extensions
const SUBTITLE_EXTENSIONS = new Set(['.srt', '.vtt', '.ass'])

interface SubtitleInfo {
  name: string
  path: string
  size: number
  lastModified: number
  language?: string
  title?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Read directory contents
    const files = await readdir(SUBTITLES_DIR)
    
    // Get info for each subtitle file
    const subtitles: SubtitleInfo[] = []
    
    for (const file of files) {
      const ext = extname(file).toLowerCase()
      if (SUBTITLE_EXTENSIONS.has(ext)) {
        const path = join(SUBTITLES_DIR, file)
        const stats = await stat(path)
        
        // Try to extract language and title from filename
        // Format: filename_language_title.ext or filename.language.ext
        const nameParts = file.slice(0, -ext.length).split('_')
        let language = 'unknown'
        let title = file
        
        if (nameParts.length >= 3) {
          // filename_language_title format
          language = nameParts[nameParts.length - 2]
          title = nameParts[nameParts.length - 1]
        } else if (nameParts[0].includes('.')) {
          // filename.language format
          const dotParts = nameParts[0].split('.')
          if (dotParts.length >= 2) {
            language = dotParts[dotParts.length - 1]
            title = dotParts.slice(0, -1).join('.')
          }
        }
        
        // Map common language codes
        const languageMap: Record<string, string> = {
          'en': 'eng',
          'ja': 'jpn',
          'es': 'spa',
          'fr': 'fre',
          'de': 'ger',
          'it': 'ita',
          'ru': 'rus',
          'pt': 'por',
          'ar': 'ara'
        }
        
        language = languageMap[language.toLowerCase()] || language
        
        subtitles.push({
          name: file,
          path: path,
          size: stats.size,
          lastModified: stats.mtimeMs,
          language,
          title
        })
      }
    }
    
    // Sort by last modified date, newest first
    subtitles.sort((a, b) => b.lastModified - a.lastModified)
    
    return {
      subtitles,
      directory: SUBTITLES_DIR
    }
  } catch (error) {
    console.error('[API] Error listing subtitles:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list subtitles'
    })
  }
}) 