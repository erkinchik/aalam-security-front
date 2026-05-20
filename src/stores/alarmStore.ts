import { create } from 'zustand'

let audioCtx: AudioContext | null = null
let intervalId: number | null = null

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  audioCtx = new AC()
  return audioCtx
}

function playBeep(frequency: number, duration: number) {
  const ctx = getCtx()
  if (!ctx || ctx.state !== 'running') return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = frequency
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
  gain.gain.linearRampToValueAtTime(0, t + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

interface AlarmState {
  isRinging: boolean
  pendingCount: number
  isAudioUnlocked: boolean
  trigger: () => void
  dismiss: () => void
  unlock: () => Promise<void>
  testBeep: () => Promise<void>
}

function syncUnlockedState(set: (partial: Partial<AlarmState>) => void) {
  const ctx = getCtx()
  set({ isAudioUnlocked: ctx?.state === 'running' })
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  isRinging: false,
  pendingCount: 0,
  isAudioUnlocked: false,

  trigger: () => {
    set({ pendingCount: get().pendingCount + 1 })
    if (get().isRinging) return

    const ctx = getCtx()
    if (ctx?.state === 'suspended') {
      ctx.resume().then(() => syncUnlockedState(set)).catch(() => {})
    }

    set({ isRinging: true })

    let high = true
    const tick = () => {
      playBeep(high ? 880 : 660, 0.35)
      high = !high
    }
    tick()
    intervalId = window.setInterval(tick, 400)
  },

  dismiss: () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    set({ isRinging: false, pendingCount: 0 })
  },

  unlock: async () => {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore — browser will block until next user gesture */
      }
    }
    syncUnlockedState(set)
  },

  testBeep: async () => {
    await get().unlock()
    playBeep(880, 0.18)
    window.setTimeout(() => playBeep(660, 0.18), 220)
  },
}))
