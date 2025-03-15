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

const hasSubtitles = computed(() => store.showSubtitles && store.activeCaptions.length > 0)

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

  // Handle auto-pause
  if (store.isAutoPauseMode && store.activeCaptions.length > 0) {
    const caption = store.activeCaptions[0]
    if (video.currentTime > caption.endTime && !video.paused) {
      video.pause()
      store.lastPauseTime = video.currentTime
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

// Apply regex replacements when showing subtitles
function processText(text: string): string {
  if (!settings.regexReplacementsEnabled || !settings.regexReplacements.length) {
    return text
  }
  
  return settings.regexReplacements.reduce((processed, { regex, replaceText }) => {
    try {
      return processed.replace(new RegExp(regex, 'g'), replaceText)
    } catch (e) {
      return processed
    }
  }, text)
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
  adjustPlaybackRate
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
      :playbackRate="playbackRate"
      @timeupdate="onTimeUpdate"
      @error="onError"
      @loadeddata="onLoad"
      controls
      disablePictureInPicture
    >
      <track
        v-if="captions"
        kind="subtitles"
        :src="captionsUrl"
        default
      />
    </video>

    <!-- Audio track indicator -->
    <div 
      v-if="audioTracks.length > 1"
      class="fixed top-4 right-4 bg-black/50 px-3 py-2 rounded text-white text-sm z-40"
    >
      Audio: {{ selectedAudioTrack + 1 }}/{{ audioTracks.length }}
    </div>

    <!-- Subtitle tracks indicator -->
    <div 
      v-if="store.subtitleTracks.length > 1"
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
      <div
        v-for="caption in store.allActiveCaptions"
        :key="caption.id"
        :class="[
          'subtitle-line',
          `lane-${caption.lane || 0}`,
          { 'primary-track': store.activeCaptionIds.includes(caption.id) },
          { 'secondary-track': !store.activeCaptionIds.includes(caption.id) && store.showSecondarySubtitles }
        ]"
        v-show="store.activeCaptionIds.includes(caption.id) || store.showSecondarySubtitles"
      >
        <template v-if="caption.furigana && store.showFurigana">
          <Furigana
            v-for="([text, reading], index) in caption.furigana"
            :key="`${caption.id}-${index}-${text}`"
            :text="processText(text)"
            :reading="reading"
          />
        </template>
        <template v-else>
          {{ processText(caption.text) }}
        </template>
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
  height: auto;
  max-height: calc(100vh - 20vh);
  max-height: calc(100dvh - 20vh);
  object-fit: contain;
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

.subtitle-line {
  position: relative;
  text-align: center;
  color: white;
  font-size: 1.5rem;
  line-height: 1.4;
  text-shadow: 
    0 0 5px rgba(0,0,0,0.8),
    0 0 10px rgba(0,0,0,0.5);
  padding: 0.2em;
  background: transparent;
  width: 100%;
  margin: 0 auto;
}

.primary-track {
  color: white;
}

.secondary-track {
  color: #ffeb3b; /* Yellow color for secondary tracks */
  font-size: 1.2rem;
}

.lane-0 { transform: translateY(0); }
.lane-1 { transform: translateY(-120%); }
.lane-2 { transform: translateY(-240%); }
.lane-3 { transform: translateY(-360%); }

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
  }
}
</style> 