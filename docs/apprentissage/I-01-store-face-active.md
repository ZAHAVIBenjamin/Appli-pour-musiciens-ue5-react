# I-01 — Le store Zustand : la face active du cube

- **Date** : 26/10/2026
- **Auteur** : I
- **Fichiers touchés** : `src/store/useAppStore.ts`

## Ce qu'on a fait et pourquoi

Plusieurs parties de l'appli doivent savoir quelle face du cube est affichée : le cube 3D pour la
montrer, les boutons de navigation pour la changer. Plutôt que de faire passer cette information
de composant en composant (*prop drilling*), on la range dans un **store** global avec Zustand :
n'importe quel composant peut la lire ou la modifier directement. Première étape : le store ne
contient qu'une donnée, `activeFace`, et la fonction qui la modifie.

Pourquoi Zustand plutôt que le Context de React : c'est le choix du projet, il demande moins de
code, et un composant ne se redessine que si la donnée qu'il lit change.

## Le code expliqué

### src/store/useAppStore.ts — la mémoire commune de l'appli

```ts
import { create } from 'zustand'
```

`create` est la fonction de Zustand qui fabrique un store.

```ts
export type FaceId = 'tuner' | 'tabs' | 'metronome' | 'chords' | 'notebook' | 'settings'
```

- `type` crée un nouveau type, comme `number` ou `string`.
- `|` veut dire « ou » : une `FaceId` ne peut valoir **que** l'un de ces 6 mots (*type union*).
- Une faute de frappe (`'metronom'`) est refusée par TypeScript.
- `export` : `Cube.tsx` et les autres fichiers pourront réutiliser ce type.

```ts
export interface AppState {
  activeFace: FaceId
  setActiveFace: (face: FaceId) => void
}
```

- Une `interface` décrit la **forme** d'un objet.
- `activeFace` = la donnée (la face affichée).
- `setActiveFace` = la fonction qui la modifie : elle reçoit une `FaceId` et ne renvoie rien
  (`void`).
- Un store = **les données + les fonctions qui les modifient**, au même endroit.

```ts
export const useAppStore = create<AppState>((set) => ({
  activeFace: 'tuner',
  setActiveFace: (face) => set({ activeFace: face }),
}))
```

- `create<AppState>(...)` : on donne la forme du store entre `< >`, TypeScript vérifie qu'on la
  respecte.
- `(set) => ({ ... })` : Zustand appelle cette fonction une fois, à la création, et fournit `set`,
  l'outil qui modifie l'état.
- `({ ... })` : les parenthèses sont obligatoires. Sans elles, JavaScript prend les `{ }` pour le
  corps de la fonction, qui ne renverrait rien.
- `activeFace: 'tuner'` : valeur au démarrage, l'accordeur s'affiche en premier.
- `set({ activeFace: face })` remplace la valeur ; Zustand prévient les composants qui lisent
  `activeFace`, React les redessine.
- Le nom commence par `use` : `useAppStore` est un **hook**, appelé dans un composant.

### Utilisation dans un composant (prochaines étapes)

```tsx
const activeFace = useAppStore((state) => state.activeFace)
const setActiveFace = useAppStore((state) => state.setActiveFace)

<button onClick={() => setActiveFace('metronome')}>Métronome</button>
```

`(state) => state.activeFace` est un **sélecteur** : il choisit quel morceau du store ce composant
lit. Le composant ne se redessine que si **ce morceau-là** change.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Store | Mémoire commune où tous les composants lisent et écrivent |
| État (*state*) | Donnée qui change pendant que l'appli tourne et redessine l'écran quand elle change |
| Type union (`\|`) | Type qui n'accepte qu'une valeur parmi une liste |
| Interface | Description de la forme d'un objet |
| `void` | « Ne renvoie rien » |
| Hook | Fonction React dont le nom commence par `use`, appelée dans un composant |
| Sélecteur | Fonction qui choisit quel morceau du store lire |
| Prop drilling | Faire passer une donnée de parent en enfant sur plusieurs niveaux |

## Quiz

1. Un collègue écrit `setActiveFace('metronom')` (faute de frappe). Que se passe-t-il, et à quel
   moment ?
2. Pourquoi des parenthèses autour des accolades dans `(set) => ({ ... })` ? Que se passerait-il
   sans elles ?
3. Au lancement de l'appli, quelle face est active, et quelle ligne en décide ?
4. Le bouton « Métronome » appelle `setActiveFace('metronome')`. Que se passe-t-il ensuite,
   jusqu'à l'écran ?
5. Pourquoi mettre `activeFace` dans un store plutôt que dans un `useState` du composant `Cube` ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. TypeScript refuse : `'metronom'` ne fait pas partie du type `FaceId`. L'erreur apparaît dans
   l'éditeur, à `npm run typecheck` et à `npm run build`. **Mais `npm run dev` ne vérifie pas les
   types** (fiche 00) : l'appli se lancerait quand même. D'où le `typecheck` avant chaque PR.
2. Sans parenthèses, JavaScript lit les `{ }` comme le corps de la fonction, pas comme un objet.
   La fonction renvoie `undefined`, le store serait vide, et TypeScript refuse car `AppState`
   exige `activeFace` et `setActiveFace`.
3. L'accordeur, grâce à `activeFace: 'tuner'` dans `create`.
4. `set` change `activeFace` dans le store → Zustand prévient les composants **dont le sélecteur
   lit `activeFace`** (pas tous) → React les redessine → le cube affiche la face métronome.
5. Un `useState` dans `Cube` resterait enfermé dans ce composant. Les boutons de navigation
   seront de l'UI HTML **hors du `<Canvas>`** : pour qu'ils modifient la face, il faudrait du
   prop drilling. Le store est accessible de partout.

</details>

## Points à retravailler (I)

Quiz fait dans la conversation, avant la rédaction de cette fiche : 5 réponses justes, avec ces
nuances à retenir.

- L'erreur de type est détectée par l'éditeur, `npm run typecheck` et `npm run build`, **pas** par
  `npm run dev` : l'appli se lancerait quand même.
- Après `set`, seuls les composants **dont le sélecteur lit** `activeFace` se redessinent, pas
  tous les composants.
- Argument concret contre le `useState` dans `Cube` : les boutons de navigation sont de l'UI HTML
  **hors du `<Canvas>`**, ils ne pourraient pas l'atteindre sans prop drilling.

## Questions possibles à l'oral

- **Pourquoi un store global ?** Plusieurs composants éloignés (cube 3D, boutons HTML) partagent
  la face active ; le store évite de faire passer la donnée de composant en composant.
- **Pourquoi Zustand et pas Context ?** Moins de code, et avec les sélecteurs un composant ne se
  redessine que si la donnée qu'il lit change.
- **À quoi sert le type `FaceId` ?** Limiter les valeurs possibles aux 6 faces : une faute de
  frappe est détectée par TypeScript avant le déploiement.
- **Pourquoi `setActiveFace` est-il dans le store ?** Les données et les fonctions qui les
  modifient restent au même endroit ; les composants n'ont pas à savoir comment le store est
  modifié.
