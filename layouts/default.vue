<script setup lang="ts">
import { useCaptionsStore } from '~/stores/captions'
import { useAnkiExport } from '~/composables/useAnkiExport'
import { computed } from 'vue'

const store = useCaptionsStore()
const ankiExport = useAnkiExport()
const isExporting = computed(() => ankiExport.isExporting.value)

function onExportToAnki(caption: any) {
  // Forward to page component
  navigateTo({
    path: '/',
    query: { 
      action: 'export',
      captionId: caption.id
    }
  })
}
</script>

<template>
  <div 
    class="min-h-screen min-h-[100dvh] bg-black text-white relative flex flex-col"
    :class="[
      { 'mb-[300px]': store.isSidebarVisible }
    ]"
  >
    <NuxtPage class="flex-1" />
    <div 
      class="fixed bottom-0 left-0 w-full h-[300px] bg-gray-900 transition-transform duration-300 ease-in-out z-50 overflow-y-auto"
      :class="[
        { 'translate-y-full': !store.isSidebarVisible }
      ]"
    >
      <CaptionsList
        v-if="store.captions.length"
        :captions="store.captions"
        :active-ids="store.activeCaptionIds"
        :is-offset-mode="store.isOffsetMode"
        :is-auto-pause-mode="store.isAutoPauseMode"
        :is-exporting="isExporting"
        @export-to-anki="onExportToAnki"
      />
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  height: 100dvh;
  overflow: hidden;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Sidebar transitions */
.translate-y-full {
  transform: translateY(100%);
}

/* Ensure proper stacking context */
.z-50 {
  z-index: 50;
}
</style> 