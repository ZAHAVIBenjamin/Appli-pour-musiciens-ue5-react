# Appli pour musiciens — Cube 3D

Application React où chaque face d'un cube 3D est un outil pour musicien :
accordeur, tablatures, métronome, dictionnaire d'accords, carnet d'entraînement, réglages.

**Stack** : Vite · React · React Three Fiber / drei · Zustand · Web Audio API · Vercel

## Démarrer

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev
```

## Arborescence

```
src/
├── App.jsx                  Layout principal + UI globale
├── components/
│   ├── 3d/                  Scene.jsx, Cube.jsx, CubeControls.jsx
│   └── tools/               Une face = un composant (FaceTuner, FaceTabs, ...)
├── store/useAppStore.js     État global (Zustand)
└── services/                audioEngine.js (Web Audio), tablatureApi.js (HTTP)
```

## Répartition des rôles

| Partie | Responsable |
|---|---|
| Scène 3D, cube, rotation (`components/3d`) | _à définir_ |
| Store global (`store/`) | _à définir_ |
| Accordeur + `audioEngine.js` | _à définir_ |
| Métronome | _à définir_ |
| Tablatures + `tablatureApi.js` | _à définir_ |
| Dictionnaire d'accords | _à définir_ |
| Carnet d'entraînement | _à définir_ |
| Réglages | _à définir_ |
| Déploiement Vercel | _à définir_ |

## Workflow Git

- `main` : version stable, déployée sur Vercel. On ne pousse pas directement dessus.
- `dev` : branche d'intégration.
- Une branche par fonctionnalité, créée depuis `dev` : `feature/accordeur`, `feature/cube-rotation`, ...
- Pull Request vers `dev`, relue par l'autre membre du binôme avant le merge.
- `dev` → `main` quand une version est stable.

```bash
git checkout dev && git pull
git checkout -b feature/ma-fonctionnalite
# ... commits ...
git push -u origin feature/ma-fonctionnalite   # puis ouvrir la PR vers dev sur GitHub
```

## Déploiement (Vercel)

Importer le repo sur Vercel (preset Vite détecté automatiquement), puis ajouter les variables
de `.env.example` dans *Project Settings → Environment Variables*.
