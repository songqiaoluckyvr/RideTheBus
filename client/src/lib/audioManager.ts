type SfxName =
  | 'card-deal'
  | 'deck-shuffle'
  | 'chips-added'
  | 'menu-select'
  | 'mouse-over'
  | 'mouse-over-2'
  | 'soft-click'
  | 'win'
  | 'lose'
  | 'joker-unlock'
  | 'joker-gold-unlock'

const SFX_FILES: Record<Exclude<SfxName, 'lose'>, string> = {
  'card-deal':       'audio/card-deal.mp3',
  'deck-shuffle':    'audio/deck-shuffle.mp3',
  'chips-added':     'audio/chips-added.mp3',
  'menu-select':     'audio/menu-select.mp3',
  'mouse-over':      'audio/mouse-over-1.mp3',
  'mouse-over-2':    'audio/mouse-over-2.mp3',
  'soft-click':      'audio/soft-click.mp3',
  'win':             'audio/win.mp3',
  'joker-unlock':    'audio/joker-unlock.mp3',
  'joker-gold-unlock': 'audio/joker-gold-unlock.mp3',
}

const LOSE_FILES = ['audio/lose-1.mp3', 'audio/lose-2.mp3', 'audio/lose-3.mp3']
const BG_MUSIC_FILES = ['audio/bg-music-1.mp3', 'audio/bg-music-2.mp3']

const SFX_VOLUME = 0.7
const MUSIC_VOLUME = 0.27

/** Per-sound volume multiplier (applied on top of SFX_VOLUME) */
const SFX_VOLUME_SCALE: Partial<Record<SfxName, number>> = {
  'mouse-over':   0.25,
  'mouse-over-2': 1.6,
  'soft-click':   0.05,
  'joker-unlock':      0.75,
  'joker-gold-unlock': 0.75,
}

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
    audio.volume = Math.min(1, SFX_VOLUME * (SFX_VOLUME_SCALE[sound] ?? 1))
    audio.currentTime = 0
    audio.play().catch(() => {/* autoplay blocked — user hasn't interacted yet */})
  }

  /** track: 1 = game play (bg-music-1), 2 = menus/lobby (bg-music-2) */
  startBgMusic(track: 1 | 2 = 2): void {
    const index = track - 1
    // Already playing the right track — just resume if paused (autoplay may have blocked it)
    if (this.bgAudio && this.bgIndex === index) {
      if (this.bgAudio.paused) this.bgAudio.play().catch(() => {})
      return
    }
    // Switch tracks
    this.stopBgMusic()
    this.bgIndex = index
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
    audio.onended = () => this._playBgTrack()
    audio.play().catch(() => {/* autoplay blocked */})
    this.bgAudio = audio
  }
}

export const audioManager = new AudioManager()
