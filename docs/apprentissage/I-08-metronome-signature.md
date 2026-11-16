# I-08 — Métronome : choisir la signature (2, 3 ou 4 temps)

- **Date** : 16/11/2026
- **Auteur** : I
- **Fichiers touchés** : `src/components/tools/FaceMetronome.tsx`

## Ce qu'on a fait et pourquoi

Le nombre de temps par mesure n'est plus fixe (4 en I-07) : une **liste déroulante** permet de
choisir **2/4** (marche), **3/4** (valse) ou **4/4** (pop, rock). Dernière étape du métronome, sans
notion nouvelle : `.map()` + `key` (I-02), champ contrôlé + `Number` (I-05), modulo (I-07).

## Le code expliqué

### src/components/tools/FaceMetronome.tsx — 5 changements par rapport à I-07

```tsx
const BAR_CHOICES = [2, 3, 4]
```

`BEATS_PER_BAR = 4` disparaît, remplacé par la **liste des choix possibles** : fixe, donc constante
hors du composant (comme `FACES`, I-02).

```tsx
const [beatsPerBar, setBeatsPerBar] = useState(4)
```

Le **choix actuel** de l'utilisateur : il change et l'écran comme le son doivent suivre → état
(même règle que `bpm`, I-05). Valeur de départ : 4.

```tsx
playClick(beatIndex % beatsPerBar === 0, nextBeatTime)
...
}, [isPlaying, bpm, beatsPerBar])
```

- Le modulo marche avec n'importe quel nombre : `% 3` compte 0, 1, 2, 0, 1, 2…
- `beatsPerBar` rejoint les dépendances : changer la signature pendant que ça tourne relance l'effet.

```tsx
<select
  value={beatsPerBar}
  onChange={(event) => setBeatsPerBar(Number(event.target.value))}
>
  {BAR_CHOICES.map((beats) => (
    <option key={beats} value={beats}>
      {beats}/4
    </option>
  ))}
</select>
```

- `<select>` = liste déroulante ; `<option>` = un choix.
- Champ **contrôlé**, comme le curseur de I-05 : `value` impose le choix affiché, `onChange` met
  l'état à jour, `Number(...)` car la valeur est toujours du texte.
- `.map()` fabrique un `<option>` par valeur (comme les liens de `FaceNav`) ; `key={beats}` : 2, 3
  et 4 sont uniques.
- `value={beats}` = valeur envoyée ; `{beats}/4` = texte affiché.

Pourquoi « /4 » : chiffre du haut = temps par mesure, chiffre du bas = unité de temps (4 = la
noire), la même pour les trois choix.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Signature rythmique | Nombre de temps par mesure : 2/4, 3/4, 4/4 |
| `<select>` / `<option>` | Liste déroulante / un choix de la liste |

## Quiz

1. Pourquoi `BAR_CHOICES` est une constante mais `beatsPerBar` un `useState` ?
2. On oublie `beatsPerBar` dans les dépendances. Le métronome tourne en 4/4, on choisit 3/4 :
   qu'entend-on ?
3. On écrit `setBeatsPerBar(event.target.value)` sans `Number` : que se passe-t-il, et quand ?
4. On veut ajouter 6/4 : quelle ligne modifier, et pourquoi ça suffit ?
5. En 3/4, à quel `beatIndex` entend-on le 3ᵉ TOC ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `BAR_CHOICES` = les options possibles, fixes ; `beatsPerBar` = le choix actuel, qui change et
   doit faire réagir l'écran et le son.
2. Toujours du 4/4 : l'effet ne redémarre pas et la boucle garde l'ancienne valeur. Stop puis
   Démarrer relance l'effet avec 3.
3. On donne du texte (`"3"`) à un état `number` : erreur TypeScript dans l'éditeur, `typecheck` et
   `build` (pas en `npm run dev`).
4. Seulement `const BAR_CHOICES = [2, 3, 4, 6]` : `.map()` crée l'option, et `% beatsPerBar`
   marche avec n'importe quel nombre.
5. `beatIndex = 6` (7ᵉ clic) : TOC à 0, 3, 6 (`6 = 3 × 2 + 0`).

</details>

## Points à retravailler (I)

Quiz réussi (5/5) au premier essai, avec mes mots : les notions de I-02, I-05 et I-07 sont acquises.

- Q3 : préciser à chaque fois que `npm run dev` ne vérifie pas les types.

## Questions possibles à l'oral

- **Comment l'utilisateur choisit-il la signature ?** Une liste déroulante contrôlée : `value` vient
  de l'état `beatsPerBar`, `onChange` le met à jour.
- **Comment l'accent s'adapte-t-il ?** `beatIndex % beatsPerBar === 0` : vrai au premier temps de
  chaque mesure, quel que soit le nombre de temps.
- **Ajouter une signature, c'est compliqué ?** Non : une valeur de plus dans `BAR_CHOICES`.
