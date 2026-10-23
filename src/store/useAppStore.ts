import { create } from 'zustand'

// État global (Zustand)
// TODO : face active, état audio (métronome, fréquence accordeur),
//        préférences utilisateur, cache des tablatures
// Décrire chaque champ dans l'interface AppState, puis l'initialiser dans create()
export interface AppState {}

export const useAppStore = create<AppState>(() => ({}))
