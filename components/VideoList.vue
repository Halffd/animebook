<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCaptionsStore } from '../stores/captions'

interface VideoInfo {
  name: string
  path: string
  size: number
  lastModified: number
  isDirectory?: boolean
  children?: VideoInfo[]
}

const videos = ref<VideoInfo[]>([])
const selectedVideos = ref<Set<string>>(new Set())
const currentPath = ref<string[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const isDragging = ref(false)
const lastBlobUrl = ref<string | null>(null)
const currentBlobUrl = ref<string | null>(null)

const emit = defineEmits<{
  'select': [video: VideoInfo]
  'playlist': [videos: VideoInfo[]]
}>()

const store = useCaptionsStore()

async function loadVideos(path: string = '') {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await $fetch('/api/videos', {
      params: { path }
    })
    // Sort directories first, then alphabetically
    videos.value = response.videos.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load videos'
    console.error('Error loading videos:', e)
  } finally {
    isLoading.value = false
  }
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function navigateToFolder(path: string) {
  if (path === '..') {
    currentPath.value.pop()
  } else {
    currentPath.value.push(path)
  }
  loadVideos(currentPath.value.join('/'))
}

function getEncodedPath(video: VideoInfo): string {
  // For directories, return the raw path
  if (video.isDirectory) return video.path
  
  // If it's a blob URL (from drag & drop), return it directly without any modification
  if (video.path.startsWith('blob:')) {
    return video.path
  }
  
  // For server videos, ensure we have a clean path before encoding
  let decodedPath: string
  try {
    // First remove any existing /api/videos/stream/ prefix
    const cleanPath = video.path.replace(/^\/?(api\/videos\/stream\/)?/, '')
    // Then decode in case it's already encoded
    decodedPath = decodeURIComponent(cleanPath)
  } catch (e) {
    decodedPath = video.path.replace(/^\/?(api\/videos\/stream\/)?/, '')
  }
  
  // Generate a timestamp-based ID
  const timestamp = Date.now()
  
  // Then encode the path for the API endpoint with leading slash and timestamp
  return `/api/videos/stream/${encodeURIComponent(decodedPath)}?t=${timestamp}`
}

function toggleSelect(video: VideoInfo) {
  const encodedPath = getEncodedPath(video)
  if (selectedVideos.value.has(encodedPath)) {
    selectedVideos.value.delete(encodedPath)
  } else {
    selectedVideos.value.add(encodedPath)
  }
}

function selectAll() {
  const allPaths = videos.value
    .filter(v => !v.isDirectory)
    .map(v => getEncodedPath(v))
  selectedVideos.value = new Set(allPaths)
}

function clearSelection() {
  selectedVideos.value.clear()
}

function playVideo(video: VideoInfo) {
  // Clear any existing selection
  selectedVideos.value.clear()
  
  // Create video info with encoded path
  const videoWithPath = {
    ...video,
    path: getEncodedPath(video)
  }
  
  // Emit the select event
  emit('select', videoWithPath)
}

function playSelected() {
  const selectedList = videos.value.filter(v => selectedVideos.value.has(getEncodedPath(v)))
  if (selectedList.length === 0) return
  
  if (selectedList.length === 1) {
    playVideo(selectedList[0])
  } else {
    emit('playlist', selectedList.map(video => ({
      ...video,
      path: getEncodedPath(video)
    })))
  }
  selectedVideos.value.clear()
}

// Add keyboard shortcut for Enter key
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && selectedVideos.value.size > 0) {
    playSelected()
  }
}

// Update drag handlers to show/hide overlay
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  
  if (!e.dataTransfer?.files) return
  
  const files = Array.from(e.dataTransfer.files)
  const videoFiles = files.filter(file => 
    file.type.startsWith('video/') || 
    file.name.toLowerCase().endsWith('.mkv')
  )
  
  if (videoFiles.length > 0) {
    const file = videoFiles[0]
    
    // Clean up previous blob URL if it exists
    if (currentBlobUrl.value) {
      URL.revokeObjectURL(currentBlobUrl.value)
    }
    
    // Create and store the new blob URL
    currentBlobUrl.value = URL.createObjectURL(file)
    
    // Create video info object
    const video: VideoInfo = {
      name: file.name,
      path: currentBlobUrl.value,
      size: file.size,
      lastModified: file.lastModified
    }
    
    emit('select', video)
  }
}

onMounted(() => {
  loadVideos()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = null
  }
})
</script>

<template>
  <div 
    class="video-list"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold">Videos</h2>
        <div v-if="currentPath.length > 0" class="text-sm text-gray-400">
          / {{ currentPath.join(' / ') }}
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          v-if="selectedVideos.size > 0"
          class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          @click="playSelected"
        >
          Play Selected ({{ selectedVideos.size }})
        </button>
        
        <button 
          v-if="videos.length > 0"
          class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="selectAll"
        >
          Select All
        </button>
        
        <button 
          v-if="selectedVideos.size > 0"
          class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          @click="clearSelection"
        >
          Clear
        </button>
        
        <button 
          class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="loadVideos(currentPath.join('/'))"
          :disabled="isLoading"
        >
          Refresh
        </button>
      </div>
    </div>
    
    <!-- Add drag and drop overlay -->
    <div 
      v-if="isDragging" 
      class="fixed inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="text-2xl font-semibold text-white bg-black/50 px-6 py-4 rounded-lg">
        Drop video file here
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-8">
      Loading videos...
    </div>
    
    <div v-else-if="error" class="text-red-500 py-4">
      {{ error }}
    </div>
    
    <div v-else-if="videos.length === 0" class="text-center py-8">
      No videos found in the current directory.
    </div>
    
    <div v-else class="grid gap-4">
      <!-- Back button when in subfolder -->
      <div 
        v-if="currentPath.length > 0"
        class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
        @click="navigateToFolder('..')"
      >
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>Back to parent folder</span>
        </div>
      </div>
      
      <!-- Folders first -->
      <div 
        v-for="video in videos.filter(v => v.isDirectory)"
        :key="video.path"
        class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
        @click="navigateToFolder(video.name)"
      >
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium">{{ video.name }}</h3>
              <div class="text-sm text-gray-400">
                Last modified: {{ formatDate(video.lastModified) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Video files -->
      <div 
        v-for="video in videos.filter(v => !v.isDirectory)" 
        :key="video.path"
        class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
        :class="{ 'ring-2 ring-blue-500': selectedVideos.has(getEncodedPath(video)) }"
        @click="toggleSelect(video)"
        @dblclick="playVideo(video)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-medium">{{ video.name }}</h3>
            <div class="text-sm text-gray-400">
              Size: {{ formatSize(video.size) }}
            </div>
            <div class="text-sm text-gray-400">
              Last modified: {{ formatDate(video.lastModified) }}
            </div>
          </div>
          
          <div class="text-blue-400 hover:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Fixed play button -->
    <div v-if="videos.length > 0" class="fixed bottom-8 right-8 flex flex-col items-center gap-2">
      <div class="text-sm font-medium bg-black/80 px-3 py-1 rounded">
        {{ videos.filter(v => !v.isDirectory && v.name.match(/\.(mp4|mkv|webm|avi)$/i)).length }} videos
      </div>
      <button
        class="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-lg"
        @click="selectedVideos.size > 0 ? playSelected() : playVideo(videos.find(v => !v.isDirectory)!)"
        :disabled="videos.filter(v => !v.isDirectory).length === 0"
        :class="{ 'opacity-50 cursor-not-allowed': videos.filter(v => !v.isDirectory).length === 0 }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.video-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style> 