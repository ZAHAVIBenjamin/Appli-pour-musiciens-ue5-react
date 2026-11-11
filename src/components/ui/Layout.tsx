import { Canvas } from '@react-three/fiber'
import Scene from '../3d/Scene'
import FaceNav from './FaceNav'
import ToolPanel from './ToolPanel'

// Structure commune à toutes les faces : la scène 3D, la barre de navigation et le panneau.
// Déclaré une seule fois comme « route layout » dans App : il n'est pas recréé quand on change
// de face (le cube garde sa position), seul le contenu du panneau change.
export default function Layout() {
  return (
    <div className="app">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <Scene />
      </Canvas>
      <FaceNav />
      <ToolPanel />
    </div>
  )
}
