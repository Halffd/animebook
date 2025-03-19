<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import type { Caption } from '~/types'
import { useCaptionsStore } from '~/stores/captions'
import { useSettingsStore } from '~/stores/settings'

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
  onAudioTrackChange?: (track: number) => void
  videoAlignment?: 'left' | 'center' | 'right'
}>()

const emit = defineEmits<{
  'timeupdate': [time: number]
  'error': [error: Error]
  'notify': [message: string]
  'audio-track-change': [track: number]
  'playing': []
  'pause': []
}>()

const videoRef = ref<HTMLVideoElement>()
const store = useCaptionsStore()
const settings = useSettingsStore()

interface AudioTrack {
  enabled: boolean
  language?: string
  label?: string
}

const audioTracks = ref<AudioTrack[]>([])
const selectedAudioTrack = ref<number>(0)
const playbackRate = ref(1)
const showSubtitleInfo = ref(false)

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

function onTimeUpdate(e: Event) {
  const video = e.target as HTMLVideoElement
  emit('timeupdate', video.currentTime)

  // Handle auto-pause - only if explicitly enabled
  if (store.isAutoPauseMode) {
    // Get active captions from the active track only
    const activeTrackCaptions = store.activeTrack?.captions.filter(caption => 
      caption.startTime <= video.currentTime && 
      video.currentTime <= caption.endTime
    ) || []
    
    // Only pause if we have active captions and the video time exceeds the end time
    if (activeTrackCaptions.length > 0) {
      const lastCaption = activeTrackCaptions[activeTrackCaptions.length - 1]
      
      // Only pause if we've just passed the end time (within 0.1 seconds)
      // Also check if we haven't just paused recently (within 1 second)
      const timeSinceLastPause = store.lastPauseTime ? video.currentTime - store.lastPauseTime : Infinity
      
      if (video.currentTime > lastCaption.endTime && 
          video.currentTime < lastCaption.endTime + 0.1 && 
          !video.paused &&
          timeSinceLastPause > 1.0) {
        console.log(`[Player] Auto-pausing at ${video.currentTime}, caption end: ${lastCaption.endTime}`)
        video.pause()
        store.lastPauseTime = video.currentTime
      }
    }
  }
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

// Apply regex replacements when showing subtitles
function processText(text: string): string {
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
  
  // Remove SRT/ASS HTML tags that shouldn't be displayed
  // This includes font tags, b tags, i tags, etc.
  processed = processed
    .replace(/<\/?font[^>]*>/gi, '') // Remove font tags
    .replace(/<\/?b>/gi, '') // Remove bold tags
    .replace(/<\/?i>/gi, '') // Remove italic tags
    .replace(/<\/?u>/gi, '') // Remove underline tags
    .replace(/<\/?s>/gi, '') // Remove strike tags
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&amp;/g, '&') // Replace &amp; with &
  
  // Check if text contains Japanese characters
  const japaneseMatches = processed.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g)
  const japaneseCount = japaneseMatches ? japaneseMatches.length : 0
  const totalChars = processed.replace(/\s/g, '').length // Ignore whitespace
  const isJapanese = totalChars > 0 && (japaneseCount / totalChars) >= 0.4 // 40% threshold
  
  if (!isJapanese) {
    // Fix common ASS subtitle formatting issues:
    // 1. Replace multiple spaces with a single space
    // 2. Ensure there's a space after punctuation if followed by a letter
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/([.!?,:;])([a-zA-Z])/g, '$1 $2')
      .trim()
  }
  
  return processed
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

// Clean up blob URLs when component is unmounted
onUnmounted(() => {
  if (captionsUrl.value) {
    URL.revokeObjectURL(captionsUrl.value)
  }
})

// Expose methods to parent
defineExpose({
  cycleAudioTrack,
  adjustPlaybackRate,
  toggleSubtitleInfo
})
</script>

<template>
  <div 
    class="video-container"
    :class="[
      videoAlignment || settings.videoAlignment,
      { 'has-subtitles': hasSubtitles }
    ]"
  >
    <video
      ref="videoRef"
      class="video-element"
      :src="videoUrl"
      controls
      disablepictureinpicture
      @timeupdate="onTimeUpdate"
      @error="onError"
      @loadedmetadata="onLoad"
      @playing="$emit('playing')"
      @pause="$emit('pause')"
    />

    <!-- Audio track indicator -->
    <div 
      v-if="audioTracks.length > 1"
      class="fixed top-4 right-4 bg-black/50 px-3 py-2 rounded text-white text-sm z-40"
    >
      Audio: {{ selectedAudioTrack + 1 }}/{{ audioTracks.length }}
    </div>

    <!-- Subtitle tracks indicator - toggleable with showSubtitleInfo -->
    <div 
      v-if="showSubtitleInfo && store.subtitleTracks.length > 1"
      class="fixed top-12 right-4 bg-black/50 px-3 py-2 rounded text-white text-sm z-40"
    >
      <div>Subtitles: {{ store.activeTrackIndex + 1 }}/{{ store.subtitleTracks.length }}</div>
      <div v-if="store.activeTrack?.metadata" class="text-xs mt-1">
        {{ store.activeTrack.metadata.language }}: {{ store.activeTrack.metadata.title }}
      </div>
    </div>

    <!-- All subtitle tracks -->
    <div 
      v-if="hasSubtitles"
      class="subtitles-container"
      :style="{
        fontSize: `calc(${settings.subtitleFontSize} * 1.5rem)`
      }"
    >
      <!-- Stack all captions from all tracks -->
      <div class="subtitle-stack">
        <!-- Active track first -->
        <div
          class="subtitle-track active-track"
        >
          <div
            v-for="caption in store.activeCaptions.filter(c => 
              c.startTime <= props.currentTime && props.currentTime <= c.endTime
            )"
            :key="`active-${caption.id}`"
            class="subtitle-line primary-track"
            :class="`lane-${caption.lane || 0}`"
          >
            <template v-if="caption.furigana && store.showFurigana">
              <span class="furigana-container" v-html="
                caption.furigana.map(([text, reading]) => {
                  const processedText = processText(text);
                  if (/^[\s\p{P}]+$/u.test(processedText)) {
                    return processedText;
                  } else if (/[\u4E00-\u9FAF\u3400-\u4DBF]/.test(processedText) && reading && reading !== processedText) {
                    return `<ruby>${processedText}<rt>${reading}</rt></ruby>`;
                  } else {
                    return processedText;
                  }
                }).join('')
              "></span>
            </template>
            <template v-else-if="caption.tokens && settings.colorizeWords">
              <span class="tokens-container">
                <ColoredWord
                  v-for="(token, index) in processTokens(caption.tokens)"
                  :key="`${caption.id}-token-${index}`"
                  :text="processText(token.surface_form)"
                  :reading="token.reading"
                  :pos="token.pos"
                />
              </span>
            </template>
            <template v-else>
              <span v-html="processText(caption.text)"></span>
            </template>
          </div>
        </div>
        
        <!-- Secondary tracks -->
        <div
          v-if="hasSecondarySubtitles"
          class="subtitle-track secondary-tracks-container"
        >
          <div
            v-for="(track, trackIndex) in store.subtitleTracks.filter((_, i) => i !== store.activeTrackIndex)"
            :key="`track-${trackIndex}`"
          >
            <div
              v-for="caption in track.captions.filter(c => 
                c.startTime <= props.currentTime && props.currentTime <= c.endTime
              )"
              :key="`${track.metadata.language}-${caption.id}`"
              class="subtitle-line secondary-track"
              :class="`lane-${caption.lane || 0}`"
              v-show="store.showSecondarySubtitles"
            >
              <template v-if="caption.furigana && store.showFurigana">
                <span class="furigana-container" v-html="
                  caption.furigana.map(([text, reading]) => {
                    const processedText = processText(text);
                    if (/^[\s\p{P}]+$/u.test(processedText)) {
                      return processedText;
                    } else if (/[\u4E00-\u9FAF\u3400-\u4DBF]/.test(processedText) && reading && reading !== processedText) {
                      return `<ruby>${processedText}<rt>${reading}</rt></ruby>`;
                    } else {
                      return processedText;
                    }
                  }).join('')
                "></span>
              </template>
              <template v-else-if="caption.tokens && settings.colorizeWords">
                <span class="tokens-container">
                  <ColoredWord
                    v-for="(token, index) in processTokens(caption.tokens)"
                    :key="`${caption.id}-token-${index}`"
                    :text="processText(token.surface_form)"
                    :reading="token.reading"
                    :pos="token.pos"
                  />
                </span>
              </template>
              <template v-else>
                <span v-html="processText(caption.text)"></span>
              </template>
            </div>
          </div>
        </div>
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
  font-size: v-bind('`${settings.subtitleFontSize}em`');
  font-family: v-bind('settings.subtitleFontFamily');
  font-weight: v-bind('settings.subtitleFontWeight * 1.5');
  line-height: 1.2;
  text-shadow: 
    0 0 5px rgba(0,0,0,0.9),
    0 0 10px rgba(0,0,0,0.7),
    0 0 15px rgba(0,0,0,0.5);
  word-wrap: break-word;
  word-break: normal;
}

.primary-track {
  color: white;
  font-weight: 900; /* Increased from 600 */
  text-shadow: 
    0 0 5px rgba(0,0,0,0.9),
    0 0 10px rgba(0,0,0,0.7),
    0 0 15px rgba(0,0,0,0.5);
}

.secondary-tracks-container {
  margin: 0;
  padding: 0;
  position: relative;
  width: 100%;
}

.secondary-tracks-container > div {
  margin: 0;
  padding: 0;
  width: 100%;
}

.secondary-track {
  color: #ffeb3b;
  font-size: v-bind('`${settings.secondarySubtitleFontSize}em`');
  font-family: v-bind('settings.secondarySubtitleFontFamily');
  font-weight: v-bind('settings.secondarySubtitleFontWeight * 1.5');
  opacity: 0.9;
  text-shadow: 
    0 0 5px rgba(0,0,0,0.9),
    0 0 8px rgba(0,0,0,0.7);
  padding: 0;
  margin: 0;
  line-height: 1.2;
  transform: translateY(100%); /* Move down relative to primary subtitle */
}

/* Lane positioning for primary subtitles */
.primary-track.lane-0 { transform: translateY(0); }
.primary-track.lane-1 { transform: translateY(-100%); }
.primary-track.lane-2 { transform: translateY(-200%); }
.primary-track.lane-3 { transform: translateY(-300%); }
.primary-track.lane-4 { transform: translateY(-400%); }
.primary-track.lane-5 { transform: translateY(-500%); }

/* Lane positioning for secondary subtitles */
.secondary-track.lane-0 { transform: translateY(100%); }
.secondary-track.lane-1 { transform: translateY(0%); }
.secondary-track.lane-2 { transform: translateY(-100%); }
.secondary-track.lane-3 { transform: translateY(-200%); }
.secondary-track.lane-4 { transform: translateY(-300%); }
.secondary-track.lane-5 { transform: translateY(-400%); }

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
</style> 