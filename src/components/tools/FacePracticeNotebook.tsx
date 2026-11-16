import { useState, type FormEvent } from 'react'

// Carnet de notes / suivi des séances
// Choix du binôme : sauvegarde dans le navigateur (localStorage), pas de back-end

type Session = {
  id: number
  date: string
  topic: string
  minutes: number
}

export default function FacePracticeNotebook() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [topic, setTopic] = useState('')
  const [minutes, setMinutes] = useState(15)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (topic.trim() === '') {
      return
    }

    const newSession: Session = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      topic: topic.trim(),
      minutes,
    }
    setSessions([newSession, ...sessions])
    setTopic('')
  }

  return (
    <div>
      <h2>Carnet d'entraînement</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Ce que j'ai travaillé"
        />
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(event) => setMinutes(Number(event.target.value))}
        />
        <span> min </span>
        <button type="submit">Ajouter</button>
      </form>

      {sessions.length === 0 ? (
        <p>Aucune séance pour l'instant.</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {session.date} — {session.topic} ({session.minutes} min)
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
