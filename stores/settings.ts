import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'

interface RegexReplacement {
  regex: string
  replaceText: string
}

interface Settings {
  videoAlignment: 'left' | 'center' | 'right'
  showVideoControls: boolean
  subtitleFontSize: number
  regexReplacements: RegexReplacement[]
  regexReplacementsEnabled: boolean
  tokenizationMethod: 'kuromoji' | 'sudachi'
  colorizeWords: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    videoAlignment: 'center',
    showVideoControls: true,
    subtitleFontSize: 1.5,
    regexReplacements: [
      { regex: '\\(\\(.*?\\)\\)', replaceText: '' },
      { regex: '\\(.*?\\)', replaceText: '' },
      { regex: '（.*?）', replaceText: '' }
    ],
    regexReplacementsEnabled: true,
    tokenizationMethod: 'kuromoji',
    colorizeWords: false
  }),

  actions: {
    loadSettings() {
      try {
        const saved = localStorage.getItem('animebook-settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          this.$patch(parsed)
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    },

    saveSettings() {
      try {
        localStorage.setItem('animebook-settings', JSON.stringify(this.$state))
      } catch (e) {
        console.error('Failed to save settings:', e)
      }
    },

    addRegexReplacement() {
      this.regexReplacements.push({ regex: '', replaceText: '' })
      this.saveSettings()
    },

    removeRegexReplacement(index: number) {
      this.regexReplacements.splice(index, 1)
      this.saveSettings()
    },

    toggleRegexReplacements() {
      this.regexReplacementsEnabled = !this.regexReplacementsEnabled
      this.saveSettings()
    },

    async setTokenizationMethod(method: 'kuromoji' | 'sudachi') {
      try {
        await $fetch('/api/settings/tokenizer', {
          method: 'POST',
          body: { method }
        })
        this.tokenizationMethod = method
        this.saveSettings()
      } catch (e) {
        console.error('Failed to set tokenization method:', e)
      }
    }
  }
}) 