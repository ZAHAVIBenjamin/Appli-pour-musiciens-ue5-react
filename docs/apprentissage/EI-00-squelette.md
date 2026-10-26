# EI-00 — Le squelette : comment l'appli démarre

- **Date** : 25/10/2026
- **Auteur** : E + I (fiche commune)
- **Fichiers touchés** : aucun (lecture du squelette existant) — `index.html`, `src/main.tsx`,
  `src/App.tsx`, `src/index.css`, `src/components/3d/Scene.tsx`, `src/components/3d/Cube.tsx`,
  `vite.config.ts`, `tsconfig.json`, `package.json`

## Ce qu'on a fait et pourquoi

On a suivi le chemin du navigateur quand on lance `npm run dev`, depuis la page HTML jusqu'au cube
affiché. Tout le reste du projet se branche sur ce squelette : il faut savoir l'expliquer avant
d'ajouter quoi que ce soit.

Chemin : `index.html` → `main.tsx` → `App.tsx` → `<Canvas>` → `Scene.tsx` → `Cube.tsx`

## Le code expliqué

### index.html — la seule page HTML

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

- La `div#root` est vide : c'est la boîte où React dessinera toute l'appli.
- Le script charge `main.tsx`. Le navigateur ne comprend pas TypeScript : **Vite** traduit le
  fichier en JavaScript à la volée.
- `type="module"` autorise `import` / `export`.

### main.tsx — le point d'entrée React

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- `getElementById('root')` récupère la `div` vide.
- `!` = *non-null assertion* : pour TypeScript, `getElementById` peut renvoyer `null` ; le `!`
  promet que l'élément existe. Si la promesse est fausse, TypeScript ne dit rien et l'appli plante
  **à l'exécution** dans le navigateur.
- `createRoot(...).render(<App />)` affiche le composant `App` dans la `div`.
- `StrictMode` : contrôles en développement seulement ; React exécute certains composants deux
  fois pour repérer les erreurs (un `console.log` peut apparaître en double).
- `import './index.css'` : Vite injecte le CSS dans la page.

### App.tsx — le layout principal

```tsx
export default function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
```

- Un composant React = une fonction qui renvoie du JSX.
- `className` et pas `class` : le JSX est du JavaScript, où `class` est un mot réservé.
- `export default` permet `import App from './App'`.
- `<Canvas>` (React Three Fiber) crée une balise `<canvas>` et un moteur Three.js complet :
  scène, moteur de rendu, boucle de rendu (~60 images/s). **Tout ce qui est dedans est du monde 3D,
  pas du HTML.**
- `position: [5, 4, 6]` = coordonnées `[x, y, z]` (x droite, y haut, z vers nous) : caméra en haut
  à droite, devant, d'où la vue de biais. `fov: 45` = angle de vision en degrés.
- `{{ }}` : les accolades extérieures = « du JavaScript ici », les intérieures = un objet.

### index.css

`height: 100%` sur `html, body, #root, .app` : le `<Canvas>` prend la taille de son parent ;
sans hauteur, il ferait 0 px et rien ne serait visible.

### Scene.tsx — lumières, cube, contrôles

```tsx
<>
  <ambientLight intensity={0.6} />
  <directionalLight position={[5, 5, 5]} />
  <Cube />
  <OrbitControls />
</>
```

- `<> </>` = fragment : un composant renvoie un seul élément ; le fragment groupe sans ajouter de
  balise.
- `ambientLight` : lumière uniforme venant de partout, sans relief.
- `directionalLight` : lumière venant d'un point, comme le soleil ; c'est elle qui donne le volume.
- `OrbitControls` (drei) : la souris fait tourner **la caméra** autour du cube. Le cube, lui, ne
  bouge pas.

### Cube.tsx — le modèle 3D

```tsx
<mesh>
  <boxGeometry args={[3, 3, 3]} />
  <meshStandardMaterial color="#888" />
</mesh>
```

- `mesh` = l'objet qui **assemble** une géométrie (la forme) et un matériau (l'apparence).
- `boxGeometry` avec `args={[3, 3, 3]}` = `new THREE.BoxGeometry(3, 3, 3)` : largeur, hauteur,
  profondeur.
- `meshStandardMaterial` : matériau réaliste qui réagit à la lumière (noir sans lumière).
- Minuscule / majuscule, **imposé par React** :
  - minuscule = élément natif (en HTML : `div`… ; dans un `<Canvas>` : objet Three.js,
    `mesh` → `THREE.Mesh`) ;
  - majuscule = composant (une fonction à appeler, ex. `<Cube />`).
  - `<cube />` planterait : `THREE.Cube` n'existe pas.

### La configuration

- `vite.config.ts` : `plugins: [react()]` = support du JSX + rechargement à chaud.
- `tsconfig.json` : `strict` (vérifications strictes), `noEmit` (TypeScript vérifie seulement,
  c'est Vite qui traduit), `noUnusedLocals` (variable inutilisée = erreur).
- `package.json` : `dev` (serveur), `typecheck` (vérifie les types), `build` = `tsc && vite build`.
  **`npm run dev` ne vérifie pas les types** ; `build` les vérifie d'abord et s'arrête à la
  première erreur grâce au `&&`. Donc : `npm run typecheck` avant chaque Pull Request.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Composant | Fonction qui renvoie du JSX ; nom en majuscule |
| JSX | Syntaxe qui ressemble à du HTML, écrite dans du code TypeScript |
| Non-null assertion (`!`) | Promesse faite à TypeScript qu'une valeur n'est pas `null` |
| Fragment (`<> </>`) | Regroupe des éléments sans ajouter de balise |
| Canvas (R3F) | Porte d'entrée vers la 3D : crée la scène, la caméra et la boucle de rendu |
| Mesh | Objet 3D = géométrie + matériau |
| Géométrie | La forme d'un objet 3D (boîte, sphère…) |
| Matériau | L'apparence d'un objet 3D (couleur, réaction à la lumière) |
| fov | *Field of view*, angle de vision de la caméra en degrés |
| OrbitControls | Contrôle qui fait tourner la caméra autour d'un point à la souris |

## Quiz

1. Si on supprime `<div id="root"></div>` de `index.html`, que se passe-t-il, et pourquoi ?
2. Quand on fait tourner le cube à la souris, qu'est-ce qui bouge réellement ?
3. Si on retire les deux lumières de `Scene.tsx`, à quoi ressemble le cube, et pourquoi ?
4. Pourquoi écrit-on `<mesh>` en minuscule mais `<Cube />` avec une majuscule ?
5. `npm run dev` marche, mais `npm run build` échoue sur une erreur TypeScript : comment est-ce
   possible ?

Rattrapage :

- A. On remplace `<boxGeometry args={[3, 3, 3]} />` par `<sphereGeometry args={[2]} />` :
  qu'est-ce qui change, qu'est-ce qui ne change pas ?
- B. `const x: number = "bonjour"`, `npm run dev` marche, on pousse : que fait le build Vercel ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Rien ne s'affiche, mais l'erreur n'arrive ni à la compilation Vite ni à la vérification
   TypeScript (le `!` la masque) : elle arrive **à l'exécution**. `getElementById` renvoie `null`,
   `createRoot(null)` lève « Target container is not a DOM element », la page reste blanche.
2. La caméra (`OrbitControls`). Le cube reste immobile.
3. Noir : `meshStandardMaterial` calcule sa couleur à partir de la lumière reçue. Avec l'ambiante
   seule, il serait gris uniforme sans relief.
4. React l'impose : minuscule = élément natif (objet Three.js dans un `<Canvas>`, `mesh` →
   `THREE.Mesh`, qui assemble géométrie + matériau) ; majuscule = composant à appeler.
5. `dev` ne vérifie pas les types (Vite retire les annotations sans contrôle) ; `build` lance
   `tsc` d'abord et s'arrête à la première erreur (`&&`).

- A. Seule la forme change ; matériau et lumières identiques. `args={[2]}` = rayon 2, donc
  4 de diamètre.
- B. Le build échoue : `tsc` refuse un `string` dans un `number`, le `&&` stoppe `vite build`,
  rien n'est déployé.

</details>

## Questions possibles à l'oral

- **Comment l'application démarre-t-elle ?** `index.html` charge `main.tsx`, qui monte `App` dans
  la `div#root` ; `App` ouvre un `<Canvas>` 3D qui contient la scène.
- **Pourquoi TypeScript ?** Les erreurs de type sont détectées avant l'exécution, et le build
  bloque le déploiement d'un code incorrect.
- **Qu'apporte React Three Fiber par rapport à Three.js seul ?** On décrit la scène 3D avec des
  composants React (`<mesh>`, `<Cube />`) au lieu d'appels impératifs (`new THREE.Mesh()`,
  `scene.add(...)`).
- **Pourquoi le cube est-il éclairé en relief ?** Grâce à la lumière directionnelle ; l'ambiante
  seule le rendrait plat.
