# I-03 — Panneau de l'outil actif : afficher la face choisie

- **Date** : 27/10/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/ui/ToolPanel.tsx` (nouveau), `src/App.tsx`, `src/index.css`,
  `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Les 6 composants d'outils (`FaceTuner`, `FaceMetronome`…) existaient, mais aucun n'était affiché.
À terme, chaque outil sera dessiné **sur sa face du cube** (partie 3D, E + I). En attendant, on
ajoute un **panneau provisoire** en HTML, sous la barre de boutons, qui affiche l'outil de la face
active. Le panneau est temporaire, mais les composants d'outils resteront tels quels : il suffira
de les déplacer sur le cube.

C'est la première étape du métronome : sans ce panneau, on ne pourrait pas voir ni tester
`FaceMetronome`.

## Le code expliqué

### src/components/ui/ToolPanel.tsx — choisir l'outil à afficher

```tsx
import type { ComponentType } from 'react'
import { useAppStore, type FaceId } from '../../store/useAppStore'
import FaceTuner from '../tools/FaceTuner'
// ... les 5 autres outils
```

- `ComponentType` : type TypeScript qui veut dire « un composant React ». `import type` : on
  importe seulement un type, qui disparaît du JavaScript final.
- `../tools/` : remonter d'un dossier (`ui` → `components`), puis descendre dans `tools`.
- Les outils de E sont **importés**, pas modifiés.

```tsx
const TOOLS: Record<FaceId, ComponentType> = {
  tuner: FaceTuner,
  tabs: FaceTabs,
  metronome: FaceMetronome,
  chords: FaceChordDictionary,
  notebook: FacePracticeNotebook,
  settings: FaceSettings,
}
```

- Objet utilisé comme **dictionnaire** : à chaque nom de face (clé), il associe le composant à
  afficher (valeur).
- `Record<FaceId, ComponentType>` = un objet avec **une clé pour chaque** `FaceId`, chaque valeur
  étant un composant.
- **Différence avec `FACES` (I-02)** : un tableau typé ne vérifie pas qu'on a listé **toutes** les
  faces ; `Record` l'**exige**. Oublier une face, ou en ajouter une dans `FaceId` sans l'ajouter
  ici → erreur TypeScript.
- `FaceTuner` **sans** `< />` : on range le **composant lui-même** (la recette), pas un élément
  déjà créé.

```tsx
export default function ToolPanel() {
  const activeFace = useAppStore((state) => state.activeFace)
  const Tool = TOOLS[activeFace]

  return (
    <section className="tool-panel">
      <Tool />
    </section>
  )
}
```

- Sélecteur : on lit la face active ; le composant se redessine quand elle change.
- `TOOLS[activeFace]` : on cherche dans le dictionnaire avec la valeur de `activeFace`. Si elle
  vaut `'metronome'`, `Tool` vaut `FaceMetronome`.
- `Tool` **avec une majuscule** (règle de la fiche EI-00) : React sait que c'est un composant à
  appeler. En minuscule, `<tool />` serait lu comme une balise HTML.
- `<section>` : balise HTML qui regroupe un bloc de contenu.
- Pourquoi un dictionnaire plutôt que 6 `if` : plus court, et TypeScript vérifie qu'aucune face
  n'est oubliée.

### src/App.tsx — afficher le panneau

```tsx
import ToolPanel from './components/ui/ToolPanel'
...
      <FaceNav />
      <ToolPanel />
```

Comme `FaceNav`, le panneau est **en dehors** du `<Canvas>` : c'est du HTML, pas de la 3D.

### src/index.css — placer le panneau

```css
.tool-panel {
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff;
}
```

- Même principe que `.face-nav` : le panneau flotte par-dessus le canvas.
- `top: 64px` : sous la barre de boutons (16 px du haut + ~30 px de hauteur).
- `text-align: center` : texte centré ; `color: #fff` : texte blanc sur fond noir.

### src/components/tools/FaceMetronome.tsx — un premier contenu visible

```tsx
  return <h2>Métronome</h2>
```

Avant : `return null` = rien à afficher. Maintenant un titre, pour **voir** le panneau marcher. Les
5 autres outils renvoient encore `null` : le panneau est vide pour eux, c'est normal.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `ComponentType` | Type TypeScript qui veut dire « un composant React » |
| `import type` | Importe seulement un type, qui disparaît du JavaScript final |
| `Record<Clé, Valeur>` | Type d'un objet qui doit avoir **une entrée pour chaque** clé possible |
| Dictionnaire (objet) | Objet qui associe des clés à des valeurs, lu avec `objet[clé]` |
| `return null` | Un composant qui n'affiche rien |
| `<section>` | Balise HTML qui regroupe un bloc de contenu |

## Quiz

1. On clique sur « Tablatures » : qu'est-ce qui s'affiche dans le panneau, et pourquoi ?
2. On supprime `chords: FaceChordDictionary,` de `TOOLS` : que se passe-t-il, et quand ? Comparer
   avec l'oubli d'une face dans `FACES` (I-02).
3. On écrit `const tool = TOOLS[activeFace]` puis `<tool />` : qu'est-ce qui ne va pas ?
4. Étape par étape, du clic sur « Métronome » à l'apparition du titre à l'écran.
5. Pourquoi `metronome: FaceMetronome` et pas `metronome: <FaceMetronome />` ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Rien : `TOOLS['tabs']` donne `FaceTabs`, qui renvoie encore `null`.
2. Erreur TypeScript : `Record<FaceId, …>` exige une clé pour chaque face. Visible dans l'éditeur,
   à `npm run typecheck` et `npm run build`, **pas** à `npm run dev`. Avec le tableau `FACES`,
   l'oubli passe **sans erreur** (pas de bouton, c'est tout).
3. En minuscule, React lit `<tool />` comme une balise HTML : il crée un `<tool>` inconnu, le
   navigateur l'ignore, rien ne s'affiche (avertissement dans la console). TypeScript le signale
   avant : `tool` n'est pas une balise HTML connue. Il faut une majuscule : `Tool`.
4. Clic → `setActiveFace('metronome')` → le store change → `ToolPanel` lit `activeFace` avec son
   sélecteur, il se redessine → `TOOLS['metronome']` donne `FaceMetronome` → `<Tool />` l'affiche
   → le `<h2>` apparaît.
5. On range la **recette** (le composant), pas un élément déjà créé. Avec `<FaceMetronome />`, les
   6 outils seraient créés dès le chargement, et `<Tool />` ne marcherait plus (`Tool` serait un
   élément, pas un composant).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec ces précisions :

- **Quand** une erreur de type apparaît : éditeur, `typecheck`, `build` — jamais `dev`.
- `<tool />` en minuscule ne fait pas « planter » React : il crée une balise HTML inconnue qui
  n'affiche rien ; c'est TypeScript qui bloque.
- Dans le circuit du clic, ne pas oublier les maillons `setActiveFace` → store → sélecteur.

## Questions possibles à l'oral

- **Pourquoi un panneau HTML alors que le projet prévoit les outils sur le cube ?** C'est
  provisoire, pour pouvoir développer et tester les outils avant la projection 3D ; les composants
  d'outils ne changeront pas.
- **Pourquoi `Record` plutôt qu'un tableau ?** `Record` oblige à associer un composant à chaque
  face : TypeScript détecte un oubli.
- **Pourquoi `Tool` avec une majuscule ?** Pour que React l'appelle comme un composant et non comme
  une balise HTML.
- **Comment le panneau sait-il quel outil afficher ?** Il lit `activeFace` dans le store et cherche
  le composant correspondant dans le dictionnaire `TOOLS`.
