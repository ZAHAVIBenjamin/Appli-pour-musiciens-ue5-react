import { useState, type FormEvent } from 'react'
import { searchSongs, type Instrument, type Song } from '../../services/tablatureApi'
import { midiToName } from '../../utils/notes'

// Tablatures : recherche de morceaux sur Songsterr, avec leurs pistes et leur accordage,
// pour l'instrument choisi (guitare, basse ou ukulélé).

// Nom affiché pour chaque instrument
const INSTRUMENT_LABELS: Record<Instrument, string> = {
  guitar: 'Guitare',
  bass: 'Basse',
  ukulele: 'Ukulélé',
}

// Accordage lisible, de la corde grave à la corde aiguë (Songsterr donne l'aiguë en premier).
// [...tuning] fait une copie : reverse() retourne le tableau SUR PLACE et abîmerait l'original.
function tuningToText(tuning: number[]): string {
  return [...tuning].reverse().map(midiToName).join(' ')
}

export default function FaceTabs() {
  const [query, setQuery] = useState('') // texte tapé dans le champ
  const [instrument, setInstrument] = useState<Instrument>('guitar') // instrument choisi
  const [songs, setSongs] = useState<Song[] | null>(null) // null = aucune recherche faite
  const [loading, setLoading] = useState(false) // recherche en cours ?
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // sans ça, le navigateur rechargerait toute la page
    if (query.trim() === '') {
      return
    }
    setLoading(true)
    setError(null)
    try {
      setSongs(await searchSongs(query.trim()))
    } catch {
      // erreur réseau, ou le throw de searchSongs (réponse pas ok)
      setError('La recherche a échoué. Réessaie plus tard.')
      setSongs(null)
    } finally {
      setLoading(false) // dans tous les cas, réussite ou échec
    }
  }

  return (
    <div className="tabs">
      <h2>Tablatures</h2>

      <form onSubmit={handleSubmit}>
        {/* « as Instrument » : event.target.value est un simple texte pour TypeScript,
            mais les seules valeurs possibles sont celles des <option> ci-dessous */}
        <select
          value={instrument}
          onChange={(event) => setInstrument(event.target.value as Instrument)}
        >
          <option value="guitar">{INSTRUMENT_LABELS.guitar}</option>
          <option value="bass">{INSTRUMENT_LABELS.bass}</option>
          <option value="ukulele">{INSTRUMENT_LABELS.ukulele}</option>
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Artiste ou titre"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Recherche…' : 'Chercher'}
        </button>
      </form>

      {error && <p className="tabs-error">{error}</p>}
      {songs !== null && songs.length === 0 && <p>Aucun morceau trouvé.</p>}

      {songs !== null && songs.length > 0 && (
        <ul className="tabs-results">
          {songs.map((song) => {
            // Seulement les pistes de l'instrument choisi : changer d'instrument refiltre
            // les résultats déjà reçus, sans refaire de recherche
            const tracks = song.tracks.filter((track) => track.instrument === instrument)
            return (
              <li key={song.id}>
                {/* target="_blank" : ouvre la tablature dans un nouvel onglet */}
                <a href={song.url} target="_blank" rel="noopener noreferrer">
                  {song.artist} – {song.title}
                </a>
                {tracks.length === 0 ? (
                  <p className="tabs-track">
                    Pas de piste {INSTRUMENT_LABELS[instrument].toLowerCase()}
                  </p>
                ) : (
                  tracks.map((track, index) => (
                    <p key={index} className="tabs-track">
                      {track.name} · {tuningToText(track.tuning)}
                    </p>
                  ))
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
