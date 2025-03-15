<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCaptionsStore } from '~/stores/captions'

const store = useCaptionsStore()
const isLoading = ref(false)
const error = ref('')
const success = ref('')

const hasSubtitles = computed(() => store.subtitleTracks.length > 0)

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  isLoading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const files = Array.from(input.files)
    
    for (const file of files) {
      // Try to extract language and title from filename
      // Format: filename_language_title.ext
      const filenameParts = file.name.split('.')
      const extension = filenameParts.pop()?.toLowerCase()
      const nameParts = filenameParts.join('.').split('_')
      
      let language = 'unknown'
      let title = file.name
      
      if (nameParts.length >= 3) {
        // Assume format is filename_language_title
        language = nameParts[nameParts.length - 2]
        title = nameParts[nameParts.length - 1]
      }
      
      // Check if it's a subtitle file
      if (['srt', 'vtt', 'ass'].includes(extension || '')) {
        const content = await file.text()
        const trackIndex = await store.loadCaptions(content, language, title)
        
        if (trackIndex !== undefined) {
          success.value = `Loaded ${files.length} subtitle track(s)`
        } else {
          error.value = `Failed to parse subtitle file: ${file.name}`
        }
      } else {
        error.value = `Unsupported file format: ${extension}`
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error loading subtitles'
    console.error('Error loading subtitles:', e)
  } finally {
    isLoading.value = false
    // Reset input
    input.value = ''
  }
}

function clearSubtitles() {
  store.clearCaptions()
  success.value = ''
  error.value = ''
}
</script>

<template>
  <div class="subtitle-loader">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <label 
          for="subtitle-file" 
          class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
        >
          Load Subtitles
        </label>
        <input 
          id="subtitle-file" 
          type="file" 
          accept=".srt,.vtt,.ass" 
          @change="handleFileUpload" 
          class="hidden"
          multiple
        />
        
        <button 
          v-if="hasSubtitles"
          @click="clearSubtitles" 
          class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Clear
        </button>
      </div>
      
      <div v-if="isLoading" class="text-blue-600">
        Loading subtitles...
      </div>
      
      <div v-if="error" class="text-red-600">
        {{ error }}
      </div>
      
      <div v-if="success" class="text-green-600">
        {{ success }}
      </div>
      
      <!-- Subtitle tracks list -->
      <div v-if="hasSubtitles" class="mt-2">
        <div class="text-sm font-medium mb-1">Loaded Tracks:</div>
        <div 
          v-for="(track, index) in store.subtitleTracks" 
          :key="index"
          class="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
          :class="{ 'bg-blue-100': index === store.activeTrackIndex }"
          @click="store.setActiveTrack(index)"
        >
          <div class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200">
            {{ index + 1 }}
          </div>
          <div class="flex-1">
            <div class="font-medium">{{ track.metadata.title }}</div>
            <div class="text-xs text-gray-600">
              {{ track.metadata.language }} · {{ track.captions.length }} captions
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 