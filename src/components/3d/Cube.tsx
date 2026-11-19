import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import { useContextBridge } from 'its-fine'
import { MathUtils, type Group } from 'three'
import { useLocation, useNavigate } from 'react-router'
import { useSettings, type CubeMaterial } from '../../context/SettingsContext'
import { FACES, type FaceId } from '../../data/faces'
import ToolPanel from '../ui/ToolPanel'

// Modèle 3D du cube : l'outil de la face active est collé sur sa face (EI-07),
// les autres faces affichent leur nom.

type Vector3 = [number, number, number]

const MATERIALS: Record<CubeMaterial, { color: string; metalness: number; roughness: number }> = {
  plastique: { color: '#888888', metalness: 0, roughness: 0.5 },
  bois: { color: '#8b5a2b', metalness: 0, roughness: 0.8 },
  metal: { color: '#c0c0c0', metalness: 0.8, roughness: 0.3 },
}

const HALF = 1.5
const GAP = 0.01

// Position et orientation de chaque face (pour son nom, ou pour l'outil quand elle est active)
const FACE_PLACEMENTS: Record<FaceId, { position: Vector3; rotation: Vector3 }> = {
  tuner: { position: [0, 0, HALF + GAP], rotation: [0, 0, 0] },
  tabs: { position: [HALF + GAP, 0, 0], rotation: [0, Math.PI / 2, 0] },
  metronome: { position: [0, 0, -(HALF + GAP)], rotation: [0, Math.PI, 0] },
  chords: { position: [-(HALF + GAP), 0, 0], rotation: [0, -Math.PI / 2, 0] },
  notebook: { position: [0, HALF + GAP, 0], rotation: [-Math.PI / 2, 0, 0] },
  settings: { position: [0, -(HALF + GAP), 0], rotation: [Math.PI / 2, 0, 0] },
}

const FACE_ROTATIONS: Record<FaceId, [number, number]> = {
  tuner: [0, 0],
  tabs: [0, -Math.PI / 2],
  metronome: [0, Math.PI],
  chords: [0, Math.PI / 2],
  notebook: [Math.PI / 2, 0],
  settings: [-Math.PI / 2, 0],
}

// Étape 4 : face cliquée → face de l'appli. Three.js numérote les 6 côtés d'une boîte toujours
// dans cet ordre : +x (droite), -x (gauche), +y (dessus), -y (dessous), +z (devant), -z (arrière)
const SIDE_TO_FACE: FaceId[] = ['tabs', 'chords', 'notebook', 'settings', 'tuner', 'metronome']

// Taille de l'outil collé sur une face : FACE_PIXELS pixels de HTML pour une face de HALF * 2 unités
const FACE_PIXELS = 420
const HTML_SCALE = (HALF * 2 - 0.2) / FACE_PIXELS / 0.025 // 0.025 : échelle de base de drei Html (transform)

const ROTATION_SPEED = 6 // plus c'est grand, plus le cube rejoint vite sa cible

// Étape 3 : parmi les angles équivalents (un tour complet = 2π = le même angle), prend celui le plus
// proche de l'angle actuel, pour tourner par le chemin le plus court (90° plutôt que 270°)
function closestAngle(current: number, target: number): number {
  const turns = Math.round((current - target) / (2 * Math.PI))
  return target + turns * 2 * Math.PI
}

export default function Cube() {
  const { settings } = useSettings()
  const material = MATERIALS[settings.cubeMaterial]

  const location = useLocation()
  const activeFace = FACES.find((face) => face.path === location.pathname)
  const shownFace: FaceId = activeFace?.id ?? 'tuner' // adresse inconnue (404) : la face de l'accordeur
  const [rotationX, rotationY] = FACE_ROTATIONS[shownFace]

  // L'outil collé sur la face est rendu par drei <Html> dans une racine React SÉPARÉE : il ne voit
  // plus le routeur ni les réglages. Le « pont » (its-fine) lui retransmet tous les contexts du dessus.
  const ContextBridge = useContextBridge()

  // Étape 3 : l'animation. La rotation du groupe n'est plus donnée par React (pas de prop rotation) :
  // à chaque image, on la rapproche un peu de la cible, directement sur l'objet 3D (via la ref).
  // Pas de setState : 60 rendus React par seconde pour une animation seraient inutiles.
  const groupRef = useRef<Group>(null)
  useFrame((_, delta) => {
    const group = groupRef.current
    if (group === null) {
      return
    }
    const targetX = closestAngle(group.rotation.x, rotationX)
    const targetY = closestAngle(group.rotation.y, rotationY)
    group.rotation.x = MathUtils.damp(group.rotation.x, targetX, ROTATION_SPEED, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, targetY, ROTATION_SPEED, delta)
  })

  // Étape 4 : cliquer sur un côté du cube change l'ADRESSE ; le cube tourne ensuite tout seul,
  // comme pour un clic dans la barre de navigation (une seule source de vérité : l'adresse)
  const navigate = useNavigate()
  function handleClick(event: ThreeEvent<MouseEvent>) {
    const side = event.face?.materialIndex
    if (side === undefined) {
      return
    }
    const face = FACES.find((f) => f.id === SIDE_TO_FACE[side])
    if (face) {
      navigate(face.path)
    }
  }

  return (
    <group ref={groupRef}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <boxGeometry args={[HALF * 2, HALF * 2, HALF * 2]} />
        <meshStandardMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
        />
      </mesh>
      {FACES.map((face) => {
        const placement = FACE_PLACEMENTS[face.id]
        // Face active : l'outil (le ToolPanel et son <Outlet />), en vrai HTML cliquable collé sur la face
        if (face.id === shownFace) {
          return (
            <Html
              key={face.id}
              transform
              occlude
              position={placement.position}
              rotation={placement.rotation}
              scale={HTML_SCALE}
            >
              <ContextBridge>
                <ToolPanel />
              </ContextBridge>
            </Html>
          )
        }
        // Autres faces : leur nom
        return (
          <group key={face.id}>
            <Text
              position={placement.position}
              rotation={placement.rotation}
              fontSize={0.4}
              color="#ffffff"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {face.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
