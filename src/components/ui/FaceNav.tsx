import { useAppStore, type FaceId } from '../../store/useAppStore'

// Barre de navigation : un bouton par face du cube.
// Elle lit la face active dans le store et la change au clic.

// Texte affiché sur chaque bouton
const FACES: { id: FaceId; label: string }[] = [
  { id: 'tuner', label: 'Accordeur' },
  { id: 'tabs', label: 'Tablatures' },
  { id: 'metronome', label: 'Métronome' },
  { id: 'chords', label: 'Accords' },
  { id: 'notebook', label: 'Carnet' },
  { id: 'settings', label: 'Réglages' },
]

export default function FaceNav() {
  const activeFace = useAppStore((state) => state.activeFace)
  const setActiveFace = useAppStore((state) => state.setActiveFace)

  return (
    <nav className="face-nav">
      {FACES.map((face) => (
        <button
          key={face.id}
          onClick={() => setActiveFace(face.id)}
          disabled={face.id === activeFace}
        >
          {face.label}
        </button>
      ))}
    </nav>
  )
}
