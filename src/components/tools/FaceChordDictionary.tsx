import { useState } from 'react'
import { CHORDS_BY_INSTRUMENT } from '../../data/chords'
import { useSettings } from '../../context/SettingsContext'
import { TUNINGS, notesOfFrets } from '../../utils/notes'
import ChordDiagram from './ChordDiagram'

// Dictionnaire d'accords de l'instrument choisi dans les Réglages : un bouton par accord,
// le diagramme et les notes de l'accord choisi.

export default function FaceChordDictionary() {
  const { settings } = useSettings()
  const chords = CHORDS_BY_INSTRUMENT[settings.instrument]
  const tuning = TUNINGS[settings.instrument]

  // On retient le NOM de l'accord : en changeant d'instrument, on garde le même accord
  const [selectedName, setSelectedName] = useState('Do')
  const selected = chords.find((chord) => chord.name === selectedName) ?? chords[0]

  // Notes de l'accord, sans doublons : un Set ne garde chaque note qu'une fois,
  // et [...set] le retransforme en tableau pour pouvoir faire join
  const playedNotes = notesOfFrets(selected.frets, tuning).filter((note) => note !== null)
  const uniqueNotes = [...new Set(playedNotes)]

  return (
    <div className="chords">
      <h2>Accords</h2>

      <div className="chord-list">
        {chords.map((chord) => (
          <button
            key={chord.name}
            onClick={() => setSelectedName(chord.name)}
            disabled={chord === selected}
          >
            {chord.name}
          </button>
        ))}
      </div>

      <ChordDiagram chord={selected} />
      <p>Notes : {uniqueNotes.join(' ')}</p>
    </div>
  )
}
