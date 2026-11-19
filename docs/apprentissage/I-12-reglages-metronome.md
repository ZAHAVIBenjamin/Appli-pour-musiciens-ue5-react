# I-12 — Réglages : tempo et signature par défaut du métronome

- **Date** : 19/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/utils/metronomeSettings.ts` (nouveau), `src/components/tools/FaceSettings.tsx`,
  `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Sur `/reglages`, on choisit le **tempo** et la **signature par défaut** ; le métronome démarre avec
ces valeurs au lieu de 120 BPM en 4/4, même après un rechargement.

Principe : `localStorage` comme **boîte aux lettres**. La page Réglages et le métronome ne sont
jamais affichés en même temps (l'un est démonté quand l'autre est monté) : Réglages **écrit** le
choix, le métronome le **lit** à son démarrage avec `useState(loadX)` (comme le carnet, I-10).
`localStorage` + `useEffect` : chapitre 5 du cours.

## Le code expliqué

### src/utils/metronomeSettings.ts — ce qui est partagé

```ts
export const MIN_BPM = 40
export const MAX_BPM = 220
export const BAR_CHOICES = [2, 3, 4]
```

Déplacées depuis `FaceMetronome` : la page Réglages a besoin des mêmes limites et des mêmes choix.
Une seule source pour les données partagées (comme `faces.ts`, EI-01).

```ts
const BPM_KEY = 'reglages-tempo'
const BEATS_KEY = 'reglages-signature'
```

Noms des casiers, **non exportés** : seules les fonctions de ce fichier touchent à `localStorage`,
personne ne peut se tromper de nom ailleurs.

```ts
export function loadDefaultBpm(): number {
  const saved = localStorage.getItem(BPM_KEY)
  return saved === null ? 120 : Number(saved)
}

export function saveDefaultBpm(bpm: number) {
  localStorage.setItem(BPM_KEY, String(bpm))
}
```

- `load` : casier vide → valeur d'origine (120) ; sinon texte → nombre.
- `save` : nombre → texte.
- `String()` / `Number()` suffisent pour **un seul nombre** ; JSON (I-10) sert aux structures
  (tableaux, objets).
- Idem pour la signature (`loadDefaultBeatsPerBar`, `saveDefaultBeatsPerBar`, 4 par défaut).

### src/components/tools/FaceMetronome.tsx

```tsx
const [bpm, setBpm] = useState(loadDefaultBpm)
const [beatsPerBar, setBeatsPerBar] = useState(loadDefaultBeatsPerBar)
```

- Constantes importées du fichier partagé (définitions locales supprimées).
- Valeur de départ = ce qui est dans le casier ; fonction donnée **sans parenthèses** (appelée une
  fois).
- Le métronome **ne sauvegarde rien** : son curseur change le tempo de la séance seulement ; le
  défaut ne se change que dans Réglages.

### src/components/tools/FaceSettings.tsx — la page Réglages

```tsx
const [defaultBpm, setDefaultBpm] = useState(loadDefaultBpm)
const [defaultBeats, setDefaultBeats] = useState(loadDefaultBeatsPerBar)

useEffect(() => {
  saveDefaultBpm(defaultBpm)
}, [defaultBpm])

useEffect(() => {
  saveDefaultBeatsPerBar(defaultBeats)
}, [defaultBeats])
```

- La page affiche ce qui est enregistré, et sauvegarde chaque changement (même schéma qu'en I-10).
- Deux effets, chacun avec **sa** dépendance : changer le tempo ne réécrit pas la signature.
- Le curseur et la liste sont les mêmes que dans le métronome (I-05, I-08), avec les constantes
  partagées. `<h3>` = sous-titre de rubrique (Métronome, puis d'autres).

### Limite et suite

Cette boîte aux lettres marche parce qu'un seul composant (le métronome) lit ces réglages, et
seulement à son démarrage. Pour un réglage lu **en direct** par un composant qui reste affiché (la
matière du cube) ou par **plusieurs faces** (l'accordeur et les tablatures de E), le README prévoit
un **context + useReducer** (chapitre 10).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `export` | Rend une constante ou une fonction utilisable par d'autres fichiers (`import`) |
| Constante non exportée | Visible seulement dans son fichier |
| `String(n)` / `Number(t)` | Nombre → texte / texte → nombre |
| `<h3>` | Sous-titre |

## Quiz

1. Pourquoi déplacer `MIN_BPM`, `MAX_BPM` et `BAR_CHOICES` dans un fichier à part ?
2. On règle le tempo par défaut sur 80, puis on clique sur « Métronome » : comment arrive-t-il à 80 ?
3. Dans le métronome on passe à 150, on va sur « Carnet », on revient : à combien est-il ?
4. Pourquoi `String()` / `Number()` suffisent ici, alors qu'en I-10 il fallait JSON ?
5. Pourquoi les clés ne sont-elles pas exportées, alors que `load…` / `save…` le sont ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Réglages et métronome ont besoin des mêmes limites et choix : un seul fichier évite de les
   dupliquer, un seul endroit à modifier (ajouter 6/4).
2. Curseur à 80 → `defaultBpm` change → l'effet appelle `saveDefaultBpm(80)` → `"80"` dans
   `'reglages-tempo'` → clic sur Métronome : Réglages démonté, `FaceMetronome` monté →
   `useState(loadDefaultBpm)` lit `"80"`, le convertit en `80`.
3. À 80 : le métronome ne sauvegarde pas ; démonté, son état est perdu ; remonté, il relit le défaut.
4. Une seule valeur simple (un nombre) ; JSON sert aux structures (tableau d'objets).
5. Seules les fonctions du fichier accèdent à `localStorage` : les autres fichiers passent par
   `load…` / `save…`, impossible de se tromper de clé.

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots. Q2 : le circuit part bien du déclencheur
(point à retravailler de I-05, acquis).

## Questions possibles à l'oral

- **Comment Réglages et le métronome communiquent-ils ?** Par `localStorage` : Réglages écrit, le
  métronome lit à son démarrage ; ils ne sont jamais affichés en même temps.
- **Pourquoi pas un context ici ?** Un seul composant lit ces réglages, et seulement au démarrage :
  règle du chapitre 10, un state reste local tant qu'un seul composant s'en sert.
- **Pourquoi le métronome ne sauvegarde-t-il pas son curseur ?** Pour ne pas transformer chaque
  essai en nouveau défaut : le défaut se règle dans Réglages.
