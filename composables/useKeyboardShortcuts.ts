import { onMounted, onUnmounted } from 'vue'

type KeyHandler = (e: KeyboardEvent) => void
type KeyHandlers = Record<string, KeyHandler>

export function useKeyboardShortcuts(handlers: KeyHandlers) {
  // Track pressed keys to prevent repeated triggering
  const pressedKeys = new Set<string>()

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