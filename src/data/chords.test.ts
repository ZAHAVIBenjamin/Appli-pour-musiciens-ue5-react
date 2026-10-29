import { describe, expect, it } from 'vitest'
import { CHORDS } from './chords'
import { NOTE_NAMES, midiToName, notesOfFrets } from '../utils/notes'

// Tests du dictionnaire d'accords : une faute de frappe dans les données ferait échouer un test.
// Lancer avec : npm test

// --- Partie musicale (fournie) : les notes qu'un accord DOIT contenir, d'après son nom ---
const MAJOR = [0, 4, 7] // écarts en demi-tons : fondamentale, tierce majeure, quinte
const MINOR = [0, 3, 7] // fondamentale, tierce mineure, quinte

// 'Lam' → mineur de La → ['La', 'Do', 'Mi']
function expectedNotes(chordName: string): string[] {
  const isMinor = chordName.endsWith('m')
  const root = isMinor ? chordName.slice(0, -1) : chordName
  const rootIndex = NOTE_NAMES.indexOf(root)
  return (isMinor ? MINOR : MAJOR).map((interval) => midiToName(rootIndex + interval))
}

// --- Les tests ---
describe("dictionnaire d'accords", () => {
  for (const chord of CHORDS) {
    it(`${chord.name} : une valeur par corde`, () => {
      expect(chord.frets).toHaveLength(6)
      expect(chord.fingers).toHaveLength(6)
    })

    it(`${chord.name} : un doigt sur chaque case appuyée, aucun sinon`, () => {
      chord.frets.forEach((fret, string) => {
        const pressed = fret !== null && fret > 0
        expect(chord.fingers[string] !== null).toBe(pressed)
      })
    })

    it(`${chord.name} : ne joue que les notes de l'accord`, () => {
      const played = notesOfFrets(chord.frets).filter((note) => note !== null)
      // Set = ensemble sans doublons ni ordre : { Do, Mi, Sol } même si Do et Mi sont joués 2 fois
      expect(new Set(played)).toEqual(new Set(expectedNotes(chord.name)))
    })
  }
})
