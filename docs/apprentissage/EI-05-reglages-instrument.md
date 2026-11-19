# EI-05 — Réglages : l'instrument par défaut des tablatures

- **Date** : 19/11/2026
- **Auteur** : I (partie commune : context des réglages ; une ligne de `FaceTabs`, partie de E)
- **Fichiers touchés** : `src/context/SettingsContext.tsx`, `src/components/tools/FaceSettings.tsx`,
  `src/components/tools/FaceTabs.tsx`

> ⚠️ **Quiz pas encore fait** (sauté le 19/11 pour finir l'appli) : à faire avant la soutenance.

## Ce qu'on a fait et pourquoi

Dans les Réglages, une rubrique « Tablatures » permet de choisir l'instrument par défaut (guitare,
basse, ukulélé). Les Tablatures démarrent sur ce choix au lieu de toujours démarrer sur la guitare ;
on peut toujours en changer sur place pour une recherche. C'est ce que prévoyait EI-02 : un champ
dans `Settings` + un `case` dans le reducer.

## Le code expliqué

### src/context/SettingsContext.tsx — un deuxième réglage

```tsx
import type { Instrument } from '../services/tablatureApi'

export type Settings = {
  cubeMaterial: CubeMaterial
  instrument: Instrument
}

type SettingsAction =
  | { type: 'setCubeMaterial'; material: CubeMaterial }
  | { type: 'setInstrument'; instrument: Instrument }

const DEFAULT_SETTINGS: Settings = { cubeMaterial: 'plastique', instrument: 'guitar' }
...
    case 'setInstrument':
      return { ...settings, instrument: action.instrument }
```

- On réutilise le type `Instrument` de E (`'guitar' | 'bass' | 'ukulele'`) : une seule définition,
  pas de divergence possible. `import type` : rien dans le JavaScript final.
- Union d'actions : une action est l'une **ou** l'autre forme ; son `type` dit à TypeScript quelles
  données l'accompagnent.
- Défaut : guitare (comme avant dans `FaceTabs`). Deuxième `case`, même schéma que le premier.
- La fusion de `loadSettings` (EI-02) sert ici : un vieux casier sans `instrument` reçoit
  `'guitar'` au lieu de `undefined`.

### src/components/tools/FaceSettings.tsx — rubrique « Tablatures »

```tsx
<select
  value={settings.instrument}
  onChange={(event) =>
    dispatch({ type: 'setInstrument', instrument: event.target.value as Instrument })
  }
>
  <option value="guitar">Guitare</option>
  <option value="bass">Basse</option>
  <option value="ukulele">Ukulélé</option>
</select>
```

Même forme que la rubrique Cube : `<select>` contrôlé par le context, `dispatch`, `as Instrument`
(sûr car nous contrôlons les options). Valeurs = codes de E, textes en français.

### src/components/tools/FaceTabs.tsx (E) — une ligne

```tsx
const { settings } = useSettings()
const [instrument, setInstrument] = useState<Instrument>(settings.instrument)
```

La valeur de départ vient des réglages (avant : `'guitar'` en dur). On garde un `useState` local :
c'est un **défaut**, pas une obligation. Changer d'instrument dans les Tablatures ne modifie pas le
réglage ; à la prochaine ouverture, on repart du défaut (même principe que le tempo par défaut, I-12).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Union d'actions | `A \| B` : une action est de l'une ou l'autre forme, distinguées par `type` |
| Valeur de départ (défaut) | Valeur avec laquelle un état démarre, que l'utilisateur peut changer |

## Quiz

1. Le casier `reglages-generaux` ne contient que `{"cubeMaterial":"bois"}` : que vaut
   `settings.instrument` au chargement, quelle ligne y veille ?
2. Défaut : Basse. Dans les Tablatures on passe à Ukulélé, on change de face, on revient : quel
   instrument est affiché ? Pourquoi ?
3. Pourquoi réutiliser le type `Instrument` de `tablatureApi.ts` au lieu d'en écrire un nouveau ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. `'guitar'` : `return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }` pose les défauts puis écrase
   seulement ce qui est enregistré.
2. Basse : `FaceTabs` est démonté en changeant de face, son `useState` (Ukulélé) est perdu ; remonté,
   il repart de `settings.instrument`. Le choix sur place ne change pas le réglage.
3. Une seule définition du type : si E ajoute un instrument, le context, les Réglages et les
   Tablatures restent d'accord ; deux types différents (`'guitare'` / `'guitar'`) ne
   correspondraient pas aux pistes renvoyées par l'API.

</details>

## Points à retravailler (I)

- **Quiz à faire** (sauté le 19/11).

## Questions possibles à l'oral

- **Comment ajoute-t-on un réglage partagé ?** Un champ dans `Settings` + sa valeur dans
  `DEFAULT_SETTINGS` + une action et un `case` dans le reducer ; on le lit avec `useSettings()`.
- **Pourquoi les Tablatures gardent-elles un `useState` ?** Le réglage est un défaut ; le choix sur
  place est temporaire et ne doit pas modifier le réglage.
