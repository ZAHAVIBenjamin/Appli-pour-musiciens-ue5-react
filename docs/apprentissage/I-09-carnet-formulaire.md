# I-09 — Carnet d'entraînement : le formulaire et la liste des séances

- **Date** : 16/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FacePracticeNotebook.tsx`

## Ce qu'on a fait et pourquoi

Sur la face « Carnet », on écrit ce qu'on a travaillé et combien de temps, on clique sur
**Ajouter** : la séance apparaît dans la liste, avec la date du jour, la plus récente en haut. Pour
l'instant tout disparaît au rechargement : la sauvegarde (`localStorage`) vient en I-10.

Outils du cours : state d'un **tableau**, formulaire, champs contrôlés, `.map()`, immuabilité
(chapitre 4).

## Le code expliqué

### src/components/tools/FacePracticeNotebook.tsx — la face du carnet

```tsx
type Session = {
  id: number
  date: string
  topic: string
  minutes: number
}
```

Forme d'une séance (comme `AppState` en I-01). `id` : numéro unique (`key` de la liste, et
suppression de la bonne séance en I-11) ; `date` en texte ; `topic` = ce qu'on a travaillé ;
`minutes` = la durée.

```tsx
const [sessions, setSessions] = useState<Session[]>([])
const [topic, setTopic] = useState('')
const [minutes, setMinutes] = useState(15)
```

- `sessions` : la **liste** enregistrée, vide au départ. `<Session[]>` dit à TypeScript que c'est un
  tableau de séances (il ne peut pas le deviner à partir de `[]`).
- `topic`, `minutes` : le **brouillon** en cours de saisie (champs contrôlés, comme en I-05).
- Trois états séparés : on vide le brouillon après un ajout sans toucher à la liste.

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault()
  if (topic.trim() === '') {
    return
  }
```

- Appelée à l'envoi du formulaire : clic sur Ajouter **ou** touche Entrée.
- `preventDefault()` : sans lui, envoyer un `<form>` recharge toute la page (l'appli redémarre, tout
  est perdu). Même chose dans `FaceTabs` (E).
- `.trim()` enlève les espaces au début et à la fin : un texte vide ou fait d'espaces est refusé.

```tsx
  const newSession: Session = {
    id: Date.now(),
    date: new Date().toLocaleDateString('fr-FR'),
    topic: topic.trim(),
    minutes,
  }
  setSessions([newSession, ...sessions])
  setTopic('')
}
```

- `Date.now()` : millisecondes depuis 1970, unique à chaque clic → bon `id`.
- `new Date().toLocaleDateString('fr-FR')` : la date du jour au format « 16/11/2026 ».
- `minutes,` = raccourci de `minutes: minutes`.
- `[newSession, ...sessions]` : le **spread** `...` « vide » l'ancien tableau dans un **nouveau**,
  après la nouvelle séance → la plus récente en haut.
- **Immuabilité** : jamais `sessions.push(...)`. Le tableau resterait le même en mémoire, React ne
  verrait aucun changement et ne redessinerait pas. On crée un nouveau tableau et on le donne à
  `setSessions`.
- `setTopic('')` vide le champ texte ; la durée reste (on travaille souvent par blocs égaux).

```tsx
<form onSubmit={handleSubmit}>
  <input value={topic} onChange={(event) => setTopic(event.target.value)}
    placeholder="Ce que j'ai travaillé" />
  <input type="number" min={1} value={minutes}
    onChange={(event) => setMinutes(Number(event.target.value))} />
  <span> min </span>
  <button type="submit">Ajouter</button>
</form>
```

- `onSubmit` sur le `<form>` (pas sur le bouton) : c'est ce qui fait marcher Entrée.
- Champ texte : pas de `Number`, on veut du texte. `placeholder` = texte grisé quand c'est vide.
- Champ `type="number"` : le navigateur n'accepte que des chiffres, mais `event.target.value` reste
  du texte → `Number(...)`. `min={1}` : pas de durée nulle avec les flèches.
- `type="submit"` : le bouton envoie le formulaire.

```tsx
{sessions.length === 0 ? (
  <p>Aucune séance pour l'instant.</p>
) : (
  <ul>
    {sessions.map((session) => (
      <li key={session.id}>
        {session.date} — {session.topic} ({session.minutes} min)
      </li>
    ))}
  </ul>
)}
```

- **Rendu conditionnel** avec un ternaire : un message si la liste est vide, sinon la liste.
- `<ul>` / `<li>` : liste à puces ; `.map()` + `key={session.id}`.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `type Session = {…}` | Décrit la forme d'un objet (comme une `interface`) |
| `Session[]` | Un tableau de `Session` |
| `useState<Session[]>([])` | État « tableau de séances », vide au départ |
| `onSubmit` / `preventDefault()` | Appelé à l'envoi du formulaire / empêche le rechargement de la page |
| `.trim()` | Enlève les espaces au début et à la fin d'un texte |
| `Date.now()` | Millisecondes depuis 1970, utilisé comme `id` unique |
| `...tableau` (spread) | « Vide » un tableau à cet endroit pour en construire un nouveau |
| Immuabilité | Ne jamais modifier un état directement, toujours en créer un nouveau |
| Rendu conditionnel | Afficher une chose ou une autre selon une condition |
| `<ul>` / `<li>` | Liste à puces / un élément de la liste |

## Quiz

1. On supprime `event.preventDefault()`. On tape « gammes » et on clique sur Ajouter : que se
   passe-t-il ?
2. On remplace `setSessions([newSession, ...sessions])` par `sessions.push(newSession)` : pourquoi
   la séance n'apparaît-elle pas ?
3. On tape trois espaces et on clique sur Ajouter : que se passe-t-il, quelle ligne en décide ?
4. `[...sessions, newSession]` au lieu de `[newSession, ...sessions]` : qu'est-ce qui change ?
5. Pourquoi un `id` dans chaque séance ? Deux usages.

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Toute la page se recharge (comportement par défaut d'un `<form>`) : l'appli redémarre, la saisie
   et la liste sont perdues.
2. `.push()` modifie le tableau existant (immuabilité non respectée) et `setSessions` n'est pas
   appelé : même tableau en mémoire, React ne voit rien, pas de redessin.
3. Rien n'est ajouté : `if (topic.trim() === '') return` — `.trim()` retire les espaces, il reste
   `''`, la fonction s'arrête.
4. La nouvelle séance apparaît en bas de la liste au lieu d'en haut.
5. `key={session.id}` dans le `.map()` (I-09) ; savoir quelle séance supprimer (I-11).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots. En Q2, j'ai ajouté de moi-même que `setSessions`
n'était pas appelé : c'est la raison complète.

## Questions possibles à l'oral

- **Pourquoi ne pas faire `sessions.push(...)` ?** Immuabilité : React compare l'ancien et le nouvel
  état ; un tableau modifié sur place est « le même », rien n'est redessiné.
- **Pourquoi `preventDefault()` ?** Un `<form>` recharge la page à l'envoi ; dans une SPA, ça
  redémarrerait toute l'appli.
- **Pourquoi `Date.now()` comme `id` ?** Unique à chaque milliseconde, donc à chaque ajout ; pas
  besoin de compteur.
- **Pourquoi le brouillon et la liste sont-ils des états séparés ?** On vide le brouillon après un
  ajout sans toucher aux séances enregistrées.
