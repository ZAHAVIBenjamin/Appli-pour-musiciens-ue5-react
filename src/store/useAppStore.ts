import { create } from 'zustand'

// État global (Zustand) : les données partagées entre plusieurs parties de l'appli.
// TODO (prochaines étapes) : état du métronome, préférences utilisateur,
//        fréquence accordeur et cache des tablatures (parties de E)

// Les 6 faces du cube : une face = un outil (voir components/tools)
export type FaceId = 'tuner' | 'tabs' | 'metronome' | 'chords' | 'notebook' | 'settings'

// Forme du store : les données + les fonctions qui les modifient
export interface AppState {
  activeFace: FaceId
  setActiveFace: (face: FaceId) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeFace: 'tuner',
  setActiveFace: (face) => set({ activeFace: face }),
}))
