// Théorie musicale : passer d'une fréquence (Hz) à un nom de note.
// Notation française (Do, Ré, Mi…) + numéro d'octave (le La du diapason est le La4).

// Les 12 notes d'une octave, chacune un demi-ton au-dessus de la précédente
export const NOTE_NAMES = [
  'Do',
  'Do#',
  'Ré',
  'Ré#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
]

const A4_FREQUENCY = 440 // Hz : le La de référence (diapason)
const A4_MIDI = 69 // numéro MIDI du La4 (norme MIDI : chaque demi-ton = +1)

export interface Note {
  name: string // ex. 'La'
  octave: number // ex. 4
  cents: number // écart avec la note juste : de -50 (trop bas) à +50 (trop haut)
  frequency: number // fréquence juste de cette note, en Hz
}

// Nom de la note d'un numéro MIDI, sans l'octave (ex. 40 → 'Mi')
export function midiToName(midi: number): string {
  return NOTE_NAMES[midi % 12]
}

// Accordage standard de la guitare en numéros MIDI, de la corde grave à la corde aiguë
// (Mi2 La2 Ré3 Sol3 Si3 Mi4)
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]

// Note jouée par chaque corde d'une position d'accord (null si la corde n'est pas jouée).
// Chaque case ajoute un demi-ton, donc +1 au numéro MIDI de la corde à vide.
export function notesOfFrets(
  frets: (number | null)[],
  tuning: number[] = STANDARD_TUNING,
): (string | null)[] {
  return frets.map((fret, string) => (fret === null ? null : midiToName(tuning[string] + fret)))
}

// Trouve la note la plus proche d'une fréquence, et de combien on en est éloigné
export function frequencyToNote(frequency: number): Note {
  // 1. Nombre de demi-tons entre le La4 et cette fréquence (décimal : 2,3 = « entre deux notes »)
  const semitones = 12 * Math.log2(frequency / A4_FREQUENCY)

  // 2. Numéro MIDI exact, puis celui de la note la plus proche (arrondi)
  const exactMidi = A4_MIDI + semitones
  const midi = Math.round(exactMidi)

  // 3. Ce qui reste après l'arrondi = l'écart, converti en cents (1 demi-ton = 100 cents)
  const cents = Math.round((exactMidi - midi) * 100)

  return {
    name: midiToName(midi),
    octave: Math.floor(midi / 12) - 1,
    cents,
    frequency: A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12),
  }
}
