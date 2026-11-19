# EI-03 — Le cube change de matière (plastique, bois, métal)

- **Date** : 19/11/2026
- **Auteur** : I (partie commune E + I : `Cube.tsx`)
- **Fichiers touchés** : `src/components/3d/Cube.tsx`

## Ce qu'on a fait et pourquoi

Quand on choisit « Bois » ou « Métal » dans les Réglages (EI-02), le cube change d'apparence
**immédiatement**. Un seul fichier : le cube lit la matière dans le context avec `useSettings()`.

## Le code expliqué

### src/components/3d/Cube.tsx

```tsx
const MATERIALS: Record<CubeMaterial, { color: string; metalness: number; roughness: number }> = {
  plastique: { color: '#888888', metalness: 0, roughness: 0.5 },
  bois: { color: '#8b5a2b', metalness: 0, roughness: 0.8 },
  metal: { color: '#c0c0c0', metalness: 0.8, roughness: 0.3 },
}
```

- Dictionnaire, comme `TOOLS` (I-03) : matière → réglages 3D. `Record<CubeMaterial, …>` oblige à
  décrire les trois matières (une matière oubliée = erreur TypeScript).
- `color` : couleur hexadécimale `#rrggbb` (rouge, vert, bleu de 00 à ff) ; `#8b5a2b` = brun.
- `metalness` (0 à 1) : à quel point la surface est métallique.
- `roughness` (0 à 1) : 0 = miroir lisse, 1 = mat.

| | `color` | `metalness` | `roughness` | Résultat |
| --- | --- | --- | --- | --- |
| Plastique | gris `#888888` (comme avant) | 0 | 0,5 | mat-satiné |
| Bois | brun `#8b5a2b` | 0 | 0,8 | brun très mat |
| Métal | argent `#c0c0c0` | 0,8 | 0,3 | brillant, reflet net |

Pourquoi `metalness: 0.8` et pas 1 : un métal pur ne reflète que son **environnement** ; notre scène
n'en a pas (fond noir, deux lampes) → il paraîtrait presque noir. À 0,8 il garde un peu de sa
couleur. Un vrai métal brillant demanderait `<Environment>` de drei dans `Scene.tsx` (à voir avec E).

```tsx
export default function Cube() {
  const { settings } = useSettings()
  const material = MATERIALS[settings.cubeMaterial]

  return (
    <mesh>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial
        color={material.color}
        metalness={material.metalness}
        roughness={material.roughness}
      />
    </mesh>
  )
}
```

- `useSettings()` : le cube récupère seulement `settings` — il **lit** le réglage, il ne le change
  pas, donc pas besoin de `dispatch`.
- `MATERIALS[settings.cubeMaterial]` : même geste que `TOOLS[activeFace]` (I-03).
- Les trois valeurs sont passées au matériau (avant : `color="#888"` en dur).

### Pourquoi le changement est immédiat

Choix « Métal » → `dispatch` → reducer → `settings` change dans le Provider → tous les composants
qui utilisent `useSettings()` se redessinent, dont le **cube**, jamais démonté → il relit la matière.
Différence avec I-12 : le métronome ne lisait `localStorage` qu'à son montage. Le `<Canvas>` de React
Three Fiber transmet automatiquement les contexts de l'extérieur : `useSettings()` marche dans la
scène 3D.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `metalness` | À quel point la surface est métallique (0 = pas du tout, 1 = métal pur) |
| `roughness` | Rugosité : 0 = miroir, 1 = complètement mat |
| Couleur hexadécimale | `#rrggbb` : quantités de rouge, vert, bleu |
| Environnement (3D) | L'image d'ambiance qu'un métal reflète ; absente de notre scène |

## Quiz

1. Pourquoi le cube change-t-il immédiatement, alors que le métronome (I-12) ne voit le tempo par
   défaut qu'à son prochain démarrage ?
2. E ajoute `'pierre'` à `CubeMaterial` sans l'ajouter dans `MATERIALS` : que se passe-t-il, quand,
   quelle étape l'a appris ?
3. Pourquoi le cube récupère-t-il seulement `settings` et pas `dispatch` ?
4. `metalness: 1` pour le métal : à quoi ressemble le cube, pourquoi ?
5. Différence entre bois et plastique ; pourquoi le bois paraît-il plus mat ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Le cube n'est jamais démonté et il est connecté au context : quand `settings` change dans le
   Provider, React le redessine. Le métronome passait par `localStorage` sans context et ne lisait
   la valeur qu'à son montage.
2. Erreur TypeScript : `Record<CubeMaterial, …>` exige toutes les valeurs du type union. Éditeur,
   `typecheck`, `build` (pas `npm run dev`). Appris en I-03 (`TOOLS`).
3. Il ne fait que lire la matière pour l'afficher, il ne modifie jamais les réglages.
4. Presque noir avec un petit reflet des lampes : un métal pur ne reflète que son environnement, et
   la scène n'en a pas.
5. Même `metalness: 0` ; couleur différente (brun / gris) et `roughness` plus élevée pour le bois
   (0,8 contre 0,5) : plus proche de 1 = plus mat.

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots.

- Q2 : préciser que `npm run dev` ne vérifie pas les types.

## Questions possibles à l'oral

- **Comment le cube sait-il quelle matière afficher ?** Il lit `settings.cubeMaterial` avec
  `useSettings()` et cherche les réglages 3D dans le dictionnaire `MATERIALS`.
- **Pourquoi un context ici et pas `localStorage` comme pour le métronome ?** Le cube reste affiché
  en permanence et doit changer en direct ; il est lu par un composant éloigné de la page Réglages.
- **Que règlent `metalness` et `roughness` ?** L'aspect métallique et la rugosité (brillant ou mat).
- **Pourquoi le métal n'est-il pas à 1 ?** Sans environnement à refléter, il paraîtrait noir.
