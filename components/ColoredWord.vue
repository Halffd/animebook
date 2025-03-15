<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  pos?: string // Part of speech
  reading?: string
  isProcessed?: boolean
}>()

// Define a type for the color map keys
type ColorMapKey = '名詞' | 'noun' | '動詞' | 'verb' | '助詞' | 'particle' | 
  '形容詞' | 'adjective' | '副詞' | 'adverb' | '接続詞' | 'conjunction' | 
  '感動詞' | 'interjection' | '連体詞' | 'prenominal' | '接頭詞' | 'prefix' | 
  '助動詞' | 'auxiliary' | '記号' | 'symbol' | 'unknown'

// Color mapping for different parts of speech
const colorMap: Record<ColorMapKey, string> = {
  '名詞': '#FF5252', // Noun - bright red
  'noun': '#FF5252',
  '動詞': '#4CAF50', // Verb - bright green
  'verb': '#4CAF50',
  '助詞': '#2196F3', // Particle - bright blue
  'particle': '#2196F3',
  '形容詞': '#FF9800', // Adjective - bright orange
  'adjective': '#FF9800',
  '副詞': '#9C27B0', // Adverb - bright purple
  'adverb': '#9C27B0',
  '接続詞': '#00BCD4', // Conjunction - bright cyan
  'conjunction': '#00BCD4',
  '感動詞': '#FFEB3B', // Interjection - bright yellow
  'interjection': '#FFEB3B',
  '連体詞': '#8BC34A', // Prenominal - bright light green
  'prenominal': '#8BC34A',
  '接頭詞': '#FF4081', // Prefix - bright pink
  'prefix': '#FF4081',
  '助動詞': '#7C4DFF', // Auxiliary verb - bright violet
  'auxiliary': '#7C4DFF',
  '記号': '#607D8B', // Symbol - blue grey
  'symbol': '#607D8B',
  'unknown': '#BDBDBD' // Unknown - grey
}

// Get color based on part of speech
const wordColor = computed(() => {
  if (!props.pos) return '#FFFFFF' // Default white
  
  // Check for Japanese POS
  const japanesePos = Object.keys(colorMap).find(key => 
    props.pos?.includes(key)
  ) as ColorMapKey | undefined
  
  if (japanesePos) {
    return colorMap[japanesePos]
  }
  
  // Check for English POS
  const englishPos = props.pos.toLowerCase()
  for (const [key, value] of Object.entries(colorMap)) {
    if (englishPos.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return colorMap.unknown
})

// Determine if we should show the reading
const showReading = computed(() => {
  return props.reading && props.reading !== props.text
})
</script>

<template>
  <span 
    class="colored-word"
    :style="{ color: wordColor }"
    :title="props.pos"
  >
    {{ text }}
    <span v-if="showReading" class="word-reading">
      ({{ reading }})
    </span>
  </span>
</template>

<style scoped>
.colored-word {
  display: inline-block;
  text-shadow: 
    0 0 5px rgba(0,0,0,0.8),
    0 0 10px rgba(0,0,0,0.5);
  margin: 0 1px;
}

.word-reading {
  font-size: 0.7em;
  opacity: 0.8;
  margin-left: 2px;
}
</style> 