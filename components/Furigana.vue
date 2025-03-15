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
</script>

<template>
  <ruby>
    {{ text }}<rt v-if="showFurigana">{{ reading }}</rt>
  </ruby>
</template>

<style>
ruby {
  ruby-align: center;
  display: inline-block;
  margin: 0 1px;
}
rt {
  font-size: 0.6em;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
}
</style> 