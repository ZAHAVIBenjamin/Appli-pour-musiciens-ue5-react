import { OrbitControls } from '@react-three/drei'
import Cube from './Cube.jsx'

// Racine de la scène : caméra, lumières, contrôles, transitions entre faces
// TODO : animations de transition
export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} />
      <Cube />
      <OrbitControls />
    </>
  )
}
