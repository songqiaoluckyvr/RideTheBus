type SfxName =
  | 'card-deal'
  | 'deck-shuffle'
  | 'chips-added'
  | 'menu-select'
  | 'win'
  | 'lose'
  | 'joker-unlock'
  | 'joker-gold-unlock'

const SFX_FILES: Record<Exclude<SfxName, 'lose'>, string> = {
  'card-deal':       'audio/card-deal.mp3',
  'deck-shuffle':    'audio/deck-shuffle.mp3',
  'chips-added':     'audio/chips-added.mp3',
  'menu-select':     'audio/menu-select.mp3',
  'win':             'audio/win.mp3',
  'joker-unlock':    'audio/joker-unlock.mp3',
  'joker-gold-unlock': 'audio/joker-gold-unlock.mp3',
}

const LOSE_FILES = ['audio/lose-1.mp3', 'audio/lose-2.mp3', 'audio/lose-3.mp3']
const BG_MUSIC_FILES = ['audio/bg-music-1.mp3', 'audio/bg-music-2.mp3']

const SFX_VOLUME = 0.7
const MUSIC_VOLUME = 0.3

class AudioManager {
  private sfxCache: Map<string, HTMLAudioElement> = new Map()
  private bgAudio: HTMLAudioElement | null = null
  private bgIndex = 0
  private _muted = false

  get muted(): boolean { return this._muted }

  setMuted(muted: boolean): void {
    this._muted = muted
    if (this.bgAudio) this.bgAudio.muted = muted
    for (const audio of this.sfxCache.values()) audio.muted = muted
  }

  private base(): string {
    return import.meta.env.BASE_URL
  }

  private loadSfx(file: string): HTMLAudioElement {
    if (!this.sfxCache.has(file)) {
      const audio = new Audio(this.base() + file)
      audio.volume = SFX_VOLUME
      audio.muted = this._muted
      this.sfxCache.set(file, audio)
    }
    return this.sfxCache.get(file)!
  }

  play(sound: SfxName): void {
    let file: string
    if (sound === 'lose') {
      file = LOSE_FILES[Math.floor(Math.random() * LOSE_FILES.length)]
    } else {
      file = SFX_FILES[sound]
    }
    const audio = this.loadSfx(file)
    audio.currentTime = 0
    audio.play().catch(() => {/* autoplay blocked — user hasn't interacted yet */})
  }

  startBgMusic(): void {
    if (this.bgAudio) return
    this.bgIndex = Math.floor(Math.random() * BG_MUSIC_FILES.length)
    this._playBgTrack()
  }

  stopBgMusic(): void {
    if (!this.bgAudio) return
    this.bgAudio.pause()
    this.bgAudio.onended = null
    this.bgAudio = null
  }

  private _playBgTrack(): void {
    const audio = new Audio(this.base() + BG_MUSIC_FILES[this.bgIndex])
    audio.volume = MUSIC_VOLUME
    audio.muted = this._muted
    audio.onended = () => {
      this.bgIndex = (this.bgIndex + 1) % BG_MUSIC_FILES.length
      this._playBgTrack()
    }
    audio.play().catch(() => {/* autoplay blocked */})
    this.bgAudio = audio
  }
}

export const audioManager = new AudioManager()
