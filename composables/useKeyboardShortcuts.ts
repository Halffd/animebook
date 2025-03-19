import { onMounted, onUnmounted, ref } from 'vue'

type KeyHandler = (e: KeyboardEvent) => void
type KeyHandlers = Record<string, KeyHandler>

export function useKeyboardShortcuts(handlers: KeyHandlers) {
  // Track pressed keys to prevent repeated triggering
  const pressedKeys = new Set<string>()
  // Track last space key press time
  const lastSpaceKeyTime = ref(0)
  const SPACE_KEY_DELAY = 600 // Increased from 500ms to 600ms for better debouncing
  
  // Track if we're currently processing a key
  const isProcessingKey = ref(false)
  // Track if a key handler is currently executing
  const isHandlerExecuting = ref(false)

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (target && (
      /textarea|select/i.test(target.tagName) ||
      target.hasAttribute('contenteditable') ||
      target instanceof HTMLInputElement
    )) {
      return
    }

    // Skip if key is already pressed (prevents repeated triggering while holding)
    if (pressedKeys.has(e.key)) {
      return
    }

    // Add key to pressed keys
    pressedKeys.add(e.key)

    // Special handling for space key
    if (e.key === ' ') {
      const now = Date.now()
      if (now - lastSpaceKeyTime.value < SPACE_KEY_DELAY || isProcessingKey.value || isHandlerExecuting.value) {
        e.preventDefault() // Prevent default even if we don't handle it
        return // Skip if space was pressed too recently or we're processing another key
      }
      lastSpaceKeyTime.value = now
    }

    const handler = handlers[e.key]
    if (handler) {
      e.preventDefault()
      
      // Set processing flag to prevent multiple rapid key presses
      isProcessingKey.value = true
      
      try {
        // Set handler executing flag
        isHandlerExecuting.value = true
        
        // Execute handler
        handler(e)
      } finally {
        // Reset handler executing flag
        isHandlerExecuting.value = false
        
        // Reset processing flag after a delay
        setTimeout(() => {
          isProcessingKey.value = false
        }, 150) // Increased from 100ms to 150ms
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    // Remove key from pressed keys
    pressedKeys.delete(e.key)
    
    // For space key, ensure we don't process it again too soon
    if (e.key === ' ') {
      lastSpaceKeyTime.value = Date.now();
    }
  }

  function clearAllFlags() {
    pressedKeys.clear()
    isProcessingKey.value = false
    isHandlerExecuting.value = false
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    // Clear pressed keys when window loses focus
    window.addEventListener('blur', clearAllFlags)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', clearAllFlags)
    clearAllFlags()
  })
} 