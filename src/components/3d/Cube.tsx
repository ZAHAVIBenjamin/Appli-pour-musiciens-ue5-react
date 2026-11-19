import { Text } from '@react-three/drei'
import { useLocation } from 'react-router'
import { useSettings, type CubeMaterial } from '../../context/SettingsContext'
import { FACES, type FaceId } from '../../data/faces'

// Modèle 3D du cube. Chaque face accueillera un outil de /components/tools
// TODO : projeter l'UI sur les faces (drei <Html transform> ou textures Canvas)

type Vector3 = [number, number, number]

const MATERIALS: Record<CubeMaterial, { color: string; metalness: number; roughness: number }> = {
  plastique: { color: '#888888', metalness: 0, roughness: 0.5 },
  bois: { color: '#8b5a2b', metalness: 0, roughness: 0.8 },
  metal: { color: '#c0c0c0', metalness: 0.8, roughness: 0.3 },
}

const HALF = 1.5
const GAP = 0.01

const LABEL_PLACEMENTS: Record<FaceId, { position: Vector3; rotation: Vector3 }> = {
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

export default function Cube() {
  const { settings } = useSettings()
  const material = MATERIALS[settings.cubeMaterial]

  const location = useLocation()
  const activeFace = FACES.find((face) => face.path === location.pathname)
  const [rotationX, rotationY] = FACE_ROTATIONS[activeFace?.id ?? 'tuner']

  return (
    <group rotation={[rotationX, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[HALF * 2, HALF * 2, HALF * 2]} />
        <meshStandardMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
        />
      </mesh>
      {FACES.map((face) => (
        <Text
          key={face.id}
          position={LABEL_PLACEMENTS[face.id].position}
          rotation={LABEL_PLACEMENTS[face.id].rotation}
          fontSize={0.4}
          color="#ffffff"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {face.label}
        </Text>
      ))}
    </group>
  )
}
