# EI-06 — Le cube : rotation animée, clic et glissement (côté React)

- **Date** : 19/11/2026 (code) → 22/11/2026 (fiche, séance de révision R2)
- **Auteur** : E + I (étapes 1-2 par I, fiche EI-04 ; étapes 3-4 par E)
- **Fichiers touchés** : `src/components/3d/Cube.tsx`, `src/components/3d/Scene.tsx`,
  `src/components/ui/Layout.tsx`, `src/index.css`

## Ce qu'on a fait et pourquoi

Le cube montre la face de l'outil affiché, **tourne en douceur** quand on change de face, et on peut
changer de face de **trois façons** : la barre de liens, un **clic** sur une face visible, ou en
**faisant glisser** le cube (souris ou doigt). Les trois ne font qu'une chose : **changer l'adresse**.
Le cube suit l'adresse.

Ce qui compte pour le jury n'est pas la 3D, mais **le choix des hooks React**.

## Le code expliqué (ce qui relève de React)

### 1. La face active : un état dérivé de l'adresse

```tsx
const location = useLocation()
const activeFace = FACES.find((face) => face.path === location.pathname)
```

- **Pas de `useState`** : la face se **calcule** à partir de l'adresse (chapitre 4 : « puis-je le
  calculer ? si oui, pas de state »).
- **Une seule source de vérité** : l'adresse. Lien, clic ou glissement → `navigate(...)` → l'adresse
  change → le cube suit. Impossible que le cube et la barre se contredisent.

### 2. L'animation : `useRef` plutôt que `useState`

```tsx
const groupRef = useRef<Group>(null)
useFrame((_, delta) => {
  const group = groupRef.current
  group.rotation.y = MathUtils.damp(group.rotation.y, targetY, ROTATION_SPEED, delta)
})
return <group ref={groupRef}>...</group>
```

| | `useState` | `useRef` |
| --- | --- | --- |
| Modifier la valeur | provoque un **nouveau rendu** | **aucun rendu** |
| À utiliser pour | ce qui change l'affichage React | une animation, un minuteur, un élément du DOM ou de la 3D |

- Un `setRotation` 60 fois par seconde = **60 rendus par seconde** du composant, pour rien.
- `useRef` donne une **poignée** vers l'objet 3D : on change sa rotation directement.
- `useFrame` (React Three Fiber) appelle la fonction **à chaque image**, comme la boucle
  `requestAnimationFrame` de l'accordeur (E-04).
- `closestAngle` : parmi les angles équivalents (un tour = 2π), prend le plus proche → le cube tourne
  par le chemin le plus court.

### 3. Le glissement : `useEffect`, écouteurs et cleanup

```tsx
useEffect(() => {
  window.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('pointerup', handlePointerUp)
  return () => {
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('pointerup', handlePointerUp)
  }
}, [shownFace, navigate])
```

- **Système extérieur** : la fenêtre du navigateur (`window`) et ses écouteurs → `useEffect`
  (chapitre 5 : un effet **synchronise** avec l'extérieur ; réagir à un clic, c'est le rôle d'un
  gestionnaire d'événement).
- **Pas dans le corps du composant** : le corps s'exécute **à chaque rendu** (pas seulement au
  montage) et doit rester **pur** (chapitre 7).
- **Le cleanup** retire les écouteurs. Sans lui, ils **s'accumulent** à chaque relance de l'effet
  (5 changements de face = 5 écouteurs, un glissement ferait 5 navigations) et survivent au
  démontage : **fuite**.
- **Les dépendances** : la fonction de l'effet garde une **« photo »** des valeurs du rendu où elle a
  été créée. Sans `shownFace` dans la liste, l'écouteur croirait toujours être sur la première face.
  **Règle d'or** : toute valeur lue dans l'effet est dans les dépendances (outil `exhaustive-deps`).
  Même chose pour le métronome de Bilal : sans `bpm`, il garderait l'ancien tempo.
- Même construction que l'exemple du cours « Échap vide la recherche » (chapitre 5).
- Les contrôles des outils (curseur, champ, bouton) ne déclenchent pas de glissement.

### 4. Le clic sur une face

```tsx
function handleClick(event: ThreeEvent<MouseEvent>) {
  if (event.delta > 5) return // la souris a bougé : c'était un glissement
  const face = FACES.find((f) => f.id === SIDE_TO_FACE[event.face.materialIndex])
  navigate(face.path)
}
```

Un **gestionnaire d'événement** (pas d'effet) : l'action vient de l'utilisateur. Il ne fait que
`navigate` (chapitre 3).

### 5. Le cadrage sur téléphone (`Scene.tsx`)

`useThree` donne la caméra et la taille de l'écran ; un `useEffect` relancé quand la taille change
recule la caméra sur un écran étroit, pour que le cube tienne en largeur.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| État dérivé | Valeur calculée pendant le rendu à partir des props ou du state, jamais stockée |
| Rendu | Chaque exécution du composant par React (après chaque setState, changement de prop...) |
| Montage / démontage | Apparition / disparition du composant à l'écran (une fois chacun) |
| `useRef` | Mémorise une valeur sans provoquer de rendu |
| Cleanup | Fonction renvoyée par l'effet ; React l'appelle avant de relancer l'effet et au démontage |
| Fuite | Ressource (écouteur, minuteur) jamais libérée, qui s'accumule |
| Dépendances | Valeurs dont le changement relance l'effet : toutes celles lues dans l'effet |
| `useFrame` | Hook de React Three Fiber appelé à chaque image |

## Quiz (séance R2)

1. Pourquoi pas de `useState` pour la face active ? D'où vient-elle ?
2. Que se passerait-il avec un `setRotation` 60 fois par seconde ?
3. Pourquoi les écouteurs du glissement sont-ils dans un `useEffect` ? Et sans le cleanup ?

Rattrapage :

- e. `setState` provoque un nouveau ___ ; pour modifier sans en provoquer : ___.
- f. Le corps d'un composant doit rester ___ ; il s'exécute à chaque ___.
- g. Sans cleanup, un écouteur de plus s'___ à chaque changement de face : c'est une ___.
- h. Pourquoi `[shownFace, navigate]` ? Et le métronome sans `bpm` dans ses dépendances ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Elle est dérivée de l'adresse (`useLocation`) : une seule source de vérité.
2. 60 rendus par seconde pour rien ; `useRef` modifie l'objet 3D sans rendu.
3. La fenêtre est un système extérieur ; le corps du composant doit rester pur et s'exécute à chaque
   rendu. Sans cleanup : écouteurs accumulés (fuite), plusieurs navigations par glissement.

- e. rendu ; `useRef`.
- f. pur ; rendu (pas montage).
- g. ajoute ; fuite.
- h. L'effet lit `shownFace` : sans lui, sa « photo » resterait sur la première face. Le métronome
  garderait l'ancien tempo.

</details>

## Points à retravailler (E)

- **B.R.O.L. avec les 4 verbes** : lit / choisit / affiche / garde.
- `useEffect` **synchronise** (≠ réagir, qui est le rôle des gestionnaires d'événement).
- **Rendu ≠ montage**.
- `useState` redessine, `useRef` mémorise sans redessiner.
- Définition de l'**état dérivé** (calculé, jamais stocké) et un exemple.

## Questions possibles à l'oral

- **Comment le cube sait-il quelle face montrer ?** Elle est dérivée de l'adresse avec
  `useLocation` ; lien, clic et glissement ne font que changer l'adresse.
- **Pourquoi `useRef` pour l'animation ?** Pour modifier la rotation 60 fois par seconde sans
  provoquer 60 rendus.
- **Comment évitez-vous les fuites d'écouteurs ?** Le `useEffect` du glissement renvoie un cleanup
  qui retire les écouteurs avant chaque relance et au démontage.
- **Pourquoi ces dépendances ?** Toute valeur lue dans l'effet doit y être, sinon l'effet travaille
  avec une valeur périmée.
