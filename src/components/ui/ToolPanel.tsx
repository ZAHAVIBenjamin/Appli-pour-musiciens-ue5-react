import type { ComponentType } from 'react'
import { useAppStore, type FaceId } from '../../store/useAppStore'
import FaceTuner from '../tools/FaceTuner'
import FaceTabs from '../tools/FaceTabs'
import FaceMetronome from '../tools/FaceMetronome'
import FaceChordDictionary from '../tools/FaceChordDictionary'
import FacePracticeNotebook from '../tools/FacePracticeNotebook'
import FaceSettings from '../tools/FaceSettings'

// Panneau provisoire : affiche l'outil de la face active, par-dessus la scène 3D.
// Plus tard, chaque outil sera projeté sur sa face du cube (partie 3D, E + I).

// Pour chaque face, le composant à afficher
const TOOLS: Record<FaceId, ComponentType> = {
  tuner: FaceTuner,
  tabs: FaceTabs,
  metronome: FaceMetronome,
  chords: FaceChordDictionary,
  notebook: FacePracticeNotebook,
  settings: FaceSettings,
}

export default function ToolPanel() {
  const activeFace = useAppStore((state) => state.activeFace)
  const Tool = TOOLS[activeFace]

  return (
    <section className="tool-panel">
      <Tool />
    </section>
  )
}
