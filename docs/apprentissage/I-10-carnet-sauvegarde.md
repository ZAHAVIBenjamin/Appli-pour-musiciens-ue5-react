# I-10 — Carnet d'entraînement : sauvegarde dans le navigateur (localStorage)

- **Date** : 16/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FacePracticeNotebook.tsx`, `README.md` (une ligne)

## Ce qu'on a fait et pourquoi

Les séances restent après un rechargement, et même après avoir fermé le navigateur. Pas de serveur
(choix du binôme) : on les range **dans le navigateur**, avec `localStorage`. C'est une API du
navigateur hors cours : elle est justifiée dans le tableau « Ce qui sort du cours » du README.

## Le code expliqué

### localStorage et JSON

`localStorage` = petite mémoire du navigateur, propre à chaque site, qui survit aux rechargements.
On y range une **valeur** sous un **nom** (la clé), comme dans un casier.

| Instruction | Effet |
| --- | --- |
| `localStorage.setItem('cle', 'valeur')` | Range `'valeur'` dans le casier `'cle'` |
| `localStorage.getItem('cle')` | Lit le casier ; `null` s'il est vide |

Il ne range **que du texte** : on convertit le tableau de séances avec **JSON**, un format texte pour
les objets et tableaux. `JSON.stringify` : objet → texte ; `JSON.parse` : texte → objet.

### src/components/tools/FacePracticeNotebook.tsx — trois ajouts

```tsx
const STORAGE_KEY = 'carnet-seances'
```

Le nom du casier, en constante : le même en lecture et en écriture (une faute de frappe = un autre
casier, vide).

```tsx
function loadSessions(): Session[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    return []
  }
  return JSON.parse(saved)
}
...
const [sessions, setSessions] = useState<Session[]>(loadSessions)
```

- Casier vide (première visite) → liste vide ; sinon on reconvertit le texte avec `JSON.parse`.
- `: Session[]` = ce que la fonction renvoie.
- `useState(loadSessions)` **sans parenthèses** : on donne la fonction (le post-it de I-02), React
  l'appelle **une seule fois**, au premier affichage. Avec `loadSessions()`, elle serait appelée à
  chaque redessin (à chaque lettre tapée) : ça marche, mais on relit le casier pour rien.

```tsx
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}, [sessions])
```

- Effet de bord (I-04) : écrire dans la mémoire du navigateur.
- `[sessions]` : à chaque changement de la liste, on la range dans le casier.
- Pas de nettoyage : rien à arrêter.
- `handleSubmit` n'a pas changé : il modifie l'état, l'effet sauvegarde. La suppression (I-11) sera
  sauvegardée toute seule.

### Le piège évité : relire dans un useEffect

`useEffect(() => { setSessions(loadSessions()) }, [])` : au premier affichage `sessions` vaut `[]`,
l'effet de sauvegarde écrit `[]` dans le casier et **écrase** les séances, puis l'effet de lecture
relit un casier vide. Avec `useState(loadSessions)`, les séances sont là dès le premier affichage.

### Limite connue

Les séances sont rangées dans **ce navigateur, sur cet ordinateur** : un autre appareil ou un autre
navigateur voit un carnet vide ; vider les données du site efface le carnet. Prix assumé du « pas de
back-end ».

### README.md

Ligne ajoutée au tableau « Ce qui sort du cours, et pourquoi » :
`| localStorage | API du navigateur : le carnet d'entraînement garde ses séances sans back-end (fiche I-10) |`

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `localStorage` | Mémoire du navigateur, propre à chaque site, qui survit aux rechargements |
| Clé | Le nom du « casier » où l'on range une valeur |
| JSON | Format texte pour écrire des objets et des tableaux |
| `JSON.stringify` / `JSON.parse` | Objet → texte / texte → objet |
| `useState(fonction)` | La fonction est appelée une seule fois, pour la valeur de départ |

## Quiz

1. `localStorage.setItem(STORAGE_KEY, sessions)` sans `JSON.stringify` : que contient le casier, et
   au rechargement ?
2. On ajoute une séance : comment arrive-t-elle dans `localStorage`, étape par étape ?
3. Pourquoi relire les séances dans un `useEffect(…, [])` effacerait le carnet ?
4. `useState(loadSessions)` ou `useState(loadSessions())` : laquelle est meilleure, pourquoi ?
5. Benjamin ouvre l'appli sur son PC : voit-il mes séances ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Le tableau est converti en texte illisible (`"[object Object],[object Object]"`). Au
   rechargement, `JSON.parse` lance une erreur : la face Carnet n'affiche rien. TypeScript le signale
   avant : `setItem` attend du texte.
2. `handleSubmit` → `setSessions(nouvelle liste)` → l'état change → l'effet qui dépend de
   `[sessions]` se relance → `JSON.stringify(sessions)` → `setItem('carnet-seances', …)`.
3. Au premier affichage `sessions` vaut `[]` : l'effet de sauvegarde écrit `[]` et écrase les
   séances avant qu'elles soient relues.
4. `useState(loadSessions)` : React appelle la fonction une seule fois. `loadSessions()` est exécutée
   à chaque redessin et relit le casier pour rien.
5. Non : `localStorage` est propre à un navigateur sur un ordinateur ; sans back-end, rien n'est
   partagé.

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots.

- Q1 : savoir dire la conséquence visible (la face Carnet n'affiche rien) → `stringify` / `parse`
  vont toujours par paire.

## Questions possibles à l'oral

- **Pourquoi localStorage et pas un serveur ?** Choix du binôme : pas de back-end à héberger pour un
  carnet personnel ; justifié dans le README.
- **Pourquoi JSON ?** `localStorage` ne range que du texte ; JSON convertit le tableau de séances en
  texte et inversement.
- **Pourquoi `useState(loadSessions)` plutôt qu'un `useEffect` de lecture ?** Les séances sont là dès
  le premier affichage ; un effet de lecture laisserait l'effet de sauvegarde écraser le casier.
- **Quelle est la limite ?** Les séances restent sur un seul navigateur, sur un seul appareil.
