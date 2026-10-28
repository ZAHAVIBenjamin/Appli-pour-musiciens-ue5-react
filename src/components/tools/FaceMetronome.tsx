import { useEffect, useState } from 'react'
import { playClick } from '../../services/audioEngine'

// Métronome : BPM et signature rythmique
// TODO (prochaines étapes) : réglage du BPM, rythme précis, premier temps accentué

const BPM = 120 // battements par minute (fixe pour l'instant)

export default function FaceMetronome() {
  // true quand le métronome tourne
  const [isPlaying, setIsPlaying] = useState(false)

  // Tant que le métronome tourne, on joue un clic à chaque battement
  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const beatDuration = 60000 / BPM // durée d'un battement, en millisecondes
    playClick() // premier clic tout de suite
    const timerId = setInterval(() => playClick(), beatDuration)

    // Nettoyage : appelé à l'arrêt, ou quand le composant disparaît de l'écran
    return () => clearInterval(timerId)
  }, [isPlaying])

  return (
    <div>
      <h2>Métronome</h2>
      <p>{BPM} BPM</p>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Arrêter' : 'Démarrer'}
      </button>
    </div>
  )
}
