// Requêtes HTTP vers l'API de recherche de Songsterr.
// On n'appelle pas songsterr.com directement (le navigateur bloquerait : CORS) mais notre propre
// adresse /api/songsterr, que le proxy transmet à Songsterr (vite.config.ts en dev, vercel.json en ligne).

const API_URL = '/api/songsterr'

// Ce que renvoie Songsterr (seulement les champs dont on a besoin)
interface SongsterrTrack {
  instrument: string // ex. 'Distortion Guitar', 'Electric Bass (finger)', 'Drums'
  name: string // ex. 'Noel Gallagher | Lead Guitar'
  tuning: number[] // accordage en numéros MIDI, corde aiguë en premier
}

interface SongsterrSong {
  songId: number
  artist: string
  title: string
  tracks: SongsterrTrack[]
}

// Ce que l'appli utilise : un morceau, avec seulement ses pistes d'instruments à cordes
export type Instrument = 'guitar' | 'bass' | 'ukulele'

export interface StringTrack {
  instrument: Instrument
  name: string
  tuning: number[]
}

export interface Song {
  id: number
  artist: string
  title: string
  url: string // page du morceau sur Songsterr, pour lire la tablature
  tracks: StringTrack[]
}

// Range un nom d'instrument Songsterr dans une de nos catégories (null : on ne le garde pas)
function instrumentOf(songsterrInstrument: string): Instrument | null {
  if (songsterrInstrument.includes('Guitar')) {
    return 'guitar'
  }
  if (songsterrInstrument.includes('Bass')) {
    return 'bass'
  }
  if (songsterrInstrument.includes('Ukulele')) {
    return 'ukulele'
  }
  return null // batterie, voix, piano...
}

// Ne garde que les pistes d'instruments à cordes, en leur donnant leur catégorie
function toStringTracks(tracks: SongsterrTrack[]): StringTrack[] {
  const result: StringTrack[] = []
  for (const track of tracks) {
    const instrument = instrumentOf(track.instrument)
    if (instrument !== null) {
      result.push({ instrument, name: track.name, tuning: track.tuning })
    }
  }
  return result
}

// Cherche des morceaux par artiste ou par titre (10 résultats au maximum)
export async function searchSongs(query: string): Promise<Song[]> {
  // URLSearchParams fabrique « pattern=...&size=10 » en encodant les caractères spéciaux
  // (espaces, accents, &...) pour qu'ils ne cassent pas l'adresse
  const params = new URLSearchParams({ pattern: query, size: '10' })
  const response = await fetch(`${API_URL}/songs?${params}`)

  // fetch ne lève pas d'erreur sur un 404 ou un 500 : il faut vérifier soi-même
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} pendant la recherche`)
  }

  const songs: SongsterrSong[] = await response.json()

  // On transforme chaque morceau Songsterr en Song : on trie les pistes, on ajoute l'adresse
  return songs.map((song) => ({
    id: song.songId,
    artist: song.artist,
    title: song.title,
    url: `https://www.songsterr.com/a/wa/song?id=${song.songId}`,
    tracks: toStringTracks(song.tracks),
  }))
}
