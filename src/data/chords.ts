// Dictionnaire d'accords de guitare, en accordage standard (Mi La Ré Sol Si Mi).
// Ordre des cordes partout dans ce fichier : de la plus GRAVE (Mi grave) à la plus AIGUË (Mi aigu),
// comme sur un diagramme d'accord (et à l'inverse de Songsterr).

// Ce qu'on fait sur une corde : numéro de case (0 = à vide), ou null = corde non jouée (×)
export type Fret = number | null

// Doigt de la main gauche : 1 index, 2 majeur, 3 annulaire, 4 auriculaire,
// 'P' pouce (passé par-dessus le manche pour appuyer le Mi grave) ; null = aucun doigt
export type Finger = 1 | 2 | 3 | 4 | 'P' | null

export interface Chord {
  name: string // ex. 'Do', 'Lam'
  frets: Fret[] // une valeur par corde
  fingers: Finger[] // le doigt posé sur chaque corde
}

// Un barré n'a pas de champ à part : c'est le même doigt sur plusieurs cordes à la même case
export const CHORDS: Chord[] = [
  // Accords majeurs
  { name: 'Do', frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: 'Ré', frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: 'Mi', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: 'Fa', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  { name: 'Sol', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: 'La', frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Si', frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1] },

  // Accords mineurs (« m »)
  { name: 'Dom', frets: [null, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1] },
  { name: 'Rém', frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  { name: 'Mim', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: 'Fam', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'Solm', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'Lam', frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: 'Sim', frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1] },
]
