# E-02 — Moteur audio : écouter le micro

- **Date** : 26/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/services/audioEngine.ts` (partie Micro)

## Ce qu'on a fait et pourquoi

L'accordeur a besoin du son capté par le micro. On a ajouté trois fonctions au moteur audio :
`startMicrophone` (allume le micro et branche un analyseur), `stopMicrophone` (le coupe et le
libère) et `getVolume` (mesure le volume capté). Le volume a servi à vérifier que la capture
marche ; l'étape suivante (E-03) lira dans le même signal la **hauteur** de la note.

On réutilise le même `AudioContext` que pour le clic (E-01).

## Le code expliqué

### Le principe : la chaîne dans l'autre sens

```
Clic (E-01) :  oscillateur → volume → haut-parleurs     (on produit)
Micro (E-02) : micro → analyseur                         (on capte et on lit)
```

L'analyseur n'est **pas** branché sur les haut-parleurs : le micro capterait les haut-parleurs,
qui rejoueraient le micro… = **larsen** (et, au casque, écho de sa propre voix).

### L'état du micro

```ts
let micStream: MediaStream | null = null
let micSource: MediaStreamAudioSourceNode | null = null
let analyser: AnalyserNode | null = null
```

- `MediaStream` : le flux brut du micro.
- `MediaStreamAudioSourceNode` : ce flux transformé en module branchable dans la chaîne.
- `AnalyserNode` : le module qui permet de **lire** le son.
- `null` = micro coupé (même principe que `audioContext`).

### startMicrophone : async / await

```ts
export async function startMicrophone(): Promise<AnalyserNode> {
  if (analyser !== null) {
    return analyser
  }
  const ctx = getAudioContext()
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  micSource = ctx.createMediaStreamSource(micStream)
  analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  micSource.connect(analyser)
  return analyser
}
```

- **`async`** : la fonction peut **attendre** (`await`) sans bloquer la page. Elle renvoie une
  **`Promise<AnalyserNode>`** = « je te donnerai un analyseur plus tard » ; l'appelant le récupère
  avec `.then(...)` ou `await`.
- Si déjà allumé : on renvoie la chaîne existante (pas de second flux).
- **`getUserMedia`** affiche la demande d'autorisation et attend la réponse.
  - Accepté : on reçoit le flux.
  - **Refusé** : la promesse est **rejetée** ; l'erreur remonte à l'`await`, puis à l'appelant, qui
    doit la gérer avec `.catch(...)` (sinon : erreur rouge en console et rien à l'écran).
- Les trois `false` coupent les traitements prévus pour la visio. Ils déforment le son d'une corde
  (la réduction de bruit peut même effacer une note tenue, prise pour un bruit de fond). Un
  accordeur veut le son **brut**.
- Le micro n'est accessible que sur une page **sécurisée** (`https://` ou `localhost`).
- `fftSize = 2048` : l'analyseur fournit les 2048 derniers **échantillons**. Le micro en prend
  ~48 000 par seconde → 2048 échantillons ≈ 0,04 s de son.

### stopMicrophone : libérer vraiment le micro

```ts
export function stopMicrophone(): void {
  micSource?.disconnect()
  micStream?.getTracks().forEach((track) => track.stop())
  micStream = null
  micSource = null
  analyser = null
}
```

- **`?.`** (*optional chaining*) : appelle la méthode si la valeur n'est pas `null`, sinon ne fait
  rien. Micro jamais allumé → aucun plantage.
- `getTracks()` : les pistes du flux ; `forEach` exécute `track.stop()` sur chacune.
- **`track.stop()` libère le matériel** et éteint le voyant micro du navigateur. Mettre
  `micStream = null` fait seulement **oublier** au code où est le flux : le micro resterait ouvert
  (voyant allumé, l'appli écoute toujours → **problème de vie privée**), et un nouvel allumage
  ouvrirait un **deuxième flux** sans libérer le premier (**fuite de ressources**).

### getVolume : le calcul RMS

```ts
export function getVolume(analyserNode: AnalyserNode): number {
  const samples = new Float32Array(analyserNode.fftSize)
  analyserNode.getFloatTimeDomainData(samples)
  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}
```

- `Float32Array` : tableau de nombres à virgule optimisé pour l'audio (2048 cases).
- `getFloatTimeDomainData` **remplit** le tableau avec la forme de l'onde, valeurs entre -1 et +1.
- **RMS** (*Root Mean Square*) : carré de chaque échantillon → moyenne → **racine**.
  - Moyenne directe ≈ 0 : l'onde est symétrique autour de 0, positifs et négatifs s'annulent.
  - Le carré rend tout positif (la valeur absolue marcherait aussi ; le carré correspond à
    l'énergie du son, c'est le standard).
  - La racine ramène le résultat à l'échelle des échantillons.
  - Exemple : `[0.5, -0.5, 0.5, -0.5]` → moyenne 0, RMS = √0,25 = **0,5** (la hauteur de l'onde).

### Test réalisé

Vu-mètre temporaire (retiré avant le commit) : la barre réagit à la voix, le voyant micro s'éteint
à la coupure, un refus d'accès affiche un message d'erreur.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| `async` / `await` | Fonction qui peut attendre un résultat sans bloquer la page |
| Promise | Promesse d'un résultat plus tard ; tenue (`.then`) ou rejetée (`.catch`) |
| getUserMedia | API du navigateur pour accéder au micro et à la caméra |
| MediaStream | Flux audio/vidéo brut ; composé de pistes (*tracks*) |
| AnalyserNode | Module Web Audio qui permet de lire le son qui le traverse |
| Échantillon (*sample*) | Valeur de l'onde à un instant ; ~48 000 par seconde |
| fftSize | Nombre d'échantillons fournis par l'analyseur à chaque lecture |
| RMS | Moyenne quadratique : mesure du volume d'un signal |
| `?.` | *Optional chaining* : n'appelle la méthode que si la valeur existe |
| Larsen | Boucle micro → haut-parleurs → micro qui s'emballe |
| Fuite de ressources | Ressource ouverte jamais libérée |

## Quiz

1. Pourquoi `startMicrophone` est-elle `async` ? Que se passe-t-il si l'utilisateur refuse ?
2. Que se passerait-il si on ajoutait `analyser.connect(ctx.destination)` ?
3. Pourquoi désactiver `echoCancellation`, `noiseSuppression` et `autoGainControl` ?
4. Pourquoi mettre les échantillons au carré au lieu de faire directement leur moyenne ?
5. Que fait `micStream?.getTracks()...` si le micro n'a jamais été allumé ? Pourquoi
   `track.stop()` plutôt que simplement `micStream = null` ?

Rattrapage :

- A. Échantillons `[0.5, -0.5, 0.5, -0.5]` : moyenne directe ? RMS ?
- B. `stopMicrophone` ne fait que `micStream = null` : que voit l'utilisateur après « Couper » ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. Il faut attendre la réponse à la demande d'autorisation. Refus : la promesse de
   `getUserMedia` est rejetée, l'erreur remonte jusqu'au `.catch` de l'appelant (qui affiche un
   message) ; sans `.catch`, seulement une erreur en console.
2. Larsen : le micro capte les haut-parleurs qui rejouent le micro. Au casque : écho de sa voix.
3. Ces traitements visent la voix en visio et déforment le son d'une corde (la réduction de bruit
   peut effacer une note tenue). L'accordeur a besoin du son brut.
4. L'onde est symétrique autour de 0 : la moyenne directe vaut ~0 même pour un son fort. Le carré
   rend tout positif. (Il n'y a aucun risque de division par zéro : on divise par 2048.)
5. Rien, sans plantage (`?.`). `micStream = null` fait seulement oublier le flux au code ; le
   micro reste ouvert. `track.stop()` libère vraiment le matériel.

- A. Moyenne = 0 ; RMS = √((0,25 × 4) / 4) = √0,25 = **0,5**. Le RMS représente le volume.
- B. Le voyant micro reste allumé : l'appli écoute toujours alors que l'utilisateur croit avoir
  coupé (vie privée). En plus, rallumer ouvrirait un second flux sans libérer le premier (fuite).

</details>

## Points à retravailler (E)

- Calcul RMS : ne pas oublier la **racine** (dernière étape).
- Distinguer ce que voit **l'utilisateur** (voyant, écran) de ce que fait **le code** (variables).

## Questions possibles à l'oral

- **Comment l'appli accède-t-elle au micro ?** Avec `getUserMedia`, après autorisation de
  l'utilisateur, uniquement en https ; le flux est branché sur un `AnalyserNode`.
- **Pourquoi le son du micro n'est-il pas renvoyé vers les haut-parleurs ?** Pour éviter le larsen :
  on veut seulement l'analyser.
- **Comment mesurez-vous le volume ?** Par le RMS des 2048 derniers échantillons.
- **Comment garantissez-vous que le micro est vraiment coupé ?** `track.stop()` sur chaque piste
  libère le matériel ; le voyant du navigateur s'éteint.
- **Pourquoi couper les traitements audio du navigateur ?** Ils sont conçus pour la voix et
  faussent le son d'un instrument.
