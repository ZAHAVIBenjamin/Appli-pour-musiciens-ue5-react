import type { ComponentType } from 'react'
import FaceTuner from '../components/tools/FaceTuner'
import FaceTabs from '../components/tools/FaceTabs'
import FaceMetronome from '../components/tools/FaceMetronome'
import FaceChordDictionary from '../components/tools/FaceChordDictionary'
import FacePracticeNotebook from '../components/tools/FacePracticeNotebook'
import FaceSettings from '../components/tools/FaceSettings'

// Les 6 faces du cube : une face = un outil = une adresse (route).
// C'est la SEULE liste des faces : la barre de navigation (FaceNav) et les routes (App)
// la lisent toutes les deux. Ajouter une face = ajouter une ligne ici.

export type FaceId = 'tuner' | 'tabs' | 'metronome' | 'chords' | 'notebook' | 'settings'

export interface Face {
  id: FaceId
  label: string // texte du bouton
  path: string // adresse de la face, ex. '/accordeur'
  Tool: ComponentType // le composant de l'outil (majuscule : c'est un composant)
}

export const FACES: Face[] = [
  { id: 'tuner', label: 'Accordeur', path: '/accordeur', Tool: FaceTuner },
  { id: 'tabs', label: 'Tablatures', path: '/tablatures', Tool: FaceTabs },
  { id: 'metronome', label: 'Métronome', path: '/metronome', Tool: FaceMetronome },
  { id: 'chords', label: 'Accords', path: '/accords', Tool: FaceChordDictionary },
  { id: 'notebook', label: 'Carnet', path: '/carnet', Tool: FacePracticeNotebook },
  { id: 'settings', label: 'Réglages', path: '/reglages', Tool: FaceSettings },
]
