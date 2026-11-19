# EI-02 — Contexte de réglages partagés (useContext + useReducer)

- **Date** : 19/11/2026
- **Auteur** : I (partie commune E + I : touche `Layout.tsx`, servira aux réglages de E)
- **Fichiers touchés** : `src/context/SettingsContext.tsx` (nouveau), `src/components/ui/Layout.tsx`,
  `src/components/tools/FaceSettings.tsx`

## Ce qu'on a fait et pourquoi

La **mémoire de réglages partagée** de l'appli, avec un premier réglage : **la matière du cube**
(plastique, bois, métal). Sur `/reglages`, une rubrique « Cube » permet de la choisir ; le choix
s'affiche en texte et survit au rechargement. Le cube ne change pas encore (EI-03).

Pourquoi un **context** (chapitre 10) : le cube (`Layout` → `Canvas` → `Scene` → `Cube`) devra lire
un réglage changé par la page Réglages (`Layout` → `ToolPanel` → `<Outlet />` → `FaceSettings`). On
ne peut pas passer de props à travers `<Outlet />`. Un context est une valeur posée en haut de
l'arbre, lisible par tout composant en dessous (image : le wifi de la maison, au lieu de tirer un
câble à travers chaque mur).

Pourquoi un **reducer** : d'autres réglages vont s'ajouter (ceux de E : instrument, sensibilité…) ;
le reducer garde toutes les règles de modification au même endroit. C'est l'usage que le README
réserve à la face Réglages.

Les tempos par défaut (I-12) restent dans `localStorage` sans context : un seul composant les lit
(règle du chapitre 10).

## Le code expliqué

### src/context/SettingsContext.tsx — 4 morceaux

**Les types**

```tsx
export type CubeMaterial = 'plastique' | 'bois' | 'metal'

export type Settings = {
  cubeMaterial: CubeMaterial
}

type SettingsAction = { type: 'setCubeMaterial'; material: CubeMaterial }
```

- `CubeMaterial` : type union (comme `FaceId`).
- `Settings` : la forme de **tous** les réglages partagés (E pourra en ajouter).
- `SettingsAction` : une action = ce qu'on veut faire, avec un `type` (son nom) et ses données.

**Le reducer**

```tsx
function settingsReducer(settings: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'setCubeMaterial':
      return { ...settings, cubeMaterial: action.material }
  }
}
```

- (réglages actuels, action) → nouveaux réglages.
- `switch` choisit le cas selon `action.type` ; un `case` par action.
- `{ ...settings, cubeMaterial: … }` : on recopie tous les réglages et on remplace un seul champ →
  nouvel objet (immuabilité).
- **Pur** : il calcule et ne fait rien d'autre (pas de `localStorage`).

**La valeur de départ**

```tsx
const STORAGE_KEY = 'reglages-generaux'
const DEFAULT_SETTINGS: Settings = { cubeMaterial: 'plastique' }

function loadSettings(): Settings {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    return DEFAULT_SETTINGS
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
}
```

Comme `loadSessions` (I-10). La **fusion** `{ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }` pose
d'abord les valeurs par défaut, puis celles enregistrées : un réglage ajouté plus tard reçoit sa
valeur par défaut même dans un vieux casier (pas de `undefined`).

**Le Provider et le hook**

```tsx
const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, dispatch }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (value === null) {
    throw new Error('useSettings doit être utilisé à l’intérieur de <SettingsProvider>')
  }
  return value
}
```

- `createContext` : crée le context ; `null` = valeur lue hors du Provider.
- `useReducer(reducer, null, loadSettings)` : comme `useState` pour un reducer ; renvoie `settings`
  et `dispatch` (envoie une action). `loadSettings` = valeur de départ calculée une seule fois.
- L'effet de sauvegarde est dans le Provider, **pas** dans le reducer (le reducer reste pur).
- `children` : ce que le Provider entoure (composition, chapitre 10) ; `ReactNode` = n'importe quoi
  d'affichable.
- `useSettings()` : hook maison (règle du `CLAUDE.md`). Hors Provider → erreur claire immédiate
  plutôt qu'un bug plus loin ; et TypeScript sait ensuite que la valeur n'est jamais `null`.

### src/components/ui/Layout.tsx

`<SettingsProvider>` entoure tout : la scène 3D (futur cube) et le panneau (toutes les faces).
`Layout` ne se démonte jamais : les réglages survivent aux changements de face.

### src/components/tools/FaceSettings.tsx — rubrique « Cube »

```tsx
const { settings, dispatch } = useSettings()
...
<select
  value={settings.cubeMaterial}
  onChange={(event) =>
    dispatch({ type: 'setCubeMaterial', material: event.target.value as CubeMaterial })
  }
>
```

- Déstructuration : deux propriétés de l'objet en une ligne.
- `<select>` contrôlé (I-08), dont la valeur vient du context ; on **envoie une action** au lieu
  d'un `setX`.
- `as CubeMaterial` : `event.target.value` est un `string` ; on précise le type, sûr seulement
  parce que nous contrôlons les trois `<option>`.

### Le circuit d'un choix

« Métal » → `dispatch({ type: 'setCubeMaterial', material: 'metal' })` → `settingsReducer(anciens,
action)` → `{ ...anciens, cubeMaterial: 'metal' }` → `settings` change → tous les composants qui
utilisent `useSettings()` se redessinent → l'effet sauvegarde dans `localStorage`.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Context | Valeur posée en haut de l'arbre, lisible par tout composant en dessous, sans props |
| `createContext` / `Provider` | Crée le context / le composant qui le diffuse à ses enfants |
| `useContext` | Lit la valeur du context le plus proche au-dessus |
| Hook maison | Notre fonction `useXxx` (`useSettings()`) qui enveloppe `useContext` |
| Reducer | Fonction pure : (état actuel, action) → nouvel état |
| Action | Objet qui décrit ce qu'on veut faire : `{ type: '…', …données }` |
| `useReducer` / `dispatch` | Comme `useState` pour un reducer / envoie une action au reducer |
| `switch` / `case` | Choisit un bloc de code selon une valeur |
| `children` / `ReactNode` | Ce qu'un composant entoure / n'importe quoi d'affichable |
| Déstructuration | `const { a, b } = objet` |
| `as Type` | Précise à TypeScript le type d'une valeur (seulement quand on en est sûr) |

## Quiz

1. Pourquoi ne pas remonter un `useState` dans `Layout` et le passer en props ?
2. On choisit « Bois » : le trajet jusqu'à `localStorage`, avec `dispatch`, le reducer et l'effet.
3. Pourquoi `localStorage.setItem` est-il dans un `useEffect` du Provider et pas dans le reducer ?
4. E ajoute `instrument: 'guitare'` dans `DEFAULT_SETTINGS` ; le casier ne contient que
   `{"cubeMaterial":"bois"}`. Que vaut `instrument` au chargement, quelle ligne y veille ?
5. Un composant hors de `<SettingsProvider>` appelle `useSettings()` : que se passe-t-il, pourquoi
   est-ce mieux que de laisser `null` passer ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `FaceSettings` est affiché par `<Outlet />` : pas de props à travers le routeur. Et les deux
   composants sont éloignés : le context évite de faire transiter les props partout.
2. `onChange` → `dispatch({ type: 'setCubeMaterial', material: 'bois' })` → React appelle le
   reducer avec l'état actuel et l'action → `case 'setCubeMaterial'` renvoie `{ ...settings,
   cubeMaterial: 'bois' }` → `settings` change, les composants avec `useSettings()` se redessinent →
   l'effet (dépendance `[settings]`) sauvegarde le JSON.
3. Le reducer doit rester pur : il calcule le nouvel état, sans effet de bord.
4. `'guitare'` : `return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }` pose les défauts puis écrase
   seulement ce qui est enregistré.
5. `useContext` renvoie `null` → erreur explicite immédiate : on voit tout de suite le problème, et
   TypeScript sait que la valeur renvoyée n'est jamais `null`.

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots et chaque maillon du circuit dans l'ordre.

## Questions possibles à l'oral

- **Pourquoi un context et pas des props ?** Le cube et la page Réglages sont éloignés, et la page
  est affichée par `<Outlet />` : on ne peut pas lui passer de props.
- **Pourquoi useReducer et pas useState ?** Plusieurs réglages vont s'ajouter ; le reducer réunit
  les règles de modification en un seul endroit.
- **Pourquoi la sauvegarde n'est-elle pas dans le reducer ?** Le reducer doit rester pur.
- **Pourquoi les tempos par défaut ne sont-ils pas dans le context ?** Un seul composant les lit,
  à son démarrage : un state reste local tant qu'un seul composant s'en sert.
