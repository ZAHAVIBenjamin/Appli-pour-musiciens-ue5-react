# I-02 — Barre de navigation : changer de face avec le store

- **Date** : 26/10/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/ui/FaceNav.tsx` (nouveau), `src/App.tsx`, `src/index.css`

## Ce qu'on a fait et pourquoi

Première utilisation du store (fiche I-01) dans un composant : une barre de 6 boutons, un par face
du cube. Un clic change `activeFace` dans le store ; le bouton de la face active est grisé. Le cube
ne tourne pas encore (étape de la scène 3D, E + I) : à cette étape, **seuls les boutons changent**.

On crée le dossier `components/ui` : la barre n'est ni de la 3D (`components/3d`) ni un outil de
face (`components/tools`), c'est l'interface HTML qui flotte par-dessus la scène.

## Le code expliqué

### src/components/ui/FaceNav.tsx — la barre de boutons

```tsx
import { useAppStore, type FaceId } from '../../store/useAppStore'
```

- On importe le hook du store et le type `FaceId` (la liste des noms de code des faces).
- `../../` = remonter de deux dossiers : `ui` → `components` → `src`, puis descendre dans `store`.
- `type FaceId` : c'est un type, pas une valeur ; il disparaît du JavaScript final.

```tsx
const FACES: { id: FaceId; label: string }[] = [
  { id: 'tuner', label: 'Accordeur' },
  { id: 'tabs', label: 'Tablatures' },
  { id: 'metronome', label: 'Métronome' },
  { id: 'chords', label: 'Accords' },
  { id: 'notebook', label: 'Carnet' },
  { id: 'settings', label: 'Réglages' },
]
```

- Tableau d'objets : chaque objet relie un **nom de code** (`id`, utilisé par le programme et le
  store) au **texte du bouton** (`label`, affiché à l'utilisateur).
- `{ id: FaceId; label: string }[]` = un tableau (`[]`) d'objets avec un `id` qui est un nom de
  face valide et un `label` texte.
- Pourquoi un tableau plutôt que 6 boutons écrits à la main : ajouter ou renommer une face = une
  ligne, sans copier-coller.
- Déclaré **hors** du composant : il ne change jamais, inutile de le recréer à chaque redessin.

```tsx
const activeFace = useAppStore((state) => state.activeFace)
const setActiveFace = useAppStore((state) => state.setActiveFace)
```

Les sélecteurs de la fiche I-01 : on lit la face active et on récupère la fonction qui la change.
Le composant lit `activeFace`, donc il se redessine à chaque changement de face.

```tsx
<nav className="face-nav">
  {FACES.map((face) => (
    <button
      key={face.id}
      onClick={() => setActiveFace(face.id)}
      disabled={face.id === activeFace}
    >
      {face.label}
    </button>
  ))}
</nav>
```

- `<nav>` : balise HTML d'une zone de navigation.
- `.map()` transforme chaque objet du tableau en `<button>` : 6 boutons.
- `key={face.id}` : identifiant unique de chaque élément d'une liste ; React s'en sert pour savoir
  quel bouton est lequel au redessin (sans `key` : avertissement dans la console).
- `onClick={() => setActiveFace(face.id)}` : on **donne** à React une fonction, qu'il appellera
  **au clic**. Sans `() =>`, `setActiveFace(...)` serait **exécutée tout de suite**, pendant
  l'affichage (voir points à retravailler).
- `disabled={face.id === activeFace}` : recalculé **pour chaque bouton à chaque redessin**. `===`
  vaut `true` si les deux valeurs sont égales : seul le bouton de la face active est grisé.
- `{face.label}` : affiche le texte du bouton.

### src/App.tsx — afficher la barre

```tsx
import FaceNav from './components/ui/FaceNav'
...
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <Scene />
      </Canvas>
      <FaceNav />
```

`<FaceNav />` est placé **après** `</Canvas>`, pas dedans : tout ce qui est dans le `<Canvas>` est
du monde 3D, un élément en minuscule y est lu comme un objet Three.js. `<nav>` dans le canvas ferait
planter l'appli (`THREE.Nav` n'existe pas).

### src/index.css — faire flotter la barre

```css
.app {
  position: relative;
}

.face-nav {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
}
```

- Le canvas prend déjà 100 % de la hauteur. Sans `position: absolute`, la barre se placerait
  **sous** le canvas, donc sous le bas de l'écran.
- `position: absolute` sort la barre du flux normal : elle flotte **par-dessus** le canvas.
- `.app { position: relative }` sert de repère : `top: 16px` = à 16 px du haut de `.app`.
- `left: 0; right: 0` : toute la largeur. `display: flex` aligne les boutons en ligne,
  `justify-content: center` les centre, `gap: 8px` les espace.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `.map()` | Transforme chaque élément d'un tableau en autre chose (ici un bouton) |
| `key` | Identifiant unique de chaque élément d'une liste, pour que React s'y retrouve |
| Fonction fléchée `() =>` | Petite fonction ; ici, appelée seulement au clic |
| `===` | Compare deux valeurs : `true` si égales, `false` sinon |
| `disabled` | Bouton grisé et non cliquable |
| `position: absolute` | Élément qui flotte par-dessus les autres, placé par rapport à un parent `relative` |
| Flexbox (`display: flex`) | Outil CSS pour aligner des éléments en ligne ou en colonne |

## Quiz

1. On écrit par erreur `onClick={setActiveFace(face.id)}` (sans `() =>`). Que se passe-t-il au
   chargement de la page ?
2. Pourquoi `<FaceNav />` est-il placé **après** `</Canvas>` et pas à l'intérieur ?
3. On clique sur « Métronome ». Pourquoi le bouton Métronome devient-il gris et Accordeur
   redevient-il cliquable ?
4. On ajoute une 7ᵉ face `'recorder'`. Quels fichiers modifier, et que dit TypeScript si on oublie
   l'un des deux ?
5. Si on supprime `position: absolute` dans `.face-nav`, où apparaît la barre ?

Rattrapage :

- A. Dans `<button onClick={alert('Salut')}>`, quand « Salut » apparaît-il ? Comment corriger ?
- B. On est sur Métronome, on clique sur Carnet : que vaut `disabled` pour le bouton Métronome, et
  pourquoi ?
- C. On ajoute `'recorder'` dans `FaceId`, le build passe, mais aucun bouton « Enregistreur » :
  pourquoi ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Les parenthèses exécutent `setActiveFace` **tout de suite**, pendant l'affichage, pour chacun
   des 6 boutons, sans clic. `onClick` reçoit ce qu'elle renvoie (`void`, rien) : le clic ne fait
   plus rien. TypeScript l'attrape : `onClick` attend une fonction, pas `void` → `build` échoue.
2. Tout ce qui est dans le `<Canvas>` est du monde 3D : `<nav>` y serait lu comme un objet
   Three.js (`THREE.Nav`), qui n'existe pas → l'appli plante.
3. Clic → `setActiveFace('metronome')` → le store passe `activeFace` à `'metronome'` → `FaceNav`
   lit `activeFace`, il se redessine → `disabled` est recalculé pour chaque bouton :
   `'metronome' === 'metronome'` → `true` (grisé) ; `'tuner' === 'metronome'` → `false`
   (cliquable).
4. `useAppStore.ts` (type `FaceId`) et `FaceNav.tsx` (tableau `FACES`). Oubli dans `FaceId` :
   **erreur** (`'recorder'` n'est pas un nom autorisé). Oubli dans `FACES` : **aucune erreur**, juste
   pas de bouton. TypeScript vérifie qu'on n'utilise **que** des noms de la liste, pas qu'on les
   utilise **tous**.
5. Dans le flux normal, **sous** le canvas qui fait déjà 100 % de la hauteur : sous le bas de
   l'écran, invisible.

- A. Tout de suite, au chargement. Correction : `onClick={() => alert('Salut')}`.
- B. `activeFace` vaut `'notebook'` ; `'metronome' === 'notebook'` → `false` : bouton cliquable.
- C. Il manque la ligne `{ id: 'recorder', label: 'Enregistreur' }` dans `FACES` de
  `FaceNav.tsx` ; TypeScript ne le signale pas.

</details>

## Points à retravailler (I)

- **`onClick={f(x)}` vs `onClick={() => f(x)}`** : les parenthèses après un nom de fonction
  l'**exécutent maintenant**. `() =>` **donne** une fonction à React, qui l'appellera au clic.
  (Réponse 1 inversée au premier essai, rattrapage A réussi.)
- **Expliquer le *pourquoi*, pas seulement le *quoi*** : le bouton se grise parce que `disabled`
  est **recalculé** à chaque redessin (`face.id === activeFace`). (Rattrapage B réussi.)
- **`id` ≠ `label`** : le store contient le nom de code (`'notebook'`), pas le texte affiché
  (`'Carnet'`). `setActiveFace('carnet')` serait refusé par TypeScript.
- **TypeScript ne vérifie pas l'exhaustivité** : oublier une face dans `FACES` ne donne aucune
  erreur.
- À cette étape, aucune « page » ne change : seuls les boutons réagissent.

## Questions possibles à l'oral

- **Comment la barre sait-elle quelle face est active ?** Elle lit `activeFace` dans le store avec
  un sélecteur ; à chaque changement, elle se redessine et recalcule `disabled`.
- **Pourquoi un tableau `FACES` plutôt que 6 boutons ?** Ajouter ou renommer une face = une ligne ;
  le JSX reste court et sans copier-coller.
- **À quoi sert `key` ?** À identifier chaque élément d'une liste pour que React sache lequel
  mettre à jour.
- **Pourquoi la barre n'est-elle pas dans le `<Canvas>` ?** Le canvas est du monde 3D ; une barre
  HTML se place à côté et flotte par-dessus grâce au CSS `position: absolute`.
- **Différence entre `id` et `label` ?** `id` = nom de code fixe utilisé par le programme ;
  `label` = texte affiché, qu'on peut changer ou traduire.
