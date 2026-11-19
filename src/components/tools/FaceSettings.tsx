import { useSettings, type CubeMaterial } from '../../context/SettingsContext'
import type { Instrument } from '../../services/tablatureApi'

// Réglages partagés entre les faces (Context + useReducer, EI-02) : matière du cube, instrument.
// Le tempo et la mesure se règlent directement sur la face Métronome (pas de doublon ici).
export default function FaceSettings() {
  const { settings, dispatch } = useSettings()

  return (
    <div>
      <h2>Réglages</h2>

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

      <h3>Instrument</h3>
      <p>Utilisé par l'accordeur, les tablatures et les accords</p>
      <select
        value={settings.instrument}
        onChange={(event) =>
          dispatch({ type: 'setInstrument', instrument: event.target.value as Instrument })
        }
      >
        <option value="guitar">Guitare</option>
        <option value="bass">Basse</option>
        <option value="ukulele">Ukulélé</option>
      </select>
    </div>
  )
}
