import { useEffect, useState } from 'react'
import { getAudioContext, playClick } from '../../services/audioEngine'
import {
  BAR_CHOICES,
  MAX_BPM,
  MIN_BPM,
  loadDefaultBeatsPerBar,
  loadDefaultBpm,
} from '../../utils/metronomeSettings'

// Métronome : BPM et signature rythmique

const CHECK_EVERY_MS = 25
const SCHEDULE_AHEAD_S = 0.1

export default function FaceMetronome() {
  // true quand le métronome tourne
  const [isPlaying, setIsPlaying] = useState(false)
  // tempo choisi par l'utilisateur, en battements par minute
  const [bpm, setBpm] = useState(loadDefaultBpm)
  const [beatsPerBar, setBeatsPerBar] = useState(loadDefaultBeatsPerBar)

  // Tant que le métronome tourne, on joue un clic à chaque battement.
  // Relancé aussi quand le tempo change, pour prendre la nouvelle vitesse.
  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const ctx = getAudioContext()
    const beatDuration = 60 / bpm
    let nextBeatTime = ctx.currentTime + 0.05
    let beatIndex = 0

    const timerId = setInterval(() => {
      while (nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
        playClick(beatIndex % beatsPerBar === 0, nextBeatTime)
        nextBeatTime += beatDuration
        beatIndex++
      }
    }, CHECK_EVERY_MS)

    // Nettoyage : appelé à l'arrêt, au changement de tempo, ou quand le composant disparaît
    return () => clearInterval(timerId)
  }, [isPlaying, bpm, beatsPerBar])

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
      <select
        value={beatsPerBar}
        onChange={(event) => setBeatsPerBar(Number(event.target.value))}
      >
        {BAR_CHOICES.map((beats) => (
          <option key={beats} value={beats}>
            {beats}/4
          </option>
        ))}
      </select>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Arrêter' : 'Démarrer'}
      </button>
    </div>
  )
}
