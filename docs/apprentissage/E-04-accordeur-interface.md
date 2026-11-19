# E-04 — Accordeur : de la fréquence à l'écran

- **Date** : 27/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/utils/notes.ts` (nouveau), `src/components/tools/FaceTuner.tsx`,
  `src/index.css` (styles de la jauge), `.prettierrc` (nouveau)

## Ce qu'on a fait et pourquoi

Le moteur audio sait écouter le micro (E-02) et trouver une fréquence (E-03), mais un musicien ne
lit pas des hertz : il veut **le nom de la note** et savoir s'il doit **tendre ou détendre** la corde.
On a ajouté :

1. `frequencyToNote` (dossier `utils/`) : fréquence → note, octave et écart en **cents** ;
2. le composant `FaceTuner` : bouton Démarrer/Arrêter, lecture de la note en boucle, affichage du
   nom, d'une jauge avec aiguille et d'un conseil.

La chaîne complète : **micro (E-02) → fréquence (E-03) → note (étape 1) → écran (étape 2)**.

## Le code expliqué

### src/utils/notes.ts — de la fréquence à la note

**Pourquoi `utils/`** : ce code ne touche ni au micro (`services/`) ni à l'écran (`components/`).
C'est du calcul pur, réutilisable (dictionnaire d'accords) et testable sans guitare.

**La musique d'abord** :

- une **octave** = fréquence × 2 (La2 = 110 Hz, La3 = 220 Hz, La4 = 440 Hz) ;
- une octave = **12 demi-tons**, chacun multiplie la fréquence par le même nombre (≈ 1,0595) ;
- `Math.log2` compte « combien de fois on a multiplié par 2 », d'où :

```
demi-tons depuis le La4 = 12 × log2(fréquence / 440)
```

**Le numéro MIDI** : norme des instruments électroniques, chaque touche a un numéro et
**+1 = un demi-ton** ; le La4 = 69. Avec un entier, tout devient simple :

| Ce qu'on veut | Calcul | Exemple : 45 |
| --- | --- | --- |
| Le **nom** | `midi % 12` (le reste) → case de `NOTE_NAMES`, **comptée depuis 0** | 45 % 12 = 9 → La |
| L'**octave** | `Math.floor(midi / 12) - 1` | floor(3,75) = 3, − 1 = 2 |
| | | → **La2** |

- `% 12` dit **où on est dans l'octave** (57, 69, 81 donnent tous 9 → La).
- `/ 12` arrondi vers le bas compte les octaves complètes ; le `- 1` vient de la norme MIDI, qui
  commence à l'octave −1 (60 = Do4, le do du milieu du piano).

```ts
const semitones = 12 * Math.log2(frequency / A4_FREQUENCY)
const exactMidi = A4_MIDI + semitones // décimal, ex. 44,8
const midi = Math.round(exactMidi) // note la plus proche : 45
const cents = Math.round((exactMidi - midi) * 100) // ce qui reste : -0,2 → -20 cents
```

- `Math.round` arrondit **au plus proche** (44,8 → 45, pas 44).
- **Ce qui reste après l'arrondi = l'écart** ; 1 demi-ton = 100 cents. Comme on arrondit au plus
  proche, l'écart est **toujours entre −50 et +50** : un résultat hors de cet intervalle signale
  une erreur de calcul.
- Une corde très désaccordée peut afficher **une autre note** : 80 Hz → Ré#2 +49, pas « Mi bas ».

```ts
frequency: A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12)
```

La formule **à l'envers** : la fréquence juste de la note, affichée comme « cible ». `**` = puissance.

### src/components/tools/FaceTuner.tsx — l'écran de l'accordeur

**La mémoire du composant : `useState`**

```tsx
const [listening, setListening] = useState(false) // micro allumé ?
const [note, setNote] = useState<Note | null>(null) // dernière note détectée
const [error, setError] = useState<string | null>(null) // micro refusé
```

Un **état** : une valeur dont le composant se souvient ; `setXxx` la change et React **redessine**.
Même principe que le store de Bilal (I-01), mais **local** : seul l'accordeur s'en sert.

**Le cœur : `useEffect` et son cleanup**

```tsx
useEffect(() => {
  if (!listening) { return }
  // ... allume le micro, lance la boucle
  return () => {
    cancelled = true
    cancelAnimationFrame(frameId)
    stopMicrophone()
  }
}, [listening])
```

- `useEffect` : pour agir **en dehors de l'affichage** (micro, boucle).
- `[listening]` : **tableau de dépendances**. React relance l'effet quand `listening` change, et
  **seulement** lui : changer de note ne déclenche rien (sinon le micro serait coupé et rallumé
  60 fois par seconde).
- La fonction renvoyée = le **cleanup** (nettoyage). Image : l'effet allume la lumière en entrant
  dans la pièce, le cleanup l'éteint en sortant. React l'appelle à **deux moments** :
  1. quand `listening` change → clic sur **Arrêter** ;
  2. quand le composant **disparaît** (est *démonté*) → clic sur **Métronome** : le `ToolPanel` de
     Bilal (I-03) n'affiche plus `FaceTuner`.
- Il appelle **`cancelAnimationFrame`** (arrête la boucle) et **`stopMicrophone`** (libère le
  micro, le voyant s'éteint).
- **Le sens de la chaîne** : clic → `setListening(false)` → React → cleanup → les `stop`. Ce n'est
  pas `stop` qui déclenche le cleanup, c'est le cleanup qui appelle les `stop`.

Vérifié **par l'expérience** : un `console.log` dans le cleanup ne s'affiche ni en jouant des notes,
ni pendant l'écoute ; il s'affiche au clic sur Arrêter et au changement de face.

**La boucle : `requestAnimationFrame`**

```tsx
const update = () => {
  const frequency = detectPitch(analyser)
  if (frequency !== null) {
    setNote(frequencyToNote(frequency))
  }
  frameId = requestAnimationFrame(update) // EN DEHORS du if
}
update()
```

- Demande au navigateur d'appeler `update` **avant la prochaine image** (~60 fois par seconde) ;
  `update` redemande à chaque fois → une boucle.
- Ce n'est pas une récursion : chaque appel se termine avant le suivant, rien ne s'empile. Et ça ne
  dessine rien : ça **cale la boucle** sur le rythme de l'écran (React, lui, affiche).
- Avantage sur `setInterval` : synchronisé avec l'écran, **en pause quand l'onglet est caché**.
- **Silence** (`null`) : la relance est hors du `if`, donc **la boucle continue** ; elle ne change
  simplement pas la note → l'écran garde la dernière, comme un vrai accordeur. Dès qu'on rejoue,
  la nouvelle note s'affiche.

**La ceinture de sécurité : `cancelled`**

```tsx
startMicrophone().then((analyser) => {
  if (cancelled) { stopMicrophone(); return }
```

Inutile en usage normal ; elle ne sert qu'en cas d'« accident » :

| Étape | Sans `cancelled` | Avec `cancelled` |
| --- | --- | --- |
| 1. Démarrer | `startMicrophone()` attend… | pareil |
| 2. Fenêtre d'autorisation | …pas encore de réponse | pareil |
| 3. Clic sur Métronome | cleanup : `stopMicrophone()` n'a **rien à couper** | pareil + `cancelled = true` |
| 4. « Autoriser » | micro ouvert + boucle **alors que l'accordeur n'est plus à l'écran** | le `.then` voit `cancelled` → micro refermé |

Sans elle : un micro ouvert à l'insu de l'utilisateur (vie privée) et une boucle inutile.
`.catch(...)` gère le **refus** du micro (E-02) : message rouge, bouton remis sur Démarrer.

**L'affichage**

- `{listening && note && (...)}` : **affichage conditionnel** ; si la gauche du `&&` est fausse,
  React n'affiche rien.
- `` style={{ left: `${50 + note.cents}%` }} `` : −50 cents → 0 % (bord gauche), 0 → 50 % (centre),
  +50 → 100 %. Entre accents graves, une **template string** : `${...}` insère une valeur.
- `tuningHint(cents)` : petite fonction hors du composant qui transforme l'écart en conseil ; ±5
  cents = juste (aiguille verte).

### .prettierrc — garder le style du projet

L'extension Prettier de VS Code reformatait le fichier à l'enregistrement (guillemets doubles, `;`).
Ce fichier lui donne le style du projet : sans `;`, guillemets simples, lignes de 100 caractères.

### Test réalisé

Navigateur Chrome (le navigateur intégré à l'appli Claude bloque le micro) : 6 cordes reconnues,
aiguille qui glisse et passe au vert, micro coupé au changement de face, message rouge si refus.
Le serveur se lance dans PowerShell avec `cd C:\MAMP\htdocs\UE5` puis `npm run dev` (pas de `&&`
dans Windows PowerShell 5 : séparer par `;`).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Octave | Intervalle où la fréquence double ; même nom de note |
| Demi-ton | 1/12 d'octave ; plus petit écart entre deux notes de la gamme |
| Numéro MIDI | Numéro de note, +1 par demi-ton ; La4 = 69 |
| `%` (modulo) | Reste de la division entière : 45 % 12 = 9 |
| `Math.floor` / `Math.round` | Arrondi vers le bas / arrondi au plus proche |
| Off-by-one | Erreur de décalage de 1, souvent en comptant depuis 1 au lieu de 0 |
| État (`useState`) | Valeur mémorisée par un composant ; la changer le redessine |
| `useEffect` | Exécute du code hors affichage, relancé quand ses dépendances changent |
| Tableau de dépendances | Les valeurs dont le changement relance l'effet |
| Cleanup | Fonction renvoyée par l'effet ; React l'appelle pour tout arrêter |
| Démonter (*unmount*) | Retirer un composant de l'écran |
| `requestAnimationFrame` | Appelle une fonction avant la prochaine image de l'écran |
| Affichage conditionnel | `condition && <élément>` : n'affiche que si la condition est vraie |
| Template string | Texte entre accents graves avec `${valeur}` insérées |
| Prettier | Outil qui met en forme le code automatiquement |

## Quiz

1. Une corde vibre à 220 Hz : demi-tons depuis le La 440, numéro MIDI, note ?
2. MIDI exact 52,18 : note affichée, cents, trop haut ou trop bas, tendre ou détendre ?
3. À quoi sert le cleanup du `useEffect` ? Les deux moments où React l'appelle, avec un exemple ?
4. Pourquoi `requestAnimationFrame` plutôt qu'une seule lecture ? Que fait la boucle sur `null` ?
5. À quoi sert `cancelled` ? Quel scénario empêche-t-il ?

Rattrapage :

- A. MIDI exact 44,8 : arrondi, nom, octave, cents, conseil.
- B. Clic sur Arrêter : qu'est-ce qui change, et pourquoi le cleanup est-il appelé ?
- C. Silence complet après un La : que fait la boucle, que voit-on ?
- D. Démarrer → fenêtre d'autorisation → Métronome → Autoriser : sans et avec `cancelled` ?
- E. MIDI exact 61,3 : les 5 étapes.
- F. Pendant le silence, combien d'appels à `detectPitch` par seconde ? Pourquoi ?
- G. Compléter : Métronome → `ToolPanel` n'affiche plus `FaceTuner` → le composant ___ → React
  appelle le ___ → qui appelle ___ et ___.
- H. Phrase d'oral sur le cleanup, appuyée sur l'expérience du `console.log`.

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. 220 = 440 / 2 : **12 demi-tons en dessous** → 69 − 12 = **57** → **La3**.
2. Arrondi 52, reste 0,18 → **+18 cents** ; 52 % 12 = 4 → case 4 (depuis 0) = **Mi** ;
   floor(4,33) − 1 = 3 → **Mi3, +18 cents, trop haut → détendre**.
3. Tout arrêter : la boucle (`cancelAnimationFrame`) et le micro (`stopMicrophone`). Appelé quand
   `listening` change (clic sur Arrêter) et quand le composant disparaît (clic sur Métronome).
4. Pour suivre la note **en temps réel** pendant qu'on tourne la mécanique. Sur `null`, la boucle
   **continue** mais ne change pas la note : la dernière reste affichée.
5. Drapeau levé par le cleanup. Si on quitte l'accordeur **pendant** la demande d'autorisation, le
   cleanup n'a rien à couper ; quand le micro arrive, le `.then` voit `cancelled` et le referme.
   Sans lui : micro ouvert à l'insu de l'utilisateur + boucle inutile.

- A. 45 → 45 % 12 = 9 → La ; floor(3,75) − 1 = 2 ; (44,8 − 45) × 100 = −20 → **La2, −20 cents,
  trop bas → tendre**.
- B. `toggle` → `setListening(false)` → `listening` est dans `[listening]` → React appelle le
  cleanup → `cancelAnimationFrame` + `stopMicrophone` (`track.stop()`).
- C. La boucle continue (~60 fois/s), la note ne change pas : le La reste affiché.
- D. Voir le tableau « ceinture de sécurité » ci-dessus.
- E. 61 → 61 % 12 = 1 → Do# ; floor(5,08) − 1 = 4 ; +30 cents → **Do#4, trop haut → détendre**.
- F. ~60 : `requestAnimationFrame(update)` est hors du `if`, la relance a lieu même sur `null`.
- G. **disparaît** (démonté) → **cleanup** → **`cancelAnimationFrame`** et **`stopMicrophone`**.
- H. Le cleanup est la fonction renvoyée par le `useEffect` : React l'appelle quand on clique sur
  Arrêter et quand on change de face ; elle appelle `cancelAnimationFrame` et `stopMicrophone`.

</details>

## Points à retravailler (E)

- **Compter depuis 0** dans un tableau (case 2 = Ré, pas Do#) : erreur off-by-one, faite deux fois.
- **`%` donne le nom, `/` donne l'octave** : ne pas utiliser le quotient pour le nom.
- **Arrondir au plus proche** (`Math.round`), pas tronquer ; des cents hors de ±50 = erreur.
- Ne pas oublier le **− 1** de l'octave.
- **Cleanup** : le sens de la chaîne (le cleanup appelle les `stop`, pas l'inverse) ; il n'est
  **pas** déclenché par un changement de note ; nommer ses deux fonctions.
- **La boucle ne s'arrête pas sur un silence** (relance hors du `if`).
- Employer le vocabulaire exact (démonté, cleanup) : à l'oral, ce sont ces mots qu'on attend.

## Questions possibles à l'oral

- **Comment passez-vous d'une fréquence au nom de la note ?** `12 × log2(f / 440)` donne les
  demi-tons depuis le La 440 ; on en tire un numéro MIDI ; `% 12` donne le nom, `/ 12` l'octave,
  et le reste de l'arrondi l'écart en cents.
- **Comment l'affichage reste-t-il à jour ?** Une boucle `requestAnimationFrame` lit la fréquence
  ~60 fois par seconde et met à jour l'état `note`, ce qui redessine le composant.
- **Comment êtes-vous sûrs que le micro est coupé quand on change d'outil ?** Le cleanup du
  `useEffect` est appelé quand le composant est démonté ; il arrête la boucle et appelle
  `stopMicrophone`. Vérifié avec un `console.log` et le voyant du navigateur.
- **Que se passe-t-il si l'utilisateur quitte l'accordeur pendant la demande d'autorisation ?** Le
  drapeau `cancelled` fait refermer le micro dès qu'il arrive.
- **Pourquoi un dossier `utils/` ?** Code de calcul pur, sans micro ni affichage : réutilisable
  (accords) et testable seul.
