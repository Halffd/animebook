<script setup lang="ts">
import { ref, onMounted, computed, unref } from 'vue'
import { useCaptionsStore } from '~/stores/captions'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import { useSettingsStore } from '~/stores/settings'
import HelpDialog from '~/components/HelpDialog.vue'
import { useVideoControls } from '~/composables/useVideoControls'
import { useAnkiExport } from '~/composables/useAnkiExport'
import { useAnkiExtension } from '~/composables/useAnkiExtension'
import type { Caption, VideoInfo } from '~/types'
import { useRoute } from 'vue-router'

const videoUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const isPlaying = ref(false)
const showControls = ref(false)
const selectedVideo = ref<VideoInfo | null>(null)
const playlist = ref<VideoInfo[]>([])
const currentPlaylistIndex = ref(-1)

const captionsStore = useCaptionsStore()
const showHelp = ref(false)
const settings = useSettingsStore()
const videoControls = useVideoControls()
const videoPlayerRef = ref<{ 
  cycleAudioTrack: () => void; 
  adjustPlaybackRate: (increase: boolean) => void;
  toggleSubtitleInfo: () => void;
} | null>(null)
const ankiExport = useAnkiExport()
const ankiExtension = useAnkiExtension()
const currentAudioTrack = ref(0)

const isExporting = computed(() => unref(ankiExport.isExporting))

async function onFilesDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files) return

  let videoFound = false
  let subtitlesFound = false
  const subtitleFiles = []

  // First, process the video file if present
  for (const file of files) {
    if (file.type.startsWith('video/')) {
      videoUrl.value = URL.createObjectURL(file)
      videoFound = true
      if (ankiExtension.isExtensionAvailable) {
        try {
          await ankiExtension.initializeWithVideo(file)
          videoControls.showNotification('Video loaded for Anki export')
        } catch (e) {
          videoControls.showNotification('Failed to initialize Anki export')
        }
      }
      break // Only load one video
    }
  }

  // Then process subtitle files
  for (const file of files) {
    if (file.name.toLowerCase().match(/\.(srt|vtt|ass)$/)) {
      subtitleFiles.push(file)
    }
  }

  // Process subtitle files
  if (subtitleFiles.length > 0) {
    // Clear existing subtitles if user is loading a new set
    if (videoFound) {
      captionsStore.clearCaptions()
    }

    for (const file of subtitleFiles) {
      try {
        // Try to extract language and title from filename
        // Format: filename_language_title.ext or filename.language.ext
        const filenameParts = file.name.split('.')
        const extension = filenameParts.pop()?.toLowerCase()
        let nameParts = filenameParts.join('.').split('_')
        
        let language = 'unknown'
        let title = file.name
        
        if (nameParts.length >= 3) {
          // Assume format is filename_language_title
          language = nameParts[nameParts.length - 2]
          title = nameParts[nameParts.length - 1]
        } else if (filenameParts.length >= 2) {
          // Try format filename.language.ext
          language = filenameParts[filenameParts.length - 1]
          title = filenameParts[0]
        }
        
        const text = await file.text()
        const trackIndex = await captionsStore.loadCaptions(text, language, title)
        
        if (trackIndex !== undefined) {
          subtitlesFound = true
        }
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Error loading captions'
        videoControls.showNotification('Failed to load subtitles')
      }
    }
  }

  if (videoFound) {
    videoControls.showNotification('Video loaded')
  }
  
  if (subtitlesFound) {
    videoControls.showNotification(`Loaded ${captionsStore.subtitleTracks.length} subtitle track(s)`)
  }
}

// Load settings on mount
onMounted(() => {
  settings.loadSettings()
  
  // Handle export action from sidebar
  const route = useRoute()
  if (route.query.action === 'export' && route.query.captionId) {
    const captionId = route.query.captionId as string
    const caption = captionsStore.captions.find(c => c.id === captionId)
    if (caption) {
      onExportToAnki(caption)
    }
  }
})

useKeyboardShortcuts({
  ' ': () => videoControls.togglePlay(),
  'x': () => captionsStore.toggleSidebar(),
  'v': () => {
    captionsStore.toggleSubtitles()
    videoControls.showNotification(`Subtitles: ${captionsStore.showSubtitles ? 'ON' : 'OFF'}`)
  },
  'c': () => {
    captionsStore.toggleSecondarySubtitles()
    videoControls.showNotification(`Secondary Subtitles: ${captionsStore.showSecondarySubtitles ? 'ON' : 'OFF'}`)
  },
  'f': () => {
    captionsStore.toggleFurigana()
    videoControls.showNotification(`Furigana: ${captionsStore.showFurigana ? 'ON' : 'OFF'}`)
  },
  'ArrowLeft': () => captionsStore.previousCaption(),
  'a': (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      captionsStore.previousCaption()
      videoControls.showNotification('Previous caption')
    }
  },
  'ArrowRight': () => captionsStore.nextCaption(),
  'd': (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      captionsStore.nextCaption()
      videoControls.showNotification('Next caption')
    }
  },
  'ArrowDown': () => captionsStore.seekToSubtitleStart(),
  's': () => captionsStore.seekToSubtitleStart(),
  'ArrowUp': () => captionsStore.toggleAutoPause(),
  'w': () => captionsStore.toggleAutoPause(),
  'p': () => {
    if (captionsStore.isAutoPauseMode) {
      captionsStore.toggleAutoPause() // Turn off auto-pause
      videoControls.showNotification('Auto-pause mode: OFF')
    }
  },
  't': () => videoPlayerRef.value?.cycleAudioTrack(),
  'y': () => {
    if (captionsStore.activeCaptions.length > 0) {
      const text = captionsStore.activeCaptions.map(caption => caption.text).join('\n')
      navigator.clipboard.writeText(text)
      videoControls.showNotification('Subtitles copied to clipboard')
    }
  },
  'm': () => videoPlayerRef.value?.adjustPlaybackRate(true),
  'n': () => videoPlayerRef.value?.adjustPlaybackRate(false),
  'PageUp': () => videoControls.skipTime(87), // Skip OP/ED
  'PageDown': () => videoControls.skipTime(-87),
  '-': (e: KeyboardEvent) => {
    if (e.shiftKey) {
      // Decrease secondary subtitle size
      settings.adjustFontSize(true, false)
      videoControls.showNotification(`Secondary subtitle size: ${Math.round(settings.secondarySubtitleFontSize * 100)}%`)
    } else {
      // Decrease primary subtitle size
      settings.adjustFontSize(false, false)
      videoControls.showNotification(`Primary subtitle size: ${Math.round(settings.primarySubtitleFontSize * 100)}%`)
    }
  },
  '=': (e: KeyboardEvent) => {
    if (!e.shiftKey) {
      // Increase primary subtitle size
      settings.adjustFontSize(false, true)
      videoControls.showNotification(`Primary subtitle size: ${Math.round(settings.primarySubtitleFontSize * 100)}%`)
    }
  },
  '[': (e: KeyboardEvent) => {
    // Decrease secondary subtitle size
    settings.adjustFontSize(true, false)
    videoControls.showNotification(`Secondary subtitle size: ${Math.round(settings.secondarySubtitleFontSize * 100)}%`)
  },
  ']': (e: KeyboardEvent) => {
    // Increase secondary subtitle size
    settings.adjustFontSize(true, true)
    videoControls.showNotification(`Secondary subtitle size: ${Math.round(settings.secondarySubtitleFontSize * 100)}%`)
  },
  'D': (e: KeyboardEvent) => {
    if (e.shiftKey) {
      captionsStore.downloadSubtitles()
      videoControls.showNotification('Downloading subtitles...')
    }
  },
  'e': async () => {
    if (!videoUrl.value || !captionsStore.activeCaptions.length) return
    
    try {
      const caption = captionsStore.activeCaptions[0]
      await onExportToAnki(caption)
    } catch (e) {
      videoControls.showNotification('Failed to add to Anki')
    }
  },
  'h': () => {
    showControls.value = !showControls.value
    // Toggle Nuxt devtools
    if (process.client) {
      const devtools = (window as any).__NUXT_DEVTOOLS_CLIENT__
      if (devtools) {
        if (showControls.value) {
          devtools.enable()
        } else {
          devtools.disable()
        }
      }
    }
    if (showControls.value) {
      // Auto-hide controls after 3 seconds
      setTimeout(() => {
        showControls.value = false
        // Also hide devtools
        if (process.client) {
          const devtools = (window as any).__NUXT_DEVTOOLS_CLIENT__
          if (devtools) {
            devtools.disable()
          }
        }
      }, 3000)
    }
  },
  'g': () => {
    settings.colorizeWords = !settings.colorizeWords
    settings.saveSettings()
    videoControls.showNotification(
      `Word colorization: ${settings.colorizeWords ? 'ON' : 'OFF'}`
    )
  },
  '?': () => showHelp.value = !showHelp.value,
  'i': () => {
    videoPlayerRef.value?.toggleSubtitleInfo()
  },
})

async function onExportToAnki(caption: Caption) {
  if (ankiExtension.isExtensionAvailable) {
    try {
      await ankiExtension.recordFlashcard(
        caption, 
        captionsStore.currentTime,
        currentAudioTrack.value
      )
      videoControls.showNotification('Added to Anki')
    } catch (e) {
      videoControls.showNotification('Failed to add to Anki')
    }
  } else {
    // Fall back to built-in Anki export
    try {
      const url = videoUrl.value
      if (!url) throw new Error('No video URL')
      await ankiExport.addNote(caption, url, captionsStore.currentTime)
      videoControls.showNotification('Added to Anki')
    } catch (e) {
      videoControls.showNotification('Failed to add to Anki')
    }
  }
}

function onAudioTrackChange(track: number) {
  currentAudioTrack.value = track
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    videoUrl.value = URL.createObjectURL(file)
    if (ankiExtension.isExtensionAvailable) {
      try {
        await ankiExtension.initializeWithVideo(file)
        videoControls.showNotification('Video loaded for Anki export')
      } catch (e) {
        console.error(e)
        videoControls.showNotification('Failed to initialize Anki export')
      }
    }
  }
}

function onVideoSelect(video: VideoInfo) {
  selectedVideo.value = video
  playlist.value = [video]
  currentPlaylistIndex.value = 0
}

function onPlaylistSelect(videos: VideoInfo[]) {
  playlist.value = videos
  currentPlaylistIndex.value = 0
  selectedVideo.value = videos[0]
}

function onVideoEnd() {
  // Play next video in playlist if available
  if (playlist.value.length > currentPlaylistIndex.value + 1) {
    currentPlaylistIndex.value++
    selectedVideo.value = playlist.value[currentPlaylistIndex.value]
  }
}
</script>

<template>
  <div 
    class="min-h-screen min-h-[100dvh] flex flex-col"
    @drop.prevent="onFilesDrop"
    @dragover.prevent
  >
    <template v-if="selectedVideo">
      <VideoPlayer
        v-if="selectedVideo"
        ref="videoPlayerRef"
        :video-url="selectedVideo.path"
        :captions="captionsStore.captions"
        :current-time="captionsStore.currentTime"
        @timeupdate="captionsStore.setCurrentTime"
        @error="error = $event.message"
        @notify="videoControls.showNotification"
        @audio-track-change="onAudioTrackChange"
        @playing="isPlaying = true"
        @pause="isPlaying = false"
        @ended="onVideoEnd"
        class="flex-1"
      />
    </template>
    <template v-else>
      <VideoList 
        @select="onVideoSelect"
        @playlist="onPlaylistSelect"
      />
    </template>

    <div v-if="error" class="fixed top-4 left-4 text-red-500 bg-black/50 px-4 py-2 rounded z-40">
      {{ error }}
    </div>

    <CaptionsList
      :captions="captionsStore.captions"
      :active-ids="captionsStore.activeCaptionIds"
      :is-offset-mode="captionsStore.isOffsetMode"
      :is-auto-pause-mode="captionsStore.isAutoPauseMode"
      :is-exporting="isExporting"
      @export-to-anki="onExportToAnki"
    />

    <Transition name="fade">
      <button 
        v-if="showControls"
        class="fixed bottom-4 left-4 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 z-40 opacity-75 hover:opacity-100 transition-opacity"
        @click="captionsStore.toggleSidebar"
      >
        Toggle Sidebar
      </button>
    </Transition>

    <HelpDialog
      :show="showHelp"
      @close="showHelp = false"
    />

    <Transition name="fade">
      <button 
        v-if="showControls"
        class="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 z-40 opacity-75 hover:opacity-100 transition-opacity"
        @click="showHelp = true"
      >
        ?
      </button>
    </Transition>

    <NotificationManager
      :message="videoControls.notification"
    />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 