# I-11 — Carnet d'entraînement : supprimer une séance

- **Date** : 17/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FacePracticeNotebook.tsx`

## Ce qu'on a fait et pourquoi

Un bouton **Supprimer** à côté de chaque séance. Dernière étape du carnet (I-09 à I-11). C'est le
deuxième usage de l'`id` annoncé en I-09, et la sauvegarde de I-10 s'en charge sans rien ajouter.

## Le code expliqué

### src/components/tools/FacePracticeNotebook.tsx — deux ajouts

```tsx
function handleDelete(id: number) {
  setSessions(sessions.filter((session) => session.id !== id))
}
```

- `handleDelete` reçoit l'`id` de la séance à supprimer.
- `.filter(condition)` crée un **nouveau tableau** avec seulement les éléments pour lesquels la
  condition est vraie.
- `!==` = « différent de ». `session.id !== id` : on garde toutes les séances **sauf** celle-là.
- Immuabilité respectée : `.filter` ne modifie pas `sessions`, il renvoie un nouveau tableau (comme
  le spread en I-09).
- Sauvegarde automatique : `sessions` change → l'effet de I-10 range la nouvelle liste dans
  `localStorage`.

| Avant | `handleDelete(222)` | Après |
| --- | --- | --- |
| `[{id: 333…}, {id: 222…}, {id: 111…}]` | garde les `id !== 222` | `[{id: 333…}, {id: 111…}]` |

```tsx
<li key={session.id}>
  {session.date} — {session.topic} ({session.minutes} min){' '}
  <button onClick={() => handleDelete(session.id)}>Supprimer</button>
</li>
```

- Le bouton est dans le `.map()` : un par séance, chacun connaît **son** `session.id`.
- `() => handleDelete(session.id)` : on donne une fonction, appelée au clic (le post-it de I-02).
- `{' '}` : un espace explicite (en JSX, un retour à la ligne entre deux éléments est ignoré).
- Le bouton n'est ni `type="submit"` ni dans le `<form>` : il ne déclenche pas l'ajout.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `.filter(condition)` | Nouveau tableau avec seulement les éléments qui vérifient la condition |
| `!==` | « Différent de » (le contraire de `===`) |
| `{' '}` | Un espace explicite en JSX |

## Quiz

1. Trois séances, on supprime celle du milieu : que fait `.filter`, que devient la liste ?
2. `session.id === id` au lieu de `!==` : que se passe-t-il au clic ?
3. On supprime une séance et on recharge : revient-elle ? Pourquoi, sans code de sauvegarde ajouté ?
4. `onClick={handleDelete(session.id)}` sans `() =>` : que se passe-t-il à l'affichage ?
5. Pourquoi supprimer par `id` et pas par le texte (`topic`) ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `.filter` teste chaque séance : condition vraie pour la 1ʳᵉ et la 3ᵉ (gardées), fausse pour celle
   du milieu (écartée). Nouveau tableau de 2 séances.
2. On ne garde **que** la séance cliquée : toutes les autres sont supprimées.
3. Non : `setSessions` change l'état, l'effet de I-10 (dépendance `[sessions]`) écrase le casier
   avec la nouvelle liste.
4. `handleDelete` est exécutée pendant l'affichage, pour chaque ligne : toutes les séances sont
   supprimées, React signale « Too many re-renders ». TypeScript le bloque avant : `onClick` attend
   une fonction, `handleDelete(...)` renvoie `void`.
5. Le texte n'est pas unique : deux séances « Pratique React » seraient supprimées ensemble. L'`id`
   est unique.

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots.

- Q4 : penser à dire que TypeScript bloque l'erreur avant l'exécution.

## Questions possibles à l'oral

- **Comment supprime-t-on une séance ?** `.filter` garde toutes les séances dont l'`id` est différent
  de celui cliqué, et le nouveau tableau va dans `setSessions`.
- **Pourquoi la suppression est-elle sauvegardée sans code en plus ?** L'effet de sauvegarde dépend
  de `[sessions]` : tout changement de la liste est rangé dans `localStorage`.
- **Pourquoi un `id` plutôt que le texte ?** Il est unique ; le texte peut se répéter.
