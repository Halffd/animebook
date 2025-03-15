<script setup lang="ts">
import { ref, onMounted, computed, unref } from 'vue'
import { useCaptionsStore } from '~/stores/captions'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import { useSettingsStore } from '~/stores/settings'
import HelpDialog from '~/components/HelpDialog.vue'
import { useVideoControls } from '~/composables/useVideoControls'
import { useAnkiExport } from '~/composables/useAnkiExport'
import { useAnkiExtension } from '~/composables/useAnkiExtension'
import type { Caption } from '~/types'
import { useRoute } from 'vue-router'

const videoUrl = ref<string | null>(null)
const error = ref<string | null>(null)

const captionsStore = useCaptionsStore()
const showHelp = ref(false)
const settings = useSettingsStore()
const videoControls = useVideoControls()
const videoPlayerRef = ref<{ cycleAudioTrack: () => void; adjustPlaybackRate: (increase: boolean) => void } | null>(null)
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
    } else if (file.name.toLowerCase().match(/\.(srt|vtt|ass)$/)) {
      try {
        const text = await file.text()
        await captionsStore.loadCaptions(text)
        subtitlesFound = true
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
  't': () => videoPlayerRef.value?.cycleAudioTrack(),
  'y': () => {
    captionsStore.cycleActiveTrack()
    videoControls.showNotification(`Subtitle Track: ${captionsStore.activeTrackIndex + 1}/${captionsStore.subtitleTracks.length}`)
  },
  'm': () => videoPlayerRef.value?.adjustPlaybackRate(true),
  'n': () => videoPlayerRef.value?.adjustPlaybackRate(false),
  'PageUp': () => videoControls.skipTime(87), // Skip OP/ED
  'PageDown': () => videoControls.skipTime(-87),
  '-': () => {
    settings.subtitleFontSize = Math.max(0.5, settings.subtitleFontSize - 0.1)
    settings.saveSettings()
    videoControls.showNotification(`Subtitle size: ${Math.round(settings.subtitleFontSize * 100)}%`)
  },
  '=': () => {
    settings.subtitleFontSize = Math.min(2, settings.subtitleFontSize + 0.1)
    settings.saveSettings()
    videoControls.showNotification(`Subtitle size: ${Math.round(settings.subtitleFontSize * 100)}%`)
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
    settings.toggleRegexReplacements()
    videoControls.showNotification(
      `Regex replacements: ${settings.regexReplacementsEnabled ? 'ON' : 'OFF'}`
    )
  },
  '?': () => showHelp.value = !showHelp.value
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
</script>

<template>
  <div 
    class="min-h-screen min-h-[100dvh] flex flex-col"
    @drop.prevent="onFilesDrop"
    @dragover.prevent
  >
    <VideoPlayer
      v-if="videoUrl"
      ref="videoPlayerRef"
      :video-url="videoUrl"
      :captions="captionsStore.captions"
      :current-time="captionsStore.currentTime"
      @timeupdate="captionsStore.setCurrentTime"
      @error="error = $event.message"
      @notify="videoControls.showNotification"
      @audio-track-change="onAudioTrackChange"
      class="flex-1"
    />

    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center p-8 text-xl">
        Drop video and subtitle files here
      </div>
    </div>

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

    <button 
      class="fixed bottom-4 left-4 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 z-40"
      @click="captionsStore.toggleSidebar"
    >
      Toggle Sidebar
    </button>

    <HelpDialog
      :show="showHelp"
      @close="showHelp = false"
    />

    <button 
      class="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 z-40"
      @click="showHelp = true"
    >
      ?
    </button>

    <NotificationManager
      :message="videoControls.notification"
    />
  </div>
</template> 