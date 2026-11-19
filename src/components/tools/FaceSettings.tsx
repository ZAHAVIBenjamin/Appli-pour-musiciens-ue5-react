import { useEffect, useState } from 'react'
import { useSettings, type CubeMaterial } from '../../context/SettingsContext'
import {
  BAR_CHOICES,
  MAX_BPM,
  MIN_BPM,
  loadDefaultBeatsPerBar,
  loadDefaultBpm,
  saveDefaultBeatsPerBar,
  saveDefaultBpm,
} from '../../utils/metronomeSettings'

// Réglages : thème, sensibilité accordeur, instrument, audio
export default function FaceSettings() {
  const [defaultBpm, setDefaultBpm] = useState(loadDefaultBpm)
  const [defaultBeats, setDefaultBeats] = useState(loadDefaultBeatsPerBar)
  const { settings, dispatch } = useSettings()

  useEffect(() => {
    saveDefaultBpm(defaultBpm)
  }, [defaultBpm])

  useEffect(() => {
    saveDefaultBeatsPerBar(defaultBeats)
  }, [defaultBeats])

  return (
    <div>
      <h2>Réglages</h2>

      <h3>Métronome</h3>
      <p>Tempo par défaut : {defaultBpm} BPM</p>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={defaultBpm}
        onChange={(event) => setDefaultBpm(Number(event.target.value))}
      />
      <p>Signature par défaut</p>
      <select
        value={defaultBeats}
        onChange={(event) => setDefaultBeats(Number(event.target.value))}
      >
        {BAR_CHOICES.map((beats) => (
          <option key={beats} value={beats}>
            {beats}/4
          </option>
        ))}
      </select>

      <h3>Cube</h3>
      <p>Matière : {settings.cubeMaterial}</p>
      <select
        value={settings.cubeMaterial}
        onChange={(event) =>
          dispatch({ type: 'setCubeMaterial', material: event.target.value as CubeMaterial })
        }
      >
        <option value="plastique">Plastique</option>
        <option value="bois">Bois</option>
        <option value="metal">Métal</option>
      </select>
    </div>
  )
}
