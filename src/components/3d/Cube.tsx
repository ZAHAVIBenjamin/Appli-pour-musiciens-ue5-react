import { useSettings, type CubeMaterial } from '../../context/SettingsContext'

// Modèle 3D du cube. Chaque face accueillera un outil de /components/tools
// TODO : projeter l'UI sur les faces (drei <Html transform> ou textures Canvas)

const MATERIALS: Record<CubeMaterial, { color: string; metalness: number; roughness: number }> = {
  plastique: { color: '#888888', metalness: 0, roughness: 0.5 },
  bois: { color: '#8b5a2b', metalness: 0, roughness: 0.8 },
  metal: { color: '#c0c0c0', metalness: 0.8, roughness: 0.3 },
}

export default function Cube() {
  const { settings } = useSettings()
  const material = MATERIALS[settings.cubeMaterial]

  return (
    <mesh>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial
        color={material.color}
        metalness={material.metalness}
        roughness={material.roughness}
      />
    </mesh>
  )
}
