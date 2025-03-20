<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '~/stores/settings'

type TabType = 'hotkeys' | 'appearance' | 'tips'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'close': []
}>()

const activeTab = ref<TabType>('hotkeys')
const settings = useSettingsStore()

const hotkeysList = [
  { key: 'Space', desc: 'Play/Pause' },
  { key: 'Left/Right', desc: 'Previous/Next subtitle' },
  { key: 'a/d', desc: 'Previous/Next subtitle' },
  { key: 'Down/s', desc: 'Seek to subtitle start' },
  { key: 'Up/w', desc: 'Toggle auto-pause mode' },
  { key: 'p', desc: 'Disable auto-pause mode' },
  { key: 'v', desc: 'Toggle subtitle visibility' },
  { key: 'c', desc: 'Toggle secondary subtitles' },
  { key: 'f', desc: 'Toggle furigana' },
  { key: 'g', desc: 'Toggle word colorization' },
  { key: 'i', desc: 'Toggle subtitle track info' },
  { key: 'x', desc: 'Toggle sidebar' },
  { key: 't', desc: 'Cycle audio tracks' },
  { key: 'y', desc: 'Cycle subtitle tracks' },
  { key: 'h', desc: 'Toggle regex replacements' },
  { key: '-/=', desc: 'Decrease/Increase subtitle size' },
  { key: 'PageUp/Down', desc: 'Jump 87 seconds (OP Skip)' },
  { key: 'm/n', desc: 'Increase/Decrease playback speed' },
  { key: 'e', desc: 'Export current subtitle to Anki' },
  { key: 'Shift+D', desc: 'Download subtitles' }
]

function setActiveTab(tab: TabType) {
  activeTab.value = tab
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="emit('close')"
    >
      <div class="bg-gray-900 w-[800px] max-h-[90vh] rounded-lg overflow-hidden">
        <!-- Header -->
        <div class="flex border-b border-gray-700 p-4">
          <button 
            v-for="tab in ['hotkeys', 'appearance', 'tips'] as TabType[]"
            :key="tab"
            :class="[
              'px-4 py-2 rounded-lg mr-2',
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
            ]"
            @click="setActiveTab(tab)"
          >
            {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          </button>
          
          <button 
            class="ml-auto text-gray-400 hover:text-white"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <!-- Hotkeys tab -->
          <div v-if="activeTab === 'hotkeys'">
            <div class="grid grid-cols-2 gap-4">
              <div 
                v-for="hotkey in hotkeysList" 
                :key="hotkey.key"
                class="flex items-center"
              >
                <kbd class="px-2 py-1 bg-gray-800 rounded text-sm mr-2">
                  {{ hotkey.key }}
                </kbd>
                <span>{{ hotkey.desc }}</span>
              </div>
            </div>
          </div>

          <!-- Appearance tab -->
          <div v-else-if="activeTab === 'appearance'" class="space-y-6">
            <div>
              <h3 class="text-lg mb-2">Video Alignment</h3>
              <div class="space-x-4">
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.videoAlignment"
                    value="left"
                    class="mr-2"
                  >
                  Left
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.videoAlignment"
                    value="center"
                    class="mr-2"
                  >
                  Center
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.videoAlignment"
                    value="right"
                    class="mr-2"
                  >
                  Right
                </label>
              </div>
            </div>

            <div>
              <h3 class="text-lg mb-2">Primary Subtitle Style</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm mb-1">Font Size</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="range"
                      v-model="settings.primarySubtitleFontSize"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      class="w-64"
                    >
                    <span class="ml-2">{{ Math.round(settings.primarySubtitleFontSize * 100) }}%</span>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm mb-1">Font Family</label>
                  <input
                    v-model="settings.subtitleFontFamily"
                    class="w-64 bg-gray-800 px-3 py-1 rounded"
                    placeholder="Arial, sans-serif"
                  >
                </div>
                
                <div>
                  <label class="block text-sm mb-1">Font Weight</label>
                  <select
                    v-model="settings.subtitleFontWeight"
                    class="w-64 bg-gray-800 px-3 py-1 rounded"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg mb-2">Secondary Subtitle Style</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm mb-1">Font Size</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="range"
                      v-model="settings.secondarySubtitleFontSize"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      class="w-64"
                    >
                    <span class="ml-2">{{ Math.round(settings.secondarySubtitleFontSize * 100) }}%</span>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm mb-1">Font Family</label>
                  <input
                    v-model="settings.secondarySubtitleFontFamily"
                    class="w-64 bg-gray-800 px-3 py-1 rounded"
                    placeholder="Arial, sans-serif"
                  >
                </div>
                
                <div>
                  <label class="block text-sm mb-1">Font Weight</label>
                  <select
                    v-model="settings.secondarySubtitleFontWeight"
                    class="w-64 bg-gray-800 px-3 py-1 rounded"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg mb-2">Text Replacements</h3>
              <div class="space-y-2">
                <div 
                  v-for="(replacement, i) in settings.regexReplacements"
                  :key="i"
                  class="flex items-center space-x-2"
                >
                  <input
                    v-model="replacement.regex"
                    placeholder="Regex pattern"
                    class="bg-gray-800 px-3 py-1 rounded"
                  >
                  <input
                    v-model="replacement.replaceText"
                    placeholder="Replace with"
                    class="bg-gray-800 px-3 py-1 rounded"
                  >
                  <button
                    class="text-red-500 hover:text-red-400"
                    @click="settings.removeRegexReplacement(i)"
                  >
                    Remove
                  </button>
                </div>
                <button
                  class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                  @click="settings.addRegexReplacement"
                >
                  Add Replacement
                </button>
              </div>
            </div>

            <div>
              <h3 class="text-lg mb-2">Tokenization Method</h3>
              <div class="space-x-4">
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.tokenizationMethod"
                    value="kuromoji"
                    class="mr-2"
                    @change="settings.setTokenizationMethod('kuromoji')"
                  >
                  Kuromoji
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.tokenizationMethod"
                    value="sudachi"
                    class="mr-2"
                    @change="settings.setTokenizationMethod('sudachi')"
                  >
                  Sudachi
                </label>
              </div>
              <p class="text-sm text-gray-400 mt-1">
                Sudachi generally provides more accurate readings but requires a running Python server
              </p>
            </div>

            <div>
              <h3 class="text-lg mb-2">Word Colorization</h3>
              <div class="flex items-center">
                <label class="inline-flex items-center">
                  <input
                    type="checkbox"
                    v-model="settings.colorizeWords"
                    class="mr-2"
                    @change="settings.saveSettings()"
                  >
                  Colorize words by part of speech
                </label>
              </div>
              <p class="text-sm text-gray-400 mt-1">
                Colors each word according to its grammatical function (nouns, verbs, particles, etc.)
              </p>
            </div>

            <div>
              <h3 class="text-lg mb-2">Control Buttons</h3>
              <div class="flex items-center">
                <label class="inline-flex items-center">
                  <input
                    type="checkbox"
                    v-model="settings.hideControlButtons"
                    class="mr-2"
                    @change="settings.saveSettings()"
                  >
                  Hide control buttons during playback
                </label>
              </div>
              <p class="text-sm text-gray-400 mt-1">
                Hides the sidebar toggle and help buttons while the video is playing
              </p>
            </div>
          </div>

          <!-- Tips tab -->
          <div v-else-if="activeTab === 'tips'" class="prose prose-invert">
            <h3>Video Format Support</h3>
            <p>
              Browser video support varies. For best results:
            </p>
            <ul>
              <li>Use MP4 files with H.264 video and AAC audio</li>
              <li>For HEVC/H.265 video, use Chrome or Edge</li>
              <li>For AC3 audio, use Edge or specialized Chromium builds</li>
            </ul>
            
            <h3>Subtitle Tips</h3>
            <ul>
              <li>SRT, VTT, and ASS subtitle formats are supported</li>
              <li>Japanese subtitles will automatically get furigana readings</li>
              <li>Use auto-pause mode (a) to study line by line</li>
              <li>Adjust subtitle timing with the offset controls if needed</li>
              <li>Multiple subtitle files can be loaded simultaneously</li>
              <li>Use the 'y' key to cycle between loaded subtitle tracks</li>
              <li>Subtitles from different tracks will be displayed stacked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template> 