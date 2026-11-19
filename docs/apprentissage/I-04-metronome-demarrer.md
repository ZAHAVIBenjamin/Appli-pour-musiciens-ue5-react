# I-04 — Métronome : démarrer, arrêter, jouer les clics

- **Date** : 28/10/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Un bouton **Démarrer / Arrêter** qui joue un clic à chaque battement, à un tempo fixe de 120 BPM.
Le son vient de `playClick` (moteur audio de E, fiche E-01), importé sans être modifié.

On découvre les deux hooks les plus importants de React : `useState` (un état **local** au
composant) et `useEffect` (une action **hors de l'affichage**, ici un minuteur), avec sa **fonction
de nettoyage**.

On utilise volontairement `setInterval`, simple mais imprécis : le rythme précis viendra en I-06
(c'est pour ça que `playClick` accepte un paramètre `time`). Réglage du BPM : I-05.

## Le code expliqué

### src/components/tools/FaceMetronome.tsx — la face du métronome

```tsx
import { useEffect, useState } from 'react'
import { playClick } from '../../services/audioEngine'

const BPM = 120 // battements par minute (fixe pour l'instant)
```

- On importe deux hooks de React et la fonction de E qui joue un clic.
- **BPM** (*beats per minute*) = battements par minute. 120 BPM = 2 clics par seconde.
- Constante (ne change jamais), en majuscules, déclarée hors du composant (comme `FACES`, I-02).

```tsx
const [isPlaying, setIsPlaying] = useState(false)
```

- `useState` crée un **état local** : une donnée qui appartient à **ce composant seulement** et le
  redessine quand elle change.
- Il renvoie la valeur (`isPlaying`) et la fonction qui la change (`setIsPlaying`) ; les crochets
  les récupèrent d'un coup. `false` = valeur de départ (arrêté).
- Même principe que le store (donnée + fonction de modification), mais en **local**.
- **Pourquoi pas dans le store ?** Seul le métronome a besoin de savoir s'il tourne : rien n'est
  partagé. Le store sert aux données **partagées** (I-01).

```tsx
useEffect(() => {
  if (!isPlaying) {
    return
  }

  const beatDuration = 60000 / BPM // durée d'un battement, en millisecondes
  playClick() // premier clic tout de suite
  const timerId = setInterval(() => playClick(), beatDuration)

  // Nettoyage : appelé à l'arrêt, ou quand le composant disparaît de l'écran
  return () => clearInterval(timerId)
}, [isPlaying])
```

- `useEffect` : faire une action **en dehors de l'affichage** (minuteur, son, API) = un **effet de
  bord**.
- `[isPlaying]` = **tableau de dépendances** : React relance l'effet à chaque changement de
  `isPlaying` (chaque clic sur Démarrer / Arrêter).
- `!isPlaying` : `!` = « non ». Arrêté → on sort sans rien faire.
- `60000 / BPM` : une minute = 60 000 ms ; à 120 BPM un battement dure 500 ms.
- `playClick()` avant `setInterval` : premier clic **immédiat**, sinon 500 ms de silence au départ.
- `setInterval(fonction, délai)` : appelle `fonction` toutes les `délai` ms, en boucle. Renvoie un
  numéro de minuteur (`timerId`). `() => playClick()` : on **donne** une fonction (le post-it de
  I-02), on ne l'appelle pas tout de suite.
- `return () => clearInterval(timerId)` = **fonction de nettoyage** : React l'appelle **avant de
  relancer l'effet** et **quand le composant est démonté** (retiré de l'écran). `clearInterval`
  arrête le minuteur.

```tsx
<div>
  <h2>Métronome</h2>
  <p>{BPM} BPM</p>
  <button onClick={() => setIsPlaying(!isPlaying)}>
    {isPlaying ? 'Arrêter' : 'Démarrer'}
  </button>
</div>
```

- `setIsPlaying(!isPlaying)` **inverse** la valeur.
- **Ternaire** `condition ? A : B` = « si… sinon » en une ligne.
- `<div>` regroupe le tout : un composant renvoie un seul élément.

### Le circuit d'un clic sur Démarrer puis Arrêter

1. `setIsPlaying(true)` → le composant se redessine, le bouton affiche « Arrêter ».
2. `isPlaying` a changé → React relance l'effet : premier clic, puis un clic toutes les 500 ms.
3. Clic sur Arrêter → `isPlaying` passe à `false` → React appelle d'abord le **nettoyage**
   (`clearInterval`) → les clics s'arrêtent → l'effet relancé sort au `if (!isPlaying)`.

### Limite volontaire

`setInterval` n'est pas précis : le navigateur peut le retarder de quelques millisecondes (onglet
occupé ou en arrière-plan). Audible sur un métronome → corrigé en I-06.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| BPM | Battements par minute (120 BPM = 2 clics par seconde) |
| `useState` | Hook qui crée un état **local** : la valeur + sa fonction de modification |
| `useEffect` | Hook pour une action **hors de l'affichage** (minuteur, son, API…) |
| Effet de bord | Action qui agit sur le monde extérieur au composant |
| Tableau de dépendances | `[isPlaying]` : l'effet est relancé quand ces valeurs changent |
| Fonction de nettoyage | Renvoyée par l'effet ; appelée avant de le relancer ou au démontage |
| Démonter | Retirer un composant de l'écran (React appelle alors ses nettoyages) |
| `setInterval` / `clearInterval` | Lancer une fonction en boucle toutes les X ms / arrêter cette boucle |
| Fuite | Ressource lancée (minuteur, micro…) qu'on ne libère jamais |
| ms | Milliseconde : 1/1000 de seconde |
| `!` | « Non » : inverse un booléen |
| Ternaire `a ? b : c` | « Si a, alors b, sinon c », en une ligne |

## Quiz

1. À 60 BPM, combien vaut `beatDuration` ? Et à 90 BPM ? Montrer le calcul.
2. On démarre le métronome puis on clique sur « Carnet » : les clics continuent-ils ? Pourquoi ?
3. On supprime `return () => clearInterval(timerId)`. On clique sur Démarrer, puis Arrêter : que se
   passe-t-il ?
4. Pourquoi `isPlaying` est-il dans un `useState` et pas dans le store Zustand ?
5. Que changerait la suppression de `playClick() // premier clic tout de suite` ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. 60 000 / 60 = 1000 ms (1 s) ; 60 000 / 90 ≈ 667 ms (deux tiers de seconde).
2. Non. `activeFace` devient `'notebook'`, donc dans `ToolPanel` `Tool` devient
   `FacePracticeNotebook`. `FaceMetronome` n'est plus affiché : React le **démonte** et appelle
   juste avant la fonction de nettoyage, `clearInterval(timerId)`. Plus de minuteur, plus de clics.
3. Les clics continuent : le minuteur n'est jamais arrêté. Pire : un nouveau Démarrer crée un
   **deuxième** minuteur qui s'ajoute au premier → clics en double (**fuite**).
4. Donnée locale : seul le métronome a besoin de savoir s'il tourne, rien n'est partagé.
5. Silence au départ : le premier clic n'arriverait qu'après un délai complet (500 ms à 120 BPM).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec ces précisions :

- Sans nettoyage, le problème ne s'arrête pas au son qui continue : chaque Démarrer **ajoute** un
  minuteur (fuite, clics en double).
- Question de conception à garder en tête : faut-il que le métronome continue quand on change de
  face (par exemple pour lire une tablature en rythme) ? Si oui, `isPlaying` devient une donnée
  partagée → à déplacer dans le store.

## Questions possibles à l'oral

- **Différence entre `useState` et le store Zustand ?** Même principe (donnée + fonction de
  modification) ; `useState` est local à un composant, le store est partagé par toute l'appli.
- **À quoi sert `useEffect` ici ?** À lancer et arrêter le minuteur des clics, une action hors de
  l'affichage, quand `isPlaying` change.
- **Pourquoi une fonction de nettoyage ?** Pour arrêter le minuteur à l'arrêt et au démontage ;
  sans elle, les minuteurs s'accumulent.
- **Pourquoi le métronome s'arrête-t-il quand on change de face ?** `FaceMetronome` est démonté par
  `ToolPanel`, React appelle le nettoyage.
- **Pourquoi `setInterval` n'est pas suffisant pour un vrai métronome ?** Il peut être retardé par
  le navigateur ; on le remplace en I-06 par une programmation précise sur l'horloge audio.
