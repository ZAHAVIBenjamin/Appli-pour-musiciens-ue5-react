# E-07 — Dictionnaire d'accords : modéliser les données et les tester

- **Date** : 29/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/data/chords.ts` (nouveau), `src/data/chords.test.ts` (nouveau),
  `src/utils/notes.ts` (`STANDARD_TUNING`, `notesOfFrets`, `NOTE_NAMES` exporté),
  `package.json` (Vitest + script `test`)

## Ce qu'on a fait et pourquoi

Le dictionnaire d'accords a besoin de **données** : pour chaque accord, sur quelles cases appuyer et
avec quels doigts. Avant d'écrire du code, on a **conçu le format** (la **modélisation**) — c'est lui
que le dessin du manche lira. Le format est parti de la proposition de E (un nom + une valeur par
corde : à vide / non jouée / case), ajustée pour TypeScript.

Ces données sont écrites à la main : une faute de frappe enseignerait un accord faux. On a donc écrit
le **premier test automatique** du projet, qui calcule les notes réellement jouées et les compare aux
notes que l'accord doit contenir.

## Le code expliqué

### La modélisation : src/data/chords.ts

**Pourquoi `data/`** : ni calculs (`utils/`), ni appels réseau (`services/`) : des données écrites à
la main.

```ts
export type Fret = number | null
export type Finger = 1 | 2 | 3 | 4 | 'P' | null

export interface Chord {
  name: string
  frets: Fret[] // une valeur par corde, de la plus grave à la plus aiguë
  fingers: Finger[] // le doigt sur chaque corde, même ordre
}
```

| Sur la corde | Valeur | Pourquoi |
| --- | --- | --- |
| Case appuyée | `3` | le numéro de case |
| À vide (○) | `0` | c'est la case 0 (le sillet) : `accordage + 0` = note à vide, sans cas particulier |
| Non jouée (×) | `null` | pas de note |

- **Pas de lettres (`'o'`, `'x'`)** : un seul type, vérifié par TypeScript. Expérience :
  `45 + 'o'` donne `"45o"` sans erreur → **bug silencieux** (la suite donnerait `undefined`).
- **`Finger`** : type union de valeurs précises ; `5` serait refusé. `'P'` = **pouce** passé
  par-dessus le manche pour le Mi grave (ajouté sur remarque de E, guitariste).
- **Un tableau, pas un objet à clés `mi`, `la`…** : deux cordes s'appellent Mi, et un objet ne peut
  avoir qu'une clé `mi` (expérience : `({ mi: 0, la: 2, mi: 3 })` → le premier `mi` est écrasé) ;
  l'ordre est fixe (grave → aiguë, comme le diagramme et la notation `x32010`, **à l'inverse de
  Songsterr**) ; marche aussi pour 4 cordes.
- **Pas de champ « barré »** : c'est le même doigt sur plusieurs cordes à la même case → le dessin le
  **déduira** (donnée dérivée, voir plus bas). Fa = `[1, 3, 3, 2, 1, 1]`, doigts `[1, 3, 4, 2, 1, 1]`.
- **Variantes d'un même accord** (idée de E) : possibles sans changer le format, en ajoutant d'autres
  lignes avec le même nom ; l'interface les regroupera.

```ts
export const CHORDS: Chord[] = [
  { name: 'Do', frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  // ... 7 majeurs, 7 mineurs
]
```

Un accord par ligne pour comparer en colonne. Dom et Solm se jouent plus haut (jusqu'à la case 5) :
le dessin devra afficher une zone qui ne commence pas à la case 1.

### La donnée dérivée : une seule source de vérité

Comme la date de naissance (stockée) et l'âge (calculé) : on stocke la **source**, on **calcule** le
reste. Sinon, les deux finissent par se contredire (un `barre: true` oublié après modification des
cases dessinerait un barré inexistant).

| Source (stockée) | Dérivée (calculée) |
| --- | --- |
| `frets` + `fingers` | le barré |
| `frets` + accordage | les notes jouées (`notesOfFrets`) |
| `songs` (toutes les pistes) | les pistes de l'instrument choisi (E-06) |
| `note.cents` | `inTune` (E-04) |

### src/utils/notes.ts — les notes jouées

```ts
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64] // Mi2 La2 Ré3 Sol3 Si3 Mi4

export function notesOfFrets(
  frets: (number | null)[],
  tuning: number[] = STANDARD_TUNING,
): (string | null)[] {
  return frets.map((fret, string) => (fret === null ? null : midiToName(tuning[string] + fret)))
}
```

- Sur un manche, **chaque case = +1 demi-ton = +1 en MIDI** : note = `midiToName(accordage + case)`.
  Corde de La (45), case 3 → 48 → Do. Calcul sur des nombres, corde par corde : aucun son, aucun
  hertz.
- **Paramètre par défaut** `tuning = STANDARD_TUNING` : sans accordage, on prend le standard ; on
  pourra passer un Drop D ou un ukulélé sans réécrire la fonction. (Expérience :
  `function accorder(cordes = 6)` → `accorder()` = 6, `accorder(4)` = 4.)
- **Second argument de `map`** = la **position** de l'élément (0, 1, 2…) — expérience :
  `['Mi', 'La', 'Ré'].map((corde, position) => position)` → `[0, 1, 2]`. Ici, elle va chercher la
  corde du même rang : `tuning[string]`.
- `(number | null)[]` = tableau dont **chaque case** est un nombre ou `null`. Pas `Fret[]`, pour que
  `utils/` ne dépende pas de `data/`.
- Notre programme ne connaît que les dièses : Do mineur affiche Ré# là où un musicien écrirait Mi♭
  (même son, autre nom : **enharmonique**).

### src/data/chords.test.ts — le premier test automatique

**Vitest** : lanceur de tests fait pour Vite, installé en dépendance de **développement** (`-D` : sert
aux développeurs, pas envoyé aux utilisateurs). Script ajouté : `"test": "vitest run"` → `npm test`.
Un fichier `.test.ts` est trouvé automatiquement ; il est rangé à côté du fichier testé.

```ts
describe("dictionnaire d'accords", () => {
  for (const chord of CHORDS) {
    it(`${chord.name} : une valeur par corde`, () => {
      expect(chord.frets).toHaveLength(6)
    })
    // ...
  }
})
```

- **`describe`** : regroupe des tests sous un titre.
- **`it`** : **un** test, avec la phrase de ce qu'il vérifie.
- **`expect(valeur)`** + **matcher** : ce qu'on attend. `toHaveLength(6)` (longueur), `toBe(x)`
  (exactement x), `toEqual(...)` (même contenu). Sinon le test est **rouge**.
- La boucle **fabrique** 3 tests par accord (42) : un nouvel accord est testé automatiquement.

Les 3 vérifications :

1. 6 cases et 6 doigts (virgule oubliée, valeur en trop) ;
2. un doigt sur chaque case appuyée, aucun sinon : `expect(chord.fingers[string] !== null).toBe(pressed)` ;
3. **ne joue que les notes de l'accord** — l'idée de E (calculer les notes jouées et les comparer à la
   théorie : majeur = +0 +4 +7, mineur = +0 +3 +7 demi-tons, partie musicale fournie) :

```ts
const played = notesOfFrets(chord.frets).filter((note) => note !== null)
expect(new Set(played)).toEqual(new Set(expectedNotes(chord.name)))
```

**`Set`** (ensemble) : **sans doublons ni ordre** — `Do Mi Sol Do Mi` → `{Do, Mi, Sol}`.

**Casser exprès** pour prouver que le test peut échouer (un test toujours vert ne protège de rien).
Expérience : Do `[null, 3, 3, 0, 1, 0]` → `npm test` rouge :
`expected Set{ 'Do', 'Fa', 'Sol', 'Mi' } to deeply equal Set{ 'Do', 'Mi', 'Sol' }` ; `- Expected` =
attendu, `+ Received` = reçu : le **Fa en trop** (corde de Ré case 3 = 53 = Fa). Remis → tout vert.

`npm` s'exécute dans le dossier affiché avant `>` dans PowerShell : lancé depuis le dossier Lorthan,
il affichait « no test specified ».

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Modélisation | Concevoir le format des données avant de coder |
| Donnée source / dérivée | Ce qu'on stocke / ce qu'on recalcule à partir de la source |
| Une seule source de vérité | Ne stocker qu'une fois chaque information |
| Paramètre par défaut | Valeur prise si l'appelant n'en donne pas |
| Bug silencieux | Résultat faux sans aucun message d'erreur |
| Enharmonique | Même son, nom différent (Ré# = Mi♭) |
| Test automatique | Programme qui vérifie le code à notre place |
| Vitest | Lanceur de tests pour les projets Vite |
| Dépendance de développement | Outil pour les développeurs, absent de l'appli en ligne |
| `describe` / `it` / `expect` | Groupe de tests / un test / une attente |
| Matcher | Ce qu'on attend d'une valeur (`toBe`, `toEqual`, `toHaveLength`) |
| `Set` | Ensemble : pas de doublons, pas d'ordre |

## Quiz

1. Pourquoi `0` (à vide) et `null` (non jouée) plutôt que `'o'` et `'x'` ? Deux raisons.
2. Pourquoi un tableau plutôt qu'un objet avec une clé par corde ?
3. Comment le dessin saura-t-il qu'il y a un barré ? Nom du principe ?
4. Second argument de `frets.map((fret, string) => ...)` ? `notesOfFrets(frets)` sans accordage ?
5. À quoi sert un test ? `describe`, `it`, `expect` ? Pourquoi casser exprès le Do ?

Rattrapage (console) :

- A. `['Mi', 'La', 'Ré'].map((corde, position) => position)` ?
- B. `function accorder(cordes = 6)` : `accorder()` et `accorder(4)` ?
- C. `45 + 0` et `45 + 'o'` ?
- D. `({ mi: 0, la: 2, mi: 3 })` ?
- E. Nom du principe de la question 3 ; pourquoi casser un test exprès ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Un seul type vérifié par TypeScript (pas de mélange lettres/nombres) ; le calcul marche sans cas
   particulier (`accordage + 0` = note à vide, `null` = pas de note).
2. Deux cordes s'appellent Mi (une clé ne peut exister qu'une fois) ; ordre fixe aligné sur
   l'accordage ; marche pour 4 cordes ; facile à parcourir avec `map` (méthode des tableaux
   JavaScript, pas de React).
3. Même doigt (1) sur plusieurs cordes à la même case. **Donnée dérivée** : on ne stocke pas ce
   qu'on peut calculer (une seule source de vérité).
4. La **position** de l'élément (0, 1, 2…), pour prendre `tuning[string]`, la corde du même rang.
   Sans accordage : paramètre par défaut `STANDARD_TUNING`.
5. Vérifier automatiquement le code (fautes de frappe dans les données). `describe` regroupe, `it`
   est un test, `expect` + matcher exprime l'attente. Casser exprès prouve que le test sait
   échouer.

- A. `[0, 1, 2]`.
- B. `'6 cordes'`, `'4 cordes'`.
- C. `45` ; `"45o"` : pas d'erreur, un texte → bug silencieux.
- D. `{ mi: 3, la: 2 }` : la seconde clé `mi` écrase la première.
- E. Donnée dérivée ; un test qui ne peut pas échouer ne sert à rien.

</details>

## Points à retravailler (E)

- `map` est une méthode des **tableaux JavaScript**, pas de React.
- Second argument de `map` = **position** (un nombre), pas une coordonnée de bataille navale.
- **Donnée dérivée** : savoir l'expliquer avec l'image date de naissance / âge.
- Répondre à **toutes** les parties d'une question (paramètre par défaut oublié).
- Vérifier le dossier affiché avant `>` avant de lancer `npm`.

## Questions possibles à l'oral

- **Comment avez-vous représenté un accord ?** Un nom, un tableau de 6 cases (`0` à vide, `null` non
  jouée) de la corde grave à l'aiguë, et un tableau des doigts ; c'est la notation `x32010`.
- **Et le barré ?** Pas stocké : déduit du même doigt sur plusieurs cordes à la même case (donnée
  dérivée, une seule source de vérité).
- **Comment êtes-vous sûrs que vos accords sont justes ?** Un test Vitest calcule les notes jouées
  (accordage MIDI + case) et vérifie qu'elles correspondent à la théorie (majeur, mineur) ; on l'a
  vu échouer sur une faute volontaire.
- **Avez-vous des tests ?** Oui, 42 tests sur le dictionnaire, lancés avec `npm test`.
- **Pourquoi Vitest ?** Fait pour Vite, lit le TypeScript sans configuration.
