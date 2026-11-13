# I-06 — Métronome : un rythme précis grâce à l'horloge audio

- **Date** : 13/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Depuis I-04, `setInterval` **jouait** chaque clic. Or il tourne sur l'horloge de JavaScript, qui
partage son temps avec toute la page (affichage, 3D, clics) : quand le navigateur est occupé, il
prend du retard et le rythme devient irrégulier. Maintenant, le minuteur ne joue plus les clics : il
les **programme à l'avance** sur l'**horloge audio**, gérée à part et très précise, grâce au
paramètre `time` de `playClick(accent, time)` (E-01).

Hors cours React, mais couvert par la ligne « Web Audio API » du README.

Image : avant, on tapait chaque coup à la main (en retard si on est dérangé) ; maintenant on règle
un réveil pour chaque coup, un peu à l'avance.

## Le code expliqué

### Les deux horloges

| | Horloge JavaScript | Horloge audio |
| --- | --- | --- |
| Utilisée par | `setInterval`, `setTimeout` | la Web Audio API (`AudioContext`) |
| Unité | millisecondes | **secondes** |
| Précision | peut être retardée si la page est occupée | très précise, gérée à part |
| Lue avec | (implicite) | `ctx.currentTime` |

### src/components/tools/FaceMetronome.tsx — ce qui change par rapport à I-05

```tsx
import { getAudioContext, playClick } from '../../services/audioEngine'
```

`getAudioContext` (E-01) donne accès à l'horloge audio. Fichier de E importé sans modification.

```tsx
const CHECK_EVERY_MS = 25
const SCHEDULE_AHEAD_S = 0.1
```

- Toutes les 25 ms (horloge JavaScript), on prépare les clics des 100 ms à venir (horloge audio).
- Les suffixes `_MS` / `_S` rappellent l'unité : c'est **le** piège de l'étape.
- Même si le minuteur est retardé jusqu'à ~75 ms, le clic suivant est déjà programmé.

```tsx
const ctx = getAudioContext()
const beatDuration = 60 / bpm
let nextBeatTime = ctx.currentTime + 0.05
```

- `ctx.currentTime` : l'heure actuelle de l'horloge audio, en secondes.
- `60 / bpm` (et plus `60000 / bpm`) : la durée d'un battement en **secondes** (0,5 s à 120 BPM).
- `let` et pas `const` : `nextBeatTime` (l'heure du prochain clic) change à chaque clic programmé.
- Premier clic dans 50 ms : le temps que le premier passage du minuteur le programme.

```tsx
const timerId = setInterval(() => {
  while (nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
    playClick(false, nextBeatTime)
    nextBeatTime += beatDuration
  }
}, CHECK_EVERY_MS)
```

- `while (condition)` : **boucle**, répète son contenu tant que la condition est vraie.
- Condition : « le prochain clic tombe avant maintenant + 100 ms » = il est dans la fenêtre à
  préparer.
- `playClick(false, nextBeatTime)` : pas d'accent (I-07) ; le clic sonnera **exactement** à
  `nextBeatTime`.
- `+=` : ajoute à la valeur actuelle → on passe au battement suivant.
- `while` et pas `if` : si le minuteur a été très retardé, plusieurs clics sont à rattraper.

Exemple à 120 BPM, démarrage à `currentTime` = 10,00 → `nextBeatTime` = 10,05. Passage à 10,025 :
10,05 < 10,125 → clic programmé pour 10,05, `nextBeatTime` = 10,55 ; les passages suivants ne
programment rien jusqu'à celui de ~10,475 (10,55 < 10,575 → clic pour 10,55).

Le nettoyage (`clearInterval`) et les dépendances `[isPlaying, bpm]` ne changent pas.

### Limite connue

En faisant glisser le curseur pendant que ça tourne, l'effet redémarre à chaque cran et le compte
repart à « dans 50 ms » : clics rapprochés pendant le glissement. Corriger demanderait de garder
`nextBeatTime` d'un redémarrage à l'autre (`useRef`, hors cours) : à discuter en binôme.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Horloge audio | Horloge précise de la Web Audio API, en secondes, lue avec `ctx.currentTime` |
| Programmer à l'avance | Dire à l'horloge audio « joue ce son à telle heure » |
| `let` | Variable qu'on peut modifier (contrairement à `const`) |
| `while (condition) { … }` | Boucle : répète son contenu tant que la condition est vraie |
| `+=` | Ajoute à la valeur actuelle (`a += 2` = `a = a + 2`) |

## Quiz

1. Pourquoi `setInterval` seul ne suffit pas pour un métronome ? Qu'est-ce qui rend l'horloge audio
   plus fiable ?
2. On garde `const beatDuration = 60000 / bpm` (millisecondes) alors que `nextBeatTime` est en
   secondes. À 120 BPM, que se passe-t-il ?
3. On écrit `const nextBeatTime` au lieu de `let`. Que se passe-t-il, et quand est-ce détecté ?
4. Le navigateur est bloqué 80 ms, le minuteur passe en retard. Pourquoi le clic suivant sonne-t-il
   quand même à l'heure ?
5. On clique sur Arrêter juste après qu'un clic a été programmé, avant qu'il sonne. L'entend-on ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `setInterval` utilise l'horloge de JavaScript, partagée avec toute la page : si le navigateur est
   occupé, il prend du retard et décale le rythme. L'horloge audio est gérée à part, très précise.
2. On ajoute 500 **secondes** au lieu de 0,5 : le premier clic sonne (à +50 ms), le deuxième est
   programmé plus de 8 minutes plus tard.
3. TypeScript refuse de réassigner une `const` : éditeur, `typecheck`, `build`. Forcé en `npm run
   dev`, `+=` lève une erreur **avant** d'avancer `nextBeatTime` : à chaque passage (25 ms) le même
   clic est reprogrammé → bourdonnement.
4. Les clics sont programmés jusqu'à 100 ms à l'avance : celui qui tombe pendant le blocage a déjà
   été confié à l'horloge audio au passage précédent.
5. Oui : `clearInterval` arrête le minuteur (plus de nouveaux clics programmés), mais n'annule pas
   ceux déjà confiés à l'horloge audio (au plus 100 ms de décalage).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots.

- Unités : horloge JavaScript en **millisecondes**, horloge audio en **secondes** (`60 / bpm`).
- Q3 : une erreur forcée en `dev` peut produire un comportement étrange (bourdonnement), pas
  seulement un « plantage ».

## Questions possibles à l'oral

- **Pourquoi deux horloges ?** L'horloge JavaScript sert à vérifier régulièrement ; l'horloge audio,
  précise, décide du moment exact de chaque clic.
- **Pourquoi programmer 100 ms à l'avance ?** Pour absorber les retards du minuteur JavaScript : le
  clic est déjà programmé quand le retard arrive.
- **Pourquoi un `while` ?** Pour rattraper plusieurs clics si le minuteur a pris beaucoup de retard.
- **Pourquoi pas `useRef` pour corriger les clics rapprochés au glissement du curseur ?** Hors des
  chapitres 1 à 7 ; limite acceptée et signalée.
