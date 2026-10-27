import { useEffect, useState } from 'react'
import { startMicrophone, stopMicrophone, detectPitch } from '../../services/audioEngine'
import { frequencyToNote, type Note } from '../../utils/notes'

// Accordeur : écoute le micro, affiche la note jouée, l'écart en cents et une aiguille.

const IN_TUNE_CENTS = 5 // à ±5 cents ou moins, la corde est considérée juste

// Conseil affiché sous l'aiguille
function tuningHint(cents: number): string {
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return 'Juste ✓'
  }
  return cents > 0 ? 'Trop haut : détends la corde' : 'Trop bas : tends la corde'
}

export default function FaceTuner() {
  const [listening, setListening] = useState(false) // micro allumé ?
  const [note, setNote] = useState<Note | null>(null) // dernière note détectée
  const [error, setError] = useState<string | null>(null) // message si le micro est refusé

  // Tant que listening vaut true : on allume le micro et on lit la note en boucle.
  // La fonction renvoyée (cleanup) coupe tout : au clic sur « Arrêter », ou quand
  // l'accordeur disparaît de l'écran (changement de face dans la barre de navigation).
  useEffect(() => {
    if (!listening) {
      return
    }

    let frameId = 0 // numéro de la prochaine image prévue, pour pouvoir l'annuler
    let cancelled = false // passé à true par le cleanup

    startMicrophone()
      .then((analyser) => {
        // Le cleanup a eu lieu PENDANT la demande d'autorisation : on referme le micro tout juste ouvert
        if (cancelled) {
          stopMicrophone()
          return
        }
        // Lit la note à chaque image affichée par l'écran (~60 fois par seconde)
        const update = () => {
          const frequency = detectPitch(analyser)
          if (frequency !== null) {
            setNote(frequencyToNote(frequency)) // silence : on garde la dernière note affichée
          }
          frameId = requestAnimationFrame(update)
        }
        update()
      })
      .catch(() => {
        setError('Accès au micro refusé ou impossible.')
        setListening(false)
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      stopMicrophone()
    }
  }, [listening])

  function toggle() {
    setError(null)
    setNote(null)
    setListening(!listening)
  }

  const inTune = note !== null && Math.abs(note.cents) <= IN_TUNE_CENTS

  return (
    <div className="tuner">
      <h2>Accordeur</h2>
      <button onClick={toggle}>{listening ? 'Arrêter' : 'Démarrer'}</button>

      {error && <p className="tuner-error">{error}</p>}
      {listening && note === null && <p>Joue une corde…</p>}

      {listening && note && (
        <>
          <p className="tuner-note">
            {note.name}
            <sub>{note.octave}</sub>
          </p>
          {/* -50 cents → bord gauche (0 %), 0 → centre (50 %), +50 → bord droit (100 %) */}
          <div className="tuner-gauge">
            <div
              className={inTune ? 'tuner-needle in-tune' : 'tuner-needle'}
              style={{ left: `${50 + note.cents}%` }}
            />
          </div>
          <p>
            {note.cents > 0 ? '+' : ''}
            {note.cents} cents · cible {note.frequency.toFixed(2)} Hz
          </p>
          <p>{tuningHint(note.cents)}</p>
        </>
      )}
    </div>
  )
}
