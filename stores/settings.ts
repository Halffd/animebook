import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'

interface RegexReplacement {
  regex: string
  replaceText: string
}

interface Settings {
  videoAlignment: 'left' | 'center' | 'right'
  showVideoControls: boolean
  primarySubtitleFontSize: number
  secondarySubtitleFontSize: number
  subtitleFontFamily: string
  secondarySubtitleFontFamily: string
  subtitleFontWeight: number
  secondarySubtitleFontWeight: number
  regexReplacements: RegexReplacement[]
  regexReplacementsEnabled: boolean
  tokenizationMethod: 'kuromoji' | 'sudachi'
  colorizeWords: boolean
  autoColorizeJapanese: boolean
  hideControlButtons: boolean
  hidePlayerControls: boolean
  videoPositions: Record<string, number>
}

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    videoAlignment: 'center',
    showVideoControls: true,
    primarySubtitleFontSize: 1.5,
    secondarySubtitleFontSize: 1.2,
    subtitleFontFamily: 'Arial, sans-serif',
    secondarySubtitleFontFamily: 'Arial, sans-serif',
    subtitleFontWeight: 600,
    secondarySubtitleFontWeight: 500,
    regexReplacements: [
      { regex: '\\(\\(.*?\\)\\)', replaceText: '' },
      { regex: '\\(.*?\\)', replaceText: '' },
      { regex: '（.*?）', replaceText: '' }
    ],
    regexReplacementsEnabled: true,
    tokenizationMethod: 'kuromoji',
    colorizeWords: false,
    autoColorizeJapanese: true,
    hideControlButtons: false,
    hidePlayerControls: true,
    videoPositions: {}
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
    },

    adjustFontSize(isSecondary: boolean, increase: boolean) {
      const step = 0.1
      const min = 0.5
      const max = 2.5
      
      if (isSecondary) {
        this.secondarySubtitleFontSize = Math.min(
          Math.max(this.secondarySubtitleFontSize + (increase ? step : -step), min),
          max
        )
      } else {
        this.primarySubtitleFontSize = Math.min(
          Math.max(this.primarySubtitleFontSize + (increase ? step : -step), min),
          max
        )
      }
      
      this.saveSettings()
    },

    adjustFontWeight(isSecondary: boolean, increase: boolean) {
      const step = 100
      const min = 100
      const max = 900
      
      if (isSecondary) {
        this.secondarySubtitleFontWeight = Math.min(
          Math.max(this.secondarySubtitleFontWeight + (increase ? step : -step), min),
          max
        )
      } else {
        this.subtitleFontWeight = Math.min(
          Math.max(this.subtitleFontWeight + (increase ? step : -step), min),
          max
        )
      }
      
      this.saveSettings()
    },

    saveVideoPosition(videoPath: string, position: number) {
      this.videoPositions[videoPath] = position
      this.saveSettings()
    },

    getVideoPosition(videoPath: string): number {
      return this.videoPositions[videoPath] || 0
    },

    clearVideoPosition(videoPath: string) {
      delete this.videoPositions[videoPath]
      this.saveSettings()
    }
  }
}) 