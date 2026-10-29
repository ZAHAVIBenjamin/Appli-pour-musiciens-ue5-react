import type { Chord } from '../../data/chords'

// Diagramme d'un accord dessiné en SVG, manche à l'horizontale comme le guitariste le voit
// en baissant les yeux : sillet à droite, Mi grave en haut, Mi aigu en bas.

// Dimensions, en unités du dessin (le viewBox les met à l'échelle de l'écran)
const STRING_GAP = 30 // écart entre deux cordes
const FRET_GAP = 46 // largeur d'une case
const FRETS_SHOWN = 5 // nombre de cases dessinées
const MARGIN = 20 // marge à gauche
const TOP = 25 // marge en haut et en bas
const DOT_RADIUS = 11 // rayon d'un rond de doigt

// Le barré n'est pas stocké : on le déduit (donnée dérivée).
// Barré = l'index (doigt 1) posé sur au moins deux cordes ; il va de la première à la dernière.
function findBarre(chord: Chord) {
  const strings = chord.fingers
    .map((finger, string) => (finger === 1 ? string : null))
    .filter((string) => string !== null)
  if (strings.length < 2) {
    return null
  }
  const from = strings[0]
  const to = strings[strings.length - 1]
  return { fret: chord.frets[from] ?? 0, from, to }
}

interface ChordDiagramProps {
  chord: Chord
}

export default function ChordDiagram({ chord }: ChordDiagramProps) {
  const stringCount = chord.frets.length // 6 pour la guitare
  const width = MARGIN + FRETS_SHOWN * FRET_GAP + 40 // + 40 à droite pour les × et ○
  const height = TOP * 2 + (stringCount - 1) * STRING_GAP
  const barre = findBarre(chord)

  // Position verticale de la corde n° string : la plus grave (n° 0) tout en haut
  const stringY = (string: number) => TOP + string * STRING_GAP
  // Position horizontale du trait de case n° line : le sillet (n° 0) tout à droite, les cases
  // vers la gauche. Le milieu de la case n° fret : fretX(fret - 0.5)
  const fretX = (line: number) => MARGIN + (FRETS_SHOWN - line) * FRET_GAP

  // Le SVG dessine dans l'ordre : ce qui vient après passe PAR-DESSUS
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chord-diagram">
      {/* 1. Traits de case : 6 traits verticaux pour 5 cases (le premier, plus épais, est le sillet) */}
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, line) => (
        <line
          key={`fret-${line}`}
          x1={fretX(line)}
          x2={fretX(line)}
          y1={stringY(0)}
          y2={stringY(stringCount - 1)}
          stroke="currentColor"
          strokeWidth={line === 0 ? 5 : 1}
        />
      ))}

      {/* 2. Cordes : un trait horizontal par corde */}
      {chord.frets.map((_, string) => (
        <line
          key={`string-${string}`}
          x1={fretX(0)}
          x2={fretX(FRETS_SHOWN)}
          y1={stringY(string)}
          y2={stringY(string)}
          stroke="currentColor"
        />
      ))}

      {/* 3. À droite du sillet : × corde non jouée, ○ corde à vide */}
      {chord.frets.map((fret, string) => {
        if (fret === null) {
          return (
            <text
              key={`mute-${string}`}
              x={fretX(0) + 18}
              y={stringY(string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={18}
              fill="currentColor"
            >
              ×
            </text>
          )
        }
        if (fret === 0) {
          return (
            <circle
              key={`open-${string}`}
              cx={fretX(0) + 18}
              cy={stringY(string)}
              r={7}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            />
          )
        }
        return null // corde appuyée : rien à côté du sillet
      })}

      {/* 4. Barré : une barre arrondie d'une corde à l'autre, au milieu de sa case
            (la corde « from » est la plus grave, donc la plus haute) */}
      {barre && (
        <rect
          x={fretX(barre.fret - 0.5) - DOT_RADIUS}
          y={stringY(barre.from) - DOT_RADIUS}
          width={2 * DOT_RADIUS}
          height={stringY(barre.to) - stringY(barre.from) + 2 * DOT_RADIUS}
          rx={DOT_RADIUS}
          fill="currentColor"
        />
      )}

      {/* 5. Doigts : un rond au milieu de chaque case appuyée, avec le numéro du doigt */}
      {chord.frets.map((fret, string) => {
        if (fret === null || fret === 0) {
          return null
        }
        return (
          <g key={`dot-${string}`}>
            <circle
              cx={fretX(fret - 0.5)}
              cy={stringY(string)}
              r={DOT_RADIUS}
              fill="currentColor"
            />
            <text
              x={fretX(fret - 0.5)}
              y={stringY(string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fill="#111"
            >
              {chord.fingers[string]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
