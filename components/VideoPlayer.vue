<script setup lang="ts">
import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
import type { Caption } from '~/types'
import { useCaptionsStore } from '~/stores/captions'
import { useSettingsStore } from '~/stores/settings'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import { useVideoControls } from '~/composables/useVideoControls'

interface HTMLVideoElementWithAudioTracks extends HTMLVideoElement {
  audioTracks?: {
    length: number
    [index: number]: {
      enabled: boolean
      language?: string
      label?: string
    }
  }
}

const props = defineProps<{
  videoUrl: string
  captions: Caption[]
  currentTime: number
  duration: number
  tracks?: { src: string; kind: string; srclang: string; label: string }[]
  onAudioTrackChange?: (track: number) => void
  videoAlignment?: 'left' | 'center' | 'right'
}>()

const emit = defineEmits<{
  (e: 'timeupdate', time: number): void
  (e: 'error', error: Error): void
  (e: 'notify', message: string): void
  (e: 'audio-track-change', track: number): void
  (e: 'playing'): void
  (e: 'pause'): void
  (e: 'videoEnd'): void
}>()

const videoRef = ref<HTMLVideoElement>()
const store = useCaptionsStore()
const settings = useSettingsStore()
const videoControls = useVideoControls()
const progressBarRef = ref<HTMLElement>()
const isPlaying = ref(false)
const isMuted = ref(false)
const showCaptions = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
let controlsTimer: number | null = null

interface AudioTrack {
  enabled: boolean
  language?: string
  label?: string
}

const audioTracks = ref<AudioTrack[]>([])
const selectedAudioTrack = ref<number>(0)
const playbackRate = ref(1)
const showSubtitleInfo = ref(false)
const isHovering = ref(false)

// Update hasSubtitles to use allActiveCaptions instead of activeCaptions
const hasSubtitles = computed(() => store.showSubtitles && store.allActiveCaptions.length > 0)

// Add computed property to check if we have secondary subtitles
const hasSecondarySubtitles = computed(() => {
  // Check if we have any active captions from secondary tracks
  return store.subtitleTracks.some((track, index) => 
    index !== store.activeTrackIndex && 
    track.captions.some(caption => 
      caption.startTime <= props.currentTime && 
      props.currentTime <= caption.endTime
    )
  )
})

// Add computed property for captions URL
const captionsUrl = computed(() => {
  if (!props.captions?.length) return ''
  
  // Create blob URL for captions
  const vttContent = generateWebVTT(props.captions)
  const blob = new Blob([vttContent], { type: 'text/vtt' })
  return URL.createObjectURL(blob)
})

// Convert video URL to streaming endpoint URL
const videoSrc = computed(() => {
  if (!props.videoUrl) return ''
  // If it's a blob URL, use it directly
  if (props.videoUrl.startsWith('blob:')) {
    return props.videoUrl
  }
  // Otherwise encode it for the streaming endpoint
  return `/api/videos/stream/${encodeURIComponent(props.videoUrl)}`
})

// Helper function to generate WebVTT content
function generateWebVTT(captions: Caption[]): string {
  const vttParts = ['WEBVTT\n\n']
  
  captions.forEach((caption, index) => {
    const startTime = formatVTTTime(caption.startTime)
    const endTime = formatVTTTime(caption.endTime)
    
    vttParts.push(`${index + 1}
${startTime} --> ${endTime}
${caption.text}\n\n`)
  })
  
  return vttParts.join('')
}

function formatVTTTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0')
  
  return `${hours}:${minutes}:${secs}.${ms}`
}

// Handle video time updates
watch(() => props.currentTime, (newTime) => {
  if (videoRef.value && Math.abs(videoRef.value.currentTime - newTime) > 0.1) {
    videoRef.value.currentTime = newTime
  }
})

function onTimeUpdate() {
  if (!videoRef.value) return
  emit('timeupdate', videoRef.value.currentTime)
}

function onError(e: Event) {
  const video = e.target as HTMLVideoElement
  emit('error', new Error(video.error?.message || 'Video error'))
}

function onLoad(e: Event) {
  const video = e.target as HTMLVideoElementWithAudioTracks
  if (!video.audioTracks || video.audioTracks.length === 0) {
    audioTracks.value = []
    selectedAudioTrack.value = -1
    return
  }

  audioTracks.value = Array.from({ 
    length: video.audioTracks.length 
  }, (_, i) => ({
    enabled: video.audioTracks?.[i]?.enabled || false,
    language: video.audioTracks?.[i]?.language,
    label: video.audioTracks?.[i]?.label
  }))
  selectedAudioTrack.value = 0
  enableAudioTrack(0)
}

function enableAudioTrack(index: number) {
  const video = videoRef.value as HTMLVideoElementWithAudioTracks | undefined
  if (!video?.audioTracks) return

  for (let i = 0; i < video.audioTracks.length; i++) {
    if (video.audioTracks[i]) {
      video.audioTracks[i].enabled = i === index
    }
  }
  selectedAudioTrack.value = index
}

function cycleAudioTrack() {
  if (!audioTracks.value.length) return
  
  const nextTrack = (selectedAudioTrack.value + 1) % audioTracks.value.length
  enableAudioTrack(nextTrack)
  
  const track = audioTracks.value[nextTrack]
  emit('notify', `Audio Track: ${nextTrack + 1}/${audioTracks.value.length}` +
    (track.language ? ` [${track.language}]` : '') +
    (track.label ? ` ${track.label}` : ''))
  
  emit('audio-track-change', nextTrack)
}

function adjustPlaybackRate(increase: boolean) {
  const video = videoRef.value
  if (!video) return

  let rate = video.playbackRate
  rate += increase ? 0.05 : -0.05
  rate = Math.max(0.25, Math.min(3, parseFloat(rate.toFixed(2))))
  
  video.playbackRate = rate
  playbackRate.value = rate
  emit('notify', `Playback speed: ${rate.toFixed(2)}x`)
}

// Toggle subtitle track info display
function toggleSubtitleInfo() {
  showSubtitleInfo.value = !showSubtitleInfo.value
  emit('notify', `Subtitle info: ${showSubtitleInfo.value ? 'ON' : 'OFF'}`)
}

// Add ASS tag processing function
function processAssText(text: string): { text: string, position?: string } {
  // Extract ASS tags
  const assTagRegex = /\{([^}]+)\}/g
  let position = 'middle' // Default position
  
  // Process ASS tags
  text = text.replace(assTagRegex, (match, tags) => {
    // Handle \an tags
    const anMatch = tags.match(/\\an?(\d)/)
    if (anMatch) {
      const anValue = parseInt(anMatch[1])
      switch (anValue) {
        case 1: position = 'bottom-left'; break;
        case 2: position = 'bottom'; break;
        case 3: position = 'bottom-right'; break;
        case 4: position = 'middle-left'; break;
        case 5: position = 'middle'; break;
        case 6: position = 'middle-right'; break;
        case 7: position = 'top-left'; break;
        case 8: position = 'top'; break;
        case 9: position = 'top-right'; break;
      }
    }
    
    // Handle SVG tags
    if (tags.includes('\\p1')) {
      // Keep SVG drawing commands
      return match
    }
    
    // Remove other ASS tags
    return ''
  })
  
  return { text, position }
}

// Update processText function
function processText(text: string): { text: string, position?: string } {
  // First apply regex replacements if enabled
  let processed = text
  if (settings.regexReplacementsEnabled && settings.regexReplacements.length) {
    processed = settings.regexReplacements.reduce((processed, { regex, replaceText }) => {
      try {
        return processed.replace(new RegExp(regex, 'g'), replaceText)
      } catch (e) {
        return processed
      }
    }, processed)
  }
  
  // Process ASS tags and get positioning
  const { text: cleanText, position } = processAssText(processed)
  processed = cleanText
  
  // Remove SRT/ASS HTML tags that shouldn't be displayed
  processed = processed
    .replace(/<\/?font[^>]*>/gi, '')
    .replace(/<\/?b>/gi, '')
    .replace(/<\/?i>/gi, '')
    .replace(/<\/?u>/gi, '')
    .replace(/<\/?s>/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
  
  // Check if text contains Japanese characters
  const japaneseMatches = processed.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g)
  const japaneseCount = japaneseMatches ? japaneseMatches.length : 0
  const totalChars = processed.replace(/\s/g, '').length
  const isJapanese = totalChars > 0 && (japaneseCount / totalChars) >= 0.4
  
  if (!isJapanese) {
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/([.!?,:;])([a-zA-Z])/g, '$1 $2')
      .trim()
  }
  
  return { text: processed, position }
}

// Process tokens for colored display
function processTokens(tokens: any[]): any[] {
  if (!tokens || !Array.isArray(tokens)) return []
  
  return tokens.map(token => {
    // Ensure token has all required properties
    return {
      surface_form: token.surface_form || token[0] || '',
      reading: token.reading || token[1] || '',
      pos: token.pos || ''
    }
  })
}

// Add position saving
let savePositionInterval: number | null = null

onMounted(() => {
  // Restore saved position
  if (videoRef.value && props.videoUrl) {
    const savedPosition = settings.getVideoPosition(props.videoUrl)
    if (savedPosition > 0) {
      videoRef.value.currentTime = savedPosition
    }
  }

  // Save position periodically
  savePositionInterval = window.setInterval(() => {
    if (videoRef.value && props.videoUrl) {
      settings.saveVideoPosition(props.videoUrl, videoRef.value.currentTime)
    }
  }, 5000) // Save every 5 seconds

  useKeyboardShortcuts({
    ' ': () => togglePlay(),
    'ArrowLeft': () => store.previousCaption(),
    'ArrowRight': () => store.nextCaption(),
    'a': () => store.previousCaption(),
    'd': () => store.nextCaption(),
    's': () => store.seekToSubtitleStart(),
    'ArrowDown': () => store.seekToSubtitleStart(),
    'w': () => store.toggleAutoPause(),
    'ArrowUp': () => store.toggleAutoPause(),
    'p': () => store.isAutoPauseMode = false,
    'c': () => store.toggleSecondarySubtitles(),
    'v': () => store.toggleSubtitles(),
    'V': () => store.toggleSubtitles(), // Shift+V
    'f': () => store.toggleFurigana(),
    'g': () => settings.colorizeWords = !settings.colorizeWords,
    'i': () => store.toggleSidebar(),
    'x': () => store.toggleSidebar(),
    't': () => cycleAudioTrack(),
    'y': () => store.cycleActiveTrack(),
    'h': () => settings.toggleRegexReplacements(),
    'e': () => exportCurrentCaption(),
    'PageUp': () => skipTime(87),
    'PageDown': () => skipTime(-87),
    'm': () => increasePlaybackRate(),
    'n': () => decreasePlaybackRate(),
    '=': () => settings.adjustFontSize(false, true),
    '-': () => settings.adjustFontSize(false, false),
    '+': () => settings.adjustFontSize(false, true),
    '_': () => settings.adjustFontSize(false, false),
    ']': () => settings.adjustFontSize(true, true),
    '[': () => settings.adjustFontSize(true, false),
    '}': () => settings.adjustFontSize(true, true),
    '{': () => settings.adjustFontSize(true, false),
  })

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Subtitle delay adjustments
    if (e.key === 'z' || e.key === 'x') {
      e.preventDefault()
      const isIncrease = e.key === 'x'
      if (e.shiftKey) {
        // Secondary subtitle delay
        store.adjustSubtitleDelay(true, isIncrease)
        videoControls.showNotification(`Secondary subtitle delay: ${store.secondarySubtitleDelay.toFixed(1)}s`)
      } else {
        // Primary subtitle delay
        store.adjustSubtitleDelay(false, isIncrease)
        videoControls.showNotification(`Primary subtitle delay: ${store.primarySubtitleDelay.toFixed(1)}s`)
      }
    }

    // Frame navigation
    if (e.key === ',' || e.key === '.') {
      e.preventDefault()
      if (e.key === ',') {
        previousFrame()
      } else {
        nextFrame()
      }
    }
  })

  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => {
      emit('playing')
      isPlaying.value = true
    })
    videoRef.value.addEventListener('pause', () => {
      emit('pause')
      isPlaying.value = false
    })
  }

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  startControlsTimer()
})

onUnmounted(() => {
  // Save final position
  if (videoRef.value && props.videoUrl) {
    settings.saveVideoPosition(props.videoUrl, videoRef.value.currentTime)
  }

  // Clear interval
  if (savePositionInterval) {
    clearInterval(savePositionInterval)
    savePositionInterval = null
  }

  if (captionsUrl.value) {
    URL.revokeObjectURL(captionsUrl.value)
  }

  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }

  document.removeEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

// Watch for video URL changes
watch(() => props.videoUrl, (newUrl) => {
  if (videoRef.value && newUrl) {
    const savedPosition = settings.getVideoPosition(newUrl)
    if (savedPosition > 0) {
      videoRef.value.currentTime = savedPosition
    }
  }
})

// Expose methods to parent
defineExpose({
  cycleAudioTrack,
  adjustPlaybackRate,
  toggleSubtitleInfo
})

// Video control functions
let lastSpaceTime = 0
const SPACE_DELAY = 200 // 200ms delay between space presses

function togglePlay() {
  const video = videoRef.value
  if (!video) return
  
  const now = Date.now()
  if (now - lastSpaceTime < SPACE_DELAY) {
    return // Ignore if pressed too recently
  }
  lastSpaceTime = now
  
  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

function skipTime(seconds: number) {
  const video = videoRef.value
  if (!video) return
  
  video.currentTime += seconds
}

function increasePlaybackRate() {
  adjustPlaybackRate(true)
}

function decreasePlaybackRate() {
  adjustPlaybackRate(false)
}

function exportCurrentCaption() {
  const activeCaptions = store.activeCaptions.filter(c => 
    c.startTime <= props.currentTime && props.currentTime <= c.endTime
  )
  
  if (activeCaptions.length > 0) {
    const caption = activeCaptions[0]
    navigator.clipboard.writeText(caption.text)
    emit('notify', 'Caption copied to clipboard')
  }
}

// Keyboard shortcuts
const FRAME_DURATION = 1/30 // Assuming 30fps video

// Add frame navigation functions
function nextFrame() {
  if (!videoRef.value) return
  skipTime(FRAME_DURATION)
}

function previousFrame() {
  if (!videoRef.value) return
  skipTime(-FRAME_DURATION)
}

const onPlay = () => {
  emit('playing')
}

const onPause = () => {
  emit('pause')
}

const onSeeking = () => {
  // Handle seeking state
}

const onSeeked = () => {
  // Handle seeked state
}

// Add helper function to detect Japanese text
function isJapaneseText(text: string): boolean {
  const japaneseMatches = text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g)
  const japaneseCount = japaneseMatches ? japaneseMatches.length : 0
  const totalChars = text.replace(/\s/g, '').length
  return totalChars > 0 && (japaneseCount / totalChars) >= 0.4
}

const progress = computed(() => {
  if (!props.duration) return 0
  return (props.currentTime / props.duration) * 100
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

function toggleCaptions() {
  if (!videoRef.value) return
  const tracks = Array.from(videoRef.value.textTracks)
  showCaptions.value = !showCaptions.value
  tracks.forEach(track => {
    track.mode = showCaptions.value ? 'showing' : 'hidden'
  })
}

async function toggleFullscreen() {
  if (!videoRef.value) return
  
  if (!document.fullscreenElement) {
    await videoRef.value.requestFullscreen()
    isFullscreen.value = true
  } else {
    await document.exitFullscreen()
    isFullscreen.value = false
  }
}

function onProgressBarClick(event: MouseEvent) {
  if (!videoRef.value || !progressBarRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const pos = (event.clientX - rect.left) / rect.width
  if (props.duration) {
    videoRef.value.currentTime = pos * props.duration
  }
}

function onMouseMove() {
  showControls.value = true
  startControlsTimer()
}

function startControlsTimer() {
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
  controlsTimer = window.setTimeout(() => {
    showControls.value = false
  }, 3000)
}
</script>

<template>
  <div 
    class="video-container" 
    :class="{ 'controls-hidden': !showControls }"
    @mousemove="onMouseMove"
    @mouseleave="startControlsTimer"
  >
    <video
      ref="videoRef"
      class="video-element"
      :src="videoSrc"
      @timeupdate="onTimeUpdate"
      @ended="$emit('videoEnd')"
      @click="togglePlay"
    >
      <track
        v-for="(track, index) in tracks"
        :key="index"
        :src="track.src"
        :kind="track.kind"
        :srclang="track.srclang"
        :label="track.label"
      />
    </video>

    <div class="custom-controls">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <button class="control-button" @click="togglePlay">
            <i class="fas" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
          </button>
          <button class="control-button" @click="toggleMute">
            <i class="fas" :class="isMuted ? 'fa-volume-mute' : 'fa-volume-up'"></i>
          </button>
          <span class="text-white text-sm">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="tracks?.length" class="control-button" @click="toggleCaptions">
            <i class="fas" :class="showCaptions ? 'fa-closed-captioning' : 'fa-closed-captioning text-gray-500'"></i>
          </button>
          <button class="control-button" @click="toggleFullscreen">
            <i class="fas" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
          </button>
        </div>
      </div>

      <div class="progress-bar" ref="progressBarRef" @click="onProgressBarClick">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        <div class="progress-hover"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  overflow: hidden;
}

/* Hide all native controls when controls are hidden */
.controls-hidden video::-webkit-media-controls {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-enclosure {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-panel {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-overlay-play-button {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-play-button {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-timeline {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-current-time-display {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-time-remaining-display {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-mute-button {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-volume-slider {
  display: none !important;
}

.controls-hidden video::-webkit-media-controls-fullscreen-button {
  display: none !important;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none; /* Remove focus outline */
}

.subtitles-container {
  position: fixed;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 30;
}

.subtitle-stack {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.subtitle-track {
  width: 100%;
  margin: 0;
  padding: 0;
  position: relative;
}

.hidden-track {
  display: none;
}

.active-track .subtitle-line {
  color: white;
}

.subtitle-line {
  position: relative;
  display: block;
  padding: 0;
  margin: 0 auto;
  max-width: 80%;
  text-align: center;
  color: white;
  line-height: 1.2;
  text-shadow: 
    0 0 5px rgba(0,0,0,0.9),
    0 0 10px rgba(0,0,0,0.7),
    0 0 15px rgba(0,0,0,0.5);
  word-wrap: break-word;
  word-break: normal;
}

.primary-track {
  font-size: v-bind('`${settings.primarySubtitleFontSize}em`');
  font-family: v-bind('settings.subtitleFontFamily');
  font-weight: v-bind('settings.subtitleFontWeight * 1.5');
  margin-bottom: 0.5em;
}

.secondary-track {
  font-size: v-bind('`${settings.secondarySubtitleFontSize}em`');
  font-family: v-bind('settings.secondarySubtitleFontFamily');
  font-weight: v-bind('settings.secondarySubtitleFontWeight * 1.5');
  opacity: 0.9;
}

/* Lane positioning */
.lane-0 { transform: translateY(0); }
.lane-1 { transform: translateY(-100%); }
.lane-2 { transform: translateY(-200%); }
.lane-3 { transform: translateY(-300%); }
.lane-4 { transform: translateY(-400%); }
.lane-5 { transform: translateY(-500%); }

.secondary-track.lane-0 { transform: translateY(0); }
.secondary-track.lane-1 { transform: translateY(-100%); }
.secondary-track.lane-2 { transform: translateY(-200%); }
.secondary-track.lane-3 { transform: translateY(-300%); }
.secondary-track.lane-4 { transform: translateY(-400%); }
.secondary-track.lane-5 { transform: translateY(-500%); }

/* Video alignment classes */
.video-container.left {
  justify-content: flex-start;
}

.video-container.center {
  justify-content: center;
}

.video-container.right {
  justify-content: flex-end;
}

.has-subtitles .video-element {
  margin-bottom: 20vh;
}

@media (max-width: 768px) {
  .subtitles-container {
    font-size: calc(1rem * var(--subtitle-scale, 1));
    bottom: 5vh;
  }

  .subtitle-line {
    font-size: 1.2rem;
  }

  .secondary-track {
    font-size: 1rem;
    padding: 0.2em 0.4em;
  }
}

.furigana-container {
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

.furigana-container ruby {
  ruby-align: center;
  display: inline;
  position: relative;
  margin: 0;
  padding: 0;
}

.furigana-container rt {
  font-size: 0.5em;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
  text-align: center;
  white-space: nowrap;
}

.tokens-container {
  display: inline;
  white-space: normal;
  word-wrap: break-word;
  word-break: normal;
}

/* ASS positioning classes */
.top-left { text-align: left; transform: translateY(-200%); }
.top { text-align: center; transform: translateY(-200%); }
.top-right { text-align: right; transform: translateY(-200%); }
.middle-left { text-align: left; }
.middle { text-align: center; }
.middle-right { text-align: right; }
.bottom-left { text-align: left; transform: translateY(200%); }
.bottom { text-align: center; transform: translateY(200%); }
.bottom-right { text-align: right; transform: translateY(200%); }

/* Support for ASS SVG drawings */
.subtitle-line :deep(svg) {
  width: 100%;
  height: auto;
  max-height: 50vh;
}

/* Custom controls container */
.custom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* Show controls on hover */
.video-container:hover .custom-controls,
.custom-controls:hover {
  opacity: 1;
  pointer-events: auto;
}

/* Progress bar */
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  position: relative;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  position: absolute;
  top: 0;
  left: 0;
  transition: width 0.1s linear;
}

.progress-hover {
  position: absolute;
  top: -8px;
  bottom: -8px;
  left: 0;
  right: 0;
}

/* Control buttons */
.control-button {
  background: transparent;
  border: none;
  color: white;
  padding: 0.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.control-button:hover {
  opacity: 1;
}
</style> 