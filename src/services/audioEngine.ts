// Web Audio API : traitement du micro (accordeur) + synthèse sonore (métronome)

// Un seul AudioContext pour toute l'appli (le navigateur en limite le nombre).
// null tant qu'on ne l'a pas encore créé.
let audioContext: AudioContext | null = null

// Renvoie l'AudioContext partagé, en le créant au premier appel.
export function getAudioContext(): AudioContext {
  if (audioContext === null) {
    audioContext = new AudioContext()
  }
  // Le navigateur bloque le son tant que l'utilisateur n'a pas interagi avec la page :
  // le contexte démarre alors en pause ('suspended'). On le relance.
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

const CLICK_DURATION = 0.05 // durée d'un clic, en secondes

// Joue un clic de métronome.
// - accent : true pour le premier temps de la mesure (son plus aigu)
// - time   : moment exact où jouer le clic, sur l'horloge de l'AudioContext.
//            Si absent, le clic est joué tout de suite.
export function playClick(accent = false, time?: number): void {
  const ctx = getAudioContext()
  const start = time ?? ctx.currentTime

  // Source : un oscillateur produit une onde à une fréquence donnée (en Hz)
  const oscillator = ctx.createOscillator()
  oscillator.frequency.value = accent ? 1500 : 1000

  // Volume : le son démarre fort puis s'éteint très vite, c'est ce qui donne un « clic »
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(1, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + CLICK_DURATION)

  // Chaîne audio : oscillateur → volume → haut-parleurs
  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(start)
  oscillator.stop(start + CLICK_DURATION)
}

// ---------------------------------------------------------------------------
// Micro (pour l'accordeur)
// ---------------------------------------------------------------------------

// Le flux du micro et la chaîne audio qui l'écoute. null quand le micro est coupé.
let micStream: MediaStream | null = null
let micSource: MediaStreamAudioSourceNode | null = null
let analyser: AnalyserNode | null = null

// Allume le micro et renvoie l'AnalyserNode qui permet de lire le son capté.
// async : il faut attendre que l'utilisateur autorise l'accès au micro.
export async function startMicrophone(): Promise<AnalyserNode> {
  // Déjà allumé : on réutilise la même chaîne
  if (analyser !== null) {
    return analyser
  }

  const ctx = getAudioContext()

  // Demande l'accès au micro (le navigateur affiche une fenêtre d'autorisation).
  // On coupe les traitements automatiques prévus pour la voix en visio :
  // ils déformeraient le son d'une corde de guitare.
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  // Chaîne audio : micro → analyseur (et PAS vers les haut-parleurs, sinon larsen)
  micSource = ctx.createMediaStreamSource(micStream)
  analyser = ctx.createAnalyser()
  // Nombre d'échantillons lus à chaque mesure (~0,085 s de son).
  // 4096 plutôt que 2048 : assez de périodes de la corde la plus grave pour mesurer juste.
  analyser.fftSize = 4096
  micSource.connect(analyser)

  return analyser
}

// Coupe le micro : débranche la chaîne et libère le micro (le voyant du navigateur s'éteint).
export function stopMicrophone(): void {
  micSource?.disconnect()
  micStream?.getTracks().forEach((track) => track.stop())
  micStream = null
  micSource = null
  analyser = null
}

// Lit les derniers échantillons captés par l'analyseur (valeurs entre -1 et +1).
function readSamples(analyserNode: AnalyserNode): Float32Array {
  const samples = new Float32Array(analyserNode.fftSize)
  analyserNode.getFloatTimeDomainData(samples)
  return samples
}

// Calcul RMS (racine de la moyenne des carrés) : le volume d'une série d'échantillons.
function rms(samples: Float32Array): number {
  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}

// Volume du son capté à cet instant, entre 0 (silence) et environ 1 (très fort).
export function getVolume(analyserNode: AnalyserNode): number {
  return rms(readSamples(analyserNode))
}

// ---------------------------------------------------------------------------
// Détection de hauteur (pour l'accordeur)
// ---------------------------------------------------------------------------

const MIN_VOLUME = 0.01 // en dessous : silence, on ne cherche pas de note
const MIN_FREQUENCY = 60 // Hz : un peu sous la corde la plus grave de la guitare (mi, 82 Hz)

// Renvoie la fréquence fondamentale du son capté (en Hz), ou null s'il n'y a pas de note claire.
// Méthode : l'autocorrélation (on cherche au bout de combien d'échantillons l'onde se répète).
export function detectPitch(analyserNode: AnalyserNode): number | null {
  const samples = readSamples(analyserNode)

  // 0. Trop faible : pas la peine de chercher
  if (rms(samples) < MIN_VOLUME) {
    return null
  }

  const sampleRate = analyserNode.context.sampleRate // échantillons par seconde (souvent 48 000)
  const maxLag = Math.floor(sampleRate / MIN_FREQUENCY) // plus grand décalage testé

  // 1. Autocorrélation : pour chaque décalage (lag), on compare l'onde avec elle-même décalée.
  //    Résultat élevé = l'onde ressemble à sa copie décalée = elle se répète tous les « lag ».
  const correlations = new Float32Array(maxLag + 2)
  for (let lag = 0; lag <= maxLag + 1; lag++) {
    let sum = 0
    const count = samples.length - lag
    for (let i = 0; i < count; i++) {
      sum += samples[i] * samples[i + lag]
    }
    correlations[lag] = sum / count // moyenne : comparable quel que soit le décalage
  }

  // 2. Au début (petits décalages), l'onde ressemble forcément à elle-même :
  //    on avance jusqu'à ce que la ressemblance devienne négative (l'onde est « à l'envers »).
  let start = 0
  while (start < maxLag && correlations[start] > 0) {
    start++
  }

  // 3. On cherche ensuite la plus forte ressemblance : c'est là que l'onde se répète.
  let bestValue = 0
  for (let lag = start; lag <= maxLag; lag++) {
    if (correlations[lag] > bestValue) {
      bestValue = correlations[lag]
    }
  }
  if (bestValue === 0) {
    return null // aucune répétition trouvée : bruit, pas une note
  }

  // 4. Piège de l'octave : l'onde se répète aussi à 2×, 3× la période, avec presque la même
  //    ressemblance. On prend donc le PREMIER pic qui atteint 90 % du meilleur, puis on monte
  //    jusqu'à son sommet.
  let bestLag = start
  while (correlations[bestLag] < 0.9 * bestValue) {
    bestLag++
  }
  while (bestLag < maxLag && correlations[bestLag + 1] > correlations[bestLag]) {
    bestLag++
  }

  // 5. Affiner : le vrai sommet tombe souvent ENTRE deux décalages entiers (ex. 582,4).
  //    On fait passer une parabole par le sommet et ses deux voisins, et on prend son point le
  //    plus haut : c'est l'interpolation parabolique. shift est compris entre -0,5 et +0,5.
  const left = correlations[bestLag - 1]
  const center = correlations[bestLag]
  const right = correlations[bestLag + 1]
  const curvature = left - 2 * center + right
  const shift = curvature === 0 ? 0 : (left - right) / (2 * curvature)

  // 6. Période en échantillons → fréquence en Hz
  return sampleRate / (bestLag + shift)
}
