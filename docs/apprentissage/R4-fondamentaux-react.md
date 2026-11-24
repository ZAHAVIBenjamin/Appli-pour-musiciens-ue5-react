# R4 — Les fondamentaux React (révision transversale)

- **Date** : 24/11/2026 (séance de révision R4)
- **Auteur** : E (à relire aussi par I avant la soutenance)
- **Chapitres** : 4 (state, immutabilité, champs contrôlés), 6 (fetch), 7 (pureté, règles des hooks)

Cette fiche ne correspond pas à une fonctionnalité : elle rassemble les **règles de base** que le jury
peut demander sur n'importe quel morceau du code.

## 1. Un rendu doit être pur (chapitre 7)

Un composant est un **calcul** : mêmes props et même state → **même résultat**, et **rien de modifié
à l'extérieur** (variable globale, `localStorage`, DOM, réseau).

```tsx
let compteur = 0
function Mauvais() {
  compteur++            // ❌ modifie l'extérieur à CHAQUE rendu (et 2 fois en StrictMode)
  return <p>{compteur}</p>
}

function Bon() {
  const [compteur, setCompteur] = useState(0)
  return <button onClick={() => setCompteur((c) => c + 1)}>{compteur}</button> // ✅ dans un gestionnaire
}
```

- On modifie les choses dans un **gestionnaire d'événement** (`onClick`, `onChange`…) ou dans un
  **`useEffect`** (synchronisation avec un système extérieur).
- Exemple chez nous : `ChordDiagram` est pur, car le même accord donne toujours le même SVG.
- `c => c + 1` s'appelle un **updater** : il part de la valeur la plus récente.

## 2. Immutabilité : un nouveau tableau, pas un `push` (chapitre 4)

```tsx
sessions.push(nouvelleSeance)
setSessions(sessions)                       // ❌ même référence → « rien n'a changé » → pas de rendu

setSessions([...sessions, nouvelleSeance])  // ✅ nouveau tableau → React voit le changement
```

React compare **l'ancienne et la nouvelle référence**. Si c'est le même objet, il ne redessine pas :
la séance n'apparaît pas à l'écran. Pareil pour les objets : `{ ...settings, instrument }` (le reducer
de Bilal).

## 3. Les règles des hooks : l'image du vestiaire (chapitre 7)

React ne lit pas le nom des hooks. Il les reconnaît par leur **position** (leur ordre d'appel), comme
un **vestiaire à tickets numérotés** : ticket n°1 pour le 1er hook, n°2 pour le 2e…

Si un hook est dans un `if` et saute un rendu, tout se décale : un hook reçoit **la valeur d'un autre**.

> Les hooks s'appellent **toujours au plus haut niveau** du composant, **dans le même ordre** à chaque
> rendu : jamais dans un `if`, une boucle ou après un `return`.

## 4. La `key` dans une liste

`key` permet à React de **suivre chaque élément** d'une liste quand elle change (ajout, suppression,
tri). Avec l'index, « l'accroche » devient fausse dès que les éléments changent de place. Nos accords
n'ont pas d'`id`, mais leur **nom est unique** dans un instrument : il sert d'identifiant.

## 5. Champ contrôlé (chapitre 4)

```tsx
<input value={note} onChange={(e) => setNote(e.target.value)} />
```

- La valeur affichée **vient du state** : le state est la **source unique de vérité**.
- Sans `onChange`, le champ est **bloqué** : on tape, React réaffiche la valeur du state, qui ne change
  jamais (et un avertissement apparaît en console).

## 6. `fetch` et ses 3 états (chapitre 6)

Pendant un chargement, on affiche toujours l'un des trois : **chargement**, **erreur** ou **succès**
(les données).

**L'image du facteur 📮** : `fetch` ne lance une erreur que si le facteur **n'a pas pu livrer** (pas
de réseau). Une 404 ou une 500, c'est une **lettre bien livrée** dont le contenu dit « introuvable » :
`fetch` réussit, avec `response.ok === false`. C'est donc **à nous** de vérifier :

```tsx
const response = await fetch(url)
if (!response.ok) throw new Error(`Erreur ${response.status}`)
const data = await response.json()
```

C'est ce que font les tablatures (E-05).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Rendu pur | Mêmes entrées → même résultat, rien de modifié à l'extérieur |
| Gestionnaire d'événement | Fonction branchée sur `onClick`, `onChange`… : là où l'on modifie le state |
| Updater | Fonction passée à `setX` : `prev => nouvelleValeur` |
| Référence | « Adresse » d'un objet : React compare les références, pas le contenu |
| Spread | `[...tableau]` / `{ ...objet }` : copie pour créer un nouvel objet |
| Règles des hooks | Toujours au plus haut niveau, même ordre à chaque rendu |
| `key` | Identifiant stable d'un élément de liste |
| Champ contrôlé | Champ dont la valeur vient du state (`value` + `onChange`) |
| `response.ok` | `true` si le statut HTTP est entre 200 et 299 |

## Quiz (séance R4)

1. Qu'est-ce qui ne va pas dans un composant qui fait `compteur++` sur une variable extérieure ?
2. Pourquoi `push` + `setSessions(sessions)` n'affiche-t-il rien ?
3. Pourquoi ne jamais mettre un hook dans un `if` ?
4. À quoi sert la `key` ? Pourquoi pas l'index ?
5. Que se passe-t-il avec `value` sans `onChange` ?
6. Les 3 états d'un `fetch` ; pourquoi une 404 ne lance pas d'erreur ?

Rattrapage :

- c. Un rendu doit rester ___ : rien de modifié à l'___. On modifie dans un ___ d'événement ou un `useEffect`.
- d. Même référence → pas de nouveau ___. Il faut un ___ tableau avec le ___.
- e. React reconnaît les hooks par leur ___ ; toujours au plus ___ niveau, jamais dans un ___.
- f. `value` sans `onChange` → champ ___.
- g. useRef = « ___ sans ___ ».

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Le rendu n'est pas pur : il modifie l'extérieur à chaque rendu (2 fois en StrictMode). Il faut un
   `useState` augmenté dans un `onClick`.
2. Même référence : React croit que rien n'a changé et ne redessine pas. Il faut `[...sessions, x]`.
3. React reconnaît les hooks par leur position ; un `if` décale l'ordre et mélange les valeurs.
4. Suivre chaque élément quand la liste change ; l'index ne suit plus le bon élément si l'ordre change.
5. Le champ est bloqué : la valeur vient du state, qui ne change jamais.
6. Chargement / erreur / succès. `fetch` ne rejette que si le réseau échoue ; une 404 est une réponse
   livrée avec `ok === false`, il faut tester `response.ok` soi-même.

- c. pur ; extérieur ; gestionnaire.
- d. rendu ; nouveau ; spread.
- e. position (ordre) ; haut ; `if` (ou boucle).
- f. bloqué.
- g. Retient ; Rendu.

</details>

## Points à retravailler (E)

- Le mot **« gestionnaire d'événement »** (pas « set d'événement »).
- **Règles des hooks** = position / plus **haut** niveau / jamais dans un `if` (le vestiaire).
- Les 3 états du fetch : dire **succès** (pas « find »).
- Acquis pendant R4 : « Retient sans Rendu », immutabilité/spread, `key`, `response.ok`.

## Questions possibles à l'oral

- **Comment ajoutez-vous une séance au carnet ?** Avec un nouveau tableau (spread), pour que React voie
  une nouvelle référence et redessine.
- **Que se passe-t-il si l'API des tablatures renvoie une 404 ?** `fetch` ne rejette pas ; on teste
  `response.ok` et on lance nous-mêmes l'erreur, affichée dans l'état « erreur ».
- **Pourquoi vos hooks sont-ils tous en haut des composants ?** React les identifie par leur ordre
  d'appel ; il doit être le même à chaque rendu.
