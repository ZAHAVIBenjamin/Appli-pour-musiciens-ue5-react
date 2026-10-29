# E-08 — Dictionnaire d'accords : dessiner le diagramme en SVG

- **Date** : 29/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/components/tools/ChordDiagram.tsx` (nouveau),
  `src/components/tools/FaceChordDictionary.tsx`, `src/index.css`

## Ce qu'on a fait et pourquoi

Les données des accords existaient (E-07) ; il fallait les **dessiner** : le manche, les cordes à vide
(○) ou non jouées (×), les doigts numérotés et le barré. On a choisi le **SVG** : des formes décrites
en code, nettes à toutes les tailles, et fabriquées par React avec `map` comme n'importe quelle
balise.

Deux composants : `ChordDiagram` **dessine** l'accord qu'on lui donne ; `FaceChordDictionary`
affiche un bouton par accord et **choisit** lequel passer au diagramme.

Orientation choisie par E (guitariste) : manche **à l'horizontale**, comme vu en baissant les yeux
sur la guitare : **sillet à droite**, **Mi grave en haut**. On est passé du vertical à cette
orientation en ne changeant que les deux fonctions de position (voir plus bas).

## Le code expliqué

### Le SVG et le `viewBox`

```tsx
<svg viewBox={`0 0 ${width} ${height}`} className="chord-diagram">
```

- **SVG** : on décrit des formes (`<line>`, `<circle>`, `<rect>`, `<text>`) par leurs coordonnées.
- **Coordonnées** : x depuis le bord **gauche**, y depuis le bord **haut** (**y grandit vers le
  bas**).
- **`viewBox` = le repère du dessin** (ex. 290 unités de large). Le **CSS** fixe la place à l'écran
  (`width: 300px`). Le navigateur met le repère à l'échelle de cette place.
  - Expérience `STRING_GAP` à 50 : le dessin a plus d'unités à faire rentrer dans la même place →
    tout est **réduit**.
  - Expérience `width: 150px` : moins de place, mêmes unités → dessin plus petit.

### Les props : `ChordDiagram` reçoit son accord

```tsx
interface ChordDiagramProps {
  chord: Chord
}
export default function ChordDiagram({ chord }: ChordDiagramProps) { ... }

<ChordDiagram chord={selected} />
```

- **Prop** : valeur transmise du **parent** à l'**enfant**, écrite comme un attribut. L'interface
  décrit ce que le composant attend ; TypeScript vérifie qu'on le lui donne.
- `({ chord })` : **déstructuration** — on sort le champ `chord` de l'objet des props.
- **Le parent choisit, l'enfant dessine** : le diagramme a un seul rôle et ne sait pas pourquoi on
  lui donne cet accord → réutilisable (à côté d'une tablature, plusieurs variantes côte à côte…).

### Les positions : deux fonctions et des constantes nommées

```ts
const STRING_GAP = 30 // écart entre deux cordes
const FRET_GAP = 46 // largeur d'une case
const FRETS_SHOWN = 5
const MARGIN = 20
const TOP = 25

const stringY = (string: number) => TOP + string * STRING_GAP // Mi grave (0) en haut
const fretX = (line: number) => MARGIN + (FRETS_SHOWN - line) * FRET_GAP // sillet (0) à droite
```

- **Constantes nommées** plutôt que des **nombres magiques** (un `46` perdu dans le code).
- **Toutes** les formes passent par ces deux fonctions → changer l'orientation = changer ces deux
  formules. Historique de la séance : vertical (`x`, `y`) → horizontal Mi grave en bas
  (`TOP + (stringCount - 1 - string) * STRING_GAP`) → Mi grave en haut (`TOP + string * STRING_GAP`)
  → sillet à droite (`(FRETS_SHOWN - line)`). Le reste du composant n'a pas bougé.
- **Une case est l'espace ENTRE deux traits.** Son milieu : `fretX(fret - 0.5)`.
  Méthode en deux temps (avec `40 + line × 46`) : case 3 = début au trait 2
  (40 + 2 × 46 = 132) + une demi-case (23) = **155** = `40 + 2,5 × 46`. Ou moyenne des deux traits
  qui l'entourent : (132 + 178) / 2 = 155. **Ne pas diviser tout le calcul par 2.**

### Générer les formes avec `map` et `Array.from`

```tsx
{Array.from({ length: FRETS_SHOWN + 1 }, (_, line) => (
  <line key={`fret-${line}`} x1={fretX(line)} x2={fretX(line)} ... strokeWidth={line === 0 ? 5 : 1} />
))}
{chord.frets.map((_, string) => <line key={`string-${string}`} ... />)}
```

- `Array.from({ length: 6 }, fonction)` : fabrique un tableau en appelant la fonction avec les
  positions 0 à 5 (pas de tableau à parcourir, on veut « 6 fois »).
- `_` : argument qu'on n'utilise pas.
- Les cordes : **un trait par valeur de l'accord** → 4 valeurs (ukulélé) = 4 cordes, et `width` /
  `height` calculés depuis `stringCount` s'adaptent seuls. (`FRETS_SHOWN` = nombre de **cases**,
  pas de cordes.)
- `stroke="currentColor"` : la couleur du texte définie en CSS (`color: #fff`).

### L'ordre du dessin : des calques

Le SVG peint **dans l'ordre d'écriture** : ce qui vient après passe **par-dessus** (ordre
d'empilement, « axe z »). D'où l'ordre : 1. traits de case, 2. cordes, 3. × et ○, 4. barré,
5. ronds des doigts (en dernier pour recouvrir cordes et barré ; écrits avant, les cordes les
traverseraient).

### × et ○ : un `map` à trois cas

```tsx
{chord.frets.map((fret, string) => {
  if (fret === null) { return <text ...>×</text> }
  if (fret === 0) { return <circle ... fill="none" /> }
  return null
})}
```

- Trois cas → des `if` (un ternaire n'en gère que deux).
- Case `null` → ×, case `0` → ○ vide (`fill="none"`), à côté du sillet.
- **`return null`** = « ne rien dessiner ici » (React ignore `null`) : c'est le cas des cordes
  **appuyées**, dont le rond est dessiné par le bloc 5. Chaque bloc a son travail.

### Le barré : la donnée dérivée d'E-07, en code

```ts
function findBarre(chord: Chord) {
  const strings = chord.fingers
    .map((finger, string) => (finger === 1 ? string : null))
    .filter((string) => string !== null)
  if (strings.length < 2) { return null }
  const from = strings[0]
  const to = strings[strings.length - 1]
  return { fret: chord.frets[from] ?? 0, from, to }
}
```

Expérience console avec le Si (`fingers: [null, 1, 2, 3, 4, 1]`) :

| Position | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| Doigt | null | **1** | 2 | 3 | 4 | **1** |
| `map` (position si index, sinon null) | null | **1** | null | null | null | **5** |

→ `filter` : `[1, 5]` → `from = 1`, `to = 5` (positions, depuis 0) = de la **2ᵉ à la 6ᵉ corde**
en langage humain (La → Mi aigu). Fa : `[0, 4, 5]` → de 0 à 5.

- Dernier élément = position `length - 1`.
- `?? 0` : « si `null`, prends 0 » — sécurité pour TypeScript (le test d'E-07 garantit qu'une corde
  avec un doigt n'est jamais muette).
- Dessin : un `<rect>` d'une corde à l'autre, élargi d'un rayon de chaque côté, `rx` = coins
  arrondis (pilule).

### Les ronds des doigts

```tsx
<g key={`dot-${string}`}>
  <circle cx={fretX(fret - 0.5)} cy={stringY(string)} r={DOT_RADIUS} />
  <text x={fretX(fret - 0.5)} y={stringY(string)} textAnchor="middle" dominantBaseline="central">
    {chord.fingers[string]}
  </text>
</g>
```

`<g>` regroupe le rond et son numéro sous une seule `key` ; `textAnchor` / `dominantBaseline`
centrent le texte.

### FaceChordDictionary : choisir l'accord

```tsx
const [selected, setSelected] = useState(CHORDS[0])
{CHORDS.map((chord) => (
  <button key={chord.name} onClick={() => setSelected(chord)} disabled={chord === selected}>
    {chord.name}
  </button>
))}
<ChordDiagram chord={selected} />
const uniqueNotes = [...new Set(playedNotes)]
```

- Même schéma que la barre de navigation de Bilal ; l'accord choisi est gardé en entier dans
  l'état et passé en prop.
- Notes sans doublons : `Set`, puis `[...set]` (spread) pour retrouver un tableau et faire `join`.
- `flex-wrap: wrap` : les boutons passent à la ligne.
- Note pour les variantes : deux accords du même nom auraient la même `key` → il faudra alors une
  autre clé.

### Test réalisé

Chrome : Do (× Mi grave, ○ Sol et Mi aigu, doigts 3-2-1), Fa (barré case 1 sur 6 cordes), Si et Dom
(barré sans le Mi grave), Ré (deux ×), Solm (tient dans 5 cases), notes affichées (Fa Do La).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| SVG | Dessin décrit par des formes et des coordonnées, net à toutes les tailles |
| `viewBox` | Repère du dessin, mis à l'échelle de la place donnée par le CSS |
| Prop | Valeur transmise d'un composant parent à un composant enfant |
| Déstructuration | `({ chord })` : sortir un champ d'un objet directement |
| Nombre magique | Nombre écrit en dur sans nom qui dise ce qu'il représente |
| `Array.from({ length })` | Fabrique un tableau de n éléments à partir de leurs positions |
| Ordre d'empilement (z) | Ce qui est dessiné après passe par-dessus |
| `<g>` | Groupe de formes SVG |
| `currentColor` | La couleur du texte (CSS `color`) utilisée dans le SVG |

## Quiz

1. À quoi sert le `viewBox` ? Pourquoi le dessin a-t-il rétréci avec `STRING_GAP` à 50 ?
2. Qu'est-ce qu'une prop ? Qui choisit, qui dessine ? Pourquoi deux composants ?
3. Pourquoi `fretX(fret - 0.5)` ? Calcul pour la case 1 avec `40 + line × 46`.
4. Pourquoi les ronds sont-ils écrits en dernier ? Que veut dire `return null` dans le `map` des ×/○ ?
5. Comment `findBarre` trouve-t-il le barré du Fa ? Tableaux après `map` et `filter`, `from`, `to`.

Rattrapage :

- A. (expérience) `width: 150px` : qu'est-ce qui change ? Rôle du `viewBox` ?
- B. Milieu de la case 3 avec `40 + line × 46`.
- C. Bloc des cordes déplacé à la fin : que verrait-on ?
- D. Bloc 3 pour une case `null`, `0`, `3` ?
- E. (console) Si : tableaux après `map` et `filter`, `from` et `to`.
- F. Milieu de la case 4 (méthode en deux temps).

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Repère du dessin, mis à l'échelle de la place CSS. Plus d'unités dans la même place → tout réduit.
2. Valeur transmise du parent à l'enfant. La face choisit, le diagramme dessine. Un rôle chacun,
   diagramme réutilisable, pas de répétition.
3. Une case est entre deux traits ; son milieu est à « fret − 0,5 » traits. Case 1 :
   40 + 0,5 × 46 = **63** (et non 86, qui est le trait 1).
4. Calques : écrits après = par-dessus ; les ronds doivent recouvrir cordes et barré. `return null` =
   ne rien dessiner (corde appuyée : son rond vient du bloc 5).
5. `[0, null, null, null, 4, 5]` → `[0, 4, 5]` → `from = 0`, `to = 5`, case `frets[0]` = 1.

- A. Dessin plus petit, unités inchangées ; le `viewBox` est le repère mis à l'échelle de la place.
- B. 132 + 23 = **155** (= 40 + 2,5 × 46).
- C. Les cordes passeraient en travers des ronds (peintes par-dessus).
- D. × ; ○ ; rien (le rond vient du bloc 5).
- E. `[null, 1, null, null, null, 5]` → `[1, 5]` → `from = 1`, `to = 5` (2ᵉ à 6ᵉ corde).
- F. Trait 3 = 178, + 23 = **201** (ou (178 + 224) / 2).

</details>

## Points à retravailler (E)

- **Milieu d'une case** : début de la case + une demi-case, ou moyenne des **deux** traits ; ne pas
  diviser tout le calcul par 2 (erreur faite deux fois, puis méthode acquise).
- **Positions depuis 0** dans le code (from = 1 = 2ᵉ corde) : toujours le décalage de 1.
- `viewBox` vs CSS : dans quel sens joue chaque réglage.
- `return null` = ne rien dessiner (ce n'est pas `null` qui fait la croix, c'est la valeur de la
  case).
- Utiliser les nombres de la **formule demandée** (pas ceux d'un ancien dessin).

## Questions possibles à l'oral

- **Pourquoi du SVG plutôt qu'une image ?** Le diagramme est calculé à partir des données : un seul
  composant dessine n'importe quel accord, net à toutes les tailles.
- **Comment le composant sait-il quel accord dessiner ?** Par une prop ; la face choisit, le
  diagramme dessine.
- **Comment est dessiné le barré, alors qu'il n'est pas dans les données ?** `findBarre` le déduit :
  l'index sur au moins deux cordes, de la première à la dernière.
- **Avez-vous changé l'orientation facilement ?** Oui : toutes les positions passent par deux
  fonctions (`stringY`, `fretX`) ; on n'a modifié que leurs formules.
- **Et pour le ukulélé ?** Le nombre de cordes vient du nombre de valeurs de l'accord ; la taille du
  dessin aussi.
