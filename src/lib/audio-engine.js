const DEFAULT_VOLUME = 0.3

let ctx = null
let gain = null
let analyser = null
let oscillator = null
let lfo = null
let audio = null
let mediaSource = null

let state = {
  isPlaying: false,
  volume: DEFAULT_VOLUME,
  cassetteId: null,
  trackIndex: null,
  trackName: '',
}

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener(state))
}

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    gain = ctx.createGain()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    gain.gain.value = state.volume
    gain.connect(analyser)
    analyser.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
}

function stopSource() {
  if (oscillator) {
    try { oscillator.stop() } catch { /* already stopped */ }
    oscillator.disconnect()
    oscillator = null
  }
  if (lfo) {
    try { lfo.stop() } catch { /* already stopped */ }
    lfo.disconnect()
    lfo = null
  }
  if (audio) {
    audio.pause()
    audio.currentTime = 0
    audio = null
  }
  if (mediaSource) {
    mediaSource.disconnect()
    mediaSource = null
  }
}

function play(track, meta = {}) {
  ensureContext()
  stopSource()

  if (track.url) {
    const element = new Audio(track.url)
    element.crossOrigin = 'anonymous'
    mediaSource = ctx.createMediaElementSource(element)
    mediaSource.connect(gain)
    element.addEventListener('ended', () => {
      if (audio === element) stop()
    })
    element.play().catch(() => {})
    audio = element
  } else {
    oscillator = ctx.createOscillator()
    oscillator.type = track.type || 'sine'
    oscillator.frequency.value = track.freq || 440

    lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 5
    lfoGain.gain.value = 2
    lfo.connect(lfoGain)
    lfoGain.connect(oscillator.frequency)
    lfo.start()

    oscillator.connect(gain)
    oscillator.start()
  }

  state = {
    ...state,
    isPlaying: true,
    cassetteId: meta.cassetteId ?? state.cassetteId,
    trackIndex: meta.trackIndex ?? state.trackIndex,
    trackName: track.name || '',
  }
  notify()
}

function stop() {
  stopSource()
  state = { ...state, isPlaying: false }
  notify()
}

function setVolume(value) {
  state = { ...state, volume: value }
  if (gain) gain.gain.value = value
  notify()
}

function getState() {
  return state
}

function getAnalyser() {
  return analyser
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const audioEngine = {
  play,
  stop,
  setVolume,
  getState,
  getAnalyser,
  subscribe,
}
