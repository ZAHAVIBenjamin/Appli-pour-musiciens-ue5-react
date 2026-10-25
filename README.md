# Appli pour musiciens — Cube 3D

Application React où chaque face d'un cube 3D est un outil pour musicien :
accordeur, tablatures, métronome, dictionnaire d'accords, carnet d'entraînement, réglages.

**Stack** : Vite · React · TypeScript · React Three Fiber / drei · Zustand · Web Audio API · Vercel

## Démarrer

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev
```

## Arborescence

```
src/
├── App.tsx                  Layout principal + UI globale
├── components/
│   ├── 3d/                  Scene.tsx, Cube.tsx, CubeControls.tsx
│   └── tools/               Une face = un composant (FaceTuner, FaceTabs, ...)
├── store/useAppStore.ts     État global (Zustand)
└── services/                audioEngine.ts (Web Audio), tablatureApi.ts (HTTP)
```

## Répartition des rôles

E = Benjamin · I = son collègue · E + I = en binôme

| Partie | Responsable |
|---|---|
| Scène 3D, cube, rotation (`components/3d`) | E + I |
| Store global (`store/`) | I |
| Accordeur + `audioEngine.ts` | E |
| Métronome | I |
| Tablatures + `tablatureApi.ts` | E |
| Dictionnaire d'accords | E |
| Carnet d'entraînement | I |
| Réglages | I |
| Déploiement Vercel | E + I |

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
