# EI-07 — Les outils collés sur le cube, et le state partagé (Context + useReducer)

- **Date** : 19/11/2026 (code) → 22/11/2026 (fiche, séance de révision R3)
- **Auteur** : E + I (Réglages en Context + useReducer par I, fiche EI-02 ; outils sur les faces par E)
- **Fichiers touchés** : `src/components/3d/Cube.tsx`, `src/components/ui/Layout.tsx`,
  `src/components/ui/ToolPanel.tsx`, `src/context/SettingsContext.tsx` (I), `src/index.css`,
  `package.json` (`its-fine`)

## Ce qu'on a fait et pourquoi

L'outil de la face active (accordeur, tablatures…) n'est plus dans un panneau par-dessus la scène :
il est **collé sur sa face du cube**, en vrai HTML cliquable, et suit la rotation. Les autres faces
affichent leur nom. Les Réglages (instrument, matière du cube) sont partagés entre les faces par un
**Context + useReducer** (chapitre 10).

## Le code expliqué

### 1. Le state partagé : Context + useReducer (code de Bilal)

```tsx
function settingsReducer(settings: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'setInstrument':
      return { ...settings, instrument: action.instrument }
    // ...
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])
  return <SettingsContext.Provider value={{ settings, dispatch }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (value === null) throw new Error('useSettings doit être utilisé à l’intérieur de <SettingsProvider>')
  return value
}
```

- **Pourquoi un Context** : l'instrument est lu par 4 faces éloignées → sans lui, il faudrait le
  passer de parent en enfant à travers des composants qui ne s'en servent pas : le **prop drilling**.
- **Le trajet d'un changement** :
  clic → `dispatch({ type: 'setInstrument', instrument: 'ukulele' })` (on envoie une **action**)
  → React appelle le **reducer** → nouvel objet `{ ...settings, instrument: 'ukulele' }`
  → le Provider se redessine → tous les composants qui appellent `useSettings()` se redessinent
  → l'Accordeur affiche Sol4 Do4 Mi4 La4.
- **`dispatch` n'enregistre rien** : il envoie un message ; le **reducer décide** (image du cours :
  le formulaire au guichet, l'employé applique le règlement).
- **`localStorage` dans un `useEffect`, pas dans le reducer** : un reducer doit rester **pur**
  (même état + même action = même résultat, aucun effet de bord). React peut d'ailleurs l'appeler
  deux fois en développement (StrictMode). `loadSettings`, elle, sert à **lire** au démarrage.
- **`throw` si `null`** : `null` est la valeur par défaut du canal (`createContext(null)`). On la
  reçoit seulement s'il n'y a **aucun Provider au-dessus** du composant. Le message dit quoi corriger,
  au lieu d'un « Cannot read properties of null » incompréhensible.

### 2. L'outil collé sur la face : `<Html>` et le pont de contexte

```tsx
const ContextBridge = useContextBridge()
// ...
if (face.id === shownFace) {
  return (
    <Html transform occlude position={placement.position} rotation={placement.rotation} scale={HTML_SCALE}>
      <ContextBridge>
        <ToolPanel />
      </ContextBridge>
    </Html>
  )
}
```

- `<Html transform>` (drei) : du vrai HTML placé sur une face 3D, qui suit la rotation.
- **Le bug rencontré** : `<Html>` rend son contenu dans une **racine React séparée**. Les outils n'avaient
  donc **plus de Provider au-dessus d'eux** : ni le routeur, ni les Réglages → l'erreur de
  `useSettings()` vue plus haut.
- **Le pont** (`useContextBridge` de la bibliothèque `its-fine`) récupère tous les Contexts du dessus
  et les **retransmet** dans la racine séparée.
- `ToolPanel` contient toujours l'`<Outlet />` (EI-01) : le routeur choisit l'outil, on l'a seulement
  posé sur la face.

### 3. Un seul outil monté à la fois

- L'`Outlet` n'affiche **que** l'élément de la route active : un seul outil est **monté**.
- Changer de face **démonte** l'outil précédent → React appelle son **cleanup** → micro libéré,
  métronome arrêté (garantie construite en E-04 et I-04).
- Avec six outils montés en permanence, on pourrait lancer le métronome, changer de face, et il
  continuerait sur une face invisible. Et ce serait six blocs de HTML recalculés pendant la rotation.

### 4. Le carré de la face

`.tool-panel` fait 420 × 420 px (la taille d'une face, `FACE_PIXELS` dans `Cube.tsx`) et **défile à
l'intérieur** si l'outil est plus long (liste des tablatures, réglages).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Prop drilling | Faire passer une prop à travers des composants qui ne s'en servent pas |
| Context | Canal qui rend une valeur lisible par tous les descendants d'un Provider |
| Provider | Composant qui possède la valeur et l'émet vers ses descendants |
| `useReducer` | State dont les modifications passent par une fonction pure (le reducer) |
| Action | Message `{ type, ...données }` envoyé avec `dispatch` |
| Reducer | Fonction pure : (état actuel, action) → nouvel état |
| Effet de bord | Action sur l'extérieur (localStorage, fetch, DOM...) |
| Racine React séparée | Arbre React rendu à part, qui ne voit pas les Providers de l'autre |
| Pont de contexte | Retransmet les Contexts d'un arbre React vers une racine séparée |

## Quiz (séance R3)

1. Pourquoi un Context pour l'instrument ? Quel problème évite-t-il ?
2. Le trajet de `dispatch({ type: 'setInstrument', instrument: 'ukulele' })` jusqu'à l'accordeur.
3. Pourquoi `localStorage` est-il dans un `useEffect` du Provider et pas dans le reducer ?
4. Pourquoi `useSettings()` lance une erreur si `value === null` ? Quand est-ce que ça arrive ?
5. Pourquoi un seul outil affiché sur le cube, et pas les six ?

Rattrapage :

- c. `dispatch` envoie une ___ ; c'est le ___ qui calcule le nouvel état.
- d. Le reducer doit rester ___ : pas d'effet de ___ → `localStorage` dans un ___.
- e. `useSettings()` reçoit `null` quand il n'y a pas de ___ au-dessus du composant.
- f. useRef = « ___ sans ___ ».

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Il est lu par 4 faces éloignées : sans Context, prop drilling.
2. Action envoyée → reducer → nouvel objet → Provider redessiné → tous les `useSettings()` redessinés
   → l'accordeur lit le nouvel instrument.
3. Le reducer doit rester pur ; écrire dans `localStorage` est un effet de bord.
4. `null` = valeur par défaut du canal : pas de Provider au-dessus. Message clair au lieu d'un crash
   obscur. (C'est le bug des outils sur le cube, réglé par le pont de contexte.)
5. Un seul outil monté (l'`Outlet`) : changer de face démonte l'ancien, son cleanup libère le micro
   ou arrête le métronome ; et c'est plus léger.

- c. action ; reducer.
- d. pur ; bord ; `useEffect`.
- e. Provider.
- f. Retient ; Rendu.

</details>

## Points à retravailler (E)

- Le **trajet** d'un `dispatch` : action → reducer → nouvel état → relecture par les composants.
- **Pureté du reducer** ≠ lecture au démarrage (`loadSettings`).
- `null` du Context = **pas de Provider** (rien à voir avec `localStorage`).
- Toujours fragiles : `useRef` (« Retient sans Rendu »), rendu ≠ montage.

## Questions possibles à l'oral

- **Pourquoi Context + useReducer pour les Réglages ?** Plusieurs faces éloignées les lisent (pas de
  prop drilling) et toutes les modifications passent par un reducer pur, facile à tester.
- **Et pourquoi pas pour la face affichée ?** Elle est déjà dans l'adresse (React Router) : une seule
  information, une seule source de vérité.
- **Comment les outils collés sur le cube lisent-ils les Réglages ?** Ils sont rendus dans une racine
  React séparée ; un pont de contexte leur retransmet les Providers.
- **Que se passe-t-il quand on change de face pendant que le micro écoute ?** L'outil est démonté, son
  cleanup libère le micro.
