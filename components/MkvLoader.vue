<script setup lang="ts">
import { ref } from 'vue'
import { useCaptionsStore } from '~/stores/captions'

const store = useCaptionsStore()
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const videoUrl = ref('')
const extractedSubtitles = ref<{file: string, language: string, title: string}[]>([])

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  isLoading.value = true
  error.value = ''
  success.value = ''
  extractedSubtitles.value = []
  
  try {
    const file = input.files[0]
    
    // Create object URL for video
    videoUrl.value = URL.createObjectURL(file)
    success.value = `Loaded video: ${file.name}`
    
    // If it's an MKV file, try to extract subtitles
    if (file.name.toLowerCase().endsWith('.mkv')) {
      // We can't directly extract subtitles in the browser
      // This would require a server-side implementation
      // For now, we'll just show instructions
      success.value += `. This is an MKV file - use the extract-subtitles.sh script to extract subtitles.`
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error loading video'
    console.error('Error loading video:', e)
  } finally {
    isLoading.value = false
    // Reset input
    input.value = ''
  }
}

function loadExtractedSubtitles() {
  // This would be implemented to load subtitles extracted by the script
  // For now, it's just a placeholder
  alert('This feature requires the extract-subtitles.sh script to be run first.')
}
</script>

<template>
  <div class="mkv-loader">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <label 
          for="video-file" 
          class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
        >
          Load Video
        </label>
        <input 
          id="video-file" 
          type="file" 
          accept="video/*" 
          @change="handleFileUpload" 
          class="hidden"
        />
      </div>
      
      <div v-if="isLoading" class="text-blue-600">
        Loading video...
      </div>
      
      <div v-if="error" class="text-red-600">
        {{ error }}
      </div>
      
      <div v-if="success" class="text-green-600">
        {{ success }}
      </div>
      
      <div v-if="videoUrl" class="mt-4">
        <h3 class="text-lg font-semibold mb-2">Video Loaded</h3>
        <p class="text-sm text-gray-600 mb-2">
          To extract subtitles from an MKV file, run the following command in your terminal:
        </p>
        <div class="bg-gray-100 p-2 rounded font-mono text-sm mb-4">
          ./scripts/extract-subtitles.sh /path/to/your/video.mkv
        </div>
        
        <p class="text-sm text-gray-600 mb-2">
          After extracting subtitles, you can load them using the Subtitle Loader.
        </p>
      </div>
    </div>
  </div>
</template> 