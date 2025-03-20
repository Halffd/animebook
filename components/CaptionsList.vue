<script setup lang="ts">
import type { Caption } from '~/types'
import { useCaptionsStore } from '~/stores/captions'
import { watch, nextTick } from 'vue'

const props = defineProps<{
  captions: Caption[]
  activeIds: string[]
  isOffsetMode?: boolean
  isAutoPauseMode?: boolean
  isExporting: boolean
}>()

const emit = defineEmits<{
  'select-caption': [caption: Caption, offset: number]
  'set-custom-offset': [caption: Caption, offset: number]
  'export-to-anki': [caption: Caption]
}>()

const store = useCaptionsStore()

// Watch for active caption changes and scroll into view
watch(() => props.activeIds, async (newIds) => {
  if (newIds.length > 0) {
    await nextTick()
    const activeElement = document.querySelector(`.caption-item[data-id="${newIds[0]}"]`)
    if (activeElement instanceof HTMLElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}, { immediate: true })

function calcCaptionOffset(caption: Caption): number {
  return store.currentTime - caption.endTime
}

function selectCaption(caption: Caption) {
  emit('select-caption', caption, calcCaptionOffset(caption))
}

function setCustomOffset(caption: Caption) {
  emit('set-custom-offset', caption, calcCaptionOffset(caption))
}

function exportToAnki(caption: Caption) {
  emit('export-to-anki', caption)
}

function selectTrack(index: number) {
  store.setActiveTrack(index)
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`
}
</script>

<template>
  <div class="sidebar-captions">
    <!-- Track selector -->
    <div v-if="store.subtitleTracks.length > 1" class="track-selector">
      <div class="track-selector-header">
        <h3 class="text-lg font-semibold">Subtitle Tracks</h3>
        <span class="text-sm text-gray-400">{{ store.subtitleTracks.length }} tracks loaded</span>
      </div>

      <!-- Subtitle delay controls -->
      <div class="delay-controls">
        <div class="delay-control">
          <label>Primary Track Delay (s)</label>
          <input 
            type="range" 
            :min="-200" 
            :max="200" 
            step="0.1" 
            v-model="store.primarySubtitleDelay"
          />
          <input 
            type="number" 
            :min="-200" 
            :max="200" 
            step="0.1" 
            v-model="store.primarySubtitleDelay"
          />
        </div>
        
        <div class="delay-control">
          <label>Secondary Track Delay (s)</label>
          <input 
            type="range" 
            :min="-200" 
            :max="200" 
            step="0.1" 
            v-model="store.secondarySubtitleDelay"
          />
          <input 
            type="number" 
            :min="-200" 
            :max="200" 
            step="0.1" 
            v-model="store.secondarySubtitleDelay"
          />
        </div>
      </div>

      <div class="track-buttons">
        <button
          v-for="(track, index) in store.subtitleTracks"
          :key="index"
          class="track-button"
          :class="{ 'active': index === store.activeTrackIndex }"
          @click="selectTrack(index)"
        >
          <div class="track-name">{{ track.metadata.title }}</div>
          <span class="track-info">
            {{ track.metadata.language }} · {{ track.captions.length }} captions
          </span>
        </button>
      </div>
    </div>

    <div class="captions-container">
      <div class="captions-list">
        <!-- Primary Track -->
        <div v-if="store.activeTrack" class="track-section">
          <h3 class="text-lg font-semibold mb-2">Primary Track: {{ store.activeTrack.metadata.title }}</h3>
          <div 
            v-for="caption in store.activeTrack.captions" 
            :key="caption.id" 
            class="caption-item"
            :class="{ 'active': activeIds.includes(caption.id) }"
            :data-id="caption.id"
          >
            <div class="caption-header">
              <span class="timestamp">{{ formatTime(caption.startTime) }} - {{ formatTime(caption.endTime) }}</span>
              <div class="caption-delay">
                <label>Offset (s):</label>
                <input 
                  type="number" 
                  :min="-200" 
                  :max="200" 
                  step="0.1" 
                  :value="caption.customOffset || 0"
                  @input="(e: Event) => store.setCustomOffset(caption.id, parseFloat((e.target as HTMLInputElement).value))"
                />
              </div>
            </div>
            <div class="caption-text" tabindex="0">{{ caption.text }}</div>
          </div>
        </div>

        <!-- Secondary Tracks -->
        <div v-for="(track, index) in store.subtitleTracks" :key="index" class="track-section">
          <template v-if="index !== store.activeTrackIndex">
            <h3 class="text-lg font-semibold mb-2">Secondary Track: {{ track.metadata.title }}</h3>
            <div 
              v-for="caption in track.captions" 
              :key="caption.id" 
              class="caption-item"
              :class="{ 'active': activeIds.includes(caption.id) }"
              :data-id="caption.id"
            >
              <div class="caption-header">
                <span class="timestamp">{{ formatTime(caption.startTime) }} - {{ formatTime(caption.endTime) }}</span>
                <div class="caption-delay">
                  <label>Offset (s):</label>
                  <input 
                    type="number" 
                    :min="-200" 
                    :max="200" 
                    step="0.1" 
                    :value="caption.customOffset || 0"
                    @input="(e: Event) => store.setCustomOffset(caption.id, parseFloat((e.target as HTMLInputElement).value))"
                  />
                </div>
              </div>
              <div class="caption-text" tabindex="0">{{ caption.text }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-selector {
  padding: 1rem;
  border-bottom: 1px solid theme('colors.gray.700');
}

.track-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.track-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.05rem;
}

.track-button {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background-color: theme('colors.gray.800');
  transition: background-color 0.2s;
  flex: 1;
  min-width: 80px;
  align-items: center;
}

.track-button.active {
  background-color: theme('colors.blue.600');
}

.track-info {
  font-size: 0.75rem;
  color: theme('colors.gray.400');
}

.track-button.active .track-info {
  color: theme('colors.gray.200');
}

.caption {
  position: relative;
  padding: 0.4em;
  cursor: pointer;
  transition: background-color 100ms linear;
}

.caption.active {
  background-color: theme('colors.blue.600');
  color: white;
}

.caption-time-offset {
  position: absolute;
  top: 0;
  right: 2px;
  font-size: 0.75rem;
  color: theme('colors.gray.500');
}

.set-custom-offset-button {
  opacity: 0;
  position: absolute;
  left: -135px;
  width: 135px;
  height: 100%;
  transition: opacity 0.2s;
}

.caption-controls:hover .set-custom-offset-button {
  opacity: 1;
}

.anki-export-button {
  opacity: 0;
  position: absolute;
  right: -30px;
  width: 30px;
  height: 100%;
  background: theme('colors.blue.600');
  color: white;
  transition: opacity 0.2s;
}

.caption-controls:hover .anki-export-button {
  opacity: 1;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.delay-controls {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}

.delay-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #4a5568;
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3182ce;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3182ce;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

input[type="number"] {
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.caption-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  color: theme('colors.gray.400');
  margin-bottom: 0.2em;
}

.timestamp {
  font-family: monospace;
}

.caption-delay {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.caption-delay input {
  width: 80px;
}

.caption-text {
  white-space: pre-wrap;
  user-select: text;
  cursor: text;
  pointer-events: auto;
}

.track-section {
  margin-bottom: 2rem;
}

.caption-item {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.caption-item.active {
  background-color: theme('colors.blue.600');
  border-color: theme('colors.blue.400');
}

.caption-item.active .caption-text {
  color: white;
}

/* Primary track styles */
div.video-container.center.has-subtitles.flex-1 > div > div > div:nth-child(1) > div > span {
  font-weight: normal;
  text-shadow: 
    2px 3px 2px rgba(0, 0, 0, 0.8),
    -2px -3px 2px rgba(0, 0, 0, 0.8),
    2px -3px 2px rgba(0, 0, 0, 0.8),
    -2px 3px 2px rgba(0, 0, 0, 0.8);
}

/* Secondary track styles */
div.video-container.center.has-subtitles.flex-1 > div > div > div:nth-child(2) > div > span {
  font-weight: 800; /* 70% thicker */
  opacity: 1.0;
  text-shadow: 
    5px 7.5px 5px rgba(0, 0, 0, 0.8),
    -5px -7.5px 5px rgba(0, 0, 0, 0.8),
    5px -7.5px 5px rgba(0, 0, 0, 0.8),
    -5px 7.5px 5px rgba(0, 0, 0, 0.8);
}

/* Scrollbar styles */
.captions-container::-webkit-scrollbar {
  width: 8px;
}

.captions-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.captions-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.captions-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.captions-container {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 1rem;
  pointer-events: auto;
}
</style> 