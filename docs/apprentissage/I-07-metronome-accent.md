# I-07 — Métronome : l'accent sur le premier temps

- **Date** : 16/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Un musicien compte « **UN**-deux-trois-quatre ». Le premier temps de chaque mesure sonne maintenant
plus aigu : **TOC** tic tic tic **TOC** tic tic tic… Le son existait déjà : dans
`playClick(accent, time)` (E-01), `accent = true` joue à 1500 Hz au lieu de 1000 Hz. Depuis I-06 on
passait toujours `false` ; il suffit de passer `true` au bon moment.

Un peu de musique : un **temps** = un battement ; une **mesure** = un groupe de temps qui se répète ;
en **4/4** (la plus courante), 4 temps par mesure ; le premier est le **temps fort**.

## Le code expliqué

### src/components/tools/FaceMetronome.tsx — 4 lignes changent par rapport à I-06

```tsx
const BEATS_PER_BAR = 4
```

Nombre de temps par mesure (*beats per bar*), fixe pour l'instant. Le choisir : étape suivante.

```tsx
let beatIndex = 0
```

Compteur de clics depuis le démarrage (0, 1, 2…). `let` car il change à chaque clic ; déclaré
**dans l'effet**, donc il repart à 0 à chaque redémarrage de l'effet.

```tsx
playClick(beatIndex % BEATS_PER_BAR === 0, nextBeatTime)
```

- `%` = **modulo**, le reste de la division : `5 % 4` = 1 (5 = 4 × 1 + 1).
- `beatIndex % 4` compte en boucle 0, 1, 2, 3, 0, 1…

| `beatIndex` | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `beatIndex % 4` | **0** | 1 | 2 | 3 | **0** | 1 | 2 | 3 | **0** |
| On entend | **TOC** | tic | tic | tic | **TOC** | tic | tic | tic | **TOC** |

- `=== 0` vaut `true` un clic sur 4 : ce booléen est passé directement à `playClick`, sans `if`.

```tsx
beatIndex++
```

`++` ajoute 1 (`beatIndex += 1`). Placé **après** `playClick` : le premier clic utilise l'index 0.

**Pourquoi un `let` et pas un `useState` ?** Le compteur n'est pas affiché : il ne sert qu'à la
boucle. Un `useState` redessinerait le composant à chaque clic pour rien (règle de I-05 dans l'autre
sens : ce qui ne met pas l'écran à jour n'a pas besoin d'être un état).

Vérifié par simulation : `TOC tic tic tic TOC tic tic tic`, écart toujours 0,5 s à 120 BPM. Seul le
**tout premier** clic peut partir quelques millisecondes en retard si le navigateur est occupé pile
au démarrage (il sonne alors immédiatement) : inaudible, sans effet sur les suivants.

### Limite connue

Changer le tempo pendant que ça tourne relance l'effet : `beatIndex` repart à 0, le clic suivant est
un TOC même au milieu d'une mesure. Même cause que les clics rapprochés au curseur (I-05, I-06) : le
redémarrage de l'effet. Corriger demanderait de garder l'état de la boucle entre deux redémarrages
(`useRef`, hors chapitres 1 à 7).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Temps | Un battement (un clic) |
| Mesure | Groupe de temps qui se répète (4 en 4/4) |
| Accent / temps fort | Premier temps de la mesure, joué plus aigu |
| `%` (modulo) | Reste de la division : `5 % 4` = 1, `8 % 4` = 0 |
| `++` | Ajoute 1 (`i++` = `i += 1`) |

## Quiz

1. Avec `BEATS_PER_BAR = 4`, que vaut `beatIndex % BEATS_PER_BAR` pour `beatIndex = 9` ? TOC ou
   tic ?
2. Avec `BEATS_PER_BAR = 3`, écrire le motif des 7 premiers clics. Quel rythme ?
3. On oublie `beatIndex++` : qu'entend-on ?
4. On met `beatIndex++` avant `playClick` : que change-t-il pour le premier clic et pour la suite ?
5. Le métronome tourne, on est sur le 3ᵉ temps, on bouge le curseur : le clic suivant est-il un TOC
   ou un tic ? Pourquoi ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. 9 = 4 × 2 + **1** → `9 % 4` = 1 ≠ 0 → tic.
2. TOC tic tic TOC tic tic TOC : rythme à 3 temps, celui de la valse.
3. TOC TOC TOC… en continu : `beatIndex` reste à 0, `0 % 4 === 0` à chaque clic.
4. Le premier clic utilise l'index 1 → tic ; motif décalé : tic tic tic TOC… (accent sur le 4ᵉ
   temps).
5. Un TOC : `bpm` est une dépendance, l'effet redémarre, `beatIndex` repart à 0 — la mesure
   recommence au milieu (limite connue).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai.

- Q5 : savoir présenter la conséquence **musicale** (mesure qui repart au mauvais endroit) et la
  relier à la limite déjà vue (redémarrage de l'effet).

## Questions possibles à l'oral

- **Comment le métronome sait-il quel clic accentuer ?** Un compteur `beatIndex` et le modulo :
  `beatIndex % 4 === 0` est vrai au début de chaque mesure.
- **Pourquoi pas un `useState` pour le compteur ?** Il n'est pas affiché ; un état redessinerait le
  composant à chaque clic.
- **D'où vient le son aigu ?** Du moteur audio de E : `playClick(true, …)` joue à 1500 Hz au lieu de
  1000 Hz.
