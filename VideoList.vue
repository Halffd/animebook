<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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

const emit = defineEmits<{
  'select': [video: VideoInfo]
  'playlist': [videos: VideoInfo[]]
}>()

async function loadVideos(path: string = '') {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await $fetch('/api/videos', {
      params: { path }
    })
    // Sort directories and files alphabetically
    const sortedVideos = response.videos.sort((a, b) => {
      // First sort by type (directories first)
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name)
    })
    videos.value = sortedVideos
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

function toggleSelect(video: VideoInfo) {
  if (selectedVideos.value.has(video.path)) {
    selectedVideos.value.delete(video.path)
  } else {
    selectedVideos.value.add(video.path)
  }
}

function selectAll() {
  const allPaths = videos.value
    .filter(v => !v.isDirectory)
    .map(v => v.path)
  selectedVideos.value = new Set(allPaths)
}

function clearSelection() {
  selectedVideos.value.clear()
}

function playSelected() {
  const selectedList = videos.value.filter(v => selectedVideos.value.has(v.path))
  if (selectedList.length === 0) return
  
  if (selectedList.length === 1) {
    emit('select', selectedList[0])
  } else {
    emit('playlist', selectedList)
  }
  clearSelection()
}

onMounted(() => {
  loadVideos()

  // Add keyboard event listeners
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e: KeyboardEvent) {
  // Enter key plays selected videos
  if (e.key === 'Enter' && selectedVideos.value.size > 0) {
    playSelected()
  }
  // 'a' key with ctrl selects all videos
  if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault() // Prevent default browser select all
    selectAll()
  }
}
</script>

<template>
  <div class="video-list">
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
        :class="{ 'ring-2 ring-blue-500': selectedVideos.has(video.path) }"
        @click="toggleSelect(video)"
        @dblclick="emit('select', video)"
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

    <!-- Fixed play button at bottom -->
    <div 
      v-if="videos.length > 0" 
      class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-center items-center gap-4"
    >
      <div class="text-sm text-gray-400">
        <span v-if="selectedVideos.size > 0">{{ selectedVideos.size }} selected</span>
        <span v-else>No videos selected</span>
      </div>
      
      <button 
        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="playSelected"
        :disabled="selectedVideos.size === 0"
      >
        Play Selected
      </button>
      
      <div class="text-sm text-gray-400">
        Press <kbd class="px-1 py-0.5 bg-gray-800 rounded">Enter</kbd> to play
        • <kbd class="px-1 py-0.5 bg-gray-800 rounded">Ctrl</kbd> + <kbd class="px-1 py-0.5 bg-gray-800 rounded">A</kbd> to select all
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: calc(1rem + 80px); /* Add padding for fixed bottom bar */
}
</style> 