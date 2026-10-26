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
  analyser.fftSize = 2048 // nombre d'échantillons lus à chaque mesure
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

// Volume du son capté à cet instant, entre 0 (silence) et environ 1 (très fort).
// Calcul RMS (racine de la moyenne des carrés) sur les derniers échantillons.
export function getVolume(analyserNode: AnalyserNode): number {
  const samples = new Float32Array(analyserNode.fftSize)
  analyserNode.getFloatTimeDomainData(samples)

  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}
