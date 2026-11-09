import { useEffect, useState } from 'react'
import { playClick } from '../../services/audioEngine'

// Métronome : BPM et signature rythmique
// TODO (prochaines étapes) : rythme précis, premier temps accentué

// Limites du curseur de tempo
const MIN_BPM = 40
const MAX_BPM = 220

export default function FaceMetronome() {
  // true quand le métronome tourne
  const [isPlaying, setIsPlaying] = useState(false)
  // tempo choisi par l'utilisateur, en battements par minute
  const [bpm, setBpm] = useState(120)

  // Tant que le métronome tourne, on joue un clic à chaque battement.
  // Relancé aussi quand le tempo change, pour prendre la nouvelle vitesse.
  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const beatDuration = 60000 / bpm // durée d'un battement, en millisecondes
    playClick() // premier clic tout de suite
    const timerId = setInterval(() => playClick(), beatDuration)

    // Nettoyage : appelé à l'arrêt, au changement de tempo, ou quand le composant disparaît
    return () => clearInterval(timerId)
  }, [isPlaying, bpm])

  return (
    <div>
      <h2>Métronome</h2>
      <p>{bpm} BPM</p>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
      />
      <br />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Arrêter' : 'Démarrer'}
      </button>
    </div>
  )
}
