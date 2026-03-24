export type BgmTrack = 'entrance' | 'home' | 'game'
export type SfxTrack = 'button-click' | 'correct' | 'wrong' | 'furniture-unlock'

const BGM_PATHS: Record<BgmTrack, string> = {
  entrance: '/assets/audio/bgm-entrance.mp3',
  home: '/assets/audio/bgm-home.mp3',
  game: '/assets/audio/bgm-game.mp3',
}

const SFX_PATHS: Record<SfxTrack, string> = {
  'button-click': '/assets/audio/sfx-button-click.mp3',
  'correct': '/assets/audio/sfx-correct.mp3',
  'wrong': '/assets/audio/sfx-wrong.mp3',
  'furniture-unlock': '/assets/audio/sfx-furniture-unlock.mp3',
}

const BGM_LOOP: Record<BgmTrack, boolean> = {
  entrance: false,
  home: true,
  game: true,
}

const FADE_MS = 400

const SFX_VOLUME: Record<SfxTrack, number> = {
  'button-click': 1.0,
  'correct': 1.0,
  'wrong': 1.0,
  'furniture-unlock': 1.0,
}

const BGM_VOLUME: Record<BgmTrack, number> = {
  entrance: 0.4,
  home: 0.35,
  game: 0.2,
}

class AudioManager {
  private bgmElements: Map<BgmTrack, HTMLAudioElement> = new Map()
  private currentBgm: BgmTrack | null = null
  private musicEnabled = true
  private soundEnabled = true
  private unlocked = false
  private pendingBgm: BgmTrack | null = null
  private fadeTimers: Map<string, number> = new Map()

  preload() {
    for (const [track, path] of Object.entries(BGM_PATHS)) {
      const el = new Audio()
      el.preload = 'auto'
      el.src = path
      el.loop = BGM_LOOP[track as BgmTrack]
      el.volume = 0
      this.bgmElements.set(track as BgmTrack, el)
    }
  }

  /**
   * Must be called from a user gesture handler (click/touch) to unlock
   * audio playback on iOS/Android.
   */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true

    const pendingTrack = this.pendingBgm
    this.pendingBgm = null

    for (const [track, el] of this.bgmElements.entries()) {
      if (track === pendingTrack) continue
      el.volume = 0
      el.play().then(() => {
        el.pause()
        el.currentTime = 0
      }).catch(() => { /* ignore */ })
    }

    if (pendingTrack) {
      this.playBgm(pendingTrack)
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled
    if (!enabled) {
      this.fadeOut(this.currentBgm)
    } else if (this.currentBgm) {
      const el = this.bgmElements.get(this.currentBgm)
      if (el) {
        el.play().catch(() => { /* ignore */ })
        this.fadeIn(this.currentBgm)
      }
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled
  }

  getMusicEnabled() {
    return this.musicEnabled
  }

  getSoundEnabled() {
    return this.soundEnabled
  }

  getCurrentBgm() {
    return this.currentBgm
  }

  playBgm(track: BgmTrack) {
    if (!this.unlocked) {
      this.pendingBgm = track
      this.currentBgm = track
      return
    }

    if (this.currentBgm === track) {
      const el = this.bgmElements.get(track)
      if (el && el.paused && this.musicEnabled) {
        el.play().catch(() => { /* ignore */ })
        this.fadeIn(track)
      }
      return
    }

    const prevTrack = this.currentBgm
    this.currentBgm = track

    const startNew = () => {
      const el = this.bgmElements.get(track)
      if (!el) return
      if (this.currentBgm !== track) return

      if (!BGM_LOOP[track]) {
        el.currentTime = 0
      }

      if (this.musicEnabled) {
        el.play().catch(() => { /* ignore */ })
        this.fadeIn(track)
      }
    }

    if (prevTrack) {
      this.fadeOut(prevTrack, () => {
        const prevEl = this.bgmElements.get(prevTrack)
        if (prevEl) {
          prevEl.pause()
          if (!BGM_LOOP[prevTrack]) {
            prevEl.currentTime = 0
          }
        }
        startNew()
      })
    } else {
      startNew()
    }
  }

  stopBgm() {
    if (!this.currentBgm) return
    const track = this.currentBgm
    this.fadeOut(track, () => {
      const el = this.bgmElements.get(track)
      if (el) {
        el.pause()
        el.currentTime = 0
      }
    })
    this.currentBgm = null
  }

  playSfx(track: SfxTrack) {
    if (!this.soundEnabled) return

    const el = new Audio(SFX_PATHS[track])
    el.volume = SFX_VOLUME[track]
    el.play().catch(() => { /* ignore */ })
    el.addEventListener('ended', () => {
      el.remove()
    })
  }

  /**
   * Called when the entrance BGM finishes (one-shot).
   * Provides a callback so the consumer can transition to the next BGM.
   */
  onEntranceBgmEnd(callback: () => void) {
    const el = this.bgmElements.get('entrance')
    if (!el) return

    const handler = () => {
      el.removeEventListener('ended', handler)
      callback()
    }
    el.addEventListener('ended', handler)
  }

  // ── Fade helpers ──────────────────────────────────────────────────────

  private fadeIn(track: BgmTrack, durationMs = FADE_MS) {
    this.clearFadeTimer(track)
    const el = this.bgmElements.get(track)
    if (!el) return

    const target = BGM_VOLUME[track]
    const steps = 20
    const stepMs = durationMs / steps
    const increment = target / steps
    el.volume = 0
    let step = 0

    const id = window.setInterval(() => {
      step++
      el.volume = Math.min(increment * step, target)
      if (step >= steps) {
        window.clearInterval(id)
        this.fadeTimers.delete(track)
      }
    }, stepMs)
    this.fadeTimers.set(track, id)
  }

  private fadeOut(track: BgmTrack | null, onComplete?: () => void, durationMs = FADE_MS) {
    if (!track) {
      onComplete?.()
      return
    }
    this.clearFadeTimer(track)
    const el = this.bgmElements.get(track)
    if (!el) {
      onComplete?.()
      return
    }

    const startVol = el.volume
    if (startVol <= 0) {
      onComplete?.()
      return
    }
    const steps = 20
    const stepMs = durationMs / steps
    const decrement = startVol / steps
    let step = 0

    const id = window.setInterval(() => {
      step++
      el.volume = Math.max(startVol - decrement * step, 0)
      if (step >= steps) {
        window.clearInterval(id)
        this.fadeTimers.delete(track)
        onComplete?.()
      }
    }, stepMs)
    this.fadeTimers.set(track, id)
  }

  private clearFadeTimer(track: BgmTrack | string) {
    const id = this.fadeTimers.get(track)
    if (id != null) {
      window.clearInterval(id)
      this.fadeTimers.delete(track)
    }
  }
}

export const audioManager = new AudioManager()
