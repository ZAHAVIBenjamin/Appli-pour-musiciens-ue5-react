import { useState } from 'react'
import { CHORDS } from '../../data/chords'
import { notesOfFrets } from '../../utils/notes'
import ChordDiagram from './ChordDiagram'

// Dictionnaire d'accords : un bouton par accord, le diagramme et les notes de l'accord choisi.

export default function FaceChordDictionary() {
  const [selected, setSelected] = useState(CHORDS[0]) // accord affiché (le Do au départ)

  // Notes de l'accord, sans doublons : un Set ne garde chaque note qu'une fois,
  // et [...set] le retransforme en tableau pour pouvoir faire join
  const playedNotes = notesOfFrets(selected.frets).filter((note) => note !== null)
  const uniqueNotes = [...new Set(playedNotes)]

  return (
    <div className="chords">
      <h2>Accords</h2>

      <div className="chord-list">
        {CHORDS.map((chord) => (
          <button key={chord.name} onClick={() => setSelected(chord)} disabled={chord === selected}>
            {chord.name}
          </button>
        ))}
      </div>

      <ChordDiagram chord={selected} />
      <p>Notes : {uniqueNotes.join(' ')}</p>
    </div>
  )
}
