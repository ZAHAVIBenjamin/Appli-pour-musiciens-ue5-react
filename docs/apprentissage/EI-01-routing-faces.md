# EI-01 — Changer de face avec React Router (et retrait de Zustand)

- **Date** : 09/11/2026 → 11/11/2026
- **Auteur** : E + I (codé en séance par E ; **à relire par I**, voir « Pour Bilal » plus bas)
- **Fichiers touchés** : `src/main.tsx`, `src/App.tsx`, `src/data/faces.ts` (nouveau),
  `src/components/ui/Layout.tsx` (nouveau), `src/components/ui/FaceNav.tsx`,
  `src/components/ui/ToolPanel.tsx`, `src/pages/NotFoundPage.tsx` (nouveau), `src/index.css`,
  `vercel.json`, `package.json` (+ react-router, − zustand) ; **supprimé** : `src/store/useAppStore.ts` ;
  docs : `README.md`, `CLAUDE.md`, encadrés en tête de I-01, I-02, I-03

## Ce qu'on a fait et pourquoi

Notre prof de React a demandé **pourquoi Zustand** : c'est hors du cours, et notre store ne contenait
qu'**une seule information** (la face affichée), lue par deux composants. En relisant les chapitres 1
à 7 (ceux de l'évaluation), on a constaté que **`useContext` / `useReducer` n'y sont pas non plus**.
Le cours propose deux façons de partager une information :

- **remonter le state** dans le parent commun (chapitre 4) ;
- **la mettre dans l'adresse** avec **React Router** (chapitre 3).

Choix : **React Router — la face affichée, c'est l'adresse de la page** (`/accordeur`, `/accords`…).
Avantages : bouton Précédent du navigateur, liens partageables (Ctrl + clic), et surtout le
**chapitre 3** apparaît enfin dans le projet. Le state remonté reste la bonne réponse pour un futur
réglage partagé (instrument préféré…).

Zustand est désinstallé, le store supprimé.

## Le code expliqué

### L'image : l'appli est un immeuble

| Dans l'immeuble | Dans le code | Rôle |
| --- | --- | --- |
| L'adresse sur le badge | l'URL `/accords` | où on veut aller |
| Le réceptionniste | `<BrowserRouter>` (main.tsx) | lit l'adresse, la rend lisible par tous les composants |
| Le plan à l'entrée | `<Routes>` / `<Route>` (App.tsx) | adresse → composant à afficher |
| Le hall commun | la **route layout** (`Layout` : cube + barre) | ce qui ne change jamais |
| La vitre du hall | `<Outlet />` (ToolPanel) | l'emplacement où la face s'affiche |
| L'ascenseur intérieur | `Link` / `NavLink` | changer de face sans recharger |
| Sortir dans la rue et resonner | `<a href>` | recharge toute la page, l'appli redémarre |

**La phrase à savoir dire** : quand je tape `/accords`, **`BrowserRouter`** lit l'adresse,
**`<Routes>`** trouve la route qui correspond, et l'outil s'affiche à l'emplacement **`<Outlet />`**,
dans la **route layout** qui garde le cube et la barre.

### src/data/faces.ts — une seule liste des faces

```ts
export const FACES: Face[] = [
  { id: 'tuner', label: 'Accordeur', path: '/accordeur', Tool: FaceTuner },
  // ... une ligne par face
]
```

Avant, les faces étaient décrites à trois endroits (`FaceId` du store, libellés dans `FaceNav`,
`Record TOOLS` dans `ToolPanel`). Maintenant **une seule source de vérité** : id, texte du bouton,
adresse, outil. Lue par les routes (`App`) **et** par la barre (`FaceNav`). Ajouter une face = une
ligne. `Tool` en majuscule : c'est un composant (chapitre 2).

### src/main.tsx — le réceptionniste

```tsx
<StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</StrictMode>
```

`BrowserRouter` **ne crée pas** les routes : il **lit l'adresse** et permet à tout composant en
dessous de la connaître et de la changer (chapitre 3, diapo 15).

### src/App.tsx — le plan

```tsx
<Routes>
  <Route element={<Layout />}>
    <Route index element={<Navigate to="/accordeur" replace />} />
    {FACES.map((face) => (
      <Route key={face.id} path={face.path} element={<face.Tool />} />
    ))}
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

- `<Routes>` compare l'adresse à chaque `path` et affiche l'`element` qui correspond.
- **Route layout** : une `<Route>` **sans `path`**, qui affiche `Layout` autour de ses routes
  enfants (chapitre 3, diapo 21).
- **`index`** : l'adresse `/` toute seule → `<Navigate>` redirige vers `/accordeur` (composant de
  React Router, équivalent en balise de `useNavigate`). `replace` : pas d'étape inutile dans
  l'historique.
- Une route par face, fabriquée avec `map` + `key` à partir de `FACES` ; `<face.Tool />` affiche le
  composant rangé dans la liste.
- **`path="*"`** : toutes les autres adresses → page 404, **dans** la route layout (cube et barre
  restent affichés).

### src/components/ui/Layout.tsx — le hall commun (nouveau)

L'ancien contenu de `App` : `<Canvas>` (cube), `<FaceNav />`, `<ToolPanel />`. Déclaré une seule fois
en route layout : quand on change de face, **on reste dans le même hall**, React ne le recrée pas →
le cube ne se réinitialise pas, seul le contenu derrière la vitre change.

### src/components/ui/ToolPanel.tsx — la vitre

```tsx
<section className="tool-panel">
  <Outlet />
</section>
```

`<Outlet />` = l'emplacement réservé où le routeur affiche l'outil de l'adresse (chapitre 3,
diapo 19). Le panneau ne choisit plus rien : **c'est le routeur qui choisit**.

Expérience faite : `<Outlet />` mis en commentaire → l'adresse change et la barre se grise toujours,
mais **plus aucun outil ne s'affiche** (le routeur sait quoi afficher, mais n'a nulle part où le
mettre).

### src/components/ui/FaceNav.tsx — les ascenseurs

```tsx
{FACES.map((face) => (
  <NavLink key={face.id} to={face.path}>
    {face.label}
  </NavLink>
))}
```

| | Change l'adresse sans recharger | Sait s'il est la page actuelle |
| --- | --- | --- |
| `<a href>` | ❌ recharge tout, l'appli redémarre | ❌ |
| `Link` | ✅ | ❌ |
| `NavLink` | ✅ | ✅ ajoute la classe `active` |

- `NavLink` = `Link` + un bonus : la classe `active` sur le lien de la page actuelle (CSS
  `.face-nav a.active` → grisé). D'où `NavLink` pour une **barre de navigation**, `Link` pour un lien
  simple (page 404).
- Ce sont de **vrais liens** : Ctrl + clic ouvre la face dans un nouvel onglet.

### src/pages/NotFoundPage.tsx — la 404 (nouveau dossier `pages/`)

```tsx
const navigate = useNavigate()
<button onClick={() => navigate(-1)}>Retour</button>
<Link to="/accordeur">Aller à l'accordeur</Link>
```

- `useNavigate` : naviguer **depuis le code** ; `navigate(-1)` = bouton Précédent.
- `pages/` : arborescence du cours (un composant par route qui n'est pas un outil).

### vercel.json — l'accueil pour toutes les adresses

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

Une **SPA** n'a **qu'un seul fichier HTML** : `index.html`. React fabrique toutes les « pages ».

| On recharge `/accords` | Qui répond | Résultat |
| --- | --- | --- |
| Sur le PC (`npm run dev`) | Vite renvoie `index.html` pour toute adresse | React Router affiche les accords |
| Sur Vercel, **sans** la règle | Vercel cherche un **fichier** `accords` → n'existe pas | **404 de Vercel**, React ne démarre même pas |
| Sur Vercel, **avec** la règle | « adresse inconnue → `index.html` » | React Router affiche les accords |

Encore les **deux mondes** (comme le proxy Songsterr, E-05). L'ordre compte : la règle du proxy est
**avant**, sinon `/api/songsterr/...` serait avalé par `index.html` ; les vrais fichiers (JS, CSS)
passent avant toutes les règles.

### Test réalisé

Chrome : `/` → `/accordeur` ; chaque lien change l'adresse et se grise ; Précédent revient à la face
d'avant ; `/accords` tapé directement ; `/guitare` → 404 et ses deux boutons ; Ctrl + clic → nouvel
onglet ; build OK, 42 tests verts.

Remarque : le métronome s'arrête quand on change de face (son composant est démonté, le cleanup
d'I-04 arrête le `setInterval`). Comportement normal ; à rediscuter en binôme si on veut qu'il
continue (il faudrait alors remonter son state).

## Pour Bilal : ce qui a changé dans tes fichiers

| Ta fiche | Avant | Maintenant |
| --- | --- | --- |
| I-01 | `useAppStore` (Zustand) : `activeFace` + `setActiveFace` | **supprimé** ; la face affichée = l'adresse |
| I-02 | `FaceNav` : boutons qui appellent `setActiveFace`, bouton actif `disabled` | `NavLink` vers `face.path`, la classe `active` grise le lien ; liste dans `data/faces.ts` |
| I-03 | `ToolPanel` : `TOOLS[activeFace]` (Record) | `<Outlet />` ; le contenu d'`App` est dans `Layout.tsx` |

Tes fiches I-01 à I-03 ont un encadré ⚠️ en tête qui renvoie ici. Ce qui ne change pas : ton
métronome (I-04, I-05) fonctionne pareil, il est simplement affiché à l'adresse `/metronome`.
Après ton `git pull` : lance **`npm install`** (react-router ajouté, zustand retiré).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| SPA | Single Page Application : un seul fichier HTML, React fabrique toutes les pages |
| Routing | Associer chaque adresse (URL) à un composant à afficher |
| `BrowserRouter` | Lit l'adresse de la page et la rend lisible par tous les composants |
| `Routes` / `Route` | Le plan : compare l'adresse aux `path` et affiche l'`element` qui correspond |
| Route layout | Route sans `path` qui affiche ce qui est commun autour des routes enfants |
| `Outlet` | Emplacement où s'affiche la route enfant |
| Route `index` | Route de l'adresse du parent toute seule (ici `/`) |
| `Navigate` | Composant qui redirige vers une autre adresse |
| `Link` / `NavLink` | Lien interne sans rechargement ; NavLink ajoute `active` sur la page actuelle |
| `useNavigate` | Naviguer depuis le code (`navigate(-1)` = Précédent) |
| Route `*` | Attrape toutes les adresses inconnues (404) |
| Rewrite (Vercel) | Règle qui sert un autre fichier que celui demandé |

## Quiz

1. Pourquoi retirer Zustand ? Avec quoi le remplacer, et pourquoi pas le state remonté ?
2. Rôle de `<BrowserRouter>` (main.tsx) et de `<Routes>` (App.tsx) ?
3. Qu'est-ce qu'une route layout ? Pourquoi le cube ne se réinitialise-t-il pas ?
4. Différence entre `NavLink`, `Link` et `<a href>` ? Pourquoi `NavLink` dans la barre ?
5. Recharger `/accords` sur Vercel sans la règle de `vercel.json` ? Pourquoi ça marche sur le PC ?

Rattrapage :

- A. (expérience) `NavLink` remplacé par `<a href>` : que change-t-il ?
- B. Compléter : quand je tape `/accords`, ___ lit l'adresse, ___ trouve la route, l'outil
  s'affiche à l'emplacement ___, dans la route ___ qui garde le cube et la barre.
- C. Pourquoi un rechargement de `/accords` marche sur le PC mais pas sur Vercel sans la règle ?
- D. « Pourquoi pas useContext et useReducer, comme je vous l'avais conseillé ? »

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Hors du cours et trop puissant pour une seule information (« une scie électrique pour couper une
   fleur »). Remplacé par **React Router** : la face = l'adresse. Le state remonté marchait aussi,
   mais l'adresse apporte Précédent + liens partageables, et fait apparaître le chapitre 3.
2. `BrowserRouter` lit l'adresse et la rend disponible à tous les composants (il ne crée pas les
   routes). `<Routes>` compare l'adresse aux `path` et affiche l'`element` qui correspond.
3. Une route sans `path` qui affiche ce qui est commun (cube + barre) avec un `<Outlet />`. On reste
   dans le même layout en changeant de face : React ne le recrée pas, seul l'Outlet change.
4. `Link` et `NavLink` changent l'adresse sans recharger ; `NavLink` sait en plus s'il est la page
   actuelle (classe `active`) → barre de navigation. `<a href>` recharge toute la page.
5. Vercel cherche un fichier `accords`, qui n'existe pas (SPA : seulement `index.html`) → 404 de
   Vercel avant que React démarre. Sur le PC, Vite renvoie `index.html` pour toute adresse.

- A. Plus aucun lien grisé (pas de classe `active`) et rechargement complet de la page (cube
  redessiné). (Le texte tapé dans les Tablatures disparaît dans les deux cas : la face est démontée.)
- B. `BrowserRouter` ; `<Routes>` ; `<Outlet />` ; la route layout (`Layout`).
- C. Voir 5.
- D. « Ils ne sont pas dans les chapitres 1 à 7, sur lesquels on est évalués. On n'avait qu'une
  information à partager, la face affichée : on l'a mise dans l'adresse avec React Router
  (chapitre 3), ce qui donne en plus le bouton Précédent et des liens partageables. »

</details>

## Points à retravailler (E)

- ⚠️ **Toute la chaîne du routeur** : `BrowserRouter` (lit) → `Routes` (choisit) → `Outlet`
  (affiche) → route layout (garde le commun). Apprendre la phrase de B par cœur.
  **Échauffement à la prochaine séance : B et C, à froid.**
- On n'utilise **pas** `useContext` / `useReducer` (hors chapitres 1 à 7) : ne pas confondre avec la
  suggestion du prof.
- `FaceNav` = la barre de liens, **pas** l'emplacement d'affichage (c'est `Outlet`).
- **Deux mondes** (PC / Vercel) : qui répond quand on recharge une adresse.

## Points à retravailler (I)

Relecture faite par I le 12/11/2026 : quiz réussi après rattrapage (A, B, D reformulés).

- **Répondre avec mes mots** : premières réponses 2, 3 et 5 trop proches du texte de l'explication.
  À l'oral, savoir redire la chaîne `BrowserRouter` (lit) → `Routes` (choisit) → `Outlet` (affiche)
  → route layout (garde le commun) sans support.
- **Répondre à la question posée** : en 5, dire ce que voit l'utilisateur (404 de Vercel, React ne
  démarre pas), pas seulement le rôle de la règle.
- **Argument décisif face au prof** : `useContext` / `useReducer` ne sont **pas** dans les chapitres 1
  à 7 ; le cours propose state remonté (ch. 4) ou React Router (ch. 3).
- `<a href>` vs `NavLink` : le métronome s'arrête dans les deux cas (démontage, I-04) ; la vraie
  différence est que `<a href>` redémarre **toute** l'appli (cube réinitialisé).
- Pour mon métronome : si `isPlaying` doit un jour survivre au changement de face, la réponse
  « cours » est de **remonter le state** dans `Layout`, plus un store.

## Questions possibles à l'oral

- **Pourquoi avez-vous abandonné Zustand ?** Hors du cours et surdimensionné pour une seule
  information ; on a mesuré (une valeur, deux composants) et choisi une solution du cours.
- **Pourquoi pas useContext / useReducer ?** Hors des chapitres 1 à 7 ; et l'adresse de la page
  suffisait, avec en bonus Précédent et des liens partageables.
- **Comment l'appli sait-elle quelle face afficher ?** Par l'adresse : `BrowserRouter` la lit,
  `Routes` choisit la route, l'outil s'affiche dans l'`Outlet` de la route layout.
- **Pourquoi le cube ne se recharge-t-il pas en changeant de face ?** Il est dans la route layout,
  commune à toutes les faces : seul le contenu de l'`Outlet` change.
- **Pourquoi cette règle dans vercel.json ?** Une SPA n'a qu'un fichier HTML ; sans la règle,
  Vercel répondrait 404 sur toute adresse rechargée.
