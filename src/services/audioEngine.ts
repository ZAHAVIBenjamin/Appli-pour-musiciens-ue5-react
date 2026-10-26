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
