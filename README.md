# Appli pour musiciens — Cube 3D

Application React où chaque face d'un cube 3D est un outil pour musicien :
accordeur, tablatures, métronome, dictionnaire d'accords, carnet d'entraînement, réglages.

**Stack** : Vite · React · TypeScript · React Router · React Three Fiber / drei · Web Audio API · Vitest · Vercel

## Démarrer

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev
```

## Arborescence

```
src/
├── main.tsx                 Point d'entrée : StrictMode + BrowserRouter
├── App.tsx                  Les routes : une adresse par face (/accordeur, /accords...) + 404
├── components/
│   ├── 3d/                  Scene.tsx, Cube.tsx, CubeControls.tsx
│   ├── tools/               Une face = un composant (FaceTuner, FaceTabs, ...)
│   └── ui/                  Layout (route layout), FaceNav (NavLink), ToolPanel (<Outlet />)
├── pages/                   NotFoundPage (404)
├── data/                    faces.ts (LA liste des faces), chords.ts (accords)
├── services/                audioEngine.ts (Web Audio), tablatureApi.ts (HTTP)
└── utils/                   notes.ts (fréquences, notes, MIDI)
```

## Répartition des rôles

E = Benjamin · I = Bilal · E + I = en binôme

| Partie | Responsable |
|---|---|
| Scène 3D, cube, rotation (`components/3d`) | E + I |
| Navigation entre les faces (`App.tsx`, `data/faces.ts`, `components/ui`) | I (passée à React Router en E + I : fiche EI-01) |
| Accordeur + `audioEngine.ts` | E |
| Métronome | I |
| Tablatures + `tablatureApi.ts` | E |
| Dictionnaire d'accords | E |
| Carnet d'entraînement | I |
| Réglages | I |
| Déploiement Vercel | E + I |

## Choix techniques et cours

Le projet s'appuie sur les chapitres 1 à 7 du cours React (composants et props, routing, state,
effets, data fetching, Rules of React). **La face affichée n'est pas un état global : c'est l'adresse
de la page** (React Router, chapitre 3). Zustand, utilisé au début, a été retiré (fiche EI-01).

Ce qui sort du cours, et pourquoi :

| Outil | Pourquoi |
|---|---|
| React Three Fiber / drei | Le sujet du projet : le cube 3D |
| Web Audio API | API du navigateur pour le son (clic du métronome, micro de l'accordeur) |
| Vitest | Tests automatiques (`npm test`) : vérifie le dictionnaire d'accords |

## Apprendre en codant

Chaque évolution est expliquée puis validée par un quiz de 5 questions ; les fiches de révision sont dans `docs/apprentissage/`. Règles complètes dans `CLAUDE.md`.

## Workflow Git

- `main` : version stable, déployée sur Vercel. On ne pousse pas directement dessus.
- `dev` : branche d'intégration.
- Une branche par fonctionnalité, créée depuis `dev` : `feature/accordeur`, `feature/cube-rotation`, ...
- Pull Request vers `dev`. **Relecture après coup** : l'auteur merge lui-même sa PR dans `dev` pour ne pas bloquer, l'autre la relit ensuite (code + fiche + quiz) et commente si besoin ; les corrections partent dans une PR suivante.
- `dev` → `main` uniquement quand **les deux** ont validé.

```bash
git checkout dev && git pull
git checkout -b feature/ma-fonctionnalite
# ... commits ...
git push -u origin feature/ma-fonctionnalite   # puis ouvrir la PR vers dev sur GitHub
```

## Déploiement (Vercel)

Importer le repo sur Vercel (preset Vite détecté automatiquement), puis ajouter les variables
de `.env.example` dans *Project Settings → Environment Variables*.
