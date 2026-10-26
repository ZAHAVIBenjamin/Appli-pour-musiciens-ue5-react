# 01 — Moteur audio : jouer un clic

- **Date** : 26/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/services/audioEngine.ts`

## Ce qu'on a fait et pourquoi

On a créé le cœur sonore de l'appli : un `AudioContext` unique et une fonction `playClick` qui joue
un clic de métronome, normal ou accentué, tout de suite ou à un instant précis. C'est la première
brique dont le métronome (partie de I) a besoin ; l'accordeur réutilisera le même contexte.

On a choisi de synthétiser le clic (oscillateur + enveloppe de volume) plutôt que de lire un
fichier son : rien à télécharger, son réglable par code, et timing exact.

## Le code expliqué

### Le principe : une chaîne de modules

```
[ Oscillateur ] ──► [ Volume (Gain) ] ──► [ Haut-parleurs (destination) ]
  produit l'onde      la façonne            la joue
```

L'`AudioContext` est le « studio » : il crée les modules, possède les haut-parleurs
(`destination`) et une horloge très précise (`currentTime`, en secondes).

### Un seul contexte, créé au premier besoin

```ts
let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (audioContext === null) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}
```

- `let` car la valeur change (`null` puis le contexte) ; `AudioContext | null` est un type union.
- Variable hors des fonctions = partagée par tout le fichier = un seul contexte.
- Pourquoi un seul : le navigateur limite leur nombre (ressources), et **chaque contexte a sa
  propre horloge** ; le métronome doit programmer tous ses clics sur la même.
- Création paresseuse (*lazy*) : au premier appel seulement.
- Les navigateurs bloquent le son tant que l'utilisateur n'a pas interagi avec la page : un
  contexte créé trop tôt est `'suspended'`. Sans `resume()`, `playClick` s'exécuterait **sans
  erreur mais sans aucun son** (bug silencieux).

### La signature de playClick

```ts
export function playClick(accent = false, time?: number): void {
  const ctx = getAudioContext()
  const start = time ?? ctx.currentTime
```

- `accent = false` : valeur par défaut.
- `time?: number` : paramètre optionnel (`undefined` s'il est absent).
- `??` : prend `time` sauf s'il vaut `undefined` ou `null` → sinon « maintenant ».
  `playClick(true)` joue tout de suite ; `playClick(false, 3)` joue à 3 s sur l'horloge audio ;
  `playClick(false, 0)` joue bien à 0 (`??` ne remplace pas 0, contrairement à `||`).
- Le paramètre `time` existe pour le métronome : `setTimeout` est imprécis de quelques
  millisecondes (décalage audible), l'horloge audio est exacte. On programme les clics à l'avance.

### La source et l'enveloppe

```ts
const oscillator = ctx.createOscillator()
oscillator.frequency.value = accent ? 1500 : 1000

const gain = ctx.createGain()
gain.gain.setValueAtTime(1, start)
gain.gain.exponentialRampToValueAtTime(0.001, start + CLICK_DURATION)
```

- L'oscillateur produit une onde (sinusoïde par défaut) ; la fréquence en Hz fixe la hauteur.
  1500 Hz (aigu) = temps fort, 1000 Hz = temps faibles.
- Le `GainNode` règle le volume (1 = plein, 0 = silence). On passe de 1 à presque rien en 0,05 s :
  c'est l'**enveloppe** qui transforme un bip continu en « clic ».
- **Pourquoi 0.001 et pas 0** : une rampe exponentielle avance en multipliant
  (1 → 0,5 → 0,25…), elle s'approche de 0 sans jamais l'atteindre. Avec 0 comme cible, le
  navigateur ne peut pas calculer la courbe et lève une `RangeError` : le clic plante.
  0,001 = 1 000 fois moins fort = inaudible.
- Pour finir sur un vrai zéro : `linearRampToValueAtTime(0, …)` (décroissance par soustraction,
  qui peut atteindre 0), ou garder la rampe exponentielle puis `setValueAtTime(0, fin)`.

### Brancher et lancer

```ts
oscillator.connect(gain)
gain.connect(ctx.destination)
oscillator.start(start)
oscillator.stop(start + CLICK_DURATION)
```

- `connect` : oscillateur → volume → haut-parleurs.
- `start` / `stop` calés sur l'horloge audio : le son dure exactement 0,05 s.
- Un oscillateur ne démarre qu'une fois : on en crée un neuf par clic (jetable, presque gratuit).

### Tempo : l'intervalle entre deux clics

BPM = battements par minute → intervalle en secondes = **`60 / bpm`**.
120 BPM → 0,5 s ; 60 BPM → 1 s ; 90 BPM → 0,667 s.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| AudioContext | Le « studio » audio : crée les modules, possède les haut-parleurs et l'horloge |
| Node (module) | Un maillon de la chaîne audio (source, effet, sortie) |
| OscillatorNode | Source qui produit une onde régulière à une fréquence donnée |
| GainNode | Bouton de volume programmable |
| Enveloppe | Évolution du volume dans le temps (attaque, extinction) |
| Fréquence (Hz) | Nombre de vibrations par seconde ; plus elle est haute, plus le son est aigu |
| BPM | Battements par minute ; intervalle = 60 / bpm secondes |
| Type union | Type qui accepte plusieurs possibilités, ex. `AudioContext \| null` |
| `??` | *Nullish coalescing* : valeur de secours si `undefined` ou `null` |
| Création paresseuse | Créer un objet seulement au moment où on en a besoin |

## Quiz

1. Pourquoi ne crée-t-on pas un nouvel `AudioContext` à chaque appel de `playClick` ?
2. Que se passerait-il si on appelait `getAudioContext()` au chargement de la page, avant tout
   clic, sans vérifier `state === 'suspended'` ?
3. Pourquoi la rampe s'arrête-t-elle à `0.001` et pas à `0` ?
4. Avec `t + i * 0.5` pour 120 BPM, comment passer à 60 BPM ? Pourquoi l'horloge audio plutôt que
   `setTimeout` ?
5. Que vaut `time ?? ctx.currentTime` pour `playClick(true)` ? Et pour `playClick(false, 3)` ?

Rattrapage :

- A. Intervalle entre deux clics à 90 BPM ?
- B. Un métronome démarre tout seul au chargement, sans clic de l'utilisateur : qu'entend-il ?
- C. On remplace 0.001 par 0 : que se passe-t-il ? Comment finir sur un vrai silence ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Le navigateur limite le nombre de contextes (ressources), et chaque contexte a sa propre
   horloge : le métronome doit tout programmer sur une seule.
2. Le contexte resterait `'suspended'` : `playClick` s'exécute sans erreur mais on n'entend rien
   (bug silencieux). Les pubs bruyantes expliquent *pourquoi* les navigateurs font ça, pas la
   conséquence pour l'appli.
3. Une rampe exponentielle multiplie et ne peut jamais atteindre 0 ; une cible à 0 lève une
   `RangeError`. 0,001 est inaudible.
4. Remplacer `0.5` par `1` (intervalle = 60 / bpm). `setTimeout` dérive de quelques
   millisecondes, ce qui s'entend ; l'horloge audio est exacte.
5. `ctx.currentTime` (maintenant), puis `3`.

- A. 60 / 90 ≈ 0,667 s.
- B. Rien, sans erreur : contexte bloqué en `'suspended'` faute d'interaction, et rien ne le
  relance tant que l'utilisateur n'a pas cliqué.
- C. `RangeError` au clic (le son ne part pas). Pour un vrai zéro : `linearRampToValueAtTime(0, …)`
  ou `setValueAtTime(0, fin)` après la rampe exponentielle.

</details>

## Points à retravailler (E)

- Distinguer la *raison* d'une règle (pubs bruyantes) de sa *conséquence* dans le code (aucun son).
- Rampe exponentielle : elle ne peut pas atteindre 0, ce n'est pas une question de son « naturel ».

## Questions possibles à l'oral

- **Pourquoi synthétiser le clic au lieu de lire un fichier audio ?** Rien à charger, son réglable
  par code, et timing exact sur l'horloge audio.
- **Comment garantissez-vous un tempo régulier ?** Les clics sont programmés à l'avance sur
  `AudioContext.currentTime`, pas avec `setTimeout` qui dérive.
- **Pourquoi l'appli ne fait-elle pas de son au chargement ?** Les navigateurs exigent une
  interaction de l'utilisateur ; on relance le contexte avec `resume()`.
- **Comment le métronome utilise-t-il ce service ?** Il appelle `getAudioContext().currentTime`,
  puis `playClick(accent, instant)` pour chaque temps, espacés de `60 / bpm` secondes.
