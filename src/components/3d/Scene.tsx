import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import Cube from './Cube'

// Direction de la caméra : presque de face, légèrement à droite et au-dessus (voir Layout)
const CAMERA_DIRECTION: [number, number, number] = [1.6, 1.3, 7]
const MIN_DISTANCE = 7.4 // distance sur un écran large (ordinateur)
const CUBE_SPAN = 4.2 // largeur à garder visible : le cube vu de biais, avec une marge

// Racine de la scène : caméra, lumières, cube
export default function Scene() {
  // Sur un téléphone en portrait, l'écran est étroit : on recule la caméra pour que le cube
  // tienne en largeur. useThree donne la caméra et la taille de l'écran ; c'est un système
  // extérieur à React (Three.js), d'où le useEffect, relancé quand la taille change.
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    const aspect = size.width / size.height
    const halfFov = ((45 / 2) * Math.PI) / 180
    const distance = Math.max(MIN_DISTANCE, CUBE_SPAN / (2 * Math.tan(halfFov) * aspect))
    const [x, y, z] = CAMERA_DIRECTION
    const length = Math.hypot(x, y, z)
    camera.position.set((x / length) * distance, (y / length) * distance, (z / length) * distance)
    camera.lookAt(0, 0, 0)
  }, [camera, size])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} />
      <Cube />
    </>
  )
}
