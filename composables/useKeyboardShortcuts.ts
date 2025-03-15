import { onMounted, onUnmounted, ref } from 'vue'

type KeyHandler = (e: KeyboardEvent) => void
type KeyHandlers = Record<string, KeyHandler>

export function useKeyboardShortcuts(handlers: KeyHandlers) {
  // Track pressed keys to prevent repeated triggering
  const pressedKeys = new Set<string>()
  // Track last space key press time
  const lastSpaceKeyTime = ref(0)
  const SPACE_KEY_DELAY = 300 // 300ms delay for space key

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
      if (now - lastSpaceKeyTime.value < SPACE_KEY_DELAY) {
        return // Skip if space was pressed too recently
      }
      lastSpaceKeyTime.value = now
    }

    const handler = handlers[e.key]
    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    // Remove key from pressed keys
    pressedKeys.delete(e.key)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    // Clear pressed keys when window loses focus
    window.addEventListener('blur', () => pressedKeys.clear())
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', () => pressedKeys.clear())
  })
} 