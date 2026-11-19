import { Canvas } from '@react-three/fiber'
import { SettingsProvider } from '../../context/SettingsContext'
import Scene from '../3d/Scene'
import FaceNav from './FaceNav'
import ToolPanel from './ToolPanel'

// Structure commune à toutes les faces : la scène 3D, la barre de navigation et le panneau.
// Déclaré une seule fois comme « route layout » dans App : il n'est pas recréé quand on change
// de face (le cube garde sa position), seul le contenu du panneau change.
export default function Layout() {
  return (
    <SettingsProvider>
      <div className="app">
        {/* Caméra un peu de biais (à droite et au-dessus) : la face active reste la plus visible,
            et on voit aussi les faces de droite et du dessus, qu'on peut cliquer (EI-06) */}
        <Canvas camera={{ position: [3, 2.5, 6], fov: 45 }}>
          <Scene />
        </Canvas>
        <FaceNav />
        <ToolPanel />
      </div>
    </SettingsProvider>
  )
}
