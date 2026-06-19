class AudioManager {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.enabled = true
    this.bgmTimer = null
    this._init()
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.22
      this.masterGain.connect(this.ctx.destination)
    } catch {
      this.enabled = false
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  _tone({ type = 'square', freq = 440, endFreq, duration = 0.15, volume = 0.3, delay = 0, filterType, filterFreq }) {
    if (!this.enabled || !this.ctx) return
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    if (filterType) {
      const f = this.ctx.createBiquadFilter()
      f.type = filterType
      f.frequency.value = filterFreq || 500
      osc.connect(f)
      f.connect(gain)
    } else {
      osc.connect(gain)
    }

    gain.connect(this.masterGain)
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)

    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration + 0.01)
  }

  playHit(power = 1) {
    this._tone({ type: 'square', freq: 160 * power, endFreq: 55, duration: 0.12, volume: 0.45 })
    this._tone({ type: 'sine', freq: 80 * power, duration: 0.08, volume: 0.2 })
  }

  playJump() {
    this._tone({ type: 'sine', freq: 260, endFreq: 520, duration: 0.18, volume: 0.18 })
  }

  playAttack() {
    this._tone({ type: 'sawtooth', freq: 700, endFreq: 220, duration: 0.09, volume: 0.32, filterType: 'highpass', filterFreq: 350 })
  }

  playSkill() {
    for (let i = 0; i < 4; i++) {
      this._tone({ type: 'sine', freq: 300 + i * 220, endFreq: 650 + i * 220, duration: 0.28, volume: 0.25, delay: i * 0.055 })
    }
    this._tone({ type: 'square', freq: 1200, endFreq: 400, duration: 0.12, volume: 0.15, delay: 0.1, filterType: 'bandpass', filterFreq: 800 })
  }

  playBlocked() {
    this._tone({ type: 'square', freq: 140, endFreq: 80, duration: 0.18, volume: 0.18 })
  }

  playDeath() {
    const notes = [550, 440, 330, 260, 190, 130, 90, 60]
    notes.forEach((f, i) => {
      this._tone({ type: 'square', freq: f, duration: 0.14, volume: 0.28, delay: i * 0.09 })
    })
  }

  playCountdown() {
    this._tone({ type: 'sine', freq: 880, endFreq: 880, duration: 0.12, volume: 0.3 })
  }

  playFight() {
    [660, 880, 1100].forEach((f, i) => {
      this._tone({ type: 'square', freq: f, duration: 0.15, volume: 0.3, delay: i * 0.07 })
    })
  }

  startBGM() {
    if (!this.enabled || !this.ctx) return
    this.stopBGM()

    const tempo = 0.2
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25]
    const melody = [0, 2, 4, 2, 5, 4, 2, 0, 1, 3, 5, 3, 4, 2, 0, 4]
    const bass   = [0, 0, 3, 3, 5, 5, 3, 3, 1, 1, 3, 3, 4, 4, 0, 0]

    const playMeasure = () => {
      if (!this.enabled || !this.ctx) return
      const now = this.ctx.currentTime

      melody.forEach((n, i) => {
        const t = now + i * tempo
        this._tone({ type: 'square', freq: scale[n] * 2, endFreq: scale[n] * 2, duration: tempo * 0.65, volume: 0.055, delay: i * tempo })
        this._tone({ type: 'sine',   freq: scale[bass[i]], duration: tempo * 0.85, volume: 0.07, delay: i * tempo })
      })

      this.bgmTimer = setTimeout(playMeasure, melody.length * tempo * 1000 - 60)
    }

    playMeasure()
  }

  stopBGM() {
    clearTimeout(this.bgmTimer)
    this.bgmTimer = null
  }

  toggle() {
    this.enabled = !this.enabled
    if (!this.enabled) this.stopBGM()
    else this.startBGM()
    return this.enabled
  }
}

export const audioManager = new AudioManager()
