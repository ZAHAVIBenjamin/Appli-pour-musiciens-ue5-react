# E-06 — Tablatures : la face de recherche (formulaire, liste, choix de l'instrument)

- **Date** : 28/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/components/tools/FaceTabs.tsx`, `src/services/tablatureApi.ts`
  (catégories d'instruments), `src/utils/notes.ts` (`midiToName`), `src/index.css`

## Ce qu'on a fait et pourquoi

Le service de recherche existait (E-05) ; il fallait l'**interface** : un champ de recherche, la
liste des morceaux trouvés (lien vers la tablature sur Songsterr) et, pour chacun, ses pistes avec
l'**accordage en noms de notes** (`[64, 59, 55, 50, 45, 40]` → « Mi La Ré Sol Si Mi »).

En cours de séance, on a ajouté le **choix de l'instrument** (guitare, basse, ukulélé) : Songsterr
fournit leurs pistes avec leur accordage, et c'était moins coûteux de le faire tout de suite que de
rouvrir le chantier plus tard.

L'instrument choisi reste **local à la face** (`useState`) : seule elle s'en sert aujourd'hui. Quand
la face Réglages (I) voudra le partager avec l'accordeur, on le déplacera dans le store — on ne
construit pas en avance ce dont on n'a pas besoin (**YAGNI**).

## Le code expliqué

### src/utils/notes.ts — `midiToName` (refactorisation)

```ts
export function midiToName(midi: number): string {
  return NOTE_NAMES[midi % 12]
}
```

Le calcul du nom était enfermé dans `frequencyToNote` ; on l'a sorti dans une fonction exportée,
que `frequencyToNote` réutilise (`name: midiToName(midi)`).

- **DRY** (*Don't Repeat Yourself*) : une règle à un seul endroit = un seul endroit à corriger.
- **Refactorisation** : réorganiser sans changer le comportement (l'accordeur affiche toujours Mi2,
  0 cent pour 82,41 Hz).
- `[64, 59, 55, 50, 45, 40].map(midiToName)` = `.map((midi) => midiToName(midi))`, en plus court.

### Retourner l'accordage : le piège de `reverse`

Songsterr numérote les cordes comme les guitaristes : **corde 1 = la plus aiguë** (64 = Mi4) en
premier. On affiche du grave vers l'aigu :

```ts
function tuningToText(tuning: number[]): string {
  return [...tuning].reverse().map(midiToName).join(' ')
}
```

- `[...tuning]` (**spread**, décomposition) : fabrique un **nouveau tableau** avec les mêmes valeurs ;
  `tuning` désigne toujours l'original.
- `reverse()` **modifie le tableau sur place** (contrairement à `map` et `filter`, qui en
  fabriquent un nouveau). Sans la copie, on retournerait l'accordage stocké dans `songs` à chaque
  affichage : à l'endroit, puis à l'envers, puis à l'endroit…
- Expérience console : `t.reverse()` → `t` vaut `[3, 2, 1]` (abîmé) ; `[...u].reverse()` → `u` vaut
  toujours `[1, 2, 3]`.
- `join(' ')` colle les éléments avec un espace.
- Drop D `[64, 59, 55, 50, 45, 38]` → « **Ré** La Ré Sol Si Mi » : seule la corde de Mi grave
  descend de 2 demi-tons.

### src/services/tablatureApi.ts — les catégories d'instruments

```ts
export type Instrument = 'guitar' | 'bass' | 'ukulele'
```

**Type union** (`|` = « ou ») : seules ces trois valeurs sont acceptées, TypeScript refuse
`'guitare'` avant même de lancer l'appli (comme le `FaceId` de Bilal).

```ts
function instrumentOf(songsterrInstrument: string): Instrument | null {
  if (songsterrInstrument.includes('Guitar')) { return 'guitar' }
  if (songsterrInstrument.includes('Bass')) { return 'bass' }
  if (songsterrInstrument.includes('Ukulele')) { return 'ukulele' }
  return null // batterie, voix, piano...
}
```

Traduit les noms Songsterr (`'Electric Bass (pick)'`) en nos catégories (`'bass'`) : la couche
d'adaptation d'E-05. (La batterie n'a même pas de champ `tuning` : elle est écartée ici.)

```ts
function toStringTracks(tracks: SongsterrTrack[]): StringTrack[] {
  const result: StringTrack[] = []
  for (const track of tracks) {
    const instrument = instrumentOf(track.instrument)
    if (instrument !== null) {
      result.push({ instrument, name: track.name, tuning: track.tuning })
    }
  }
  return result
}
```

- Boucle `for` plutôt que `filter` + `map` : `instrumentOf` n'est appelée **qu'une fois** par piste
  (pour décider ET pour connaître la catégorie).
- `push` : ajoute à la fin du tableau. `{ instrument, ... }` = raccourci de `instrument: instrument`.
- `guitarTracks` devient `tracks`.

### src/components/tools/FaceTabs.tsx — la face

**Les états**

```tsx
const [query, setQuery] = useState('') // texte tapé
const [instrument, setInstrument] = useState<Instrument>('guitar')
const [songs, setSongs] = useState<Song[] | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

`songs` : **`null` = aucune recherche faite** (même si du texte est tapé, tant qu'on n'a pas validé ;
aussi après un échec) → rien d'affiché ; **`[]` = recherche faite, zéro résultat** → « Aucun
morceau trouvé ».

**Champs contrôlés**

```tsx
<input value={query} onChange={(event) => setQuery(event.target.value)} />
<select value={instrument} onChange={(event) => setInstrument(event.target.value as Instrument)}>
```

- `value` : le champ affiche **en permanence** l'état (ce n'est pas une valeur par défaut : c'est
  l'état qui commande).
- `onChange` : à **chaque touche** (ou chaque choix), l'état est mis à jour. Boucle : touche →
  `setQuery` → React redessine → le champ affiche `query`.
- `<form onSubmit>` + `<button type="submit">` : la touche Entrée lance aussi la recherche.

**`as` : l'assertion de type**

`event.target.value` est un `string` pour TypeScript ; `as Instrument` lui dit « fais-moi
confiance, c'est un `Instrument` ». Nécessaire ici, mais **TypeScript arrête de vérifier** : si la
promesse est fausse, aucune erreur à l'écriture, le bug n'apparaît qu'à l'exécution.

Expérience : `<option value="basse">` → **aucun soulignement rouge**, puis plantage en choisissant
Basse (`INSTRUMENT_LABELS['basse']` vaut `undefined`, et `.toLowerCase()` sur `undefined` plante).

**La recherche : `preventDefault`, `try` / `catch` / `finally`**

```tsx
async function handleSubmit(event: FormEvent) {
  event.preventDefault()
  if (query.trim() === '') { return }
  setLoading(true)
  setError(null)
  try {
    setSongs(await searchSongs(query.trim()))
  } catch {
    setError('La recherche a échoué. Réessaie plus tard.')
    setSongs(null)
  } finally {
    setLoading(false)
  }
}
```

- `preventDefault()` : un formulaire HTML envoyé **recharge toute la page** par défaut ; on
  l'empêche (expérience : sans cette ligne, la page se recharge et tout est perdu).
- `trim()` : retire les espaces au début et à la fin.
- `try` / `catch` : l'équivalent de `.then` / `.catch` avec `await` ; toute erreur lancée dans le
  `try` fait sauter dans le `catch`.
- `finally` : exécuté **dans tous les cas**. Sans lui, après un échec, le bouton resterait grisé
  sur « Recherche… » pour toujours.
- `disabled={loading}` : pas de recherches multiples par clics répétés.

Scénario « serveur coupé », dans l'ordre : `setLoading(true)` (bouton grisé) → `setError(null)` →
`fetch` : aucune réponse → **`fetch` lève l'erreur** → `catch` : message rouge + `songs` à `null` →
`finally` : bouton « Chercher ».

**`fetch` est un facteur** (point clé, à savoir par cœur) :

| Situation | Une réponse arrive ? | `fetch` lève une erreur ? | Qui crée l'erreur ? |
| --- | --- | --- | --- |
| 404, 500 (le serveur répond « refusé », « en panne ») | **oui** | **non** (`ok` = false) | **notre** `throw` |
| Wi-Fi coupé, serveur arrêté, CORS | **non** | **oui** | `fetch` |

La lettre arrive, même pour dire « refusé » : le facteur a fait son travail, c'est à nous de la
lire. La lettre n'arrive pas (route coupée, douane = CORS) : c'est le facteur qui signale l'échec.
L'API ne lève jamais d'erreur dans notre code : elle répond, ou ne répond pas.

**La liste**

```tsx
{songs.map((song) => {
  const tracks = song.tracks.filter((track) => track.instrument === instrument)
  return (
    <li key={song.id}>
      <a href={song.url} target="_blank" rel="noopener noreferrer">...</a>
      {tracks.length === 0 ? <p>Pas de piste ...</p> : tracks.map(...)}
    </li>
  )
})}
```

- `map` transforme chaque `Song` en `<li>` (comme les boutons de `FaceNav`).
- **`key`** : identifiant **unique et stable** par élément, pour que React sache quoi mettre à jour.
  `song.id` ; pour les pistes, leur position (`index`), acceptable car la liste ne change pas d'ordre.
- **Filtrer à l'affichage** : changer d'instrument **ne relance pas la recherche**, on refiltre les
  résultats déjà dans l'état `songs` (instantané, pas d'appel réseau, pas de risque de limitation
  de débit par l'API).
- Corps entre accolades + `return` : nécessaire pour calculer `tracks` avant d'afficher.
- **Ternaire** `condition ? A : B` : deux affichages possibles (`&&` : afficher ou rien).
- `target="_blank"` : nouvel onglet ; `rel="noopener noreferrer"` : le nouvel onglet ne peut pas
  contrôler notre page (`window.opener`).
- `Record<Instrument, string>` pour les libellés : ajouter un instrument au type oblige à ajouter
  son libellé. Libellés français dans la **face** (affichage), catégories anglaises dans le
  **service** (données).

### Test réalisé (Chrome)

Wonderwall (accordage « Mi La Ré Sol Si Mi », « Pas de piste guitare » pour la version Acoustic),
lien ouvert dans un nouvel onglet, Metallica guitare → basse instantané (4 cordes), ukulélé
« Sol Do Mi La », `zzzqqqxx` → « Aucun morceau trouvé », serveur coupé → message rouge et bouton
revenu à « Chercher ».

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| DRY | Ne pas répéter une même règle à plusieurs endroits |
| Refactorisation | Réorganiser le code sans changer ce qu'il fait |
| Spread `[...t]` | Verse les éléments de `t` dans un nouveau tableau (copie) |
| Modification sur place | La méthode change le tableau lui-même (`reverse`, `push`) |
| Type union | `'a' \| 'b'` : la valeur est l'une de celles-là |
| Assertion `as` | « Fais-moi confiance » à TypeScript, qui ne vérifie plus |
| Champ contrôlé | Champ dont la valeur est tenue par un état React |
| `preventDefault` | Empêche le comportement par défaut du navigateur (recharger la page) |
| `try` / `catch` / `finally` | Essayer / en cas d'erreur / dans tous les cas |
| `key` | Identifiant unique d'un élément de liste pour React |
| Ternaire | `condition ? A : B` |
| YAGNI | Ne pas construire avant d'en avoir besoin |
| Limitation de débit | Une API bloque un client qui l'appelle trop souvent |

## Quiz

1. Pourquoi `[...tuning].reverse()` et pas `tuning.reverse()` ? Qu'est-ce qu'on verrait à l'écran ?
2. `songs` vaut `null` ou `[]` : différence, et affichage dans chaque cas ?
3. Serveur coupé, clic sur Chercher : déroulé de `setLoading(true)` au message rouge. Sans
   `finally` ?
4. Dans l'input, rôle de `value` et `onChange` ? Pourquoi `event.preventDefault()` ?
5. Guitare → Basse : nouvel appel à Songsterr ? Que fait `as`, pourquoi nécessaire, pourquoi s'en
   méfier ?

Rattrapage :

- A. (console) `t.reverse()` et `[...u].reverse()` : lequel des tableaux d'origine est abîmé ?
- B. « metallica » tapé mais pas validé : `songs` ? affichage ?
- C. Serveur coupé : `fetch` lève-t-il lui-même une erreur ? Différence avec `/nexistepas` ?
- D. (expérience) Sans `event.preventDefault()` : que se passe-t-il ?
- E. (expérience) `<option value="basse">` : erreur soulignée ? Que se passe-t-il en choisissant
  Basse ? Ce que fait `as`.
- F. `fetch` lève-t-il lui-même une erreur : 500 ? Wi-Fi coupé ? appel direct sans proxy ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `reverse` modifie sur place ; sans copie, l'accordage stocké serait retourné à chaque affichage
   (à l'endroit / à l'envers en alternance).
2. `null` = aucune recherche faite → rien ; `[]` = recherche sans résultat → « Aucun morceau
   trouvé ».
3. Bouton grisé « Recherche… » → `setError(null)` → `fetch` sans réponse lève l'erreur → `catch` :
   message + `songs` à `null` → `finally` : bouton « Chercher ». Sans `finally` : bouton bloqué.
4. `value` : le champ affiche l'état ; `onChange` : met l'état à jour à chaque touche.
   `preventDefault` : empêche le rechargement de la page à l'envoi du formulaire.
5. Non : on refiltre `songs` déjà reçus. `as` = assertion : TypeScript accepte sans vérifier ;
   nécessaire car `value` est un `string` ; dangereux car une valeur fausse passe sans erreur et
   plante à l'exécution.

- A. `t` (`[3, 2, 1]`) ; `u` reste `[1, 2, 3]`.
- B. `null`, rien d'affiché.
- C. Oui (aucune réponse) ; `/nexistepas` = une réponse 404 arrive, `fetch` réussit, c'est notre
  `throw` qui crée l'erreur.
- D. La page entière se recharge.
- E. Aucune erreur soulignée ; plantage en choisissant Basse ; `as` fait taire la vérification.
- F. 500 : **non** ; Wi-Fi coupé : **oui** ; sans proxy (CORS) : **oui**.

</details>

## Points à retravailler (E)

- ⚠️ **Le facteur** (`fetch`) : réponse d'erreur (404/500) → `fetch` ne lève **pas** d'erreur, c'est
  notre `throw` ; pas de réponse (réseau, CORS) → `fetch` lève l'erreur. Erreur répétée trois fois
  (E-05 puis E-06) → **question d'échauffement à la prochaine séance**.
- `value` n'est pas une valeur par défaut ; `onChange` à chaque touche.
- `preventDefault` = empêcher le rechargement de la page.
- `as` n'est ni un alias ni une histoire de casse : une assertion qui désactive la vérification.
- `null` (pas cherché) vs `[]` (rien trouvé).
- Répondre précisément à la question posée (« lequel est abîmé » → nommer le tableau).

## Questions possibles à l'oral

- **Comment l'utilisateur choisit-il l'instrument ?** Un `<select>` contrôlé ; les pistes sont
  rangées par catégorie dans le service et filtrées à l'affichage, sans nouvel appel réseau.
- **Pourquoi l'instrument n'est-il pas dans le store ?** Une seule face s'en sert ; on le déplacera
  quand Réglages le partagera avec l'accordeur (YAGNI).
- **Pourquoi `[...tuning]` ?** `reverse` modifie le tableau sur place ; on travaille sur une copie
  pour ne pas abîmer l'état.
- **Comment gérez-vous les erreurs de la recherche ?** `try` / `catch` affiche un message ;
  `finally` réactive toujours le bouton. `fetch` ne rejette que sans réponse ; un 404/500 est
  détecté par notre test de `response.ok`.
- **Vous utilisez `as` : n'est-ce pas risqué ?** Oui, il désactive la vérification ; ici les valeurs
  ne viennent que de nos `<option>`, et on l'a vérifié par l'expérience.
- **À quoi sert `key` ?** À identifier chaque élément d'une liste pour que React ne redessine que
  ce qui change.
