import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Caption, SubtitleTrack } from '~/types'
import { makeFurigana, tokenize } from '~/server/services/tokenizer'
import { useFurigana } from '~/composables/useFurigana'
import { shouldProcessFurigana } from '~/server/services/furigana'

export const useCaptionsStore = defineStore('captions', () => {
  // Multiple subtitle tracks support
  const subtitleTracks = ref<SubtitleTrack[]>([])
  const activeTrackIndex = ref(0)
  
  // Computed property for the active track
  const activeTrack = computed(() => subtitleTracks.value[activeTrackIndex.value])
  
  // Original single track references (now points to active track)
  const captions = computed(() => activeTrack.value?.captions || [])
  
  const activeCaptionIds = ref<string[]>([])
  const isOffsetMode = ref(false)
  const isAutoPauseMode = ref(false)
  const lastPauseTime = ref<number | null>(null)
  const currentTime = ref(0)
  const showSubtitles = ref(true)
  const showSecondarySubtitles = ref(true)
  const showFurigana = ref(true)
  const isSidebarVisible = ref(true)

  // Add subtitle delay state
  const primarySubtitleDelay = ref(0)
  const secondarySubtitleDelay = ref(0)
  const customOffsets = ref<Record<string, number>>({})

  const activeCaptions = computed(() => {
    return captions.value.filter(caption => 
      activeCaptionIds.value.includes(caption.id)
    )
  })

  // Get active captions from all tracks
  const allActiveCaptions = computed(() => {
    const active: Caption[] = []
    
    // Process each track
    subtitleTracks.value.forEach((track, index) => {
      // Determine which delay to use based on whether this is the primary track
      const delay = index === activeTrackIndex.value ? primarySubtitleDelay.value : secondarySubtitleDelay.value
      
      // Find captions that would be active at current time
      const trackCaptions = track.captions.filter(caption => {
        const totalDelay = (caption.customOffset || 0) + delay
        return caption.startTime <= (currentTime.value - totalDelay) && 
               (currentTime.value - totalDelay) <= caption.endTime
      })
      
      // Add them to the active captions list
      active.push(...trackCaptions)
    })
    
    return active
  })

  // Add this function for cleaning subtitle text
  function cleanSubtitleText(text: string): string {
    return text
      // Replace ASS line breaks with spaces
      .replace(/\\N/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  }

  function parseSRT(content: string): Caption[] {
    const captions: Caption[] = []
    const blocks = content.trim().split(/\n\s*\n/)

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (lines.length < 3) continue

      // Parse timecode
      const timecode = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)
      if (!timecode) continue

      const startTime = timeToSeconds(timecode[1].replace(',', '.'))
      const endTime = timeToSeconds(timecode[2].replace(',', '.'))

      // Join and clean text lines
      const text = cleanSubtitleText(lines.slice(2).join(' '))

      captions.push({
        id: generateId(),
        startTime,
        endTime,
        text
      })
    }

    return captions
  }

  function parseASS(content: string): Caption[] | null {
    const captions: Caption[] = []
    const lines = content.split('\n')
    let inEvents = false

    for (const line of lines) {
      if (line.startsWith('[Events]')) {
        inEvents = true
        continue
      }

      if (!inEvents || !line.startsWith('Dialogue:')) continue

      const parts = line.split(',')
      if (parts.length < 10) continue

      const startTime = timeToSeconds(parts[1].trim())
      const endTime = timeToSeconds(parts[2].trim())
      // Join and clean text parts
      const text = cleanSubtitleText(parts.slice(9).join(','))

      captions.push({
        id: generateId(),
        startTime,
        endTime,
        text
      })
    }

    return captions.length > 0 ? captions : null
  }

  function parseVTT(content: string): Caption[] | null {
    const captions: Caption[] = []
    const blocks = content.split(/\n\s*\n/).slice(1) // Skip WEBVTT header

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (lines.length < 2) continue

      // Find the line with the timecode
      const timecodeLine = lines.find(line => line.includes('-->'))
      if (!timecodeLine) continue

      const timecode = timecodeLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/)
      if (!timecode) continue

      const startTime = timeToSeconds(timecode[1])
      const endTime = timeToSeconds(timecode[2])

      // Join and clean text lines, excluding the timecode line
      const text = cleanSubtitleText(
        lines.filter(line => line !== timecodeLine && !line.match(/^\d+$/)).join(' ')
      )

      captions.push({
        id: generateId(),
        startTime,
        endTime,
        text
      })
    }

    return captions.length > 0 ? captions : null
  }

  function parseCaptions(fileContent: string): Caption[] | null {
      // Try parsing as VTT first
    let parsed = parseVTT(fileContent)
      if (!parsed) {
        // Try ASS format
      parsed = parseASS(fileContent)
      }
      if (!parsed) {
        // Try SRT format
      parsed = parseSRT(fileContent)
      }
      
      if (!parsed) return null

      // Sort and process captions
    sortCaptionsByTime(parsed)
    mergeDuplicates(parsed)
    assignCaptionsToLanes(parsed)

      return parsed
  }

  function timeToSeconds(timeStr: string): number {
    const [time, ms] = timeStr.split(/[,.]/)
    const [hours, minutes, seconds] = time.split(':').map(Number)
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000
  }

  function generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  function sortCaptionsByTime(captions: Caption[]) {
      captions.sort((a, b) => {
        if (a.startTime === b.startTime) {
          return a.endTime > b.endTime ? 1 : -1
        }
        return a.startTime > b.startTime ? 1 : -1
      })
  }

  function mergeDuplicates(captions: Caption[]) {
    const merged: Caption[] = []
    let lastCaption: Caption | null = null

    for (const caption of captions) {
      if (!lastCaption) {
        lastCaption = { ...caption }
        merged.push(lastCaption)
        continue
      }

      // If captions overlap
      if (caption.startTime <= lastCaption.endTime) {
        // If it's the same text or a continuation, merge them
        if (caption.text === lastCaption.text ||
            lastCaption.text.endsWith('...') ||
            caption.text.startsWith('...')) {
          lastCaption.endTime = Math.max(lastCaption.endTime, caption.endTime)
        } else {
          // If different text, adjust timing to prevent overlap
          const gap = 0.1 // 100ms gap between subtitles
          caption.startTime = lastCaption.endTime + gap
          if (caption.startTime < caption.endTime) { // Only add if there's still duration
            lastCaption = { ...caption }
            merged.push(lastCaption)
          }
        }
      } else {
        lastCaption = { ...caption }
        merged.push(lastCaption)
      }
    }

    return merged
  }

  async function loadCaptions(fileContent: string, language?: string, title?: string) {
    try {
      let captions = parseCaptions(fileContent)
      if (!captions) return

      // Clean up captions
      captions = captions.map(caption => ({
        ...caption,
        text: cleanSubtitleText(caption.text)
      }))

      // Sort and merge
      sortCaptionsByTime(captions)
      captions = mergeDuplicates(captions)

      const { processFurigana } = useFurigana()

      console.log(`[Store] Processing furigana for ${captions.length} captions, language: ${language || 'unknown'}`)
      
      // Add metadata to track
      const trackInfo = {
        language: language || 'unknown',
        title: title || `Track ${subtitleTracks.value.length + 1}`
      }

      // Check if this track already exists (to prevent duplicates)
      const isDuplicate = subtitleTracks.value.some(track => 
        track.metadata.language === trackInfo.language && 
        track.metadata.title === trackInfo.title &&
        track.captions.length === captions.length
      )

      if (isDuplicate) {
        console.warn(`[Store] Skipping duplicate subtitle track: ${trackInfo.language} - ${trackInfo.title}`)
        return
      }

      // Process furigana and tokens for each caption
      const processingPromises = captions.map(async (caption) => {
        try {
          // Check if text contains enough Japanese characters to warrant processing
          if (shouldProcessFurigana(caption.text)) {
            // Process furigana
            const furiganaResult = await processFurigana(caption.text)
            if (furiganaResult && furiganaResult.length > 0) {
              // Convert from new format { text, furigana } to old format [text, furigana]
              caption.furigana = furiganaResult.map(item => [
                item.text, 
                item.furigana || ''
              ]) as Array<[string, string]>
              console.log(`[Store] Furigana processed for caption: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`)
            } else {
              console.warn(`[Store] No furigana generated for caption: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`)
            }
            
            // Process tokens for colored display
            try {
              const tokens = await tokenize(caption.text)
              if (tokens && tokens.length > 0) {
                caption.tokens = tokens
                console.log(`[Store] Tokens processed for caption: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`)
              }
            } catch (tokenError) {
              console.error(`[Store] Error processing tokens for caption: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`, tokenError)
            }
          } else {
            console.log(`[Store] Skipping furigana for caption with insufficient Japanese characters: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`)
          }
        } catch (error) {
          console.error(`[Store] Error processing caption: "${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}"`, error)
        }
      })
      
      // Wait for all processing to complete
      await Promise.all(processingPromises)
      
      console.log(`[Store] Caption processing completed for all captions`)

      // Add as a new track with metadata
      subtitleTracks.value.push({
        captions: captions,
        metadata: trackInfo
      })
      
      // Set as active track if it's the first one
      if (subtitleTracks.value.length === 1) {
        activeTrackIndex.value = 0
      }
      
      return subtitleTracks.value.length - 1 // Return the index of the newly added track
    } catch (error) {
      console.error(`[Store] Error loading captions:`, error)
      return null
    }
  }

  // Clear all subtitle tracks
  function clearCaptions() {
    subtitleTracks.value = []
    activeTrackIndex.value = 0
    activeCaptionIds.value = []
  }

  // Switch active track
  function setActiveTrack(index: number) {
    if (index >= 0 && index < subtitleTracks.value.length) {
      activeTrackIndex.value = index
      updateActiveCaptions()
    }
  }

  // Cycle through available tracks
  function cycleActiveTrack() {
    if (subtitleTracks.value.length <= 1) return
    
    activeTrackIndex.value = (activeTrackIndex.value + 1) % subtitleTracks.value.length
    updateActiveCaptions()
  }

  function setCurrentTime(time: number) {
    currentTime.value = time
    updateActiveCaptions()
  }

  function updateActiveCaptions() {
    // Update active captions for the current active track
    const active = activeTrack.value?.captions.filter(caption => 
      caption.startTime <= currentTime.value && 
      currentTime.value <= caption.endTime
    ) || []
    
    activeCaptionIds.value = active.map(c => c.id)
  }

  function previousCaption() {
    const currentCaption = activeCaptions.value[0]
      if (!currentCaption) return
      
    const index = captions.value.findIndex(c => c.id === currentCaption.id)
      if (index > 0) {
      playCaption(captions.value[index - 1])
    }
      }

  function nextCaption() {
    const currentCaption = activeCaptions.value[activeCaptions.value.length - 1]
      if (!currentCaption) return
      
    const index = captions.value.findIndex(c => c.id === currentCaption.id)
    if (index < captions.value.length - 1) {
      playCaption(captions.value[index + 1])
    }
  }

  function playCaption(caption: Caption) {
    setCurrentTime(caption.startTime + 0.0001)
    activeCaptionIds.value = [caption.id]
  }

  function toggleAutoPause() {
    isAutoPauseMode.value = !isAutoPauseMode.value
    lastPauseTime.value = currentTime.value
    console.log(`[Store] Auto-pause mode ${isAutoPauseMode.value ? 'enabled' : 'disabled'}`)
  }

  function toggleSubtitles() {
    showSubtitles.value = !showSubtitles.value
  }

  function toggleSecondarySubtitles() {
    showSecondarySubtitles.value = !showSecondarySubtitles.value
    console.log(`[Store] Secondary subtitles: ${showSecondarySubtitles.value ? 'ON' : 'OFF'}`)
  }

  function toggleFurigana() {
    showFurigana.value = !showFurigana.value
  }

  function toggleSidebar() {
    isSidebarVisible.value = !isSidebarVisible.value
  }

  function toggleOffsetMode() {
    isOffsetMode.value = !isOffsetMode.value
  }

  function seekToSubtitleStart() {
    if (!activeCaptions.value.length) return
    setCurrentTime(activeCaptions.value[0].startTime)
  }

  function isOverlapping(left: Caption, right: Caption): boolean {
    return (left.startTime <= right.endTime && right.startTime <= left.endTime)
  }

  function assignCaptionsToLanes(captions: Caption[]) {
    captions.forEach((caption, index) => {
      // Get previous captions that might overlap
      const previousCaptions = findPreviousCaptions(captions, index)
      
      // Find available lane
      const takenLanes = previousCaptions
        .filter(prev => isOverlapping(prev, caption))
        .map(c => c.lane)
        .filter((lane): lane is number => lane !== undefined)
      
      // Find first available lane
      let lane = 0
      while (takenLanes.includes(lane)) {
        lane++
      }
      
      caption.lane = lane
    })
  }

  function findPreviousCaptions(captions: Caption[], currentIndex: number): Caption[] {
      const previousCaptions: Caption[] = []
      const previousLanes = new Set<number>()
      const maxLookBehind = 5
      let misses = 0

      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevCaption = captions[i]
        if (prevCaption.lane !== undefined && previousLanes.has(prevCaption.lane)) {
          misses++
          if (misses > maxLookBehind) break
          continue
        }

        previousCaptions.push(prevCaption)
        if (prevCaption.lane !== undefined) {
          previousLanes.add(prevCaption.lane)
        }
      }

      return previousCaptions.sort((a, b) => 
        (a.lane ?? 0) - (b.lane ?? 0)
      )
  }

  function downloadSubtitles() {
    if (!captions.value.length) return

    const srtContent = captions.value.map((caption, index) => {
      const startTime = formatSrtTime(caption.startTime)
      const endTime = formatSrtTime(caption.endTime)
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`
      }).join('\n')

      const blob = new Blob([srtContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = 'subtitles.srt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
  }

  function formatSrtTime(seconds: number): string {
      const pad = (n: number) => n.toString().padStart(2, '0')
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms)}`
    }

  // Function to set custom offset for a specific caption
  function setCustomOffset(captionId: string, offset: number) {
    customOffsets.value[captionId] = offset
    
    // Update the caption in all tracks
    subtitleTracks.value.forEach(track => {
      const caption = track.captions.find(c => c.id === captionId)
      if (caption) {
        caption.customOffset = offset
      }
    })
  }

  // Function to adjust subtitle delay
  function adjustSubtitleDelay(isSecondary: boolean, increase: boolean) {
    const step = 0.1 // 100ms step
    if (isSecondary) {
      secondarySubtitleDelay.value += increase ? step : -step
      // Clamp the value between -200 and 200
      secondarySubtitleDelay.value = Math.max(-200, Math.min(200, secondarySubtitleDelay.value))
    } else {
      primarySubtitleDelay.value += increase ? step : -step
      // Clamp the value between -200 and 200
      primarySubtitleDelay.value = Math.max(-200, Math.min(200, primarySubtitleDelay.value))
    }
  }

  return {
    captions,
    subtitleTracks,
    activeTrackIndex,
    activeTrack,
    activeCaptionIds,
    activeCaptions,
    allActiveCaptions,
    isOffsetMode,
    isAutoPauseMode,
    lastPauseTime,
    currentTime,
    showSubtitles,
    showSecondarySubtitles,
    showFurigana,
    isSidebarVisible,
    loadCaptions,
    clearCaptions,
    setActiveTrack,
    cycleActiveTrack,
    setCurrentTime,
    updateActiveCaptions,
    previousCaption,
    nextCaption,
    playCaption,
    toggleAutoPause,
    toggleSubtitles,
    toggleSecondarySubtitles,
    toggleFurigana,
    toggleSidebar,
    toggleOffsetMode,
    seekToSubtitleStart,
    assignCaptionsToLanes,
    findPreviousCaptions,
    downloadSubtitles,
    formatSrtTime,
    primarySubtitleDelay,
    secondarySubtitleDelay,
    customOffsets,
    adjustSubtitleDelay,
    setCustomOffset,
  }
}) 