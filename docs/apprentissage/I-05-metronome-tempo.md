# I-05 — Métronome : régler le tempo avec un curseur

- **Date** : 30/10/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Le tempo n'est plus fixe : un **curseur** permet de le choisir entre 40 et 220 BPM. Si le métronome
tourne, la vitesse change en direct. On découvre le **champ contrôlé** : la valeur affichée par le
curseur est imposée par un état React, qui devient la **seule source de vérité** (le texte, le
curseur et la vitesse des clics lisent tous le même `bpm`).

## Le code expliqué

### src/components/tools/FaceMetronome.tsx — ce qui change par rapport à I-04

```tsx
const MIN_BPM = 40
const MAX_BPM = 220
...
const [bpm, setBpm] = useState(120)
```

- La constante `BPM` devient un **état** `bpm` : l'utilisateur la change pendant que l'appli tourne
  et l'écran doit se mettre à jour.
- Règle : valeur qui **change** et **met à jour l'écran** → état ; valeur qui ne change jamais →
  constante.
- `MIN_BPM` / `MAX_BPM` : limites du curseur, constantes hors du composant.
- `useState` et pas le store : seul le métronome utilise le tempo (même raison qu'en I-04).

```tsx
<input
  type="range"
  min={MIN_BPM}
  max={MAX_BPM}
  value={bpm}
  onChange={(event) => setBpm(Number(event.target.value))}
/>
```

- `<input type="range">` : curseur natif du navigateur, borné par `min` et `max`.
- `value={bpm}` : la position du curseur est **imposée** par l'état (champ **contrôlé**).
- `onChange` : appelé à chaque mouvement ; React lui passe un objet `event`.
- `event.target` = l'élément qui a déclenché l'événement (le curseur) ; `event.target.value` = sa
  nouvelle valeur, **toujours en texte** (`"121"`).
- `Number(...)` convertit le texte en nombre (`121`), ce qu'attend `setBpm`.

Circuit : on bouge le curseur → `onChange` → `setBpm(121)` → l'état change → le composant se
redessine → `value={bpm}` replace le curseur sur 121, `<p>` affiche « 121 BPM ».

```tsx
const beatDuration = 60000 / bpm
...
}, [isPlaying, bpm])
```

- On calcule avec l'état `bpm`.
- `bpm` est ajouté au **tableau de dépendances** : quand le tempo change pendant que ça tourne,
  React appelle le **nettoyage** (l'ancien minuteur s'arrête) puis relance l'effet (nouveau
  minuteur à la nouvelle vitesse). Sans le nettoyage de I-04, les deux minuteurs cliqueraient
  ensemble.

```tsx
<br />
```

Retour à la ligne : le bouton passe sous le curseur. En JSX, la balise doit être fermée (`<br />`).

### Limite connue

À chaque cran du curseur, l'effet redémarre et joue un clic immédiat : en faisant glisser le
curseur pendant que ça tourne, on entend des clics rapprochés. Corrigé en I-06 (rythme précis).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `<input type="range">` | Curseur natif du navigateur, entre un `min` et un `max` |
| Champ contrôlé | Champ dont la valeur affichée est imposée par un état React (`value={...}`) |
| Source de vérité | L'endroit unique où une donnée est rangée ; tout le reste la lit |
| `onChange` | Fonction appelée à chaque modification du champ |
| `event` | Objet qui décrit l'événement (quel élément, quelle nouvelle valeur…) |
| `event.target.value` | Nouvelle valeur du champ, **toujours en texte** |
| `Number(...)` | Convertit un texte en nombre (`"121"` → `121`) |
| `<br />` | Retour à la ligne |

## Quiz

1. Pourquoi `BPM` est-il devenu un `useState` au lieu de rester une constante ?
2. On oublie `Number(...)` : `setBpm(event.target.value)`. Que se passe-t-il, et à quel moment ?
3. On retire `bpm` du tableau de dépendances (`[isPlaying]`). Le métronome tourne, on passe le
   curseur de 120 à 60 : qu'entend-on, et pourquoi ?
4. On garde `value={bpm}` mais on supprime `onChange`. Que se passe-t-il quand on bouge le curseur ?
5. Le métronome tourne à 120 BPM, on passe à 121 : que fait React avec l'effet, dans l'ordre ?

Rattrapage :

- A. Refaire la question 2 : sans `Number(...)`, que se passe-t-il, et quand l'erreur est-elle
  détectée ?
- B. Avec `npm run dev`, `bpm` vaut le texte `"121"`. Un bouton « +1 » fait `setBpm(bpm + 1)` :
  qu'affiche l'écran ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Le tempo doit pouvoir changer pendant que l'appli tourne et mettre à jour l'écran : c'est un
   état. Une constante ne peut pas changer.
2. `event.target.value` est du texte : on donne `"121"` à `setBpm`, qui attend un `number`.
   TypeScript refuse : souligné dans l'éditeur, échec de `npm run typecheck` et `npm run build`.
   **`npm run dev` laisse passer** : `bpm` vaudrait alors un texte.
3. L'écran affiche 60 (l'état a changé, le composant se redessine), mais on entend toujours
   120 BPM : React ne relance l'effet que si `isPlaying` change ; le minuteur garde le délai
   calculé avec l'ancien tempo.
4. Le curseur reste bloqué : `value={bpm}` le force sur `bpm`, que plus personne ne change. React
   avertit dans la console (champ avec `value` sans `onChange` = lecture seule).
5. `setBpm(121)` → `bpm` change → React voit qu'une dépendance de l'effet a changé → nettoyage
   (`clearInterval` de l'ancien minuteur) → l'effet repart : calcul de `beatDuration` avec 121,
   clic immédiat, nouveau `setInterval`.

- A. Voir 2.
- B. « 1211 » : `+` entre un texte et un nombre **colle** les deux au lieu d'additionner.

</details>

## Points à retravailler (I)

- **Lire la question jusqu'au bout** : la question 2 portait sur l'erreur (sans `Number`), la
  première réponse décrivait le cas qui marche. Rattrapage réussi.
- `npm run dev` ne vérifie pas les types : une erreur TypeScript peut passer inaperçue jusqu'au
  `build` (déjà vu en I-01 et I-02).
- Dans un circuit de mise à jour, partir du **déclencheur** (`setBpm` → dépendance qui change)
  avant de décrire ce que fait l'effet.

## Questions possibles à l'oral

- **Qu'est-ce qu'un champ contrôlé ?** Un champ dont la valeur affichée vient d'un état React ;
  `onChange` met à jour l'état, qui redessine le champ.
- **Pourquoi `Number(event.target.value)` ?** La valeur d'un champ est toujours du texte ; sans
  conversion, `"121" + 1` donnerait `"1211"`.
- **Comment la vitesse change-t-elle en direct ?** `bpm` est dans les dépendances de l'effet : à
  chaque changement, l'ancien minuteur est nettoyé et un nouveau est créé.
- **Pourquoi 40 à 220 BPM ?** Ça couvre la plupart des morceaux, du très lent au très rapide.
