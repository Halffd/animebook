<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  reading: string
}>()

// Check if the text contains kanji
const hasKanji = computed(() => {
  return /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(props.text)
})

// Only show furigana if the reading is different from the text and the text contains kanji
const showFurigana = computed(() => {
  return hasKanji.value && props.reading && props.reading !== props.text
})

// Determine if the text is a space or punctuation
const isSpaceOrPunctuation = computed(() => {
  return /^[\s\p{P}]+$/u.test(props.text)
})
</script>

<template>
  <template v-if="isSpaceOrPunctuation">
    <span class="punctuation">{{ text }}</span>
  </template>
  <ruby v-else class="furigana-wrapper">
    {{ text }}<rt v-if="showFurigana">{{ reading }}</rt>
  </ruby>
</template>

<style>
ruby {
  ruby-align: center;
  display: inline;
  position: relative;
  line-height: 1.6;
  margin: 0;
  padding: 0;
}

.punctuation {
  display: inline;
  margin: 0;
  padding: 0;
}

rt {
  font-size: 0.5em;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
  text-align: center;
  white-space: nowrap;
}
</style> 