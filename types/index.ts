export interface Token {
  surface_form: string
  basic_form: string
  reading: string
  pos: string
}

export interface VideoInfo {
  name: string
  path: string
  size: number
  lastModified: number
}

export interface Tokenizer {
  tokenize(text: string): Token[]
}

export interface Caption {
  id: string
  startTime: number
  endTime: number
  text: string
  furigana?: Array<[string, string]>
  tokens?: Token[]
  lane?: number
  isActive?: boolean
  customOffset?: number | null
  minCustomOffset?: number | null
}

export interface SubtitleTrack {
  captions: Caption[]
  metadata: {
    language: string
    title: string
  }
}

export interface CaptionsState {
  captions: Caption[]
  currentTime: number
  activeCaptionIds: string[]
  customOffsets: Record<string, number>
  isAutoPauseMode: boolean
  isOffsetMode: boolean
}

interface Settings {
  videoAlignment: 'left' | 'center' | 'right'
  showVideoControls: boolean
  subtitleFontSize: number
  regexReplacements: RegexReplacement[]
  regexReplacementsEnabled: boolean
}

interface RegexReplacement {
  regex: string
  replaceText: string
} 