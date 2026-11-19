# E-03 — Moteur audio : détecter la hauteur d'une note

- **Date** : 27/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/services/audioEngine.ts` (fonctions `readSamples`, `rms`,
  `detectPitch` ; `fftSize` passé à 4096)

## Ce qu'on a fait et pourquoi

L'accordeur doit savoir quelle note est jouée, c'est-à-dire sa **fréquence** en Hz. On a ajouté
`detectPitch`, qui lit les échantillons du micro et renvoie la fréquence fondamentale (ou `null`
s'il n'y a pas de note claire).

Méthode choisie : l'**autocorrélation**. Elle est simple à expliquer, robuste aux harmoniques
d'une corde de guitare, et ne demande aucune bibliothèque. On l'a construite en deux passes :
la passe 1 trouve la bonne note ; la passe 2 (interpolation + fenêtre plus longue) la rend assez
précise pour accorder.

## Le code expliqué

### L'idée : une note est un son qui se répète

Le mi grave vibre 82,41 fois par seconde. Le micro prend 48 000 échantillons par seconde, donc
l'onde se répète tous les 48 000 / 82,41 ≈ **582,4 échantillons** : c'est la **période**.

```
fréquence = échantillons par seconde ÷ période
```

### L'autocorrélation, à la main

On compare l'onde avec une copie d'elle-même **décalée** : on multiplie les valeurs l'une sous
l'autre et on fait la moyenne. Mêmes signes → produit positif → ça se ressemble ; signes opposés →
produit négatif → c'est « à l'envers ».

Onde de période 4 : `1, 0, -1, 0, 1, 0, -1, 0`

| Décalage (axe horizontal) | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| Ressemblance (moyenne des produits) | 0,5 | 0 | -0,5 | 0 | 0,5 |
| Lecture | faux repère | | à l'envers | | **période** |

- **L'axe horizontal est le décalage**, pas le temps : on ne regarde pas la note évoluer, on
  cherche de combien décaler la copie pour qu'elle retombe sur l'original.
- **Décalage 0 = toujours le maximum** : chaque valeur est multipliée par elle-même, tous les
  produits sont des carrés positifs (c'est la moyenne des carrés du RMS, fiche E-02).

### Petit rangement : readSamples et rms

Le volume et la détection lisent tous deux les échantillons et calculent un RMS : ces deux
morceaux sont sortis dans des fonctions **privées** au fichier (non exportées). `getVolume`
devient `return rms(readSamples(analyserNode))`, même comportement.

### Étape 0 — ignorer le silence

```ts
if (rms(samples) < MIN_VOLUME) {
  return null
}
```

Sans son, pas de note : on renvoie `null` (type de retour `number | null`).

### Étape 1 — toutes les ressemblances

```ts
for (let lag = 0; lag <= maxLag + 1; lag++) {
  let sum = 0
  const count = samples.length - lag
  for (let i = 0; i < count; i++) {
    sum += samples[i] * samples[i + lag]
  }
  correlations[lag] = sum / count
}
```

- Deux boucles imbriquées : pour chaque décalage, on parcourt l'onde.
- `count` diminue quand le décalage augmente (moins de valeurs se chevauchent) : on divise par
  `count` pour une **moyenne** comparable entre décalages.
- `maxLag = sampleRate / MIN_FREQUENCY` = 48 000 / 60 = 800 : on teste jusqu'à 60 Hz, sous le
  mi grave (82 Hz).

### Étape 2 — sauter le début

```ts
let start = 0
while (start < maxLag && correlations[start] > 0) {
  start++
}
```

Aux petits décalages, la copie n'a presque pas bougé : elle ressemble forcément à l'original.
Chercher le maximum dès 0 trouverait toujours ~0 ou 1 (→ 48 000 Hz, absurde). On avance jusqu'à
ce que la ressemblance devienne **négative** (copie à l'envers), puis on cherche la remontée.

### Étape 3 — le meilleur score

On cherche la plus forte ressemblance après `start`. Rien de positif → bruit → `null`.

### Étape 4 — le piège de l'octave

```ts
let bestLag = start
while (correlations[bestLag] < 0.9 * bestValue) { bestLag++ }
while (bestLag < maxLag && correlations[bestLag + 1] > correlations[bestLag]) { bestLag++ }
```

L'onde se répète aussi à 2×, 3× la période, avec une ressemblance presque aussi forte. Prendre
2× la période donnerait une fréquence **deux fois trop basse** (même note, une octave en dessous :
le la à 110 Hz serait lu 55 Hz). On prend donc le **premier** pic qui atteint 90 % du meilleur,
puis on « monte la colline » jusqu'à son sommet.

### Étape 5 — affiner entre deux échantillons (interpolation parabolique)

```ts
const left = correlations[bestLag - 1]
const center = correlations[bestLag]
const right = correlations[bestLag + 1]
const curvature = left - 2 * center + right
const shift = curvature === 0 ? 0 : (left - right) / (2 * curvature)
return sampleRate / (bestLag + shift)
```

- La vraie période tombe souvent entre deux entiers (582,4) ; la boucle ne teste que des entiers.
- On fait passer une **parabole** par le sommet et ses deux voisins et on prend son vrai sommet :
  `shift` est un petit décalage entre -0,5 et +0,5. (Retenir l'idée, pas la formule.)
- `curvature === 0` : trois points alignés, pas de parabole → protection contre la **division par
  zéro** (ici le risque est réel : `curvature` dépend du son capté ; dans `rms`, on divise par
  `samples.length`, toujours 4096, donc aucun risque).
- Pourquoi ça compte surtout dans l'aigu : l'arrondi fait jusqu'à 0,5 échantillon d'erreur.
  - la 440 Hz, période 109 → 0,5 / 109 ≈ **0,46 %**
  - période 218 (la 220 Hz) → 0,5 / 218 ≈ **0,23 %**
  - mi 82 Hz, période 582 → 0,5 / 582 ≈ **0,09 %**
  
  Période courte (aigu) = la même erreur pèse plus lourd.

### Fenêtre plus longue : fftSize 4096

Avec 2048 échantillons (0,04 s), le mi grave ne fait que 3,5 tours dans la fenêtre ; avec 4096
(0,085 s), 7 tours : la répétition se mesure mieux. Contrepartie : 0,04 s de réactivité en moins,
imperceptible.

### Précision mesurée (simulation, sons type guitare)

Unité : le **cent** = 1/100 de demi-ton ; l'oreille entraînée entend ~5 cents, un accordeur vise
±2 à 3 cents.

| Note | Passe 1 (2048, entiers) | Passe 2 (4096 + interpolation) |
| --- | --- | --- |
| Mi grave 82,41 Hz | jusqu'à 7,6 cents | ≤ 2,4 cents |
| La 110 Hz | jusqu'à 2,5 cents | ≤ 1,8 cent |
| La 440 Hz | 1,4 cent | ≤ 0,2 cent |

Aucune erreur d'octave sur 9 notes de 82 à 659 Hz.

### Test réalisé

Affichage temporaire de la fréquence (retiré avant le commit). Guitare : valeurs légèrement à côté,
mais la guitare n'était pas forcément accordée — **on ne juge pas un instrument de mesure avec une
source inconnue**. Générateur de fréquences (82,41 / 110 / 440 Hz) : valeurs justes.

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| Fréquence (Hz) | Nombre de vibrations par seconde ; fixe la hauteur de la note |
| Période | Nombre d'échantillons après lequel l'onde se répète |
| Autocorrélation | Ressemblance entre une onde et sa copie décalée, pour chaque décalage |
| Décalage (*lag*) | De combien d'échantillons on décale la copie |
| Erreur d'octave | Trouver 2× la période : fréquence moitié, même note une octave plus bas |
| Interpolation parabolique | Trouver un sommet entre deux points avec une parabole passant par 3 points |
| Cent | 1/100 de demi-ton, unité de justesse des musiciens |
| Fonction privée | Fonction non exportée, utilisable seulement dans son fichier |

## Quiz

1. Une corde vibre à 196 Hz, micro à 48 000 échantillons/s : au bout de combien d'échantillons
   l'onde se répète-t-elle ?
2. Pourquoi saute-t-on le début de la courbe au lieu de chercher le maximum dès le décalage 0 ?
3. Qu'est-ce que l'erreur d'octave ? Que lirait-on pour le la à 110 Hz ?
4. Pourquoi l'interpolation améliore-t-elle surtout les notes aiguës ?
5. À quoi sert `curvature === 0 ? 0 : ...` ? Pourquoi pas de précaution dans le calcul RMS ?

Rattrapage :

- A. Que représente l'axe horizontal de la courbe ? Pourquoi le décalage 0 est-il toujours le plus
  haut ? Onde `2, 2, -2, -2, 2, 2, -2, -2` : période ? ressemblance au décalage 2 ?
- B. Période de 218 échantillons : erreur maximale sans interpolation ? Plus aiguë ou plus grave
  que le la 440 Hz ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. 48 000 / 196 ≈ **244,9 échantillons** (pas un entier : d'où l'interpolation).
2. Aux petits décalages la copie n'a presque pas bougé et ressemble forcément à l'original (au
   décalage 0 elle est identique). On trouverait toujours ~0 ou 1 → fréquence absurde (48 000 Hz).
   Ce n'est **pas** une question d'attaque de la note qui se stabilise dans le temps : l'axe est le
   décalage, pas le temps.
3. Trouver 2× la période → fréquence divisée par 2, même note une octave plus bas : **55 Hz**.
4. L'erreur d'arrondi (0,5 échantillon) est la même pour toutes les notes mais pèse plus sur une
   période courte : 0,5/109 ≈ 0,46 % (aigu) contre 0,5/582 ≈ 0,09 % (grave).
5. Éviter la division par zéro si les trois points sont alignés. Dans `rms`, on divise par
   `samples.length` (4096), jamais 0 ; `curvature`, elle, dépend du son capté.

- A. Le décalage entre l'onde et sa copie. Au décalage 0, chaque valeur est multipliée par
  elle-même : que des carrés positifs, rien ne vient diminuer la somme. Onde : période **4** ;
  décalage 2 → produits tous à -4 → moyenne **-4** (copie exactement à l'envers, creux de la
  courbe).
- B. 100 × 0,5 / 218 ≈ **0,23 %** ; période plus longue → note **plus grave** (la 220 Hz).

</details>

## Points à retravailler (E)

- Ne pas confondre **le temps** (la note qui évolue) et **le décalage** (axe de l'autocorrélation).
- Aller jusqu'au bout des calculs (donner le résultat chiffré, pas seulement l'opération).

## Questions possibles à l'oral

- **Comment l'accordeur trouve-t-il la note ?** Par autocorrélation : on cherche le décalage pour
  lequel l'onde ressemble le plus à sa copie décalée ; ce décalage est la période, et
  fréquence = 48 000 / période.
- **Comment évitez-vous les erreurs d'octave ?** On prend le premier pic qui atteint 90 % du
  meilleur score, pas le maximum absolu.
- **Quelle est la précision ?** Environ ±2 cents en simulation grâce à l'interpolation parabolique
  et à une fenêtre de 4096 échantillons ; vérifiée au générateur de fréquences.
- **Pourquoi pas une FFT ?** La FFT donne toutes les fréquences présentes, harmoniques comprises :
  sur une corde de guitare, l'harmonique peut être plus forte que la fondamentale. L'autocorrélation
  trouve directement la période, et elle est plus simple à expliquer.
