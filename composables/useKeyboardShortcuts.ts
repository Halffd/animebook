import { onMounted, onUnmounted, ref } from 'vue'

type KeyHandler = (e: KeyboardEvent) => void
type KeyHandlers = Record<string, KeyHandler>

export function useKeyboardShortcuts(handlers: KeyHandlers) {
  // Track pressed keys to prevent repeated triggering
  const pressedKeys = new Set<string>()
  // Track if we're currently processing a key
  const isProcessingKey = ref(false)
  // Track if space is being held
  const isSpaceHeld = ref(false)
  // Track last space key press time
  const lastSpaceKeyTime = ref(0)
  const SPACE_KEY_DELAY = 200 // Reduced from 600ms to 200ms for better responsiveness

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (target && (
      /textarea|select/i.test(target.tagName) ||
      target.hasAttribute('contenteditable') ||
      target instanceof HTMLInputElement
    )) {
      return
    }

    // Special handling for space key
    if (e.key === ' ') {
      e.preventDefault() // Always prevent default for space
      
      // If space is already held down, ignore
      if (isSpaceHeld.value) return
      
      const now = Date.now()
      // Ignore if pressed too recently (prevents double triggers)
      if (now - lastSpaceKeyTime.value < SPACE_KEY_DELAY) {
        return
      }
      
      isSpaceHeld.value = true
      lastSpaceKeyTime.value = now
      
      // Execute handler
      const handler = handlers[e.key]
      if (handler) {
        handler(e)
      }
      return
    }

    // For other keys, skip if already pressed
    if (pressedKeys.has(e.key)) {
      return
    }

    // Add key to pressed keys
    pressedKeys.add(e.key)

    const handler = handlers[e.key]
    if (handler) {
      e.preventDefault()
      
      // Set processing flag
      isProcessingKey.value = true
      
      try {
        handler(e)
      } finally {
        // Reset processing flag after a delay
        setTimeout(() => {
          isProcessingKey.value = false
        }, 150)
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    // Special handling for space key
    if (e.key === ' ') {
      e.preventDefault()
      if (isSpaceHeld.value) {
        isSpaceHeld.value = false
        // Execute handler again on release if it was held
        const handler = handlers[e.key]
        if (handler) {
          handler(e)
        }
      }
      return
    }

    // Remove key from pressed keys
    pressedKeys.delete(e.key)
  }

  function clearAllFlags() {
    pressedKeys.clear()
    isProcessingKey.value = false
    isSpaceHeld.value = false
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearAllFlags)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', clearAllFlags)
    clearAllFlags()
  })
} 