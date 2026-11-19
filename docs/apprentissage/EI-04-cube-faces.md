# EI-04 — Les faces du cube : leur nom, et le cube qui suit l'adresse

- **Date** : 19/11/2026
- **Auteur** : I (partie commune E + I)
- **Fichiers touchés** : `src/components/ui/Layout.tsx`, `src/components/3d/Scene.tsx`,
  `src/components/3d/Cube.tsx`

> ⚠️ **Quiz pas encore fait** (sauté exceptionnellement le 19/11 pour avancer) : à faire avant la
> soutenance. Ne pas considérer cette étape comme comprise tant que le quiz n'est pas réussi.

## Ce qu'on a fait et pourquoi

Étapes 1 et 2 du cube. Chaque face porte **son nom**, et quand on clique sur un lien de la barre, le
cube se tourne pour montrer **la face de l'adresse** devant la caméra, d'un coup, **sans
animation**. L'animation douce (étape 3) et le clic sur les faces (étape 4) sont pour E.

## Le code expliqué

### Les axes en 3D

x vers la **droite**, y vers le **haut**, z **vers nous** (hors de l'écran). Les angles sont en
**radians** : `Math.PI` = 180° (demi-tour), `Math.PI / 2` = 90° (quart de tour).

### src/components/ui/Layout.tsx — la caméra en face

```tsx
<Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
```

Avant `[5, 4, 6]` (de biais, trois faces visibles) ; maintenant pile en face sur l'axe z : on voit
une seule face, celle tournée vers +z.

### src/components/3d/Scene.tsx — plus d'OrbitControls

`OrbitControls` permettait de tourner le cube à la souris. C'est maintenant **l'adresse** qui décide
de la face montrée : une rotation à la main se désynchroniserait de l'adresse.

### src/components/3d/Cube.tsx — étape 1 : un nom par face

```tsx
type Vector3 = [number, number, number]

const HALF = 1.5
const GAP = 0.01
```

- `Vector3` : un **tuple** (tableau de taille fixe : x, y, z).
- `HALF` : chaque face est à 1,5 du centre (cube de 3, `args={[HALF * 2, …]}`).
- `GAP` : le texte est décollé de 0,01. Sans lui, texte et face seraient au même endroit : la carte
  graphique ne sait pas lequel dessiner devant → **scintillement** (*z-fighting*).

```tsx
const LABEL_PLACEMENTS: Record<FaceId, { position: Vector3; rotation: Vector3 }> = {
  tuner: { position: [0, 0, HALF + GAP], rotation: [0, 0, 0] },
  tabs: { position: [HALF + GAP, 0, 0], rotation: [0, Math.PI / 2, 0] },
  metronome: { position: [0, 0, -(HALF + GAP)], rotation: [0, Math.PI, 0] },
  chords: { position: [-(HALF + GAP), 0, 0], rotation: [0, -Math.PI / 2, 0] },
  notebook: { position: [0, HALF + GAP, 0], rotation: [-Math.PI / 2, 0, 0] },
  settings: { position: [0, -(HALF + GAP), 0], rotation: [Math.PI / 2, 0, 0] },
}
```

Pour chaque face : où poser son nom et comment le tourner pour qu'il regarde vers l'extérieur.
Accordeur devant (+z), Tablatures à droite (+x), Métronome derrière (−z), Accords à gauche (−x),
Carnet dessus (+y), Réglages dessous (−y). `Record<FaceId, …>` : aucune face oubliée (I-03).

```tsx
{FACES.map((face) => (
  <Text key={face.id} position={…} rotation={…} fontSize={0.4}
    color="#ffffff" outlineWidth={0.02} outlineColor="#000000">
    {face.label}
  </Text>
))}
```

- `<Text>` (drei) : du texte dans la scène 3D. Il charge une police depuis Internet au premier
  affichage.
- `FACES` : la seule liste des faces (EI-01) → mêmes noms que la barre.
- Blanc avec contour noir : lisible sur les trois matières.

### src/components/3d/Cube.tsx — étape 2 : la face de l'adresse

```tsx
const FACE_ROTATIONS: Record<FaceId, [number, number]> = {
  tuner: [0, 0],
  tabs: [0, -Math.PI / 2],
  metronome: [0, Math.PI],
  chords: [0, Math.PI / 2],
  notebook: [Math.PI / 2, 0],
  settings: [-Math.PI / 2, 0],
}
```

Rotation `[x, y]` du cube entier qui amène chaque face devant la caméra : Tablatures (droite) → quart
de tour vers la gauche autour de l'axe vertical ; Métronome (derrière) → demi-tour ; Carnet (dessus)
→ bascule vers l'avant autour de l'axe horizontal. Vérifié par calcul : pour les 6 faces, le nom
arrive devant, à l'endroit, tourné vers la caméra.

```tsx
const location = useLocation()
const activeFace = FACES.find((face) => face.path === location.pathname)
const [rotationX, rotationY] = FACE_ROTATIONS[activeFace?.id ?? 'tuner']
```

- `useLocation()` (React Router) : l'adresse actuelle ; `location.pathname` = `'/metronome'`…
- `.find()` : le **premier** élément qui vérifie la condition, ou `undefined` (cousin de `.filter`).
- `?.` (chaînage optionnel) : `.id` seulement si `activeFace` existe, sinon `undefined`.
- `?? 'tuner'` : page 404 → on garde l'Accordeur.
- `const [rotationX, rotationY] = …` : déstructuration de tableau.

```tsx
<group rotation={[rotationX, rotationY, 0]}>
  <mesh>…</mesh>
  {FACES.map(…)}
</group>
```

- `<group>` : conteneur 3D invisible ; le cube et ses textes tournent ensemble.
- **Donnée dérivée** : la rotation est calculée à partir de l'adresse, aucun nouveau state.
  L'adresse est la source de vérité (EI-01) ; un state séparé pourrait se désynchroniser (bouton
  Précédent, lien partagé, rechargement).

Circuit : clic sur « Métronome » → `NavLink` change l'adresse en `/metronome` → `useLocation()` la
donne au cube → `.find` trouve `metronome` → `[0, π]` → demi-tour du groupe. `useLocation()` marche
dans le `<Canvas>` : React Three Fiber transmet les contexts de l'extérieur (dont celui du routeur).

À savoir : le panneau d'outils s'affiche par-dessus le centre de l'écran et peut cacher une partie
de la face, tant que les outils ne sont pas projetés sur le cube.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Axes x, y, z | Droite, haut, vers nous |
| Radian | Unité d'angle : `Math.PI` = 180°, `Math.PI / 2` = 90° |
| Tuple | Tableau de taille fixe, ex. `[number, number, number]` |
| `<group>` | Conteneur 3D invisible : son contenu bouge et tourne ensemble |
| `<Text>` (drei) | Texte affiché dans la scène 3D |
| `useLocation()` | L'adresse actuelle (`location.pathname`) |
| `.find()` | Premier élément qui vérifie la condition, ou `undefined` |
| `?.` | Chaînage optionnel |
| Donnée dérivée | Valeur calculée à partir d'une autre, sans state à elle |
| Z-fighting | Scintillement de deux surfaces exactement au même endroit |

## Quiz

1. On enlève `GAP` et on pose les textes pile à `HALF` : que risque-t-on de voir, pourquoi ?
2. Pourquoi la rotation est-elle calculée à partir de l'adresse plutôt que rangée dans un
   `useState` ? Un cas concret où un state séparé poserait problème.
3. Adresse `/guitare` (404) : quelle face le cube montre-t-il, et quelles deux écritures de
   `FACE_ROTATIONS[activeFace?.id ?? 'tuner']` évitent que ça plante ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Du scintillement (*z-fighting*) : texte et face sont au même endroit, la carte graphique hésite
   sur lequel dessiner devant, le texte apparaît et disparaît par morceaux.
2. L'adresse est déjà la source de vérité : la rotation en est une donnée dérivée. Un state séparé
   pourrait ne pas suivre l'adresse : bouton Précédent, lien partagé vers `/carnet`, rechargement →
   l'adresse change mais pas le state, le cube montrerait la mauvaise face.
3. L'Accordeur. `.find` renvoie `undefined` : `?.` évite de lire `.id` sur `undefined` (erreur), et
   `?? 'tuner'` donne une face par défaut au lieu de `FACE_ROTATIONS[undefined]`.

</details>

## Points à retravailler (I)

- **Quiz à faire** (sauté le 19/11).

## Questions possibles à l'oral

- **Comment le cube sait-il quelle face montrer ?** Il lit l'adresse avec `useLocation()`, retrouve
  la face dans `FACES`, et applique la rotation correspondante au groupe.
- **Pourquoi pas de state pour la rotation ?** C'est une donnée dérivée de l'adresse : un seul
  endroit de vérité, pas de désynchronisation.
- **Pourquoi avoir retiré OrbitControls ?** Le cube est piloté par l'adresse ; une rotation à la
  main le désynchroniserait.
- **Pourquoi les textes sont-ils décollés de la surface ?** Pour éviter le z-fighting.
