import { Canvas } from '@react-three/fiber'
import Scene from './components/3d/Scene'
import FaceNav from './components/ui/FaceNav'

// Layout principal : scène 3D + UI globale superposée
// TODO : UI globale
export default function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
        <Scene />
      </Canvas>
      <FaceNav />
    </div>
  )
}
