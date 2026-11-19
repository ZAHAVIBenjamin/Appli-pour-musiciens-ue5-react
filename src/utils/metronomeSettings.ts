export const MIN_BPM = 40
export const MAX_BPM = 220
export const BAR_CHOICES = [2, 3, 4]

const BPM_KEY = 'reglages-tempo'
const BEATS_KEY = 'reglages-signature'

export function loadDefaultBpm(): number {
  const saved = localStorage.getItem(BPM_KEY)
  return saved === null ? 120 : Number(saved)
}

export function saveDefaultBpm(bpm: number) {
  localStorage.setItem(BPM_KEY, String(bpm))
}

export function loadDefaultBeatsPerBar(): number {
  const saved = localStorage.getItem(BEATS_KEY)
  return saved === null ? 4 : Number(saved)
}

export function saveDefaultBeatsPerBar(beats: number) {
  localStorage.setItem(BEATS_KEY, String(beats))
}
